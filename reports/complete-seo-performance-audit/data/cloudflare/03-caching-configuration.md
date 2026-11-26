# 3. Caching / Configuration — current state

## Dashboard state
`NOT VERIFIED (dashboard inaccessible)`. No Cloudflare caching/optimization settings page could be read. The following toggles therefore have **no verified dashboard value**: Brotli, Browser Cache TTL, Cache Rules, Page Rules, Always Online, Image Optimization (Polish), Rocket Loader, Auto Minify, WebSockets, HTTP/3, Opportunistic Encryption (see SSL file for observed redirect behaviour).

## Observable edge state (VERIFIED live probes, 2026-11-23 10:27–10:28 UTC)

### Compression
- `Content-Encoding: br` (Brotli) present on:
  - `/` HTML (`vary: accept-encoding`)
  - `/robots.txt` (`Content-Type: text/plain; charset=utf-8`)
  - `/sitemap.xml` (`application/xml; charset=utf-8`)
  - `/assets/styles.css`, `/assets/app.js`, `/favicon.ico`, `/ads.txt`
- Request header used: `Accept-Encoding: br, gzip`.
- Conclusion: **Brotli is active on the delivery path**. Whether the Cloudflare "Brotli" zone toggle, Pages itself, or origin `_headers` is responsible is not verifiable here. No config was changed.

### HTML caching
- `/` (and in historical probes `/tools/`, `/resources/`, `/blog/`, tool pages): `cf-cache-status: DYNAMIC`
- `Cache-Control: public, max-age=0, must-revalidate`
- No `Age` header on HTML. No `Expires` on HTML.
- Conclusion: HTML is **not** served from Cloudflare edge cache and browser cache is instructed to revalidate every time.

### Static asset caching
| URL | Status | Cache-Control | cf-cache-status | Age |
|---|---|---|---|---:|
| `/assets/styles.css` | 200 | `public, max-age=604800, stale-while-revalidate=86400` | HIT | 223437 s |
| `/assets/app.js` | 200 | `public, max-age=604800, stale-while-revalidate=86400` | HIT | 176724 s |
| `/favicon.ico` | 200 | `public, max-age=2592000, stale-while-revalidate=604800` | HIT | 151892 s |
| `/apple-touch-icon.png` | 200 | `public, max-age=2592000, stale-while-revalidate=604800` | MISS | — |
| `/robots.txt` | 200 | `public, max-age=14400, stale-while-revalidate=86400` | HIT | 102 s |
| `/sitemap.xml` | 200 | `public, max-age=3600, stale-while-revalidate=86400` | DYNAMIC | — |
| `/ads.txt` | 200 | `public, max-age=3600, stale-while-revalidate=86400` | DYNAMIC | — |
| `/.well-known/security.txt` | 200 | no Cache-Control observed | — | — |

- Observed browser TTLs: 604,800 s (7 d) for CSS/JS, 2,592,000 s (30 d) for icons/images, 14,400 s (4 h) for robots.txt, 3,600 s (1 h) for sitemap.xml and ads.txt. These are `Cache-Control` values from the served response, **not** the Cloudflare "Browser Cache TTL" zone setting (which applies when origin provides no Cache-Control).
- ETag present on static assets, e.g. `W/"5afc0ddcdc09d161a50c69fe66d386c7"` for styles.css and `W/"8b2ea673211c6ed8c53f6cdd4ce1200c"` for app.js.
- No `cf-cache-status: HIT` on HTML; no evidence of an HTML cache rule in the served response.

### Image Optimization / Polish
- `Content-Encoding: br` on `/favicon.ico` and none on `/apple-touch-icon.png` (PNG 8,703 bytes, served MISS).
- No `cf-image-resizing` or Polish-specific header observed. Dashboard state not verified; no claim about enabled/disabled.

### Rocket Loader / Auto Minify
- No `cf-beacon`/Rocket Loader injected script signature was checked in this investigation; dashboard state not verified.
- Historical report (line 111) states `app.js` is hand-minified and deliberately excluded from `build:assets` because the build extracts `iconSvg()` from its source text; adding a bundler/minifier would break that extraction. This is repository context, not a Cloudflare Auto Minify setting.

### Always Online
- `NOT VERIFIED (dashboard inaccessible)`. No origin-outage test was performed (would require changing origin behaviour). No conclusion.

## Suspected caching-related performance issue
The single most relevant observed state is HTML `DYNAMIC` + `max-age=0`; combined with the user-supplied TTFB 978 ms and historical field TTFB 453 ms at LCP P75, this motivates an HTML cache-rule review. Any change would need explicit approval, purge-on-deploy planning, and confirmation that HTML is not personalized. **No change was made.**

## Authenticated dashboard addendum — supersedes `NOT VERIFIED` above

The Cloudflare caching configuration page was read in the main browser:

- Caching Level: **Standard**.
- Browser Cache TTL: **4 hours**.
- No cache purge or invalidation was performed.

Rules pages were also read separately:

- Redirect Rules: **0 / 10** configured.
- Page Rules: **0 / 3** configured.
- No Cloudflare redirect rules or page rules were found.

The live `Cache-Control` values on static assets remain longer than the zone Browser Cache TTL because origin/Pages headers supply explicit values; the zone setting applies when no origin Cache-Control is present. No Brotli, Auto Minify, Rocket Loader, Always Online, or Polish toggle was changed.
