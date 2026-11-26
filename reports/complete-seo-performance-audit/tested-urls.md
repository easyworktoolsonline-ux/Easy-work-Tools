# Tested URLs

All URLs are EasyWorkTools.online only. Tests were read-only.

## Browser + Lighthouse (6 URLs)

| URL | Result |
|---|---|
| `https://easyworktools.online/` | 200; self-canonical; index,follow; H1 present; 2 JSON-LD; Lighthouse A/BP/SEO 1/1/1; 2 third-party ad console errors |
| `https://easyworktools.online/categories/image/` | 200; self-canonical; index,follow; Lighthouse 1/1/1; no console errors |
| `https://easyworktools.online/tools/json-formatter/` | 200; self-canonical; index,follow; 3 JSON-LD; Lighthouse 1/1/1; no console errors |
| `https://easyworktools.online/tools/mph-to-kph/` | 200; self-canonical; index,follow; 3 JSON-LD; Lighthouse 1/1/1; no console errors |
| `https://easyworktools.online/blog/mph-to-kph-explained` | 200; self-canonical; index,follow; 3 JSON-LD; Lighthouse 1/1/1; no console errors |
| `https://easyworktools.online/about` | 200; self-canonical; index,follow; 2 JSON-LD; Lighthouse 1/1/1; no console errors |

## Live HTTP / redirect / crawl-file checks

| URL | Expected | Result |
|---|---|---|
| `http://easyworktools.online/` | 301 → HTTPS 200 | Pass |
| `https://www.easyworktools.online/` | 301 → apex 200 | Pass |
| `https://easyworktools.online/robots.txt` | 200, Cloudflare managed + repo rules | Pass |
| `https://easyworktools.online/sitemap.xml` | 200, 392 URLs, hash match | Pass |
| `https://easyworktools.online/tools/` | 200 | Pass |
| `https://easyworktools.online/blog/` | 200 | Pass |
| `https://easyworktools.online/privacy`, `/cookies`, `/disclaimer`, `/terms`, `/contact`, `/security` | 200 | Pass |
| `https://easyworktools.online/index.html` | 301 → `/` | Pass |
| `https://easyworktools.online/categories` | 301 → `/tools/` | Pass |
| `https://easyworktools.online/tools/jpg-pdf-converter` | 301 → `/tools/jpg-to-pdf/` | Pass |
| `https://easyworktools.online/nonexistent-test-page` | Custom 404 | Pass |
| `https://easyworktools.online/llms.txt` | 200 | Pass |
| `https://easyworktools.online/ai-catalog.json` | 200 | Pass |

## Spoofed user-agent probes (homepage)

| UA | Status |
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

Spoofed UA results are context only, not bot identity verification.

## Controlled local CLS harness

| URL | Purpose |
|---|---|
| `http://127.0.0.1:8798/before.html` | Backup `index.html`, delayed categories.css |
| `http://127.0.0.1:8798/after.html` | Patched `index.html`, delayed categories.css |

Result: category CLS 0.9372985622476797 → 0.03352221662359241.
