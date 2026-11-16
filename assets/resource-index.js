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

  var toolsContainer = document.getElementById('resourceGroups');
  var emptyState = document.createElement('div');
  emptyState.className = 'resource-empty';
  emptyState.id = 'resourceEmptyState';
  emptyState.hidden = true;
  emptyState.innerHTML = '<h3>No matching resources found</h3><p id="resourceEmptyMsg">Try a different keyword or clear your filters.</p><button type="button" id="resourceEmptyClear">Clear search &amp; filters</button>';
  if (toolsContainer && toolsContainer.parentNode) {
    toolsContainer.parentNode.insertBefore(emptyState, toolsContainer);
  }
  var emptyClearBtn = document.getElementById('resourceEmptyClear');
  if (emptyClearBtn) {
    emptyClearBtn.addEventListener('click', function () {
      if (input) input.value = '';
      query = '';
      cat = 'all';
      apply();
      if (input) input.focus();
    });
  }

  /* Record original DOM order so clearing the query restores the alphabetical/curated order. */
  var allItems = Array.prototype.slice.call(root.querySelectorAll('.resource-item'));
  allItems.forEach(function (it, idx) {
    it.setAttribute('data-orig-idx', String(idx));
    var link = it.querySelector('.resource-item__link');
    var desc = it.querySelector('.resource-item__desc');
    it._titleNorm = (link ? link.textContent : '').trim().toLowerCase();
    it._descNorm = (desc ? desc.textContent : '').trim().toLowerCase();
    it._hayNorm = ((it.getAttribute('data-search') || '') + ' ' + it._titleNorm + ' ' + it._descNorm).toLowerCase();
  });

  /* Score an item against the current query tokens:
     0 = no match; >0 = relevance score (exact title > prefix > title words > tags/desc). */
  function scoreItem(item, q, tokens) {
    if (!tokens.length) return 1;
    var hay = item._hayNorm;
    for (var i = 0; i < tokens.length; i++) {
      if (hay.indexOf(tokens[i]) === -1) return 0;
    }
    var title = item._titleNorm;
    var score = 1;
    if (title === q) score += 120;
    else if (title.indexOf(q) === 0) score += 70;
    else if (title.indexOf(q) !== -1) score += 45;
    for (var j = 0; j < tokens.length; j++) {
      if (title.indexOf(tokens[j]) !== -1) score += 18;
      else if (item._descNorm.indexOf(tokens[j]) !== -1) score += 6;
      else score += 3;
    }
    return score;
  }

  function sortList(listEl, scoredPairs) {
    scoredPairs.sort(function (a, b) {
      if (b.score !== a.score) return b.score - a.score;
      return Number(a.el.getAttribute('data-orig-idx')) - Number(b.el.getAttribute('data-orig-idx'));
    });
    for (var k = 0; k < scoredPairs.length; k++) {
      listEl.appendChild(scoredPairs[k].el);
    }
  }

  function apply() {
    var shownTools = 0;
    var shownGuides = 0;
    var q = query;
    var tokens = q ? q.split(/\s+/).filter(Boolean) : [];

    groups.forEach(function (g) {
      var gCat = g.getAttribute('data-rcat');
      var listEl = g.querySelector('.resource-items');
      var items = Array.prototype.slice.call(g.querySelectorAll('.resource-item'));
      var any = 0;
      var pairs = [];
      items.forEach(function (it) {
        var catOk = (cat === 'all' || cat === gCat);
        var s = catOk ? scoreItem(it, q, tokens) : 0;
        var ok = s > 0;
        it.hidden = !ok;
        if (ok) any++;
        pairs.push({ el: it, score: s });
      });
      if (listEl) sortList(listEl, pairs);
      g.hidden = any === 0;
      shownTools += any;
    });

    var guideList = root.querySelector('#resourceGuides .resource-items');
    var guidePairs = [];
    guideItems.forEach(function (it) {
      var s = scoreItem(it, q, tokens);
      var ok = s > 0;
      it.hidden = !ok;
      if (ok) shownGuides++;
      guidePairs.push({ el: it, score: s });
    });
    if (guideList) sortList(guideList, guidePairs);

    if (emptyState) {
      var nothingShown = shownTools === 0 && shownGuides === 0;
      emptyState.hidden = !nothingShown;
      var msg = document.getElementById('resourceEmptyMsg');
      if (msg && nothingShown) {
        msg.textContent = q
          ? 'No tools or guides matched "' + q + '". Try a shorter keyword or clear your filters.'
          : 'No tools or guides match the selected category.';
      }
    }

    chips.forEach(function (b) {
      var on = b.getAttribute('data-rcat') === cat;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });

    if (!status) return;

    var hidden = shownTools < totalTools || shownGuides < guideItems.length;
    var scope;
    if (cat === 'all') {
      scope = 'tools';
    } else {
      var active = chips.filter(function (b) { return b.getAttribute('data-rcat') === cat; })[0];
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
