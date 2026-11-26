# 11 — Testing and Validation

## 1. Tests completed

| Test | Method | Result |
|---|---|---|
| Full backup | Filesystem copy + manifests | 2,549 files / 195,300,666 bytes; excludes `node_modules` |
| Sitemap inventory | XML parse + SHA-256 | 392 unique URLs; 0 `<lastmod>`; live matched local hash |
| Live HTTP spot checks | curl/headers/body | Apex, www→apex, HTTP→HTTPS, robots, sitemap, tools, categories, blog, static, redirects, 404, `llms.txt`, `ai-catalog.json` all as expected |
| GSC authenticated read | Browser DOM extraction | 92 query rows, 60 page rows; no Request indexing action |
| Cloudflare dashboard read | Authenticated browser | Analytics, Web Analytics, Speed/RUM, caching, rules, SSL/TLS, Security, AI controls, Pages confirmed |
| SEMrush authenticated read | Browser UI transcription | Domain/organic gap/keyword magic/backlinks captured with limitations |
| Ahrefs authenticated read | Browser UI transcription | Overview, crawl stats, link profile, referring domains captured with limitations |
| Controlled CLS reproduction | Local 5 s CSS-delay harness | Category CLS 0.9373 → 0.0335 |
| Production CLS-fix state | Live computed style | `.cat-rail{min-height:0px}` — fix not deployed |
| Build | `npm.cmd run build` | exit 0 |
| Lint | `npm.cmd run lint` | exit 0 |
| Live browser + Lighthouse | 6 representative URLs | Accessibility 1, Best Practices 1, SEO 1; no failures |
| Console/resource check | Browser console + `PerformanceResourceTiming` | Two third-party ad errors on homepage only; no same-document 4xx/5xx resources |

## 2. Representative URLs tested

- `https://easyworktools.online/`
- `https://easyworktools.online/categories/image/`
- `https://easyworktools.online/tools/json-formatter/`
- `https://easyworktools.online/tools/mph-to-kph/`
- `https://easyworktools.online/blog/mph-to-kph-explained`
- `https://easyworktools.online/about`

All had self-canonicals, `index,follow`, one H1, valid viewport, no missing-alt images, and Lighthouse 1/1/1.

## 3. Failed or incomplete tests

| Test | Failure / limitation | Handling |
|---|---|---|
| Fresh PSI API | HTTP 429 | No new PSI score claimed; prior scores labelled historical |
| `browser.network.list` | `Expected JSON value` on tested pages | Used `PerformanceResourceTiming.responseStatus` fallback |
| SEMrush Domain Overview | `Something went wrong` after retry | Recorded limitation; other SEMrush data used |
| SEMrush Top Pages | Session expired; redirected to ToolsZen login | No credentials requested/used; no Top Pages rows claimed |
| SEMrush Site Audit / Backlink Audit | Not configured for domain | No configured audit findings claimed |
| Ahrefs Content Gap / Link Intersect | Competitor inputs did not populate | No verified rows claimed; SEMrush gap used instead |
| Cloudflare `/deployments` navigation | Timeout after 60 s | Project overview and build settings still read; no retry deployment |
| Cloudflare CLS numeric panel | Values not rendered in extractable text | User-supplied CLS retained as user-supplied; no dashboard transcription claimed |
| GSC CrUX | No mobile/desktop data in 90 days | No GSC field CWV claim |
| GSC CSV / rows-per-page UI | No CSV file; selector stuck at 10 | All rows extracted from DOM |

## 4. Residual observations

- Homepage third-party ad errors: `ep2.adtrafficquality.google` tunnel failure and `pagead2.googlesyndication.com` promise error. Recorded, not changed.
- Synthetic header/nav layout shift of 0.3941499006737055 appeared in both before and after CLS harness runs. It is separate from the reported category CLS and was not changed.
- Ahrefs referring-domain count conflict (184 vs 202) and cross-platform traffic conflicts are documented, not reconciled.

## 5. Test conclusion

The local patch is validated for build, lint, root-cause reproduction, and page-level SEO/accessibility. Field CWV validation is pending deployment. No test result is presented as proof of a production improvement that has not occurred.
