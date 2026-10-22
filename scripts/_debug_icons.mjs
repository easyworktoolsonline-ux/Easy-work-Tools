import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const home = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

// Find Utility Tools card
const m = home.match(/Utility Tools[\s\S]*?<svg [\s\S]*?<\/svg>/);
if (m) {
    const svg = m[0];
    const fills = [...svg.matchAll(/fill="([^"]+)"/g)].map(m => m[1]);
    const strokes = [...svg.matchAll(/stroke="([^"]+)"/g)].map(m => m[1]);
    const paths = [...svg.matchAll(/d="([^"]+)"/g)].map(m => m[1]);
    console.log('Utility Tools SVG:');
    console.log('  fills:', fills.slice(0, 5));
    console.log('  strokes:', strokes.slice(0, 5));
    paths.slice(0, 3).forEach((p, i) => console.log(`  path ${i}: ${p.substring(0, 100)}`));
} else {
    console.log('Utility Tools card NOT FOUND');
}

// Also check Text Tools
const m2 = fs.readFileSync('C:/Users/ahmad/OneDrive/Documents/Default Project/index.html', 'utf8').match(/Text Tools[\s\S]*?<svg [\s\S]*?<\/svg>/);
if (m2) {
    const svg = m2[0];
    const fills = [...m2[0].matchAll(/fill="([^"]+)"/g)].map(m => m[1]);
    const strokes = [...m2[0].matchAll(/stroke="([^"]+)"/g)].map(m => m[1]);
    const paths = [...m2[0].matchAll(/d="([^"]+)"/g)].map(m => m[1]);
    console.log('\nText Tools SVG:');
    console.log('  fills:', fills.slice(0, 5));
    console.log('  strokes:', strokes.slice(0, 5));
    paths.slice(0, 3).forEach((p, i) => console.log(`  path ${i}: ${p.substring(0, 100)}`));
} else {
    console.log('Text Tools card NOT FOUND');
}

// Check what iconSvg returns for key tools
const appJs = fs.readFileSync('C:/Users/ahmad/OneDrive/Documents/Default Project/assets/app.js', 'utf8');
const keys = ['password', 'word-count', 'uuid', 'text-case', 'text-case-converter'];
keys.forEach(key => {
    const re = new RegExp(`if\\(key==='${key}'\\)return \`<svg [\\s\\S]*?<\/svg>\`;`);
    const m = appJs.match(new RegExp(`if\\(key==='${key}'\\)return \`<svg [\\s\\S]*?<\/svg>\`;`));
    if (m) {
        const svg = m[0];
        const fills = [...svg.matchAll(/fill="([^"]+)"/g)].map(m => m[1]).slice(0, 3);
        const paths = [...m[0].matchAll(/d="([^"]+)"/g)].map(m => m[1]).slice(0, 2);
        console.log(`\n${key}: fills=${fills.join(', ')}, paths=${paths.map(p => p.substring(0, 50)).join('; ')}`);
    } else {
        console.log(`\n${key}: NOT FOUND in iconSvg`);
    }
});