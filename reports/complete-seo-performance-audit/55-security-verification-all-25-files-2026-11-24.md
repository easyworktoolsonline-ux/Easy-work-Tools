# 55 — Full read-only security verification of `public/assets/aistudio/` (2026-11-24)

**Scope:** EasyWorkTools.online only. Task T042 re-verification. No implementation, deployment, DNS/Cloudflare change, Git operation, upload, download of file contents, or copy of research material was performed.

## 1. Method and safety controls

- Local inventory: filenames, extensions, and byte sizes only. No file opened or read.
- Live probes: **HTTP HEAD only** (`Invoke-WebRequest -Method Head` with `-MaximumRedirection 0`; cross-check with `curl.exe -I -L -o NUL`). `curl` wrote to the Windows `NUL` device, not a file. **No response body was read, saved, published, or uploaded.** No Range request was needed because HEAD returned definitive statuses.
- Deployment configuration: local `_redirects`, `_headers`, `README.md`, `server.ts`, `.gitignore`, `package.json`, `vite.config.ts`, and the already-documented Cloudflare Pages dashboard evidence in `data/cloudflare/06-pages.md`.
- Reference scan: all local production-output files (excluding `reports/`, `public/`, `_work/`, `.wrangler/`, `node_modules/`) searched for the literal string `aistudio`.

## 2. Production asset-serving configuration (verified)

| Evidence | Finding |
|---|---|
| Cloudflare Pages dashboard (Report 06-pages §52–76) | Project `easy-work-tools`, production branch `main`, production domains `easyworktools.online`, `www.easyworktools.online`, `easy-work-tools.pages.dev`. **Build command blank, build output directory blank** — Pages publishes the repository root directly; there is no Vite `public/` copy step. |
| README.md:3,37 | Static website on Cloudflare Pages, deployed from the repository on push to `main`. |
| `_redirects` | No rule mentioning `aistudio`; no path rewrite that could expose the folder. |
| `_headers` | Broad `/assets/*` cache rule only; **no** aistudio rule and no access control. Robots/cache headers are not access control. |
| `server.ts` (local preview only, not production) | Maps a URL path to `ROOT_DIR` and serves an existing file; would serve `/public/assets/aistudio/...` if the folder were present locally. This is a preview-server behavior, not the live Cloudflare configuration. |
| `.gitignore` | `public/assets/aistudio/` explicitly ignored as “not part of the published site”. |
| Local `assets/aistudio/` | Does **not** exist. |
| Production-output reference scan | **1** file contains the string `aistudio`: `.gitignore` only. Zero references in HTML, sitemap, robots.txt, llms.txt, ai-catalog.json, manifests, CSS or JS. |

**URL mapping conclusion:** the two plausible public paths for these local files are:

- **Path A:** `/assets/aistudio/<filename>` — would apply only if a build copied `public/` into the published root (no such build is configured).
- **Path B:** `/public/assets/aistudio/<filename>` — the path implied by the actual root-publish deployment.

Both families were tested. No other path is suggested by any config or redirect file.

## 3. Exact inventory and per-file HEAD results

All 25 files are directly under `public/assets/aistudio/`; total **15,192,848 bytes**; extensions: 14 CSV, 6 PDF, 3 PNG, 2 ZIP. All filenames are ASCII and require **no percent-encoding** (`names needing encoding: 0`), so raw and encoded paths are identical.

| # | Filename | Ext | Bytes | Expected public path A | HEAD A | Expected public path B | HEAD B |
|---:|---|---|---:|---|---|---|---|
| 1 | `Chart_629cbc69.csv` | .csv | 975 | `/assets/aistudio/Chart_629cbc69.csv` | **404** | `/public/assets/aistudio/Chart_629cbc69.csv` | **404** |
| 2 | `Countries_8be2b041.csv` | .csv | 794 | `/assets/aistudio/Countries_8be2b041.csv` | **404** | `/public/assets/aistudio/Countries_8be2b041.csv` | **404** |
| 3 | `Critical_issues_8e06aefe.csv` | .csv | 301 | `/assets/aistudio/Critical_issues_8e06aefe.csv` | **404** | `/public/assets/aistudio/Critical_issues_8e06aefe.csv` | **404** |
| 4 | `Devices_0c688b31.csv` | .csv | 106 | `/assets/aistudio/Devices_0c688b31.csv` | **404** | `/public/assets/aistudio/Devices_0c688b31.csv` | **404** |
| 5 | `easyworktools.online-backlinks_matrix__1__e8b0b0a2.csv` | .csv | 964,769 | `/assets/aistudio/easyworktools.online-backlinks_matrix__1__e8b0b0a2.csv` | **404** | `/public/assets/aistudio/easyworktools.online-backlinks_matrix__1__e8b0b0a2.csv` | **404** |
| 6 | `easyworktools.online-backlinks_matrix_dfb8f4a5.csv` | .csv | 947 | `/assets/aistudio/easyworktools.online-backlinks_matrix_dfb8f4a5.csv` | **404** | `/public/assets/aistudio/easyworktools.online-backlinks_matrix_dfb8f4a5.csv` | **404** |
| 7 | `easyworktools.online-Coverage-2026-11-10_a66afc76.zip` | .zip | 1,027 | `/assets/aistudio/easyworktools.online-Coverage-2026-11-10_a66afc76.zip` | **404** | `/public/assets/aistudio/easyworktools.online-Coverage-2026-11-10_a66afc76.zip` | **404** |
| 8 | `easyworktools_82ff5076.pdf` | .pdf | 517,398 | `/assets/aistudio/easyworktools_82ff5076.pdf` | **404** | `/public/assets/aistudio/easyworktools_82ff5076.pdf` | **404** |
| 9 | `Easy-work-Tools-main_5ece33c0.zip` | .zip | 11,153,952 | `/assets/aistudio/Easy-work-Tools-main_5ece33c0.zip` | **404** | `/public/assets/aistudio/Easy-work-Tools-main_5ece33c0.zip` | **404** |
| 10 | `Filters_335d0931.csv` | .csv | 60 | `/assets/aistudio/Filters_335d0931.csv` | **404** | `/public/assets/aistudio/Filters_335d0931.csv` | **404** |
| 11 | `gap.keywords_2026-11-15T23_19_18.864Z_234f9665.csv` | .csv | 1,281,329 | `/assets/aistudio/gap.keywords_2026-11-15T23_19_18.864Z_234f9665.csv` | **404** | `/public/assets/aistudio/gap.keywords_2026-11-15T23_19_18.864Z_234f9665.csv` | **404** |
| 12 | `image_02be72c1.png` | .png | 62,035 | `/assets/aistudio/image_02be72c1.png` | **404** | `/public/assets/aistudio/image_02be72c1.png` | **404** |
| 13 | `image_13198679.png` | .png | 69,664 | `/assets/aistudio/image_13198679.png` | **404** | `/public/assets/aistudio/image_13198679.png` | **404** |
| 14 | `issue_overview_6c545dff.png` | .png | 60,893 | `/assets/aistudio/issue_overview_6c545dff.png` | **404** | `/public/assets/aistudio/issue_overview_6c545dff.png` | **404** |
| 15 | `Metadata_2f4ed190.csv` | .csv | 38 | `/assets/aistudio/Metadata_2f4ed190.csv` | **404** | `/public/assets/aistudio/Metadata_2f4ed190.csv` | **404** |
| 16 | `Non-critical_issues_3279eaf8.csv` | .csv | 30 | `/assets/aistudio/Non-critical_issues_3279eaf8.csv` | **404** | `/public/assets/aistudio/Non-critical_issues_3279eaf8.csv` | **404** |
| 17 | `overview-trend-2026-11-15T23_18_26Z_d0e5fc02.csv` | .csv | 4,881 | `/assets/aistudio/overview-trend-2026-11-15T23_18_26Z_d0e5fc02.csv` | **404** | `/public/assets/aistudio/overview-trend-2026-11-15T23_18_26Z_d0e5fc02.csv` | **404** |
| 18 | `Pages_7d99fa00.csv` | .csv | 3,676 | `/assets/aistudio/Pages_7d99fa00.csv` | **404** | `/public/assets/aistudio/Pages_7d99fa00.csv` | **404** |
| 19 | `Queries_d04a53e6.csv` | .csv | 2,358 | `/assets/aistudio/Queries_d04a53e6.csv` | **404** | `/public/assets/aistudio/Queries_d04a53e6.csv` | **404** |
| 20 | `report_33d930fa.pdf` | .pdf | 363,186 | `/assets/aistudio/report_33d930fa.pdf` | **404** | `/public/assets/aistudio/report_33d930fa.pdf` | **404** |
| 21 | `Search_appearance_eed9ceaf.csv` | .csv | 49 | `/assets/aistudio/Search_appearance_eed9ceaf.csv` | **404** | `/public/assets/aistudio/Search_appearance_eed9ceaf.csv` | **404** |
| 22 | `Semrush-Backlinks__Overview-https___easyworktools_online___Root_Domain_-15th_Nov_2026_16cd3ed0.pdf` | .pdf | 248,687 | `/assets/aistudio/Semrush-Backlinks__Overview-https___easyworktools_online___Root_Domain_-15th_Nov_2026_16cd3ed0.pdf` | **404** | `/public/assets/aistudio/Semrush-Backlinks__Overview-https___easyworktools_online___Root_Domain_-15th_Nov_2026_16cd3ed0.pdf` | **404** |
| 23 | `Semrush-Backlinks__Referring_Domains-https___easyworktools_online___Root_Domain_-15th_Nov_2026_a324e135.pdf` | .pdf | 238,101 | `/assets/aistudio/Semrush-Backlinks__Referring_Domains-https___easyworktools_online___Root_Domain_-15th_Nov_2026_a324e135.pdf` | **404** | `/public/assets/aistudio/Semrush-Backlinks__Referring_Domains-https___easyworktools_online___Root_Domain_-15th_Nov_2026_a324e135.pdf` | **404** |
| 24 | `Semrush-Organic_Research__Overview__Desktop_-easyworktools_online-15th_Nov_2026_86374f40.pdf` | .pdf | 167,141 | `/assets/aistudio/Semrush-Organic_Research__Overview__Desktop_-easyworktools_online-15th_Nov_2026_86374f40.pdf` | **404** | `/public/assets/aistudio/Semrush-Organic_Research__Overview__Desktop_-easyworktools_online-15th_Nov_2026_86374f40.pdf` | **404** |
| 25 | `Semrush-Organic_Research__Pages__Desktop_-easyworktools_online-15th_Nov_2026_59008d60.pdf` | .pdf | 50,451 | `/assets/aistudio/Semrush-Organic_Research__Pages__Desktop_-easyworktools_online-15th_Nov_2026_59008d60.pdf` | **404** | `/public/assets/aistudio/Semrush-Organic_Research__Pages__Desktop_-easyworktools_online-15th_Nov_2026_59008d60.pdf` | **404** |

**TOTAL: 50 requests, 50 confirmed HTTP 404, 0 non-404, 0 unverified, 0 errors** on `https://easyworktools.online`.

## 4. Controls, variations, and alternate domains

| Probe | Result | Interpretation |
|---|---|---|
| `/assets/styles.css` | **200** (`text/css`, correct cache header) | HEAD method and `/assets/...` mapping work; 404s above are genuine. |
| `/robots.txt` | **200** (`text/plain`, 3,259 B) | Root-file serving works. |
| `/README.md` | **410** (`text/plain`, `no-store`) | Edge rule intentionally suppresses this repo file; shows not every root file is exposed. |
| `/definitely-not-a-real-path-9f3c2a` | **404** (`text/html`, `no-store`) | Generic 404 has the same headers as all aistudio 404s. |
| `/assets/aistudio/` | **404** | Directory listing not exposed via path A. |
| `/public/assets/aistudio/` | **404** | Directory listing not exposed via path B. |
| `/assets/Aistudio/Chart_629cbc69.csv` (case variation) | **404** | Case-variant not exposed. |
| `/ASSETS/aistudio/Chart_629cbc69.csv` (case variation) | **404** | Case-variant not exposed. |
| `/assets/aistudio/Chart_629cbc69.csv?x=1` (query variation) | **404** | Query-string variant not exposed. |
| `www.easyworktools.online` and `easy-work-tools.pages.dev` | curl `-I -L`: **1 redirect to apex**, then **404** for sampled research paths; control `/assets/styles.css` → **200** | Both alternate production domains redirect to the apex domain, where the same 404s apply. |

Initial PowerShell probes to the two alternate domains returned tool-level errors (`Operation is not valid due to the current state of the object`, timeout) rather than HTTP statuses; these were **not** counted as verified statuses and were re-run with `curl -I` as above.

## 5. Confirmed vs not tested / not verifiable

**Confirmed by this run:**
- Exact HTTP 404 for all 25 filenames under both plausible path families on the apex domain (50/50).
- HTTP 404 for both directory paths and three case/query variants.
- HTTP 404 after one redirect for sampled files on the two alternate production domains; control 200.
- No site reference to `aistudio` outside `.gitignore`; root `assets/aistudio/` absent.
- No response body downloaded or saved; no Range request used.

**Not tested / not verifiable (limits of this evidence):**
- The remaining 24 files were **not individually** HEAD-tested on `www.easyworktools.online` or `easy-work-tools.pages.dev`; only one CSV and one ZIP sample were tested per alternate domain. Both domains redirect to the apex, but this is a sampled, not exhaustive, result.
- Any undocumented Cloudflare Page Rule, Worker, or custom path not present in `_redirects`/`_headers` cannot be exhaustively ruled out from outside the dashboard.
- Historical exposure (whether a file was ever served or crawled in the past) is **UNVERIFIED**; no logs or analytics were accessed.
- The live deployed build’s exact commit was reported as `838e2f6` in Report 06-pages but was **not re-confirmed** during this run; the dashboard was not accessed. The local folder is gitignored, so it should not be in the deployed tree, but this is inference rather than direct proof.
- ZIP **contents** were not re-extracted or read; Report 49’s entry-name-only assessment stands and no private file content was accessed.

## 6. Conclusion and no-change decision

**No public exposure is confirmed for any of the 25 files under the tested paths.** All 50 exact file probes returned HTTP 404 with the site’s generic 404 headers, controls returned expected statuses, and no production file links to the folder. **No remediation was applied** because no exposure was found. The latent risk documented in Report 49 §1.4 remains: if the folder were ever committed or a build copied `public/` into the output, it would publish ~15 MB of research exports plus an 11 MB source archive. Preventative controls (keep ignored, never link, no deploy of `public/`) remain owner decisions and were not executed.

No file was changed by this verification. Git status is unchanged from the baseline recorded in Reports 52–54.
