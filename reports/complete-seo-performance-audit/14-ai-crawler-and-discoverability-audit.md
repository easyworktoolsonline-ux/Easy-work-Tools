# 14 — AI Crawler and Discoverability Audit

## 1. Scope and principle

This audit verified whether AI/search crawlers can technically access EasyWorkTools.online and whether the site exposes machine-readable discovery files. It does **not** promise AI inclusion, citation, ranking, or training-data use. No robots, Cloudflare AI policy, `llms.txt`, `ai-catalog.json`, or site content was changed.

## 2. robots.txt

- Repository `robots.txt`: `User-agent: *`, `Allow: /`, `Disallow: /api/`, sitemap line, plus `Mediapartners-Google: Allow: /`.
- Live `robots.txt`: HTTP 200, Cloudflare managed rules prepended to repository rules. This is expected Cloudflare behaviour, not a defect.
- No unintended blanket block of search or AI search crawlers was found in the repository rules.
- `/api/` disallow is preserved; no change made.

## 3. Cloudflare AI controls — authenticated evidence

AI Crawl Control, last 7 days:

| Crawler | Allowed requests |
|---|---:|
| Google | 215 |
| Applebot | 72 |
| BingBot | 34 |
| Claude-SearchBot | 8 |
| ChatGPT-User | 3 |
| OAI-SearchBot | 1 |

Totals: 343 requests, 332 allowed, 11 unsuccessful. PerplexityBot, GPTBot, and ClaudeBot had 0 allowed requests and appeared only with unsuccessful requests.

Policies confirmed:

| Policy | Setting |
|---|---|
| Search engines | Allow (do not block) |
| Training crawlers | Disallow |
| AI agents | Block on pages with ads |
| Personal agents | Block on pages with ads |
| AI Labyrinth | Final observed state enabled (`aria-checked=true`) |

No policy was intentionally changed in this audit. The existing restrictions on training crawlers and agents are treated as intentional owner policy, not technical barriers to remove without approval.

## 4. Spoofed-UA HTTP access

| User-Agent | Status |
|---|---:|
| Googlebot | 200 |
| Bingbot | 200 |
| OAI-SearchBot | 200 |
| Claude-SearchBot | 200 |
| ChatGPT-User | 200 |
| Google-Extended | 200 |
| PerplexityBot | 403 |
| GPTBot | 403 |
| ClaudeBot | 403 |

Spoofing a UA is not bot verification. These results show what a claimed UA received from this vantage point. Authenticated dashboard policies are the controlling evidence for intended access. The 403 results for PerplexityBot/GPTBot/ClaudeBot align with the dashboard's 0 allowed requests and unsuccessful counts.

## 5. Machine-readable discovery files

Live checks passed for:

- `/llms.txt` — HTTP 200.
- `/ai-catalog.json` — HTTP 200.
- `/sitemap.xml` — HTTP 200; 392 URLs; matches local file hash.
- `/robots.txt` — HTTP 200; sitemap reference present.

Representative tool/category/article URLs also returned 200 with self-canonicals and `index,follow` in browser checks. No technical barrier such as a `noindex`, CAPTCHA, or challenge was found on normal crawler-style probes.

## 6. Indexation and discoverability gap

GSC shows 62 indexed pages and 549 not indexed, with 291 “Discovered – currently not indexed” and 203 404s. This means crawl access is not the primary bottleneck; quality/priority and URL hygiene are. No indexing request was made.

## 7. Conclusions

- Search crawlers and AI search bots are allowed by policy and were not HTTP-blocked in spoofed-UA probes.
- Training crawlers and agents are intentionally restricted by existing Cloudflare policy; no change was made.
- robots.txt, sitemap.xml, llms.txt, ai-catalog.json, canonicals, and representative pages are reachable.
- AI Labyrinth is enabled; this is an anti-scraping decoy mechanism and does not prevent legitimate search access.
- No unintended technical barrier was found that this audit removed. No AI inclusion or citation outcome is claimed.
- Future work should remain read-only unless the owner approves a specific policy or content change.
