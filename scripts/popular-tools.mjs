/* --------------------------------------------------------------------------
 * "Our Most Popular Tools" - the category tab bar and homepage selections.
 *
 * This is the single source of truth for the tab bar. The homepage grid, the
 * data island the tabs switch between, and the build-time checks all read from
 * here, so a tab can never offer a category the grid cannot fill.
 *
 * WHY THERE IS NO "POPULAR" RANKING IN THE DATA
 * ---------------------------------------------
 * tools-manifest.json carries only title, description, url, iconKey, tags and
 * category. There is no traffic, view or conversion figure anywhere in the
 * project, so nothing here is a measured popularity ranking and nothing claims
 * to be. POPULAR_PICKS is an EDITORIAL pick - one well-known tool per category -
 * and it is declared explicitly rather than derived, so it is reviewable and
 * stable instead of silently reordering whenever the manifest changes.
 *
 * Six of the nine picks are already the `featured` tool that categories.mjs
 * declares for that category, so this reuses the site's existing editorial
 * judgement rather than inventing a second, conflicting one. Only Calculator
 * and Converter had no declared featured tool, so a pick was added for each.
 *
 * THE SIXTEEN ALL-TOOLS SLOTS ARE ALWAYS FULL
 * ------------------------------
 * The All Tools grid must always show exactly 16 cards. A category with fewer than 16 of
 * its own (PDF has 7, Calculator and Utility 2 each, Converter 1) is topped up
 * from outside that category, so the row never ends ragged:
 *   1. the category's own tools, curated pick first, then manifest order
 *   2. then the other categories' curated picks, largest category first
 *   3. then anything still missing, largest category first
 * Every step skips a tool already on screen, so a URL never appears twice.
 * ------------------------------------------------------------------------ */

import { CATEGORIES } from './categories.mjs';

/* One curated tool per category, keyed by the category slug. */
export const POPULAR_PICKS = {
  'ai-write': 'ai-write/essay-writer',
  'image': 'easy-image-resizer',
  'pdf': 'pdf-merge-split',
  'developer': 'json-formatter',
  'seo': 'seo-page-analyzer',
  'text': 'online-text-case-converter',
  'converter': 'unit-converter',
  'calculator': 'age-calculator',
  'utility': 'password-generator'
};

export const ALL_TAB = 'all';
export const CARD_SLOTS = 16;

/* The tab bar: All Tools first, then every category in declaration order. */
export function buildTabs() {
  return [{ id: ALL_TAB, title: 'All Tools', slug: ALL_TAB, iconKey: null }]
    .concat(CATEGORIES.map(c => ({ id: c.slug, title: c.title, slug: c.slug, iconKey: c.iconKey })));
}

/* URL-safe key for a manifest url: "tools/pdf/merge-split/" -> "pdf/merge-split" */
export function toolKey(url) {
  return String(url || '').replace(/^tools\//, '').replace(/^\/+|\/+$/g, '');
}

/* How many tools each category holds, keyed by the category SLUG so it lines up
 * with `groups` below. The manifest stores display titles ("PDF Tools") while
 * the cards store slugs ("pdf"), so the title is normalised on the way in. */
function categorySizes(tools, byTitle) {
  const sizes = new Map();
  for (const t of tools) {
    const k = categoryOf(t, byTitle);
    if (!k) continue;
    sizes.set(k, (sizes.get(k) || 0) + 1);
  }
  return sizes;
}

/* The category a tool belongs to, mapped onto the CATEGORIES slug via catSlug
 * semantics: the manifest stores the display title ("PDF Tools"), the cards
 * store the slug ("pdf"). Both sides are normalised the same way here. */
export function categoryOf(tool, byTitle) {
  return byTitle.get(tool.category) || null;
}

/* Builds title -> slug lookup from CATEGORIES so manifest titles resolve. */
export function slugByTitle() {
  const m = new Map();
  for (const c of CATEGORIES) m.set(c.title, c.slug);
  return m;
}

/* The tools shown for one tab. All Tools is a curated sixteen-card sample;
 * category tabs show the complete, exact category.
 *
 * `slug` is ALL_TAB for the mixed view, otherwise a category slug. Returns an
 * array of manifest tool objects and never containing the same tool twice. */
export function selectTools(tools, slug, byTitle) {
  const sizes = categorySizes(tools, byTitle);
  const biggestFirst = [...sizes.entries()].sort((a, b) => b[1] - a[1]).map(e => e[0]);

  const pickOf = cat => {
    const want = POPULAR_PICKS[cat];
    if (!want) return null;
    return tools.find(t => toolKey(t.url) === want) || null;
  };

  /* grouped once: category slug -> tools, curated pick first */
  const groups = new Map();
  for (const c of CATEGORIES) groups.set(c.slug, []);
  for (const t of tools) {
    const cat = categoryOf(t, byTitle);
    if (groups.has(cat)) groups.get(cat).push(t);
  }
  for (const [cat, list] of groups) {
    const first = pickOf(cat);
    if (first) {
      const i = list.indexOf(first);
      if (i > 0) { list.splice(i, 1); list.unshift(first); }
    }
  }

  const chosen = [];
  const seen = new Set();
  const take = t => {
    if (!t) return false;
    const k = toolKey(t.url);
    if (seen.has(k)) return false;
    seen.add(k);
    chosen.push(t);
    return true;
  };

  if (slug === ALL_TAB) {
    /* one curated pick from every category, biggest category first so the
       ordering is stable and the mix spans all nine */
    for (const cat of biggestFirst) take(pickOf(cat));
    /* top up from the whole catalogue, biggest category first */
    for (const cat of biggestFirst) for (const t of groups.get(cat)) { if (chosen.length >= CARD_SLOTS) break; take(t); }
    for (const t of tools) { if (chosen.length >= CARD_SLOTS) break; take(t); }
    return chosen.slice(0, CARD_SLOTS);
  }

  /* A CATEGORY TAB SHOWS EVERY TOOL IN ONLY THAT CATEGORY - no padding or cap.
   *
   * The curated pick is already first in each group's order. Returning the whole
   * group means selecting a category on the homepage behaves like the dedicated
   * /tools/ filter rather than showing only a sample of that category.
   */
  return (groups.get(slug) || []).slice();
}

/* Payload for the data island: the per-tab selection ONLY.
 *
 * This used to carry a second copy of every reachable tool's title,
 * description and icon as well. That was ~14kB of duplicated prose on every
 * homepage load, for data window.__SITE_DATA__ had already delivered - the
 * page downloads all 128 tools regardless, because app.js needs them for
 * search and for traffic sorting. The island therefore holds only what the
 * build alone knows: which slugs each tab shows, in which order. The
 * client resolves a slug to its card through window.ewtToolsByKey. */
export function buildIsland(tools, byTitle) {
  const picks = {};
  for (const tab of buildTabs()) picks[tab.id] = selectTools(tools, tab.id, byTitle).map(t => toolKey(t.url));
  return { picks };
}

/* Build-time checks. A failure here stops the deploy rather than shipping a tab
 * that points at a tool that does not exist, or a short row. */
export function assertPopularTools(tools, byTitle) {
  const bad = [];
  const keys = new Set(tools.map(t => toolKey(t.url)));
  const slugs = CATEGORIES.map(c => c.slug);

  for (const c of slugs) {
    const want = POPULAR_PICKS[c];
    if (!want) { bad.push(`category "${c}" has no curated pick in POPULAR_PICKS`); continue; }
    if (!keys.has(want)) bad.push(`curated pick "${want}" for "${c}" is not in the manifest`);
  }
  const picked = Object.values(POPULAR_PICKS);
  if (new Set(picked).size !== picked.length) bad.push('POPULAR_PICKS contains a duplicate tool');

  for (const tab of buildTabs()) {
    const got = selectTools(tools, tab.id, byTitle);
    /* Category tabs carry the full category; only the mixed All Tools tab is
       deliberately limited to CARD_SLOTS. */
    if (got.length === 0) bad.push(`tab "${tab.id}" selects no tools at all`);
    if (tab.id === ALL_TAB && got.length > CARD_SLOTS) {
      bad.push(`tab "${tab.id}" selects ${got.length} tools, more than ${CARD_SLOTS}`);
    }
    if (tab.id === ALL_TAB && got.length !== CARD_SLOTS) {
      bad.push(`tab "${tab.id}" selects ${got.length} tools, needs exactly ${CARD_SLOTS}`);
    }
    const seen = new Set();
    for (const t of got) {
      const k = toolKey(t.url);
      if (seen.has(k)) bad.push(`tab "${tab.id}" repeats "${k}"`);
      seen.add(k);
      if (!keys.has(k)) bad.push(`tab "${tab.id}" references unknown tool "${k}"`);
      /* A category tab must contain only that category's tools. This was previously
         an explicit permission, which is why four tabs were free to leak. */
      if (tab.id !== ALL_TAB && t && categoryOf(t, byTitle) !== tab.id) {
        bad.push(`tab "${tab.id}" contains "${k}", which belongs to ${categoryOf(t, byTitle)}`);
      }
    }
  }
  return bad;
}