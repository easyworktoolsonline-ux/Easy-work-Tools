# 10 — Change Management and Preservation

## 1. Initial state and backup

| Item | Value |
|---|---|
| Repository | `F:\easyworktools.online\Easy-work-Tools` |
| Branch | `main` |
| Tracking | `main...origin/main` |
| HEAD | `838e2f6c99a261a421df06fcd53dffb97341b599` |
| Initial tracked modifications | 0 |
| Initial untracked entries | 96, including `.env.example`, `.wrangler/`, `_work/`, and an untracked Vite/React scaffold |
| Backup | `C:\Users\ahmad\AppData\Local\Temp\opencode\ewt-full-backup-20261123-152231` |
| Backup size | 2,549 files / 195,300,666 bytes |
| Backup exclusions | `node_modules` |
| Backup inclusions | `.git`, all tracked and untracked files |

All 96 untracked entries were preserved. No untracked file was deleted, moved, or overwritten to simplify the change set.

## 2. Intended production change

Only one tracked file has a content diff:

- `index.html` — 2 insertions, 1 deletion.
- Adds category carousel CSS to the existing `#ewtCriticalCss` inline block.
- Adds `.cat-rail{min-height:260px}` with responsive variants.
- Adds `.visually-hidden` and focus outlines.
- Adds hidden `<h2 id="catSectionTitle">Explore categories</h2>`.
- Keeps `assets/categories.css` async with `<noscript>` fallback.

Final working-file SHA-256: `7619EDE1A3002D844F8B0DA0C9B28E39040C56D30E7AE02C5B94BE4E4EFE9FBA`.
Backup-file SHA-256: `595E71C8400B2894ADEB5F5C2A6C0C9D96DD335B7D284448FF6E3F14C2091800`.

## 3. Stat-only line-ending noise

`blog-manifest.json`, `llms.txt`, and `sitemap.xml` appear modified in `git status --porcelain` because of LF/CRLF normalization warnings. `git diff --exit-code` returns 0 for these files; they contain no content change. A prior `npm.cmd run build` rewrote ~394 tracked files through line-ending normalization; that noise was reverted.

## 4. Untracked audit artifacts

The reports tree and `_work/cls-test/` are untracked audit artifacts. They are not part of the intended production deployment. The controlled CLS server is an audit-only helper with no production dependency.

## 5. Build and lint

- `npm.cmd run build`: exit 0.
- `npm.cmd run lint`: exit 0.
- Logs saved under `data/performance/`.

## 6. Actions deliberately not performed

- No commit.
- No push.
- No deployment or retry deployment.
- No cache purge or invalidation.
- No Cloudflare setting change (except the transparent AI Labyrinth switch observation documented in `07` and `08`).
- No DNS, DMARC, SSL, WAF, Turnstile, or redirect change.
- No sitemap submission/removal/resubmission.
- No indexing request.
- No canonical, slug, route, page, tool, article, or category deletion.
- No outreach, purchase, paid placement, disavow, or backlink-related irreversible change.
- No password, API token, secret key, or OTP stored in any file or report.

## 7. Rollback path

If deployment is approved and later needs rollback:

1. Restore `index.html` from the backup path above.
2. Redeploy the previous commit `838e2f6` through the Cloudflare Pages project `easy-work-tools`.
3. Purge cache only if explicitly approved as part of rollback.
4. Re-run the pre/post checks in `09-measurement-and-acceptance-plan.md`.

No rollback was performed.
