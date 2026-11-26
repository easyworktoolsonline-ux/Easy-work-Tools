# 49 — Read-only security inspection of `public/assets/aistudio/` and approved change plan (2026-11-24)

**Scope:** EasyWorkTools.online only. Read-only inspection; no file extracted, uploaded, published, or modified during inspection.

**Method:** local recursive inventory (names/sizes/timestamps only), `.gitignore` review, live HTTP **HEAD** requests to the production origin, ZIP **entry-name-only** enumeration (no extraction, no content read), and reference search across site text files.

---

## 1. Security inspection result

### 1.1 Local inventory

`F:\easyworktools.online\Easy-work-Tools\public\assets\aistudio\` contains **25 files, 15,192,848 bytes**:

- 14 CSV — GSC-style exports (`Queries_d04a53e6.csv`, `Pages_7d99fa00.csv`, `Countries_8be2b041.csv`, `Devices_0c688b31.csv`, `Search_appearance_eed9ceaf.csv`, `Chart_629cbc69.csv`, `Filters_335d0931.csv`, `Metadata_2f4ed190.csv`, `Critical_issues_8e06aefe.csv`, `Non-critical_issues_3279eaf8.csv`, `overview-trend-…csv`, `easyworktools.online-backlinks_matrix__1__e8b0b0a2.csv` 964,769 B, `easyworktools.online-backlinks_matrix_dfb8f4a5.csv`, `gap.keywords_2026-11-15T23_19_18.864Z_234f9665.csv` 1,281,329 B).
- 6 PDF — SEMrush reports (`easyworktools_82ff5076.pdf` 517,398 B; `report_33d930fa.pdf` 363,186 B; `Semrush-Backlinks__Overview-…pdf` 248,687 B; `Semrush-Backlinks__Referring_Domains-…pdf` 238,101 B; `Semrush-Organic_Research__Overview__Desktop-…pdf` 167,141 B; `Semrush-Organic_Research__Pages__Desktop-…pdf` 50,451 B).
- 3 PNG (`image_02be72c1.png`, `image_13198679.png`, `issue_overview_6c545dff.png`).
- 2 ZIP — `Easy-work-Tools-main_5ece33c0.zip` **11,153,952 B / 802 entries** (full project source archive), `easyworktools.online-Coverage-2026-11-10_a66afc76.zip` 1,027 B / 4 CSV entries.

All files dated 2026-11-15.

### 1.2 Live exposure test — NOT EXPOSED

Live HEAD requests to `https://easyworktools.online/assets/aistudio/…` returned **HTTP 404** for every tested file and for the directory path:

- `Easy-work-Tools-main_5ece33c0.zip` → 404
- `easyworktools.online-backlinks_matrix__1__e8b0b0a2.csv` → 404
- `gap.keywords_2026-11-15T23_19_18.864Z_234f9665.csv` → 404
- `Queries_d04a53e6.csv` → 404
- `Pages_7d99fa00.csv` → 404
- `Semrush-Backlinks__Overview-…pdf` → 404
- `easyworktools_82ff5076.pdf` → 404
- `report_33d930fa.pdf` → 404
- `issue_overview_6c545dff.png` → 404
- `/assets/aistudio/` → 404

**Control validation:** `/assets/styles.css` → 200 (`text/css`), `/assets/favicon.ico` → 200 (`image/vnd.microsoft.icon`). This confirms the HEAD method and `/assets/…` URL mapping are correct; the 404s are genuine, not a test artifact.

**Supporting evidence:** `.gitignore` explicitly excludes `public/assets/aistudio/` with the comment “Local AI Studio exports and SEO report artifacts (not part of the published site).” No production HTML, sitemap, robots.txt, llms.txt, ai-catalog.json, or manifest contains an `aistudio` reference. Only local reports/research-data reference it.

### 1.3 ZIP content assessment (entry names only)

- `Easy-work-Tools-main_5ece33c0.zip`: 802 entries, full site source including `apps-script/Code.gs`, `_headers`, `_redirects`, `README.md`. Automated name scan found **5 matches**, all false positives: `password-generator` tool/image/script paths. **No `.env`, private key, token, credential, or `.git/` entry names found.**
- Coverage ZIP: 4 entries, all generic CSV names.

**Conclusion:** **Public exposure is NOT confirmed and is unlikely under the current deployment.** No remediation is required at this time. No file was deleted, moved, renamed, or changed.

### 1.4 Latent risk and safe remediation plan (not executed)

If the folder were ever committed and deployed, it would publish ~15 MB of third-party research exports plus an 11 MB source-code archive — competitive-intelligence and source-disclosure risk. Preventative plan (owner decision required; none of this was done):

1. Keep `public/assets/aistudio/` gitignored; never stage or commit it.
2. Do not add any link to these files from site pages, sitemap, llms.txt, or ai-catalog.json.
3. If future deployment includes `public/`, add a Cloudflare Pages `_headers` rule for `/assets/aistudio/*` returning `X-Robots-Tag: noindex, nofollow` and `Cache-Control: no-store` **only** as defence in depth — note that robots headers are not access control.
4. If hard protection is required, move the folder outside the published root (e.g. `reports/.../research-data/`) and keep it gitignored — **requires owner approval and a deployment plan; not performed here.**

---

## 2. Report 47 gate reconciliation

| Gate condition (47:7, 505-520) | Status | Evidence |
|---|---|---|
| Exports received | SATISFIED (with documented deviation) | 13 files supplied in `F:\easyworktools.online\semrush ahrefs csv pdf spreedsheets`; not in the exact `semrush-manual-exports/00-manifest/…` tree, and no `semrush-export-manifest.csv` was supplied. User explicitly directed use of this folder. |
| Exports analyzed | SATISFIED | 13/13 files analyzed in Report 48 §1–2. |
| Exports documented | SATISFIED | Report 48 §1–2 and this report §1. |
| Roadmap produced | SATISFIED | Report 48 §7 (89-task tracker). |
| Owner approval | SATISFIED for the first batch | User instruction: “You may now proceed… Start with the first approved, low-risk implementation batch: keyword-to-URL mapping and carefully selected shared-generator improvements.” |

**Explicit unresolved checklist gaps (do not claim full Report 47 completion):** per-URL coverage exports for all 381 URLs, Organic Traffic Insights (GSC-derived), Keyword Magic bulk for all 381 seeds, weak/shared keyword sets, full backlink lists, new/lost links, and the manifest file are not present. These remain `DATA UNAVAILABLE` and are not fabricated.

## 3. Reconciled next task

- **Exact next task:** `T018` — Build keyword-to-URL mapping system (P0). Prerequisite data-prep tasks `T014` (deduplicate), `T015` (consolidate with labels), `T016` (separate GSC actuals from estimates) are executed first as a single new-artifact batch.
- Then `T019` per-keyword target/title/H1/content/link suggestions, and deliverables `T082`/`T083`.
- Then the carefully selected shared-generator batch, one task at a time: `T037` (category JSON-LD placement), `T039` (stale `metadata.json` count), `T040` (stale generator comments). `T041` (visible breadcrumbs) is **deferred** — it changes shared page chrome across ~393 pages and needs a separate risk review before approval.
- All implementation files are source/generator files only; no generated output is hand-edited.

## 4. Change plan and safety controls

1. Verify existing backup `C:\Users\ahmad\AppData\Local\Temp\opencode\ewt-full-backup-20261124-170654` and its 1,011-file SHA-256 manifest before the first write.
2. Create an additional timestamped checkpoint before any source-file edit; report exact path.
3. One task at a time: change → verify → document → next task.
4. Data-prep work creates **new files only** under `reports/complete-seo-performance-audit/` (no production HTML/tool/blog/category files).
5. Source-file edits are made only in shared generators identified in Report 48 §5; validate by running the generator in an isolated copy first, because `npm run build` is file-writing and normalized 398 HTML files historically (`33:63`).
6. Never hand-edit generated outputs (`sitemap.xml`, `llms.txt`, `ai-catalog.json`, manifests, category pages).
7. No deployment, DNS/Cloudflare, Git commit/push, paid service, external upload, auth attempt, or outreach.
8. After each batch: exact changed-file list, test results, remaining issues, updated task statuses.
