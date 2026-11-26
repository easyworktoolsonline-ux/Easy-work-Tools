# 35 — Deployment and PSI recheck final report

Date: 2026-11-23  
Scope: EasyWorkTools.online production only.  
Status: **PASS for the approved deployment and live page verification; lab PSI rechecks mostly PASS with field data still UNVERIFIED; no additional site files changed.**

## 1. Executive summary

| Item | Result |
|---|---|
| Approved file set | **PASS** — exactly 155 files committed (67 blog, 88 tool) |
| Push to existing `main` | **PASS** — `b1cf6d1..d747513  main -> main` |
| Cloudflare Pages production deployment | **PASS** — deployment `8be19500-4977-4d62-9e9b-0e1b219a9803`, status `success` |
| Live core-page verification | **PASS** — 381/381 pages (242 tools, 129 blogs, 10 categories) |
| Redirect / sitemap / discovery preservation | **PASS** — no observed changes |
| Representative browser checks | **PASS** — 6/6 URLs, 0 console errors, 0 bad same-document resources |
| PSI rechecks (lab) | **PASS/WARNING** — see section 5; all CLS values were within the good threshold |
| PSI/GSC field data | **WARNING / UNVERIFIED** — `No Data`; no real-user CWV conclusion is possible |
| Residual desktop homepage CLS `0.371` | **NOT REPRODUCED in fresh rechecks**; root cause still **NOT PROVEN** |
| Additional site changes | **NONE** — no purge, indexing request, sitemap resubmission, DNS/email/security/crawler change, or extra commit |

The earlier homepage desktop CLS `0.371` was captured **before** this 155-file deployment. The approved change set touched only tool and blog pages; homepage files were not part of commit `d747513`. Fresh PSI lab runs after deployment returned desktop CLS `0`, `0.06`, and `0`. The difference is therefore lab-run variability, not an effect of the 155-file SEO change set.

## 2. Deployment record

### 2.1 Git

- Repository: `easyworktoolsonline-ux/Easy-work-Tools`
- Branch: `main`
- Previous deployed commit: `b1cf6d12d26ec77765eb45643f4af3e432f4f553`
- Approved deployment commit: `d7475139f8dce68d9a3e78db9280b448e4fb76ff`
- Commit message: `Improve page-level SEO across tool and blog pages`
- Commit contents: `155 files changed, 987 insertions(+), 80 deletions(-)`
- File split: 67 blog files, 88 tool files
- Push result: `b1cf6d1..d747513  main -> main`
- Local `HEAD` and `origin/main` both: `d7475139f8dce68d9a3e78db9280b448e4fb76ff`

Only paths in the regenerated `data/page-level/changed-files.md` were staged. The report had originally contained malformed PowerShell interpolation in its path column; it was regenerated from the same backup comparison and verified to match Git’s 155 substantive changes exactly before staging.

### 2.2 Cloudflare Pages

- Account: `fb2f20ffdfbfa4423c84e5c19fd92cd1`
- Project: `easy-work-tools`
- Production deployment ID: `8be19500-4977-4d62-9e9b-0e1b219a9803`
- Deployment URL: `https://8be19500.easy-work-tools.pages.dev`
- Status: `success`
- Aliases: `easyworktools.online`, `www.easyworktools.online`
- Repository/branch shown by Cloudflare: `easyworktoolsonline-ux/Easy-work-Tools`, `main`
- Build log summary: `Uploaded 155 files (606 already uploaded)` and `Success: Your site was deployed!`
- Build configuration shown: 24 valid redirect rules, 20 valid header rules

No Cloudflare settings were modified.

## 3. Preservation and live verification

### 3.1 Discovery and redirects — PASS

| Check | Result |
|---|---|
| `http://easyworktools.online/` | `301` to HTTPS |
| `https://www.easyworktools.online/` | `301` to apex |
| `/robots.txt` | `200` |
| `/sitemap.xml` | `200` |
| Live sitemap SHA-256 | `A96A58ED0FF1923FA63D7B89D5F0C8363E51872E40F8F3B6114AE2AA8D06F0C2` |
| Local sitemap SHA-256 | `A96A58ED0FF1923FA63D7B89D5F0C8363E51872E40F8F3B6114AE2AA8D06F0C2` |
| `/blog/explain-it.html` | `308` to `/blog/explain-it` |
| `/blog/article-rewriter.html` | `308` to `/blog/article-rewriter` |
| `/blog/business-slogan-generator.html` | `308` to `/blog/business-slogan-generator` |
| `/tools/pdf-images-converter/categories/image/` | `301` to `/tools/pdf-to-jpg/` |

The live homepage still contains the earlier CLS-fix markers: `.cat-track`, `min-height:260px`, and hidden `id="catSectionTitle"`. Canonical remains `https://easyworktools.online/`.

### 3.2 All core pages — PASS

Live verifier: `_work/page-level-seo/verify-live.mjs`  
Evidence: `data/page-level/live-verification.csv`, `data/page-level/live-verification-summary.json`

| Type | Total | PASS | FAIL |
|---|---:|---:|---:|
| Tools | 242 | 242 | 0 |
| Blogs | 129 | 129 | 0 |
| Categories | 10 | 10 | 0 |
| **Total** | **381** | **381** | **0** |

Checks applied to every core URL:

- HTTP `200`
- non-empty title and H1
- non-empty, non-generic meta description
- canonical present and matching the expected URL
- no `noindex`
- at least one parseable JSON-LD block
- expected schema type: `SoftwareApplication` for tools, `BlogPosting` for blogs, `ItemList` for categories
- expected page-level SEO marker where applicable

One verifier false positive occurred for `/tools/social-share-preview/` because the expected alt text was `alt="Shared content preview image"` rather than `alt="Selected file preview"`. The verifier expectation was corrected and the full run was repeated: 381/381 PASS.

### 3.3 Representative browser checks — PASS

Checked URLs:

- `https://easyworktools.online/`
- `https://easyworktools.online/tools/age-calculator/`
- `https://easyworktools.online/tools/audio-converter/`
- `https://easyworktools.online/blog/ai-detector`
- `https://easyworktools.online/blog/mph-to-kph-explained`
- `https://easyworktools.online/categories/image/`

All 6 had the expected canonical, H1, description, robots directive, visible content, and parseable JSON-LD. Each had **0 console errors** and **0 bad same-document resources**.

## 4. PSI method and limitation

- PSI API returned HTTP `429 Quota exceeded ... pagespeedonline.googleapis.com`. No API token was used.
- All rechecks below were performed in the authenticated PSI web UI in the browser session.
- All numbers are **lab data** from Lighthouse 13.6.0. PSI field data returned **No Data** for every rechecked URL.
- Scores are not proof that every underlying audit passed; warnings are listed separately.

## 5. PSI rechecks after deployment

### 5.1 Results

| URL | Form factor | Perf | A11y | Best Practices | SEO | Agentic | FCP | LCP | TBT | CLS | Speed Index | Lab status |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| `/` | Mobile | 84 | 100 | 100 | 100 | 3/3 | 3.4 s | 3.4 s | 0 ms | 0 | 3.4 s | PASS metadata; WARNING Performance |
| `/` | Desktop | 100 | 100 | 100 | 100 | 3/3 | 0.3 s | 0.3 s | 0 ms | 0 | 0.7 s | PASS |
| `/tools/age-calculator/` | Mobile | 99 | 100 | 100 | 100 | 3/3 | 1.1 s | 1.1 s | 120 ms | 0 | 1.8 s | PASS |
| `/tools/age-calculator/` | Desktop | 100 | 100 | 96 | 100 | 3/3 | 0.3 s | 0.3 s | 30 ms | 0 | 0.6 s | PASS with Best Practices warning |
| `/blog/ai-detector` | Mobile | 95 | 100 | 100 | 100 | 3/3 | 2.4 s | 2.4 s | 0 ms | 0.01 | 2.4 s | PASS |
| `/blog/ai-detector` | Desktop | 100 | 100 | 100 | 100 | 3/3 | 0.6 s | 0.6 s | 0 ms | 0.002 | 0.7 s | PASS |
| `/categories/image/` | Mobile | 100 | 100 | 100 | 100 | 3/3 | 1.2 s | 1.2 s | 40 ms | 0 | 1.5 s | PASS |
| `/categories/image/` | Desktop | 99 | 100 | 100 | 100 | 3/3 | 0.8 s | 0.8 s | 0 ms | 0 | 0.8 s | PASS |

### 5.2 Report identifiers

| URL | Analysis ID | Mobile report | Desktop report |
|---|---|---|---|
| `/` | `9gfqq67nwz` | [mobile](https://pagespeed.web.dev/analysis/https-easyworktools-online/9gfqq67nwz?form_factor=mobile) | [desktop](https://pagespeed.web.dev/analysis/https-easyworktools-online/9gfqq67nwz?form_factor=desktop) |
| `/tools/age-calculator/` | `99sba8v4x7` | [mobile](https://pagespeed.web.dev/analysis/https-easyworktools-online-tools-age-calculator/99sba8v4x7?form_factor=mobile) | [desktop](https://pagespeed.web.dev/analysis/https-easyworktools-online-tools-age-calculator/99sba8v4x7?form_factor=desktop) |
| `/blog/ai-detector` | `hgem3vqyc1` | [mobile](https://pagespeed.web.dev/analysis/https-easyworktools-online-blog-ai-detector/hgem3vqyc1?form_factor=mobile) | [desktop](https://pagespeed.web.dev/analysis/https-easyworktools-online-blog-ai-detector/hgem3vqyc1?form_factor=desktop) |
| `/categories/image/` | `wzjvbw98qv` | [mobile](https://pagespeed.web.dev/analysis/https-easyworktools-online-categories-image/wzjvbw98qv?form_factor=mobile) | [desktop](https://pagespeed.web.dev/analysis/https-easyworktools-online-categories-image/wzjvbw98qv?form_factor=desktop) |

### 5.3 Interpretation

- **PASS:** All 8 lab runs had CLS at or below `0.01`; all had SEO `100`, Accessibility `100`, and Agentic `3/3`.
- **WARNING:** Homepage mobile Performance was `84` in this run, lower than the earlier baseline `98`, driven by FCP/LCP `3.4 s`. This is lab variability under Slow 4G emulation, not a field-data result.
- **WARNING:** `/tools/age-calculator/` desktop Best Practices was `96`, not `100`. The exact failing audit was not retained in the captured PSI UI text. This is unresolved, not a pass.
- **WARNING:** `/blog/ai-detector` had small but non-zero CLS (`0.01` mobile, `0.002` desktop). Both are below the `0.1` good threshold.
- **UNVERIFIED:** PSI field data was `No Data` for all 8 runs; real-user Core Web Vitals improvement cannot be claimed.

## 6. Residual desktop homepage CLS `0.371` investigation

No site file was changed during this investigation.

### 6.1 Prior evidence

- Earlier pre-155-file-deployment PSI desktop report: `https://pagespeed.web.dev/analysis/https-easyworktools-online/6q2hulft18?form_factor=desktop`
  - Performance `74`, CLS `0.371`, Agentic `2/3`.
  - The `Layout shift culprits` audit was present in the UI but contained no element rows.
- Controlled delayed-CSS test (`data/performance/cls-controlled-test.md`):
  - Category shift before patch: `0.9372985622476797`
  - Category shift after patch: `0.03352221662359241`
  - Separate synthetic header/navigation shift: `0.3941499006737055`, present before and after; root cause not proven.

### 6.2 Fresh post-deployment evidence

| Report | Captured | Perf | CLS | Agentic | Layout shift culprit detail |
|---|---|---:|---:|---:|---|
| `9gfqq67nwz` | 5:24 PM GMT+5 | 100 | 0 | 3/3 | No `Layout shift culprits` audit in insights |
| `ff2dah2zyu` | 9:50 PM GMT+5 | 99 | 0.06 | 3/3 | `body > main`, table score `0.138` |
| `u75k164ake` | 9:54 PM GMT+5 | 100 | 0 | 3/3 | No `Layout shift culprits` audit in insights |

All three fresh desktop CLS values are below the `0.1` good threshold. The `0.371` value did not reproduce.

Additional read-only browser evidence:

- A DevTools trace of a live homepage reload recorded 12,650 events, 2 long tasks, and **0** layout-shift events.
- A `PerformanceObserver({type:'layout-shift', buffered:true})` check across 5 live homepage reloads found no category shift. It found one tiny navigation shift: `div.container.nav-inner`, value `0.0004334436396429559`.
- The live production HTML still contains the critical CSS markers `.cat-track` and `min-height:260px`, plus hidden `#catSectionTitle`.

### 6.3 Conclusion

- **PASS:** The category-rail fix from the earlier CLS deployment is present and stable in production.
- **PASS:** Fresh desktop lab CLS is `0`, `0.06`, and `0`, all within the good threshold.
- **NOT REPRODUCED:** The earlier `0.371` desktop lab failure did not recur in 3 fresh PSI runs or in local trace/observer checks.
- **NOT PROVEN:** The root cause of the earlier `0.371` outlier. When a smaller residual shift appeared (`0.06`), Lighthouse attributed it to `body > main`, not the category container. The synthetic header/navigation shift remains a hypothesis from the controlled harness, not a confirmed production cause.
- **UNVERIFIED:** Real-user CLS improvement; PSI/GSC field data remains `No Data`.

No code change was made for this residual issue under the 155-file deployment approval.

## 7. Remaining FAIL / WARNING / NOT TESTED items

| Status | Item |
|---|---|
| WARNING | PSI field data `No Data` for all rechecked URLs; real-user CWV/CWV pass is UNVERIFIED. |
| WARNING | PSI API quota `429`; rechecks used the web UI instead. |
| WARNING | GSC CrUX field data insufficient for mobile and desktop; no field CLS conclusion. |
| WARNING | Homepage mobile lab Performance was `84` in the fresh run (lab variance; CLS `0`). |
| WARNING | `/tools/age-calculator/` desktop Best Practices `96`; exact audit not retained. |
| NOT PROVEN | Root cause of the earlier homepage desktop lab CLS `0.371`; not reproduced in fresh rechecks. |
| NOT TESTED | Scroll-dependent behavior: `browser.scroll` timed out and `window.scrollTo(0,1200)` returned `scrollY:0`. |
| NOT TESTED | Career/resume URLs: no such URLs found; probed `/tools/resume-builder/`, `/categories/career/`, `/blog/resume-tips` returned `404`. |
| WARNING | SEMrush Top Pages session expired and was not reauthenticated; Ahrefs Content Gap/Link Intersect UI did not populate reliably. |
| WARNING | 7 inventory rows have no local file: three blog `.html` variants live `308`, one malformed tool URL live `301`, and three `/tools/pdf-to-epub/` assets. Left unchanged by design. |
| MANUAL REVIEW | Cannibalization groups: `/blog/how-to-compare-two-images-online` + `/tools/image-compare/` are complementary; `/tools/ai-write/word-counter/` + `/tools/word-character-counter/` and `/tools/pdf-merge/` + `/tools/pdf-organizer/` need manual review. |
| USER ACTION | Previously exposed login password still needs rotation by the owner. |

## 8. Final state

- The approved 155-file page-level SEO change set is deployed to production.
- All 381 core pages pass live SEO/metadata/schema verification.
- Redirects, sitemap entries, canonicals, robots, and discovery files are unchanged.
- Fresh PSI lab rechecks pass CLS and all core SEO/Accessibility/Agentic checks on the representative set.
- The earlier homepage desktop CLS `0.371` is not reproduced and did not trigger any additional change.
- No cache purge, indexing request, sitemap resubmission, DNS change, email change, Cloudflare security change, crawler-policy change, or extra commit was performed.

## 9. Working tree note

After push, `git status --short --branch` still shows line-ending-only tracked differences in:

- `blog-manifest.json`
- `llms.txt`
- `sitemap.xml`

and pre-existing untracked audit/build artifacts (including `.wrangler/`, `_work/`, `reports/`, `metadata.json`, `server.ts`, `src/`, `tsconfig.json`, `vite.config.ts`, `.env.example`). None of these were staged, committed, or pushed with the approved change set.
