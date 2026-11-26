# 28 — Complete URL inventory and page-level audit baseline

Date: 2026-11-23  
Scope: EasyWorkTools.online only.  
Status: **PASS for discovery and inventory; 7 non-page/variant URLs intentionally unresolved**.

## 1. Discovery sources

The inventory was built independently from all requested sources, not from the sitemap alone.

| Source | Count | Notes |
|---|---:|---|
| Repository HTML files scanned | 398 | Excluded `node_modules`, `.git`, `reports`, `_work` |
| Sitemap URLs | 392 | `sitemap.xml`, unchanged hash `A96A58ED0FF1923FA63D7B89D5F0C8363E51872E40F8F3B6114AE2AA8D06F0C2` |
| Tool manifest entries | 242 | `tools-manifest.json` |
| Blog manifest entries | 129 | `blog-manifest.json` |
| GSC discovered paths extracted from authenticated findings | 11 | Includes `.html`, `www`, `http`, query-string and malformed variants |
| Internal page-link targets | 395 | Parsed from all HTML files; assets/template artifacts excluded |
| Unique page-like URLs in final inventory | 399 | Every row is in `data/page-level/url-inventory.csv` |

Core content pages: **381** — 242 tool pages, 129 blog articles, 10 category pages.

No career/resume/CV URL was found in the sitemap, tool manifest, blog manifest, or internal page links. Earlier probes of `/tools/resume-builder/`, `/categories/career/`, and `/blog/resume-tips` returned 404. Status: **NOT TESTED / no such URLs found**, not a missing page to invent.

## 2. Inventory fields

`data/page-level/url-inventory.csv` contains one row per discovered URL with:

- URL and route
- Page type
- Page title
- Meta description
- H1 and H1 count
- Canonical URL
- Indexability/robots directive
- Structured-data types
- Internal page-link count
- Word count
- Images without alt
- H2 count
- Breadcrumb/how-to/FAQ detection
- Manifest title and category
- Source file
- Discovery sources
- SEO problems
- Status

## 3. Baseline status

| Status | URLs |
|---|---:|
| PASS | 237 |
| OPTIMIZE | 155 |
| NO_LOCAL_FILE | 7 |
| Total | 399 |

Core-page baseline:

| Page type | Total | Optimize | Pass |
|---|---:|---:|---:|
| Tool | 242 | 88 | 154 |
| Blog | 129 | 67 | 62 |
| Category | 10 | 10 | 0 |

The 10 category pages were flagged only for the intro-class detector; manual inspection showed valid unique `cat-hero__intro` paragraphs. The detector was corrected, and no category content was changed.

## 4. Duplicate and canonical checks

- Duplicate titles: **0**
- Duplicate meta descriptions: **0**
- Duplicate H1s: **0**
- Canonical changes made: **0**
- Title changes made: **0**
- H1 changes made: **0**

This indicates the site already had unique page titles, descriptions, H1s, and canonical destinations at the page level. The problems were missing supporting content/schema, templated descriptions, and a small number of image-alt issues.

## 5. Non-page and variant URLs

Seven inventory rows had no local HTML source file and were intentionally left unchanged:

| URL | Evidence | Status |
|---|---|---|
| `/blog/explain-it.html` | GSC/sitemap discovery; live 308 → `/blog/explain-it` | Unchanged redirect |
| `/blog/article-rewriter.html` | GSC/sitemap discovery; live 308 → `/blog/article-rewriter` | Unchanged redirect |
| `/blog/business-slogan-generator.html` | GSC/sitemap discovery; live 308 → `/blog/business-slogan-generator` | Unchanged redirect |
| `/tools/pdf-images-converter/categories/image/` | GSC malformed URL; live 301 → `/tools/pdf-to-jpg/` | Unchanged redirect |
| `/tools/pdf-to-epub/styles.css` | Internal link to EPUB asset | Not a page |
| `/tools/pdf-to-epub/nav.xhtml` | Internal link to EPUB asset | Not a page |
| `/tools/pdf-to-epub/toc.ncx` | Internal link to EPUB asset | Not a page |

No redirect, canonical, sitemap, or asset behavior was changed.

## 6. Final status

**PASS**: complete inventory created from sitemap, manifests, repository HTML, internal links, and GSC evidence. Every URL has an auditable row in the page-level CSV.

**WARNING**: the 7 no-local-file rows remain documented, not modified. GSC still reports many not-indexed/404 URLs that require separate URL-by-URL treatment before any redirects or deletions.
