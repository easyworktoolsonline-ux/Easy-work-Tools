/* =====================================================================
   EasyWorkTools.online - chart renderer for the Chart Maker (browser, canvas)

   EWT.chart.parse(text)  -> {labels, series:[{name, values}], error?}
   EWT.chart.draw(ctx, W, H, cfg, data)  draws one chart onto a 2D context
     cfg: {type: bar|hbar|line|area|pie|doughnut, title, xTitle, yTitle,
           legend: none|top|bottom|right, values: bool, grid: bool, stacked: bool,
           smooth: bool, markers: bool, palette: key, bg: 'white'|'transparent'|'dark',
           fontScale: number, zeroBase: bool}

   Original code written for this site; no third-party code.
   ===================================================================== */
(function (global) {
  'use strict';
  var EWT = global.EWT = global.EWT || {};

  var PALETTES = {
    classic: ['#2563eb', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#64748b'],
    pastel:  ['#93c5fd', '#fcd34d', '#86efac', '#fca5a5', '#c4b5fd', '#67e8f9', '#fdba74', '#bef264', '#f9a8d4', '#cbd5e1'],
    ocean:   ['#0b3d91', '#1d6fd1', '#3aa0e8', '#74c5f2', '#0e7490', '#14b8a6', '#5eead4', '#94a3b8', '#334155', '#a5f3fc'],
    sunset:  ['#7c2d12', '#c2410c', '#f97316', '#fbbf24', '#be123c', '#e11d48', '#fb7185', '#a21caf', '#6b21a8', '#fde68a'],
    mono:    ['#111827', '#374151', '#4b5563', '#6b7280', '#9ca3af', '#d1d5db', '#1f2937', '#525d6e', '#8b95a5', '#e5e7eb'],
  };

  /* ---------------- parsing ---------------- */
  function splitLine(line, d) {
    var out = [], cur = '', q = false;
    for (var i = 0; i < line.length; i++) {
      var c = line[i];
      if (q) { if (c === '"') { if (line[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; }
      else if (c === '"') q = true;
      else if (c === d) { out.push(cur); cur = ''; }
      else cur += c;
    }
    out.push(cur);
    return out.map(function (s) { return s.trim(); });
  }
  function toNum(s) {
    if (s === '' || s == null) return NaN;
    var t = String(s).replace(/[\s$€£,]/g, '');
    var pct = /%$/.test(t); if (pct) t = t.slice(0, -1);
    if (!/^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(t)) return NaN;
    return parseFloat(t);
  }
  function parse(text) {
    var lines = String(text || '').split(/\r?\n/).filter(function (l) { return l.trim() !== ''; });
    if (!lines.length) return { error: 'Add some data first: one label and at least one number per row.' };
    var d = ','; var first = lines[0];
    if (first.indexOf('\t') >= 0) d = '\t'; else if (first.indexOf(';') >= 0 && first.indexOf(',') < 0) d = ';';
    var rows = lines.map(function (l) { return splitLine(l, d); });
    var width = Math.max.apply(null, rows.map(function (r) { return r.length; }));
    if (width < 2) return { error: 'Each row needs a label and a number, separated by a comma, tab or semicolon (for example: January, 120).' };
    var hasHeader = rows.length > 1 && rows[0].slice(1).some(function (c) { return c !== '' && isNaN(toNum(c)); });
    var header = hasHeader ? rows[0] : null, body = hasHeader ? rows.slice(1) : rows;
    if (!body.length) return { error: 'There are no data rows below the header.' };
    if (body.length > 200) return { error: 'Too many rows (' + body.length + '). A chart can show at most 200 categories.' };
    var nser = width - 1;
    if (nser > 10) return { error: 'Too many columns: a chart can show at most 10 series.' };
    var series = [];
    for (var s = 0; s < nser; s++) series.push({ name: header && header[s + 1] ? header[s + 1] : (nser === 1 ? 'Value' : 'Series ' + (s + 1)), values: [] });
    var labels = [];
    for (var r = 0; r < body.length; r++) {
      labels.push(body[r][0] === '' || body[r][0] == null ? String(r + 1) : body[r][0]);
      for (var c = 0; c < nser; c++) {
        var raw = body[r][c + 1];
        var n = toNum(raw);
        if (isNaN(n)) {
          var rn = r + 1 + (hasHeader ? 1 : 0);
          return { error: (raw === '' || raw == null ? 'Row ' + rn + ', column ' + (c + 2) + ' is empty.' : 'Row ' + rn + ', column ' + (c + 2) + ' (“' + raw + '”) is not a number.') + ' Every value after the label must be a number.' };
        }
        series[c].values.push(n);
      }
    }
    return { labels: labels, series: series };
  }

  /* ---------------- helpers ---------------- */
  function niceStep(range, target) {
    var raw = range / Math.max(1, target), p = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / p;
    return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * p;
  }
  function niceScale(min, max, target) {
    if (min === max) { if (max === 0) { max = 1; } else { min = Math.min(0, min); max = Math.max(0, max); } }
    var step = niceStep(max - min, target);
    return { min: Math.floor(min / step + 1e-9) * step, max: Math.ceil(max / step - 1e-9) * step, step: step };
  }
  function fmt(v, step) {
    var dec = 0; if (step && step < 1) dec = Math.min(6, Math.ceil(-Math.log10(step)));
    var a = Math.abs(v);
    if (a >= 1e9) return (v / 1e9).toFixed(a >= 1e10 ? 0 : 1).replace(/\.0$/, '') + 'B';
    if (a >= 1e6) return (v / 1e6).toFixed(a >= 1e7 ? 0 : 1).replace(/\.0$/, '') + 'M';
    return v.toLocaleString('en-US', { maximumFractionDigits: Math.max(dec, a < 100 && v % 1 !== 0 ? 2 : 0) });
  }
  function fmtFull(v) { return v.toLocaleString('en-US', { maximumFractionDigits: 2 }); }
  function ellipsize(ctx, text, maxW) {
    if (ctx.measureText(text).width <= maxW) return text;
    var t = text; while (t.length > 1 && ctx.measureText(t + '…').width > maxW) t = t.slice(0, -1);
    return t + '…';
  }
  function colorAt(pal, i) { return pal[i % pal.length]; }
  function themeOf(bg) {
    if (bg === 'dark') return { bg: '#0f172a', text: '#e2e8f0', sub: '#94a3b8', grid: 'rgba(148,163,184,.25)', axis: '#64748b' };
    return { bg: bg === 'transparent' ? null : '#ffffff', text: '#111827', sub: '#4b5563', grid: 'rgba(100,116,139,.22)', axis: '#6b7280' };
  }

  /* ---------------- drawing ---------------- */
  function draw(ctx, W, H, cfg, data) {
    var th = themeOf(cfg.bg), fs = 14 * (cfg.fontScale || 1) * Math.max(0.7, Math.min(1.6, Math.min(W, H) / 700));
    var pal = PALETTES[cfg.palette] || PALETTES.classic, FONT = '"Plus Jakarta Sans", system-ui, -apple-system, "Segoe UI", Arial, sans-serif';
    ctx.save();
    ctx.clearRect(0, 0, W, H);
    if (th.bg) { ctx.fillStyle = th.bg; ctx.fillRect(0, 0, W, H); }
    ctx.textBaseline = 'alphabetic';
    var pad = fs * 1.4, top = pad, left = pad, right = W - pad, bottom = H - pad;
    var isPie = cfg.type === 'pie' || cfg.type === 'doughnut';
    var series = isPie ? [data.series[0]] : data.series, n = data.labels.length;

    /* title */
    if (cfg.title) {
      ctx.font = '800 ' + (fs * 1.45) + 'px ' + FONT; ctx.fillStyle = th.text; ctx.textAlign = 'center';
      ctx.fillText(ellipsize(ctx, cfg.title, W - pad * 2), W / 2, top + fs * 1.2);
      top += fs * 2.4;
    }
    /* legend items */
    var items = isPie ? data.labels.map(function (l, i) { return { name: l, color: colorAt(pal, i) }; })
      : series.map(function (s, i) { return { name: s.name, color: colorAt(pal, i) }; });
    var showLegend = cfg.legend && cfg.legend !== 'none' && (isPie || series.length > 1 || cfg.legend === 'force');
    if (showLegend && items.length > 24) items = items.slice(0, 24);
    var lgFont = '600 ' + fs * 0.95 + 'px ' + FONT;
    if (showLegend) {
      ctx.font = lgFont;
      var sw = fs * 0.9, gap = fs * 0.5, itemH = fs * 1.5;
      if (cfg.legend === 'right') {
        var maxw = 0; items.forEach(function (it) { maxw = Math.max(maxw, ctx.measureText(it.name).width); });
        maxw = Math.min(maxw, W * 0.28);
        var lx = right - (maxw + sw + gap), ly = top + fs * 0.5;
        ctx.textAlign = 'left';
        items.forEach(function (it, i) {
          var y = ly + i * itemH; if (y > bottom - itemH * 0.5) return;
          ctx.fillStyle = it.color; ctx.fillRect(lx, y - sw * 0.85, sw, sw);
          ctx.fillStyle = th.text; ctx.fillText(ellipsize(ctx, it.name, maxw), lx + sw + gap, y);
        });
        right = lx - fs * 1.2;
      } else {
        var rowsL = [[]], rw = 0, avail = W - pad * 2;
        items.forEach(function (it) {
          var w = sw + gap + Math.min(ctx.measureText(it.name).width, avail * 0.45) + fs * 1.2;
          if (rw + w > avail && rowsL[rowsL.length - 1].length) { rowsL.push([]); rw = 0; }
          rowsL[rowsL.length - 1].push({ it: it, w: w }); rw += w;
        });
        var hh = rowsL.length * itemH, y0 = cfg.legend === 'top' ? top + fs * 0.6 : bottom - hh + itemH * 0.75;
        ctx.textAlign = 'left';
        rowsL.forEach(function (row, ri) {
          var tw = row.reduce(function (a, r) { return a + r.w; }, 0) - fs * 1.2, x = (W - tw) / 2, y = y0 + ri * itemH;
          row.forEach(function (r) {
            ctx.fillStyle = r.it.color; ctx.fillRect(x, y - sw * 0.85, sw, sw);
            ctx.fillStyle = th.text; ctx.fillText(ellipsize(ctx, r.it.name, avail * 0.45), x + sw + gap, y); x += r.w;
          });
        });
        if (cfg.legend === 'top') top += hh + fs * 0.8; else bottom -= hh + fs * 0.4;
      }
    }

    if (isPie) {
      var vals = series[0].values, total = vals.reduce(function (a, b) { return a + b; }, 0);
      var cx = (left + right) / 2, cy = (top + bottom) / 2, R = Math.max(10, Math.min(right - left, bottom - top) / 2 - (cfg.values ? fs * 2.2 : fs * 0.5));
      var inner = cfg.type === 'doughnut' ? R * 0.55 : 0, a0 = -Math.PI / 2;
      vals.forEach(function (v, i) {
        var frac = total ? v / total : 0, a1 = a0 + frac * Math.PI * 2;
        ctx.beginPath(); ctx.moveTo(cx + Math.cos(a0) * inner, cy + Math.sin(a0) * inner);
        ctx.arc(cx, cy, R, a0, a1); ctx.arc(cx, cy, inner, a1, a0, true); ctx.closePath();
        ctx.fillStyle = colorAt(pal, i); ctx.fill();
        ctx.lineWidth = Math.max(1, fs * 0.12); ctx.strokeStyle = th.bg || '#ffffff'; ctx.stroke();
        if (cfg.values && frac > 0.015) {
          var am = (a0 + a1) / 2, rr = inner ? (R + inner) / 2 : R * 0.68;
          var inside = frac >= 0.06, tx = cx + Math.cos(am) * (inside ? rr : R + fs * 1.1), ty = cy + Math.sin(am) * (inside ? rr : R + fs * 1.1);
          ctx.font = '700 ' + fs * 0.9 + 'px ' + FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillStyle = inside ? '#ffffff' : th.text;
          if (inside) { ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 3; }
          ctx.fillText((frac * 100).toFixed(frac < 0.1 ? 1 : 0) + '%', tx, ty); ctx.shadowBlur = 0; ctx.textBaseline = 'alphabetic';
        }
        a0 = a1;
      });
      ctx.restore(); return;
    }

    /* axes charts */
    var horizontal = cfg.type === 'hbar', stacked = !!cfg.stacked && (cfg.type === 'bar' || cfg.type === 'hbar' || cfg.type === 'area');
    var minV = Infinity, maxV = -Infinity;
    if (stacked) {
      for (var i = 0; i < n; i++) { var pos = 0, neg = 0; series.forEach(function (s) { var v = s.values[i]; if (v >= 0) pos += v; else neg += v; }); maxV = Math.max(maxV, pos); minV = Math.min(minV, neg); }
    } else series.forEach(function (s) { s.values.forEach(function (v) { if (v < minV) minV = v; if (v > maxV) maxV = v; }); });
    if (cfg.type === 'bar' || cfg.type === 'hbar' || cfg.type === 'area' || cfg.zeroBase) { minV = Math.min(minV, 0); maxV = Math.max(maxV, 0); }
    var availAxis = (horizontal ? right - left : bottom - top);
    var sc = niceScale(minV, maxV, Math.max(3, Math.min(8, Math.round(availAxis / (fs * 4.5)))));
    var ticks = []; for (var t = sc.min; t <= sc.max + sc.step * 1e-6; t += sc.step) ticks.push(Math.abs(t) < sc.step * 1e-9 ? 0 : t);

    ctx.font = '500 ' + fs * 0.9 + 'px ' + FONT;
    var tickLabels = ticks.map(function (v) { return fmt(v, sc.step); });
    var tickW = Math.max.apply(null, tickLabels.map(function (s) { return ctx.measureText(s).width; }));
    var catMaxW = Math.max.apply(null, data.labels.map(function (s) { return ctx.measureText(s).width; }));
    if (cfg.yTitle) { left += fs * 1.6; }
    if (cfg.xTitle) { bottom -= fs * 1.8; }
    var plotL, plotR, plotT, plotB, rot = 0;
    if (!horizontal) {
      plotL = left + tickW + fs * 0.9; plotR = right - fs * 0.5; plotT = top + fs * 0.8;
      var bandW0 = (plotR - plotL) / n;
      rot = catMaxW > bandW0 * 0.92 ? (n > 14 || catMaxW > bandW0 * 2.5 ? -Math.PI / 2 : -Math.PI / 4) : 0;
      var catH = rot === 0 ? fs * 1.6 : Math.min(catMaxW * Math.abs(Math.sin(rot)) + fs * 0.8, (bottom - top) * 0.35);
      plotB = bottom - catH;
    } else {
      plotL = left + Math.min(catMaxW, (right - left) * 0.3) + fs * 0.9; plotR = right - fs * 1.5; plotT = top + fs * 0.4; plotB = bottom - fs * 1.8;
    }
    if (plotR - plotL < 40 || plotB - plotT < 40) { ctx.restore(); throw new Error('The chart is too small for this much data. Increase the image size or remove the legend.'); }
    var span = sc.max - sc.min || 1;
    function vy(v) { return plotB - (v - sc.min) / span * (plotB - plotT); }
    function vx(v) { return plotL + (v - sc.min) / span * (plotR - plotL); }

    /* grid + value axis */
    ctx.lineWidth = Math.max(1, fs * 0.07); ctx.textAlign = horizontal ? 'center' : 'right';
    ticks.forEach(function (v, i) {
      if (horizontal) {
        var x = vx(v);
        if (cfg.grid) { ctx.strokeStyle = th.grid; ctx.beginPath(); ctx.moveTo(x, plotT); ctx.lineTo(x, plotB); ctx.stroke(); }
        ctx.fillStyle = th.sub; ctx.font = '500 ' + fs * 0.9 + 'px ' + FONT; ctx.fillText(tickLabels[i], x, plotB + fs * 1.3);
      } else {
        var y = vy(v);
        if (cfg.grid) { ctx.strokeStyle = th.grid; ctx.beginPath(); ctx.moveTo(plotL, y); ctx.lineTo(plotR, y); ctx.stroke(); }
        ctx.fillStyle = th.sub; ctx.font = '500 ' + fs * 0.9 + 'px ' + FONT; ctx.fillText(tickLabels[i], plotL - fs * 0.6, y + fs * 0.32);
      }
    });
    /* category positions */
    var band = horizontal ? (plotB - plotT) / n : (plotR - plotL) / n;
    function cpos(i) { return (horizontal ? plotT : plotL) + band * (i + 0.5); }
    /* zero line */
    ctx.strokeStyle = th.axis; ctx.lineWidth = Math.max(1, fs * 0.1);
    ctx.beginPath();
    if (horizontal) { ctx.moveTo(vx(0), plotT); ctx.lineTo(vx(0), plotB); } else { ctx.moveTo(plotL, vy(0)); ctx.lineTo(plotR, vy(0)); }
    ctx.stroke();
    /* category labels */
    ctx.fillStyle = th.sub; ctx.font = '500 ' + fs * 0.9 + 'px ' + FONT;
    var skip = 1; if (!horizontal && rot === 0) { skip = 1; } else if (!horizontal) { skip = Math.max(1, Math.ceil(fs * 1.1 / (band * Math.abs(Math.sin(rot) || 1)))); } else { skip = Math.max(1, Math.ceil(fs * 1.3 / band)); }
    data.labels.forEach(function (lab, i) {
      if (i % skip) return;
      if (horizontal) { ctx.textAlign = 'right'; ctx.fillText(ellipsize(ctx, lab, plotL - left - fs * 0.9), plotL - fs * 0.6, cpos(i) + fs * 0.3); }
      else if (rot === 0) { ctx.textAlign = 'center'; ctx.fillText(ellipsize(ctx, lab, band * 0.95), cpos(i), plotB + fs * 1.35); }
      else { ctx.save(); ctx.translate(cpos(i), plotB + fs * 0.9); ctx.rotate(rot); ctx.textAlign = 'right'; ctx.fillText(ellipsize(ctx, lab, (bottom - plotB) / Math.abs(Math.sin(rot)) - fs * 0.5), 0, 0); ctx.restore(); }
    });
    /* axis titles */
    ctx.fillStyle = th.text; ctx.font = '700 ' + fs * 0.95 + 'px ' + FONT; ctx.textAlign = 'center';
    var xT = horizontal ? cfg.yTitle : cfg.xTitle, yT = horizontal ? cfg.xTitle : cfg.yTitle;
    if (xT) ctx.fillText(ellipsize(ctx, xT, plotR - plotL), (plotL + plotR) / 2, H - pad * 0.55 - (showLegend && cfg.legend === 'bottom' ? (bottom + (cfg.xTitle ? fs * 1.8 : 0) < H - pad ? 0 : 0) : 0) - (showLegend && cfg.legend === 'bottom' ? 0 : 0) + 0);
    if (yT) { ctx.save(); ctx.translate(pad * 0.9 + fs * 0.5, (plotT + plotB) / 2); ctx.rotate(-Math.PI / 2); ctx.fillText(ellipsize(ctx, yT, plotB - plotT), 0, 0); ctx.restore(); }

    /* series */
    var ns = series.length;
    if (cfg.type === 'bar' || cfg.type === 'hbar') {
      var groupW = band * 0.78, barW = stacked ? groupW : groupW / ns;
      for (var ci = 0; ci < n; ci++) {
        var posAcc = 0, negAcc = 0;
        series.forEach(function (s, si) {
          var v = s.values[ci], c0 = cpos(ci) - groupW / 2 + (stacked ? 0 : si * barW), from, to;
          if (stacked) { if (v >= 0) { from = posAcc; posAcc += v; to = posAcc; } else { from = negAcc; negAcc += v; to = negAcc; } }
          else { from = 0; to = v; }
          ctx.fillStyle = colorAt(pal, si);
          if (horizontal) { var x0 = vx(from), x1 = vx(to); ctx.fillRect(Math.min(x0, x1), c0, Math.abs(x1 - x0), barW - (stacked ? 0 : 1)); }
          else { var y0 = vy(from), y1 = vy(to); ctx.fillRect(c0, Math.min(y0, y1), barW - (stacked ? 0 : 1), Math.abs(y1 - y0)); }
          if (cfg.values && (!stacked || Math.abs(to - from) > span * 0.05)) {
            ctx.font = '700 ' + fs * 0.8 + 'px ' + FONT; ctx.fillStyle = stacked ? '#ffffff' : th.text;
            var label = fmtFull(v);
            if (horizontal) { var xe = vx(to); ctx.textAlign = stacked ? 'center' : (v >= 0 ? 'left' : 'right'); ctx.fillText(label, stacked ? (vx(from) + xe) / 2 : xe + (v >= 0 ? fs * 0.3 : -fs * 0.3), c0 + barW / 2 + fs * 0.28); }
            else { var ye = vy(to); ctx.textAlign = 'center'; ctx.fillText(label, c0 + (barW - 1) / 2, stacked ? (vy(from) + ye) / 2 + fs * 0.28 : (v >= 0 ? ye - fs * 0.35 : ye + fs * 0.95)); }
          }
        });
      }
    } else if (cfg.type === 'line' || cfg.type === 'area') {
      var cum = new Array(n).fill(0);
      series.forEach(function (s, si) {
        var pts = s.values.map(function (v, i) { var base = stacked ? cum[i] : 0, top2 = stacked ? cum[i] + v : v; return { x: cpos(i), y: vy(top2), y0: vy(base), v: v }; });
        if (stacked) s.values.forEach(function (v, i) { cum[i] += v; });
        var col = colorAt(pal, si);
        function path(close) {
          ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
          for (var i = 1; i < pts.length; i++) {
            if (cfg.smooth && pts.length > 2) {
              var p0 = pts[i - 2] || pts[i - 1], p1 = pts[i - 1], p2 = pts[i], p3 = pts[i + 1] || p2, t = 0.2;
              ctx.bezierCurveTo(p1.x + (p2.x - p0.x) * t, p1.y + (p2.y - p0.y) * t, p2.x - (p3.x - p1.x) * t, p2.y - (p3.y - p1.y) * t, p2.x, p2.y);
            } else ctx.lineTo(pts[i].x, pts[i].y);
          }
        }
        if (cfg.type === 'area') {
          path(); ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y0);
          for (var k = pts.length - 1; k >= 0; k--) ctx.lineTo(pts[k].x, pts[k].y0);
          ctx.closePath(); ctx.globalAlpha = stacked ? 0.9 : 0.28; ctx.fillStyle = col; ctx.fill(); ctx.globalAlpha = 1;
        }
        path(); ctx.lineWidth = Math.max(2, fs * 0.2); ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.strokeStyle = col; ctx.stroke();
        if (cfg.markers) pts.forEach(function (pt) { ctx.beginPath(); ctx.arc(pt.x, pt.y, fs * 0.32, 0, Math.PI * 2); ctx.fillStyle = th.bg || '#ffffff'; ctx.fill(); ctx.lineWidth = Math.max(1.5, fs * 0.14); ctx.strokeStyle = col; ctx.stroke(); });
        if (cfg.values) { ctx.font = '700 ' + fs * 0.8 + 'px ' + FONT; ctx.fillStyle = th.text; ctx.textAlign = 'center'; pts.forEach(function (pt) { ctx.fillText(fmtFull(pt.v), pt.x, pt.y - fs * 0.7); }); }
      });
    }
    ctx.restore();
  }

  EWT.chart = { parse: parse, draw: draw, PALETTES: PALETTES };
})(typeof window !== 'undefined' ? window : globalThis);
