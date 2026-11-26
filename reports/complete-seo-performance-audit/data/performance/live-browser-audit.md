# Live browser, console, resource, and Lighthouse audit — 2026-11-23

Scope: production `https://easyworktools.online` only. Six representative URLs were loaded in a dedicated desktop browser tab. The audit was read-only: no forms were submitted, no cache was purged, and no settings were changed.

## Method and limits

- Browser: connected Chromium desktop session, default desktop viewport (no device emulation).
- `browser.lighthouse` audits the current tab for **Accessibility, Best Practices, and SEO**. The tool explicitly **does not emulate a device or run a performance benchmark**; no Lighthouse Performance score or CWV score is claimed from it.
- Console messages at `warning` level or higher were captured for the current document. Third-party ad/challenge warnings are reported as observations, not as site defects without further evidence.
- The browser network-list tool failed with `Expected JSON value` on these pages. As a fallback, `PerformanceResourceTiming.responseStatus` was used to check same-document resource responses. This is a partial substitute: it does not capture every request detail or pre-document failure.
- Raw Lighthouse JSON reports were copied to `data/performance/lighthouse/`.

## Results

| URL | H1 | Canonical | JSON-LD blocks | Images missing alt | Lighthouse A / BP / SEO | Console ≥warning | Resource 4xx/5xx | Navigation duration (ms) |
|---|---|---|---:|---:|---:|---:|---:|---:|
| `/` | Free Tools to Make Business Simple | self | 2 | 0 | 1 / 1 / 1 | 2 | 0 | 801 |
| `/categories/image/` | Image Tools | self | 1 | 0 | 1 / 1 / 1 | 0 | 0 | 381 |
| `/tools/json-formatter/` | JSON Formatter & Validator | self | 3 | 0 | 1 / 1 / 1 | 0 | 0 | 335 |
| `/tools/mph-to-kph/` | MPH to KPH Converter | self | 3 | 0 | 1 / 1 / 1 | 0 | 0 | 821 |
| `/blog/mph-to-kph-explained` | MPH to KPH: Road-Speed Conversion Explained | self | 3 | 0 | 1 / 1 / 1 | 0 | 0 | 706 |
| `/about` | About EasyWorkTools.online | self | 2 | 0 | 1 / 1 / 1 | 0 | 0 | 336 |

All six pages had `robots: index,follow` (the blog page additionally included `max-image-preview:large,max-snippet:-1,max-video-preview:-1`) and a valid viewport declaration. No Lighthouse SEO/accessibility/best-practices failures were reported for any of the six pages.

## Console observations

- Homepage only:
  - `Failed to load resource: net::ERR_TUNNEL_CONNECTION_FAILED` from `https://ep2.adtrafficquality.google/sodar/sodar2.js`.
  - `Uncaught (in promise) undefined` from `https://pagead2.googlesyndication.com/.../show_ads_impl_fy2021.js`.
  - These are third-party ad-script errors in the test browser path. They are recorded as residual observations; no ad script or CSP change was made in this audit.
- The five other representative pages had no console messages at warning level or above.
- The earlier ToolsZen login tab (not an EasyWorkTools page) showed Turnstile/CSP warnings; it is excluded from the site results above.

## CLS-fix deployment state observed live

On production `/`:

- `.cat-track` computed style: `display: flex`, `gap: 18px` — async category CSS had loaded by the time of inspection.
- `.cat-rail` computed style: `min-height: 0px` — the local CLS fix (`.cat-rail{min-height:260px}`) is **not yet deployed** to production at the time of this check.
- Therefore the controlled before/after evidence in `cls-controlled-test.md` remains local/pre-deployment proof. No field CLS improvement is claimed from this live check.

## Navigation timing observations (single-session, not field percentiles)

- Response start ranged from 67 ms to 546 ms; full navigation duration ranged from 335 ms to 821 ms across the six URLs in this browser session.
- These numbers are not comparable to Cloudflare RUM P75 TTFB (978 ms) or user-supplied field percentiles because of different vantage point, sample size, cache state, and bot/network conditions.
- A fresh PageSpeed Insights API request earlier returned HTTP 429, so no new PSI score is claimed.

## Raw report files

Copied Lighthouse JSON reports:

- `data/performance/lighthouse/home.json`
- `data/performance/lighthouse/category-image.json`
- `data/performance/lighthouse/tool-json-formatter.json`
- `data/performance/lighthouse/tool-mph-to-kph.json`
- `data/performance/lighthouse/blog-mph-to-kph-explained.json`
- `data/performance/lighthouse/about.json`
