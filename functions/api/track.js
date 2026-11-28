const MAX_BODY_BYTES = 2048;
const MAX_PATH_LENGTH = 300;
const SAFE_PATH = /^[A-Za-z0-9._~%-]+(?:\/[A-Za-z0-9._~%-]+)*$/;

async function readSmallJson(request) {
  const declared = Number(request.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) return null;

  if (!request.body) {
    try { return await request.json(); } catch (_) { return null; }
  }

  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let total = 0;
  let text = '';
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value && value.byteLength ? value.byteLength : (value ? value.length : 0);
      if (total > MAX_BODY_BYTES) {
        try { await reader.cancel(); } catch (_) { /* closed */ }
        return null;
      }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
    return JSON.parse(text);
  } catch (_) {
    return null;
  } finally {
    try { reader.releaseLock(); } catch (_) { /* closed */ }
  }
}

function safePath(value) {
  if (typeof value !== 'string') return null;
  const path = value.replace(/^\/+|\/+$/g, '');
  if (!path || path.length > MAX_PATH_LENGTH || !SAFE_PATH.test(path)) return null;
  try {
    if (decodeURIComponent(path).includes('..')) return null;
  } catch (_) {
    return null;
  }
  return path;
}

export async function onRequest({ request, env }) {
  // Only POST writes are meaningful. Answering every other method here means a
  // GET /api/track returns a small 405 instead of falling through to the site's
  // 404 page (which served 86 KB of HTML for an API path).
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', {
      status: 405,
      headers: { Allow: 'POST', 'Cache-Control': 'no-store' }
    });
  }

  // Page-view counting is best-effort analytics. It must never surface on the page
  // as a failed network request (Chrome logs every 4xx/5xx to the console, which
  // costs a Best-Practices point in Lighthouse), so every "the write could not
  // happen" outcome still answers 2xx and reports the failure in the body instead.
  // The only non-2xx left is 400: the caller sent a path we refuse to record.
  const body = await readSmallJson(request);
  const path = body && safePath(body.path);
  if (!path) {
    return Response.json({ ok: false, error: 'Invalid path.' }, { status: 400 });
  }

  const noStore = { headers: { 'Cache-Control': 'no-store' } };

  // No D1 binding yet: skip the write instead of failing the request.
  if (!env.EWT_DB) {
    return Response.json({ ok: false, skipped: 'database not configured' }, noStore);
  }

  try {
    await env.EWT_DB.prepare(`
      INSERT INTO page_views (path, views, updated_at)
      VALUES (?1, 1, CURRENT_TIMESTAMP)
      ON CONFLICT(path) DO UPDATE SET
        views = page_views.views + 1,
        updated_at = CURRENT_TIMESTAMP
    `).bind(path).run();

    return Response.json({ ok: true }, noStore);
  } catch (_) {
    return Response.json({ ok: false, skipped: 'write failed' }, noStore);
  }
}
