/* =====================================================================
   EasyWorkTools.online - bitmap to SVG tracer (browser, no dependency)

   run(rgba, w, h, opts) -> {svg, colors, paths, nodes, bytes, width, height}

   Method (colour tracing, not an embedded picture):
     1. Reduce the image to N colours with a median-cut palette.
     2. Order the colours from largest area to smallest and build "stacked"
        layers: layer i contains every pixel whose colour ranks i or later.
        Drawn bottom to top, each pixel ends up in its own colour and there
        are no hairline gaps between neighbouring shapes.
     3. Trace the outline of every layer on the pixel-corner grid (exact
        boundaries, holes handled with the even-odd rule).
     4. Remove specks smaller than a minimum area, round the stair-steps
        with limited-length corner cutting, simplify with Douglas-Peucker and
        write each layer as one <path>.
   Pixels with alpha below 128 stay transparent. Best for logos, icons,
   flat artwork and scans; photographs produce very large SVGs.

   Original code written for this site; no third-party code.
   ===================================================================== */
(function (global) {
  'use strict';
  var EWT = global.EWT = global.EWT || {};

  /* ---------------- palette: median cut over a 5-bit-per-channel histogram ---------------- */
  function buildPalette(rgba, n, maxColors) {
    var cnt = new Uint32Array(32768), sr = new Float64Array(32768), sg = new Float64Array(32768), sb = new Float64Array(32768);
    for (var i = 0; i < n; i++) {
      var o = i * 4; if (rgba[o + 3] < 128) continue;
      var k = ((rgba[o] >> 3) << 10) | ((rgba[o + 1] >> 3) << 5) | (rgba[o + 2] >> 3);
      cnt[k]++; sr[k] += rgba[o]; sg[k] += rgba[o + 1]; sb[k] += rgba[o + 2];
    }
    var bins = [];
    for (var b = 0; b < 32768; b++) if (cnt[b]) bins.push(b);
    if (!bins.length) return [];
    function ch(b, c) { return c === 0 ? (b >> 10) & 31 : (c === 1 ? (b >> 5) & 31 : b & 31); }
    var boxes = [bins];
    function range(box) {
      var mn = [31, 31, 31], mx = [0, 0, 0];
      for (var j = 0; j < box.length; j++) for (var c = 0; c < 3; c++) { var v = ch(box[j], c); if (v < mn[c]) mn[c] = v; if (v > mx[c]) mx[c] = v; }
      var best = 0, br = -1; for (var c2 = 0; c2 < 3; c2++) if (mx[c2] - mn[c2] > br) { br = mx[c2] - mn[c2]; best = c2; }
      return { ch: best, size: br };
    }
    while (boxes.length < maxColors) {
      var bi = -1, bs = 0, bch = 0;
      for (var q = 0; q < boxes.length; q++) {
        if (boxes[q].length < 2) continue;
        var r = range(boxes[q]);
        var weight = r.size * Math.sqrt(boxes[q].reduce(function (a, v) { return a + cnt[v]; }, 0));
        if (r.size > 0 && weight > bs) { bs = weight; bi = q; bch = r.ch; }
      }
      if (bi < 0) break;
      var box = boxes[bi].slice().sort(function (a, b2) { return ch(a, bch) - ch(b2, bch); });
      var total = 0; for (var t = 0; t < box.length; t++) total += cnt[box[t]];
      var acc = 0, cut = 1;
      for (var t2 = 0; t2 < box.length - 1; t2++) { acc += cnt[box[t2]]; if (acc >= total / 2) { cut = t2 + 1; break; } cut = t2 + 1; }
      boxes.splice(bi, 1, box.slice(0, cut), box.slice(cut));
    }
    return boxes.map(function (box) {
      var c = 0, r = 0, g = 0, bl = 0;
      for (var j = 0; j < box.length; j++) { c += cnt[box[j]]; r += sr[box[j]]; g += sg[box[j]]; bl += sb[box[j]]; }
      return [Math.round(r / c), Math.round(g / c), Math.round(bl / c)];
    });
  }

  function hex(c) { return '#' + [c[0], c[1], c[2]].map(function (v) { return (v < 16 ? '0' : '') + v.toString(16); }).join(''); }

  /* ---------------- outline tracing on the pixel-corner grid ---------------- */
  var DX = [1, 0, -1, 0], DY = [0, 1, 0, -1];
  function traceMask(mask, w, h, minArea) {
    var W1 = w + 1, edges = new Uint8Array(W1 * (h + 1)), x, y;
    for (y = 0; y < h; y++) for (x = 0; x < w; x++) {
      if (!mask[y * w + x]) continue;
      if (y === 0 || !mask[(y - 1) * w + x]) edges[y * W1 + x] |= 1;
      if (x === w - 1 || !mask[y * w + x + 1]) edges[y * W1 + x + 1] |= 2;
      if (y === h - 1 || !mask[(y + 1) * w + x]) edges[(y + 1) * W1 + x + 1] |= 4;
      if (x === 0 || !mask[y * w + x - 1]) edges[(y + 1) * W1 + x] |= 8;
    }
    var loops = [];
    for (var v = 0; v < edges.length; v++) {
      while (edges[v]) {
        var d = 0; while (!(edges[v] & (1 << d))) d++;
        var cx = v % W1, cy = (v / W1) | 0, pts = [], lastDir = -1, sx = cx, sy = cy, startDir = d;
        for (;;) {
          edges[cy * W1 + cx] &= ~(1 << d);
          if (d !== lastDir) pts.push(cx, cy);
          lastDir = d;
          cx += DX[d]; cy += DY[d];
          var m = edges[cy * W1 + cx], nd;
          if (m & (1 << ((d + 1) & 3))) nd = (d + 1) & 3;
          else if (m & (1 << d)) nd = d;
          else if (m & (1 << ((d + 3) & 3))) nd = (d + 3) & 3;
          else break;
          d = nd;
          if (cx === sx && cy === sy && d === startDir) break;
        }
        // the first recorded point may sit in the middle of a straight run: harmless.
        var area = 0, np = pts.length / 2;
        for (var i = 0; i < np; i++) { var j = (i + 1) % np; area += pts[2 * i] * pts[2 * j + 1] - pts[2 * j] * pts[2 * i + 1]; }
        area /= 2;
        if (Math.abs(area) >= minArea) loops.push({ pts: pts, area: area });
      }
    }
    return loops;
  }

  /* ---------------- smoothing and simplification ---------------- */
  function cornerCut(pts, maxCut) {
    var n = pts.length / 2, out = [];
    for (var i = 0; i < n; i++) {
      var p0 = (i + n - 1) % n, p1 = i, p2 = (i + 1) % n;
      var ax = pts[2 * p0], ay = pts[2 * p0 + 1], bx = pts[2 * p1], by = pts[2 * p1 + 1], cx = pts[2 * p2], cy = pts[2 * p2 + 1];
      var l1 = Math.hypot(bx - ax, by - ay), l2 = Math.hypot(cx - bx, cy - by);
      var c1 = Math.min(l1 / 4, maxCut) / (l1 || 1), c2 = Math.min(l2 / 4, maxCut) / (l2 || 1);
      out.push(bx + (ax - bx) * c1, by + (ay - by) * c1, bx + (cx - bx) * c2, by + (cy - by) * c2);
    }
    return out;
  }
  function dp(pts, lo, hi, eps, keep) {
    var ax = pts[2 * lo], ay = pts[2 * lo + 1], bx = pts[2 * hi], by = pts[2 * hi + 1];
    var dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy), best = -1, bd = eps;
    for (var i = lo + 1; i < hi; i++) {
      var d = len ? Math.abs(dy * (pts[2 * i] - ax) - dx * (pts[2 * i + 1] - ay)) / len : Math.hypot(pts[2 * i] - ax, pts[2 * i + 1] - ay);
      if (d > bd) { bd = d; best = i; }
    }
    if (best >= 0) { keep[best] = 1; dp(pts, lo, best, eps, keep); dp(pts, best, hi, eps, keep); }
  }
  function simplifyLoop(pts, eps) {
    var n = pts.length / 2; if (n <= 4) return pts;
    // split the ring at the point farthest from point 0 so Douglas-Peucker has stable anchors
    var far = 0, fd = -1; for (var i = 1; i < n; i++) { var d = Math.hypot(pts[2 * i] - pts[0], pts[2 * i + 1] - pts[1]); if (d > fd) { fd = d; far = i; } }
    var keep = new Uint8Array(n); keep[0] = 1; keep[far] = 1;
    var a = [], b = [];
    for (var j = 0; j <= far; j++) a.push(pts[2 * j], pts[2 * j + 1]);
    for (var k = far; k <= n; k++) b.push(pts[2 * (k % n)], pts[2 * (k % n) + 1]);
    var ka = new Uint8Array(a.length / 2), kb = new Uint8Array(b.length / 2);
    dp(a, 0, a.length / 2 - 1, eps, ka); dp(b, 0, b.length / 2 - 1, eps, kb);
    var out = [];
    for (var m = 0; m < a.length / 2 - 1; m++) if (m === 0 || ka[m]) out.push(a[2 * m], a[2 * m + 1]);
    for (var m2 = 0; m2 < b.length / 2 - 1; m2++) if (m2 === 0 || kb[m2]) out.push(b[2 * m2], b[2 * m2 + 1]);
    return out;
  }
  function fmt(v, dec) { var s = v.toFixed(dec); if (s.indexOf('.') >= 0) s = s.replace(/0+$/, '').replace(/\.$/, ''); return s === '-0' ? '0' : s; }

  function loopToPath(pts, opts) {
    var n = pts.length / 2, dec = opts.decimals, d = '';
    if (n < 3) return { d: '', nodes: 0 };
    if (!opts.curves) {
      d = 'M' + fmt(pts[0], dec) + ' ' + fmt(pts[1], dec);
      for (var i = 1; i < n; i++) d += 'L' + fmt(pts[2 * i], dec) + ' ' + fmt(pts[2 * i + 1], dec);
      return { d: d + 'Z', nodes: n };
    }
    // smooth: quadratic curves through edge midpoints, sharp corners stay sharp
    function mid(i, j) { return [(pts[2 * i] + pts[2 * j]) / 2, (pts[2 * i + 1] + pts[2 * j + 1]) / 2]; }
    function sharp(i) {
      var p = (i + n - 1) % n, q = (i + 1) % n;
      var ux = pts[2 * i] - pts[2 * p], uy = pts[2 * i + 1] - pts[2 * p + 1], vx = pts[2 * q] - pts[2 * i], vy = pts[2 * q + 1] - pts[2 * i + 1];
      var lu = Math.hypot(ux, uy), lv = Math.hypot(vx, vy); if (!lu || !lv) return false;
      return (ux * vx + uy * vy) / (lu * lv) < 0.5;      // turn of more than 60 degrees
    }
    var m0 = mid(n - 1, 0);
    d = 'M' + fmt(m0[0], dec) + ' ' + fmt(m0[1], dec);
    for (var k = 0; k < n; k++) {
      var m = mid(k, (k + 1) % n);
      if (sharp(k)) d += 'L' + fmt(pts[2 * k], dec) + ' ' + fmt(pts[2 * k + 1], dec) + 'L' + fmt(m[0], dec) + ' ' + fmt(m[1], dec);
      else d += 'Q' + fmt(pts[2 * k], dec) + ' ' + fmt(pts[2 * k + 1], dec) + ' ' + fmt(m[0], dec) + ' ' + fmt(m[1], dec);
    }
    return { d: d + 'Z', nodes: n * 2 };
  }

  /* ---------------- public ---------------- */
  /* opts: colors 2..32 (default 8), minArea px^2 (default 6), smooth: bool (default true),
           curves: bool (default true), precision: simplify tolerance in px (default 0.6),
           displayWidth/displayHeight: size attributes of the <svg> (default w, h) */
  function run(rgba, w, h, opts) {
    opts = opts || {};
    var n = w * h, ncol = Math.max(2, Math.min(32, opts.colors || 8));
    var minArea = opts.minArea == null ? 6 : opts.minArea;
    var smooth = opts.smooth !== false, eps = opts.precision == null ? 0.6 : opts.precision;
    var pal = buildPalette(rgba, n, ncol);
    var dispW = opts.displayWidth || w, dispH = opts.displayHeight || h;
    var head = '<svg xmlns="http://www.w3.org/2000/svg" width="' + dispW + '" height="' + dispH + '" viewBox="0 0 ' + w + ' ' + h + '">';
    if (!pal.length) return { svg: head + '</svg>', colors: [], paths: 0, nodes: 0, bytes: head.length + 6, width: w, height: h, empty: true };
    // nearest palette entry, cached per 15-bit colour
    var lut = new Int16Array(32768).fill(-1), idx = new Int16Array(n), counts = new Uint32Array(pal.length);
    for (var i = 0; i < n; i++) {
      var o = i * 4;
      if (rgba[o + 3] < 128) { idx[i] = -1; continue; }
      var key = ((rgba[o] >> 3) << 10) | ((rgba[o + 1] >> 3) << 5) | (rgba[o + 2] >> 3), p = lut[key];
      if (p < 0) {
        var br = (key >> 10 << 3) | 4, bg = ((key >> 5) & 31) << 3 | 4, bb = (key & 31) << 3 | 4, bd = Infinity;
        for (var c = 0; c < pal.length; c++) { var dr = pal[c][0] - br, dg = pal[c][1] - bg, db = pal[c][2] - bb, dd = dr * dr + dg * dg + db * db; if (dd < bd) { bd = dd; p = c; } }
        lut[key] = p;
      }
      idx[i] = p; counts[p]++;
    }
    var order = []; for (var c2 = 0; c2 < pal.length; c2++) if (counts[c2]) order.push(c2);
    order.sort(function (a, b) { return counts[b] - counts[a]; });
    var rank = new Int16Array(pal.length).fill(-1); order.forEach(function (c3, r) { rank[c3] = r; });
    var rk = new Int16Array(n); for (var q = 0; q < n; q++) rk[q] = idx[q] < 0 ? -1 : rank[idx[q]];
    var svg = head, paths = 0, nodes = 0, colors = [];
    var pOpts = { decimals: eps >= 1 ? 1 : 2, curves: smooth && opts.curves !== false };
    var mask = new Uint8Array(n);
    for (var L = 0; L < order.length; L++) {
      var cover = 0;
      for (var m = 0; m < n; m++) { var on = rk[m] >= L ? 1 : 0; mask[m] = on; cover += on; }
      var colour = hex(pal[order[L]]);
      colors.push(colour);
      if (cover === n) { svg += '<rect width="' + w + '" height="' + h + '" fill="' + colour + '"/>'; paths++; nodes += 4; continue; }
      var loops = traceMask(mask, w, h, minArea), d = '';
      for (var li = 0; li < loops.length; li++) {
        var pts = loops[li].pts;
        if (smooth) { pts = cornerCut(pts, 1.5); pts = cornerCut(pts, 1.0); }
        pts = simplifyLoop(pts, eps);
        var lp = loopToPath(pts, pOpts); d += lp.d; nodes += lp.nodes;
      }
      if (d) { svg += '<path fill="' + colour + '" fill-rule="evenodd" d="' + d + '"/>'; paths++; }
    }
    svg += '</svg>';
    return { svg: svg, colors: colors, paths: paths, nodes: nodes, bytes: svg.length, width: w, height: h };
  }

  EWT.trace = { run: run, _traceMask: traceMask, _buildPalette: buildPalette };
})(typeof window !== 'undefined' ? window : globalThis);
