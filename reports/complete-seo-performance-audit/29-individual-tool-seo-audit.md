# 29 — Individual tool SEO audit

Date: 2026-11-23  
Pages: **242 tool pages** audited individually.  
Status: **PASS after local optimization; not deployed**.

## 1. Baseline

| Check | Result |
|---|---:|
| Tool pages with unique title | 242 / 242 |
| Tool pages with unique meta description | 242 / 242 |
| Tool pages with one visible H1 | 242 / 242 |
| Tool pages with self-referencing canonical | 242 / 242 |
| Tool pages with `index,follow` | 242 / 242 |
| Tool pages with Open Graph title/description/image | 242 / 242 |
| Tool pages with SoftwareApplication schema | 217 before / 242 after |
| Tool pages with structured intro | 240 before / 242 after |
| Tool pages with how-to/instructions text | 188 before / 242 after |
| Tool pages with all image alts populated | 235 before / 242 after |

Individual rows are in `data/page-level/url-inventory.csv` and `before-after-metadata.csv`.

## 2. Optimizations applied

| Change | Pages | Evidence |
|---|---:|---|
| Added unique three-step “How to use” section | 54 | Steps use the page title, unique manifest description, and category context |
| Added unique SoftwareApplication JSON-LD | 25 | Includes name, description, URL, free offer, browser OS, and feature list from tags |
| Added unique intro `.lede` paragraph | 2 | Derived from the tool manifest description |
| Replaced empty dynamic image alt text | 7 | `Selected file preview` or `Shared content preview image` |

Total optimized tool pages: **88**.  
Unchanged tool pages: **154** — they already passed all automated checks and had unique metadata, canonical, H1, schema, intro, how-to language, internal links, and image alt coverage.

No titles, H1s, slugs, canonicals, URLs, redirects, tool logic, forms, or scripts were changed.

## 3. Intent and keyword mapping

Primary and secondary keywords for every tool are in `data/page-level/keyword-map.csv`. The primary keyword uses the first specific manifest tag, falling back to the H1 when the first tag was a generic category term.

Evidence-based priorities:

| Page | Evidence type | Evidence |
|---|---|---|
| `/` | GSC measured | 43 clicks / 97 impressions / position 2.6 |
| `/tools/social-share-preview/` | GSC measured | 2 clicks / 64 impressions / position 56.8 |
| `/tools/webp-to-pdf/` | GSC measured + SEMrush estimate | `webp to pdf` 31 impressions / pos 11.3; SEMrush volume 2.9K / KD 23 |
| `/tools/mph-to-kph/` | SEMrush estimate | `convert mph to kilometers`, volume 4.4K, position 39 |
| `/tools/ai-write/business-slogan-generator/` | SEMrush estimate | UK `business slogan generator` vol 260 pos 84; CA `slogan builder` vol 390 pos 89 |
| `/tools/ai-write/nda-generator/` | GSC measured | `nda generator`, 11 impressions / pos 84.5 |

SEMrush and Ahrefs values are third-party estimates. GSC values are measured Search Console data for the verified property.

## 4. Internal links, breadcrumbs, and schema

- All 242 tool pages had at least 3 internal page links after audit.
- Breadcrumb detection passed on all 242 tool pages.
- All 242 tool pages now expose a parseable SoftwareApplication schema block.
- 25 pages also retain their existing WebApplication schema; no schema block was deleted.
- JSON-LD parsing failures after the final audit: **0**.

The apparent invalid JSON-LD on `/tools/schema-markup-generator/` was a false positive from generator demo code inside a script string. It is not a head schema block and was not modified.

## 5. Pages intentionally unchanged

154 tool pages were left unchanged because they already had:

- unique title and description;
- one H1 and self-canonical;
- complete Open Graph metadata;
- SoftwareApplication schema;
- intro and how-to content;
- sufficient internal links;
- no image-alt violations.

This is a documented pass, not an omitted page.

## 6. Final status

- **PASS**: 242 / 242 tool pages audited individually.
- **OPTIMIZED locally**: 88 tool pages.
- **UNCHANGED with reason**: 154 tool pages.
- **NOT DEPLOYED**: all edits remain local pending review and explicit approval.
