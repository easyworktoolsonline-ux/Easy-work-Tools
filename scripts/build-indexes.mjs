import { promises as fs } from 'node:fs';
import path from 'node:path';

const root = process.cwd();

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
    tags: Array.isArray(cfg.tags) ? cfg.tags : []
  });
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
  { title: 'Home', description: 'EasyWorkTools.online homepage.', url: 'index.html', type: 'Page' },
  { title: 'Tools', description: 'Browse free online tools.', url: 'index.html#tools', type: 'Page' },
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

const allHtml = await walk(root);
for (const f of allHtml) {
  if (f.includes(`${path.sep}ads${path.sep}`)) continue;

  let text = await fs.readFile(f, 'utf8');
  const relDir = path.dirname(path.relative(root, f)).split(path.sep).join('/');
  const depth = relDir === '.' ? 0 : relDir.split('/').length;
  const prefix = depth ? '../'.repeat(depth) : '';
  const appSrc = `${prefix}assets/app.js`;
  const toolsManifest = `${prefix}tools-manifest.json`;
  const blogManifest = `${prefix}blog-manifest.json`;

  // Remove previously generated data/app blocks so repeated builds stay clean.
  text = text.replace(/\s*<script[^>]*>\s*window\.__SITE_DATA__=[\s\S]*?<\/script>\s*/gi, '\n');
  text = text.replace(/\s*<script[^>]+src=["'][^"']*assets\/app\.js["'][^>]*><\/script>\s*/gi, '\n');

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
  const loader = `<script>window.__SITE_DATA__=${searchableSiteData}</script><script src="${appSrc}"></script>`;
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
  'https://easyworktools.online/blog/',
  'https://easyworktools.online/resources/',
  'https://easyworktools.online/about.html',
  'https://easyworktools.online/privacy.html',
  'https://easyworktools.online/cookies.html',
  'https://easyworktools.online/disclaimer.html',
  'https://easyworktools.online/terms.html',
  'https://easyworktools.online/contact.html',
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

console.log(`Indexed ${tools.length} tools and ${posts.length} blog posts.`);
