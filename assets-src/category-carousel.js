/* ==========================================================================
 * Explore by Category carousel - homepage only.
 *
 * Loaded as a plain deferred script from index.html rather than added to
 * assets/app.js, because the other 259 pages have no carousel and this would be
 * a few hundred bytes of dead weight on every one of them.
 *
 * How it works: the track is a flex row of nine cards, moved with translateX.
 * --cat-per in assets/categories.css says how many fit at the current width,
 * so the slide distance is computed from the real measured card width rather
 * than from a hard-coded pixel value. That is what keeps it correct across the
 * 5 / 4 / 3 / 2 / 1 breakpoints without five sets of offsets to maintain.
 * ========================================================================== */
(function () {
  'use strict';

  var rail = document.getElementById('catRail');
  var track = document.getElementById('catTrack');
  var prev = document.getElementById('catPrev');
  var next = document.getElementById('catNext');
  var status = document.getElementById('catStatus');
  if (!rail || !track || !prev || !next) return;

  var cards = Array.prototype.slice.call(track.children);
  if (cards.length < 2) {
    // Nothing to slide to. Hide the controls rather than leaving dead buttons.
    prev.hidden = true;
    next.hidden = true;
    if (status) status.textContent = '';
    return;
  }

  var index = 0;

  function perView() {
    var raw = getComputedStyle(track).getPropertyValue('--cat-per');
    var n = parseInt(raw, 10);
    return isFinite(n) && n > 0 ? n : 1;
  }

  /* The furthest the track may move: showing the last card flush with the right
     edge. maxIndex is total - perView, so on a 9-card / 5-per-view desktop
     layout the next button stops at 4 and every card has been reachable. */
  function maxIndex() {
    return Math.max(0, cards.length - perView());
  }

  function step() {
    if (!cards[0]) return 0;
    var w = cards[0].getBoundingClientRect().width;
    var gap = parseFloat(getComputedStyle(track).columnGap || '0') || 0;
    return w + gap;
  }

  function render() {
    var max = maxIndex();
    if (index > max) index = max;
    if (index < 0) index = 0;

    track.style.transform = 'translate3d(' + (-index * step()) + 'px,0,0)';

    // Disabled rather than hidden, so the control does not shift sideways when
    // the user reaches an end.
    prev.disabled = index <= 0;
    next.disabled = index >= max;

    if (status) {
      var from = index + 1;
      var to = Math.min(cards.length, index + perView());
      status.textContent = 'Showing ' + from + '-' + to + ' of ' + cards.length;
    }
  }

  function go(delta) {
    var target = index + delta;
    if (target < 0 || target > maxIndex()) return;
    index = target;
    render();
  }

  prev.addEventListener('click', function () { go(-1); });
  next.addEventListener('click', function () { go(1); });

  /* Left/right arrows while a nav button has focus. The buttons are real
     buttons, so Enter and Space already work; this only adds the arrow keys
     that people expect from a slider. */
  rail.addEventListener('keydown', function (e) {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    var t = e.target;
    if (!t || (t.tagName !== 'BUTTON' && t.tagName !== 'A')) return;
    e.preventDefault();
    go(e.key === 'ArrowLeft' ? -1 : 1);
  });

  var pending = null;
  /* A resize changes --cat-per, which changes both the slide distance and the
     furthest valid index. Re-render at the current index rather than snapping
     back to the start: someone who has slid to the last category and then
     widens the window should still be looking at the last category. render()
     clamps index to the new max, so a narrow-to-wide change cannot leave the
     track parked off the end of its own content. */
  function onResize() {
    if (pending) clearTimeout(pending);
    pending = setTimeout(function () { pending = null; render(); }, 120);
  }
  window.addEventListener('resize', onResize);
  window.addEventListener('orientationchange', onResize);

  /* Reduced motion: jump rather than slide. The CSS already removes the
     transition, but skipping the intermediate states also avoids a visible
     sweep of every card on a slow device. */
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reduce && reduce.addEventListener) {
    reduce.addEventListener('change', function () { render(); });
  }

  /* Web fonts land after first paint and change the card width, so the slide
     distance measured during init is briefly wrong. Re-measure once loaded. */
  if (document.fonts && document.fonts.ready && document.fonts.ready.then) {
    document.fonts.ready.then(function () { render(); }).catch(function () {});
  }

  render();

  /* Late layout shifts (ads, images) can move the track; keep it honest. */
  if ('ResizeObserver' in window) {
    try {
      new ResizeObserver(function () { render(); }).observe(rail);
    } catch (err) {
      /* An observer that cannot be constructed is not worth failing over;
         the resize listener above already covers viewport changes. */
    }
  }
})();
