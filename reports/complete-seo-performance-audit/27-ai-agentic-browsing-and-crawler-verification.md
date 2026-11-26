# 27 — AI, agentic browsing, and crawler verification

Date: 2026-11-23  
Scope: production EasyWorkTools.online only.  
Status: **browser access PASS with one limitation; crawler policy PASS as configured; indexing/citation NOT TESTED**.

## 1. robots.txt and sitemap

- `https://easyworktools.online/robots.txt` — HTTP 200
- `https://easyworktools.online/sitemap.xml` — HTTP 200
- No robots.txt, sitemap, canonical, redirect, or Cloudflare AI policy change was made.

The owner-configured policy remains: search engines and AI search allowed; training crawlers disallowed; agents/personal agents blocked on pages with ads; AI Labyrinth enabled.

## 2. Spoofed-user-agent HTTP checks

Spoofing a user-agent string only tests declared response behavior. It does **not** verify bot identity, indexing, rendering, citation, or AI model behavior.

| Declared UA | HTTP | Redirects | Result vs configured policy |
|---|---:|---:|---|
| Googlebot | 200 | 0 | PASS |
| Bingbot | 200 | 0 | PASS |
| OAI-SearchBot | 200 | 0 | PASS |
| Claude-SearchBot | 200 | 0 | PASS |
| ChatGPT-User | 200 | 0 | PASS |
| Google-Extended | 200 | 0 | PASS |
| PerplexityBot | 403 | 0 | PASS (blocked as expected) |
| GPTBot | 403 | 0 | PASS (blocked as expected) |
| ClaudeBot | 403 | 0 | PASS (blocked as expected) |

No Cloudflare challenge interstitial was identified in these probes. Metadata and canonical availability were confirmed in browser checks; sitemap was HTTP 200.

## 3. JavaScript-dependent content and internal links

Browser checks confirmed:

- Homepage visible text: 12,260 characters before interaction.
- `/tools/` navigation link works and opens H1 `Tools`.
- `/categories/image/` opens from the tools page with H1 `Image Tools`.
- An individual tool opens from the category page: `/tools/chart-maker/`, H1 `Chart Maker`, 15 inputs, 7 buttons.
- `/tools/mph-to-kph/` accepts input `60` and exposes tool UI; output value was not uniquely verified.
- `/blog/mph-to-kph-explained` exposes 1,812 characters of article text and 6 H2 headings.
- A blog internal link to `/tools/` works.

Status: **PASS** for browser-visible content and internal navigation on sampled paths.

## 4. Agentic browsing test steps

| Required action | Status | Evidence |
|---|---|---|
| Load homepage | PASS | `https://easyworktools.online/`, title loaded |
| Scroll through page | **NOT TESTED** | `browser.scroll` timed out; `window.scrollTo(0,1200)` returned `scrollY:0` |
| Read visible content | PASS | 12,260 characters |
| Open navigation links | PASS | `/tools/` opened via navigation link |
| Navigate to tool categories | PASS | `/categories/image/` opened |
| Open individual tool pages | PASS | `/tools/chart-maker/` opened |
| Interact with representative tools | PASS (limited) | Input accepted on `/tools/mph-to-kph/`; exact output not verified |
| Read blog articles | PASS | `/blog/mph-to-kph-explained` read |
| Follow internal links | PASS | Blog → `/tools/` |

## 5. What this does not prove

- Browser accessibility is not crawler access.
- Crawler access is not indexing.
- Indexing is not ranking.
- Ranking is not citation by AI systems.
- Spoofed UA responses are not verified bot identity.
- The scroll failure means below-the-fold browser behavior remains unverified.

No AI system was observed indexing or citing the site in this test.

## 6. Comparison with baseline

Previous AI-crawler audit (`14-ai-crawler-and-discoverability-audit.md`) relied on configured Cloudflare rules and pre-deployment checks. This report adds post-deployment production evidence: all allowed declared UAs returned 200 with no redirects, all blocked training/agent UAs returned 403, and browser-based navigation worked except scrolling.

## 7. Final status

- **PASS**: robots/sitemap reachable; policy-consistent declared-UA responses; browser load/read/navigation/tool/blog/internal-link flows.
- **WARNING**: tool interaction output not uniquely verified.
- **NOT TESTED**: scroll; actual crawler verification; indexing; ranking; AI citation.
- **No changes made**: no robots, canonical, sitemap, policy, or crawler configuration was modified.
