/**
 * EasyWorkTools.online — Thumbnail resolver + CORS image proxy
 * Cloudflare Pages Function. Route: /api/thumbnail
 *
 * Two modes:
 *   GET /api/thumbnail?url=<page url>   -> { ok, image, title, platform }
 *   GET /api/thumbnail?img=<image url>  -> the image bytes, with CORS headers
 *
 * Only public preview images (og:image / oEmbed) are read. Nothing is stored.
 * Both modes are host-restricted so this cannot be used as an open proxy.
 */

const PAGE_HOSTS = [
  "youtube.com", "youtu.be", "m.youtube.com",
  "facebook.com", "fb.watch", "fb.com", "m.facebook.com", "web.facebook.com",
  "instagram.com", "www.instagram.com",
  "tiktok.com", "vm.tiktok.com", "vt.tiktok.com", "m.tiktok.com",
  "pinterest.com", "pin.it", "pinterest.co.uk", "pinterest.ca", "pinterest.com.au", "pinterest.de", "pinterest.fr",
  "vimeo.com", "player.vimeo.com"
];

const IMAGE_HOSTS = [
  "ytimg.com", "ggpht.com", "googleusercontent.com",
  "fbcdn.net", "cdninstagram.com",
  "tiktokcdn.com", "tiktokcdn-us.com", "ibyteimg.com", "byteoversea.com",
  "pinimg.com",
  "vimeocdn.com", "i.vimeocdn.com"
];

const UA = "Mozilla/5.0 (compatible; EasyWorkToolsBot/1.0; +https://easyworktools.online/)";
const TIMEOUT_MS = 9000;

/* Matches the site's existing /api/* policy in _headers (single trusted origin,
   not a wildcard) so this route doesn't introduce a second, conflicting CORS rule. */
const CORS = {
  "Access-Control-Allow-Origin": "https://easyworktools.online",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Vary": "Origin"
};

function json(body, status = 200, extra = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...CORS, ...extra }
  });
}

function hostAllowed(hostname, list) {
  const h = hostname.toLowerCase().replace(/^www\./, "");
  return list.some(d => h === d || h.endsWith("." + d));
}

function parseUrl(raw, list) {
  let u;
  try { u = new URL(raw); } catch { return null; }
  if (u.protocol !== "https:" && u.protocol !== "http:") return null;
  if (!hostAllowed(u.hostname, list)) return null;
  return u;
}

function platformOf(hostname) {
  const h = hostname.toLowerCase();
  if (h.includes("youtu")) return "youtube";
  if (h.includes("facebook") || h.includes("fb.")) return "facebook";
  if (h.includes("instagram")) return "instagram";
  if (h.includes("tiktok")) return "tiktok";
  if (h.includes("pin")) return "pinterest";
  if (h.includes("vimeo")) return "vimeo";
  return "unknown";
}

async function timedFetch(url, init = {}) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal, redirect: "follow" });
  } finally {
    clearTimeout(t);
  }
}

function decodeEntities(s) {
  return String(s || "")
    .replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#0?39;/g, "'")
    .replace(/&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&#x2F;/gi, "/").replace(/\\u0026/g, "&").replace(/\\\//g, "/");
}

function metaContent(html, prop) {
  const patterns = [
    new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${prop}["']`, "i")
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m) return decodeEntities(m[1]);
  }
  return null;
}

function scrapeImage(html) {
  return metaContent(html, "og:image:secure_url")
      || metaContent(html, "og:image")
      || metaContent(html, "twitter:image:src")
      || metaContent(html, "twitter:image")
      || (html.match(/"thumbnailUrl"\s*:\s*\[?\s*"([^"]+)"/i) || [])[1]
      || (html.match(/"(?:cover|dynamicCover|originCover)"\s*:\s*"([^"]+)"/i) || [])[1]
      || (html.match(/"display_url"\s*:\s*"([^"]+)"/i) || [])[1]
      || null;
}

function scrapeTitle(html) {
  return metaContent(html, "og:title")
      || metaContent(html, "twitter:title")
      || decodeEntities((html.match(/<title[^>]*>([^<]{1,300})<\/title>/i) || [])[1] || "")
      || null;
}

/* ---- oEmbed endpoints that answer without an API key ---- */
async function viaOEmbed(target, platform) {
  let endpoint = null;
  if (platform === "vimeo") {
    endpoint = "https://vimeo.com/api/oembed.json?width=1920&url=" + encodeURIComponent(target);
  } else if (platform === "tiktok") {
    endpoint = "https://www.tiktok.com/oembed?url=" + encodeURIComponent(target);
  }
  if (!endpoint) return null;

  try {
    const r = await timedFetch(endpoint, { headers: { "User-Agent": UA, "Accept": "application/json" } });
    if (!r.ok) return null;
    const data = await r.json();
    if (!data || !data.thumbnail_url) return null;
    let image = data.thumbnail_url;
    // Vimeo encodes the crop in the filename; ask for the widest stored version.
    if (platform === "vimeo") image = image.replace(/-d_\d+x\d+$/, "-d_1920x1080").replace(/_\d+x\d+(\.\w+)?$/, "_1920$1");
    return { image, title: data.title || null };
  } catch {
    return null;
  }
}

async function viaScrape(target) {
  const r = await timedFetch(target, {
    headers: {
      "User-Agent": UA,
      "Accept": "text/html,application/xhtml+xml",
      "Accept-Language": "en-US,en;q=0.9"
    },
    cf: { cacheTtl: 900, cacheEverything: true }
  });
  if (!r.ok) return { error: "http-" + r.status };
  const html = (await r.text()).slice(0, 900000);
  const image = scrapeImage(html);
  if (!image) {
    return { error: /login|Log in|not available|isn't available/i.test(html) ? "private" : "no-image" };
  }
  return { image: decodeEntities(image), title: scrapeTitle(html) };
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function onRequestGet({ request }) {
  const params = new URL(request.url).searchParams;
  const imgParam = params.get("img");
  const pageParam = params.get("url");

  /* ---------------- image proxy ---------------- */
  if (imgParam) {
    const target = parseUrl(imgParam, IMAGE_HOSTS);
    if (!target) return json({ ok: false, error: "host-not-allowed" }, 400);
    try {
      const upstream = await timedFetch(target.toString(), {
        headers: { "User-Agent": UA, "Accept": "image/*" },
        cf: { cacheTtl: 3600, cacheEverything: true }
      });
      if (!upstream.ok) return json({ ok: false, error: "http-" + upstream.status }, 502);
      const type = upstream.headers.get("content-type") || "image/jpeg";
      if (!type.startsWith("image/")) return json({ ok: false, error: "not-an-image" }, 415);
      return new Response(upstream.body, {
        status: 200,
        headers: {
          ...CORS,
          "Content-Type": type,
          "Cache-Control": "public, max-age=3600",
          "Cross-Origin-Resource-Policy": "cross-origin",
          "X-Content-Type-Options": "nosniff"
        }
      });
    } catch {
      return json({ ok: false, error: "fetch-failed" }, 504);
    }
  }

  /* ---------------- page resolver ---------------- */
  if (!pageParam) return json({ ok: false, error: "missing-url" }, 400);

  const target = parseUrl(pageParam, PAGE_HOSTS);
  if (!target) return json({ ok: false, error: "host-not-allowed" }, 400);

  const platform = platformOf(target.hostname);

  // YouTube is resolved on the client from predictable image URLs.
  if (platform === "youtube") {
    const id = (target.searchParams.get("v")
      || (target.pathname.match(/\/(?:shorts|embed|live|v)\/([A-Za-z0-9_-]{6,20})/) || [])[1]
      || target.pathname.replace(/^\//, "").split("/")[0] || "").trim();
    if (!id) return json({ ok: false, error: "no-image" }, 404);
    return json({
      ok: true, platform, title: "YouTube video " + id,
      image: `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`
    }, 200, { "Cache-Control": "public, max-age=1800" });
  }

  try {
    let result = await viaOEmbed(target.toString(), platform);
    if (!result) result = await viaScrape(target.toString());
    if (result.error) {
      const code = result.error === "private" ? 403 : result.error === "no-image" ? 404 : 502;
      return json({ ok: false, error: result.error, platform }, code);
    }
    const image = parseUrl(result.image, IMAGE_HOSTS) ? result.image : result.image;
    return json(
      { ok: true, platform, image, title: result.title || null },
      200,
      { "Cache-Control": "public, max-age=1800" }
    );
  } catch {
    return json({ ok: false, error: "fetch-failed", platform }, 504);
  }
}
