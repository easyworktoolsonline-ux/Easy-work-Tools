import fs from 'fs';
import path from 'path';

const dir = 'F:\\easyworktools.online\\Easy-work-Tools\\reports\\adsense-low-value-recovery';
const allowed = new Set(['DONE', 'PARTIAL', 'BLOCKED - WAITING FOR OWNER', 'DATA UNAVAILABLE', 'OWNER DECISION REQUIRED']);
const invalid = [];

function parseCsv(text) {
  text = text.replace(/^\uFEFF/, '');
  const rows = []; let row = []; let field = ''; let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else quoted = false; }
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field.replace(/\r$/, '')); rows.push(row); row = []; field = ''; }
    else field += c;
  }
  if (field !== '' || row.length) { row.push(field.replace(/\r$/, '')); rows.push(row); }
  const headers = rows.shift() || [];
  return rows.filter(r => r.length === headers.length).map(r => Object.fromEntries(headers.map((h, i) => [h, r[i]])));
}

let csvChecked = 0;
for (const name of fs.readdirSync(dir).filter(n => n.endsWith('.csv'))) {
  const rows = parseCsv(fs.readFileSync(path.join(dir, name), 'utf8'));
  if (!rows.length || !('FinalStatus' in rows[0])) continue;
  for (const [i, row] of rows.entries()) {
    csvChecked++;
    const v = (row.FinalStatus || '').trim();
    if (!allowed.has(v)) invalid.push(`${name}:row${i + 2}:${v}`);
  }
}

let mdChecked = 0;
for (const name of fs.readdirSync(dir).filter(n => n.endsWith('.md'))) {
  const text = fs.readFileSync(path.join(dir, name), 'utf8');
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length - 1; i++) {
    const cells = lines[i].split('|').map(s => s.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
    const isHeader = /^(Status|FinalStatus)$/.test(cells[cells.length - 1] || '');
    if (!isHeader) continue;
    const separator = lines[i + 1] || '';
    for (let j = i + 2; j < lines.length; j++) {
      const line = lines[j];
      if (!line.trim().startsWith('|')) break;
      const rowCells = line.split('|').map(s => s.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
      const v = (rowCells[rowCells.length - 1] || '').replace(/\*\*/g, '').trim();
      mdChecked++;
      if (!allowed.has(v)) invalid.push(`${name}:line${j + 1}:${v}`);
    }
  }
}

console.log(JSON.stringify({ csvStatusCellsChecked: csvChecked, markdownStatusCellsChecked: mdChecked, invalidCount: invalid.length, invalid: invalid.slice(0, 50), FinalStatus: invalid.length === 0 ? 'DONE' : 'PARTIAL' }, null, 2));
