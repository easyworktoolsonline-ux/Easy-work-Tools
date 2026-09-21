/**
 * EasyWorkTools.online — feedback / request form backend.
 * Deploy as: Web App
 *   Execute as: Me
 *   Who has access: Anyone
 */

const RECIPIENT_EMAIL = 'easyworktools.online@gmail.com';
const MAX_FIELD_LENGTH = 5000;

function doPost(e) {
  try {
    const data = extractData_(e);

    const requestType = clean_(data.requestType || data.type, 'Help', 200);
    const toolName = clean_(data.toolName || data.tool, 'Not specified', 200);
    const visitorEmail = clean_(data.email || data.replyTo, '', 200);
    const details = clean_(
      data.details || data.message || data.description,
      '',
      MAX_FIELD_LENGTH
    );

    if (details.length < 10) {
      return jsonResponse_({
        result: 'error',
        message: 'Please provide at least 10 characters of detail.'
      });
    }

    if (visitorEmail && !isValidEmail_(visitorEmail)) {
      return jsonResponse_({
        result: 'error',
        message: 'That email address does not look valid.'
      });
    }

    const subject = 'EasyWorkTools request: ' + requestType;
    const bodyLines = [
      'A new request was submitted from EasyWorkTools.online.',
      '',
      'Request type: ' + requestType,
      'Tool: ' + toolName,
      'Visitor email: ' + (visitorEmail || 'Not provided'),
      '',
      'Details:',
      details,
      '',
      'Website: https://easyworktools.online/'
    ];

    const mailOptions = {
      to: RECIPIENT_EMAIL,
      subject: subject,
      body: bodyLines.join('\n'),
      name: 'EasyWorkTools.online'
    };

    if (visitorEmail) {
      mailOptions.replyTo = visitorEmail;
    }

    MailApp.sendEmail(mailOptions);

    return jsonResponse_({
      result: 'success',
      message: 'Request sent successfully.'
    });

  } catch (err) {
    // Logged to Apps Script > Executions, viewable from the editor.
    console.error('doPost failed: ' + err);
    return jsonResponse_({
      result: 'error',
      message: 'Unable to send the request right now.'
    });
  }
}

function doGet() {
  return jsonResponse_({
    result: 'success',
    message: 'EasyWorkTools feedback endpoint is active.'
  });
}

/** Pulls fields from either a normal form POST or a JSON POST body. */
function extractData_(e) {
  if (e && e.parameter && Object.keys(e.parameter).length > 0) {
    return e.parameter;
  }
  if (e && e.postData && e.postData.contents) {
    try {
      return JSON.parse(e.postData.contents);
    } catch (_) {
      // Fall through to empty object below.
    }
  }
  return {};
}

function clean_(value, fallback, maxLength) {
  const str = (value === undefined || value === null) ? '' : String(value).trim();
  const result = str || fallback || '';
  return result.length > maxLength ? result.slice(0, maxLength) : result;
}

function isValidEmail_(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function jsonResponse_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
