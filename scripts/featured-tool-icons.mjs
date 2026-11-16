/* The Online Text Case Converter keeps its own "Aa" glyph so the card reads as
   text transformation. Every other featured tool uses its original iconSvg()
   artwork from assets/app.js.

   Drawn as VECTOR PATHS in black rather than a <text> element: a font-based
   glyph would disappear if the machine has no matching font, and the black
   stroke is readable on both the white icon tile and this card's coloured
   tile. viewBox 0 0 48 48 and stroke-width 3 match the site's other icons. */
const ICONS = {
  'online-text-case-converter':
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none" aria-hidden="true" focusable="false">'
    + '<path d="M10 28 17.5 9 25 28" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>'
    + '<path d="M13.9 22h7.2" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round"/>'
    + '<path d="M36.5 14v14" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round"/>'
    + '<path d="M36.5 16.75a4.75 4.75 0 1 0 0 9.5" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round"/>'
    + '<path d="M7 35h34" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round"/>'
    + '<path d="M7 31.2v7.6M41 31.2v7.6" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round"/>'
    + '</svg>'
};

export function featuredToolIcon(key, fallback) {
  const artwork = ICONS[key];
  return artwork ? artwork : fallback;
}

/* --------------------------------------------------------------------------
 * Homepage category-carousel icons (the nine cards under "Recent Tools").
 *
 * These used to be the full-colour iconSvg() artwork with a CSS filter
 * (`brightness(0) invert(1)`) forcing every shape to solid white, patched by
 * a set of #catTrack>.cat-card:nth-child(N) rules that deleted specific
 * <rect> elements per card position to stop overlapping white-on-white
 * shapes from merging into a blank tile.
 *
 * That broke for two structural reasons:
 *  1. Card order is NOT fixed - renderCarousel() sorts categories by live
 *     tool count, so the nth-child position for a given category changes
 *     whenever tools are added or removed. The hand-tuned rules silently
 *     target the wrong category after any such change.
 *  2. Even at the position it was written for, the brightness/invert filter
 *     turns every filled shape white regardless of its original colour, so
 *     overlapping fills (e.g. a white circle drawn over a white rect) become
 *     visually indistinguishable - that's what produced the blank tiles for
 *     Image Tools and SEO Tools, and left PDF Tools as a bare "+".
 *
 * Fixed by keying the icon to the category's own (stable) slug instead of
 * its DOM position, and drawing each one as pure white outline strokes with
 * no overlapping fills, so there is nothing for a filter to need deleting -
 * the .cat-card__icon svg filter and all nth-child patches are removed from
 * assets/categories.css along with this change. */
const CATEGORY_ICONS = {
  'ai-write':
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none" aria-hidden="true" focusable="false">'
    + '<path d="M30.5 9.5a3.2 3.2 0 0 1 4.5 0l3.5 3.5a3.2 3.2 0 0 1 0 4.5L17 39H9v-8z" stroke="#FFFFFF" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>'
    + '<path d="M27 13l7.5 7.5" stroke="#FFFFFF" stroke-width="2.8" stroke-linecap="round"/>'
    + '</svg>',
  image:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none" aria-hidden="true" focusable="false">'
    + '<rect x="7" y="9" width="34" height="30" rx="5" stroke="#FFFFFF" stroke-width="2.8"/>'
    + '<circle cx="18" cy="19" r="3.2" stroke="#FFFFFF" stroke-width="2.6"/>'
    + '<path d="M10 32l9-10 6.5 7 5-5.5 7.5 8.5" stroke="#FFFFFF" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>'
    + '</svg>',
  pdf:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none" aria-hidden="true" focusable="false">'
    + '<path d="M29 5H13a3 3 0 0 0-3 3v32a3 3 0 0 0 3 3h22a3 3 0 0 0 3-3V14l-9-9Z" stroke="#FFFFFF" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>'
    + '<path d="M29 5v9h9" stroke="#FFFFFF" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>'
    + '<path d="M23.5 18c-1 0-1.5 1.2-1 3 .9 3.2 3.8 7.6 8.2 9.2 1.6.6 2.5 0 2.5-.9 0-1-.9-1.6-2.5-1.5-4.8.3-10.5 2.4-14.2 5.3-1.3 1-1.3 2.5-.2 2.9 1.1.4 2.2-.3 3.1-1.8 2.1-3.5 4.1-9.2 4.6-13.7.2-1.6-.1-2.5-.5-2.5Z" stroke="#FFFFFF" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>'
    + '</svg>',
  developer:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none" aria-hidden="true" focusable="false">'
    + '<path d="M17 14 7 24l10 10" stroke="#FFFFFF" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>'
    + '<path d="M31 14l10 10-10 10" stroke="#FFFFFF" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>'
    + '<path d="M27 10l-6 28" stroke="#FFFFFF" stroke-width="2.6" stroke-linecap="round"/>'
    + '</svg>',
  seo:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none" aria-hidden="true" focusable="false">'
    + '<rect x="7.5" y="33" width="5.5" height="9" rx="1" stroke="#FFFFFF" stroke-width="2.8"/>'
    + '<rect x="16.5" y="28" width="5.5" height="14" rx="1" stroke="#FFFFFF" stroke-width="2.8"/>'
    + '<rect x="25.5" y="22" width="5.5" height="20" rx="1" stroke="#FFFFFF" stroke-width="2.8"/>'
    + '<rect x="34.5" y="16" width="5.5" height="26" rx="1" stroke="#FFFFFF" stroke-width="2.8"/>'
    + '<path d="M8 25c10-2 19-8 28-18" stroke="#FFFFFF" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>'
    + '<path d="M29 7h7v7" stroke="#FFFFFF" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>'
    + '</svg>',
  text:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none" aria-hidden="true" focusable="false">'
    + '<path d="M10 28 17.5 9 25 28" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>'
    + '<path d="M13.9 22h7.2" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round"/>'
    + '<path d="M36.5 14v14" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round"/>'
    + '<path d="M36.5 16.75a4.75 4.75 0 1 0 0 9.5" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round"/>'
    + '<path d="M7 35h34" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round"/>'
    + '<path d="M7 31.2v7.6M41 31.2v7.6" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round"/>'
    + '</svg>',
  converter:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none" aria-hidden="true" focusable="false">'
    + '<path d="M9 17h24l-6-6m6 6-6 6" stroke="#FFFFFF" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>'
    + '<path d="M39 31H15l6-6m-6 6 6 6" stroke="#FFFFFF" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>'
    + '</svg>',
  calculator:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none" aria-hidden="true" focusable="false">'
    + '<rect x="10" y="7" width="28" height="34" rx="4" stroke="#FFFFFF" stroke-width="2.8"/>'
    + '<path d="M15 14h18" stroke="#FFFFFF" stroke-width="2.6" stroke-linecap="round"/>'
    + '<path d="M17 22.5h.01M24 22.5h.01M31 22.5h.01M17 29h.01M24 29h.01M31 29h.01M17 35.5h.01M24 35.5h.01M31 35.5h.01" stroke="#FFFFFF" stroke-width="2.8" stroke-linecap="round"/>'
    + '</svg>',
  'video-audio':
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none" aria-hidden="true" focusable="false">'
    + '<rect x="7" y="9" width="34" height="30" rx="6" stroke="#FFFFFF" stroke-width="2.8"/>'
    + '<polygon points="20,17 31,24 20,31" stroke="#FFFFFF" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>'
    + '</svg>',
  utility:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">'
    + '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.77 3.77z"/>'
    + '</svg>'
};

export function categoryIcon(slug, fallback) {
  const artwork = CATEGORY_ICONS[slug];
  return artwork ? artwork : fallback;
}
