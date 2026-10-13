/* ==========================================================================
 * /resources/ index - search and category filter.
 *
 * Loaded as its own deferred script from that page only, rather than folded into
 * assets/app.js, because no other page has a resource index and it would be dead
 * weight on the other 268.
 *
 * EVERY ITEM IS ALREADY IN THE HTML
 * The build renders all 128 tools and all 121 guides into the page as real
 * links. This script only hides the ones that do not match; it never fetches or
 * generates anything. That means the page is complete and navigable with
 * JavaScript disabled, and a crawler sees every link - which is the whole point
 * of a page like this.
 *
 * Matching is on a data-search attribute the build writes per item: the title,
 * the description and the tool's tags, lowercased. So "resize" finds the image
 * resizer, and "json" finds the developer tools, not just exact titles.
 * ========================================================================== */
(function () {
  'use strict';

  var root = document.getElementById('resourceIndex');
  if (!root) return;

  var input = document.getElementById('resourceSearch');
  var status = document.getElementById('resourceSearchStatus');
  var chips = Array.prototype.slice.call(root.querySelectorAll('.resource-chip[data-rcat]'));
  var groups = Array.prototype.slice.call(root.querySelectorAll('.resource-group'));
  var guideItems = Array.prototype.slice.call(root.querySelectorAll('#resourceGuides .resource-item'));
  /* Counted once at start-up rather than on every keystroke. */
  var totalTools = groups.reduce(function (n, g) { return n + g.querySelectorAll('.resource-item').length; }, 0);

  /* "all" matches everything; anything else is a category slug. */
  var cat = 'all';
  var query = '';

  /* Does one item match the current text? A blank query matches everything, so
     the page is never blank just because the field was cleared. */
  function itemMatches(item) {
    if (!query) return true;
    var hay = item.getAttribute('data-search') || '';
    return hay.indexOf(query) !== -1;
  }

  function apply() {
    var shownTools = 0;
    var shownGuides = 0;

    /* Tools: filter inside each group, then hide a group whose tools are all
       filtered out, so the page does not show nine empty headings. */
    groups.forEach(function (g) {
      var gCat = g.getAttribute('data-rcat');
      var items = g.querySelectorAll('.resource-item');
      var any = 0;
      items.forEach(function (it) {
        var ok = (cat === 'all' || cat === gCat) && itemMatches(it);
        it.hidden = !ok;
        if (ok) any++;
      });
      g.hidden = any === 0;
      shownTools += any;
    });

    /* Guides: not categorised, so the text query alone applies. Hiding them
       while a category chip is active would be confusing - the chip is about
       tools - so they stay visible and the status line says how many. */
    guideItems.forEach(function (it) {
      var ok = itemMatches(it);
      it.hidden = !ok;
      if (ok) shownGuides++;
    });

    /* aria-pressed keeps the toggle state announced, and is-active is what the
       CSS paints, so the two can never disagree. */
    chips.forEach(function (b) {
      var on = b.getAttribute('data-rcat') === cat;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });

    if (!status) return;

    /* Say what is on screen and, only when something is being hidden, how to see
     * all of it again.
     *
     * The previous wording appended "Clear the search box to see everything"
     * precisely when there was nothing to clear, because the condition tested
     * whether a filter was OFF rather than whether anything was hidden. It read:
     * "128 of 128 all tools shown. Clear the search box to see everything." */
    var hidden = shownTools < totalTools || shownGuides < guideItems.length;
    var scope;
    if (cat === 'all') {
      scope = 'tools';
    } else {
      var active = chips.filter(function (b) { return b.getAttribute('data-rcat') === cat; })[0];
      /* The chip's count lives in a nested span, so textContent glues it
         straight onto the label - "PDF Tools7", not "PDF Tools 7". The
         separator is therefore optional in the pattern, not required, which
         is what produced "Showing 7 of 128 PDF Tools7 tools." */
      scope = (active ? active.textContent.replace(/\s*\d+\s*$/, '').trim() : cat) + ' tools';
    }
    var text = 'Showing ' + shownTools + ' of ' + totalTools + ' ' + scope +
      (query ? ' matching "' + query + '"' : '') + '. ' +
      shownGuides + ' of ' + guideItems.length + ' guides shown.';
    if (hidden) {
      text += ' Clear the search box or choose All to see everything.';
    }
    status.textContent = text;
  }

  if (input) {
    input.addEventListener('input', function () {
      query = String(input.value || '').trim().toLowerCase();
      apply();
    });
    /* Escape clears the field, which is the behaviour a search box is expected
       to have and which the type=search clear button otherwise does silently. */
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && input.value) {
        e.preventDefault();
        input.value = '';
        query = '';
        apply();
      }
    });
  }

  chips.forEach(function (b) {
    b.addEventListener('click', function () {
      var v = b.getAttribute('data-rcat');
      cat = (v === '' ? 'all' : v);
      apply();
    });
  });

  /* Chip row is a group of toggles, so arrow keys should move between them
     rather than tabbing through nine buttons. */
  var chipRow = root.querySelector('.resource-index__chips');
  if (chipRow) {
    chipRow.addEventListener('keydown', function (e) {
      var i = chips.indexOf(document.activeElement);
      if (i === -1) return;
      var next = null;
      if (e.key === 'ArrowRight') next = chips[(i + 1) % chips.length];
      else if (e.key === 'ArrowLeft') next = chips[(i - 1 + chips.length) % chips.length];
      else if (e.key === 'Home') next = chips[0];
      else if (e.key === 'End') next = chips[chips.length - 1];
      if (next) { e.preventDefault(); next.focus(); next.click(); }
    });
  }

  apply();
})();
