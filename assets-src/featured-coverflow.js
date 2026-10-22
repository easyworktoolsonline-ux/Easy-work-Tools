/* ======================================================================
 * "Featured Tools" 3D coverflow - homepage only.
 *
 * Loaded as its own deferred script from the build loader rather than folded
 * into assets/app.js, because the other 260-odd pages have no coverflow and
 * this would be dead weight on every one of them.
 *
 * HOW IT WORKS
 * Nine .cf-item elements are absolutely centred on top of each other. Each is
 * given a transform derived from its signed distance d from the active index:
 *
 *     translateX(d * step) rotateY(+-28deg * d) translateZ(-110 * |d|) scale(...)
 *
 * The viewport carries perspective, so the rotateY plus translateZ is what makes
 * the stack recede toward a vanishing point rather than merely scaling down.
 *
 * WHY THE SPACING IS CORRECTED EMPIRICALLY
 * Predicting the step analytically does not work here, and several attempts are
 * worth recording so nobody repeats them:
 *
 *  - getBoundingClientRect() on a rotateY'd card returns the AXIS-ALIGNED
 *    bounding box of the rotated shape, not the card's on-screen width. A tall
 *    card turned 28deg is far wider than it looks, and the box grows with the
 *    card's HEIGHT, so a card holding a three-line description is wider on
 *    screen than one holding a single line.
 *  - only part of a translateX reaches the screen: the perspective divide
 *    shrinks it (0.815 at 1440px with these settings).
 *  - reading a rect DURING the 420ms slide measures a mid-animation frame.
 *
 * So the step is measured after the slide has settled, and corrected by the exact
 * deficit until the neighbour's near edge clears the active card's far edge.
 * That converges in one or two passes and cannot be wrong at a width nobody
 * tested, because it reads the rendered result rather than predicting it.
 *
 * Cards beyond the visible window are removed from the accessibility tree, so a
 * keyboard user is not offered nine overlapping links for three visible cards.
 * ====================================================================== */
(function () {
  'use strict';

  var root = document.getElementById('featuredFlow');
  var track = document.getElementById('cfTrack');
  var viewport = document.getElementById('cfViewport');
  var prev = document.getElementById('cfPrev');
  var next = document.getElementById('cfNext');
  var status = document.getElementById('cfStatus');
  if (!root || !track || !viewport || !prev || !next) return;

  var items = Array.prototype.slice.call(track.querySelectorAll('.cf-item'));
  if (items.length < 2) return;

  /* Shape constants, in one place so paint() and the measuring code can never
     disagree about what transform a card is about to receive. */
  /* Tuned for a FOUR-deep fan rather than a single neighbour.
   *
   * Per-step values, so depth 4 is 4x these:
   *   ROT    15deg  -> 60deg at the back of the deck. The old 28deg/step would
   *                    turn the fourth card 112deg, i.e. edge-on and invisible.
   *   Z      40px   -> 160px back at depth 4. The old 110px/step would push it
   *                    440px back, and the perspective divide alone would shrink
   *                    it to 0.77 before any explicit scale was applied.
   *   SHRINK 0.08   -> 0.68 at depth 4.
   * LIFT and the explicit scale are the two depth cues that survive a narrow
   * frame; the Z and rotation cues fade as perspective tightens. */
  /* Per-step depth. At four deep these are 4x, so the fourth card sits at 60deg
   * of rotateY, 160px back, 0.68 scale.
   *
   * These were briefly flattened to 11deg / 27px / 0.055 on the theory that the
   * reference was a front-facing stack. The render disproved it: the side cards
   * became wide flat slabs, the icons were buried behind the next card and the
   * deck read as one solid block. The reference's outer card is about 50px wide
   * against a 192px card - an effective scale near 0.26 - and this set gives 0.34,
   * while the flattened one gave 0.56. The depth was right all along; the real
   * problem was only ever the step, which spread the cards across the frame. See
   * STEP_RATIO. */
  var ROT = 15;      /* degrees turned per step */
  var Z = 40;        /* px pushed back per step */
  var LIFT = 10;     /* px dropped per step */
  var SHRINK = 0.08; /* scale lost per step */

  /* How many cards each side of the active one are painted, at most. The row is
   * nine long, so the middle of the run gives the full 4 + 1 + 4. */
  var SHOW = 4;

  /* The step, as a fraction of the card's own width.
   *
   * Deriving the step from the card rather than from the frame decouples the two:
   * changing the card width no longer changes how far apart the cards sit, and
   * changing the frame no longer changes the overlap - only the DEPTH falls away
   * as the frame narrows.
   *
   * 0.63 on a 192px card is a 121px step, which measures a 751px deck against the
   * reference's 736px, with the icons on each side card still visible. That was
   * first derived from the frame (room / fanCount) and happened to land here once
   * the card shrank from 200px to 192px. 0.45 was tried in between and was wrong:
   * a 479px deck, every icon buried behind the next card. */
  var STEP_RATIO = 0.63;

  /* Minimum centre-to-centre spacing, below which a card stops reading as its own
   * card. The fan then steps back a card at a time rather than cramming, so a
   * narrow screen degrades to 3, then 2, then 1 per side, and finally to the
   * active card alone. */
  var MIN_STEP = 46;

  var GAP = 10;      /* px of clear air wanted between cards */
  var MAX_PASSES = 4;

  /* WHICH CARD IS ACTIVE ON ARRIVAL
   *
   * The middle of the run, not the first. The deck is nine wide and the design is a
   * symmetric 4 + 1 + 4 fan - and a fan can only be symmetric if the active card is
   * the one with neighbours on BOTH sides. Starting at 0 left the active card dead
   * centre of the frame but hard against the LEFT END of the cascade: zero cards to
   * its left, every one of the other eight to its right, and #cfPrev disabled and
   * greyed out. The card was centred; the deck was not. That is what read as
   * "left-aligned".
   *
   * For nine cards the middle is index 4, and that is not an arbitrary pick: the
   * ninth pick is one per category and index 4 is the Text Tools card, which is
   * precisely the card the reference shows active. The four to its left are AI
   * Write, Image, Developer and SEO; the four to its right are PDF, Calculator,
   * Utility and Converter - one from each remaining category, so the fan reads as
   * the full set of nine with no category repeated.
   *
   * floor(length / 2) rather than a hard-coded 4, so the fan still centres itself if
   * a future pass ships a different number of picks. With an even count there is no
   * exact middle, and floor puts the extra card on the right, which is the side the
   * next arrow travels towards.
   */
  var index = Math.floor(items.length / 2);
  var stepPx = 0;        /* translateX between neighbouring card centres */
  /* Off for the first frame, on once solve() has measured. The first paint is
     therefore the active card alone, which cannot overlap or spill. */
  var fanCount = 0;   /* cards painted per side, 0..SHOW */
  var solved = false;
  var pass = 0;
  var settleTimer = null;
  var generation = 0;    /* invalidates stale settle checks after a resize/click */

  /* The frame the fan lives in, measured. */
  function frameWidth() {
    return viewport.getBoundingClientRect().width || 1160;
  }

  /* The card's LAYOUT width, not its rendered width.
   *
   * offsetWidth is used deliberately. getBoundingClientRect().width was wrong
   * here: items[0] is not the active card once the visitor has moved along the
   * run, and a non-active card is parked at scale(.62) and turned 28deg, so its
   * rendered width is neither the layout width nor the rotated width the
   * clearance maths needs. offsetWidth ignores transforms entirely. */
  function cardWidth() {
    var el = items[index] || items[0];
    return (el && el.offsetWidth) || 300;
  }

  /* The transform for a card ad steps away, x px from the active one. */
  function transformAt(x, ad) {
    return 'translate(-50%,-50%) translateX(' + x + 'px)' +
      ' rotateY(' + (ad * ROT * (x < 0 ? -1 : 1)) + 'deg)' +
      ' translateZ(' + (-ad * Z) + 'px)' +
      ' translateY(' + (ad * LIFT) + 'px)' +
      ' scale(' + (1 - ad * SHRINK) + ')';
  }

  /* Solves the step by measuring EDGES, not by predicting geometry.
   *
   * Four attempts at predicting the spacing analytically are worth recording,
   * because each failed for a reason that is not obvious:
   *
   *  1. getBoundingClientRect().width on a rotateY'd card is the AXIS-ALIGNED
   *     bounding box of the rotated shape, not the card's width. A tall card
   *     turned 28deg is far wider than it looks, and it grows with the card's
   *     HEIGHT - so a card with a three-line description is wider on screen
   *     than one with a single line.
   *  2. Only part of a translateX reaches the screen, because the neighbour is
   *     also pushed back on Z and turned on Y and the perspective divide
   *     shrinks all three together. The ratio is not a constant: deriving it
   *     from the bbox CENTROID gave 0.57 at every width, including across
   *     three different perspective values, which cannot be right - a rotated
   *     plane's projected centroid is not the projection of its centre.
   *  3. Reading a rect DURING the 420ms slide measures a mid-animation frame,
   *     so the correction was non-deterministic.
   *  4. Correcting after the fact meant visitors - and axe, which measures
   *     seconds after load - saw overlapping cards for the first second or two.
   *
   * So the step is solved by putting a neighbour at a KNOWN translateX under
   * its real target transform and reading where its near edge actually landed
   * relative to the active card's far edge. Both rects are measured the same
   * way, so no projection model is needed and none of the above can bite.
   *
   * The first paint shows the active card ALONE, which is correct at every
   * width by construction. The fan is enabled immediately afterwards, so no
   * visitor and no automated check ever sees a broken intermediate state. */
  /* The offset solve() starts from. Any value works - it is corrected by
     iteration - but it should be in the right neighbourhood so the first
     correction is small. */
  var PROBE = 300;

  var SOLVE_PASSES = 6;

  /* Where a neighbour sits when placed at offset x under its real target
   * transform, relative to the active card. All viewport coordinates, all
   * read from live rects with transitions suppressed.
   *
   * dir is +1 for a right-hand neighbour and -1 for a left-hand one, so the
   * caller can reason about both with the same expressions.
   *
   *   inner  - the neighbour edge FACING the active card
   *   outer  - the neighbour edge facing AWAY from it
   *   activeEdge - the active card edge facing the neighbour
   */
  function measureAt(x) {
    var nb = items[index + 1] || items[index - 1];
    var act = items[index];
    if (!nb || !act) return null;
    var dir = items[index + 1] ? 1 : -1;
    var savedT = nb.style.transform;
    var savedO = nb.style.opacity;
    nb.style.transition = 'none';
    nb.style.transform = transformAt(dir * x, 1);
    nb.style.opacity = '1';
    var q = nb.getBoundingClientRect();
    nb.style.transform = savedT;
    nb.style.opacity = savedO;

    /* The active card is neutralised before its rect is read, because when
       solve() runs after an arrow click the card that has just become active
       is still carrying its PREVIOUS transform - offset to one side and turned
       28deg. Reading it then gave the far edge of a card that was not yet
       where it was about to be painted, so every measurement was wrong and
       the safety net dropped the neighbours on the second click onwards.
       Measuring it centred is what the layout will actually be. */
    var savedA = act.style.transform;
    act.style.transition = 'none';
    act.style.transform = 'translate(-50%,-50%)';
    var ar = act.getBoundingClientRect();
    act.style.transform = savedA;
    act.style.transition = '';

    return dir > 0
      ? { dir: dir, inner: q.left, outer: q.right, activeEdge: ar.right }
      : { dir: dir, inner: q.right, outer: q.left, activeEdge: ar.left };
  }

  /* Solves the step and the deck depth from the card size and the frame.
   *
   * Runs BEFORE the first paint, so the carousel never appears in a wrong state.
   * That matters more than it looks: an earlier version started from a rough guess
   * and corrected itself over the following ~2s, which meant visitors - and axe,
   * which measures seconds after load - saw overlapping cards first.
   *
   * It solves once rather than iterating. An intermediate version widened the step
   * until the nearest neighbour CLEARED the active card; that target is right for a
   * single neighbour and wrong for a deck, because in a fan the neighbours are
   * meant to sit over the active card - which is safe, since the active card is
   * drawn on top by z-index. It also had to iterate, because the mapping from
   * translateX to on-screen position is PROJECTIVE, not linear: a card pushed back
   * on Z and turned on Y does not move a constant number of pixels per pixel of
   * translateX.
   *
   * The invariants now are:
   *   1. the active card is on top         -> z-index, set in paint()
   *   2. the outermost card stays in frame -> fanCount from the measured room
   *   3. every card reads as its own card  -> the step comes from the card width
   *
   *   step     = cardWidth * STEP_RATIO
   *   room     = half the frame less half the active card
   *
   * The step is a property of the card, not of the frame, so the deck keeps the same
   * shape at every width and only the DEPTH falls away as the frame narrows. Where
   * the reference ratio will not fit even one neighbour the step is squeezed to
   * exactly fill the room and a single neighbour is kept, because a deck of two
   * beats a lone card; below MIN_STEP that stops being possible and the active card
   * stands alone. Measured depth: 4 per side at 1440, 3 at 1024, 2 at 768, and
   * 1 + 1 + 1 down to 320px.
   *
   * measureAndCorrect() below remains the safety net for later reflows. */

  function solve() {
    var cw = cardWidth();
    var fb = viewport.getBoundingClientRect();
    var halfFrame = (fb.width || 1160) / 2;
    var room = halfFrame - cw / 2;
    var step = cw * STEP_RATIO;

    /* Below MIN_STEP a card stops reading as its own card, so the step is floored
       and it is the DEPTH that gives way - never the overlap. */
    if (step < MIN_STEP) step = MIN_STEP;

    if (room >= step) {
      /* The reference ratio fits: take as many as will go, up to SHOW. */
      fanCount = Math.min(SHOW, Math.floor(room / step));
    } else if (room >= MIN_STEP) {
      /* Not even ONE neighbour at the reference ratio. Tighter than the reference
       * wants, but a deck of two beats a lone card - and this is what the
       * frame-derived solve used to do implicitly.
       *
       * Without it a 412px phone fell to 0 neighbours, because 168 * 0.63 = 106px
       * is wider than the 103px of room either side of a 168px card there. The
       * previous pass measured 1 + 1 + 1 at that width; losing it was a
       * regression, not a trade. The step is squeezed to exactly fill the room
       * rather than the neighbours being dropped. */
      step = room;
      fanCount = 1;
    } else {
      /* Genuinely too narrow for a neighbour: the active card alone, which is
         always correct. The arrows still move between all nine tools. */
      fanCount = 0;
    }

    stepPx = step;
  }
  function paint() {
    var s = stepPx;
    for (var i = 0; i < items.length; i++) {
      var d = i - index;
      var ad = Math.abs(d);
      /* ad > 0 matters: when the deck is dropped entirely (fanCount 0), the active
         card must still go through the painted branch. Testing "fanCount <= 0" alone
         sent the ACTIVE card down the parked branch too, leaving the whole
         section with every card at opacity 0 on a narrow screen - the carousel
         rendered completely blank. */
      if (ad > fanCount) {
        /* Parked well clear of the frame and fully transparent. Same sign
           convention as the visible branch, so a card slides through the
           boundary rather than jumping.
         *
         * The offset is derived from the FRAME, not from the step. It used to be
         * step * 2.6, and on a narrow screen the step has been inflated by the
         * clearance correction (to 684px at 414px wide), which put a parked card
         * 1778px out - far enough to look right, but only by luck of the
         * arithmetic: at other widths the same formula left a parked card with a
         * 224x10px sliver still inside the viewport. axe then failed the page on
         * target-size, reporting that sliver as a partially obscured touch
         * target. Deriving the offset from the frame clears it by construction at
         * every width. */
        var park = frameWidth() + cardWidth() + 200;
        items[i].style.transform = 'translate(-50%,-50%) translateX(' + (d * park) +
          'px) rotateY(' + (d * ROT) + 'deg) translateZ(-900px) scale(.62)';
        items[i].style.opacity = '0';
        items[i].style.pointerEvents = 'none';
      } else {
        items[i].style.transform = transformAt(d * s, ad);
        /* Full opacity, deliberately.
         *
         * This used to fade the side cards to 0.70 to suggest depth. On the
         * dark band that was fine, because the text was bright cyan on near
         * black and had contrast to spare. On a WHITE background fading the
         * card blends its text toward white as well, and axe-core measured the
         * side cards' category label, description and CTA at about 3.0:1
         * against a 4.5:1 requirement - a serious violation, and one that only
         * appeared at desktop widths, where the side cards render. Dimming body
         * text to imply depth is a legibility problem in any theme, so the
         * depth is carried by the ring, glow, shadow and 3D rotation instead,
         * and the text stays fully legible.
         *
         * Only the PARKED cards go transparent, and they are off-frame and
         * aria-hidden, so nothing readable is affected. */
        items[i].style.opacity = '1';
        items[i].style.pointerEvents = ad === 0 ? 'auto' : 'none';
      }
      /* Stacking order for the deck: the active card on top, then each nearer
       * card over the ones behind it. The DOM order would otherwise decide, and
       * paint() writes the cards in index order, so without this the card that
       * happens to come later in the document wins - which puts card 9 over card
       * 1 and, at some indices, over the active card itself.
       *
       * Inline, not CSS: .cf-item[data-active="true"]{z-index:2} exists but has
       * no !important, so an inline z-index beats it. */
      items[i].style.zIndex = ad === 0 ? (SHOW + 2) : (SHOW + 1 - ad);

      /* --cf-glow drives the rim light and the teal bloom; 1 at centre. */
      items[i].style.setProperty('--cf-glow', ad === 0 ? '1' : '0');
      if (ad === 0) items[i].setAttribute('data-active', 'true');
      else items[i].removeAttribute('data-active');
      /* Depth drives what the card shows. Non-active cards are icon-only: at four
         per side each one is half-covered by its neighbour, so any text would be
         a chopped fragment - "Online T", "JSON Fo" - which reads as broken layout
         rather than as depth. The stylesheet keys off this; JS only reports the
         number. Written on every frame including the parked ones, so a card that
         slides back out of the deck sheds its icon-only state on the way. */
      items[i].setAttribute('data-depth', String(ad));
    }
    prev.disabled = index === 0;
    next.disabled = index === items.length - 1;

    /* A disabled button cannot hold focus. When the arrow the visitor is standing on
       becomes disabled - which is exactly what pressing Home, or walking to either
       end of the run, does - the browser drops focus to <body>. <body> is outside
       #featuredFlow, so the keydown guard below rejects it and EVERY arrow key from
       that point on is silently dropped: End did nothing, Left did nothing, and the
       deck looked frozen to anyone not using a mouse.
       *
       * Measured: focus cfPrev, press Home, and document.activeElement goes from
       * BUTTON#cfPrev to BODY, after which End leaves the index at 0.
       *
       * So hand focus to the arrow that is still enabled. This keeps the disabled
       * attribute - and with it the greyed styling and the removal from the tab
       * order, both of which are deliberate - rather than swapping to aria-disabled,
       * which would keep the dead control in the tab sequence. */
    var focused = document.activeElement;
    if (focused === prev && prev.disabled && !next.disabled) next.focus();
    else if (focused === next && next.disabled && !prev.disabled) prev.focus();
    syncA11y();
    scheduleSettle();
  }

  /* After the 420ms slide has finished, compare the active card's far edge with
     each neighbour's near edge, using real rects. If a neighbour is still on top
     of it, widen the step by exactly that much plus the wanted gap and repaint.
     Bounded by MAX_PASSES, and by dropping the neighbours entirely if the frame
     is simply too narrow to hold them without a collision. */
  /* Safety net for later reflows: a resize, or a webfont swap that changes the
   * card height.
   *
   * The invariant is NO SPILL, not no overlap. The previous version widened the
   * step until the nearest neighbour cleared the active card, which is the right
   * target for a single neighbour and the wrong one for a deck - the neighbours
   * are meant to overlap each other and the active card, which is drawn on top.
   * What must never happen is the outermost card running past the frame, so that
   * is what is measured, on both sides, against real rects.
   *
   * Real rects and not arithmetic, because a rotateY'd card's bounding box is
   * WIDER than the card itself and grows with its HEIGHT - a card with a
   * three-line description is wider on screen than one with a single line. Only
   * a measured rect settles that, which is why solve() treats its own arithmetic
   * as a first guess and this function as the authority.
   *
   * Overflow is reduced by pulling the step in, not by dropping the fan: the
   * deck was asked for, and a few pixels of tightening is invisible where losing
   * four cards is not. Only if it cannot be made to fit at all does it fall back. */
  /* Safety net for later reflows: a resize, or a webfont swap that changes the
   * card height.
   *
   * The invariant is NO SPILL, not no overlap. The previous version widened the
   * step until the nearest neighbour cleared the active card, which is the right
   * target for a single neighbour and the wrong one for a deck - the neighbours
   * are meant to overlap each other and the active card, which is drawn on top.
   *
   * READING THE EXTENT - why the bounding box is not enough
   * ------------------------------------------------------
   * The obvious implementation is getBoundingClientRect().right against the frame
   * edge, and it is wrong here. For a rotateY'd element the rect is the AXIS-ALIGNED
   * bounding box of the rotated shape, not the card's own width. The depth-4 card
   * is 262px tall, scaled 0.68 and turned 60deg, so its box comes to
   *
   *     192*0.68*cos(60)  +  262*0.68*sin(60)  =  65 + 154  =  219px
   *
   * while the card's real on-screen extent is 192*0.68*cos(60) = 65px. The extra
   * 154px is transparent corner. Measured that way every outer card "spills", the
   * step is pulled in pass after pass, and the deck collapses from 756px to 479px
   * before fanCount starts being dropped.
   *
   * So the extent is computed from the card's own geometry - offsetWidth, the
   * scale and the rotation, all of which are in its inline transform - and the
   * bounding box is used only to locate the centre. The same trap is recorded at
   * the top of this file, where it is why solve() probes a neighbour under its
   * real target transform rather than predicting geometry. */
  function measureAndCorrect(myGeneration) {
    if (myGeneration !== generation) return;
    if (!solved) return;
    if (fanCount <= 0) return;
    var vb = viewport.getBoundingClientRect();
    var EDGE = 2;   /* px of tolerance, so a sub-pixel edge is not treated as a spill */

    var over = 0;
    for (var side = -1; side <= 1; side += 2) {
      for (var d = fanCount; d >= 1; d--) {
        var el = items[index + side * d];
        if (!el) continue;

        /* the card's real horizontal extent, not its bounding box */
        var st = el.style.transform || '';
        var mScale = /scale\((-?[\d.]+)\)/.exec(st);
        var mRot = /rotateY\((-?[\d.]+)deg\)/.exec(st);
        var scale = mScale ? Math.abs(parseFloat(mScale[1])) : 1;
        var rot = mRot ? parseFloat(mRot[1]) : 0;
        var half = (el.offsetWidth / 2) * scale * Math.abs(Math.cos(rot * Math.PI / 180));

        /* the bounding box is still the right thing for WHERE the centre is */
        var q = el.getBoundingClientRect();
        var centre = q.left + q.width / 2;

        var spill = side > 0
          ? (centre + half) - (vb.right - EDGE)
          : (vb.left + EDGE) - (centre - half);
        if (spill > over) over = spill;
        break;               /* only the outermost existing card can spill */
      }
    }

    if (over <= 0) { pass = 0; return; }

    if (pass >= MAX_PASSES) {
      /* Genuinely cannot fit: drop one card from the deck rather than smear. */
      fanCount = Math.max(0, fanCount - 1);
      pass = 0;
      solve();
      paint();
      return;
    }
    pass += 1;
    stepPx = Math.max(MIN_STEP, stepPx - over);
    paint();
  }
  function scheduleSettle() {
    var my = ++generation;
    if (settleTimer) clearTimeout(settleTimer);
    /* Past the 420ms transition, so the rects describe the resting layout. */
    settleTimer = setTimeout(function () { measureAndCorrect(my); }, 520);
  }

  /* Only the visible cards stay in the accessibility tree. Without this a
     keyboard or screen-reader user meets nine overlapping links where three are
     visible, and the arrows appear to do nothing because focus never reaches the
     card that just came into view. */
  function syncA11y() {
    for (var i = 0; i < items.length; i++) {
      var visible = fanCount > 0 && Math.abs(i - index) <= 1;
      var link = items[i].querySelector('a');
      if (link) {
        if (visible) link.removeAttribute('tabindex');
        else link.setAttribute('tabindex', '-1');
      }
      items[i].setAttribute('aria-hidden', visible ? 'false' : 'true');
    }
    var title = items[index] && items[index].querySelector('.cf-card__title');
    if (status) {
      status.textContent = (title ? title.textContent.trim() : '') +
        ', ' + (index + 1) + ' of ' + items.length;
    }
  }

  function go(nextIndex) {
    var n = Math.max(0, Math.min(items.length - 1, nextIndex));
    if (n === index) return;
    index = n;
    /* Re-solve for the cards now adjacent. Their heights differ, so their
       rotated widths differ, and whether a neighbour fits at all depends on
       which two they are - so the decision is taken afresh per position rather
       than inherited from the previous one. */
    /* Re-solve per position: the two adjacent cards differ in height, and
       therefore in rotated width, so whether a neighbour fits at all depends
       on which two they are. */
    if (pass === 0 && solved) solve();
    paint();
  }

  prev.addEventListener('click', function () { go(index - 1); });
  next.addEventListener('click', function () { go(index + 1); });

  /* Keyboard: arrows move the carousel, Home/End jump to the ends. Bound to the
     section, not to root, because root is not focusable - and at the two ends of
     the run the arrow the visitor would press is disabled and cannot take focus,
     so a listener on root silently stopped working there. */
  var section = document.getElementById('featured');
  (section || root).addEventListener('keydown', function (e) {
    if (!root.contains(e.target)) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); go(index + 1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); go(index - 1); }
    else if (e.key === 'Home') { e.preventDefault(); go(0); }
    else if (e.key === 'End') { e.preventDefault(); go(items.length - 1); }
  });

  /* Anything that reflows the row invalidates the step: a resize across a
     breakpoint, or a late webfont swap changing the card heights. */
  var raf = null;
  function reset() {
    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(function () {
      raf = null;
      pass = 0;
      fanCount = 0;
      items.forEach(function (el) { el.style.transition = 'none'; });
      solved = true;
      solve();
      paint();
      /* restore on the next frame so later arrow moves still animate */
      requestAnimationFrame(function () {
        items.forEach(function (el) { el.style.transition = ''; });
      });
    });
  }
  window.addEventListener('resize', reset, { passive: true });
  window.addEventListener('orientationchange', reset);
  if (document.fonts && document.fonts.ready && document.fonts.ready.then) {
    document.fonts.ready.then(reset);
  }

  /* Setup frame: no transitions, so the cards land directly in their final
     positions instead of animating in from the stacked CSS default. */
  items.forEach(function (el) { el.style.transition = 'none'; });
  solved = true;
  solve();
  paint();
  requestAnimationFrame(function () {
    items.forEach(function (el) { el.style.transition = ''; });
  });
})();