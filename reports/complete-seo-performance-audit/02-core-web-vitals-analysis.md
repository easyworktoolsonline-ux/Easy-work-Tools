# 02 — Core Web Vitals Analysis

## 1. Field baseline

Source: user-supplied Cloudflare 24-hour field data, reproduced in `01-baseline-audit.md`; Cloudflare RUM dashboard was later read directly but its CLS numeric panel did not render in extractable text.

| Metric | Baseline | Status |
|---|---|---|
| LCP | Good 100%; P50 516 ms, P75 1,048 ms, P90/P99 1,516 ms | Good; preserve |
| INP | 100% good; input delay 1 ms, processing 0 ms, presentation 16 ms | Good; preserve |
| CLS | 75% good / 25% poor; shift score 0.585 | P0 failure |
| Shifted element | `html>body>main>section.category-section.section>div.container` | Category rail |
| TTFB | 978 ms | Investigate |
| Page load | 3,959 ms | Investigate |
| Resource load delay / duration | 0 ms / 0 ms | Not the LCP problem |

Authenticated Cloudflare RUM (last 24 h) showed TTFB P75 **978 ms**, resource load delay **0 ms**, resource load duration **0 ms**, element render delay **219 ms**, and INP sub-parts input delay **1 ms**, processing **0 ms**, presentation **16 ms**. The user-supplied element render delay was 71 ms; the difference is likely window/session variance and is recorded rather than reconciled.

GSC CrUX view: no mobile or desktop data in the last 90 days. Therefore GSC cannot confirm or contradict the Cloudflare field signal.

## 2. Root cause

The category carousel CSS lives in `assets/categories.css`, which is loaded asynchronously:

```html
<link rel="stylesheet" href="assets/categories.css" media="print" onload="this.media='all'">
```

The pre-existing `#ewtCriticalCss` block did not include `.cat-rail`, `.cat-track`, or `.cat-card` rules. Before the async stylesheet arrived:

- `.cat-track` computed `display:block`;
- `.cat-rail` had `min-height:0px`;
- cards stacked vertically, producing a very tall document;
- when `assets/categories.css` loaded, `.cat-track` became `display:flex` and the cards collapsed into one row, shifting the category container and everything below it.

This matches the Cloudflare-reported element path and the observed layout behaviour.

## 3. Controlled reproduction and fix proof

Evidence: `data/performance/cls-controlled-test.md`.

A local harness served the backup and patched `index.html` with `assets/categories.css` deliberately delayed by **5,000 ms**. All other assets loaded normally.

| Measurement | Backup | Patched |
|---|---:|---:|
| `.cat-track` at DOMContentLoaded | `display:block` | `display:flex` |
| `.cat-rail` min-height at DOMContentLoaded | `0px` | `260px` |
| First four card tops before CSS | stacked (`765, 1981, 3198, 4414`) | one row (`644,644,644,644`) |
| Document height before CSS | ≈90,642 px | ≈4,230 px |
| Category layout-shift value | **0.9372985622476797** | **0.03352221662359241** |
| Console errors | none | none |

The patched final state also had `.cat-track{display:flex;gap:18px}`, `.cat-rail{min-height:260px;height:260px}`, the hidden category heading, and no console errors.

This is a controlled lab reproduction and fix verification. It is **not** a field CWV claim.

## 4. Applied fix

File: `index.html`.

- Added the needed category carousel rules to the existing inline `#ewtCriticalCss` block (7,077 bytes).
- Added `.cat-rail{min-height:260px}` with responsive variants (250 px at ≤640 px, 260 px at ≤420 px).
- Added `.visually-hidden`.
- Added visible focus outlines for `.cat-card`, `.cat-card__main`, and `.cat-card__foot a`.
- Added `<h2 id="catSectionTitle" class="visually-hidden">Explore categories</h2>` so the existing `aria-labelledby` reference resolves to a heading.
- Kept `assets/categories.css` async with `<noscript>` fallback.

No JavaScript, route, URL, canonical, sitemap, or content removal was introduced.

## 5. Residual finding — separate from the reported P0

Both before and after runs in the synthetic focused-tab harness showed an early header/navigation shift of **0.3941499006737055** involving `MAIN`, `DIV.nav-search`, `NAV.nav-links`, and `BUTTON.theme-toggle`.

- It was present before and after the category fix.
- It is not the Cloudflare-reported category element.
- It was not changed in this patch.
- It needs separate field validation before any action; no speculative header change was made.

## 6. Lab checks and limits

- `npm.cmd run build`: exit 0.
- `npm.cmd run lint`: exit 0.
- Live Lighthouse audits on six URLs returned Accessibility 1, Best Practices 1, SEO 1, with no failures. The browser Lighthouse tool does **not** run a performance benchmark or emulate a device; no lab Performance score or CWV claim is made from it.
- Prior PSI (2026-11-21, not fresh): mobile Performance 0.88, desktop 0.98. A fresh PSI API request returned HTTP 429. No new PSI score is claimed.
- The homepage console showed two third-party ad-script errors (`ep2.adtrafficquality.google`, `pagead2.googlesyndication.com`) in the test browser path. No ad-script change was made.

## 7. Acceptance plan after deployment

1. Deploy only the reviewed `index.html` change after explicit approval.
2. Confirm production HTML contains `.cat-rail{min-height:260px}` and the hidden heading.
3. Monitor Cloudflare RUM / Speed for at least 7 days, segmented by device and country where available.
4. Acceptance target: category-attributed CLS ≤0.1 (stretch ≤0.05), with LCP P75 remaining <2.5 s and INP P75 <200 ms.
5. If CLS remains poor, collect field session details (device, viewport, ad state) before changing anything else; do not assume the synthetic header shift is the cause without field evidence.
