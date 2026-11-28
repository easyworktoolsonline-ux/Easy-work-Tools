/**
 * EasyWorkTools.online — Thumbnail resolver + CORS image proxy
 * Cloudflare Pages Function. Route: /api/thumbnail
 *
 * Two modes:
 *   GET /api/thumbnail?url=<page url>   -> { ok, image, title, platform }
 *   GET /api/thumbnail?img=<image url>  -> the image bytes, with CORS headers
 *
 * Security model:
 *   - HTTPS-only, explicit host allowlists, no userinfo, no ports, no IP literals.
 *   - Every redirect is followed manually and revalidated against the same
 *     allowlist; automatic fetch redirects are never used.
 *   - Page metadata is normalized before use. The final image URL is parsed and
 *     re-emitted from the allowlist, never returned as unvalidated upstream text.
 *   - Upstream bodies are streamed with hard byte limits. One deadline covers
 *     the whole redirect chain and every body read, including slow-drip streams.
 *   - Responses contain generic codes only, never upstream URLs or exceptions.
 */

const PAGE_HOSTS = [
  'youtube.com', 'youtu.be', 'm.youtube.com', 'www.youtube.com',
  'facebook.com', 'fb.watch', 'fb.com', 'm.facebook.com', 'web.facebook.com',
  'instagram.com', 'www.instagram.com',
  'tiktok.com', 'vm.tiktok.com', 'vt.tiktok.com', 'm.tiktok.com', 'www.tiktok.com',
  'pinterest.com', 'pin.it', 'pinterest.co.uk', 'pinterest.ca', 'pinterest.com.au',
  'pinterest.de', 'pinterest.fr', 'www.pinterest.com',
  'vimeo.com', 'player.vimeo.com', 'www.vimeo.com'
];

const IMAGE_HOSTS = [
  'ytimg.com', 'i.ytimg.com', 'ggpht.com', 'googleusercontent.com',
  'fbcdn.net', 'cdninstagram.com',
  'tiktokcdn.com', 'tiktokcdn-us.com', 'ibyteimg.com', 'byteoversea.com',
  'pinimg.com',
  'vimeocdn.com', 'i.vimeocdn.com'
];

/* oEmbed endpoints are constructed, not user supplied; redirects still stay here. */
const OEMBED_HOSTS = ['vimeo.com', 'www.vimeo.com', 'tiktok.com', 'www.tiktok.com'];

const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'
]);

const UA = 'Mozilla/5.0 (compatible; EasyWorkToolsBot/1.0; +https://easyworktools.online/)';
const TIMEOUT_MS = 9000;
const MAX_REDIRECTS = 4;
const MAX_INPUT_URL = 2048;
const MAX_PAGE_BYTES = 900000;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_JSON_BYTES = 256 * 1024;

const CORS = {
  'Access-Control-Allow-Origin': 'https://easyworktools.online',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Vary': 'Origin'
};

class UpstreamSecurityError extends Error {
  constructor(code, status = 502) {
    super(code);
    this.code = code;
    this.status = status;
  }
}

function json(body, status = 200, extra = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex',
      ...CORS,
      ...extra
    }
  });
}

function hostAllowed(hostname, list) {
  const h = String(hostname || '').toLowerCase().replace(/\.$/, '');
  if (!h) return false;
  return list.some(d => h === d || h.endsWith('.' + d));
}

function looksLikeIp(hostname) {
  const h = String(hostname || '').toLowerCase();
  if (!h || h.startsWith('[') || h.includes(':')) return true;
  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(h)) return true;
  if (/^(?:0x[0-9a-f]+|\d+)(?:\.(?:0x[0-9a-f]+|\d+)){3}$/i.test(h)) return true;
  return false;
}

/** Returns a normalized URL object only for exact, HTTPS, allowlisted origins. */
function parseAllowedUrl(raw, list) {
  if (typeof raw !== 'string' || !raw || raw.length > MAX_INPUT_URL) return null;

  const authorityMatch = /^https:\/\/([^/?#]+)/i.exec(raw);
  if (!authorityMatch) return null;
  const authority = authorityMatch[1];
  if (!authority || authority.includes(':') || authority.includes('@') || /\s/.test(authority)) {
    return null;
  }

  let url;
  try { url = new URL(raw); } catch (_) { return null; }
  if (url.protocol !== 'https:' || url.username || url.password || url.port) return null;
  if (looksLikeIp(url.hostname) || !hostAllowed(url.hostname, list)) return null;
  return url;
}

function decodeEntities(value) {
  return String(value || '')
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'")
    .replace(/&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&#x2F;/gi, '/').replace(/\\u0026/g, '&').replace(/\\\//g, '/');
}

/** Single place where untrusted metadata becomes a safe, canonical image URL. */
function normalizeImageUrl(raw) {
  const decoded = decodeEntities(raw);
  const url = parseAllowedUrl(decoded, IMAGE_HOSTS);
  return url ? url.toString() : null;
}

function normalizeTitle(value) {
  const clean = String(value || '')
    .replace(/\r\n?/g, ' ')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return clean ? clean.slice(0, 300) : null;
}

function platformOf(hostname) {
  const h = String(hostname || '').toLowerCase();
  if (h.includes('youtu')) return 'youtube';
  if (h.includes('facebook') || h.includes('fb.')) return 'facebook';
  if (h.includes('instagram')) return 'instagram';
  if (h.includes('tiktok')) return 'tiktok';
  if (h.includes('pin')) return 'pinterest';
  if (h.includes('vimeo')) return 'vimeo';
  return 'unknown';
}

/* One deadline is owned by the caller and stays live through body reads. */
function createDeadline() {
  const controller = new AbortController();
  let rejectFailure;
  const failure = new Promise((_, reject) => { rejectFailure = reject; });
  /* The race loser must not become an unhandled rejection. */
  failure.catch(() => {});
  const timer = setTimeout(() => {
    if (controller.signal.aborted) return;
    controller.abort();
    rejectFailure(new UpstreamSecurityError('fetch-failed', 504));
  }, TIMEOUT_MS);
  return {
    signal: controller.signal,
    failure,
    close() { clearTimeout(timer); }
  };
}

function withinDeadline(promise, deadline) {
  return Promise.race([promise, deadline.failure]);
}

function timedFetch(url, init, deadline) {
  return withinDeadline(fetch(url, { ...init, signal: deadline.signal }), deadline);
}

/** Manual redirects: every hop is validated before another request is made. */
async function fetchValidated(rawUrl, init, allowlist, deadline) {
  let current = parseAllowedUrl(rawUrl, allowlist);
  if (!current) throw new UpstreamSecurityError('initial-url-not-allowed', 400);

  for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
    const response = await timedFetch(current.toString(), { ...init, redirect: 'manual' }, deadline);

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (response.body) {
        try { await withinDeadline(response.body.cancel(), deadline); } catch (_) { /* closed */ }
      }
      if (!location) throw new UpstreamSecurityError('redirect-without-location', 502);

      let next;
      try { next = new URL(location, current); } catch (_) {
        throw new UpstreamSecurityError('redirect-not-allowed', 502);
      }
      next = parseAllowedUrl(next.toString(), allowlist);
      if (!next) throw new UpstreamSecurityError('redirect-not-allowed', 502);
      current = next;
      continue;
    }

    return { response, finalUrl: current };
  }

  throw new UpstreamSecurityError('too-many-redirects', 502);
}

async function readLimitedBytes(source, limit, deadline) {
  const declared = Number(source.headers && source.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > limit) {
    throw new UpstreamSecurityError('response-too-large', 413);
  }

  if (!source.body) {
    const buffer = await withinDeadline(source.arrayBuffer(), deadline);
    if (buffer.byteLength > limit) {
      throw new UpstreamSecurityError('response-too-large', 413);
    }
    return new Uint8Array(buffer);
  }

  const reader = source.body.getReader();
  const chunks = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await withinDeadline(reader.read(), deadline);
      if (done) break;
      const bytes = value && value.byteLength ? value.byteLength : (value ? value.length : 0);
      total += bytes;
      if (total > limit) {
        throw new UpstreamSecurityError('response-too-large', 413);
      }
      chunks.push(value);
    }
  } catch (error) {
    try { await withinDeadline(reader.cancel(), deadline); } catch (_) { /* closed */ }
    throw error;
  } finally {
    try { reader.releaseLock(); } catch (_) { /* closed */ }
  }

  const result = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    const bytes = chunk instanceof Uint8Array ? chunk : new Uint8Array(chunk);
    result.set(bytes, offset);
    offset += bytes.byteLength;
  }
  return result;
}

async function readLimitedText(source, limit, deadline) {
  return new TextDecoder().decode(await readLimitedBytes(source, limit, deadline));
}

async function readLimitedJson(source, limit, deadline) {
  const text = await readLimitedText(source, limit, deadline);
  try { return JSON.parse(text); } catch (_) {
    throw new UpstreamSecurityError('upstream-error', 502);
  }
}

function metaContent(html, prop) {
  const patterns = [
    new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${prop}["']`, 'i')
  ];
  for (const re of patterns) {
    const match = html.match(re);
    if (match) return decodeEntities(match[1]);
  }
  return null;
}

function scrapeImage(html) {
  return metaContent(html, 'og:image:secure_url')
    || metaContent(html, 'og:image')
    || metaContent(html, 'twitter:image:src')
    || metaContent(html, 'twitter:image')
    || (html.match(/"thumbnailUrl"\s*:\s*\[?\s*"([^"]+)"/i) || [])[1]
    || (html.match(/"(?:cover|dynamicCover|originCover)"\s*:\s*"([^"]+)"/i) || [])[1]
    || (html.match(/"display_url"\s*:\s*"([^"]+)"/i) || [])[1]
    || null;
}

function scrapeTitle(html) {
  return metaContent(html, 'og:title')
    || metaContent(html, 'twitter:title')
    || decodeEntities((html.match(/<title[^>]*>([^<]{1,300})<\/title>/i) || [])[1] || '')
    || null;
}

async function viaOEmbed(target, platform, deadline) {
  let endpoint = null;
  if (platform === 'vimeo') {
    endpoint = 'https://vimeo.com/api/oembed.json?width=1920&url=' + encodeURIComponent(target);
  } else if (platform === 'tiktok') {
    endpoint = 'https://www.tiktok.com/oembed?url=' + encodeURIComponent(target);
  }
  if (!endpoint) return null;

  const { response } = await fetchValidated(endpoint, {
    headers: { 'User-Agent': UA, 'Accept': 'application/json' }
  }, OEMBED_HOSTS, deadline);
  if (!response.ok) return { error: 'upstream-error' };

  const data = await readLimitedJson(response, MAX_JSON_BYTES, deadline);
  if (!data || !data.thumbnail_url) return { error: 'no-image' };

  let raw = String(data.thumbnail_url);
  if (platform === 'vimeo') {
    raw = raw.replace(/-d_\d+x\d+$/, '-d_1920x1080').replace(/_\d+x\d+(\.\w+)?$/, '_1920$1');
  }
  const image = normalizeImageUrl(raw);
  if (!image) return { error: 'image-host-not-allowed' };
  return { image, title: normalizeTitle(data.title) };
}

async function viaScrape(target, deadline) {
  const { response } = await fetchValidated(target, {
    headers: {
      'User-Agent': UA,
      'Accept': 'text/html,application/xhtml+xml',
      'Accept-Language': 'en-US,en;q=0.9'
    }
  }, PAGE_HOSTS, deadline);
  if (!response.ok) return { error: 'upstream-error' };

  const html = await readLimitedText(response, MAX_PAGE_BYTES, deadline);
  const rawImage = scrapeImage(html);
  if (!rawImage) {
    return { error: /login|Log in|not available|isn't available/i.test(html) ? 'private' : 'no-image' };
  }
  const image = normalizeImageUrl(rawImage);
  if (!image) return { error: 'image-host-not-allowed' };
  return { image, title: normalizeTitle(scrapeTitle(html)) };
}

function responseMime(value) {
  if (typeof value !== 'string') return null;
  const mime = value.split(';')[0].trim().toLowerCase();
  return ALLOWED_IMAGE_TYPES.has(mime) ? mime : null;
}

function validImageMagic(bytes, mime) {
  const b = bytes;
  if (!b || b.length < 12) return false;
  if (mime === 'image/jpeg') return b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
  if (mime === 'image/png') {
    return b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47
      && b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a;
  }
  if (mime === 'image/gif') {
    return b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46
      && (b[3] === 0x38 || b[3] === 0x39) && b[4] === 0x61;
  }
  if (mime === 'image/webp') {
    return b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46
      && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50;
  }
  if (mime === 'image/avif') {
    return b[4] === 0x66 && b[5] === 0x74 && b[6] === 0x79 && b[7] === 0x70;
  }
  return false;
}

function mappedError(error) {
  if (error instanceof UpstreamSecurityError) {
    return { code: error.code, status: error.status };
  }
  return { code: 'fetch-failed', status: 504 };
}

function resultErrorResponse(code, platform) {
  const status = code === 'private' ? 403
    : code === 'no-image' ? 404
      : code === 'no-oembed' ? 502 : 502;
  return json({ ok: false, error: code, platform }, status);
}

function safeYoutubeId(target) {
  let pathSegment = '';
  const match = target.pathname.match(/\/(?:shorts|embed|live|v)\/([^/?#]+)/i);
  if (match) pathSegment = match[1];
  else if (target.hostname === 'youtu.be') pathSegment = target.pathname.slice(1).split('/')[0];
  try { pathSegment = decodeURIComponent(pathSegment); } catch (_) { /* leave raw */ }

  const candidates = [target.searchParams.get('v'), pathSegment];
  for (const candidate of candidates) {
    const id = String(candidate || '').trim();
    if (/^[A-Za-z0-9_-]{11}$/.test(id)) return id;
  }
  return null;
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function onRequestGet({ request }) {
  const params = new URL(request.url).searchParams;
  const imgParam = params.get('img');
  const pageParam = params.get('url');

  if (imgParam && imgParam.length > MAX_INPUT_URL) {
    return json({ ok: false, error: 'host-not-allowed' }, 400);
  }
  if (pageParam && pageParam.length > MAX_INPUT_URL) {
    return json({ ok: false, error: 'host-not-allowed' }, 400);
  }

  /* ---------------- image proxy ---------------- */
  if (imgParam) {
    const target = parseAllowedUrl(imgParam, IMAGE_HOSTS);
    if (!target) return json({ ok: false, error: 'host-not-allowed' }, 400);

    const deadline = createDeadline();
    try {
      const { response } = await fetchValidated(target.toString(), {
        headers: {
          'User-Agent': UA,
          'Accept': 'image/jpeg,image/png,image/webp,image/gif,image/avif'
        }
      }, IMAGE_HOSTS, deadline);
      if (!response.ok) return json({ ok: false, error: 'upstream-error' }, 502);

      const mime = responseMime(response.headers.get('content-type'));
      if (!mime) return json({ ok: false, error: 'not-an-image' }, 415);

      const bytes = await readLimitedBytes(response, MAX_IMAGE_BYTES, deadline);
      if (!validImageMagic(bytes, mime)) {
        return json({ ok: false, error: 'not-an-image' }, 415);
      }

      return new Response(bytes, {
        status: 200,
        headers: {
          ...CORS,
          'Content-Type': mime,
          'Cache-Control': 'public, max-age=3600',
          'Cross-Origin-Resource-Policy': 'cross-origin',
          'X-Content-Type-Options': 'nosniff'
        }
      });
    } catch (error) {
      const mapped = mappedError(error);
      return json({ ok: false, error: mapped.code }, mapped.status);
    } finally {
      deadline.close();
    }
  }

  /* ---------------- page resolver ---------------- */
  if (!pageParam) return json({ ok: false, error: 'missing-url' }, 400);

  const target = parseAllowedUrl(pageParam, PAGE_HOSTS);
  if (!target) return json({ ok: false, error: 'host-not-allowed' }, 400);

  const platform = platformOf(target.hostname);

  // YouTube is resolved on the client from predictable image URLs.
  if (platform === 'youtube') {
    const id = safeYoutubeId(target);
    if (!id) return json({ ok: false, error: 'no-image', platform }, 404);
    const image = normalizeImageUrl('https://i.ytimg.com/vi/' + id + '/maxresdefault.jpg');
    if (!image) return json({ ok: false, error: 'image-host-not-allowed', platform }, 502);
    return json({
      ok: true, platform, title: 'YouTube video ' + id, image
    }, 200, { 'Cache-Control': 'public, max-age=1800' });
  }

  const deadline = createDeadline();
  try {
    let result = await viaOEmbed(target.toString(), platform, deadline);
    if (!result || result.error === 'upstream-error' || result.error === 'no-image') {
      result = await viaScrape(target.toString(), deadline);
    }

    if (result && result.error) return resultErrorResponse(result.error, platform);

    // Root-cause fix: the final image is parsed and re-emitted, not returned raw.
    const image = normalizeImageUrl(result && result.image);
    if (!image) {
      return json({ ok: false, error: 'image-host-not-allowed', platform }, 502);
    }
    return json({
      ok: true,
      platform,
      image,
      title: normalizeTitle(result && result.title)
    }, 200, { 'Cache-Control': 'public, max-age=1800' });
  } catch (error) {
    const mapped = mappedError(error);
    return json({ ok: false, error: mapped.code, platform }, mapped.status);
  } finally {
    deadline.close();
  }
}

export {
  parseAllowedUrl,
  normalizeImageUrl,
  responseMime,
  validImageMagic,
  PAGE_HOSTS,
  IMAGE_HOSTS,
  TIMEOUT_MS
};
