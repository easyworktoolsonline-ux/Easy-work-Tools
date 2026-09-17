export async function onRequestPost({ request, env }) {
  try {
    if (!env.EWT_DB) {
      return Response.json({ ok: false, error: "Traffic database is not configured." }, { status: 503 });
    }
    const body = await request.json();
    const path = String(body?.path || "").replace(/^\/+|\/+$/g, "");
    if (!path || path.length > 300 || path.includes("..")) {
      return Response.json({ ok: false }, { status: 400 });
    }

    await env.EWT_DB.prepare(`
      INSERT INTO page_views (path, views, updated_at)
      VALUES (?1, 1, CURRENT_TIMESTAMP)
      ON CONFLICT(path) DO UPDATE SET
        views = page_views.views + 1,
        updated_at = CURRENT_TIMESTAMP
    `).bind(path).run();

    return Response.json({ ok: true }, {
      headers: { "Cache-Control": "no-store" }
    });
  } catch (e) {
    return Response.json({ ok: false }, { status: 500 });
  }
}
