# Sanitized source and configuration security audit

Date: 2026-11-27

Overall status: PARTIAL

## Scope and handling

- Scope: tracked repository source, public client configuration, `_headers`, the thumbnail API function, and previously observed live header behaviour for `https://easyworktools.online/`.
- No credential, cookie, token, private key, recipient address, webhook URL, deployment URL, support submission, personal data or secret value is reproduced in this report.
- No Cloudflare dashboard, DNS, deployment configuration or private account data was accessed during this pass.
- `ads.txt` was not modified. No history rewrite, force push or deployment change was performed.

| ID | Area | Sanitized observation | Risk / owner action | FinalStatus |
|---|---|---|---|---|
| S01 | Secrets in tracked source | No tracked `.env` file. No high-confidence live credential token pattern was found in the scanned tracked text files. Generic keyword hits in documentation/tool copy were reviewed as non-secret terms. | None from repository source. Positive controls for the scanner were confirmed in the earlier audit. | DONE |
| S02 | Content-Security-Policy | `_headers` contains a `Content-Security-Policy-Report-Only` policy with `frame-ancestors 'none'`; no enforcing CSP header was found in the source file. | Report-only mode does not block violations. Owner decision required before switching to enforcement after compatibility validation. | OWNER DECISION REQUIRED |
| S03 | Framing and transport headers | `_headers` includes `X-Frame-Options: DENY` and `Strict-Transport-Security`; live inspection also showed `X-Frame-Options: DENY` and the report-only CSP. | No repository change needed. Live iframe-based QA is blocked by the framing policy, which is expected. | DONE |
| S04 | CORS | Tracked configuration scopes `Access-Control-Allow-Origin` to the production origin for `/api/*`; the thumbnail function also returns the production origin. No wildcard source rule was found. | No repository change needed. Recheck deployed headers if a future Cloudflare rule is added. | DONE |
| S05 | Thumbnail image-host validation | `functions/api/thumbnail.js` line 225 uses a ternary that returns `result.image` in both branches, so the `IMAGE_HOSTS` check does not reject or rewrite an untrusted value. | Owner decision required: decide whether to enforce an allow-list, validate the final resolved URL, or rely on the existing oEmbed/scrape path with explicit documentation. | OWNER DECISION REQUIRED |
| S06 | Public feedback configuration | Public config contains the Apps Script endpoint and an empty Turnstile site key; no secret is stored in the public config. | Owner decision required: enable Turnstile by setting a site key and matching server-side secret if bot protection is desired. | OWNER DECISION REQUIRED |
| S07 | Feedback response handling | The public client uses an opaque cross-origin success path, so it cannot reliably distinguish an HTTP error from a successful server response. | Owner decision required: decide whether to require a CORS-enabled JSON response or accept opaque success semantics with server-side logging as the source of truth. | OWNER DECISION REQUIRED |
| S08 | Operational references in tracked files | 11 tracked `_work` files contain local-path references and 203 tracked report files contain operational references. No private export was added by this pass. | Owner decision required if history-level sanitisation is desired; no history rewrite was performed. | OWNER DECISION REQUIRED |
| S09 | Cloudflare and deployment state | Only live redirect/header behaviour was observed; dashboard rules, WAF, page rules and deployment settings were not inspected. | BLOCKED - WAITING FOR OWNER for authenticated dashboard review. | BLOCKED - WAITING FOR OWNER |
| S10 | Server-side runtime verification | Live Apps Script deployment/project, permissions, properties, Turnstile secret, MailApp delivery, quotas and logs were not accessed. | BLOCKED - WAITING FOR OWNER; see `apps-script-security-audit.md`. | BLOCKED - WAITING FOR OWNER |

## Positive controls from the repository scan

- No tracked `.env` file.
- No embedded remote credentials in Git remote configuration.
- No high-confidence AWS, OpenAI-style, GitHub, or Google API key pattern in tracked source.
- No secret value is printed by this audit or by the verification scripts retained in the working tree.

## Conclusion

The repository source does not contain an exposed live secret. Remaining hardening items need owner decisions or authenticated deployment access; no security change was deployed in this pass. Overall status is PARTIAL.
