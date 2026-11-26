# 60 — Keyword classification, deduplication and cannibalization hypotheses (T017, T031, T032, T033) — 2026-11-24

**Status:** COMPLETE for the two authorized source files. Analysis only. No generator, HTML page, CSS, sitemap, canonical, manifest, redirect, existing report, GSC/Ahrefs/SEMrush source file, deployment or Git push was modified.

**Scope rule:** every count below is derived solely from the two named source CSVs. First-party Google Search Console (GSC) actuals and third-party SEMrush/Ahrefs-style estimates are kept in separate, unchanged columns. Unsupported dimensions are marked `DATA UNAVAILABLE`; no value was fabricated.

---

## 1. New artifacts created (exactly two)

| # | Artifact | Rows | Columns | Bytes |
|---:|---|---:|---:|---:|
| 1 | `reports/complete-seo-performance-audit/60-keyword-classification-cannibalization-2026-11-24.md` | — | — | this file |
| 2 | `reports/complete-seo-performance-audit/data/keyword-research/keyword-classification-cannibalization-2026-11-24.csv` | 10,642 data rows + 1 header | 48 | 6,515,660 |

The output CSV preserves all 26 original combined-CSV columns in their original order and values (validated: 0 mismatches across 10,642 × 26 cells), then appends 22 derived columns:

`EvidenceClass`, `DerivedSiteCategory`, `CategoryRule`, `IntentNormalized`, `IntentRule`, `IntentSourceValue`, `TypeLabels`, `SearchVolumeBand`, `KDBand`, `DuplicateKey`, `DuplicateGroupSize`, `DuplicateStatus`, `DuplicateCanonicalRecordID`, `MappingClusterID`, `MappingSearchIntent`, `MappingRecommendedTargetUrl`, `MappingCurrentTargetUrl`, `MappingPageStatus`, `MappingPriority`, `MappingMethod`, `CannibalizationHypothesis`, `CannibalizationGroupDetail`.

Pre-existing working-tree changes were observed before this work and were left untouched. No third-party script was written inside the project; analysis scripts were kept in `C:\Users\ahmad\AppData\Local\Temp\opencode\`.

### 1.1 Source fingerprints (read-only)

| Source | Rows | Columns | Bytes | SHA-256 |
|---|---:|---:|---:|---|
| `reports/complete-seo-performance-audit/research-data/keyword-research-combined-2026-11-24.csv` | 10,642 | 26 | 4,228,974 | `5e21441f3e43cf5649f61e8edd522f4c10c4a3639934880ca0ef65c8e0c79c35` |
| `reports/complete-seo-performance-audit/research-data/keyword-to-url-mapping-2026-11-24.csv` | 1,172 | 21 | 578,173 | `c028cf3bbd5a50883b4ab91d07cab0d671fdbde9426385d19561962c24196319` |

---

## 2. Inputs, evidence classes and source columns used

### 2.1 Combined keyword source (10,642 rows)

Original columns copied unchanged: `RecordID`, `MetricClass`, `SourceGroup`, `SourceFile`, `Keyword`, `CountryDatabase`, `Device`, `DateRange`, `SiteCategory`, `Intent`, `SearchVolumeEstimate`, `KDEstimate`, `CPCEstimateUsd`, `EwtPositionEstimate`, `EwtPageEstimate`, `CompetitorPositions`, `CompetitorPages`, `ResultsEstimate`, `OpportunityType`, `SuggestedUseCase`, `GscClicksActual`, `GscImpressionsActual`, `GscCtrActual`, `GscPositionActual`, `FinalUrl`, `Notes`.

Columns actually used for derivation: `MetricClass`, `SourceGroup`, `Keyword`, `SiteCategory`, `Intent`, `SearchVolumeEstimate`, `KDEstimate`, `FinalUrl`, `GscClicksActual`/`GscImpressionsActual` (separation check only), `RecordID` (deterministic ordering only). `SourceFile` and `Notes` were retained as provenance.

Populated-cell counts (blank cells were not imputed):

| Column | Populated | Column | Populated |
|---|---:|---|---:|
| `RecordID` | 10,642 | `ResultsEstimate` | 10,008 |
| `MetricClass` | 10,642 | `OpportunityType` | 161 |
| `SourceGroup` | 10,642 | `SuggestedUseCase` | 161 |
| `SourceFile` | 10,642 | `GscClicksActual` | 92 |
| `Keyword` | 10,642 | `GscImpressionsActual` | 92 |
| `CountryDatabase` | 10,261 | `GscCtrActual` | 92 |
| `Device` | 10,261 | `GscPositionActual` | 92 |
| `DateRange` | 10,261 | `FinalUrl` | 381 |
| `SiteCategory` | 542 | `Notes` | 10,642 |
| `Intent` | 10,094 | `SearchVolumeEstimate` | 10,169 |
| `EwtPositionEstimate` | 10,008 | `KDEstimate` | 10,169 |
| `EwtPageEstimate` | 0 | `CPCEstimateUsd` | 10,169 |
| `CompetitorPositions` | 10,008 | `CompetitorPages` | 10,008 |

Evidence classes from `MetricClass`:

| `EvidenceClass` | Rows | Meaning |
|---|---:|---|
| Third-party estimate | 10,169 | 10,008 SEMrush gap rows + 161 clean-keyword estimates with unstated provenance |
| No metrics (URL seed) | 381 | 242 tool + 129 blog seeds; volume/KD/GSC unavailable |
| GSC actual (first-party) | 92 | Measured GSC query rows; volume/KD/CPC unavailable |

Source-group composition: Keyword Gap — untapped (10k) 10,000; Tool seeds 242; Clean Keywords 161; Blog seeds 129; GSC queries 92; Category seeds 10; Keyword Gap — missing (8) 8.

### 2.2 Mapping source (1,172 rows)

Columns used for derivation: `ClusterID`, `TargetKeyword`, `SearchIntent` (copied for comparison only), `CurrentTargetUrl`, `RecommendedTargetUrl`, `PageStatus`, `Priority`, `MappingMethod`. `SourceFile` and `Notes` were retained in the source file but are not re-copied into the new CSV. No title/H1/content/link recommendation was changed or acted upon.

Mapping composition: 919 SEMrush estimate rows, 161 third-party estimate rows, 92 GSC actual rows; 100 rows with a `RecommendedTargetUrl` spanning 40 unique URLs; 23 shared-URL groups; `PageStatus` = reject 625, research required 445, existing page (verify live URL) 63, existing page 37, new-page opportunity 2 (the last three status strings are as recorded in the source). `Priority` = P0 9 / P1 35 / P2 390 / P3 738.

---

## 3. Deterministic counting and classification method

All rules are implemented on raw row values. `Keyword` is never rewritten in the output.

1. **Row unit:** one `RecordID` row in the combined CSV = one counted row. Output has all 10,642 rows; deduplication adds flags but deletes nothing.
2. **Normalization key (`DuplicateKey`):** `lowercase(trim(keyword))` with internal whitespace collapsed to one space. No stemming, translation or punctuation stripping is applied at this stage.
3. **Mapping join:** mapping rows were keyed by the same normalization of `TargetKeyword`; when a keyword had more than one mapping row, the row with the lowest `ClusterID` was used. 1,168 unique mapping keywords joined to 1,204 combined rows (extra rows are exact duplicates). Four mapping keywords had two identical-`ClusterID` rows: `convertir imagen a excel`, `online tool to remove background from image`, `pdf modifier`, `transcribe video russian to english`. 0 mapping keywords were absent from the combined CSV.
4. **Canonical site categories:** the 10 slugs were derived from the 10 `Category seeds` rows via `FinalUrl` path `/categories/<slug>/`: `ai-write`, `calculator`, `converter`, `developer`, `image`, `pdf`, `seo`, `text`, `utility`, `video-audio`. `Unassigned - no supported evidence` is an explicit non-category label, not an 11th site category.
5. **Category assignment priority:** (a) category-seed URL; (b) `Clean Keywords.SiteCategory` crosswalk (`Video Tools`/`Audio Tools` → `video-audio`; `PDF Tools` → `pdf`; `Calculator Tools` → `calculator`; `SEO Tools` → `seo`; `Image Tools` → `image`; `Converter Tools` → `converter`; `Utility Tools` → `utility`; `Developer Tools` → `developer`; `Text Tools` → `text`); (c) joined mapping `RecommendedTargetUrl`/`CurrentTargetUrl` only when it is an explicit `/categories/<slug>/` URL; (d) first matching keyword regex, in this fixed order: `pdf`, `video-audio`, `image`, `ai-write`, `seo`, `calculator`, `developer`, `converter`, `text`, `utility`; (e) otherwise unassigned. Regexes are case-insensitive whole-word rules over tokens such as `pdf|acrobat|docx?|ocr`, `video|audio|mp3|mp4|youtube|tiktok|music|transcrib*`, `image|photo|jpg|jpeg|png|webp|favicon|thumbnail|watermark|remove background`, `ai write|article rewriter|paraphras*|rephras*|summari[sz]*|nda generator`, `seo|backlink*|meta tag*|schema markup`, `calculator|mph to kph|cm to inches|percentage`, `developer|json|css|html|javascript|python|regex|sql|api`, `converter|convert|conversion`, `text|word counter|character counter|translate|caption`, `checker|random|qr code|password|social share|link preview|url|validator|generator|maker`. Exact regexes are reproducible from the generator path recorded in the CSV column `CategoryRule`.
6. **Intent (`IntentNormalized`):** prefer `Intent` from the combined CSV, split on commas and lowercased (`commercial, informational` → `commercial; informational`; `n/a` treated as blank). If source intent is blank/`n/a`, transparent keyword rules are applied in order: navigational (brand/domain tokens) → transactional (`download|buy|purchase|subscribe|sign up|install`) → commercial (`best|top|vs|versus|alternative*|review*|compare*|price|pricing`) → informational (`how to|what is|why|guide|tutorial|meaning|example*|idea*|learn|?`). If none matches, the label is `DATA UNAVAILABLE`. `IntentRule` records `source-column:Intent`, `transparent-rule`, or `no-supported-evidence`; `IntentSourceValue` preserves the raw source value.
7. **Type labels (`TypeLabels`, multi-label, semicolon-separated):** `question` = question-word start or `?`; `long-tail` = at least four whitespace tokens; `comparison` = `vs|versus|compared to/with|difference between|alternative* to|better than`; `tool` = `tool|converter|convert|generator|calculator|editor|maker|creator|builder|software|app|api|ocr|online|free`; `AI query` = `ai|artificial intelligence|chatgpt|gpt|gemini|claude|copilot|llm|deepseek|perplexity|generative`; `low-KD` = numeric `KDEstimate` in 0–14 inclusive. Blank `KDEstimate` receives no `low-KD` label. Type-label counts are per-label and therefore sum to more than 10,642.
8. **Bands:** volume bands use only `SearchVolumeEstimate`; KD bands use only `KDEstimate`; blanks are `DATA UNAVAILABLE` and are never treated as zero. Fixed bands are `0`, `1-99`, `100-499`, `500-999`, `1,000-4,999`, `5,000-9,999`, `10,000-49,999`, `>=50,000` and KD `0`, `1-4`, `5-9`, `10-14`, `15-24`, `25-49`, `>=50`.
9. **Deduplication:** `DuplicateGroupSize` is the number of rows sharing a `DuplicateKey`; within a group of size >1, the canonical `PRIMARY` row is selected by evidence precedence GSC actual → third-party estimate → no-metrics seed, then lowest numeric `RecordID`. Other rows are `DUPLICATE`; singleton rows are `UNIQUE`. No row was removed.
10. **Cannibalization hypothesis A — shared target URL:** all 1,172 mapping rows were grouped by nonblank `RecommendedTargetUrl`; groups with size >1 were assigned `URL-0001`…`URL-0023`. Duplicate mapping keyword rows are counted as separate mapping rows, as recorded in the source.
11. **Cannibalization hypothesis B — near-identical keyword:** evaluated on the 1,168 unique mapped target keywords only. Content tokens were lowercased, non-alphanumerics removed, whitespace collapsed, and stopwords removed (`to, a, an, the, for, of, in, on, with, online, free, converter, convert, tool, tools, app, apps, 2026`). A pair was grouped when both sides had at least two content tokens and Jaccard similarity of content-token sets was ≥ 0.80. Connected components were assigned `NEAR-0001`…`NEAR-0037`. Unmapped competitor-gap keywords were not similarity-clustered; they remain deduplicated by exact normalized key only.
12. **Final flag:** `BOTH` if a row matched both hypotheses, `SHARED_TARGET_URL` or `NEAR_IDENTICAL_KEYWORD` if one, otherwise `NONE`. These are review hypotheses, not confirmed cannibalization; no page was merged, redirected, noindexed, retitled or edited.

---

## 4. Exact derived counts

### 4.1 Site categories (T032)

| DerivedSiteCategory | Rows | Assignment source |
|---|---:|---|
| Unassigned - no supported evidence | 8,020 | no-supported-evidence |
| image | 799 | 794 keyword rule + 4 clean-keyword source category + 1 category seed |
| utility | 517 | 513 keyword rule + 3 clean-keyword source category + 1 category seed |
| video-audio | 503 | 421 keyword rule + 44 Video Tools + 37 Audio Tools + 1 category seed |
| pdf | 340 | 310 keyword rule + 29 clean-keyword source category + 1 category seed |
| text | 115 | 112 keyword rule + 2 clean-keyword source category + 1 category seed |
| ai-write | 113 | 112 keyword rule + 1 category seed |
| developer | 103 | 100 keyword rule + 2 clean-keyword source category + 1 mapping category-page URL |
| calculator | 55 | 34 keyword rule + 19 clean-keyword source category + 1 category seed + 1 mapping category-page URL |
| converter | 48 | 35 keyword rule + 3 clean-keyword source category + 1 category seed + 9 mapping category-page URLs |
| seo | 29 | 10 keyword rule + 18 clean-keyword source category + 1 category seed |

Canonical-category assignment subtotal: **2,622 rows** (10,642 − 8,020 unassigned). Category-rule counts across all rows: `no-supported-evidence` 8,020; `keyword-rule:image` 794; `keyword-rule:utility` 513; `keyword-rule:video-audio` 421; `keyword-rule:pdf` 310; `clean-keyword-source-category` 161; `keyword-rule:ai-write` 112; `keyword-rule:text` 112; `keyword-rule:developer` 100; `keyword-rule:converter` 35; `keyword-rule:calculator` 34; `category-seed-url` 10; `keyword-rule:seo` 10; `mapping-category-page-url` 10. Sum = 10,642.

### 4.2 Intent labels (T033)

| `IntentNormalized` | Rows |
|---|---:|
| informational | 7,907 |
| commercial | 1,036 |
| commercial; informational | 597 |
| DATA UNAVAILABLE | 464 |
| informational; transactional | 214 |
| navigational | 211 |
| transactional | 96 |
| navigational; transactional | 72 |
| informational; navigational | 39 |
| commercial; navigational | 6 |

Total = 10,642. Rule provenance: `source-column:Intent` 10,093; `transparent-rule` 85; `no-supported-evidence` 464. The 549 rows with blank or `n/a` source intent (381 seeds + 92 GSC + 75 gap + 1 `n/a`) were resolved as 85 rule-inferred and 464 `DATA UNAVAILABLE`. Multi-label source values were preserved as separate labels, not collapsed into a single intent.

### 4.3 Type labels (T033)

| `TypeLabels` value | Rows carrying label |
|---|---:|
| low-KD | 10,169 |
| long-tail | 4,362 |
| tool | 1,410 |
| question | 664 |
| AI query | 177 |
| comparison | 31 |
| NONE (no supported type rule) | 249 |

Per-label counts total 16,813 across multi-labeled rows; 10,393 rows have at least one type label and 249 have `NONE`. All 10,169 rows with numeric `KDEstimate` qualify as `low-KD` because both supplied estimate sets are filtered to KD 0–14; this is a source-filter property, not an independent discovery.

### 4.4 Search-volume and KD ranges

| `SearchVolumeEstimate` band | Rows | `KDEstimate` band | Rows |
|---|---:|---|---:|
| DATA UNAVAILABLE | 473 | DATA UNAVAILABLE | 473 |
| 100-499 | 8,155 | 10-14 | 6,192 |
| 500-999 | 1,025 | 5-9 | 2,964 |
| 1,000-4,999 | 893 | 1-4 | 779 |
| 1-99 | 29 | 0 | 234 |
| 5,000-9,999 | 50 | 15-24 | 0 |
| 10,000-49,999 | 17 | 25-49 | 0 |
| >=50,000 | 0 | >=50 | 0 |
| 0 | 0 | — | — |

Observed numeric volume range: 30–49,500 (0 numeric zero rows; 29 rows fall in the 1–99 band). Observed numeric KD range: 0–14. The 473 blank rows are 381 URL seeds plus 92 GSC actual rows.

### 4.5 Deduplication (T031)

| Metric | Count |
|---|---:|
| Unique normalized `DuplicateKey` values | 10,560 |
| Exact-duplicate groups (size > 1) | 74 |
| Rows inside those groups | 156 |
| Redundant rows beyond one primary per group | 82 |
| `UNIQUE` rows | 10,486 |
| `PRIMARY` rows | 74 |
| `DUPLICATE` rows | 82 |

Canonical-row evidence mix: GSC actual 13, SEMrush estimate 15, no-metrics seed 46. Group-size distribution: 66 groups of size 2 and 8 groups of size 3 (74 groups total; 156 rows). The eight size-3 groups are `explain it`, `nda generator`, `landing page copy generator`, `blog post generator`, `article rewriter`, `business slogan generator`, `content improver`, and `business plan generator` (GSC + tool seed + blog seed). Exact duplicates are preserved, not deleted, so the output remains 10,642 rows.

### 4.6 Mapping join and GSC/estimate separation (T016/T031)

| Check | Count |
|---|---:|
| Mapping rows | 1,172 |
| Unique mapped keywords | 1,168 |
| Combined rows joined to a mapping row | 1,204 |
| Unique combined keywords joined | 1,168 |
| Mapping keywords absent from combined CSV | 0 |
| GSC actual rows in combined CSV | 92 |
| GSC rows with `SearchVolumeEstimate` or `KDEstimate` | 0 / 0 |
| Estimate rows with `GscClicksActual` or `GscImpressionsActual` | 0 / 0 |
| Seed rows with any volume/KD/GSC metric | 0 |

GSC columns were copied verbatim from `GscClicksActual`, `GscImpressionsActual`, `GscCtrActual`, `GscPositionActual`. No GSC value was used to populate an estimate column, and no SEMrush/Ahrefs-style estimate was used to populate a GSC column.

---

## 5. Cannibalization hypotheses (T017)

| `CannibalizationHypothesis` | Rows |
|---|---:|
| NONE | 10,475 |
| SHARED_TARGET_URL | 72 |
| NEAR_IDENTICAL_KEYWORD | 66 |
| BOTH | 29 |

Total flagged rows = 167 (the three non-`NONE` counts sum to 167; no row is counted twice in the total). Of those, 101 combined rows carry a shared-URL flag (72 + 29) and 95 carry a near-identical flag (66 + 29). The 101 shared-URL combined rows exceed the 83 shared-URL mapping rows because exact-duplicate combined rows join the same mapping keyword; group sizes below are mapping-row counts, while the four hypothesis counts are combined-row counts. Every flagged row carries its group ID and group size in `CannibalizationGroupDetail`.

### 5.1 Shared target URL (23 groups, 83 mapping rows)

The 83 mapping rows include duplicate mapping keyword rows that exist in the source. Full membership is in the CSV via `URL-####`.

| Group | Size | RecommendedTargetUrl | Example keywords |
|---|---:|---|---|
| URL-0001 | 14 | `https://easyworktools.online/categories/calculator/` | wheel calculator; free email campaign roi calculator tool on nemin .io; free agency retainer calculator tool on nemin. io; free freelancer hourly rate calculator tool on nemin .io (+10 more) |
| URL-0002 | 11 | `https://easyworktools.online/categories/converter/` | file converter to png; file converter to jpg; free movie converter to mp4; 1800s english converter (+7 more) |
| URL-0003 | 5 | `https://easyworktools.online/tools/ai-write/article-rewriter/` | rewrite article; article rewriter wizard; article rewrite; rewrite articles; article rewriter |
| URL-0004 | 5 | `https://easyworktools.online/tools/pdf-to-tiff/` | pdf to tiff; pdf to tiff compressor; convert pdf to tiff 300 dpi; pdf to tiff converter (+1 more) |
| URL-0005 | 4 | `https://easyworktools.online/tools/ai-write/explain-it/` | explain it; explain it.; xplain it; explain it in simple way |
| URL-0006 | 4 | `https://easyworktools.online/tools/pdf-edit/` | pdf modifier (×2); pdf editing tools free; leedpdf |
| URL-0007 | 4 | `https://easyworktools.online/tools/pdf-to-word/` | pdf to word free; convert pdf to word free online converter; pdf to.word.converter; convert pdf to editable word free online |
| URL-0008 | 3 | `https://easyworktools.online/tools/ai-write/business-plan-generator/` | business plan generator; ai business plan generator online free; free business plan generator |
| URL-0009 | 3 | `https://easyworktools.online/tools/ai-write/search/` | super teacher worksheets word search generator; valentines day word search; sample qualitative research questionnaire |
| URL-0010 | 3 | `https://easyworktools.online/tools/mph-to-kph/` | 14 mph to kph; 217 mph to kph; mph to kph |
| URL-0011 | 3 | `https://easyworktools.online/tools/pdf-compressor/` | pdf compressor free; online pdf compression tool; compress pdf to 400kb |
| URL-0012 | 2 | `https://easyworktools.online/blog/article-rewriter` | article rewriting; how to rewrite articles |
| URL-0013 | 2 | `https://easyworktools.online/blog/tiktok-thumbnail-downloader` | tiktok thumbnail download; tiktok thumbnail downloader |
| URL-0014 | 2 | `https://easyworktools.online/categories/developer/` | droven. io best tech tools for developers; free developer tools for code and data by livekod.com |
| URL-0015 | 2 | `https://easyworktools.online/tools/ai-write/blog-post-generator/` | blog post generator; random blog post generator |
| URL-0016 | 2 | `https://easyworktools.online/tools/ai-write/content-improver/` | content improver; content improver ai |
| URL-0017 | 2 | `https://easyworktools.online/tools/ai-write/nda-generator/` | nda generator; free nda generator |
| URL-0018 | 2 | `https://easyworktools.online/tools/meme-generator/` | speech bubble meme generator; meme generator with speech bubble |
| URL-0019 | 2 | `https://easyworktools.online/tools/pdf-split/` | online pdf splitter tool; online pdf splitting tools |
| URL-0020 | 2 | `https://easyworktools.online/tools/pdf-to-jpg/` | pdf to jpg api; pdg a jpg |
| URL-0021 | 2 | `https://easyworktools.online/tools/remove-background-from-image/` | online tool to remove background from image (×2) |
| URL-0022 | 2 | `https://easyworktools.online/tools/social-share-preview/` | social share checker; social sharing checker |
| URL-0023 | 2 | `https://easyworktools.online/tools/webp-to-pdf/` | webp to pdf; .webp to pdf |

Interpretation limits: a shared URL is often an intentional cluster. The two largest groups are category-page catch-alls and include irrelevant branded/template queries already marked `Reject` or `Research` in the mapping source; they are not evidence that 14 or 11 separate pages compete. The tool/guide pairs (`URL-0003` vs `URL-0012`, `explain it`, `pdf to word`) require intent differentiation review before any change.

### 5.2 Near-identical keyword groups (37 groups, 60 pairs, 66 combined rows)

| Group | Size | Keywords |
|---|---:|---|
| NEAR-0001 | 2 | .webp to pdf; webp to pdf |
| NEAR-0002 | 3 | 300 dpi tiff converter; convert to tiff 300 dpi; tiff 300 dpi |
| NEAR-0003 | 2 | article rewrite; rewrite article |
| NEAR-0004 | 2 | best ai video generation tools 2025; best free ai video generation tools 2026 |
| NEAR-0005 | 2 | birds in wallpaper; birds wallpaper |
| NEAR-0006 | 2 | black history month posters; posters for black history month |
| NEAR-0007 | 2 | blogsyear .org seo tools; blogsyear org free seo tools |
| NEAR-0008 | 2 | business plan creator; online business plan creator |
| NEAR-0009 | 2 | business plan generator; free business plan generator |
| NEAR-0010 | 2 | calendar for feb 2026; feb calendar 2026 |
| NEAR-0011 | 2 | cat calendar; cat calendar 2026 |
| NEAR-0012 | 2 | college application resume; resume for college application |
| NEAR-0013 | 2 | convert pdf to editable word free online; convert pdf to editable word online free |
| NEAR-0014 | 3 | convert pdf to word free online converter; pdf to word free; pdf to.word.converter |
| NEAR-0015 | 2 | download youtube video media mister; youtube video download media mister |
| NEAR-0016 | 2 | explain it; explain it. |
| NEAR-0017 | 3 | father's day card for father; father's day card greetings; father's day card papa |
| NEAR-0018 | 2 | free alternative to fruity loops; fruity loops free alternative |
| NEAR-0019 | 2 | free nda generator; nda generator |
| NEAR-0020 | 2 | free pdf measurement tool; pdf measurement tool |
| NEAR-0021 | 4 | free pdf measuring tool; measuring tool in pdf; measuring tool pdf; pdf measuring tools |
| NEAR-0022 | 2 | green wallpaper; wallpaper green |
| NEAR-0023 | 2 | how to create a favicon for your website; how to create favicon for website |
| NEAR-0024 | 4 | how to make music computer; how to make music in computer; how to make music on computer; how to make music on your computer |
| NEAR-0025 | 2 | join pd .com; join pd com |
| NEAR-0026 | 2 | link preview online; link preview tool |
| NEAR-0027 | 2 | meme generator with speech bubble; speech bubble meme generator |
| NEAR-0028 | 2 | mph to kph; mph-kph |
| NEAR-0029 | 2 | pdf to tiff; pdf to tiff converter |
| NEAR-0030 | 2 | pink wallpaper plain; plain pink wallpaper |
| NEAR-0031 | 3 | plain brown wallpaper; plain wallpaper brown; wallpaper plain brown |
| NEAR-0032 | 2 | png transparent acer nitro 5 logo; png transparent acer nitro 5 png transparent |
| NEAR-0033 | 3 | printable september calendar; september 2026 calendar printable; september 2026 calendar printable free |
| NEAR-0034 | 2 | smartquotes mobile apps; smartquotes mobile mobile apps |
| NEAR-0035 | 2 | twitter video tool; twitter video tools |
| NEAR-0036 | 2 | upsampler ai video generator; upsampler free ai video generator |
| NEAR-0037 | 4 | what is a standard poster size; what is the size of a regular poster; what size is a poster; what size is poster size |

These are token-similarity hypotheses only. 29 rows satisfy both tests (`BOTH`), notably PDF-to-Word, PDF-to-TIFF, article-rewriter, explain-it, and NDA-generator clusters.

---

## 6. DATA UNAVAILABLE and explicit limitations

| Dimension | Status in these two sources |
|---|---|
| GSC search volume, KD, CPC for the 92 actual queries | `DATA UNAVAILABLE` — never derived from SEMrush estimates |
| Ahrefs keyword volume/KD/position per keyword | `DATA UNAVAILABLE` — no Ahrefs keyword table in either source |
| GSC query → landing-page pairs | `DATA UNAVAILABLE` — GSC queries and mapping URLs are separate tables; shared URL is not proof of competing rankings |
| Confirmed cannibalization (SERP overlap, ranking URL swaps, CTR loss by page) | `DATA UNAVAILABLE` — all 167 flags are hypotheses |
| Country/device/date for 381 seeds and 161 clean-keyword rows | `DATA UNAVAILABLE` — source values blank or `Not stated`; not assumed |
| Free-source data (Google autocomplete/PAA, Trends, Bing WMT, fresh crawl) | `DATA UNAVAILABLE` for T031 — no new collection performed in this task |
| `EwtPageEstimate` | `DATA UNAVAILABLE` — 0/10,642 populated in source |
| Page changes, canonical/sitemap/manifest edits, deployment | Not performed; analysis-only scope |

---

## 7. Task status

| Task | Status produced here |
|---|---|
| T017 — Identify cannibalization opportunities | COMPLETE as hypotheses: 23 shared-URL groups (83 mapping rows), 37 near-identical groups (60 pairs, 66 combined rows), 167 flagged combined rows; no page change |
| T031 — Combine SEMrush + GSC + free sources + site content | COMPLETE for the two authorized sources: 10,169 estimates + 92 GSC actuals + 381 seeds joined to 1,172 mapping decisions; 8,020 rows unassigned. Free sources remain `DATA UNAVAILABLE` |
| T032 — Categorize keywords into 10 site categories | COMPLETE: 10 canonical slugs derived from category seeds; 2,622 rows assigned to a canonical category, 8,020 explicitly unassigned |
| T033 — Label intent and type dimensions | COMPLETE: 5 intent labels with multi-label preservation (464 `DATA UNAVAILABLE`); 6 type labels plus `NONE`; volume/KD bands over estimate columns only |

**No follow-on implementation is authorized by this report.** Any consolidation, retargeting or page change requires a separate owner-approved implementation task and fresh GSC query-page evidence.
