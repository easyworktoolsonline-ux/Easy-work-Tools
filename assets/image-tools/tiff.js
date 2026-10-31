/* =====================================================================
   EasyWorkTools.online - TIFF reader and writer (browser, no dependency)

   decode(buffer, {page})  -> Promise<{width, height, rgba, pages, info}>
   encode(rgba, w, h, {compression: 'none'|'lzw', alpha: bool}) -> Uint8Array

   Reader supports (baseline TIFF 6.0 plus common extensions):
     byte order        little and big endian (classic TIFF; BigTIFF is refused)
     layout            strips and tiles, chunky and planar
     compression       none, LZW, PackBits, Deflate (Adobe and PKZIP codes)
     predictor         horizontal differencing (2)
     photometric       white-is-zero, black-is-zero, RGB, palette, CMYK
     samples           1, 2, 4, 8 and 16 bits per sample, any sample count
     alpha             associated (premultiplied) and unassociated extra sample
     orientation       EXIF-style orientation tag 1-8 is applied
   Refused with a clear message (never guessed): JPEG-in-TIFF, CCITT fax,
   floating point and 32-bit samples, YCbCr, CIE Lab, BigTIFF.
   Only the page you ask for is decoded (default: first page).

   Writer: 8-bit RGB or RGBA, uncompressed or LZW, little endian, single page.

   Original code written for this site; no third-party code.
   ===================================================================== */
(function (global) {
  'use strict';
  var EWT = global.EWT = global.EWT || {};

  var TYPE_SIZE = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 6: 1, 7: 1, 8: 2, 9: 4, 10: 8, 11: 4, 12: 8 };
  var MAX_PIXELS = 200 * 1000 * 1000;

  function fail(msg) { var e = new Error(msg); e.userMessage = msg; return e; }

  /* ---------------- IFD parsing ---------------- */
  function parseIFDs(b, dv, le) {
    var ifds = [], off = dv.getUint32(4, le), guard = 0;
    while (off && off + 2 <= b.length && guard++ < 4096) {
      var n = dv.getUint16(off, le), tags = {}, p = off + 2;
      if (p + n * 12 + 4 > b.length) throw fail('This TIFF file is truncated or damaged (directory runs past the end of the file).');
      for (var i = 0; i < n; i++, p += 12) {
        var tag = dv.getUint16(p, le), type = dv.getUint16(p + 2, le), cnt = dv.getUint32(p + 4, le);
        var sz = (TYPE_SIZE[type] || 0) * cnt, vo = sz <= 4 ? p + 8 : dv.getUint32(p + 8, le);
        if (!TYPE_SIZE[type] || vo + sz > b.length) continue;
        var vals = [];
        var lim = Math.min(cnt, 1 << 22);
        for (var k = 0; k < lim; k++) {
          switch (type) {
            case 1: case 2: case 7: vals.push(b[vo + k]); break;
            case 6: vals.push(dv.getInt8(vo + k)); break;
            case 3: vals.push(dv.getUint16(vo + k * 2, le)); break;
            case 8: vals.push(dv.getInt16(vo + k * 2, le)); break;
            case 4: vals.push(dv.getUint32(vo + k * 4, le)); break;
            case 9: vals.push(dv.getInt32(vo + k * 4, le)); break;
            case 5: vals.push(dv.getUint32(vo + k * 8, le) / (dv.getUint32(vo + k * 8 + 4, le) || 1)); break;
            case 10: vals.push(dv.getInt32(vo + k * 8, le) / (dv.getInt32(vo + k * 8 + 4, le) || 1)); break;
            case 11: vals.push(dv.getFloat32(vo + k * 4, le)); break;
            case 12: vals.push(dv.getFloat64(vo + k * 8, le)); break;
          }
        }
        tags[tag] = vals;
      }
      ifds.push(tags);
      off = dv.getUint32(p, le);
    }
    return ifds;
  }

  /* ---------------- decompressors ---------------- */
  function packBitsDecode(src, expected) {
    var out = new Uint8Array(expected), o = 0, i = 0;
    while (i < src.length && o < expected) {
      var n = src[i++]; if (n > 127) n -= 256;
      if (n >= 0) { for (var k = 0; k <= n && o < expected && i < src.length; k++) out[o++] = src[i++]; }
      else if (n !== -128) { var v = src[i++]; for (var j = 0; j < 1 - n && o < expected; j++) out[o++] = v; }
    }
    return out;
  }

  function lzwDecode(src, expected) {
    var out = new Uint8Array(expected), o = 0;
    var prefix = new Int32Array(4096), suffix = new Uint8Array(4096), lens = new Uint16Array(4096);
    var stack = new Uint8Array(4097);
    var bitBuf = 0, bitCnt = 0, ip = 0, width = 9, next = 258, prev = -1;
    function reset() { width = 9; next = 258; prev = -1; }
    for (var i = 0; i < 256; i++) { suffix[i] = i; prefix[i] = -1; lens[i] = 1; }
    // Old-style (LSB first) LZW is not supported; it is recognisable by its first two bytes.
    if (src.length >= 2 && src[0] === 0 && (src[1] & 1)) throw fail('This TIFF uses the obsolete pre-1988 LZW variant, which is not supported.');
    while (o < expected) {
      while (bitCnt < width) {
        if (ip >= src.length) return out;
        bitBuf = ((bitBuf << 8) | src[ip++]) >>> 0; bitCnt += 8;
      }
      if (bitCnt < width) return out;
      var code = (bitBuf >>> (bitCnt - width)) & ((1 << width) - 1);
      bitCnt -= width; bitBuf &= (1 << bitCnt) - 1;
      if (code === 257) break;
      if (code === 256) { reset(); continue; }
      var cur = code, sp = 0, first;
      if (code >= next) {
        if (prev < 0 || code > next) throw fail('This TIFF contains corrupt LZW data.');
        // KwKwK case: previous string + its first byte
        var q = prev; while (prefix[q] >= 0) q = prefix[q];
        first = suffix[q]; stack[sp++] = first; cur = prev;
      }
      while (cur >= 0 && sp < 4096) { stack[sp++] = suffix[cur]; cur = prefix[cur]; }
      first = stack[sp - 1];
      while (sp > 0 && o < expected) out[o++] = stack[--sp];
      if (prev >= 0 && next < 4096) { prefix[next] = prev; suffix[next] = first; next++; }
      prev = code;
      if (next + 1 >= (1 << width) && width < 12) width++;
    }
    return out;
  }

  function inflate(src) {
    if (typeof global.DecompressionStream === 'undefined') return Promise.reject(fail('This browser cannot decode Deflate-compressed TIFF files (DecompressionStream is missing).'));
    var ds = new global.DecompressionStream('deflate');
    var w = ds.writable.getWriter(); w.write(src); w.close();
    return new global.Response(ds.readable).arrayBuffer().then(function (ab) { return new Uint8Array(ab); },
      function () { throw fail('This TIFF contains corrupt Deflate data.'); });
  }

  function decompress(comp, src, expected) {
    if (comp === 1) return Promise.resolve(src);
    if (comp === 32773) return Promise.resolve(packBitsDecode(src, expected));
    if (comp === 5) return Promise.resolve(lzwDecode(src, expected));
    if (comp === 8 || comp === 32946) return inflate(src);
    return Promise.reject(fail('Unsupported TIFF compression.'));
  }

  var COMP_NAME = { 2: 'CCITT Group 3', 3: 'CCITT Group 3 fax', 4: 'CCITT Group 4 fax', 6: 'old-style JPEG', 7: 'JPEG', 34712: 'JPEG 2000', 34925: 'LZMA', 50000: 'Zstandard', 50001: 'WebP', 34661: 'JBIG' };

  /* ---------------- main decoder ---------------- */
  function decode(input, opts) {
    opts = opts || {};
    var b = input instanceof Uint8Array ? input : new Uint8Array(input);
    if (b.length < 8) return Promise.reject(fail('This file is too small to be a TIFF image.'));
    var order = String.fromCharCode(b[0], b[1]);
    if (order !== 'II' && order !== 'MM') return Promise.reject(fail('This is not a TIFF file (missing the II or MM header).'));
    var le = order === 'II', dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
    var magic = dv.getUint16(2, le);
    if (magic === 43) return Promise.reject(fail('BigTIFF (files over 4 GB) is not supported.'));
    if (magic !== 42) return Promise.reject(fail('This is not a TIFF file (bad version number).'));
    var ifds;
    try { ifds = parseIFDs(b, dv, le); } catch (e) { return Promise.reject(e); }
    if (!ifds.length) return Promise.reject(fail('This TIFF contains no image.'));
    var pageIdx = Math.min(opts.page || 0, ifds.length - 1);
    var t = ifds[pageIdx];
    function one(tag, def) { return t[tag] && t[tag].length ? t[tag][0] : def; }

    var W = one(256), H = one(257);
    if (!W || !H) return Promise.reject(fail('This TIFF has no image dimensions.'));
    if (W * H > MAX_PIXELS) return Promise.reject(fail('This TIFF is ' + W + ' x ' + H + ' pixels, which is more than this browser tool can safely decode.'));
    var spp = one(277, 1), comp = one(259, 1), photo = one(262, 1), planar = one(284, 1), pred = one(317, 1);
    var bitsArr = t[258] || [1];
    var bits = bitsArr[0];
    for (var bi = 1; bi < bitsArr.length; bi++) if (bitsArr[bi] !== bits) return Promise.reject(fail('This TIFF uses different bit depths for different channels, which is not supported.'));
    var fmt = one(339, 1);
    if (fmt === 3) return Promise.reject(fail('Floating-point TIFF images are not supported.'));
    if (fmt === 2) return Promise.reject(fail('Signed-integer TIFF images are not supported.'));
    if ([1, 2, 4, 8, 16].indexOf(bits) < 0) return Promise.reject(fail('This TIFF uses ' + bits + ' bits per sample, which is not supported (supported: 1, 2, 4, 8, 16).'));
    if (COMP_NAME[comp]) return Promise.reject(fail('This TIFF uses ' + COMP_NAME[comp] + ' compression, which cannot be decoded in the browser here. Re-save it with no compression, LZW, PackBits or Deflate.'));
    if ([1, 5, 8, 32773, 32946].indexOf(comp) < 0) return Promise.reject(fail('This TIFF uses an unsupported compression method (code ' + comp + ').'));
    if (pred !== 1 && pred !== 2) return Promise.reject(fail('This TIFF uses a floating-point predictor, which is not supported.'));
    if (photo === 6) return Promise.reject(fail('YCbCr TIFF images are not supported.'));
    if (photo === 8 || photo === 9 || photo === 10) return Promise.reject(fail('CIE Lab TIFF images are not supported.'));
    if ([0, 1, 2, 3, 5].indexOf(photo) < 0) return Promise.reject(fail('This TIFF uses an unsupported colour model (photometric ' + photo + ').'));
    var baseSamples = photo === 2 ? 3 : (photo === 5 ? 4 : 1);
    if (spp < baseSamples) return Promise.reject(fail('This TIFF declares fewer samples per pixel than its colour model needs.'));
    if (photo === 3 && !(t[320] && t[320].length >= 3 * (1 << bits))) return Promise.reject(fail('This palette TIFF has no (or a short) colour map.'));
    if (bits < 8 && spp !== 1) return Promise.reject(fail('Multi-channel TIFFs with fewer than 8 bits per sample are not supported.'));
    var tiled = !!(t[322] && t[324]);
    if (!tiled && !(t[273] && t[279]) && !(t[273] && t[273].length === 1)) return Promise.reject(fail('This TIFF has no image data locations.'));

    var extra = t[338] || [];
    var alphaIdx = -1, premult = false;
    if (spp > baseSamples && (extra[0] === 1 || extra[0] === 2)) { alphaIdx = baseSamples; premult = extra[0] === 1; }
    var planes = planar === 2 ? spp : 1, perPixel = planar === 2 ? 1 : spp;

    var samples = bits === 16 ? new Uint16Array(W * H * spp) : new Uint8Array(W * H * spp);
    var jobs = [], rowsPerStrip, tw, th, offs, cnts;
    if (tiled) {
      tw = one(322); th = one(323); offs = t[324]; cnts = t[325];
      var tilesAcross = Math.ceil(W / tw), tilesDown = Math.ceil(H / th), perPlane = tilesAcross * tilesDown;
      if (!cnts || offs.length < perPlane * planes) return Promise.reject(fail('This TIFF has an incomplete tile table.'));
      for (var pl = 0; pl < planes; pl++) for (var ty = 0; ty < tilesDown; ty++) for (var tx = 0; tx < tilesAcross; tx++) {
        var ti = pl * perPlane + ty * tilesAcross + tx;
        jobs.push({ off: offs[ti], len: cnts[ti], x0: tx * tw, y0: ty * th, bw: tw, bh: th, plane: pl });
      }
    } else {
      rowsPerStrip = Math.min(one(278, H), H) || H; offs = t[273]; cnts = t[279] || [];
      var strips = Math.ceil(H / rowsPerStrip);
      if (offs.length < strips * planes) return Promise.reject(fail('This TIFF has an incomplete strip table.'));
      for (var p2 = 0; p2 < planes; p2++) for (var s = 0; s < strips; s++) {
        var si = p2 * strips + s;
        var len = cnts[si];
        if (len == null) len = b.length - offs[si];
        jobs.push({ off: offs[si], len: len, x0: 0, y0: s * rowsPerStrip, bw: W, bh: Math.min(rowsPerStrip, H - s * rowsPerStrip), plane: p2 });
      }
    }

    var bpsRow = function (w) { return Math.ceil(w * perPixel * bits / 8); };
    var idx = 0;
    function next() {
      if (idx >= jobs.length) return Promise.resolve();
      var j = jobs[idx++];
      if (j.off + j.len > b.length) return Promise.reject(fail('This TIFF is truncated: the image data runs past the end of the file.'));
      var rb = bpsRow(j.bw), expected = rb * j.bh;
      return decompress(comp, b.subarray(j.off, j.off + j.len), expected).then(function (raw) {
        if (raw.length < expected) { var pad = new Uint8Array(expected); pad.set(raw); raw = pad; }
        placeBlock(raw, j, rb);
        return next();
      });
    }

    function placeBlock(raw, j, rb) {
      var bw = j.bw;
      for (var r = 0; r < j.bh; r++) {
        var y = j.y0 + r; if (y >= H) break;
        var ro = r * rb;
        if (pred === 2 && bits >= 8) {
          var chn = perPixel;
          if (bits === 8) { for (var xx = chn; xx < bw * chn; xx++) raw[ro + xx] = (raw[ro + xx] + raw[ro + xx - chn]) & 255; }
          else {
            for (var x16 = chn; x16 < bw * chn; x16++) {
              var o1 = ro + x16 * 2, o0 = ro + (x16 - chn) * 2, a, c;
              if (le) { a = raw[o1] | (raw[o1 + 1] << 8); c = raw[o0] | (raw[o0 + 1] << 8); var v = (a + c) & 65535; raw[o1] = v & 255; raw[o1 + 1] = v >> 8; }
              else { a = (raw[o1] << 8) | raw[o1 + 1]; c = (raw[o0] << 8) | raw[o0 + 1]; var v2 = (a + c) & 65535; raw[o1] = v2 >> 8; raw[o1 + 1] = v2 & 255; }
            }
          }
        }
        var xmax = Math.min(bw, W - j.x0);
        for (var x = 0; x < xmax; x++) {
          var dst = ((y * W) + j.x0 + x) * spp;
          if (planar === 2) {
            samples[dst + j.plane] = bits === 16 ? (le ? raw[ro + x * 2] | (raw[ro + x * 2 + 1] << 8) : (raw[ro + x * 2] << 8) | raw[ro + x * 2 + 1]) : raw[ro + x];
          } else if (bits === 8) {
            for (var k = 0; k < spp; k++) samples[dst + k] = raw[ro + x * spp + k];
          } else if (bits === 16) {
            for (var k2 = 0; k2 < spp; k2++) { var q = ro + (x * spp + k2) * 2; samples[dst + k2] = le ? raw[q] | (raw[q + 1] << 8) : (raw[q] << 8) | raw[q + 1]; }
          } else {
            var bitPos = x * bits, byte = raw[ro + (bitPos >> 3)];
            samples[dst] = (byte >> (8 - bits - (bitPos & 7))) & ((1 << bits) - 1);
          }
        }
      }
    }

    return next().then(function () {
      var rgba = new Uint8ClampedArray(W * H * 4), n = W * H, maxv = (1 << bits) - 1, cm = t[320];
      var shift = bits === 16 ? 8 : 0;
      function to8(v) { return bits === 16 ? v >> 8 : (bits === 8 ? v : Math.round(v * 255 / maxv)); }
      for (var i = 0; i < n; i++) {
        var s0 = i * spp, o = i * 4, r, g, bl, a = 255;
        if (photo === 2) { r = to8(samples[s0]); g = to8(samples[s0 + 1]); bl = to8(samples[s0 + 2]); }
        else if (photo === 5) {
          var C = to8(samples[s0]), M = to8(samples[s0 + 1]), Y = to8(samples[s0 + 2]), K = to8(samples[s0 + 3]);
          r = Math.round((255 - C) * (255 - K) / 255); g = Math.round((255 - M) * (255 - K) / 255); bl = Math.round((255 - Y) * (255 - K) / 255);
        } else if (photo === 3) {
          var pi = samples[s0]; r = cm[pi] >> 8; g = cm[(1 << bits) + pi] >> 8; bl = cm[2 * (1 << bits) + pi] >> 8;
        } else { var gv = to8(samples[s0]); if (photo === 0) gv = 255 - gv; r = g = bl = gv; }
        if (alphaIdx >= 0) {
          a = to8(samples[s0 + alphaIdx]);
          if (premult && a > 0 && a < 255) { r = Math.min(255, Math.round(r * 255 / a)); g = Math.min(255, Math.round(g * 255 / a)); bl = Math.min(255, Math.round(bl * 255 / a)); }
        }
        rgba[o] = r; rgba[o + 1] = g; rgba[o + 2] = bl; rgba[o + 3] = a;
      }
      var res = { width: W, height: H, rgba: rgba, pages: ifds.length, page: pageIdx,
        info: { compression: comp, photometric: photo, bitsPerSample: bits, samplesPerPixel: spp, hasAlpha: alphaIdx >= 0, tiled: tiled, planar: planar === 2, bigEndian: !le } };
      var ori = one(274, 1);
      if (ori > 1 && ori <= 8) res = orient(res, ori);
      return res;
    });
  }

  function orient(img, o) {
    var w = img.width, h = img.height, src = img.rgba, swap = o >= 5;
    var nw = swap ? h : w, nh = swap ? w : h, out = new Uint8ClampedArray(nw * nh * 4);
    for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) {
      var nx, ny;
      switch (o) {
        case 2: nx = w - 1 - x; ny = y; break;
        case 3: nx = w - 1 - x; ny = h - 1 - y; break;
        case 4: nx = x; ny = h - 1 - y; break;
        case 5: nx = y; ny = x; break;
        case 6: nx = h - 1 - y; ny = x; break;
        case 7: nx = h - 1 - y; ny = w - 1 - x; break;
        default: nx = y; ny = w - 1 - x; break;
      }
      var s = (y * w + x) * 4, d = (ny * nw + nx) * 4;
      out[d] = src[s]; out[d + 1] = src[s + 1]; out[d + 2] = src[s + 2]; out[d + 3] = src[s + 3];
    }
    img.width = nw; img.height = nh; img.rgba = out; img.info.orientationApplied = o;
    return img;
  }

  /* ---------------- LZW encoder (TIFF flavour: MSB first, early change) ---------------- */
  function lzwEncode(src) {
    var out = [], bitBuf = 0, bitCnt = 0, width = 9;
    var dict = new Map(), next = 258;
    function put(code) {
      bitBuf = (bitBuf << width) | code; bitCnt += width;
      while (bitCnt >= 8) { out.push((bitBuf >>> (bitCnt - 8)) & 255); bitCnt -= 8; }
      bitBuf &= (1 << bitCnt) - 1;
    }
    put(256);
    if (!src.length) { put(257); if (bitCnt) out.push((bitBuf << (8 - bitCnt)) & 255); return new Uint8Array(out); }
    var cur = src[0];
    for (var i = 1; i < src.length; i++) {
      var c = src[i], key = cur * 256 + c, hit = dict.get(key);
      if (hit !== undefined) { cur = hit; continue; }
      put(cur);
      dict.set(key, next++);
      if (next + 1 > (1 << width) && width < 12) width++;   // early change
      if (next >= 4094) { put(256); dict.clear(); next = 258; width = 9; }
      cur = c;
    }
    put(cur);
    // the decoder adds one more table entry after this code, which can widen the next code
    if (next + 1 >= (1 << width) && width < 12 && next < 4094) width++;
    put(257);
    if (bitCnt) out.push((bitBuf << (8 - bitCnt)) & 255);
    return new Uint8Array(out);
  }

  /* ---------------- encoder ---------------- */
  function encode(rgba, w, h, opts) {
    opts = opts || {};
    var useLzw = opts.compression === 'lzw';
    var hasAlpha = opts.alpha === true;
    if (opts.alpha == null) { for (var i = 3; i < rgba.length; i += 4) if (rgba[i] !== 255) { hasAlpha = true; break; } }
    var spp = hasAlpha ? 4 : 3, rowBytes = w * spp;
    var rps = Math.max(1, Math.min(h, Math.floor(65536 / rowBytes)));
    var nStrips = Math.ceil(h / rps), strips = [];
    for (var s = 0; s < nStrips; s++) {
      var rows = Math.min(rps, h - s * rps), raw = new Uint8Array(rows * rowBytes), o = 0;
      for (var y = s * rps; y < s * rps + rows; y++) {
        for (var x = 0; x < w; x++) {
          var q = (y * w + x) * 4; raw[o++] = rgba[q]; raw[o++] = rgba[q + 1]; raw[o++] = rgba[q + 2]; if (hasAlpha) raw[o++] = rgba[q + 3];
        }
      }
      if (useLzw) {
        // horizontal differencing (predictor 2) makes photos and gradients compress far better
        for (var ry = 0; ry < rows; ry++) { var base = ry * rowBytes; for (var rx = rowBytes - 1; rx >= spp; rx--) raw[base + rx] = (raw[base + rx] - raw[base + rx - spp]) & 255; }
      }
      strips.push(useLzw ? lzwEncode(raw) : raw);
    }
    var software = 'EasyWorkTools.online', swBytes = new Uint8Array(software.length + 1);
    for (var c = 0; c < software.length; c++) swBytes[c] = software.charCodeAt(c);
    var entries = [];
    function add(tag, type, count, val) { entries.push({ tag: tag, type: type, count: count, val: val }); }
    add(256, 4, 1, w); add(257, 4, 1, h);
    add(258, 3, spp, new Array(spp).fill(8));
    add(259, 3, 1, useLzw ? 5 : 1); add(262, 3, 1, 2);
    add(273, 4, nStrips, null); // strip offsets, filled later
    add(277, 3, 1, spp); add(278, 4, 1, rps);
    add(279, 4, nStrips, strips.map(function (a) { return a.length; }));
    add(282, 5, 1, [72, 1]); add(283, 5, 1, [72, 1]);
    add(284, 3, 1, 1); add(296, 3, 1, 2);
    if (useLzw) add(317, 3, 1, 2);
    add(305, 2, swBytes.length, swBytes);
    if (hasAlpha) add(338, 3, 1, 2);
    entries.sort(function (a, b) { return a.tag - b.tag; });
    var ifdSize = 2 + entries.length * 12 + 4, extraStart = 8 + ifdSize, extraLen = 0;
    var TS = { 2: 1, 3: 2, 4: 4, 5: 8 };
    entries.forEach(function (e) { var sz = TS[e.type] * e.count; if (sz > 4) { e.ext = extraStart + extraLen; extraLen += sz + (sz & 1); } });
    var dataStart = extraStart + extraLen, offsets = [], pos = dataStart;
    strips.forEach(function (a) { offsets.push(pos); pos += a.length; });
    var total = pos, out = new Uint8Array(total), dv = new DataView(out.buffer);
    out[0] = 0x49; out[1] = 0x49; dv.setUint16(2, 42, true); dv.setUint32(4, 8, true);
    dv.setUint16(8, entries.length, true);
    var p = 10;
    function writeVals(e, at) {
      var vals = e.tag === 273 ? offsets : e.val;
      if (e.type === 2) { out.set(vals, at); return; }
      if (e.type === 5) { dv.setUint32(at, vals[0], true); dv.setUint32(at + 4, vals[1], true); return; }
      if (!Array.isArray(vals)) vals = [vals];
      for (var k = 0; k < e.count; k++) {
        if (e.type === 3) dv.setUint16(at + k * 2, vals[k], true);
        else dv.setUint32(at + k * 4, vals[k], true);
      }
    }
    entries.forEach(function (e) {
      dv.setUint16(p, e.tag, true); dv.setUint16(p + 2, e.type, true); dv.setUint32(p + 4, e.count, true);
      var sz = TS[e.type] * e.count;
      if (sz > 4) { dv.setUint32(p + 8, e.ext, true); writeVals(e, e.ext); } else writeVals(e, p + 8);
      p += 12;
    });
    dv.setUint32(p, 0, true);
    strips.forEach(function (a, i) { out.set(a, offsets[i]); });
    return out;
  }

  EWT.tiff = { decode: decode, encode: encode, _lzwEncode: lzwEncode, _lzwDecode: lzwDecode, _packBitsDecode: packBitsDecode };
})(typeof window !== 'undefined' ? window : globalThis);
