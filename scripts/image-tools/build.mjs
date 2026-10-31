/* Generates the browser-side image tool pages. Run from the project root:
 *   node scripts/image-tools/build.mjs
 * then `node scripts/build-indexes.mjs` to refresh manifests, sitemap and search data. */
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { writeTool } from './core.mjs';
import { CONVERTERS } from './defs-convert.mjs';

const root = process.cwd();
const specs = [...CONVERTERS];
{
  const { HEIC_PNG } = await import('./defs-heic.mjs');
  const { GIFS, GIF_APNG } = await import('./defs-gif.mjs');
  const { FA } = await import('./defs-fa.mjs');
  const { PROFILE } = await import('./defs-profile.mjs');
  specs.push(HEIC_PNG, ...GIFS, GIF_APNG, FA, PROFILE);
  for (const mod of ['./defs-tools.mjs']) {
    try { const m = await import(mod); specs.push(...(m.TOOLS || [])); } catch (e) { if (e.code !== 'ERR_MODULE_NOT_FOUND') throw e; }
  }
}
const info = {};
for (const s of specs) info[s.slug] = { title: s.cardTitle || s.name, desc: s.cardDescription };
function card(slug) {
  if (info[slug]) return { slug, title: info[slug].title, desc: info[slug].desc };
  const f = path.join(root, 'tools', slug, 'tool.json');
  if (!existsSync(f)) throw new Error('related tool missing: ' + slug);
  const j = JSON.parse(readFileSync(f, 'utf8'));
  return { slug, title: j.title, desc: j.description };
}
for (const s of specs) {
  const rel = (s.related || []).slice(0, 3).map(card);
  writeTool(s, root, rel);
  console.log('wrote tools/' + s.slug + '/');
}
console.log(specs.length + ' pages');
