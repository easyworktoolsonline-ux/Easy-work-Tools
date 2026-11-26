# 7. DNS — read-only confirmation

## Dashboard state
`NOT VERIFIED (dashboard inaccessible)`. The Cloudflare DNS records list was not opened. The records below were resolved publicly from this machine with Windows `Resolve-DnsName` on 2026-11-23 ~15:26 PKT / 10:26 UTC. All are read-only observations; **no DNS record was edited**.

## Zone / nameservers
- Zone: `easyworktools.online`
- Nameservers: `alex.ns.cloudflare.com`, `bonnie.ns.cloudflare.com` (NS TTL 900 s)
- SOA primary `alex.ns.cloudflare.com`, responsible `dns.cloudflare.com`, serial `2420910882`

## Apex records (`easyworktools.online`)
| Type | Value | TTL observed |
|---|---|---:|
| A | `104.21.41.69` | 3 s |
| A | `172.67.189.199` | 3 s |
| AAAA | `2606:4700:3031::6815:2945` | 245 s |
| AAAA | `2606:4700:3037::ac43:bdc7` | 245 s |
| MX | `route1.mx.cloudflare.net` preference 69 | 3 s |
| MX | `route2.mx.cloudflare.net` preference 66 | 3 s |
| MX | `route3.mx.cloudflare.net` preference 96 | 3 s |
| TXT | `v=spf1 include:_spf.mx.cloudflare.net ~all` | 288 s |
| TXT | `google-site-verification=<redacted>` | 288 s |

## www records (`www.easyworktools.online`)
| Type | Value | TTL observed |
|---|---|---:|
| A | `104.21.41.69` | 300 s |
| A | `172.67.189.199` | 300 s |
| AAAA | `2606:4700:3031::6815:2945` | 300 s |
| AAAA | `2606:4700:3037::ac43:bdc7` | 300 s |
- No CNAME at apex or www; both are A/AAAA records pointing at Cloudflare IPs (proxied-looking addresses; proxy toggle itself not verifiable without dashboard).
- `www` resolves to the same addresses as apex and 301-redirects to apex at HTTP layer.

## Mail-related records
| Name | Type | Value | TTL |
|---|---|---|---:|
| `_dmarc.easyworktools.online` | TXT | `v=DMARC1; p=quarantine; pct=100; rua=mailto:info@easyworktools.online; fo=1` | 300 s |
| `easyworktools.online` | MX | route1/route2/route3 `.mx.cloudflare.net` (Cloudflare Email Routing) | 3 s |
| `easyworktools.online` | TXT | SPF include `_spf.mx.cloudflare.net` | 288 s |

Checks that returned NXDOMAIN / no records in this probe:
- `default._domainkey.easyworktools.online` TXT
- `cf1._domainkey.easyworktools.online`, `cf2._domainkey.easyworktools.online`, `cf3._domainkey.easyworktools.online` (CNAME/TXT/A)
- `cloudflare-eemail.easyworktools.online` CNAME
- `mail.easyworktools.online` A/TXT/CNAME
- `_spf.easyworktools.online` TXT/CNAME/A

Conclusion: apex and www A/AAAA records and the mail-related MX/SPF/DMARC records are present and resolve. DKIM CNAMEs were not found by the selectors tested; this is an observation only, not a change recommendation, and the dashboard DNS list was not consulted.

## Notes
- Low TTLs (3 s) on apex A/MX may be Cloudflare's automatic/edge-adjusted values for proxied records rather than literal record TTLs in the dashboard; do not treat them as dashboard settings.
- No secret values are included. The Google verification token is redacted even though TXT records are public.

## Authenticated dashboard addendum — access superseded, no DNS delta

The authenticated Cloudflare dashboard was available later in the main browser. The public DNS records above remain the evidence used in this audit; no separate dashboard DNS table was transcribed and no dashboard-versus-public discrepancy was recorded. **No DNS record was edited.**
