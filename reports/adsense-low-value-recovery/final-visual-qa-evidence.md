# Final visual QA evidence — persistence check

**Date/time:** 2026-11-27 00:23:05 +05:00 (2026-11-26T19:23:22Z)
**Overall status:** PARTIAL

## Scope and source

- Workspace: `F:\easyworktools.online\Easy-work-Tools`
- Source under test: local working copy only, served from the repository root. No live deployment, Cloudflare, DNS, or `GlobeCareer.online` access was used.
- Baseline compared against: `reports/adsense-low-value-recovery/evidence/visual-qa-results.json`, `evidence/VISUAL-QA-README.md`, and `FINAL-ADSENSE-LOW-VALUE-RECOVERY-REPORT.md`.
- No tracked file was modified. `ads.txt` was not touched. No `npm run build` was run. No stage/commit/push was performed.
- The only file written by this pass is this report. No file was overwritten, so no backup was required.

## Exact commands and method

### Local static server

PowerShell, repository root, background shell:

```powershell
$env:PORT='8768'
node _work\adsense-audit\static-server.mjs
```

- Process reported: PID `14612`, serving `F:\easyworktools.online\Easy-work-Tools` on `http://127.0.0.1:8768`.
- Reachability check via code-mode `fetch('http://127.0.0.1:8768/')`: HTTP `200`, 261,711 bytes, title `EasyWorkTools.online — Free Online Tools, Guides & Resources`.

### Browser/tool attempts

In-app browser skill was loaded before use. The following code-mode calls were attempted:

```js
tools.browser.tabs.open({ url: 'http://127.0.0.1:8768/', focus: true })
tools.browse.status()
tools.browser.tabs.list({})
```

Results:

- `tools.browser`: `[browser.disconnected] No desktop browser is connected to this session. Open this session in the desktop app and wait for it to connect. Then call browser.tabs.list({}). Repeating browser actions while disconnected will not help.`
- `tools.browse.status()`: `connected:false`, `pairingState:"paired-offline"`, `nextStep:"The paired browser isn't connected right now: open it (the profile with browse) and check that the extension is turned on. It reconnects by itself."`
- Tab count: `0`. No tab could be focused, no page could be evaluated, and no screenshot could be captured.

### Static extraction that was possible

Because the browser was unavailable, source-level verification used code-mode `fetch()` against the local server plus regex extraction over the returned HTML/CSS. This verifies markup, counts, inline palette values, source CSS declarations, and CTA/link data. It does **not** verify rendered pixels, computed styles, live hover/focus behavior, or layout metrics.

Theme control was checked in source only: `assets/app.js` lines 56/62/75 read `localStorage['ewt-theme']`, set `document.documentElement.dataset.theme`, and persist the toggle; `assets/styles.css` applies `html[data-theme=dark]` rules. The harness at `_work/adsense-audit/qa-harness.html` supports `?src=%2F&w=390&h=844&theme=light|dark` and writes `ewt-theme` before loading the iframe, but it could not be opened without a browser.

## Category color mapping

Expected mapping taken from the baseline JSON and checked against current source:

| Category slug | Token / expected hex | Homepage major card `--c1` | Category hero `--c1` | Source mismatch |
|---|---|---|---|---|
| ai-write | `--cat-ai-write` / `#1D4ED8` | `#1D4ED8` | `#1D4ED8` | 0 |
| image | `--cat-image` / `#C2410C` | `#C2410C` | `#C2410C` | 0 |
| pdf | `--cat-pdf` / `#000000` | `#000000` | `#000000` | 0 |
| developer | `--cat-developer` / `#15803D` | `#15803D` | `#15803D` | 0 |
| seo | `--cat-seo` / `#DC2626` | `#DC2626` | `#DC2626` | 0 |
| text | `--cat-text` / `#7C3AED` | `#7C3AED` | `#7C3AED` | 0 |
| converter | `--cat-converter` / `#1493B3` | `#1493B3` | `#1493B3` | 0 |
| calculator | `--cat-calculator` / `#11D6B2` | `#11D6B2` | `#11D6B2` | 0 |
| video-audio | `--cat-video-audio` / `#6D28D9` | `#6D28D9` | `#6D28D9` | 0 |
| utility | `--cat-utility` / `#D61149` | `#D61149` | `#D61149` | 0 |

`assets/styles.css` still defines all ten `--cat-*` tokens and all ten `[data-cat=slug] { --cat-color: var(--cat-*) }` rules. Source-level palette mismatches across homepage major cards, ten listing heroes, 242 tool cards, five Recent Tools chips, 129 guide CTAs, and 387 guide suggestion cards: **0**. Rendered/computed color mismatch count: **DATA UNAVAILABLE**.

## Per-view results

Legend for status cells: `DONE` = source/markup check completed; `BLOCKED - WAITING FOR OWNER` = required browser action unavailable; `DATA UNAVAILABLE` = no measurement could be captured.

| View | Static/markup result | Status | Rendered/computed result | Status |
|---|---|---|---|---|
| Homepage `/` | `#recent`, `#tools`, `#featured`, `#catRail`, `#toolsGrid`, `#featuredFlow` all present; 10 major cards, 5 recent chips, 28 popular cards, 28 featured items | DONE | No computed styles/layout captured | BLOCKED - WAITING FOR OWNER |
| Recent Tools | `.recent-strip`, `#recentHeading`, `.recent-chips` present; 5 chips with `--rc` values `#1D4ED8`, `#C2410C`, `#C2410C`, `#000000`, `#7C3AED`; all in palette | DONE | Hover/focus and rendered color not observed | BLOCKED - WAITING FOR OWNER |
| Major category cards | 10 `.cat-card` elements, correct slug-to-`--c1` mapping, 0 mismatches | DONE | Rendered card colors/borders not observed | BLOCKED - WAITING FOR OWNER |
| Category: `ai-write` | 54 cards, all `data-cat="ai-write"`, hero `#1D4ED8` | DONE | Computed color not captured | BLOCKED - WAITING FOR OWNER |
| Category: `image` | 46 cards, all `data-cat="image"`, hero `#C2410C` | DONE | Computed color not captured | BLOCKED - WAITING FOR OWNER |
| Category: `pdf` | 37 cards, all `data-cat="pdf"`, hero `#000000` | DONE | Computed color not captured | BLOCKED - WAITING FOR OWNER |
| Category: `developer` | 19 cards, all `data-cat="developer"`, hero `#15803D` | DONE | Computed color not captured | BLOCKED - WAITING FOR OWNER |
| Category: `seo` | 14 cards, all `data-cat="seo"`, hero `#DC2626` | DONE | Computed color not captured | BLOCKED - WAITING FOR OWNER |
| Category: `text` | 12 cards, all `data-cat="text"`, hero `#7C3AED` | DONE | Computed color not captured | BLOCKED - WAITING FOR OWNER |
| Category: `converter` | 45 cards, all `data-cat="converter"`, hero `#1493B3` | DONE | Computed color not captured | BLOCKED - WAITING FOR OWNER |
| Category: `calculator` | 6 cards, all `data-cat="calculator"`, hero `#11D6B2` | DONE | Computed color not captured | BLOCKED - WAITING FOR OWNER |
| Category: `video-audio` | 5 cards, all `data-cat="video-audio"`, hero `#6D28D9` | DONE | Computed color not captured | BLOCKED - WAITING FOR OWNER |
| Category: `utility` | 4 cards, all `data-cat="utility"`, hero `#D61149` | DONE | Computed color not captured | BLOCKED - WAITING FOR OWNER |
| Most Popular Tools | `#toolsGrid` has 28 `.card` items spanning all 10 category slugs | DONE | Rendered grid/hover not observed | BLOCKED - WAITING FOR OWNER |
| All Tools `/tools/` | 242 `.card[data-cat]` items; 10 distinct category slugs; 0 unknown slugs | DONE | Rendered grid not observed | BLOCKED - WAITING FOR OWNER |
| Featured Tools | `#featuredFlow` has 28 `.cf-item` items spanning all 10 `data-cat-label` values | DONE | Coverflow rendering not observed | BLOCKED - WAITING FOR OWNER |
| Guides listing `/blog/` | 129 `.blog-card` items; nine-color light/dark `--card-accent` cycle still present in CSS | DONE | Rendered palette/title contrast not observed | BLOCKED - WAITING FOR OWNER |
| Guide detail pages | All 129 guide pages have exactly 1 `.article-tool-cta`, 1 `.related-block`, and 3 `.related-card[data-cat]` | DONE | Rendered CTA/cards not observed | BLOCKED - WAITING FOR OWNER |
| Recommendation cards | 387 cards total; all carry a valid category slug; 114 guides have all three cards in the CTA category, 15 guides intentionally mix related categories; 0 invalid/empty `data-cat` | DONE | Rendered card styling/hover not observed | BLOCKED - WAITING FOR OWNER |
| Light theme | Source paths for light styling present (`app.js` default/light, light CSS values) | DONE | Computed light colors not captured | BLOCKED - WAITING FOR OWNER |
| Dark theme | `html[data-theme=dark]` rules for cards, guide titles, CTA, and related cards still present | DONE | Computed dark colors not captured | BLOCKED - WAITING FOR OWNER |
| Mobile 390px | Harness file exists with `w=390&h=844`; responsive CSS rules present | DONE | No iframe evaluation; no `scrollWidth`/`innerWidth` measurement | BLOCKED - WAITING FOR OWNER |
| Hover/focus | CSS rules present for CTA, related cards, tool cards, theme toggle, tool tabs, and featured cards | DONE | No pointer/keyboard interaction possible | BLOCKED - WAITING FOR OWNER |
| Responsive typography/spacing | CSS values present (see below) | DONE | Computed metrics not captured | BLOCKED - WAITING FOR OWNER |

## Guides listing palette

Light `--card-accent` cycle on `.grid:has(>.blog-card)>.blog-card:nth-child(9n+1..9)` is preserved:

`#1D4ED8`, `#C2410C`, `#15803D`, `#DC2626`, `#7C3AED`, `#334155`, `#0E7490`, `#0D9488`, `#BE185D`.

Dark overrides are preserved:

`#60A5FA`, `#FB923C`, `#4ADE80`, `#F87171`, `#A78BFA`, `#CBD5E1`, `#22D3EE`, `#2DD4BF`, `#F472B6`.

Guide card titles: light `#0b1220`; dark `#f8fafc`. Article H1: light `#0b1220`; dark `#f8fafc`. Related-card H3: light `var(--related-ink,var(--heading))`; dark `#f8fafc!important`. Contrast ratios were not computed because no browser evaluation was available.

## Guide CTA details

Representative page: `/blog/ai-detector`.

| Property | Source value in current working copy | Current computed value |
|---|---|---|
| Text | `Try <strong>AI Detector</strong>` + `&rarr;` → `Try AI Detector→` | DATA UNAVAILABLE |
| `href` | `../tools/ai-write/ai-detector/` | DATA UNAVAILABLE |
| `data-cat` | `ai-write` (maps to `#1D4ED8`) | DATA UNAVAILABLE |
| `background` | `color-mix(in srgb,var(--cat-color,#0f172a) 78%,#0f172a)`; dark: 82% mix | DATA UNAVAILABLE |
| `border` | `1px solid color-mix(in srgb,var(--cat-color,#0f172a) 42%,#ffffff)`; dark: 55% mix with `#334155` | DATA UNAVAILABLE |
| `color` | `#fff` | DATA UNAVAILABLE |
| `font-size` / `font-weight` | `16px` / `800` | DATA UNAVAILABLE |
| `min-height` | `52px` | DATA UNAVAILABLE |
| `padding` | `14px 26px` | DATA UNAVAILABLE |
| `border-radius` | `12px` | DATA UNAVAILABLE |
| Hover | `transform:translateY(-1px)`, 88% background mix, 60% border mix, elevated shadow | DATA UNAVAILABLE |
| Focus | `outline:3px solid color-mix(in srgb,var(--cat-color,#0f172a) 55%,#ffffff)`, `outline-offset:3px` | DATA UNAVAILABLE |

All-guide check: 129/129 guides have one CTA with a valid category slug, an `href` beginning `../tools/`, and a label exactly equal to the linked tool title in `window.__SITE_DATA__`. Example page `ai-detector` links to `AI Detector`; `how-to-compress-pdf-file-size` links to `PDF Organizer`; `how-to-create-seo-url-slugs` links to `Meta Tag Generator`.

The previous baseline JSON recorded computed CTA values (`16px`, `52px`, `14px 26px`, `12px`, category color `#1d4ed8`) on 2026-11-26. Those historical values are **not** presented here as newly re-measured evidence.

## Recommendation blocks / three suggestion cards

The current markup matches the baseline description: one `.related-block` containing three `.related-card` elements per guide. Checked on all 129 guide pages. Examples:

- `ai-detector`: `AI Detector`, `AI Humanizer`, `AI Rephraser` — all `data-cat="ai-write"`.
- `how-to-compress-pdf-file-size`: `PDF Organizer`, `PDF to JPG`, `JPG to PDF` — all `data-cat="pdf"`.
- `how-to-create-seo-url-slugs`: `Meta Tag Generator`, `Canonical & Meta Robots Checker`, `Hreflang Generator & Validator` — all `data-cat="seo"`.

Rendered category tint, borders, hover lift, and focus outline remain unverified because the browser was disconnected.

## Hover/focus and responsive spacing evidence (source only)

Present CSS rules include:

- `.article-tool-cta:hover`, `.article-tool-cta:focus-visible`, `.article-tool-cta:hover .article-tool-cta__go`.
- `.related-card:hover`, `html[data-theme=dark] .related-card:hover`, `body[data-tool-cat] .related-card:hover`.
- `.theme-toggle:focus-visible`, `.share-button:focus-visible`, `.tool-tab:focus-visible`, `#toolsGrid:focus-visible`, `.cf-card:focus-visible`, `.cf-nav:focus-visible`, `.recent-chip:focus-visible`.
- `html,body{overflow-x:clip}` and `.hero-word,.related-card,.card,.field-control,.result-panel,.panel,.result-box,textarea{max-width:100%!important}`.
- `.article-shell` padding `68px`; `<=560px` padding `52px` and width `calc(100% - 22px)`.
- Tool/blog grids: 4 columns, 2 columns at `<=900px`, 1 column at `<=560px`.
- Related grid: 1 column, 2 at `>=700px`, 3 at `>=1000px`; tool-page override: 1 column, 2 at `>=640px`, 3 at `>=820px`.
- CTA typography/spacing: `16px`, `800`, `min-height:52px`, `padding:14px 26px`, `border-radius:12px`.
- Related card typography: `h3` `14.5px` / tool-page override `15px`; `p` `12.5px` / tool-page override `13px`.

Actual hover transitions, focus rings, computed font sizes, computed gaps, and overflow behavior: **BLOCKED - WAITING FOR OWNER**.

## Failures, limitations, and coverage

| Item | Status | Detail |
|---|---|---|
| In-app browser capture | BLOCKED - WAITING FOR OWNER | Desktop browser disconnected; paired `browse` extension paired-offline. |
| Computed colors and layout metrics | DATA UNAVAILABLE | No `browser.evaluate` call could run. |
| Screenshots | DATA UNAVAILABLE | No tab could be focused; no screenshot captured. |
| 390px iframe harness | BLOCKED - WAITING FOR OWNER | Harness exists but could not be opened or evaluated. |
| Real-device mobile testing | DATA UNAVAILABLE | Not performed. No claim of real-device validation is made. |
| Live HTTPS route | DATA UNAVAILABLE | Not used; local static server only. |
| Static markup/color/CTA persistence | DONE | Counts, palette values, and CTA/link data confirmed from served HTML/CSS. |

No source-level defect was found in the checked markup and CSS. The only uncovered defect risk is that rendered/computed behavior could have changed while source stayed the same; that remains unverifiable in this session.

## Screenshots

No screenshots were saved. No `finalqa-*` files were created, so no existing screenshot was overwritten.

## Files written

- `reports/adsense-low-value-recovery/final-visual-qa-evidence.md` (this file; newly created).

## Addendum — rendered and local 390px QA (2026-11-27)

This addendum supersedes the earlier "unavailable" limitations for rendered local checks. It does not claim live iframe or real-device testing.

| Check | Observation | FinalStatus |
|---|---|---|
| Desktop light theme | Background `rgb(255,255,255)`; primary text `rgb(31,41,55)` | DONE |
| Desktop dark theme | Background `rgb(11,18,32)`; primary text `rgb(226,232,240)` | DONE |
| Horizontal overflow | No horizontal overflow in checked desktop and local 390px views | DONE |
| 390px header/footer | Hamburger header and visible footer rendered at local 390px width | DONE |
| Guide detail content | CTA, three related cards and FAQ JSON-LD present in local render | DONE |
| Contact form | Fields `requestType`, `toolName`, `email`, `details` rendered; 315px view showed fields and 163px submit control | DONE |
| Live iframe rendering | `X-Frame-Options: DENY` and report-only CSP `frame-ancestors 'none'` prevent iframe inspection | DATA UNAVAILABLE |
| Real-device testing | Not performed | DATA UNAVAILABLE |

No screenshot from the live HTTPS site is claimed. The addendum is based on rendered local/static browser checks and live header inspection only.
