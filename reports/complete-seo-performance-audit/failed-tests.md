# Failed / Incomplete Tests

| # | Test | Error / limitation | Impact | Handling |
|---|---|---|---|---|
| F-01 | Fresh PageSpeed Insights API request | HTTP 429 quota limit | No new PSI score | No new PSI claim; prior scores labelled historical |
| F-02 | `browser.network.list` on EasyWorkTools pages | `Expected JSON value` | No full network-list detail | Used `PerformanceResourceTiming.responseStatus` fallback |
| F-03 | SEMrush Domain Overview | `Something went wrong` after retry | No domain-level trend/authority snapshot from that view | Other authenticated SEMrush views used |
| F-04 | SEMrush Top Pages | Session expired; redirected to ToolsZen login | No page-level SEMrush table | No credentials requested/used; GSC page data used instead |
| F-05 | SEMrush Site Audit | Not configured for domain | No configured crawl report | Limitation documented |
| F-06 | SEMrush Backlink Audit | Not configured for domain | No configured backlink audit | Limitation documented; other backlink views used |
| F-07 | Ahrefs Content Gap / Link Intersect | Competitor inputs did not populate reliably | No verified rows | SEMrush gap used instead |
| F-08 | Cloudflare `/deployments` navigation | `browser.navigate did not finish within 60 seconds` | No deployment list read | Project overview and build settings read; no retry deployment |
| F-09 | Cloudflare P75 CWV numeric panels | Values not rendered in extractable text | No dashboard CLS/LCP/INP transcription | User-supplied CLS retained as user-supplied |
| F-10 | GSC CrUX last 90 days | No mobile/desktop data | Cannot cross-verify field CWV in GSC | Cloudflare field data used |
| F-11 | GSC CSV download / rows-per-page selector | CSV produced no file; selector stuck at 10 | Could have limited sample | All 92 query and 60 page rows extracted from DOM |
| F-12 | GSC URL Inspection bulk actions | Not used by design | No indexation change | No Request indexing performed |

No failed test was hidden or converted into a success claim. None of these failures required a credential in chat, an export, or a site change.
