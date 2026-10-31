/* =====================================================================
   clean-urls.mjs  -  make every URL the site advertises the URL it is served at

   WHY
   Cloudflare Pages serves about.html at /about and blog/post.html at /blog/post,
   and answers a request for the .html form with a 308 redirect. A sitemap,
   canonical tag or internal link that names the .html form therefore points at a
   redirect, which Search Console reports as "Page with redirect" and, for the
   canonical, "Alternative page with proper canonical tag".

   WHAT
   Rewrites the .html form to the served form in:
     - every page: <a href>, <link href> (canonical/alternate), og:url / twitter:url,
       JSON-LD and the inlined window.__SITE_DATA__ catalogue
     - sitemap.xml, llms.txt, ai-catalog.json, tools-manifest.json, blog-manifest.json

     /about.html                -> /about
     /blog/post.html            -> /blog/post
     /blog/index.html, ../index.html -> /blog/ , ../
     404.html is left alone: it is a special file, not a page that is linked.

   It is idempotent and is run as the last step of build-indexes.mjs, so a rebuild
   can never put the .html forms back.  Run on its own:  node scripts/clean-urls.mjs

   dirtyShell() is the inverse for the tools/index.html shell that build-indexes
   reuses to make the category pages; see build-indexes.mjs.
   ===================================================================== */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ORIGIN = 'https://easyworktools.online';
const SKIP_DIRS = new Set(['node_modules', '.git', 'assets-src', 'apps-script', 'functions', 'ads', 'backup']);
const DATA_FILES = ['.well-known/security.txt', 'sitemap.xml', 'llms.txt', 'ai-catalog.json', 'tools-manifest.json', 'blog-manifest.json'];

/* Clean one URL or path. Anything that is not an internal .html reference is returned as is. */
export function cleanRef(ref) {
  const m = /^([^?#]*)([?#].*)?$/.exec(ref);
  const p = m[1], tail = m[2] || '';
  if (!p.endsWith('.html')) return ref;
  const base = p.slice(p.lastIndexOf('/') + 1);
  if (base === '404.html') return ref;
  if (base === 'index.html') {
    const dir = p.slice(0, -'index.html'.length);
    return (dir === '' ? './' : dir) + tail;
  }
  return p.slice(0, -'.html'.length) + tail;
}

const isInternal = (u) =>
  !/^[a-z][a-z0-9+.-]*:/i.test(u) && !u.startsWith('//')
  || u.startsWith(ORIGIN + '/') || u === ORIGIN
  || u.startsWith('https://www.easyworktools.online');

export function cleanHtml(html) {
  /* anchors and <link> elements (canonical, alternate) */
  html = html.replace(/(<(?:a|link)\b[^>]*?\bhref\s*=\s*)(["'])([^"']*)\2/gi, (m, pre, q, val) =>
    isInternal(val) ? pre + q + cleanRef(val) + q : m);
  /* og:url / twitter:url */
  html = html.replace(/(<meta\b[^>]*?(?:property|name)\s*=\s*["'](?:og:url|twitter:url)["'][^>]*?\bcontent\s*=\s*)(["'])([^"']*)\2/gi,
    (m, pre, q, val) => pre + q + cleanRef(val) + q);
  html = html.replace(/(<meta\b[^>]*?\bcontent\s*=\s*)(["'])([^"']*)\2([^>]*?(?:property|name)\s*=\s*["'](?:og:url|twitter:url)["'])/gi,
    (m, pre, q, val, post) => pre + q + cleanRef(val) + q + post);
  return cleanText(html);
}

/* Absolute URLs and JSON "url" values, in any text (JSON-LD, SITE_DATA, manifests, llms.txt, sitemap). */
export function cleanText(text) {
  text = text.replace(/https:\/\/(?:www\.)?easyworktools\.online(\/[^\s"'<>)\\#?]*?)\.html(?![A-Za-z0-9_-])/g,
    (m, p) => {
      if (p.endsWith('/404')) return m;
      if (p === '/index') return ORIGIN + '/';
      if (p.endsWith('/index')) return ORIGIN + p.slice(0, -'index'.length);
      return ORIGIN + p;
    });
  text = text.replace(/("url"\s*:\s*")([^"]*?\.html)(")/g, (m, a, u, c) => (isInternal(u) ? a + cleanRef(u) + c : m));
  return text;
}

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.') && e.name !== '.well-known') continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (!SKIP_DIRS.has(e.name)) walk(p, out); }
    else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
}

export function cleanAll() {
  let changed = 0, files = 0;
  const targets = [...walk(root), ...DATA_FILES.map((f) => path.join(root, f)).filter((f) => fs.existsSync(f))];
  for (const f of targets) {
    const raw = fs.readFileSync(f);
    const before = raw.toString('utf8');
    const after = f.endsWith('.html') ? cleanHtml(before) : cleanText(before);
    files++;
    if (after !== before) { fs.writeFileSync(f, after); changed++; }
  }
  return { files, changed };
}

/* Inverse used on the tools/index.html shell only (see build-indexes.mjs). The shell's own links are
   a small known set, so the inverse is exact for them. */
export function dirtyShell(html) {
  return html
    .replace(/(href|src)="((?:\.\.\/|\.\/)?)(about|contact|terms|privacy|cookies|disclaimer|security)"/g, '$1="$2$3.html"')
    .replace(/(href|src)="((?:\.\.\/)?)(blog|resources)\/"/g, '$1="$2$3/index.html"')
    .replace(/(href|src)="\.\.\/tools\/"/g, '$1="../tools/index.html"')
    .replace(/(href|src)="\.\/(#[^"]*)"/g, '$1="index.html$2"')
    .replace(/(href|src)="\.\.\/"/g, '$1="../index.html"');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const r = cleanAll();
  console.log(`clean-urls: ${r.changed} of ${r.files} files rewritten.`);
}
