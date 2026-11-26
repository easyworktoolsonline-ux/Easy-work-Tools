# Controlled CLS reproduction and fix verification — 2026-11-23

## Purpose

Reproduce the Cloudflare field CLS signal at `html>body>main>section.category-section.section>div.container` under a deliberately delayed async stylesheet, then verify that the inline critical-CSS change in `index.html` removes the layout shift without changing URLs, markup order, or async CSS loading.

## Test harness

- Server: `_work/cls-test/cls-compare-server.mjs` (new audit-only helper; no production dependency).
- Endpoints:
  - `http://127.0.0.1:8798/before.html` — backup `index.html` from `C:\Users\ahmad\AppData\Local\Temp\opencode\ewt-full-backup-20261123-152231\index.html` (SHA-256 `595E71C8400B2894ADEB5F5C2A6C0C9D96DD335B7D284448FF6E3F14C2091800`).
  - `http://127.0.0.1:8798/after.html` — current working `index.html` (SHA-256 `BAB42B0C38394DC415FE7CFAEDCF67D34681C992A937B348F5D41CF4D63CBA7D`).
- Both served HTML files rewrite `assets/categories.css` to `/slow-categories.css`; the server delays that response by **5,000 ms**. All other assets are served normally from the working tree.
- A head script installs a `PerformanceObserver({type:'layout-shift', buffered:true})` and samples card geometry every 250 ms.
- Browser tab was focused before reload so layout-shift entries are emitted. Viewport reported by browser: 1000×700 CSS px at DPR 1 for the first static-server check; the focused controlled test used the browser's default desktop viewport.

## Before (backup) result

- At `DOMContentLoaded` (`t≈149–256 ms`): `.cat-track` computed `display:block`, `.cat-rail` `min-height:0px`.
- First four card tops were stacked vertically, e.g. `765, 1981, 3198, 4414` px in the focused run; document height ≈`90,642` px.
- At `t≈5,299–5,289 ms`, when the delayed CSS loaded, card tops collapsed to one row (`114,114,114,114` in focused run / `837,837,837,837` in unfocused run), document height dropped to ≈`4,115` / `7,245` px.
- Layout-shift entries:
  - category shift at `startTime≈5,117 ms`, value **0.9372985622476797**, sources included `DIV.container` (previous height 804 → 280) and `DIV.cat-viewport` (713 → 260).
  - An earlier header/navigation shift (`MAIN`, `DIV.nav-search`, `NAV.nav-links`, `BUTTON.theme-toggle`) was also observed; it is not the Cloudflare-reported category element and is recorded here as a separate residual finding.
- Console errors: none.

## After (patched) result

- At `DOMContentLoaded` (`t≈170 ms`): `.cat-track` computed `display:flex`, `.cat-rail` `min-height:260px`.
- First four card tops were already in one row (`644,644,644,644` in the focused run; `857,857,857,857` in the unfocused run), document height ≈`4,230` / `7,327` px.
- After delayed CSS loaded, card tops and document height stayed stable (`408,408,408,408`; height ≈`4,158`).
- Category layout-shift value dropped from **0.9373 → 0.0335** (`startTime≈5,082 ms`, sources `DIV.container`, `DIV.cat-viewport`, `SECTION.tool-stats-section`, `SECTION.section`).
- A separate early header/navigation shift of **0.3941** remains in this synthetic focused-tab harness; it is present in both before and after runs and is **not** the category-container defect. It needs separate field validation and was not changed in this patch.
- Console errors: none.

## Static-server final-state check (no artificial delay)

- `http://127.0.0.1:8793/` (patched): `.cat-track{display:flex;gap:18px}`, `.cat-rail{min-height:260px;height:260px}`, first four cards all at `top:837`, lefts `16,259,502,744`; hidden `<h2 id="catSectionTitle">Explore categories</h2>` present; no console errors.
- `http://127.0.0.1:8794/` (backup): `.cat-track{display:flex}` after normal CSS load, but `.cat-rail{min-height:0px}` and no `catSectionTitle` heading.

## Conclusion

The patch directly removes the measured category-rail collapse: the final flex layout is available in critical CSS and the rail reserves 260 px before the async stylesheet arrives. This is a **lab/controlled reproduction**, not a field-CWV claim. Production deployment and real-user validation remain pending approval.
