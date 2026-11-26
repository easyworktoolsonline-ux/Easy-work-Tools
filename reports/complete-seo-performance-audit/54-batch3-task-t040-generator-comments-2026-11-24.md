# 54 — Batch 3, task T040: correct stale generator comments (2026-11-24)

**Status:** COMPLETE and verified. Comment-only source change; no generated output altered.

## Checkpoint and rollback

- Additional file-level checkpoint created before this edit: `C:\Users\ahmad\AppData\Local\Temp\opencode\ewt-generator-checkpoint-20261124-T040`
  - `scripts\build-indexes.mjs` — pre-edit SHA-256 `9D5F9E4030A2E4378E36B336440376F642C2D8BE7E1A195E6506C5AA75B08538` (T037 state)
  - `metadata.json` — SHA-256 `F91A12DABF2AD95F06B67965EC44F909E9456EE3719E22173C100386BC20D391` (T039 state)
  - Both copies hash-verified; `checkpoint-info.txt` records time and baseline git status.

## Exact changed files (live project)

1. `F:\easyworktools.online\Easy-work-Tools\scripts\build-indexes.mjs` — two comment blocks only.

No other live-project file was edited. No report other than this file was added.

## Verified falsehoods before the edit

| Stale claim | Location (pre-edit) | Verified reality |
|---|---|---|
| `llms.txt & ai-catalog.json are in robots.txt` | `build-indexes.mjs:1234` | `robots.txt` contains 0 occurrences of `llms.txt` and 0 of `ai-catalog.json`; it only declares `Sitemap: .../sitemap.xml` and `Disallow: /api/` |
| `llms.txt` is `linked from robots.txt, listed in the sitemap` | `build-indexes.mjs:1362-1363` | `sitemap.xml` contains 0 occurrences of `llms.txt` and 0 of `ai-catalog.json` |

## The change (comments only)

```diff
-// Clean, valid sitemap URLs (HTML pages only; llms.txt & ai-catalog.json are in robots.txt).
+// Clean, valid sitemap URLs (HTML pages only). llms.txt and ai-catalog.json
+// are not listed here and are not referenced from robots.txt.
```

```diff
- * the site had 128 and 121. It is linked from robots.txt, listed in the
- * sitemap and read by AI agents, so a wrong count there is a real
- * inaccuracy rather than a cosmetic one.
+ * the site had 128 and 121. AI agents read this file, so a wrong count
+ * there is a real inaccuracy rather than a cosmetic one. It is not
+ * currently referenced from robots.txt or listed in sitemap.xml.
```

The historical drift note ("74 tools, 67 guides" vs "128 and 121") is retained as history, not presented as current counts. No code statement, constant, or string was changed.

## Test results (verified)

| Check | Result |
|---|---|
| `node --check scripts/build-indexes.mjs` | PASS (exit 0) |
| Line diff vs pre-T040 file | Exactly 8 changed lines (3 old comment lines → 5 new comment lines); every changed line begins with `//` or ` *` |
| Remaining stale-claim regex matches in generator (`are in robots.txt`, `linked from robots.txt`, `listed in the sitemap`) | 0 |
| Fresh isolated copy build with final script | Exit 0; `Indexed 242 tools and 129 blog posts`; both JSON outputs written |
| Files compared against verified T037-state snapshot | 961 |
| Differences | **2 only** — `metadata.json` (T039 edit) and `scripts\build-indexes.mjs` (T040 comments) |
| Generated outputs differing (all category HTML, all tool/blog HTML, sitemap.xml, llms.txt, ai-catalog.json, manifests) | **0 of 959** |
| Git status | baseline 13 entries preserved; no new entry |

Final generator SHA-256: `6FFF038D701C41F124536D661A924FA62DEF5A9C1F92E57914D6197AD9F8CF59`.

No build was run in the live project. `npm run lint` was not used as evidence; it only type-checks `server.ts`.

## Remaining issues / limitations

- Live generated files still reflect old output; the T037 generator fix will take effect only on an authorized future build/deploy. No deployment performed.
- No change to `robots.txt` or `sitemap.xml` was made or recommended: the comments were simply corrected to match reality. Adding `llms.txt`/`ai-catalog.json` to either file would be a separate, owner-approved decision.
- `T041` visible breadcrumbs remains deferred pending separate risk review.
- Field Core Web Vitals remain UNVERIFIED; Report 47 checklist gaps remain `DATA UNAVAILABLE`.

## Updated task statuses

- `T040` DONE.
- Batch 3 complete: `T037` DONE, `T039` DONE, `T040` DONE, `T041` DEFERRED.
- `T042` (live exposure of `public/assets/aistudio/`) already satisfied by Report 49 §1 read-only HEAD verification.
- `T043` remains BLOCKED on owner decision; no indexing request made.
- All other statuses unchanged from Reports 48–53.
