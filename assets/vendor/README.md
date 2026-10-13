# Vendored third-party libraries

These files are byte-for-byte copies of the exact pinned builds that
`tools/easy-image-resizer`, `tools/heic-to-jpg-converter`, `tools/jpg-pdf-converter`,
`tools/pdf-compressor`, `tools/pdf-images-converter`, `tools/pdf-merge-split`,
`tools/pdf-metadata-editor`, `tools/pdf-organizer` and `tools/pdf-watermark`
previously loaded from jsDelivr and cdnjs.

| File | Version | Upstream |
| --- | --- | --- |
| `heic2any.min.js` | 0.0.4 | https://github.com/catdad-experiments/heic2any |
| `jszip.min.js` | 3.10.1 | https://github.com/Stuk/jszip |
| `pdf-lib.min.js` | 1.17.1 | https://github.com/Hopding/pdf-lib |
| `pdf.min.js` | 3.11.174 (pdfjs-dist) | https://github.com/mozilla/pdf.js |
| `pdf.worker.min.js` | 3.11.174 (pdfjs-dist) | https://github.com/mozilla/pdf.js |

`lazy-libs.js` is **not** a vendored library — it is first-party site code, and
lives here only because it exists to load the files above.

## Why they are vendored

They were cross-origin `<script src>` tags in `<head>`, totalling roughly 320 KiB
of blocking transfer on the first load of those tool pages — the single largest
performance cost on the site. Serving them from this origin:

- removes a third-party DNS + TLS handshake from the critical path;
- brings them under this project's `Cache-Control` policy, so repeat visits are
  served from cache on Cloudflare's edge instead of re-fetched from a CDN;
- makes the pages work even if a third-party CDN is slow or blocked;
- means **no page on the site loads third-party code at all**, so no visitor IP is
  handed to an external host for a script.

`pdf.min.js` spawns `pdf.worker.min.js`; every `workerSrc` assignment points at
the relative `assets/vendor/` path so the worker is same-origin too.

## How they are loaded

Not with `<script src>`. None of these libraries is needed until the visitor has
chosen a file, so a plain tag would put 260 KiB — and for `heic2any`, 1.4 MB — on
the critical path of a page whose first paint is a form.

Instead each of the nine tools loads one script, `lazy-libs.js`, and asks for
libraries as it needs them:

```js
EwtLibs.preload('pdf-lib.min.js');   // on file selection or drop - start the fetch
await EwtLibs.load('pdf.min.js');    // in the handler that needs it
```

`lazy-libs.js` is the single definition of that behaviour for all nine tools, so
they cannot drift apart. It provides a per-source promise cache (a second
`load()` returns the first promise, so three files wait for one download), caches
a failure as a failure rather than retrying forever, and attaches a no-op
`catch` to every pending promise so an un-awaited preload can never surface as an
unhandled rejection.

Two things to keep in mind when touching a tool that uses it:

- `pdf.workerSrc` must be set **inside** the load callback. `pdfjsLib` does not
  exist at script-parse time, and setting it in the top-level IIFE is the classic
  way to reintroduce *"pdfjsLib is not defined"*.
- An `if(!window.PDFLib){ showStatus("library failed to load") }` guard is now
  wrong: with on-demand loading it fires on every first use. `await` the load and
  report a real failure instead.

Effect, measured on the heaviest of the nine: `/tools/pdf-organizer/` went from
**91 to 99** and from 12 requests / ~300 KiB to **9 requests / 92.5 KiB**.

## Updating a version

1. Download the new pinned build from the upstream URL.
2. Replace the file here, keeping the same filename.
3. Update the version in the table above.
4. Re-test the affected tools: upload a real file, confirm output, confirm
   "Download" produces a valid PDF, and confirm the library is **not** requested
   on page load.

## Licences

All five libraries are permissively licensed and permit redistribution:

- **heic2any** - MIT
- **JSZip** - MIT or GPL-3.0 (dual-licensed; the MIT terms apply here)
- **pdf-lib** - MIT
- **pdf.js / pdfjs-dist** - Apache-2.0

The upstream licence headers are preserved inside each minified file, as required
by those licences.
