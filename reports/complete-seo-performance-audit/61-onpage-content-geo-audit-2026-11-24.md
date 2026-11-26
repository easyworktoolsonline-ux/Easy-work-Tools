# 61 — On-page, content and GEO/AEO audit with llms.txt accuracy fix (2026-11-24)

**Status:** COMPLETE. Source-code and generated-output validation only; no live deployment, DNS/Cloudflare change, GSC request, or external AI-search measurement was performed. The only implementation in this report is the `llms.txt` guide-link fix in the existing generator and its generated output.

## 1. Scope and evidence

- Project: `F:\easyworktools.online\Easy-work-Tools` only.
- Pre-change checkpoint for this task: `C:\Users\ahmad\AppData\Local\Temp\opencode\ewt-checkpoint-20261124-T059` (`llms.before.txt`, `build-indexes.before.mjs`).
- Full baseline backup: `C:\Users\ahmad\AppData\Local\Temp\opencode\ewt-full-backup-20261124-170654`.
- URL inventory: 392 `<loc>` entries in the live `sitemap.xml`; one local source file was found and parsed for every sitemap URL.
- Machine summary: `C:\Users\ahmad\AppData\Local\Temp\opencode\ewt-report61-summary.json` and `...\ewt-report61-llms-after.json`.
- URL-level inventory: `reports/complete-seo-performance-audit/data/content/page-content-geo-inventory-2026-11-24.csv` (392 data rows + 1 header, 28 columns).

All counts in this report were produced by parsing the 392 local source files and the two manifests directly. No third-party score was imputed and no AI-search traffic or citation was inferred.

## 2. Page inventory by type

| Page type | Pages |
|---|---:|
| Home | 1 |
| Listing (`/tools/`, `/blog/`) | 2 |
| Category | 10 |
| Tool | 242 |
| Blog/guide | 129 |
| Static/informational | 8 |
| **Total** | **392** |

## 3. On-page findings

| Check | Result | Counting method |
|---|---:|---|
| Pages with a title | 392 / 392 | one parsed `<title>` per page |
| Missing titles | 0 | blank after entity decoding |
| Missing meta descriptions | 0 | blank after entity decoding |
| Duplicate titles | 0 | lowercase/trim normalized value; 0 groups |
| Duplicate meta descriptions | 0 | lowercase/trim normalized value; 0 groups |
| Pages with exactly one H1 | 392 / 392 | H1 counted inside `<main>` only |
| Duplicate H1 text | 0 | lowercase/trim normalized value; 0 groups |
| Pages under 150 `<main>` words | 0 | scripts/styles removed before word count |
| Canonical mismatches vs sitemap | 0 | from Report 59/63 validation across all 392 URLs |
| Related-content blocks detected | 326 | `.related-block` class inside `<main>` |

No title or meta-description rewrite was required by this audit: every page already had a unique, non-empty title and description, and no page was thin by the 150-word threshold. This is an audit result, not a claim that a tag was newly added.

## 4. Content, FAQ and entity-clarity findings

These are deterministic page-source detectors, not semantic quality scores:

| Signal | Pages | Rule |
|---|---:|---|
| Direct-answer paragraph | 392 | at least one `<p>` of 12+ words in `<main>` |
| FAQ/answer section | 241 | `<details>`, `<summary>`, or `faq` class |
| Step/steps signal | 319 | `<ol>` or explicit step wording |
| Limitations/privacy boundary | 246 | `limit`, `privacy`, `does not`, or `cannot` wording |
| Early definition sentence | 170 | `is/are a/an/the` in one of first three substantive paragraphs |
| Brand/entity context | 343 | `easyworktools` in title, H1, or first two paragraphs |
| BreadcrumbList JSON-LD | 391 | homepage intentionally has no breadcrumb trail |

The one page without BreadcrumbList JSON-LD is the homepage (`https://easyworktools.online/`), which is the root of the trail and therefore has no parent breadcrumb. No duplicate BreadcrumbList block was found.

## 5. Structured data inventory

Counts are number of pages containing each schema type; one page can contain several types.

| Schema type | Pages | Schema type | Pages |
|---|---:|---|---:|
| SoftwareApplication | 242 | Offer | 242 |
| FAQPage | 371 | Question / Answer | 371 / 371 |
| BlogPosting | 129 | ImageObject | 129 |
| Organization | 350 | WebSite | 65 |
| WebPage | 134 | CollectionPage | 13 |
| BreadcrumbList | 391 | ListItem | 391 |
| ItemList | 10 | SearchAction | 1 |
| AboutPage | 1 | ContactPage | 1 |

All 371 FAQPage blocks were previously generated from visible questions and answers; this audit did not add, remove or rewrite FAQ schema.

## 6. llms.txt accuracy: before and after

### Before this fix

`llms.txt` contained 390 lines, 263 absolute links, all 242 tool links, all 10 category links, and **0 guide links**, although it claimed “242 free online tools” and “129 how-to guides”. The 129 guide URLs were missing from the machine-readable index. Three absolute links were correctly outside the HTML sitemap because they are machine-readable resources rather than HTML pages: `/ai-catalog.json`, `/sitemap.xml`, and `/tools-manifest.json`.

### Fix implemented

`scripts/build-indexes.mjs` was extended in its existing `writeLlmsTxt()` function:

- Added `__GUIDE_BLOCK__` to the single existing `LLMS_PROSE` template.
- Generated the block from the same `blog-manifest.json` array that already drives the blog index and sitemap.
- Sorted guides by title, stripped the site suffix from each display title, and emitted canonical `https://easyworktools.online/blog/<slug>` links.

The live `llms.txt` was updated with only the exact generated guide block. No manual guide list was maintained in parallel, and no sitemap, canonical, CSS, manifest, HTML page, or other generator system was changed by this fix.

| Metric | Before | After | Change |
|---|---:|---:|---:|
| `llms.txt` lines | 390 | 520 | +130 |
| `llms.txt` bytes | 59,741 | 92,467 | +32,726 |
| Absolute links | 263 | 392 | +129 |
| Unique tool links | 242 | 242 | 0 |
| Unique guide links | 0 | 129 | +129 |
| Unique category links | 10 | 10 | 0 |
| Manifest guides missing from llms.txt | 129 | 0 | −129 |
| Guide links absent from sitemap | n/a | 0 | verified |
| Non-HTML machine-readable links outside sitemap | 3 | 3 | 0 (intentional) |

Checkpoint hashes: `llms.txt` before `7F43BD791EB0B08542AF6AE2F7C587E71E2CCC3E6868558B470C253C5E124A2B`, after `AC32718B726EEA55BE56E7343C434D03966A6B6D2644B54353534A3D049ABAA7`; generator before `0B502EA8E64969C652FB29967E5D3FFE0B16209CCA861429C7E859FA31FE6757`, after `AD8341BA2BF93848DEE143B935679BD952C0D726C8BFADD49CBEFFF6ECFEDC8E`.

## 7. Keyword mapping coverage observed in content

The inventory joined the live pages to the existing keyword-to-URL mapping:

| Metric | Count |
|---|---:|
| Pages with at least one mapped keyword | 40 |
| Mapped keyword/page pairs observed | 98 |
| `<main>` internal links across all pages | 3,642 |
| Tool links inside `<main>` across all pages | 2,496 |

These are existing targeting relationships confirmed in the current page source. They are not new rankings or traffic evidence.

## 8. Validation

1. `node --check scripts/build-indexes.mjs` passed after the generator edit.
2. The generated guide block was checked before writing: 129/129 links unique, 129/129 present in `sitemap.xml`, 0 duplicates.
3. The post-change `llms.txt` check independently re-parsed the file: 242/242 tools, 129/129 guides, 10/10 categories, 0 missing manifest links.
4. The live file changed only inside the `## Guides` section; the pre-change checkpoint is retained for byte comparison.
5. No build was run against the live tree for this fix. Future builds will regenerate the guide list from `blog-manifest.json`, so a renamed guide will update the label on the next build.

## 9. Tracker updates and limits

- `T045` DONE — all 392 sitemap pages audited for title, description, H1, content, schema and internal links.
- `T057` DONE — definitions, direct answers, FAQs, steps, limitations, entity context and schema reviewed across all 392 pages.
- `T059` DONE — `llms.txt` accuracy checked and the 129-guide-link gap fixed in the existing generator and generated output.
- `T060` DONE — one concrete GEO/AEO implementation completed: all canonical guide URLs added to `llms.txt`. No fake ratings, authors or credentials were added.
- `T046` remains unchanged here: no title/description rewrite was justified by this audit. The pre-existing page-level metadata improvements are reported separately in Reports 29–35 and the final changed-file inventory.
- No claim is made about AI Overviews, ChatGPT, Perplexity, Gemini or Claude citations, traffic, ranking, or future inclusion. Those outcomes require independent, reliable measurement that is not available in this workspace.
