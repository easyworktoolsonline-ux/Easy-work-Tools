# EasyWorkTools.online

Static GitHub Pages utility website with automated tool/blog indexing and deployment.

## Add a new tool

Create a folder under `tools/`:

```text
tools/your-tool-slug/
├── index.html
└── tool.json
```

`tool.json` is optional, but recommended:

```json
{
  "title": "Your Tool Name",
  "description": "A clear, useful description of the tool.",
  "iconKey": "tool",
  "tags": ["keyword one", "keyword two"],
  "category": "Text"
}
```

`category` drives the homepage "Explore by Category" cards and is what makes a
tool appear under one of the nine headings.

`iconKey` must name a key that exists in `iconSvg()` inside `assets/app.js`.
**The build now fails loudly on an unknown key** rather than silently emitting a
generic tile. Prefer an existing key from the ones already there; if the tool
genuinely needs a new glyph, add a matching `if(key==='your-key')return …` branch
to `iconSvg()` using the same 48×48 viewBox and rounded-tile base, and give it a
colour no neighbouring tool already uses.

Then commit and push to `main`. The GitHub Actions workflow runs the build, regenerates the tool/blog manifests and sitemap, and deploys the site to GitHub Pages.

## Add an AI Write tool

The 54 tools under `tools/ai-write/` share one implementation, so adding a 55th
is a data change, not a page change.

1. Add `tools/ai-write/<slug>/tool.json` with `title`, `description`, `iconKey`,
   `tags` and `category: "AI Write"`.
2. Add a `<slug>` entry to the tool registry — `assets/ai-write-tools-1.js`,
   `-2.js` or `-3.js`. Each entry is:

   ```js
   'your-slug': {
     label: 'Your Tool',              // shown above the input
     action: 'Do the thing',          // the button label
     placeholder: 'Paste …',          // the textarea placeholder
     options: [                       // optional; rendered automatically
       { id: 'optLength', label: 'Length', type: 'select',
         values: ['Short', 'Long'] },
       { id: 'optTerm', label: 'Find what', type: 'text', placeholder: '…' }
     ],
     run: function (text, opts) {     // must return a non-empty string
       // opts is keyed by the option `id` above, minus the leading "opt"
       return 'RESULT\n======\n' + somethingUseful(text, opts);
     }
   }
   ```

   `run` may `throw new Error('…')` for bad input — the page runner catches it and
   shows the message in a toast, so a clear error is better than a silent one.
   It must never return an empty string; the runner treats that as a failure.

3. The option object is keyed by its full `id` in `opts` (so `id: 'optLength'` is
   read as `opts.optLength`). Reading both `opts.optLength` and `opts.length` is
   the safe habit.

`assets/ai-write-runner.js` owns everything else — option controls, validation,
the word counter, try/catch, toasts, copy, download, swap, clear and Ctrl+Enter —
so a new page needs no bespoke JavaScript.

## Add a blog post

Create `blog/your-post.html` with a normal HTML page and a useful meta
description. The build automatically includes it in the blog manifest and sitemap.

If the post has a visible FAQ, give it the matching `FAQPage` schema, with the
questions and answers **character-for-character what the page shows**. Schema
that does not match visible content is treated by Google as a manual action.
Generate the block from the visible text rather than typing it twice — that is the
only way it cannot drift.

## AdSense setup

This repository contains reserved ad placements and an `ads/head.html` placeholder. Do not invent or paste placeholder publisher IDs. After Google AdSense approves the site, copy the exact Google-provided code into the appropriate location and follow Google's current setup instructions.

If AdSense provides an `ads.txt` line, paste the exact line from your AdSense account into the root `ads.txt` file. The example in this repository is intentionally commented out and is not a valid publisher ID.

For users in the EEA, UK and Switzerland, configure Google's Privacy & Messaging / certified CMP requirements before serving personalized ads where applicable.

## Important launch checks

- Site is live on the custom domain and HTTPS works.
- Navigation and search work on desktop and mobile.
- Privacy Policy, Cookie Policy, Disclaimer, Terms and Contact pages are reachable.
- Contact email is correct: EasyWorkTools.online@gmail.com
- Tools contain original, useful functionality and explanatory content. The 54 AI
  Write tools must keep working end to end — they are deterministic browser
  utilities, so a stub that returns its input unchanged is a regression even
  though it looks finished.
- Any page with an AI-ish name must be honest about what it can actually do. The
  Humanizer, Detector and Translate tools state their real scope and limits on
  the page itself.
- Blog posts are original and genuinely useful; avoid scraped or thin content.
- Add the real AdSense publisher code only after Google provides it.
- Add the exact AdSense `ads.txt` publisher line after it is provided in the AdSense account.

## Build locally

```bash
npm install
npm run build
```

The build is designed to be repeatable: generated search data, `ai-catalog.json` and AdSense markers are removed/rebuilt cleanly on subsequent runs. **Running it twice produces no diff** — 439 files, 0 added, 0 removed, 0 changed. The only field that moves is the `updated` date inside `ai-catalog.json`, which is intentional.

The build indexes **128 tools** and **121 blog posts** and writes
`tools-manifest.json`, `blog-manifest.json`, `sitemap.xml` (261 URLs) and
`ai-catalog.json`.

### One build bug worth knowing about

`fillGrid()` in `scripts/build-indexes.mjs` finds a card grid's closing tag by
**counting div depth** from the opening tag. A lazy regex cannot do this: every
card is `<a><div class="card-top"><div>…</div></div></a>`, so `([\s\S]*?)(</div>)`
stops at the first *inner* `</div>`, replaces only the first card, and leaves the
previous render stranded outside the grid — and the next build appends another
set. If you change that function, re-check that a second `npm run build` produces
no diff.

## Design system

The Featured Tools and homepage category cards share their matching original
tool SVGs, except the Online Text Case Converter, which retains its Lucide icon
sourced via [Iconbuddy](https://iconbuddy.com/). Both sections render the icon
glyphs in pure white; the source SVG's colored tile backgrounds are removed or
converted to outlines as needed. Their tool-to-icon mapping is in
`scripts/featured-tool-icons.mjs`; keep the shared icon rendering in use so the
icons remain identical in both sections. See `assets/lucide-icons-LICENSE.txt`
for the Lucide icon license.

Tool-card grids and the Featured Tools showcase use a repeating palette of all
nine category colors for their icon tiles, with white SVG glyphs, throughout the
homepage, tool index and category pages. The homepage's All Tools tab shows 16
cards; its category tabs show every tool in the selected category, matching the
exact-category behavior of the filter on the dedicated Tools page. The View All
button links to the complete catalogue.

The dedicated Tools page pairs a centered global search with the nine category
filters. Selecting a category displays only tools in that category; All restores
the complete catalogue.

The shared navigation includes a persistent light/dark theme toggle and a share
button. The theme preference is saved in local storage; sharing uses the browser's
native share sheet when supported and otherwise attempts to copy the current
page URL. On desktop, navigation links come first, followed by the theme and
share buttons, with global search aligned at the far right.
Dark mode also styles the homepage statistics, category filters, and featured-tool
card footers to match the page background while preserving the category colors.

The site was originally delivered with heavy typography (logo `900`, nav `750`,
section headings `800`, kickers `850`), a **white** footer, and a text-only logo
lockup. A later pass changed all three; that pass has been reverted and the
original values are what ship. The rules below describe the current design, and
they exist mostly to record *why* a few things are easy to break.

### 1. Typeface and weights

Seven weights are in use — `400`, `700`, `750`, `800`, `850`, `900`, `950` — for
running text, headings, the logo, the kicker and the section heads. There is no
global weight normaliser; the weights are declared where they are needed.

**Never remove the Google Fonts `<link>`.** `assets/fonts/*.woff2` is a
**variable** font whose axis tops out at weight 800, so it covers 400–800 only.
The CDN link is what supplies 750, 850, 900 and 950, and the header logo renders
at 900. Self-hosting the remaining instances would be the improvement, and it
requires downloading them from Google once — that has not been done.

### 2. The footer is white on most pages, near-black on four

`.site-footer` is `background:#fff` with `#64748B` link text (4.76:1) on most
pages. Four tools — `pdf-images-converter`, `pdf-metadata-editor`, `pdf-organizer`
and `pdf-watermark` — deliberately use a near-black `#0F172A` footer, where the
same link colour is only 3.75:1, so those four pages use `#CBD5E1` for links and
`#94A3B8` for muted text instead.

**The footer rules exist in two places and both must be kept in sync**:
`assets/styles.css` (the pages that link it) and each self-contained tool page's
own inline `.site-footer` block. A new tool page is the easiest place to
silently reintroduce a low-contrast footer.

### 3. Responsive footer grid — source order is load-bearing

`assets/styles.css` re-states the footer's responsive rules **after** the
desktop rule:

```css
@media(max-width:1040px){.site-footer-top{grid-template-columns:repeat(3,minmax(0,1fr))}…}
@media(max-width:620px) {…repeat(2,minmax(0,1fr))…}
@media(max-width:420px) {…1fr…}
```

A media query adds no specificity, so **source order decides**. When the desktop
5-column rule was declared last, it won on every screen size: each column was
squeezed to 45 px on a phone, and the 214 px footer logo overflowed its cell and
covered the first "Home" link. Keep these three rules last. The self-contained
tool pages already carry the correct ordering in their own inline CSS — copy that
order when creating a new one.

### 4. One distinct icon per tool

`iconSvg(key)` in `assets/app.js` holds the key registry. Each of the 128 tools
maps to its own key via `iconKey` in its `tool.json`; blog cards use `blog`. The
build **fails** on an unknown key, so a missing branch fails the deploy rather
than shipping a generic tile.

### 5. Categories are generated, never hand-written

Three things are generated from **one** source of truth,
`scripts/categories.mjs`, and they are edited through the markers
`<!-- ewt:categories:start -->` / `<!-- ewt:categories:end -->`:

| Output | Where | What it is |
| --- | --- | --- |
| `cat-card` × 9 | `index.html` | the homepage carousel |
| `toolFilter` | `tools/index.html` | the category filter |
| `/categories/<slug>/` × 9 | written by the build | a landing page per category |

Each entry declares `slug`, `title`, `tagline`, `c1`, `c2`, `scrim`, `link`,
`iconKey`, `featured` and `subs`. **The tool counts are read from the manifest**,
never typed in — the hand-written section this replaced had drifted to "118+ free
online tools" on a site with 128.

**The homepage carousel is sorted by tool count, highest first.** The sort runs at
build time over the manifest, so the order follows the counts automatically.
`scripts/categories.mjs` itself keeps its declaration order, so the `/tools/`
filter chips, the "Other categories" lists, `llms.txt` and `sitemap.xml` are
unaffected. Equal counts keep declaration order, because `Array.prototype.sort` is
stable — two categories on 13 will not swap between builds.

**Never write to the generated markup.** Add a field to `scripts/categories.mjs`
and rebuild; the build overwrites whatever is between the markers.

#### The featured-tool strip is one fixed line

`featured: { title, url }` — **`title` is a short display label, `url` is the real
tool.** The two are deliberately different: the label has to share one line with
the fixed "Featured Tool :" label inside a card that is only ~199px wide at the
5-per-view breakpoint, which leaves about **80px** for the name. The tool's own
title is often twice that.

| shown | links to |
| --- | --- |
| `Image Resizer` | `/tools/easy-image-resizer/` |
| `JSON Tool` | `/tools/json-formatter/` |
| `Unit Conv` | `/tools/unit-converter/` |

Keep `title` to roughly 11–13 characters. `validateCategories()` does **not**
enforce this, so when you add a category, measure it: the strip is
`flex-wrap:nowrap` with a fixed `height:46px`, which means an over-long name is
clipped with an ellipsis rather than allowed to break the band.

#### Three colour values per category, and why

Each card shows white text on a vivid gradient, and the maths is unforgiving:

- `c1` / `c2` — the gradient. The **light** end of every vivid hue sits under
  white 13px text at 1.7–4.0:1, which fails WCAG AA.
- `scrim` — a black overlay on the card, **per category**, from 7.5% (the violet)
  to 39.5% (the green). One global value strong enough for the green turns the
  violet muddy, so the value travels with the colour.
- `link` — the featured-tool colour on the card's **white** foot strip. Neither
  `c1` nor `c2` works there: `c2` is the light end (1.7–4.0:1 on white) and `c1`
  fails for four of the nine. Each `link` is its hue darkened until it clears
  4.5:1 on white.

`assertCategoryContrast()` in `scripts/categories.mjs` checks all three and
**fails the build** if any would ship unreadable. Do not eyeball a new colour —
add it and let the build tell you.

Category landing pages display one continuous grid, and `/tools/` filters by
category only. The optional `subs` metadata in `scripts/categories.mjs` remains
an internal catalogue consistency check and is not rendered on the site.

`assets/app.js` re-renders `/tools/` and homepage grids at runtime to traffic-sort
them, so it **must** reproduce the `data-cat` attribute on every tool card
(`toolCardAttrs()`). If that attribute is missing, category filtering stops
matching after a runtime re-render.

## Performance architecture

A few decisions are load-bearing. Changing them without understanding the
reasoning will undo the improvements.

### Fonts are self-hosted on every page

`Plus Jakarta Sans` and `Space Grotesk` are the exact `woff2` files Chrome
downloaded from Google Fonts, stored in `assets/fonts/`. Every page — all 260 —
carries the same `@font-face` block and preload hints in its `<head>`, with
**absolute** `/assets/fonts/…` paths so they are correct at any directory depth
(the tool pages sit three levels down, the blog one, the homepage at the root).

Earlier only 74 tool pages had this block; the other 186 pages depended entirely
on the Google Fonts CDN, so a CDN timeout changed the typography on most of the
site. Self-hosting the 750/850/900/950 instances from Google is the remaining
step — see Design system §1 for why the CDN link cannot simply be dropped.

`font-display: optional` is deliberate: the LCP text is the hero `<h1>`, and a
late font swap repaints (and re-times) the largest contentful paint. The file is
preloaded from the same origin, so it is in cache inside the 100 ms block period
on a normal connection.

### Scripts

`assets/app.js` and `assets/feedback-config.js` are loaded with `defer`; the
build script emits `defer` too, so a rebuild does not regress this.

**No page loads third-party code.** The nine tools that need a library get it
from `assets/vendor/` and **fetch it on demand**, through one shared loader:

```html
<script src="../../assets/vendor/lazy-libs.js" defer></script>
```

```js
EwtLibs.preload('pdf-lib.min.js');        // on file selection - start the fetch
await EwtLibs.load('pdf.min.js');         // in the handler that needs it
pdfjsLib.GlobalWorkerOptions.workerSrc = EwtLibs.url('pdf.worker.min.js');
```

`assets/vendor/lazy-libs.js` is the single definition, so the nine tools cannot
drift apart. It guarantees three things that a hand-rolled loader gets wrong:

1. **per-source cache** — a second `load()` returns the first promise, so three
   files wait for one download;
2. **a failed fetch is cached as a failure** — the pending promise carries a
   no-op `catch`, so an un-awaited preload never becomes an unhandled rejection;
3. **preload and load are the same code path**, so a completed preload is not
   re-fetched.

Four rules when converting a tool to this pattern:

1. **Only reference a library inside a function or an event handler.** Nothing
   at the top level of the tool's script may touch `PDFLib`, `pdfjsLib`,
   `heic2any` or `JSZip`, because nothing is loaded yet when the script runs.
2. **Set `pdf.workerSrc` inside the load callback**, never at the top of the
   IIFE. That line is the single most common way to reintroduce
   *"pdfjsLib is not defined"*.
3. **Delete the old `if(!window.PDFLib){ showStatus("failed to load") }` guard.**
   It existed because the library was a plain `<script>` in `<head>`; with
   on-demand loading it fires on every first use and reports a failure that has
   not happened.
4. **Mark the handler `async`** if it uses `await`.

The two light tools (`easy-image-resizer`, `jpg-pdf-converter` for the image
side) do not need the library for their primary action, so they only preload and
let the existing promise chain run — no restructuring, no re-bracing.

See `assets/vendor/README.md` for the vendored list, licences and update
procedure.

The eight file-based tools' inline scripts are wrapped in a `DOMContentLoaded`
listener so they run after the deferred `lazy-libs.js`. Keep that wrapper.

### Caching and headers

`_headers` sets long-lived immutable-style caching for `assets/fonts/` and
`assets/vendor/` (30 days, with `stale-while-revalidate`), 7 days for the shared
CSS/JS, `no-store` for `/api/*`, and the security headers.

## Security

Baseline headers are enforced: `X-Content-Type-Options`, `X-Frame-Options`,
`Referrer-Policy`, `Permissions-Policy`, `Cross-Origin-Opener-Policy` and
HSTS.

`Content-Security-Policy` is set in **report-only** mode. The site ships a large
amount of inline `<script>`, inline `<style>` and several hundred inline event
handlers (`onclick=...`) across 265 pages, so an enforced policy would need
either `'unsafe-inline'` anyway or a nonce refactor of every page. Report-only
means the policy is live and observable in Cloudflare's CSP reports dashboard
without any risk of breaking a tool, a form or an ad slot.

The policy already allows everything the site needs: the two vendor origins are
still whitelisted, so it keeps working after the self-hosting change.

**To move to enforcing mode** (a real project, not a one-line flip):

1. Move every inline `<script>` and `<style>` into same-origin files, or adopt
   per-request nonces.
2. Replace the ~360 `onclick`/`oninput`/`onchange` attributes with
   `addEventListener` so `'unsafe-inline'` is no longer required in `script-src`.
3. Watch the Cloudflare CSP report dashboard until it is clean.
4. Rename `Content-Security-Policy-Report-Only` to `Content-Security-Policy`.

Adding `report-to`/`report-uri` to collect reports into Cloudflare's dashboard
requires the Pages dashboard toggle, not a header change.

HSTS is `max-age=31536000` **without** `includeSubDomains` and **without**
`preload`. Both should be confirmed against every subdomain before being turned
on: `preload` in particular is effectively irreversible and requires the domain
to be submitted to the browser preload list.

## Automatic traffic-based ordering

The site records page views on Cloudflare Pages and automatically sorts tools and
blog posts by total traffic. The homepage keeps **9 tools** and **6 blogs**, while
the full `/tools/` and `/blog/` pages use the same traffic order.

One-time Cloudflare setup is required because a static site needs persistent storage for global traffic counts:

1. In Cloudflare, open the Pages project connected to this GitHub repository.
2. Create a **D1 database** (any name is fine).
3. In the Pages project settings, add a D1 binding with variable name **`EWT_DB`** pointing to that database.
4. Run the included `schema.sql` once against that D1 database.
5. Redeploy the project.

After that, no manual traffic sorting is needed. Each page view is counted server-side, and the site fetches the totals automatically; higher-traffic tools/blogs move to the top.

If the D1 binding is temporarily unavailable, the site still works normally and simply falls back to its normal manifest order.

Note on degradation: `functions/api/track.js` answers
`200 {"ok":false,"skipped":"database not configured"}` when `EWT_DB` is absent or
the write fails (it only returns `400` for invalid input), so **no page logs a
failed request in the browser console** and Lighthouse Best Practices stays at
100 while the binding is missing. `/api/traffic` likewise returns an empty map,
which the client treats as "keep the manifest order". The moment the binding
exists, tracking starts working with no further code change.

## AI / agent readiness

- `llms.txt` — a plain-text index of the tools, the blog, the legal pages and
  how the tools work.
- `ai-catalog.json` — generated by `npm run build` from `tools-manifest.json`,
  `blog-manifest.json` and the JSON-LD actually present on each page, so it
  cannot drift from the site. Both files are listed in `sitemap.xml` and allowed
  in `robots.txt`, and linked from the homepage footer.

Current structured data across 265 pages — **688 JSON-LD blocks, 0 invalid**:

| Type | Count | Where |
| --- | --- | --- |
| `FAQPage` | 249 | every tool page and every blog post |
| `BreadcrumbList` | 180 | tool and post pages |
| `SoftwareApplication` | 126 | tool pages |
| `BlogPosting` | 121 | every blog post |
| `WebPage` / `CollectionPage` / `WebApplication` | 8 | index and section pages |
| `WebSite` / `Organization` / `AboutPage` / `ContactPage` | 4 | homepage and legal pages |

**Every `FAQPage` block is generated from the Q&A the reader can see.** All 249
pages, 970 questions, verified character-for-character against the rendered
text. Two answers describe HTML entity syntax and therefore nest one level
deeper than a plain character reference; those are the only cases that need a
double un-escape to compare, and they match.

Validate any new schema with a **script-data-aware** checker. A naive
`/<script type="application\/ld\+json">([\s\S]*?)<\/script>/` reports false
positives, because the HTML tokenizer ends a script block only on a *literal*
`</script` — a page that legitimately builds the string `'<script type="…">'` in
its own JavaScript will be miscounted. The site's own schema-markup generator is
exactly such a page.
