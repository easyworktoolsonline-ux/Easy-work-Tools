# 6. Cloudflare Pages — observations

## Dashboard state
`NOT VERIFIED (dashboard inaccessible)`. The Pages project list, project overview, Builds tab, Deployment tab and Settings tab could not be opened. The following requested values are therefore unavailable:
- authoritative confirmation of which Pages project serves `easyworktools.online`
- production branch name
- dashboard build command and build output directory (and whether they are overridden)
- environment variable **names** on the Pages project (values would be redacted regardless)
- latest deployment status/time and deployment ID/URL
- build errors/warnings and logs

## Local repository evidence (VERIFIED locally; not a dashboard value)
Working directory: `F:\easyworktools.online\Easy-work-Tools`
- `git status -sb`: `## main...origin/main`; local HEAD is on `main` tracking `origin/main`.
- `git log -6 --format='%H %cI %s'` (2026-11-23 ~15:30 PKT):
  | Commit | Commit time (local +05:00) | Subject |
  |---|---|---|
  | `838e2f6c99a261a421df06fcd53dffb97341b599` | 2026-11-21T20:17:59+05:00 | Replace OG image with approved brand reference |
  | `b51cf11b691a3d0c624a7fa28b55934e1c486b35` | 2026-11-21T18:51:29+05:00 | Optimize mobile PageSpeed performance and CSP |
  | `01260d750ef7015d327ccef3d3f78518e9a7aeb7` | 2026-11-21T16:31:59+05:00 | Complete unit converter expansion and typography footer fixes |
  | `3d12a30776facde52333a88547747301d191010b` | 2026-11-18T08:09:25+05:00 | feat(ui): center tool pages and refine video/audio recommendations |
  | `78b18a9726ffdb50e021fa5233ce80b961d50a40` | 2026-11-18T07:13:15+05:00 | Optimize Core Web Vitals config, ads.txt, CSP, robots and SEO metadata |
  | `bfb2cda439942b615ff668f7c308e2c52355ce9b` | 2026-11-17T07:03:37+05:00 | Fix stale tool listings, broken categories redirect, contrast, and cache headers |
- Local working tree has uncommitted modifications (`M blog-manifest.json`, `M categories/ai-write/index.html`) and untracked items including `.env.example`, `.wrangler/`, `metadata.json`, `reports/`, `server.ts`, `src/`, `tsconfig.json`, `vite.config.ts`. These were not touched.
- `git ls-remote origin HEAD refs/heads/main` failed: `Failed to connect to github.com:443`, so remote HEAD could not be confirmed from here.
- `package.json` scripts:
  - `build`: `node scripts/build-indexes.mjs`
  - `build:assets`: `node scripts/minify-assets.mjs`
  - `dev`/`start`: `tsx server.ts`
  - `lint`: `tsc --noEmit ...`
  This is the repository's declared build command; the Cloudflare Pages dashboard build command was not verified.
- No `wrangler.toml` found in the workspace. `.wrangler/` contains only local miniflare state/tmp bundles (no project config or secrets recorded).
- `.env.example` (names only; example placeholder values omitted): `GEMINI_API_KEY`, `APP_URL`. These are AI Studio example variables and are **not** confirmed to be configured on the Cloudflare Pages project. No Pages environment variable values were read or recorded.
- `metadata.json` name: `EasyWorkTools.online`.

## Historical deployment evidence (HISTORICAL — local docs)
- `DOCUMENTATION/FINAL-REPORT.md:9`: "Status: DEPLOYED on user approval. Commit `bfb2cda` was pushed to `main` and Cloudflare Pages published it."
- `DOCUMENTATION/CORE-WEB-VITALS-AND-SEO-OPTIMIZATION-REPORT.md:34`: commit `78b18a9` pushed and automatically deployed by Cloudflare Pages; live verification 2026-11-18.
- `DOCUMENTATION/CORE-WEB-VITALS-AND-SEO-OPTIMIZATION-REPORT.md:864`: no Cloudflare API token; deployment status could not be queried via API, only inferred from live content and git HEAD.
- `DOCUMENTATION/UI-ALIGNMENT-IMPLEMENTATION-REPORT.md:174`: "Cloudflare Pages deployment is driven by the pushed GitHub commit"; final live recheck 2026-11-21 confirmed new CSS on the default `/assets/styles.css` URL.
- No build errors/warnings were found in these documents for the listed deployments; this is not a current check of the dashboard deployment log.

## Live evidence consistent with a recent deployment (VERIFIED live probe)
- `/assets/styles.css` ETag `W/"5afc0ddcdc09d161a50c69fe66d386c7"`, `cf-cache-status: HIT`, `Age: 223437` (≈62 h) at 2026-11-23 10:27:57 UTC.
- `/assets/app.js` ETag `W/"8b2ea673211c6ed8c53f6cdd4ce1200c"`, HIT, `Age: 176724` (≈49 h).
- HTML served from Cloudflare (`Server: cloudflare`, `CF-RAY`), `cf-cache-status: DYNAMIC`.
- No deployment timestamp or commit ID is exposed in live headers, so exact latest deployment status/time remains unverified.

## Suspected deployment/crawlability issue (historical, unresolved)
- Historical report `FINAL-REPORT.md:87`/`CORE-WEB-VITALS...:264-268`: the edge `/robots.txt` is Cloudflare-managed and prepends its block to the repository file (3,493 B then, 3,544 B now). This is by design, not a defect; repository rules remain additive. Current live file confirmed (see `05-security.md`).

## Authenticated dashboard addendum — supersedes `NOT VERIFIED` above

The Cloudflare Pages project was confirmed in the main browser:

| Item | Value |
|---|---|
| Project | `easy-work-tools` |
| Git provider/repository | GitHub `easyworktoolsonline-ux/Easy-work-Tools` |
| Production branch | `main` |
| Automatic deployments | Enabled |
| Production domains | `easyworktools.online`, `www.easyworktools.online`, `easy-work-tools.pages.dev` |
| Current production commit | `838e2f6` — `Replace OG image with approved brand reference` |

The production commit matches local HEAD `838e2f6c99a261a421df06fcd53dffb97341b599`.

Build configuration observed in the UI:

- Build command: blank in UI.
- Build output directory: blank in UI.
- Build comments: enabled.
- Build cache: disabled.
- Watch paths: `*`.
- Build system: Version 3.
- Deploy hooks: none.
- Compatibility date: `2026-09-18`.

One navigation to the `/deployments` view timed out (`browser.navigate did not finish within 60 seconds`); the project overview and build settings were read successfully. **No deployment, retry deployment, or production rollout was performed.**
