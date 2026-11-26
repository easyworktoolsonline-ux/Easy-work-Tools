# 62 — Technical SEO and off-page research status (2026-11-24)

**Status:** COMPLETE for all work possible with authorized free/local evidence. No outreach, link purchase, disavow, indexing request, DNS/Cloudflare change, deployment, or live production crawl was performed by the assistant.

## 1. Technical SEO evidence

| Area | Evidence | Result |
|---|---|---|
| Sitemap | `sitemap.xml` | 392 canonical HTML URLs; unchanged by T049/T059 |
| Local source coverage | one file per sitemap URL | 392 / 392 present and parsed |
| Canonicals | Report 59/63 local validation | 392 / 392 equal sitemap URL |
| Robots | repository and live `robots.txt` | `Allow: /`, `Disallow: /api/`, sitemap line, crawler rules preserved |
| Redirects | `_redirects` | 26 rules preserved; none added, removed or retargeted |
| Structured data | 392-page JSON-LD parse | all expected types parsed; 391 BreadcrumbList (homepage is trail root) |
| Mobile rendering | prior isolated browser checks | tool, category, guide, static and AI Write page types examined at 1000px local viewport |
| Accessibility | Reports 24/25 and Lighthouse JSON | sampled PSI Accessibility 100; 0 images missing alt on sampled pages |
| Performance | Reports 23/26 and Lighthouse JSON | lab data only for new tests; field data unavailable |
| URL/slug preservation | final canonical/sitemap comparison | 0 URL or redirect changes |

Source-code validation, isolated-build validation and live-production validation are reported separately. All new local work was validated in the source tree and isolated build; no live deployment was performed in this phase.

## 2. Core Web Vitals status

- Field data after the work: **DATA UNAVAILABLE / UNVERIFIED**. PSI field section returned `No Data`; GSC CrUX reported insufficient data; the Cloudflare P75 values are pre-change only.
- Lab data: homepage mobile Performance 98, homepage desktop Performance 74 with CLS 0.371, `/tools/` mobile 100, `/categories/image/` 100 on mobile and desktop, `/tools/mph-to-kph/` mobile 88.
- Prior field baseline: LCP P75 1,048 ms, TTFB P75 978 ms, INP 100% good, CLS 75% good / 25% poor.
- No improvement in real-user LCP, INP, CLS, FCP or TTFB is claimed.

## 3. Off-page evidence, kept separate by source class

### First-party actual data

- GSC window `17 Sep 2026–21 Nov 2026`: 47 clicks, 771 impressions, 6.1% CTR, average position 24.4 (Reports 44/46).
- GSC Links report: **DATA UNAVAILABLE** in this workspace; no referring domains or backlinks are claimed from GSC.

### Third-party estimates — not actual traffic or rankings

| Source | Referring domains | Backlinks | Notes |
|---|---:|---:|---|
| SEMrush estimate | 42 | 245 | 200 follow / 45 nofollow; 187 backlinks from `rankvance.com`; 6% niche-edit/premium anchors |
| Ahrefs overview/report | 184 / 202 | 187 in window / 205 all-time | 1 followed referring domain; 4 followed backlinks; discrepancy preserved |
| Ahrefs estimated organic traffic | n/a | 0 | Estimate only; not GSC clicks |

These numbers are reviewed estimates. They are not combined with GSC actuals and are not evidence of acquired links.

### Manual backlink-risk review

- `rankvance.com`: 187 of 245 SEMrush-estimated backlinks.
- Anchors explicitly describing niche edits/premium backlinks: 15 of 245 (6%).
- Branded `easyworktools.online` anchors: 214 backlinks across 28 domains (87%).
- Ahrefs top sampled domain: `scamadviser.com` (DR 80, 4 links, SPAM label), plus `.shop`/`.site`/`.store` patterns.
- Decision: **manual review only; no automatic disavow**. Tool labels and estimates alone are insufficient grounds for a disavow file.

Evidence: `reports/complete-seo-performance-audit/data/offpage/backlink-review-inventory-2026-11-24.csv` (42 evidence rows, including 25 prospect URL status checks that are explicitly not acquired backlinks).

## 4. Opportunity and outreach deliverables

- Existing competitor opportunity database: 25 domains (`42-backlink-opportunity-database.csv`).
- Earlier 199-domain competitor matrix retained from Reports 36/37.
- New outreach target list: 25 rows in `data/offpage/outreach-target-list-2026-11-24.csv`.
- Each row contains a draft subject and body, target URL, relevance reason, competitor evidence, discovery URL and verification status.
- Outreach messages sent: **0**. Accounts created: **0**. Links acquired: **0**. Referring domains acquired: **0**. Paid placements: **0**.

## 5. Limited free SERP/autocomplete/PAA review

Three indicative free web-search snapshots were captured for `explain it`, `webp to pdf`, and `easy work tool` (`data/offpage/serp-free-review-2026-11-24.csv`). Observations:

- `webp to pdf` SERP is dominated by large commercial converters.
- `easy work tool` surfaced EasyWorkTools homepage, `/tools/`, and `/categories/ai-write` among results.
- No stable position, PAA set, autocomplete export, location/device normalization, or rank-change claim is made. GSC actuals remain the only first-party search-performance source.

This is why T027 remains `PARTIAL` rather than `DONE`.

## 6. Issue register

`data/technical/technical-offpage-issue-register-2026-11-24.csv` contains 16 issue rows covering indexation, 404 pool, duplicate variants, field CWV, desktop lab CLS, live validation, structured-data validators, backlink-data gaps, suspicious anchors, outreach, GEO/AEO, content-only orphans, reviewed link-parser artifacts, Bing, Google Trends, and pre-commit sensitive-file checks.

## 7. Tracker updates

- `T063` DONE — 25 draft outreach targets prepared; no messages sent.
- `T064` DONE — rankvance/niche-edit anchors manually reviewed; no disavow submitted.
- `T061` PARTIAL — vendor estimates reviewed; GSC Links report unavailable.
- `T062` PARTIAL — competitor link targets/opportunity database produced; authorized unlinked-mention data unavailable.
- `T066` DONE for available measurements; field values explicitly DATA UNAVAILABLE.
- `T067` PARTIAL — prior performance fixes retained; residual desktop lab CLS root cause unproven.
- `T074` PARTIAL — local/source validation complete; live re-crawl not possible without deployment.
- `T086` DATA UNAVAILABLE — no usable field Core Web Vitals after implementation.

No ranking, traffic, backlink, indexing or AI-citation improvement is claimed in this report.
