# 12 — Risks and Constraints

| # | Risk / constraint | Impact | Mitigation / status |
|---|---|---|---|
| 1 | Patch is local only; production still shows `.cat-rail{min-height:0px}` | No field CLS improvement yet | Explicit deployment approval required; see `approval-required.md` |
| 2 | Field CLS could have other contributors (e.g., synthetic header shift 0.394) | Fix may not fully resolve poor CLS | Monitor field data post-deploy; do not speculate or change header without evidence |
| 3 | Fresh PSI unavailable (HTTP 429) | No current lab performance score | Use controlled CLS harness + Cloudflare RUM; no new PSI claim |
| 4 | GSC CrUX has no 90-day data | Cannot cross-verify CLS in Search Console | Use Cloudflare field data and post-deploy RUM |
| 5 | 291 “Discovered – currently not indexed” and 203 404s | Indexation quality risk | Classify URL-by-URL; no deletion/redirect change in this audit |
| 6 | 42.60% 4xx share in Cloudflare analytics | Possible broken paths/bot noise | Separate read-only investigation needed; no speculative rule change |
| 7 | HTML `DYNAMIC` / `max-age=0`, TTFB P75 978 ms | Possible tail-latency risk | HTML cache rule not enabled; needs approval and purge plan |
| 8 | Third-party SEO tools conflict with GSC | Misleading traffic expectations | GSC treated as first-party truth; estimates directional only |
| 9 | SEMrush session expired; Ahrefs gap inputs failed | Incomplete research coverage | Limitations documented; no credentials requested or stored |
| 10 | Cloudflare CLS numeric panel not extractable | Cannot independently transcribe user-supplied CLS | Labelled as user-supplied; dashboard existence confirmed |
| 11 | Untracked Vite/React scaffold and `_work/` reports | Could be accidentally committed/deployed | Preserved untouched; not part of intended production diff |
| 12 | Line-ending noise on 3 tracked files | Confusing `git status` | Verified zero content diff with `git diff --exit-code` |
| 13 | AI crawler spoofed UA results are not identity verification | Could mislead AI accessibility conclusions | Authenticated policy evidence used as controlling source |
| 14 | Cloudflare read-only inspection included one AI Labyrinth switch click | Transparency / change-control concern | Final state enabled, no Save, no other setting change observed; disclosed in `07`/`08` |
| 15 | Security Center `mfa_not_enabled` remains | Security task outside scope | Deliberately untouched |
| 16 | Turnstile Secret Key sensitivity | Credential leakage risk | Never retrieved, logged, or reported; site key is public |
| 17 | Owner-shared login credentials in chat | Credential exposure risk | Not repeated, stored, or written to any file; rotate after work |
| 18 | Deployment target must be correct | Wrong project/domain deployment risk | Cloudflare Pages project `easy-work-tools`, branch `main`, domains confirmed before any approval request |
| 19 | No indexing requests made | Indexation remains unchanged | Small justified set only after fixes and canonical checks, if approved |
| 20 | Preservation requirement | No page/tool/article deletion allowed | Only `index.html` CSS/heading change prepared; all URLs preserved |
