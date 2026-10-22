import fs from 'node:fs';

const content = fs.readFileSync('C:/Users/ahmad/OneDrive/Documents/Default Project/assets/app.js', 'utf8');
const match = content.match(/if\(key==='password'\)return \`<svg[\s\S]*?<\/svg>\`;/);
if (match) {
  console.log('Found password key definition');
  const svg = match[0];
  const fills = [...svg.matchAll(/fill="([^"]+)"/g)].map(m => m[1]);
  const strokes = [...svg.matchAll(/stroke="([^"]+)"/g)].map(m => m[1]);
  console.log('Fills:', fills.slice(0, 5));
  console.log('Strokes:', strokes.slice(0, 3));
  console.log('SVG length:', match[0].length);
} else {
  console.log('password key NOT FOUND in iconSvg');
}