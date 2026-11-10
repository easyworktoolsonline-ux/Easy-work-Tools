# EasyWorkTools — 37-Tool Sejda PDF Comparison Matrix

**Website:** https://easyworktools.online/categories/pdf/  
**Reference:** https://www.sejda.com/  
**Verified PDF Tool Count:** 37 tools in `tools-manifest.json` and `/categories/pdf/` (0 duplicates, 0 uncategorized PDF directories).

## 1. Complete 37-Tool Comparison Matrix
| Tool | Existing URL | Sejda Reference | Sejda Workflow | Upload Experience | Settings | Processing | Output | EasyWorkTools Status | Required Work | Test Result | Final Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| GIF to PDF | /tools/gif-to-pdf/ | GIF to PDF | Upload GIF images, convert & merge into PDF | Multi-image dropzone | Page size, orientation, margin | Canvas + pdf-lib | Single .pdf | Existing | None — verified | Pass | Completed |
| HEIC to PDF | /tools/heic-to-pdf/ | HEIC to PDF | Upload iPhone HEIC photos, decode & merge into PDF | Multi-image dropzone | Page size, orientation, margin | heic2any + pdf-lib | Single .pdf | Existing | None — verified | Pass | Completed |
| JPG to PDF | /tools/jpg-to-pdf/ | JPG to PDF | Upload JPGs, set page size/margins, export PDF | Multi-image dropzone | Page size, orientation, margin | pdf-lib embedJpg | Single .pdf | Existing | None — verified | Pass | Completed |
| Add Images to PDF | /tools/pdf-add-images/ | Edit PDF (Add Images) | Upload PDF + images, position on pages | Dropzone + image picker | Position, scale, page selection | pdf-lib | Updated .pdf | Existing | None — verified | Pass | Completed |
| Add Text to PDF | /tools/pdf-add-text/ | Edit PDF (Add Text) | Upload PDF, place styled text boxes on pages | Dropzone + text controls | Font, size, color, coordinates | pdf-lib + pdf.js | Updated .pdf | Existing | None — verified | Pass | Completed |
| Annotate PDF | /tools/pdf-annotate/ | Annotate PDF | Upload PDF, draw highlights, notes, freehand | Dropzone + annotation bar | Highlight, pen, shapes, colors | pdf-lib + pdf.js | Annotated .pdf | Existing | None — verified | Pass | Completed |
| PDF Booklet Maker | /tools/pdf-booklet/ | N-Up / Booklet Maker | Upload PDF, impose 2-up saddle-stitch spreads | Dropzone + file info | A4/Letter/A3 sheet, gutter pt, center fold line | pdf-lib embedPage imposition | Imposed booklet .pdf | Newly Built | Built + SEO + centered layout | Pass | Completed |
| PDF Compressor | /tools/pdf-compressor/ | Compress PDF + Grayscale PDF | Upload PDF, choose compression level & grayscale ink-save | Dropzone + level toolbar | High/Medium/Low compression + Grayscale (Save Ink) | pdf.js + canvas + pdf-lib | Compressed .pdf + size stats | Upgraded | Added Grayscale (Save Ink) mode | Pass | Completed |
| Create PDF | /tools/pdf-create/ | Create PDF | Compose text/sections into a clean PDF document | Editor workspace | Title, body, fonts, page size | pdf-lib | Generated .pdf | Existing | None — verified | Pass | Completed |
| Crop PDF | /tools/pdf-crop/ | Crop PDF | Upload PDF, set margins in pt/mm/in, apply to pages | Dropzone + page thumbnails | Top/Right/Bottom/Left margins, unit, scope | pdf-lib setCropBox + pdf.js | Cropped .pdf | Existing | None — verified | Pass | Completed |
| Delete Pages from PDF | /tools/pdf-delete-pages/ | Delete Pages | Upload PDF, select pages to remove, export | Dropzone + page thumbnails | Click-to-select pages to delete | pdf-lib + pdf.js | Trimmed .pdf | Existing | None — verified | Pass | Completed |
| Edit PDF | /tools/pdf-edit/ | Edit PDF | Upload PDF, add text/shapes/images/whiteout on pages | Dropzone + canvas editor | Text, draw, shapes, whiteout, image, undo | pdf-lib + pdf.js | Edited .pdf | Existing | None — verified | Pass | Completed |
| Extract Images from PDF | /tools/pdf-extract-images/ | Extract Images from PDF | Upload PDF, extract embedded raster images | Dropzone + gallery | Individual download or ZIP | pdf.js operatorList + jszip | Images or .zip | Existing | None — verified | Pass | Completed |
| Extract Text from PDF | /tools/pdf-extract-text/ | Extract Text from PDF | Upload PDF, extract text per page | Dropzone + text output | Copy / download .txt | pdf.js getTextContent | .txt download | Existing | None — verified | Pass | Completed |
| PDF Flatten | /tools/pdf-flatten/ | Flatten PDF | Upload PDF, lock form fields or raster-flatten pages | Dropzone + file info | Form Fields Only (Vector) or Full Raster (150-300 DPI) | pdf-lib form.flatten + pdf.js | Flattened .pdf | Newly Built | Built + SEO + centered layout | Pass | Completed |
| Merge PDF | /tools/pdf-merge/ | Merge PDF | Upload multiple PDFs, reorder, merge into one | Multi-PDF dropzone + file list | Reorder, reverse, file removal | pdf-lib copyPages | Single merged .pdf | Existing | None — verified | Pass | Completed |
| PDF Metadata Editor | /tools/pdf-metadata-editor/ | Edit PDF Metadata | Upload PDF, edit Title/Author/Subject/Keywords | Dropzone + form fields | Title, Author, Subject, Keywords, Creator, Producer | pdf-lib metadata setters | Updated .pdf | Existing | None — verified | Pass | Completed |
| PDF Organizer | /tools/pdf-organizer/ | Organize PDF | Upload PDF, reorder/delete/extract page thumbnails | Dropzone + visual page grid | Reverse, select, delete, extract pages | pdf-lib + pdf.js | Reorganized .pdf | Existing | None — verified | Pass | Completed |
| PDF Overlay | /tools/pdf-overlay/ | Overlay PDF | Upload base + overlay PDF, stamp in FG/BG with opacity | Dual PDF dropzones | Foreground/Background, page mapping, opacity % | pdf-lib embedPage | Overlaid .pdf | Newly Built | Built + SEO + centered layout | Pass | Completed |
| Add Page Numbers to PDF | /tools/pdf-page-numbers/ | Page Numbers + Header/Footer + Bates | Upload PDF, configure position, format, Bates prefix | Dropzone + page preview | Position, format, Bates 000001, Prefix/Label, start, size, margin | pdf-lib + pdf.js live preview | Numbered .pdf | Upgraded | Added Bates Numbering & Prefix/Label | Pass | Completed |
| PDF Page Size Checker | /tools/pdf-page-size-checker/ | Resize / Page Size Inspector | Upload PDF, inspect exact pt/mm/in dimensions & standards | Dropzone + results table | Multi-unit dimensions, A4/Letter detection, CSV export | pdf-lib getSize/getRotation | On-screen table + .csv report | Newly Built | Built + SEO + centered layout | Pass | Completed |
| Rearrange PDF Pages | /tools/pdf-rearrange/ | Organize PDF (Reorder) | Upload PDF, drag/reorder pages visually | Dropzone + visual page grid | Drag/button reorder | pdf-lib + pdf.js | Reordered .pdf | Existing | None — verified | Pass | Completed |
| PDF Repair | /tools/pdf-repair/ | Repair PDF | Upload damaged PDF, rebuild xref or recover pages | Dropzone + mode select | Auto, Structural Rebuild, Deep Page Recovery | pdf-lib + pdf.js recovery | Repaired .pdf | Newly Built | Built + SEO + centered layout | Pass | Completed |
| Rotate PDF | /tools/pdf-rotate/ | Rotate PDF | Upload PDF, rotate individual or all pages 90/180 deg | Dropzone + page thumbnails | Rotate all/selected left or right | pdf-lib setRotation + pdf.js | Rotated .pdf | Existing | None — verified | Pass | Completed |
| Sign PDF | /tools/pdf-sign/ | Fill & Sign PDF | Upload PDF, draw/type signature & place on page | Dropzone + signature pad | Draw/Type signature, size, placement | pdf-lib | Signed .pdf | Existing | None — verified | Pass | Completed |
| Split PDF | /tools/pdf-split/ | Split PDF / Extract Pages | Upload PDF, select pages or ranges, split or extract | Dropzone + page thumbnails | Extract selected, split by range, select/clear all | pdf-lib + pdf.js + jszip | PDF or ZIP of PDFs | Existing | None — verified | Pass | Completed |
| Summarize PDF | /tools/pdf-summarize/ | Summarize PDF | Extract & summarize key sentences from PDF text | Dropzone + length select | Summary length, copy | pdf.js + extractive NLP | On-screen summary + copy | Existing | Browser extractive summary | Pass | Completed |
| PDF to EPUB | /tools/pdf-to-epub/ | PDF to EPUB | Extract PDF text/chapters into EPUB e-book | Dropzone + metadata | Title, author, chapter breaks | pdf.js + jszip EPUB | .epub e-book | Existing | Genuine .epub archive | Pass | Completed |
| PDF to JPG | /tools/pdf-to-jpg/ | PDF to JPG | Upload PDF, render pages as JPG images | Dropzone + quality/DPI | DPI, JPG quality, ZIP download | pdf.js + jszip | JPG or .zip | Existing | None — verified | Pass | Completed |
| PDF to PNG | /tools/pdf-to-png/ | PDF to PNG | Upload PDF, render pages as lossless PNGs | Dropzone + DPI | DPI, ZIP download | pdf.js + jszip | PNG or .zip | Existing | None — verified | Pass | Completed |
| PDF to PowerPoint | /tools/pdf-to-ppt/ | PDF to PowerPoint | Render/extract PDF pages into PPTX slides | Dropzone + slide options | Mode, slide size, DPI | pdf.js + jszip OOXML PPTX | .pptx presentation | Existing | Genuine OOXML .pptx | Pass | Completed |
| PDF to Text | /tools/pdf-to-text/ | PDF to Text | Upload PDF, extract selectable text | Dropzone + text output | Page separators, copy, .txt download | pdf.js getTextContent + jszip | Text preview + .txt | Existing | None — verified | Pass | Completed |
| PDF to TIFF | /tools/pdf-to-tiff/ | PDF to TIFF | Upload PDFs, render baseline/LZW/PackBits TIFF | Multi-PDF dropzone | 72-600 DPI, RGB/Gray/1-bit Mono, LZW/PackBits, multi-page or ZIP | pdf.js + custom TIFF 6.0 + jszip | Multi-page .tif or .zip | Upgraded | Full Sejda/PDF24 parity | Pass | Completed |
| PDF to Word | /tools/pdf-to-word/ | PDF to Word | Extract structured text/paragraphs into Word-compatible doc | Dropzone + options | Doc title, page breaks | pdf.js + jszip | Word-compatible output | Existing | Client-side text extraction | Pass | Completed |
| PDF Watermark & Branding | /tools/pdf-watermark/ | Watermark PDF | Upload PDF, add text/image watermark with opacity & size | PDF + image dropzones | Text/Image, color, opacity, size, position, pages | pdf-lib + pdf.js live preview | Watermarked .pdf | Existing | None — verified | Pass | Completed |
| PNG to PDF | /tools/png-to-pdf/ | PNG to PDF | Upload PNGs, set page size/margins, export PDF | Multi-image dropzone | Page size, orientation, margin | pdf-lib embedPng | Single .pdf | Existing | None — verified | Pass | Completed |
| WebP to PDF | /tools/webp-to-pdf/ | WebP to PDF | Upload WebP images, convert & merge into PDF | Multi-image dropzone | Page size, orientation, margin | Canvas + pdf-lib | Single .pdf | Existing | None — verified | Pass | Completed |

## 2. Sejda Features Technically Blocked on Static Cloudflare Pages
These Sejda features require server-side engines, cryptographic/licensed SDKs, or multi-20MB binary/OCR language packs not suited to a zero-backend static site, and are intentionally **not** faked:
1. **Protect PDF / Encrypt PDF (RC4/AES-256):** `pdf-lib` supports reading/ignoring encryption but does not implement PDF password encryption writing in pure JS without a dedicated C++/WASM crypto engine.
2. **Unlock PDF (Owner/User Password Removal):** Removing strong AES-256 encryption requires server/WASM decryption engines (e.g., `qpdf`).
3. **OCR PDF (Searchable Scanned PDF):** Requires `tesseract.js` + 15–40MB per-language `traineddata` downloads or server-side Tesseract/Cloud Vision.
4. **Word to PDF / Excel to PDF / Webpage URL to PDF:** Requires LibreOffice or headless Chromium on a server (blocked by browser CORS & layout engine limits).
5. **True Content-Stream Redaction & Existing Embedded-Font Text Editing:** Modifying arbitrary existing PDF glyph streams without reflow corruption requires server-side PDFBox/MuPDF engines.

## 3. Official Sejda Open-Source SDK (`torakiki/sejda`) Task & License Mapping
- **Repository:** `https://github.com/torakiki/sejda` (Modules inspected: `sejda-model`, `sejda-core`, `sejda-sambox`, `sejda-image-writers`, `sejda-conversion`, `sejda-tests`, `sejda-distribution`).
- **License Compliance:** `torakiki/sejda` v2+ is licensed under **AGPL-3.0**; commercial PRO features are separately licensed. Zero Sejda Java code was copied into EasyWorkTools. All EasyWorkTools implementations are clean, browser-native JavaScript written against MIT-compatible libraries (`pdf-lib`, `pdf.js`, `jszip`, `heic2any`).

| Sejda SDK Task / Parameter (`sejda-sambox` / `sejda-model`) | License / Tier | EasyWorkTools Tool & Browser Implementation | Status |
| --- | --- | --- | --- |
| `MergeTask` (`MergeParameters`) | AGPL-3.0 Ref | `/tools/pdf-merge/` (`pdf-lib` `copyPages`) | Completed |
| `AlternateMixTask` (`AlternateMixMultipleInputParameters`) | AGPL-3.0 Ref | `/tools/pdf-merge/` (Alternate & Mix + Reverse Even Files) | Completed |
| `SplitByPageNumbersTask` / `SimpleSplitParameters` / `ExtractPagesTask` | AGPL-3.0 Ref | `/tools/pdf-split/` (`pdf-lib` + `pdf.js` + `jszip`) | Completed |
| `SplitByEveryXPagesParameters` / `SplitBySizeTask` | AGPL-3.0 Ref | `/tools/pdf-split/` (Every N pages + Max Size MB ZIP) | Completed |
| `RotateTask` (`RotateParameters`) | AGPL-3.0 Ref | `/tools/pdf-rotate/` (`pdf-lib` `setRotation`) | Completed |
| `SetMetadataTask` (`SetMetadataParameters`) | AGPL-3.0 Ref | `/tools/pdf-metadata-editor/` (`pdf-lib` metadata API) | Completed |
| `PdfToSingleTiffParameters` / `PdfToMultipleTiffParameters` (`sejda-image-writers`) | AGPL-3.0 Ref | `/tools/pdf-to-tiff/` (`pdf.js` + TIFF 6.0 LZW/PackBits + `jszip`) | Completed |
| `PdfToJpegParameters` / `PdfToPngParameters` | AGPL-3.0 Ref | `/tools/pdf-to-jpg/`, `/tools/pdf-to-png/` (`pdf.js` + `jszip`) | Completed |
| `SplitByOutlineLevelTask` / `ExtractByOutlineTask` | AGPL-3.0 Ref | Partial via `/tools/pdf-split/` range/selection (bookmark-tree split requires Java/SAMBox outline parser) | Documented |
| `UnpackTask` (Embedded Attachments) | AGPL-3.0 Ref | Embedded image extraction in `/tools/pdf-extract-images/`; arbitrary file-attachment unpacking not in `pdf-lib` public API | Documented |
| `SetPagesLabelTask` / `ViewerPreferencesTask` | AGPL-3.0 Ref | Low-level catalog manipulation; page-number stamping in `/tools/pdf-page-numbers/` | Documented |
| `Compress`, `Grayscale`, `Crop`, `Watermark`, `Bates`, `Flatten`, `Booklet/N-Up`, `Overlay`, `Repair` | Sejda Commercial PRO (Not in OSS `torakiki/sejda`) | Independently implemented in browser JS in `pdf-compressor`, `pdf-crop`, `pdf-watermark`, `pdf-page-numbers`, `pdf-flatten`, `pdf-booklet`, `pdf-overlay`, `pdf-repair` | Completed |
| `Encrypt/Decrypt`, `OCR`, `Word/Excel/URL to PDF`, `True Redaction` | Sejda Commercial PRO / Server Engine | Requires server-side Java/LibreOffice/Tesseract/qpdf; not faked on static Cloudflare Pages | Blocked (Technical) |
