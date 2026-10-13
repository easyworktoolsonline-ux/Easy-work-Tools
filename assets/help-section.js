/* ==========================================================================
 * Help & Feedback section behaviours (homepage #help only).
 *
 * The request type selector controls the form accent, and the textarea's live
 * character count is derived from its own minlength attribute.
 *
 * The form's submit handler is NOT here. It lives as an inline script in
 * index.html (hidden-iframe / no-cors POST to the Apps Script endpoint) and owns
 * #feedbackStatus, #feedbackSubmitBtn and form.reset(). Keeping this file
 * separate means the submit path cannot be affected by any of the below.
 *
 * Everything is guarded by element existence, so this is safe to load anywhere.
 * ========================================================================== */
(function () {
  'use strict';

  var section = document.getElementById('help');
  if (!section) return;

  var form = document.getElementById('toolFeedbackFormLocal');
  var select = form ? form.querySelector('select[name="requestType"]') : null;
  var textarea = form ? form.querySelector('textarea[name="details"]') : null;
  var counter = document.getElementById('feedbackCount');

  /* Keep the field and panel accent in step with the selected request type.
   *
   * "Choose" is a placeholder, not a request type: its value is the empty
   * string and it maps to no accent at all. Clearing the custom properties
   * entirely (rather than assigning '' - which would create a property that
   * exists but is empty, and var() would then use that empty string instead of
   * its fallback) lets every rule fall back to the neutral --border token, so
   * the resting state carries no coloured outline. */
  function syncAccent() {
    if (!form || !select) return;
    var accent = '#1D4ED8';
    var ink = '#ffffff';
    if (select.value === 'Suggest a New Tool') {
      accent = '#EA580C';
      ink = '#111827';
    } else if (select.value === 'Help') {
      accent = '#16A34A';
      ink = '#111827';
    } else if (select.value !== 'Report a Tool Issue') {
      accent = null;
      ink = null;
    }
    if (accent) {
      form.style.setProperty('--help-accent', accent);
      form.style.setProperty('--help-accent-ink', ink);
    } else {
      form.style.removeProperty('--help-accent');
      form.style.removeProperty('--help-accent-ink');
    }
  }

  if (select) {
    select.addEventListener('change', syncAccent);
    /* form.reset() restores the first option; update the accent after reset.
     *
     * The deferral is required, not defensive: per the HTML spec the reset event
     * is dispatched BEFORE the controls are actually cleared, and only skipped if
     * the event is cancelled. Running on the next task reads the reset selection. */
    if (form) {
      form.addEventListener('reset', function () {
        setTimeout(syncAccent, 0);
      });
    }
  }
  syncAccent();

  /* ------------------------------------------------- submit button markup --
   *
   * The inline submit handler swaps the button label with
   *   btn.textContent = 'Sending...'  ...  btn.textContent = btnDefaultText
   * and assigning textContent deletes every child element. Measured: the button
   * went from 2 children (the label <span> and the arrow <svg>) to 0, and the
   * restore left a bare text node - so the reference arrow vanished permanently
   * after the first send.
   *
   * Rather than edit the handler (it owns the real submit path and is shared
   * with the other form wiring), this captures the button's innerHTML once at
   * load and re-injects it if the handler has flattened it. Purely additive:
   * with no handler running, the innerHTML still matches and nothing happens.
   */
  var submitBtn = document.getElementById('feedbackSubmitBtn');
  if (submitBtn) {
    var submitMarkup = submitBtn.innerHTML;
    /* textContent is what the handler restores, so keep it too */
    var submitText = submitBtn.textContent;
    var restore = function () {
      if (submitBtn.innerHTML !== submitMarkup) submitBtn.innerHTML = submitMarkup;
      if (submitBtn.textContent !== submitText) submitBtn.textContent = submitText;
    };
    if (form) {
      /* the handler's finally{} has already run by the time reset/submit settles;
         a microtask after the event loop drains the handler's own writes */
      form.addEventListener('submit', function () { setTimeout(restore, 0); });
      form.addEventListener('reset', function () { setTimeout(restore, 0); });
    }
  }

  /* ------------------------------------------------------------- counter --
   * minlength is read off the textarea, and the same value is what the submit
   * handler enforces client-side, so the count and the validation agree. */
  if (textarea && counter) {
    var min = parseInt(textarea.getAttribute('minlength') || '0', 10);
    if (isNaN(min) || min < 0) min = 0;

    function syncCount() {
      var len = textarea.value.replace(/^\s+|\s+$/g, '').length;   /* trimmed: matches the handler */
      var need = min - len;
      counter.className = need > 0 ? 'feedback-count is-pending' : 'feedback-count is-ok';
      if (need > 0) {
        counter.textContent = need + ' more character' + (need === 1 ? '' : 's') + ' needed';
      } else {
        counter.textContent = len + ' character' + (len === 1 ? '' : 's') + ' entered';
      }
    }

    textarea.addEventListener('input', syncCount);
    /* reset() empties the textarea without firing input - and, as above, the
       reset event lands before the clearing, so this too has to wait a tick. */
    if (form) {
      form.addEventListener('reset', function () {
        setTimeout(function () { syncCount(); }, 0);
      });
    }
    syncCount();
  }
})();