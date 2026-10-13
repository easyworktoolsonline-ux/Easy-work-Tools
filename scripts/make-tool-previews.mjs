/* --------------------------------------------------------------------------
 * Generates one real screenshot per curated tool, for the "Featured Tools"
 * showcase on the homepage.
 *
 * These are genuine renders of the tool pages, taken with a headless browser,
 * so the preview cannot drift from the tool it advertises the way a mockup
 * could. Each is cropped to the tool's own workspace area (not the site
 * navbar), scaled to 560px wide and encoded as WebP.
 *
 * Output:
 *   assets/img/tools/<slug>.webp   the preview
 *   assets/img/tools/manifest.json slug -> { file, w, h } so the build can emit
 *                                    intrinsic width/height and avoid layout shift
 *
 * Run manually, not from build-indexes.mjs: the build must stay idempotent and
 * must not need a browser. The images are committed, and the build only reads
 * the manifest. If a tool is renamed or removed, re-run this.
 *
 *   node scripts/make-tool-previews.mjs
 * ------------------------------------------------------------------------ */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const OUT_DIR = path.join(ROOT, 'assets', 'img', 'tools');
const WIDTH = 560;
/* Every preview is emitted at exactly this size. The tools' workspaces differ
 * in height, so leaving the height to the crop produced cards ranging from 219
 * to 341px tall - ragged in a grid. Cropping to a fixed aspect and scaling with
 * "cover" gives every card identical dimensions, so the grid rows line up and the
 * intrinsic height in the manifest is a single value. */
const OUT_HEIGHT = 300;
const PORT = 4399;
/* Capture viewport. Tall enough that a full-aspect crop of the widest workspace
 * still fits without scrolling. */
const VIEW_W = 1200;
const VIEW_H = 1500;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8'
};

/* A minimal static server for the project root. Self-contained on purpose: the
 * generator must be runnable from a clean checkout without the audit harness. */
function serve(root, port) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let rel = decodeURIComponent(req.url.split('?')[0]);
      if (rel.endsWith('/')) rel += 'index.html';
      const file = path.join(root, rel);
      if (!file.startsWith(root)) { res.writeHead(403).end(); return; }
      fs.readFile(file, (err, buf) => {
        if (err) {
          res.writeHead(404, { 'content-type': 'text/plain' }).end('not found');
          return;
        }
        res.writeHead(200, {
          'content-type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream',
          'cache-control': 'no-store'
        });
        res.end(buf);
      });
    });
    server.listen(port, '127.0.0.1', () => resolve(server));
  });
}

/* The nine tools are the curated per-category picks, read from the same module
 * the tab bar uses, so the showcase and the All Tools tab can never disagree
 * about what "best" means. */
const { POPULAR_PICKS } = await import('./popular-tools.mjs');
const { toolKey } = await import('./popular-tools.mjs');
const picks = Object.values(POPULAR_PICKS);

const server = await serve(ROOT, PORT);
console.log('serving ' + ROOT + ' on ' + PORT);

/* puppeteer-core and sharp are build-time-only tooling and are deliberately
 * NOT dependencies of the site, which ships as static files. ESM resolves
 * packages relative to this file rather than the working directory, so a bare
 * import fails when the script is run from the repo with node_modules living
 * elsewhere. EWT_TOOLING_DIR lets it be pointed at wherever the tooling is
 * installed instead of hardcoding a path that would be wrong on any other
 * machine. */
async function loadTooling() {
  try {
    return { puppeteer: (await import('puppeteer-core')).default, sharp: (await import('sharp')).default };
  } catch (e) { /* fall through to the explicit directory */ }
  const dir = process.env.EWT_TOOLING_DIR;
  if (!dir) throw new Error('EWT_TOOLING_DIR not set');
  const { createRequire } = await import('node:module');
  const req = createRequire(path.join(dir, 'noop.js'));
  return { puppeteer: req('puppeteer-core'), sharp: req('sharp') };
}

let puppeteer, sharp;
try {
  ({ puppeteer, sharp } = await loadTooling());
} catch (e) {
  server.close();
  console.error('Could not load the preview tooling: ' + e.message);
  console.error('');
  console.error('This script needs puppeteer-core and sharp (build-time only - the');
  console.error('site itself ships as static files and has no dependencies). Point');
  console.error('EWT_TOOLING_DIR at a node_modules parent that provides them:');
  console.error('');
  console.error('  EWT_TOOLING_DIR=/path/to/node_modules/.. node scripts/make-tool-previews.mjs');
  process.exit(2);
}

const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars']
});

fs.mkdirSync(OUT_DIR, { recursive: true });
const manifest = {};
let total = 0;

for (const slug of picks) {
  const page = await browser.newPage();
  // 1200px viewport, DPR 1: the capture is downscaled to 560 anyway, so a high
  // DPR would only waste time and bytes.
  await page.setViewport({ width: VIEW_W, height: VIEW_H, deviceScaleFactor: 1 });
  const url = 'http://127.0.0.1:' + PORT + '/tools/' + slug + '/';
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 1200));

  const notFound = await page.evaluate(() => !!document.querySelector('h1')
    && /page not found/i.test(document.querySelector('h1').textContent || ''));
  if (notFound) { console.error('  MISSING PAGE: ' + url); await page.close(); process.exitCode = 1; continue; }

  /* Crop to the tool's workspace, skipping the site navbar and breadcrumb so
   * the preview shows the tool itself rather than the site's chrome. */
  /* Clamped to the viewport, and the capture height is derived from the
   * captured WIDTH so the source already has the target aspect ratio.
   *
   * That derivation is the fix for the Essay Writer preview arriving with its
   * first line sliced in half. The earlier code captured a fixed 1200x420 - a
   * 2.86:1 source - then asked sharp for 560x300 with fit:"cover". Cover scales
   * to fill and crops the overflow, and position:"top" only controls the VERTICAL
   * axis: the horizontal axis stayed centred, so sharp silently took the middle
   * 65% of the width and cut text off both sides. Capturing at the target aspect
   * means there is nothing to crop. */
  const clip = await page.evaluate((vw, target) => {
    const ws = document.querySelector('.workspace-layout, .tool-shell, .tool-card, main');
    if (!ws) return { x: 0, y: 0, width: vw, height: Math.round(vw * target) };
    const r = ws.getBoundingClientRect();
    const x = Math.max(0, Math.min(Math.round(r.left), vw - 1));
    const width = Math.max(1, Math.min(Math.round(r.width), vw - x));
    return {
      x,
      y: Math.max(0, Math.round(r.top + window.scrollY)),
      width,
      height: Math.round(width * target)
    };
  }, VIEW_W, OUT_HEIGHT / WIDTH);

  // never ask for more than the viewport can give without scrolling into view
  if (clip.height > VIEW_H - 40) clip.height = VIEW_H - 40;

  const shot = await page.screenshot({ encoding: 'binary', clip });
  const out = await sharp(Buffer.from(shot))
    .resize(WIDTH, OUT_HEIGHT, { fit: 'cover', position: 'top' })
    .webp({ quality: 74, effort: 6 })
    .toBuffer();

  const meta = await sharp(out).metadata();
  const file = slug.replace(/[^a-z0-9-]+/gi, '-') + '.webp';
  fs.writeFileSync(path.join(OUT_DIR, file), out);
  manifest[toolKey('tools/' + slug + '/')] = { file: 'assets/img/tools/' + file, w: meta.width, h: meta.height };
  total += out.length;
  console.log('  ' + slug.padEnd(30) + file.padEnd(34) + meta.width + 'x' + meta.height + '  ' + Math.round(out.length / 1024) + ' KB');
  await page.close();
}

await browser.close();
server.close();

fs.writeFileSync(path.join(OUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n', 'utf8');
console.log('\n' + Object.keys(manifest).length + ' previews, ' + Math.round(total / 1024) + ' KB total');
console.log('wrote ' + path.join(OUT_DIR, 'manifest.json'));