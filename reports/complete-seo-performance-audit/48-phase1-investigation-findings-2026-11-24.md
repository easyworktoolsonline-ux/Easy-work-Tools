# 48 — Phase 1 Investigation Findings (2026-11-24)

**Status:** Phase 1 COMPLETE. Implementation NOT started. Owner approval required before any implementation.

**Project:** `F:\easyworktools.online\Easy-work-Tools` (EasyWorkTools.online ONLY). GlobeCareer.online was not accessed or modified.

**Method:** Two read-only investigations — (1) all 13 supplied SEMrush/Ahrefs research files plus cross-check against prior `research-data`; (2) full current codebase, generators, manifests, control files, and all prior audit reports. No file was modified, no build was run in the repository, no Git operation, no deployment, no DNS/Cloudflare change, no login/CAPTCHA/auth attempt, no paid API, no outreach, and no credential use.

**Backup (created before any work):** `C:\Users\ahmad\AppData\Local\Temp\opencode\ewt-full-backup-20261124-170654` — 11,300 files, 384,018,424 bytes. Pre-change SHA-256 manifest (1,011 files, excluding `node_modules`): `C:\Users\ahmad\AppData\Local\Temp\opencode\ewt-full-backup-20261124-170654\prechange-sha256-manifest.tsv`.

**Labeling rule:** SEMrush/Ahrefs/vendor figures are **third-party estimates**. Google Search Console figures are **first-party actuals**. They are never averaged or merged.

---

## 1. Complete research-data inventory

### 1.1 Supplied folder — `F:\easyworktools.online\semrush ahrefs csv pdf spreedsheets`

13 files total (8 CSV + 5 PDF), 2.78 MB. No XLSX present.

| # | Exact filename | Size | Structure | Scope / dates |
|---:|---|---:|---|---|
| 1 | `easyworktools.online_perf_2026-11-24_15-45-49.csv` | 15,447 B | 23 cols; 187 rows (2 metadata + 185 daily) | Ahrefs-style performance, `2026-05-24`→`2026-11-24`, `All locations`, no device |
| 2 | `easyworktools.online_perf_2026-11-24_15-46-07.csv` | 15,447 B | Same | **Byte-identical duplicate** of #1 (same SHA-256) |
| 3 | `EasyWorkTools_Clean_Keywords.csv` | 19,888 B | 8 cols; 161 unique rows | No date/country/device/provenance columns |
| 4 | `easyworktools_referring_domains.csv` | 11,081 B | 10 cols; 199 unique domains | Competitor link-intersection matrix, not EWT backlinks |
| 5 | `gap.keywords_2026-11-24T11_00_54.498Z.csv` | 2,050 B | 17 cols; 8 rows | US / Desktop / USD / KD >0 and <15 |
| 6 | `gap.keywords_2026-11-24T11_03_13.488Z.csv` | 2,050 B | 17 cols; 8 rows | Same 8 keywords, permuted competitor columns |
| 7 | `gap.keywords_2026-11-24T11_13_17.435Z.csv` | 2,050 B | 17 cols; 8 rows | Same 8 keywords, third permutation |
| 8 | `gap.keywords_2026-11-24T11_13_35.765Z.csv` | 1,205,023 B | 17 cols; **10,000 rows** | US / Desktop / USD / KD >0 and <15; project date 23 Nov 2026 |
| 9 | `Semrush-Domain_Overview_(Desktop)-easyworktools_online-24th_Nov_2026.pdf` | 518,124 B | 8 pages | Generated 24 Nov 2026, Desktop |
| 10 | `Semrush-Organic_Research__Overview_(Desktop)-easyworktools_online-24th_Nov_2026.pdf` | 172,808 B | 5 pages | Generated 24 Nov 2026, Desktop |
| 11 | `Semrush-Organic_Research__Pages_(Desktop)-easyworktools_online-24th_Nov_2026.pdf` | 53,166 B | 2 pages | Generated 24 Nov 2026, Desktop |
| 12 | `Semrush-Keyword_Gap_(Desktop)-easyworktools_online_ilovepdf_com_sejda_com_canva_-24th_Nov_2026.pdf` | 150,149 B | 3 pages | Gap vs ilovepdf/sejda/canva/tinywow, US Desktop |
| 13 | `Semrush-Keyword_Gap_(Desktop)-easyworktools_online_tinywow_com_sejda_com_ilovepd-24th_Nov_2026.pdf` | 615,536 B | 8 pages | Same competitor set, different order |

### 1.2 Existing prior research-data — `reports\complete-seo-performance-audit\research-data\`

Key prior sources cross-checked: `source-inventory.md`, `semrush-live-session-blocker-2026-11-23.md`, `gsc-performance-16months-2026-11-23.json`, `gsc-queries-cleaned.csv` (92), `semrush-seed-tool.csv` (242), `semrush-seed-blog.csv` (129), `semrush-seed-category.csv` (10), `opportunity-register.csv` (65), `competitor-content-gap-cleaned.csv` (30), `backlink-url-verification.csv` (25). Seed CSVs and blocker note were created during Phase 0/1 of this engagement and are preserved.

### 1.3 Data-quality findings

- Exact duplicates: perf CSVs #1/#2 byte-identical; three 2,050 B gap CSVs contain the same 8 keywords with only competitor column order changed.
- 20 of 23 columns in the perf CSVs are 0 or blank on all 185 days; `Domain Rating` is blank on all 185 days.
- Large gap CSV: EWT position `0` and EWT page empty on 10,000/10,000 rows; 75 blank intents; `Results = 0` on 3,503 rows; 9,591 competitor page URLs empty for tinywow.
- Backlink type percentages in Domain Overview PDF conflict with its own counts (233 text + 12 image of 245 = 95.10%/4.90%, while chart text extracts as 89.62%/2.88%/2.88%/4.62%). Counts treated as primary, percentages unreliable.
- SEMrush estimated positions diverge sharply from GSC actuals; see §2.3.
- Gap data is US/Desktop/KD<15 filtered and dominated by Canva design/template queries plus some adult/irrelevant terms; only a minority map to actual EasyWorkTools tools. Non-English terms (Ukrainian/Persian) appear under a US database — geographic inconsistency.
- Clean-keywords file contains third-party branded queries (`blogsyear .org seo tools` 6,600; `litescroll.com seo tools` 6,600; `free … calculator tool on nemin .io` 6,600; `computation online` 8,100) that must not be treated as EWT opportunities without verification.

---

## 2. SEMrush and Ahrefs findings (all estimates)

### 2.1 SEMrush — Domain / Organic Research (24 Nov 2026, Desktop)

- Organic traffic estimate **1**; organic keywords **7** (+133%); Semrush Rank **13.8m**; traffic cost $0.
- Paid traffic 0; paid keywords 0.
- Backlinks **245**; referring domains **42**; referring IPs **41**.
- Keywords by country: US 46.67%, UK 20%, RU/CA/SG/IN/others 6.67% each.
- Intent: Informational 7 keywords / 100% traffic; all other intents 0.
- Top estimated keywords: `convert mph to kilometers` pos 39 / vol 4,400 / traffic 100%; `mph-kph` pos 47 / vol 1,100; `social share checker` pos 83 / vol 1,400; `social sharing checker` pos 89 / vol 700; `200 newtons to pounds` pos 62 / vol 140.
- Top pages: `/tools/mph-to-kph/` 100% traffic / 2 keywords; `/blog/how-to-add-watermark-to-pdf.html` 1; `/tools/newtons-to-pounds-force/` 1; `/tools/social-share-preview/` 3.
- Backlink anchors: `easyworktools.online` 87% (28 domains / 214 backlinks); anchor text explicitly describing “niche edits” and “premium backlinks” (6% / 15 backlinks); follow 200 (81.63%) / nofollow 45 (18.37%).
- Top referring domain `rankvance.com`: **187 of 245 backlinks**. Other top domains have 2 each (`authorityrise.xyz`, `backlinkforge.xyz`, `bloggerlinks.xyz`, `contentlinks.xyz`). Top indexed page: homepage 42 domains / 245 backlinks; all other listed pages 0/0.
- Keyword overlap: EWT **0**, ilovepdf ~1.4K, sejda 375, canva 57.2K, tinywow 573.

### 2.2 Keyword data

**Large gap export (10,000 rows):** volume sum 4,995,870; KD 0–14; 911 rows volume ≥1,000; 4,812 rows KD ≤10. Intent split: Informational 7,739; Commercial 992; Commercial+Informational 581; Informational+Transactional 207; Navigational 205; Transactional 89. `Results = 0` on 3,503 rows.

Top relevant tool opportunities (estimates):

| Keyword | Volume | KD | CPC | Competitor position evidence |
|---|---:|---:|---:|---|
| `pdf to word free` | 49,500 | 14 | $0.77 | tinywow 28, sejda 23, ilovepdf 13 |
| `pdf to excel converter convert pdf to excel` | 12,100 | 5 | $0.96 | sejda 19 |
| `pdf compressor free` | 9,900 | 6 | $0.54 | tinywow 32, sejda 33 |
| `rotate pdf` | 8,100 | 13 | $0.20 | ilovepdf 1 |
| `convert youtube to mp4` | 6,600 | 14 | $2.40 | — |
| `jpg to png converter` | 4,400 | 13 | $0.80 | — |
| `epub para pdf` | 4,400 | 6 | $1.92 | — |
| `cloudconvert heic to pdf` | 3,600 | 11 | $0.47 | — |
| `convertir de webp a jpg` | 3,600 | 9 | $0.03 | — |
| `reducir peso de pdf` | 3,600 | 10 | $0.26 | — |
| `rip text from pdf` | 2,900 | 12 | $1.07 | — |
| `pdf to ocr` | 2,400 | 12 | $1.13 | — |
| `crop to pdf` | 2,400 | 11 | $0.95 | — |

**Small gap (8 keywords, all EWT position 0 / no EWT page):** `стиснути пдф` 590/KD 14/$0.62; `leedpdf` 260/10/$0.00; `pdg a jpg` 110/8/$0.23; `size pdf page` 70/6/$0.00; `pdf to long image` 50/11/$1.77; `compress pdf to 400kb` 40/8/$0.00 (`Results 0`); `ادیت پی دی اف آنلاین` 40/4/$0.49; `پی دی اف ساز آنلاین` 40/6/$0.77.

**Clean keywords (161 rows):** total volume 171,400; KD 0–14 (avg 9.25); 82 rows CPC 0; 149 `New Tool Opportunity`, 12 `Existing Tool`. Category mix: Video 44, Audio 37, PDF 29, Calculator 19, SEO 18, Image 4, Converter 3, Utility 3, Text 2, Developer 2. `Existing Tool` examples: `pdf modifier` 1,300/14/$2.43; `image editing tools` 1,300/13/$2.32; `online tool to remove background from image` 1,300/5/$0.91; `online pdf compression tool` 480/12/$1.16; `pdf editing tools free` 210/11/$2.94; `online pdf splitter tool` 50/4/$0.44. High-CPC but cautiously treated: `ai seo tool` 2,400/8/$18.81; `seo audit free` 2,900/9/$6.24; `best local seo tools` 1,600/13/$11.05.

**Referrer matrix (199 domains):** all rows `Matches = 4/5`; 8 blank categories; `github.com` blank in 198/199 rows. These are **competitor** link intersections, not EWT backlinks. Candidate relevance/authority targets: `wps.com` (AS 72, 55.9M visits; ilovepdf 489, sejda 300, canva 3,259), `wondershare.com` (74, 10.4M), `softonic.com` (99, 159M), `saashub.com` (44, 260K; all four competitors ≥100), `glarity.app`, `teachersfirst.org`, `dev.to`, `producthunt.com`. Nine were already verified reachable/blocked in prior research-data (403/429 are access blocks, not proof of absent links).

### 2.3 Ahrefs-style estimates and estimate/actual conflict

- Perf CSV: referring domains 0 until 2026-09-20, 50 on 09-21, peak **195** (09-28→10-20), decline to **184** by 11-10 and through 11-24. Crawled pages 0 until 09-21, then 1→19→74→178→266→295→316→343→**395** on 11-24. Domain Rating blank/zero on all days. All estimated traffic/position columns 0 on all days.
- Backlink conflict remains provider-specific: Ahrefs 187 vs SEMrush 245. Do not reconcile or average.
- Prior “Authority Score 2” is not present in new exports — do not carry forward as newly verified.
- **GSC actuals** (`gsc-performance-16months-2026-11-23.json`, window 17 Sep–21 Nov 2026): 47 clicks, 771 impressions, 6.1% CTR, position 24.4. Both vendors understate this severely (SEMrush estimate 1 traffic, Ahrefs estimate 0).
- GSC actual vs SEMrush estimated positions: `social share checker` 47.7 actual vs 83 estimated; `social sharing checker` 93.7 vs 89; `mph-kph` 71 vs 47; `14 mph to kph` 6.0 actual. GSC actual `/tools/pdf-to-word/`: 1 click, 10 impressions, position 11.4. **Use GSC actuals for on-page priorities.**
- Zero exact keyword overlap between the 10,000-row gap and `semrush-seed-tool.csv`, `semrush-seed-blog.csv`, `semrush-seed-category.csv`, `gsc-queries-cleaned.csv`, and `opportunity-register.csv`. Clean keywords also overlap GSC/register 0. New exports therefore do **not** change existing GSC P0 priorities (`explain it` 295 impressions / pos 3.9; `webp to pdf` 31 impressions / pos 11.3; etc.).

---

## 3. Previous SEO work — completed, incomplete, pending

### 3.1 Completed and verified

- 381-core URL inventory established: 242 tools + 129 blogs + 10 categories; `page-coverage-qc.csv` 381 rows with `NO_LOCAL_FILE = 0`; `live-verification.csv` 381/381 PASS.
- Sitemap: 392 `<loc>` entries, 392 unique, 0 missing local targets, 0 duplicates, 0 `<lastmod>`, no `/404`.
- Shared generators identified and in place: `scripts/build-indexes.mjs`, `scripts/categories.mjs`, `scripts/category-sections.mjs`, `scripts/og-metadata.mjs`, `scripts/clean-urls.mjs`, `scripts/image-tools/core.mjs`, `scripts/minify-assets.mjs`.
- Metadata/OG/Twitter coverage: 0 pages missing title, 0 missing description, 0 missing robots directives across 393 production HTML files; canonical present on 392/393 (only `404.html` lacking).
- JSON-LD: 392 pages with parseable JSON-LD, 0 invalid (`data/page-level/schema-validation.md:5-7`). `BreadcrumbList` on 391 pages.
- Historical 155 pages locally optimized for page-level SEO (`34-page-level-final-status.md:16-23`) with no title/H1/canonical/URL changes; deployment later passed per report 35.
- CLS fix deployed and verified PASS in `22-production-deployment-verification.md` and `35-deployment-and-psi-recheck-final.md`; 24 Cloudflare redirect rules valid (`35:50`); 381 pages live-verified (`35:11-16`).
- Report 47 manual export checklist created; the supplied 13 exports now satisfy its data-gathering intent (the exact folder `research-data\semrush-manual-exports\` specified at `47:28-45` is still absent, but equivalent exports were supplied in the separate folder).
- Source separation maintained: GSC actuals never mixed with vendor estimates.

### 3.2 Incomplete / partially complete

- **Field Core Web Vitals UNVERIFIED** (`35:18`, `46:12`): no PSI/GSC field data. Desktop lab CLS 0.371 recorded in `23:49-54` and `26:52,89`; later not reproduced and root cause not proven (`35:184-186`).
- **GSC indexation/404 pool unresolved** (`44:18-24`): 62 indexed, 549 not indexed, 291 discovered-not-indexed, 203 not found (404), 49 redirects. No redirect/deletion/indexing request performed.
- **Best Practices warnings** unresolved (`25:28-31,75`: 96 on two samples; `23:64-67`).
- **Accessibility sampled PASS only** (`24:5,55,65`): full inventory and scroll/screen-reader/keyboard tests NOT TESTED.
- **Cannibalization conclusions remain hypotheses** (`41:3`): no page merged/deleted/redirected/noindexed.
- **Off-page strategy documented, no outreach** (`43`, `42`): 25-row opportunity DB, no emails sent.
- Older approval files (`approval-required.md`, `approval-required-page-level.md`) still describe pre-deployment state and are now stale relative to reports 22/35.
- `47-semrush-manual-data-export-checklist.md:7` implementation gate: no owner approval artifact found.

### 3.3 Pending (not started in this phase)

- Phase 2 keyword-to-URL mapping system and consolidated keyword database with titles/H1s/content/internal-link suggestions (only seed CSVs and research exports exist).
- Additional free-source collection: Bing Webmaster Tools, Google Trends, public Google autocomplete/PAA/SERP, PSI/Lighthouse recheck — not collected in this phase.
- Screaming Frog crawl not run (binary not installed; free 500-URL limit verified sufficient for 381 URLs).
- GEO Optimizer local CLI not run (Python/`uv` absent); free web audit remains available.
- Phase 5–13 implementation and validation (all blocked pending approval).
- Phase 14 final deliverable set not produced (implementation-gated).

---

## 4. Existing technical SEO issues (verified evidence only)

| ID | Issue | Evidence | Severity |
|---|---|---|---|
| T1 | Category JSON-LD emitted **after `</head>`** on all 10 category pages | `categories\converter\index.html:27-28`; source `scripts\build-indexes.mjs:544` (`pageHead + '\n' + schema + '\n' + deepen(shellChrome)`) | Medium — placement inconsistency, schema itself parses |
| T2 | `404.html` is the only production page without canonical and JSON-LD; it has `noindex,follow` | `404.html:1`; full scan 0 canonical / 0 JSON-LD missing elsewhere | Low/intentional — noindex page |
| T3 | Stale tool count in scaffold metadata | `metadata.json:3` says `198+`; actual 242 tool pages and 242 `tools-manifest.json` entries | Low |
| T4 | Stale generator comments claim `llms.txt`/`ai-catalog.json` are in robots.txt and sitemap | `scripts\build-indexes.mjs:1229,1357-1358` vs `robots.txt:1-17` and `sitemap.xml:1` — neither contains them | Low — documentation drift |
| T5 | No visible breadcrumb-markup navigation found | 0 `<nav ...breadcrumb>` and 0 `class="...breadcrumb..."` across 393 HTML files; audit's `BreadcrumbDetected` used loose `/breadcrumb/i` at `_work\page-level-seo\audit.mjs:253`, matching JSON-LD | Medium — UX/crawl clarity |
| T6 | GSC indexation/404 pool unresolved | `44-google-search-console-correlation.md:18-24` | High |
| T7 | Field CWV unverified; historical desktop lab CLS 0.371 | `35:18,184-186`; `23:49-54`; `26:52,89` | High (validation gap) |
| T8 | Historical report arithmetic mismatch | `01-baseline-audit.md:25-26` and `03:5` sum to 393 while direct scan confirms 392 unique sitemap URLs; cause unverified | Low |
| T9 | Live exposure/indexing of `public\assets\aistudio\` exports unverified | `public\assets\aistudio\` contains SEMrush/GSC/PDF/ZIP exports incl. `Easy-work-Tools-main_5ece33c0.zip` | **Security/SEO risk — verify before any change** |

### Verified non-problems / false positives

- No duplicate canonicals or canonical mismatches in head (0/393). Raw matches in `tools\canonical-robots-checker\index.html:521` and `tools\meta-tag-generator\index.html:517` are JavaScript demo strings.
- No real broken internal links from the 5 raw `href` matches (`heic-to-jpg-converter:515`, `markdown-html-converter:522`, `markdown-previewer:307`, `pdf-compressor:573`, `pdf-to-epub:525,547`) — all JS templates/demo strings. 15,345 real `<a href>` occurrences scanned.
- Raw JSON-LD parse failure in `tools\schema-markup-generator\index.html:636` is a demo string; real blocks at 286, 457, 458 parse.
- `robots.txt:7-13` allows all, disallows `/api/`, declares sitemap — no verified general block defect; Cloudflare-prepended rules documented as expected (`14:9-12`, `27:7-13,21-29`).
- Sitemap has 0 duplicates, 0 missing local targets, no `/404`, no `<lastmod>` by design (`build-indexes.mjs:1231-1237`).

---

## 5. Duplicate work / existing implementations identified

1. **Duplicate source exports:** two byte-identical Ahrefs-style perf CSVs; three 8-row gap CSVs with permuted columns; large gap PDF repeats the CSV's leading rows. Deduplicate in any consolidated dataset; keep originals untouched.
2. **Manifests/generated outputs already exist:** `tools-manifest.json` (242), `blog-manifest.json` (129), `ai-catalog.json`, `sitemap.xml` (392), `llms.txt`, 10 category pages. Edits must go into generators, not generated files — otherwise `npm run build` will overwrite them.
3. **Internal-link normalization already implemented twice:** `scripts\clean-urls.mjs:38-79,91-101` plus `scripts\build-indexes.mjs:1569-1684,1686-1689`. Do not add a third link-rewriter.
4. **OG/Twitter completion already idempotent:** `scripts\og-metadata.mjs:176-204` skips noindex pages; do not hand-add OG tags site-wide.
5. **Breadcrumb schema already generated:** `scripts\build-indexes.mjs:378-414` and `scripts\category-sections.mjs:377-416`. Only placement/visible-markup gaps remain.
6. **Page-level SEO already implemented on 155 pages** (`34`, `35`) — do not re-optimize those pages unnecessarily; re-check only where new keyword data justifies it.
7. **React scaffold is not SEO infrastructure:** `src\App.tsx:6-8` is an empty stub; `vite.config.ts:6-22` is config only. Do not implement SEO there.
8. **Older approval files stale** relative to reports 22/35 — do not re-deploy already deployed CLS/page-level work.
9. **`metadata.json` is a stale scaffold artifact**, not the source of truth for tool counts.

---

## 6. Security and privacy risks

- **No credentials, tokens, API keys, cookies, browser profile data, passwords, or private user data were accessed, copied, or exposed.** No login, CAPTCHA bypass, or authorization attempt was made. No paid API key was entered. No outreach sent. No Git commit/push, deployment, DNS, or Cloudflare change.
- **Potential public exposure of research material:** `public\assets\aistudio\` contains SEMrush/GSC/PDF/ZIP exports and a project ZIP. If this directory is served publicly, it may expose research data and a source archive. Live exposure/crawl/indexing is **UNVERIFIED**; must be checked with a read-only HTTP request before deciding anything. No change made.
- **Backlink-profile risk (estimates only):** 187/245 backlinks from `rankvance.com`, anchors explicitly describing “niche edits”/“premium backlinks”, plus 2-backlink `.xyz` domains. Manual review only. **No disavow, outreach, or link removal was performed and none is recommended without owner decision.**
- **Report 47 gate** remains the governance control: no implementation until exports are analyzed (now done), documented (this file), roadmapped (this file §7), and approved by the owner.

---

## 7. Prioritized task tracker — every task listed

Status legend: **DONE** = verified complete; **BLOCKED** = cannot proceed without owner decision/approval or missing access; **PENDING** = not started; **PARTIAL** = some evidence exists but incomplete. All tasks are read-only or planning unless explicitly marked as implementation (all implementation tasks are BLOCKED).

### Phase 0 — identity and safety

| ID | Task | Priority | Status |
|---|---|---|---|
| T001 | Verify correct repository `F:\easyworktools.online\Easy-work-Tools` | P0 | DONE |
| T002 | Confirm research folder and 13 files | P0 | DONE |
| T003 | Create timestamped full backup before any change | P0 | DONE (`ewt-full-backup-20261124-170654`) |
| T004 | Create pre-change SHA-256 manifest (1,011 files) | P0 | DONE |
| T005 | Preserve all pre-existing modified/untracked files exactly | P0 | DONE (no file writes except this new report) |
| T006 | Live HTTP 200 spot-check (homepage, robots, sitemap, tool/blog/category) | P1 | DONE |

### Phase 1 — inspection

| ID | Task | Priority | Status |
|---|---|---|---|
| T007 | Analyze all 13 SEMrush/Ahrefs files (8 CSV + 5 PDF) | P0 | DONE |
| T008 | Cross-check new exports against prior research-data | P0 | DONE |
| T009 | Inspect codebase, generators, manifests, control files | P0 | DONE |
| T010 | Inspect all 11+ prior audit reports and supporting docs | P0 | DONE |
| T011 | Verify URL/page counts against 381-core inventory | P0 | DONE (381 confirmed) |
| T012 | Document Phase 1 findings and roadmapping gate | P0 | DONE (this file) |

### Phase 2 — SEMrush data integration

| ID | Task | Priority | Status |
|---|---|---|---|
| T013 | Preserve original SEMrush/Ahrefs data | P0 | DONE (untouched) |
| T014 | Deduplicate exports (2 identical perf CSVs; 3 permuted gap CSVs) | P1 | PENDING — do not delete originals |
| T015 | Consolidate keyword data with date/country/device/provenance labels | P1 | PENDING |
| T016 | Separate GSC actuals from vendor estimates in any dataset | P0 | PENDING (rule established in §2.3) |
| T017 | Identify cannibalization opportunities | P1 | PARTIAL — prior report 41 hypotheses only |
| T018 | Build keyword-to-URL mapping system | P0 | BLOCKED — owner approval |
| T019 | For every important keyword set target URL, title, H1, content/Internal-link suggestions, priority | P0 | BLOCKED — owner approval |
| T020 | Verify no existing URL/slug changes | P0 | BLOCKED — implementation gate |

### Phase 3 — free research methods

| ID | Task | Priority | Status |
|---|---|---|---|
| T021 | Verify GSC MCP connection | P1 | DONE — not connected; use local GSC actuals |
| T022 | Verify OpenSEO license/data costs | P1 | DONE — MIT code, paid DataForSEO data → not used for data |
| T023 | Verify Screaming Frog free limits | P1 | DONE — 500 URLs, no signup; binary not installed here |
| T024 | Verify GEO Optimizer source/license/cost | P2 | DONE — MIT/GPL-free local; Python/`uv` absent; web audit available |
| T025 | Bing Webmaster Tools free data | P2 | PENDING — no authorized session |
| T026 | Google Trends relative-interest data | P2 | PENDING |
| T027 | Public Google autocomplete/PAA/SERP review | P2 | PENDING — no aggressive scraping |
| T028 | PSI/Lighthouse recheck | P1 | PARTIAL — historical reports 22/23/35; no fresh field data |
| T029 | Schema.org Validator / Rich Results Test checks | P2 | PENDING |
| T030 | Other verified free sources, only if value added | P3 | PENDING |

### Phase 4 — keyword discovery and clustering

| ID | Task | Priority | Status |
|---|---|---|---|
| T031 | Combine SEMrush + GSC + free sources + site content | P1 | PARTIAL — SEMrush + GSC combined; free sources pending |
| T032 | Categorize keywords into 10 site categories | P1 | PENDING |
| T033 | Label commercial/informational/tool/comparison/long-tail/question/low-KD/AI queries | P1 | PENDING |
| T034 | Select one primary target URL per cluster | P0 | BLOCKED — owner approval |
| T035 | Create new page recommendations only for distinct intent | P1 | BLOCKED — owner approval |

### Phase 5 — technical SEO

| ID | Task | Priority | Status |
|---|---|---|---|
| T036 | Inspect robots.txt, sitemap, canonicals, meta robots, status codes, redirects, links, structured data, speed | P0 | DONE (inspection) |
| T037 | Fix category JSON-LD placement after `</head>` via `build-indexes.mjs:544` | P2 | BLOCKED — implementation gate |
| T038 | Decide whether 404.html needs canonical/JSON-LD | P3 | BLOCKED — noindex page, likely intentional |
| T039 | Correct stale `metadata.json` tool count via generator/source | P3 | BLOCKED — implementation gate |
| T040 | Correct stale generator comments about llms.txt/ai-catalog | P3 | BLOCKED — implementation gate |
| T041 | Add visible breadcrumb markup via shared generators | P2 | BLOCKED — implementation gate |
| T042 | Verify live exposure of `public\assets\aistudio\` exports (read-only HTTP) | P1 | PENDING — verification task |
| T043 | Resolve GSC indexation/404 pool (62/549/291/203/49) | P1 | BLOCKED — owner decision, no indexing request without approval |
| T044 | Preserve all existing URLs and redirects | P0 | DONE/ongoing constraint |

### Phase 6 — on-page SEO

| ID | Task | Priority | Status |
|---|---|---|---|
| T045 | Evaluate homepage, 10 categories, 242 tools, 129 blogs for title/description/H1/content/schema/internal links | P1 | PARTIAL — prior 155-page work verified; full re-review pending |
| T046 | Implement justified unique title/description improvements | P1 | BLOCKED — owner approval |
| T047 | Avoid keyword stuffing/boilerplate/false claims | P0 | DONE — constraint recorded |

### Phase 7 — internal linking

| ID | Task | Priority | Status |
|---|---|---|---|
| T048 | Analyze full internal-link graph (orphans, depth, overused anchors) | P1 | PARTIAL — 15,345 anchors scanned; graph analysis pending |
| T049 | Implement contextual category↔tool↔blog links via shared renderers | P0 | BLOCKED — owner approval |
| T050 | Build internal-link map CSV (source, destination, anchor, type, reason) | P1 | BLOCKED — implementation gate |
| T051 | Verify all new links work | P0 | BLOCKED — implementation gate |

### Phase 8 — content/blog

| ID | Task | Priority | Status |
|---|---|---|---|
| T052 | Inspect 129 blogs for thin/duplicate/outdated content and missing FAQs/tool links | P1 | PARTIAL — prior audit 30 exists |
| T053 | Improve existing articles where justified | P1 | BLOCKED — owner approval |
| T054 | Create content briefs for genuinely missing topics only | P2 | BLOCKED — owner approval |
| T055 | Do not invent features, credentials, statistics, or fake reviews | P0 | DONE — constraint recorded |

### Phase 9 — GEO/AEO

| ID | Task | Priority | Status |
|---|---|---|---|
| T056 | Verify GEO Optimizer repo/license/dependencies/cost | P2 | DONE — MIT, free local/web, Python/`uv` absent |
| T057 | Review definitions, direct answers, FAQs, step-by-step usage, limitations, entity info, schema | P1 | PARTIAL — schema/BreadcrumbList verified; content review pending |
| T058 | Review robots.txt AI-crawler access separately from search indexing | P2 | DONE — no intended block verified (`14`, `27`) |
| T059 | Review llms.txt accuracy | P2 | PARTIAL — generated; content accuracy not verified |
| T060 | Implement GEO/AEO improvements without fake ratings/reviews/authors | P1 | BLOCKED — owner approval |

### Phase 10 — off-page

| ID | Task | Priority | Status |
|---|---|---|---|
| T061 | Analyze SEMrush/GSC/Bing/public backlink data, separate verified vs estimates | P1 | PARTIAL — vendor estimates analyzed; GSC links report not used |
| T062 | Identify competitor link targets and unlinked mentions | P2 | PARTIAL — 199-domain matrix; 25-row opportunity DB |
| T063 | Prepare legitimate outreach drafts/target list for approval | P2 | BLOCKED — owner approval; no emails sent |
| T064 | Manual review of rankvance/niche-edit anchors; no automatic disavow | P1 | PENDING — owner decision |
| T065 | Do not purchase links or use link farms | P0 | DONE — constraint recorded |

### Phase 11 — Core Web Vitals

| ID | Task | Priority | Status |
|---|---|---|---|
| T066 | Measure available LCP/INP/CLS/TTFB/image/script data | P1 | PARTIAL — lab data only; field `No Data` |
| T067 | Fix verified performance issues without visual regressions | P1 | BLOCKED — root cause of CLS 0.371 not proven |
| T068 | Measure before/after; never fabricate CWV improvements | P0 | DONE — constraint recorded |

### Phase 12 — implementation (all blocked)

| ID | Task | Priority | Status |
|---|---|---|---|
| T069 | Controlled stages: backup → inspect → analyze → prioritize → implement → test → validate → document | P0 | BLOCKED — owner approval |
| T070 | Implement via shared generators, not hundreds of hand-edits | P0 | BLOCKED — safe targets identified in §5 of codebase report |
| T071 | Preserve design, functionality, tools, blog, categories | P0 | DONE — constraint recorded |

### Phase 13 — validation

| ID | Task | Priority | Status |
|---|---|---|---|
| T072 | Run `npm run build` in a copy first (file-writing generator) | P0 | BLOCKED — implementation gate |
| T073 | Run `npm run lint` (`server.ts` type-check only) | P1 | BLOCKED — implementation gate |
| T074 | Validate no broken links/404s/URL changes/noindex/canonical/sitemap/robots/schema/secrets | P0 | BLOCKED — implementation gate |
| T075 | Compare final state with pre-change backup hashes | P0 | BLOCKED — implementation gate |
| T076 | Mark untestable items as UNVERIFIED | P0 | DONE — constraint recorded |

### Phase 14 — deliverables

| ID | Task | Priority | Status |
|---|---|---|---|
| T077 | Create timestamped report directory | P1 | PARTIAL — this report is first Phase 1 artifact |
| T078 | `SEO_Implementation_Summary.md` | P1 | BLOCKED — implementation not done |
| T079 | `Technical_SEO_Audit.md` | P1 | BLOCKED — implementation-gated |
| T080 | `On_Page_SEO_Changes.md` | P1 | BLOCKED — implementation-gated |
| T081 | `Internal_Linking_Report.csv` | P1 | BLOCKED — implementation-gated |
| T082 | `Keyword_To_URL_Mapping.csv` | P1 | BLOCKED — owner approval |
| T083 | `Keyword_Research_Combined.csv` | P1 | BLOCKED — owner approval |
| T084 | `GEO_AEO_Implementation_Report.md` | P2 | BLOCKED — implementation-gated |
| T085 | `Off_Page_SEO_Opportunity_Report.md` | P2 | BLOCKED — owner approval |
| T086 | `Core_Web_Vitals_Report.md` | P1 | BLOCKED — no field data |
| T087 | `Free_Tools_And_Data_Sources.md` | P2 | PARTIAL — classifications recorded in §3 and codebase report §7 |
| T088 | `Remaining_Issues_And_Recommendations.md` | P1 | BLOCKED — implementation-gated |
| T089 | `Changed_Files_Report.md` | P1 | BLOCKED — no implementation changes |

**Tracker totals:** 89 tracked tasks — DONE 24, PARTIAL 11, PENDING 9, BLOCKED 45.

---

## 8. Phase 1 gate and next step

1. Both Phase 1 investigations are complete and findings are documented in this file.
2. Per `47-semrush-manual-data-export-checklist.md:7`, implementation requires owner approval of the roadmap.
3. **No implementation, build, commit, push, deployment, DNS/Cloudflare change, indexing request, sitemap resubmission, cache purge, paid service, or outreach has been performed.**
4. All pre-existing modified and untracked files remain exactly as found; the only new artifact is this report.
5. On approval, recommended first implementation batch (highest impact / lowest risk): T018–T020 keyword-to-URL mapping, T037 category schema placement, T041 visible breadcrumbs, T039/T040 stale metadata/comments, T049–T051 internal-link additions — all made in shared generators and validated in a copy before any in-place build.
