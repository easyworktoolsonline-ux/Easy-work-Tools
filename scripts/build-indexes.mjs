import { promises as fs, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import {
  validateCategories, toolCardAttrs, renderCarousel, renderFilter,
  renderCategoryPageBody, renderCategorySchema,
  MARK_START, MARK_END, fillMarked,
  CATEGORY_WARNINGS,
} from './category-sections.mjs';
import { CATEGORIES, catSlug, CARD_SCRIM } from './categories.mjs';
import { buildTabs, selectTools, buildIsland, assertPopularTools, slugByTitle, toolKey, ALL_TAB, CARD_SLOTS } from './popular-tools.mjs';
import { featuredToolIcon } from './featured-tool-icons.mjs';

/* Per-category intro copy, used as the page's visible intro AND as its meta
   description, so it has to read well on its own. Kept here rather than in the
   shell so each of the nine pages gets unique, keyword-accurate text instead of
   nine copies of one sentence. */
const CATEGORY_INTRO = {
  'ai-write': 'Write, rewrite, summarise and generate content with free AI writing tools that run in your browser.',
  'image': 'Resize, convert, compress, edit and inspect images online. Everything runs in your browser, so your photos never leave your device.',
  'pdf': 'Convert, merge, split, compress and watermark PDF files for free, with no account and nothing to install.',
  'developer': 'Format, encode, decode, validate and generate the things developers need constantly: JSON, Base64, JWT, regex, hashes and slugs.',
  'seo': 'Check and improve page SEO with free generators for meta tags, schema markup, sitemaps and robots.txt, plus on-page analysis.',
  'text': 'Count, clean, reformat, compare and extract text with fast utilities for lists, line endings, letter case and word statistics.',
  'converter': 'Convert between units and everyday measurements using a single free online converter.',
  'calculator': 'Quick, accurate calculators for everyday arithmetic, percentages and dates.',
  'utility': 'Small everyday utilities for generating secure passwords and converting colours.'
};

const root = process.cwd();

/* ------------------------------------------------------------------ *
 * Build-time card rendering
 *
 * /tools/ and /blog/ used to ship an empty grid that only app.js filled
 * in at runtime. That cost ~0.55 CLS (the footer jumps down ~20,000px
 * when the cards appear) and it hid 74 tool links and 67 article links
 * from any crawler that does not execute JavaScript. The cards are
 * therefore rendered here, into the static HTML, from the same manifests
 * the search index is built from.
 *
 * The icons come from the existing iconSvg() in assets/app.js, read as
 * text and evaluated once, so there is still exactly one definition of
 * every icon and no additional file is shipped to the browser. app.js
 * still re-renders the grids once it has traffic counts, which is a
 * no-op when those counts are empty.
 * ------------------------------------------------------------------ */
function loadIconSvg(appFile) {
  const source = readFileSync(appFile, 'utf8');
  const start = source.indexOf('function iconSvg(key){');
  if (start === -1) throw new Error('iconSvg() not found in assets/app.js');

  // Brace-match from the opening brace to find the exact end of the function.
  // A text search for "\n}" is not reliable here: app.js is hand-minified, so
  // several unrelated statements end that way later in the file.
  const open = source.indexOf('{', start);
  let depth = 0;
  let end = -1;
  for (let i = open; i < source.length; i++) {
    const ch = source[i];
    // Skip over string literals so braces inside them are not counted.
    if (ch === "'" || ch === '"' || ch === '`') {
      const quote = ch;
      i++;
      while (i < source.length && source[i] !== quote) {
        if (source[i] === '\\') i++;
        i++;
      }
      continue;
    }
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) { end = i + 1; break; }
    }
  }
  if (end === -1) throw new Error('could not find the end of iconSvg() in assets/app.js');

  const fnSource = source.slice(start, end);
  const iconSvg = new Function(fnSource + '\nreturn iconSvg;')();
  if (typeof iconSvg !== 'function') throw new Error('iconSvg() did not evaluate to a function');
  if (!iconSvg('age').startsWith('<svg')) throw new Error('iconSvg() produced invalid output');
  // Every key that has a real branch, so a typo'd iconKey can be caught here
  // instead of silently rendering the generic fallback tile on the page.
  const iconKeys = new Set([...fnSource.matchAll(/if\(key==='([^']+)'/g)].map((m) => m[1]));
  if (!iconKeys.size) throw new Error('iconSvg() exposes no key branches');
  return { iconSvg, iconKeys };
}

const { iconSvg, iconKeys } = loadIconSvg(path.join(root, 'assets/app.js'));

/* iconSvg() falls back to a generic tile for an unknown key. That is what let
   31 tools share one icon, so treat a missing key as a build error: the worst
   case is adding one branch to iconSvg(), never a broken page. */
function assertIconKey(key, where) {
  if (!iconKeys.has(key)) {
    throw new Error(`iconSvg() has no branch for "${key}" (used by ${where}). `
      + `Add an if(key==='${key}') branch to iconSvg() in assets/app.js.`);
  }
}

function escHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}


/* The canonical origin. Emitting absolute hrefs here matches exactly what
   app.js produces at runtime, so the traffic re-sort does not rewrite every
   href in the page. It also means the links work identically from any path. */
const SITE_ORIGIN = 'https://easyworktools.online/';
const cardHref = (rel) => SITE_ORIGIN + String(rel || '').replace(/^\/+/, '');

/* data-cat / data-tags are what make /tools/?cat= actually filter anything.
   The category cards on the homepage link to that query param; before these
   attributes existed the link resolved to the full 128-tool grid and the
   filter was a no-op. See scripts/category-sections.mjs. */
function toolCard(item, heading) {
  return '<a class="card" href="' + escHtml(cardHref(item.url)) + '"' + toolCardAttrs(item) + '>'
    + '<div class="card-top"><div class="icon icon-svg">' + iconSvg(item.iconKey || 'tool') + '</div></div>'
    + '<' + heading + '>' + escHtml(item.title) + '</' + heading + '>'
    + '<p>' + escHtml(item.description) + '</p></a>';
}

function articleCard(item, heading) {
  return '<a class="card blog-card" href="' + escHtml(cardHref(item.url)) + '">'
    + '<div class="card-top"><div class="icon icon-svg">' + iconSvg('blog') + '</div></div>'
    + '<' + heading + '>' + escHtml(item.title) + '</' + heading + '>'
    + '<p>' + escHtml(item.description) + '</p></a>';
}

/* Card grids are generated between two marker comments, so a rebuild strips the
   previous output and re-renders from the current manifest. The element may
   carry extra attributes (the homepage grid has data-limit), so the opening tag
   is matched whole rather than by a fixed prefix. */
const CARD_OPEN = '<!-- ewt:cards:start -->';
const CARD_END = '<!-- ewt:cards:end -->';

function fillGrid(html, gridId, markup) {
  const openRe = new RegExp('<div class="grid" id="' + gridId + '"[^>]*>');
  const m = openRe.exec(html);
  if (!m) return html;

  // The grid's real closing tag has to be found by counting div depth. A lazy
  // regex cannot do this: every card is <a><div class="card-top"><div>...</div></div></a>,
  // so `([\s\S]*?)(</div>)` stops at the first inner </div> and leaves the rest
  // of the previous render stranded outside the replaced region - which made
  // the build append a fresh set of cards on every run instead of replacing
  // them. Counting depth is exact and costs one pass over the grid.
  const openEnd = m.index + m[0].length;
  let depth = 1;
  let i = openEnd;
  let closeStart = -1;
  while (i < html.length) {
    const nextOpen = html.indexOf('<div', i);
    const nextClose = html.indexOf('</div>', i);
    if (nextClose === -1) break;
    if (nextOpen !== -1 && nextOpen < nextClose) { depth++; i = nextOpen + 4; continue; }
    depth--;
    if (depth === 0) { closeStart = nextClose; break; }
    i = nextClose + 6;
  }
  if (closeStart === -1) return html;

  // A hand-authored grid (one that has content but no generated markers) is
  // left alone, so nothing outside this build is ever overwritten.
  const existing = html.slice(openEnd, closeStart).trim();
  if (existing && !existing.startsWith(CARD_OPEN)) return html;

  const body = markup ? CARD_OPEN + markup + CARD_END : '';
  return html.slice(0, openEnd) + body + html.slice(closeStart);
}

async function walk(dir) {
  const out = [];
  for (const e of await fs.readdir(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.')) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...await walk(p));
    else if (e.isFile() && e.name.toLowerCase().endsWith('.html')) out.push(p);
  }
  return out;
}

async function walkAllFiles(dir) {
  const out = [];
  for (const e of await fs.readdir(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.')) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...await walkAllFiles(p));
    else if (e.isFile()) out.push(p);
  }
  return out;
}

function relUrl(file) {
  const r = path.relative(root, file).split(path.sep).join('/');
  if (r.toLowerCase() === 'index.html') return '';
  // Keep directory indexes clean in generated manifests/sitemap.
  if (r.toLowerCase().endsWith('/index.html')) return r.slice(0, -'index.html'.length);
  return r;
}

function meta(text, tag) {
  const m = text.match(new RegExp(`<meta\\s+name=["']${tag}["']\\s+content=["']([^"']*)["']`, 'i'));
  return m?.[1] || '';
}

function title(text) {
  return text.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.trim() || 'Untitled';
}

function jsonEscape(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

const toolsDir = path.join(root, 'tools');
const blogDir = path.join(root, 'blog');
const resourcesDir = path.join(root, 'resources');

const toolFiles = (await walk(toolsDir))
  .filter(f => path.relative(toolsDir, f).toLowerCase() !== 'index.html');

const blogFiles = (await walk(blogDir))
  .filter(f => path.relative(blogDir, f).toLowerCase() !== 'index.html');

const tools = [];
for (const f of toolFiles) {
  const text = await fs.readFile(f, 'utf8');
  const cfgPath = path.join(path.dirname(f), 'tool.json');
  let cfg = {};
  try {
    cfg = JSON.parse(await fs.readFile(cfgPath, 'utf8'));
  } catch (err) {
    if (err.code !== 'ENOENT') {
      throw new Error(`Invalid JSON in ${path.relative(root, cfgPath)}: ${err.message}`);
    }
  }
  tools.push({
    title: cfg.title || title(text),
    description: cfg.description || meta(text, 'description'),
    url: relUrl(f),
    iconKey: cfg.iconKey || 'tool',
    tags: Array.isArray(cfg.tags) ? cfg.tags : [],
    category: cfg.category || ''
  });
}
for (const t of tools) assertIconKey(t.iconKey, t.url);
assertIconKey('blog', 'every blog card');

/* Category is optional in tool.json, but the homepage "Explore by Category"
   cards and llms.txt both group by it, so an uncategorised tool is worth knowing
   about. Warn rather than fail: the build is still correct without it. */
const uncategorised = tools.filter((t) => !t.category);
if (uncategorised.length) {
  console.log(`Note: ${uncategorised.length} tool(s) have no "category" in tool.json:`);
  uncategorised.slice(0, 12).forEach((t) => console.log(`       ${t.url}`));
  if (uncategorised.length > 12) console.log(`       ... and ${uncategorised.length - 12} more`);
}

/* The category carousel and the /tools/ filter are both generated from
   scripts/categories.mjs. Anything that would make a card a dead end - a slug
   that matches no tool, an icon key iconSvg() does not define, a featured tool
   that was renamed, a gradient whose tagline would be unreadable - has to stop
   the build here rather than reach the homepage as a broken card. */
const catProblems = validateCategories({ tools, iconKeys });
if (catProblems.length) {
  console.error(`\nCategory build failed (${catProblems.length} problem(s)):`);
  catProblems.forEach((p) => console.error('  - ' + p));
  process.exit(1);
}

/* Accepted, non-blocking contrast deviations. Printed every build so the white-text
 * shortfall on the lighter palette colours stays visible and cannot be forgotten. */
if (CATEGORY_WARNINGS.length) {
  console.warn('\nAccepted contrast deviations (' + CATEGORY_WARNINGS.length + ') - the palette colours are exact, so no scrim is applied:');
  CATEGORY_WARNINGS.forEach((w) => console.warn('  ~ ' + w));
}

const posts = [];
for (const f of blogFiles) {
  const text = await fs.readFile(f, 'utf8');
  posts.push({
    title: title(text),
    description: meta(text, 'description'),
    url: relUrl(f)
  });
}

let resourceCount = 0;
try {
  const resourceFiles = await walkAllFiles(resourcesDir);
  resourceCount = resourceFiles.filter(f => path.relative(resourcesDir, f).toLowerCase() !== 'index.html').length;
} catch (err) {
  if (err.code !== 'ENOENT') throw err;
}

const pages = [
  { title: 'Home', description: 'EasyWorkTools.online homepage.', url: '/', type: 'Page' },
  { title: 'Tools', description: 'Browse free online tools.', url: '/#tools', type: 'Page' },
  { title: 'Blog', description: 'Tutorials and how-to guides.', url: 'blog/index.html', type: 'Page' },
  { title: 'Resources', description: 'Useful references and future downloads.', url: 'resources/index.html', type: 'Page' },
  { title: 'About Us', description: 'Learn about EasyWorkTools.online, its tools and content approach.', url: 'about.html', type: 'Page' },
  { title: 'Privacy Policy', description: 'Privacy information for EasyWorkTools.online.', url: 'privacy.html', type: 'Page' },
  { title: 'Cookie Policy', description: 'Cookie, local storage and advertising information for EasyWorkTools.online.', url: 'cookies.html', type: 'Page' },
  { title: 'Disclaimer', description: 'Disclaimer for EasyWorkTools.online tools and content.', url: 'disclaimer.html', type: 'Page' },
  { title: 'Terms & Conditions', description: 'Terms and conditions for using EasyWorkTools.online.', url: 'terms.html', type: 'Page' },
  { title: 'Contact Us', description: 'Contact EasyWorkTools.online.', url: 'contact.html', type: 'Page' }
];

await fs.writeFile(path.join(root, 'tools-manifest.json'), JSON.stringify(tools, null, 2) + '\n');
await fs.writeFile(path.join(root, 'blog-manifest.json'), JSON.stringify(posts, null, 2) + '\n');

const siteData = `<script>window.__SITE_DATA__=${jsonEscape({ tools, posts, pages, resourceCount })}</script>`;
const searchPanel = `<div class="search-panel" id="searchPanel"><div class="container search-inner"><div class="search-meta"><span id="searchStatus">Start typing to search the whole site.</span><button class="search-close" type="button" onclick="closeSearch()">Close ✕</button></div><div class="search-results" id="searchResults"></div></div></div>`;
const themeToggle = '<button class="theme-toggle" id="themeToggle" type="button" aria-label="Switch to dark mode" aria-pressed="false" title="Switch to dark mode">'
  + '<svg class="theme-toggle__icon theme-toggle__icon--moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.2 15.1A8.4 8.4 0 0 1 8.9 3.8 8.5 8.5 0 1 0 20.2 15.1Z"/></svg>'
  + '<svg class="theme-toggle__icon theme-toggle__icon--sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3.5"/><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/></svg>'
  + '</button>';
const shareButton = '<button class="share-button" id="shareButton" type="button" aria-label="Share EasyWorkTools.online" title="Share EasyWorkTools.online">'
  + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.7 10.6 6.6-4.2m-6.6 7 6.6 4.2"/></svg>'
  + '</button>';

function addHeaderActions(html) {
  if (!html.includes('id="navSearch"')) return html;

  html = html.replace(/\s*<button class="theme-toggle"[\s\S]*?<\/button>/gi, '')
    .replace(/\s*<button class="share-button"[\s\S]*?<\/button>/gi, '')
    .replace(/\s*<span class="nav-divider"[^>]*><\/span>/gi, '');
  const searchMatch = html.match(/<div class="nav-search">[\s\S]*?<\/div>/i);
  const navMatch = html.match(/<nav class="nav-links"[\s\S]*?<\/nav>/i);
  if (!searchMatch || !navMatch) {
    throw new Error('Could not add header controls: shared nav search or navigation is missing.');
  }

  const navWithToolLabel = navMatch[0]
    .replace(/>(?:Tool|Tools)<\/a>/i, '>Tools</a>')
    .replace(/>(?:Blog|Blogs)<\/a>/i, '>Blogs</a>')
    .replace(/<a\b[^>]*>About<\/a>/gi, '');
  html = html.replace(searchMatch[0], '');
  html = html.replace(navMatch[0], navWithToolLabel + themeToggle + shareButton
    + '<span class="nav-divider" aria-hidden="true"></span>' + searchMatch[0]);
  return html;
}

function updateFooter(html, prefix) {
  const categories = [
    ['AI Write', 'ai-write'],
    ['Image Tools', 'image'],
    ['Developer Tool', 'developer'],
    ['SEO Tool', 'seo'],
    ['Text Tools', 'text'],
    ['PDF Tools', 'pdf'],
    ['Calculator Tools', 'calculator'],
    ['Utility Tools', 'utility'],
    ['Converter Tools', 'converter']
  ];
  const categoryColumn = `<div class="site-footer-col site-footer-categories"><h3>Major Categories</h3>`
    + categories.map(([label, slug]) => `<a href="${prefix}categories/${slug}/">${label}</a>`).join('')
    + '</div>';
  const exploreColumn = `<div class="site-footer-col"><h3>Explore</h3>`
    + `<a href="${prefix || './'}">Home</a><a href="${prefix}#tools">Tools</a>`
    + `<a href="${prefix}blog/index.html">Blogs</a><a href="${prefix}resources/index.html">Resources</a>`
    + '</div>';

  html = html.replace(
    /<div class="site-footer-col(?: site-footer-categories)?">\s*<h3>(?:Major Categories|Explore)<\/h3>[\s\S]*?<\/div>/gi,
    ''
  );
  html = html.replace(
    /(<div class="site-footer-col"><h3>Legal<\/h3>)/i,
    categoryColumn + exploreColumn + '$1'
  );
  html = html.replace(/<a href=["'][^"']*cookies\.html["']>Cookie Policy<\/a>/i, '');
  html = html.replace(
    /<span class="site-footer-legal">[\s\S]*?<\/span>/i,
    `<nav class="site-footer-legal" aria-label="Footer policies">`
      + `<a href="${prefix}cookies.html">Cookies</a><span aria-hidden="true">|</span>`
      + `<a href="${prefix}privacy.html">Privacy</a><span aria-hidden="true">|</span>`
      + `<a href="${prefix}terms.html">Terms</a><span aria-hidden="true">|</span>`
      + `<a href="${prefix}contact.html">Contact</a></nav>`
  );
  return html;
}

/* ------------------------------------------------------------------ *
 * Dedicated category pages: /categories/<slug>/
 *
 * Written before walk(root) so the main loop below treats them like any other
 * page and gives them the shared header, search panel, site data and scripts.
 * Each page is built from tools/index.html's shell with its <main> replaced, so
 * the chrome matches the rest of the site by construction rather than by being
 * copied and then kept in sync by hand.
 * ------------------------------------------------------------------ */
const shellSource = await fs.readFile(path.join(root, 'tools', 'index.html'), 'utf8');
const shellHeadEnd = shellSource.indexOf('</head>') + 7;
const shellMainStart = shellSource.indexOf('<main>');
const shellMainEnd = shellSource.indexOf('</main>') + 7;
if (shellHeadEnd < 7 || shellMainStart < 0 || shellMainEnd < 7 || shellMainEnd < shellMainStart) {
  console.error('Could not locate the page shell in tools/index.html; category pages were not written.');
  process.exit(1);
}

const shellHead = shellSource.slice(0, shellHeadEnd);
// shellMainStart is the index OF "<main>", and slice() is end-exclusive, so
// including it would drop the opening <main> tag and leave the page with a
// stray </main> and no main landmark at all. Take it explicitly.
const shellChrome = shellSource.slice(shellHeadEnd, shellMainStart + 6); // <body> .. <main>
const shellFoot = shellSource.slice(shellMainEnd);                       // </main> .. </html>

/* /categories/<slug>/ is one level deeper than /tools/, so every relative asset
   and in-site link in the shell needs one more "../".
   url() matters as much as href/src. The shell carries its @font-face block, and
   those url() values are depth-relative like everything else, so a rule that only
   rewrote attributes left them one level short and every category page requested
   /categories/assets/fonts/*.woff2. That stayed hidden while the font paths were
   root-absolute - /assets/... resolves correctly from any depth - and only appeared
   once the build normalised them to relative. */
const deepen = (html) => html
  .replace(/(href|src)="\.\.\//g, '$1="../../')
  .replace(/url\(\s*(['"]?)\.\.\//g, 'url($1../../')
  .replace(/(href|src)="(about|contact|terms|privacy|cookies|disclaimer)\.html"/g, '$1="../../$2.html"')
  .replace(/(href|src)="(blog|resources)\/index\.html"/g, '$1="../../$2/index.html"')
  .replace(/(href|src)="(index\.html|tools\/index\.html)/g, '$1="../../$2');

let categoryPagesWritten = 0;
for (const c of CATEGORIES) {
  const list = tools.filter((t) => catSlug(t.category) === c.slug);
  if (!list.length) continue;

  const url = SITE_ORIGIN + 'categories/' + c.slug + '/';
  const pageTitle = c.title + ' | EasyWorkTools.online';
  const desc = CATEGORY_INTRO[c.slug] || (c.tagline + ' - free online tools.');

  let head = deepen(shellHead);
  const swap = (re, to) => { head = head.replace(re, to); };
  swap(/<title>[\s\S]*?<\/title>/, '<title>' + escHtml(pageTitle) + '</title>');
  swap(/(<meta name="description" content=")[^"]*(")/, '$1' + escHtml(desc) + '$2');
  swap(/(<link rel="canonical" href=")[^"]*(")/, '$1' + escHtml(url) + '$2');
  swap(/(<meta property="og:title" content=")[^"]*(")/, '$1' + escHtml(pageTitle) + '$2');
  swap(/(<meta property="og:description" content=")[^"]*(")/, '$1' + escHtml(desc) + '$2');
  swap(/(<meta property="og:url" content=")[^"]*(")/, '$1' + escHtml(url) + '$2');
  swap(/(<meta name="twitter:title" content=")[^"]*(")/, '$1' + escHtml(pageTitle) + '$2');
  swap(/(<meta name="twitter:description" content=")[^"]*(")/, '$1' + escHtml(desc) + '$2');
  // og:image and twitter:image stay absolute, so they are untouched by deepen().

  // Drop the tools page's structured data; the category schema replaces it.
  head = head.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>\s*/g, '\n');

  const schema = renderCategorySchema({ category: c, tools: list, origin: SITE_ORIGIN, intro: CATEGORY_INTRO });
  const body = renderCategoryPageBody({ category: c, tools: list, iconSvg, cardHref, intro: CATEGORY_INTRO });
  // The /tools/ filter panel is generated only into /tools/index.html, so these
  // two assets are dead weight here. Carried over by the shell; drop them so the
  // category pages do not request a stylesheet and script they never use.
  // categories.css is kept: the category hero reuses the card gradient and icon
  // tile styles. Only tool-filter.js is dropped, since its panel is generated
  // into /tools/index.html alone.
  const pageHead = head;

  const foot = deepen(shellFoot).replace(/[^\n]*tool-filter\.js[^\n]*\n?/g, '');
  const page = pageHead + '\n' + schema + '\n' + deepen(shellChrome) + body + '</main>' + foot;

  const dir = path.join(root, 'categories', c.slug);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, 'index.html'), page);
  categoryPagesWritten++;
}
console.log(`Wrote ${categoryPagesWritten} category pages under /categories/.`);

const allHtml = await walk(root);
for (const f of allHtml) {
  if (f.includes(`${path.sep}ads${path.sep}`)) continue;

  let text = await fs.readFile(f, 'utf8');
  const relFile = path.relative(root, f).split(path.sep).join('/');
  const relDir = path.dirname(relFile);
  const depth = relDir === '.' ? 0 : relDir.split('/').length;
  const prefix = depth ? '../'.repeat(depth) : '';
  const appSrc = `${prefix}assets/app.js`;
  const toolsManifest = `${prefix}tools-manifest.json`;
  const blogManifest = `${prefix}blog-manifest.json`;

  text = addHeaderActions(text);
  text = updateFooter(text, prefix);

  // Remove previously generated data/app blocks so repeated builds stay clean.
  text = text.replace(/\s*<script[^>]*>\s*window\.__SITE_DATA__=[\s\S]*?<\/script>\s*/gi, '\n');
  text = text.replace(/\s*<script[^>]+src=["'][^"']*assets\/app\.js["'][^>]*><\/script>\s*/gi, '\n');
  // tool-tabs.js is emitted by the same loader as app.js, so it needs the same
  // strip. Without this the loader appended a second copy on every run and the
  // build was not idempotent: the early copy evaluated before app.js had
  // published the catalogue it depends on and silently did nothing.
  text = text.replace(/\s*<script[^>]+src=["'][^"']*assets\/tool-tabs\.js["'][^>]*><\/script>\s*/gi, '\n');
  text = text.replace(/\s*<script[^>]+src=["'][^"']*assets\/featured-coverflow\.js["'][^>]*><\/script>\s*/gi, '\n');

  // Category section: the carousel on the homepage, the filter on /tools/.
  // Both come from scripts/categories.mjs, and the tool counts inside them are
  // read from the manifest, so the "128 tools" style numbers cannot go stale the
  // way the old hand-written "118+" heading did.
  if (text.includes(MARK_START) && text.includes(MARK_END)) {
    const isHome = /<div class="grid" id="toolsGrid"/.test(text);
    const injected = fillMarked(text, isHome
      ? renderCarousel({ tools, iconSvg })
      : renderFilter());
    if (injected === null) {
      console.error(`Category markers are out of order in ${relFile}`);
      process.exit(1);
    }
    text = injected;
  }

  // Make the global search actually available on every page that has the shared header.
  if (text.includes('id="navSearch"') && !text.includes('id="searchPanel"')) {
    text = text.replace(/<\/header>/i, `</header>\n${searchPanel}`);
  }

  // Add the shared data + JS once, at the bottom of every searchable page.
  if (text.includes('id="navSearch"')) {
    // Search results need URLs rooted at the site, otherwise a result such as
  // "tools/foo/" clicked from /blog/ incorrectly resolves to /blog/tools/foo/.
  const searchableSiteData = jsonEscape({
    resourceCount,
    tools: tools.map(x => ({ ...x, url: '/' + x.url.replace(/^\/+/, '') })),
    posts: posts.map(x => ({ ...x, url: '/' + x.url.replace(/^\/+/, '') })),
    pages: pages.map(x => ({ ...x, url: '/' + x.url.replace(/^\/+/, '') }))
  });
  // `defer` matters: without it this classic script is parser-blocking, which was
  // worth ~300 ms of render-blocking time on every page of the site.
  /* tool-tabs.js must come AFTER app.js: it resolves each slug through the
   window.ewtToolsByKey index that app.js builds from __SITE_DATA__, and
   deferred scripts execute in document order, so a tag placed earlier would
   run first, find no catalogue and quietly do nothing. */
const tabsSrc = `${prefix}assets/tool-tabs.js`;
  /* The coverflow is homepage-only too, so it rides in the same loader rather than
     app.js. It needs no globals from app.js, but order is kept for readability. */
  const flowSrc = `${prefix}assets/featured-coverflow.js`;
  const loader = `<script>window.__SITE_DATA__=${searchableSiteData}</script><script src="${appSrc}" defer></script><script src="${tabsSrc}" defer></script><script src="${flowSrc}" defer></script>`;
    text = text.replace(/<\/body>/i, `${loader}\n</body>`);
  }

  // AdSense insertion is marker-based and idempotent.
  // Source pages use .ad-reserved and blog articles use .article-ad-slot.
  const adHead = await fs.readFile(path.join(root, 'ads', 'head.html'), 'utf8').catch(() => '');
  const adTop = await fs.readFile(path.join(root, 'ads', 'top.html'), 'utf8').catch(() => '');
  const adMid = await fs.readFile(path.join(root, 'ads', 'mid.html'), 'utf8').catch(() => '');
  const adBottom = await fs.readFile(path.join(root, 'ads', 'bottom.html'), 'utf8').catch(() => '');

  const cleanAd = value => value.replace(/<!--[^]*?-->/g, '').trim();
  const adContent = { top: cleanAd(adTop), mid: cleanAd(adMid), bottom: cleanAd(adBottom) };

  if (cleanAd(adHead)) {
    text = text.replace(/<!-- EASYWORKTOOLS_AD_HEAD_START -->[\s\S]*?<!-- EASYWORKTOOLS_AD_HEAD_END -->/gi, '');
    text = text.replace(/<\/head>/i, `<!-- EASYWORKTOOLS_AD_HEAD_START -->\n${adHead}\n<!-- EASYWORKTOOLS_AD_HEAD_END -->\n</head>`);
  }

  const placeholder = '<div class="ad-reserved" aria-hidden="true"></div>';
  const articlePlaceholder = '<div class="article-ad-slot" aria-hidden="true"></div>';

  // Restore placeholders if a previous build had generated markers but the ad template is empty.
  for (const placement of ['top','mid','bottom']) {
    const marker = new RegExp(`<!-- EASYWORKTOOLS_AD_${placement.toUpperCase()}_START -->[\\s\\S]*?<!-- EASYWORKTOOLS_AD_${placement.toUpperCase()}_END -->`, 'gi');
    text = text.replace(marker, adContent[placement] ? snippetFor(placement) : placeholder);
  }

  function snippetFor(placement) {
    const value = placement === 'top' ? adTop : placement === 'bottom' ? adBottom : adMid;
    return `<!-- EASYWORKTOOLS_AD_${placement.toUpperCase()}_START -->${value}<!-- EASYWORKTOOLS_AD_${placement.toUpperCase()}_END -->`;
  }

  function injectIntoRegex(regex, placement) {
    if (!adContent[placement]) return;
    text = text.replace(regex, snippetFor(placement));
  }

  // Explicit placements remain authoritative when present.
  injectIntoRegex(/<div class="ad-reserved"[^>]*data-ad-placement="top"[^>]*><\/div>/gi, 'top');
  injectIntoRegex(/<div class="ad-reserved"[^>]*data-ad-placement="mid"[^>]*><\/div>/gi, 'mid');
  injectIntoRegex(/<div class="ad-reserved"[^>]*data-ad-placement="bottom"[^>]*><\/div>/gi, 'bottom');

  // Render the tool/blog cards into the static HTML. Must run after the grids are
  // known to be empty and before the file is written, so a rebuild is a no-op.
  //
  // The heading level is written onto the grid as data-card-heading, which
  // app.js reads back, so the static HTML and the runtime re-render can never
  // disagree and rewrite every heading on the page.
  //   - a grid inside a <section> that has its own <h2> gets h3 cards
  //     (the homepage sections);
  //   - a listing-page grid, where the page has one <h1> and no preceding <h2>,
  //     gets h2 cards.
  // Decide the card heading level for a grid.
  //
  // Only headings that appear BEFORE the grid count: the cards themselves are
  // headings inside the same <section>, so scanning the whole section would
  // make a grid "see" its own output and flip the level on the next build.
  //
  // A grid on a listing page (/tools/, /blog/) has one <h1> and no <h2> above
  // it, so its cards are <h2>. A grid inside a homepage <section> that has its
  // own <h2> is one level deeper, so its cards are <h3>.
  const gridHeading = (html, gridId) => {
    const gridMatch = new RegExp('<div class="grid" id="' + gridId + '"[^>]*>').exec(html);
    if (!gridMatch) return 'h2';

    // Only headings that appear BEFORE the grid count. Scanning the whole
    // <section> would make a grid "see" the headings of its own cards and flip
    // the level on the next build.
    const before = html.slice(0, gridMatch.index);
    const headingsBefore = [...before.matchAll(/<h([1-6])[\s>]/g)].map((m) => +m[1]);
    const maxBefore = headingsBefore.length ? Math.max(...headingsBefore) : 0;

    // The grid must still be inside that <section>, and the section's own
    // headings must also be before the grid.
    const sectionStart = before.lastIndexOf('<section');
    if (sectionStart !== -1 && !before.slice(sectionStart).includes('</section>')) {
      const sectionHead = before.slice(sectionStart);
      const hasOwnH2 = /<h2[\s>]/.test(sectionHead);
      return hasOwnH2 ? 'h3' : 'h2';
    }

    if (!maxBefore) return 'h2';
    return 'h' + Math.min(6, maxBefore + 1);
  };

  // Insert or replace data-card-heading on each grid's opening tag, keeping any
  // other attributes it already has (the homepage tool grid has data-limit).
  const tagGrids = (html) => ['allToolsGrid', 'blogIndexGrid', 'toolsGrid', 'blogGrid']
    .reduce((acc, id) => {
      const re = new RegExp('(<div class="grid" id="' + id + '")([^>]*)>');
      if (!re.test(acc)) return acc;
      return acc.replace(re, (_m, open, rest) => {
        const attrs = rest.replace(/\s*data-card-heading="[^"]*"/, '');
        return open + ' data-card-heading="' + gridHeading(acc, id) + '"' + attrs + '>';
      });
    }, html);

  /* Generic marker filler. fillMarked() is hard-wired to the category markers,
     and this build needs two more pairs (the tab bar and the data island), so a
     named variant is used rather than overloading the existing one. Returns null
     when the markers are missing or out of order, which the caller treats as a
     hard failure rather than silently shipping a half-built page. */
  function fillMarkedNamed(html, markup, name) {
    const open = '<!-- ' + name + ':start -->';
    const close = '<!-- ' + name + ':end -->';
    const a = html.indexOf(open);
    const b = html.indexOf(close);
    if (a === -1 || b === -1 || b < a) return null;
    return html.slice(0, a + open.length) + '\n' + markup + '\n' + html.slice(b);
  }

  /* Renders the category tab bar for "Our Most Popular Tools".
   *
   * Text only: the reference design labels each tab and nothing else, so no icon
   * markup is emitted at all. Emitting nothing is deliberate - hiding an icon
   * with CSS would leave it in the accessibility tree for a screen reader to
   * announce, where it carries no meaning on its own.
   *
   * TWO WRAPPERS, and the outer one is not decoration:
   *
   * .tool-tabs-frame carries the visible 1px outline. It exists because a CSS
   * border cannot stroke a clip-path diagonal: borders are only painted along the
   * four box edges, so cutting the corners with clip-path would leave the
   * diagonals bare. The frame paints the outline colour as its own background and
   * the white bar sits one pixel inside it, so the border follows the 45-degree
   * corners. The frame must NOT be the scroll container - an absolutely
   * positioned child of a scroller travels with the content, which would drag the
   * border away on narrow screens. So the frame holds still and .tool-tabs does
   * the scrolling.
   *
   * .tool-tabs__glider is the single blue marker that slides to the selected
   * category. One element rather than a per-button background is what allows it
   * to animate across at all. aria-hidden, because it only repeats information
   * aria-selected already carries.
   *
   * Proper ARIA tabs: role=tablist on the bar, role=tab on each button, and every
   * tab pointing at the same #toolsGrid via aria-controls. The grid gets
   * role=tabpanel and aria-live=polite so the new set is announced. The All Tools
   * tab is selected by default, which is also what the server rendered. */
  function renderPopularTabs() {
    const tabs = buildTabs();
    const out = [];
    out.push('<div class="tool-tabs-frame">');
    out.push('<div class="tool-tabs" role="tablist" aria-label="Filter popular tools by category">');
    out.push('<span class="tool-tabs__glider" aria-hidden="true"></span>');
    tabs.forEach((tab, i) => {
      const on = i === 0;
      out.push(
        '<button type="button" role="tab" class="tool-tab' + (on ? ' is-active' : '') + '"' +
        ' id="ewtTab-' + tab.id + '" aria-controls="toolsGrid" aria-selected="' + (on ? 'true' : 'false') + '"' +
        ' tabindex="' + (on ? '0' : '-1') + '" data-cat="' + tab.id + '">' +
        '<span class="tool-tab__label">' + tab.title + '</span>' +
        '</button>');
    });
    out.push('</div>');
    out.push('</div>');
    return out.join('');
  }

  /* ==========================================================================
   * "Featured Tools" showcase - a 3D coverflow carousel.
   *
   * WHAT THIS IS NOT
   * The original brief for this section was written as an image-generation
   * prompt and asked for "8k resolution", "photorealistic", "cinematic
   * lighting" and a UI "displayed on a sleek monitor screen". None of those are
   * properties a live web page has - they describe a rendered picture of a UI,
   * not a UI. What is implemented here is the part that can actually be built:
   * a dark #0f172a band, a perspective coverflow, a larger centre card with a
   * teal/blue rim glow, glassmorphic cards, arrow navigation, and distinct
   * monochrome SVGs that match each featured tool. No claim is made about
   * photorealism or resolution, because the page cannot deliver either.
   *
   * ICONS, NOT SCREENSHOTS
   * Each pick has a purpose-drawn SVG selected by tool URL, not card position,
   * so changing the carousel order cannot give a tool the wrong glyph.
   *
   * The nine tools are the same curated per-category picks the All Tools tab
   * uses, read from popular-tools.mjs, so the two views cannot disagree about
   * what "best" means.
   *
   * Each card is one <a> wrapping the whole surface: a single click target with
   * exactly one link, and no nested anchor. The "Open Tool" affordance is a
   * <span>. The icon is aria-hidden and the link's text carries the meaning, so
   * a screen reader announces the tool once, not twice.
   * ========================================================================== */
   function renderToolShowcase(tools, byTitle, iconSvg) {
     const list = selectTools(tools, ALL_TAB, byTitle);
     const cards = list.map((t) => {
       const key = toolKey(t.url);
       const glyph = featuredToolIcon(key, iconSvg(t.iconKey || 'tool'));
      return '<li class="cf-item" data-cat="' + escHtml(catLabel(byTitle, t)) + '">' +
        '<a class="cf-card" href="https://easyworktools.online/tools/' + key + '/">' +
        '<span class="cf-card__glow" aria-hidden="true"></span>' +
        '<span class="cf-card__icon" aria-hidden="true">' + glyph + '</span>' +
        '<span class="cf-card__cat">' + escHtml(catLabel(byTitle, t)) + '</span>' +
        '<h3 class="cf-card__title">' + escHtml(t.title) + '</h3>' +
        '<span class="cf-card__desc">' + escHtml(t.description) + '</span>' +
        '<span class="cf-card__cta">Open Tool ' +
        '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" ' +
        'stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
        '<path d="M5 12h14M13 6l6 6-6 6"/></svg></span>' +
        '</a></li>';
    }).join('');

    return '<div class="coverflow" id="featuredFlow">' +
      '<button type="button" class="cf-nav cf-nav--prev" id="cfPrev" aria-label="Show previous featured tools">' +
      '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.4" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
      '<path d="M15 5l-7 7 7 7"/></svg></button>' +
      '<div class="cf-viewport" id="cfViewport">' +
      '<ul class="cf-track" id="cfTrack">' + cards + '</ul>' +
      '</div>' +
      '<button type="button" class="cf-nav cf-nav--next" id="cfNext" aria-label="Show next featured tools">' +
      '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.4" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
      '<path d="M9 5l7 7-7 7"/></svg></button>' +
      '<p class="cf-status visually-hidden" id="cfStatus" role="status" aria-live="polite"></p>' +
      '</div>';
  }

  function catLabel(byTitle, t) {
    const slug = byTitle.get(t.category);
    const found = CATEGORIES.find(c => c.slug === slug);
    return found ? found.title : t.category;
  }

  function escHtml(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, c =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c]));
  }

  /* ==========================================================================
   * Homepage resource cards and the /resources/ index.
   *
   * WHY THIS IS GENERATED
   * The section used to be three hand-written cards, one of which promised
   * "future downloadable resources will be added here as the site grows" and
   * linked to a /resources/ page that was itself a placeholder ("this section is
   * reserved for...", "can grow here over time"). Both are now built from real
   * data, and every count below is read from the manifest at build time rather
   * than typed in, so a tool or guide added tomorrow updates these numbers
   * automatically and they cannot drift from the rest of the site.
   *
   * NOTHING IS INVENTED
   * Every destination here already exists: /blog/, /tools/, the nine
   * /categories/ pages, /resources/ itself and the homepage feedback form. No
   * downloads, templates or reference documents are claimed, because none exist.
   *
   * ICONS
   * Four keys that already exist in iconSvg(), chosen by looking at the rendered
   * glyphs rather than guessing from the key names: blog (a document) for the
   * guides, sitemap-xml (a hierarchy) for the reference index, collage (a 2x2
   * grid) for the categories, http-header (a request/response document) for
   * sending a request. assertIconKey() fails the build if any of them is ever
   * removed, so a typo here is a build error rather than a blank tile.
   * ========================================================================== */

  /* Counts per category, straight from the tools array. Ordered by size so the
     busiest categories lead, matching how the homepage carousel already orders
     them; Array.prototype.sort is stable so ties keep the order declared in
     scripts/categories.mjs. */
  function resourcesByCategory() {
    const by = new Map();
    for (const t of tools) {
      const k = catSlug(t.category);
      if (!k) continue;
      if (!by.has(k)) by.set(k, []);
      by.get(k).push(t);
    }
    return CATEGORIES
      .filter((c) => (by.get(c.slug) || []).length)
      .map((c) => ({ ...c, list: by.get(c.slug) }))
      .sort((a, b) => b.list.length - a.list.length);
  }

  /* Root-absolute href.
   *
   * relUrl() returns a path with no leading slash. That resolves correctly from
   * the homepage, whose base is "/", but /resources/ is one level deep, so
   * "tools/ai-write/ai-detector/" became "/resources/tools/ai-write/ai-detector/"
   * and every one of the 249 links on that page 404'd. The build's depth-rewrite
   * pass does not cover it: that only rewrites href="tools/index.html", and only
   * on tool pages two levels deep.
   *
   * Prefixing "/" is correct for both depths and needs no rewrite - the rewrite
   * pattern requires the quote to be followed straight away by "tools/", which a
   * leading slash prevents. */
  function rootUrl(u) {
    const v = String(u == null ? '' : u);
    if (!v || v.charAt(0) === '/' || /^[a-z]+:/i.test(v) || v.charAt(0) === '#') return v;
    return '/' + v;
  }

  /* Relative luminance of a #rrggbb colour, 0 (black) to 1 (white). */
  function relLum(hex) {
    const n = parseInt(String(hex).slice(1), 16);
    const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(function (c) {
      c /= 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
  }

  /* Recolour an icon for use on a solid card of colour "card".
   *
   * Light colours - the parts that read as detail - become white. Everything
   * else takes the card colour and vanishes into it. The result is a white glyph
   * whose internal detail is still legible, which is how the category carousel
   * cards already read.
   *
   * A flat white recolour was tried first and is wrong for these glyphs: blog,
   * sitemap-xml and http-header are all two-tone, so turning every pixel white
   * collapses the outer shape and its interior into one featureless white square.
   */
  function knockoutIcon(svg, card) {
    return String(svg).replace(/#[0-9A-Fa-f]{6}/g, function (hex) {
      return relLum(hex) > 0.42 ? '#ffffff' : card;
    });
  }

  /* A lowercase haystack per item, so the /resources/ search matches on words a
     visitor would actually type ("resize", "json") and not only on the title. */
  function resourceHaystack(parts) {
    return String(parts || '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  /* The homepage's three resource cards, relocated beneath Help & Feedback. */
  function renderResources() {
    /* Accent colors and compact card layout are applied by order in styles.css.
       Each whole card remains one link, with a heading for the section outline. */
    const cards = [
      {
        icon: 'blog',
        title: 'Tool Guides',
        body: '',
        cta: 'Browse all guides',
        subtitle: 'Master Every Tool with Easy Step-by-Step Guides',
        href: 'blog/',
        c: '#1D4ED8',
        ink: '#1E3A8A'
      },
      {
        icon: 'sitemap-xml',
        title: 'Tool Reference',
        body: 'Every tool with a plain description of what it does, searchable in one place.',
        cta: 'Open the reference',
        subtitle: '',
        href: 'resources/',
        c: '#C2410C',
        ink: '#9A3412'
      },
      {
        icon: 'http-header',
        title: 'Updates & Requests',
        body: 'Report a problem with a tool, or ask for one that is not here yet.',
        cta: 'Send a request',
        subtitle: 'Report Issues. Suggest Tools.',
        href: '#help',
        c: '#15803D',
        ink: '#14532D'
      },
    ].map((c) =>
      '<a class="resource-card" href="' + c.href + '" style="--rc:' + c.c + '">' +
        '<span class="resource-card__top">' +
          '<span class="resource-card__icon" aria-hidden="true">' +
            knockoutIcon(iconSvg(c.icon), c.c) +
          '</span>' +
        '</span>' +
        '<span class="resource-card__panel">' +
          '<h3 class="resource-card__title">' + escHtml(c.title) + '</h3>' +
          (c.subtitle ? '<span class="resource-card__subtitle">' + escHtml(c.subtitle) + '</span>' : '') +
          (c.body ? '<span class="resource-card__body">' + escHtml(c.body) + '</span>' : '') +
          '<span class="resource-card__cta">' + escHtml(c.cta) + '</span>' +
        '</span>' +
      '</a>'
    ).join('');

    return '<div class="resource-grid" id="resources">' + cards + '</div>';
  }

  /* The /resources/ page: the same real data, laid out as a searchable index.
   *
   * Everything is rendered server-side into the HTML rather than fetched at
   * runtime, so the page is complete without JavaScript and a crawler sees the
   * links. The script that follows only filters what is already there. */
  function renderResourceIndex() {
    const groups = resourcesByCategory();
    const nTools = tools.length;
    const nPosts = posts.length;

    /* Category chips use .resource-chip, the same component the homepage row
       uses, rather than the /tools/ page's .filter-chip.
       categories.css is not loaded here, so .filter-chip would have arrived with
       no styles at all - and duplicating those rules here to avoid loading one
       extra stylesheet is the wrong trade. One chip component, one file. */
    const chips = '<button type="button" class="resource-chip is-active" data-rcat="" aria-pressed="true">' +
        'All<span class="resource-chip__n">' + nTools + '</span></button>' +
      groups.map((g) =>
        '<button type="button" class="resource-chip" data-rcat="' + escHtml(g.slug) + '" aria-pressed="false">' +
          '<span class="resource-chip__dot" style="background:' + escHtml(g.c1) + '"></span>' +
          escHtml(g.title) +
          '<span class="resource-chip__n">' + g.list.length + '</span>' +
        '</button>'
      ).join('');

    const groupBlocks = groups.map((g) =>
      '<section class="resource-group" data-rcat="' + escHtml(g.slug) + '">' +
        '<div class="resource-group__head">' +
          '<h3 class="resource-group__title">' + escHtml(g.title) +
            '<span class="resource-group__n">' + g.list.length + '</span></h3>' +
          '<a class="resource-group__all" href="/categories/' + escHtml(g.slug) + '/">All ' +
            escHtml(g.title.replace(/ Tools$/, '')) + ' tools' +
            '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" ' +
            'stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
            '<path d="M5 12h14M13 6l6 6-6 6"/></svg></a>' +
        '</div>' +
        '<ul class="resource-items">' +
          g.list
            .slice()
            .sort((a, b) => a.title.localeCompare(b.title))
            .map((t) =>
              '<li class="resource-item" data-search="' +
                escHtml(resourceHaystack(t.title + ' ' + t.description + ' ' + (t.tags || []).join(' '))) + '">' +
                '<a class="resource-item__link" href="' + escHtml(rootUrl(t.url)) + '">' + escHtml(t.title) + '</a>' +
                '<span class="resource-item__desc">' + escHtml(t.description) + '</span>' +
              '</li>'
            ).join('') +
        '</ul>' +
      '</section>'
    ).join('');

    /* A visible list of 121 guides reads badly when every row ends in
       "| EasyWorkTools.online", because that suffix belongs in the <title>
       element, not in a link label. Stripped for display only; the document
       title and the JSON-LD are untouched. */
    const guideLabel = (t) => String(t).replace(/\s*[|\u2013\u2014-]\s*EasyWorkTools\.online\s*$/i, '').trim();

    const guideItems = posts
      .slice()
      .sort((a, b) => guideLabel(a.title).localeCompare(guideLabel(b.title)))
      .map((p2) =>
        '<li class="resource-item" data-search="' +
          escHtml(resourceHaystack(p2.title + ' ' + p2.description)) + '">' +
          '<a class="resource-item__link" href="' + escHtml(rootUrl(p2.url)) + '">' + escHtml(guideLabel(p2.title)) + '</a>' +
          '<span class="resource-item__desc">' + escHtml(p2.description) + '</span>' +
        '</li>'
      ).join('');

    return '<div class="resource-index" id="resourceIndex">' +
      '<div class="resource-index__search">' +
        '<label class="resource-index__label" for="resourceSearch">Search guides and tools</label>' +
        '<input class="resource-index__input" id="resourceSearch" type="search" ' +
          'placeholder="e.g. json, pdf, resize" autocomplete="off" ' +
          'aria-describedby="resourceSearchStatus">' +
        '<p class="resource-index__status" id="resourceSearchStatus" role="status" aria-live="polite"></p>' +
      '</div>' +

      '<section class="resource-block" aria-labelledby="resourceToolsHead">' +
        '<div class="resource-block__head">' +
          '<h2 id="resourceToolsHead">Tools by category</h2>' +
          '<p>All ' + nTools + ' tools, grouped into ' + groups.length + ' categories.</p>' +
        '</div>' +
        '<div class="resource-index__chips" role="group" aria-label="Filter tools by category">' + chips + '</div>' +
        '<div class="resource-groups" id="resourceGroups">' + groupBlocks + '</div>' +
      '</section>' +

      '<section class="resource-block" aria-labelledby="resourceGuidesHead">' +
        '<div class="resource-block__head">' +
          '<h2 id="resourceGuidesHead">Guides</h2>' +
          '<p>All ' + nPosts + ' written guides, newest reading order aside, listed alphabetically.</p>' +
        '</div>' +
        '<ul class="resource-items resource-items--guides" id="resourceGuides">' + guideItems + '</ul>' +
      '</section>' +
    '</div>';
  }

  const homeToolLimit = CARD_SLOTS; // matches data-limit on #toolsGrid
  const htmlWithTags = tagGrids(text).replace(
    /(<div class="grid" id="toolsGrid"[^>]*\bdata-limit=")\d+(")/,
    `$1${homeToolLimit}$2`
  );
  text = fillGrid(htmlWithTags, 'allToolsGrid', tools.map(t2 => toolCard(t2, gridHeading(htmlWithTags, 'allToolsGrid'))).join(''));
  text = fillGrid(text, 'blogIndexGrid', posts.map(p => articleCard(p, gridHeading(htmlWithTags, 'blogIndexGrid'))).join(''));
  /* The homepage grid shows the curated mixed sixteen rather than the first sixteen
     rows of the manifest, so the default view spans all nine categories.
     assertPopularTools() below guarantees exactly CARD_SLOTS cards, no repeats
     and no unknown URL before any of this is written. */
  const popByTitle = slugByTitle();
  const popProblems = assertPopularTools(tools, popByTitle);
  if (popProblems.length) {
    console.error('\nPopular-tools build failed (' + popProblems.length + ' problem(s)):');
    popProblems.forEach((pr) => console.error('  - ' + pr));
    process.exit(1);
  }
  const popHeading = gridHeading(htmlWithTags, 'toolsGrid');
  text = fillGrid(text, 'toolsGrid', selectTools(tools, ALL_TAB, popByTitle)
    .map((t2) => toolCard(t2, popHeading)).join(''));
  /* These two marker pairs only exist on the homepage, and this block runs once
     per page in the site. A page without them must be left completely untouched,
     so the result is only adopted when the fill actually succeeded - assigning the
     null return unconditionally wiped `text` on every other page.
    
     If a page DOES carry #toolsGrid but has lost its markers, that is a real
     mistake rather than a page that never wanted them, so the build stops. */
  const isHome = /<div class="grid" id="toolsGrid"/.test(text);
  const hasTabMarkers = text.includes('<!-- ewt:tabs:start -->') && text.includes('<!-- ewt:island:start -->');
  if (isHome && !hasTabMarkers) {
    console.error('\n' + relFile + ' has #toolsGrid but is missing the ewt:tabs / ewt:island markers.');
    console.error('The category tab bar and its data island cannot be injected.');
    process.exit(1);
  }
  if (hasTabMarkers) {
    const filledTabs = fillMarkedNamed(text, renderPopularTabs(), 'ewt:tabs');
    const filledIsland = filledTabs === null ? null
      : fillMarkedNamed(filledTabs,
        '<script type="application/json" id="ewtToolsData">'
          + JSON.stringify(buildIsland(tools, popByTitle)) + '</script>',
        'ewt:island');
    if (filledIsland === null) {
      console.error('\nTab bar or data island markers are missing or out of order in ' + relFile);
      process.exit(1);
    }
    text = filledIsland;
    /* The showcase sits only on the homepage, so it is filled here rather than
       inside the tabs block, which is also where its markers live. */
    if (text.includes('<!-- ewt:showcase:start -->')) {
      text = fillMarkedNamed(text,
        renderToolShowcase(tools, popByTitle, iconSvg), 'ewt:showcase');
    }
  }
  /* "Useful Resources". Two marker pairs, each optional: ewt:resources is on
     the homepage and ewt:resindex is on /resources/. A page carrying neither is
     left alone, so this costs nothing on the other 267 pages. */
  if (text.includes('<!-- ewt:resources:start -->')) {
    const filledResources = fillMarkedNamed(text, renderResources(), 'ewt:resources');
    if (filledResources === null) {
      console.error('\newt:resources markers are missing or out of order in ' + relFile);
      process.exit(1);
    }
    text = filledResources;
  }
  if (text.includes('<!-- ewt:resindex:start -->')) {
    const filledIndex = fillMarkedNamed(text, renderResourceIndex(), 'ewt:resindex');
    if (filledIndex === null) {
      console.error('ewt:resindex markers are missing or out of order in ' + relFile);
      process.exit(1);
    }
    text = filledIndex;
  }
  text = fillGrid(text, 'blogGrid', posts.slice(0, 6).map(p => articleCard(p, gridHeading(htmlWithTags, 'blogGrid'))).join(''));

  // Generic reserved slots: first top, last bottom, middle mid.
  const reservedSlots = [...text.matchAll(/<div class="ad-reserved"[^>]*><\/div>/gi)];
  if (reservedSlots.length) {
    let n = 0;
    text = text.replace(/<div class="ad-reserved"[^>]*><\/div>/gi, () => {
      n++;
      const placement = n === 1 ? 'top' : (n === reservedSlots.length ? 'bottom' : 'mid');
      return adContent[placement] ? snippetFor(placement) : placeholder;
    });
  }


  // Blog articles: first slot is top, last is bottom.
  const articleSlots = [...text.matchAll(/<div class="article-ad-slot"[^>]*><\/div>/gi)];
  if (articleSlots.length) {
    let n = 0;
    text = text.replace(/<div class="article-ad-slot"[^>]*><\/div>/gi, () => {
      n++;
      const placement = n === 1 ? 'top' : (n === articleSlots.length ? 'bottom' : 'mid');
      return adContent[placement] ? snippetFor(placement) : articlePlaceholder;
    });
  }



  await fs.writeFile(f, text);
}

// Clean, valid sitemap URLs.
const urls = [
  'https://easyworktools.online/',
  'https://easyworktools.online/tools/',
  'https://easyworktools.online/blog/',
  'https://easyworktools.online/resources/',
  'https://easyworktools.online/about.html',
  'https://easyworktools.online/privacy.html',
  'https://easyworktools.online/cookies.html',
  'https://easyworktools.online/disclaimer.html',
  'https://easyworktools.online/terms.html',
  'https://easyworktools.online/contact.html',
  // Machine-readable indexes for crawlers and agents.
  'https://easyworktools.online/llms.txt',
  'https://easyworktools.online/ai-catalog.json',
  // Dedicated category landing pages. Without these they would be reachable by
  // clicking but invisible to a crawler, which is the one thing a page like this
  // exists for.
  ...CATEGORIES
    .filter(c => tools.some(t => catSlug(t.category) === c.slug))
    .map(c => 'https://easyworktools.online/categories/' + c.slug + '/'),
  ...tools.map(x => 'https://easyworktools.online/' + x.url),
  ...posts.map(x => 'https://easyworktools.online/' + x.url)
];
await fs.writeFile(
  path.join(root, 'sitemap.xml'),
  '<?xml version="1.0" encoding="UTF-8"?>' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
  urls.map(u => `<url><loc>${u}</loc></url>`).join('') +
  '</urlset>\n'
);

// ---------------------------------------------------------------------------
// ai-catalog.json
//
// A machine-readable index of every tool and article for AI agents and
// integrations. It is generated here rather than hand-maintained so it can never
// drift from tools-manifest.json / blog-manifest.json, and the per-page JSON-LD
// is read back out of the built HTML so the advertised schema types are the ones
// actually present on the page.
// ---------------------------------------------------------------------------
function relativeUrl(file) {
  const r = path.relative(root, file).split(path.sep).join('/');
  return r.endsWith('index.html') ? r.slice(0, -'index.html'.length) : r;
}

function jsonLdTypes(file) {
  try {
    const text = readFileSync(file, 'utf8');
    const types = [];
    for (const m of text.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
      try {
        const parsed = JSON.parse(m[1]);
        const t = parsed['@type'];
        if (Array.isArray(t)) types.push(...t);
        else if (t) types.push(t);
      } catch {
        // A malformed block is reported by the HTML validation step, not here.
      }
    }
    return [...new Set(types)];
  } catch {
    return [];
  }
}

const absolute = (rel) => 'https://easyworktools.online/' + rel.replace(/^\/+/, '');

const catalog = {
  $schema: 'https://schema.org/',
  name: 'EasyWorkTools.online',
  url: 'https://easyworktools.online/',
  description:
    'Free, private, browser-based tools for everyday digital work. Text, image, PDF and developer utilities that run entirely in the visitor browser with no upload, no account and no paywall.',
  version: '1.0.0',
  updated: new Date().toISOString().slice(0, 10),
  operator: { name: 'EasyWorkTools.online', email: 'EasyWorkTools.online@gmail.com' },
  license: 'https://easyworktools.online/terms.html',
  privacy: 'https://easyworktools.online/privacy.html',
  dataHandling: {
    uploads: 'none',
    telemetry: 'Aggregate, anonymous page-view counts only, used to order the tool and blog lists.',
    cookies: 'See https://easyworktools.online/cookies.html',
  },
  counts: { tools: tools.length, articles: posts.length },
  indexes: {
    home: 'https://easyworktools.online/',
    tools: 'https://easyworktools.online/tools/',
    blog: 'https://easyworktools.online/blog/',
    resources: 'https://easyworktools.online/resources/',
    sitemap: 'https://easyworktools.online/sitemap.xml',
    llms: 'https://easyworktools.online/llms.txt',
  },
  tools: tools.map(t => ({
    name: t.title,
    url: absolute(t.url),
    description: t.description,
    category: null,
    keywords: t.tags || [],
    pricing: 'free',
    browserOnly: true,
    requiresAccount: false,
    requiresUpload: false,
    structuredData: jsonLdTypes(path.join(root, t.url, 'index.html')),
  })),
  articles: posts.map(p => ({
    title: p.title,
    url: absolute(p.url),
    description: p.description,
    type: 'Article',
    structuredData: jsonLdTypes(path.join(root, p.url)),
  })),
};

await writeFileSync(path.join(root, 'ai-catalog.json'), JSON.stringify(catalog, null, 2) + '\n');

/* ------------------------------------------------------------------ *
 * llms.txt
 *
 * It was hand-maintained and had drifted to "74 tools, 67 guides" while
 * the site had 128 and 121. It is linked from robots.txt, listed in the
 * sitemap and read by AI agents, so a wrong count there is a real
 * inaccuracy rather than a cosmetic one.
 *
 * The tool list is generated from tools-manifest.json, grouped by the
 * same `category` value that drives the homepage category cards, so the
 * grouping here and the grouping a visitor sees cannot disagree. Only
 * the list is generated - the surrounding prose is written here so it
 * stays readable and reviewable, which is the point of the format.
 * ------------------------------------------------------------------ */
const LLMS_CATEGORY_ORDER = [
  'AI Write', 'Text Tools', 'Image Tools', 'PDF Tools', 'Developer Tools',
  'SEO Tools', 'Converter Tools', 'Calculator Tools', 'Utility Tools'
];

/* The prose around the generated list. __TOOLS__, __POSTS__ and
   __TOOL_BLOCK__ are substituted by writeLlmsTxt(); everything else is
   written to be read, so it lives here rather than being assembled. */
const LLMS_PROSE = `# EasyWorkTools.online

> Free, private, browser-based tools for everyday digital work. Text, image, PDF
> and developer utilities that run entirely in the visitor's browser - nothing is
> uploaded to a server.

EasyWorkTools.online is a static site of __TOOLS__ free online tools and __POSTS__
how-to guides. Every tool runs client-side: text never leaves the browser, and
there is no account, paywall or email capture.

**Canonical origin:** https://easyworktools.online

## Index

- [Tools](#tools) - __TOOLS__ utilities, listed by category
- [Blog](#blog) - __POSTS__ how-to guides
- [Legal and informational pages](#legal-and-informational-pages)
- [How the tools work](#how-the-tools-work)
- [Machine-readable data](#machine-readable-data)
- [Contact](#contact)

## Categories

Every tool is also reachable from a per-category page that lists the whole set:

__CATEGORY_BLOCK__

## Tools

Browse all tools: https://easyworktools.online/tools/

__TOOL_BLOCK__

## Blog

Browse all guides: https://easyworktools.online/blog/

Every guide is an original, practical walkthrough of one tool or one task, with
worked examples, the mistakes people actually make, and answers to the questions
readers ask in the comments.

## Legal and informational pages

- [About](https://easyworktools.online/about.html) - what the site is and is not
- [Contact](https://easyworktools.online/contact.html) - EasyWorkTools.online@gmail.com
- [Privacy Policy](https://easyworktools.online/privacy.html)
- [Cookie Policy](https://easyworktools.online/cookies.html)
- [Terms and Conditions](https://easyworktools.online/terms.html)
- [Disclaimer](https://easyworktools.online/disclaimer.html)
- [Resources](https://easyworktools.online/resources/)

## How the tools work

Everything runs in the visitor's browser. There is no backend, no account and no
upload, so:

- your text, images and documents are never sent to a server, and are never stored;
- the tools work offline once the page has loaded;
- there is no rate limit, because there is nothing to rate-limit.

The consequence worth stating plainly: the tools do the part that can be done
correctly and locally. Anything whose name suggests a hosted AI model - the
Humanizer, the Detector, the Rephraser, the Translate tool - is implemented from
published, checkable signals (sentence-length distribution, lexical variety,
contraction and hedge usage, punctuation habits, passive voice, filler phrases,
word-frequency analysis), and each such page states its real scope and limits on
the page itself. No tool claims a model, a ranking or an accuracy figure that
cannot be substantiated, and no tool claims to make content true or verified.

## Machine-readable data

- [ai-catalog.json](https://easyworktools.online/ai-catalog.json) - every tool
  and article with its URL, description, tags and structured data. Generated by
  the build from the manifests and the JSON-LD actually present on each page, so
  it cannot drift from the site.
- [sitemap.xml](https://easyworktools.online/sitemap.xml) - all indexable URLs.
- [tools-manifest.json](https://easyworktools.online/tools-manifest.json) - the
  tool index the build and the client-side search both read.

Structured data on the site: every tool page carries SoftwareApplication and
FAQPage; every article carries BlogPosting and FAQPage; the homepage carries
WebSite and Organization. Every FAQPage block is generated from the questions
and answers a reader can see on the page.

## Contact

EasyWorkTools.online@gmail.com

Corrections, bug reports and tool requests are all welcome. If a tool gives a
wrong answer, say which tool, what you put in and what came out - that is the
fastest way to get it fixed.

## Usage

This file follows the llms.txt convention. You are welcome to read, quote and
follow the links in it. Please attribute anything you reuse to
EasyWorkTools.online and link back to the page it came from.
`;

function writeLlmsTxt() {
  const grouped = new Map();
  for (const t of tools) {
    const c = t.category || 'Utility Tools';
    if (!grouped.has(c)) grouped.set(c, []);
    grouped.get(c).push(t);
  }
  const cats = [...grouped.keys()].sort((a, b) => {
    const ia = LLMS_CATEGORY_ORDER.indexOf(a), ib = LLMS_CATEGORY_ORDER.indexOf(b);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib) || a.localeCompare(b);
  });

  const blocks = cats.map((c) => {
    const items = grouped.get(c).slice().sort((a, b) => a.title.localeCompare(b.title));
    const lines = items.map((t) =>
      `- [${t.title}](${SITE_ORIGIN.replace(/\/$/, '')}${t.url.startsWith('/') ? t.url : '/' + t.url}) - ${String(t.description || '').replace(/\s+/g, ' ').trim()}`
    );
    return `### ${c.replace(/ Tools$/, '')} (${items.length})\n\n${lines.join('\n')}`;
  }).join('\n\n');

  /* The dedicated category pages, so an agent reading llms.txt can go straight
     to "all the PDF tools" rather than scanning the flat list. Built from the
     same CATEGORIES metadata as the homepage cards, so the counts and the
     descriptions cannot drift from what a visitor sees. */
  const catLines = CATEGORIES
    .filter((c) => tools.some((t) => catSlug(t.category) === c.slug))
    .map((c) => {
      const n = tools.filter((t) => catSlug(t.category) === c.slug).length;
      return `- [${c.title}](${SITE_ORIGIN}categories/${c.slug}/) - ${CATEGORY_INTRO[c.slug]} (${n} tool${n === 1 ? '' : 's'})`;
    })
    .join('\n');

  const text = LLMS_PROSE
    .replace(/__TOOLS__/g, String(tools.length))
    .replace(/__POSTS__/g, String(posts.length))
    .replace(/__CATEGORY_BLOCK__/, catLines)
    .replace(/__TOOL_BLOCK__/, blocks);

  return writeFileSync(path.join(root, 'llms.txt'), text);
}

await writeLlmsTxt();

/* ------------------------------------------------- link normalisation --- *
 *
 * Every generator above emits root-absolute internal links: the category
 * cards, the featured-tool links, the filter's "clear all" link and the
 * resources groups all write href="/categories/..." or href="/tools/...".
 * That is valid over HTTP and it is what shipped, so nothing here is a
 * bug fix in the usual sense.
 *
 * It is a problem for one real case: opening the archive straight off disk.
 * A leading slash resolves against the FILESYSTEM ROOT, not the project
 * folder, so from
 *
 *     file:///C:/.../Default Project/index.html
 *
 * the deck's own link "/categories/ai-write/" becomes
 *
 *     file:///C:/categories/ai-write/            <- drive root, does not exist
 *
 * and every category card, every featured tool and the fonts all fail.
 * Clicking a category card produced a bare "File not found" page.
 *
 * So after writing the pages, rewrite root-absolute references to
 * depth-relative ones. For a page served at a known depth the two forms
 * resolve to the SAME absolute URL over HTTP:
 *
 *     "/"        + "categories/ai-write/"  ->  /categories/ai-write/
 *     "/index.html" + "categories/ai-write/" -> /categories/ai-write/
 *
 * so no URL changes, and the relative form additionally works from a
 * subdirectory mount and from disk. It is strictly more robust.
 *
 * 404.html is excluded: a host serves it as the fallback for whatever URL
 * was missed, so its depth is unknowable and root-absolute is the only
 * correct choice there.
 *
 * Each rewrite is checked before it is written - posix.resolve of the old
 * and new forms must produce the identical absolute path, or the build
 * fails loudly rather than shipping a changed link.
 */
function normaliseInternalLinks() {
  const skipDirs = new Set(['node_modules', '.git', '.astro']);
  const EXCLUDE = new Set(['404.html']);
  let files = 0, changedFiles = 0, refs = 0, urls = 0, abs = 0;
  const problems = [];

  const walk = (dir, out = []) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, entry.name);
      if (entry.isDirectory()) { if (!skipDirs.has(entry.name)) walk(p, out); }
      else if (entry.name.endsWith('.html')) out.push(p);
    }
    return out;
  };

  for (const file of walk(root)) {
    const rel = path.relative(root, file).split(path.sep).join('/');
    if (EXCLUDE.has(rel)) continue;
    files++;

    const segments = rel.split('/');
    segments.pop();                                   /* drop the filename */
    const depth = segments.length;
    const prefix = '../'.repeat(depth);
    const pageDir = '/' + segments.join('/');

    const before = readFileSync(file, 'utf8');
    let after = before;

    /* A leading slash discards pageDir in posix.resolve; anything else is
       resolved against it. So one call proves both sides of every rewrite. */
    const sitePath = (href) => {
      if (/^(https?:|mailto:|tel:|data:|javascript:)/i.test(href)) return href;
      if (href.startsWith('//')) return href;
      return path.posix.resolve(pageDir || '/', href);
    };
    const rewrite = (href) => {
      if (!href.startsWith('/') || href.startsWith('//')) return null;
      const bare = href.slice(1);
      if (bare === '') return prefix === '' ? './' : prefix;
      return prefix + bare;
    };

    after = after.replace(/(src|href)="([^"]*)"/g, (m, attr, val) => {
      const next = rewrite(val);
      if (next === null) return m;
      if (sitePath(val) !== sitePath(next)) {
        problems.push(`${rel}: ${val} -> ${next}`);
        return m;
      }
      refs++;
      return `${attr}="${next}"`;
    });

    after = after.replace(/url\(\s*(['"]?)\/([^)'"]*)\1\s*\)/g, (m, q, rest) => {
      const next = rewrite('/' + rest);
      if (next === null) return m;
      if (sitePath('/' + rest) !== sitePath(next)) {
        problems.push(`${rel}: url(/${rest}) -> url(${next})`);
        return m;
      }
      urls++;
      return `url(${q}${next}${q})`;
    });

    /* Internal links written out in full, e.g. cardHref() produces
       href="https://easyworktools.online/tools/jpg-pdf-converter/". Correct over
       HTTP, but when the archive is opened off disk they navigate to production,
       so a reviewer clicking a tool card silently leaves the local copy and
       cannot tell whether their own edit took effect.

       Only <a> elements are touched. The 268 <link rel="canonical"> and
       <meta property="og:url"> references must stay absolute - that is their
       job - and they live on <link>/<meta>, never on <a>. */

    /* SITE_ORIGIN already ends in "/", and cardHref() concatenates a path whose
       own leading slash has been stripped, so the href reads
       "https://easyworktools.online" + "/tools/...". The trailing slash is
       therefore removed before matching - keeping it would demand a literal "//"
       and match nothing, which is exactly what happened on the first attempt:
       0 of 406 converted while the root-absolute pass still reported success. */
    const originBare = SITE_ORIGIN.replace(/\/+$/, '');
    after = after.replace(new RegExp(
      '(<a\\b[^>]*?href=")' + originBare.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(/[^"]*)"',
      'g'
    ), (m, open, rest) => {
      /* Compare the PATH PORTIONS, not the whole href. sitePath() deliberately
         returns an external URL unchanged, so passing the full
         "https://easyworktools.online/blog/x.html" compared a URL against a bare
         path and the guard aborted the build on every one of the 406 links.
         rest is already the root-absolute path the href resolves to, which is
         exactly what both sides should be compared as. */
      const next = rewrite(rest);
      if (next === null) return m;
      if (sitePath(rest) !== sitePath(next)) {
        problems.push(`${rel}: ${originBare}${rest} -> ${next}`);
        return m;
      }
      abs++;
      return open + next + '"';
    });

    if (after !== before) { writeFileSync(file, after); changedFiles++; }
  }

  if (problems.length) {
    console.error('Link normalisation refused to change these references:');
    problems.slice(0, 20).forEach((p) => console.error('  ' + p));
    throw new Error('link normalisation would have changed a target URL - build aborted');
  }
  console.log(`Normalised internal links in ${changedFiles} of ${files} pages (${refs} root-absolute references, ${urls} url(), ${abs} full-origin links).`);
  console.log('canonical/og left absolute on purpose - they must name the public URL.');
  console.log('404.html left root-absolute on purpose - its serving depth is unknowable.');
}

normaliseInternalLinks();

console.log(`Indexed ${tools.length} tools and ${posts.length} blog posts.`);
console.log(`Wrote ai-catalog.json (${tools.length} tools, ${posts.length} articles).`);
console.log(`Wrote llms.txt (${tools.length} tools, ${posts.length} articles).`);
