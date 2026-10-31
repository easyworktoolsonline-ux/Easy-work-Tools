import { ui } from './core.mjs';
import { p, h3, ol, table } from './converters.mjs';

const SCRIPT = String.raw`
var grid=$("iconGrid"),search=$("iconSearch"),tabs=$("setTabs"),moreBtn=$("moreBtn"),countEl=$("iconCount"),previewCanvas=$("previewCanvas"),metaDims=$("metaDims"),metaIcon=$("metaIcon"),svgBtn=$("svgBtn");
var all=[],view=[],shown=0,PAGE=240,cur=null,set="all",busy=0,blob=null;
resultPanel.classList.add("show");downloadBtn.disabled=true;
EWT.loadScript("../../assets/image-tools/fa-icons.js").then(function(){
  var S=EWT.faIcons.sets;
  Object.keys(S).forEach(function(k){Object.keys(S[k]).forEach(function(n){var v=S[k][n];all.push({set:k,name:n,w:v[0],h:v[1],d:v[2],key:k+"/"+n})})});
  all.sort(function(a,b){return a.name<b.name?-1:(a.name>b.name?1:(a.set<b.set?-1:1))});
  $("faVersion").textContent=EWT.faIcons.version;
  filter();
  var start=all.filter(function(x){return x.key==="solid/heart"})[0]||all[0];select(start);
}).catch(function(e){showStatus(msgOf(e),"error")});
function svgOf(ic,color){return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+ic.w+' '+ic.h+'"><path fill="'+color+'" d="'+ic.d+'"/></svg>'}
function filter(){
  var q=search.value.trim().toLowerCase().replace(/\s+/g,"-");
  view=all.filter(function(x){return (set==="all"||x.set===set)&&(!q||x.name.indexOf(q)>=0)});
  shown=0;grid.innerHTML="";more();
  countEl.textContent=view.length+" icon"+(view.length===1?"":"s")+(q?" match “"+search.value.trim()+"”":"");
  $("noResults").style.display=view.length?"none":"block";
}
function more(){
  var end=Math.min(view.length,shown+PAGE),frag=document.createDocumentFragment();
  for(var i=shown;i<end;i++){
    var ic=view[i],b=document.createElement("button");
    b.type="button";b.className="ewt-icon"+(cur&&cur.key===ic.key?" is-on":"");b.setAttribute("data-k",ic.key);b.title=ic.name+" ("+ic.set+")";
    b.innerHTML='<svg viewBox="0 0 '+ic.w+' '+ic.h+'" aria-hidden="true"><path d="'+ic.d+'"/></svg><span></span>';
    b.lastChild.textContent=ic.name;
    frag.appendChild(b);
  }
  grid.appendChild(frag);shown=end;moreBtn.style.display=shown<view.length?"inline-block":"none";
}
grid.addEventListener("click",function(e){
  var b=e.target.closest(".ewt-icon");if(!b)return;
  var k=b.getAttribute("data-k"),ic=all.filter(function(x){return x.key===k})[0];if(ic)select(ic);
});
moreBtn.addEventListener("click",more);
search.addEventListener("input",EWT.debounce(filter,150));
tabs.addEventListener("click",function(e){
  var c=e.target.closest(".platform-chip");if(!c)return;
  [].forEach.call(tabs.children,function(x){x.classList.remove("is-active")});c.classList.add("is-active");set=c.getAttribute("data-v");filter();
});
function select(ic){
  cur=ic;[].forEach.call(grid.querySelectorAll(".is-on"),function(x){x.classList.remove("is-on")});
  var el=grid.querySelector('[data-k="'+ic.key+'"]');if(el)el.classList.add("is-on");
  metaIcon.textContent=ic.name+" ("+ic.set+")";render();
}
function size(){var n=Math.round(Number($("size").value));return Math.max(16,Math.min(4096,n||256))}
function draw(){
  var S=size(),pad=Number($("pad").value)/100,rot=Number($("rot").value),flip=$("flip").checked,color=$("iconColor").value,bgMode=$("bgMode").value,radius=Number($("radius").value)/100;
  EWT.checkSize(S,S,"The PNG");
  var cv=EWT.newCanvas(S,S),g=cv.getContext("2d");
  if(bgMode==="color"){
    g.fillStyle=$("bgColor").value;var r=Math.min(S/2,radius*S);
    g.beginPath();if(g.roundRect)g.roundRect(0,0,S,S,r);else g.rect(0,0,S,S);g.fill();
  }
  var inner=S*(1-2*pad),w=cur.w,h=cur.h,rotated=rot===90||rot===270,bw=rotated?h:w,bh=rotated?w:h,sc=Math.min(inner/bw,inner/bh);
  var svg=svgOf(cur,color);
  return new Promise(function(res,rej){
    var im=new Image();
    im.onload=function(){
      g.save();g.translate(S/2,S/2);g.rotate(rot*Math.PI/180);if(flip)g.scale(-1,1);
      g.drawImage(im,-w*sc/2,-h*sc/2,w*sc,h*sc);g.restore();res(cv);
    };
    im.onerror=function(){rej(EWT.userError("This icon could not be drawn by your browser."))};
    /* rasterise the vector at the final size for a crisp edge */
    im.width=Math.ceil(w*sc);im.height=Math.ceil(h*sc);
    im.src="data:image/svg+xml;charset=utf-8,"+encodeURIComponent(svg.replace("<svg ",'<svg width="'+Math.ceil(w*sc)+'" height="'+Math.ceil(h*sc)+'" '));
  });
}
function render(){
  if(!cur)return;
  var tok=++busy;
  draw().then(function(cv){
    if(tok!==busy)return;
    previewCanvas.width=cv.width;previewCanvas.height=cv.height;previewCanvas.getContext("2d").drawImage(cv,0,0);
    metaDims.textContent=cv.width+" × "+cv.height+" px";
    return EWT.canvasToBlob(cv,"image/png").then(function(b){if(tok!==busy)return;blob=b;downloadBtn.disabled=false;$("metaSize").textContent=fmtBytes(b.size);showStatus("")});
  }).catch(function(e){if(tok!==busy)return;blob=null;downloadBtn.disabled=true;showStatus(msgOf(e),"error")});
}
var rerender=EWT.debounce(render,120);
resultPanel.addEventListener("input",function(e){var t=e.target;if(!t||!t.id)return;var v=$(t.id+"V");if(v&&t.type==="range")v.textContent=t.value+(t.getAttribute("data-unit")||"");rerender()});
resultPanel.addEventListener("change",function(e){var t=e.target;if(t&&(t.tagName==="SELECT"||t.type==="checkbox"))rerender()});
$("sizeChips").addEventListener("click",function(e){var c=e.target.closest(".platform-chip");if(!c)return;[].forEach.call($("sizeChips").children,function(x){x.classList.remove("is-active")});c.classList.add("is-active");$("size").value=c.getAttribute("data-v");rerender()});
$("bgMode").addEventListener("change",function(){$("bgBox").style.display=$("bgMode").value==="color"?"block":"none"});
downloadBtn.addEventListener("click",function(){if(blob&&cur)EWT.download(blob,"fa-"+cur.name+"-"+size()+"px.png")});
svgBtn.addEventListener("click",function(){if(!cur)return;EWT.download(new Blob([svgOf(cur,$("iconColor").value)],{type:"image/svg+xml"}),"fa-"+cur.name+".svg")});
resetBtn.addEventListener("click",function(){search.value="";set="all";[].forEach.call(tabs.children,function(x,i){x.classList.toggle("is-active",i===0)});$("size").value=256;$("pad").value=10;$("padV").textContent="10%";$("iconColor").value="#111827";$("bgMode").value="none";$("bgBox").style.display="none";$("rot").value="0";$("flip").checked=false;filter()});
`;

export const FA = {
  slug: 'font-awesome-to-png', name: 'Font Awesome to PNG Converter', noDrop: true,
  metaTitle: 'Font Awesome to PNG - Free Icon Converter | EasyWorkTools.online',
  metaDescription: 'Turn any free Font Awesome icon into a PNG at any size and colour, with transparent or coloured background. Search 2,800+ free icons. Runs in your browser.',
  keywords: ['font awesome to png', 'font awesome icon to png', 'fontawesome png download', 'icon to png converter', 'font awesome icons png'],
  lede: 'Pick any of the free Font Awesome icons, choose a colour and size, and download it as a PNG with a transparent or coloured background. Nothing is uploaded or sent anywhere.',
  heroExtra: `      <div class="opt-row" style="margin:6px 0 12px">
        <input type="search" id="iconSearch" class="ewt-text" placeholder="Search icons, for example: heart, user, arrow, github" aria-label="Search Font Awesome icons" autocomplete="off">
      </div>
      <div class="platform-row" id="setTabs" style="margin:0 0 10px">
        <span class="platform-chip is-active" data-v="all" role="button" tabindex="0"><i class="dot"></i>All</span>
        <span class="platform-chip" data-v="solid" role="button" tabindex="0"><i class="dot"></i>Solid</span>
        <span class="platform-chip" data-v="regular" role="button" tabindex="0"><i class="dot"></i>Regular</span>
        <span class="platform-chip" data-v="brands" role="button" tabindex="0"><i class="dot"></i>Brands</span>
      </div>
      <p class="stage-hint" id="iconCount" aria-live="polite">Loading icons…</p>
      <div class="ewt-grid" id="iconGrid" role="list"></div>
      <p class="stage-hint" id="noResults" style="display:none">No icon matches that search. Try a shorter word, such as “user” or “arrow”.</p>
      <button type="button" class="btn-ghost" id="moreBtn" style="display:none;margin-top:10px">Show more icons</button>
      <p class="attribution" style="margin-top:12px">Icons: Font Awesome Free <span id="faVersion"></span> by Fonticons, Inc., licensed <a href="https://creativecommons.org/licenses/by/4.0/" rel="noopener" target="_blank">CC BY 4.0</a>. Free icons only; Pro icons are not included.</p>`,
  stage: `          <div class="preview-box checker"><canvas id="previewCanvas" width="256" height="256"></canvas></div>
          <div class="stage-meta"><span>Icon: <b id="metaIcon">—</b></span><span>PNG: <b id="metaSize">—</b></span></div>`,
  side: `          <h2>PNG settings</h2>
          <dl class="kv"><dt>Size</dt><dd id="metaDims">—</dd><dt>Format</dt><dd>PNG</dd></dl>
          ${ui.label('Size in pixels')}
          <input type="number" id="size" class="ewt-num" min="16" max="4096" step="1" value="256" style="margin-bottom:8px">
          ${ui.chips('sizeChips', [{ v: '32', l: '32' }, { v: '64', l: '64' }, { v: '128', l: '128' }, { v: '256', l: '256' }, { v: '512', l: '512' }, { v: '1024', l: '1024' }], '256')}
          ${ui.color('iconColor', 'Icon colour', '#111827')}
          ${ui.select('bgMode', 'Background', [{ v: 'none', l: 'Transparent' }, { v: 'color', l: 'Solid colour' }], 'none')}
          <div id="bgBox" style="display:none">${ui.color('bgColor', 'Background colour', '#ffffff')}${ui.slider('radius', 'Corner roundness', 0, 50, 0, '%').replace('<input type="range"', '<input type="range" data-unit="%"')}</div>
          ${ui.slider('pad', 'Padding', 0, 40, 10, '%').replace('<input type="range"', '<input type="range" data-unit="%"')}
          ${ui.select('rot', 'Rotate', [{ v: '0', l: 'None' }, { v: '90', l: '90°' }, { v: '180', l: '180°' }, { v: '270', l: '270°' }], '0')}
          ${ui.check('flip', 'Flip horizontally', false)}
          <button class="btn-ghost" type="button" id="svgBtn" style="width:100%;margin-top:6px">Download SVG instead</button>`,
  downloadLabel: 'Download PNG', resetLabel: 'Reset',
  libs: ['common'], script: SCRIPT,
  seoHeading: 'Download Font Awesome Icons as PNG Images',
  seoHtml: [
    p('Font Awesome is the most widely used icon set on the web, but its icons normally live in a font or an SVG sprite. Sometimes you just need a PNG: for a slide, a document, an email, an app store listing or a design tool that does not accept fonts. This tool lets you search the free icon set, pick a colour, size and background, and download a crisp PNG. The icon is drawn from its original vector outline at the exact size you choose, so it stays sharp even at 1024 pixels.'),
    h3('What is included'),
    table(['Set', 'Style', 'Notes'], [['Solid', 'Filled shapes', 'The largest free set'], ['Regular', 'Outlined shapes', 'A smaller free subset'], ['Brands', 'Company and product logos', 'Trademarks belong to their owners']]),
    h3('How to turn an icon into a PNG'),
    ol(['Search for an icon and click it.', 'Set the size in pixels, the icon colour and the padding.', 'Choose a transparent background, or a solid colour with optional rounded corners.', 'Download the PNG, or the SVG if you prefer the vector.']),
    h3('Licence and attribution'),
    p('Font Awesome Free icons are licensed CC BY 4.0, which means you may use them, including commercially, as long as you give credit to Font Awesome. A line such as “Icons by Font Awesome (fontawesome.com), CC BY 4.0” in your credits or documentation is enough. Brand icons are logos of their owners and their use is subject to those brands’ guidelines.'),
  ].join('\n    '),
  faqs: [
    { q: 'Which Font Awesome icons are available?', a: 'The free set: all Solid, Regular and Brands icons that ship in Font Awesome Free. Font Awesome Pro icons (such as Light, Thin and Duotone) are not included and are not available here.' },
    { q: 'Do I have to credit Font Awesome?', a: 'Yes. The free icons are CC BY 4.0, which requires attribution. Mention Font Awesome and the licence somewhere reasonable, such as an about page or credits.' },
    { q: 'What is the largest PNG I can make?', a: 'Up to 4096 × 4096 pixels. Because the PNG is drawn from the vector outline, large sizes stay sharp.' },
    { q: 'Can I get a transparent PNG?', a: 'Yes, transparent is the default. Choose Solid colour only if you want a background.' },
    { q: 'Is anything uploaded?', a: 'No. The icons are bundled with the page and the PNG is drawn in your browser.' },
  ],
  features: ['2,800+ free Font Awesome icons', 'Any colour, size up to 4096 px, padding, rotation and flip', 'Transparent or rounded solid background', 'PNG or SVG download'],
  cardTitle: 'Font Awesome to PNG', cardDescription: 'Turn any free Font Awesome icon into a PNG at any size and colour, with a transparent or solid background.',
  tags: ['font awesome to png', 'icon to png', 'fontawesome png', 'icon converter'], iconKey: 'image',
  related: ['favicon-generator', 'svg-optimizer', 'png-to-svg'],
};
