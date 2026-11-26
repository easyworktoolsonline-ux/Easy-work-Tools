# Visual QA reproducibility note

Date: 2026-11-26

Scope: EasyWorkTools.online local working copy only. No live deployment, Cloudflare, DNS, or GlobeCareer.online changes were made.

## How to reproduce

1. Start the local static server from the repository root:

   ```powershell
   $env:PORT='8766'
   node _work\adsense-audit\static-server.mjs
   ```

2. Open `http://127.0.0.1:8766/`.

3. Set the theme explicitly in the browser console before each pass:

   ```js
   localStorage.setItem('ewt-theme', 'light') // or 'dark'
   location.reload()
   ```

4. For desktop checks, inspect:
   - `/`
   - `/tools/`
   - all ten `/categories/<slug>/` listings
   - `/blog/`
   - `/blog/ai-detector`

5. For 390px viewport checks, open the harness and read the iframe, not the harness page:

   ```text
   http://127.0.0.1:8766/_work/adsense-audit/qa-harness.html?src=%2F&w=390&h=844&theme=light
   ```

   The harness writes the chosen theme to `localStorage` before loading the iframe.

6. Verify computed `--cat-color` on `[data-cat]` elements against the ten-category mapping in `visual-qa-results.json`. Verify no horizontal overflow with `document.documentElement.scrollWidth <= innerWidth + 1`.

## Evidence

- `visual-qa-results.json` — compact machine-readable results for all requested views, both themes, desktop and 390px iframe.
- `homepage-light.png`, `all-tools-light.png`, `category-seo-dark.png`, `guides-light.png`, `guide-detail-dark.png`, `mobile-home-light.png`, `mobile-guide-dark.png` — viewport screenshots captured from the same local server.

## Limits

The live HTTPS browser route was unavailable (`ERR_TUNNEL_CONNECTION_FAILED`), and the paired `browse` extension was offline. The 390px results are viewport emulation in an iframe, not real-device testing. No claim of real-device mobile validation is made.
