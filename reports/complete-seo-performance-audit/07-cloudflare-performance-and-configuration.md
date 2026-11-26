# 07 — Cloudflare Performance and Configuration

Evidence: `data/cloudflare/00`–`08`. Initial public probes were complemented by authenticated main-browser dashboard reads; addenda in those files supersede earlier `NOT VERIFIED` notes tied to a disconnected subagent browser. Scope: EasyWorkTools.online only.

## 1. Confirmed project and deployment context

| Item | Value |
|---|---|
| Cloudflare account | `fb2f20ffdfbfa4423c84e5c19fd92cd1` / `Easyworktools.online@gmail.com` |
| Pages project | `easy-work-tools` |
| Git repository | GitHub `easyworktoolsonline-ux/Easy-work-Tools` |
| Production branch | `main` |
| Auto deployments | Enabled |
| Production domains | `easyworktools.online`, `www.easyworktools.online`, `easy-work-tools.pages.dev` |
| Current production commit | `838e2f6` — matches local HEAD |
| Build command / output | blank in dashboard UI |
| Build comments | enabled |
| Build cache | disabled |
| Watch paths | `*` |
| Build system | Version 3 |
| Deploy hooks | none |
| Compatibility date | `2026-09-18` |

A navigation to the full `/deployments` view timed out once; the project overview and build settings were read successfully. **No deployment was triggered.**

## 2. Traffic and analytics

Cloudflare account analytics, last 7 days:

| Metric | Value |
|---|---:|
| Requests | 66.85k |
| Bandwidth | 1.68 GB |
| Visits | 13.65k |
| 4xx | 28.48k (42.60%) |
| 5xx | 2 |
| Cache rate | 7.27% |
| Encrypted requests | 95.66% |

Cloudflare Web Analytics: one site `easyworktools.online`; last 24 h 52 page views / 49 visits.

The large 4xx share is recorded as an observation. It was not decomposed by path/status, so no cause is asserted. No rule, page, or redirect was changed in response.

## 3. Speed / RUM

User-supplied 24 h baseline:

- LCP P50 516 ms, P75 1,048 ms, P90/P99 1,516 ms.
- INP 100% good.
- CLS 75% good / 25% poor; 0.585 at `html>body>main>section.category-section.section>div.container`.
- Page load 3,959 ms; TTFB 978 ms.

Authenticated dashboard RUM (last 24 h):

- TTFB P75 **978 ms**.
- Resource load delay **0 ms**, resource load duration **0 ms**, element render delay **219 ms**.
- INP input delay **1 ms**, processing **0 ms**, presentation **16 ms**.
- P75 Core Web Vitals panels exist but numeric values did not render in extractable text; no CLS/LCP/INP percentage is claimed from that panel.
- Cache hit ratio: Cloudflare **24.3%**, origin **75.7%**.
- No recurring synthetic tests configured.
- Dashboard suggestion: improve Smart Shield cache hit ratio. No change made.

GSC CrUX had no mobile or desktop data for the last 90 days, so it cannot confirm or contradict the Cloudflare CLS signal.

## 4. Caching and edge behavior

Dashboard:

- Caching Level: **Standard**.
- Browser Cache TTL: **4 hours**.
- Redirect Rules: **0 / 10** configured.
- Page Rules: **0 / 3** configured.
- No Cloudflare redirect/page rules found.

Live probes:

- Brotli (`Content-Encoding: br`) present on HTML, robots, sitemap, CSS, JS, favicon, and ads.txt.
- HTML responses: `cf-cache-status: DYNAMIC`, `Cache-Control: public, max-age=0, must-revalidate`.
- Static assets: cached with HIT and longer explicit Cache-Control values.
- No cache purge or invalidation was performed.

An HTML cache rule was not enabled. It would need explicit approval, purge/deploy planning, and confirmation that HTML is not personalized.

## 5. SSL/TLS and redirects

Dashboard:

- Encryption mode **Full**.
- Automatic HTTPS mode enabled 62 days ago.
- Last 24 h TLS: 1.3 = 4.75k, 1.2 = 8, None = 109.

Live probes:

- `http://` → HTTPS 301 → 200.
- `https://www.` → apex 301 → 200.
- HSTS `max-age=15552000`.
- TLS 1.0/1.1 failed; TLS 1.2/1.3 succeeded with valid certificates.

No SSL/TLS setting was changed.

## 6. DNS and email authentication

- Nameservers: `alex.ns.cloudflare.com`, `bonnie.ns.cloudflare.com`.
- A/AAAA records point to Cloudflare; MX uses Cloudflare Email Routing.
- DMARC was previously set to `v=DMARC1; p=quarantine; pct=100; rua=mailto:info@easyworktools.online; fo=1`, verified publicly on 1.1.1.1 and 8.8.8.8. No DNS record was edited during this audit.
- Google verification TXT was redacted in evidence files.

## 7. Change control

No Cloudflare setting was intentionally changed in this audit. During a read-only inspection, an AI Labyrinth switch control was clicked once; the final observed state was `aria-checked=true`, no Save action was used, and no other setting change was observed. Earlier completed items (DMARC spoofing remediation, AI Labyrinth enablement, Turnstile widget creation) were not repeated here. No Turnstile Secret Key was retrieved or logged. No CAPTCHA was integrated.

## 8. Performance implications

- LCP is currently good; preserve it. TTFB 978 ms is the largest LCP sub-part but is already within a good P75 LCP.
- The P0 problem is CLS, addressed locally by the `index.html` patch, pending deployment.
- The 42.60% 4xx share and HTML `DYNAMIC` caching deserve separate investigation; neither justifies a speculative change in this patch.
- Field validation after deployment is mandatory before claiming any CWV improvement.
