# 30 — Individual blog article SEO audit

Date: 2026-11-23  
Pages: **129 blog articles** audited individually.  
Status: **PASS after local optimization; not deployed**.

## 1. Baseline

| Check | Result |
|---|---:|
| Unique titles | 129 / 129 |
| Unique H1s | 129 / 129 |
| Self-referencing canonicals | 129 / 129 |
| `index,follow` | 129 / 129 |
| Complete Open Graph metadata | 129 / 129 |
| BlogPosting schema | 129 / 129 |
| BreadcrumbList schema | 129 / 129 |
| FAQPage schema | 129 / 129 |
| Images missing alt | 0 |
| Generic/templated meta descriptions | 48 |
| Under 500 words before expansion | 19 |

Individual rows are in `data/page-level/url-inventory.csv`; exact before/after metadata is in `before-after-metadata.csv`.

## 2. Optimizations applied

| Change | Pages | Reason |
|---|---:|---|
| Replaced generic meta description with article-specific lead/body text | 48 | Removed repeated “Complete guide with examples, use cases…” pattern |
| Added concise quick-answer and pre-flight checklist | 19 | Improved usefulness on short articles without deleting existing content |
| Added unique worked-example section | 6 | Provided concrete arithmetic or workflow context on the shortest articles |

Total optimized blog articles: **67**.  
Unchanged blog articles: **62** — they already had unique, specific descriptions and sufficient content depth.

No article URL, slug, canonical, title, H1, author/date metadata, headings, internal link, or existing paragraph was deleted or rewritten.

## 3. Structured data and heading structure

- All 129 articles retained parseable BlogPosting, BreadcrumbList, and FAQPage JSON-LD.
- All 129 articles have a single H1 and at least three H2 sections after validation.
- No invalid JSON-LD was found after final validation.
- Author/publisher is the existing Organization entity; `datePublished` and `dateModified` were not verified against editorial records. Status: **NOT TESTED / unchanged**.

## 4. GSC and third-party evidence

Measured GSC rows relevant to blog pages:

| Page | GSC measurement |
|---|---|
| `/blog/explain-it` | 1 click / 378 impressions / CTR 0.3% / position 3.5 |
| `/blog/article-rewriter` | 1 click / 55 impressions / CTR 1.8% / position 56.6 |
| `/blog/explain-it.html` | Variant URL with impressions; live 308 → clean URL |

Third-party evidence:

- SEMrush reported `rewrite article` position 87 (UK, volume 110) and `business slogan generator` position 84 (UK, volume 260). These are estimates and were not substituted for GSC.
- SEMrush Top Pages session expired; no page-level SEMrush table was captured.
- Ahrefs organic keywords were 0 and Content Gap UI did not populate reliably. This is a tool limitation, not proof of no opportunity.

No SEMrush reauthentication was performed because prior instructions require explicit confirmation.

## 5. Cannibalization and duplicate intent

`data/page-level/cannibalization-review.csv` contains 3 overlap groups:

1. `/blog/how-to-compare-two-images-online` + `/tools/image-compare/` — complementary guide/tool pair; the guide links to tools.
2. `/tools/ai-write/word-counter/` + `/tools/word-character-counter/` — same-type overlap; manual review recommended.
3. `/tools/pdf-merge/` + `/tools/pdf-organizer/` — same-type overlap; manual review recommended.

No pages were deleted, merged, redirected, or noindexed. Duplicate titles, descriptions, and H1s were **0**.

Some refined descriptions are still constrained by the quality of the existing article lead text. This is documented as an editorial opportunity, not a technical blocker.

## 6. Final status

- **PASS**: 129 / 129 articles audited individually.
- **OPTIMIZED locally**: 67 articles.
- **UNCHANGED with reason**: 62 articles.
- **NOT DEPLOYED**: all edits remain local pending review and explicit approval.
