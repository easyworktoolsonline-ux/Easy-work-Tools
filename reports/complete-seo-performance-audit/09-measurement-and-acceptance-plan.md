# 09 — Measurement and Acceptance Plan

## 1. Evidence hierarchy

| Evidence type | Used for | Not used for |
|---|---|---|
| First-party GSC | Search performance, indexation, queries, pages, devices, countries | Field CWV (no CrUX data available) |
| Cloudflare RUM / field data supplied by owner | Core Web Vitals baseline, TTFB, INP, CLS element | Lab-only claims |
| Controlled local CLS harness | Root-cause proof and pre-deployment fix verification | Field CWV claims |
| Live browser + Lighthouse (A/BP/SEO only) | Page-level SEO/accessibility/best-practices sanity checks | Performance score or CWV claims |
| SEMrush / Ahrefs | Keyword, competitor, and backlink research direction | Traffic truth or success criteria |
| Build / lint | Regression check for the local patch | SEO or field-performance proof |

No fresh PSI score is claimed: the API request returned HTTP 429. The prior PSI scores (mobile 0.88, desktop 0.98, 2026-11-21) are historical only.

## 2. Baseline values to preserve or improve

| Metric | Baseline | Target |
|---|---|---|
| LCP P75 | 1,048 ms (good) | Remain <2,500 ms |
| INP P75 | 100% good; input 1 ms / processing 0 ms / presentation 16 ms | Remain <200 ms |
| CLS | 75% good / 25% poor; 0.585 at category container | ≤0.1 for the category-attributed shift; stretch ≤0.05 |
| TTFB P75 | 978 ms | No regression; investigate separately |
| GSC clicks/impressions | 47 / 771 over 3 months | No regression; do not claim improvement without data |
| Indexed pages | 62 indexed / 549 not indexed | No deletion-driven changes |

## 3. Pre-deployment verification

1. Confirm final `index.html` SHA-256: `7619EDE1A3002D844F8B0DA0C9B28E39040C56D30E7AE02C5B94BE4E4EFE9FBA`.
2. Confirm `git diff --numstat` shows only `index.html | 2 ++-`.
3. Confirm `npm.cmd run build` and `npm.cmd run lint` exit 0.
4. Confirm the live production homepage still shows `.cat-rail{min-height:0px}` (pre-deploy state) so the before/after distinction is preserved.
5. Keep the backup at `C:\Users\ahmad\AppData\Local\Temp\opencode\ewt-full-backup-20261123-152231` until post-deploy validation is complete.

## 4. Post-deployment verification (after explicit approval)

1. Confirm production HTML contains `.cat-rail{min-height:260px}` and `<h2 id="catSectionTitle" ...>Explore categories</h2>`.
2. Confirm `.cat-track` computes `display:flex` at DOMContentLoaded and `assets/categories.css` still loads async.
3. Confirm no new console errors or failed resource responses on homepage.
4. Confirm sitemap, robots, canonicals, redirects, and representative tool/category/blog URLs still respond as before.
5. Monitor Cloudflare RUM for at least 7 days; segment by device/country where available.
6. Re-check GSC only after enough time has passed for meaningful data; do not expect immediate indexation changes.

## 5. Acceptance decision rule

- **Pass**: category-attributed field CLS ≤0.1 (stretch ≤0.05) AND LCP P75 <2,500 ms AND INP P75 <200 ms, with no regression in crawl/indexation checks.
- **Hold**: CLS improved but field data is insufficient; continue monitoring and do not claim success.
- **Investigate**: CLS remains poor; collect field session details (device, viewport, ad state, referrer) before any additional change. Do not assume the synthetic header/nav shift is the cause without field evidence.

## 6. Indexing-request policy

No indexing request was made. If later approved, restrict to a small, justified set after canonical verification, for example `/`, `/tools/mph-to-kph/`, `/blog/explain-it`, and `/tools/webp-to-pdf/`. Do not request all 549 unindexed URLs.
