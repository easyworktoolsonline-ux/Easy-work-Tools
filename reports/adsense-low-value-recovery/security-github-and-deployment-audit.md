# Sanitized GitHub and deployment audit

Date: 2026-11-27

Overall status: PARTIAL

## Scope

- Repository: `easyworktoolsonline-ux/Easy-work-Tools`, branch `main`.
- Local audit only; remote URL is redacted in this report.
- No other repository, including any GlobeCareer.online repository, was accessed or modified.
- No deployment, DNS, Cloudflare, branch-protection or visibility change was made.

| ID | Check | Result | FinalStatus |
|---|---|---|---|
| G01 | Repository identity | `easyworktoolsonline-ux/Easy-work-Tools`; branch `main`; remote `origin` configured. | DONE |
| G02 | Commit history | 49 commits found in local history at audit time. Full history was not rewritten. | DONE |
| G03 | Embedded remote credentials | No username, token or password embedded in the remote URL. | DONE |
| G04 | GitHub Actions workflows | 0 tracked files under `.github/`; no workflow was added or modified. | DONE |
| G05 | Baseline repository state | Local `HEAD` and `origin/main` matched at `9c31fdd5f4f596d594dd3c541d3dae486cd7aabc` before this remediation pass. | DONE |
| G06 | Unrelated untracked files | `metadata.json`, `server.ts`, `src/`, `tsconfig.json` and `vite.config.ts` were preserved and excluded from the intended commit set. | DONE |
| G07 | GitHub visibility | Not inspected via authenticated owner session; no visibility change was made. | DATA UNAVAILABLE |
| G08 | Collaborators and branch protections | Not inspected via authenticated owner session. | DATA UNAVAILABLE |
| G09 | Cloudflare dashboard rules | Not inspected; only live redirect and header behaviour was observed. | BLOCKED - WAITING FOR OWNER |
| G10 | Deployment state | No deployment or build was triggered from the live tree; an isolated generator build was used earlier. | DONE |

## Live behaviour observed without dashboard access

- HTTP and `www` variants redirect to canonical HTTPS non-`www`; paths and query strings are preserved; no loop was observed.
- Live framing headers include `X-Frame-Options: DENY` and a report-only CSP with `frame-ancestors 'none'`, which explains why live iframe QA could not render the site.
- No Cloudflare rule, DNS record or deployment setting was changed.

## Owner actions required

1. Confirm repository visibility and whether the repository should remain public.
2. Review collaborators and branch protection on `main`.
3. Review Cloudflare WAF/page rules and the report-only CSP before enabling enforcement.
4. Deploy the committed changes through the normal deployment pipeline and recheck live meta descriptions and tool behaviour.

Overall status is PARTIAL because owner-only GitHub and Cloudflare inspection remains unavailable.
