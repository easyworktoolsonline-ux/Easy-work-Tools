/* Packs the Font Awesome Free SVG icons into one lazy-loaded script.
 *   node scripts/image-tools/build-fa.mjs /path/to/@fortawesome/fontawesome-free
 * Icons are CC BY 4.0 (attribution is shown on the tool page); see assets/image-tools/LICENSE-fontawesome.txt. */
import { readFileSync, readdirSync, writeFileSync, copyFileSync } from 'node:fs';
import path from 'node:path';
const src = process.argv[2] || '/opt/npm-tools/node_modules/@fortawesome/fontawesome-free';
const ver = JSON.parse(readFileSync(path.join(src, 'package.json'), 'utf8')).version;
const sets = {};
let n = 0;
for (const set of ['solid', 'regular', 'brands']) {
  sets[set] = {};
  for (const f of readdirSync(path.join(src, 'svgs', set)).sort()) {
    const svg = readFileSync(path.join(src, 'svgs', set, f), 'utf8');
    const vb = /viewBox="0 0 (\d+(?:\.\d+)?) (\d+(?:\.\d+)?)"/.exec(svg);
    const ds = [...svg.matchAll(/<path[^>]* d="([^"]+)"/g)].map(m => m[1]);
    if (!vb || !ds.length) { console.warn('skipped', set, f); continue; }
    sets[set][f.replace(/\.svg$/, '')] = [Number(vb[1]), Number(vb[2]), ds.join('')];
    n++;
  }
}
const js = '/* Font Awesome Free ' + ver + ' icons (CC BY 4.0, https://fontawesome.com/license/free), packed by scripts/image-tools/build-fa.mjs */\n' +
  'window.EWT=window.EWT||{};window.EWT.faIcons={version:' + JSON.stringify(ver) + ',sets:' + JSON.stringify(sets) + '};\n';
writeFileSync('assets/image-tools/fa-icons.js', js);
copyFileSync(path.join(src, 'LICENSE.txt'), 'assets/image-tools/LICENSE-fontawesome.txt');
console.log(n + ' icons, ' + js.length + ' bytes, Font Awesome Free ' + ver);
