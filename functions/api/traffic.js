export async function onRequestGet({ env }) {
  try {
    if (!env.EWT_DB) {
      return Response.json({ counts: {} }, {
        headers: { "Cache-Control": "no-store" }
      });
    }

    const result = await env.EWT_DB.prepare(
      "SELECT path, views FROM page_views ORDER BY views DESC"
    ).all();

    const counts = {};
    for (const row of (result.results || [])) {
      counts[String(row.path)] = Number(row.views) || 0;
    }

    return Response.json({ counts }, {
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "application/json; charset=UTF-8"
      }
    });
  } catch (e) {
    return Response.json({ counts: {} }, {
      headers: { "Cache-Control": "no-store" }
    });
  }
}
