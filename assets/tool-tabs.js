/* --------------------------------------------------------------------------
 * Category tabs for the "Our Most Popular Tools" grid.
 *
 * Progressive enhancement. The server already rendered the All Tools set of sixteen
 * cards into #toolsGrid, so with JavaScript off the section is complete. This script only
 * takes over when a tab is actually used.
 *
 * The All Tools selection (sixteen cards) and complete category lists are
 * computed at build time by scripts/popular-tools.mjs and shipped in the
 * #ewtToolsData island. All this file does is read those selections and paint
 * them.
 *
 * Accessibility: a real ARIA tablist. Left/Right/Home/End move between tabs,
 * only the selected tab is in the tab order, and #toolsGrid is a tabpanel with
 * aria-live="polite" so the new set is announced.
 * ------------------------------------------------------------------------ */
(function () {
  'use strict';

  var bar = document.querySelector('.tool-tabs');
  var grid = document.getElementById('toolsGrid');
  var island = document.getElementById('ewtToolsData');
  if (!bar || !grid || !island) return;

  var data;
  try { data = JSON.parse(island.textContent); } catch (e) { return; }
  if (!data || !data.picks) return;
  /* Bails out unless app.js has published the shared catalogue. Without it a
   * slug cannot be resolved to a card, and painting an empty grid would be worse
   * than leaving the server-rendered cards in place. */
  if (!window.ewtToolsByKey) return;

  var buttons = Array.prototype.slice.call(bar.querySelectorAll('[role="tab"]'));
  if (!buttons.length) return;


  /* ---------------------------------------------------------------- glider --
   * One blue marker that slides to the selected tab, rather than a background
   * painted on each button - a per-button background cannot animate across.
   *
   * Geometry comes from getBoundingClientRect deltas, not offsetLeft:
   * offsetLeft is measured from the offsetParent border box and this bar has
   * horizontal padding, so the two disagree by exactly that padding and the
   * marker would sit visibly off. Rect deltas are unambiguous.
   *
   * bar.scrollLeft is added back because the bar is the scroll container: the
   * marker is absolutely positioned inside it and therefore already appears
   * shifted by -scrollLeft, so the target has to be corrected for that or the
   * marker lands short once the row has been scrolled. */
  var glider = bar.querySelector('.tool-tabs__glider');

  function moveGlider() {
    if (!glider) return;
    var active = bar.querySelector('[role="tab"][aria-selected="true"]');
    if (!active) return;
    var b = bar.getBoundingClientRect();
    var t = active.getBoundingClientRect();
    if (!t.width) return;
    /* Fractional px, deliberately not rounded: the bar centres its tabs, so
       button edges land on half-pixels and rounding would quantise the marker
       away from them. Measured drift against the button is exactly 0 once the
       340ms transition has settled. */
    glider.style.width = t.width + 'px';
    glider.style.height = t.height + 'px';
    glider.style.transform = 'translate3d(' + (t.left - b.left + bar.scrollLeft) + 'px,'
      + (t.top - b.top) + 'px,0)';
  }

  /* Re-measure on anything that can move the buttons without a selection
   * change: a viewport resize reflows the flex row, and a late webfont swap
   * changes the label widths. Without these the marker would be left pointing
   * at stale geometry. */
  if (window.ResizeObserver) {
    new ResizeObserver(moveGlider).observe(bar);
  } else {
    window.addEventListener('resize', moveGlider);
  }
  if (document.fonts && document.fonts.ready && document.fonts.ready.then) {
    document.fonts.ready.then(moveGlider);
  }
  window.addEventListener('load', moveGlider);
  bar.addEventListener('scroll', moveGlider, { passive: true });
  /* Mirrors esc() in app.js: tool copy comes from the manifest, but it is
   * injected as HTML, so it is escaped rather than trusted. */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c];
    });
  }

  /* Relative URL for every other tool, exactly matching the server-rendered
   * cards: the island stores manifest urls like "tools/json-formatter/", so the
   * value is used as-is. An absolute URL here would ignore whichever host the
   * page is served from and break a staging deployment.
   *
   * The two entries in FINAL_URLS are the exception. Their owner has frozen
   * them, so they are emitted verbatim instead of being rebuilt from the
   * manifest - which also means clicking a tab cannot silently revert a card
   * that the server already rendered with the frozen URL. */
  var FINAL_URLS = {
    'easy-image-resizer': 'https://easyworktools.online/tools/easy-image-resizer/#landing',
    'online-text-case-converter': 'https://easyworktools.online/tools/online-text-case-converter/'
  };

  function abs(u) {
    return String(u || '').replace(/^\/+/, '');
  }

  function hrefFor(key, tool) {
    if (Object.prototype.hasOwnProperty.call(FINAL_URLS, key)) return FINAL_URLS[key];
    return abs(tool.url);
  }

  /* Resolves a slug to its card. Metadata comes from window.ewtToolsByKey, which
   * app.js builds from the __SITE_DATA__ the page has already fetched, so this
   * file never carries a second copy of the catalogue. */
  function cardFor(key) {
    var t = window.ewtToolsByKey && window.ewtToolsByKey[key];
    if (!t) return '';
    var cat = window.ewtCatSlug ? window.ewtCatSlug(t.category) : '';
    /* The same markup the build emits, so the CSS needs no new rules and the
       design is identical whichever tab is showing. */
    var glyph = (window.iconSvg && t.iconKey) ? window.iconSvg(t.iconKey) : '';
    var tags = Array.isArray(t.tags) ? t.tags.join('|') : (t.tags || '');
    return '<a class="card" href="' + esc(hrefFor(key, t)) + '"'
      + ' data-cat="' + esc(cat) + '"'
      + ' data-tags="' + esc(tags) + '" data-title="' + esc(t.title) + '">'
      + '<div class="card-top"><div class="icon icon-svg">' + glyph + '</div></div>'
      + '<h3>' + esc(t.title) + '</h3>'
      + '<p>' + esc(t.description) + '</p>'
      + '</a>';
  }

  function paint(tabId) {
    var keys = data.picks[tabId];
    if (!keys || !keys.length) return;
    var html = '';
    for (var i = 0; i < keys.length; i++) html += cardFor(keys[i]);
    grid.innerHTML = html;
  }

  function select(tabId, focus) {
    buttons.forEach(function (b) {
      var on = b.getAttribute('data-cat') === tabId;
      b.setAttribute('aria-selected', on ? 'true' : 'false');
      b.setAttribute('tabindex', on ? '0' : '-1');
      b.classList.toggle('is-active', on);
      if (on && focus) b.focus();
    });
    paint(tabId);
    moveGlider();
  }

  bar.addEventListener('click', function (e) {
    var btn = e.target.closest ? e.target.closest('[role="tab"]') : null;
    if (!btn || !bar.contains(btn)) return;
    e.preventDefault();
    select(btn.getAttribute('data-cat'), false);
  });

  /* Roving tabindex, per the ARIA tabs pattern. */
  bar.addEventListener('keydown', function (e) {
    var i = buttons.indexOf(document.activeElement);
    if (i === -1) return;
    var next = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (i + 1) % buttons.length;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (i - 1 + buttons.length) % buttons.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = buttons.length - 1;
    if (next === null) return;
    e.preventDefault();
    select(buttons[next].getAttribute('data-cat'), true);
  });

  /* is-placed suppresses the transition for the very first positioning, so a
   * first paint does not show the marker sliding in from the left edge. */
  if (glider) glider.classList.add('is-placed');
  /* Opt in to the glider: only now is the blue fill handed over from the button
     to the marker, so a no-JS page keeps the self-painting button. */
  bar.classList.add('is-enhanced');
  moveGlider();
})();