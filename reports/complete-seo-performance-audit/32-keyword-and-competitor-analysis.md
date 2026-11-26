# 32 — Page-level keyword, GSC, SEMrush, and Ahrefs analysis

Date: 2026-11-23  
Scope: EasyWorkTools.online only.  
Status: **PASS with source distinctions preserved**.

## 1. Evidence classes

| Class | Source | How it is used |
|---|---|---|
| Measured | Google Search Console authenticated DOM data | Actual impressions, clicks, CTR, position for this property |
| Estimate | SEMrush authenticated UI | Third-party volume, KD, position estimates; not substituted for GSC |
| Estimate | Ahrefs authenticated UI | Third-party DR/UR/backlinks/crawl estimates |
| Repository evidence | manifests, HTML, internal links | Keyword mapping and content intent, not performance proof |

No API tokens, manual exports, screenshots, credentials, or OTPs were captured. SEMrush was not reauthenticated because explicit confirmation was not given.

## 2. Measured GSC page-level data

Last 3 months: 47 clicks / 771 impressions / 6.1% CTR / position 24.4. The UI exposed 92 query rows and 60 page rows.

| Page/query | GSC measured value |
|---|---|
| `/` | 43 clicks / 97 impressions / 44.3% CTR / position 2.6 |
| `easy work tool` | 2 clicks / 7 impressions / 28.6% CTR / position 3.0 |
| `/tools/social-share-preview/` | 2 clicks / 64 impressions / 3.1% CTR / position 56.8 |
| `/blog/explain-it` | 1 click / 378 impressions / 0.3% CTR / position 3.5 |
| `explain it` | 1 click / 295 impressions / 0.3% CTR / position 3.9 |
| `/blog/article-rewriter` | 1 click / 55 impressions / 1.8% CTR / position 56.6 |
| `rewrite article` | 0 clicks / 15 impressions / position 63.8 |
| `/categories/calculator/` | 1 click / 11 impressions / position 7.5 |
| `/categories/ai-write/` | 1 click / 10 impressions / position 4.1 |
| `/tools/pdf-to-word/` | 1 click / 10 impressions / position 11.4 |
| `webp to pdf` | 0 clicks / 31 impressions / position 11.3 |
| `nda generator` | 0 clicks / 11 impressions / position 84.5 |

Device split: desktop 40 clicks / 392 impressions / 10.2% CTR; mobile 7 clicks / 376 impressions / 1.9% CTR / position 5.7. Mobile has nearly equal impressions but much lower CTR, so title/snippet and mobile presentation are priorities.

## 3. SEMrush estimates

| Item | SEMrush value | Classification |
|---|---:|---|
| US organic keywords | 6 | Estimate |
| Estimated organic traffic | 1 | Estimate |
| Authority Score | 2 | Estimate |
| Referring domains | 42 | Estimate |
| Backlinks | 245 | Estimate |
| `convert mph to kilometers` | volume 4.4K, position 39 | Estimate |
| `webp to pdf` | volume 2.9K, KD 23 | Estimate |
| `convert webp to pdf` | volume 390, KD 27 | Estimate |
| `business slogan generator` (UK) | volume 260, position 84 | Estimate |
| `slogan builder` (CA) | volume 390, position 89 | Estimate |

Keyword Gap compared research-only domains `smallpdf.com`, `ilovepdf.com`, `convertio.co`: 0 shared, 5.1K missing, 92.5K untapped. Representative missing terms had KD 43–78 and were treated as competitive context, not immediate edit targets.

SEMrush Top Pages data was unavailable because the session expired. No unverified Top Pages table is reported.

## 4. Ahrefs estimates

| Item | Ahrefs value | Classification |
|---|---:|---|
| Domain Rating | 0 | Estimate |
| URL Rating | 0 | Estimate |
| Backlinks | 187 (+187) | Estimate |
| Referring domains | 184 overview / 202 report | Estimate with internal conflict |
| Organic keywords | 0 | Estimate |
| Estimated organic traffic | 0 | Estimate |
| Crawled pages | 623: 343 × 200, 192 × 3XX, 88 × 404 | Third-party crawl observation |

Ahrefs Content Gap/Link Intersect could not be populated reliably in the authenticated UI. This is a session/UI limitation, not evidence that no gaps exist.

## 5. Keyword map and prioritization

`data/page-level/keyword-map.csv` maps all 381 core pages to primary keyword, secondary keywords, category, H1, title, and evidence source.

Priority logic:

1. **Highest confidence:** pages with both measured GSC impressions and an existing relevant tool — `/`, `/blog/explain-it`, `/tools/webp-to-pdf/`, `/tools/mph-to-kph/`, `/tools/social-share-preview/`, `/tools/ai-write/nda-generator/`.
2. **Medium confidence:** SEMrank/SEMrush estimate clusters aligned with existing tools — `webp to pdf`, `business slogan generator`, `slogan builder`, `convert mph to kilometers`.
3. **Low confidence:** high-KD PDF head terms from competitor gap. Recorded as context only.
4. **No evidence:** pages with neither GSC nor third-party rows still received consistent metadata/content checks, but no ranking claim is made.

## 6. Final status

- **PASS**: GSC measured data separated from SEMrush/Ahrefs estimates.
- **WARNING**: very low traffic and incomplete third-party page-level data limit prioritization confidence.
- **NOT TESTED**: fresh SEMrush Top Pages and Ahrefs Content Gap due session/UI limitations.
- No outreach, purchases, disavows, or backlink changes were made.
