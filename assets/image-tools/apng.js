/* =====================================================================
   EasyWorkTools.online - APNG (animated PNG) encoder (browser, no dependency)

   encode(frames, w, h, {loop}) -> Promise<Uint8Array>
     frames: [{rgba: Uint8ClampedArray (w*h*4), delay: milliseconds}]
     loop:   number of plays, 0 = forever

   Every frame is stored as a lossless 32-bit RGBA PNG image. Frames after the
   first only store the rectangle that changed since the previous frame
   (dispose = none, blend = source), which keeps typical files small without
   changing a single pixel. Rows use PNG adaptive filtering; the zlib stream
   comes from the browser's CompressionStream.

   Original code written for this site; no third-party code.
   ===================================================================== */
(function (global) {
  'use strict';
  var EWT = global.EWT = global.EWT || {};

  var crcTable = (function () {
    var t = new Uint32Array(256);
    for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
    return t;
  })();
  function crc32(bytes, start, end) {
    var c = 0xFFFFFFFF;
    for (var i = start; i < end; i++) c = crcTable[(c ^ bytes[i]) & 255] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  }
  function chunk(type, data) {
    var out = new Uint8Array(12 + data.length), dv = new DataView(out.buffer);
    dv.setUint32(0, data.length);
    for (var i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i);
    out.set(data, 8);
    dv.setUint32(8 + data.length, crc32(out, 4, 8 + data.length));
    return out;
  }

  /* PNG adaptive filter: pick, per row, the filter with the smallest sum of absolute residuals. */
  function filterRows(rgba, x0, y0, w, h, stride) {
    var bpp = 4, rowLen = w * bpp, out = new Uint8Array((rowLen + 1) * h);
    var cand = [new Uint8Array(rowLen), new Uint8Array(rowLen), new Uint8Array(rowLen), new Uint8Array(rowLen), new Uint8Array(rowLen)];
    var row = new Uint8Array(rowLen), prev = new Uint8Array(rowLen);
    for (var y = 0; y < h; y++) {
      var so = ((y0 + y) * stride + x0) * 4;
      for (var i = 0; i < rowLen; i++) row[i] = rgba[so + i];
      for (var i2 = 0; i2 < rowLen; i2++) {
        var a = i2 >= bpp ? row[i2 - bpp] : 0, b = prev[i2], c = i2 >= bpp ? prev[i2 - bpp] : 0, x = row[i2];
        cand[0][i2] = x;
        cand[1][i2] = (x - a) & 255;
        cand[2][i2] = (x - b) & 255;
        cand[3][i2] = (x - ((a + b) >> 1)) & 255;
        var p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
        cand[4][i2] = (x - (pa <= pb && pa <= pc ? a : (pb <= pc ? b : c))) & 255;
      }
      var best = 0, bestScore = Infinity;
      for (var f = 0; f < 5; f++) {
        var sc = 0, cf = cand[f];
        for (var j = 0; j < rowLen; j++) { var v = cf[j]; sc += v < 128 ? v : 256 - v; }
        if (sc < bestScore) { bestScore = sc; best = f; }
      }
      out[y * (rowLen + 1)] = best;
      out.set(cand[best], y * (rowLen + 1) + 1);
      var t = prev; prev = row; row = t;
    }
    return out;
  }

  function deflate(data) {
    if (typeof global.CompressionStream === 'undefined') return Promise.reject(new Error('This browser cannot compress PNG data (CompressionStream is missing). Try a current Chrome, Edge, Firefox or Safari.'));
    var cs = new global.CompressionStream('deflate');
    var w = cs.writable.getWriter(); w.write(data); w.close();
    return new global.Response(cs.readable).arrayBuffer().then(function (ab) { return new Uint8Array(ab); });
  }

  function changedRect(a, b, w, h) {
    var minX = w, minY = h, maxX = -1, maxY = -1;
    for (var y = 0; y < h; y++) {
      var o = y * w * 4;
      for (var x = 0; x < w; x++, o += 4) {
        if (a[o] !== b[o] || a[o + 1] !== b[o + 1] || a[o + 2] !== b[o + 2] || a[o + 3] !== b[o + 3]) {
          if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y;
        }
      }
    }
    if (maxX < 0) return { x: 0, y: 0, w: 1, h: 1 };         // identical frame: a 1x1 rewrite keeps the timing
    return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
  }

  function encode(frames, w, h, opts) {
    opts = opts || {};
    if (!frames.length) return Promise.reject(new Error('No frames to encode.'));
    var animated = frames.length > 1;
    var rects = frames.map(function (f, i) { return i === 0 ? { x: 0, y: 0, w: w, h: h } : changedRect(frames[i - 1].rgba, f.rgba, w, h); });
    return Promise.all(frames.map(function (f, i) {
      var r = rects[i];
      return deflate(filterRows(f.rgba, r.x, r.y, r.w, r.h, w));
    })).then(function (z) {
      var parts = [new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])];
      var ihdr = new Uint8Array(13), dv = new DataView(ihdr.buffer);
      dv.setUint32(0, w); dv.setUint32(4, h); ihdr[8] = 8; ihdr[9] = 6;
      parts.push(chunk('IHDR', ihdr));
      if (animated) { var ac = new Uint8Array(8), a = new DataView(ac.buffer); a.setUint32(0, frames.length); a.setUint32(4, opts.loop || 0); parts.push(chunk('acTL', ac)); }
      var seq = 0;
      frames.forEach(function (f, i) {
        var r = rects[i];
        if (animated) {
          var fc = new Uint8Array(26), d = new DataView(fc.buffer);
          d.setUint32(0, seq++); d.setUint32(4, r.w); d.setUint32(8, r.h); d.setUint32(12, r.x); d.setUint32(16, r.y);
          var ms = Math.max(0, Math.min(65535, Math.round(f.delay == null ? 100 : f.delay)));
          d.setUint16(20, ms); d.setUint16(22, 1000); fc[24] = 0; fc[25] = 0;
          parts.push(chunk('fcTL', fc));
        }
        if (i === 0) parts.push(chunk('IDAT', z[i]));
        else { var fd = new Uint8Array(4 + z[i].length); new DataView(fd.buffer).setUint32(0, seq++); fd.set(z[i], 4); parts.push(chunk('fdAT', fd)); }
      });
      parts.push(chunk('IEND', new Uint8Array(0)));
      var n = 0; parts.forEach(function (p) { n += p.length; });
      var out = new Uint8Array(n), o = 0; parts.forEach(function (p) { out.set(p, o); o += p.length; });
      return out;
    });
  }

  EWT.apng = { encode: encode, _crc32: crc32 };
})(typeof window !== 'undefined' ? window : globalThis);
