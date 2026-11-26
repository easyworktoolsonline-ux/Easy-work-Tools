# 58 — T048 internal-link graph, anchor distribution and click-depth analysis (2026-11-24)

**Status:** T048 DONE. This is a read-only local-source analysis. No page, generator, CSS, schema, sitemap, canonical, redirect, manifest or deployment file was changed.

## 1. Scope and preservation

- Project: `F:\easyworktools.online\Easy-work-Tools` only.
- Page universe: 392 `<loc>` entries in `sitemap.xml`; all 392 mapped to existing local HTML files.
- No live crawl, authenticated session, external upload, build, commit, push or deploy.
- Existing uncommitted work was left untouched.
- Checkpoint before report creation: `C:\Users\ahmad\AppData\Local\Temp\opencode\ewt-checkpoint-20261124-T048-report` (126 files; contains the pre-report `reports/complete-seo-performance-audit` tree plus `sitemap.xml` and `scripts/clean-urls.mjs`).
- Analysis script (outside the repository): `C:\Users\ahmad\AppData\Local\Temp\opencode\ewt-t048-link-graph.mjs`.

## 2. Counting method

1. Read all 392 sitemap URLs and map each to its local HTML file (`/` → `index.html`, `/path/` → `path/index.html`, `/path` → `path.html`).
2. Parse quoted `<a href="...">` anchor tags.
3. Normalize internal destinations with the project's existing `scripts/clean-urls.mjs` `cleanRef()` rules, then resolve to a canonical sitemap URL.
4. Exclude self-links, external domains, `mailto:`, `tel:`, `javascript:` and bare `#` anchors from the internal-page graph.
5. Classify each remaining link by source position: `navigation` inside `<header>`, `footer` inside `<footer>`, `content` inside `<main>`, otherwise `other`.
6. Build directed graphs using unique source → destination edges. “Unique internal links” deduplicates identical source/destination/anchor/type tuples.
7. Breadth-first search from the homepage yields click depth. All-graph metrics include navigation/footer links; content-graph metrics use only `<main>` links.

## 3. Exact graph results

| Metric | Count | Evidence / method |
|---|---:|---|
| Sitemap URLs | 392 | `sitemap.xml` `<loc>` count |
| Local HTML files parsed | 392 | one file per sitemap URL |
| Raw quoted anchor tags | 15,308 | regex over the 392 parsed files |
| Internal links excluding self-links | 14,868 | CSV data rows |
| Unique internal links | 14,853 | deduplicated source+destination+anchor+type |
| Self-links excluded | 29 | same normalized source and destination |
| External-domain anchors excluded | 5 | non-EasyWorkTools origins |
| Non-page anchors excluded | 404 | `mailto:`, `tel:`, `javascript:`, `#` |
| Unresolved internal-looking anchors | 2 | see §6; both are non-page false positives |
| Navigation links | 1,955 | inside `<header>` |
| Footer links | 10,166 | inside `<footer>` |
| Content links | 2,743 | inside `<main>` |
| Other-position links | 4 | outside header/footer/main |
| All-graph orphan pages | 0 | every non-homepage URL has ≥1 inbound edge |
| All-graph unreachable pages | 0 | all 392 reachable from homepage |
| All-graph depth 0 / 1 / 2 | 1 / 54 / 337 | BFS distribution |
| Content-only orphan pages | 5 | no inbound `<main>` link |
| Content-only unreachable pages | 7 | not reachable from homepage using only `<main>` links |
| Content-only depth 0 / 1 / 2 | 1 / 47 / 337 | BFS distribution |

The earlier Report 57 figure of 15,345 scanned anchors is not reproduced by this narrower, sitemap-scoped quoted-href parse. The current reproducible figure is 15,308 across exactly 392 sitemap-backed files. No page files were changed between those measurements, so the discrepancy is attributed to the earlier scan's different scope/matching rule, not to a site change. The 14,868 CSV rows are the authoritative link-level evidence for this task.

## 4. Orphan and depth findings

### 4.1 All-link graph
No true orphan or unreachable page exists when navigation and footer links are included. The full site is within three clicks of the homepage:

- depth 0: homepage (1 URL)
- depth 1: 54 URLs
- depth 2: 337 URLs

### 4.2 Content-only graph
Five homepage-adjacent static pages have zero contextual inbound links from page bodies:

1. `https://easyworktools.online/about`
2. `https://easyworktools.online/cookies`
3. `https://easyworktools.online/disclaimer`
4. `https://easyworktools.online/terms`
5. `https://easyworktools.online/contact`

Seven URLs are unreachable from the homepage if only `<main>` links are followed. Two additional unreachable URLs are not in the five-URL orphan list because they have an inbound content link from another non-homepage-reachable page. Navigation and footer links currently compensate for this. T050 should use this graph as the baseline before any contextual-link additions; T041 breadcrumb links must not be counted as contextual links.

## 5. Anchor distribution

### 5.1 Most-used anchors across all link positions

| Anchor | Count | Interpretation |
|---|---:|---|
| Tools | 782 | global navigation, expected repetition |
| Guides | 782 | global navigation, expected repetition |
| Resources | 782 | global navigation, expected repetition |
| EasyWorkTools .online | 782 | global brand/navigation, expected repetition |
| Home | 782 | global navigation, expected repetition |
| AI Write | 400 | repeated category navigation |
| Image Tools | 400 | repeated category navigation |
| Text Tools | 400 | repeated category navigation |
| PDF Tools | 400 | repeated category navigation |
| Calculator Tools | 400 | repeated category navigation |
| Utility Tools | 400 | repeated category navigation |
| Converter Tools | 400 | repeated category navigation |
| Security & Data Handling | 394 | repeated footer/category link |
| Privacy Policy | 393 | repeated footer link |
| Developer Tool | 391 | repeated footer/category link |
| SEO Tool | 391 | repeated footer/category link |
| Video & Audio | 391 | repeated footer/category link |
| About Us | 391 | repeated footer link |
| Terms & Conditions | 391 | repeated footer link |
| Disclaimer | 391 | repeated footer link |

These are sitewide navigation/footer anchors. They are not evidence of contextual anchor-text overuse and should not be “corrected” by changing global navigation.

### 5.2 Most-used anchors inside `<main>`

| Anchor | Count |
|---|---:|
| Easy Image Resizer Resize and edit images online for free in your browser. | 19 |
| Image Format Converter Convert JPG, PNG, WebP, GIF, BMP and SVG images to JPG, PNG or WebP online for free. | 19 |
| PDF to JPG Convert PDF to JPG online for free. Turn every page or a chosen page range into a high quality JPG image and download one file or a ZIP in your browser | 17 |
| Easy Thumbnail Downloader | 17 |
| PDF Organizer Merge multiple PDFs, reorder, rotate, delete or extract pages, all in your browser for free. | 16 |
| Liters to Gallons Converter (US) Free liters to US gallons converter. Convert 50 litres to gallons, 1 gallon to litres and more with the exact 3.785411784 L per US gal factor. | 11 |
| Free Image Compressor Shrink JPG, PNG and WebP files by up to 90% without losing visible quality. | 11 |

Note: the second row is reproduced exactly from the parsed anchor text; the source text contains the token shown above. These long card-style anchors are repeated by existing related-tool/category card components, not by T048. They are candidates for variation in T049, but no change was made in this task.

### 5.3 Most-linked content destinations

| Destination | Content inbound links |
|---|---:|
| `/tools/free-image-compressor/` | 36 |
| `/tools/easy-thumbnail-downloader/` | 35 |
| `/tools/easy-image-resizer/` | 34 |
| `/tools/pdf-organizer/` | 34 |
| `/tools/image-format-converter/` | 31 |
| `/tools/pdf-to-jpg/` | 27 |
| `/tools/json-formatter/` | 25 |
| `/tools/online-text-case-converter/` | 19 |
| `/tools/html-css-js-minifier/` | 17 |
| `/categories/developer/` | 17 |

## 6. Unresolved anchors reviewed

| Source | href | Finding |
|---|---|---|
| `https://easyworktools.online/security` | `.well-known/security.txt` | Expected non-page resource. `.well-known/security.txt` exists in the repository. Not a broken internal page link; excluded from the sitemap-page graph. |
| `https://easyworktools.online/tools/markdown-previewer/` | `$2` | Parser false positive: the string appears inside an inline JavaScript replacement template (`'<a href="$2" ...>'`), not in rendered HTML. Not a site defect. |

No genuine broken internal page link was discovered by this graph analysis.

## 7. Deliverable

- `reports/complete-seo-performance-audit/data/internal-links/final-internal-link-graph-2026-11-24.csv`
- Rows: 14,868 link records plus 1 header (14,869 lines); 2,771,022 bytes.
- Columns: `SourceURL`, `DestinationURL`, `AnchorText`, `LinkType`, `Action`, `SourceFile`.
- Every row has `Action=existing`; no link was added, removed or modified in T048.

## 8. Tracker update

- `T048` status changed from `PARTIAL` to `DONE` in the consolidated final task register.
- No other task status is changed by this report.
- T050 must use this CSV as its before-state baseline. T049 contextual links and T041 breadcrumb links are separate changes and must be reported with separate before/after counts.
