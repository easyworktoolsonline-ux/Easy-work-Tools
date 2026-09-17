# EasyWorkTools.online

Static GitHub Pages utility website with automated tool/blog indexing and deployment.

## Add a new tool

Create a folder under `tools/`:

```text
tools/your-tool-slug/
├── index.html
└── tool.json
```

`tool.json` is optional, but recommended:

```json
{
  "title": "Your Tool Name",
  "description": "A clear, useful description of the tool.",
  "iconKey": "tool",
  "tags": ["keyword one", "keyword two"]
}
```

Then commit and push to `main`. The GitHub Actions workflow runs the build, regenerates the tool/blog manifests and sitemap, and deploys the site to GitHub Pages.

## Add a blog post

Create `blog/your-post.html` with a normal HTML page and a useful meta description. The build automatically includes it in the blog manifest and sitemap.

## AdSense setup

This repository contains reserved ad placements and an `ads/head.html` placeholder. Do not invent or paste placeholder publisher IDs. After Google AdSense approves the site, copy the exact Google-provided code into the appropriate location and follow Google's current setup instructions.

If AdSense provides an `ads.txt` line, paste the exact line from your AdSense account into the root `ads.txt` file. The example in this repository is intentionally commented out and is not a valid publisher ID.

For users in the EEA, UK and Switzerland, configure Google's Privacy & Messaging / certified CMP requirements before serving personalized ads where applicable.

## Important launch checks

- Site is live on the custom domain and HTTPS works.
- Navigation and search work on desktop and mobile.
- Privacy Policy, Cookie Policy, Disclaimer, Terms and Contact pages are reachable.
- Contact email is correct: EasyWorkTools.online@gmail.com
- Tools contain original, useful functionality and explanatory content.
- Blog posts are original and genuinely useful; avoid scraped or thin content.
- Add the real AdSense publisher code only after Google provides it.
- Add the exact AdSense `ads.txt` publisher line after it is provided in the AdSense account.

## Build locally

```bash
npm install
npm run build
```

The build is designed to be repeatable: generated search data and AdSense markers are removed/rebuilt cleanly on subsequent runs.
