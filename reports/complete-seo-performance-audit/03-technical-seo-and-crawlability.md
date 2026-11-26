# 03 — Technical SEO and Crawlability

## 1. Inventory and preservation

- Sitemap: 392 unique URLs; 0 `<lastmod>`; 243 `/tools/`, 130 `/blog/`, 10 `/categories/`, 9 static, 1 root.
- Live sitemap SHA-256 matched local `sitemap.xml`: `A96A58ED0FF1923FA63D7B89D5F0C8363E51872E40F8F3B6114AE2AA8D06F0C2`.
- Repository `robots.txt`: `User-agent: *`, `Allow: /`, `Disallow: /api/`, sitemap line, plus `Mediapartners-Google: Allow: /`.
- Live `robots.txt`: HTTP 200; Cloudflare managed rules are prepended to the repository rules. This is expected, not a defect.
- `_redirects`: 26 rules preserving canonical and legacy paths. No redirect rule was changed.
- No URL, slug, page, tool, article, category, or sitemap entry was removed.

## 2. Live HTTP checks

Sampled live checks passed for:

- `http://easyworktools.online/` → HTTPS 200.
- `https://www.easyworktools.online/` → apex 200.
- `/`, `/robots.txt`, `/sitemap.xml`, `/tools/`, representative tools, nested tool, `/blog/`, representative article, representative category, static pages.
- `/llms.txt` and `/ai-catalog.json`.
- Legacy redirects: `/index.html` → `/`, `/categories` → `/tools/`, `/tools/jpg-pdf-converter` → `/tools/jpg-to-pdf/`.
- `/nonexistent-test-page` → custom 404.

No redirect loop was found in the sampled set.

## 3. Canonicals and metadata on representative live pages

Six production URLs were inspected in the browser:

| URL | Canonical | Robots | H1 | JSON-LD | Missing-alt images |
|---|---|---|---|---:|---:|
| `/` | self | `index,follow` | Free Tools to Make Business Simple | 2 | 0 |
| `/categories/image/` | self | `index,follow` | Image Tools | 1 | 0 |
| `/tools/json-formatter/` | self | `index,follow` | JSON Formatter & Validator | 3 | 0 |
| `/tools/mph-to-kph/` | self | `index,follow` | MPH to KPH Converter | 3 | 0 |
| `/blog/mph-to-kph-explained` | self | `index,follow` + snippet/image directives | MPH to KPH: Road-Speed Conversion Explained | 3 | 0 |
| `/about` | self | `index,follow` | About EasyWorkTools.online | 2 | 0 |

All had a valid viewport declaration and one H1. Lighthouse SEO, Accessibility, and Best Practices scores were 1/1/1 on all six pages with no failures.

## 4. Indexation signal

GSC page indexing overview (last update 16/11/2026):

| Status | Count |
|---|---:|
| Indexed | 62 |
| Not indexed | 549 |

Reasons:

| Reason | Count |
|---|---:|
| Discovered – currently not indexed | 291 |
| Not found (404) | 203 |
| Page with redirect | 49 |
| Crawled – currently not indexed | 4 |
| Alternative page with proper canonical tag | 2 |

These figures are a prioritization signal, not a deletion list. The 203 404s require URL-by-URL classification; existing redirects must be preserved.

## 5. Third-party crawl observations

Ahrefs crawled 623 pages:

- 200 OK: 343 (55.1%).
- 3XX: 192 (30.8%).
- 404: 88 (14.1%).
- Other 4XX/5XX: 0.

The 3XX bucket likely includes expected canonical/legacy variants already visible in GSC (`.html`, `www`, `http`, query-string variants, and one malformed `/tools/pdf-images-converter/categories/image/`). No redirect or canonical change was made.

## 6. HTTPS and structured data

- GSC HTTPS report: 11 HTTPS URLs, 0 non-HTTPS, no issues.
- GSC Breadcrumbs: 9 valid, 0 invalid.
- Live TLS: TLS 1.0/1.1 rejected; TLS 1.2/1.3 accepted. Certificates valid.
- Cloudflare SSL/TLS dashboard: encryption mode `Full`; automatic HTTPS enabled 62 days ago.
- Structured data is present on sampled pages; no new schema type was introduced by the CLS patch.

## 7. Security headers relevant to crawling

- `content-security-policy-report-only` is report-only, not enforcing.
- Security headers include `x-frame-options: DENY`, `x-content-type-options: nosniff`, `referrer-policy: strict-origin-when-cross-origin`, and a restrictive `permissions-policy`.
- No challenge was triggered by normal browser UA probes.
- Cloudflare Security Center has only the unrelated `mfa_not_enabled` insight, which was deliberately not touched.

## 8. Conclusion

The site has a sound technical foundation: canonical URLs, working redirects, reachable crawler files, valid HTTPS, and clean page-level SEO audits. The main technical SEO risks are indexation quality/priority (291 discovered-not-indexed), a large 404 pool, and duplicate/variant URLs receiving impressions. None should be addressed by deleting pages or changing redirects without further evidence and approval.
