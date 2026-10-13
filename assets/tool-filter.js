/* Category filter for /tools/. */
(function () {
  'use strict';

  var panel = document.getElementById('toolFilter');
  var grid = document.getElementById('allToolsGrid');
  if (!panel || !grid) return;

  function currentCards() {
    return Array.prototype.slice.call(grid.querySelectorAll('.card[data-cat]'));
  }

  var cards = currentCards();
  if (!cards.length) return;

  var catButtons = Array.prototype.slice.call(panel.querySelectorAll('[data-filter-cat]'));
  var cat = '';
  var scheduled = false;

  var empty = document.createElement('div');
  empty.className = 'tools-empty';
  empty.hidden = true;
  empty.innerHTML = '<h2>No tools match this category</h2>'
    + '<p>Choose another category to see more tools.</p>';
  var emptyBtn = document.createElement('button');
  emptyBtn.type = 'button';
  emptyBtn.className = 'filter-chip';
  emptyBtn.textContent = 'Show all tools';
  empty.appendChild(emptyBtn);
  grid.parentNode.insertBefore(empty, grid.nextSibling);

  function apply() {
    cards = currentCards();
    var shown = 0;
    for (var i = 0; i < cards.length; i++) {
      var matches = !cat || cards[i].getAttribute('data-cat') === cat;
      cards[i].hidden = !matches;
      if (matches) shown++;
    }

    empty.hidden = shown !== 0;
    catButtons.forEach(function (button) {
      var active = (button.getAttribute('data-filter-cat') || '') === cat;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });

    var url = new URL(window.location.href);
    if (cat) url.searchParams.set('cat', cat); else url.searchParams.delete('cat');
    url.searchParams.delete('sub');
    window.history.replaceState(null, '', url.pathname + url.search);
  }

  function select(nextCat) {
    cat = nextCat;
    apply();
  }

  function showAll() {
    cat = '';
    apply();
  }

  panel.addEventListener('click', function (event) {
    var button = event.target.closest ? event.target.closest('[data-filter-cat]') : null;
    if (!button || !panel.contains(button)) return;
    select(button.getAttribute('data-filter-cat') || '');
  });

  emptyBtn.addEventListener('click', showAll);

  function fromUrl() {
    var requested = new URL(window.location.href).searchParams.get('cat') || '';
    var known = catButtons.some(function (button) {
      return (button.getAttribute('data-filter-cat') || '') === requested;
    });
    cat = known ? requested : '';
  }

  fromUrl();
  apply();

  function reapplySoon() {
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(apply);
    });
  }

  window.addEventListener('load', reapplySoon);
  if (document.readyState === 'complete') reapplySoon();

  if ('MutationObserver' in window) {
    new MutationObserver(function () {
      if (scheduled) return;
      scheduled = true;
      window.requestAnimationFrame(function () {
        scheduled = false;
        apply();
      });
    }).observe(grid, { childList: true });
  }
})();
