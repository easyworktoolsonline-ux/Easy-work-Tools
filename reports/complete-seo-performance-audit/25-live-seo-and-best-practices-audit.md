# 25 — Live SEO and Best Practices audit

Date: 2026-11-23  
Scope: production EasyWorkTools.online URLs sampled in PSI and browser checks.  
Status: **SEO PASS for sampled pages; Best Practices WARNING on two samples**.

## 1. PageSpeed Insights SEO scores

| URL | Mobile SEO | Desktop SEO |
|---|---:|---:|
| `/` | 100 | 100 |
| `/tools/` | 100 | 100 |
| `/categories/image/` | 100 | 100 |
| `/tools/mph-to-kph/` | 100 | 100 |
| `/blog/mph-to-kph-explained` | 100 | 100 |
| `/tools/ai-write/business-slogan-generator/` | 100 | 100 |

All 12 sampled URL/form-factor combinations scored **100** for SEO.

## 2. PageSpeed Insights Best Practices scores

| URL | Mobile | Desktop | Status |
|---|---:|---:|---|
| `/` | 100 | 100 | PASS |
| `/tools/` | 100 | 100 | PASS |
| `/categories/image/` | 100 | 100 | PASS |
| `/tools/mph-to-kph/` | 100 | 100 | PASS |
| `/blog/mph-to-kph-explained` | 100 | **96** | WARNING |
| `/tools/ai-write/business-slogan-generator/` | **96** | 100 | WARNING |

The exact failing Best Practices audit was not retained in the captured PSI UI text. Earlier live-browser evidence recorded third-party ad-script console errors (`ERR_TUNNEL_CONNECTION_FAILED` from adtrafficquality and an `Uncaught (in promise) undefined` from Google ad code), but that is not proof of the same PSI finding. Treat both 96 scores as unresolved warnings.

## 3. Live SEO metadata checks

| URL | Title | Canonical | Robots | H1 |
|---|---|---|---|---|
| `/` | EasyWorkTools.online — Free Online Tools, Guides & Resources | self | `index,follow` | Free Tools to Make Tasks Simple |
| `/categories/image/` | Image Tools category page | self | `index,follow` | Image Tools |
| `/tools/mph-to-kph/` | MPH to KPH Converter | self | `index,follow` | MPH to KPH Converter |
| `/blog/mph-to-kph-explained` | MPH to KPH explainer | self | `index,follow`, `max-image-preview:large,max-snippet:-1,max-video-preview:-1` | MPH to KPH: Road-Speed Conversion Explained |
| `/tools/json-formatter/` | JSON Formatter & Validator | self | `index,follow` | JSON Formatter & Validator |
| `/about` | About EasyWorkTools.online | self | `index,follow` | About EasyWorkTools.online |

All sampled pages had a valid viewport and a single primary H1. Earlier browser Lighthouse checks reported no SEO failures on those pages.

## 4. Structured data

Sampled JSON-LD block counts from the earlier browser audit:

- `/`: 2
- `/categories/image/`: 1
- `/tools/json-formatter/`: 3
- `/tools/mph-to-kph/`: 3
- `/blog/mph-to-kph-explained`: 3
- `/about`: 2

Schema types and validity are being checked in the full page-level audit; the counts above are evidence of presence, not validity.

## 5. Crawler-related production checks

- `robots.txt` and `sitemap.xml` returned HTTP 200.
- Redirects remained: HTTP → HTTPS on apex, WWW → apex.
- Spoofed-UA probes matched the configured AI policy; see report `27`.
- No sitemap, canonical, robots, redirect, or Cloudflare policy was changed during verification.

## 6. Known limitations

- PSI SEO 100 means no automated Lighthouse SEO audit failed; it does **not** prove unique metadata, strong content, correct intent targeting, or absence of cannibalization. The full individual page audit covers those issues.
- GSC reported 203 "Not found (404)" URLs and 291 "Discovered – currently not indexed" URLs. Those are outside the six sampled PSI URLs.
- No field data was available in PSI; GSC CrUX also had no mobile or desktop field data.

## 7. Final status

- **PASS**: SEO 100 on every sampled URL/form factor; canonical, robots, viewport, and H1 checks passed on sampled production pages.
- **WARNING**: Best Practices 96 on `/blog/mph-to-kph-explained` desktop and `/tools/ai-write/business-slogan-generator/` mobile; exact PSI audit cause unresolved.
- **NOT TESTED**: full-site individual metadata, schema validity, duplicate intent, and cannibalization — covered by the subsequent page-level audit.

No SEO or Best Practices code changes were made during this reporting step.
