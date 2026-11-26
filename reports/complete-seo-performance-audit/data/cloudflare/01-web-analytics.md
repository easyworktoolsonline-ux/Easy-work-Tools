# 1. Web Analytics — observations

## Dashboard state
`NOT VERIFIED (dashboard inaccessible)`. The authenticated tab at `https://dash.cloudflare.com/fb2f20ffdfbfa4423c84e5c19fd92cd1/analytics/web` could not be read (browser disconnected — see `00-access-and-provenance.md`).

Consequently the following requested items have **no current data** in this report:
- date range / timezone selector actually selected in the dashboard
- traffic trend series (requests, pageviews, unique visitors)
- top paths, top referrers, top countries, device/browser breakdown
- bot-exclusion toggle state
- current Core Web Vitals pass-rate table and percentile panel with its displayed date range

## User-provided 24-hour numbers (given in the task, not independently verified)
| Metric | User-supplied value |
|---|---|
| LCP P50 | 516 ms |
| LCP P75 | 1,048 ms |
| LCP P90 | 1,516 ms |
| INP | 100% good |
| CLS | 75% good / 25% poor |
| CLS element | `html>body>main>section.category-section.section>div.container`, score 0.585 |
| Page load | 3,959 ms |
| TTFB | 978 ms |

## Historical Cloudflare field baseline (HISTORICAL — local doc, not current)
Source: `DOCUMENTATION/CORE-WEB-VITALS-AND-SEO-OPTIMIZATION-REPORT.md`, section 2, lines 40–76.
Stated provenance in that file: "Verbatim from the supplied Cloudflare Core Web Vitals report (last 30 days, timezone GMT+5, bot exclusion enabled)".

### LCP — 30-day field baseline
| Bucket / percentile | Value |
|---|---|
| Good | 95% |
| Needs Improvement | 5% |
| Poor | 0% |
| P50 | 500 ms |
| P75 | 540 ms |
| P90 | 860 ms |
| P99 | 2,704 ms |

LCP sub-parts at P75:
- Time to First Byte: 453 ms (79% of P75 LCP)
- Resource Load Delay: 0 ms
- Resource Load Duration: 0 ms
- Element Render Delay: 124 ms (21%)

### INP — 30-day field baseline
- Good 100%, Needs Improvement 0%, Poor 0%
- Input Delay 1 ms, Processing Duration 0 ms, Presentation Delay 32 ms

### CLS — 30-day field baseline
- Good 95%, Needs Improvement 5%, Poor 0%
- Cloudflare-identified element: `html>body>main>section.tool-stats-section`
- Score 0.152, occurrences 10

### Comparison, user-supplied 24 h vs historical 30-day field baseline
| Metric | 24 h (user) | 30-day baseline (historical) | Direction |
|---|---:|---:|---|
| LCP P50 | 516 ms | 500 ms | +16 ms (~3% worse) |
| LCP P75 | 1,048 ms | 540 ms | +508 ms (~1.94x worse) |
| LCP P90 | 1,516 ms | 860 ms | +656 ms (~1.76x worse) |
| LCP P99 | not supplied | 2,704 ms | unknown now |
| INP good | 100% | 100% | unchanged |
| CLS good | 75% | 95% | 20 pp worse |
| CLS poor | 25% | 0% | 25 pp worse |
| CLS element | `section.category-section.section > div.container`, 0.585 | `section.tool-stats-section`, 0.152 | different element and ~3.85x larger score |
| TTFB | 978 ms | 453 ms at P75 (percentile not stated for 978 ms) | substantially worse if same percentile basis |

Interpretation limits:
- 24 h and 30 days are different windows; a 24 h window is far more sensitive to a single region/device cohort or traffic mix change.
- The CLS element changed from a tool-stats section to a category-section container. The local investigation in the historical report found `section.tool-stats-section` was static server-rendered and could not reproduce its 0.152 field shift; a different element now points to category pages, which should be re-investigated with current field sessions (device, viewport, ad state).
- No claim is made that the supplied numbers are correct; they are reproduced as given.

## Live edge TTFB spot-check (VERIFIED live probe, NOT field percentiles)
Measured 2026-11-23 10:28–10:30 UTC from `curl.exe` in Karachi (`colo=KHI`), 5 samples per path, `time_starttransfer`:
| Path | Median | Range | Notes |
|---|---:|---:|---|
| `/` | 319.7 ms | 306.4–337.7 ms | all 200 |
| `/categories/` | 289.5 ms | 124.4–715.5 ms | one 715 ms sample |
| `/categories/image/` | 338.7 ms | 294.1–21,660.9 ms | one 21.7 s connect failure; excluded from median interpretation |
| `/tools/json-formatter/` | 326.5 ms | 323.4–704.9 ms | one 705 ms sample |

These single-location probes are **not** a substitute for Cloudflare field percentiles. They show no 978 ms median from this vantage point, but they do show occasional multi-hundred-ms and one catastrophic connect failure, consistent with network/colo variance. Compare with the historical local-origin probe set (31–49 ms median, 2026-11-18) in `02-speed-tab.md`.

## Authenticated dashboard addendum — supersedes `NOT VERIFIED` above

The Cloudflare dashboard was readable in the main browser during this audit.

### Cloudflare Web Analytics

- One site is configured: `easyworktools.online`.
- Last 24 h: **52 page views**, **49 visits**.
- The dashboard was read only; no site, filter, or date-range setting was changed.

### Cloudflare account analytics — last 7 days

| Metric | Value |
|---|---:|
| Requests | 66.85k |
| Bandwidth | 1.68 GB |
| Visits | 13.65k |
| 4xx responses | 28.48k (42.60%) |
| 5xx responses | 2 |
| Cache rate | 7.27% |
| Encrypted requests | 95.66% |

The unusually high 4xx share is recorded as an observation. It was not decomposed by path/status in the dashboard read, so no cause is asserted here.

### Speed / RUM visible in dashboard

- P75 Core Web Vitals panels exist, but their numeric values did not render in extractable text; no CLS/LCP/INP percentage is claimed from that panel.
- Last 24 h RUM sub-parts: TTFB P75 **978 ms**, resource load delay **0 ms**, resource load duration **0 ms**, element render delay **219 ms**.
- Last 24 h INP sub-parts: input delay **1 ms**, processing **0 ms**, presentation **16 ms**.
- CLS section did not fully render in DOM text; the user-supplied CLS 0.585 / 25% poor remains user-supplied evidence, not a dashboard transcription from this session.
- Cache hit ratio shown: Cloudflare **24.3%**, origin **75.7%**.
- No recurring synthetic tests were configured; one displayed suggestion was to improve Smart Shield cache hit ratio.

User-provided 24 h numbers remain as originally labelled. Authenticated dashboard access confirms the RUM panel exists and some sub-parts, but does not independently verify every user-supplied percentile.
