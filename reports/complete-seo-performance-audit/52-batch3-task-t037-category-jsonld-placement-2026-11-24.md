# 52 — Batch 3, task T037: category JSON-LD moved inside `<head>` (2026-11-24)

**Status:** COMPLETE and verified in isolated copies. No generated website file was written in the live project.

## Checkpoint and rollback

- Existing full backup re-verified before this batch: `C:\Users\ahmad\AppData\Local\Temp\opencode\ewt-full-backup-20261124-170654` (11,301 files, 384,127,654 bytes; manifest 1,011 lines; 12-file hash spot-check all matched).
- Additional file-level checkpoint: `C:\Users\ahmad\AppData\Local\Temp\opencode\ewt-generator-checkpoint-20261124-T037`
  - `scripts\build-indexes.mjs` — original SHA-256 `6FC7E382886DD46915B1E1E50E92BEBDFD76E2969E640790D6BD2E7C52300C8D` (84,420 bytes)
  - `metadata.json` — SHA-256 `A22BE5712D95280F7F95BC9F04076FD0D24CC134871AB1EE6A65030B34CF3A2A` (267 bytes)
  - `checkpoint-info.txt` — creation time `2026-11-24T12:45:33Z` plus baseline git status.
- Both checkpointed files matched their source hashes at creation.

## Exact changed files (live project)

1. `F:\easyworktools.online\Easy-work-Tools\scripts\build-indexes.mjs` — **one targeted edit only** (generator source).

No other live-project file was edited. `metadata.json` remains byte-identical. No category HTML, sitemap, `llms.txt`, `ai-catalog.json`, manifest, redirect, canonical, or configuration file was hand-edited or regenerated in the live project. No new report outside this one was added for this task.

## The change

Before (line ~541):

```js
const pageHead = head;

const foot = deepen(shellFoot).replace(/[^\n]*tool-filter\.js[^\n]*\n?/g, '');
const page = pageHead + '\n' + schema + '\n' + deepen(shellChrome) + body + '</main>' + foot;
```

After:

```js
// The tools-page schema was stripped above. Insert the category schema
// inside <head>: placing it after </head> leaves the script between
// </head> and <body>, which is invalid and lets the parser re-parent it.
// A function replacement keeps any '$' in the JSON-LD literal.
head = head.replace('</head>', () => schema + '\n</head>');
const pageHead = head;

const foot = deepen(shellFoot).replace(/[^\n]*tool-filter\.js[^\n]*\n?/g, '');
const page = pageHead + '\n' + deepen(shellChrome) + body + '</main>' + foot;
```

The function replacement form deliberately prevents `$`-sequences in the JSON-LD from being interpreted as replacement patterns. The tools-page schema is still removed first (existing line 531), so there is exactly one category schema per page.

## Validation method

Two isolated full copies were made from the pre-edit project (excluding `node_modules` and `.wrangler`): `C:\Users\ahmad\AppData\Local\Temp\opencode\ewt-t037-before` and `...\ewt-t037-after`. Both began with the identical original script hash. The edited script was copied only into the `after` copy. `node scripts/build-indexes.mjs` (the exact `npm run build` command) was run **in the copies**, never in the live project. Both exits were 0 with the same build output lines (10 category pages, 15/398 pages link-normalised, 242 tools and 129 posts indexed, `ai-catalog.json` and `llms.txt` written).

## Test results (verified)

| Check | Result |
|---|---|
| Files differing between before/after builds | **11**: 10 `categories/*/index.html` + `scripts/build-indexes.mjs`; 0 added, 0 removed |
| Non-category generated files changed (sitemap, llms.txt, ai-catalog.json, manifests, other 388 HTML) | **0** |
| Category pages with JSON-LD outside `<head>` before fix | 10 / 10 |
| Category pages with JSON-LD inside `<head>` after fix | 10 / 10 |
| `<body>` still after `</head>` on all pages | 10 / 10 |
| JSON-LD parses as valid JSON | 10 / 10 |
| JSON-LD content byte-identical to before (moved, not altered) | 10 / 10 |
| Canonical URL unchanged | 10 / 10 |
| `og:url` unchanged | 10 / 10 |
| `<title>` unchanged | 10 / 10 |
| Page structure identical after stripping the JSON-LD tag (whitespace-normalised) | 10 / 10 |
| `CollectionPage.url` equals canonical | 10 / 10 |
| `BreadcrumbList` still present in `@graph` | 10 / 10 |
| Live-project git status | baseline 13 entries preserved; only `M scripts/build-indexes.mjs` added |

Confirmed canonical set (unchanged): `/categories/ai-write/`, `calculator`, `converter`, `developer`, `image`, `pdf`, `seo`, `text`, `utility`, `video-audio`.

`npm run lint` was not used as evidence for HTML/schema correctness: it only type-checks `server.ts` and does not validate generated markup.

## Remaining issues / limitations

- **Generated category pages in the live project are still the old output.** The generator source is fixed, but the deployed/generated HTML will only change on the next authorized build/deploy. No build was run in the live project and no deployment was performed.
- `T041` visible breadcrumbs remains deliberately deferred (shared page chrome across ~393 pages needs separate risk review).
- Field Core Web Vitals remain UNVERIFIED; this change does not claim to fix CLS or ranking.
- The four known contrast deviations in the build output are pre-existing and unchanged.
- Report 47 checklist gaps remain `DATA UNAVAILABLE`.

## Updated task statuses

- `T037` DONE — verified in isolated copies; live generator source updated.
- `T039` now NEXT (stale `198+` tool count in `metadata.json`).
- `T040` PENDING (stale generator comments claiming `llms.txt`/`ai-catalog.json` are in `robots.txt`/sitemap).
- `T041` DEFERRED pending separate risk review.
- All other statuses unchanged from Reports 48–51.
