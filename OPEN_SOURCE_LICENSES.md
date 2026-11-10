# Open-Source Licenses & Third-Party Compliance Registry

**Platform:** EasyWorkTools.online  
**Policy:** Commercial AdSense-compliant static web platform. Zero AGPL/GPL source code is copied or bundled into the frontend.

## 1. Integrated Client-Side Libraries (Vendored in `assets/vendor/`)
| Library | Repository URL | License | Files / Components Used | Modifications Made | Attribution & Redistribution | Commercial Use | Integration Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **pdf-lib** | https://github.com/Hopding/pdf-lib | **MIT** | `assets/vendor/pdf-lib.min.js` | Unmodified prebuilt UMD bundle | Retain MIT copyright notice in bundle | Permitted | Safe to integrate |
| **PDF.js** | https://github.com/mozilla/pdf.js | **Apache-2.0** | `assets/vendor/pdf.min.js`, `pdf.worker.min.js` | Unmodified prebuilt release | Apache-2.0 notice preserved in bundle | Permitted | Safe to integrate |
| **JSZip** | https://github.com/Stuk/jszip | **MIT or GPL-3.0 (Dual)** | `assets/vendor/jszip.min.js` | Unmodified; elected under MIT | Retain MIT license notice in bundle | Permitted under MIT | Safe to integrate |
| **heic2any** | https://github.com/alexcorvi/heic2any | **MIT** | `assets/vendor/heic2any.min.js` | Unmodified prebuilt bundle | Retain MIT copyright notice | Permitted | Safe to integrate |

## 2. Reference-Only Repositories (Zero Code Copied)
| Repository | URL | License | Usage Strategy | Commercial & Legal Notes | Integration Status |
| --- | --- | --- | --- | --- | --- |
| **Sejda SDK (`torakiki/sejda`)** | https://github.com/torakiki/sejda | **AGPL-3.0** (v2+) & Commercial PRO | **Reference-Only** | Studied `sejda-model`, `sejda-core`, `sejda-sambox`, and `sejda-image-writers` task parameters/workflows only. Zero Java code copied; all EasyWorkTools equivalents were written independently in client-side JS. | Reference-Only (Compliant) |
| **Native Web APIs** | W3C / WHATWG Standards | Royalty-Free Web Standards | Canvas 2D, Web Audio `OfflineAudioContext`, `MediaRecorder`, `DOMParser`, `SubtleCrypto`, `URL` | Standard browser APIs; no third-party licensing obligations. | Native Browser |

## 3. Compliance Summary
- **No AGPL/GPL Contamination:** No AGPL-3.0 or GPL-only code is distributed in the EasyWorkTools repository or client bundle.
- **No Commercial SDK Misuse:** Commercial-only features (server-side OCR, AES-256 PDF encryption/decryption, LibreOffice DOCX/XLSX layout conversion) are not faked and are explicitly documented as technical limitations in `PDF_SEJDA_COMPARISON_MATRIX.md` and `TOOL_INVENTORY_TRACKER.md`.
- **Original Content:** All tool descriptions, instructions, FAQs, and SEO metadata are written originally for EasyWorkTools.online.
