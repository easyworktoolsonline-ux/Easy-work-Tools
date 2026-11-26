# 59 — T041 visible breadcrumb implementation and validation (2026-11-24)

**Status:** T041 DONE as a local source and generated-output implementation. No deployment, push, DNS/Cloudflare change or indexing request was made.

## 1. Scope and preservation

- Project: `F:\easyworktools.online\Easy-work-Tools` only.
- Owner authorization: received after Report 57 risk assessment.
- Full baseline backup remains at `C:\Users\ahmad\AppData\Local\Temp\opencode\ewt-full-backup-20261124-170654`.
- Fresh source checkpoint before implementation: `C:\Users\ahmad\AppData\Local\Temp\opencode\ewt-checkpoint-20261124-T041` (8 files: generator sources, CSS sources/output, sitemap, Report 58).
- Fresh HTML checkpoint before generated-output modification: `C:\Users\ahmad\AppData\Local\Temp\opencode\ewt-checkpoint-20261124-T041-html` (399 HTML files).
- Isolated build copy: `C:\Users\ahmad\AppData\Local\Temp\opencode\ewt-t041-isolated` (1,017 files excluding `node_modules`).
- Existing uncommitted work was preserved. `sitemap.xml`, `llms.txt`, `blog-manifest.json`, `ai-catalog.json` and all other manifests were not copied from the isolated build into the live project.

## 2. Implementation

### 2.1 Shared generator helpers

`scripts/build-indexes.mjs`:

- `existingBreadcrumbItems()` reads an already-present `BreadcrumbList` from JSON-LD. Visibility now reuses the exact schema labels, including 24 pages whose hand-written schema labels differ slightly from their H1.
- `breadcrumbItemsForPage()` returns one shared item list for both JSON-LD and visible markup on non-category pages. If no schema exists, the previous H1-based logic still generates it.
- `injectBreadcrumbSchema()` now accepts that shared item list; existing schema is never duplicated or overwritten.
- `injectVisibleBreadcrumb()` emits semantic `<nav class="breadcrumb" data-ewt-breadcrumb="1" aria-label="Breadcrumb"><div class="container">…</div></nav>` immediately inside `<main>`, with `/` separators marked `aria-hidden="true"` and the final label marked `aria-current="page"`. All hrefs are root-relative.
- `normaliseInternalLinks()` shields the marker-bearing breadcrumb nav from the site's depth-relative rewrite, so breadcrumb hrefs stay root-relative while the rest of the site keeps its existing behaviour.

`scripts/category-sections.mjs`:

- Added `categoryBreadcrumbItems()` and reused it inside `renderCategorySchema()`, so the category JSON-LD and visible trail come from one source.
- Category pages receive the same visible nav helper during page generation.

### 2.2 CSS

- Moved the `.breadcrumb` component rules from `assets-src/categories.css` into `assets-src/styles.css`, with dark-theme rules included in the global sheet.
- Rebuilt minified output with `npm run build:assets`: `assets/styles.css` and `assets/categories.css`.
- No extra stylesheet request was added; no URL changed.

### 2.3 Generated output application

A full `npm run build` was run **only in the isolated copy** to prove generator correctness. To avoid overwriting unrelated pre-existing live generated content (for example the already-modified `blog-manifest.json` and older `ai-catalog.json`), the live HTML was updated with a targeted, idempotent transformer that inserts exactly the same nav markup from each page's existing schema. After applying it:

- 391 pages were written.
- 0 pages were already correct before the run.
- 0 errors were reported.
- Removing only the inserted nav restores each of the 391 files byte-for-byte to its checkpoint copy (`nonNavChangeCount = 0`).

## 3. Quantitative before/after

| Metric | Before | After | Change | Evidence |
|---|---:|---:|---:|---|
| Pages with visible breadcrumbs | 0 | 391 | +391 | Report 57 baseline; live validation |
| Breadcrumb `<nav>` elements | 0 | 391 | +391 | one marker per non-home sitemap page |
| Breadcrumb links added | 0 | 870 | +870 | live anchor count |
| `BreadcrumbList` schemas | 391 | 391 | 0 | no duplicate schema added |
| Duplicate breadcrumb navs | 0 | 0 | 0 | `duplicateMarkerCount = 0` |
| Schema/visible label mismatches | n/a | 0 | 0 | all 391 compared item-by-item |
| Root-relative breadcrumb href violations | n/a | 0 | 0 | all hrefs start `/`, none `../` or `http` |
| Non-breadcrumb HTML changes | n/a | 0 | 0 | checkpoint byte comparison |
| Sitemap URLs | 392 | 392 | 0 | `sitemap.xml` unchanged |
| Homepage/404 breadcrumbs | 0 | 0 | 0 | explicitly excluded |

### 3.1 Breadcrumb link breakdown

| Destination | Links |
|---|---:|
| `/` (Home) | 391 |
| `/tools/` | 252 |
| `/blog/` (Guides) | 129 |
| `/categories/ai-write/` | 54 |
| `/categories/converter/` (other category crumbs) | 44 |
| **Total** | **870** |

Page-type coverage: 242 tool pages, 129 guide pages, 10 category pages, and 10 static/listing pages = 391.

## 4. Validation results

### 4.1 Isolated build

- `npm run build:assets` succeeded; five minified assets regenerated.
- `npm run build` succeeded; 10 category pages written; 242 tools and 129 blog posts indexed.
- Re-running the generator did not duplicate breadcrumb markup: 391 navs, 0 duplicates, 0 label mismatches, 0 bad hrefs after repeated builds.
- Full-file hashes changed on rebuild because of a pre-existing whitespace difference around the ad-head marker; this is unrelated to the breadcrumb component. Breadcrumb idempotency was verified separately and passed.

### 4.2 Live generated output

- 392 sitemap URLs mapped to 392 local files; 391 non-home pages checked.
- 391 navs found; 0 missing, 0 duplicate markers.
- 391 schema item lists found; 0 count mismatches, 0 label mismatches.
- 0 non-root-relative breadcrumb hrefs.
- Live nav markup matched isolated-build markup on all 391 pages (`navMarkupDiffCount = 0`).
- 0 non-breadcrumb changes versus the fresh HTML checkpoint.
- Homepage and `404.html` contain no breadcrumb nav.

### 4.3 Rendering checks

A local static server served the isolated build. Browser DOM/computed-style checks were made on tool, category, guide, static and AI Write page types:

- Tool page: 3 labels (`Home`, `Tools`, current tool), hrefs `/` and `/tools/`, `display:flex`, `flex-wrap:wrap`, height ~35.14px at a 1000px viewport, no horizontal document overflow.
- Category page: `Home`, `Tools`, `Image Tools`.
- Guide page: `Home`, `Guides`, current guide title.
- Static page: `Home`, current page title.
- AI Write tool: `Home`, `Tools`, `AI Write`, current tool.

This is local rendered-output validation at one viewport width, not a live-production or real-mobile-device measurement.

## 5. Change inventory

**Modified source files (4):**

- `scripts/build-indexes.mjs`
- `scripts/category-sections.mjs`
- `assets-src/styles.css`
- `assets-src/categories.css`

**Modified generated CSS (2):**

- `assets/styles.css`
- `assets/categories.css`

**Modified generated HTML (391):** all sitemap pages except `https://easyworktools.online/`; 404 excluded.

**Created report:** this file.

**Deleted files:** none.

**Unchanged by design:** URLs, redirects, canonical tags, schema content, manifests, sitemap, robots.txt, llms.txt, ai-catalog.json, tool functionality and all non-breadcrumb HTML bytes.

## 6. Tracker update

- `T041` status changed from `DEFERRED` to `DONE`.
- This task is a local implementation only; deployment remains outside scope and has not occurred.
- T041 breadcrumb links are navigational and must not be counted toward contextual-link tasks T049/T050.
