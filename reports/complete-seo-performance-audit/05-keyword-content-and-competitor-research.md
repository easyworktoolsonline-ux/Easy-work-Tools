# 05 — Keyword, Content, and Competitor Research

Evidence: `data/gsc/gsc-authenticated-findings.md`, `data/semrush/semrush-authenticated-findings.md`, and `data/ahrefs/ahrefs-authenticated-findings.md`. Third-party values are directional estimates, not replacements for Search Console.

## 1. Current search demand and intent

GSC (3 months) shows only 47 clicks / 771 impressions, with an average position of 24.4. The strongest real queries are:

| Query | GSC signal | Interpretation |
|---|---|---|
| `easy work tool` | 2 clicks, 7 impressions, position 3.0 | Brand/navigational intent; strongest click driver |
| `explain it` / `explain it.` | 1 click, 351 combined impressions, position ~3.1–3.9 | High impressions but very low CTR; likely broad/ambiguous intent |
| `webp to pdf` | 0 clicks, 31 impressions, position 11.3 | Best aligned tool-intent opportunity |
| `rewrite article`, `article rewriter wizard` | 0 clicks, 23 combined impressions, positions 56.6–63.8 | Existing content relevance but weak ranking |
| `nda generator`, `business slogan generator`, `slogan builder` | Low volume/position | Existing long-tail opportunities in GSC country breakdown |

SEMrush reports only 6 US organic keywords and an estimated traffic value of 1, while Ahrefs reports 0 organic keywords and 0 traffic. These conflict with each other and with GSC, so no third-party traffic number is used as the baseline.

## 2. Competitor context — research only

Competitors selected for benchmarking only: `smallpdf.com`, `ilovepdf.com`, and `convertio.co`. No page, backlink, or asset was changed because of this comparison.

| Domain | SEMrush organic keywords (US) |
|---|---:|
| easyworktools.online | 6 |
| smallpdf.com | 60.8K |
| ilovepdf.com | 47.6K |
| convertio.co | 27.2K |

Keyword Gap results: Shared 0, Missing 5.1K, Untapped 92.5K, Unique 5. This shows an authority/scale gap rather than a small missing-page gap.

Representative missing head terms were `pdf converter` (1.83M volume, KD 78), `pdf to word` (450K, KD 47), `pdf to jpg` (301K, KD 43), `png to pdf` (110K, KD 46), and `jpg to pdf converter free` (60.5K, KD 72). These are competitive context only. They are not proposed as immediate targets for a domain with very low observed authority.

## 3. More realistic cluster: `webp to pdf`

SEMrush Keyword Magic found 103 matching keywords, 6,220 total volume, and average KD 22%.

| Keyword | Intent | Volume | KD | CPC |
|---|---|---:|---:|---:|
| `webp to pdf` | I | 2.9K | 23 | $0.15 |
| `convert pdf to webp` | I | 720 | 26 | $0.94 |
| `convert webp to pdf` | I | 390 | 27 | $0.23 |
| `.webp to pdf` | I | 320 | 26 | $0.20 |
| `pdf to webp` | C | 320 | 24 | $0.00 |
| `webp to pdf converter` | C | 210 | 25 | $0.36 |

Why this cluster matters:

- GSC already shows `webp to pdf` at position 11.3.
- It aligns with an existing tool-intent page (`/tools/webp-to-pdf/`, included in the sitemap/tool set).
- KD is comparatively modest.
- No new dependency, page deletion, URL change, or design change is required to research it further.

Recommended **future research only**: review the existing page's title, H1, on-page explanation, internal links from related image/PDF categories, and FAQ coverage. No edit was made in this audit.

## 4. Existing-content opportunities from GSC

### `explain it` / `/blog/explain-it`

- 378 impressions on `/blog/explain-it` with 1 click, CTR 0.3%, position 3.5.
- The query is ambiguous and the click-through failure may be a snippet/intent mismatch.
- Non-canonical `/blog/explain-it.html` also appeared in the page table, so canonical verification must precede any change.
- No deletion or consolidation is proposed.

### `/tools/mph-to-kph/`

- SEMrush's top US keyword was `convert mph to kilometers` at position 39, volume 4.4K; top page `/tools/mph-to-kph/`.
- Live page has a self-canonical, strong H1, three JSON-LD blocks, no missing-alt images, and Lighthouse 1/1/1.
- This is a good example of an existing tool page to monitor rather than replace.

### AI-write and article rewriting

- GSC shows `rewrite article` (15 impressions, position 63.8) and `article rewriter wizard` (8 impressions, position 56.6).
- `/blog/article-rewriter` received 55 impressions / 1 click, position 56.6.
- `/categories/ai-write/` and `/blog/business-slogan-generator.html` also appeared in GSC.
- UK and Canada GSC rows showed `rewrite article` (110 volume, position 87), `business slogan generator` (260 volume, position 84), and `slogan builder` (390 volume, position 89) in SEMrush country data.
- These are long-tail research signals, not justification for deleting or merging existing pages.

## 5. Device and country opportunities

| Segment | GSC signal | Implication |
|---|---|---|
| Desktop | 40 clicks / 392 impressions / 10.2% CTR | Current clicks are desktop-heavy |
| Mobile | 7 clicks / 376 impressions / 1.9% CTR / position 5.7 | Nearly equal impressions but poor CTR; review titles, descriptions, and mobile result presentation |
| US (SEMrush) | 6 keywords; `convert mph to kilometers` position 39 | Existing but weak US tool visibility |
| UK (SEMrush) | 2 keywords | `rewrite article`, `business slogan generator` |
| Canada (SEMrush) | 1 keyword | `slogan builder` |

## 6. Content-gap tooling limitations

- Ahrefs Content Gap was attempted, but competitor inputs did not populate reliably; no verified Ahrefs content-gap rows were captured.
- SEMrush Top Pages was attempted late in the session, but the authenticated session had expired and the tab redirected to login. No Top Pages table was captured.
- SEMrush Site Audit is not configured, so there is no configured project crawl report.
- Therefore this report relies on GSC page/query data, SEMrush Keyword Gap, SEMrush Keyword Magic, and representative live page audits rather than claiming a complete page-level content-gap table.

## 7. Recommendations (no changes made)

1. Monitor `webp to pdf` and its related variants as the first existing-intent cluster for future on-page/internal-link review.
2. Investigate the `/blog/explain-it` snippet/intent mismatch only after canonical verification.
3. Preserve all existing tool, category, and blog URLs; improve internal linking from relevant categories rather than deleting duplicates.
4. Treat KD 43–78 PDF head terms as long-term competitive context, not immediate targets.
5. Review mobile titles and descriptions for high-impression pages; do not change them in this patch.
6. Reassess after field performance validation and with a larger GSC sample.
