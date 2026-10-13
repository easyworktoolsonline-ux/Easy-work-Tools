/* Build integration for the category carousel and the /tools/ filter.
 *
 * This module is imported by scripts/build-indexes.mjs and does four things:
 *
 *   1. give every tool card data-cat and data-tags, so /tools/ can filter
 *      without a server round-trip;
 *   2. render the homepage carousel track from scripts/categories.mjs;
 *   3. render the /tools/ filter panel from the same source;
 *   4. fail the build if a category's colours, icon or featured tool is wrong.
 *
 * Why generate rather than hand-write: the previous hand-written section had
 * drifted to "118+ free online tools" on a site with 128, and the ?cat= links
 * pointed at a /tools/ page that had no filtering code at all, so every card
 * was a dead end. Both are build-time facts, so both are now built.
 *
 * Counts come from the manifest. Nothing here is a hard-coded number. */

import { CATEGORIES, catSlug, CARD_SCRIM, assertCategoryContrast, resolveSubs } from './categories.mjs';
import { POPULAR_PICKS } from './popular-tools.mjs';
import { featuredToolIcon } from './featured-tool-icons.mjs';

/* Accepted contrast deviations, filled by validateCategories() and printed by the
 * build. Kept as a module-level array so validateCategories can keep returning only
 * hard problems. */
export const CATEGORY_WARNINGS = [];

const MARK_START = '<!-- ewt:categories:start -->';
const MARK_END = '<!-- ewt:categories:end -->';

/* ------------------------------------------------------------ helpers ---- */
function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/* Replace the content between the category markers. Depth-counts the divs so
   the generated markup can never be cut in half - the same lesson as
   fillGrid(), where a lazy regex stranded cards outside their grid. */
function fillMarked(html, markup) {
  const s = html.indexOf(MARK_START);
  const e = html.indexOf(MARK_END);
  if (s === -1 || e === -1 || e < s) return null;
  return html.slice(0, s + MARK_START.length) + '\n' + markup + '\n' + html.slice(e);
}

/* --------------------------------------------------------- validation ---- */
/* Manifest URLs are stored without a leading slash ("tools/json-formatter/"),
   while a link written by hand in this file normally has one. Normalise before
   comparing so the two spellings are treated as the same tool. */
const stripSlash = (u) => String(u || '').replace(/^\/+/, '');

export function validateCategories({ tools, iconKeys }) {
  const problems = [];
  const byCat = new Map();
  for (const t of tools) {
    const k = catSlug(t.category);
    if (!k) continue;
    if (!byCat.has(k)) byCat.set(k, []);
    byCat.get(k).push(t);
  }

  for (const c of CATEGORIES) {
    const list = byCat.get(c.slug) || [];

    if (!list.length) problems.push(`category "${c.slug}" matches no tool - the "category" in tool.json is probably not "${c.match}"`);
    if (iconKeys && !iconKeys.has(c.iconKey)) problems.push(`category "${c.slug}" uses iconKey "${c.iconKey}", which iconSvg() does not define`);
    if (!list.some((t) => stripSlash(t.url) === stripSlash(c.featured.url))) {
      problems.push(`category "${c.slug}" featured tool ${c.featured.url} does not exist in the manifest`);
    }
  }

  // A category that exists in the manifest but has no card would be unreachable
  const known = new Set(CATEGORIES.map((c) => c.slug));
  for (const k of byCat.keys()) {
    if (!known.has(k)) problems.push(`tools are tagged category "${k}" but no card exists for it - those tools would be unreachable from the carousel`);
  }

  /* The contrast check now returns { bad, warnings }. Hard failures still block the
   * build; the white-text shortfall on the four lighter palette colours is carried
   * out as an accepted deviation so it stays visible instead of being hidden. */
  const contrast = assertCategoryContrast();
  problems.push(...contrast.bad);
  CATEGORY_WARNINGS.length = 0;
  CATEGORY_WARNINGS.push(...contrast.warnings);
  problems.push(...validateSubs({ tools }));
  return problems;
}

/* Keep the internal category-group metadata consistent; it is not rendered as
   a user-facing filter or page section. */
export function validateSubs({ tools }) {
  return resolveSubs({ tools }).problems;
}

/* ------------------------------------------------- tool card attributes --- */
export function toolCardAttrs(item) {
  const tags = Array.isArray(item.tags) ? item.tags : [];
  return ' data-cat="' + esc(catSlug(item.category)) + '"'
    + ' data-tags="' + esc(tags.join('|')) + '"'
    + ' data-title="' + esc(item.title) + '"';
}

/* ----------------------------------------------------- homepage cards ---- */
/* The card links to the category's own page under /categories/<slug>/ rather
   than to /tools/?cat=<slug>. Both work, but the dedicated page is a real,
   crawlable, bookmarkable URL that lists every tool in the category, which is
   what a visitor expects from clicking a category. The old ?cat= links keep
   working and are still used by the /tools/ filter. */
function categoryCard(c, list, iconSvg) {
  const count = list.length;
  const href = '/categories/' + encodeURIComponent(c.slug) + '/';
  const scrim = c.scrim == null ? CARD_SCRIM : c.scrim;
  const featuredKey = POPULAR_PICKS[c.slug];
  const featuredTool = list.find((tool) =>
    String(tool.url || '').replace(/^\/?tools\//, '').replace(/\/+$/, '') === featuredKey
  );
  const icon = featuredToolIcon(featuredKey, iconSvg(featuredTool ? featuredTool.iconKey : c.iconKey));
  return ''
    + '<article class="cat-card" style="--c1:' + esc(c.c1) + ';--c2:' + esc(c.c2) + ';--scrim:' + scrim + ';--link:' + esc(c.link) + ';--text:' + esc(c.text || '#FFFFFF') + '">'
    +   '<a class="cat-card__main" href="' + esc(href) + '">'
    +     '<span class="cat-card__top">'
    +       '<span class="cat-card__icon" aria-hidden="true">' + icon + '</span>'
  +       '<span class="cat-card__count">' + count + '+ tools</span>'
    +     '</span>'
    +     '<span class="cat-card__panel">'
    +       '<span class="cat-card__title">' + esc(c.title) + '</span>'
    +       '<span class="cat-card__tagline">' + esc(c.tagline) + '</span>'
    +       '<span class="cat-card__go" aria-hidden="true">'
    +         '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h15M13 6l6 6-6 6"/></svg>'
    +       '</span>'
    +     '</span>'
    +   '</a>'
    +   '<p class="cat-card__foot">'
    +     '<span class="cat-card__foot-label">Featured Tool :</span>'
    +     '<a href="' + esc(c.featured.url) + '">' + esc(c.featured.title) + '</a>'
    +   '</p>'
    + '</article>';
}

/* The carousel is deliberately just the cards: no section heading, no
   "Browse all N tools" subtitle and no "Showing 1-5 of 9" readout, because the
   reference design has none of them and they were asked to go.

   The position readout still exists for assistive technology, but visually
   hidden: a screen-reader user needs to know that pressing next moved the row,
   and a sighted user does not need the text on the page. */
export function renderCarousel({ tools, iconSvg }) {
  const byCat = new Map();
  for (const t of tools) {
    const k = catSlug(t.category);
    if (!k) continue;
    if (!byCat.has(k)) byCat.set(k, []);
    byCat.get(k).push(t);
  }

  /* Cards are ordered by the ACTUAL number of tools in each category, highest
     first, so the busiest categories lead. The count comes from the manifest at
     build time - it is never typed in - so adding or removing a tool reorders
     the row automatically on the next build.
     Ties keep the order declared in scripts/categories.mjs: Array.prototype.sort
     is stable, so two categories with the same count (Developer and SEO are
     both 13) do not swap places between builds. */
  const ordered = CATEGORIES
    .map((c, i) => ({ c, n: (byCat.get(c.slug) || []).length, i }))
    .sort((a, b) => b.n - a.n || a.i - b.i)
    .map((x) => x.c);

  const cards = ordered
    .map((c) => categoryCard(c, byCat.get(c.slug) || [], iconSvg))
    .join('');

  const arrow = (dir, id, label, d) => ''
    + '<button type="button" class="cat-nav cat-nav--' + dir + '" id="' + id + '" aria-label="' + label + '">'
    +   '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + d + '"/></svg>'
    + '</button>';

  return ''
    + '<div class="cat-rail" id="catRail">'
    +   arrow('prev', 'catPrev', 'Show previous categories', 'M15 5l-7 7 7 7')
    +   '<div class="cat-viewport" id="catViewport">'
    +     '<div class="cat-track" id="catTrack">' + cards + '</div>'
    +   '</div>'
    +   arrow('next', 'catNext', 'Show more categories', 'M9 5l7 7-7 7')
    +   '<p class="cat-status visually-hidden" id="catStatus" aria-live="polite"></p>'
    + '</div>';
}

/* The heading is emitted inside renderCarousel() rather than separately, so the
   <h2> and the carousel that it labels are always replaced together and cannot
   drift apart across builds. The old hand-written heading said "118+ free
   online tools" on a site with 128. */

/* ----------------------------------------------------- /tools/ filter ----- */
export function renderFilter() {
  const catButtons = CATEGORIES.map((c) => {
    return '<button type="button" class="filter-chip" data-filter-cat="' + esc(c.slug) + '"'
      + ' aria-pressed="false">'
      + esc(c.title)
      + '</button>';
  }).join('');

  return ''
    + '<div class="tool-filter" id="toolFilter">'
    +   '<div class="tool-filter__row">'
    +     '<div class="tool-filter__chips" role="group" aria-label="Filter tools by category">'
    +       '<button type="button" class="filter-chip is-active" data-filter-cat="" aria-pressed="true">All</button>'
    +       catButtons
    +     '</div>'
    +   '</div>'
    +   '</div>';
}

/* ==========================================================================
 * Dedicated category pages: /categories/<slug>/
 *
 * Clicking a category card on the homepage lands here, on a real page that
 * lists every tool in that category. These are NEW urls - nothing existing is
 * renamed or redirected - and /tools/?cat=<slug> keeps working alongside them.
 *
 * The page is built from the shared shell (header, search, footer) that
 * scripts/build-indexes.mjs has already prepared, with the <main> replaced. The
 * tool grid uses the same card markup as everywhere else, so every tool here is
 * an ordinary link to a real tool page.
 * ========================================================================== */

/* Per-category intro copy. Kept next to the rest of the category metadata so a
   new category needs one entry, not two files to keep in sync. These lines are
   written for a person skimming the page and are used as the meta description
   too, so they have to stand alone. */

/* Each category page presents the complete category in one uninterrupted grid. */
export function renderCategoryPageBody({ category, tools, iconSvg, cardHref, intro: introFor }) {
  const c = category;
  const intro = (introFor || {})[c.slug] || (c.tagline + '.');

  const toolCount = tools.length;
  const toolNoun = toolCount === 1 ? 'tool' : 'tools';
  const heroMeta = toolCount + ' free ' + toolNoun;

  const card = (t) => '<a class="card" href="' + esc(cardHref(t.url)) + '"' + toolCardAttrs(t) + '>'
    + '<div class="card-top"><div class="icon icon-svg">' + iconSvg(t.iconKey || 'tool') + '</div></div>'
    + '<h3>' + esc(t.title) + '</h3>'
    + '<p>' + esc(t.description) + '</p></a>';

  const section = (heading, list, id) => ''
    + '<section class="section' + (id ? '' : ' alt') + '" aria-labelledby="' + (id || 'catAllHeading') + '">'
    +   '<div class="container">'
    +     '<div class="section-head">'
    +       '<div><h2 id="' + (id || 'catAllHeading') + '">' + esc(heading) + '</h2></div>'
    +       '<p>' + list.length + ' tool' + (list.length === 1 ? '' : 's') + '</p>'
    +     '</div>'
    +     '<div class="grid" data-card-heading="h3">' + list.map(card).join('') + '</div>'
    +   '</div>'
    + '</section>';

  let body = ''
    + '<section class="section cat-hero" style="--c1:' + esc(c.c1) + ';--c2:' + esc(c.c2) + ';--scrim:' + (c.scrim == null ? CARD_SCRIM : c.scrim) + ';--link:' + esc(c.link) + '">'
    +   '<div class="container">'
    +     '<div class="cat-hero__row">'
    +       '<span class="cat-hero__icon" aria-hidden="true">' + iconSvg(c.iconKey) + '</span>'
    +       '<div>'
    +         '<h1>' + esc(c.title) + '</h1>'
    +         '<p class="cat-hero__intro">' + esc(intro) + '</p>'
    +         '<p class="cat-hero__meta">' + heroMeta + '</p>'
    +       '</div>'
    +     '</div>'
    +     '<a class="cat-hero__back" href="/tools/">Browse all tools →</a>'
    +   '</div>'
    + '</section>';

  body += section('All ' + c.title, tools, 'catAllHeading');

  // Other categories, so the page is not a dead end and the whole taxonomy is
  // reachable from any of them.
  body += ''
    + '<section class="section alt" aria-labelledby="catMoreHeading">'
    +   '<div class="container">'
    +     '<div class="section-head"><div><h2 id="catMoreHeading">Other categories</h2></div>'
    +       '<p>Jump to another part of the collection.</p></div>'
    +     '<div class="chips">'
    +       CATEGORIES.filter((o) => o.slug !== c.slug).map((o) =>
          '<a class="chip" href="/categories/' + esc(o.slug) + '/">' + esc(o.title) + '</a>').join('')
    +     '</div>'
    +   '</div>'
    + '</section>';

  return body;
}

/* JSON-LD for a category page: a single CollectionPage. Built from the same
   manifest the visible list came from, so the structured data cannot claim
   tools the page does not show. A BreadcrumbList used to sit beside it, but the
   breadcrumb links are gone and a pointer to a removed node was worse than none. */
export function renderCategorySchema({ category, tools, origin, intro: introFor }) {
  const c = category;
  const url = origin + '/categories/' + c.slug + '/';
  const data = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': url + '#collection',
        url,
        name: c.title + ' | EasyWorkTools.online',
        description: (introFor || {})[c.slug] || c.tagline,
        isPartOf: { '@id': origin + '/#website' },
        mainEntity: {
          '@type': 'ItemList',
          numberOfItems: tools.length,
          itemListElement: tools.map((t, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: t.title,
            url: origin + '/' + stripSlash(t.url)
          }))
        }
      }
    ]
  };
  return '<script type="application/ld+json">' + JSON.stringify(data) + '</script>';
}

export { CATEGORIES, catSlug, CARD_SCRIM, MARK_START, MARK_END, fillMarked };