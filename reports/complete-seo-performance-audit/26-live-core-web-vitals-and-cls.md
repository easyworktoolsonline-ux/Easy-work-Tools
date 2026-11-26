# 26 — Live Core Web Vitals and CLS verification

Date: 2026-11-23  
Scope: production EasyWorkTools.online.  
Status: **mixed — category-specific controlled fix PASS, desktop lab CLS FAIL, field improvement UNVERIFIED**.

## 1. Field data baseline

User-supplied Cloudflare field data before deployment:

- LCP P50 `516 ms`, P75 `1,048 ms`, P90 `1,516 ms`
- INP: 100% good
- CLS: 75% good / 25% poor
- Page load `3,959 ms`
- TTFB P75 `978 ms`
- Cloudflare RUM TTFB breakdown: resource load delay `0 ms`, resource load duration `0 ms`, element render delay `219 ms`
- GSC CrUX: **not enough data** for mobile or desktop in the last 90 days
- PSI after deployment: **No Data** for field section on all tested URLs

Therefore, no post-deployment field CLS percentile is available. The requested real-user improvement cannot be confirmed yet.

## 2. Previously reported CLS element

Baseline element from Cloudflare data:

`html > body > main > section.category-section.section > div.container`

The controlled lab reproduction in `data/performance/cls-controlled-test.md` reproduced a large shift when `assets/categories.css` was delayed:

| Test | Category shift | Notes |
|---|---:|---|
| Before backup, delayed CSS | `0.9372985622476797` | Cards stacked before CSS, collapsed to one row after 5 s |
| After patch, delayed CSS | `0.03352221662359241` | Flex layout and 260 px rail reserved in critical CSS |
| Separate header/nav shift | `0.3941499006737055` | Present in both before and after runs; not the Cloudflare category element |

## 3. Post-deployment production DOM state

On `https://easyworktools.online/`:

- `.cat-rail` computed `min-height: 260px` — PASS
- `.cat-track` computed `display: flex` — PASS
- Inline critical CSS contains `.cat-track` and `min-height:260px` — PASS
- Hidden `#catSectionTitle` present — PASS

This confirms the reviewed implementation reached production. It does not measure field layout shifts.

## 4. Post-deployment PSI lab results

| URL | Form factor | CLS | Status |
|---|---|---:|---|
| `/` | Mobile | 0 | PASS |
| `/` | Desktop | **0.371** | **FAIL** |
| `/tools/` | Mobile | 0 | PASS |
| `/tools/` | Desktop | 0.006 | PASS |
| `/categories/image/` | Mobile | 0 | PASS |
| `/categories/image/` | Desktop | 0 | PASS |
| `/tools/mph-to-kph/` | Mobile | 0.004 | PASS |
| `/tools/mph-to-kph/` | Desktop | 0 | PASS |
| `/blog/mph-to-kph-explained` | Mobile | 0 | PASS |
| `/blog/mph-to-kph-explained` | Desktop | 0 | PASS |
| `/tools/ai-write/business-slogan-generator/` | Mobile | 0 | PASS |
| `/tools/ai-write/business-slogan-generator/` | Desktop | 0.005 | PASS |

Homepage desktop Performance was `74` and Agentic Browsing was `2/3`; the failed Agentic check was `Cumulative Layout Shift 0.371`.

## 5. Investigation of residual homepage desktop CLS

- The deployed change specifically reserves the category rail and inlines the flex track rules. The controlled test showed the category-related shift was reduced from `0.9373` to `0.0335`.
- The PSI desktop CLS remains `0.371`, close to the separately observed header/navigation shift `0.3941` in the controlled harness.
- The Lighthouse `Layout shift culprits` audit was in the passed/unscored section and contained no detailed source rows in the captured UI. The header/navigation hypothesis is therefore **not proven** by Lighthouse attribution.
- No font-loading, image-dimension, or dynamic-insertion defect was newly identified in this verification step. These remain **NOT TESTED** as individual causes of the residual desktop lab CLS.
- No code change was made for this residual issue during the approved deployment.

## 6. Other Core Web Vitals lab values

| URL / form factor | LCP | FCP | TBT | Speed Index |
|---|---:|---:|---:|---:|
| `/` mobile | 1.1 s | 1.1 s | 170 ms | 2.5 s |
| `/` desktop | 0.4 s | 0.4 s | 240 ms | 0.9 s |
| `/tools/` mobile | 1.2 s | 1.2 s | 0 ms | 1.3 s |
| `/tools/mph-to-kph/` mobile | 3.1 s | 3.1 s | 30 ms | 3.1 s |

INP was not displayed by PSI lab; Cloudflare field INP remains the available source.

## 7. Final status

- **PASS**: reviewed category CSS fix deployed and visible on production.
- **PASS**: controlled lab reproduction shows the category-rail shift reduction.
- **FAIL**: homepage desktop lab CLS `0.371` remains above the good threshold.
- **WARNING / UNVERIFIED**: no post-deployment field CLS data is available.
- **NOT TESTED**: root-cause attribution for residual desktop shift; font/image/dynamic-content causes individually.

Do not claim a real-user CLS win until new field data is available. No cache purge, indexing request, or additional code change was performed.
