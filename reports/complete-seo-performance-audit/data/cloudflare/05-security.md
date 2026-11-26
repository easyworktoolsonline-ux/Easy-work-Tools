# 5. Security — observations

## Dashboard state
`NOT VERIFIED (dashboard inaccessible)`. None of the following could be read and nothing was modified:
- Security Center active findings (including the MFA finding — deliberately not touched)
- WAF custom rules, managed rulesets, rate limiting rules
- Bot Fight Mode / Super Bot Fight Mode
- Managed Challenge / "I'm Under Attack" mode
- Security events / firewall event log (including crawler-related events)
- AI Labyrinth toggle in dashboard
- AI Crawl Control / AI crawler and AI agent access policy settings in dashboard

## Observable AI-crawler policy (VERIFIED live probe, 2026-11-23 10:29 PKT)
Source: `GET https://easyworktools.online/robots.txt`, `200`, `Content-Type: text/plain; charset=utf-8`, `Cache-Control: public, max-age=14400, stale-while-revalidate=86400`, `cf-cache-status: HIT`, `Age: 102`, CF-RAY `a5ef7afa4cd3c910-KHI`.

Managed Cloudflare block is present at the top (`# BEGIN Cloudflare Managed content` ... `# END Cloudflare Managed Content`) with:
```
User-agent: *
Content-Signal: search=yes,ai-train=no,use=reference
Allow: /
```
Training crawlers disallowed (`Disallow: /`): Amazonbot, Applebot-Extended, Bytespider, CCBot, ClaudeBot, Diffbot, Google-Extended, GPTBot, omgili, anthropic-ai, Claude-Web, cohere-ai, MistralAI-Training, meta-externalagent, GoogleOther, Baiduspider, PetalBot, AwarioSmartBot, AwarioRssBot, Google-CloudVertexBot, QualifiedBot, Cotoyogi, ICC-Crawler, atlassian-bot, FishBot, BorderxBot, NavuBot, SemrushBot-SWA, WARDBot, magpie-crawler, KimiBot, CitibotSiteCrawler.
AI agents disallowed (`Disallow: /`): Perplexity-User, FireCrawl, FirecrawlAgent, Claude-User, ChatGPT-User, Google-Agent, Google-GeminiNotebook, Google-NotebookLM, MistralAI-User, Kimi-User, Amzn-User, meta-externalfetcher, Retool, Instapaper, ChathiveCrawler.

Appended repository rules (also served):
```
User-agent: *
Allow: /
Disallow: /api/
Sitemap: https://easyworktools.online/sitemap.xml
User-agent: Mediapartners-Google
Allow: /
```
Total served size: 3,544 characters / 134 lines. This matches the historical observation that Cloudflare managed robots content is prepended to the repository file (`CORE-WEB-VITALS-AND-SEO-OPTIMIZATION-REPORT.md:264-268`).

## Edge enforcement by UA (VERIFIED live probe, 2026-11-23 ~10:29 UTC)
`GET https://easyworktools.online/` with different User-Agent strings:
| User-Agent | Status | Body bytes | `ai-labyrinth`/`labyrinth` marker in HTML |
|---|---|---:|---|
| Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0 Safari/537.36 | 200 | 255,067 | no |
| GPTBot/1.2 | 403 | 25 | no |
| ClaudeBot/1.0 | 403 | 25 | no |
| PerplexityBot/1.0 | 403 | 25 | no |
| CCBot/2.0 | 403 | 25 | no |

Interpretation:
- AI crawler/agent UAs are actively blocked (403) at the edge, consistent with the managed robots policy. This is public, read-only evidence of the **effect** of AI access policy, not proof of the dashboard toggle values.
- **AI Labyrinth remains enabled: NOT VERIFIED.** The blocked UAs received a 403 with no labyrinth marker; typical AI Labyrinth evidence would be a 200 response containing generated/decoy links. Could not inspect the dashboard; no claim is made about its current toggle.
- AI Crawler/Agent access **policies** are observed as blocking in `robots.txt` and by UA probe; whether the dashboard policy selection itself is unchanged versus the last audit cannot be confirmed without dashboard read access. No policy was modified.

## Crawler-relevant security events
`NOT VERIFIED`. The Security Events / firewall log was not accessible. No event counts, rule IDs, or timestamps are reported.

## Other security headers observed (VERIFIED)
- `content-security-policy-report-only` — report-only, not enforcing. Includes `frame-src https://script.google.com https://challenges.cloudflare.com https://googleads.g.doubleclick.net https://pagead2.googlesyndication.com https://ep2.adtrafficquality.google https://www.google.com/recaptcha/`. Full value in `08-live-probe-log.md`.
- `x-frame-options: DENY`, `x-content-type-options: nosniff`, `referrer-policy: strict-origin-when-cross-origin`, `permissions-policy: ... browsing-topics=()`.
- Existing Cloudflare challenge scripts (`challenges.cloudflare.com`) are allowed in CSP, but no challenge was triggered by the normal browser UA probe.

## Crawlability notes
- `GET /robots.txt` → 200; `GET /sitemap.xml` → 200 `application/xml; charset=utf-8`. Both reachable without challenge.
- `GET /.well-known/security.txt` → 200.
- No indexing request was submitted; no security or crawler setting was changed.
- Historical note only (`FINAL-REPORT.md:87`): a report-only CSP previously had gaps for ad frames; the current observed report-only CSP now includes several ad origins (see above). This is an observation, not a verified fix/current dashboard finding.

## Authenticated dashboard addendum — supersedes `NOT VERIFIED` above

The Cloudflare Security Center, AI Crawl Control, and Security settings were read in the main browser.

### Security Center

- Scan timestamp: **23 Nov 2026 13:32:57**.
- Only remaining insight: **Users without MFA** / `mfa_not_enabled` (moderate).
- This finding was deliberately **not touched**, consistent with the audit scope.

Earlier completed work, not repeated in this audit: DMARC spoofing remediation, AI Labyrinth enablement, and creation of Turnstile widget `EasyWorkTools.online Managed` in Managed mode for `easyworktools.online` (site key `0x4AAAAAAGOj057AwPtPxc89`). No Turnstile Secret Key was retrieved, logged, or reported. No CAPTCHA was integrated and no Turnstile setting was changed in this audit.

### AI Crawl Control — last 7 days

| Crawler | Allowed requests |
|---|---:|
| Google | 215 |
| Applebot | 72 |
| BingBot | 34 |
| Claude-SearchBot | 8 |
| ChatGPT-User | 3 |
| OAI-SearchBot | 1 |

Totals: **343 crawler requests**, **332 allowed**, **11 unsuccessful**. PerplexityBot, GPTBot, and ClaudeBot had **0 allowed** requests and appeared only with unsuccessful requests.

### AI Crawler and Agent access policies — confirmed

- Search engines: **Allow (do not block)**.
- Training crawlers: **Disallow**.
- AI agents: **Block on pages with ads**.
- Personal agents: **Block on pages with ads**.
- AI Labyrinth final observed switch state: **`aria-checked=true`** (enabled).

During a read-only inspection, an AI Labyrinth switch control was clicked once. The final observed state was enabled; no Save action was used and no other setting change was observed. This is recorded for transparency and is not represented as an intentional setting change during the audit.

### Spoofed-UA HTTP probes — context, not identity verification

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

Spoofed UA results are not authoritative bot verification. The authenticated dashboard policies above are the controlling evidence for intended access; live HTTP responses only show what a claimed UA received from this vantage point.
