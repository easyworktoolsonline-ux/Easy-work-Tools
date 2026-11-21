import { spawn } from 'node:child_process';
import { promises as fs } from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { OG_IMAGE_URL, OG_IMAGE_TYPE } from '../../scripts/og-metadata.mjs';

const root = process.cwd();
const reportPath = path.join(root, '_work', 'og-image-implementation', 'local-preview-verification.json');
const imagePath = path.join(root, 'assets', 'easyworktools-og.png');
const EXPECTED_URL = OG_IMAGE_URL;
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });
}

async function waitForServer(base, child) {
  for (let i = 0; i < 80; i++) {
    if (child.exitCode !== null) throw new Error(`preview server exited early with code ${child.exitCode}`);
    try {
      const res = await fetch(base + '/', { redirect: 'manual' });
      if (res.status < 500) return;
    } catch {}
    await sleep(250);
  }
  throw new Error('preview server did not become ready');
}

async function request(base, pathname) {
  const res = await fetch(base + pathname, { redirect: 'follow' });
  const buffer = Buffer.from(await res.arrayBuffer());
  return {
    path: pathname,
    status: res.status,
    finalUrl: res.url,
    contentType: res.headers.get('content-type'),
    cacheControl: res.headers.get('cache-control'),
    bytes: buffer.length,
    buffer,
  };
}

const port = await freePort();
const base = `http://127.0.0.1:${port}`;
let serverLog = '';
const child = spawn(process.execPath, ['node_modules/tsx/dist/cli.mjs', 'server.ts'], {
  cwd: root,
  env: { ...process.env, PORT: String(port) },
  stdio: ['ignore', 'pipe', 'pipe'],
});
child.stdout.on('data', chunk => { serverLog += chunk.toString(); });
child.stderr.on('data', chunk => { serverLog += chunk.toString(); });

try {
  await waitForServer(base, child);

  const expected = await fs.readFile(imagePath);
  const asset = await request(base, '/assets/easyworktools-og.png');
  const homepage = await request(base, '/');
  const tool = await request(base, '/tools/age-calculator/');
  const article = await request(base, '/blog/ai-rephraser');

  const htmlChecks = (res) => {
    const html = res.buffer.toString('utf8');
    const head = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1] || '';
    const metas = [...head.matchAll(/<meta\b[^>]*>/gi)].map(m => m[0]);
    return {
      status: res.status,
      ogImage: metas.includes(`<meta property="og:image" content="${EXPECTED_URL}">`),
      ogSecureUrl: metas.includes(`<meta property="og:image:secure_url" content="${EXPECTED_URL}">`),
      twitterImage: metas.includes(`<meta name="twitter:image" content="${EXPECTED_URL}">`),
      staleImage: metas.some(tag => (
        tag.includes('assets/og-image.png') || tag.includes('assets/easyworktools-og.jpg')
      )),
      note: 'Only head meta tags are checked; preserved JSON-LD is intentionally outside this check.',
    };
  };

  const checks = {
    assetStatus200: asset.status === 200,
    assetContentTypePng: (asset.contentType || '').toLowerCase().startsWith(OG_IMAGE_TYPE),
    assetBytesMatchFile: asset.bytes === expected.length,
    assetBodyIdentical: Buffer.compare(asset.buffer, expected) === 0,
    homepage: htmlChecks(homepage),
    toolPage: htmlChecks(tool),
    articlePage: htmlChecks(article),
  };
  const htmlOk = [checks.homepage, checks.toolPage, checks.articlePage].every(v => (
    v.status === 200 && v.ogImage && v.ogSecureUrl && v.twitterImage && !v.staleImage
  ));
  checks.allChecksPassed = checks.assetStatus200
    && checks.assetContentTypePng
    && checks.assetBytesMatchFile
    && checks.assetBodyIdentical
    && htmlOk;

  const result = {
    verifiedAt: new Date().toISOString(),
    server: {
      command: `${process.execPath} node_modules/tsx/dist/cli.mjs server.ts`,
      baseUrl: base,
      port,
      log: serverLog.trim(),
    },
    asset: {
      path: '/assets/easyworktools-og.png',
      status: asset.status,
      contentType: asset.contentType,
      cacheControl: asset.cacheControl,
      bytes: asset.bytes,
      sha256: createHash('sha256').update(asset.buffer).digest('hex'),
      expectedSha256: createHash('sha256').update(expected).digest('hex'),
    },
    checks,
  };
  await fs.mkdir(path.dirname(reportPath), { recursive: true });
  await fs.writeFile(reportPath, JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify(result, null, 2));
  if (!checks.allChecksPassed) process.exitCode = 1;
} finally {
  child.kill('SIGTERM');
  await sleep(100);
  if (child.exitCode === null) child.kill('SIGKILL');
}
