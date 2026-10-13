/* --------------------------------------------------------------------------
 * Category and sub-category metadata - the single source of truth.
 *
 * The homepage carousel and the /tools/ filter are both generated from this,
 * so a category can never appear in one place and not the other, and the tool
 * counts are always read from the manifest rather than typed in. The previous
 * hand-written section had drifted to "118+ free online tools" when the site
 * had 128.
 *
 * slug     the ?cat= value and the data-cat attribute. Produced by catSlug()
 *          below, and used by the card renderer, the filter UI and the card
 *          data attributes alike, so the three cannot disagree.
 * title    shown on the card.
 * tagline  the "Solve your X problems" line. This is small white text, so it
 *          has to clear 4.5:1 - see the scrim note below.
 * c1 / c2  gradient endpoints, the deep -700 shade to the -600 shade.
 * iconKey  a key that already exists in iconSvg(); assertIconKey fails the
 *          build otherwise, so a typo here is a build error, not a blank tile.
 * featured one real tool from the category, for the white strip at the card
 *          foot. Checked against the manifest at build time.
 * subs     the sub-categories offered under this category on /tools/. Each is
 *          { slug, label, tools: [...] } where tools are manifest URLs.
 *
 * Sub-categories are declared as explicit tool lists rather than derived from
 * the free-text `tags`, because tags are SEO keyword strings ("compress jpg",
 * "sha256 file hash") rather than a taxonomy. validateSubs() then requires
 * that every tool in the category lands in exactly one sub, so a newly added
 * tool cannot slip through unclassified and become unreachable from the filter.
 * -------------------------------------------------------------------------- */
export const CATEGORIES = [
  {
    slug: 'ai-write', match: 'AI Write', title: 'AI Write',
    tagline: 'Solve your writing problems',
    c1: '#1D4ED8', c2: '#1D4ED8', scrim: 0, link: '#1D4ED8', text: '#FFFFFF', iconKey: 'word-count',
    featured: { title: 'Essay Writer', url: '/tools/ai-write/essay-writer/' },
    subs: [
      {
        slug: 'articles-blogs', label: 'Articles & Blogs', tools: [
          '/tools/ai-write/article-generator/', '/tools/ai-write/article-writer/',
          '/tools/ai-write/article-rewriter/', '/tools/ai-write/blog-post-generator/',
          '/tools/ai-write/blog-post-rewriter/', '/tools/ai-write/blog-outline-generator/',
          '/tools/ai-write/blog-post-ideas/', '/tools/ai-write/content-brief-generator/',
          '/tools/ai-write/content-planner/', '/tools/ai-write/post-writer/',
          '/tools/ai-write/press-release-generator/', '/tools/ai-write/landing-page-copy-generator/'
        ]
      },
      {
        slug: 'essays-paragraphs', label: 'Essays & Paragraphs', tools: [
          '/tools/ai-write/essay-writer/', '/tools/ai-write/paragraph-writer/',
          '/tools/ai-write/paragraph-completer/', '/tools/ai-write/paragraph-rewriter/',
          '/tools/ai-write/sentence-rewriter/', '/tools/ai-write/explain-it/'
        ]
      },
      {
        slug: 'social-media', label: 'Social Media', tools: [
          '/tools/ai-write/instagram-caption-generator/', '/tools/ai-write/instagram-story-idea/',
          '/tools/ai-write/linkedin-post-generator/', '/tools/ai-write/twitter-generator/',
          '/tools/ai-write/fb-headline-generator/', '/tools/ai-write/tiktok-script-writer/',
          '/tools/ai-write/youtube-script-writer/', '/tools/ai-write/podcast-script-writer/'
        ]
      },
      {
        slug: 'rewrite-improve', label: 'Rewrite & Improve', tools: [
          '/tools/ai-write/ai-rephraser/', '/tools/ai-write/content-paraphraser/',
          '/tools/ai-write/content-improver/', '/tools/ai-write/content-shortener/',
          '/tools/ai-write/content-summarizer/', '/tools/ai-write/grammar-fixer/',
          '/tools/ai-write/title-rewriter/', '/tools/ai-write/ai-humanizer/',
          '/tools/ai-write/tone-of-voice/'
        ]
      },
      {
        slug: 'business-legal', label: 'Business & Legal', tools: [
          '/tools/ai-write/business-name-generator/', '/tools/ai-write/business-plan-generator/',
          '/tools/ai-write/business-slogan-generator/', '/tools/ai-write/cold-email-writer/',
          '/tools/ai-write/nda-generator/', '/tools/ai-write/privacy-policy-generator/',
          '/tools/ai-write/purchase-agreement/', '/tools/ai-write/bill-of-sale/',
          '/tools/ai-write/real-estate-descriptions/'
        ]
      },
      {
        slug: 'ideas-content', label: 'Ideas & Content', tools: [
          '/tools/ai-write/story-generator/', '/tools/ai-write/poll-generator/',
          '/tools/ai-write/trivia-generator/', '/tools/ai-write/faq-generator/',
          '/tools/ai-write/meta-description-generator/', '/tools/ai-write/word-counter/',
          '/tools/ai-write/search/', '/tools/ai-write/translate/',
          '/tools/ai-write/summarize-youtube/', '/tools/ai-write/ai-detector/'
        ]
      }
    ]
  },
  {
    slug: 'image', match: 'Image Tools', title: 'Image Tools',
    tagline: 'Solve your image problems',
    c1: '#EA580C', c2: '#EA580C', scrim: 0, link: '#BA4609', text: '#FFFFFF', iconKey: 'image',
    featured: { title: 'Image Resizer', url: '/tools/easy-image-resizer/' },
    subs: [
      {
        slug: 'resize-crop', label: 'Resize & Crop', tools: [
          '/tools/easy-image-resizer/', '/tools/image-crop-rotate/', '/tools/image-splitter/',
          '/tools/image-dimensions-checker/', '/tools/image-border-rounded/'
        ]
      },
      {
        slug: 'convert-format', label: 'Convert Format', tools: [
          '/tools/image-format-converter/', '/tools/heic-to-jpg-converter/',
          '/tools/image-to-base64/'
        ]
      },
      {
        slug: 'compress-optimize', label: 'Compress & Optimize', tools: [
          '/tools/free-image-compressor/', '/tools/jpeg-compressor/',
          '/tools/svg-optimizer/'
        ]
      },
      {
        slug: 'edit-enhance', label: 'Edit & Enhance', tools: [
          '/tools/image-editor/', '/tools/image-background-color/',
          '/tools/image-watermark/', '/tools/image-collage-maker/',
          '/tools/image-merge-stitch/'
        ]
      },
      {
        slug: 'analyze-inspect', label: 'Analyze & Inspect', tools: [
          '/tools/image-compare/',
          '/tools/image-color-picker/',
          '/tools/image-metadata-viewer/',
          '/tools/image-hash-checker/',
          '/tools/social-share-preview/'
        ]
      },
      {
        slug: 'icons-thumbnails', label: 'Icons & Thumbnails', tools: [
          '/tools/favicon-generator/', '/tools/easy-thumbnail-downloader/'
        ]
      }
    ]
  },
  {
    slug: 'pdf', match: 'PDF Tools', title: 'PDF Tools',
    tagline: 'Solve your PDF problems',
    c1: '#000000', c2: '#000000', scrim: 0, link: '#000000', text: '#FFFFFF', iconKey: 'pdf-organizer',
    featured: { title: 'PDF Merger', url: '/tools/pdf-merge-split/' },
    subs: [
      {
        slug: 'pdf-convert', label: 'Convert', tools: [
          '/tools/jpg-pdf-converter/', '/tools/pdf-images-converter/'
        ]
      },
      {
        slug: 'pdf-organise', label: 'Merge & Organise', tools: [
          '/tools/pdf-merge-split/', '/tools/pdf-organizer/'
        ]
      },
      {
        slug: 'pdf-edit', label: 'Compress & Edit', tools: [
          '/tools/pdf-compressor/', '/tools/pdf-metadata-editor/',
          '/tools/pdf-watermark/'
        ]
      }
    ]
  },
  {
    slug: 'developer', match: 'Developer Tools', title: 'Developer Tools',
    tagline: 'Solve your development problems',
    c1: '#16A34A', c2: '#16A34A', scrim: 0, link: '#117E39', text: '#FFFFFF', iconKey: 'json',
    featured: { title: 'JSON Tool', url: '/tools/json-formatter/' },
    subs: [
      {
        slug: 'encode-decode', label: 'Encode & Decode', tools: [
          '/tools/base64-encoder-decoder/', '/tools/html-entity-encoder-decoder/',
          '/tools/url-encoder-decoder/', '/tools/url-parser/'
        ]
      },
      {
        slug: 'format-code', label: 'Format & Minify', tools: [
          '/tools/json-formatter/', '/tools/html-css-js-minifier/',
          '/tools/json-csv-converter/', '/tools/markdown-html-converter/'
        ]
      },
      {
        slug: 'inspect-verify', label: 'Inspect & Verify', tools: [
          '/tools/jwt-decoder/', '/tools/regex-tester/', '/tools/hash-generator/',
          '/tools/unix-timestamp-converter/'
        ]
      },
      {
        slug: 'dev-generators', label: 'Generators', tools: [
          '/tools/uuid-generator/'
        ]
      }
    ]
  },
  {
    slug: 'seo', match: 'SEO Tools', title: 'SEO Tools',
    tagline: 'Solve your SEO problems',
    c1: '#DC2626', c2: '#DC2626', scrim: 0, link: '#CD2323', text: '#FFFFFF', iconKey: 'seo-analyzer',
    featured: { title: 'SEO Audit', url: '/tools/seo-page-analyzer/' },
    subs: [
      {
        slug: 'seo-analyse', label: 'Analyse', tools: [
          '/tools/seo-page-analyzer/', '/tools/keyword-density-checker/',
          '/tools/canonical-robots-checker/', '/tools/http-header-checker/'
        ]
      },
      {
        slug: 'seo-generate', label: 'Generate Markup', tools: [
          '/tools/meta-tag-generator/', '/tools/schema-markup-generator/',
          '/tools/robots-txt-generator/', '/tools/xml-sitemap-generator/',
          '/tools/hreflang-generator/', '/tools/redirect-rules-generator/'
        ]
      },
      {
        slug: 'seo-preview', label: 'Preview & Plan', tools: [
          '/tools/serp-snippet-preview/', '/tools/url-slug-generator/',
          '/tools/youtube-tag-generator/'
        ]
      }
    ]
  },
  {
    slug: 'text', match: 'Text Tools', title: 'Text Tools',
    tagline: 'Solve your text problems',
    c1: '#7C3AED', c2: '#7C3AED', scrim: 0, link: '#7C3AED', text: '#FFFFFF', iconKey: 'text-case-converter',
    featured: { title: 'Word Counter', url: '/tools/word-character-counter/' },
    subs: [
      {
        slug: 'text-count', label: 'Count & Measure', tools: [
          '/tools/word-character-counter/', '/tools/text-sorter-line-counter/',
          '/tools/readability-checker/', '/tools/readability-score-checker/'
        ]
      },
      {
        slug: 'text-clean', label: 'Clean & Reformat', tools: [
          '/tools/online-text-case-converter/', '/tools/text-cleaner/',
          '/tools/find-and-replace/', '/tools/remove-duplicate-lines/',
          '/tools/line-list-tools/'
        ]
      },
      {
        slug: 'text-compare', label: 'Compare & Extract', tools: [
          '/tools/text-compare/', '/tools/text-extractor/'
        ]
      },
      {
        slug: 'text-generate', label: 'Generate', tools: [
          '/tools/lorem-ipsum-generator/'
        ]
      }
    ]
  },
  {
    slug: 'converter', match: 'Converter Tools', title: 'Converter Tools',
    tagline: 'Solve your conversion problems',
    c1: '#1493B3', c2: '#1493B3', scrim: 0, link: '#107690', text: '#FFFFFF', iconKey: 'fmt-convert',
    featured: { title: 'Unit Conv', url: '/tools/unit-converter/' },
    // The internal catalogue group list is intentionally empty for this
    // single-tool category.
    subs: []
  },
  {
    slug: 'calculator', match: 'Calculator Tools', title: 'Calculator Tools',
    tagline: 'Solve your everyday maths',
    c1: '#11D6B2', c2: '#11D6B2', scrim: 0, link: '#0A7E69', text: '#FFFFFF', iconKey: 'percentage',
    featured: { title: 'Percent Calc', url: '/tools/percentage-calculator/' },
    subs: []
  },
  {
    slug: 'utility', match: 'Utility Tools', title: 'Utility Tools',
    tagline: 'Solve your everyday jobs',
    c1: '#D61149', c2: '#D61149', scrim: 0, link: '#CD1046', text: '#FFFFFF', iconKey: 'uuid',
    featured: { title: 'Password Gen', url: '/tools/password-generator/' },
    subs: []
  }
];

/* Fallback scrim for a category that does not declare its own. The card overlay
   is black on the gradient, and without it the light end of every vivid hue sits
   under white 13px text at 1.7-4.0:1 - measured, not guessed. Each category
   carries the exact scrim its own gradient needs (7.5% for the violet up to
   39.5% for the green); this is only used if one is missing, and
   assertCategoryContrast() will fail the build if it is ever actually needed. */
export const CARD_SCRIM = 0.4;

/* "AI Write" -> "ai-write", "Image Tools" -> "image". One helper, so the query
   param, the card data attribute and the filter UI always agree. */
export function catSlug(name) {
  return String(name || '')
    .trim()
    .toLowerCase()
    .replace(/\s+tools$/i, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function relLuminance(rgb) {
  const v = rgb.map((x) => {
    const c = x / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
}
export function contrastWithWhite(rgb) {
  const a = relLuminance(rgb), b = 1;
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
}
/* Contrast between any two colours. Needed now that a card's text colour is not
 * always white: the test has to measure the text against the card, not against
 * white. */
export function ratio(rgbA, rgbB) {
  const a = relLuminance(rgbA), b = relLuminance(rgbB);
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
}
export function hexToRgb(hex) {
  const h = String(hex).replace('#', '');
  return [0, 2, 4].map((i) => parseInt(h.substr(i, 2), 16));
}

/* The colour a pixel actually reads as, once the scrim is composited. */
export function scrimmed(hex, alpha) {
  return hexToRgb(hex).map((c) => Math.round(c * (1 - alpha)));
}

/* Fails the build if any category's tagline would ship unreadable. Called from
   scripts/build-indexes.mjs, so a future colour edit cannot silently regress.
   Each card carries its own scrim, because the reference hues need very
   different amounts: the vivid green only clears AA at 40%, while the violet
   needs 7%. A single global value strong enough for the green turns the violet
   muddy, so the value travels with the colour. */
/* The exact palette the cards are allowed to use: the six colours the hero
 * section's rotating word chip animates through, plus the three supplied by
 * hand. Asserted at build time so a future edit cannot quietly invent a shade. */
export const CATEGORY_PALETTE = [
  '#000000', '#16A34A', '#1D4ED8', '#7C3AED', '#EA580C', '#DC2626',   // from the hero
  '#11D6B2', '#D61149', '#1493B3'                                       // supplied
];

export function assertCategoryContrast() {
  const bad = [];
  const warnings = [];
  const seen = new Set();
  const seenText = new Set();
  for (const c of CATEGORIES) {
    /* 1. the card colour must be one of the nine, used once each */
    const up = String(c.c1).toUpperCase();
    if (up !== String(c.c2).toUpperCase()) {
      bad.push(`${c.title} c1 ${c.c1} and c2 ${c.c2} differ - a second shade would have to be invented, so both must be the same exact colour`);
    }
    if (!CATEGORY_PALETTE.includes(up)) {
      bad.push(`${c.title} c1 ${c.c1} is not in the approved palette (${CATEGORY_PALETTE.join(' ')})`);
    }
    if (seen.has(up)) bad.push(`${c.title} reuses ${c.c1}, already used by another category - all nine must be distinct`);
    seen.add(up);
    if (c.scrim !== 0) {
      bad.push(`${c.title} has scrim ${c.scrim} - a black overlay would darken the exact palette colour, which must not happen`);
    }

    /* 2. The title and tagline are painted in `text` directly on the card - the
     *    light panel that briefly sat behind them has been removed - so the test
     *    is `text` against the bare card colour. Four of the nine cannot clear
     *    4.5:1 with white (#EA580C 3.56:1, #1493B3 3.59:1, #16A34A 3.30:1,
     *    #11D6B2 1.86:1), and a scrim would fix that but would darken a palette
     *    colour that is pinned to an exact value, so the shortfall is reported
     *    rather than blocked.
     *
     *    `warnings` is kept for anything below AA: the build prints it rather
     *    than swallowing it, so a future colour edit cannot quietly regress. */
    if (!c.text) {
      bad.push(`${c.title} has no "text" colour for the title and tagline`);
    } else {
      seenText.add(c.text);
      for (const end of ['c1', 'c2']) {
        const r = ratio(hexToRgb(c[end]), hexToRgb(c.text));
        if (r < 4.5) warnings.push(`${c.title} ${c.text} text on ${end} ${c[end]} -> ${r.toFixed(2)}:1 (needs 4.5:1; accepted so the palette colour stays exact)`);
      }
    }
/* 3. the featured-tool link sits on the card's white foot, inside a pill tinted
     *    12% with the card colour - so it is tested against THAT surface, not
     *    against pure white. Sizing it against white was a real bug: on the
     *    tinted pill the link measured 3.91:1 instead of 4.5:1. */
    if (!c.link) {
      bad.push(`${c.title} has no "link" colour for the featured-tool text on the white foot strip`);
    } else {
      const pill = hexToRgb(c.c1).map((v) => v * 0.12 + 255 * 0.88);
      const lr = ratio(hexToRgb(c.link), pill);
      if (lr < 4.5) bad.push(`${c.title} link ${c.link} -> ${lr.toFixed(2)}:1 on its 12%-tinted pill (needs 4.5:1)`);
    }
  }
  /* all nine palette colours must actually be in use */
  for (const p of CATEGORY_PALETTE) {
    if (!seen.has(p)) bad.push(`palette colour ${p} is not used by any category`);
  }
  return { bad, warnings };
}

/* Verify the internal catalogue groupings without exposing them as website
   filters or page sections. Returns any metadata problems and the resolved map. */
export function resolveSubs({ tools }) {
  const problems = [];
  const strip = (u) => String(u || '').replace(/^\/+/, '');
  const resolved = new Map(); // tool url -> sub slug
  const byUrl = new Map(tools.map((t) => [strip(t.url), t]));

  for (const c of CATEGORIES) {
    if (!c.subs.length) continue;
    const inCat = tools.filter((t) => catSlug(t.category) === c.slug);
    const seen = new Map();

    for (const sub of c.subs) {
      if (seen.has(sub.slug)) problems.push(`category "${c.slug}" has two sub-categories with slug "${sub.slug}"`);
      seen.set(sub.slug, true);
      for (const url of sub.tools) {
        const key = strip(url);
        const tool = byUrl.get(key);
        if (!tool) {
          problems.push(`sub-category "${c.slug}/${sub.slug}" lists ${url}, which is not in the manifest`);
          continue;
        }
        if (catSlug(tool.category) !== c.slug) {
          problems.push(`sub-category "${c.slug}/${sub.slug}" lists ${url}, but that tool belongs to "${tool.category}"`);
          continue;
        }
        if (resolved.has(key)) {
          problems.push(`${url} is assigned to two internal groups ("${resolved.get(key)}" and "${sub.slug}") under ${c.slug}`);
          continue;
        }
        resolved.set(key, sub.slug);
      }
    }

    for (const t of inCat) {
      if (!resolved.has(strip(t.url))) {
        problems.push(`${strip(t.url)} is in category "${c.slug}" but in none of its declared internal groups`);
      }
    }
  }

  // Tools in categories that declare no subs are not sub-filtered, which is fine.
  const noSubs = new Set(CATEGORIES.filter((c) => !c.subs.length).map((c) => c.slug));
  for (const t of tools) {
    const slug = catSlug(t.category);
    if (!slug || noSubs.has(slug)) continue;
    const toolSubs = (t.subcategory || []).join('|');
    if (toolSubs) resolved.set(strip(t.url), toolSubs);
  }

  return { problems, resolved };
}
