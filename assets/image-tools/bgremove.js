/* =====================================================================
   EasyWorkTools.online - colour-based background removal (no AI, no model)

   This is classic image processing: pick a background colour, find the pixels
   close to it, make them transparent. It works well on plain, evenly lit
   backgrounds (studio shots, logos, screenshots, scans) and poorly on busy or
   gradient backgrounds. It does not recognise people or objects.

   EWT.bg.estimate(rgba,w,h)                      -> [r,g,b]  most common border colour
   EWT.bg.mask(rgba,w,h,{color,tol,soft,mode,seed}) -> Uint8Array alpha (0 = background)
        tol  0..100  how far a colour may differ and still count as background
        soft 0..100  width of the soft transition at the edge
        mode 'edge'  only background connected to the picture border (or the seed)
             'all'   every pixel of that colour, including holes inside the subject
   EWT.bg.shrink(mask,w,h,n) / EWT.bg.feather(mask,w,h,r)
   EWT.bg.compose(rgba,w,h,mask,{color,decontaminate}) -> Uint8ClampedArray straight-alpha RGBA

   Original code written for this site.
   ===================================================================== */
(function (global) {
  'use strict';
  var EWT = global.EWT = global.EWT || {};

  function estimate(rgba, w, h) {
    var hist = Object.create(null), best = 0, bestKey = null, step = Math.max(1, Math.floor((w + h) / 400));
    function add(x, y) {
      var i = (y * w + x) * 4; if (rgba[i + 3] < 128) return;
      var k = (rgba[i] >> 4) << 8 | (rgba[i + 1] >> 4) << 4 | (rgba[i + 2] >> 4);
      var e = hist[k] || (hist[k] = { n: 0, r: 0, g: 0, b: 0 }); e.n++; e.r += rgba[i]; e.g += rgba[i + 1]; e.b += rgba[i + 2];
      if (e.n > best) { best = e.n; bestKey = k; }
    }
    var x, y;
    for (x = 0; x < w; x += step) { add(x, 0); add(x, h - 1); }
    for (y = 0; y < h; y += step) { add(0, y); add(w - 1, y); }
    if (bestKey === null) return [255, 255, 255];
    var b = hist[bestKey]; return [Math.round(b.r / b.n), Math.round(b.g / b.n), Math.round(b.b / b.n)];
  }

  function mask(rgba, w, h, o) {
    var c = o.color, tolD = Math.max(0, o.tol) / 100 * 200, softD = Math.max(0.5, (o.soft || 0) / 100 * 100);
    var n = w * h, out = new Uint8Array(n); out.fill(255);
    var lim = tolD + softD, lim2 = lim * lim, tol2 = tolD * tolD;
    function dist2(i) { var dr = rgba[i] - c[0], dg = rgba[i + 1] - c[1], db = rgba[i + 2] - c[2]; return dr * dr + dg * dg + db * db; }
    function alphaFor(d2) { if (d2 <= tol2) return 0; if (d2 >= lim2) return 255; return Math.round((Math.sqrt(d2) - tolD) / softD * 255); }
    var p;
    if (o.mode === 'all') {
      for (p = 0; p < n; p++) { var i = p * 4; if (rgba[i + 3] === 0) { out[p] = 0; continue; } out[p] = alphaFor(dist2(i)); }
      return out;
    }
    /* edge / seed flood fill over candidate pixels (within tol + soft) */
    var seen = new Uint8Array(n), stack = new Int32Array(n), sp = 0;
    function cand(p) { var i = p * 4; return rgba[i + 3] === 0 || dist2(i) < lim2; }
    function push(p) { if (!seen[p] && cand(p)) { seen[p] = 1; stack[sp++] = p; } }
    var x, y;
    if (o.seed) { push(o.seed[1] * w + o.seed[0]); }
    else { for (x = 0; x < w; x++) { push(x); push((h - 1) * w + x); } for (y = 0; y < h; y++) { push(y * w); push(y * w + w - 1); } }
    while (sp) {
      p = stack[--sp]; x = p % w; y = (p - x) / w;
      if (x > 0) push(p - 1); if (x < w - 1) push(p + 1); if (y > 0) push(p - w); if (y < h - 1) push(p + w);
    }
    for (p = 0; p < n; p++) if (seen[p]) { var j = p * 4; out[p] = rgba[j + 3] === 0 ? 0 : alphaFor(dist2(j)); }
    return out;
  }

  function shrink(m, w, h, r) {
    var cur = m;
    for (var it = 0; it < r; it++) {
      var nx = new Uint8Array(cur), x, y;
      for (y = 0; y < h; y++) for (x = 0; x < w; x++) {
        var p = y * w + x, v = cur[p];
        if (x > 0 && cur[p - 1] < v) v = cur[p - 1]; if (x < w - 1 && cur[p + 1] < v) v = cur[p + 1];
        if (y > 0 && cur[p - w] < v) v = cur[p - w]; if (y < h - 1 && cur[p + w] < v) v = cur[p + w];
        nx[p] = v;
      }
      cur = nx;
    }
    return cur;
  }

  function feather(m, w, h, r) {
    if (r < 1) return m;
    var tmp = new Float32Array(w * h), out = new Uint8Array(w * h), x, y, k = 2 * r + 1, s;
    for (y = 0; y < h; y++) {
      s = 0; for (x = -r; x <= r; x++) s += m[y * w + Math.min(w - 1, Math.max(0, x))];
      for (x = 0; x < w; x++) { tmp[y * w + x] = s / k; s += m[y * w + Math.min(w - 1, x + r + 1)] - m[y * w + Math.max(0, x - r)]; }
    }
    for (x = 0; x < w; x++) {
      s = 0; for (y = -r; y <= r; y++) s += tmp[Math.min(h - 1, Math.max(0, y)) * w + x];
      for (y = 0; y < h; y++) { out[y * w + x] = Math.round(s / k); s += tmp[Math.min(h - 1, y + r + 1) * w + x] - tmp[Math.max(0, y - r) * w + x]; }
    }
    return out;
  }

  /* Combine the picture with the mask. With decontaminate on, edge pixels that are a mix of
     subject and background have the background colour taken back out, so a light halo does
     not show on a dark page. */
  function compose(rgba, w, h, m, o) {
    var out = new Uint8ClampedArray(w * h * 4), c = o && o.color, dec = !!(o && o.decontaminate && c);
    for (var p = 0, n = w * h; p < n; p++) {
      var i = p * 4, a = Math.min(rgba[i + 3], m[p]);
      if (a === 0) { out[i] = rgba[i]; out[i + 1] = rgba[i + 1]; out[i + 2] = rgba[i + 2]; out[i + 3] = 0; continue; }
      var r = rgba[i], g = rgba[i + 1], b = rgba[i + 2];
      if (dec && a < 255) { var k = a / 255; r = (r - (1 - k) * c[0]) / k; g = (g - (1 - k) * c[1]) / k; b = (b - (1 - k) * c[2]) / k; }
      out[i] = r; out[i + 1] = g; out[i + 2] = b; out[i + 3] = a;
    }
    return out;
  }

  EWT.bg = { estimate: estimate, mask: mask, shrink: shrink, feather: feather, compose: compose };
})(typeof window !== 'undefined' ? window : globalThis);
