/**
 * EasyWorkTools.online — feedback / request form backend.
 *
 * Deploy as: Web App
 *   Execute as: Me
 *   Who has access: Anyone (Google Web Apps cannot restrict by CORS/origin)
 *
 * SECURITY CONTRACT
 *   The browser never calls this Web App directly. Cloudflare Pages calls it
 *   from /api/feedback with a server-side proxy token. The endpoint URL and all
 *   secrets are owner-controlled configuration, never public client code.
 *
 * Required Script Properties (Project Settings > Script properties):
 *   FEEDBACK_PROXY_TOKEN     - high-entropy token shared with the Pages Function
 *   FEEDBACK_RECIPIENT_EMAIL - delivery address; no address is hardcoded here
 *
 * Turnstile is verified by the Pages Function before this script is called, so
 * it is intentionally NOT verified again (a Turnstile token is single-use).
 */

const PROXY_TOKEN_PROPERTY = 'FEEDBACK_PROXY_TOKEN';
const RECIPIENT_PROPERTY = 'FEEDBACK_RECIPIENT_EMAIL';
const ALLOWED_REQUEST_TYPES = [
  'Report a Tool Issue', 'Suggest a New Tool', 'Help'
];
const MAX_POST_BYTES = 20000;
const MAX_FIELD = 200;
const MAX_EMAIL = 254;
const MAX_DETAILS = 5000;
const MAX_TOKEN = 512;

function doPost(e) {
  const props = PropertiesService.getScriptProperties();
  const expectedToken = readProperty_(props, PROXY_TOKEN_PROPERTY);
  const recipient = readProperty_(props, RECIPIENT_PROPERTY);

  // Fail closed if owner configuration is missing.
  if (!expectedToken || !recipient || !isValidEmail_(recipient)) {
    return jsonResponse_({ result: 'error', code: 'SERVICE_UNAVAILABLE' });
  }

  if (e && e.postData && typeof e.postData.length === 'number'
      && e.postData.length > MAX_POST_BYTES) {
    return jsonResponse_({ result: 'error', code: 'VALIDATION_ERROR' });
  }

  const data = extractData_(e);
  const suppliedToken = data.proxyToken;
  if (typeof suppliedToken !== 'string'
      || suppliedToken.length > MAX_TOKEN
      || !tokensEqual_(suppliedToken, expectedToken)) {
    return jsonResponse_({ result: 'error', code: 'PROXY_AUTH_FAILED' });
  }

  const requestType = field_(data.requestType, MAX_FIELD, true);
  if (!requestType || ALLOWED_REQUEST_TYPES.indexOf(requestType) === -1) {
    return jsonResponse_({ result: 'error', code: 'VALIDATION_ERROR' });
  }

  const toolName = field_(data.toolName, MAX_FIELD, false, false);
  const visitorEmail = field_(data.email, MAX_EMAIL, false, false);
  const details = field_(data.details, MAX_DETAILS, true, true);
  if (toolName === null || visitorEmail === null || !details || details.length < 10) {
    return jsonResponse_({ result: 'error', code: 'VALIDATION_ERROR' });
  }
  if (visitorEmail && !isValidEmail_(visitorEmail)) {
    return jsonResponse_({ result: 'error', code: 'VALIDATION_ERROR' });
  }

  const mail = {
    to: recipient,
    subject: 'EasyWorkTools request: ' + requestType,
    body: [
      'A new request was submitted from EasyWorkTools.online.',
      '',
      'Request type: ' + requestType,
      'Tool: ' + (toolName || 'Not specified'),
      'Visitor email: ' + (visitorEmail || 'Not provided'),
      '',
      'Details:',
      details,
      '',
      'Website: https://easyworktools.online/'
    ].join('\n'),
    name: 'EasyWorkTools.online'
  };
  if (visitorEmail) mail.replyTo = visitorEmail;

  try {
    MailApp.sendEmail(mail);
    return jsonResponse_({ result: 'success', code: 'DELIVERED' });
  } catch (err) {
    // No payload, recipient, exception text or deployment detail is logged.
    console.error('feedback delivery failed');
    return jsonResponse_({ result: 'error', code: 'DELIVERY_FAILED' });
  }
}

/** Google Web Apps always answer GET with 200; keep the payload intentionally minimal. */
function doGet() {
  return jsonResponse_({ result: 'error', code: 'METHOD_NOT_ALLOWED' });
}

function readProperty_(props, name) {
  try {
    const value = props.getProperty(name);
    return typeof value === 'string' ? value.trim() : '';
  } catch (err) {
    return '';
  }
}

/** Accepts either a JSON body from the proxy or a legacy form POST. */
function extractData_(e) {
  if (e && e.postData && typeof e.postData.contents === 'string') {
    if (e.postData.contents.length > MAX_POST_BYTES) return {};
    try {
      const parsed = JSON.parse(e.postData.contents);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
    } catch (err) {
      // Fall through to form parameters below.
    }
  }
  return (e && e.parameter && typeof e.parameter === 'object') ? e.parameter : {};
}

/** Removes control characters; single-line fields also lose all line breaks. */
function field_(value, max, required, multiline) {
  if (typeof value !== 'string') return null;
  if (value.length > max) return null;
  const cleaned = multiline
    ? value.replace(/\r\n?/g, '\n').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim()
    : value.replace(/[\u0000-\u001F\u007F]/g, '').trim();
  if (required && !cleaned) return null;
  return cleaned;
}

function isValidEmail_(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

function tokensEqual_(supplied, expected) {
  if (typeof supplied !== 'string' || typeof expected !== 'string') return false;
  if (supplied.length !== expected.length) return false;
  let different = 0;
  for (let i = 0; i < expected.length; i += 1) {
    different |= supplied.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return different === 0;
}

function jsonResponse_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
