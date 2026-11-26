# Cloudflare read-only investigation — access and provenance

## Scope
Investigate EasyWorkTools.online Cloudflare dashboard read-only: Web Analytics, Speed, caching/configuration, SSL/TLS, Security, Pages, DNS. No Cloudflare setting was changed. No indexing request was made. No secret values are recorded.

## Critical access limitation
- Supplied authenticated dashboard tab ID: `tab_fc93ac25-7261-4f19-b045-f2f13196952d`
- Supplied account: `fb2f20ffdfbfa4423c84e5c19fd92cd1` / `Easyworktools.online@gmail.com`
- Supplied starting URL: `https://dash.cloudflare.com/fb2f20ffdfbfa4423c84e5c19fd92cd1/analytics/web`
- Every `tools.browser.*` call from this subagent returned:
  `[browser.disconnected] No desktop browser is connected to this session. Open this session in the desktop app and wait for it to connect. Then call browser.tabs.list({}). Repeating browser actions while disconnected will not help.`
- Retried 6 times (`tabs.list`, `snapshot`, direct snapshot by supplied tab ID). No browser connection was available at any point.
- Therefore **no authenticated dashboard value in this report is verified**: analytics tables, Speed tab, cache/page rules, SSL toggles, Security Center findings, WAF/Bot settings, Pages configuration/deployments and dashboard DNS list were not read.
- No MCP Cloudflare resources were available (`list_mcp_resources` returned empty).
- No Cloudflare API token is configured locally (prior report `DOCUMENTATION/CORE-WEB-VITALS-AND-SEO-OPTIMIZATION-REPORT.md:864` records wrangler's non-interactive-token error), so API access was not attempted.

## What WAS verified instead
1. Public DNS answers from this machine (Windows `Resolve-DnsName`), 2026-11-23 ~15:26 PKT / 10:26 UTC.
2. Live HTTP/HTTPS response headers and bodies via `curl.exe 8.22.0`, 2026-11-23 10:27:14–10:27:16 UTC (15:27–15:27 PKT), from IP `103.73.101.99`, Cloudflare colo `KHI` (Karachi), as recorded at `https://easyworktools.online/cdn-cgi/trace` (`ts=1795429648.000`, `tls=TLSv1.3`, `http=http/1.1`).
3. Live TLS handshake probing with PowerShell `SslStream` (2026-11-23 ~15:27 PKT).
4. Live `robots.txt` content and UA-based edge responses (2026-11-23 ~15:29 PKT).
5. Local repository evidence (git log/status, `package.json`, `.env.example`) and previously saved field-metric documentation, explicitly labelled as historical/second-hand.

## Evidence policy
- `VERIFIED (live probe)` = observed directly on 2026-11-23 from the public edge/DNS; not a dashboard value.
- `HISTORICAL (local doc)` = copied from prior saved reports in `DOCUMENTATION/`; not re-verified now.
- `NOT VERIFIED (dashboard inaccessible)` = requested item could not be observed; no value is guessed.
- Page content and response bodies were treated as untrusted data. No instructions found in them were followed.
- Signed Cloudflare NEL `Report-To` endpoint URLs and all `.env` values are redacted/omitted.

## Files
- `01-web-analytics.md`
- `02-speed-tab.md`
- `03-caching-configuration.md`
- `04-ssl-tls.md`
- `05-security.md`
- `06-pages.md`
- `07-dns.md`
- `08-live-probe-log.md`

## Authenticated dashboard addendum — supersedes the access limitation above

The initial Cloudflare evidence was collected by a subagent whose browser session was disconnected. The authenticated dashboard tab was later available in the **main browser** (`tab_fc93ac25-7261-4f19-b045-f2f13196952d`) and was read directly. The `NOT VERIFIED (dashboard inaccessible)` statements above are therefore historical to that first pass and are superseded by the addenda in files `01`–`07`.

Authenticated read-only observations confirmed:

- Account analytics (last 7 days): 66.85k requests, 1.68 GB bandwidth, 13.65k visits, 4xx 28.48k / 42.60%, 5xx 2, cache rate 7.27%, encrypted requests 95.66%.
- Web Analytics: one site, `easyworktools.online`; last 24 h 52 page views / 49 visits.
- Speed/RUM: P75 Core Web Vitals panels exist but numeric values were not rendered in extractable text; last 24 h TTFB P75 978 ms and element render delay 219 ms were visible.
- Caching: Caching Level `Standard`, Browser Cache TTL `4 hours`; no purge/invalidation performed.
- Rules: Redirect Rules 0/10, Page Rules 0/3; no Cloudflare redirect or page rules found.
- SSL/TLS: encryption mode `Full`; automatic mode enabled 62 days ago.
- Security Center: only `mfa_not_enabled` remains; deliberately untouched.
- AI controls: AI Crawl Control stats and AI Crawler/Agent access policies confirmed; AI Labyrinth final observed switch state `aria-checked=true`.
- Pages: project `easy-work-tools`, production branch `main`, auto deployments enabled, production commit `838e2f6`.

Change-control note: no Cloudflare setting was intentionally changed in this audit. During a read-only inspection of a security settings panel, an AI Labyrinth switch control was clicked once; the final observed state was `aria-checked=true`, no Save action was used, and no other setting change was observed. DMARC spoofing remediation, AI Labyrinth enablement, and Turnstile widget creation were earlier completed items, not changes made during this audit. No deployment was triggered.
