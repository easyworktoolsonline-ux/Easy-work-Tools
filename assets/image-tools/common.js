/* =====================================================================
   EasyWorkTools.online - shared helpers for the image tool pages

   Everything here runs in the visitor's browser. Nothing is uploaded.
   Loaded by the image tools that need file decoding, canvas export or the
   standard drop-zone behaviour. Original code written for this site.
   ===================================================================== */
(function (global) {
  'use strict';
  var EWT = global.EWT = global.EWT || {};

  var MAX_SIDE = 16384, MAX_AREA = 268435456;       // browser canvas limits (Chromium/Firefox/Safari desktop)

  function $(id) { return document.getElementById(id); }
  function fmtBytes(n) {
    if (!n && n !== 0) return '—';
    if (n < 1024) return n + ' B';
    if (n < 1048576) return (n / 1024).toFixed(1) + ' KB';
    return (n / 1048576).toFixed(2) + ' MB';
  }
  function baseName(name) { return String(name || 'image').replace(/\.[^.\/\\]+$/, '').replace(/[^\w\-. ()]+/g, '_') || 'image'; }
  function ext(name) { var m = /\.([^.\/\\]+)$/.exec(name || ''); return m ? m[1].toLowerCase() : ''; }

  function status(el, msg, type) {
    if (!el) return;
    if (!msg) { el.className = 'status-msg'; el.textContent = ''; return; }
    el.textContent = msg; el.className = 'status-msg show ' + (type || 'info');
  }

  function userError(msg) { var e = new Error(msg); e.userMessage = msg; return e; }
  function msgOf(e) { return (e && (e.userMessage || e.message)) || 'Something went wrong.'; }

  function checkSize(w, h, what) {
    if (!w || !h) throw userError('The image has no size.');
    if (w > MAX_SIDE || h > MAX_SIDE || w * h > MAX_AREA) {
      throw userError((what || 'This image') + ' would be ' + w + ' × ' + h + ' px, which is larger than your browser can process (maximum ' + MAX_SIDE + ' px per side). Use a smaller image.');
    }
  }

  function canvasToBlob(canvas, type, quality) {
    return new Promise(function (resolve, reject) {
      var done = false;
      try {
        canvas.toBlob(function (b) {
          done = true;
          if (!b) return reject(userError('This image is too large for your browser to encode. Try a smaller image.'));
          if (type && b.type !== type) return reject(userError('Your browser cannot encode ' + type.replace('image/', '').toUpperCase() + ' images. Choose another format.'));
          resolve(b);
        }, type, quality);
      } catch (e) { reject(userError('Your browser could not export this image.')); }
    });
  }

  function newCanvas(w, h) {
    checkSize(w, h);
    var c = document.createElement('canvas'); c.width = w; c.height = h;
    return c;
  }

  /* Decode any image the browser can display into a canvas. */
  function decodeImage(file) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file), img = new Image();
      img.onload = function () {
        try {
          var w = img.naturalWidth, h = img.naturalHeight;
          if (!w || !h) {   // SVG without intrinsic size
            w = 1024; h = 1024;
          }
          var c = newCanvas(w, h), g = c.getContext('2d');
          g.drawImage(img, 0, 0, w, h);
          URL.revokeObjectURL(url);
          resolve({ canvas: c, width: w, height: h, image: img });
        } catch (e) { URL.revokeObjectURL(url); reject(e); }
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(userError('"' + file.name + '" could not be read as an image. It may be damaged or in a format this browser cannot display.')); };
      img.src = url;
    });
  }

  function flatten(canvas, color) {
    var c = newCanvas(canvas.width, canvas.height), g = c.getContext('2d');
    g.fillStyle = color || '#ffffff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(canvas, 0, 0);
    return c;
  }
  function getPixels(canvas) { return canvas.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, canvas.width, canvas.height); }
  function putPixels(rgba, w, h) {
    var c = newCanvas(w, h);
    c.getContext('2d').putImageData(new ImageData(rgba instanceof Uint8ClampedArray ? rgba : new Uint8ClampedArray(rgba.buffer, rgba.byteOffset, rgba.length), w, h), 0, 0);
    return c;
  }
  function hasAlpha(rgba) { for (var i = 3; i < rgba.length; i += 4) if (rgba[i] !== 255) return true; return false; }

  var lastUrl = null;
  function download(blob, filename) {
    var a = document.createElement('a'), url = URL.createObjectURL(blob);
    a.href = url; a.download = filename; a.rel = 'noopener'; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 4000);
  }

  function readBytes(file) {
    return new Promise(function (resolve, reject) {
      var r = new FileReader();
      r.onload = function () { resolve(new Uint8Array(r.result)); };
      r.onerror = function () { reject(userError('"' + file.name + '" could not be read.')); };
      r.readAsArrayBuffer(file);
    });
  }

  /* Standard drop zone: click, keyboard, drag and drop and the hidden file input. */
  function setupDrop(opts) {
    var dz = opts.dropzone, input = opts.input;
    dz.addEventListener('click', function () { input.click(); });
    dz.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); } });
    ['dragenter', 'dragover'].forEach(function (ev) { dz.addEventListener(ev, function (e) { e.preventDefault(); dz.classList.add('is-drag'); }); });
    ['dragleave', 'drop'].forEach(function (ev) { dz.addEventListener(ev, function (e) { e.preventDefault(); dz.classList.remove('is-drag'); }); });
    dz.addEventListener('drop', function (e) {
      var fl = Array.prototype.slice.call(e.dataTransfer.files || []);
      if (fl.length) opts.onFiles(opts.multiple ? fl : [fl[0]]);
    });
    input.addEventListener('change', function () {
      var fl = Array.prototype.slice.call(input.files || []);
      input.value = '';
      if (fl.length) opts.onFiles(opts.multiple ? fl : [fl[0]]);
    });
  }

  /* Debounce helper for slider-driven re-rendering. */
  function debounce(fn, ms) { var t; return function () { var a = arguments, s = this; clearTimeout(t); t = setTimeout(function () { fn.apply(s, a); }, ms); }; }

  /* Lazy script loader (same-origin files only). */
  var loaded = {};
  function loadScript(src) {
    if (loaded[src]) return loaded[src];
    loaded[src] = new Promise(function (resolve, reject) {
      var s = document.createElement('script'); s.src = src; s.onload = resolve;
      s.onerror = function () { delete loaded[src]; reject(userError('A required component failed to load. Check your connection and try again.')); };
      document.head.appendChild(s);
    });
    return loaded[src];
  }

  EWT.$ = $; EWT.fmtBytes = fmtBytes; EWT.baseName = baseName; EWT.ext = ext; EWT.status = status;
  EWT.userError = userError; EWT.msgOf = msgOf; EWT.checkSize = checkSize; EWT.canvasToBlob = canvasToBlob;
  EWT.newCanvas = newCanvas; EWT.decodeImage = decodeImage; EWT.flatten = flatten; EWT.getPixels = getPixels;
  EWT.putPixels = putPixels; EWT.hasAlpha = hasAlpha; EWT.download = download; EWT.readBytes = readBytes;
  EWT.setupDrop = setupDrop; EWT.debounce = debounce; EWT.loadScript = loadScript;
  EWT.MAX_SIDE = MAX_SIDE;
})(typeof window !== 'undefined' ? window : globalThis);
