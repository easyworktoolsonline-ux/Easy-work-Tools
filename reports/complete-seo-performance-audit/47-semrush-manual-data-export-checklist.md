# 47. SEMrush Manual Data-Export Master Checklist

**Date:** 2026-11-23  
**Domain:** `easyworktools.online`  
**Scope:** Entire site — 242 tool pages, 129 blog/article pages, 10 category pages, 381 core URLs total.  
**Purpose:** Manual collection by the owner through authenticated SEMrush/Toolszen, to avoid bot detection and authentication attempts by the agent.  
**Rule:** No implementation begins until the exports are received, analyzed, documented, a roadmap is produced, and the owner approves it.

---

## 0. Global rules before any export

### 0.1 Source-of-truth labels

- [ ] **Actual first-party data:** Google Search Console only. Keep existing GSC actuals separate and never merge them into SEMrush estimate columns.
- [ ] **SEMrush actual-derived:** Only `Organic Traffic Insights` can contain GSC-derived clicks/impressions/CTR/position. Label it `SEMrush Organic Traffic Insights — GSC-derived actual`.
- [ ] **SEMrush estimates:** Every other SEMrush traffic, keyword, volume, KD, CPC, position, and backlink metric is a third-party estimate. Label every export `SEMrush estimate`.
- [ ] If a report is empty, blocked, or unavailable, write `DATA UNAVAILABLE` in the manifest. Do not substitute prior estimates or invent values.

### 0.2 Inventory to cover

- [ ] Tool URLs: **242** — seed file already prepared at `research-data/semrush-seed-tool.csv`.
- [ ] Blog/article URLs: **129** — seed file already prepared at `research-data/semrush-seed-blog.csv`.
- [ ] Category URLs: **10** — seed file already prepared at `research-data/semrush-seed-category.csv`.
- [ ] Core inventory total: **381** — verified in `research-data/page-coverage-qc.csv`.
- [ ] Do not sample. Every export must either cover all 381 URLs or be split into path batches that together cover all 381 URLs.

### 0.3 Folder structure

Create this exact folder tree before exporting:

```text
reports/complete-seo-performance-audit/research-data/semrush-manual-exports/
  00-manifest/
  01-domain-overview/
  02-organic-traffic-insights/
  03-organic-rankings/
  04-url-level-pages/
  05-keyword-research/
  06-keyword-gap/
  07-competitors/
  08-backlinks/
  09-historical/
  10-optional/
```

### 0.4 Filename convention

Use:

```text
EWT_{report}_{scope}_{country}_{device}_{dateRange}_{YYYYMMDD}.{xlsx|csv|pdf}
```

Examples:

```text
EWT_DomainOverview_whole-domain_worldwide-desktop_16m_20261123.xlsx
EWT_OrganicRankings_positions_tools-worldwide-desktop_30d_20261123.xlsx
EWT_TopPages_blog-worldwide-desktop_30d_20261123.xlsx
EWT_KeywordMagic_all-381-seeds_us-desktop_20261123.xlsx
EWT_Backlinks_all-time_worldwide_20261123.xlsx
```

### 0.5 File format rules

- [ ] Primary data files: **XLSX preferred**, CSV acceptable if XLSX is unavailable.
- [ ] PDF only for narrative/summary reports such as Domain Overview. Never use PDF as the only source for tables.
- [ ] One machine-readable primary file per report scope. Do not export both XLSX and CSV for the same scope unless the XLSX truncates.
- [ ] If a report truncates, keep the truncated file and name the next file with `_part02`, `_part03`, etc.

### 0.6 Date ranges to use

| Code | Range | Use |
| --- | --- | --- |
| `SNAPSHOT_30D` | Last 30 days, or latest completed month `2026-10-22 – 2026-11-21` | Current positions, pages, keywords, backlinks snapshot |
| `COMPARE_GSC` | `2026-09-17 – 2026-11-21` | Direct comparison window matching existing GSC actuals |
| `TREND_16M` | `2025-08-01 – 2026-11-23` | Historical trend comparable to the 16-month GSC research |
| `ALL_TIME` | All available SEMrush history | Backlink profile and historical domain metrics |

### 0.7 Country and device selection

- [ ] Essential databases: **Worldwide** and **United States**.
- [ ] Country-wide summary: Domain Overview → **Compare by Countries**, with **All countries / no country filter**.
- [ ] Optional priority databases, only if the business targets them: United Kingdom, Germany, Canada, Australia, India.
- [ ] Device: **Desktop** as the default SEMrush database. If the UI offers a device selector, export Mobile separately for Domain Overview and Top Pages; label it `mobile`.
- [ ] Never mix country databases in one file. Use separate files per country.

### 0.8 Export QA — mandatory for every file

- [ ] Compare exported row count with the on-screen total/filtered count.
- [ ] Record the count in the manifest.
- [ ] If export count is lower than the UI count, split by the method listed in that section.
- [ ] Check that the export contains the required columns listed below.
- [ ] Do not delete or overwrite any export. If a re-export is needed, append `_v2` to the filename.

### 0.9 Manifest file

Maintain `00-manifest/semrush-export-manifest.csv` with these columns:

```text
ExportID,Folder,Filename,ReportName,MenuPath,Scope,URLFilter,Country,Device,DateRange,Filters,Format,ExportedOn,UIRowCount,ExportedRowCount,CompleteY/N,EstimateOrActual,Notes
```

---

## 1. Domain Overview — essential

**Menu path:** left navigation → **Domain Overview** (observed as `https://sm.toolszen.com/analytics/overview/`)  
**Coverage:** Whole domain, one export set.  
**Settings:** Domain `easyworktools.online`; search type **Root Domain**; database **Worldwide** then **United States**; device **Desktop**; time period **TREND_16M** and **COMPARE_GSC**.

### 1.1 Overview summary

- [ ] Export **Overview** tab for Worldwide/Desktop, `TREND_16M`.
- [ ] Export **Overview** tab for US/Desktop, `TREND_16M`.
- [ ] Format: XLSX primary; PDF may be added as a visual supplement.
- [ ] Required columns/fields: Organic Traffic, Organic Traffic Cost, Paid Traffic, Paid Traffic Cost, Authority Score, Organic Keywords, Paid Keywords, Backlinks, Referring Domains, SERP Features, main country share, device split if shown, data date.
- [ ] Folder: `01-domain-overview/`.
- [ ] Filename examples: `EWT_DomainOverview_whole-domain_worldwide-desktop_16m_20261123.xlsx`, `EWT_DomainOverview_whole-domain_us-desktop_16m_20261123.xlsx`.
- [ ] Label: `SEMrush estimate`.

### 1.2 Growth report / historical trend

- [ ] Open **Growth report** tab.
- [ ] Set monthly granularity and full available range, preferably `TREND_16M`; if available, also export `ALL_TIME`/36 months.
- [ ] Required columns: Month, Organic Traffic, Paid Traffic, Backlinks, Referring Domains, Organic Keywords, Paid Keywords, Authority Score if shown.
- [ ] Format: XLSX/CSV.
- [ ] Folder: `09-historical/` if separated from the overview; otherwise `01-domain-overview/`.
- [ ] Filename: `EWT_DomainOverview_Growth_whole-domain_worldwide-desktop_16m_20261123.xlsx`.
- [ ] Label: `SEMrush estimate`.

### 1.3 Compare by Countries

- [ ] Open **Compare by Countries** tab.
- [ ] Select **All countries** / no filter. Compare up to the UI limit; if a limit applies, split into continent or region batches and record the batch.
- [ ] Required columns: Country, Organic Traffic, Organic Keywords, Paid Traffic, Backlinks, Referring Domains, Traffic Share, Position/Visibility if shown.
- [ ] Format: XLSX/CSV.
- [ ] Folder: `01-domain-overview/`.
- [ ] Filename: `EWT_DomainOverview_CompareByCountries_all-countries_20261123.xlsx`.
- [ ] Label: `SEMrush estimate`.

### 1.4 Only if Domain Overview still shows “Something went wrong”

- [ ] Record `DATA UNAVAILABLE — Domain Overview widget error` in the manifest.
- [ ] Save a screenshot or short note in `01-domain-overview/`.
- [ ] Do not retry endlessly. Continue with sections 2–10.

---

## 2. Organic Traffic Insights — essential, actual-derived

**Menu path:** SEMrush standard name **Organic Traffic Insights** (usually under Organic Research / SEO). If this menu is not visible in the current Toolszen layout, mark `DATA UNAVAILABLE` and proceed; do not substitute estimates.  
**Coverage:** Whole domain; one export per country/date range.  
**Requirement:** GSC and GA4/Analytics connection must already be authorized by the owner. Do not enter credentials through the agent.

### 2.1 GSC-derived page/keyword data

- [ ] Connect/confirm **Google Search Console** for `easyworktools.online`.
- [ ] Connect/confirm **GA4** if the report requires it; if unavailable, export GSC-only fields if the UI permits.
- [ ] Country: Worldwide, then United States.
- [ ] Device: All devices if available; otherwise Desktop and note the limitation.
- [ ] Date range: `COMPARE_GSC` (`2026-09-17 – 2026-11-21`).
- [ ] Group by: **Page** and **Keyword** (request both views if separate).
- [ ] Required columns: Date, URL/Page, Keyword, Clicks, Impressions, CTR, Average Position, Country, Device, Sessions/Users if GA4 is connected, Query category if shown.
- [ ] Format: XLSX/CSV.
- [ ] Folder: `02-organic-traffic-insights/`.
- [ ] Filename: `EWT_OrganicTrafficInsights_pages-keywords_worldwide_20260917-20261121_20261123.xlsx`.
- [ ] Label: `SEMrush Organic Traffic Insights — GSC-derived actual`.
- [ ] If empty: `DATA UNAVAILABLE` in manifest; retain existing GSC actual files as the source of truth.

---

## 3. Organic Research / Organic Rankings — site-wide keyword positions — essential

**Menu path:** left navigation → **Organic Rankings** or **Organic Rankings 2.0 new** (observed in this account). Equivalent SEMrush name: **Organic Research → Positions**.  
**Coverage:** Whole domain first, then split by URL path if needed.  
**Settings:** Domain `easyworktools.online`; country Worldwide then United States; device Desktop; date `SNAPSHOT_30D`; also repeat with `COMPARE_GSC` if the UI supports historical ranges.

### 3.1 Site-wide Positions export

- [ ] Open **Positions** / keyword table.
- [ ] Remove all filters except domain/country/device/date.
- [ ] Export all rows.
- [ ] Required columns: Keyword, Search Volume, Keyword Difficulty, CPC, Search Intent, Current Position, Previous Position, Position Change, URL, Traffic Estimate, Traffic Share, SERP Features, Number of Results, Trend, Country, Device, Date.
- [ ] Format: XLSX/CSV.
- [ ] Folder: `03-organic-rankings/`.
- [ ] Filename: `EWT_OrganicRankings_positions_whole-domain_worldwide-desktop_30d_20261123.xlsx`.
- [ ] Label: `SEMrush estimate`.
- [ ] Pagination: if truncated, split by URL path using section 4.2–4.4 filters, not by random keyword ranges.

### 3.2 Country repeat

- [ ] Repeat 3.1 for **United States**.
- [ ] Filename: `EWT_OrganicRankings_positions_whole-domain_us-desktop_30d_20261123.xlsx`.
- [ ] Optional repeats: UK/DE/CA/AU/IN if those markets are priorities.

### 3.3 GSC-window repeat

- [ ] Repeat 3.1 for Worldwide using `COMPARE_GSC` if the report allows a custom historical range.
- [ ] Filename: `..._20260917-20261121_20261123.xlsx`.
- [ ] If historical positions are unavailable, record `DATA UNAVAILABLE — historical positions` rather than inventing them.

---

## 4. URL-level coverage for all 381 pages — essential

**Primary report:** left navigation → **Top Pages** (observed). Equivalent SEMrush name: **Organic Research → Pages**.  
**Purpose:** Obtain URL-level performance for every tool, blog/article, and category page.  
**Do not duplicate:** Use Top Pages for URL-level metrics; use section 3 Positions for keyword-level metrics.

### 4.1 Site-wide Top Pages

- [ ] Domain `easyworktools.online`; country Worldwide; device Desktop; date `SNAPSHOT_30D`.
- [ ] Export all rows.
- [ ] Required columns: URL, Page Title, Organic Traffic Estimate, Traffic Cost, Keywords Count, Top Keyword, Top Keyword Position, Traffic Share, Backlinks, Referring Domains, Category/Page Type if shown.
- [ ] Folder: `04-url-level-pages/`.
- [ ] Filename: `EWT_TopPages_whole-domain_worldwide-desktop_30d_20261123.xlsx`.
- [ ] Label: `SEMrush estimate`.

### 4.2 Tool pages — all 242

- [ ] Apply URL filter: `URL contains /tools/`.
- [ ] Confirm UI row count is at least 242 or that filtered count matches the live tool inventory.
- [ ] Export with the same columns as 4.1.
- [ ] Filename: `EWT_TopPages_tools-worldwide-desktop_30d_20261123.xlsx`.
- [ ] If truncated, split by first path segment, e.g. `/tools/ai-write/`, `/tools/converter/`, `/tools/pdf/`, `/tools/image/`, `/tools/text/`, `/tools/developer/`, `/tools/calculator/`, `/tools/video-audio/`, `/tools/seo/`, `/tools/utility/`, and name files `_partNN`.
- [ ] Then repeat the same filtered export for United States.

### 4.3 Blog/article pages — all 129

- [ ] Apply URL filter: `URL contains /blog/`.
- [ ] Confirm UI row count is at least 129.
- [ ] Export same columns as 4.1.
- [ ] Filename: `EWT_TopPages_blog-worldwide-desktop_30d_20261123.xlsx`.
- [ ] If truncated, split by year/month slug or alphabetical ranges and label parts.
- [ ] Repeat for United States.

### 4.4 Category pages — all 10

- [ ] Apply URL filter: `URL contains /categories/`.
- [ ] Confirm UI row count is at least 10.
- [ ] Export same columns as 4.1.
- [ ] Filename: `EWT_TopPages_categories-worldwide-desktop_30d_20261123.xlsx`.
- [ ] Repeat for United States.

### 4.5 Per-URL fallback — only if URL filters are unavailable

- [ ] Use `research-data/semrush-seed-tool.csv`, `semrush-seed-blog.csv`, and `semrush-seed-category.csv`.
- [ ] For each of the 381 URLs, open the URL-level Organic Research/Top Pages view and export one row set.
- [ ] Save into subfolders `04-url-level-pages/tools/`, `.../blog/`, `.../categories/`.
- [ ] Filename per URL: `EWT_URL_{slug}_worldwide-desktop_30d_20261123.xlsx`.
- [ ] This is the last resort; do not do it if the filtered bulk exports in 4.1–4.4 are complete.

---

## 5. Keyword research for every tool, blog article, and category — essential

**Menus:** left navigation → **Keyword Magic Tool** or **Keyword Magic Tool 2.0 new**; bulk mode where available. Also **Keyword Overview** and **Keyword Strategy Builder** for depth.  
**Coverage:** All 381 seed phrases from the three prepared seed CSVs.  
**Avoid duplicates:** Do not run 381 individual Keyword Magic exports if the bulk tool accepts the seed list.

### 5.1 Bulk Keyword Magic Tool — all seeds

- [ ] Open **Keyword Magic Tool → Bulk** / multi-seed mode.
- [ ] Paste or upload all 381 seeds from:
  - `research-data/semrush-seed-tool.csv` (242)
  - `research-data/semrush-seed-blog.csv` (129)
  - `research-data/semrush-seed-category.csv` (10)
- [ ] Country: **Worldwide**, then **United States** as a separate file.
- [ ] Match: **Phrase match** primary; **Broad match** secondary if the plan allows.
- [ ] Filters: Volume `>= 0` (do not exclude zero-volume long-tail unless needed), KD `0–100`, CPC all, Search Intent all, SERP Features all.
- [ ] Rows: maximum available per export.
- [ ] Required columns: Seed, Keyword, Search Volume, KD, CPC, Competitive Density, Search Intent, Number of Results, SERP Features, Broad/Phrase/Exact match indicators, Trend/Seasonality, Country, Device, Questions/Related if shown.
- [ ] Folder: `05-keyword-research/`.
- [ ] Filenames: `EWT_KeywordMagic_all-381-seeds_worldwide-desktop_phrase_20261123.xlsx`, `EWT_KeywordMagic_all-381-seeds_us-desktop_phrase_20261123.xlsx`.
- [ ] Label: `SEMrush estimate`.
- [ ] Pagination: Keyword Magic commonly caps exports at 10,000 rows. If the UI total exceeds the export, split into seed batches of 50–100 and/or by KD buckets `0–20`, `21–40`, `41–60`, `61–80`, `81–100`; name files `_partNN`.

### 5.2 Keyword Overview — priority keywords only

- [ ] From the combined export, shortlist up to 200 keywords with intent clearly matching an existing tool/blog/category.
- [ ] For each, open **Keyword Overview** and export/record the full metric panel.
- [ ] Required columns: Keyword, Volume, KD, CPC, Intent, SERP Features, Results Count, Trend, Related Keywords, Question Keywords, Country, Date.
- [ ] Format: XLSX/CSV; one consolidated file if manually copied.
- [ ] Filename: `EWT_KeywordOverview_priority-200_worldwide-desktop_20261123.xlsx`.
- [ ] Label: `SEMrush estimate`.

### 5.3 Keyword Strategy Builder — clustering

- [ ] Open **Keyword Strategy Builder**.
- [ ] Create a draft project for `easyworktools.online` using the combined keyword list.
- [ ] Export the suggested topic clusters and keyword-to-page assignments.
- [ ] Required columns: Cluster Name, Main Keyword, Supporting Keywords, Suggested URL/Page, Intent, Volume, KD, Priority.
- [ ] Filename: `EWT_KeywordStrategyBuilder_clusters_us-desktop_20261123.xlsx`.
- [ ] Label: `SEMrush estimate / strategic hypothesis`.

---

## 6. Keyword Gap — essential

**Menu path:** left navigation → **Keyword Gap** (observed).  
**Coverage:** Whole domain versus competitors; one export per competitor set.  
**Settings:** Domain `easyworktools.online`; country Worldwide then United States; device Desktop; date `SNAPSHOT_30D`.

### 6.1 Competitor set

- [ ] Add these known/hypothesized competitors from prior estimate exports: `tinywow.com`, `pdf24.org`, `cloudconvert.com`, `online-convert.com`.
- [ ] Add any competitors surfaced by Domain Overview/Organic Research competitor lists.
- [ ] Keep the number of competitor columns within the UI limit; if more than allowed, split into Set A and Set B and record each set in the manifest.

### 6.2 Required exports

- [ ] Export **Missing keywords** — keywords competitors rank for and the domain does not.
- [ ] Export **Weak keywords** — domain ranks lower than competitors.
- [ ] Export **Shared keywords** — all domains rank.
- [ ] Export **All keywords** if available.
- [ ] Required columns: Keyword, per-domain Position, per-domain URL, Search Volume, KD, CPC, Intent, Traffic Estimate, Gap Type, SERP Features, Country, Device, Date.
- [ ] Folder: `06-keyword-gap/`.
- [ ] Filenames: `EWT_KeywordGap_missing_worldwide-desktop_30d_20261123.xlsx`, `EWT_KeywordGap_weak_...`, `EWT_KeywordGap_shared_...`, `EWT_KeywordGap_all_...`.
- [ ] Label: `SEMrush estimate`.

---

## 7. Competitor research — essential + optional

**Menus:** **Domain Overview → Competitors**, **Organic Research → Competitors**, **Compare Domains**, plus each competitor's Domain Overview, Organic Rankings, Top Pages, and Backlinks reports.

### 7.1 Competitor discovery — essential

- [ ] Export the competitor list from **Domain Overview → Competitors**.
- [ ] Export the competitor list from **Organic Research → Competitors**.
- [ ] Required columns: Competitor Domain, Authority Score, Organic Traffic, Organic Keywords, Backlinks, Referring Domains, Overlap Keywords, Traffic Share, Country, Date.
- [ ] Folder: `07-competitors/`.
- [ ] Filename: `EWT_CompetitorList_discovered_worldwide_20261123.xlsx`.
- [ ] Label: `SEMrush estimate`.

### 7.2 Top competitor deep exports — essential for top 5

- [ ] Select the top 5 competitors by SEMrush organic traffic/overlap, always including the four known competitors if they appear.
- [ ] For each competitor, export:
  - Domain Overview summary (`SNAPSHOT_30D`, Worldwide/Desktop).
  - Organic Rankings Positions (`SNAPSHOT_30D`, Worldwide/Desktop).
  - Top Pages (`SNAPSHOT_30D`, Worldwide/Desktop).
  - Backlinks Overview (`ALL_TIME`).
- [ ] Required columns are the same as sections 1.1, 3.1, 4.1, and 8.1 respectively, plus `CompetitorDomain`.
- [ ] Filename pattern: `EWT_Comp-{domain}_OrganicRankings_worldwide-desktop_30d_20261123.xlsx`.
- [ ] Label: `SEMrush estimate`.

### 7.3 Compare Domains — essential

- [ ] Open left navigation → **Compare Domains**.
- [ ] Compare `easyworktools.online` with up to 5 competitor domains per run.
- [ ] Use Worldwide and United States separately; device Desktop; date `SNAPSHOT_30D`.
- [ ] Export all rows.
- [ ] Required columns: Domain, Organic Traffic, Organic Keywords, Paid Traffic, Backlinks, Referring Domains, Authority Score, Overlap Keywords, Unique Keywords, Traffic Share.
- [ ] Filename: `EWT_CompareDomains_setA_worldwide-desktop_30d_20261123.xlsx`.
- [ ] Split into Set A/Set B/Set C if more than 5 domains total.
- [ ] Label: `SEMrush estimate`.

### 7.4 Optional competitor expansion

- [ ] Top 10 competitors instead of top 5.
- [ ] Competitor Keyword Gap per competitor.
- [ ] Competitor Backlink Gap per competitor.

---

## 8. Backlink analysis — essential + optional

**Menus:** left navigation → **Backlinks**, **Referring Domains**, **Backlink Gap**, **Backlink Audit**.

### 8.1 Backlinks Overview — essential

- [ ] Domain `easyworktools.online`; database Worldwide; date `ALL_TIME`, then `TREND_16M`.
- [ ] Export summary.
- [ ] Required columns: Total Backlinks, Referring Domains, Dofollow/Nofollow, Text/Image/Redirect/Form, Authority Score, Spam/Trust metrics if shown, New Backlinks, Lost Backlinks, Top Anchors, Top Linked Pages, Country distribution, TLD distribution.
- [ ] Folder: `08-backlinks/`.
- [ ] Filename: `EWT_Backlinks_Overview_all-time_worldwide_20261123.xlsx`.
- [ ] Label: `SEMrush estimate`.

### 8.2 Full Backlinks list — essential

- [ ] Export all backlinks for `ALL_TIME`.
- [ ] Export all backlinks for `TREND_16M`.
- [ ] Export **New** backlinks in last 30 days and **Lost** backlinks in last 30 days.
- [ ] Required columns: Source URL, Source Domain, Source Authority Score, Target URL, Anchor Text, Follow/Nofollow, Link Type, First Seen, Last Seen, Status (Active/New/Lost), Country, TLD, Spam Score if shown.
- [ ] Filename: `EWT_Backlinks_All_all-time_worldwide_20261123.xlsx`, `EWT_Backlinks_New_lost_30d_worldwide_20261123.xlsx`.
- [ ] Pagination: if truncated, split by `TREND_16M`, then 12-month, 6-month, and 3-month windows; also split by target URL path `/tools/`, `/blog/`, `/categories/` if needed.
- [ ] Label: `SEMrush estimate`.

### 8.3 Referring Domains — essential

- [ ] Export referring domains for `ALL_TIME` and `TREND_16M`.
- [ ] Required columns: Referring Domain, Authority Score, Backlinks Count, Dofollow/Nofollow, Link Types, First Seen, Last Seen, Country, TLD, Spam Score if shown.
- [ ] Filename: `EWT_ReferringDomains_all-time_worldwide_20261123.xlsx`.
- [ ] Label: `SEMrush estimate`.

### 8.4 Backlink Gap — essential

- [ ] Open left navigation → **Backlink Gap**.
- [ ] Add `easyworktools.online` and the top 4 competitors from section 7.
- [ ] Export Common, Missing, and Unique referring domains.
- [ ] Required columns: Domain, Referring Domain, Authority Score, Target URL, Anchor, Follow/Nofollow, Gap Type, Country, Date.
- [ ] Filename: `EWT_BacklinkGap_worldwide_20261123.xlsx`.
- [ ] Label: `SEMrush estimate`.
- [ ] Use for white-hat opportunity analysis only. No automated outreach, fake profiles, PBNs, paid placements, or spam directories.

### 8.5 Backlink Audit — optional but recommended

- [ ] Open **Backlink Audit** and export the analyzed profile.
- [ ] Required columns: Referring Domain, Backlink URL, Target URL, Anchor, Toxic/Spam Score, Follow/Nofollow, First Seen, Last Seen, Recommended Action.
- [ ] Filename: `EWT_BacklinkAudit_worldwide_20261123.xlsx`.
- [ ] Label: `SEMrush estimate`.
- [ ] Do not perform disavow or removal actions from this checklist.

---

## 9. Historical data — essential + optional

### 9.1 Domain growth history — essential

- [ ] Already covered in section 1.2. Store in `09-historical/` if separated.
- [ ] Required: monthly series for Organic Traffic, Paid Traffic, Keywords, Backlinks, Referring Domains, Authority Score.
- [ ] Label: `SEMrush estimate`.

### 9.2 Position Tracking history — optional but valuable

- [ ] Create/verify a SEMrush **Position Tracking** project for `easyworktools.online`.
- [ ] Country: United States primary; Worldwide if supported. Device: Desktop.
- [ ] Seed with the top 1,000 keywords from section 3/5, prioritizing keywords mapped to existing 381 URLs.
- [ ] Let it collect at least 7 days if possible, then export position history.
- [ ] Required columns: Keyword, Target URL, Position by Date, Position Change, Visibility, Traffic Estimate, SERP Features, Country, Device.
- [ ] Filename: `EWT_PositionTracking_top1000_us-desktop_20261123.xlsx`.
- [ ] Label: `SEMrush estimate / tracked positions`.
- [ ] If a new project has no history, record `DATA UNAVAILABLE — insufficient history`.

### 9.3 Organic Research historical positions — optional

- [ ] If the Organic Research UI offers a **Historical Data** toggle or date comparator, export positions for `COMPARE_GSC`.
- [ ] Otherwise skip and note `DATA UNAVAILABLE`; do not approximate historical positions from current snapshots.
- [ ] Filename: `EWT_OrganicRankings_historical_worldwide-desktop_20260917-20261121_20261123.xlsx`.

### 9.4 Backlink new/lost history — essential

- [ ] Covered in section 8.2. Keep the 30-day New/Lost file in `09-historical/` as well if useful.
- [ ] Label: `SEMrush estimate`.

---

## 10. Additional SEMrush reports that materially improve strategy — optional

### 10.1 Traffic Analytics — optional

- [ ] Menu: **Traffic Analytics** for `easyworktools.online`.
- [ ] Country: Worldwide and United States; device Desktop; date `SNAPSHOT_30D` and `TREND_16M`.
- [ ] Required columns: Visits, Unique Visitors, Pages/Visit, Avg Visit Duration, Bounce Rate, Traffic Sources, Geography, Device Split, Subdomain/Directory Traffic.
- [ ] Filename: `EWT_TrafficAnalytics_worldwide-desktop_30d_20261123.xlsx`.
- [ ] Label: `SEMrush estimate — not GA4 actual`.

### 10.2 On Page SEO Checker — optional

- [ ] Menu: **On Page SEO Checker**.
- [ ] Run on up to 100 priority URLs from the 381 inventory; do not run all if the plan limits it.
- [ ] Required columns: URL, Target Keyword, Current Position, Topic/Content Ideas, Semantic Keywords, Title/Meta Suggestions, Internal Links Suggestions, Competition Metrics.
- [ ] Filename: `EWT_OnPageSEOChecker_priority100_20261123.xlsx`.
- [ ] Label: `SEMrush recommendation / estimate`.

### 10.3 Site Audit — optional

- [ ] Menu: **Site Audit**.
- [ ] Crawl `easyworktools.online` with standard settings; do not change site files.
- [ ] Export Issues, Crawled Pages, and Page Speed reports.
- [ ] Required columns: URL, Issue, Severity, Category, Impact, Recommendation, Status.
- [ ] Filename: `EWT_SiteAudit_issues_20261123.xlsx`.
- [ ] Label: `SEMrush crawl observation`.

### 10.4 Semrush Rank / visibility — optional

- [ ] Menu: **Semrush Rank**.
- [ ] Export current rank and trend if available.
- [ ] Filename: `EWT_SemrushRank_whole-domain_worldwide_20261123.xlsx`.
- [ ] Label: `SEMrush estimate`.

### 10.5 Do not include in this checklist

- [ ] Ahrefs exports are a separate workflow.
- [ ] No paid/PPC exports unless the owner confirms paid traffic is a material channel.
- [ ] No social-media or local-pack exports unless requested separately.
- [ ] No backlink outreach, contact list use, or disavow action.

---

## 11. Duplicate and gap control

- [ ] One Top Pages export per scope; do not also export “Organic Research → Pages” for the same scope.
- [ ] One Positions export per scope; do not repeat it unless country, device, or date range changes.
- [ ] One Keyword Magic bulk export per country/match type; do not export the same seed 381 times if bulk mode works.
- [ ] One Backlinks full export per date window; do not repeat by anchor unless specifically needed.
- [ ] Every URL in `page-coverage-qc.csv` must appear in at least one URL-level export or be explicitly listed as `NO SEMrush URL DATA`.
- [ ] The manifest must include every file, including empty/unavailable ones.

---

## 12. Final handoff after exports

- [ ] Place the completed export folder at:

```text
F:\easyworktools.online\Easy-work-Tools\reports\complete-seo-performance-audit\research-data\semrush-manual-exports\
```

- [ ] Tell me which sections are complete and which are marked `DATA UNAVAILABLE`.
- [ ] I will then:
  1. Validate row counts and columns.
  2. Join SEMrush estimates to the 381-URL inventory without mixing them with GSC actuals.
  3. Write organized research notes and an evidence register.
  4. Analyze keyword gaps, competitors, backlinks, and URL-level opportunities.
  5. Produce an implementation roadmap with priorities and risk notes.
  6. **Wait for your explicit approval before any implementation.**
