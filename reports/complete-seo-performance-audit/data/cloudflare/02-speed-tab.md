# 2. Speed tab — observations

## Dashboard state
`NOT VERIFIED (dashboard inaccessible)`. The Cloudflare Speed tab (including any performance insights, opportunity cards, "Observed metrics" table, test location/device selector and test timestamp) could not be opened. No recommendation from that tab is recorded here.

## Related historical field evidence (HISTORICAL — local doc)
From `DOCUMENTATION/CORE-WEB-VITALS-AND-SEO-OPTIMIZATION-REPORT.md`:
- Field LCP P75 540 ms, of which TTFB 453 ms (79%) and element render delay 124 ms (21%); resource load delay/duration 0 ms.
- Field LCP P99 2,704 ms (lines 51, 112–115).
- TTFB investigation, lines 119–143: all HTML `cf-cache-status: DYNAMIC` with `Cache-Control: public, max-age=0, must-revalidate`; static assets cached with HIT.
- Conclusion in that report: TTFB tail was attributed to the Cloudflare delivery path rather than repository origin code; an HTML Cache Rule was identified as a possible Cloudflare-side mitigation but was explicitly **not** enabled (requires approval).
- LCP element in local probes was H1 text; FCP == LCP (mobile 544 ms, desktop 268 ms in those probes). Lab Lighthouse LCP: homepage desktop 0.3 s, homepage mobile 1.2–1.4 s, tool mobile 0.9–1.0 s. Lab numbers are not field numbers.

### Historical live TTFB samples, 2026-11-18 (from same report, lines 123–137)
| Path | Median TTFB | Range | cf-cache-status |
|---|---:|---:|---|
| `/` | 41.5 ms | 37.5–114.3 ms | DYNAMIC |
| `/tools/` | 40.5 ms | 40.2–56.4 ms | DYNAMIC |
| `/resources/` | 49.4 ms | 37–52.3 ms | DYNAMIC |
| `/blog/` | 36.5 ms | 33–50.7 ms | DYNAMIC |
| `/tools/json-formatter/` | 35.4 ms | 32.5–39.6 ms | DYNAMIC |
| `/tools/pdf-merge/` | 34.5 ms | 32.3–37.6 ms | DYNAMIC |
| `/blog/how-to-count-words-and-characters` | 31.4 ms | 30.6–32.8 ms | DYNAMIC |
| `/assets/styles.css` | 10.3 ms | 8.1–12.2 ms | HIT (age 85032) |
| `/assets/app.js` | 8.2 ms | 7.9–10.3 ms | HIT (age 273082) |
| `/sitemap.xml` | 20.9 ms | 19.1–26.4 ms | DYNAMIC |
| `/robots.txt` | 8.2 ms | 7.7–9 ms | HIT (age 1) |

## Current live spot-check (VERIFIED live probe, 2026-11-23)
See `01-web-analytics.md` for sample table. Median TTFB from Karachi was ~290–340 ms on HTML, with occasional 700 ms samples and one 21.7 s connect failure. Not comparable to field percentiles.

## Suspected performance issues (evidence-backed, no changes made)
1. **HTML is not edge-cached**: `cf-cache-status: DYNAMIC`, `Cache-Control: public, max-age=0, must-revalidate` on `/` (VERIFIED 2026-11-23 10:27:15 UTC). This is consistent with the historical finding that a large share of field LCP P75 is TTFB. An HTML cache rule would be a dashboard change and was not made.
2. **`CLS 0.585` on `section.category-section.section > div.container` (user-supplied)** is a new element versus the historical `section.tool-stats-section` 0.152. Category-section layout needs field reproduction; no repository-side cause was established in this investigation.
3. **User-supplied page load 3,959 ms and TTFB 978 ms** are much worse than the historical field P75 and local probes, but the dashboard window/percentile basis could not be confirmed, so no root cause is asserted.
4. No Speed-tab recommendations can be confirmed or excluded without dashboard access.

## Authenticated dashboard addendum — supersedes `NOT VERIFIED` above

The Cloudflare Speed dashboard was opened and read in the main browser.

- P75 Core Web Vitals panels were present, but numeric values were not rendered in extractable text. No LCP/CLS/INP percentage from that panel is claimed.
- Real User Monitoring (last 24 h) showed: TTFB P75 **978 ms**, resource load delay **0 ms**, resource load duration **0 ms**, element render delay **219 ms**.
- INP sub-parts (last 24 h): input delay **1 ms**, processing **0 ms**, presentation **16 ms**.
- CLS explanatory section was present but did not fully render in extractable text.
- Cache hit ratio: Cloudflare **24.3%**, origin **75.7%**.
- No recurring synthetic tests were configured.
- One displayed suggestion: improve Smart Shield cache hit ratio. No change was made.

The earlier conclusion that HTML is `DYNAMIC` and not edge-cached remains valid from live probes. An HTML cache rule was not enabled; it would require explicit approval and purge/deploy planning.
