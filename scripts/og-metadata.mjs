/* ---------------------------------------------------------------------------
 * Shared Open Graph / Twitter metadata guard.
 *
 * Static HTML is the source of truth for this site: Cloudflare Pages serves the
 * checked-in files and server.ts only sends them.  This module is called by the
 * global HTML loop in build-indexes.mjs so every indexable page gets the same
 * complete social metadata without hand-editing hundreds of files.
 *
 * Rules:
 *   - operate only inside <head>...</head>
 *   - never change <title>, meta description, canonical, robots or JSON-LD
 *   - replace only the legacy default social image; leave page-specific images
 *   - add missing required OG/Twitter tags, de-duplicate managed tags
 *   - keep og:url aligned with the page's canonical URL
 * ------------------------------------------------------------------------- */

export const OG_IMAGE_URL = 'https://easyworktools.online/assets/easyworktools-og.png';
export const OG_IMAGE_TYPE = 'image/png';
export const OG_IMAGE_WIDTH = '2400';
export const OG_IMAGE_HEIGHT = '1260';

const LEGACY_IMAGE_URLS = new Set([
  'https://easyworktools.online/assets/og-image.png',
  'https://easyworktools.online/assets/easyworktools-og.jpg',
]);
const SITE_ORIGIN = 'https://easyworktools.online/';
const SITE_NAME = 'EasyWorkTools.online';
const IMAGE_ALT = 'EasyWorkTools.online — free online AI, image, PDF, converter and developer tools';

const MANAGED_TAGS = [
  'og:type',
  'og:site_name',
  'og:title',
  'og:description',
  'og:url',
  'og:image',
  'og:image:secure_url',
  'og:image:type',
  'og:image:width',
  'og:image:height',
  'og:image:alt',
  'twitter:card',
  'twitter:title',
  'twitter:description',
  'twitter:image',
];
const MANAGED = new Set(MANAGED_TAGS);

const escapeRe = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const escapeAttr = (value) => String(value)
  .replace(/&/g, '&amp;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;');

const decodeAttr = (value) => String(value)
  .replace(/&quot;/gi, '"')
  .replace(/&#39;/gi, "'")
  .replace(/&lt;/gi, '<')
  .replace(/&gt;/gi, '>')
  .replace(/&amp;/gi, '&');

function getAttr(tag, name) {
  const m = tag.match(new RegExp('\\b' + escapeRe(name) + '\\s*=\\s*(["\'])(.*?)\\1', 'i'));
  return m ? m[2] : null;
}

function metaTags(head) {
  const found = [];
  const re = /<meta\b[^>]*>/gi;
  let m;
  while ((m = re.exec(head))) found.push({ tag: m[0], index: m.index });
  return found;
}

function metaKey(tag) {
  const key = getAttr(tag, 'property') || getAttr(tag, 'name');
  return key ? key.toLowerCase() : null;
}

function metaContent(tag) {
  const value = getAttr(tag, 'content');
  return value == null ? null : decodeAttr(value);
}

function firstMeta(head, key) {
  for (const { tag } of metaTags(head)) {
    if (metaKey(tag) === key) return metaContent(tag);
  }
  return null;
}

function canonicalOf(head) {
  for (const m of head.matchAll(/<link\b[^>]*>/gi)) {
    const tag = m[0];
    const rel = getAttr(tag, 'rel');
    if (!rel || !rel.toLowerCase().split(/\s+/).includes('canonical')) continue;
    const href = getAttr(tag, 'href');
    if (!href) return null;
    const value = decodeAttr(href);
    if (/^https?:\/\//i.test(value)) return value;
    if (value.startsWith('/')) return SITE_ORIGIN + value.slice(1);
    return SITE_ORIGIN + value.replace(/^\.\//, '');
  }
  return null;
}

function titleOf(head) {
  const m = head.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  return m ? decodeAttr(m[1].replace(/<[^>]*>/g, '')).trim() : null;
}

function isLegacyImage(value) {
  if (!value) return false;
  const normalized = String(value).split(/[?#]/, 1)[0];
  if (LEGACY_IMAGE_URLS.has(normalized)) return true;
  return /(?:^|\/)assets\/(?:og-image\.png|easyworktools-og\.jpg)$/i.test(normalized);
}

function imageUrl(value) {
  return isLegacyImage(value) ? OG_IMAGE_URL : (value || OG_IMAGE_URL);
}

function secureImageUrl(value, ogImage) {
  if (!value || isLegacyImage(value)) return OG_IMAGE_URL;
  return /^https:\/\//i.test(value) ? value : ogImage;
}

function imageType(value, url) {
  if (value) return value;
  if (/\.png(?:[?#]|$)/i.test(url)) return 'image/png';
  if (/\.webp(?:[?#]|$)/i.test(url)) return 'image/webp';
  return OG_IMAGE_TYPE;
}

function setContent(tag, value) {
  if (/\bcontent\s*=\s*(["'])/i.test(tag)) {
    return tag.replace(/(\bcontent\s*=\s*)(["'])(.*?)\2/i, (_all, prefix, quote) => (
      prefix + quote + escapeAttr(value) + quote
    ));
  }
  return tag.replace(/(\s*\/?>)$/, (_all, close) => ` content="${escapeAttr(value)}"${close}`);
}

function newTag(key, value) {
  const attr = key.startsWith('og:') ? 'property' : 'name';
  return `<meta ${attr}="${key}" content="${escapeAttr(value)}">`;
}

function groupsByKey(head) {
  const groups = new Map();
  for (const item of metaTags(head)) {
    const key = metaKey(item.tag);
    if (!key || !MANAGED.has(key)) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }
  return groups;
}

function removeDuplicates(head, groups) {
  for (const items of groups.values()) {
    for (let i = items.length - 1; i > 0; i--) {
      const { tag, index } = items[i];
      head = head.slice(0, index) + head.slice(index + tag.length);
    }
  }
  return head;
}

/**
 * Return HTML with complete, consistent social metadata in its head.
 * Idempotent and safe to call on every build.
 */
export function ensureOgMetadata(html) {
  const headMatch = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i);
  if (!headMatch) return html;

  let head = headMatch[1];
  const robots = firstMeta(head, 'robots') || '';
  if (/\bnoindex\b/i.test(robots)) return html;

  head = removeDuplicates(head, groupsByKey(head));

  let groups = groupsByKey(head);
  const current = new Map();
  for (const [key, items] of groups) current.set(key, metaContent(items[0].tag));

  const canonical = canonicalOf(head);
  const title = titleOf(head) || '';
  const description = firstMeta(head, 'description') || '';
  const currentOgImage = current.get('og:image') || '';
  const defaultImage = !currentOgImage || isLegacyImage(currentOgImage);
  const ogImage = imageUrl(currentOgImage);
  const secure = secureImageUrl(current.get('og:image:secure_url'), ogImage);

  const desired = new Map([
    ['og:type', current.get('og:type') || 'website'],
    ['og:site_name', current.get('og:site_name') || SITE_NAME],
    ['og:title', current.get('og:title') || title],
    ['og:description', current.get('og:description') || description],
    ['og:url', canonical || current.get('og:url') || ''],
    ['og:image', ogImage],
    ['og:image:secure_url', secure],
    ['og:image:type', defaultImage ? OG_IMAGE_TYPE : imageType(current.get('og:image:type'), ogImage)],
    ['og:image:width', defaultImage ? OG_IMAGE_WIDTH : (current.get('og:image:width') || OG_IMAGE_WIDTH)],
    ['og:image:height', defaultImage ? OG_IMAGE_HEIGHT : (current.get('og:image:height') || OG_IMAGE_HEIGHT)],
    ['og:image:alt', current.get('og:image:alt') || IMAGE_ALT],
    ['twitter:card', current.get('twitter:card') || 'summary_large_image'],
    ['twitter:title', current.get('twitter:title') || title],
    ['twitter:description', current.get('twitter:description') || description],
    ['twitter:image', imageUrl(current.get('twitter:image'))],
  ]);

  // Update existing tags in place. This preserves each file's formatting and
  // avoids touching any attribute other than content.
  groups = groupsByKey(head);
  for (const key of MANAGED_TAGS) {
    const value = desired.get(key);
    if (!value) continue;
    const items = groups.get(key);
    if (!items || !items.length) continue;
    const tag = items[0].tag;
    const next = setContent(tag, value);
    if (next !== tag) {
      head = head.slice(0, items[0].index) + next + head.slice(items[0].index + tag.length);
      groups = groupsByKey(head);
    }
  }

  groups = groupsByKey(head);
  const missing = MANAGED_TAGS.filter((key) => !groups.has(key) && desired.get(key));
  if (missing.length) {
    const multiline = head.includes('\n');
    const nl = multiline ? '\n' : '';
    const indent = multiline ? '  ' : '';
    const block = missing.map((key) => indent + newTag(key, desired.get(key))).join(nl) + nl;
    head = head.replace(/\s*$/, (tail) => (tail.startsWith('\n') ? '\n' : tail) + block);
  }

  return html.slice(0, headMatch.index + headMatch[0].indexOf(headMatch[1]))
    + head
    + html.slice(headMatch.index + headMatch[0].indexOf(headMatch[1]) + headMatch[1].length);
}

export default ensureOgMetadata;
