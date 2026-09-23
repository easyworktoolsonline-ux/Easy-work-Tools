// Canonical-domain redirect.
//
// This site is reachable on multiple hostnames (the Cloudflare Pages
// default *.pages.dev domain, the www subdomain, and the apex domain).
// Serving identical content on more than one hostname causes duplicate-
// content SEO issues and splits link/ranking signals. This middleware
// runs on every request, at the edge, before any page is served, and
// permanently redirects every non-canonical hostname to the single
// canonical domain: https://easyworktools.online
//
// Local development hosts are left untouched so `wrangler pages dev`
// and similar local previews keep working.

const CANONICAL_HOST = 'easyworktools.online';
const SKIP_HOSTS = new Set(['localhost', '127.0.0.1']);

export async function onRequest(context) {
  const { request, next } = context;
  const url = new URL(request.url);

  if (url.hostname === CANONICAL_HOST || SKIP_HOSTS.has(url.hostname)) {
    return next();
  }

  url.hostname = CANONICAL_HOST;
  url.protocol = 'https:';
  return Response.redirect(url.toString(), 301);
}
