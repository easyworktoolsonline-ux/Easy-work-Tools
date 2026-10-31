/* ---------------------------------------------------------------------------
 * Page generator for the browser-side image tools.
 *
 * Every page is cut from the live Image Format Converter page, so the head
 * (fonts, CSS variables, theme), header, search panel, footer, ad slots and
 * structured-data shape are byte-identical to the rest of the site. Only the
 * tool-specific parts are replaced: meta tags, hero + result panel, SEO text,
 * FAQ, JSON-LD and the tool script.
 *
 *   node scripts/image-tools/build.mjs        (from the project root)
 *
 * It is idempotent: running it again rewrites the same files.
 * ------------------------------------------------------------------------- */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';

export const SITE = 'https://easyworktools.online';
const TEMPLATE = 'tools/image-format-converter/index.html';

export const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const jsonEsc = s => JSON.stringify(s).replace(/</g, '\\u003c');

/* ----------------------------- UI building blocks ----------------------------- */
export const ui = {
  chips(id, opts, active) {
    return `<div class="platform-row" id="${id}" style="margin:0 0 16px">` + opts.map(o =>
      `<span class="platform-chip${o.v === active ? ' is-active' : ''}" data-v="${esc(o.v)}" role="button" tabindex="0"><i class="dot"></i>${esc(o.l)}</span>`).join('') + '</div>';
  },
  label(text) { return `<span class="opt-label">${text}</span>`; },
  slider(id, label, min, max, val, unit = '', step = 1) {
    return `<div class="slider-group"><label for="${id}">${label} <b id="${id}V">${val}${unit}</b></label><input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${val}"></div>`;
  },
  color(id, label, val, hint = '') {
    return `<div class="slider-group"><label for="${id}">${label} <input type="color" id="${id}" value="${val}" class="ewt-color"></label>${hint ? `<small class="opt-hint">${hint}</small>` : ''}</div>`;
  },
  select(id, label, opts, val) {
    return `<div class="slider-group"><label for="${id}">${label}</label><select id="${id}" class="ewt-select">${opts.map(o => `<option value="${esc(o.v)}"${o.v === val ? ' selected' : ''}>${esc(o.l)}</option>`).join('')}</select></div>`;
  },
  check(id, label, checked = false, hint = '') {
    return `<div class="slider-group"><label class="ewt-check"><input type="checkbox" id="${id}"${checked ? ' checked' : ''}> <span>${label}</span></label>${hint ? `<small class="opt-hint">${hint}</small>` : ''}</div>`;
  },
  note(id, text = '', cls = 'info') { return `<p class="status-msg${text ? ' show ' + cls : ''}" id="${id}" style="${text ? '' : 'display:none;'}margin:10px 0 0">${text}</p>`; },
};

/* The tool-specific CSS that the converter page does not already carry. Variables and
   class names reuse the page's own design tokens, with explicit dark-mode rules. */
export const EXTRA_CSS = `
/* ===== image tool extras (EasyWorkTools image tools) ===== */
.checker{background-color:#fff;background-image:linear-gradient(45deg,#e5e7eb 25%,transparent 25%,transparent 75%,#e5e7eb 75%),linear-gradient(45deg,#e5e7eb 25%,transparent 25%,transparent 75%,#e5e7eb 75%);background-size:16px 16px;background-position:0 0,8px 8px}
html[data-theme=dark] .checker{background-color:#1f2937;background-image:linear-gradient(45deg,#374151 25%,transparent 25%,transparent 75%,#374151 75%),linear-gradient(45deg,#374151 25%,transparent 25%,transparent 75%,#374151 75%)}
.preview-box{border:1px solid var(--border);border-radius:14px;overflow:auto;max-height:520px;display:flex;align-items:center;justify-content:center;padding:6px;min-height:160px}
.preview-box canvas,.preview-box img,.preview-box svg{max-width:100%;height:auto;display:block}
.opt-label{display:block;font-size:11.5px;font-weight:900;color:var(--text-muted);margin-bottom:7px}
.opt-hint{display:block;opacity:.78;margin-top:4px;font-size:12px;line-height:1.5}
.ewt-select{width:100%;border:1px solid var(--border);border-radius:10px;padding:10px 12px;background:var(--card-bg);color:var(--text-main);font-size:14px;font-weight:700}
.ewt-color{vertical-align:middle;margin-left:6px;width:44px;height:28px;padding:0;border:1px solid var(--border);border-radius:6px;background:none}
.ewt-check{display:flex!important;align-items:center;gap:8px;justify-content:flex-start!important;font-size:13px!important;color:var(--text-main)!important;cursor:pointer}
.ewt-check input{width:17px;height:17px;accent-color:#111827}
.ewt-text,.ewt-num{width:100%;border:1px solid var(--border);border-radius:10px;padding:10px 12px;background:var(--card-bg);color:var(--text-main);font-size:14px}
.ewt-text:focus,.ewt-num:focus,.ewt-select:focus{outline:2px solid var(--yellow-accent);outline-offset:1px}
textarea.ewt-text{min-height:150px;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:13px;resize:vertical}
.kv{display:grid;grid-template-columns:auto 1fr;gap:4px 14px;font-size:12.5px;margin:0 0 16px}
.kv dt{color:var(--text-muted);font-weight:800}.kv dd{margin:0;color:var(--text-main);font-weight:800;word-break:break-word}
.thumb-row{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0 0}
.thumb-row .th{position:relative;width:64px;height:64px;border:1px solid var(--border);border-radius:10px;overflow:hidden}
.thumb-row .th img{width:100%;height:100%;object-fit:cover;display:block}
.thumb-row .th button{position:absolute;top:2px;right:2px;border:0;border-radius:50%;width:18px;height:18px;line-height:16px;font-size:12px;background:rgba(17,24,39,.8);color:#fff;padding:0}
.ewt-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(88px,1fr));gap:8px;max-height:420px;overflow:auto;padding:4px}
.ewt-icon{border:1px solid var(--border);border-radius:12px;background:var(--card-bg);color:var(--text-main);aspect-ratio:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;padding:6px;font-size:10.5px;font-weight:800;line-height:1.2;text-align:center}
.ewt-icon svg{width:30px;height:30px;fill:currentColor}.ewt-icon:hover,.ewt-icon.is-on{border-color:var(--black);box-shadow:0 0 0 3px rgba(250,204,21,.25)}
.ewt-icon span{max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ewt-tabs{display:flex;gap:6px;flex-wrap:wrap;margin:0 0 14px}
.ewt-list{list-style:none;margin:0 0 14px;padding:0;display:grid;gap:8px}
.ewt-list li{display:flex;gap:10px;align-items:center;justify-content:space-between;border:1px solid var(--border);border-radius:12px;padding:10px 12px;font-size:13px;font-weight:700;background:var(--card-bg)}
.ewt-list li span.n{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}
.ewt-list li .st{font-size:12px;color:var(--text-muted);white-space:nowrap}
.ewt-list li .st.bad{color:#b91c1c}.ewt-list li .st.good{color:#166534}
.ewt-table{width:100%;border-collapse:collapse;font-size:13px;margin:0 0 12px}
.ewt-table th,.ewt-table td{border:1px solid var(--border);padding:6px 8px;text-align:left}
.ewt-table input{width:100%;border:0;background:transparent;color:var(--text-main);font-size:13px;padding:4px}
.ewt-table input[type=color]{width:34px;height:24px;padding:0}
.ewt-table button{border:0;background:none;color:#b91c1c;font-weight:900}
.stage-hint{font-size:12px;color:var(--text-muted);margin:6px 2px 0}
.attribution{font-size:12px;color:var(--text-muted)}
html[data-theme=dark] .ewt-select,html[data-theme=dark] .ewt-text,html[data-theme=dark] .ewt-num{background:#0f172a;color:#e2e8f0;border-color:#334155}
html[data-theme=dark] .ewt-list li,html[data-theme=dark] .ewt-icon{background:#0f172a;color:#e2e8f0;border-color:#334155}
html[data-theme=dark] .ewt-icon:hover,html[data-theme=dark] .ewt-icon.is-on{border-color:#f8fafc}
html[data-theme=dark] .ewt-table input{color:#e2e8f0}
html[data-theme=dark] .ewt-check input{accent-color:#facc15}
`;

/* ----------------------------- page assembly ----------------------------- */
function between(src, startMark, endMark, from = 0) {
  const a = src.indexOf(startMark, from);
  if (a < 0) throw new Error('template marker not found: ' + startMark);
  const b = src.indexOf(endMark, a + startMark.length);
  if (b < 0) throw new Error('template end marker not found: ' + endMark);
  return [a, b + endMark.length];
}

export function renderPage(spec, root, relatedCards) {
  let html = readFileSync(path.join(root, TEMPLATE), 'utf8');
  const url = `${SITE}/tools/${spec.slug}/`;
  const set = (re, val) => { if (!re.test(html)) throw new Error('meta pattern missing: ' + re); html = html.replace(re, () => val); };

  set(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${esc(spec.metaDescription)}">`);
  set(/<meta name="keywords" content="[^"]*">/, `<meta name="keywords" content="${esc(spec.keywords.join(', '))}">`);
  set(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${url}">`);
  set(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${esc(spec.metaTitle)}">`);
  set(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${esc(spec.metaDescription)}">`);
  set(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${url}">`);
  set(/<meta name="twitter:title" content="[^"]*">/, `<meta name="twitter:title" content="${esc(spec.metaTitle)}">`);
  set(/<meta name="twitter:description" content="[^"]*">/, `<meta name="twitter:description" content="${esc(spec.metaDescription)}">`);
  set(/<title>[^<]*<\/title>/, `<title>${esc(spec.metaTitle)}</title>`);

  /* hero + result panel */
  {
    const [a] = between(html, '<section class="tool-hero"', '</section>');
    const [, b] = between(html, '<section class="result-panel"', '</section>', a);
    html = html.slice(0, a) + heroAndResult(spec) + html.slice(b);
  }
  /* SEO + FAQ + related */
  {
    const [a, b] = between(html, '<section class="tool-seo-content"', '</section>');
    html = html.slice(0, a) + seoSection(spec, relatedCards) + html.slice(b);
  }
  /* JSON-LD (two lines) */
  {
    const marker = '<script type="application/ld+json">';
    const a1 = html.indexOf(marker), e1 = html.indexOf('</script>', a1) + 9;
    const a2 = html.indexOf(marker, e1), e2 = html.indexOf('</script>', a2) + 9;
    const app = {
      '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: spec.name, url,
      applicationCategory: 'MultimediaApplication', operatingSystem: 'Any', browserRequirements: 'Requires JavaScript',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }, description: spec.metaDescription,
      featureList: spec.features, publisher: { '@type': 'Organization', name: 'EasyWorkTools.online', url: SITE + '/' },
    };
    const faq = {
      '@context': 'https://schema.org', '@type': 'FAQPage', '@id': url + '#faq',
      mainEntity: spec.faqs.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a.replace(/<[^>]+>/g, '') } })),
    };
    html = html.slice(0, a1) + marker + jsonEsc(app) + '</script>\n' + marker + jsonEsc(faq) + '</script>' + html.slice(e2);
  }
  /* tool script */
  {
    const [a] = between(html, '<!-- =================== TOOL SCRIPT =================== -->', '<script>');
    const sEnd = html.indexOf('</script>', a);
    const libs = (spec.libs || []).map(l => `<script src="../../assets/image-tools/${l}.js"></script>`).join('\n');
    html = html.slice(0, a) +
      '<!-- =================== TOOL SCRIPT =================== -->\n' + libs + (libs ? '\n' : '') +
      '<script>\n(function(){\n"use strict";\n' + PRELUDE + '\n' + spec.script + '\n})();\n</script>' + html.slice(sEnd + 9);
  }
  /* head tweaks */
  html = html.replace('<script src="../../assets/tool-preview.js" defer></script>\n', '');
  html = html.replace('<script src="../../assets/tool-preview.js" defer></script>', '');
  if (spec.needsLazy && !html.includes('lazy-libs.js')) html = html.replace('</head>', '<script src="../../assets/vendor/lazy-libs.js" defer></script>\n</head>');
  html = html.replace('</head>', `<style id="image-tool-extras">${EXTRA_CSS}${spec.extraCss || ''}</style>\n</head>`);
  /* the template carries the toast element twice; one is enough */
  const toast = '<div id="toast" role="status" aria-live="polite">Done</div>';
  const t1 = html.indexOf(toast), t2 = html.indexOf(toast, t1 + 1);
  if (t2 > 0) html = html.slice(0, t2) + html.slice(t2 + toast.length);
  return html;
}

const PRELUDE = `var $=EWT.$,fmtBytes=EWT.fmtBytes,msgOf=EWT.msgOf;
var dropzone=$("dropzone"),fileInput=$("fileInput"),statusMsg=$("statusMsg"),resultPanel=$("resultPanel");
var downloadBtn=$("downloadBtn"),resetBtn=$("resetBtn");
function showStatus(msg,type){EWT.status(statusMsg,msg,type)}`;

function heroAndResult(spec) {
  return `<section class="tool-hero" aria-labelledby="toolTitle">
      <h1 id="toolTitle">${esc(spec.name)}</h1>
      <p class="lede">${spec.lede}</p>

${spec.noDrop ? '' : `      <div class="dropzone" id="dropzone" tabindex="0" role="button" aria-label="${esc(spec.dropAria || 'Choose a file')}">
        <strong>${spec.dropTitle || 'Drop a file here, or click to browse'}</strong>
        <span>${spec.dropSub}</span>
      </div>
      <input type="file" id="fileInput" accept="${esc(spec.accept)}"${spec.multiple ? ' multiple' : ''}>`}
${spec.heroExtra || ''}
      <div class="status-msg" id="statusMsg" role="alert"></div>
    </section>

    <section class="result-panel" id="resultPanel" aria-live="polite">
      <div class="result-card">
        <div class="result-stage">
${spec.stage}
        </div>
        <div class="result-side">
${spec.side}
          <div class="action-row" style="margin-top:16px">
            <button class="btn-download" type="button" id="downloadBtn">${esc(spec.downloadLabel || 'Download')}</button>
            <button class="btn-ghost" type="button" id="resetBtn">${esc(spec.resetLabel || 'Start over')}</button>
          </div>
        </div>
      </div>
    </section>`;
}

function seoSection(spec, related) {
  const rel = related.map(r => `<a class="related-card" href="../${r.slug}/"><h3>${esc(r.title)}</h3><p>${esc(r.desc)}</p></a>`).join('');
  return `<section class="tool-seo-content" aria-labelledby="seoHeading">
    <div class="seo-inner">
    <h2 id="seoHeading">${esc(spec.seoHeading)}</h2>
    ${spec.seoHtml}

    <div class="faq">
      <h3>${esc(spec.name)} FAQ</h3>
${spec.faqs.map(f => `      <details><summary>${esc(f.q)}</summary><p>${f.a}</p></details>`).join('\n')}
    </div>

    <div class="related-block">
      <h2>More free tools on EasyWorkTools.online</h2>
      <div class="related-grid">${rel}</div>
    </div>
    </div>
    </section>`;
}

export function writeTool(spec, root, relatedCards) {
  const dir = path.join(root, 'tools', spec.slug);
  mkdirSync(dir, { recursive: true });
  const html = renderPage(spec, root, relatedCards);
  writeFileSync(path.join(dir, 'index.html'), '﻿' + html.replace(/^﻿/, ''));
  const tool = {
    title: spec.cardTitle || spec.name,
    description: spec.cardDescription,
    tags: spec.tags,
    url: `tools/${spec.slug}/`,
    iconKey: spec.iconKey || 'image',
    category: 'Image Tools',
  };
  writeFileSync(path.join(dir, 'tool.json'), JSON.stringify(tool, null, 2) + '\n');
}
