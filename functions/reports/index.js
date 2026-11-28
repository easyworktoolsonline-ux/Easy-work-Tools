// Internal audit/report material is not part of the public website.
// Files remain in the repository for the owner; this route answers 404.

const HEADERS = {
  'Content-Type': 'text/plain; charset=utf-8',
  'Cache-Control': 'no-store',
  'X-Robots-Tag': 'noindex, nofollow'
};

export async function onRequest() {
  return new Response('404 Not Found', { status: 404, headers: HEADERS });
}
