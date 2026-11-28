import assert from 'node:assert/strict';
import test, { mock } from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath, pathToFileURL } from 'node:url';

import {
  onRequestPost,
  onRequestOptions,
  resetFeedbackStateForTests
} from '../functions/api/feedback.js';
import {
  onRequestGet as thumbnailGet,
  parseAllowedUrl,
  normalizeImageUrl,
  responseMime,
  validImageMagic,
  TIMEOUT_MS
} from '../functions/api/thumbnail.js';
import { onRequest as middleware } from '../functions/_middleware.js';
import { onRequest as reportsIndex } from '../functions/reports/index.js';
import { onRequest as track } from '../functions/api/track.js';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ORIGIN = 'https://easyworktools.online';
const ENV = {
  TURNSTILE_SECRET: 'synthetic-turnstile-secret',
  APPS_SCRIPT_WEBAPP_URL: 'https://script.google.com/macros/s/SYNTHETIC_ID/exec',
  FEEDBACK_PROXY_TOKEN: 'synthetic-proxy-token'
};

function read(relative) {
  return fs.readFileSync(path.join(REPO, relative), 'utf8');
}

function useFetch(implementation) {
  const original = globalThis.fetch;
  globalThis.fetch = implementation;
  return () => { globalThis.fetch = original; };
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

function feedbackRequest(payload, origin = ORIGIN, extraHeaders = {}) {
  const body = typeof payload === 'string' ? payload : JSON.stringify(payload);
  return new Request(`${ORIGIN}/api/feedback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: origin,
      ...extraHeaders
    },
    body
  });
}

function validFeedback() {
  return {
    requestType: 'Help',
    toolName: 'Age Calculator',
    email: 'visitor@example.test',
    details: 'This is a synthetic test message with enough detail.',
    turnstileToken: 'synthetic-token'
  };
}

function successFetch(counters = {}) {
  return async (url) => {
    const value = String(url);
    if (value.includes('siteverify')) {
      counters.verify = (counters.verify || 0) + 1;
      return jsonResponse({ success: true, hostname: 'easyworktools.online' });
    }
    if (value.includes('script.google.com')) {
      counters.deliver = (counters.deliver || 0) + 1;
      return jsonResponse({ result: 'success', code: 'DELIVERED' });
    }
    throw new Error(`unexpected fetch: ${value}`);
  };
}

/* ------------------------------------------------------------------ feedback */

test('feedback: success requires an explicit ok:true and exact-origin CORS', async () => {
  resetFeedbackStateForTests();
  const counters = {};
  const restore = useFetch(successFetch(counters));
  try {
    const response = await onRequestPost({
      request: feedbackRequest(validFeedback()),
      env: ENV
    });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { ok: true });
    assert.equal(response.headers.get('access-control-allow-origin'), ORIGIN);
    assert.notEqual(response.headers.get('access-control-allow-origin'), '*');
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.equal(counters.verify, 1);
    assert.equal(counters.deliver, 1);
  } finally {
    restore();
  }
});

test('feedback: OPTIONS is restricted to the exact production origin', async () => {
  const allowed = await onRequestOptions({
    request: new Request(`${ORIGIN}/api/feedback`, {
      method: 'OPTIONS',
      headers: { Origin: ORIGIN }
    })
  });
  assert.equal(allowed.status, 204);
  assert.equal(allowed.headers.get('access-control-allow-origin'), ORIGIN);

  const denied = await onRequestOptions({
    request: new Request(`${ORIGIN}/api/feedback`, {
      method: 'OPTIONS',
      headers: { Origin: 'https://evil.example' }
    })
  });
  assert.equal(denied.status, 403);
  assert.equal(denied.headers.get('access-control-allow-origin'), null);
});

test('feedback: POST from another origin is rejected without CORS', async () => {
  resetFeedbackStateForTests();
  const response = await onRequestPost({
    request: feedbackRequest(validFeedback(), 'https://evil.example'),
    env: ENV
  });
  assert.equal(response.status, 403);
  assert.equal(response.headers.get('access-control-allow-origin'), null);
});

test('feedback: missing or invalid Turnstile secret fails closed', async () => {
  resetFeedbackStateForTests();
  let fetched = false;
  const restore = useFetch(async (url) => {
    fetched = true;
    const value = String(url);
    if (value.includes('siteverify')) return jsonResponse({ success: false });
    if (value.includes('script.google.com')) return jsonResponse({ result: 'success' });
    throw new Error('unexpected fetch');
  });
  try {
    const noSecret = await onRequestPost({ request: feedbackRequest(validFeedback()), env: {} });
    assert.equal(noSecret.status, 503);
    assert.deepEqual(await noSecret.json(), { ok: false, error: 'CAPTCHA_FAILED' });
    assert.equal(fetched, false);

    const badToken = await onRequestPost({
      request: feedbackRequest({ ...validFeedback(), turnstileToken: 'bad' }),
      env: ENV
    });
    assert.equal(badToken.status, 403);
    assert.deepEqual(await badToken.json(), { ok: false, error: 'CAPTCHA_FAILED' });
  } finally {
    restore();
  }
});

test('feedback: upstream error is mapped to a generic public code', async () => {
  resetFeedbackStateForTests();
  const restore = useFetch(async (url) => {
    const value = String(url);
    if (value.includes('siteverify')) return jsonResponse({ success: true });
    if (value.includes('script.google.com')) {
      return jsonResponse({ result: 'error', message: 'internal-recipient@example.test' }, 500);
    }
    throw new Error('unexpected fetch');
  });
  try {
    const response = await onRequestPost({ request: feedbackRequest(validFeedback()), env: ENV });
    assert.equal(response.status, 503);
    const body = await response.json();
    assert.deepEqual(body, { ok: false, error: 'SERVICE_UNAVAILABLE' });
    assert.ok(!JSON.stringify(body).includes('recipient'));
  } finally {
    restore();
  }
});

test('feedback: Apps Script 302 is followed as GET to the one-time echo URL', async () => {
  resetFeedbackStateForTests();
  const calls = [];
  const restore = useFetch(async (url, init) => {
    const value = String(url);
    if (value.includes('siteverify')) {
      return jsonResponse({ success: true, hostname: 'easyworktools.online' });
    }
    if (value.includes('script.google.com')) {
      calls.push({ echo: false, method: init.method, hasBody: Boolean(init.body) });
      return new Response(null, {
        status: 302,
        headers: { Location: 'https://script.googleusercontent.com/macros/echo?u=synthetic&h=synthetic' }
      });
    }
    if (value.includes('script.googleusercontent.com')) {
      calls.push({ echo: true, method: init.method, hasBody: Boolean(init.body) });
      return jsonResponse({ result: 'success', code: 'DELIVERED' });
    }
    throw new Error('unexpected fetch');
  });
  try {
    const response = await onRequestPost({
      request: feedbackRequest(validFeedback()),
      env: ENV
    });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { ok: true });
    assert.equal(calls.length, 2);
    assert.deepEqual(calls[0], { echo: false, method: 'POST', hasBody: true });
    assert.deepEqual(calls[1], { echo: true, method: 'GET', hasBody: false });
  } finally {
    restore();
  }
});

test('feedback: a redirect to a non-Google host is rejected without fetching it', async () => {
  resetFeedbackStateForTests();
  let fetches = 0;
  const restore = useFetch(async (url) => {
    const value = String(url);
    if (value.includes('siteverify')) return jsonResponse({ success: true });
    if (value.includes('script.google.com')) {
      fetches += 1;
      /* Protocol-relative Location also checks that relative targets are resolved. */
      return new Response(null, { status: 302, headers: { Location: '//evil.example/capture' } });
    }
    fetches += 1;
    throw new Error('a disallowed redirect target was fetched');
  });
  try {
    const response = await onRequestPost({
      request: feedbackRequest(validFeedback()),
      env: ENV
    });
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), { ok: false, error: 'SERVICE_UNAVAILABLE' });
    assert.equal(fetches, 1);
  } finally {
    restore();
  }
});

test('feedback: per-IP rate limit returns 429 with Retry-After', async () => {
  resetFeedbackStateForTests();
  const restore = useFetch(successFetch());
  try {
    for (let i = 0; i < 5; i += 1) {
      const ok = await onRequestPost({
        request: feedbackRequest(validFeedback(), ORIGIN, { 'cf-connecting-ip': '192.0.2.10' }),
        env: ENV
      });
      assert.equal(ok.status, 200);
    }
    const limited = await onRequestPost({
      request: feedbackRequest(validFeedback(), ORIGIN, { 'cf-connecting-ip': '192.0.2.10' }),
      env: ENV
    });
    assert.equal(limited.status, 429);
    assert.deepEqual(await limited.json(), { ok: false, error: 'RATE_LIMITED' });
    assert.ok(Number(limited.headers.get('retry-after')) > 0);
  } finally {
    restore();
  }
});

test('feedback: oversized and invalid bodies are rejected', async () => {
  resetFeedbackStateForTests();
  const oversized = await onRequestPost({
    request: feedbackRequest({ details: 'x'.repeat(20000) }),
    env: ENV
  });
  assert.equal(oversized.status, 413);

  const invalid = await onRequestPost({
    request: feedbackRequest('{not json'),
    env: ENV
  });
  assert.equal(invalid.status, 400);
  assert.deepEqual(await invalid.json(), { ok: false, error: 'VALIDATION_ERROR' });
});

/* ---------------------------------------------------------------- apps script */

const CODE_GS = read('apps-script/Code.gs');

function gasContext(properties, sent) {
  const ctx = vm.createContext({
    PropertiesService: {
      getScriptProperties: () => ({
        getProperty: (name) => (Object.prototype.hasOwnProperty.call(properties, name)
          ? properties[name] : null)
      })
    },
    MailApp: {
      sendEmail: (message) => { sent.push(message); }
    },
    UrlFetchApp: {
      fetch: () => { throw new Error('Apps Script must not re-verify Turnstile'); }
    },
    ContentService: {
      MimeType: { JSON: 'application/json' },
      createTextOutput: (value) => ({ setMimeType: () => value })
    },
    console: { error: () => {} }
  });
  vm.runInContext(CODE_GS, ctx, { filename: 'Code.gs' });
  return ctx;
}

function callDoPost(ctx, payload) {
  const contents = JSON.stringify(payload);
  ctx.__event = { postData: { contents, length: contents.length } };
  return JSON.parse(vm.runInContext('doPost(__event)', ctx));
}

const GAS_PROPS = {
  FEEDBACK_PROXY_TOKEN: 'synthetic-proxy-token',
  FEEDBACK_RECIPIENT_EMAIL: 'synthetic-recipient@example.test'
};

test('apps script: rejects wrong/missing proxy token and missing recipient', () => {
  const sent = [];
  const ctx = gasContext(GAS_PROPS, sent);
  const base = validFeedback();

  assert.deepEqual(callDoPost(ctx, { ...base }), { result: 'error', code: 'PROXY_AUTH_FAILED' });
  assert.deepEqual(callDoPost(ctx, { ...base, proxyToken: 'wrong' }), {
    result: 'error', code: 'PROXY_AUTH_FAILED'
  });
  assert.equal(sent.length, 0);

  const noRecipient = gasContext({ FEEDBACK_PROXY_TOKEN: GAS_PROPS.FEEDBACK_PROXY_TOKEN }, []);
  assert.deepEqual(callDoPost(noRecipient, { ...base, proxyToken: GAS_PROPS.FEEDBACK_PROXY_TOKEN }), {
    result: 'error', code: 'SERVICE_UNAVAILABLE'
  });
});

test('apps script: valid proxy request delivers with sanitized fields', () => {
  const sent = [];
  const ctx = gasContext(GAS_PROPS, sent);
  const response = callDoPost(ctx, {
    ...validFeedback(),
    proxyToken: GAS_PROPS.FEEDBACK_PROXY_TOKEN,
    toolName: 'Alpha\r\nBcc: injected@example.test',
    details: 'Line one.\nLine two is still detailed enough.'
  });

  assert.deepEqual(response, { result: 'success', code: 'DELIVERED' });
  assert.equal(sent.length, 1);
  assert.equal(sent[0].to, GAS_PROPS.FEEDBACK_RECIPIENT_EMAIL);
  assert.ok(sent[0].body.includes('Tool: AlphaBcc: injected@example.test'));
  assert.ok(sent[0].body.includes('Line one.\nLine two'));
  assert.ok(!JSON.stringify(response).includes(GAS_PROPS.FEEDBACK_RECIPIENT_EMAIL));
});

test('apps script: invalid details are rejected before delivery', () => {
  const sent = [];
  const ctx = gasContext(GAS_PROPS, sent);
  const response = callDoPost(ctx, {
    ...validFeedback(),
    proxyToken: GAS_PROPS.FEEDBACK_PROXY_TOKEN,
    details: 'short'
  });
  assert.deepEqual(response, { result: 'error', code: 'VALIDATION_ERROR' });
  assert.equal(sent.length, 0);
});

/* ------------------------------------------------------------------ thumbnail */

test('thumbnail: allowlist, protocol, port, userinfo and IP checks', () => {
  assert.ok(parseAllowedUrl('https://i.ytimg.com/vi/abcdefghijk/maxresdefault.jpg',
    ['ytimg.com']));
  assert.equal(parseAllowedUrl('http://i.ytimg.com/a.jpg', ['ytimg.com']), null);
  assert.equal(parseAllowedUrl('https://user@i.ytimg.com/a.jpg', ['ytimg.com']), null);
  assert.equal(parseAllowedUrl('https://i.ytimg.com:8443/a.jpg', ['ytimg.com']), null);
  assert.equal(parseAllowedUrl('https://i.ytimg.com:443/a.jpg', ['ytimg.com']), null);
  assert.equal(parseAllowedUrl('https://127.0.0.1/a.jpg', ['ytimg.com']), null);
  assert.equal(parseAllowedUrl('https://[::1]/a.jpg', ['ytimg.com']), null);
  assert.equal(parseAllowedUrl('https://evil.example/a.jpg', ['ytimg.com']), null);
  assert.equal(parseAllowedUrl('not a url', ['ytimg.com']), null);
  assert.equal(normalizeImageUrl('https://evil.example/a.jpg'), null);
  assert.equal(normalizeImageUrl('https://i.ytimg.com/a.jpg'),
    'https://i.ytimg.com/a.jpg');
});

test('thumbnail: image type and magic-byte validation', () => {
  const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
  const html = new TextEncoder().encode('<html><script>alert(1)</script></html>');
  assert.equal(responseMime('image/png; charset=utf-8'), 'image/png');
  assert.equal(responseMime('image/svg+xml'), null);
  assert.equal(validImageMagic(png, 'image/png'), true);
  assert.equal(validImageMagic(html, 'image/png'), false);
});

function requestFor(query) {
  return new Request(`https://easyworktools.online/api/thumbnail?${query}`);
}

function pngResponse(extraHeaders = {}) {
  const bytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
  return new Response(bytes, {
    status: 200,
    headers: { 'Content-Type': 'image/png', ...extraHeaders }
  });
}

test('thumbnail: allowed provider and allowed image still work', async () => {
  const restore = useFetch(async () => pngResponse());
  try {
    const page = await thumbnailGet({
      request: requestFor('url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3Dabcdefghijk')
    });
    assert.equal(page.status, 200);
    const pageBody = await page.json();
    assert.equal(pageBody.ok, true);
    assert.equal(pageBody.platform, 'youtube');
    assert.ok(pageBody.image.startsWith('https://i.ytimg.com/vi/abcdefghijk/'));

    const image = await thumbnailGet({
      request: requestFor('img=https%3A%2F%2Fi.ytimg.com%2Fvi%2Fabcdefghijk%2Fhqdefault.jpg')
    });
    assert.equal(image.status, 200);
    assert.equal(image.headers.get('content-type'), 'image/png');
  } finally {
    restore();
  }
});

test('thumbnail: unknown hosts, private IPs, invalid protocols and malformed URLs are rejected', async () => {
  const cases = [
    'img=https%3A%2F%2Fevil.example%2Fa.jpg',
    'img=https%3A%2F%2F127.0.0.1%2Fa.jpg',
    'img=http%3A%2F%2Fi.ytimg.com%2Fa.jpg',
    'img=https%3A%2F%2F%5Bbad'
  ];
  for (const query of cases) {
    const response = await thumbnailGet({ request: requestFor(query) });
    assert.equal(response.status, 400, query);
    assert.equal((await response.json()).error, 'host-not-allowed');
  }
});

test('thumbnail: redirect to a disallowed host is blocked before another fetch', async () => {
  const restore = useFetch(async (url) => {
    if (String(url).includes('i.ytimg.com')) {
      return new Response(null, {
        status: 302,
        headers: { Location: 'https://evil.example/a.png' }
      });
    }
    throw new Error('a disallowed redirect target was fetched');
  });
  try {
    const response = await thumbnailGet({
      request: requestFor('img=https%3A%2F%2Fi.ytimg.com%2Fa.png')
    });
    assert.equal(response.status, 502);
    assert.deepEqual(await response.json(), { ok: false, error: 'redirect-not-allowed' });
  } finally {
    restore();
  }
});

test('thumbnail: oversized response and unexpected content type are rejected', async () => {
  const oversizedRestore = useFetch(async () => pngResponse({ 'Content-Length': '9000000' }));
  try {
    const response = await thumbnailGet({
      request: requestFor('img=https%3A%2F%2Fi.ytimg.com%2Fa.png')
    });
    assert.equal(response.status, 413);
    assert.equal((await response.json()).error, 'response-too-large');
  } finally {
    oversizedRestore();
  }

  const wrongTypeRestore = useFetch(async () => new Response('<html>not an image</html>', {
    status: 200,
    headers: { 'Content-Type': 'text/html' }
  }));
  try {
    const response = await thumbnailGet({
      request: requestFor('img=https%3A%2F%2Fi.ytimg.com%2Fa.png')
    });
    assert.equal(response.status, 415);
    assert.equal((await response.json()).error, 'not-an-image');
  } finally {
    wrongTypeRestore();
  }
});

test('thumbnail: oEmbed final image from a disallowed host is not returned', async () => {
  const restore = useFetch(async () => jsonResponse({
    title: 'Synthetic',
    thumbnail_url: 'https://evil.example/cover.jpg'
  }));
  try {
    const response = await thumbnailGet({
      request: requestFor('url=https%3A%2F%2Fwww.tiktok.com%2F%40user%2Fvideo%2F1234567890123456789')
    });
    assert.equal(response.status, 502);
    const body = await response.json();
    assert.equal(body.error, 'image-host-not-allowed');
    assert.ok(!JSON.stringify(body).includes('evil.example'));
  } finally {
    restore();
  }
});

test('thumbnail: network failures return a generic error', async () => {
  const restore = useFetch(async () => { throw new Error('offline'); });
  try {
    const response = await thumbnailGet({
      request: requestFor('img=https%3A%2F%2Fi.ytimg.com%2Fa.png')
    });
    assert.equal(response.status, 504);
    assert.deepEqual(await response.json(), { ok: false, error: 'fetch-failed' });
  } finally {
    restore();
  }
});

test('thumbnail: a slow-drip body cannot outlive the total timeout', async () => {
  mock.timers.enable(['setTimeout', 'clearTimeout']);
  const restore = useFetch(async (url) => {
    if (!String(url).includes('i.ytimg.com')) throw new Error('unexpected fetch');
    const body = new ReadableStream({
      start() { /* never enqueue or close: the body stalls after headers */ }
    });
    return new Response(body, {
      status: 200,
      headers: { 'Content-Type': 'image/png' }
    });
  });
  try {
    const pending = thumbnailGet({
      request: requestFor('img=https%3A%2F%2Fi.ytimg.com%2Fa.png')
    });
    await Promise.resolve();
    mock.timers.tick(TIMEOUT_MS);
    const response = await pending;
    assert.equal(response.status, 504);
    assert.deepEqual(await response.json(), { ok: false, error: 'fetch-failed' });
  } finally {
    restore();
    mock.timers.reset();
  }
});

/* ------------------------------------------------------- reports and middleware */

test('reports: 404 routes include noindex and no upstream content', async () => {
  const direct = await reportsIndex();
  assert.equal(direct.status, 404);
  assert.equal(direct.headers.get('x-robots-tag'), 'noindex, nofollow');

  const catchAllModule = await import(
    pathToFileURL(path.join(REPO, 'functions/reports/[[path]].js')).href
  );
  const nested = await catchAllModule.onRequest();
  assert.equal(nested.status, 404);
  assert.equal(nested.headers.get('x-robots-tag'), 'noindex, nofollow');
  assert.ok(!(await nested.text()).includes('security-audit'));
});

test('middleware: report paths and encoded private files are blocked', async () => {
  const report = await middleware({
    request: new Request(`${ORIGIN}/reports/security-audit/STEP-1-LIVE-WEBSITE-SECURITY.md`),
    next: () => { throw new Error('next should not be called'); }
  });
  assert.equal(report.status, 404);
  assert.equal(report.headers.get('x-robots-tag'), 'noindex, nofollow');

  const encoded = await middleware({
    request: new Request(`${ORIGIN}/%70ackage.json`),
    next: () => { throw new Error('next should not be called'); }
  });
  assert.equal(encoded.status, 410);

  const traversal = await middleware({
    request: new Request(`${ORIGIN}/assets/%2e%2e/package.json`),
    next: () => { throw new Error('next should not be called'); }
  });
  assert.equal(traversal.status, 410);
});

test('middleware: canonical redirect still preserves path and query', async () => {
  const response = await middleware({
    request: new Request('https://www.easyworktools.online/tools/age-calculator/?x=1'),
    next: () => { throw new Error('next should not be called'); }
  });
  assert.equal(response.status, 301);
  assert.equal(
    response.headers.get('location'),
    'https://easyworktools.online/tools/age-calculator/?x=1'
  );
});

/* --------------------------------------------------------------- track and headers */

test('track: rejects oversized bodies and unsafe paths', async () => {
  const safePathRequest = new Request(`${ORIGIN}/api/track`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: '/tools/age-calculator/' })
  });
  const ok = await track({ request: safePathRequest, env: {} });
  assert.equal(ok.status, 200);

  const traversal = new Request(`${ORIGIN}/api/track`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: '/tools/../../package.json' })
  });
  assert.equal((await track({ request: traversal, env: {} })).status, 400);

  const oversized = new Request(`${ORIGIN}/api/track`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': '9000' },
    body: JSON.stringify({ path: '/tools/age-calculator/' })
  });
  assert.equal((await track({ request: oversized, env: {} })).status, 400);
});

test('static config: public files contain no Apps Script URL or wildcard CORS', () => {
  const index = read('index.html');
  const config = read('assets/feedback-config.js');
  const client = read('assets/feedback-form.js');
  const feedbackSource = read('functions/api/feedback.js');
  const headers = read('_headers');
  const robots = read('robots.txt');
  const code = read('apps-script/Code.gs');

  const configIndex = index.indexOf('assets/feedback-config.js');
  const formIndex = index.indexOf('assets/feedback-form.js');
  assert.ok(configIndex > 0);
  assert.ok(formIndex > configIndex);
  assert.ok(!index.includes('no-cors'));
  assert.ok(!index.includes('EWT_APPS_SCRIPT_URL'));

  assert.ok(config.includes("'/api/feedback'"));
  assert.ok(!config.includes('script.google.com'));
  assert.ok(client.includes('SAFE_CLIENT_MESSAGES[error.message]'));
  assert.ok(!client.includes("? error.message"));
  assert.ok(!feedbackSource.includes('"*"'));
  assert.ok(!feedbackSource.includes('console.log'));

  const csp = headers.split(/\r?\n/).find(line =>
    line.trim().startsWith('Content-Security-Policy-Report-Only:'));
  assert.ok(csp);
  assert.ok(!/cdnjs|jsdelivr|script\.google\.com/.test(csp));
  assert.ok(csp.includes('challenges.cloudflare.com'));
  assert.ok(!/^\s{2}Content-Security-Policy:/m.test(headers));
  assert.ok(/\/reports\/\*[\s\S]*?X-Robots-Tag: noindex/.test(headers));
  assert.ok(robots.includes('Disallow: /reports/'));

  assert.ok(code.includes('FEEDBACK_PROXY_TOKEN'));
  assert.ok(code.includes('FEEDBACK_RECIPIENT_EMAIL'));
  assert.ok(!/@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/.test(code));
});
