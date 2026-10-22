/* Minifies the shared stylesheets and scripts for production.
 *
 * Readable sources live in assets-src/; the minified output is written to
 * assets/, which is what every page links to, so no URL changes. Edit the
 * files in assets-src/, then run `npm run build:assets` (needs esbuild:
 * `npm i -D esbuild`) BEFORE `npm run build`. The minified files are committed,
 * so a deploy does not need esbuild installed.
 *
 * assets/app.js is deliberately not processed: scripts/build-indexes.mjs
 * extracts iconSvg() from its source text and it is already hand-minified. */
import { readFileSync, writeFileSync } from 'node:fs';
let esbuild;
try { esbuild = await import('esbuild'); }
catch { console.error('esbuild is not installed; skipping asset minification (run: npm i -D esbuild).'); process.exit(0); }
const jobs = [
  ['styles.css', 'css'], ['categories.css', 'css'],
  ['featured-coverflow.js', 'js'], ['tool-tabs.js', 'js'], ['category-carousel.js', 'js']
];
for (const [name, loader] of jobs) {
  const src = readFileSync(`assets-src/${name}`, 'utf8');
  const out = esbuild.transformSync(src, { loader, minify: true, legalComments: 'none', target: loader === 'js' ? 'es2020' : 'chrome90' }).code;
  writeFileSync(`assets/${name}`, out);
  console.log(`${name}: ${src.length} -> ${out.length} bytes`);
}
