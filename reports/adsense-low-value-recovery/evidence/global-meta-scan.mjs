import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';

const root = 'F:\\easyworktools.online\\Easy-work-Tools';
const files = execFileSync('git', ['ls-files', '*.html'], { cwd: root, encoding: 'utf8' }).trim().split(/\r?\n/).filter(Boolean);
const entries = [];
const exceptions = [];

for (const rel of files) {
  const abs = path.join(root, rel);
  if (!fs.existsSync(abs)) { exceptions.push({ file: rel, reason: 'missing file' }); continue; }
  const html = fs.readFileSync(abs, 'utf8');
  const headEnd = html.toLowerCase().indexOf('</head>');
  const head = headEnd >= 0 ? html.slice(0, headEnd) : html;
  const isFullPage = /<!doctype\s+html/i.test(html);
  const tags = [...head.matchAll(/<meta\s+name=(["'])description\1\s+content=(["'])([\s\S]*?)\2\s*\/?>/gi)];
  const canonicals = [...head.matchAll(/<link\s+rel=(["'])canonical\1\s+href=(["'])([\s\S]*?)\2\s*\/?>/gi)];

  if (!isFullPage) { exceptions.push({ file: rel, reason: 'partial template; not a page' }); continue; }
  if (tags.length !== 1) { exceptions.push({ file: rel, reason: `head meta descriptions=${tags.length}` }); continue; }
  if (canonicals.length !== 1) { exceptions.push({ file: rel, reason: `head canonical tags=${canonicals.length}` }); continue; }
  entries.push({ rel, description: tags[0][3], canonical: canonicals[0][3] });
}

const byDescription = new Map();
for (const e of entries) {
  const key = e.description.trim();
  if (!byDescription.has(key)) byDescription.set(key, []);
  byDescription.get(key).push(e.rel);
}
const duplicateGroups = [...byDescription.entries()].filter(([, paths]) => paths.length > 1);
const duplicatePages = duplicateGroups.reduce((n, [, paths]) => n + paths.length, 0);

console.log(JSON.stringify({
  trackedHtmlFiles: files.length,
  pageLikeFilesWithOneDescriptionAndCanonical: entries.length,
  uniqueHeadDescriptions: byDescription.size,
  duplicateGroups: duplicateGroups.length,
  duplicatePages,
  duplicateSample: duplicateGroups.slice(0, 20).map(([description, paths]) => ({ description: description.slice(0, 80), paths })),
  exceptions,
  note: 'Only the document head is treated as page metadata. JS string examples in tool pages are excluded; ads/* files are partial templates.',
  FinalStatus: duplicateGroups.length === 0 ? 'DONE' : 'PARTIAL',
}, null, 2));
