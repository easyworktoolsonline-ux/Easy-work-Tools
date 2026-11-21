import { promises as fs } from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import {
  OG_IMAGE_URL,
  OG_IMAGE_TYPE,
  OG_IMAGE_WIDTH,
  OG_IMAGE_HEIGHT,
} from '../../scripts/og-metadata.mjs';

const root = process.cwd();
const csvPath = process.argv[2] || path.join(root, '_work', 'og-image-implementation', 'OG-METADATA-VALIDATION.csv');
const summaryPath = process.argv[3] || path.join(root, '_work', 'og-image-implementation', 'validation-summary.json');
const skipDirs = new Set(['node_modules', '.git', '.wrangler', '_work', 'ads', 'public']);

const REQUIRED = [
  ['og:type', 'property'],
  ['og:site_name', 'property'],
  ['og:title', 'property'],
  ['og:description', 'property'],
  ['og:url', 'property'],
  ['og:image', 'property'],
  ['og:image:secure_url', 'property'],
  ['og:image:type', 'property'],
  ['og:image:width', 'property'],
  ['og:image:height', 'property'],
  ['og:image:alt', 'property'],
  ['twitter:card', 'name'],
  ['twitter:title', 'name'],
  ['twitter:description', 'name'],
  ['twitter:image', 'name'],
];
const IMAGE_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function decode(value) {
  return String(value)
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&amp;/gi, '&');
}

function attr(tag, name) {
  const m = tag.match(new RegExp('\\b' + name + '\\s*=\\s*(["\'])(.*?)\\1', 'i'));
  return m ? decode(m[2]) : null;
}

function collect(head) {
  const map = new Map();
  for (const m of head.matchAll(/<meta\b[^>]*>/gi)) {
    const tag = m[0];
    const key = (attr(tag, 'property') || attr(tag, 'name') || '').toLowerCase();
    if (!key) continue;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(attr(tag, 'content'));
  }
  return map;
}

function canonicalOf(head) {
  for (const m of head.matchAll(/<link\b[^>]*>/gi)) {
    const tag = m[0];
    const rel = attr(tag, 'rel');
    if (rel && rel.toLowerCase().split(/\s+/).includes('canonical')) return attr(tag, 'href');
  }
  return null;
}

function groupOf(rel) {
  if (rel === 'index.html') return 'homepage';
  if (rel === 'tools/index.html') return 'tools-index';
  if (rel.startsWith('tools/')) return 'tool';
  if (rel === 'blog/index.html') return 'guides-index';
  if (rel.startsWith('blog/')) return 'article';
  if (rel.startsWith('categories/')) return 'category';
  if (rel.startsWith('resources/')) return 'resources';
  return 'landing';
}

function csv(value) {
  const s = value == null ? '' : String(value);
  return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

function pngDimensions(buffer) {
  if (buffer.length < 24) return null;
  if (!buffer.subarray(0, 8).equals(IMAGE_SIGNATURE)) return null;
  if (buffer.toString('ascii', 12, 16) !== 'IHDR') return null;
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

async function walk(dir) {
  const out = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    if (skipDirs.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await walk(full));
    else if (entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

const sitemap = await fs.readFile(path.join(root, 'sitemap.xml'), 'utf8');
const sitemapUrls = new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]));
const files = await walk(root);
const rows = [];
const byGroup = {};
const missingCounter = new Map();
let staleImageHeads = 0;
let duplicatePages = 0;
let canonicalMismatch = 0;
let sitemapMismatch = 0;

for (const file of files) {
  const text = await fs.readFile(file, 'utf8');
  const headMatch = text.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i);
  if (!headMatch) continue;
  const head = headMatch[1];
  const canonical = canonicalOf(head);
  const robotsMeta = collect(head).get('robots')?.[0] || '';
  if (!canonical || /\bnoindex\b/i.test(robotsMeta)) continue;

  const meta = collect(head);
  const rel = path.relative(root, file).split(path.sep).join('/');
  const group = groupOf(rel);
  byGroup[group] = (byGroup[group] || 0) + 1;

  const missing = [];
  const duplicates = [];
  const mismatches = [];

  for (const [key] of REQUIRED) {
    const values = meta.get(key) || [];
    if (!values.length || values[0] == null || values[0] === '') missing.push(key);
    if (values.length > 1) duplicates.push(`${key}x${values.length}`);
    if (missingCounter.has(key) && (!values.length || !values[0])) missingCounter.set(key, missingCounter.get(key) + 1);
    else if (!missingCounter.has(key)) missingCounter.set(key, 0);
  }

  const one = key => meta.get(key)?.[0] || '';
  if (one('og:site_name') !== 'EasyWorkTools.online') mismatches.push('og:site_name');
  if (!one('og:title')) mismatches.push('og:title');
  if (!one('og:description')) mismatches.push('og:description');
  if (one('og:url') !== canonical) { mismatches.push('og:url!=canonical'); canonicalMismatch++; }
  if (!sitemapUrls.has(canonical)) { mismatches.push('canonical-not-in-sitemap'); sitemapMismatch++; }
  if (one('og:image') !== OG_IMAGE_URL) mismatches.push('og:image');
  if (!/^https:\/\//i.test(one('og:image'))) mismatches.push('og:image-not-https');
  if (one('og:image:secure_url') !== one('og:image')) mismatches.push('og:image:secure_url');
  if (one('og:image:type') !== OG_IMAGE_TYPE) mismatches.push('og:image:type');
  if (one('og:image:width') !== OG_IMAGE_WIDTH) mismatches.push('og:image:width');
  if (one('og:image:height') !== OG_IMAGE_HEIGHT) mismatches.push('og:image:height');
  if (!one('og:image:alt')) mismatches.push('og:image:alt');
  if (one('twitter:card') !== 'summary_large_image') mismatches.push('twitter:card');
  if (!one('twitter:title')) mismatches.push('twitter:title');
  if (!one('twitter:description')) mismatches.push('twitter:description');
  if (one('twitter:image') !== one('og:image')) mismatches.push('twitter:image');

  const staleImageMeta = [...head.matchAll(/<meta\b[^>]*>/gi)].some(m => (
    /assets\/og-image\.png/i.test(m[0]) || /assets\/easyworktools-og\.jpg/i.test(m[0])
  ));
  if (staleImageMeta) mismatches.push('stale-image-in-meta');
  if (staleImageMeta) staleImageHeads++;
  if (duplicates.length) duplicatePages++;

  const status = missing.length || duplicates.length || mismatches.length ? 'FAIL' : 'PASS';
  rows.push({
    file: rel,
    group,
    canonical,
    status,
    missing: missing.join('|'),
    duplicates: duplicates.join('|'),
    mismatches: mismatches.join('|'),
  });
}

const header = ['file', 'group', 'canonical', 'status', 'missing_tags', 'duplicate_tags', 'mismatches'];
const body = rows.map(r => [
  r.file, r.group, r.canonical, r.status, r.missing, r.duplicates, r.mismatches,
].map(csv).join(','));
await fs.mkdir(path.dirname(csvPath), { recursive: true });
await fs.writeFile(csvPath, header.join(',') + '\n' + body.join('\n') + '\n');

const imagePath = path.join(root, 'assets', 'easyworktools-og.png');
const imageBuffer = await fs.readFile(imagePath);
const dims = pngDimensions(imageBuffer);
const passed = rows.filter(r => r.status === 'PASS').length;
const failed = rows.length - passed;
const summary = {
  htmlFilesScanned: files.length,
  indexablePages: rows.length,
  passed,
  failed,
  byGroup,
  staleImageHeads,
  duplicateTagPages: duplicatePages,
  canonicalOgUrlMismatches: canonicalMismatch,
  sitemapCanonicalMismatches: sitemapMismatch,
  missingByTag: Object.fromEntries(missingCounter),
  image: {
    path: 'assets/easyworktools-og.png',
    format: 'png',
    bytes: imageBuffer.length,
    width: dims?.width,
    height: dims?.height,
    signatureValid: dims !== null,
    exact2400x1260: dims?.width === Number(OG_IMAGE_WIDTH) && dims?.height === Number(OG_IMAGE_HEIGHT),
    expectedUrl: OG_IMAGE_URL,
    expectedType: OG_IMAGE_TYPE,
    sha256: createHash('sha256').update(imageBuffer).digest('hex'),
  },
  sitemapUrls: sitemapUrls.size,
};
await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2) + '\n');
console.log(JSON.stringify(summary, null, 2));
if (failed || !summary.image.exact2400x1260) process.exitCode = 1;
