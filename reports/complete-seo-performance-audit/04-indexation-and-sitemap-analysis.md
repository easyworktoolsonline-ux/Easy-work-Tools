# 04 — Indexation and Sitemap Analysis

Evidence: `data/gsc/gsc-authenticated-findings.md` and `data/gsc/sitemap-verification-2026-11-23.md`.

## 1. GSC property and window

- Property: `sc-domain:easyworktools.online`.
- Performance window: last 3 months, 17 Sep 2026–21 Nov 2026.
- All 92 query rows and 60 page rows were read from the DOM because the UI rows-per-page selector remained at 10 and CSV download produced no file.
- No URL Inspection “Request indexing” action was performed.

## 2. Performance overview

| Metric | Value |
|---|---:|
| Clicks | 47 |
| Impressions | 771 |
| CTR | 6.1% |
| Average position | 24.4 |

This is a low-traffic property. Third-party traffic estimates must not be presented as equivalent to GSC.

## 3. Queries

Top queries:

| Query | Clicks | Impressions | CTR | Position |
|---|---:|---:|---:|---:|
| `easy work tool` | 2 | 7 | 28.6% | 3.0 |
| `explain it` | 1 | 295 | 0.3% | 3.9 |
| `image link` | 1 | 1 | 100% | 1.0 |
| `explain it.` | 0 | 56 | 0% | 3.1 |
| `webp to pdf` | 0 | 31 | 0% | 11.3 |
| `rewrite article` | 0 | 15 | 0% | 63.8 |
| `nda generator` | 0 | 11 | 0% | 84.5 |
| `article rewriter wizard` | 0 | 8 | 0% | 56.6 |

Pattern: high impressions on a few informational/misspelling queries, but many relevant tool queries sit at positions 60–99. `webp to pdf` is notable because it is already at position 11.3 and has a matching tool page plus a SEMrush keyword cluster with modest KD.

## 4. Pages and device split

Top pages:

| Page | Clicks | Impressions | CTR | Position |
|---|---:|---:|---:|---:|
| `/` | 43 | 97 | 44.3% | 2.6 |
| `/tools/social-share-preview/` | 2 | 64 | 3.1% | 56.8 |
| `/blog/explain-it` | 1 | 378 | 0.3% | 3.5 |
| `/blog/article-rewriter` | 1 | 55 | 1.8% | 56.6 |
| `/categories/calculator/` | 1 | 11 | 9.1% | 7.5 |
| `/categories/ai-write/` | 1 | 10 | 10% | 4.1 |
| `/tools/pdf-to-word/` | 1 | 10 | 10% | 11.4 |
| `/security` | 1 | 4 | 25% | 7.0 |

Device split:

| Device | Clicks | Impressions | CTR | Position |
|---|---:|---:|---:|---:|
| Desktop | 40 | 392 | 10.2% | 42.5 |
| Mobile | 7 | 376 | 1.9% | 5.7 |
| Tablet | 0 | 3 | — | 5.7 |

Mobile has almost the same impressions as desktop but far lower CTR and a much better average position. This is a snippet/title/meta and mobile UX opportunity, not evidence of an indexation failure.

Countries: 43 total; top by clicks were Pakistan 40/123, India 2/327, United States 2/152, Bangladesh 2/33, United Kingdom 1/24.

## 5. Non-canonical variants receiving impressions

The page table includes impressions on:

- `/blog/explain-it.html`, `/blog/article-rewriter.html`, `/blog/business-slogan-generator.html`.
- `www` and `http` homepage variants.
- `?cat=text`.
- One malformed `/tools/pdf-images-converter/categories/image/`.

These are not reasons to delete pages. Canonicals and redirects must be verified URL-by-URL before any change. The current redirect set is intentionally preserved.

## 6. Indexation overview

| Status | Count |
|---|---:|
| Indexed | 62 |
| Not indexed | 549 |

Reasons:

| Reason | Count |
|---|---:|
| Discovered – currently not indexed | 291 |
| Not found (404) | 203 |
| Page with redirect | 49 |
| Crawled – currently not indexed | 4 |
| Alternative page with proper canonical tag | 2 |

The dominant gap is “Discovered – currently not indexed,” which usually reflects quality/priority/crawl-demand signals rather than a robots or sitemap blockage. The 404 pool needs classification; many may be legacy or malformed variants.

## 7. Sitemaps

| Sitemap | Submitted | Last read | Status | Discovered pages |
|---|---|---|---|---:|
| `https://easyworktools.online/sitemap.xml` | 21 Nov 2026 | 21 Nov 2026 | Success | 392 |
| `https://easyworktools.online/sitemap.xml?utm_source=chatgpt.com` | 10 Nov 2026 | 19 Nov 2026 | Success | 340 |

Both read successfully. The UTM variant is a duplicate submission and should not be treated as a separate canonical sitemap. No submission, removal, or resubmission was performed.

The sitemap has 392 URLs and no `<lastmod>`. Adding `<lastmod>` was not done because it would require a content-generation policy decision and is not necessary for discovery.

## 8. Core Web Vitals and enhancements in GSC

- GSC CrUX: not enough mobile or desktop data in the last 90 days.
- HTTPS: 11 HTTPS URLs, 0 non-HTTPS, no issues.
- Breadcrumbs: 9 valid, 0 invalid.
- Search appearance/rich results: 0 rows.

## 9. Indexing requests — deliberately not performed

No indexing request was made. If the owner later approves a prioritised request, candidates should be limited and justified, for example:

1. `/` — primary homepage and main click driver.
2. `/tools/mph-to-kph/` — existing GSC/SEMrush intent alignment.
3. `/blog/explain-it` — high impressions but very low CTR; canonical must be confirmed first.
4. `/tools/webp-to-pdf/` — GSC query at position 11.3 with a matching tool and modest-KD keyword cluster.

This is a candidate list for future decision, not an action taken or a recommendation to request all 549 pages.
