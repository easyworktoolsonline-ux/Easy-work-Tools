/* ==========================================================================
 * Homepage feedback form (#toolFeedbackFormLocal).
 *
 * Security contract:
 *   - Posts JSON to the same-origin /api/feedback Pages Function.
 *   - Uses mode:'cors' and reads the response; success is shown only when the
 *     server confirms it with an explicit JSON `ok:true`.
 *   - Never sends or displays secrets. The Apps Script URL, proxy token and
 *     Turnstile secret are server-side only.
 *   - All status messages are written with textContent, never innerHTML.
 * ========================================================================== */
(function () {
  'use strict';

  var form = document.getElementById('toolFeedbackFormLocal');
  var status = document.getElementById('feedbackStatus');
  var btn = document.getElementById('feedbackSubmitBtn');
  if (!form || !status) return;

  var statusText = status.querySelector('span') || status;
  var buttonMarkup = btn ? btn.innerHTML : '';
  var buttonText = btn ? btn.textContent : 'Send a Request';
  var submitting = false;
  var tsWidgetId = null;
  var tsSiteKey = '';

  var REQUEST_TYPES = ['Report a Tool Issue', 'Suggest a New Tool', 'Help'];
  var MAX_FIELD = 200;
  var MAX_EMAIL = 254;
  var MAX_DETAILS = 5000;

  function setStatus(message, kind) {
    statusText.textContent = message;
    status.className = 'form-status' + (kind ? ' ' + kind : '');
  }

  function setBusy(busy) {
    submitting = busy;
    if (!btn) return;
    btn.disabled = busy;
    if (busy) {
      btn.textContent = 'Sending...';
    } else if (buttonMarkup) {
      /* Restore the original span + arrow markup, not a flattened text node. */
      if (btn.innerHTML !== buttonMarkup) btn.innerHTML = buttonMarkup;
    } else {
      btn.textContent = buttonText;
    }
  }

  function resetTurnstile() {
    if (tsWidgetId !== null && window.turnstile) {
      try { window.turnstile.reset(tsWidgetId); } catch (_) { /* widget already gone */ }
    }
  }

  function readConfig() {
    var endpoint = String(window.EWT_FEEDBACK_ENDPOINT || '').trim();
    tsSiteKey = String(window.EWT_TURNSTILE_SITE_KEY || '').trim();
    return endpoint;
  }

  function startTurnstile() {
    var actions = form.querySelector('.feedback-actions');
    if (!tsSiteKey || !actions || document.getElementById('feedbackTurnstile')) return;

    var box = document.createElement('div');
    box.id = 'feedbackTurnstile';
    box.style.margin = '0 0 14px';
    actions.parentNode.insertBefore(box, actions);

    window.ewtTurnstileReady = function () {
      if (!window.turnstile) return;
      tsWidgetId = window.turnstile.render(box, {
        sitekey: tsSiteKey,
        theme: 'auto',
        appearance: 'always'
      });
    };

    var script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=ewtTurnstileReady';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }

  /* feedback-config.js is deferred; read it after the document has loaded. */
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    readConfig();
    startTurnstile();
  } else {
    window.addEventListener('DOMContentLoaded', function () {
      readConfig();
      startTurnstile();
    });
  }

  function normalize(value, max) {
    return String(value == null ? '' : value)
      .replace(/\r\n?/g, '\n')
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
      .trim()
      .slice(0, max);
  }

  function validate(data) {
    var requestType = normalize(data.get('requestType'), MAX_FIELD);
    if (REQUEST_TYPES.indexOf(requestType) === -1) {
      return { error: 'Please choose a request type.' };
    }

    var details = normalize(data.get('details'), MAX_DETAILS);
    if (details.length < 10) {
      return { error: 'Please add a little more detail so the request can be understood.' };
    }

    var email = normalize(data.get('email'), MAX_EMAIL);
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      return { error: 'Please enter a valid email address or leave the field empty.' };
    }

    var toolName = normalize(data.get('toolName'), MAX_FIELD);
    var payload = {
      requestType: requestType,
      toolName: toolName,
      email: email,
      details: details
    };

    var tokenNode = form.querySelector('.cf-turnstile-response');
    var turnstileToken = tokenNode ? String(tokenNode.value || '').trim() : '';
    if (tsSiteKey && !turnstileToken) {
      return { error: 'Please complete the security check above, then send your request again.' };
    }
    if (turnstileToken) payload.turnstileToken = turnstileToken.slice(0, 4096);

    return { payload: payload };
  }

  var SAFE_CLIENT_MESSAGES = {
    'Please check your request and try again.': true,
    'The security check failed. Please reload the page and try again.': true,
    'Too many requests. Please wait a few minutes and try again.': true,
    'Feedback service is temporarily unavailable. Please try again later.': true,
    'We could not send your request right now. Please try again later.': true,
    'Something went wrong. Please try again.': true,
    'Network error. Please check your connection and try again.': true
  };

  function safeServerMessage(payload, fallback) {
    var allowed = {
      VALIDATION_ERROR: 'Please check your request and try again.',
      CAPTCHA_FAILED: 'The security check failed. Please reload the page and try again.',
      RATE_LIMITED: 'Too many requests. Please wait a few minutes and try again.',
      SERVICE_UNAVAILABLE: 'Feedback service is temporarily unavailable. Please try again later.',
      DELIVERY_FAILED: 'We could not send your request right now. Please try again later.'
    };
    if (payload && typeof payload.error === 'string' && allowed[payload.error]) {
      return allowed[payload.error];
    }
    return fallback;
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    if (submitting) return;

    var endpoint = readConfig();
    if (!endpoint || !/^\/(?:api\/)?feedback\/?$/.test(endpoint)) {
      setStatus('Feedback service is not configured yet.', 'error');
      return;
    }

    var checked = validate(new FormData(form));
    if (checked.error) {
      setStatus(checked.error, 'error');
      return;
    }

    setStatus('Sending your request...', '');
    setBusy(true);

    fetch(endpoint, {
      method: 'POST',
      mode: 'cors',
      credentials: 'omit',
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(checked.payload)
    })
      .then(function (response) {
        return response.text().then(function (text) {
          var payload = null;
          try { payload = text ? JSON.parse(text) : null; } catch (_) { payload = null; }
          if (!response.ok || !payload || payload.ok !== true) {
            throw new Error(safeServerMessage(payload, 'Something went wrong. Please try again.'));
          }
          return payload;
        });
      })
      .then(function () {
        setStatus('Request sent successfully. Thank you!', 'success');
        form.reset();
        resetTurnstile();
      })
      .catch(function (error) {
        var message = error && error.message === 'Failed to fetch'
          ? 'Network error. Please check your connection and try again.'
          : 'Something went wrong. Please try again.';
        /* Never display raw exception text: only explicitly approved strings. */
        if (error && error.message && SAFE_CLIENT_MESSAGES[error.message]) {
          message = error.message;
        }
        setStatus(message, 'error');
        resetTurnstile();
      })
      .finally(function () {
        setBusy(false);
      });
  });
})();
