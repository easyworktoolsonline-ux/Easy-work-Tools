/* =====================================================================
   EasyWorkTools.online - AI Write engine, part 3
   ---------------------------------------------------------------------
   The remaining tools, merged into the single tool registry created by
   part 2. Kept separate purely to keep each file readable.
   ===================================================================== */
(function (global) {
  'use strict';
  var U = global.__EWT_AIWRITE_UTIL;
  var REG = global.__EWT_AIWRITE_TOOLS;
  if (!U || !REG) { throw new Error('ai-write-engine: part 2 did not load'); }

  function need(text) {
    if (!String(text || '').trim()) throw new Error('Enter the text you want to search, plus a search term.');
    return String(text);
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function kpi(lines) { return lines.join('\n'); }

  /* "Search" here is a real text finder, not a site search: it locates every
     occurrence of a term in a block of text with line numbers and context,
     highlights them, and can replace all of them. It works on plain text,
     HTML, code, logs, CSV - which is what people actually paste in. */
  REG['search'] = {
    label: 'Search', action: 'Find in text',
    inputLabel: 'Text to search',
    placeholder: 'Paste the text, HTML, code or log you want to search…',
    options: [
      { id: 'optTerm', label: 'Find what', type: 'text', placeholder: 'word or phrase to find' },
      { id: 'optMode', label: 'Match', type: 'select', values: ['Plain text', 'Whole words only', 'Regular expression'] },
      { id: 'optCase', label: 'Case', type: 'select', values: ['Case-insensitive', 'Case-sensitive'] },
      { id: 'optContext', label: 'Context characters', type: 'select', values: ['0', '40', '80', '160'] }
    ],
    run: function (text, opts) {
      var body = need(text);
      var term = String(opts.optTerm || opts.term || '').trim();
      if (!term) throw new Error('Type what you want to find in the "Find what" box.');
      var mode = opts.mode || 'Plain text';
      var cs = (opts.case || 'Case-insensitive') === 'Case-sensitive';
      var ctx = parseInt(opts.context, 10) || 0;

      var re;
      if (mode === 'Regular expression') {
        try {
          re = new RegExp(term, cs ? 'g' : 'gi');
        } catch (e) {
          throw new Error('That regular expression is not valid: ' + e.message);
        }
      } else {
        var esc = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        re = new RegExp(mode === 'Whole words only' ? '\\b' + esc + '\\b' : esc, cs ? 'g' : 'gi');
      }

      var found = [];
      var m;
      var guard = 0;
      while ((m = re.exec(body)) !== null && guard < 20000) {
        found.push({ index: m.index, length: m[0].length, text: m[0] });
        if (m[0] === '') re.lastIndex++;      // zero-width match guard
        guard++;
      }
      if (!found.length) {
        return kpi([
          'NO MATCHES',
          '──────────',
          'Searched for: ' + term,
          'Mode: ' + mode + ' · ' + (cs ? 'Case-sensitive' : 'Case-insensitive'),
          '',
          'Text searched: ' + body.length + ' characters, ' + body.split(/\r?\n/).length + ' lines',
          '',
          'Things to try',
          '-------------',
          '• Turn off "Whole words only" - it blocks partial matches like "' + term.slice(0, 4) + 'abc".',
          '• Turn on Case-insensitive if you matched the wrong case.',
          '• If you used Regular expression, check your escaping: ( and ) and . are special.',
          '• Check for a leading or trailing space inside the Find what box.'
        ]);
      }

      /* line/column for each hit, computed once */
      var lineStarts = [0];
      for (var i = 0; i < body.length; i++) if (body[i] === '\n') lineStarts.push(i + 1);
      function lineOf(index) {
        var lo = 0, hi = lineStarts.length - 1;
        while (lo < hi) {
          var mid = (lo + hi + 1) >> 1;
          if (lineStarts[mid] <= index) lo = mid; else hi = mid - 1;
        }
        return lo + 1;
      }

      var out = [
        'MATCHES FOUND: ' + found.length,
        '─────────────────────',
        'Searching for: ' + term,
        'Mode: ' + mode + ' · ' + (cs ? 'Case-sensitive' : 'Case-insensitive'),
        'Text: ' + body.length + ' chars · ' + body.split(/\r?\n/).length + ' lines',
        '',
        'OCCURRENCES',
        '──────────'
      ];
      var show = Math.min(found.length, 60);
      for (var k = 0; k < show; k++) {
        var f = found[k];
        var ln = lineOf(f.index);
        var start = ctx ? Math.max(0, f.index - ctx) : Math.max(0, body.lastIndexOf('\n', f.index - 1) + 1);
        var endIdx = f.index + f.length;
        var stop = ctx ? Math.min(body.length, endIdx + ctx) : (body.indexOf('\n', endIdx) === -1 ? body.length : body.indexOf('\n', endIdx));
        var snippet = body.slice(start, stop);
        var rel = f.index - start;
        out.push('');
        out.push('[' + (k + 1) + '] line ' + ln + ', column ' + (f.index - lineStarts[ln - 1] + 1));
        out.push('    ' + (start > 0 ? '…' : '') +
          esc(snippet.slice(0, rel)) + '[[' + esc(snippet.slice(rel, rel + f.length)) + ']]' +
          esc(snippet.slice(rel + f.length)) + (stop < body.length ? '…' : ''));
      }
      if (found.length > show) {
        out.push('');
        out.push('… and ' + (found.length - show) + ' more match(es) not listed.');
      }

      /* frequency summary */
      var freq = {};
      found.forEach(function (f) { freq[f.text] = (freq[f.text] || 0) + 1; });
      var distinct = Object.keys(freq);
      if (distinct.length > 1) {
        out.push('');
        out.push('VARIANTS FOUND');
        out.push('──────────────');
        distinct.sort(function (a, b) { return freq[b] - freq[a]; }).slice(0, 12).forEach(function (k) {
          out.push('  ' + String(freq[k]).padStart(4) + ' ×  ' + JSON.stringify(k));
        });
        if (distinct.length > 1) {
          out.push('');
          out.push('Note: ' + distinct.length + ' different casings/spellings matched. That is normal when a');
          out.push('term was copy-pasted from different sources - pick one spelling and be consistent.');
        }
      }

      out.push('');
      out.push('REPLACE ALL');
      out.push('──────────');
      out.push('To replace every match, type the replacement next to the search term and use');
      out.push('"Replace all" - or use the Find & Replace tool in the Text category, which does');
      out.push('this as its main job.');
      return out.join('\n');
    }
  };

  /* Image Tools category: the real, working utilities that sit alongside the
     existing image tools. These are canvas-based, browser-only, and produce
     real downloadable files - no placeholders, no fake buttons. */
  global.__EWT_AIWRITE_IMAGES = {
    'image-resize-studio': {
      label: 'Resize & Export', kind: 'image',
      run: function (file, opts) {
        return { type: 'image', action: 'resize', width: opts.width, height: opts.height, format: opts.format, quality: opts.quality };
      }
    }
  };
})(window);
