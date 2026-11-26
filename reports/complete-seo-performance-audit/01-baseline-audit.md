# 01 — Baseline Audit

Audit timestamp: 2026-11-23 (local session time). Scope: EasyWorkTools.online only. No GlobeCareer resources were accessed or used.

## 1. Repository state and preservation

| Item | Baseline |
|---|---|
| Repository | `F:\easyworktools.online\Easy-work-Tools` |
| Branch | `main` |
| Tracked changes | None (`git status --porcelain` showed 0 modified/staged tracked files) |
| Untracked entries | 96, including `.env.example`, local `.wrangler/` state, `_work/` reports, and an untracked Vite/React scaffold (`src/`, `server.ts`, `vite.config.ts`, `tsconfig.json`, `metadata.json`) |
| HEAD observed by prior investigation | `838e2f6c99a261a421df06fcd53dffb97341b599` (`Replace OG image with approved brand reference`) |
| Full timestamped backup | `C:\Users\ahmad\AppData\Local\Temp\opencode\ewt-full-backup-20261123-152231` |
| Backup contents | 2,549 files / 195,300,666 bytes; excludes reinstallable `node_modules`; includes `.git` and all untracked files |
| Backup manifests | `git-status-before.txt`, `git-log-before.txt`, `git-branch-before.txt`, `key-file-hashes-before.txt` inside the backup directory |

The untracked files were preserved, not deleted or overwritten. No commit, push, or deployment has been performed in this audit.

## 2. Site inventory at baseline

| Item | Observed value |
|---|---|
| Sitemap | `https://easyworktools.online/sitemap.xml`, HTTP 200, 30,272 bytes |
| Sitemap `<url>` count | 392 unique URLs, 0 with `<lastmod>` |
| Sitemap composition | 243 `/tools/`, 130 `/blog/`, 10 `/categories/`, 9 static pages, 1 root |
| robots.txt source | `robots.txt`, 476 bytes: `User-agent: *`, `Allow: /`, `Disallow: /api/`, `Sitemap: ...`, plus `Mediapartners-Google: Allow: /` |
| Live robots.txt | HTTP 200, 3,735 bytes; Cloudflare managed content is prepended to the repository rules |
| Redirect rules | `_redirects` contains 26 rules, including canonical `/index.html`, `/home`, `/categories`, legacy tool slugs; sampled redirects resolved correctly |
| Response headers | `_headers` sets baseline security headers, report-only CSP, and cache lifetimes; `/api/*` is `no-store` |

## 3. Live HTTP spot checks (2026-11-23)

| URL | Status | Final URL | Redirects | Time (s) | Notes |
|---|---:|---|---:|---:|---|
| `http://easyworktools.online/` | 200 | `https://easyworktools.online/` | 1 | 0.714 | HTTP → HTTPS works |
| `https://www.easyworktools.online/` | 200 | `https://easyworktools.online/` | 1 | 0.800 | www → apex works |
| `https://easyworktools.online/` | 200 | same | 0 | 0.360 | HTML 255,371 B |
| `/robots.txt` | 200 | same | 0 | 0.304 | 3,735 B live, Cloudflare-managed prefix |
| `/sitemap.xml` | 200 | same | 0 | 0.325 | 30,272 B |
| `/tools/` | 200 | same | 0 | 1.304 | 350,619 B |
| `/tools/age-calculator/` | 200 | same | 0 | 0.648 | representative tool |
| `/tools/ai-write/ai-detector/` | 200 | same | 0 | 1.092 | representative nested tool |
| `/blog/` | 200 | same | 0 | 0.677 | representative blog index |
| `/blog/ai-detector` | 200 | same | 0 | 0.769 | representative article |
| `/categories/ai-write/` | 200 | same | 0 | 0.612 | representative category |
| `/about` | 200 | same | 0 | 0.597 | static page |
| `/contact` | 200 | same | 0 | 0.601 | static page |
| `/llms.txt` | 200 | same | 0 | 0.633 | 59,741 B |
| `/ai-catalog.json` | 200 | same | 0 | 0.360 | 225,444 B |
| `/nonexistent-test-page` | 404 | same | 0 | 0.359 | custom 404 |
| `/index.html` | 200 | `/` | 1 | 0.401 | canonical redirect works |
| `/categories` | 200 | `/tools/` | 1 | 0.418 | legacy redirect works |
| `/tools/jpg-pdf-converter` | 200 | `/tools/jpg-to-pdf/` | 1 | 0.653 | legacy tool redirect works |

No redirect loop was found in the sampled set. `curl` timing is a coarse network observation, not a Core Web Vitals measurement.

## 4. Core Web Vitals baseline supplied by the user (24 h Cloudflare field data)

| Metric | Baseline |
|---|---|
| LCP | Good 100%; P50 516 ms, P75 1,048 ms, P90/P99 1,516 ms |
| INP | Good 100%; input delay 1 ms, processing 0 ms, presentation delay 16 ms |
| CLS | Good 75%, Poor 25%; identified shift score **0.585** |
| Shifted element | `html > body > main > section.category-section.section > div.container` |
| Page load time | 3,959 ms |
| TTFB | 978 ms |
| Resource load delay / duration | 0 ms / 0 ms |
| Element render delay | 71 ms |

The CLS problem is the P0 item. The LCP and INP field data were already good at baseline and must be preserved.

## 5. Previous PageSpeed Insights evidence (not a fresh measurement)

From `_work/mobile-pagespeed-optimization/psi-baseline-extracted.json`, fetched 2026-11-21:

| Category | Mobile | Desktop |
|---|---:|---:|
| Performance | 0.88 | 0.98 |
| Accessibility | 1.00 | 1.00 |
| Best Practices | 0.92 | 1.00 |
| SEO | 1.00 | 1.00 |

Mobile lab values: FCP/LCP 3,095 ms, TBT 19.5 ms, CLS 0.0097, Speed Index 3,095 ms. LCP element was the hero H1. Render-blocking resources were `assets/styles.css`, `assets/categories.css`, and Cloudflare `email-decode.min.js`.

Prior applied changes (already in tracked source before this audit): inline critical CSS in `index.html`, async stylesheet loading with `<noscript>` fallback, and `pagead2.googlesyndication.com` added to the report-only CSP `frame-src`. Those changes were validated locally, not with a post-fix live PSI run. A fresh PSI API request during this audit returned HTTP 429 (quota limit), so no new PSI score is claimed here.

## 6. Live homepage DOM observations

A browser inspection of `https://easyworktools.online/` found:

- `main section.category-section.section > div.container` exists and contains two children: a small `<section>` with “Recent Tools:” and a `div.cat-rail` category rail.
- At 1296×886 CSS px, the category section was 1,281×301.78 px; its container was 1,160×279.78 px, centred with 60.5 px margins.
- The `cat-rail` was 1,160×259.78 px and its computed style was `display:block; position:relative`, not a CSS grid at that breakpoint.
- No `<img>` elements were present in the live DOM at inspection time; one `img` resource was recorded in the resource timing data.
- Several declared font faces were `unloaded` (Plus Jakarta Sans 500, Space Grotesk 500), indicating font-swap risk that needs to be correlated with CSS usage.
- A buffered `layout-shift` PerformanceObserver at that moment returned no entries; the browser trace showed 0 long tasks but explicitly does not compute CLS.

These are starting observations only. Root-cause confirmation requires tracing the category rail’s initial paint and late layout changes.

## 7. AI/search crawler access at baseline

Live `robots.txt` contains a Cloudflare-managed block that allows `search=yes` and `ai-train=no`, and disallows many training crawlers and agents including `GPTBot`, `ClaudeBot`, `Google-Extended`, `ChatGPT-User`, and `Perplexity-User`. Googlebot and Bingbot are not disallowed. `OAI-SearchBot`, `Claude-SearchBot`, and `PerplexityBot` are not present in the managed robots.txt block.

Spoofed user-agent HTTP tests against the homepage (not definitive crawler verification):

| User agent | HTTP status | Note |
|---|---:|---|
| Googlebot | 200 | 255,372 B |
| Bingbot | 200 | 255,372 B |
| OAI-SearchBot | 200 | 255,067 B |
| Claude-SearchBot | 200 | 255,067 B |
| PerplexityBot | **403** | 25 B response |
| GPTBot | **403** | 25 B response; also disallowed by robots.txt |
| ChatGPT-User | 200 | but disallowed by robots.txt |
| ClaudeBot | **403** | 25 B response; also disallowed by robots.txt |
| Google-Extended | 200 | but disallowed by robots.txt |

`cf-mitigated` was not observed in the sampled response headers. UA spoofing cannot prove verified crawler access; official verification and Cloudflare AI Crawl Control settings must be checked. Search crawlers and the two AI search bots tested were not HTTP-blocked.

## 8. Baseline conclusion

The site is broadly available, correctly redirected, and already has good LCP/INP field data. The urgent issues are the reported 0.585 CLS in the category container, the 25% poor-CLS field distribution, TTFB/page-load investigation, and confirming that AI/search crawler access is intentional rather than accidentally restricted. GSC shows 62 indexed and 549 not-indexed pages on its overview, which requires detailed report analysis before any indexing action.
