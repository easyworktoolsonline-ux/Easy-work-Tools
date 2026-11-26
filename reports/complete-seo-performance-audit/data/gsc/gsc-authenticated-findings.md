# Google Search Console — authenticated findings (2026-11-23)

Property: `sc-domain:easyworktools.online`. All data below was read directly in the authenticated GSC browser tab. No URL inspection "Request indexing" action was performed.

## Performance — last 3 months (17 Sep 2026–21 Nov 2026)

- Total clicks **47**, impressions **771**, CTR **6.1%**, average position **24.4**.
- Data extracted from the full DOM tables (the UI's rows-per-page selector remained at 10 and a CSV download produced no file, but all 92 query rows and 60 page rows were readable in the DOM).
- Top queries by clicks/impressions:
  - `easy work tool` — 2 clicks / 7 impressions / 28.6% CTR / position 3.0
  - `explain it` — 1 / 295 / 0.3% / 3.9
  - `image link` — 1 / 1 / 100% / 1.0
  - `explain it.` — 0 / 56 / 0% / 3.1
  - `webp to pdf` — 0 / 31 / 0% / 11.3
  - `rewrite article` — 0 / 15 / 0% / 63.8
  - `nda generator` — 0 / 11 / 0% / 84.5
  - `article rewriter wizard` — 0 / 8 / 0% / 56.6
- Most impressions are high-position/low-CTR informational or misspelling queries (`explain it` variants, `webp to pdf`, `social share checker`, `tiktok thumbnail download`, article/business-plan/nda variants). Many relevant tool queries rank positions 60–99.
- Top pages by clicks/impressions:
  - `/` — 43 / 97 / 44.3% / 2.6
  - `/tools/social-share-preview/` — 2 / 64 / 3.1% / 56.8
  - `/blog/explain-it` — 1 / 378 / 0.3% / 3.5
  - `/blog/article-rewriter` — 1 / 55 / 1.8% / 56.6
  - `/categories/calculator/` — 1 / 11 / 9.1% / 7.5
  - `/categories/ai-write/` — 1 / 10 / 10% / 4.1
  - `/tools/pdf-to-word/` — 1 / 10 / 10% / 11.4
  - `/security` — 1 / 4 / 25% / 7.0
- Page table also contains duplicate/variant URLs receiving impressions: `/blog/explain-it.html`, `/blog/article-rewriter.html`, `/blog/business-slogan-generator.html`, `www` and `http` homepage variants, `?cat=text`, and one malformed URL `/tools/pdf-images-converter/categories/image/`. These are impressions on non-canonical/legacy variants; do not delete them—verify canonicals and redirects before any change.
- Countries (top): Pakistan 40 clicks / 123 impressions; India 2 / 327; United States 2 / 152; Bangladesh 2 / 33; United Kingdom 1 / 24. 43 countries appeared.
- Devices: Desktop 40 clicks / 392 impressions / 10.2% CTR / position 42.5; Mobile 7 / 376 / 1.9% / 5.7; Tablet 0 / 3 / 5.7. Mobile has almost the same impressions as desktop but far lower CTR and much better average position—a strong snippet/title/meta and mobile UX opportunity.
- Search appearance: **0 rows** (no rich-result/search-appearance data in this window).
- Days: 66 rows; clicks are sparse and concentrated in Sep–Oct with a small Nov tail. This is a low-traffic property; third-party estimates must be treated as estimates only.

## Page indexing

- Not indexed **549**, Indexed **62**. Last update 16/11/2026.
- Reasons reported by GSC:
  - Discovered – currently not indexed: **291**
  - Not found (404): **203**
  - Page with redirect: **49**
  - Crawled – currently not indexed: **4**
  - Alternative page with proper canonical tag: **2**
- Interpretation: the dominant technical indexing gap is "Discovered – currently not indexed" (quality/priority/crawl-budget signal), followed by a large 404 pool. The 203 404s need URL-by-URL classification before any redirect or deletion; existing redirects must be preserved.

## Sitemaps

- `https://easyworktools.online/sitemap.xml` — submitted 21 Nov 2026, last read 21 Nov 2026, **Success**, 392 discovered pages, 0 videos.
- `https://easyworktools.online/sitemap.xml?utm_source=chatgpt.com` — submitted 10 Nov 2026, last read 19 Nov 2026, **Success**, 340 discovered pages, 0 videos.
- Both sitemaps read successfully. The UTM variant is a duplicate submission and should not be treated as a separate canonical sitemap; no submission changes were made.

## Core Web Vitals (GSC CrUX view)

- Last updated 22/11/2026. Mobile: **Not enough usage data in the last 90 days**. Desktop: **Not enough usage data in the last 90 days**.
- Therefore the Cloudflare field data supplied by the user (CLS 0.585 in category container) remains the authoritative real-user signal for this audit; GSC cannot confirm or contradict it.

## HTTPS and Breadcrumbs

- HTTPS: 11 HTTPS URLs, 0 non-HTTPS, no issues (last update 23/11/2026).
- Breadcrumbs: 9 valid, 0 invalid, no issues in the last 90 days (last update 22/11/2026).

## Actions deliberately not taken

- No "Request indexing" in URL Inspection.
- No sitemap resubmission/removal.
- No deletion of 404/not-indexed URLs.
- No change to canonical tags or legacy redirects.
