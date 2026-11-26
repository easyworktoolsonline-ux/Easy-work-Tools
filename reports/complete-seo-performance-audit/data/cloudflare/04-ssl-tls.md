# 4. SSL/TLS — current state

## Dashboard state
`NOT VERIFIED (dashboard inaccessible)`. Encryption mode, HSTS toggle/include-subdomains/preload, TLS version selector, Opportunistic Encryption toggle and certificate issuance status page could not be read. The observations below are from live handshake/response probes only.

## HTTPS redirects (VERIFIED live probe, 2026-11-23 10:27:14–15 UTC)
| Request | Result |
|---|---|
| `http://easyworktools.online/` | `HTTP/1.1 301 Moved Permanently`, `Location: https://easyworktools.online/`, then `200` |
| `https://www.easyworktools.online/` | `HTTP/1.1 301 Moved Permanently`, `Location: https://easyworktools.online/`, then `200` |
| `https://easyworktools.online/` | `200` directly |

Conclusion: HTTP→HTTPS redirect and www→apex canonical redirect are both active at the edge. Whether this is Cloudflare "Always Use HTTPS" plus a Page Rule/redirect rule, or Pages `_redirects`, was not verifiable.

## HSTS (VERIFIED live response header)
`Strict-Transport-Security: max-age=15552000` on all probed HTTPS responses (15552000 s = 180 days).
- No `includeSubDomains` and no `preload` token in the observed header.
- Historical corroboration: `DOCUMENTATION/CORE-WEB-VITALS-AND-SEO-OPTIMIZATION-REPORT.md:211-215` says the zone value is authoritative and overrides the repo `_headers` value; repo was changed from 63072000 to 15552000 to match the served 180-day value. `FINAL-REPORT.md:137` records the same drift before reconciliation.
- Dashboard HSTS toggle state not verified.

## TLS versions (VERIFIED live handshake probe, PowerShell SslStream, 2026-11-23 ~15:27 PKT)
| Attempted protocol | Result |
|---|---|
| TLS 1.0 | FAILED ("A call to SSPI failed") |
| TLS 1.1 | FAILED ("A call to SSPI failed") |
| TLS 1.2 | OK, negotiated Tls12 |
| TLS 1.3 | OK, negotiated Tls13 |
- `/cdn-cgi/trace` on a default curl request reported `tls=TLSv1.3`, `kex=X25519`, `sni=plaintext`, `colo=KHI`, `http=http/1.1`.
- Conclusion: observed minimum negotiated version is TLS 1.2 and TLS 1.3 is available. The Cloudflare TLS-version selector value itself is not verified.

## Certificates (VERIFIED live handshake probe)
Apex:
- Subject `CN=easyworktools.online`
- Issuer `CN=WE1, O=Google Trust Services, C=US` (Cloudflare/Google Trust Services issuance)
- NotBefore `2026-11-17T04:04:59+05:00` (2026-11-16 22:04:59 UTC)
- NotAfter `2027-02-15T05:04:49+05:00` (2027-02-15 00:04:49 UTC) — valid at time of probe
- Serial `00E99AB4B7037CF9B213FBA03DD952B027`
- SHA-256 thumbprint `CF5254687574A96C1480818F313E7DE644614241`
- SAN: `DNS Name=easyworktools.online`

www:
- Subject `CN=www.easyworktools.online`
- SAN: `DNS Name=www.easyworktools.online`
- NotAfter `2027-02-15T05:35:48+05:00` — valid at time of probe

Certificate status page (active/pending validation, certificate authority selection, custom vs universal) was not visible; both hostnames presented valid chains in live handshakes.

## Opportunistic Encryption
`NOT VERIFIED (dashboard inaccessible)`. No observable redirect to `http://` was seen; HTTP always 301'd to HTTPS. Historical reports do not record this toggle. Do not infer the dashboard toggle state from this.

## Security-relevant headers also observed (context only)
- `x-frame-options: DENY`
- `x-content-type-options: nosniff`
- `referrer-policy: strict-origin-when-cross-origin`
- `permissions-policy: geolocation=(), microphone=(), camera=(), payment=(), usb=(), midi=(), browsing-topics=()`
- `content-security-policy-report-only: ...` (report-only, not enforced; full value in `08-live-probe-log.md`)
- `Report-To` / `Nel` for `cf-nel` (signed endpoint URL redacted)
- No `Expect-CT` header observed.

## Authenticated dashboard addendum — supersedes `NOT VERIFIED` above

The Cloudflare SSL/TLS overview was read in the main browser:

- Current encryption mode: **Full**.
- Automatic HTTPS mode was enabled **62 days ago** relative to the audit date.
- Last 24 h TLS protocol counts shown: **TLS 1.3: 4.75k**, **TLS 1.2: 8**, **None: 109**.

This corroborates the live handshake probes showing TLS 1.2 and 1.3 available and TLS 1.0/1.1 rejected. No SSL/TLS setting was changed.
