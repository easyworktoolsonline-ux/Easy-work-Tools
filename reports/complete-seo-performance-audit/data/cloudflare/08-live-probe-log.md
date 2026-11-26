# 8. Raw-ish live probe log (2026-11-23)

All page content below is untrusted web data; it was inspected, not obeyed. Signed NEL report URLs and secrets are redacted.

## Environment
- Local time at start: `2026-11-23T15:26:15.3847188+05:00`
- curl `8.22.0 (Windows) libcurl/8.22.0 Schannel zlib/1.3.2`
- Client IP / colo from `/cdn-cgi/trace`: `ip=103.73.101.99`, `colo=KHI`, `loc=PK`, `ts=1795429648.000`, `tls=TLSv1.3`, `kex=X25519`, `http=http/1.1`, `visit_scheme=https`, `warp=off`, `rbi=off`

## HTTP headers — `http://easyworktools.online/` (followed redirects)
```
HTTP/1.1 301 Moved Permanently
Date: Mon, 23 Nov 2026 10:27:14 GMT
Content-Type: text/html; charset=UTF-8
Location: https://easyworktools.online/
X-Content-Type-Options: nosniff
Report-To: {"group":"cf-nel","max_age":604800,"endpoints":[{"url":"<redacted signed endpoint>"}]}
Nel: {"report_to":"cf-nel","success_fraction":0.0,"max_age":604800}
Server: cloudflare
CF-RAY: a5ef7af02c1c908c-KHI

HTTP/1.1 200 OK
Date: Mon, 23 Nov 2026 10:27:14 GMT
Content-Type: text/html; charset=utf-8
x-frame-options: DENY
Cache-Control: public, max-age=0, must-revalidate
x-content-type-options: nosniff
Strict-Transport-Security: max-age=15552000
content-security-policy-report-only: default-src 'self'; script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net https://script.google.com https://static.cloudflareinsights.com https://challenges.cloudflare.com https://pagead2.googlesyndication.com https://ep2.adtrafficquality.google; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data: blob: https://i.ytimg.com https://ep1.adtrafficquality.google; connect-src 'self' https://script.google.com https://cloudflareinsights.com https://ep1.adtrafficquality.google; worker-src 'self' blob:; child-src 'self' blob:; frame-src https://script.google.com https://challenges.cloudflare.com https://googleads.g.doubleclick.net https://pagead2.googlesyndication.com https://ep2.adtrafficquality.google https://www.google.com/recaptcha/; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'
permissions-policy: geolocation=(), microphone=(), camera=(), payment=(), usb=(), midi=(), browsing-topics=()
referrer-policy: strict-origin-when-cross-origin
vary: accept-encoding
Server: cloudflare
cf-cache-status: DYNAMIC
Content-Encoding: br
CF-RAY: a5ef7af1f9c3c6da-KHI
```

## HTTP headers — `https://www.easyworktools.online/` (followed redirects)
```
HTTP/1.1 301 Moved Permanently
Date: Mon, 23 Nov 2026 10:27:15 GMT
Location: https://easyworktools.online/
X-Content-Type-Options: nosniff
Server: cloudflare
cf-cache-status: DYNAMIC
Strict-Transport-Security: max-age=15552000
CF-RAY: a5ef7af65eb65889-KHI

HTTP/1.1 200 OK (apex) — same headers as above
CF-RAY: a5ef7af82a50f3cf-KHI
```

## HTTP headers — `https://easyworktools.online/`
```
HTTP/1.1 200 OK
Date: Mon, 23 Nov 2026 10:27:15 GMT
Content-Type: text/html; charset=utf-8
Cache-Control: public, max-age=0, must-revalidate
Strict-Transport-Security: max-age=15552000
vary: accept-encoding
Server: cloudflare
cf-cache-status: DYNAMIC
Content-Encoding: br
CF-RAY: a5ef7af43a5852a1-KHI
```

## HTTP headers — selected paths
```
/robots.txt       200  text/plain; charset=utf-8
                  Cache-Control: public, max-age=14400, stale-while-revalidate=86400
                  cf-cache-status: HIT; Age: 102; Content-Encoding: br
                  CF-RAY: a5ef7afa4cd3c910-KHI
/sitemap.xml      200  application/xml; charset=utf-8
                  Cache-Control: public, max-age=3600, stale-while-revalidate=86400
                  cf-cache-status: DYNAMIC; Content-Encoding: br; vary: accept-encoding
                  CF-RAY: a5ef7afc49c86dd9-KHI
/assets/styles.css 200 text/css; charset=utf-8
                  Cache-Control: public, max-age=604800, stale-while-revalidate=86400
                  ETag: W/"5afc0ddcdc09d161a50c69fe66d386c7"
                  Content-Encoding: br; cf-cache-status: HIT; Age: 223437
                  CF-RAY: a5ef7d595a2ec6da-KHI
/assets/app.js    200  application/javascript
                  Cache-Control: public, max-age=604800, stale-while-revalidate=86400
                  ETag: W/"8b2ea673211c6ed8c53f6cdd4ce1200c"
                  Content-Encoding: br; cf-cache-status: HIT; Age: 176724
                  CF-RAY: a5ef7d5b8b1f24a3-KHI
/favicon.ico      200  image/vnd.microsoft.icon
                  Cache-Control: public, max-age=2592000, stale-while-revalidate=604800
                  ETag: W/"3db10fe71b306ed4fdf5297a0754aba4"
                  Content-Encoding: br; cf-cache-status: HIT; Age: 151892
                  CF-RAY: a5ef7d5d6cc824a3-KHI
/apple-touch-icon.png 200 image/png, Content-Length: 8703
                  Cache-Control: public, max-age=2592000, stale-while-revalidate=604800
                  ETag: "524a366fa51e2b0da392f55cf8ec63de"
                  cf-cache-status: MISS; CF-RAY: a5ef7d5f5f1c33af-KHI
/ads.txt          200  text/plain; charset=utf-8
                  Cache-Control: public, max-age=3600, stale-while-revalidate=86400
                  ETag: W/"41d9e127506ae11bc4ea67326192b72d"
                  cf-cache-status: DYNAMIC; Content-Encoding: br
                  CF-RAY: a5ef7d635b3aa81f-KHI
/.well-known/security.txt 200 — no Cache-Control observed; Content-Encoding: br
                  CF-RAY: a5ef7db1a9ae0048-KHI
```

## TLS handshake log (PowerShell SslStream)
```
Tls    => FAILED: Exception calling "AuthenticateAsClient" ... "A call to SSPI failed, see inner exception."
Tls11  => FAILED: same
Tls12  => OK negotiated=Tls12 certSubject=CN=easyworktools.online certIssuer=CN=WE1, O=Google Trust Services, C=US
Tls13  => OK negotiated=Tls13 certSubject=CN=easyworktools.online certIssuer=CN=WE1, O=Google Trust Services, C=US

apex cert: NotBefore 2026-11-17T04:04:59+05:00, NotAfter 2027-02-15T05:04:49+05:00
           Serial 00E99AB4B7037CF9B213FBA03DD952B027
           SHA256 CF5254687574A96C1480818F313E7DE644614241
           SAN DNS:easyworktools.online
www  cert: Subject CN=www.easyworktools.online, SAN DNS:www.easyworktools.online
           NotAfter 2027-02-15T05:35:48+05:00
```

## DNS log (Resolve-DnsName)
See `07-dns.md` for the structured record table. Notable raw values:
```
easyworktools.online. A     104.21.41.69, 172.67.189.199
easyworktools.online. AAAA  2606:4700:3031::6815:2945, 2606:4700:3037::ac43:bdc7
www.                  A/AAAA same two IPv4 + two IPv6
easyworktools.online. MX    route1.mx.cloudflare.net pref 69, route2 pref 66, route3 pref 96
easyworktools.online. TXT   v=spf1 include:_spf.mx.cloudflare.net ~all
_dmarc                 TXT   v=DMARC1; p=quarantine; pct=100; rua=mailto:info@easyworktools.online; fo=1
NS                          alex.ns.cloudflare.com, bonnie.ns.cloudflare.com
google-site-verification TXT <redacted>
```

## UA probe log
```
UA=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0 Safari/537.36 => HTTP/1.1 200 OK bytes=255067 labyrinthMarker=no
UA=GPTBot/1.2        => HTTP/1.1 403 Forbidden bytes=25 labyrinthMarker=no
UA=ClaudeBot/1.0     => HTTP/1.1 403 Forbidden bytes=25 labyrinthMarker=no
UA=PerplexityBot/1.0 => HTTP/1.1 403 Forbidden bytes=25 labyrinthMarker=no
UA=CCBot/2.0         => HTTP/1.1 403 Forbidden bytes=25 labyrinthMarker=no
```
Two temporary probe files were created at `F:\easyworktools.online\_tmp_headers.txt` and `F:\easyworktools.online\_tmp_body.html` and were removed after inspection. No workspace source file was modified.

## Additional spoofed-UA probes (2026-11-23)

| User-Agent | Status |
|---|---:|
| Googlebot | 200 |
| Bingbot | 200 |
| OAI-SearchBot | 200 |
| Claude-SearchBot | 200 |
| ChatGPT-User | 200 |
| Google-Extended | 200 |
| PerplexityBot | 403 |
| GPTBot | 403 |
| ClaudeBot | 403 |

These are spoofed-UA observations, not verified bot identities. Authenticated Cloudflare policy evidence is recorded in `05-security.md`.
