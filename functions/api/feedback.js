/**
 * EasyWorkTools.online — same-origin feedback proxy.
 *
 * The browser never talks to Apps Script directly. This function is the only
 * public entry point:
 *   - exact-origin CORS (no wildcard)
 *   - strict JSON validation and request-size limits
 *   - server-side Cloudflare Turnstile verification
 *   - per-IP and global sliding-window rate limiting
 *   - secrets read only from Cloudflare Pages environment bindings
 *   - generic public error codes; upstream details and secrets are never returned
 *
 * Required Cloudflare Pages secrets:
 *   TURNSTILE_SECRET       - Turnstile secret key (server-side only)
 *   APPS_SCRIPT_WEBAPP_URL - deployed Apps Script /exec URL
 *   FEEDBACK_PROXY_TOKEN   - high-entropy token shared with Apps Script
 */

const ALLOWED_ORIGINS = new Set(['https://easyworktools.online']);
const ALLOWED_FIELDS = new Set([
  'requestType', 'toolName', 'email', 'details', 'turnstileToken'
]);
const REQUEST_TYPES = new Set([
  'Report a Tool Issue', 'Suggest a New Tool', 'Help'
]);

const MAX_BODY_BYTES = 16 * 1024;
const MAX_UPSTREAM_BYTES = 16 * 1024;
const MAX_FIELD = 200;
const MAX_EMAIL = 254;
const MAX_DETAILS = 5000;
const MAX_TOKEN = 4096;

const RATE_WINDOW_MS = 10 * 60 * 1000;
const IP_LIMIT = 5;
const GLOBAL_LIMIT = 60;
const MAX_TRACKED_IPS = 2000;

const DELIVERY_TIMEOUT_MS = 10000;
const MAX_DELIVERY_REDIRECTS = 3;

const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const TURNSTILE_HOSTNAME = 'easyworktools.online';

const ipHits = new Map();
let globalHits = [];

class HttpFailure extends Error {
  constructor(code, status) {
    super(code);
    this.code = code;
    this.status = status;
  }
}

function cleanOrigin(value) {
  if (typeof value !== 'string') return null;
  const origin = value.trim().replace(/\/+$/, '');
  return origin && ALLOWED_ORIGINS.has(origin) ? origin : null;
}

function baseHeaders(origin, extra = {}) {
  const headers = {
    'Cache-Control': 'no-store',
    'X-Robots-Tag': 'noindex',
    'Vary': 'Origin',
    ...extra
  };
  if (origin) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS';
    headers['Access-Control-Allow-Headers'] = 'Content-Type';
    headers['Access-Control-Max-Age'] = '600';
  }
  return headers;
}

function reply(body, status, origin, extra = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...baseHeaders(origin, extra)
    }
  });
}

function fail(code, status, origin, extra = {}) {
  return reply({ ok: false, error: code }, status, origin, extra);
}

function normalize(value) {
  return String(value)
    .replace(/\r\n?/g, '\n')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim();
}

function field(value, max, required) {
  if (typeof value !== 'string') return null;
  if (value.length > max) return null;
  const result = normalize(value);
  if (required && !result) return null;
  return result;
}

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

async function readLimitedBytes(source, limit) {
  const declared = Number(source.headers && source.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > limit) {
    throw new HttpFailure('VALIDATION_ERROR', 413);
  }

  if (!source.body) {
    const buffer = await source.arrayBuffer();
    if (buffer.byteLength > limit) throw new HttpFailure('VALIDATION_ERROR', 413);
    return new Uint8Array(buffer);
  }

  const reader = source.body.getReader();
  const decoder = new TextDecoder();
  let total = 0;
  let text = '';

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      const bytes = value && value.byteLength ? value.byteLength : (value ? value.length : 0);
      total += bytes;
      if (total > limit) {
        try { await reader.cancel(); } catch (_) { /* already closed */ }
        throw new HttpFailure('VALIDATION_ERROR', 413);
      }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
  } finally {
    try { reader.releaseLock(); } catch (_) { /* stream already closed */ }
  }

  return new TextEncoder().encode(text);
}

async function readLimitedJson(source, limit) {
  const bytes = await readLimitedBytes(source, limit);
  const text = new TextDecoder().decode(bytes);
  if (!text.trim()) throw new HttpFailure('VALIDATION_ERROR', 400);
  try {
    return JSON.parse(text);
  } catch (_) {
    throw new HttpFailure('VALIDATION_ERROR', 400);
  }
}

function clientIp(request) {
  const cfIp = request.headers.get('cf-connecting-ip');
  if (cfIp) return cfIp.trim().slice(0, 64) || 'unknown';
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim().slice(0, 64) || 'unknown';
  return 'unknown';
}

function pruneIpMap(now) {
  if (ipHits.size <= MAX_TRACKED_IPS) return;
  for (const [key, hits] of ipHits) {
    const recent = hits.filter(t => now - t < RATE_WINDOW_MS);
    if (recent.length) ipHits.set(key, recent);
    else ipHits.delete(key);
  }
}

function consume(hits, limit, now) {
  const recent = hits.filter(t => now - t < RATE_WINDOW_MS);
  if (recent.length >= limit) {
    const retryAfter = Math.max(1, Math.ceil((recent[0] + RATE_WINDOW_MS - now) / 1000));
    return { allowed: false, retryAfter };
  }
  recent.push(now);
  return { allowed: true, hits: recent };
}

function rateLimit(ip) {
  const now = Date.now();
  const ipResult = consume(ipHits.get(ip) || [], IP_LIMIT, now);
  if (!ipResult.allowed) return ipResult;
  const globalResult = consume(globalHits, GLOBAL_LIMIT, now);
  if (!globalResult.allowed) return globalResult;

  ipHits.set(ip, ipResult.hits);
  globalHits = globalResult.hits;
  pruneIpMap(now);
  return { allowed: true };
}

async function verifyTurnstile(secret, token, ip) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  const body = new URLSearchParams({ secret, response: token });
  if (ip && ip !== 'unknown') body.set('remoteip', ip);

  try {
    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: body.toString(),
      signal: controller.signal
    });
    if (!response.ok) return false;
    const data = await readLimitedJson(response, 4096);
    if (!data || data.success !== true) return false;
    if (data.hostname && data.hostname !== TURNSTILE_HOSTNAME) return false;
    return true;
  } catch (_) {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

function allowedAppsScriptUrl(value) {
  if (typeof value !== 'string' || value.length > 2048) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:'
      && url.hostname === 'script.google.com'
      && !url.username
      && !url.password
      && !url.port
      && !url.search
      && !url.hash
      && /^\/macros\/s\/[^/]+\/exec$/.test(url.pathname);
  } catch (_) {
    return false;
  }
}

/** Only Google's script host and its one-time echo endpoint may receive a redirect. */
function allowedDeliveryRedirect(value) {
  if (typeof value !== 'string' || value.length > 2048) return false;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password || url.port || url.hash) {
      return false;
    }
    if (url.hostname === 'script.googleusercontent.com') {
      return url.pathname === '/macros/echo';
    }
    if (url.hostname === 'script.google.com') {
      return !url.search && /^\/macros\/s\/[^/]+\/exec$/.test(url.pathname);
    }
    return false;
  } catch (_) {
    return false;
  }
}

async function deliver(payload, env) {
  const token = env.FEEDBACK_PROXY_TOKEN;
  const target = env.APPS_SCRIPT_WEBAPP_URL;
  if (!token || typeof token !== 'string' || !allowedAppsScriptUrl(target)) {
    return { code: 'SERVICE_UNAVAILABLE', status: 503 };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DELIVERY_TIMEOUT_MS);
  const body = JSON.stringify({
    proxyToken: token,
    source: 'easyworktools.online',
    requestType: payload.requestType,
    toolName: payload.toolName,
    email: payload.email,
    details: payload.details
  });
  let current = target;
  let method = 'POST';

  try {
    for (let redirects = 0; redirects <= MAX_DELIVERY_REDIRECTS; redirects += 1) {
      const init = {
        method,
        headers: method === 'POST'
          ? { 'Content-Type': 'application/json', 'Accept': 'application/json' }
          : { 'Accept': 'application/json' },
        signal: controller.signal,
        redirect: 'manual'
      };
      if (method === 'POST') init.body = body;

      const response = await fetch(current, init);

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location');
        try { if (response.body) await response.body.cancel(); } catch (_) { /* closed */ }
        if (!location || redirects === MAX_DELIVERY_REDIRECTS) {
          return { code: 'SERVICE_UNAVAILABLE', status: 503 };
        }

        let next;
        try { next = new URL(location, current); } catch (_) {
          return { code: 'SERVICE_UNAVAILABLE', status: 503 };
        }
        if (!allowedDeliveryRedirect(next.toString())) {
          return { code: 'SERVICE_UNAVAILABLE', status: 503 };
        }
        current = next.toString();
        /* 302/303 semantics: the redirected request is a GET, with no token body. */
        method = 'GET';
        continue;
      }

      if (!response.ok) return { code: 'SERVICE_UNAVAILABLE', status: 503 };
      const data = await readLimitedJson(response, MAX_UPSTREAM_BYTES);
      if (data && data.result === 'success') return { ok: true };
      if (data && data.code === 'VALIDATION_ERROR') {
        return { code: 'VALIDATION_ERROR', status: 400 };
      }
      return { code: 'DELIVERY_FAILED', status: 502 };
    }
    return { code: 'SERVICE_UNAVAILABLE', status: 503 };
  } catch (_) {
    return { code: 'SERVICE_UNAVAILABLE', status: 503 };
  } finally {
    clearTimeout(timer);
  }
}

export async function onRequestOptions({ request }) {
  const origin = cleanOrigin(request.headers.get('origin'));
  if (!origin) return fail('SERVICE_UNAVAILABLE', 403, null);
  return new Response(null, {
    status: 204,
    headers: baseHeaders(origin, { 'Access-Control-Max-Age': '600' })
  });
}

export async function onRequestPost({ request, env }) {
  const origin = cleanOrigin(request.headers.get('origin'));
  if (!origin) return fail('SERVICE_UNAVAILABLE', 403, null);

  try {
    const raw = await readLimitedJson(request, MAX_BODY_BYTES);
    if (!raw || Array.isArray(raw) || typeof raw !== 'object') {
      throw new HttpFailure('VALIDATION_ERROR', 400);
    }
    for (const key of Object.keys(raw)) {
      if (!ALLOWED_FIELDS.has(key)) throw new HttpFailure('VALIDATION_ERROR', 400);
    }

    const requestType = field(raw.requestType, MAX_FIELD, true);
    if (!requestType || !REQUEST_TYPES.has(requestType)) {
      throw new HttpFailure('VALIDATION_ERROR', 400);
    }

    const toolName = field(raw.toolName === undefined ? '' : raw.toolName, MAX_FIELD, false);
    const email = field(raw.email === undefined ? '' : raw.email, MAX_EMAIL, false);
    const details = field(raw.details, MAX_DETAILS, true);
    if (toolName === null || email === null || !details || details.length < 10) {
      throw new HttpFailure('VALIDATION_ERROR', 400);
    }
    if (email && !validEmail(email)) throw new HttpFailure('VALIDATION_ERROR', 400);

    const turnstileToken = field(raw.turnstileToken, MAX_TOKEN, false);
    if (!env.TURNSTILE_SECRET || typeof env.TURNSTILE_SECRET !== 'string') {
      return fail('CAPTCHA_FAILED', 503, origin);
    }
    if (!turnstileToken) return fail('CAPTCHA_FAILED', 403, origin);

    const limited = rateLimit(clientIp(request));
    if (!limited.allowed) {
      return fail('RATE_LIMITED', 429, origin, { 'Retry-After': String(limited.retryAfter) });
    }

    const captchaOk = await verifyTurnstile(
      env.TURNSTILE_SECRET,
      turnstileToken,
      clientIp(request)
    );
    if (!captchaOk) return fail('CAPTCHA_FAILED', 403, origin);

    const delivered = await deliver({
      requestType, toolName, email, details
    }, env || {});
    if (delivered.ok) return reply({ ok: true }, 200, origin);
    return fail(delivered.code, delivered.status, origin);
  } catch (error) {
    if (error instanceof HttpFailure) {
      return fail(error.code, error.status, origin);
    }
    return fail('SERVICE_UNAVAILABLE', 503, origin);
  }
}

/* Test-only helper: keeps unit tests isolated without exposing secrets. */
export function resetFeedbackStateForTests() {
  ipHits.clear();
  globalHits = [];
}
