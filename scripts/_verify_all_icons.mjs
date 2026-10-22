import fs from 'node:fs';

const content = fs.readFileSync('C:/Users/ahmad/OneDrive/Documents/Default Project/index.html', 'utf8');
const matches = [...content.matchAll(/<span class="cat-card__icon"[^>]*>([\s\S]*?)<\/span>/g)];

console.log('Total cat-card__icon spans:', matches.length);

matches.forEach((m, i) => {
    const svg = m[1];
    let iconName = 'unknown';
    
    if (svg.includes('fill="#1E293B"') || svg.includes('fill="#1D4ED8"')) iconName = 'AI Write (markdown)';
    else if (svg.includes('fill="#0EA5E9"') || svg.includes('fill="#1493B3"')) iconName = 'Converter/Unit';
    else if (svg.includes('fill="#000000"') || svg.includes('fill="#7F1D1D"')) iconName = 'PDF (pdf-merge)';
    else if (svg.includes('fill="#15803D"')) iconName = 'Developer (json)';
    else if (svg.includes('fill="#0E7490"')) iconName = 'SEO (seo-analyzer)';
    else if (svg.includes('stroke="currentColor"') && !svg.includes('fill=')) iconName = 'Text/Converter (text-case)';
    else if (svg.includes('fill="#15803D"')) iconName = 'Developer (json)';
    else if (svg.includes('fill="#7C3AED"')) iconName = 'Text (word-count)';
    else if (svg.includes('fill="#11D6B2"')) iconName = 'Calculator (percentage)';
    else if (svg.includes('fill="#D61149"')) iconName = 'Utility (password)';
    else if (svg.includes('fill="#1493B3"') || svg.includes('fill="#0EA5E9"')) iconName = 'Converter (unit)';
    else if (svg.includes('fill="#D61149"')) iconName = 'Utility (password)';
    else if (svg.includes('fill="#111827"')) iconName = 'Utility (password)';
    else if (svg.includes('fill="#4C1D95"')) iconName = 'UUID';
    else if (svg.includes('fill="#C2410C"')) iconName = 'Image (image)';
    
    // Also check for specific paths
    if (svg.includes('M24 6l16 6v11')) console.log(`  Card ${i+1}: PASSWORD/KEY icon`);
    if (m[1].includes('M4 12h15M13 6l6 6-6 6')) console.log(`  Card ${i+1}: TEXT-CASE (arrows)`);
    
    console.log(`Card ${i+1}: ${iconName}`);
});

console.log('\n=== Expected vs Actual ===');
const expected = [
    {cat: 'AI Write', expected: 'markdown'},
    {cat: 'Image Tools', expected: 'image'},
    {cat: 'PDF Tools', expected: 'pdf-merge'},
    {cat: 'Developer Tools', expected: 'json'},
    {cat: 'SEO Tools', expected: 'seo-analyzer'},
    {cat: 'Text Tools', expected: 'word-count'},
    {cat: 'Calculator Tools', expected: 'percentage'},
    {cat: 'Utility Tools', expected: 'password'},
    {cat: 'Converter Tools', expected: 'unit'},
];

console.log('All category cards should have distinct icons matching their featured tools.');