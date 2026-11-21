import { promises as fs } from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';

const root = process.cwd();
const output = process.argv[2] || path.join(root, '_work', 'og-image-implementation', 'preserved-before.json');
const skip = new Set(['node_modules', '.git', '.wrangler', '_work', 'ads', 'public']);

async function walk(dir) {
  const out = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    if (skip.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await walk(full));
    else if (entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

function sha(value) {
  return createHash('sha256').update(value).digest('hex');
}

function attr(tag, name) {
  const m = tag.match(new RegExp('\\b' + name + '\\s*=\\s*(["\'])(.*?)\\1', 'i'));
  return m ? m[2] : null;
}

function meta(head, key) {
  for (const m of head.matchAll(/<meta\b[^>]*>/gi)) {
    const tag = m[0];
    if ((attr(tag, 'property') || attr(tag, 'name') || '').toLowerCase() === key) return attr(tag, 'content');
  }
  return null;
}

function canonical(head) {
  for (const m of head.matchAll(/<link\b[^>]*>/gi)) {
    const tag = m[0];
    const rel = attr(tag, 'rel');
    if (rel && rel.toLowerCase().split(/\s+/).includes('canonical')) return attr(tag, 'href');
  }
  return null;
}

const snapshot = {};
const files = await walk(root);
for (const file of files) {
  const text = await fs.readFile(file, 'utf8');
  const headMatch = text.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i);
  const head = headMatch ? headMatch[1] : '';
  const titleMatch = head.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  const jsonLd = [...head.matchAll(/<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
    .map(m => sha(m[1]));
  const rel = path.relative(root, file).split(path.sep).join('/');
  snapshot[rel] = {
    title: titleMatch ? titleMatch[1].trim() : null,
    description: meta(head, 'description'),
    canonical: canonical(head),
    robots: meta(head, 'robots'),
    ogUrl: meta(head, 'og:url'),
    jsonLd,
  };
}

await fs.mkdir(path.dirname(output), { recursive: true });
await fs.writeFile(output, JSON.stringify(snapshot, null, 2) + '\n');
console.log(`Snapshot written: ${output}`);
console.log(`Files captured: ${Object.keys(snapshot).length}`);
