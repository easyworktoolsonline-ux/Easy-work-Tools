# 13 — Prioritized Roadmap

Items below are recommendations for owner decision. Nothing in this roadmap was executed unless explicitly stated elsewhere as completed.

## P0 — immediate, awaiting approval

1. **Deploy the single `index.html` CLS fix** to Cloudflare Pages project `easy-work-tools`, production branch `main`.
   - Final file hash: `7619EDE1A3002D844F8B0DA0C9B28E39040C56D30E7AE02C5B94BE4E4EFE9FBA`.
   - No other tracked content change.
2. **Verify deployment and monitor field CLS/LCP/INP** for at least 7 days.
   - Acceptance: category CLS ≤0.1 (stretch ≤0.05), LCP P75 <2.5 s, INP P75 <200 ms.
   - Do not claim field success before data exists.

## P1 — next, read-only first

3. **Classify the 291 “Discovered – currently not indexed” URLs** from GSC.
   - Group by template: tool, blog, category, static, legacy variant.
   - No deletion; consider internal linking and quality signals only after classification.
4. **Classify the 203 GSC 404s and 88 Ahrefs 404s**.
   - Determine whether they are legacy paths, malformed variants, or genuinely missing pages.
   - Preserve all existing redirects; no redirect removal without approval.
5. **Investigate 42.60% 4xx traffic** in Cloudflare analytics by path/status if the dashboard or logs permit.
   - No WAF/rate-limit change proposed without evidence.
6. **Review mobile snippet performance** for high-impression pages.
   - Mobile: 376 impressions, 1.9% CTR, position 5.7.
   - Titles/descriptions only after canonical verification; not part of this patch.

## P2 — later, evidence-dependent

7. **Evaluate HTML cache-rule feasibility** for TTFB tail reduction.
   - Requires explicit approval, purge/deploy planning, and confirmation HTML is not personalized.
8. **Develop the `webp to pdf` cluster** through on-page/internal-link review of existing pages.
   - GSC query at position 11.3; SEMrush 103 keywords, 6,220 volume, average KD 22.
9. **Request indexing for a small justified set only after fixes and canonical checks**, if approved.
   - Candidates: `/`, `/tools/mph-to-kph/`, `/blog/explain-it`, `/tools/webp-to-pdf/`.
10. **Continue monitoring AI crawler access and discoverability**.
    - No policy change proposed; search/AI search currently allowed, training/agents restricted by existing policy.
11. **Reassess third-party keyword/backlink data** once GSC has a larger sample.
    - Do not use SEMrush/Ahrefs estimates as KPIs.

## Explicitly not recommended as actions

- No page, tool, article, category, URL, slug, canonical, sitemap entry, or redirect deletion.
- No mass indexing request.
- No outreach, backlink purchase, paid placement, or disavow.
- No CAPTCHA integration or Turnstile setting change.
- No Cloudflare cache, SSL, WAF, DNS, or bot-policy change without separate justification and approval.
