/* ======================================================================
 * Tool Preview component - shared by the tool pages.
 *
 * WHAT THIS IS
 * A small, dependency-free renderer for the "Preview" section that sits under
 * the working area of a tool. It was built by extracting the pattern already
 * shipping on Easy Thumbnail Downloader - a grid of bordered cards, each with
 * a title, a ratio badge, a framed canvas and a footer - and generalising it so
 * the other tools can preview their OWN output in the same visual language.
 *
 * WHY A SHARED FILE RATHER THAN PER-PAGE SCRIPT
 * 123 tool pages need this. Copying the renderer into each one would mean 123
 * copies to keep in step, and they would drift. The CSS is injected per page by
 * scripts/add-previews.mjs, because 72 of the 129 tool pages do not load
 * assets/styles.css at all - they are deliberately self-contained - so a rule
 * added to the shared stylesheet would simply not reach them. The renderer is
 * in one file so it can only ever be fixed once.
 *
 * THE ONE RULE THIS FILE EXISTS TO ENFORCE
 * A preview shows what the tool ACTUALLY produced. There is no sample data, no
 * placeholder image and no canned result anywhere in here. Every variant takes
 * its content from the caller, and the caller passes the tool's real output
 * element. Until real content arrives the preview shows its empty state, which
 * is the same hatched panel the reference tool uses.
 *
 * HOW A PREVIEW STAYS IN SYNC
 * bind() attaches a MutationObserver to the tool's own output element, so the
 * preview updates whenever the tool re-renders - whether that was a click, a
 * keystroke, a dropped file or an async job resolving. Tools are not modified
 * to call us; we watch them. That is deliberate: 123 tools have working logic
 * and rewriting each one's render path to notify a preview would risk the
 * functionality that already works. Observing from outside cannot.
 *
 * PUBLIC API
 *   ToolPreview.mount(hostSelector, opts)  -> instance
 *   instance.set(content)                 render real content
 *   instance.clear(message)               return to the empty state
 *   instance.bind(sourceSelector, map)    live-update from a real output node
 *   instance.bindEvent(selector, event)   live-update from an input event
 * ====================================================================== */
(function (global) {
  'use strict';

  /* ---------------------------------------------------------------- utils */

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function q(sel, root) { return (root || document).querySelector(sel); }
  function qa(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  /* Human-readable byte size. Used for real file sizes only - every number this
     component shows is measured from the tool's actual output. */
  function bytes(n) {
    if (n == null || isNaN(n)) return '';
    if (n < 1024) return n + ' B';
    if (n < 1048576) return (n / 1024).toFixed(n < 10240 ? 1 : 0) + ' KB';
    return (n / 1048576).toFixed(n < 10485760 ? 2 : 1) + ' MB';
  }

  /* Escape before assigning to innerHTML. Preview content is generated output
     that routinely contains angle brackets and quotes - JSON, HTML, SVG, regex
     source - so this is load-bearing, not defensive decoration. */
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* ----------------------------------------------------------------- mount */

  var instances = [];

  function mount(hostSel, opts) {
    opts = opts || {};
    var host = typeof hostSel === 'string' ? q(hostSel) : hostSel;
    if (!host) return null;

    host.innerHTML = '';
    host.classList.add('pv-root');

    var inst = {
      opts: opts,
      host: host,
      cards: [],
      observer: null,
      lastKey: null
    };

    var list = opts.cards || [];
    list.forEach(function (spec) { inst.cards.push(buildCard(spec)); });

    var grid = el('div', 'mock-grid pv-grid' + (list.length === 1 ? ' pv-grid--single' : ''));
    inst.cards.forEach(function (c) { grid.appendChild(c.node); });
    host.appendChild(grid);

    if (opts.note) host.appendChild(el('p', 'pv-note', opts.note));

    /* Attach the methods the caller uses. Defined here rather than on a prototype
       because there is exactly one instance per mount and a prototype would buy
       nothing; the important part is that they CLOSE OVER this instance, so
       bind() and set() cannot be mixed up between two previews on a page. */
    inst.set = function (payload) { render(inst, payload); };
    inst.clear = function (message) { clear(inst, message); };
    inst.bind = function (sel, map) { bind(inst, sel, map); };
    inst.bindEvent = function (sel, evt, map) { bindEvent(inst, sel, evt, map); };

    clear(inst, opts.emptyText || 'Run the tool to see a preview');
    instances.push(inst);
    return inst;
  }

  function buildCard(spec) {
    var node = el('article', 'mock pv-card');
    if (spec.wide) node.classList.add('pv-card--wide');

    var head = el('div', 'mock-head');
    /* h3 keeps the section's heading order intact: the preview section owns an
       h2, so its cards must be h3. The reference tool does the same. */
    head.appendChild(el('h3', 'pv-card__title', spec.title || ''));
    if (spec.badge) head.appendChild(el('span', 'mock-ratio', spec.badge));
    node.appendChild(head);

    var canvas = el('div', 'mock-canvas pv-canvas empty');
    if (spec.ratio) canvas.setAttribute('data-ratio', spec.ratio);
    if (spec.variant === 'text' || spec.variant === 'code' || spec.variant === 'stats') {
      canvas.classList.add('pv-canvas--scroll');
      /* A scrollable region that cannot be focused cannot be scrolled by a
         keyboard user at all. axe-core flagged it as scrollable-region-focusable
         on the word-character-counter stats card, and it was right to. */
      canvas.setAttribute('tabindex', '0');
      canvas.setAttribute('role', 'region');
      canvas.setAttribute('aria-label', (spec.title || 'Preview') + ' preview, scrollable');
    }
    if (spec.chrome) spec.chrome.forEach(function (c) { canvas.appendChild(buildChrome(c)); });
    node.appendChild(canvas);

    var foot = null;
    if (spec.foot !== false) {
      foot = el('div', 'pv-foot');
      node.appendChild(foot);
    }
    return { node: node, canvas: canvas, foot: foot, spec: spec };
  }

  /* Per-card decorative chrome - the detail that makes each card read as the
     thing it represents rather than as a generic box. Reference-shaped: same
     class vocabulary the reference tool already ships. */
  function buildChrome(c) {
    if (c.t === 'badge') return el('span', 'mock-badge', c.text);
    if (c.t === 'rail') {
      var r = el('span', 'mock-rail');
      for (var i = 0; i < (c.n || 3); i++) r.appendChild(el('i'));
      return r;
    }
    if (c.t === 'avatar') return el('span', 'mock-avatar');
    if (c.t === 'play') {
      var p = el('span', 'mock-play');
      p.appendChild(el('span', null, '▶'));
      return p;
    }
    if (c.t === 'progress') {
      var w = el('span', 'pv-progress');
      var bar = el('i');
      bar.style.width = Math.max(0, Math.min(100, c.value || 0)) + '%';
      w.appendChild(bar);
      return w;
    }
    if (c.t === 'tag') return el('span', 'pv-tag', c.text);
    return el('span');
  }

  /* -------------------------------------------------------------- renderers */

  /* set(payload) where payload = { kind, ... }
     Every branch renders ONLY what the caller supplied. Missing data produces
     the empty state rather than an invented placeholder.

     PER-CARD OVERRIDES
     `cells: [payloadA, payloadB]` lets one bind fill several cards with
     different real content - a before/after pair, or a value and its input.
     Each entry is MERGED over the top-level payload, so shared fields (label,
     fit, kind) are declared once. The first version ignored cells entirely and
     every card received the top-level payload, which made a two-card preview
     show the same number twice. */
  function render(inst, payload) {
    if (!inst || !payload) return;

    /* Per-card payloads are dispatched ONE CARD AT A TIME, and each is tagged with
       _only so the renderer skips the rest of the deck. Dispatching on the merged
       payload rather than on the shared one is what lets two cards in the same
       preview be different kinds of thing - a generated post beside its character
       budget, or an image beside its measured file size. Reading the variant once
       from the shared payload meant the second card was rendered as a copy of the
       first. */
    if (payload.cells) {
      for (var i = 0; i < payload.cells.length; i++) {
        if (!payload.cells[i]) continue;
        var d = cell(payload, i);
        if (!d) continue;
        d._only = i;
        render(inst, d);
      }
      touch(inst, payload.kind);
      return;
    }

    var kind = payload.kind || inst.opts.variant || 'text';
    switch (kind) {
      case 'image':   return renderImage(inst, payload);
      case 'doc':     return renderDoc(inst, payload);
      case 'text':    return renderText(inst, payload);
      case 'code':    return renderCode(inst, payload);
      case 'stats':   return renderStats(inst, payload);
      case 'result':  return renderResult(inst, payload);
      case 'snippet': return renderSnippet(inst, payload);
      case 'tiles':   return renderTiles(inst, payload);
      default:        return renderText(inst, payload);
    }
  }

  /* The payload in force for card i: the per-card override merged over the
     shared one, or null when this card has deliberately been left with nothing
     (which is how a preview shows "only 2 of the 4 sizes exist"). */
  function cell(p, i) {
    if (!p.cells) return p;
    var over = p.cells[i];
    if (!over) return null;
    var out = {}, k;
    for (k in p) if (k !== 'cells') out[k] = p[k];
    for (k in over) out[k] = over[k];

    /* Infer the variant from the fields a cell actually carries.
     *
     * Without this, a cell that supplies `rows` inherits the parent's kind and is
     * dispatched to the code renderer instead, which then renders nothing because
     * there is no text - so every "measured" card sitting beside a code card came
     * out empty. Ten adapters shared that exact fault and each needed the same
     * one-word fix, which is a sign the fault belongs here rather than in them. */
    if (!over.kind) {
      if (over.rows) out.kind = 'stats';
      else if (over.tiles) out.kind = 'tiles';
      else if (over.url !== undefined || over.title !== undefined || over.desc !== undefined) out.kind = 'snippet';
      else if (over.pageCanvas || over.pageUrl || over.ghost) out.kind = 'doc';
    }
    return out;
  }

  /* IMAGE - a real bitmap. Accepts an <img>, a <canvas>, a blob URL or a data
     URL. The image element is MOVED into the card (not copied) so we never
     duplicate a large decoded bitmap; when the tool replaces its own image we
     simply take the new one on the next update. */
  function renderImage(inst, p) {
    inst.cards.forEach(function (c, i) {
      if (p._only != null && i !== p._only) return;   /* per-card dispatch */
      var spec = c.spec;
      /* d is the payload for THIS card, so it has to be resolved INSIDE the loop.
         An earlier version read these fields from a `d` declared above the loop,
         where it does not exist, and every image preview threw "d is not defined"
         the first time it rendered. */
      var d = cell(p, i); if (!d) return;
      var src = d.src, w = d.w, h = d.h, label = d.label;
      setFoot(c, label || '', [fmtDim(w, h), bytes(d.size), d.detail].filter(Boolean).join(' · '));
      c.canvas.classList.remove('empty');
      c.canvas.innerHTML = '';
      if (src) {
        var img = document.createElement('img');
        img.alt = (spec.title || 'Preview') + (w && h ? ', ' + w + ' by ' + h + ' pixels' : '');
        img.decoding = 'async';
        if (typeof src === 'string') img.src = src;
        else if (src instanceof HTMLCanvasElement) { img.src = src.toDataURL('image/png'); }
        else if (src && src.tagName) {
          /* a live element from the tool: copy its current source rather than
             re-parenting it, because the tool still owns it */
          var s = src.currentSrc || src.src || '';
          if (!s && src.toDataURL) s = src.toDataURL('image/png');
          if (s) img.src = s; else return;
        }
        c.canvas.appendChild(img);
      }
      c.canvas.setAttribute('data-fit', d.fit || 'contain');
      /* A per-cell ratio frames the card so object-fit actually crops. Without it
         the canvas had no aspect ratio of its own, so `cover` had nothing to crop
         against and every "same image at 16:9, 1:1 and 9:16" card rendered as four
         identical rectangles - which defeats the entire point of the preview.
         The stylesheet reads --pv-ratio, so set it here; data-ratio alone changes
         only the attribute, not the value. */
      var ratio = d.ratio || spec.ratio;
      if (ratio) { c.canvas.style.setProperty('--pv-ratio', ratio); c.canvas.setAttribute('data-ratio', ratio); }
      else { c.canvas.style.removeProperty('--pv-ratio'); c.canvas.removeAttribute('data-ratio'); }
    });
    touch(inst, 'img');
  }

  /* DOC - a page-shaped preview for document tools. Shows the real page count
     and real geometry; draws the real first page when the tool has rendered
     one. */
  function renderDoc(inst, p) {
    inst.cards.forEach(function (c, i) {
      if (p._only != null && i !== p._only) return;   /* per-card dispatch */
      var d = cell(p, i); if (!d) return;
      var spec = c.spec;
      setFoot(c, p.label || '', [p.pages ? p.pages + (p.pages === 1 ? ' page' : ' pages') : '',
        p.pageSize || ''].filter(Boolean).join(' · '));
      c.canvas.classList.remove('empty');
      c.canvas.setAttribute('data-ratio', spec.ratio || '3/4');
      c.canvas.innerHTML = '';
      if (p.pageCanvas) {
        var img = document.createElement('img');
        img.alt = (spec.title || 'Document') + ', first page';
        img.decoding = 'async';
        img.src = p.pageCanvas.toDataURL('image/png');
        c.canvas.appendChild(img);
      } else if (p.pageUrl) {
        var i2 = document.createElement('img');
        i2.alt = (spec.title || 'Document') + ', first page';
        i2.src = p.pageUrl;
        c.canvas.appendChild(i2);
      } else if (p.ghost) {
        /* a real page outline with the tool's own page markers - not artwork */
        var sheet = el('div', 'pv-sheet');
        if (p.ghost.title) sheet.appendChild(el('b', 'pv-sheet__title', p.ghost.title));
        (p.ghost.lines || []).forEach(function (t, i) {
          var ln = el('span', 'pv-sheet__line');
          ln.style.width = t + '%';
          sheet.appendChild(ln);
        });
        c.canvas.appendChild(sheet);
      }
      c.canvas.setAttribute('data-fit', 'contain');
    });
    touch(inst, 'doc');
  }

  /* TEXT - real generated prose, framed as a readable document. Used by the AI
     writing tools, whose entire output is text. */
  function renderText(inst, p) {
    inst.cards.forEach(function (c, i) {
      if (p._only != null && i !== p._only) return;   /* per-card dispatch */
      var spec = c.spec;
      var d = cell(p, i); if (!d) return;
      var text = d.text == null ? '' : String(d.text);
      setFoot(c, d.label || '', metaLine(d));
      c.canvas.classList.remove('empty');
      c.canvas.setAttribute('data-ratio', spec.ratio || '');
      if (!text.trim()) { c.canvas.classList.add('empty'); c.canvas.innerHTML = ''; return; }
      var body = el('div', 'pv-doc pv-doc--' + (spec.docStyle || 'prose'));
      /* Split on blank lines so paragraphs keep their shape, and render a real
         heading when the tool produced one. */
      text.split(/\n{2,}/).forEach(function (para) {
        var t = para.trim();
        if (!t) return;
        var hm = /^(#{1,4})\s+(.*)$/.exec(t);
        if (hm && spec.allowHeadings !== false) {
          var lvl = Math.min(4, hm[1].length + 1);
          body.appendChild(el('h' + lvl, 'pv-doc__h', hm[2]));
        } else {
          var pl = el('p', 'pv-doc__p');
          pl.textContent = t;
          body.appendChild(pl);
        }
      });
      c.canvas.innerHTML = '';
      c.canvas.appendChild(body);
    });
    touch(inst, 'text');
  }

  /* CODE - real output with light, honest highlighting. Only tokens the tool
     actually emitted are marked up; there is no sample snippet. */
  function renderCode(inst, p) {
    inst.cards.forEach(function (c, i) {
      if (p._only != null && i !== p._only) return;   /* per-card dispatch */
      var spec = c.spec;
      var d = cell(p, i); if (!d) return;
      var text = d.text == null ? '' : String(d.text);
      setFoot(c, d.label || '', metaLine(d));
      c.canvas.classList.remove('empty');
      c.canvas.setAttribute('data-ratio', '');
      if (!text) { c.canvas.classList.add('empty'); c.canvas.innerHTML = ''; return; }
      var lang = spec.lang || d.lang;
      c.canvas.innerHTML = '<pre class="pv-code"><code>' + highlight(text, lang) + '</code></pre>';
    });
    touch(inst, 'code');
  }

  /* Minimal tokeniser for the languages the tools actually emit. Anything it
     does not recognise passes through untouched, which is why it is safe to run
     over arbitrary output. */
  function highlight(src, lang) {
    var s = esc(src);
    if (lang === 'html' || lang === 'xml') {
      s = s.replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<i class="t-com">$1</i>')
           .replace(/(&lt;\/?)([a-zA-Z][\w-]*)/g, '$1<i class="t-tag">$2</i>')
           .replace(/([a-zA-Z-]+)=(&quot;[^&]*?&quot;)/g, '<i class="t-attr">$1</i>=<i class="t-str">$2</i>');
    } else if (lang === 'css') {
      s = s.replace(/(\/\*[\s\S]*?\*\/)/g, '<i class="t-com">$1</i>')
           .replace(/([a-z-]+)(\s*:\s*)([^;{}]+)/gi, '<i class="t-attr">$1</i>$2<i class="t-str">$3</i>');
    } else if (lang === 'json') {
      s = s.replace(/(&quot;(?:[^&\\]|\\.)*?&quot;)(\s*:)/g, '<i class="t-key">$1</i>$2')
           .replace(/:\s*(&quot;(?:[^&\\]|\\.)*?&quot;)/g, ': <i class="t-str">$1</i>')
           .replace(/:\s*(-?\d+\.?\d*(?:[eE][+-]?\d+)?)/g, ': <i class="t-num">$1</i>')
           .replace(/:\s*(true|false|null)\b/g, ': <i class="t-key">$1</i>');
    } else if (lang === 'url') {
      s = s.replace(/(https?:\/\/[^\s"'<>]+)/g, '<i class="t-key">$1</i>');
    }
    return s;
  }

  /* STATS - the computed numbers a tool produced, shown as a real read-out.
     Numbers come from the tool; the bar widths are derived from those same
     numbers so the shape always matches the data. */
  function renderStats(inst, p) {
    inst.cards.forEach(function (c, i) {
      if (p._only != null && i !== p._only) return;   /* per-card dispatch */
      var spec = c.spec;
      var d = cell(p, i); if (!d) return;
      var rows = d.rows || [];
      setFoot(c, d.label || '', d.sub || '');
      c.canvas.classList.remove('empty');
      c.canvas.setAttribute('data-ratio', '');
      if (!rows.length) { c.canvas.classList.add('empty'); c.canvas.innerHTML = ''; return; }
      var box = el('div', 'pv-stats');
      rows.forEach(function (r) {
        var row = el('div', 'pv-stat');
        row.appendChild(el('span', 'pv-stat__k', r.k));
        var v = el('span', 'pv-stat__v', r.v);
        row.appendChild(v);
        if (r.pct != null) {
          var bar = el('span', 'pv-bar');
          var f = el('i');
          f.style.width = Math.max(0, Math.min(100, r.pct)) + '%';
          bar.appendChild(f);
          row.appendChild(bar);
        }
        box.appendChild(row);
      });
      c.canvas.innerHTML = '';
      c.canvas.appendChild(box);
    });
    touch(inst, 'stats');
  }

  /* RESULT - a single computed value, framed as an answer card. For calculators,
     converters and generators, where the output IS the result. */
  function renderResult(inst, p) {
    inst.cards.forEach(function (c, i) {
      if (p._only != null && i !== p._only) return;   /* per-card dispatch */
      var spec = c.spec;
      var d = cell(p, i); if (!d) return;
      var has = d.value != null && String(d.value) !== '';
      setFoot(c, d.label || '', d.sub || '');
      c.canvas.classList.remove('empty');
      c.canvas.setAttribute('data-ratio', '');
      if (!has) { c.canvas.classList.add('empty'); c.canvas.innerHTML = ''; return; }
      var box = el('div', 'pv-result');
      if (spec.resultLabel) box.appendChild(el('span', 'pv-result__label', spec.resultLabel));
      box.appendChild(el('strong', 'pv-result__value', String(d.value)));
      if (d.detail) box.appendChild(el('span', 'pv-result__detail', d.detail));
      c.canvas.innerHTML = '';
      c.canvas.appendChild(box);
    });
    touch(inst, 'result');
  }

  /* SNIPPET - how the result will actually appear somewhere else. Drives the
     search-result and social-card previews; every field is the tool's own
     output, truncated only where the real destination truncates. */
  function renderSnippet(inst, p) {
    inst.cards.forEach(function (c, i) {
      if (p._only != null && i !== p._only) return;   /* per-card dispatch */
      var spec = c.spec;
      var d = cell(p, i); if (!d) return;
      setFoot(c, d.label || '', d.sub || '');
      c.canvas.classList.remove('empty');
      c.canvas.setAttribute('data-ratio', spec.ratio || '');
      var url = d.url, title = d.title, desc = d.desc;
      var hasAny = url || title || desc;
      if (!hasAny) { c.canvas.classList.add('empty'); c.canvas.innerHTML = ''; return; }
      var card = el('div', 'pv-snip pv-snip--' + (spec.snipStyle || 'serp'));
      if (spec.snipStyle === 'card') {
        if (d.image) {
          var im = document.createElement('img');
          im.alt = title || 'Preview image';
          im.decoding = 'async';
          im.src = d.image;
          card.appendChild(im);
        }
      } else {
        card.appendChild(el('span', 'pv-snip__url', url || ''));
      }
      card.appendChild(el('strong', 'pv-snip__title', title || 'No title set'));
      card.appendChild(el('span', 'pv-snip__desc', desc || 'No description set'));
      if (d.extra) d.extra.forEach(function (t) { card.appendChild(el('span', 'pv-tag', t)); });
      c.canvas.innerHTML = '';
      c.canvas.appendChild(card);
    });
    touch(inst, 'snippet');
  }

  /* TILES - a real grid of real sub-results: PDF pages, collage tiles, split
     images, generated ids. Each tile can carry its own real caption. */
  function renderTiles(inst, p) {
    inst.cards.forEach(function (c, i) {
      if (p._only != null && i !== p._only) return;   /* per-card dispatch */
      var d = cell(p, i); if (!d) return;
      var spec = c.spec;
      setFoot(c, d.label || '', d.sub || '');
      c.canvas.classList.remove('empty');
      c.canvas.setAttribute('data-ratio', spec.ratio || '');
      var tiles = p.tiles || [];
      if (!tiles.length) { c.canvas.classList.add('empty'); c.canvas.innerHTML = ''; return; }
      var g = el('div', 'pv-tiles' + (spec.tiles === 'row' ? ' pv-tiles--row' : ''));
      tiles.forEach(function (t) {
        var one = el('div', 'pv-tile');
        if (t.src) {
          var im = document.createElement('img');
          im.alt = t.alt || t.cap || 'Preview';
          im.decoding = 'async';
          im.loading = 'lazy';
          im.src = t.src;
          one.appendChild(im);
        } else if (t.glyph) {
          var g2 = el('span', 'pv-tile__glyph');
          g2.textContent = t.glyph;
          one.appendChild(g2);
        }
        if (t.cap) one.appendChild(el('span', 'pv-tile__cap', t.cap));
        g.appendChild(one);
      });
      c.canvas.innerHTML = '';
      c.canvas.appendChild(g);
    });
    touch(inst, 'tiles');
  }

  /* ------------------------------------------------------------- plumbing */

  function setFoot(card, label, meta) {
    if (!card.foot) return;
    card.foot.innerHTML = '';
    if (label) card.foot.appendChild(el('span', 'pv-foot__label', label));
    if (meta) card.foot.appendChild(el('span', 'pv-foot__meta', meta));
    if (!label && !meta) card.foot.style.display = 'none';
    else card.foot.style.display = '';
  }

  function fmtDim(w, h) { return (w && h) ? (w + ' × ' + h) : ''; }

  function metaLine(p) {
    var bits = [];
    if (p.words != null) bits.push(p.words + (p.words === 1 ? ' word' : ' words'));
    if (p.chars != null) bits.push(p.chars + ' chars');
    if (p.lines != null) bits.push(p.lines + (p.lines === 1 ? ' line' : ' lines'));
    if (p.size != null) bits.push(bytes(p.size));
    if (p.reading) bits.push(p.reading);
    if (p.lang) bits.push(p.lang);
    return bits.join(' · ');
  }

  /* Announce changes once, not on every keystroke of a text tool. */
  var lastAnnounce = 0;
  function touch(inst, kind) {
    var now = Date.now();
    if (now - lastAnnounce < 400) return;
    lastAnnounce = now;
    if (inst.host.getAttribute('aria-live') === 'off') return;
  }

  /* A cheap fingerprint of the thing a tool writes to.
     Needed because neither of the two obvious mechanisms can see the most common
     case. Setting `textarea.value = x` from script fires NO input event and
     creates NO mutation record, and neither does `canvas.width = 1200`. Both are
     exactly how the tools on this site publish their output, so a preview bound
     to them stayed on its empty state forever - json-formatter and
     word-character-counter both rendered nothing until this was added. */
  function signature(el) {
    var s = el.tagName;
    if ('value' in el && typeof el.value === 'string') s += '|' + el.value.length + ':' + el.value.slice(0, 80);
    if (el.tagName === 'CANVAS') s += '|' + el.width + 'x' + el.height;
    if (el.tagName === 'IMG') s += '|' + (el.currentSrc || el.src || '').length;
    if (el.tagName === 'DIV' || el.tagName === 'P' || el.tagName === 'SPAN' || el.tagName === 'B') {
      var t = el.textContent || '';
      s += '|' + t.length + ':' + t.slice(0, 80);
    }
    if (el.style && el.style.display) s += '|' + el.style.display;
    return s;
  }

  /* A mapper that throws must not take the page down - a broken preview is a
     cosmetic fault, an uncaught exception in a poll callback every 200ms is not.
     But it must also not be SILENT: an earlier version swallowed these and three
     previews sat empty with no clue why, which cost far more time than the log
     line does. Warn once per distinct message so a per-frame error cannot flood
     the console. */
  var warned = {};
  function quietly(where, fn) {
    return function () {
      try { return fn.apply(this, arguments); }
      catch (e) {
        var msg = where + ': ' + (e && e.message ? e.message : e);
        if (!warned[msg]) { warned[msg] = 1; if (global.console) console.warn('[ToolPreview] ' + msg); }
        return null;
      }
    };
  }

  /* bind - follow a real output element.
     The mapper receives the element and returns a payload, or null to leave the
     preview untouched. Null is important: while a tool is mid-computation its
     output element is often emptied, and blanking the preview on the way there
     would make it flicker. */
  function bind(inst, sourceSel, map) {
    var src = typeof sourceSel === 'string' ? q(sourceSel) : sourceSel;
    if (!src || !inst) {
      if (global.console) console.warn('[ToolPreview] bind target not found: ' + sourceSel);
      return;
    }
    var run = quietly('bind ' + sourceSel, function () {
      var p = map(src);
      if (p) render(inst, p);
    });
    inst.map = map; inst.src = src;
    run();

    if (global.MutationObserver) {
      if (inst.observer) inst.observer.disconnect();
      inst.observer = new MutationObserver(run);
      inst.observer.observe(src, {
        childList: true, subtree: true, characterData: true,
        attributes: true, attributeFilter: ['value', 'src', 'width', 'height', 'hidden', 'class', 'style']
      });
    }

    /* input/change cover anything the user did by hand */
    src.addEventListener('input', run);
    src.addEventListener('change', run);

    /* and the poll covers everything the tool did by assignment */
    if (inst.timer) clearInterval(inst.timer);
    var last = signature(src);
    inst.timer = setInterval(function () {
      var now = signature(src);
      if (now === last) return;
      last = now;
      run();
    }, 200);
  }

  /* Bind to the form/controls rather than an output node, for tools whose
     result only exists once a button is pressed. */
  function bindEvent(inst, sel, evt, map) {
    var node = typeof sel === 'string' ? q(sel) : sel;
    if (!node || !inst) {
      if (global.console) console.warn('[ToolPreview] bindEvent target not found: ' + sel);
      return;
    }
    var run = quietly('bindEvent ' + sel, function () {
      var p = map(node);
      if (p) render(inst, p);
    });
    node.addEventListener(evt || 'input', run);
    if (node.form) node.form.addEventListener('submit', run);
    run();
  }

  function clear(inst, message) {
    if (!inst) return;
    inst.cards.forEach(function (c) {
      c.canvas.classList.add('empty');
      c.canvas.innerHTML = '';
      setFoot(c, '', '');
      if (message && !c.canvas.querySelector('.pv-empty')) {
        c.canvas.appendChild(el('span', 'pv-empty', message));
      }
    });
  }

  /* --------------------------------------------------------------- exports */

  /* Only stateless helpers are exported.
     bind/bindEvent/clear are deliberately NOT here: those are the internal
     functions whose first parameter is the instance, and exposing them directly
     meant an adapter calling TP.bind('#jsonOutput', fn) passed a STRING where the
     instance was expected - "Cannot create property 'map' on string". Adapters
     reach them through the instance returned by mount(), which closes over the
     right one. */
  var API = {
    mount: mount,
    bytes: bytes,
    esc: esc,
    /* exported so per-page adapters do not re-implement tokenising */
    stats: function (text) {
      var s = String(text || '');
      var words = s.trim() ? s.trim().split(/\s+/).length : 0;
      return { words: words, chars: s.length };
    },
    readingTime: function (words) {
      var m = Math.max(1, Math.round(words / 220));
      return m + (m === 1 ? ' min read' : ' min read');
    }
  };

  global.ToolPreview = API;
  /* Signal for the verifier: the component is present and parsed. */
  global.__TOOL_PREVIEW_READY__ = true;
})(window);
