/* =====================================================================
   EasyWorkTools.online - GIF encoder and decoder (browser, no dependency)

   encode(): median-cut colour quantisation to a 256-colour palette, optional
             Floyd-Steinberg dithering, one transparent palette index for
             transparent pixels, variable-width LZW compression.
   decode(): reads every frame of a (possibly animated) GIF, applies the
             frame disposal methods and returns full-canvas RGBA frames with
             their delays, so callers never deal with partial frames.

   Original code written for this site; no third-party code.
   ===================================================================== */
(function (global) {
  'use strict';
  var EWT = global.EWT = global.EWT || {};

  /* ---------------- quantiser (median cut on 15-bit colour histogram) ---------------- */
  function buildPalette(rgba, w, h, maxColors, alphaCut) {
    var hist = new Uint32Array(32768), n = w * h, i;
    for (i = 0; i < n; i++) {
      var o = i * 4;
      if (rgba[o + 3] < alphaCut) continue;
      hist[((rgba[o] >> 3) << 10) | ((rgba[o + 1] >> 3) << 5) | (rgba[o + 2] >> 3)]++;
    }
    var colors = [];
    for (i = 0; i < 32768; i++) if (hist[i]) colors.push(i);
    if (!colors.length) return [[0, 0, 0]];
    function chan(c, k) { return k === 0 ? (c >> 10) & 31 : (k === 1 ? (c >> 5) & 31 : c & 31); }
    var boxes = [{ idx: colors, count: 0 }];
    boxes[0].count = colors.reduce(function (a, c) { return a + hist[c]; }, 0);
    function range(b) {
      var mn = [31, 31, 31], mx = [0, 0, 0];
      for (var j = 0; j < b.idx.length; j++) for (var k = 0; k < 3; k++) {
        var v = chan(b.idx[j], k); if (v < mn[k]) mn[k] = v; if (v > mx[k]) mx[k] = v;
      }
      // green is weighted a little higher because the eye is more sensitive to it
      var r = [(mx[0] - mn[0]) * 1.0, (mx[1] - mn[1]) * 1.2, (mx[2] - mn[2]) * 0.8];
      var best = 0; if (r[1] > r[best]) best = 1; if (r[2] > r[best]) best = 2;
      return { ch: best, size: r[best] };
    }
    while (boxes.length < maxColors) {
      // pick the splittable box with the most pixels weighted by its colour spread
      var pick = -1, score = -1;
      for (i = 0; i < boxes.length; i++) {
        if (boxes[i].idx.length < 2) continue;
        var rg = range(boxes[i]); var sc = boxes[i].count * (1 + rg.size);
        if (sc > score) { score = sc; pick = i; }
      }
      if (pick < 0) break;
      var b = boxes[pick], rr = range(b), ch = rr.ch;
      b.idx.sort(function (a, c) { return chan(a, ch) - chan(c, ch); });
      var half = b.count / 2, acc = 0, cut = 1;
      for (i = 0; i < b.idx.length - 1; i++) { acc += hist[b.idx[i]]; cut = i + 1; if (acc >= half) break; }
      var a1 = b.idx.slice(0, cut), a2 = b.idx.slice(cut);
      var c1 = a1.reduce(function (s, c) { return s + hist[c]; }, 0);
      boxes.splice(pick, 1, { idx: a1, count: c1 }, { idx: a2, count: b.count - c1 });
    }
    return boxes.map(function (bx) {
      var r = 0, g = 0, bl = 0, t = 0;
      for (var j = 0; j < bx.idx.length; j++) {
        var c = bx.idx[j], cn = hist[c];
        r += ((c >> 10) & 31) * cn; g += ((c >> 5) & 31) * cn; bl += (c & 31) * cn; t += cn;
      }
      return [Math.round((r / t) * 8 + 4 > 255 ? 255 : (r / t) * 8 + 4), Math.round((g / t) * 8 + 4 > 255 ? 255 : (g / t) * 8 + 4), Math.round((bl / t) * 8 + 4 > 255 ? 255 : (bl / t) * 8 + 4)];
    });
  }

  function mapPixels(rgba, w, h, pal, transIdx, alphaCut, dither) {
    var out = new Uint8Array(w * h), cache = new Int16Array(32768).fill(-1);
    var np = pal.length;
    function nearest(r, g, b) {
      var best = 0, bd = 1e12;
      for (var i = 0; i < np; i++) {
        var dr = r - pal[i][0], dg = g - pal[i][1], db = b - pal[i][2];
        var d = dr * dr * 0.30 + dg * dg * 0.59 + db * db * 0.11;
        if (d < bd) { bd = d; best = i; if (d === 0) break; }
      }
      return best;
    }
    function lookup(r, g, b) {
      var key = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);
      var c = cache[key]; if (c >= 0) return c;
      c = nearest(r, g, b); cache[key] = c; return c;
    }
    if (!dither) {
      for (var i = 0, o = 0; i < w * h; i++, o += 4) {
        out[i] = rgba[o + 3] < alphaCut ? transIdx : lookup(rgba[o], rgba[o + 1], rgba[o + 2]);
      }
      return out;
    }
    // Floyd-Steinberg with error rows
    var e0 = new Float32Array((w + 2) * 3), e1 = new Float32Array((w + 2) * 3);
    for (var y = 0; y < h; y++) {
      e1.fill(0);
      for (var x = 0; x < w; x++) {
        var o2 = (y * w + x) * 4, p = y * w + x;
        if (rgba[o2 + 3] < alphaCut) { out[p] = transIdx; continue; }
        var r = rgba[o2] + e0[(x + 1) * 3], g = rgba[o2 + 1] + e0[(x + 1) * 3 + 1], b = rgba[o2 + 2] + e0[(x + 1) * 3 + 2];
        r = r < 0 ? 0 : (r > 255 ? 255 : r); g = g < 0 ? 0 : (g > 255 ? 255 : g); b = b < 0 ? 0 : (b > 255 ? 255 : b);
        var k = nearest(Math.round(r), Math.round(g), Math.round(b));
        out[p] = k;
        var er = r - pal[k][0], eg = g - pal[k][1], eb = b - pal[k][2];
        e0[(x + 2) * 3] += er * 7 / 16; e0[(x + 2) * 3 + 1] += eg * 7 / 16; e0[(x + 2) * 3 + 2] += eb * 7 / 16;
        e1[x * 3] += er * 3 / 16; e1[x * 3 + 1] += eg * 3 / 16; e1[x * 3 + 2] += eb * 3 / 16;
        e1[(x + 1) * 3] += er * 5 / 16; e1[(x + 1) * 3 + 1] += eg * 5 / 16; e1[(x + 1) * 3 + 2] += eb * 5 / 16;
        e1[(x + 2) * 3] += er / 16; e1[(x + 2) * 3 + 1] += eg / 16; e1[(x + 2) * 3 + 2] += eb / 16;
      }
      var t = e0; e0 = e1; e1 = t;
    }
    return out;
  }

  /* ---------------- LZW (GIF flavour, LSB-first) ---------------- */
  function lzwEncode(indices, minCode) {
    var clear = 1 << minCode, eoi = clear + 1, next = eoi + 1, size = minCode + 1;
    var out = [], cur = 0, curBits = 0;
    function emit(code) {
      cur |= code << curBits; curBits += size;
      while (curBits >= 8) { out.push(cur & 255); cur >>>= 8; curBits -= 8; }
    }
    var dict = new Map();
    emit(clear);
    var prefix = indices[0];
    for (var i = 1; i < indices.length; i++) {
      var sym = indices[i], key = prefix * 256 + sym, code = dict.get(key);
      if (code !== undefined) { prefix = code; continue; }
      emit(prefix);
      if (next < 4096) {
        dict.set(key, next++);
        if (next > (1 << size) && size < 12) size++;
      } else {
        emit(clear); dict.clear(); next = eoi + 1; size = minCode + 1;
      }
      prefix = sym;
    }
    emit(prefix); emit(eoi);
    if (curBits > 0) out.push(cur & 255);
    return out;
  }

  /* frames: [{rgba, delay(ms)}], opts: {dither, loop(0=forever), alphaCut} */
  function encode(w, h, frames, opts) {
    opts = opts || {};
    var alphaCut = opts.alphaCut == null ? 128 : opts.alphaCut;
    var dither = opts.dither !== false;
    var bytes = [0x47, 0x49, 0x46, 0x38, 0x39, 0x61, w & 255, w >> 8, h & 255, h >> 8, 0x70, 0, 0]; // no global table
    if (frames.length > 1) {
      bytes.push(0x21, 0xFF, 0x0B); 'NETSCAPE2.0'.split('').forEach(function (c) { bytes.push(c.charCodeAt(0)); });
      bytes.push(3, 1, (opts.loop || 0) & 255, (opts.loop || 0) >> 8, 0);
    }
    var anyTransparent = false;
    frames.forEach(function (f) {
      var hasT = false, n = w * h;
      for (var i = 0; i < n; i++) if (f.rgba[i * 4 + 3] < alphaCut) { hasT = true; break; }
      var maxC = hasT ? 255 : 256;
      var pal = buildPalette(f.rgba, w, h, maxC, alphaCut);
      var transIdx = 0;
      if (hasT) { transIdx = pal.length; pal.push([0, 0, 0]); anyTransparent = true; }
      var idx = mapPixels(f.rgba, w, h, pal, transIdx, alphaCut, dither);
      var bitsNeeded = 1; while ((1 << bitsNeeded) < pal.length) bitsNeeded++;
      var tableSize = 1 << bitsNeeded;
      var delay = Math.max(0, Math.round((f.delay == null ? 100 : f.delay) / 10));
      // Graphic control extension
      bytes.push(0x21, 0xF9, 4, (hasT ? 1 : 0) | (hasT ? (2 << 2) : (1 << 2)), delay & 255, delay >> 8, hasT ? transIdx : 0, 0);
      // Image descriptor with a local colour table
      bytes.push(0x2C, 0, 0, 0, 0, w & 255, w >> 8, h & 255, h >> 8, 0x80 | (bitsNeeded - 1));
      for (var i2 = 0; i2 < tableSize; i2++) { var c = pal[i2] || [0, 0, 0]; bytes.push(c[0], c[1], c[2]); }
      var minCode = Math.max(2, bitsNeeded);
      bytes.push(minCode);
      var data = lzwEncode(idx, minCode);
      for (var p = 0; p < data.length; p += 255) {
        var len = Math.min(255, data.length - p); bytes.push(len);
        for (var q = 0; q < len; q++) bytes.push(data[p + q]);
      }
      bytes.push(0);
    });
    bytes.push(0x3B);
    return { bytes: new Uint8Array(bytes), hasTransparency: anyTransparent };
  }

  /* ---------------- decoder ---------------- */
  function lzwDecode(data, minCode, total) {
    var clear = 1 << minCode, eoi = clear + 1, next = eoi + 1, size = minCode + 1;
    var prefixTab = new Int16Array(4096), suffixTab = new Uint8Array(4096), stack = new Uint8Array(4097);
    var out = new Uint8Array(total), op = 0, i;
    for (i = 0; i < clear; i++) suffixTab[i] = i;
    var cur = 0, curBits = 0, p = 0, old = -1, first = 0;
    while (op < total) {
      while (curBits < size) { if (p >= data.length) { return out; } cur |= data[p++] << curBits; curBits += 8; }
      var code = cur & ((1 << size) - 1); cur >>>= size; curBits -= size;
      if (code === clear) { next = eoi + 1; size = minCode + 1; old = -1; continue; }
      if (code === eoi) break;
      if (old === -1) { out[op++] = suffixTab[code]; old = code; first = suffixTab[code]; continue; }
      var inCode = code, sp = 0;
      if (code >= next) { stack[sp++] = first; code = old; }
      while (code >= clear) { stack[sp++] = suffixTab[code]; code = prefixTab[code]; }
      first = suffixTab[code]; stack[sp++] = first;
      if (next < 4096) {
        prefixTab[next] = old; suffixTab[next] = first; next++;
        if (next === (1 << size) && size < 12) size++;
      }
      old = inCode;
      while (sp > 0 && op < total) out[op++] = stack[--sp];
    }
    return out;
  }

  function decode(buf) {
    var b = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
    if (b.length < 13 || b[0] !== 71 || b[1] !== 73 || b[2] !== 70) throw new Error('This file is not a GIF.');
    var w = b[6] | (b[7] << 8), h = b[8] | (b[9] << 8), flags = b[10], bgIndex = b[11];
    if (!w || !h) throw new Error('The GIF has no size.');
    var p = 13, gct = null;
    function readTable(n) { var t = new Uint8Array(n * 3); t.set(b.subarray(p, p + n * 3)); p += n * 3; return t; }
    if (flags & 0x80) gct = readTable(1 << ((flags & 7) + 1));
    var canvas = new Uint8ClampedArray(w * h * 4), frames = [], loop = 0;
    var gce = null;
    function skipSub() { while (p < b.length && b[p] !== 0) p += b[p] + 1; p++; }
    while (p < b.length) {
      var t = b[p++];
      if (t === 0x3B) break;
      if (t === 0x21) {
        var label = b[p++];
        if (label === 0xF9) {
          var bs = b[p++]; gce = { disposal: (b[p] >> 2) & 7, transparent: (b[p] & 1) ? b[p + 3] : -1, delay: (b[p + 1] | (b[p + 2] << 8)) * 10 };
          p += bs; skipSub();
        } else if (label === 0xFF) {
          var as = b[p++], name = String.fromCharCode.apply(null, b.subarray(p, p + 8)); p += as;
          if (name === 'NETSCAPE' && b[p] === 3 && b[p + 1] === 1) loop = b[p + 2] | (b[p + 3] << 8);
          skipSub();
        } else { skipSub(); }
        continue;
      }
      if (t !== 0x2C) throw new Error('The GIF data is damaged (unexpected block).');
      var fx = b[p] | (b[p + 1] << 8), fy = b[p + 2] | (b[p + 3] << 8), fw = b[p + 4] | (b[p + 5] << 8), fh = b[p + 6] | (b[p + 7] << 8), fl = b[p + 8];
      p += 9;
      var ct = (fl & 0x80) ? readTable(1 << ((fl & 7) + 1)) : gct;
      var interlaced = !!(fl & 0x40);
      var minCode = b[p++], chunks = [], tot = 0;
      while (p < b.length && b[p] !== 0) { var len = b[p++]; chunks.push(b.subarray(p, p + len)); p += len; tot += len; }
      p++;
      var data = new Uint8Array(tot), dp = 0; chunks.forEach(function (c) { data.set(c, dp); dp += c.length; });
      if (minCode < 1 || minCode > 11) throw new Error('The GIF data is damaged (bad LZW size).');
      var px = lzwDecode(data, minCode, fw * fh);
      var prev = (gce && gce.disposal === 3) ? new Uint8ClampedArray(canvas) : null;
      var tr = gce ? gce.transparent : -1;
      var rowMap = null;
      if (interlaced) {
        rowMap = []; [[0, 8], [4, 8], [2, 4], [1, 2]].forEach(function (pp) { for (var yy = pp[0]; yy < fh; yy += pp[1]) rowMap.push(yy); });
      }
      for (var yy = 0; yy < fh; yy++) {
        var dy = fy + (rowMap ? rowMap[yy] : yy);
        if (dy >= h) continue;
        for (var xx = 0; xx < fw; xx++) {
          var dx = fx + xx; if (dx >= w) continue;
          var ci = px[yy * fw + xx];
          if (ci === tr || !ct) continue;
          var o = (dy * w + dx) * 4;
          canvas[o] = ct[ci * 3]; canvas[o + 1] = ct[ci * 3 + 1]; canvas[o + 2] = ct[ci * 3 + 2]; canvas[o + 3] = 255;
        }
      }
      frames.push({ rgba: new Uint8ClampedArray(canvas), delay: gce ? gce.delay : 100 });
      var disp = gce ? gce.disposal : 0;
      if (disp === 2) {
        for (var cy = fy; cy < Math.min(h, fy + fh); cy++) for (var cx = fx; cx < Math.min(w, fx + fw); cx++) {
          var oo = (cy * w + cx) * 4; canvas[oo] = canvas[oo + 1] = canvas[oo + 2] = canvas[oo + 3] = 0;
        }
      } else if (disp === 3 && prev) { canvas.set(prev); }
      gce = null;
    }
    if (!frames.length) throw new Error('The GIF contains no image frames.');
    return { width: w, height: h, frames: frames, loop: loop };
  }

  EWT.gif = { encode: encode, decode: decode };
})(typeof window !== 'undefined' ? window : globalThis);
