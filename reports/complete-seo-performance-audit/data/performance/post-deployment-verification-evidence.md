# Post-deployment verification evidence — 2026-11-23

Scope: EasyWorkTools.online production only. No GlobeCareer.online data, settings, credentials, DNS, redirects, security configuration, cache, or indexing state was accessed or changed.

## Deployment provenance

- Repository: `easyworktoolsonline-ux/Easy-work-Tools`
- Branch: `main`
- Local commit before push: `838e2f6`
- Deployed commit: `b1cf6d12d26ec77765eb45643f4af3e432f4f553` (`b1cf6d1`)
- Commit message: `Fix category CLS by inlining critical carousel CSS`
- Cloudflare Pages project: `easy-work-tools`
- Production deployment ID: `35ad889e-71e6-452b-80ea-8ce3c2550b1d`
- Deployment URL: `https://35ad889e.easy-work-tools.pages.dev`
- Reviewed file: `index.html`
- Reviewed SHA-256: `7619EDE1A3002D844F8B0DA0C9B28E39040C56D30E7AE02C5B94BE4E4EFE9FBA`
- Backup SHA-256: `595E71C8400B2894ADEB5F5C2A6C0C9D96DD335B7D284448FF6E3F14C2091800`
- Staged diff immediately before commit: `2 insertions(+), 1 deletion(-)`, `index.html` only.

## Live HTTP checks (curl, 2026-11-23)

| URL | Result | Redirect target |
|---|---|---|
| `http://easyworktools.online/` | 301 | `https://easyworktools.online/` |
| `https://www.easyworktools.online/` | 301 | `https://easyworktools.online/` |
| `https://easyworktools.online/tools/mph-to-kph/` | 200 | — |
| `https://easyworktools.online/categories/image/` | 200 | — |
| `https://easyworktools.online/blog/mph-to-kph-explained` | 200 | — |
| `https://easyworktools.online/tools/webp-to-pdf/` | 200 | — |
| `https://easyworktools.online/robots.txt` | 200 | — |
| `https://easyworktools.online/sitemap.xml` | 200 | — |

Representative career/resume URLs that were probed (`/tools/resume-builder/`, `/categories/career/`, `/blog/resume-tips`) returned 404. No career/resume URLs were found in the sitemap, tool manifest, or blog manifest; these are reported as NOT TESTED where no live URL exists, not as missing pages to invent.

## Live homepage browser check (2026-11-23)

- URL: `https://easyworktools.online/`
- Title: `EasyWorkTools.online — Free Online Tools, Guides & Resources`
- Canonical: `https://easyworktools.online/`
- Robots: `index,follow`
- H1: `Free Tools to Make Tasks Simple`
- `.cat-rail` computed `min-height: 260px`
- `.cat-track` computed `display: flex`
- Hidden heading `#catSectionTitle`: `Explore categories`, class `visually-hidden`
- Inline critical CSS contains `.cat-track` and `min-height:260px`
- Resource count: 16
- Resources with HTTP 4xx/5xx: none
- Browser console errors: 0
- Navigation duration: 1,258 ms; responseStart: 600 ms; loadEventEnd: 1,258 ms (single browser session, not field data)

## Spoofed-user-agent checks (2026-11-23)

The probes used declared user-agent strings only. They are not proof of verified bot identity, indexing, citation, or AI model access.

| Declared UA | HTTP status | Redirects | Final URL |
|---|---:|---:|---|
| Googlebot | 200 | 0 | `https://easyworktools.online/` |
| Bingbot | 200 | 0 | `https://easyworktools.online/` |
| OAI-SearchBot | 200 | 0 | `https://easyworktools.online/` |
| Claude-SearchBot | 200 | 0 | `https://easyworktools.online/` |
| ChatGPT-User | 200 | 0 | `https://easyworktools.online/` |
| Google-Extended | 200 | 0 | `https://easyworktools.online/` |
| PerplexityBot | 403 | 0 | `https://easyworktools.online/` |
| GPTBot | 403 | 0 | `https://easyworktools.online/` |
| ClaudeBot | 403 | 0 | `https://easyworktools.online/` |

These results match the owner-configured Cloudflare AI policy: search/AI search allowed, training crawlers disallowed, agent/personal-agent access blocked on pages with ads, AI Labyrinth enabled.

## Browser-based agentic navigation checks (2026-11-23)

| Step | Result | Evidence |
|---|---|---|
| Load homepage and read visible content | PASS | `https://easyworktools.online/`, 12,260 characters visible |
| Scroll through homepage | NOT TESTED | `browser.scroll` timed out; `window.scrollTo(0,1200)` returned `scrollY:0` |
| Open `/tools/` from navigation | PASS | H1 `Tools` |
| Open `/categories/image/` from tools page | PASS | H1 `Image Tools` |
| Open individual tool from category | PASS | `/tools/chart-maker/`, H1 `Chart Maker`, 15 inputs, 7 buttons |
| Interact with representative tool | PASS (limited) | `/tools/mph-to-kph/` input set to `60`; output text not uniquely verified |
| Read blog article | PASS | `/blog/mph-to-kph-explained`, 1,812 characters, 6 H2s |
| Follow internal link from blog to `/tools/` | PASS | Final path `/tools/` |

## Evidence limitations

- No browser screenshot was retained because the browser tool required a visible desktop tab and the connected session did not expose one. Textual DOM, HTTP, trace, and PageSpeed Insights evidence was retained instead.
- PSI field data was `No Data` for all tested URLs; lab results are not real-user field data.
- Third-party SEMrush/Ahrefs data remains estimates and is reported separately from GSC measurements.
