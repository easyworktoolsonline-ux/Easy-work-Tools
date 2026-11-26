# 22 — Production deployment verification

Date: 2026-11-23  
Scope: EasyWorkTools.online production only.  
Status: **PASS with residual WARNINGs**.

## 1. Deployment authorization and pre-checks

| Check | Status | Evidence |
|---|---|---|
| Correct repository | PASS | `easyworktoolsonline-ux/Easy-work-Tools` |
| Correct branch | PASS | `main` |
| Exact reviewed file | PASS | `index.html` |
| Expected SHA-256 | PASS | `7619EDE1A3002D844F8B0DA0C9B28E39040C56D30E7AE02C5B94BE4E4EFE9FBA` |
| Expected diff | PASS | `2 insertions(+), 1 deletion(-)` |
| No unexpected tracked changes in commit | PASS | Only `index.html` staged |
| Untracked files and reports preserved | PASS | Not added to commit |
| Pre-deployment backup intact | PASS | `C:\Users\ahmad\AppData\Local\Temp\opencode\ewt-full-backup-20261123-152231`; backup `index.html` SHA-256 `595E71C8400B2894ADEB5F5C2A6C0C9D96DD335B7D284448FF6E3F14C2091800` |

No unrelated deployment, DNS, email, redirect, security, cache, sitemap, indexing, or Cloudflare policy change was made.

## 2. Deployment result

| Item | Value |
|---|---|
| Local commit before push | `838e2f6` |
| Deployed commit | `b1cf6d12d26ec77765eb45643f4af3e432f4f553` (`b1cf6d1`) |
| Commit message | `Fix category CLS by inlining critical carousel CSS` |
| Push result | `838e2f6..b1cf6d1  main -> main` |
| Cloudflare Pages project | `easy-work-tools` |
| Deployment status | **PASS — production deployment succeeded** |
| Deployment ID | `35ad889e-71e6-452b-80ea-8ce3c2550b1d` |
| Deployment URL | `https://35ad889e.easy-work-tools.pages.dev` |
| Production domains | `easyworktools.online`, `www.easyworktools.online` |

Cloudflare Pages dashboard showed the new production deployment associated with commit `b1cf6d1`. The live homepage contained the reviewed critical CSS, so the production artifact is consistent with the reviewed change.

## 3. HTTPS and redirect behavior

| URL tested | Result | Status |
|---|---|---|
| `http://easyworktools.online/` | 301 → `https://easyworktools.online/` | PASS |
| `https://www.easyworktools.online/` | 301 → `https://easyworktools.online/` | PASS |
| `https://easyworktools.online/` | 200, page loaded | PASS |

No deployment error page was observed. Canonical remained `https://easyworktools.online/`.

## 4. Representative page checks

| URL | HTTP | Result |
|---|---:|---|
| `https://easyworktools.online/tools/mph-to-kph/` | 200 | PASS |
| `https://easyworktools.online/categories/image/` | 200 | PASS |
| `https://easyworktools.online/blog/mph-to-kph-explained` | 200 | PASS |
| `https://easyworktools.online/tools/webp-to-pdf/` | 200 | PASS |
| `https://easyworktools.online/robots.txt` | 200 | PASS |
| `https://easyworktools.online/sitemap.xml` | 200 | PASS |

Career/resume-related URLs were checked only after discovery attempts failed: `/tools/resume-builder/`, `/categories/career/`, and `/blog/resume-tips` returned 404. **Do not interpret these as broken internal links** until a source URL exists. No sitemap, tool-manifest, or blog-manifest URL containing `resume`, `career`, or `cv` was found. Status: **NOT TESTED / no such URLs found**.

## 5. Live fix verification

On `https://easyworktools.online/`:

- `.cat-rail` computed `min-height: 260px` — **PASS**
- `.cat-track` computed `display: flex` — **PASS**
- Hidden `<h2 id="catSectionTitle">Explore categories</h2>` present with class `visually-hidden` — **PASS**
- Inline `#ewtCriticalCss` contains `.cat-track` and `min-height:260px` — **PASS**
- Browser console errors: 0 — **PASS**
- Same-document 4xx/5xx resources: 0 — **PASS**
- Single-session navigation duration: 1,258 ms; `responseStart`: 600 ms — **INFORMATIONAL**, not field data.

The reviewed category-rail fix is live. This does **not** by itself prove a field CLS improvement; see report `26`.

## 6. Comparison with baseline

| Item | Before deployment | After deployment |
|---|---|---|
| Production commit | `838e2f6` | `b1cf6d1` |
| Category CSS in critical path | No | Yes |
| `.cat-rail` min-height before async CSS | `0px` in controlled test | `260px` live at inspection |
| Hidden category heading | No | Yes |
| Production deployment ID | previous deployment | `35ad889e-71e6-452b-80ea-8ce3c2550b1d` |

## 7. Residual issues and limits

- **WARNING:** PSI desktop lab CLS remains `0.371` on the homepage. It is not the category rail; the controlled CLS test observed a separate header/navigation shift in both before and after runs. Root cause is not yet proven.
- **WARNING:** PSI field data is `No Data`; real-user improvement cannot be confirmed from PSI.
- **WARNING:** Third-party ad scripts caused console errors in the earlier pre-deployment live session; the post-deployment homepage check had zero console errors. Keep as an observation.
- **NOT TESTED:** Browser screenshot capture was unavailable because the browser required a visible desktop tab. Textual DOM/HTTP evidence is retained in `data/performance/post-deployment-verification-evidence.md`.

## 8. Final status

**PASS**: reviewed `index.html` deployed to production; HTTPS/redirect behavior and representative pages verified; reviewed CSS live; no console errors or failed same-document resources on the final homepage check.  
**WARNING**: residual desktop lab CLS and absent field data require separate investigation.  
No new optimization was introduced in this deployment.
