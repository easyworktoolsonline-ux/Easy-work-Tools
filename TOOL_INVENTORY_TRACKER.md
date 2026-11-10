# EasyWorkTools — Complete Tool Inventory & Expansion Tracker

**Website:** https://easyworktools.online/  
**Total Active Tools:** 198 (173 Audited Existing + 17 Batch A/B/C + 8 Cross-Category Expansion Tools)  
**Architecture:** 100% Static Cloudflare Pages + Client-Side Browser Processing  

## 1. Summary of Changes

- **New Category Added:** `Video & Audio Tools` (`/categories/video-audio/`) with 5 browser-native media tools.
- **Upgraded PDF Tools:** `/tools/pdf-to-tiff/` (multi-file batch, page range, 72–600 DPI, RGB/Grayscale/1-bit Monochrome, LZW/PackBits/Uncompressed TIFF 6.0, Multi-page or ZIP), `/tools/pdf-compressor/` (Grayscale Save-Ink mode), `/tools/pdf-page-numbers/` (Bates numbering & prefix), `/tools/pdf-merge/` (Alternate & Mix / Duplex interleave), `/tools/pdf-split/` (Every N pages & Max size MB ZIP).
- **Batch A (5 Video & Audio Tools):** `video-thumbnail-extractor`, `video-compressor`, `video-trimmer`, `audio-converter`, `audio-trimmer`.
- **Batch B (5 PDF Tools):** `pdf-flatten`, `pdf-booklet`, `pdf-overlay`, `pdf-page-size-checker`, `pdf-repair`.
- **Batch C (7 Dev, SEO & Utility Tools):** `xml-formatter`, `sql-formatter`, `cron-expression-parser`, `json-diff-checker`, `utm-builder`, `qr-code-generator`, `color-contrast-checker`.
- **Batch D (8 Cross-Category Expansion Tools):** `loan-emi-calculator`, `compound-interest-calculator`, `bmi-calculator`, `date-duration-calculator`, `yaml-json-converter`, `markdown-previewer`, `meme-generator`, `image-filters`.
- **Open-Source License Compliance:** Added `OPEN_SOURCE_LICENSES.md` confirming zero AGPL/GPL code inclusion and documenting MIT/Apache-2.0/W3C libraries.
- **Homepage Dynamic Counts:** Replaced hardcoded counts in `index.html` with build-time manifest counts.

## 2. Items Not Feasible — Technical Limitations (Static Browser Environment)

| Requested Capability | Category | Status | Technical Reason |
| --- | --- | --- | --- |
| MKV / AVI / ProRes Video Transcoding | Video & Audio | Not Feasible — Technical Limitation | Requires multi-20MB FFmpeg-WASM or server-side transcoding; browser `MediaRecorder` handles MP4/WebM natively. |
| Exact DOCX / XLSX / PPTX Layout Conversion | PDF / Office | Not Feasible — Technical Limitation | Requires LibreOffice/headless server engine; no server-side document engine exists on static Cloudflare Pages. |
| PDF/A Archival Validation & Signing | PDF Tools | Not Feasible — Technical Limitation | Full ISO 19005 PDF/A color-profile embedding & cryptographic PKCS#7 hardware signing require dedicated server/native engines. |
| Webpage URL to PDF | PDF Tools | Not Feasible — Technical Limitation | Blocked by browser CORS & requires headless Chromium (Puppeteer/Playwright) on a server. |
| AI Object Removal / Inpainting & Whisper STT | AI / Media | Not Feasible — Technical Limitation | No server-side GPU/LLM inference proxy or API keys configured in `functions/api/`. |
| EPUB ↔ MOBI Conversion | Converter | Not Feasible — Technical Limitation | MOBI is a proprietary Kindle binary format requiring Calibre/KindleGen server binaries. |

## 3. Complete Tool Inventory (198 Active Tools)

| Tool Name | Category | Sub-Category / Group | URL | Status | Implementation Type | External Libraries / APIs | Browser-Only | Verification Result | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Age Calculator | Calculator Tools | Calculator Tools | tools/age-calculator/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| AI Detector | AI Write | AI Write | tools/ai-write/ai-detector/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| AI Humanizer | AI Write | AI Write | tools/ai-write/ai-humanizer/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| AI Rephraser | AI Write | AI Write | tools/ai-write/ai-rephraser/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| Article Generator | AI Write | AI Write | tools/ai-write/article-generator/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| Article Rewriter | AI Write | AI Write | tools/ai-write/article-rewriter/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| Article Writer | AI Write | AI Write | tools/ai-write/article-writer/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| Bill of Sale | AI Write | AI Write | tools/ai-write/bill-of-sale/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| Blog Outline Generator | AI Write | AI Write | tools/ai-write/blog-outline-generator/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| Blog Post Generator | AI Write | AI Write | tools/ai-write/blog-post-generator/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| Blog Post Ideas | AI Write | AI Write | tools/ai-write/blog-post-ideas/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| Blog Post Rewriter | AI Write | AI Write | tools/ai-write/blog-post-rewriter/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| Business Name Generator | AI Write | AI Write | tools/ai-write/business-name-generator/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| Business Plan Generator | AI Write | AI Write | tools/ai-write/business-plan-generator/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| Business Slogan Generator | AI Write | AI Write | tools/ai-write/business-slogan-generator/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| Cold Email Writer | AI Write | AI Write | tools/ai-write/cold-email-writer/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| Content Brief Generator | AI Write | AI Write | tools/ai-write/content-brief-generator/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| Content Improver | AI Write | AI Write | tools/ai-write/content-improver/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| Content Paraphraser | AI Write | AI Write | tools/ai-write/content-paraphraser/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| Content Planner | AI Write | AI Write | tools/ai-write/content-planner/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| Content Shortener | AI Write | AI Write | tools/ai-write/content-shortener/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| Content Summarizer | AI Write | AI Write | tools/ai-write/content-summarizer/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| Essay Writer | AI Write | AI Write | tools/ai-write/essay-writer/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| Explain It | AI Write | AI Write | tools/ai-write/explain-it/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| FAQ Generator | AI Write | AI Write | tools/ai-write/faq-generator/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| FB Headline Generator | AI Write | AI Write | tools/ai-write/fb-headline-generator/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| Grammar Fixer | AI Write | AI Write | tools/ai-write/grammar-fixer/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| Instagram Caption Generator | AI Write | AI Write | tools/ai-write/instagram-caption-generator/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| Instagram Story Idea | AI Write | AI Write | tools/ai-write/instagram-story-idea/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| Landing Page Copy Generator | AI Write | AI Write | tools/ai-write/landing-page-copy-generator/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| LinkedIn Post Generator | AI Write | AI Write | tools/ai-write/linkedin-post-generator/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| Meta Description Generator | AI Write | AI Write | tools/ai-write/meta-description-generator/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| NDA Generator | AI Write | AI Write | tools/ai-write/nda-generator/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| Paragraph Completer | AI Write | AI Write | tools/ai-write/paragraph-completer/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| Paragraph Rewriter | AI Write | AI Write | tools/ai-write/paragraph-rewriter/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| Paragraph Writer | AI Write | AI Write | tools/ai-write/paragraph-writer/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| Podcast Script Writer | AI Write | AI Write | tools/ai-write/podcast-script-writer/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| Poll Generator | AI Write | AI Write | tools/ai-write/poll-generator/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| Post Writer | AI Write | AI Write | tools/ai-write/post-writer/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| Press Release Generator | AI Write | AI Write | tools/ai-write/press-release-generator/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| Privacy Policy Generator | AI Write | AI Write | tools/ai-write/privacy-policy-generator/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| Purchase Agreement | AI Write | AI Write | tools/ai-write/purchase-agreement/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| Real Estate Descriptions | AI Write | AI Write | tools/ai-write/real-estate-descriptions/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| Search | AI Write | AI Write | tools/ai-write/search/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| Sentence Rewriter | AI Write | AI Write | tools/ai-write/sentence-rewriter/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| Story Generator | AI Write | AI Write | tools/ai-write/story-generator/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| Summarize YouTube | AI Write | AI Write | tools/ai-write/summarize-youtube/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| TikTok Script Writer | AI Write | AI Write | tools/ai-write/tiktok-script-writer/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| Title Rewriter | AI Write | AI Write | tools/ai-write/title-rewriter/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| Tone of Voice | AI Write | AI Write | tools/ai-write/tone-of-voice/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| Translate | AI Write | AI Write | tools/ai-write/translate/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| Trivia Generator | AI Write | AI Write | tools/ai-write/trivia-generator/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| Twitter Generator | AI Write | AI Write | tools/ai-write/twitter-generator/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| Word Counter | AI Write | AI Write | tools/ai-write/word-counter/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| YouTube Script Writer | AI Write | AI Write | tools/ai-write/youtube-script-writer/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| Audio Converter | Video & Audio Tools | Video & Audio Tools | tools/audio-converter/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| Audio Trimmer & Editor | Video & Audio Tools | Video & Audio Tools | tools/audio-trimmer/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| Base64 Encoder & Decoder | Developer Tools | Developer Tools | tools/base64-encoder-decoder/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| BMI & Daily Calorie (BMR/TDEE) Calculator | Calculator Tools | Calculator Tools | tools/bmi-calculator/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| Canonical & Meta Robots Checker | SEO Tools | SEO Tools | tools/canonical-robots-checker/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| Chart Maker | Image Tools | Image Tools | tools/chart-maker/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| WCAG Color Contrast Checker | Utility Tools | Utility Tools | tools/color-contrast-checker/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| Color Picker & Converter | Utility Tools | Utility Tools | tools/color-picker-converter/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| Compound Interest Calculator | Calculator Tools | Calculator Tools | tools/compound-interest-calculator/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| Cron Expression Parser | Developer Tools | Developer Tools | tools/cron-expression-parser/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| Date & Business Days Calculator | Calculator Tools | Calculator Tools | tools/date-duration-calculator/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| Easy Image Resizer | Image Tools | Image Tools | tools/easy-image-resizer/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| Easy Thumbnail Downloader | Image Tools | Image Tools | tools/easy-thumbnail-downloader/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| Favicon & App Icon Generator | Image Tools | Image Tools | tools/favicon-generator/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| Find & Replace | Text Tools | Text Tools | tools/find-and-replace/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| Font Awesome to PNG | Image Tools | Image Tools | tools/font-awesome-to-png/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| Free Image Compressor | Image Tools | Image Tools | tools/free-image-compressor/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| GIF to APNG Converter | Image Tools | Image Tools | tools/gif-to-apng/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| GIF to PDF | PDF Tools | PDF Tools | tools/gif-to-pdf/ | Active (Audited) | Existing Client-Side Tool | pdf-lib (MIT) / PDF.js (Apache-2.0) | Yes | Verified in Build | Zero server uploads |
| Hash Generator | Developer Tools | Developer Tools | tools/hash-generator/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| HEIC to AVIF Converter | Image Tools | Image Tools | tools/heic-to-avif/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| HEIC to JPG Converter | Image Tools | Image Tools | tools/heic-to-jpg-converter/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| HEIC to PDF | PDF Tools | PDF Tools | tools/heic-to-pdf/ | Active (Audited) | Existing Client-Side Tool | pdf-lib (MIT) / PDF.js (Apache-2.0) | Yes | Verified in Build | Zero server uploads |
| HEIC to PNG Converter | Image Tools | Image Tools | tools/heic-to-png/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| Hreflang Generator & Validator | SEO Tools | SEO Tools | tools/hreflang-generator/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| HTML/CSS/JS Minifier | Developer Tools | Developer Tools | tools/html-css-js-minifier/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| HTML Entity Encoder & Decoder | Developer Tools | Developer Tools | tools/html-entity-encoder-decoder/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| HTTP Header & Status Code Checker | SEO Tools | SEO Tools | tools/http-header-checker/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| Image Background Color Tool | Image Tools | Image Tools | tools/image-background-color/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| Image Border, Frame & Rounded Corners | Image Tools | Image Tools | tools/image-border-rounded/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| Image Collage Maker | Image Tools | Image Tools | tools/image-collage-maker/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| Image Color Picker & Palette Extractor | Image Tools | Image Tools | tools/image-color-picker/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| Image Compare & Difference Checker | Image Tools | Image Tools | tools/image-compare/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| Image Crop & Rotate | Image Tools | Image Tools | tools/image-crop-rotate/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| Image Dimensions & Aspect Ratio | Image Tools | Image Tools | tools/image-dimensions-checker/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| Image Editor | Image Tools | Image Tools | tools/image-editor/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| Image Filters & Adjustments | Image Tools | Image Tools | tools/image-filters/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| Image Format Converter | Image Tools | Image Tools | tools/image-format-converter/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| Image Hash & File Signature Checker | Image Tools | Image Tools | tools/image-hash-checker/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| Image Merge & Stitch | Image Tools | Image Tools | tools/image-merge-stitch/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| Image Metadata Viewer & Remover | Image Tools | Image Tools | tools/image-metadata-viewer/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| Image Splitter | Image Tools | Image Tools | tools/image-splitter/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| Image to Base64 Converter | Image Tools | Image Tools | tools/image-to-base64/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| Image Watermark Tool | Image Tools | Image Tools | tools/image-watermark/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| JPEG Compressor | Image Tools | Image Tools | tools/jpeg-compressor/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| JPG to AVIF Converter | Image Tools | Image Tools | tools/jpg-to-avif/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| JPG to GIF Converter | Image Tools | Image Tools | tools/jpg-to-gif/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| JPG to PDF | PDF Tools | PDF Tools | tools/jpg-to-pdf/ | Active (Audited) | Existing Client-Side Tool | pdf-lib (MIT) / PDF.js (Apache-2.0) | Yes | Verified in Build | Zero server uploads |
| JPG to SVG Converter | Image Tools | Image Tools | tools/jpg-to-svg/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| JPG to TIFF Converter | Image Tools | Image Tools | tools/jpg-to-tiff/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| JSON ↔ CSV Converter | Developer Tools | Developer Tools | tools/json-csv-converter/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| JSON Diff Checker | Developer Tools | Developer Tools | tools/json-diff-checker/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| JSON Formatter | Developer Tools | Developer Tools | tools/json-formatter/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| JWT Decoder | Developer Tools | Developer Tools | tools/jwt-decoder/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| Keyword Density Checker | SEO Tools | SEO Tools | tools/keyword-density-checker/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| Line & List Tools | Text Tools | Text Tools | tools/line-list-tools/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| Loan & EMI Calculator | Calculator Tools | Calculator Tools | tools/loan-emi-calculator/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| Lorem Ipsum Generator | Text Tools | Text Tools | tools/lorem-ipsum-generator/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| Make Background Transparent | Image Tools | Image Tools | tools/make-background-transparent/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| Markdown ↔ HTML Converter | Developer Tools | Developer Tools | tools/markdown-html-converter/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| Markdown Live Preview & HTML Exporter | Developer Tools | Developer Tools | tools/markdown-previewer/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| Meme Generator | Image Tools | Image Tools | tools/meme-generator/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| Meta Tag Generator | SEO Tools | SEO Tools | tools/meta-tag-generator/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| Online Text Case Converter | Text Tools | Text Tools | tools/online-text-case-converter/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| Password Generator | Utility Tools | Utility Tools | tools/password-generator/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| Add Images to PDF | PDF Tools | PDF Tools | tools/pdf-add-images/ | Active (Audited) | Existing Client-Side Tool | pdf-lib (MIT) / PDF.js (Apache-2.0) | Yes | Verified in Build | Zero server uploads |
| Add Text to PDF | PDF Tools | PDF Tools | tools/pdf-add-text/ | Active (Audited) | Existing Client-Side Tool | pdf-lib (MIT) / PDF.js (Apache-2.0) | Yes | Verified in Build | Zero server uploads |
| Annotate PDF | PDF Tools | PDF Tools | tools/pdf-annotate/ | Active (Audited) | Existing Client-Side Tool | pdf-lib (MIT) / PDF.js (Apache-2.0) | Yes | Verified in Build | Zero server uploads |
| PDF Booklet Maker | PDF Tools | PDF Tools | tools/pdf-booklet/ | Active (Audited) | Existing Client-Side Tool | pdf-lib (MIT) / PDF.js (Apache-2.0) | Yes | Verified in Build | Zero server uploads |
| PDF Compressor | PDF Tools | PDF Tools | tools/pdf-compressor/ | Active (Audited) | Existing Client-Side Tool | pdf-lib (MIT) / PDF.js (Apache-2.0) | Yes | Verified in Build | Zero server uploads |
| Create PDF | PDF Tools | PDF Tools | tools/pdf-create/ | Active (Audited) | Existing Client-Side Tool | pdf-lib (MIT) / PDF.js (Apache-2.0) | Yes | Verified in Build | Zero server uploads |
| Crop PDF | PDF Tools | PDF Tools | tools/pdf-crop/ | Active (Audited) | Existing Client-Side Tool | pdf-lib (MIT) / PDF.js (Apache-2.0) | Yes | Verified in Build | Zero server uploads |
| Delete Pages from PDF | PDF Tools | PDF Tools | tools/pdf-delete-pages/ | Active (Audited) | Existing Client-Side Tool | pdf-lib (MIT) / PDF.js (Apache-2.0) | Yes | Verified in Build | Zero server uploads |
| Edit PDF | PDF Tools | PDF Tools | tools/pdf-edit/ | Active (Audited) | Existing Client-Side Tool | pdf-lib (MIT) / PDF.js (Apache-2.0) | Yes | Verified in Build | Zero server uploads |
| Extract Images from PDF | PDF Tools | PDF Tools | tools/pdf-extract-images/ | Active (Audited) | Existing Client-Side Tool | pdf-lib (MIT) / PDF.js (Apache-2.0) | Yes | Verified in Build | Zero server uploads |
| Extract Text from PDF | PDF Tools | PDF Tools | tools/pdf-extract-text/ | Active (Audited) | Existing Client-Side Tool | pdf-lib (MIT) / PDF.js (Apache-2.0) | Yes | Verified in Build | Zero server uploads |
| PDF Flatten | PDF Tools | PDF Tools | tools/pdf-flatten/ | Active (Audited) | Existing Client-Side Tool | pdf-lib (MIT) / PDF.js (Apache-2.0) | Yes | Verified in Build | Zero server uploads |
| Merge PDF | PDF Tools | PDF Tools | tools/pdf-merge/ | Active (Audited) | Existing Client-Side Tool | pdf-lib (MIT) / PDF.js (Apache-2.0) | Yes | Verified in Build | Zero server uploads |
| PDF Metadata Editor | PDF Tools | PDF Tools | tools/pdf-metadata-editor/ | Active (Audited) | Existing Client-Side Tool | pdf-lib (MIT) / PDF.js (Apache-2.0) | Yes | Verified in Build | Zero server uploads |
| PDF Organizer | PDF Tools | PDF Tools | tools/pdf-organizer/ | Active (Audited) | Existing Client-Side Tool | pdf-lib (MIT) / PDF.js (Apache-2.0) | Yes | Verified in Build | Zero server uploads |
| PDF Overlay | PDF Tools | PDF Tools | tools/pdf-overlay/ | Active (Audited) | Existing Client-Side Tool | pdf-lib (MIT) / PDF.js (Apache-2.0) | Yes | Verified in Build | Zero server uploads |
| Add Page Numbers to PDF | PDF Tools | PDF Tools | tools/pdf-page-numbers/ | Active (Audited) | Existing Client-Side Tool | pdf-lib (MIT) / PDF.js (Apache-2.0) | Yes | Verified in Build | Zero server uploads |
| PDF Page Size Checker | PDF Tools | PDF Tools | tools/pdf-page-size-checker/ | Active (Audited) | Existing Client-Side Tool | pdf-lib (MIT) / PDF.js (Apache-2.0) | Yes | Verified in Build | Zero server uploads |
| Rearrange PDF Pages | PDF Tools | PDF Tools | tools/pdf-rearrange/ | Active (Audited) | Existing Client-Side Tool | pdf-lib (MIT) / PDF.js (Apache-2.0) | Yes | Verified in Build | Zero server uploads |
| PDF Repair | PDF Tools | PDF Tools | tools/pdf-repair/ | Active (Audited) | Existing Client-Side Tool | pdf-lib (MIT) / PDF.js (Apache-2.0) | Yes | Verified in Build | Zero server uploads |
| Rotate PDF | PDF Tools | PDF Tools | tools/pdf-rotate/ | Active (Audited) | Existing Client-Side Tool | pdf-lib (MIT) / PDF.js (Apache-2.0) | Yes | Verified in Build | Zero server uploads |
| Sign PDF | PDF Tools | PDF Tools | tools/pdf-sign/ | Active (Audited) | Existing Client-Side Tool | pdf-lib (MIT) / PDF.js (Apache-2.0) | Yes | Verified in Build | Zero server uploads |
| Split PDF | PDF Tools | PDF Tools | tools/pdf-split/ | Active (Audited) | Existing Client-Side Tool | pdf-lib (MIT) / PDF.js (Apache-2.0) | Yes | Verified in Build | Zero server uploads |
| Summarize PDF | PDF Tools | PDF Tools | tools/pdf-summarize/ | Active (Audited) | Existing Client-Side Tool | pdf-lib (MIT) / PDF.js (Apache-2.0) | Yes | Verified in Build | Zero server uploads |
| PDF to EPUB | PDF Tools | PDF Tools | tools/pdf-to-epub/ | Active (Audited) | Existing Client-Side Tool | pdf-lib (MIT) / PDF.js (Apache-2.0) | Yes | Verified in Build | Zero server uploads |
| PDF to JPG | PDF Tools | PDF Tools | tools/pdf-to-jpg/ | Active (Audited) | Existing Client-Side Tool | pdf-lib (MIT) / PDF.js (Apache-2.0) | Yes | Verified in Build | Zero server uploads |
| PDF to PNG | PDF Tools | PDF Tools | tools/pdf-to-png/ | Active (Audited) | Existing Client-Side Tool | pdf-lib (MIT) / PDF.js (Apache-2.0) | Yes | Verified in Build | Zero server uploads |
| PDF to PowerPoint | PDF Tools | PDF Tools | tools/pdf-to-ppt/ | Active (Audited) | Existing Client-Side Tool | pdf-lib (MIT) / PDF.js (Apache-2.0) | Yes | Verified in Build | Zero server uploads |
| PDF to Text | PDF Tools | PDF Tools | tools/pdf-to-text/ | Active (Audited) | Existing Client-Side Tool | pdf-lib (MIT) / PDF.js (Apache-2.0) | Yes | Verified in Build | Zero server uploads |
| PDF to TIFF | PDF Tools | PDF Tools | tools/pdf-to-tiff/ | Active (Audited) | Existing Client-Side Tool | pdf-lib (MIT) / PDF.js (Apache-2.0) | Yes | Verified in Build | Zero server uploads |
| PDF to Word | PDF Tools | PDF Tools | tools/pdf-to-word/ | Active (Audited) | Existing Client-Side Tool | pdf-lib (MIT) / PDF.js (Apache-2.0) | Yes | Verified in Build | Zero server uploads |
| PDF Watermark & Branding | PDF Tools | PDF Tools | tools/pdf-watermark/ | Active (Audited) | Existing Client-Side Tool | pdf-lib (MIT) / PDF.js (Apache-2.0) | Yes | Verified in Build | Zero server uploads |
| Percentage Calculator | Calculator Tools | Calculator Tools | tools/percentage-calculator/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| PNG to AVIF Converter | Image Tools | Image Tools | tools/png-to-avif/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| PNG to EPS Converter | Image Tools | Image Tools | tools/png-to-eps/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| PNG to GIF Converter | Image Tools | Image Tools | tools/png-to-gif/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| PNG to PDF | PDF Tools | PDF Tools | tools/png-to-pdf/ | Active (Audited) | Existing Client-Side Tool | pdf-lib (MIT) / PDF.js (Apache-2.0) | Yes | Verified in Build | Zero server uploads |
| PNG to SVG Converter | Image Tools | Image Tools | tools/png-to-svg/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| PNG to TIFF Converter | Image Tools | Image Tools | tools/png-to-tiff/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| Profile Photo Maker | Image Tools | Image Tools | tools/profile-photo-maker/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| QR Code Generator | Utility Tools | Utility Tools | tools/qr-code-generator/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| Readability Checker | Text Tools | Text Tools | tools/readability-checker/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| Readability Score Checker | Text Tools | Text Tools | tools/readability-score-checker/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| Redirect Rules Generator & Chain Checker | SEO Tools | SEO Tools | tools/redirect-rules-generator/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| Regex Tester | Developer Tools | Developer Tools | tools/regex-tester/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| Remove Background from Image | Image Tools | Image Tools | tools/remove-background-from-image/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| Remove Duplicate Lines | Text Tools | Text Tools | tools/remove-duplicate-lines/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| Robots.txt Generator & Tester | SEO Tools | SEO Tools | tools/robots-txt-generator/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| Schema Markup Generator & JSON-LD Validator | SEO Tools | SEO Tools | tools/schema-markup-generator/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| SEO Page Analyzer | SEO Tools | SEO Tools | tools/seo-page-analyzer/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| Google SERP Snippet Preview | SEO Tools | SEO Tools | tools/serp-snippet-preview/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| Social Share Preview | Image Tools | Image Tools | tools/social-share-preview/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| SQL Formatter & Beautifier | Developer Tools | Developer Tools | tools/sql-formatter/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| SVG Optimizer | Image Tools | Image Tools | tools/svg-optimizer/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| Text Cleaner | Text Tools | Text Tools | tools/text-cleaner/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| Text Compare | Text Tools | Text Tools | tools/text-compare/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| Text Extractor | Text Tools | Text Tools | tools/text-extractor/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| Text Sorter & Line Counter | Text Tools | Text Tools | tools/text-sorter-line-counter/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| TIFF to JPG Converter | Image Tools | Image Tools | tools/tiff-to-jpg/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| TIFF to PNG Converter | Image Tools | Image Tools | tools/tiff-to-png/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| TIFF to SVG Converter | Image Tools | Image Tools | tools/tiff-to-svg/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| Unit Converter | Converter Tools | Converter Tools | tools/unit-converter/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| Unix Timestamp Converter | Developer Tools | Developer Tools | tools/unix-timestamp-converter/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| URL Encoder & Decoder | Developer Tools | Developer Tools | tools/url-encoder-decoder/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| URL Parser | Developer Tools | Developer Tools | tools/url-parser/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| URL Slug Generator | SEO Tools | SEO Tools | tools/url-slug-generator/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| UTM Campaign URL Builder | SEO Tools | SEO Tools | tools/utm-builder/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| UUID Generator | Developer Tools | Developer Tools | tools/uuid-generator/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| Video Compressor | Video & Audio Tools | Video & Audio Tools | tools/video-compressor/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| Video Thumbnail Extractor | Video & Audio Tools | Video & Audio Tools | tools/video-thumbnail-extractor/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| Video Trimmer & Muter | Video & Audio Tools | Video & Audio Tools | tools/video-trimmer/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| WEBP to AVIF Converter | Image Tools | Image Tools | tools/webp-to-avif/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| WebP to PDF | PDF Tools | PDF Tools | tools/webp-to-pdf/ | Active (Audited) | Existing Client-Side Tool | pdf-lib (MIT) / PDF.js (Apache-2.0) | Yes | Verified in Build | Zero server uploads |
| Word & Character Counter | Text Tools | Text Tools | tools/word-character-counter/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| XML Formatter & Validator | Developer Tools | Developer Tools | tools/xml-formatter/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| XML Sitemap Generator & Validator | SEO Tools | SEO Tools | tools/xml-sitemap-generator/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| YAML to JSON & JSON to YAML Converter | Developer Tools | Developer Tools | tools/yaml-json-converter/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
| YouTube Tag Generator | SEO Tools | SEO Tools | tools/youtube-tag-generator/ | Active (Audited) | Existing Client-Side Tool | Vanilla JS / W3C Web APIs | Yes | Verified in Build | Zero server uploads |
