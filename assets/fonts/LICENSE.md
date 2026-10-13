# Self-hosted webfonts

`plus-jakarta-sans-latin.woff2` and `space-grotesk-latin.woff2` are the exact
files Chrome already downloaded from `fonts.gstatic.com` for this site
(Google Fonts `css2` API, `latin` subset, variable-font builds).

They are served from this origin instead of Google so that:

- the browser no longer has to fetch a third-party stylesheet before it can
  discover the font files (that chain was the single largest render-blocking
  cost on every page);
- no third-party DNS/TLS handshake sits in front of the LCP text;
- the font files are covered by this site's own `Cache-Control` policy in
  `_headers` rather than Google's.

Rendering is unchanged: the same two woff2 binaries, the same discrete
`font-weight` declarations (400/500/600/700/800 and 500/700) that
`fonts.googleapis.com` used to emit, and the same `latin` unicode-range.

Only the `latin` subset is included. Every page of the site was scanned and
contains no character outside Google's `latin` unicode-range, so the
`latin-ext`, `vietnamese` and `cyrillic*` subsets that Google also published
were never downloaded and are not needed.

## Licence

Both families are licensed under the **SIL Open Font License, Version 1.1**
(<https://scripts.sil.org/OFL>), which explicitly permits redistribution as
part of a web page. Copyrights:

- Plus Jakarta Sans - Copyright 2020 The Plus Jakarta Sans Project Authors
  (<https://github.com/tokotype/PlusJakartaSans>)
- Space Grotesk - Copyright 2020 The Space Grotesk Project Authors
  (<https://github.com/floriankarsten/space-grotesk>)

Re-download / update a file by requesting the same family from the Google Fonts
CSS API and keeping the `latin` `woff2` URL; keep the `font-weight` values in
`assets/styles.css` (and the inline `<style>` blocks in `tools/*/index.html`)
in sync with the new file's variable-font axis range.
