# 08 — Security, Bot, and Turnstile Controls

Evidence: `data/cloudflare/05-security.md`, `data/cloudflare/08-live-probe-log.md`, and their authenticated addenda. Scope: EasyWorkTools.online only. No secret value is recorded.

## 1. Security Center

- Scan timestamp: **23 Nov 2026 13:32:57**.
- Only remaining insight: **Users without MFA** / `mfa_not_enabled` (moderate).
- This finding was **deliberately untouched**, per audit scope.

Earlier completed work, not repeated in this audit:

- DMARC spoofing remediation: `v=DMARC1; p=quarantine; pct=100; rua=mailto:info@easyworktools.online; fo=1`, publicly verified on 1.1.1.1 and 8.8.8.8.
- AI Labyrinth enablement.
- Turnstile widget `EasyWorkTools.online Managed` created in Managed mode for `easyworktools.online`; public site key `0x4AAAAAAGOj057AwPtPxc89`. No embed was added. The Secret Key was never exposed.

No CAPTCHA integration and no Turnstile setting change was made in this audit.

## 2. AI Crawl Control — last 7 days

| Crawler | Allowed requests |
|---|---:|
| Google | 215 |
| Applebot | 72 |
| BingBot | 34 |
| Claude-SearchBot | 8 |
| ChatGPT-User | 3 |
| OAI-SearchBot | 1 |

Totals: **343 crawler requests**, **332 allowed**, **11 unsuccessful**. PerplexityBot, GPTBot, and ClaudeBot had 0 allowed requests and appeared only with unsuccessful requests.

## 3. AI crawler and agent policies — confirmed

| Policy | Setting |
|---|---|
| Search engines | Allow (do not block) |
| Training crawlers | Disallow |
| AI agents | Block on pages with ads |
| Personal agents | Block on pages with ads |
| AI Labyrinth | Final observed state `aria-checked=true` (enabled) |

During a read-only inspection, an AI Labyrinth switch control was clicked once. Final observed state was enabled; no Save action was used and no other setting change was observed. No policy was intentionally changed in this audit.

## 4. Spoofed-UA HTTP probes

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

These are **spoofed UA** observations, not verified bot identities. They show what a claimed UA received from this vantage point; the authenticated dashboard policies are the controlling evidence for intended access.

## 5. Security response headers

- `content-security-policy-report-only` is report-only, not enforcing. It includes ad-related frame sources from earlier work.
- `x-frame-options: DENY`; `x-content-type-options: nosniff`; `referrer-policy: strict-origin-when-cross-origin`; restrictive `permissions-policy`.
- Normal browser UA probes did not trigger a challenge.

## 6. Change-control statement

No WAF rule, managed ruleset, rate limit, Bot Fight Mode, Managed Challenge, security event setting, Turnstile setting, CAPTCHA integration, DNS record, or Security Center item was changed. The only production code change prepared is the local `index.html` CLS fix, which is awaiting deployment approval.
