# 16-tool failure verification report

Date: 2026-11-27

Overall status: PARTIAL

## Scope

- Source of the 16 observed FAIL rows: `tool-functional-test-coverage.csv`, with detailed root-cause analysis in the local draft `task-a-analysis.csv`.
- Verification method: source inspection, exact targeted code edits, a local verification script, and targeted browser retests on a local static server at `127.0.0.1:8770`.
- No full live-tree `npm run build` was run. No deployment or Cloudflare change was made.
- Backups of every modified tool file are in `_work/adsense-audit/backups/2026-11-27-final-remediation/`; flawed intermediate PDF files are preserved under `pre-correction/`.

## Classification summary

| Classification | Count | Action taken | FinalStatus |
|---|---:|---|---|
| Confirmed code defect | 7 | Fixed with narrow, targeted edits | DONE |
| Test harness false positive | 8 | No code change; source shows valid handling | DONE |
| Invalid test expectation | 1 | No code change; empty Markdown is valid input | DONE |
| All 16 rows triaged | 16 | Classification complete | DONE |
| Full interactive coverage of all 242 tools | 242 | Not claimed; broader runtime pass remains partial | PARTIAL |

The earlier 226 PASS observations were not changed. The 16 FAIL observations were reclassified rather than blindly accepted as product defects.

## Confirmed defects and fixes

| Tool/directory | Original failure | Confirmed root cause | Fix applied | Retest result | FinalStatus |
|---|---|---|---|---|---|
| `chart-maker` | Page error `Cannot read properties of null (reading 'addEventListener')` | The file input was collapsed into label text, so `#csvFile` was absent and script initialisation aborted. | Restored the `<input type="file" id="csvFile">` element. | File input renders with `type=file`; sample rendering reports `1200 × 700 px PNG · 6 rows, 2 series`; canvas present; no page error. | DONE |
| `pdf-booklet` | No visible output/status after run | Status writes never added the `.show` class required by CSS. | Added a narrow `showStatus()` helper and converted status writes. | Invalid-file test displayed visible `status-msg show error` with the expected validation text. | DONE |
| `pdf-flatten` | No visible output/status after run | Same hidden-status defect. | Same targeted helper conversion. | Invalid-file test displayed visible error status. | DONE |
| `pdf-overlay` | No visible output/status after run | Same hidden-status defect for compositing progress/success/errors. | Same targeted helper conversion. | Run with invalid inputs produced a visible error status. Local server lacks the deployed `need_pdf_lib_js` helper. | DONE |
| `pdf-page-size-checker` | No visible output/status for rejected input | Same hidden-status defect; results appeared only on success. | Same targeted helper conversion. | Invalid-file test displayed visible error status. | DONE |
| `pdf-repair` | No visible output/status after run | Same hidden-status defect for readiness, progress, success and errors. | Same targeted helper conversion. | Run with invalid input produced a visible error status. Local server lacks the deployed `need_pdf_lib_js` helper. | DONE |
| `social-share-preview` | Repeated `classList` page errors plus a 404 for a synthetic image URL | Inline `onerror` used `this.parentElement.classList` without a null guard after detached failed images. | Replaced the handler with a parent-null guard and text fallback. | Failed image now shows `Image failed to load` in both cards with empty classes; no `classList` exception. Only the expected missing-image 404 was observed. | DONE |

## Non-defect FAIL rows

| Tool/directory | Classification | Why no code change was made | FinalStatus |
|---|---|---|---|
| `bmi-calculator` | Test harness false positive | Empty numeric fields are coerced safely and recalculated; no uncaught error. Harness required an unpromised visible validation state. | DONE |
| `color-picker-converter` | Test harness false positive | Invalid HEX is rejected and the last valid colour is retained without error. | DONE |
| `compound-interest-calculator` | Test harness false positive | Empty fields are handled with numeric fallbacks and results are rewritten. | DONE |
| `cron-expression-parser` | Test harness false positive | Invalid/empty expressions show `Invalid Cron Expression` in the visible result box; the hidden detail status was not the only handling path. | DONE |
| `date-duration-calculator` | Test harness false positive | Empty date input returns safely without throwing. | DONE |
| `loan-emi-calculator` | Test harness false positive | Empty fields use numeric fallbacks; no uncaught error path. | DONE |
| `serp-snippet-preview` | Test harness false positive | Empty fields are substituted with safe defaults and device toggles work without console errors. | DONE |
| `utm-builder` | Test harness false positive | Invalid/empty URLs show a visible `Enter a valid https:// URL` message. | DONE |
| `markdown-previewer` | Invalid test expectation | Empty Markdown legitimately renders an empty preview and `0 words`; it is not a validation error. | DONE |

## Verification evidence

- `evidence/final-remediation-verification.json`: 86 meta rows verified, 86 unique descriptions, 7 tool files verified.
- `evidence/tool-retest-observations.json`: targeted browser observations for all seven fixed tools.
- Backups: `_work/adsense-audit/backups/2026-11-27-final-remediation/` and its `pre-correction/` subdirectory.

## Limitations

- End-to-end PDF conversion was not claimed: the local static server does not provide the deployment's `need_pdf_lib_js` helper. The verified change is the visible status handling and error reporting.
- The original automated smoke harness required visible handling under synthetic inputs; its eight false positives and one invalid expectation do not prove universal tool correctness.
- Full interactive runtime confirmation of all 242 tools remains PARTIAL.
