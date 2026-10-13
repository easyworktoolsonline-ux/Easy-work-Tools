/* ======================================================================
 * previews-image-pdf-seo.mjs - preview configuration for the image, PDF, SEO,
 * utility and calculator tools.
 *
 * Imported by scripts/add-previews.mjs and merged into its PREVIEWS table.
 * Split into its own module only because these adapters are long and it keeps
 * the generator readable; the contract is identical to the table in
 * add-previews.mjs - { heading, sub, variant, cards, adapter }.
 *
 * THE RULE
 * Every adapter reads the node the tool already writes to. Sizes shown are the
 * ones the tool reports, canvases are read with toDataURL from the exact pixels
 * it will export, and nothing is invented. If the tool has produced nothing the
 * preview shows its empty state.
 * ====================================================================== */

/* ------------------------------------------------------- shared adapters --- */

/* An image tool that draws its result onto one canvas. */
const canvas = (canvasId, extra) => `
      pv.bind('#${canvasId}', function (cv) {
        if (!cv || !cv.width || !cv.height) return null;
        ${extra || ''}
        return { kind:'image', label:'Your result', src:cv,
                 w:cv.width, h:cv.height, fit:'contain' };
      });`;

/* Two canvases side by side: the input as loaded and the output as produced,
   with the byte sizes the tool reports for each. */
const beforeAfter = (aId, bId, origId, compId, savedId) => `
      pv.bind('#${aId}', function (a) {
        var b = document.getElementById('${bId}');
        if (!a || !a.width || !b || !b.width) return null;
        function t(id) { var n = document.getElementById(id); return n ? (n.textContent || '').trim() : ''; }
        var o = t('${origId}'), c = t('${compId}'), s = t('${savedId}');
        return { kind:'image', label:'Before and after', fit:'contain',
          cells:[
            { label:'Before', src:a, w:a.width, h:a.height, detail:o },
            { label:'After',  src:b, w:b.width, h:b.height, detail:c }
          ],
          sub:[o ? 'original ' + o : '', c ? 'compressed ' + c : '', s ? 'saved ' + s : '']
                .filter(Boolean).join(' · ') };
      });`;

/* Read a set of sibling elements as label/value rows. Falls back to parsing
   "Label: value" lines when the tool renders them as text instead. */
const rowsFrom = (bindId, pairs, hideId) => `
      function pvRows() {
        var rows = [];
        var pairs = ${JSON.stringify(pairs)};
        pairs.forEach(function (pr) {
          var n = document.getElementById(pr[0]); if (!n) return;
          var v = (n.value !== undefined ? n.value : n.innerText || '').trim();
          if (v && v !== '\\u2014' && v !== '-' && v !== '0 B') rows.push({ k:pr[1], v:v });
        });
        if (rows.length) return rows;
        /* fallback: a table this tool rendered */
        var msg = '';
        ['densityBody','metaTable','hdrTable','sigTable'].some(function (tid) {
          var b = document.getElementById(tid); if (!b) return false;
          [].slice.call(b.querySelectorAll('tr')).forEach(function (tr) {
            var c = [].slice.call(tr.querySelectorAll('th,td')).map(function (x) {
              return (x.textContent || '').trim();
            });
            if (c.length >= 2) rows.push({ k:c[0], v:c[1] });
            else if (c.length === 1 && c[0]) msg = c[0];
          });
          return rows.length > 0;
        });
        /* A tool that found nothing says so - "No EXIF metadata was found in this
           file". That IS its real output, and showing it is more honest than an
           empty panel that reads as a broken preview. */
        if (!rows.length && msg) rows.push({ k:'Result', v:msg.slice(0, 120) });
        return rows;
      }
      pv.bind('${bindId}', function (el) {
        ${hideId ? "var h = document.getElementById('" + hideId + "'); if (h && h.style.display === 'none') return null;" : ''}
        var rows = pvRows();
        if (!rows.length) return null;
        return { kind:'stats', rows:rows, label:'This tool reads', sub:'Live' };
      });`;

/* =============================================================== IMAGE === */

export const IMAGE = {

  'image-editor': {
    heading: 'Edited image',
    sub: 'The image exactly as this tool has edited it, at the filter settings you have chosen.',
    variant: 'image',
    cards: [{ title: 'Edited result', badge: 'live' }],
    adapter: canvas('previewCanvas')
  },

  'image-background-color': {
    heading: 'New background',
    sub: 'The image with the background colour applied, exactly as this tool composites it.',
    variant: 'image',
    cards: [{ title: 'Result', badge: 'live' }],
    adapter: canvas('previewCanvas')
  },

  'image-border-rounded': {
    heading: 'Border and corners',
    sub: 'The image with the border and corner radius applied, at the values you set.',
    variant: 'image',
    cards: [{ title: 'Result', badge: 'live' }],
    adapter: canvas('previewCanvas')
  },

  'image-watermark': {
    heading: 'Watermarked image',
    sub: 'The image exactly as this tool watermarks it, at the size, rotation and opacity you chose.',
    variant: 'image',
    cards: [{ title: 'Result', badge: 'live' }],
    adapter: canvas('previewCanvas')
  },

  'image-color-picker': {
    heading: 'Colours in your image',
    sub: 'Your image with the swatches this tool picked out of it, and the values it read from each.',
    variant: 'image',
    cards: [{ title: 'Your image', badge: 'live' }, { title: 'Picked colours', badge: 'sampled' }],
    adapter: `
      pv.bind('#previewCanvas', function (cv) {
        if (!cv || !cv.width) return null;
        /* #pickedValues is the element the tool actually fills - it renders each
           swatch's HEX, RGB and HSL. #hexVal and #rgbVal stay empty until Extract
           is pressed, so reading those showed an empty card on upload. */
        var box = document.getElementById('pickedValues');
        var t = box ? (box.innerText || '').trim() : '';
        var rows = [];
        t.split(String.fromCharCode(10)).forEach(function (line) {
          var s = line.trim();
          if (!s || s === 'Copy') return;
          var m = /^(#[0-9A-Fa-f]{3,8})$/.exec(s) ? { k:'Hex', v:s.toUpperCase() }
                 : /^RGB\\(([^)]+)\\)$/i.exec(s) ? { k:'RGB', v:s }
                 : /^HSL\\(([^)]+)\\)$/i.exec(s) ? { k:'HSL', v:s }
                 : null;
          if (m) rows.push(m);
        });
        if (!rows.length) rows.push({ k:'Sampled', v:'None yet — press Extract' });
        return { kind:'image', label:'Your image', fit:'contain',
          cells:[
            { label:'Your image', src:cv, w:cv.width, h:cv.height },
            { rows:rows, label:'Picked', sub:cv.width + ' × ' + cv.height }
          ] };
      });`
  },

  'image-crop-rotate': {
    heading: 'Cropped and rotated',
    sub: 'The image exactly as this tool crops and rotates it, at the ratio and angle you chose.',
    variant: 'image',
    cards: [{ title: 'Result', badge: 'live' }],
    adapter: canvas('workCanvas')
  },

  'social-image-resizer': {
    heading: 'Social card sizes',
    sub: 'Your image at each of the social card sizes this tool can export, all cropped from the same original.',
    variant: 'image',
    cards: [
      { title: 'Original', badge: 'source' },
      { title: 'Landscape', badge: '1.91:1', ratio: '1.91/1' },
      { title: 'Square', badge: '1:1', ratio: '1/1' },
      { title: 'Story', badge: '9:16', ratio: '9/16' }
    ],
    adapter: `
      pv.bind('#workCanvas', function (cv) {
        if (!cv || !cv.width) return null;
        /* The crops are really drawn, not just framed. object-fit:cover on an
           uncropped copy produced four identical pictures, because the canvas
           carried no aspect ratio to crop against - so the one thing this preview
           exists to show was invisible. Each target is rendered to its own canvas
           with cover maths, which is also what the tool does when it exports. */
        function cropped(w, h) {
          var out = document.createElement('canvas');
          out.width = w; out.height = h;
          var g = out.getContext('2d');
          var scale = Math.max(w / cv.width, h / cv.height);
          var dw = cv.width * scale, dh = cv.height * scale;
          g.drawImage(cv, (w - dw) / 2, (h - dh) / 2, dw, dh);
          return out;
        }
        var land = cropped(1200, 628), sq = cropped(1200, 1200), st = cropped(1080, 1920);
        return { kind:'image', fit:'cover', label:cv.width + ' × ' + cv.height,
          cells:[
            { label:'Original', src:cv, w:cv.width, h:cv.height },
            { label:'Landscape', src:land, w:1200, h:628, ratio:'1.91/1' },
            { label:'Square',    src:sq,    w:1200, h:1200, ratio:'1/1' },
            { label:'Story',     src:st,    w:1080, h:1920, ratio:'9/16' }
          ] };
      });`
  },

  'image-merge-stitch': {
    heading: 'Stitched result',
    sub: 'The strip exactly as this tool stitches your images together, with the gap you chose.',
    variant: 'image',
    cards: [{ title: 'Merged', badge: 'live' }],
    adapter: canvas('mergeCanvas')
  },

  'image-collage-maker': {
    heading: 'Collage',
    sub: 'The collage exactly as this tool builds it, at the spacing and background you chose.',
    variant: 'image',
    cards: [{ title: 'Collage', badge: 'live' }],
    adapter: canvas('collageCanvas')
  },

  'free-image-compressor': {
    heading: 'Before and after compression',
    sub: 'Your image before and after, with the real file sizes this tool reports for each.',
    variant: 'image',
    cards: [{ title: 'Before', badge: 'original' }, { title: 'After', badge: 'compressed' }],
    adapter: beforeAfter('beforeCanvas', 'afterCanvas', 'metaOriginal', 'metaCompressed', 'metaSaved')
  },

  'jpeg-compressor': {
    heading: 'Before and after compression',
    sub: 'Your image before and after, with the real file sizes this tool reports for each.',
    variant: 'image',
    cards: [{ title: 'Before', badge: 'original' }, { title: 'After', badge: 'compressed' }],
    adapter: beforeAfter('beforeCanvas', 'afterCanvas', 'metaOriginal', 'metaCompressed', 'metaSaved')
  },

  'image-compare': {
    heading: 'Comparison',
    sub: 'Both images this tool loaded, and the difference map it computes between them.',
    variant: 'image',
    cards: [{ title: 'Image A', badge: 'first' }, { title: 'Image B', badge: 'second' }, { title: 'Difference', badge: 'computed' }],
    adapter: `
      pv.bind('#canvasA', function (a) {
        var b = document.getElementById('canvasB');
        var d = document.getElementById('diffCanvas');
        if (!a || !a.width || !b || !b.width) return null;
        var cells = [
          { label:'Image A', src:a, w:a.width, h:a.height },
          { label:'Image B', src:b, w:b.width, h:b.height }
        ];
        if (d && d.width) cells.push({ label:'Difference', src:d, w:d.width, h:d.height });
        var meta = document.getElementById('diffMeta');
        return { kind:'image', fit:'contain', label:'Two files',
                 sub: meta ? (meta.textContent || '').trim().slice(0, 80) : 'Live',
                 cells:cells };
      });`
  },

  'favicon-generator': {
    heading: 'Favicon sizes',
    sub: 'The icon exactly as this tool renders it, at each size it can export.',
    variant: 'image',
    cards: [
      { title: 'Source', badge: 'original' },
      { title: '32 × 32', badge: 'favicon' },
      { title: '180 × 180', badge: 'apple touch' },
      { title: '512 × 512', badge: 'pwa' }
    ],
    adapter: `
      pv.bind('#previewCanvas', function (cv) {
        if (!cv || !cv.width) return null;
        var src = cv.toDataURL('image/png');
        function scaled(n) {
          var c = document.createElement('canvas');
          c.width = n; c.height = n;
          c.getContext('2d').drawImage(cv, 0, 0, n, n);
          return { src:c.toDataURL('image/png'), w:n, h:n };
        }
        var s32 = scaled(32), s180 = scaled(180), s512 = scaled(512);
        return { kind:'image', fit:'contain', label:cv.width + ' × ' + cv.height,
          cells:[
            { label:'Source', src:src, w:cv.width, h:cv.height },
            { label:'32 × 32', src:s32.src, w:32,  h:32 },
            { label:'180 × 180', src:s180.src, w:180, h:180 },
            { label:'512 × 512', src:s512.src, w:512, h:512 }
          ] };
      });`
  },

  'image-splitter': {
    heading: 'Split tiles',
    sub: 'The tiles exactly as this tool cuts your image, at the grid you chose.',
    variant: 'tiles',
    cards: [{ title: 'Tiles', badge: 'live', tiles: 'row' }],
    adapter: `
      pv.bind('#gridPreview', function (el) {
        if (!el || !el.children.length) return null;
        var tiles = [];
        [].slice.call(el.children).slice(0, 24).forEach(function (n) {
          /* The tool builds each tile as a CANVAS, not an <img>, so a preview that
             only looked for images found nothing here and stayed empty. */
          var src = '';
          if (n.tagName === 'IMG') src = n.src;
          else if (n.tagName === 'CANVAS' && n.width) src = n.toDataURL('image/png');
          else { var im = n.querySelector('img'); if (im) src = im.src; }
          if (!src) return;
          tiles.push({ src:src, alt:(n.getAttribute('title') || n.getAttribute('alt') || 'Tile') });
        });
        if (!tiles.length) return null;
        var c = document.getElementById('numCols'), r = document.getElementById('numRows');
        return { kind:'tiles', tiles:tiles, label:'Tiles',
                 sub:(c && r ? c.value + ' × ' + r.value + ' grid' : tiles.length + ' tile(s)') };
      });`
  },

  'image-to-base64': {
    heading: 'Encoded and decoded',
    sub: 'The Base64 this tool produces, and the image it decodes back to. Both are the tool\'s real output.',
    variant: 'image',
    cards: [{ title: 'Base64 / decoded image', badge: 'live', wide: true }],
    adapter: `
      function b64() {
        var out = document.getElementById('base64Output');
        var img = document.getElementById('decodedImg');
        var v = out ? (out.value || '').trim() : '';
        var src = img && (img.currentSrc || img.src) ? (img.currentSrc || img.src) : '';
        /* This tool has two modes - encode a file (a long Base64 string) and decode
           one (an image). One adaptive card is used rather than two, because a fixed
           pair always left one card empty in whichever mode you were not in, which
           reads as a broken preview. */
        if (src) {
          return { kind:'image', fit:'contain', label:'Decoded from Base64',
                   src:src, w:img.naturalWidth, h:img.naturalHeight };
        }
        if (v) {
          return { kind:'code', wide:true,
                   text:v.slice(0, 4000), label:'Base64',
                   sub:v.length + ' characters' + (v.length > 4000 ? ' · first 4,000 shown' : '') };
        }
        return null;
      }
      pv.bind('#base64Output', function () { return b64(); });`
  },

  'image-dimensions-checker': {
    heading: 'Dimensions and ratio',
    sub: 'The measurements this tool reads from your image, and the size it calculates at your chosen ratio.',
    variant: 'stats',
    cards: [{ title: 'Your image', badge: 'measured' }, { title: 'At your ratio', badge: 'calculated' }],
    adapter: rowsFrom('#fileInput', [
      ['statWidth', 'Width'], ['statHeight', 'Height'], ['statMp', 'Megapixels'],
      ['statRatio', 'Aspect ratio'], ['calcResult', 'At your ratio']
    ], 'resultBox')
  },

  'image-hash-checker': {
    heading: 'Perceptual hash',
    sub: 'The hashes this tool computes from your image pixels. Identical images give identical hashes.',
    variant: 'code',
    cards: [{ title: 'Hashes', badge: 'live' }],
    adapter: `
      pv.bind('#resultBox', function (el) {
        if (el.style.display === 'none') return null;
        var rows = [['sha256Val', 'SHA-256'], ['sha1Val', 'SHA-1'], ['md5Val', 'MD5']];
        var out = [];
        rows.forEach(function (p) {
          var n = document.getElementById(p[0]); if (!n) return;
          var v = (n.textContent || '').trim();
          if (v) out.push(p[1] + '  ' + v);
        });
        if (!out.length) return null;
        return { kind:'code', text:out.join(String.fromCharCode(10)),
                 label:'Computed from pixels', sub:out.length + ' hash(es)' };
      });`
  },

  'image-metadata-viewer': {
    heading: 'Embedded metadata',
    sub: 'The EXIF and file properties this tool reads out of your image.',
    variant: 'stats',
    cards: [{ title: 'Metadata', badge: 'read from file' }],
    adapter: rowsFrom('#fileInput', [], 'resultPanel')
  },

  'svg-optimizer': {
    heading: 'Optimised SVG',
    sub: 'The SVG exactly as this tool rewrites it, with the real saving against your original.',
    variant: 'code',
    cards: [{ title: 'Optimised SVG', badge: 'live', lang: 'xml' }, { title: 'Saving', badge: 'measured' }],
    adapter: `
      pv.bind('#svgOutput', function (el) {
        var v = el.value; if (!v || !v.trim()) return null;
        var src = document.getElementById('svgInput');
        var before = src ? (src.value || '').length : 0;
        var meta = document.getElementById('sizeMeta');
        var after = v.length;
        var pct = before ? Math.round((before - after) / before * 100) : 0;
        return { kind:'code', text:'', cells:[
          { kind:'code', lang:'xml', text:v, label:'Optimised SVG', size:TP.bytes(after) },
          { rows:[{ k:'Before', v:TP.bytes(before) }, { k:'After', v:TP.bytes(after) },
                  { k:'Saved', v:(before - after) + ' bytes' }, { k:'Reduction', v:pct + '%' }],
            pct:pct, label:'Measured',
            sub:meta ? (meta.textContent || '').trim().slice(0, 40) : '' }
        ] };
      });`
  },

  'social-share-preview': {
    heading: 'How your link looks when shared',
    sub: 'The Facebook and X cards this tool builds from your details, with each platform\'s real limits.',
    variant: 'snippet',
    cards: [
      { title: 'Facebook', badge: '1.91:1', snipStyle: 'card' },
      { title: 'X / Twitter', badge: 'summary', snipStyle: 'card' }
    ],
    adapter: `
      function soc() {
        function t(id) { var n = document.getElementById(id); return n ? (n.textContent || '').trim() : ''; }
        var title = (document.getElementById('socTitle') || {}).value || '';
        var desc  = (document.getElementById('socDesc')  || {}).value || '';
        var dom   = (document.getElementById('socDomain') || {}).value || '';
        var img   = (document.getElementById('fbImg')  || {}).src || '';
        if (!title && !desc && !dom) return null;
        return { kind:'snippet', label:'From your details', sub:'Live',
          cells:[
            { snipStyle:'card', url:dom, title:t('fbTitle') || title,
              desc:t('fbDesc') || desc, image:img || null,
              extra:[title.length + '/' + 200 + ' title', desc.length + '/' + 200 + ' description'] },
            { snipStyle:'card', url:dom, title:t('twTitle') || title,
              desc:t('twDesc') || desc,
              extra:[title.length + '/' + 70 + ' title', desc.length + '/' + 200 + ' description'] }
          ] };
      }
      pv.bindEvent('#socTitle', 'input', soc);`
  }
};

/* ================================================================ PDF ==== */

export const PDF = {

  'pdf-watermark': {
    heading: 'Watermarked page',
    sub: 'The page exactly as this tool renders it with your watermark, at the position and opacity you chose.',
    variant: 'image',
    cards: [{ title: 'First page', badge: 'live' }],
    adapter: canvas('previewCanvas')
  },

  'pdf-metadata-editor': {
    heading: 'Document properties',
    sub: 'The properties this tool reads from your PDF, beside the values you have edited.',
    variant: 'stats',
    cards: [{ title: 'Read from the file', badge: 'original' }, { title: 'Your edited values', badge: 'will save' }],
    adapter: `
      pv.bind('#fileChips', function () {
        var read = [['propPages', 'Pages'], ['propSize', 'File size']];
        var edit = [['mTitle', 'Title'], ['mAuthor', 'Author'], ['mSubject', 'Subject'],
                    ['mKeywords', 'Keywords'], ['mCreator', 'Creator'], ['mProducer', 'Producer']];
        function grab(list) {
          return list.map(function (p) {
            var n = document.getElementById(p[0]); if (!n) return null;
            var v = (n.value !== undefined ? n.value : n.textContent || '').trim();
            return v ? { k:p[1], v:v.length > 40 ? v.slice(0, 40) + '…' : v } : null;
          }).filter(Boolean);
        }
        var r = grab(read), e = grab(edit);
        if (!r.length && !e.length) return null;
        return { kind:'stats', label:'Real file properties', sub:'Live',
          cells:[{ rows:r, label:'From the file' }, { rows:e, label:'Your values' }] };
      });`
  },

  'pdf-organizer': {
    heading: 'Page order',
    sub: 'Every page of your PDF in the order this tool will write them, with the page numbers it read.',
    variant: 'tiles',
    cards: [{ title: 'Pages in export order', badge: 'live', tiles: 'row' }],
    adapter: `
      pv.bind('#fileChips', function () {
        var grid = document.getElementById('pageGrid');
        if (!grid || !grid.children.length) return null;
        var tiles = [].slice.call(grid.children).slice(0, 36).map(function (n) {
          var img = n.tagName === 'IMG' ? n : n.querySelector('img');
          var num = n.getAttribute && (n.getAttribute('data-page') || n.getAttribute('aria-label'));
          if (img && img.src) return { src:img.src, alt:num || 'Page' };
          var cap = (n.textContent || '').trim().slice(0, 8);
          return cap ? { glyph:cap, cap:'' } : null;
        }).filter(Boolean);
        if (!tiles.length) return null;
        return { kind:'tiles', tiles:tiles, label:'Pages', sub:tiles.length + ' shown' };
      });`
  },

  'pdf-images-converter': {
    heading: 'Conversion output',
    sub: 'Every image this tool pulls out of your PDF, or every page it builds from your images.',
    variant: 'tiles',
    cards: [{ title: 'Result pages', badge: 'live', tiles: 'row' }],
    adapter: `
      function grid() {
        var g = document.getElementById('p2iGrid');
        var which = 'PDF to images';
        if (!g || !g.children.length) { g = document.getElementById('i2pGrid'); which = 'Images to PDF'; }
        if (!g || !g.children.length) return null;
        var tiles = [].slice.call(g.children).slice(0, 24).map(function (n) {
          var img = n.tagName === 'IMG' ? n : n.querySelector('img');
          if (img && img.src) return { src:img.src, alt:'Page' };
          var cap = (n.textContent || '').trim().slice(0, 24);
          return cap ? { glyph:cap } : null;
        }).filter(Boolean);
        if (!tiles.length) return null;
        return { kind:'tiles', tiles:tiles, label:which, sub:tiles.length + ' shown' };
      }
      pv.bind('#fileInputPdf', function () { return grid(); });`
  }
};

/* ================================================================ SEO ==== */

export const SEO = {

  'meta-tag-generator': {
    heading: 'Your meta tags',
    sub: 'The tags exactly as this tool generates them, beside the search and social cards they produce.',
    variant: 'code',
    cards: [{ title: 'Generated tags', badge: 'live', lang: 'html', wide: true }, { title: 'Google result', badge: 'preview' }],
    adapter: `
      pv.bind('#tagsOutput', function (el) {
        var v = el.value; if (!v || !v.trim()) return null;
        var title = (document.getElementById('pageTitle') || {}).value || '';
        var url = (document.getElementById('pageUrl') || {}).value || '';
        var desc = (document.getElementById('pageDesc') || {}).value || '';
        var tc = document.getElementById('titleCount'), dc = document.getElementById('descCount');
        return { kind:'code', text:'', wide:true, cells:[
          { kind:'code', lang:'html', text:v, label:'Generated tags', size:TP.bytes(v.length) },
          { kind:'snippet', snipStyle:'serp', url:url, title:title, desc:desc,
            label:'Google result',
            sub:[tc ? (tc.textContent || '').trim() : '', dc ? (dc.textContent || '').trim() : '']
                  .filter(Boolean).join(' · ') }
        ] };
      });`
  },

  'schema-markup-generator': {
    heading: 'Structured data',
    sub: 'The JSON-LD exactly as this tool generates it.',
    variant: 'code',
    cards: [{ title: 'JSON-LD', badge: 'live', lang: 'json', wide: true }],
    adapter: `
      pv.bind('#schemaOutput', function (el) {
        var v = el.value; if (!v || !v.trim()) return null;
        var t = document.getElementById('schemaType');
        return { kind:'code', text:v, lang:'json', wide:true,
                 label:t ? t.options[t.selectedIndex].text : 'JSON-LD', size:TP.bytes(v.length) };
      });`
  },

  'robots-txt-generator': {
    heading: 'Your robots.txt',
    sub: 'The file exactly as this tool builds it, with your crawl delay and sitemap.',
    variant: 'code',
    cards: [{ title: 'robots.txt', badge: 'live', wide: true }],
    adapter: `
      pv.bind('#buildOutput', function (el) {
        var v = el.value; if (!v || !v.trim()) return null;
        var lines = v.split(String.fromCharCode(10)).filter(function (x) { return x.trim(); });
        var sm = (document.getElementById('sitemapUrl') || {}).value;
        return { kind:'code', text:v, wide:true, label:'robots.txt',
                 sub:lines.length + ' line(s)' + (sm ? ' · sitemap set' : '') };
      });`
  },

  'xml-sitemap-generator': {
    heading: 'Your sitemap',
    sub: 'The XML exactly as this tool generates it, with the real counts it reports.',
    variant: 'code',
    cards: [{ title: 'sitemap.xml', badge: 'live', lang: 'xml', wide: true }, { title: 'Counts', badge: 'measured' }],
    adapter: `
      pv.bind('#genOutput', function (el) {
        var v = el.value; if (!v || !v.trim()) return null;
        function t(id) { var n = document.getElementById(id); return n ? (n.textContent || '').trim() : ''; }
        var rows = [['statTotal', 'URLs'], ['statValid', 'Valid'], ['statDupes', 'Duplicates'],
                    ['statInvalid', 'Invalid']].map(function (p) {
          var x = t(p[0]); return x ? { k:p[1], v:x } : null;
        }).filter(Boolean);
        return { kind:'code', text:'', wide:true, cells:[
          { kind:'code', lang:'xml', text:v, label:'sitemap.xml', size:TP.bytes(v.length) },
          { rows:rows.length ? rows : [{ k:'URLs', v:String((v.match(/<url>/g) || []).length) }],
            label:'Measured', sub:'Live' }
        ] };
      });`
  },

  'hreflang-generator': {
    heading: 'Hreflang tags',
    sub: 'The HTML tags and the XML sitemap entries exactly as this tool generates them.',
    variant: 'code',
    cards: [{ title: 'HTML tags', badge: 'live', lang: 'html' }, { title: 'XML sitemap', badge: 'live', lang: 'xml' }],
    adapter: `
      pv.bind('#hlHtmlOutput', function (el) {
        var h = el.value; var x = document.getElementById('hlXmlOutput');
        var xv = x ? x.value : '';
        if ((!h || !h.trim()) && (!xv || !xv.trim())) return null;
        return { kind:'code', text:'', cells:[
          { kind:'code', lang:'html', text:h || '', label:'HTML tags' },
          { kind:'code', lang:'xml',  text:xv || '', label:'XML sitemap' }
        ] };
      });`
  },

  'redirect-rules-generator': {
    heading: 'Redirect rules',
    sub: 'The rules exactly as this tool writes them, in the format you selected.',
    variant: 'code',
    cards: [{ title: 'Rules', badge: 'live', wide: true }],
    adapter: `
      pv.bind('#rrOutput', function (el) {
        var v = el.value; if (!v || !v.trim()) return null;
        var f = document.getElementById('rrFormat');
        var lines = v.split(String.fromCharCode(10)).filter(function (x) { return x.trim(); });
        return { kind:'code', text:v, wide:true,
                 label:f ? f.options[f.selectedIndex].text : 'Rules',
                 sub:lines.length + ' line(s)', size:TP.bytes(v.length) };
      });`
  },

  'canonical-robots-checker': {
    heading: 'Canonical and robots tags',
    sub: 'The tags exactly as this tool generates them.',
    variant: 'code',
    cards: [{ title: 'Canonical', badge: 'live', lang: 'html' }, { title: 'Robots', badge: 'live', lang: 'html' }],
    adapter: `
      pv.bind('#tagsOutput', function (el) {
        var a = el.value || '';
        var h = document.getElementById('headerOutput');
        var b = h ? (h.value || '') : '';
        if (!a.trim() && !b.trim()) return null;
        return { kind:'code', text:'', cells:[
          { kind:'code', lang:'html', text:a, label:'Canonical' },
          { kind:'code', lang:'html', text:b, label:'Robots' }
        ] };
      });`
  },

  'youtube-tag-generator': {
    heading: 'Your tags',
    sub: 'The tags exactly as this tool generates them, with the real count and character budget it reports.',
    variant: 'code',
    cards: [{ title: 'Tags', badge: 'live', wide: true }, { title: 'Budget', badge: 'measured' }],
    adapter: `
      pv.bind('#tagsOutput', function (el) {
        var v = el.value; if (!v || !v.trim()) return null;
        function t(id) { var n = document.getElementById(id); return n ? (n.textContent || '').trim() : ''; }
        var count = t('metaCount'), chars = t('metaChars');
        var tags = v.split(',').map(function (x) { return x.trim(); }).filter(Boolean);
        return { kind:'code', text:'', wide:true, cells:[
          { kind:'code', text:v, label:'Tags', sub:tags.length + ' tag(s) parsed' },
          { rows:[{ k:'Tags', v:count || String(tags.length) }, { k:'Characters', v:chars || String(v.length) },
                  { k:'YouTube limit', v:'500 characters' }],
            pct:chars ? Math.min(100, Math.round(parseInt(chars, 10) / 500 * 100)) : null,
            label:'Measured', sub:'Live' }
        ] };
      });`
  },

  'url-slug-generator': {
    heading: 'Your slug',
    sub: 'The slug exactly as this tool builds it, beside the URL it will sit in.',
    variant: 'snippet',
    cards: [{ title: 'The slug', badge: 'live' }, { title: 'Full URL', badge: 'preview' }],
    adapter: `
      pv.bind('#slugOutput', function (el) {
        var v = (el.value || el.innerText || '').trim();
        if (!v) return null;
        var prev = document.getElementById('urlPreview');
        var url = prev ? (prev.innerText || prev.textContent || '').trim() : v;
        return { kind:'snippet', label:'From your title',
          cells:[
            { snipStyle:'serp', title:v, url:'/blog/' + v, desc:'Slug exactly as generated' },
            { snipStyle:'serp', title:url, url:url, desc:'Where the slug sits in a real URL' }
          ] };
      });`
  },

  'keyword-density-checker': {
    heading: 'Keyword density',
    sub: 'The phrases this tool finds in your text, with the real density for each.',
    variant: 'stats',
    cards: [{ title: 'Density', badge: 'live', wide: true }],
    adapter: rowsFrom('#densityInput', [], null)
  },

  'seo-page-analyzer': {
    heading: 'Page analysis',
    sub: 'The score and the counts this tool calculates from the HTML you gave it.',
    variant: 'stats',
    cards: [{ title: 'Score', badge: 'out of 100' }, { title: 'Counts', badge: 'measured' }],
    adapter: `
      pv.bind('#scoreSection', function () {
        function t(id) { var n = document.getElementById(id); return n ? (n.textContent || '').trim() : ''; }
        var score = t('scoreNum'), of = t('scoreOf');
        var stats = [['statWords','Words'],['statImages','Images'],['statLinks','Links'],['statHeadings','Headings']]
          .map(function (p) { var x = t(p[0]); return x ? { k:p[1], v:x } : null; }).filter(Boolean);
        if (!score) return null;
        var n = parseInt(score, 10);
        return { kind:'stats', label:'This tool calculates', sub:'Live',
          cells:[
            { rows:[{ k:'Score', v:score + (of ? ' ' + of : '') }].concat(
                isNaN(n) ? [] : [{ k:'Rating', v:n >= 90 ? 'Excellent' : n >= 70 ? 'Good' : n >= 50 ? 'Needs work' : 'Poor' }]),
              pct:isNaN(n) ? null : n, label:'Score' },
            { rows:stats.length ? stats : [{ k:'No counts yet', v:'—' }], label:'Counts' }
          ] };
      });`
  },

  'http-header-checker': {
    heading: 'Header report',
    sub: 'The headers exactly as this tool reads them, with its verdict and any issues it found.',
    variant: 'stats',
    cards: [{ title: 'Verdict', badge: 'checked' }, { title: 'Headers', badge: 'live', wide: true }],
    adapter: `
      pv.bind('#hdrResultSection', function () {
        function t(id) { var n = document.getElementById(id); return n ? (n.textContent || '').trim() : ''; }
        var verdict = t('statusVerdict');
        var table = document.getElementById('hdrTable');
        var rows = [];
        if (table) [].slice.call(table.querySelectorAll('tr')).forEach(function (tr) {
          var c = [].slice.call(tr.querySelectorAll('th,td')).map(function (x) {
            return (x.textContent || '').trim();
          });
          if (c.length >= 2) rows.push({ k:c[0], v:c[1] });
        });
        if (!verdict && !rows.length) return null;
        var issues = document.getElementById('hdrIssueList');
        var ic = issues ? issues.children.length : 0;
        return { kind:'stats', label:'This tool reads', sub:'Live',
          cells:[
            { rows:[{ k:'Verdict', v:verdict || '—' }, { k:'Issues found', v:String(ic) }], label:'Verdict' },
            { rows:rows.length ? rows : [{ k:'No headers yet', v:'—' }], label:'Headers' }
          ] };
      });`
  }
};

/* ================================================ UTILITY / CALCULATOR ==== */

export const UTIL = {

  'color-picker-converter': {
    heading: 'Your colour',
    sub: 'The colour you picked, in every notation this tool converts it to.',
    variant: 'result',
    cards: [
      { title: 'Colour', resultLabel: 'Picked', ratio: '1/1' },
      { title: 'Values', resultLabel: 'Converted' }
    ],
    adapter: `
      pv.bindEvent('#colorPicker', 'input', function () {
        function t(id) { var n = document.getElementById(id); return n ? (n.textContent || '').trim() : ''; }
        var hex = t('hexInput') || (document.getElementById('hexInput') || {}).value || '';
        if (!hex) return null;
        var rows = [['rgbOut','RGB'],['hslOut','HSL'],['cssRgbOut','CSS rgb()'],['cssHslOut','CSS hsl()']]
          .map(function (p) { var x = t(p[0]); return x ? { k:p[1], v:x } : null; }).filter(Boolean);
        return { kind:'result', label:'Live', sub:'Live',
          cells:[
            { value:hex.toUpperCase(), detail:'HEX' },
            { rows:rows, label:'Converted' }
          ] };
      });`
  },

  'password-generator': {
    heading: 'Generated password',
    sub: 'The password exactly as this tool generated it, with the real length and strength it reports.',
    variant: 'result',
    cards: [{ title: 'Password', resultLabel: 'Generated', wide: true }, { title: 'Strength', badge: 'measured' }],
    adapter: `
      pv.bind('#pwOutput', function (el) {
        var v = (el.value || el.innerText || '').trim();
        if (!v) return null;
        function t(id) { var n = document.getElementById(id); return n ? (n.textContent || '').trim() : ''; }
        var label = t('strengthLabel');
        var len = document.getElementById('sLength');
        return { kind:'result', label:'Generated', sub:'Live',
          cells:[
            { value:v, detail:(len ? len.value : v.length) + ' characters' },
            { rows:[
                { k:'Strength', v:label || '—' },
                { k:'Length', v:String(len ? len.value : v.length) },
                { k:'Upper case', v:(document.getElementById('optUpper') || {}).checked ? 'on' : 'off' },
                { k:'Numbers', v:(document.getElementById('optNumbers') || {}).checked ? 'on' : 'off' },
                { k:'Symbols', v:(document.getElementById('optSymbols') || {}).checked ? 'on' : 'off' }
              ], label:'Measured' }
          ] };
      });`
  },

  'percentage-calculator': {
    heading: 'Your result',
    sub: 'The answer exactly as this tool calculates it, for the mode you have selected.',
    variant: 'result',
    cards: [{ title: 'Answer', resultLabel: 'Calculated', wide: true }],
    adapter: `
      pv.bindEvent('#ofPercent', 'input', function () {
        var pairs = [['ofResult','ofResultSub'],['whatResult','whatResultSub'],['chResult','chResultSub']];
        var best = null;
        pairs.forEach(function (p) {
          var n = document.getElementById(p[0]); if (!n) return;
          var v = (n.textContent || '').trim();
          if (!v || v === '\\u2014' || v === '—') return;
          var s = document.getElementById(p[1]);
          best = { value:v, detail:s ? (s.textContent || '').trim() : '' };
        });
        if (!best) return null;
        return { kind:'result', value:best.value, detail:best.detail, label:'Answer', sub:'Live' };
      });`
  },

  'ai-write/search': {
    heading: 'Your results',
    sub: 'The results exactly as this tool searches for them, in the order it ranked them.',
    variant: 'text',
    cards: [{ title: 'Results', badge: 'live', docStyle: 'list', wide: true }],
    adapter: `
      pv.bind('#outputText', function (el) {
        var v = el.value; if (!v || !v.trim()) return null;
        var st = TP.stats(v);
        return { kind:'text', text:v, docStyle:'list', label:'Results', allowHeadings:false,
                 words:st.words, reading:TP.readingTime(st.words), size:TP.bytes(v.length) };
      });`
  }
};
