# 50 — Batch 1: keyword-data consolidation (T014 / T015 / T016) — 2026-11-24

**Status:** COMPLETE and verified. One task group at a time; no production page, generator, manifest, sitemap, robots, or control file was modified.

## Exact changed files (new files only)

1. `F:\easyworktools.online\Easy-work-Tools\reports\complete-seo-performance-audit\research-data\keyword-research-combined-2026-11-24.csv`
2. `F:\easyworktools.online\Easy-work-Tools\reports\complete-seo-performance-audit\research-data\keyword-research-source-manifest-2026-11-24.csv`

No existing file was edited, deleted, or renamed. All 13 original exports remain untouched. The temporary generator/validator scripts live outside the project at `C:\Users\ahmad\AppData\Local\Temp\opencode\ewt-keyword-consolidate.mjs` and `ewt-keyword-validate.mjs`; no duplicate script was added to the codebase.

## What was done

- Consolidated 10,642 records with 26 explicit columns including `MetricClass`, source file, country database, device, date range, intent, estimate fields, and separate GSC actual fields.
- Removed exact duplicate keywords **within** each source; preserved meaningful keyword variations and all original source files.
- Collapsed the three 8-row gap CSVs (permuted competitor column order) into 8 rows, with a note recording the two duplicate exports.
- Labeled every record: `SEMrush estimate` (10,008), `Third-party estimate (provenance not stated)` (161), `GSC actual (first-party)` (92), `No metrics — URL seed` (381).
- Filled country/device/date only where the source actually stated them; `Not stated` used otherwise — no values invented.
- Manifest records rows in / rows out / exact duplicates removed / country / device / date range / metric class / notes for all 7 source groups.

## Test results (verified)

| Check | Result |
|---|---|
| Total rows out | 10,642 |
| Large untapped gap | 10,000 (all unique keywords preserved) |
| Clean keywords | 161 |
| Small missing gap | 8 (16 permuted duplicate rows collapsed) |
| GSC actual queries | 92 |
| Tool / blog / category seeds | 242 / 129 / 10 (381 total) |
| GSC rows containing estimate values | **0** |
| Estimate rows containing GSC actual values | **0** |
| Seed rows containing metrics | **0** |
| UTF-8 non-English keyword preserved | `стиснути пдф` = 590 (verified) |
| Spot-check `pdf to word free` | volume 49,500; positions tinywow 28 / sejda 23 / ilovepdf 13 / canva 0 |
| Spot-check GSC `explain it` | 1 click / 295 impressions / 0.3% CTR / pos 3.9; all estimate columns empty |

Build/lint were **not** run: this batch changed no source or generated website file.

## Remaining issues / limitations

- Report 47 checklist gaps remain (per-URL SEMrush exports, Organic Traffic Insights, Keyword Magic bulk, weak/shared sets, full backlink lists, new/lost links, manifest). Not fabricated; carried forward.
- 10,000-row gap set remains US/Desktop/KD<15 filtered and includes irrelevant third-party-branded and Canva-template queries; relevance filtering happens in the next mapping task, not by deleting source records.
- Clean-keywords provenance/country/date are genuinely unknown in the source.

## Updated task statuses

- `T014` DONE — deduplicated exports (originals preserved).
- `T015` DONE — consolidated with date/country/device/provenance labels.
- `T016` DONE — GSC actuals segregated from all vendor estimate columns.
- `T018` now unblocked and NEXT.
- All other statuses unchanged from Report 48 §7.
