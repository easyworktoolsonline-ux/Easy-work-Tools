// Catch-all for /reports/* so internal audit evidence is never served as a
// static asset. Files remain available locally/in Git; this route answers 404.

const HEADERS = {
  'Content-Type': 'text/plain; charset=utf-8',
  'Cache-Control': 'no-store',
  'X-Robots-Tag': 'noindex, nofollow'
};

export async function onRequest() {
  return new Response('404 Not Found', { status: 404, headers: HEADERS });
}
