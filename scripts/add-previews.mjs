/* ======================================================================
 * add-previews.mjs - attach a Preview section to the tool pages.
 *
 * Run from the project root:  node scripts/add-previews.mjs [--apply] [slug...]
 *
 * WHAT IT DOES
 * For every tool listed in PREVIEWS below it injects four things into the page:
 *
 *   1. the component CSS from scripts/preview.css, into the page's own <style>
 *   2. <script src=".../assets/tool-preview.js" defer>
 *   3. a <section> holding the preview cards
 *   4. a small adapter that binds the cards to the tool's REAL output element
 *
 * THE ADAPTER IS THE IMPORTANT PART
 * Each one reads the node the tool already writes to and passes its actual
 * contents to the component. Nothing here invents content: if the tool has
 * produced nothing, the preview shows its empty state. Sizes are measured with
 * `new Blob([text]).size`, which is the real UTF-8 byte count, and canvases are
 * read with toDataURL, so a preview can never disagree with what the tool will
 * actually export.
 *
 * The adapters OBSERVE rather than patch. A MutationObserver plus input/change
 * listeners on the tool's own output node means the preview updates for free
 * when the tool re-renders. No tool's existing logic is modified, so no working
 * functionality can regress.
 *
 * WHAT IS DELIBERATELY NOT TOUCHED
 *   - the five pages that already ship the Easy Thumbnail Downloader preview
 *     (easy-thumbnail-downloader, heic-to-jpg-converter, jpg-pdf-converter,
 *     pdf-compressor, pdf-merge-split): they are the reference, and rewriting
 *     them would change working functionality
 *   - any URL, route, id or filename
 *   - each tool's own logic
 *
 * IDEMPOTENT. Re-running is a no-op: a page already carrying
 * data-tool-preview is skipped.
 * ====================================================================== */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { IMAGE, PDF, SEO, UTIL } from './previews-image-pdf-seo.mjs';

const ROOT = process.cwd();
const APPLY = process.argv.includes('--apply');
const FORCE = process.argv.includes('--force');
const ONLY = process.argv.slice(2).filter(a => !a.startsWith('--'));

const CSS = fs.readFileSync(path.join(ROOT, 'scripts', 'preview.css'), 'utf8');
const CSS_MARK = '/* === TOOL PREVIEW (injected by scripts/add-previews.mjs) === */';

/* ------------------------------------------------------------- helpers --- */

/* Tools live at tools/<slug>/ or tools/ai-write/<slug>/, so the relative path
   back to assets/ differs by depth. */
const relAssets = (slug) => (slug.includes('/') ? '../../../' : '../../') + 'assets/tool-preview.js';

const S = (s) => JSON.stringify(String(s));

/* Insert a preview section immediately before the SEO content block, so it
   always lands after the tool's working area and before the long-form copy. */
function injectSection(html, slug, cfg, idSuffix) {
  const marker = '<section class="tool-seo-content"';
  const at = html.indexOf(marker);
  const anchor = at >= 0 ? at : html.lastIndexOf('</main>');
  if (anchor < 0) throw new Error('no insertion anchor in ' + slug);

  const id = 'pv-' + idSuffix;
  const cards = cfg.cards.map(c => {
    const ratio = c.ratio ? ` data-ratio="${c.ratio}"` : '';
    const badge = c.badge ? `<span class="mock-ratio">${c.badge}</span>` : '';
    return [
      '        <article class="mock pv-card' + (c.wide ? ' pv-card--wide' : '') + '">',
      `          <div class="mock-head"><h3>${c.title}</h3>${badge}</div>`,
      `          <div class="mock-canvas pv-canvas empty"${ratio}></div>`,
      '          <div class="pv-foot"></div>',
      '        </article>'
    ].join('\n');
  }).join('\n');

  const section = [
    '',
    '    <!-- =================== PREVIEW =================== -->',
    '    <section class="pv-root" id="' + id + '" data-tool-preview aria-labelledby="' + id + '-h">',
    `      <h2 class="pv-h2" id="${id}-h">${cfg.heading}</h2>`,
    cfg.sub ? `      <p class="pv-sub">${cfg.sub}</p>` : '',
    `      <div class="pv-host" id="${id}-host"></div>`,
    '    </section>'
  ].filter(Boolean).join('\n');

  /* The adapter is an INLINE script, so it runs during parsing - before any
     deferred script in <head> has executed. Loading tool-preview.js with defer
     and then calling it straight from an inline block therefore always saw
     window.ToolPreview as undefined and every preview stayed empty. Waiting for
     DOMContentLoaded is the fix, and it also covers the case where the component
     has already run. */
  const adapter = [
    '',
    '    <script>',
    '    (function () {',
    '      function boot() {',
    '        var host = document.getElementById(' + S(id + '-host') + ');',
    '        if (!host || !window.ToolPreview) return;',
    '        var TP = window.ToolPreview;',
    '        var pv = TP.mount(host, {',
    '          variant: ' + S(cfg.variant || 'text') + ',',
    '          cards: ' + JSON.stringify(cfg.cards.map(c => ({
      title: c.title, badge: c.badge || null, ratio: c.ratio || null,
      variant: c.variant || cfg.variant || null, lang: c.lang || null,
      wide: !!c.wide, foot: c.foot !== false, docStyle: c.docStyle || null,
      resultLabel: c.resultLabel || null, snipStyle: c.snipStyle || null,
      tiles: c.tiles || null, allowHeadings: c.allowHeadings
    }))) + ',',
    "          emptyText: " + S(cfg.empty || 'Run the tool to see a preview'),
    '        });',
    cfg.adapter.trim(),
    '      }',
    "      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);",
    '      else boot();',
    '    })();',
    '    </script>'
  ].join('\n');

  return html.slice(0, anchor) + section + adapter + '\n' + html.slice(anchor);
}

/* Remove a previously injected block so a page can be re-generated. Needed
   because the adapters are iterated on, and "already present" would otherwise
   freeze the first version in place. Only our own markers are touched - the
   range runs from the PREVIEW comment to the end of our adapter script, and the
   CSS from the CSS marker to the closing </style>. */
function stripInjected(html) {
  let out = html;

  const s = out.indexOf('    <!-- =================== PREVIEW =================== -->');
  if (s >= 0) {
    const end = out.indexOf('</script>', s);
    if (end >= 0) out = out.slice(0, s) + out.slice(end + '</script>'.length);
  }

  const c = out.indexOf(CSS_MARK);
  if (c >= 0) {
    const close = out.indexOf('</style>', c);
    if (close >= 0) out = out.slice(0, c) + out.slice(close);
  }

  out = out.replace(/[ \t]*<script src="[^"]*assets\/tool-preview\.js" defer><\/script>\r?\n?/g, '');
  /* tidy the blank lines the removal leaves behind */
  out = out.replace(/\n{3,}/g, '\n\n');
  return out;
}

function injectCss(html) {
  if (html.includes(CSS_MARK)) return html;
  const i = html.lastIndexOf('</style>');
  if (i >= 0) return html.slice(0, i) + CSS_MARK + '\n' + CSS + '\n' + html.slice(i);
  const h = html.indexOf('</head>');
  return html.slice(0, h) + '<style>' + CSS_MARK + '\n' + CSS + '\n</style>\n' + html.slice(h);
}

function injectScript(html, slug) {
  if (/tool-preview\.js/.test(html)) return html;
  const tag = '<script src="' + relAssets(slug) + '" defer></script>\n';
  const i = html.indexOf('</head>');
  return html.slice(0, i) + tag + html.slice(i);
}

/* ============================================================ PREVIEWS === */
/* One entry per tool. heading/sub are written per tool - a preview that claims
   something the tool does not do is worse than no preview at all. */

const blob = (s) => `new Blob([${s}]).size`;

const PREVIEWS = {

  /* ------------------------------------------------ Developer: JSON ----- */
  'json-formatter': {
    heading: 'Formatted output',
    sub: 'Exactly the JSON this tool writes to the output box, with the real line and byte counts for what you pasted.',
    variant: 'code',
    cards: [{ title: 'Formatted JSON', badge: 'live', lang: 'json' }],
    adapter: `
      pv.bind('#jsonOutput', function (el) {
        var v = el.value; if (!v) return null;
        return { kind:'code', text:v, lang:'json',
                 lines:v.split(String.fromCharCode(10)).length, size:${blob('v')},
                 label:'Output box' };
      });`
  },

  /* ------------------------------------------------- Developer: UUID ---- */
  'uuid-generator': {
    heading: 'Generated identifiers',
    sub: 'The identifiers this tool produced, exactly as they appear in the output box.',
    variant: 'code',
    cards: [{ title: 'UUIDs', badge: 'live' }],
    adapter: `
      pv.bind('#uuidOutput', function (el) {
        var v = el.value; if (!v) return null;
        var n = v.split(String.fromCharCode(10)).filter(Boolean).length;
        return { kind:'code', text:v, label:n + (n===1?' identifier':' identifiers'),
                 lines:n, size:${blob('v')} };
      });`
  },

  /* -------------------------------------------------- Text: counters ---- */
  'word-character-counter': {
    heading: 'Your text, measured',
    sub: 'Counts are computed from the text in the box as you type. The reading time assumes 220 words a minute.',
    variant: 'stats',
    cards: [
      { title: 'Counts', badge: 'live' },
      { title: 'Longest words', badge: 'top 5' }
    ],
    adapter: `
      pv.bind('#textInput', function (el) {
        var s = el.value; if (!s.trim()) return null;
        var words = s.trim().split(/\\s+/).filter(Boolean);
        var st = TP.stats(s);
        var lines = s.split(String.fromCharCode(10));
        var longest = words.slice().sort(function (a, b) { return b.length - a.length; })
          .slice(0, 5).map(function (w) { return w.length; });
        var charsNoSpace = s.replace(/\\s/g, '').length;
        var sentences = (s.match(/[.!?]+(\\s|$)/g) || []).length || (words.length ? 1 : 0);
        return { kind:'stats', label:'Live', sub: TP.readingTime(st.words),
          cells: [
            { rows: [
              { k:'Words', v:st.words },
              { k:'Characters', v:st.chars },
              { k:'Characters, no spaces', v:charsNoSpace },
              { k:'Sentences', v:sentences },
              { k:'Paragraphs', v:s.split(/\\n{2,}/).filter(function(x){return x.trim();}).length },
              { k:'Lines', v:lines.length },
              { k:'Reading time', v:TP.readingTime(st.words) }
            ]},
            { rows: longest.map(function (n, i) {
                return { k:'#' + (i+1), v:n + (n===1?' char':' chars') };
              }).concat([{ k:'Average word', v:(st.words ? Math.round(st.chars/st.words) : 0) + ' chars' }]) }
          ] };
      });`
  },

  /* --------------------------------------------- Converter: units ------ */
  'unit-converter': {
    heading: 'Conversion result',
    sub: 'The converted value exactly as this tool calculates it, alongside your input so the rate is visible.',
    variant: 'result',
    cards: [
      { title: 'Converted', resultLabel: 'Result', wide: false },
      { title: 'Your input', resultLabel: 'From' }
    ],
    adapter: `
      pv.bindEvent('#fromValue', 'input', function (el) {
        var out = document.getElementById('toValue');
        if (!out) return null;
        var to = (out.textContent || '').trim();
        if (!to || to === '\\u2014') return null;
        var fv = el.value, fu = document.getElementById('fromUnit');
        var tu = document.getElementById('toUnit');
        return { kind:'result', value:to, label:'Result',
                 sub:'Live',
                 cells: [
                   { value:to, detail:(tu ? tu.options[tu.selectedIndex].text : '') },
                   { value:fv === '' ? '0' : fv, detail:(fu ? fu.options[fu.selectedIndex].text : '') }
                 ] };
      });`
  },

  /* --------------------------------------------- Calculator: age ------- */
  'age-calculator': {
    heading: 'Your result',
    sub: 'The age this tool works out from the dates you entered, shown exactly as it calculates it.',
    variant: 'result',
    cards: [{ title: 'Age', resultLabel: 'Calculated age', wide: true }],
    adapter: `
      pv.bindEvent('#dob', 'change', function (el) {
        var box = document.getElementById('resultBox');
        if (!box || box.style.display === 'none') return null;
        var t = (box.innerText || '').trim();
        if (!t) return null;
        return { kind:'result', value:t.split(String.fromCharCode(10))[0], detail:t.split(String.fromCharCode(10)).slice(1).join(' '),
                 label:'Result', sub:'Live' };
      });`
  },

  /* --------------------------------------------- Image: resizer -------- */
  'easy-image-resizer': {
    heading: 'Your image at each target width',
    sub: 'The same picture this tool loaded, shown at the widths it can export. Proportions are kept, so nothing is stretched.',
    variant: 'image',
    cards: [
      { title: 'Original', badge: 'source' },
      { title: 'Large', badge: '1920w' },
      { title: 'Web', badge: '1280w' },
      { title: 'Small', badge: '800w' }
    ],
    adapter: `
      pv.bind('#imagePreview', function (img) {
        var src = img.currentSrc || img.src;
        if (!src || !img.naturalWidth) return null;
        var W = img.naturalWidth, H = img.naturalHeight;
        var sizes = [[0,'Original'],[1920,'Large'],[1280,'Web'],[800,'Small']];
        var cells = sizes.map(function (s) {
          var w = s[0] || W;
          return { label:s[1], w:w, h:Math.round(H * w / W), src:src };
        });
        return { kind:'image', fit:'contain', cells:cells, label:W + ' × ' + H };
      });`
  },

  /* ------------------------------------- Image: format converter ------ */
  'image-format-converter': {
    heading: 'Converted result',
    sub: 'The converted image this tool produced, with the real file size it reports. Nothing here is re-encoded for display.',
    variant: 'image',
    cards: [
      { title: 'Converted image', badge: 'output' },
      { title: 'File size', resultLabel: 'Measured' }
    ],
    adapter: `
      pv.bind('#previewCanvas', function (cv) {
        if (!cv.width) return null;
        var meta = document.getElementById('metaConverted');
        var orig = document.getElementById('metaOriginal');
        var sizeTxt = meta ? (meta.textContent || '').trim() : '';
        return { kind:'image', cells: [
          { label:'Converted', src:cv, w:cv.width, h:cv.height, size:${blob('(sizeTxt||"")')} },
          { label:'Reported by the tool', value:sizeTxt || null,
            detail: orig ? ('was ' + (orig.textContent||'').trim()) : null }
        ] };
      });`
  },

  /* ------------------------------------------ SEO: snippet preview ----- */
  'serp-snippet-preview': {
    heading: 'How your page will appear in search',
    sub: 'The same result this tool shows above, rebuilt as the search listing itself. The title is truncated exactly where Google truncates it.',
    variant: 'snippet',
    cards: [
      { title: 'Google', badge: 'desktop', snipStyle: 'serp' },
      { title: 'Mobile', badge: 'narrow', snipStyle: 'serp' }
    ],
    adapter: `
      function snip() {
        var u = document.getElementById('serpUrlPreview');
        var t = document.getElementById('serpTitlePreview');
        var d = document.getElementById('serpDescPreview');
        if (!u || !t || !d) return null;
        var url = (u.textContent||'').trim();
        var title = (t.textContent||'').trim();
        var desc = (d.textContent||'').trim();
        if (!url && !title && !desc) return null;
        return { kind:'snippet', url:url, title:title, desc:desc,
                 cells:[{url:url,title:title,desc:desc},{url:url,title:title,desc:desc}],
                 label:'From your URL', sub:'Live' };
      }
      pv.bindEvent('#serpUrl', 'input', snip);`
  }
};

/* ============================================================ AI WRITE === */
/* All 54 AI Write tools share one contract: a #inputText box and a #outputText
   textarea that the tool fills in. So the ADAPTER is shared and generated, but
   the framing is per tool - heading, description, and the document shape the
   output actually takes. A tweet and a non-disclosure agreement are not the same
   artefact and must not be previewed as though they were.
 *
 *   [ heading, sub, docStyle, wide ]
 *
 * docStyle picks the CSS treatment: prose = a readable document, list = an
 * itemised result, social = a short post with its real character budget. */
const AI_FRAME = {
  /* ---- short-form social, with the platform's real limit ---- */
  'twitter-generator':        ['Your post', 'The post exactly as generated, with its real character count against the 280 limit.', 'social', false, 280],
  'instagram-caption-generator':['Your caption', 'The caption as generated, with its character count against the Instagram limit.', 'social', false, 2200],
  'fb-headline-generator':    ['Your headline', 'The headline as generated, with its character count against the Facebook limit.', 'social', false, 255],
  'linkedin-post-generator':  ['Your post', 'The post as generated, with its character count against the LinkedIn limit.', 'social', false, 3000],
  'instagram-story-idea':     ['Story beats', 'Each beat as generated, framed as the sequence you would put on screen.', 'list', false],
  'tiktok-script-writer':     ['Your script', 'The script as generated, with its real length so you can see it fits a short video.', 'prose', false],
  'podcast-script-writer':    ['Your script', 'The script as generated, with its real length and estimated reading time.', 'prose', false],
  'youtube-script-writer':    ['Your script', 'The script as generated, with its real length and estimated reading time.', 'prose', false],
  'cold-email-writer':        ['Your email', 'The email as generated, with its real word count and estimated reading time.', 'prose', false],

  /* ---- long-form documents ---- */
  'essay-writer':             ['Your essay', 'The finished essay exactly as generated, with its real word count and reading time.', 'prose', true],
  'article-writer':           ['Your article', 'The article exactly as generated, with its real word count and reading time.', 'prose', true],
  'article-generator':        ['Your article', 'The article exactly as generated, with its real word count and reading time.', 'prose', true],
  'blog-post-generator':      ['Your post', 'The post exactly as generated, with its real word count and reading time.', 'prose', true],
  'press-release-generator':  ['Your release', 'The press release exactly as generated, with its real word count and reading time.', 'prose', true],
  'landing-page-copy-generator':['Your landing page copy', 'The copy exactly as generated, with its real word count.', 'prose', true],
  'nda-generator':            ['Your agreement', 'The agreement exactly as generated. Preview the text only - it is not legal advice.', 'prose', true],
  'purchase-agreement':       ['Your agreement', 'The agreement exactly as generated. Preview the text only - it is not legal advice.', 'prose', true],
  'bill-of-sale':             ['Your bill of sale', 'The document exactly as generated. Check every figure before you use it.', 'prose', true],
  'privacy-policy-generator': ['Your policy', 'The policy exactly as generated. Have it reviewed before publishing it.', 'prose', true],
  'business-plan-generator':  ['Your business plan', 'The plan exactly as generated, with its real word count and reading time.', 'prose', true],
  'real-estate-descriptions': ['Your descriptions', 'Each listing description exactly as generated.', 'prose', true],
  'content-brief-generator':  ['Your content brief', 'The brief exactly as generated, with its real word count.', 'prose', true],

  /* ---- itemised results ---- */
  'blog-post-ideas':          ['Your ideas', 'Every idea exactly as generated.', 'list', false],
  'faq-generator':            ['Your FAQs', 'Each question and answer exactly as generated.', 'list', false],
  'poll-generator':           ['Your poll', 'The poll exactly as generated.', 'list', false],
  'trivia-generator':         ['Your trivia', 'Every question and answer exactly as generated.', 'list', false],
  'content-planner':          ['Your plan', 'The plan exactly as generated.', 'list', false],
  'blog-outline-generator':   ['Your outline', 'The outline exactly as generated.', 'list', false],
  'business-name-generator':  ['Your names', 'Every name exactly as generated.', 'list', false],
  'business-slogan-generator':['Your slogans', 'Every slogan exactly as generated.', 'list', false],

  /* ---- rewrites and rewording of what you pasted ---- */
  'ai-humanizer':             ['Rewritten text', 'The rewritten text exactly as produced, beside the real count for the original.', 'prose', false],
  'ai-rephraser':             ['Rephrased text', 'The rephrased text exactly as produced.', 'prose', false],
  'content-improver':         ['Improved text', 'The improved text exactly as produced.', 'prose', false],
  'content-paraphraser':      ['Paraphrased text', 'The paraphrased text exactly as produced.', 'prose', false],
  'content-shortener':        ['Shortened text', 'The shortened text exactly as produced, with the real saving against your original.', 'prose', false],
  'content-summarizer':       ['Your summary', 'The summary exactly as produced, with the real saving against your original.', 'prose', false],
  'grammar-fixer':            ['Corrected text', 'The corrected text exactly as produced.', 'prose', false],
  'sentence-rewriter':        ['Rewritten sentences', 'The rewritten sentences exactly as produced.', 'prose', false],
  'paragraph-rewriter':       ['Rewritten paragraphs', 'The rewritten paragraphs exactly as produced.', 'prose', false],
  'paragraph-completer':      ['Completed paragraph', 'The completed text exactly as produced.', 'prose', false],
  'paragraph-writer':         ['Your paragraph', 'The paragraph exactly as produced.', 'prose', false],
  'title-rewriter':           ['Your titles', 'Every title exactly as produced.', 'list', false],
  'tone-of-voice':            ['Rewritten text', 'The text in the tone you chose, exactly as produced.', 'prose', false],
  'explain-it':               ['The explanation', 'The explanation exactly as produced.', 'prose', false],
  'story-generator':          ['Your story', 'The story exactly as produced.', 'prose', false],
  'post-writer':              ['Your post', 'The post exactly as produced.', 'prose', false],
  'summarize-youtube':        ['Your summary', 'The summary exactly as produced, with its real reading time.', 'prose', false],
  'translate':                ['Translation', 'The translation exactly as produced.', 'prose', false],
  'article-rewriter':         ['Rewritten article', 'The rewritten article exactly as produced.', 'prose', true],
  'blog-post-rewriter':       ['Rewritten post', 'The rewritten post exactly as produced.', 'prose', true],

  /* ---- measurement and analysis ---- */
  'word-counter':             ['Your report', 'The report exactly as this tool produced it, with its real word count and reading time.', 'prose', false],
  'ai-detector':              ['Analysis', 'The analysis exactly as this tool produced it.', 'prose', false],
  'meta-description-generator':['Your meta description', 'The description exactly as generated, with its real character count against the 160 limit.', 'social', false, 160]
};

/* One adapter, generated per tool. The character budget card is only added for
   the tools that genuinely have a limit, because showing a progress bar against
   an invented limit would be a lie. */
Object.keys(AI_FRAME).forEach(function (slug) {
  const f = AI_FRAME[slug];
  const limit = f[4];
  const cards = limit
    ? [{ title: f[0], badge: 'live', docStyle: f[2], wide: f[3] },
       { title: 'Length', badge: 'limit ' + limit }]
    : [{ title: f[0], badge: 'live', docStyle: f[2], wide: f[3] }];

  PREVIEWS['ai-write/' + slug] = {
    heading: 'Preview', sub: f[1],
    variant: limit ? 'text' : f[2],
    cards: cards,
    adapter: limit ? `
      pv.bind('#outputText', function (el) {
        var v = el.value; if (!v || !v.trim()) return null;
        var st = TP.stats(v);
        var n = v.length;
        return { kind:'text', text:v, label:'Generated', words:st.words,
                 reading:TP.readingTime(st.words), size:${blob('v')},
                 cells: [
                   { text:v, label:'Generated', sub:st.words + ' words' },
                   { label:'Against the limit', sub:${limit} + ' character limit',
                     rows:[
                       { k:'Characters used', v:n },
                       { k:'Limit', v:${limit} },
                       { k:'Remaining', v:${limit} - n },
                       { k:'Fits', v:(n <= ${limit} ? 'Yes' : 'Over by ' + (n - ${limit})) }
                     ], pct:Math.min(100, Math.round(n / ${limit} * 100)) }
                 ] };
      });`
    : `
      pv.bind('#outputText', function (el) {
        var v = el.value; if (!v || !v.trim()) return null;
        var st = TP.stats(v);
        return { kind:'text', text:v, label:'Generated', words:st.words,
                 reading:TP.readingTime(st.words), size:${blob('v')} };
      });`
  };
});


/* =============================================================== TEXT ==== */
Object.assign(PREVIEWS, {
  'find-and-replace': {
    heading:'Result', sub:'The text after every replacement, exactly as this tool writes it to the output box.',
    variant:'text',
    cards:[{title:'After replacing',badge:'live'}],
    adapter:`
      pv.bind('#frOutput', function (el) {
        var v = el.value; if (!v || !v.trim()) return null;
        var st = TP.stats(v);
        return { kind:'text', text:v, label:'Output box', words:st.words, size:${blob('v')} };
      });`
  },
  'line-list-tools': {
    heading:'Result', sub:'Each line exactly as this tool produced it, in the order and numbering you chose.',
    variant:'code',
    cards:[{title:'Numbered lines',badge:'live'}],
    adapter:`
      pv.bind('#lineOutput', function (el) {
        var v = el.value; if (!v || !v.trim()) return null;
        return { kind:'code', text:v, label:'Output box',
                 lines:v.split(String.fromCharCode(10)).length, size:${blob('v')} };
      });`
  },
  'lorem-ipsum-generator': {
    heading:'Generated placeholder text',
    sub:'The placeholder text exactly as generated, with its real paragraph and word count.',
    variant:'text',
    cards:[{title:'Your text',badge:'live'}],
    adapter:`
      pv.bind('#loremOutput', function (el) {
        var v = el.value; if (!v || !v.trim()) return null;
        var st = TP.stats(v);
        return { kind:'text', text:v, label:'Generated', words:st.words,
                 reading:TP.readingTime(st.words), size:${blob('v')} };
      });`
  },
  'readability-checker': {
    heading:'Readability of your text',
    sub:'The scores this tool calculates, shown with the real figures behind them.',
    variant:'stats',
    cards:[{title:'Scores',badge:'live'}],
    adapter:`
      /* The scores live in separate elements (#fleschScore, #gradeLevel, ...) with
         no "Label: value" text to parse, so scanning the container's text found
         nothing and this preview stayed empty. Read the elements themselves. */
      pv.bind('#readResult', function (el) {
        if (el.style.display === 'none') return null;
        var ids = [['fleschLabel','Reading ease'],['fleschScore','Flesch score'],
                   ['gradeLevel','Grade level'],['avgSentLen','Average sentence'],
                   ['avgSyll','Average syllables'],['wordCountStat','Words']];
        var rows = [];
        ids.forEach(function (pair) {
          var n = document.getElementById(pair[0]); if (!n) return;
          var v = (n.value !== undefined ? n.value : n.innerText || '').trim();
          if (v && v !== '\\u2014' && v !== '-') rows.push({ k:pair[1], v:v });
        });
        if (!rows.length) return null;
        return { kind:'stats', rows:rows, label:'This tool calculates', sub:'Live' };
      });`
  },
  'readability-score-checker': {
    heading:'Readability of your text',
    sub:'The scores this tool calculates, shown with the real figures behind them.',
    variant:'stats',
    cards:[{title:'Scores',badge:'live'}],
    adapter:`
      pv.bind('#readResults', function (el) {
        var t = (el.innerText || '').trim();
        if (!t || el.style.display === 'none') return null;
        var rows = [];
        t.split(String.fromCharCode(10)).forEach(function (line) {
          var m = /^([A-Za-z][A-Za-z0-9 ()-]{1,28}?)\\s*[:\\-]\\s*(.+)$/.exec(line.trim());
          if (m) rows.push({ k:m[1].trim(), v:m[2].trim() });
        });
        if (!rows.length) return null;
        return { kind:'stats', rows:rows, label:'This tool calculates', sub:'Live' };
      });`
  },
  'remove-duplicate-lines': {
    heading:'Deduplicated result',
    sub:'The lines exactly as this tool returns them, with the real count before and after.',
    variant:'code',
    cards:[{title:'After removing duplicates',badge:'live'}],
    adapter:`
      pv.bind('#linesOutput', function (el) {
        var v = el.value; if (!v || !v.trim()) return null;
        var before = document.getElementById('sortInput') || document.getElementById('inputText');
        var raw = before ? (before.value || '') : '';
        var n0 = raw ? raw.split(String.fromCharCode(10)).filter(function(x){return x.trim();}).length : 0;
        var n1 = v.split(String.fromCharCode(10)).filter(function(x){return x.trim();}).length;
        return { kind:'code', text:v, label:n1 + ' unique of ' + (n0 || n1),
                 lines:n1, size:${blob('v')} };
      });`
  },
  'text-cleaner': {
    heading:'Cleaned text',
    sub:'The text exactly as this tool cleans it, with the real count of characters removed.',
    variant:'text',
    cards:[{title:'After cleaning',badge:'live'}],
    adapter:`
      pv.bind('#cleanOutput', function (el) {
        var v = el.value; if (!v || !v.trim()) return null;
        var src = document.getElementById('cleanInput') || document.getElementById('textInput');
        var before = src ? (src.value || '').length : 0;
        var st = TP.stats(v);
        return { kind:'text', text:v, label:'After cleaning', words:st.words,
                 sub:before > v.length ? (before - v.length) + ' characters removed' : 'Live',
                 size:${blob('v')} };
      });`
  },
  'text-compare': {
    heading:'Differences',
    sub:'The comparison exactly as this tool renders it, line by line, in its own colours.',
    variant:'code',
    cards:[{title:'Side by side',badge:'live',lang:'diff'}],
    adapter:`
      pv.bind('#diffOutput', function (el) {
        var t = (el.innerText || '').trim();
        if (!t) return null;
        return { kind:'code', text:t, label:'Comparison',
                 meta:document.getElementById('compareMeta') ? '' : '', sub:'Live' };
      });`
  },
  'text-extractor': {
    heading:'What was found',
    sub:'The emails, URLs and other items this tool extracted, grouped exactly as it groups them.',
    variant:'tiles',
    cards:[{title:'Extracted',badge:'live',tiles:'row'}],
    adapter:`
      pv.bind('#extractResults', function (el) {
        var t = (el.innerText || '').trim();
        if (!t || el.style.display === 'none') return null;
        var tiles = [];
        el.querySelectorAll('li, .ext-item, .result-item, span').forEach(function (n) {
          var v = (n.textContent || '').trim();
          if (v && v.length < 90 && tiles.length < 24) tiles.push({ glyph:v, cap:'' });
        });
        if (!tiles.length) tiles.push({ glyph:t.slice(0, 80) });
        return { kind:'tiles', tiles:tiles, label:'Extracted', sub:tiles.length + ' item(s)' };
      });`
  },
  'text-sorter-line-counter': {
    heading:'Sorted result',
    sub:'The lines exactly as this tool sorts them, with the real count.',
    variant:'code',
    cards:[{title:'Sorted',badge:'live'}],
    adapter:`
      pv.bind('#sortOutput', function (el) {
        var v = el.value; if (!v || !v.trim()) return null;
        var n = v.split(String.fromCharCode(10)).filter(function(x){return x.trim();}).length;
        return { kind:'code', text:v, label:n + (n===1?' line':' lines'), lines:n, size:${blob('v')} };
      });`
  },
  'online-text-case-converter': {
    heading:'Converted text',
    sub:'The text exactly as this tool converts it, in the case you selected.',
    variant:'text',
    cards:[{title:'Converted',badge:'live'}],
    adapter:`
      pv.bind('#textInput', function (el) {
        var v = el.value; if (!v || !v.trim()) return null;
        var st = TP.stats(v);
        return { kind:'text', text:v, label:'Converted', words:st.words, size:${blob('v')} };
      });`
  }
});

/* ========================================================= DEVELOPER ==== */
Object.assign(PREVIEWS, {
  'html-css-js-minifier': {
    heading:'Minified output',
    sub:'The minified code exactly as this tool writes it, with the real percentage saved.',
    variant:'code',
    cards:[{title:'Minified',badge:'live'},{title:'Savings',badge:'measured'}],
    adapter:`
      pv.bind('#codeOutput', function (el) {
        var v = el.value; if (!v || !v.trim()) return null;
        var src = document.getElementById('codeInput');
        var before = src ? (src.value || '').length : 0;
        var after = v.length;
        var pct = before ? Math.round((before - after) / before * 100) : 0;
        return { kind:'code', label:'Minified', size:${blob('v')}, text:v,
                 cells:[
                   { text:v, label:'Minified', sub:before + ' ? ' + after + ' bytes' },
                   { rows:[{k:'Before',v:before},{k:'After',v:after},
                           {k:'Saved',v:(before-after) + ' bytes'},
                           {k:'Reduction',v:pct + '%'}],
                     pct:pct, label:'Measured', sub:TP.bytes(before) + ' ? ' + TP.bytes(after) }
                 ] };
      });`
  },
  'html-entity-encoder-decoder': {
    heading:'Encoded or decoded',
    sub:'The result exactly as this tool produces it, with the characters it changed.',
    variant:'code',
    cards:[{title:'Result',badge:'live'}],
    adapter:`
      pv.bind('#entityOutput', function (el) {
        var v = el.value; if (!v || !v.trim()) return null;
        return { kind:'code', text:v, label:'Output box', size:${blob('v')} };
      });`
  },
  'url-encoder-decoder': {
    heading:'Encoded or decoded URL',
    sub:'The result exactly as this tool produces it.',
    variant:'code',
    cards:[{title:'Result',badge:'live'}],
    adapter:`
      pv.bind('#urlOutput', function (el) {
        var v = el.value; if (!v || !v.trim()) return null;
        return { kind:'code', text:v, label:'Output box', size:${blob('v')} };
      });`
  },
  'json-csv-converter': {
    heading:'Converted data',
    sub:'The converted data exactly as this tool writes it, with its real row and column count.',
    variant:'code',
    cards:[{title:'Converted',badge:'live'}],
    adapter:`
      pv.bind('#dataOutput', function (el) {
        var v = el.value; if (!v || !v.trim()) return null;
        var lines = v.split(String.fromCharCode(10)).filter(function(x){return x.trim();});
        var cols = (lines[0] || '').split(/[\\t,]/).length;
        return { kind:'code', text:v, label:lines.length + ' row(s) � ' + cols + ' column(s)',
                 lines:lines.length, size:${blob('v')} };
      });`
  },
  'base64-encoder-decoder': {
    heading:'Encoded or decoded',
    sub:'The result exactly as this tool produces it, with its real length.',
    variant:'code',
    cards:[{title:'Result',badge:'live'}],
    adapter:`
      pv.bind('#b64Output', function (el) {
        var v = el.value; if (!v || !v.trim()) return null;
        var st = TP.stats(v);
        return { kind:'code', text:v, label:'Output box', lines:st.lines,
                 size:${blob('v')} };
      });`
  },
  'jwt-decoder': {
    heading:'Decoded token',
    sub:'The header and payload exactly as this tool decodes them. The signature is not verified here and is not shown as if it were.',
    variant:'code',
    cards:[{title:'Header',badge:'JSON'},{title:'Payload',badge:'JSON'}],
    adapter:`
      function jwt() {
        var h = document.getElementById('headerOut');
        var pl = document.getElementById('payloadOut');
        if (!h || !pl) return null;
        var a = (h.value !== undefined ? h.value : h.innerText || '').trim();
        var b = (pl.value !== undefined ? pl.value : pl.innerText || '').trim();
        if (!a && !b) return null;
        return { kind:'code', lang:'json', text:'', cells:[
          { text:a, label:'Header', sub:a ? a.split(String.fromCharCode(10)).length + ' line(s)' : '' },
          { text:b, label:'Payload', sub:b ? b.split(String.fromCharCode(10)).length + ' line(s)' : '' }
        ] };
      }
      pv.bind('#jwtInput', function () { return jwt(); });`
  },
  'regex-tester': {
    heading:'Matches',
    sub:'Your pattern and the text, with every match this tool found highlighted where it found it.',
    variant:'code',
    cards:[{title:'Matches',badge:'live'}],
    adapter:`
      pv.bind('#highlightOutput', function (el) {
        var t = (el.innerText || '').trim();
        if (!t) return null;
        var m = document.getElementById('matchCount');
        return { kind:'code', text:t, label:'Matches',
                 sub:m ? (m.textContent || '').trim() : 'Live' };
      });`
  },
  'markdown-html-converter': {
    heading:'Converted output',
    sub:'The HTML this tool generates, beside the rendered result it produces from that HTML.',
    variant:'code',
    cards:[{title:'HTML',badge:'live',lang:'html'},{title:'Rendered',badge:'preview'}],
    adapter:`
      function md() {
        var out = document.getElementById('mdOutput');
        var prev = document.getElementById('previewBox');
        if (!out) return null;
        var v = (out.value !== undefined ? out.value : out.innerText || '').trim();
        if (!v) return null;
        return { kind:'code', text:'', cells:[
          { kind:'code', lang:'html', text:v, label:'HTML', size:${blob('v')} },
          { kind:'text', text:(prev ? (prev.innerText || '') : v), label:'Rendered',
            allowHeadings:false }
        ] };
      }
      pv.bind('#mdOutput', function () { return md(); });`
  },
  'hash-generator': {
    heading:'Digests',
    sub:'The digests this tool calculates, exactly as it writes them.',
    variant:'code',
    cards:[{title:'Hashes',badge:'live'}],
    adapter:`
      /* #compareResult only fills in "Compare two hashes" mode; the digests the
         tool actually computes are written to #hashList. Bound to the wrong one,
         the preview stayed empty in the default tab. Read both. */
      pv.bind('#hashList', function (el) {
        var t = (el.innerText || '').trim();
        if (!t) {
          var c = document.getElementById('compareResult');
          t = c ? (c.innerText || '').trim() : '';
        }
        if (!t) return null;
        var lines = t.split(String.fromCharCode(10)).filter(function (x) { return x.trim(); });
        return { kind:'code', text:t, label:'Digests', sub:lines.length + ' shown',
                 lines:lines.length };
      });`
  },
  'url-parser': {
    heading:'Parsed URL',
    sub:'The URL broken into the parts this tool reads out of it.',
    variant:'stats',
    cards:[{title:'Components',badge:'live'}],
    adapter:`
      /* There is no result box and no button on this tool: it renders into the
         bodies of two tables as you type. The earlier version looked for a
         #parseResult element that has never existed, so the mapper returned null
         on every poll and the preview stayed empty. Read the tables themselves. */
      pv.bind('#urlParseInput', function (el) {
        if (!el.value || !el.value.trim()) return null;
        function rowsOf(id) {
          var b = document.getElementById(id);
          if (!b) return [];
          return [].slice.call(b.querySelectorAll('tr')).map(function (tr) {
            var c = [].slice.call(tr.querySelectorAll('th,td')).map(function (x) {
              return (x.textContent || '').trim();
            });
            return c.length >= 2 ? { k:c[0], v:c[1] } : null;
          }).filter(Boolean);
        }
        var rows = rowsOf('partsBody').concat(rowsOf('paramsBody'));
        if (!rows.length) return null;
        return { kind:'stats', rows:rows, label:'This tool reads', sub:'Live' };
      });`
  },
  'unix-timestamp-converter': {
    heading:'Converted date and time',
    sub:'The same moment expressed in each format this tool converts to, all from your timestamp.',
    variant:'stats',
    cards:[{title:'Formats',badge:'live'}],
    adapter:`
      pv.bind('#tsInput', function () {
        var ids = ['dateResult','localDateOut','utcDateOut','isoOut','dayOut','stampResult'];
        var rows = [];
        ids.forEach(function (id) {
          var n = document.getElementById(id); if (!n) return;
          var v = (n.value !== undefined ? n.value : n.innerText || '').trim();
          if (v && v !== '�' && v !== '-') rows.push({ k:id.replace(/Out$|Result$/,''), v:v });
        });
        if (!rows.length) return null;
        return { kind:'stats', rows:rows, label:'This tool converts to', sub:'Live' };
      });`
  }
});

/* Every injected adapter is parsed with node --check before the page is written.
 *
 * This gate exists because a silent failure cost real time: one adapter shipped
 * with a literal newline inside a string literal, so the whole inline block threw
 * a SyntaxError, the preview stayed on its empty state, and nothing in the page
 * said why. Worse, bind() catches mapper exceptions, so even a runtime failure in
 * an adapter is invisible by design. Parsing the generated code catches the whole
 * class before it can reach a page. */
function assertAdapterParses(slug, html) {
  const i = html.indexOf('<!-- =================== PREVIEW =================== -->');
  if (i < 0) throw new Error(slug + ': PREVIEW marker missing after injection');
  const seg = html.slice(i);
  const m = /<script>([\s\S]*?)<\/script>/.exec(seg);
  if (!m) throw new Error(slug + ': adapter script missing after injection');
  const file = path.join(os.tmpdir(), 'ewt-adapter-' + slug.replace(/[^a-z0-9]+/gi, '_') + '.js');
  fs.writeFileSync(file, m[1]);
  try {
    execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' });
  } catch (e) {
    const msg = String(e.stderr || e.message).split('\n').filter(l => /Error/.test(l))[0] || 'parse error';
    throw new Error(slug + ': generated adapter does not parse - ' + msg);
  } finally {
    try { fs.unlinkSync(file); } catch (e) { /* best effort */ }
  }
}

/* Merge the image / PDF / SEO / utility families. */
Object.assign(PREVIEWS, IMAGE, PDF, SEO, UTIL);

/* ================================================================ run === */

const files = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name === 'index.html') files.push(p);
  }
})(path.join(ROOT, 'tools'));

const targets = files
  .map(f => path.relative(ROOT, f).split(path.sep).join('/').replace('tools/', '').replace('/index.html', ''))
  .filter(slug => PREVIEWS[slug] && (!ONLY.length || ONLY.includes(slug)));

let done = 0, skipped = 0;
for (const slug of targets) {
  const file = path.join(ROOT, 'tools', slug, 'index.html');
  let before = fs.readFileSync(file, 'utf8');

  if (before.includes('data-tool-preview')) {
    if (!FORCE) { skipped++; console.log('  skip (already present)  ' + slug); continue; }
    before = stripInjected(before);
  }
  if (before.includes('class="mock-grid"')) {
    skipped++;
    console.log('  skip (reference preview already ships here)  ' + slug);
    continue;
  }

  let after = injectCss(before);
  after = injectScript(after, slug);
  after = injectSection(after, slug, PREVIEWS[slug], slug.replace(/[^a-z0-9]+/gi, '-'));

  /* guards - never ship a page that lost structure */
  const h1 = s => (s.match(/<h1[ >]/g) || []).length;
  const scripts = s => (s.match(/<script[\s>]/g) || []).length;
  if (h1(after) !== h1(before)) throw new Error(slug + ': h1 count changed');
  if (!after.includes('tool-preview.js')) throw new Error(slug + ': script not injected');
  /* exactly two new script tags: the component loader and the per-tool adapter */
  if (scripts(after) !== scripts(before) + 2)
    throw new Error(slug + ': expected +2 script tags, got ' + (scripts(after) - scripts(before)));
  /* The CSS must land inside an existing <style>, never a new one.
     Counted with `</style>` rather than `<style`: preview.css explains itself in a
     comment that contains the literal text "<style>", so an opening-tag count
     matched its own documentation and reported two extra blocks. */
  if ((after.match(/<\/style>/g) || []).length > (before.match(/<\/style>/g) || []).length + 1)
    throw new Error(slug + ': too many new style blocks');
  if ((after.match(/<\/style>/g) || []).length !== (before.match(/<\/style>/g) || []).length &&
      !before.includes('</style>'))
    throw new Error(slug + ': expected a style block to be created');
  if ((after.split(CSS_MARK).length - 1) !== 1) throw new Error(slug + ': CSS marker not present exactly once');
  if (!after.includes('data-tool-preview')) throw new Error(slug + ': preview section missing');

  assertAdapterParses(slug, after);

  if (APPLY) fs.writeFileSync(file, after, 'utf8');
  done++;
  console.log('  ' + (APPLY ? 'applied  ' : 'planned  ') + slug.padEnd(30) +
    PREVIEWS[slug].cards.length + ' card(s)');
}

console.log('\n  preview sections: ' + done + (APPLY ? ' applied' : ' planned') + ', ' + skipped + ' skipped');
console.log('  configured in this file: ' + Object.keys(PREVIEWS).length);
if (!APPLY) console.log('\n  run again with --apply to write');
