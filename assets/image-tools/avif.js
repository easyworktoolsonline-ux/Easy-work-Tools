/* =====================================================================
   EasyWorkTools.online - AVIF encoder (browser, no upload, no dependency)

   There is no AVIF encoder in canvas (toBlob("image/avif") silently falls
   back to PNG in every browser tested), so this file does the real work:

     1. The pixels are compressed to an AV1 still frame by the browser's own
        AV1 encoder through the WebCodecs VideoEncoder API.
     2. The AV1 frame is wrapped in a standards-compliant AVIF container
        (ISO BMFF / HEIF: ftyp, meta, mdat) written here by hand, including
        a separate alpha plane when the image has transparency.

   Support: Chromium-based browsers (Chrome, Edge, Opera, Brave, Samsung
   Internet). Firefox and Safari do not expose an AV1 *encoder* to the web, so
   EWT.avif.supported() reports false there and the tool says so instead of
   pretending. Encoding stays on the user's device.

   Licence: original code written for this site, no third-party code.
   ===================================================================== */
(function (global) {
  'use strict';
  var EWT = global.EWT = global.EWT || {};

  /* ---------- small byte helpers ---------- */
  function u32(n) { return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255]; }
  function u16(n) { return [(n >>> 8) & 255, n & 255]; }
  function str(s) { var a = []; for (var i = 0; i < s.length; i++) a.push(s.charCodeAt(i) & 255); return a; }
  function concat(parts) {
    var n = 0, i; for (i = 0; i < parts.length; i++) n += parts[i].length;
    var out = new Uint8Array(n), o = 0;
    for (i = 0; i < parts.length; i++) { out.set(parts[i], o); o += parts[i].length; }
    return out;
  }
  function box(type, payload) {
    var p = payload instanceof Uint8Array ? payload : new Uint8Array(payload);
    return concat([new Uint8Array(u32(8 + p.length)), new Uint8Array(str(type)), p]);
  }
  function fullBox(type, version, flags, payload) {
    var p = payload instanceof Uint8Array ? payload : new Uint8Array(payload);
    return box(type, concat([new Uint8Array([version, (flags >> 16) & 255, (flags >> 8) & 255, flags & 255]), p]));
  }

  /* ---------- AV1 bitstream helpers ---------- */
  function BitReader(bytes) { this.b = bytes; this.p = 0; }
  BitReader.prototype.bit = function () {
    var byte = this.b[this.p >> 3];
    if (byte === undefined) throw new Error('AV1 sequence header ended early');
    var v = (byte >> (7 - (this.p & 7))) & 1; this.p++; return v;
  };
  BitReader.prototype.bits = function (n) { var v = 0; while (n-- > 0) v = v * 2 + this.bit(); return v; };

  /* Splits a temporal unit into OBUs. Returns [{type, bytes(with header+size), payload}]. */
  function splitObus(d) {
    var obus = [], p = 0;
    while (p < d.length) {
      var start = p, h = d[p++];
      var type = (h >> 3) & 15, ext = (h >> 2) & 1, hasSize = (h >> 1) & 1;
      if (ext) p++;
      var size;
      if (hasSize) {
        size = 0; var shift = 0, b;
        do { b = d[p++]; size += (b & 127) * Math.pow(2, shift); shift += 7; } while (b & 128);
      } else { size = d.length - p; }
      obus.push({ type: type, bytes: d.subarray(start, p + size), payload: d.subarray(p, p + size) });
      p += size;
    }
    return obus;
  }

  /* Reads the fields av1C needs out of the sequence header OBU payload. */
  function parseSequenceHeader(pl) {
    var r = new BitReader(pl), o = {};
    o.profile = r.bits(3);
    var still = r.bit(), reduced = r.bit();
    var level = 0, tier = 0;
    if (reduced) { level = r.bits(5); }
    else {
      var timing = r.bit(), decoderModel = 0, bufLen = 0;
      if (timing) {
        r.bits(32); r.bits(32);
        if (r.bit()) { var lz = 0; while (r.bit() === 0 && lz < 32) lz++; if (lz) r.bits(lz); } // uvlc
        decoderModel = r.bit();
        if (decoderModel) { bufLen = r.bits(5) + 1; r.bits(32); r.bits(5); r.bits(5); }
      }
      var idDelay = r.bit(), cnt = r.bits(5) + 1;
      for (var i = 0; i < cnt; i++) {
        r.bits(12); var lv = r.bits(5), tr = 0; if (lv > 7) tr = r.bit();
        if (i === 0) { level = lv; tier = tr; }
        if (decoderModel) { if (r.bit()) { r.bits(bufLen); r.bits(bufLen); r.bit(); } }
        if (idDelay) { if (r.bit()) r.bits(4); }
      }
    }
    var wb = r.bits(4) + 1, hb = r.bits(4) + 1;
    r.bits(wb); r.bits(hb);
    if (!reduced) { var fid = r.bit(); if (fid) { r.bits(4); r.bits(3); } }
    r.bit(); r.bit(); r.bit(); // use_128x128, filter_intra, intra_edge
    var orderHint = 0;
    if (!reduced) {
      r.bit(); r.bit(); r.bit(); r.bit(); // interintra, masked, warped, dual_filter
      orderHint = r.bit();
      if (orderHint) { r.bit(); r.bit(); }
      var chooseSct = r.bit(), sct = 2;
      if (!chooseSct) sct = r.bit();
      if (sct > 0) { var chooseMv = r.bit(); if (!chooseMv) r.bit(); }
      if (orderHint) r.bits(3);
    }
    r.bit(); r.bit(); r.bit(); // superres, cdef, restoration
    // color_config
    var high = r.bit(), twelve = 0;
    if (o.profile === 2 && high) twelve = r.bit();
    var mono = o.profile === 1 ? 0 : r.bit();
    var cp = 2, tc = 2, mc = 2;
    if (r.bit()) { cp = r.bits(8); tc = r.bits(8); mc = r.bits(8); }
    var range = 0, sx = 1, sy = 1, pos = 0;
    if (mono) { range = r.bit(); sx = 1; sy = 1; }
    else if (cp === 1 && tc === 13 && mc === 0) { range = 1; sx = 0; sy = 0; }
    else {
      range = r.bit();
      if (o.profile === 0) { sx = 1; sy = 1; }
      else if (o.profile === 1) { sx = 0; sy = 0; }
      else { if (high && twelve) { sx = r.bit(); sy = sx ? r.bit() : 0; } else { sx = 1; sy = 0; } }
      if (sx && sy) pos = r.bits(2);
    }
    o.level = level; o.tier = tier; o.high = high; o.twelve = twelve; o.mono = mono; o.sx = sx; o.sy = sy; o.pos = pos;
    o.range = range; o.cp = cp; o.tc = tc; o.mc = mc;
    return o;
  }

  function av1CBox(seq, seqObuBytes) {
    var b0 = 0x81;
    var b1 = (seq.profile << 5) | (seq.level & 31);
    var b2 = (seq.tier << 7) | (seq.high << 6) | (seq.twelve << 5) | (seq.mono << 4) | (seq.sx << 3) | (seq.sy << 2) | (seq.pos & 3);
    return box('av1C', concat([new Uint8Array([b0, b1, b2, 0]), seqObuBytes]));
  }

  /* ---------- WebCodecs encode of one still picture ---------- */
  function levelFor(w, h) {
    var px = w * h;
    // [max picture size, AV1 seq_level_idx]
    var t = [[147456, 0], [278784, 1], [665856, 4], [1065024, 5], [2359296, 8], [8912896, 12], [35651584, 16]];
    for (var i = 0; i < t.length; i++) if (px <= t[i][0]) return t[i][1];
    return 16;
  }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }

  function supported() {
    if (typeof global.VideoEncoder === 'undefined' || typeof global.VideoFrame === 'undefined') return Promise.resolve(false);
    return global.VideoEncoder.isConfigSupported({ codec: 'av01.0.04M.08', width: 64, height: 64, bitrateMode: 'quantizer' })
      .then(function (s) { return !!s.supported; }, function () { return false; });
  }

  /* rgba: Uint8ClampedArray/Uint8Array (w*h*4). Returns {data: Uint8Array (OBUs without temporal delimiter), seq}. */
  function encodeFrame(rgba, w, h, quantizer, speed) {
    return new Promise(function (resolve, reject) {
      var chunks = [], failed = false;
      var codec = 'av01.0.' + pad2(levelFor(w, h)) + 'M.08';
      var cfg = { codec: codec, width: w, height: h, bitrateMode: 'quantizer', latencyMode: speed === 'fast' ? 'realtime' : 'quality' };
      var enc;
      function fail(e) { if (failed) return; failed = true; try { enc && enc.close(); } catch (x) { } reject(e instanceof Error ? e : new Error(String(e))); }
      global.VideoEncoder.isConfigSupported(cfg).then(function (s) {
        if (!s.supported) { fail(new Error('This browser cannot encode AV1 at ' + w + ' × ' + h + ' px.')); return; }
        enc = new global.VideoEncoder({
          output: function (c) { var d = new Uint8Array(c.byteLength); c.copyTo(d); chunks.push(d); },
          error: fail
        });
        enc.configure(cfg);
        var frame = new global.VideoFrame(rgba, {
          format: 'RGBA', codedWidth: w, codedHeight: h, timestamp: 0,
          colorSpace: { primaries: 'bt709', transfer: 'iec61966-2-1', matrix: 'bt709', fullRange: true }
        });
        enc.encode(frame, { keyFrame: true, av1: { quantizer: quantizer } });
        frame.close();
        return enc.flush();
      }).then(function () {
        if (failed) return;
        try { enc.close(); } catch (x) { }
        if (!chunks.length) { fail(new Error('The AV1 encoder returned no data.')); return; }
        var obus = splitObus(concat(chunks)), keep = [], seqObu = null;
        for (var i = 0; i < obus.length; i++) {
          if (obus[i].type === 2) continue; // temporal delimiter is not stored in AVIF items
          if (obus[i].type === 1 && !seqObu) seqObu = obus[i];
          keep.push(obus[i].bytes);
        }
        if (!seqObu) { fail(new Error('The AV1 encoder produced no sequence header.')); return; }
        resolve({ data: concat(keep), seqBytes: seqObu.bytes, seq: parseSequenceHeader(seqObu.payload) });
      }).catch(fail);
    });
  }

  /* ---------- container ---------- */
  function ispe(w, h) { return fullBox('ispe', 0, 0, new Uint8Array(u32(w).concat(u32(h)))); }
  function pixi(channels) {
    var a = [channels]; for (var i = 0; i < channels; i++) a.push(8);
    return fullBox('pixi', 0, 0, new Uint8Array(a));
  }

  function buildAvif(w, h, color, alpha) {
    var hasAlpha = !!alpha;
    var colr = box('colr', concat([new Uint8Array(str('nclx')), new Uint8Array(u16(1).concat(u16(13), u16(1), [0x80]))]));
    var props = [], assoc1 = [], assoc2 = [];
    function addProp(b) { props.push(b); return props.length; } // 1-based index
    var pIspe = addProp(ispe(w, h));
    var pPixi = addProp(pixi(3));
    var pAv1C = addProp(av1CBox(color.seq, color.seqBytes));
    var pColr = addProp(colr);
    assoc1 = [[pIspe, 0], [pPixi, 0], [pAv1C, 1], [pColr, 0]];
    if (hasAlpha) {
      var pPixiA = addProp(pixi(1));
      var pAv1CA = addProp(av1CBox(alpha.seq, alpha.seqBytes));
      var pAux = addProp(fullBox('auxC', 0, 0, concat([new Uint8Array(str('urn:mpeg:mpegB:cicp:systems:auxiliary:alpha')), new Uint8Array([0])])));
      assoc2 = [[pIspe, 0], [pPixiA, 0], [pAv1CA, 1], [pAux, 1]];
    }
    function ipmaEntry(id, list) {
      var a = u16(id); a.push(list.length);
      list.forEach(function (pe) { a.push((pe[1] ? 0x80 : 0) | pe[0]); });
      return a;
    }
    var ipmaBody = u32(hasAlpha ? 2 : 1);
    ipmaBody = ipmaBody.concat(ipmaEntry(1, assoc1));
    if (hasAlpha) ipmaBody = ipmaBody.concat(ipmaEntry(2, assoc2));
    var iprp = box('iprp', concat([box('ipco', concat(props)), fullBox('ipma', 0, 0, new Uint8Array(ipmaBody))]));

    var items = [{ id: 1, data: color.data, alpha: false }];
    if (hasAlpha) items.push({ id: 2, data: alpha.data, alpha: true });

    var infes = items.map(function (it) {
      return fullBox('infe', 2, it.alpha ? 1 : 0, new Uint8Array(u16(it.id).concat(u16(0), str('av01'), [0])));
    });
    var iinf = fullBox('iinf', 0, 0, concat([new Uint8Array(u16(items.length))].concat(infes)));
    var hdlr = fullBox('hdlr', 0, 0, new Uint8Array(u32(0).concat(str('pict'), u32(0), u32(0), u32(0), [0])));
    var pitm = fullBox('pitm', 0, 0, new Uint8Array(u16(1)));
    var iref = hasAlpha ? fullBox('iref', 0, 0, box('auxl', new Uint8Array(u16(2).concat(u16(1), u16(1))))) : new Uint8Array(0);

    function ilocFor(base) {
      var off = base, body = [0x44, 0x00].concat(u16(items.length)); // offset_size=4,length_size=4,base_offset_size=0,reserved
      items.forEach(function (it) {
        body = body.concat(u16(it.id), u16(0), u16(1), u32(off), u32(it.data.length));
        off += it.data.length;
      });
      return fullBox('iloc', 0, 0, new Uint8Array(body));
    }
    var ftyp = box('ftyp', new Uint8Array(str('avif').concat(u32(0), str('avif'), str('mif1'), str('miaf'))));
    function metaWith(base) { return fullBox('meta', 0, 0, concat([hdlr, pitm, ilocFor(base), iinf, iref, iprp])); }
    var metaLen = metaWith(0).length;
    var base = ftyp.length + metaLen + 8; // 8 = mdat header
    var meta = metaWith(base);
    var mdatPayload = concat(items.map(function (it) { return it.data; }));
    var mdat = box('mdat', mdatPayload);
    return concat([ftyp, meta, mdat]);
  }

  /* Public: encode(rgba, w, h, {quality 1..100, speed 'quality'|'fast', alpha: bool}) -> Promise<Blob> */
  function encode(rgba, w, h, opts) {
    opts = opts || {};
    var quality = Math.max(1, Math.min(100, opts.quality == null ? 65 : opts.quality));
    var q = Math.round((100 - quality) * 0.63);
    if (q > 63) q = 63;
    var needAlpha = false;
    if (opts.alpha !== false) { for (var i = 3; i < rgba.length; i += 4) { if (rgba[i] !== 255) { needAlpha = true; break; } } }
    // Colour plane is encoded from opaque pixels (alpha travels separately).
    var colour = new Uint8Array(rgba.length);
    colour.set(rgba);
    for (var j = 3; j < colour.length; j += 4) colour[j] = 255;
    var p = encodeFrame(colour, w, h, q, opts.speed);
    return p.then(function (color) {
      if (!needAlpha) return buildAvif(w, h, color, null);
      var a = new Uint8Array(w * h * 4);
      for (var k = 0, o = 0; k < rgba.length; k += 4, o += 4) { var v = rgba[k + 3]; a[o] = v; a[o + 1] = v; a[o + 2] = v; a[o + 3] = 255; }
      // The alpha plane is coded with a lower quantizer so edges stay clean.
      return encodeFrame(a, w, h, Math.min(q, 20), opts.speed).then(function (al) { return buildAvif(w, h, color, al); });
    }).then(function (bytes) { return { blob: new Blob([bytes], { type: 'image/avif' }), hasAlpha: needAlpha, bytes: bytes.length }; });
  }

  EWT.avif = { supported: supported, encode: encode, _parseSequenceHeader: parseSequenceHeader, _splitObus: splitObus };
})(typeof window !== 'undefined' ? window : globalThis);
