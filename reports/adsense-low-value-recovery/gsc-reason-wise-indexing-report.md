# GSC reason-wise indexing report

Date: 2026-11-27

Property: `sc-domain:easyworktools.online`

Overall status: PARTIAL

## Scope and source

- Authenticated, read-only inspection of Google Search Console > Indexing > Pages and each reason drilldown.
- No canonical, sitemap-structure, robots.txt or URL change was made during this pass.
- Counts are the GSC values already recorded in `gsc-page-indexing-status.csv`: 594 not indexed and 69 indexed.
- Examples below are the first URLs shown by GSC in each drilldown. They are not an exhaustive list and are preserved in `evidence/gsc-reason-examples-2026-11-27.json`.

| Reason | GSC count | Representative examples captured on 27 Nov 2026 | Assessment | FinalStatus |
|---|---:|---|---|---|
| Page with redirect | 49 | `http://easyworktools.online/`, `http://www.easyworktools.online/`, `https://easyworktools.online/index.html`, `https://www.easyworktools.online/`, `https://www.easyworktools.online/index.html`, `https://easyworktools.online/tools/index.html?cat=text`, `https://easyworktools.online/tools/ai-write/blog-post-ideas/index.html`, legacy category `.html` paths | Mostly legacy scheme/host/`index.html` variants and old nested paths. Live redirect behaviour was previously verified: HTTP and `www` redirect to canonical HTTPS non-`www`, preserving paths and query strings, with no loop. No local redirect defect was established. | DONE |
| Not found (404) | 203 | `https://easyworktools.online/tools/ai-write/business-plan-generator/categories/developer/`, `https://easyworktools.online/categories/image/categories/ai-write/`, multiple `/tools/ai-write/<slug>/categories/<category>/` paths | Malformed nested-category/tool URLs consistently last crawled 23 Oct 2026. Earlier internal link/hash-link scan found 0 broken internal links. No internal source link or sitemap entry creating these paths was found in this pass. | DONE |
| Alternative page with proper canonical tag | 2 | `https://easyworktools.online/?q={search_term_string}`, `https://easyworktools.online/tools/?cat=text` | `?q={search_term_string}` is a browser search-provider template, not a content page. `/tools/?cat=text` has a user-declared canonical to `/tools/`. No local defect was established and no canonical change was made. | DONE |
| Discovered – currently not indexed | 323 | `https://easyworktools.online/about`, `https://easyworktools.online/blog/`, and many valid guide URLs such as `/blog/ai-detector`, `/blog/ai-humanizer`, `/blog/article-generator`, `/blog/article-writer`, `/blog/bill-of-sale` | Platform discovery/crawl queue. The presence of valid internal pages here is not a local markup defect. Content remediation and Bing URL submission have been performed, but Google's outcome remains pending. | PARTIAL |
| Crawled - currently not indexed | 17 | `https://easyworktools.online/blog/kg-to-lbs-explained`, `https://easyworktools.online/tools/amps-to-watts/`, `/blog/binary-vs-decimal-storage`, `/tools/square-feet-to-square-meters/`, `/tools/lbs-to-kg/`, `/tools/pace-to-mph/` | Platform quality/selection state. URL Inspection previously showed `/blog/kg-to-lbs-explained` as indexed despite its appearance in this reason group, so the reason label must not be treated as a definitive URL-level verdict. | PARTIAL |

## Interpretation

- The three website-side reasons (redirect, 404, canonical alternative) were diagnosed and no authorized local repair was required; they remain subject to Google recrawling.
- The two Google-system reasons (discovered/crawled but not indexed) cannot be resolved by editing repository files alone. Content quality, meta-description uniqueness and tool defects were remediated in this pass, but no indexing confirmation is claimed.
- The GSC sitemap state remains **Success** with 392 discovered pages. Submission acceptance and discovery are not indexing confirmations.

## Owner-facing conclusion

Do not relabel indexing as DONE until fresh GSC Page Indexing and URL Inspection data show the remediated URLs indexed. The status remains PARTIAL because platform processing is external.
