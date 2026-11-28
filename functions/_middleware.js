// Edge middleware: canonical host + internal-file protection.
//
// Two jobs, both at the edge, before any static asset is served.
//
// 1. CANONICAL HOST.
//    This site is reachable on multiple hostnames (the Cloudflare Pages
//    default *.pages.dev domain, the www subdomain, and the apex domain).
//    Serving identical content on more than one hostname causes duplicate-
//    content SEO issues and splits link/ranking signals. Every non-canonical
//    hostname is permanently redirected to the single canonical domain:
//    https://easyworktools.online
//
// 2. INTERNAL FILES MUST NOT BE PUBLIC.
//    Cloudflare Pages publishes every file in the repository, so /README.md,
//    /package.json, /schema.sql, the scripts/ and apps-script/ directories and
//    similar development files were all being served with HTTP 200 to anyone
//    who asked. They are not part of the website and are now answered with 410
//    Gone. _redirects cannot do this - it only supports 3xx status codes - so a
//    Pages Function is the correct tool.
//
//    Public on purpose, and therefore NOT blocked here:
//      /tools-manifest.json  - the client-side search reads it at runtime
//      /blog-manifest.json, /llms.txt, /ai-catalog.json - advertised indexes
//      /robots.txt, /sitemap.xml, /.well-known/security.txt
//
// Local development hosts are left untouched so `wrangler pages dev` and
// similar local previews keep working.

const CANONICAL_HOST = 'easyworktools.online';
const SKIP_HOSTS = new Set(['localhost', '127.0.0.1']);

// Exact paths that must never be served. Compared against a decoded,
// normalized path so encoded variants cannot bypass the check.
const PRIVATE_EXACT = new Set([
  '/readme.md',
  '/package.json',
  '/package-lock.json',
  '/schema.sql',
  '/_headers',
  '/_redirects',
  '/metadata.json',
  '/server.ts',
  '/vite.config.ts',
  '/tsconfig.json',
  '/.env',
  '/.env.example',
  '/open_source_licenses.md',
  '/tool_inventory_tracker.md',
  '/pdf_sejda_comparison_matrix.md',
  '/assets/vendor/readme.md'
]);

// Directory prefixes whose entire contents are development-only.
const PRIVATE_PREFIXES = [
  '/scripts/',
  '/apps-script/',
  '/functions/',
  '/src/',
  '/assets-src/',
  '/_work/',
  '/node_modules/'
];

function normalizedPath(pathname) {
  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch (_) {
    return null;
  }
  decoded = decoded.replace(/\\/g, '/');
  const parts = [];
  for (const part of decoded.split('/')) {
    if (!part || part === '.') continue;
    if (part === '..') {
      parts.pop();
      continue;
    }
    parts.push(part);
  }
  return '/' + parts.join('/');
}

function hasDotfileSegment(pathname) {
  const segments = pathname.split('/').filter(Boolean);
  return segments.some(segment => segment.startsWith('.')
    && segment.toLowerCase() !== '.well-known');
}

function isPrivateFile(pathname) {
  if (pathname === null) return true;
  const p = pathname.toLowerCase();
  if (PRIVATE_EXACT.has(p)) return true;
  if (hasDotfileSegment(p)) return true;
  for (const prefix of PRIVATE_PREFIXES) {
    if (p === prefix.slice(0, -1) || p.startsWith(prefix)) return true;
  }
  return false;
}

function isInternalReport(pathname) {
  if (pathname === null) return false;
  const p = pathname.toLowerCase().replace(/\/+$/, '');
  return p === '/reports' || p.startsWith('/reports/');
}

function gone() {
  return new Response('410 Gone - this file is not part of the public website.', {
    status: 410,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex'
    }
  });
}

function reportNotFound() {
  return new Response('404 Not Found', {
    status: 404,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow'
    }
  });
}

export async function onRequest(context) {
  const { request, next } = context;
  const url = new URL(request.url);

  if (url.hostname === CANONICAL_HOST || SKIP_HOSTS.has(url.hostname)) {
    const path = normalizedPath(url.pathname);
    if (isInternalReport(path)) return reportNotFound();
    if (isPrivateFile(path)) return gone();
    return next();
  }

  url.hostname = CANONICAL_HOST;
  url.protocol = 'https:';
  return Response.redirect(url.toString(), 301);
}
