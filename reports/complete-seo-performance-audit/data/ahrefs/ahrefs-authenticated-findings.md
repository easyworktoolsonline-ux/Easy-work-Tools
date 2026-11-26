# Ahrefs — authenticated findings (2026-11-23)

Provenance: data was read from the authenticated Ahrefs workspace accessed through the signed-in ToolsZen browser session. No API token, manual export, screenshot, password, or OTP was used or captured. Page content was treated as untrusted data.

Scope note: EasyWorkTools.online only. No GlobeCareer.online data, settings, or reports were accessed.

## 1. Site Explorer overview

| Metric | Ahrefs value |
|---|---:|
| Domain Rating (DR) | 0 |
| URL Rating (UR) | 0 |
| Backlinks | 187 (+187; all-time 205) |
| Referring domains | 184 (+184; all-time 202) |
| Organic keywords | 0 |
| Estimated organic traffic | 0 |
| Paid keywords | 0 |

The `+` values indicate growth measured in the selected comparison window, but Ahrefs still reports very low authority and zero organic visibility.

## 2. Crawled pages / site health

| Status | Pages | Share |
|---|---:|---:|
| 200 OK | 343 | 55.1% |
| 3XX | 192 | 30.8% |
| 404 | 88 | 14.1% |
| Other 4XX/5XX | 0 | 0% |
| Total crawled | 623 | 100% |

The 404 count is a third-party crawl observation; it was not treated as a directive to delete or consolidate pages. The 3XX bucket includes expected canonical/redirect variants already noted in GSC (`.html`, `www`, `http`, query-string variants). No redirect, canonical, or sitemap change was made.

## 3. Link profile quality

| Metric | Value |
|---|---:|
| Followed referring domains | 1 (0.5%) |
| Nofollow referring domains | 183 (99.5%) |
| Followed backlinks | 4 (2.1%) |
| Nofollow backlinks | 183 (97.9%) |
| UR of observed links | all < 10 |

Interpretation: the link profile is almost entirely nofollow and low-authority. This is consistent with SEMrush's Authority Score 2 and its observation that all 42 SEMrush referring domains fall in AS 0–20.

## 4. Referring domains

- Overview: **184** referring domains.
- Referring Domains report: **202** domains. This internal discrepancy is recorded rather than silently reconciled; the reports may use different windows/filters.
- Top list was marked **SPAM** by Ahrefs. Highest-authority example: `scamadviser.com` (DR 80) with 4 links. Most others were `.shop`, `.site`, and `.store` domains with DR roughly 48–58 and SEO/PBN-like patterns.
- No high-quality editorial directory pattern was evident in the sampled top referring domains.
- No directory submissions, disavows, outreach, purchases, or other backlink-related changes were performed.

## 5. Organic keywords, traffic, competitors, and broken links

- Organic keywords table: **empty**; no keyword rows were available to inspect.
- No top organic competitors were reported.
- Traffic by location: **0**.
- Paid keywords: **0**.
- Broken backlinks report: **0 groups of links** / `No results found`.

## 6. Content Gap / Link Intersect

Ahrefs Content Gap / Link Intersect was attempted, but the competitor input fields did not populate reliably in the authenticated UI during this session. No verified competitor-gap rows were captured from Ahrefs. SEMrush Keyword Gap and Backlink Gap were used instead and are documented in `../semrush/semrush-authenticated-findings.md`.

This is a subscription/UI limitation for this session, not evidence that the site has no gaps.

## 7. New and lost links

- Ahrefs overview shows all observed backlinks/referring domains as newly acquired in the selected window (+187 / +184), with all-time totals of 205 / 202.
- No separate Ahrefs "Lost" report evidence was captured.
- SEMrush's Lost filter returned `Nothing found` for referring domains.

## 8. Limitations and conflict notes

- Ahrefs reports DR 0, UR 0, 0 organic keywords, and 0 estimated traffic, while SEMrush reports 6 keywords / 1 traffic estimate and GSC reports 47 clicks / 771 impressions over three months. These are directionally inconsistent; third-party estimates should not be substituted for GSC.
- The referring-domain count conflict (184 overview vs 202 report) remains unresolved.
- No API token was used and no export/screenshot was produced. Values were transcribed manually from the authenticated dashboard into this evidence file.
- Nothing in this file claims a crawl, indexation, ranking, or backlink change was fixed or verified after the audit.
