# Sanitized Apps Script security audit

Date: 2026-11-27

Overall status: PARTIAL

## Scope

- Local source only: `apps-script/Code.gs` and the public client configuration in `assets/feedback-config.js`.
- No deployment URL, recipient address, Turnstile secret, property value, token, cookie, support submission or personal data is reproduced.
- No live Apps Script dashboard, execution log, permission review, trigger review or test submission was performed.

| ID | Observation | Evidence (sanitized) | Implication | FinalStatus |
|---|---|---|---|---|
| A01 | `doPost` handler is present | `apps-script/Code.gs` (144 lines) contains `function doPost` | Submission endpoint exists in source; live deployment state is not verified. | DONE |
| A02 | Secrets are read from script properties | Source references `PropertiesService`, `TURNSTILE_SECRET` and `RECIPIENT_EMAIL` | No secret value is stored in the repository; owner must verify property values in the Apps Script project. | DONE |
| A03 | Mail delivery uses Apps Script mail service | Source references `MailApp` | Delivery was not tested. Quotas, recipient value and logs remain owner-only. | BLOCKED - WAITING FOR OWNER |
| A04 | Public endpoint is configured | Public config defines the Apps Script URL; value intentionally redacted here | Endpoint is public by design. Confirm it points to the intended deployment before enabling review. | OWNER DECISION REQUIRED |
| A05 | Turnstile site key is empty in public config | Site-key value is blank; no secret value is in the public file | Bot protection is effectively disabled unless the owner sets a site key and matching server-side secret. | OWNER DECISION REQUIRED |
| A06 | No explicit CORS header in Apps Script source | Source does not emit `Access-Control-Allow-Origin` | The client's opaque cross-origin path cannot read status codes; treat server logs as authoritative. | OWNER DECISION REQUIRED |
| A07 | Live deployment/project state | Not inspected | Deployment ID, execution role, permissions, quotas, properties and logs are unavailable in this session. | BLOCKED - WAITING FOR OWNER |

## Owner checklist

1. Verify the Apps Script deployment points to the current `Code.gs` version.
2. Verify `TURNSTILE_SECRET` and `RECIPIENT_EMAIL` property values inside Apps Script without pasting them into the repository.
3. Decide whether to enable Turnstile by setting the public site key and the matching private secret.
4. Test one controlled submission and inspect MailApp delivery and execution logs.
5. Decide whether to add a CORS-enabled JSON response or keep opaque success semantics.

No owner-only value was read, copied or published in this report. Overall status remains PARTIAL because live deployment and delivery verification are pending.
