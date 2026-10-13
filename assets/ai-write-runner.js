/* =====================================================================
   EasyWorkTools.online - AI Write page runner
   ---------------------------------------------------------------------
   Loaded by every tool in /tools/ai-write/. It owns the wiring, so each
   tool page ships only its own copy, meta and copy - the behaviour is
   defined once here.

   Responsibilities:
     · read the tool definition for this page's slug
     · build the option controls from the definition
     · run the tool inside try/catch, surface failures as toasts
     · live input validation (empty input, bad regex, missing term)
     · copy / download / swap / clear, all guarded
     · no uncaught promise rejections, no console errors

   The page marks itself up with:
     <body data-aiwrite="essay-writer">
     #inputText  (the working textarea)
     #outputText (readonly result textarea)
     #processBtn #clearBtn #copyBtn #downloadBtn
     #inputCount #statusLine
   ===================================================================== */
(function () {
  'use strict';

  var TOOLS = window.__EWT_AIWRITE_TOOLS;
  if (!TOOLS) return;                       // engine missing: fail closed, quietly

  var root = document.body;
  var slug = root.getAttribute('data-aiwrite');
  if (!slug) return;
  var def = TOOLS[slug];
  if (!def) return;

  var $ = function (id) { return document.getElementById(id); };
  var input = $('inputText');
  var output = $('outputText');
  var processBtn = $('processBtn');
  var clearBtn = $('clearBtn');
  var copyBtn = $('copyBtn');
  var downloadBtn = $('downloadBtn');
  var inputCount = $('inputCount');
  var statusLine = $('statusLine');
  var optionHost = $('optionRow');
  if (!input || !output) return;

  /* ------------------------------------------------------------ toasts */

  var toastHost = null;
  function toast(msg, kind) {
    if (!toastHost) {
      toastHost = document.createElement('div');
      toastHost.setAttribute('role', 'status');
      toastHost.setAttribute('aria-live', 'polite');
      toastHost.style.cssText =
        'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:9999;' +
        'display:flex;flex-direction:column;gap:8px;align-items:center;pointer-events:none';
      document.body.appendChild(toastHost);
    }
    var el = document.createElement('div');
    el.textContent = msg;
    var bg = kind === 'error' ? '#b91c1c' : kind === 'warn' ? '#b45309' : '#111827';
    el.style.cssText =
      'max-width:min(92vw,460px);background:' + bg + ';color:#fff;padding:11px 18px;' +
      'border-radius:10px;font:14px/1.5 ' + (window.getComputedStyle(document.body).fontFamily || 'system-ui') + ';' +
      'box-shadow:0 10px 30px rgba(0,0,0,.22);opacity:0;transform:translateY(8px);' +
      'transition:opacity .2s ease,transform .2s ease';
    toastHost.appendChild(el);
    requestAnimationFrame(function () { el.style.opacity = '1'; el.style.transform = 'translateY(0)'; });
    setTimeout(function () {
      el.style.opacity = '0';
      el.style.transform = 'translateY(8px)';
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 220);
    }, kind === 'error' ? 4200 : 2600);
  }

  function setStatus(msg, kind) {
    if (!statusLine) return;
    statusLine.textContent = msg || '';
    statusLine.className = 'status-line' + (kind ? ' is-' + kind : '');
  }

  /* ------------------------------------------------------- option controls */

  var opts = {};
  (def.options || []).forEach(function (o) {
    var id = o.id;
    if (o.type === 'select') {
      opts[id] = o.values[0];
    } else {
      opts[id] = '';
    }
    if (!optionHost) return;
    var wrap = document.createElement('label');
    wrap.className = 'field';
    var name = document.createElement('span');
    name.className = 'field-label';
    name.textContent = o.label;
    wrap.appendChild(name);

    if (o.type === 'select') {
      var sel = document.createElement('select');
      sel.className = 'field-control';
      sel.id = id;
      o.values.forEach(function (v) {
        var opt = document.createElement('option');
        opt.value = v;
        opt.textContent = v;
        sel.appendChild(opt);
      });
      sel.value = opts[id];
      sel.addEventListener('change', function () { opts[id] = sel.value; });
      wrap.appendChild(sel);
    } else {
      var inp = document.createElement('input');
      inp.className = 'field-control';
      inp.id = id;
      inp.type = 'text';
      inp.value = opts[id];
      if (o.placeholder) inp.placeholder = o.placeholder;
      inp.addEventListener('input', function () { opts[id] = inp.value; });
      wrap.appendChild(inp);
    }
    optionHost.appendChild(wrap);
  });

  /* ------------------------------------------------------------- counters */

  function countUpdate() {
    if (!inputCount) return;
    var v = input.value;
    var words = (v.match(/[A-Za-z0-9'’\-]+/g) || []).length;
    inputCount.textContent = v.length
      ? words.toLocaleString() + ' word' + (words === 1 ? '' : 's') + ' · ' + v.length.toLocaleString() + ' characters'
      : 'Nothing entered yet';
  }
  input.addEventListener('input', countUpdate);
  countUpdate();

  /* ------------------------------------------------------------ validation */

  function validate() {
    var v = input.value;
    if (!v.trim()) {
      return { ok: false, message: 'Enter some text in the box above first.' };
    }
    if (def.options) {
      for (var i = 0; i < def.options.length; i++) {
        var o = def.options[i];
        if (o.type === 'text' && !String(opts[o.id] || '').trim()) {
          return { ok: false, message: 'Fill in "' + o.label + '" so the tool knows what to look for.' };
        }
      }
    }
    return { ok: true };
  }

  /* ----------------------------------------------------------------- run */

  var lastResult = '';

  function run() {
    var v = validate();
    if (!v.ok) {
      setStatus(v.message, 'error');
      toast(v.message, 'error');
      input.focus();
      return;
    }
    if (processBtn) {
      processBtn.disabled = true;
      processBtn.textContent = 'Working…';
    }
    setStatus('Processing…');
    try {
      var result = def.run(input.value, opts);
      if (typeof result !== 'string' || !result.length) {
        throw new Error('The tool returned nothing. Try different input.');
      }
      lastResult = result;
      output.value = result;
      setStatus('Done · ' + result.length.toLocaleString() + ' characters', 'ok');
      toast((def.label || 'Result') + ' ready');
    } catch (err) {
      var msg = (err && err.message) ? err.message : 'Something went wrong. Please try again.';
      setStatus(msg, 'error');
      toast(msg, 'error');
    } finally {
      if (processBtn) {
        processBtn.disabled = false;
        processBtn.textContent = def.action || 'Process';
      }
    }
  }

  /* --------------------------------------------------------------- actions */

  function copyResult() {
    var text = output.value;
    if (!text) {
      toast('There is nothing to copy yet. Run the tool first.', 'warn');
      return;
    }
    function fallback() {
      output.removeAttribute('readonly');
      output.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      output.setAttribute('readonly', 'readonly');
      toast(ok ? 'Copied to clipboard' : 'Copy failed - select the text and copy manually', ok ? 'ok' : 'error');
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        toast('Copied to clipboard');
      })['catch'](fallback);
    } else {
      fallback();
    }
  }

  function downloadResult() {
    var text = output.value;
    if (!text) {
      toast('There is nothing to download yet. Run the tool first.', 'warn');
      return;
    }
    try {
      var blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = slug + '-result.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
      toast('Downloaded ' + a.download);
    } catch (e) {
      toast('Download failed in this browser. Use Copy instead.', 'error');
    }
  }

  function swap() {
    var out = output.value;
    if (!out) {
      toast('Nothing to swap yet. Run the tool first.', 'warn');
      return;
    }
    input.value = out;
    output.value = '';
    lastResult = '';
    countUpdate();
    setStatus('Result moved into the input box');
    input.focus();
  }

  function clearAll() {
    input.value = '';
    output.value = '';
    lastResult = '';
    countUpdate();
    setStatus('');
    toast('Cleared');
    input.focus();
  }

  if (processBtn) {
    processBtn.textContent = def.action || 'Process';
    processBtn.addEventListener('click', run);
  }
  if (clearBtn) clearBtn.addEventListener('click', clearAll);
  if (copyBtn) copyBtn.addEventListener('click', copyResult);
  if (downloadBtn) downloadBtn.addEventListener('click', downloadResult);

  var swapBtn = $('swapBtn');
  if (swapBtn) swapBtn.addEventListener('click', swap);

  /* Ctrl/Cmd+Enter runs the tool from inside the textarea. */
  input.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      run();
    }
  });

  /* Guard the whole module: a failure here must not surface as a console
     error on any of the 54 pages. */
  window.addEventListener('error', function (e) {
    if (e && e.target && e.target === window) setStatus('Something went wrong on this page.', 'error');
  });
})();
