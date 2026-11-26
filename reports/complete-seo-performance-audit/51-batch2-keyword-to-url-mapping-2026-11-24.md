# 51 — Batch 2: keyword-to-URL mapping (T018 / T019) — 2026-11-24

**Status:** COMPLETE and verified. No production page, generator, manifest, sitemap, robots.txt, canonical, redirect, or structured data was modified.

## Exact changed files (new file only)

1. `F:\easyworktools.online\Easy-work-Tools\reports\complete-seo-performance-audit\research-data\keyword-to-url-mapping-2026-11-24.csv`

Existing files unchanged. Temporary build/validation scripts remain outside the project in `C:\Users\ahmad\AppData\Local\Temp\opencode\` (`ewt-keyword-map.mjs`, `ewt-map-validate.mjs`); no duplicate script added to the codebase.

## What was produced

A 21-column mapping covering **1,172 important keywords**:

- All 92 GSC actual queries; all 161 clean keywords; all 8 missing-gap keywords; and every large-gap keyword with estimated volume ≥1,000.
- Columns include cluster ID, target keyword, secondary keywords, intent, metric class, volume/KD/CPC estimates, separate GSC actual impressions/position, current and recommended URL, page status, suggested title/H1, content improvements, internal-linking opportunities, priority, mapping method, source file, and notes.
- Manual overrides were used only where a verified existing page matched the intent; every recommended URL was checked against the 381-URL inventory (seeds + filesystem) before inclusion.
- 625 irrelevant Canva/template/brand queries were explicitly marked `Reject — irrelevant to site tools` (P3) instead of being assigned to a page. 445 relevant-but-unmatched keywords are marked `Research / distinct-intent decision required`; no new page was created.
- Two keywords are marked `New page opportunity — functionality required` (`pdf to excel converter convert pdf to excel`; `link preview online`) — recommendation only, no page created.

## Test results (verified)

| Check | Result |
|---|---|
| Total mapped rows | 1,172 |
| GSC actual rows / rows with URL | 92 / 42 |
| Rows with a recommended URL | 100 |
| Unique recommended URLs | 40 |
| Live HEAD status of all 40 URLs | **40 × HTTP 200**, 0 non-200 |
| Recommended URLs absent from local inventory | 0 |
| Rows mixing GSC actuals into estimate columns | 0 |
| Rows mixing estimates into GSC actual columns | 0 |
| P0 / P1 / P2 / P3 | 9 / 35 / 390 / 738 |
| Page status counts | Existing page 37; verify-live-URL 63; research-required 445; reject 625; new-page-opportunity 2 |

Key P0 mappings: `explain it` (295 impressions, pos 3.9) → `/tools/ai-write/explain-it/`; `webp to pdf` (31, pos 11.3) → `/tools/webp-to-pdf/`; `pdf to word free` (49,500 vol estimate, KD 14) → `/tools/pdf-to-word/`; `easy work tool` → homepage.

## Cannibalization notes recorded

- `social share checker` and `social sharing checker` share one target `/tools/social-share-preview/`.
- `pdf to word free` and `convert pdf to editable word free online` share `/tools/pdf-to-word/`.
- `article rewriting` / `how to rewrite articles` map to the guide `/blog/article-rewriter`, while `rewrite article(s)` and `article rewrite` map to the tool — distinct intents, no page merge.
- `explain it` maps to the tool; `/blog/explain-it` remains the secondary guide. No URL change.

## Remaining issues / limitations

- Report 47 per-URL SEMrush coverage and other missing exports remain `DATA UNAVAILABLE`.
- 445 relevant keywords need intent/functionality verification before any page work; no page was created or changed.
- Suggested titles/H1s are hypotheses for a later on-page batch; no title/H1 change was made here.
- `pdf to ocr` mapped to `/tools/pdf-to-text/` with an explicit note that OCR capability must be verified before any claim.
- `fake text message black background` remains P1 research-only due to a broad `text` relevance token; deliberately not auto-mapped.

## Updated task statuses

- `T018` DONE — keyword-to-URL mapping system created and validated.
- `T019` DONE — per-keyword target/title/H1/content/link suggestions included in the mapping CSV.
- `T082` DONE — `Keyword_To_URL_Mapping.csv` equivalent delivered under the timestamped research-data name.
- `T083` DONE — combined research dataset delivered in Batch 1.
- NEXT: shared-generator improvements, one task at a time, starting with `T037`.
