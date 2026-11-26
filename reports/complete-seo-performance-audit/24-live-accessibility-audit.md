# 24 — Live accessibility audit

Date: 2026-11-23  
Scope: production EasyWorkTools.online URLs sampled in PSI and browser checks.  
Status: **PASS for sampled pages; NOT TESTED for the full URL inventory at this stage**.

## 1. Evidence sources

- PageSpeed Insights Accessibility scores for 12 URL/form-factor combinations.
- Earlier browser Lighthouse Accessibility/Best Practices/SEO audit of six production URLs, retained in `data/performance/live-browser-audit.md`.
- Browser DOM checks for H1, canonical, robots metadata, JSON-LD counts, image alt attributes, and console errors.

## 2. PageSpeed Insights accessibility results

| URL | Mobile | Desktop |
|---|---:|---:|
| `/` | 100 | 100 |
| `/tools/` | 100 | 100 |
| `/categories/image/` | 100 | 100 |
| `/tools/mph-to-kph/` | 100 | 100 |
| `/blog/mph-to-kph-explained` | 100 | 100 |
| `/tools/ai-write/business-slogan-generator/` | 100 | 100 |

All sampled URLs scored **100** for Accessibility in PSI lab runs.

## 3. Earlier production browser Lighthouse results

From `data/performance/live-browser-audit.md`:

| URL | H1 | JSON-LD blocks | Images missing alt | Accessibility score |
|---|---|---:|---:|---:|
| `/` | Free Tools to Make Business Simple | 2 | 0 | 1/1 |
| `/categories/image/` | Image Tools | 1 | 0 | 1/1 |
| `/tools/json-formatter/` | JSON Formatter & Validator | 3 | 0 | 1/1 |
| `/tools/mph-to-kph/` | MPH to KPH Converter | 3 | 0 | 1/1 |
| `/blog/mph-to-kph-explained` | MPH to KPH: Road-Speed Conversion Explained | 3 | 0 | 1/1 |
| `/about` | About EasyWorkTools.online | 2 | 0 | 1/1 |

Note: the earlier browser audit reported the pre-rotation hero H1 text `Business`; the post-deployment live DOM check recorded `Tasks`. This is a text rotation within the same H1, not a structural H1 change.

## 4. Post-deployment browser DOM checks

| Check | Result |
|---|---|
| Homepage H1 count | 1 visible primary H1 |
| Hidden category heading present | PASS (`Explore categories`, `visually-hidden`) |
| Viewport declaration | PASS |
| Canonical present and self-referencing | PASS on sampled pages |
| `robots` meta present | PASS (`index,follow`) |
| Images missing `alt` on sampled pages | 0 |
| Console errors on final homepage check | 0 |

## 5. Known limitations

- Browser scroll verification failed: `browser.scroll` timed out and `window.scrollTo(0,1200)` returned `scrollY:0`. Scroll-dependent accessibility issues were therefore **NOT TESTED**.
- Keyboard navigation, focus order, screen-reader output, color-contrast manual review, and form-error announcements were not separately tested.
- Only representative URLs were tested here. The full individual page audit is being performed separately and will report every tool, blog, and category page.
- The site's rotating hero word is `aria-live="polite"`; automated accessibility scored it as passing, but screen-reader behavior was not manually verified.

## 6. Final status

- **PASS**: All sampled PSI Accessibility scores are 100.
- **PASS**: Earlier browser Lighthouse Accessibility scores were 1/1 on six representative production pages.
- **PASS**: No missing image alt attributes or H1/canonical/robots issues were found on sampled pages.
- **NOT TESTED**: scroll-dependent behavior, manual screen-reader/keyboard testing, and non-sampled URLs.

No accessibility-related code changes were made in this reporting step.
