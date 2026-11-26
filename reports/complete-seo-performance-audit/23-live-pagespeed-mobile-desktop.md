# 23 — Live PageSpeed Insights: mobile and desktop

Date: 2026-11-23  
Tool: PageSpeed Insights UI, production URLs, Lighthouse 13.6.0.  
Scope: EasyWorkTools.online production only.  
Status: **PASS for most sampled URLs; WARNING/FAIL items recorded below**.

## 1. Method and interpretation

- Each URL was tested with Mobile and Desktop form factors in the authenticated browser session.
- PageSpeed Insights field section returned **No Data** for every tested URL. All scores below are **lab data**, not real-user field data.
- PSI scores are not proof that every individual failed audit passed; warnings and low sub-scores are listed separately.
- The PSI API returned HTTP 429/quota exceeded, so the evidence is from the PSI web UI rather than the API.
- No career/resume URL was tested because no such URL was discovered in the sitemap or manifests; this is **NOT TESTED**, not a pass.

## 2. Results

| URL | Form factor | Perf | A11y | Best Practices | SEO | Agentic | FCP | LCP | TBT | CLS | Speed Index |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| `/` | Mobile | 98 | 100 | 100 | 100 | 3/3 | 1.1 s | 1.1 s | 170 ms | 0 | 2.5 s |
| `/` | Desktop | **74** | 100 | 100 | 100 | **2/3** | 0.4 s | 0.4 s | 240 ms | **0.371** | 0.9 s |
| `/tools/` | Mobile | 100 | 100 | 100 | 100 | 3/3 | 1.2 s | 1.2 s | 0 ms | 0 | 1.3 s |
| `/tools/` | Desktop | 98 | 100 | 100 | 100 | — | — | — | — | 0.006 | — |
| `/categories/image/` | Mobile | 100 | 100 | 100 | 100 | — | — | — | — | 0 | — |
| `/categories/image/` | Desktop | 100 | 100 | 100 | 100 | — | — | — | — | 0 | — |
| `/tools/mph-to-kph/` | Mobile | **88** | 100 | 100 | 100 | 3/3 | 3.1 s | 3.1 s | 30 ms | 0.004 | 3.1 s |
| `/tools/mph-to-kph/` | Desktop | 100 | 100 | 100 | 100 | — | — | — | — | 0 | — |
| `/blog/mph-to-kph-explained` | Mobile | 100 | 100 | 100 | 100 | — | — | — | — | 0 | — |
| `/blog/mph-to-kph-explained` | Desktop | 99 | 100 | **96** | 100 | — | — | — | — | 0 | — |
| `/tools/ai-write/business-slogan-generator/` | Mobile | 100 | 100 | **96** | 100 | — | — | — | — | 0 | — |
| `/tools/ai-write/business-slogan-generator/` | Desktop | 100 | 100 | 100 | 100 | — | — | — | — | 0.005 | — |

A dash means the value was not recorded in the captured evidence. Absence of a recorded score is not a pass.

## 3. Report timestamps captured from PSI UI

- Homepage mobile: `Report from Nov 23, 2026, 4:41:55 PM`; captured `4:41 PM GMT+5`.
- Homepage desktop: `Report from Nov 23, 2026, 4:42:57 PM`; captured `4:43 PM GMT+5`.
- `/tools/` mobile: `Report from Nov 23, 2026, 4:44:34 PM`; captured `4:44 PM GMT+5`.
- Remaining reports were captured in the same sequence between approximately `4:44 PM` and `4:46 PM GMT+5`.

Exact PSI report URLs captured for the homepage:

- Mobile: `https://pagespeed.web.dev/analysis/https-easyworktools-online/3l098vmgzw?form_factor=mobile`
- Desktop: `https://pagespeed.web.dev/analysis/https-easyworktools-online/6q2hulft18?form_factor=desktop`

## 4. Failed and warning audits

### Homepage desktop — FAIL / WARNING

- **FAIL:** Performance `74`, driven primarily by CLS `0.371`.
- **FAIL:** Agentic Browsing `2/3`; the failed check was `Cumulative Layout Shift 0.371`.
- **Passed but relevant diagnostics:** FCP `0.4 s`, LCP `0.4 s`, Speed Index `0.9 s`, Server responds quickly (observed 7 ms), text compression applied.
- **Unscored diagnostic:** `Layout shift culprits` had no detailed culprit rows in the captured UI. The controlled test in `data/performance/cls-controlled-test.md` points to a residual header/navigation shift present before and after the category fix; this is a hypothesis, not a confirmed Lighthouse attribution.
- **Unscored diagnostic:** DOM size 1,206 elements, depth 14, `#toolsGrid` with 28 children. Not a direct score failure; recorded as a performance diagnostic.

### `/tools/mph-to-kph/` mobile — WARNING

- Performance `88` is below Lighthouse's green threshold.
- LCP `3.1 s` and FCP `3.1 s` are the dominant lab weaknesses.
- Diagnostics observed: efficient cache lifetimes, render-blocking requests, forced reflow, network dependency tree, legacy JavaScript.
- Accessibility, Best Practices, SEO, and Agentic were 100 / 100 / 100 / 3/3. CLS `0.004` is good.

### `/blog/mph-to-kph-explained` desktop and business-slogan tool mobile — WARNING

- Best Practices `96`, not 100.
- The exact failing Best Practices audit was not retained in the captured PSI UI text; treat as unresolved. Earlier browser checks attributed similar console errors to third-party ad scripts, but that is not proven to be the same PSI failure.
- All other recorded categories were 100.

### All URLs — WARNING

- PSI field data: **No Data**. No real-user pass can be claimed.
- INP was not displayed in the captured PSI lab summary. Cloudflare RUM remains the field INP source.

## 5. Comparison with previous baseline

| Metric | Baseline | Post-deployment evidence |
|---|---|---|
| Homepage mobile Performance | Not captured in PSI UI in earlier blocked session | 98 (lab) |
| Homepage desktop Performance | Not captured in PSI UI in earlier blocked session | 74 (lab) |
| Homepage category-rail critical CSS | Not deployed | Deployed and live |
| Homepage desktop CLS | Field category element CLS `0.585` from Cloudflare | Lab `0.371`; field No Data |
| Homepage mobile CLS | Not captured | Lab `0` |
| `/tools/` mobile | Not captured | 100, CLS `0` |
| `/categories/image/` mobile/desktop | Not captured | 100/100, CLS `0`/`0` |

The lab tests confirm stable category pages and tools pages in the sample. They do **not** prove improved field CLS for real users.

## 6. Final status

- **PASS**: Mobile homepage, `/tools/`, category image page, representative blog, and representative business-slogan tool lab scores; all sampled SEO and Accessibility scores were 100.
- **WARNING**: `/tools/mph-to-kph/` mobile Performance `88`; Best Practices `96` on two sampled URLs; missing field data.
- **FAIL**: Homepage desktop Performance `74` and Agentic `2/3` due to lab CLS `0.371`.

No changes were made in response to these PSI results during this reporting step.
