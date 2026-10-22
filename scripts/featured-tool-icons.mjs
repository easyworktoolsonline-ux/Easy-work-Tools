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
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" aria-hidden="true" focusable="false"><path fill="#FFFFFF" fill-rule="evenodd" d="M23.1 15.6 22.7 15.5 22.3 15.6 21.9 15.7 21.7 15.9 21.4 16.2 21.1 16.6 20.8 17.3 20.6 17.8 20.5 18.5 20.4 19.1 20.5 20.4 20.7 21.1 21.0 22.1 21.6 23.5 20.9 25.2 19.6 28.6 18.7 30.7 17.0 31.5 15.9 32.1 15.0 32.8 14.3 33.4 13.9 33.8 13.4 34.4 13.1 35.0 12.9 35.5 12.9 36.1 13.0 36.4 13.2 36.7 13.5 37.1 13.7 37.2 14.1 37.4 14.4 37.5 14.8 37.5 15.3 37.4 16.0 37.1 16.6 36.6 17.3 35.9 18.2 34.8 19.1 33.2 19.8 31.9 19.9 31.8 20.9 31.5 27.0 29.9 27.1 29.9 27.4 30.1 28.6 30.7 29.7 31.2 31.1 31.5 32.3 31.7 33.5 31.6 34.0 31.5 34.5 31.4 34.8 31.2 35.0 31.0 35.2 30.8 35.4 30.5 35.4 30.3 35.4 29.9 35.3 29.7 35.0 29.3 34.3 28.7 33.5 28.3 32.7 28.0 31.9 27.9 31.3 27.8 30.4 27.8 28.8 28.0 27.3 28.3 26.4 27.6 26.0 27.3 25.0 26.2 24.1 25.0 23.2 23.5 23.8 21.9 24.2 20.7 24.4 19.5 24.4 18.5 24.3 17.5 24.1 16.7 23.7 16.0 23.5 15.8ZM17.6 32.9 17.3 33.4 16.7 34.4 16.3 34.9 15.7 35.5 15.1 35.9 14.8 36.1 14.6 36.1 14.4 35.9 14.4 35.6 14.6 35.3 14.8 35.0 15.3 34.5 15.9 33.9 16.5 33.5 17.2 33.1ZM29.3 29.4 30.0 29.3 31.4 29.3 31.9 29.3 32.4 29.4 32.9 29.6 33.5 30.0 33.6 30.1 33.1 30.2 32.1 30.2 31.7 30.2 30.4 29.9ZM22.5 25.2 23.1 26.1 23.8 27.1 24.4 27.7 25.4 28.7 25.3 28.8 22.8 29.4 20.6 30.0 20.6 30.0 21.2 28.7 22.4 25.5ZM22.6 17.1 22.7 17.3 22.9 17.8 22.9 18.9 22.9 19.5 22.7 20.3 22.4 21.4 22.3 21.5 22.2 20.9 22.0 20.3 21.9 19.0 22.0 18.6 22.1 18.0 22.3 17.5ZM9.4 4.8 8.9 5.2 8.5 5.8 8.2 6.5 8.0 7.2 8.0 40.7 8.1 41.2 8.3 41.7 8.5 42.2 8.8 42.6 9.2 43.1 9.5 43.3 9.9 43.6 10.5 43.8 11.3 44.0 36.6 44.0 36.7 43.9 36.9 43.9 37.8 43.7 38.4 43.4 38.7 43.1 39.2 42.6 39.5 42.3 39.8 41.5 40.0 40.7 39.9 15.1 28.9 4.0 11.3 4.0 11.2 4.1 11.0 4.1 10.5 4.2 10.0 4.4ZM29.8 7.0 36.9 14.2 36.9 14.2 32.0 14.2 31.5 14.2 31.1 14.1 30.8 13.9 30.3 13.5 30.0 13.0 29.9 12.7 29.8 12.2ZM28.2 5.5 28.3 5.5 28.3 12.1 28.3 12.6 28.5 13.2 28.8 13.9 29.0 14.3 29.5 14.8 29.8 15.0 30.3 15.3 30.7 15.5 31.4 15.6 38.4 15.7 38.5 15.7 38.5 40.2 38.4 40.9 38.3 41.3 38.1 41.7 37.7 42.1 37.3 42.3 36.6 42.5 11.3 42.5 10.8 42.4 10.2 42.0 9.9 41.6 9.6 41.1 9.5 40.7 9.5 7.5 9.6 7.0 9.7 6.6 9.9 6.3 10.4 5.9 10.8 5.6 11.4 5.5Z"/></svg>',
  developer:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none" aria-hidden="true" focusable="false">'
    + '<path d="M17 14 7 24l10 10" stroke="#FFFFFF" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>'
    + '<path d="M31 14l10 10-10 10" stroke="#FFFFFF" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>'
    + '<path d="M27 10l-6 28" stroke="#FFFFFF" stroke-width="2.6" stroke-linecap="round"/>'
    + '</svg>',
  seo:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" aria-hidden="true" focusable="false"><path fill="#FFFFFF" fill-rule="evenodd" d="M17.4 33.5 17.0 33.5 16.8 33.6 16.1 33.6 15.9 33.7 12.5 33.7 12.4 33.7 12.4 43.9 12.5 44.0 17.4 44.0ZM5.0 32.2 4.9 43.9 5.0 44.0 9.9 44.0 9.9 33.5 9.7 33.3 8.9 33.3 8.7 33.2 8.4 33.2 8.3 33.1 7.4 32.9 7.2 32.9 6.1 32.6 5.5 32.4ZM24.8 31.5 23.5 32.0 22.9 32.2 22.6 32.4 22.5 32.4 22.4 32.4 22.2 32.4 20.9 32.9 20.7 32.9 20.6 32.9 20.1 33.0 19.9 33.1 19.9 43.9 19.9 44.0 24.8 44.0 24.9 43.9 24.9 31.6ZM32.4 26.7 32.1 26.9 31.1 27.7 30.0 28.6 28.8 29.5 27.5 30.2 27.4 30.3 27.4 44.0 32.3 44.0 32.4 43.9ZM39.8 13.7 39.7 13.7 39.6 13.8 39.6 14.1 39.5 14.5 39.4 15.1 39.1 15.8 39.1 15.9 39.0 16.0 39.0 16.5 38.6 17.2 38.5 17.8 37.9 19.1 37.2 20.4 36.4 21.8 35.6 23.1 34.8 24.0 34.9 44.0 39.8 44.0 39.8 43.9ZM43.1 12.4 33.7 4.2 33.4 4.0 23.7 12.4 23.7 12.5 28.9 12.5 29.0 12.6 28.9 12.7 28.9 13.0 28.8 13.1 28.8 13.4 28.8 13.5 28.8 13.8 28.6 14.2 28.6 14.4 28.5 14.6 28.5 14.7 28.4 14.8 28.4 15.0 28.3 15.1 28.3 15.3 27.6 17.3 26.7 19.2 25.8 20.7 24.7 22.4 23.7 23.5 22.4 24.9 20.8 26.2 19.0 27.5 17.0 28.6 14.8 29.5 14.4 29.5 13.8 29.8 12.9 29.9 12.8 30.0 12.6 30.0 12.4 30.1 12.1 30.1 12.0 30.2 11.7 30.2 11.5 30.3 10.4 30.3 10.1 30.4 7.0 30.4 6.7 30.3 6.2 30.3 6.0 30.3 5.3 30.2 5.0 30.4 4.9 30.6 4.9 30.7 5.1 31.0 5.8 31.2 5.9 31.2 6.8 31.5 7.3 31.6 7.4 31.7 7.6 31.7 8.1 31.9 8.3 31.9 8.5 31.9 8.7 31.9 8.9 32.0 9.1 32.0 9.3 32.1 9.6 32.1 9.8 32.2 10.2 32.2 10.3 32.3 10.7 32.3 11.0 32.3 11.6 32.3 11.8 32.4 14.6 32.5 15.2 32.4 16.2 32.4 16.4 32.3 17.6 32.3 17.7 32.2 18.1 32.2 18.3 32.1 18.6 32.1 18.8 32.0 19.4 31.9 19.6 31.9 19.8 31.9 19.9 31.8 20.2 31.8 20.3 31.7 20.5 31.7 20.6 31.6 20.8 31.6 20.9 31.5 21.7 31.4 21.8 31.3 21.9 31.3 23.1 30.9 23.2 30.8 23.7 30.6 25.1 30.1 27.7 28.7 28.8 28.0 30.4 26.8 31.6 25.8 32.9 24.5 34.5 22.5 35.2 21.5 36.0 20.2 37.2 17.6 37.2 17.5 37.6 16.6 37.7 16.2 37.8 16.1 37.8 15.9 38.1 15.0 38.1 14.8 38.2 14.7 38.2 14.5 38.3 14.4 38.3 14.2 38.5 13.7 38.6 12.6 38.7 12.5 43.1 12.5Z"/></svg>',
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
    + '<circle cx="16.5" cy="23" r="1.9" fill="#FFFFFF"/><circle cx="24" cy="23" r="1.9" fill="#FFFFFF"/><circle cx="31.5" cy="23" r="1.9" fill="#FFFFFF"/>'
    + '<circle cx="16.5" cy="30.5" r="1.9" fill="#FFFFFF"/><circle cx="24" cy="30.5" r="1.9" fill="#FFFFFF"/><circle cx="31.5" cy="30.5" r="1.9" fill="#FFFFFF"/>'
    + '<circle cx="16.5" cy="35.5" r="1.9" fill="#FFFFFF"/><circle cx="24" cy="35.5" r="1.9" fill="#FFFFFF"/><circle cx="31.5" cy="35.5" r="1.9" fill="#FFFFFF"/>'
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
