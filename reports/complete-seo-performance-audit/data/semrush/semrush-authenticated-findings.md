# SEMrush — authenticated findings (2026-11-23)

Provenance: data was read from the authenticated SEMrush workspace accessed through the signed-in ToolsZen browser session. No API token was used, no CSV/manual export was downloaded, no screenshot was taken, and no credential, password, or OTP was captured. Page content was treated as untrusted data. Database is United States unless stated otherwise.

Scope note: EasyWorkTools.online only. No GlobeCareer.online data, settings, or reports were accessed.

## 1. Domain / account level

| Metric | Value | Source / limitation |
|---|---:|---|
| Organic keywords (US) | 6 | Organic Rankings overview |
| Estimated organic traffic (US) | 1 | Organic Rankings overview; third-party estimate, not GSC |
| Traffic Cost | $0.0 | Organic Rankings overview |
| Branded keywords | 0 | Organic Rankings overview |
| Non-branded keywords | 1 | Organic Rankings overview |
| Domain Overview | `Something went wrong` | Retried once; no domain-level authority/traffic trend was obtained |

## 2. Organic Rankings — country opportunities

US was the primary database. Country chips were also inspected:

| Country | Organic keywords | Notable queries |
|---|---:|---|
| US | 6 | `convert mph to kilometers` — position 39, volume 4.4K |
| UK | 2 | `rewrite article` — position 87, volume 110; `business slogan generator` — position 84, volume 260 |
| CA | 1 | `slogan builder` — position 89, volume 390 |

The highest-ranking SEMrush keyword in the collected set was `convert mph to kilometers`; the associated top page was `/tools/mph-to-kph/`. This aligns with the GSC observation that `/tools/mph-to-kph/` and its explainer article receive impressions.

## 3. Keyword Gap (research competitors only)

Competitors were selected **for research only**: `smallpdf.com`, `ilovepdf.com`, `convertio.co`. No pages, links, or assets were changed because of this comparison.

| Metric | easyworktools.online | smallpdf.com | ilovepdf.com | convertio.co |
|---|---:|---:|---:|---:|
| Organic keywords | 6 | 60.8K | 47.6K | 27.2K |

Gap summary: Shared **0**, Missing **5.1K**, Weak **0**, Strong **0**, Untapped **92.5K**, Unique **5**.

Representative missing opportunities shown by SEMrush:

| Keyword | Volume | KD |
|---|---:|---:|
| `pdf converter` | 1.83M | 78 |
| `pdf to word` | 450K | 47 |
| `pdf to jpg` | 301K | 43 |
| `png to pdf` | 110K | 46 |
| `jpg to pdf converter free` | 60.5K | 72 |

Interpretation: these are high-competition head terms with KD 43–78 and are not realistic near-term wins for a domain with 6 observed US organic keywords and very low authority. They are recorded as competitive context, not as recommended immediate edits.

## 4. Backlinks / Authority

| Metric | Value |
|---|---:|
| Authority Score | 2 |
| Referring domains | 42 |
| Backlinks | 245 |
| Referring IPs | 41 |
| Organic traffic (SEMrush estimate) | 6 |
| Referring domains in AS 0–20 | 42 / 42 |

## 5. Backlink Gap / link-intersect equivalent

SEMrush Backlink Gap returned **67,729 prospects**. Domains shown as linking to one or more research competitors but **not** to easyworktools.online included:

`adobe.com`, `github.com`, `google.com`, `microsoft.com`, `wikipedia.org`, `yahoo.com`, `medium.com`, `substack.com`, `wikihow.com`, `techradar.com`, `howtogeek.com`, `wondershare.com`, `wps.com`, `dev.to`.

This is the closest available link-intersect evidence in the current subscription. It is a prospect list only; **no outreach, purchase, placement, or link-building action was performed**.

## 6. Referring domains, new/lost links, and directory signals

- Referring Domains report: **42 total**, matching the backlink overview.
- New links: **8 new nofollow low-Authority-Score domains in Oct 2026**.
- Lost filter: **Nothing found** — no lost referring domains were reported by SEMrush.
- Quality: many referring domains used low-trust TLDs such as `.xyz`, `.shop`, and `.site`, and many had very low Authority Score.
- Directory evidence: no curated high-quality directory set was available in the collected SEMrush views. The observed referring-domain sample did not provide evidence of strong editorial directory links. No directory submissions or changes were made.

## 7. Keyword Magic Tool — `webp to pdf`

| Metric | Value |
|---|---:|
| Matching keywords | 103 |
| Total volume | 6,220 |
| Average KD | 22% |

Top rows:

| Keyword | Intent | Volume | KD | CPC |
|---|---|---:|---:|---:|
| `webp to pdf` | I | 2.9K | 23 | $0.15 |
| `convert pdf to webp` | I | 720 | 26 | $0.94 |
| `convert webp to pdf` | I | 390 | 27 | $0.23 |
| `.webp to pdf` | I | 320 | 26 | $0.20 |
| `pdf to webp` | C | 320 | 24 | $0.00 |
| `webp to pdf converter` | C | 210 | 25 | $0.36 |

This cluster is more aligned with the site's existing tool inventory than the PDF head terms and is consistent with a GSC query (`webp to pdf`, 31 impressions, position 11.3). It is therefore a better research candidate for future content/tool refinement than KD 70+ head terms.

## 8. Individual tool/category page research

- The SEMrush Organic Rankings view identified `/tools/mph-to-kph/` as the top page associated with the leading US keyword.
- A late attempt to open SEMrush Top Pages for `easyworktools.online` redirected the working tab to the ToolsZen login page. No credentials were requested or used, and no Top Pages rows were captured.
- Consequently, there is no verified SEMrush page-level table for individual tool/category URLs beyond the top-page association above. GSC page-level data and live HTTP checks are used elsewhere in this audit instead.

## 9. Limitations and conflict notes

- Domain Overview failed with `Something went wrong` after retry.
- SEMrush Site Audit and Backlink Audit are not configured for this domain in the current workspace; no configured crawl/project findings were available.
- Ahrefs reports 0 organic keywords and 0 estimated traffic, while SEMrush reports 6 keywords / 1 traffic estimate; both conflict sharply with GSC's 47 clicks / 771 impressions over three months. Treat all third-party traffic estimates as directional only.
- No SEMrush data was exported, and no screenshots were saved. All values above are manual transcriptions from the authenticated UI into this evidence file.
- Nothing in this file implies a ranking, crawl, indexation, or backlink change has been verified by the platform after the audit.
