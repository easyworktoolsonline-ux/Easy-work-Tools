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
