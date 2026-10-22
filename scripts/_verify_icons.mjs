import fs from 'node:fs';

const content = fs.readFileSync('C:/Users/ahmad/OneDrive/Documents/Default Project/index.html', 'utf8');

// Find all cat-card icons
const cards = [...content.matchAll(/<article class="cat-card"[\s\S]*?<\/article>/g)];

for (const m of cards) {
  const card = m[0];
  const titleM = card.match(/<span class="cat-card__title">([^<]+)<\/span>/);
  const svgM = card.match(/<svg [\s\S]*?<\/svg>/);
  
  if (titleM && svgM) {
    const title = titleM[1];
    const svg = svgM[0];
    
    // Check for key identifying features
    const hasRect = svg.includes('<rect ');
    const hasPath = svg.includes('<path ');
    const hasCircle = svg.includes('<circle ');
    const fills = [...svg.matchAll(/fill="([^"]+)"/g)].map(m => m[1]).slice(0, 3);
    const strokes = [...svg.matchAll(/stroke="([^"]+)"/g)].map(m => m[1]).slice(0, 3);
    
    console.log(`${titleM[1].padEnd(20)} | rect:${hasRect} path:${svg.includes('<path ')} circle:${svg.includes('<circle ')} | fills:[${fills.join(', ')}]`);
  }
}
console.log('\nDone');