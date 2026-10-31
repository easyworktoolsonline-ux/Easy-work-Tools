/* =====================================================================
   EasyWorkTools.online - EPS writer (browser, no dependency)

   encode(rgba, w, h, {dpi, background, level3, title}) -> Promise<Uint8Array>

   Writes a standards-shaped Encapsulated PostScript file (DSC 3.0, EPSF-3.0)
   with the bitmap embedded as a PostScript image operator:
     level 2 (default): raw 24-bit RGB, ASCII85 encoded     - maximum compatibility
     level 3 (option):  RGB, Flate compressed, ASCII85      - much smaller files
   This is a raster picture inside an EPS wrapper, not editable vector art.
   EPS cannot store transparency, so transparent pixels are composited onto
   the background colour (white by default) first.

   Original code written for this site; no third-party code.
   ===================================================================== */
(function (global) {
  'use strict';
  var EWT = global.EWT = global.EWT || {};

  function a85(bytes) {
    var parts = [], n = bytes.length, i = 0;
    for (; i + 4 <= n; i += 4) {
      var v = ((bytes[i] << 24) | (bytes[i + 1] << 16) | (bytes[i + 2] << 8) | bytes[i + 3]) >>> 0;
      if (v === 0) { parts.push('z'); continue; }
      var c = [0, 0, 0, 0, 0];
      for (var j = 4; j >= 0; j--) { c[j] = v % 85; v = Math.floor(v / 85); }
      parts.push(String.fromCharCode(c[0] + 33, c[1] + 33, c[2] + 33, c[3] + 33, c[4] + 33));
    }
    var rem = n - i;
    if (rem > 0) {
      var t = 0; for (var q = 0; q < 4; q++) t = t * 256 + (q < rem ? bytes[i + q] : 0);
      var d = [0, 0, 0, 0, 0];
      for (var m = 4; m >= 0; m--) { d[m] = t % 85; t = Math.floor(t / 85); }
      var s = ''; for (var r = 0; r < rem + 1; r++) s += String.fromCharCode(d[r] + 33);
      parts.push(s);
    }
    parts.push('~>');
    var all = parts.join(''), lines = [], pos = 0;
    while (pos < all.length) {
      var end = Math.min(pos + 72, all.length);
      // never start a line with '%': DSC readers would take the data for a comment
      while (end < all.length && all[end] === '%') end++;
      lines.push(all.slice(pos, end)); pos = end;
    }
    return lines.join('\n') + '\n';
  }

  function deflate(data) {
    if (typeof global.CompressionStream === 'undefined') return Promise.reject(new Error('This browser cannot compress data (CompressionStream is missing). Use the Level 2 option.'));
    var cs = new global.CompressionStream('deflate');
    var w = cs.writable.getWriter(); w.write(data); w.close();
    return new global.Response(cs.readable).arrayBuffer().then(function (ab) { return new Uint8Array(ab); });
  }

  function parseColor(c) {
    var m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(c || '#ffffff');
    return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : [255, 255, 255];
  }
  function psString(s) { return '(' + String(s).replace(/[\\()]/g, '\\$&').replace(/[^\x20-\x7e]/g, '?') + ')'; }

  function encode(rgba, w, h, opts) {
    opts = opts || {};
    var dpi = opts.dpi > 0 ? opts.dpi : 72, bg = parseColor(opts.background), level3 = !!opts.level3;
    var rgb = new Uint8Array(w * h * 3), hadAlpha = false;
    for (var i = 0, o = 0, p = 0; i < w * h; i++, o += 4) {
      var a = rgba[o + 3];
      if (a === 255) { rgb[p++] = rgba[o]; rgb[p++] = rgba[o + 1]; rgb[p++] = rgba[o + 2]; }
      else {
        hadAlpha = true; var f = a / 255;
        rgb[p++] = Math.round(rgba[o] * f + bg[0] * (1 - f)); rgb[p++] = Math.round(rgba[o + 1] * f + bg[1] * (1 - f)); rgb[p++] = Math.round(rgba[o + 2] * f + bg[2] * (1 - f));
      }
    }
    var pw = w * 72 / dpi, ph = h * 72 / dpi;
    function num(v) { return String(Math.round(v * 1000) / 1000); }
    var head =
      '%!PS-Adobe-3.0 EPSF-3.0\n' +
      '%%Creator: EasyWorkTools.online (PNG to EPS)\n' +
      '%%Title: ' + psString(opts.title || 'image.eps') + '\n' +
      '%%CreationDate: ' + new Date().toISOString() + '\n' +
      '%%BoundingBox: 0 0 ' + Math.ceil(pw) + ' ' + Math.ceil(ph) + '\n' +
      '%%HiResBoundingBox: 0 0 ' + num(pw) + ' ' + num(ph) + '\n' +
      '%%LanguageLevel: ' + (level3 ? 3 : 2) + '\n' +
      '%%DocumentData: Clean7Bit\n' +
      '%%Pages: 1\n' +
      '%%EndComments\n' +
      '%%BeginProlog\n%%EndProlog\n' +
      '%%Page: 1 1\n' +
      'gsave\n' +
      num(pw) + ' ' + num(ph) + ' scale\n' +
      '/DeviceRGB setcolorspace\n' +
      '<<\n  /ImageType 1\n  /Width ' + w + '\n  /Height ' + h + '\n  /BitsPerComponent 8\n' +
      '  /Decode [0 1 0 1 0 1]\n' +
      '  /ImageMatrix [' + w + ' 0 0 ' + (-h) + ' 0 ' + h + ']\n' +
      '  /DataSource currentfile /ASCII85Decode filter' + (level3 ? ' /FlateDecode filter' : '') + '\n' +
      '>> image\n';
    var tail = 'grestore\nshowpage\n%%EOF\n';
    var payload = level3 ? deflate(rgb) : Promise.resolve(rgb);
    return payload.then(function (data) {
      var text = head + a85(data) + tail, out = new Uint8Array(text.length);
      for (var k = 0; k < text.length; k++) out[k] = text.charCodeAt(k) & 127;
      return { bytes: out, flattened: hadAlpha, level: level3 ? 3 : 2 };
    });
  }

  EWT.eps = { encode: encode, _a85: a85 };
})(typeof window !== 'undefined' ? window : globalThis);
