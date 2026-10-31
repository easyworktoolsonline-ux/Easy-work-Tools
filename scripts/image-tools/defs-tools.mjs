import { ui } from './core.mjs';
import { p, h3, ol, table } from './converters.mjs';

const SAMPLE = 'Month,Sales,Costs\nJan,120,80\nFeb,150,95\nMar,180,110\nApr,165,105\nMay,210,130\nJun,240,150';

const CHART_SCRIPT = String.raw`
var cv=$("chartCanvas"),g=cv.getContext("2d"),data=null,timer=null,csvIn=$("csvFile");
resultPanel.classList.add("show");
var st={type:"bar",legend:"top",bg:"white"};
function cfg(){return {type:st.type,title:$("cTitle").value.trim(),xTitle:$("cX").value.trim(),yTitle:$("cY").value.trim(),legend:st.legend,values:$("cVals").checked,grid:$("cGrid").checked,stacked:$("cStack").checked,smooth:$("cSmooth").checked,markers:$("cMark").checked,palette:$("cPal").value,bg:st.bg,fontScale:Number($("cFont").value)/100,zeroBase:$("cZero").checked}}
function size(){var w=Math.round(Number($("cW").value)),h=Math.round(Number($("cH").value));return {w:w,h:h}}
function validSize(){var s=size();if(!(s.w>=200&&s.w<=4000&&s.h>=150&&s.h<=4000)){return null}return s}
function render(){
  var r=EWT.chart.parse($("cData").value);
  if(r.error){data=null;showStatus(r.error,"error");g.clearRect(0,0,cv.width,cv.height);cv.width=600;cv.height=100;$("metaDims").textContent="—";return}
  var s=validSize();
  if(!s){showStatus("Width must be 200 to 4000 px and height 150 to 4000 px.","error");return}
  data=r;
  var pw=Math.min(s.w,900),ph=Math.round(pw*s.h/s.w);cv.width=pw;cv.height=ph;
  try{
    var c=cfg();
    if((c.type==="pie"||c.type==="doughnut")){
      if(r.series[0].values.some(function(v){return v<0}))throw new Error("Pie and doughnut charts cannot show negative numbers. Use a bar or line chart instead.");
      if(!(r.series[0].values.reduce(function(a,b){return a+b},0)>0))throw new Error("Pie and doughnut charts need numbers that add up to more than zero.");
    }
    EWT.chart.draw(g,pw,ph,c,r);showStatus("");
    $("metaDims").textContent=s.w+" × "+s.h+" px PNG · "+r.labels.length+" rows, "+r.series.length+" series"+((c.type==="pie"||c.type==="doughnut")&&r.series.length>1?" (pie uses the first series)":"");
  }catch(e){data=null;showStatus(msgOf(e),"error")}
}
function later(){clearTimeout(timer);timer=setTimeout(render,120)}
["cData","cTitle","cX","cY","cVals","cGrid","cStack","cSmooth","cMark","cPal","cFont","cZero","cW","cH"].forEach(function(id){var el=$(id);el.addEventListener("input",function(){var v=$(id+"V");if(v)v.textContent=el.value+"%";later()});el.addEventListener("change",later)});
function chips(id,fn){$(id).addEventListener("click",function(e){var c=e.target.closest(".platform-chip");if(!c)return;[].forEach.call($(id).children,function(x){x.classList.remove("is-active")});c.classList.add("is-active");fn(c.getAttribute("data-v"));later()})}
chips("typeChips",function(v){st.type=v});chips("legChips",function(v){st.legend=v});chips("bgChips",function(v){st.bg=v});
csvIn.addEventListener("change",function(){
  var f=csvIn.files[0];if(!f)return;
  if(f.size>2000000){showStatus("That file is too large for a chart (over 2 MB). Paste a smaller table.","error");return}
  f.text().then(function(t){if(/[\u0000]/.test(t.slice(0,2000))){throw new Error("That does not look like a text or CSV file.")}$("cData").value=t.replace(/^﻿/,"");render()}).catch(function(e){showStatus(msgOf(e),"error")});
  csvIn.value="";
});
$("cSample").addEventListener("click",function(){$("cData").value=${JSON.stringify(SAMPLE)};render()});
downloadBtn.addEventListener("click",function(){
  render();
  if(!data){return}
  var s=validSize();if(!s)return;
  try{EWT.checkSize(s.w,s.h,"The chart")}catch(e){showStatus(msgOf(e),"error");return}
  var out=EWT.newCanvas(s.w,s.h);
  try{EWT.chart.draw(out.getContext("2d"),s.w,s.h,cfg(),data)}catch(e){showStatus(msgOf(e),"error");return}
  EWT.canvasToBlob(out,"image/png").then(function(b){EWT.download(b,($("cTitle").value.trim().toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")||"chart")+".png");showStatus("Saved "+s.w+" × "+s.h+" px, "+fmtBytes(b.size)+".","ok")}).catch(function(e){showStatus(msgOf(e),"error")});
});
resetBtn.addEventListener("click",function(){$("cData").value=${JSON.stringify(SAMPLE)};$("cTitle").value="";render()});
render();
`;

export const CHART = {
  slug: 'chart-maker', name: 'Chart Maker', noDrop: true,
  metaTitle: 'Chart Maker - Bar, Line, Pie Charts to PNG | EasyWorkTools.online',
  metaDescription: 'Make a bar, line, area, pie or doughnut chart online for free. Paste or upload CSV data, style it, and download a PNG. Drawn in your browser, nothing is uploaded.',
  keywords: ['chart maker', 'bar chart maker', 'pie chart maker', 'line graph maker online', 'make a chart from csv', 'graph maker png'],
  lede: 'Turn a small table into a clean chart. Paste your data or load a CSV file, pick a chart type, adjust the labels and colours, and download the chart as a PNG. Nothing leaves your browser.',
  heroExtra: `      <div class="slider-group" style="margin:6px 0 4px">
        <label for="cData">Your data <small class="opt-hint" style="display:inline">First column: labels. Other columns: numbers. A header row is optional.</small></label>
        <textarea id="cData" class="ewt-text" spellcheck="false" aria-label="Chart data, comma, tab or semicolon separated">${SAMPLE}</textarea>
      </div>
      <div class="action-row" style="margin:8px 0 0">
        <label class="btn-ghost" style="cursor:pointer;display:inline-block">Load a CSV or text file<input type="file" id="csvFile" accept=".csv,.tsv,.txt,text/csv,text/plain" style="display:none"></label>
        <button class="btn-ghost" type="button" id="cSample">Use sample data</button>
      </div>`,
  dropSub: '', accept: '',
  stage: `          <div class="preview-box" style="background:repeating-conic-gradient(#e5e7eb 0 25%,#fff 0 50%) 0 0/16px 16px"><canvas id="chartCanvas" role="img" aria-label="Chart preview"></canvas></div>
          <div class="stage-meta"><span>Export: <b id="metaDims">—</b></span></div>`,
  side: `          <h2>Chart options</h2>
          ${ui.label('Chart type')}
          ${ui.chips('typeChips', [{ v: 'bar', l: 'Bar' }, { v: 'hbar', l: 'Horizontal bar' }, { v: 'line', l: 'Line' }, { v: 'area', l: 'Area' }, { v: 'pie', l: 'Pie' }, { v: 'doughnut', l: 'Doughnut' }], 'bar')}
          <div class="slider-group"><label for="cTitle">Title</label><input type="text" id="cTitle" class="ewt-text" maxlength="120" placeholder="Optional"></div>
          <div class="slider-group"><label for="cX">Horizontal axis title</label><input type="text" id="cX" class="ewt-text" maxlength="80" placeholder="Optional"></div>
          <div class="slider-group"><label for="cY">Vertical axis title</label><input type="text" id="cY" class="ewt-text" maxlength="80" placeholder="Optional"></div>
          ${ui.label('Legend')}
          ${ui.chips('legChips', [{ v: 'top', l: 'Top' }, { v: 'bottom', l: 'Bottom' }, { v: 'right', l: 'Right' }, { v: 'none', l: 'None' }], 'top')}
          ${ui.select('cPal', 'Colours', [{ v: 'classic', l: 'Classic' }, { v: 'pastel', l: 'Pastel' }, { v: 'ocean', l: 'Ocean' }, { v: 'sunset', l: 'Sunset' }, { v: 'mono', l: 'Greys' }], 'classic')}
          ${ui.label('Background')}
          ${ui.chips('bgChips', [{ v: 'white', l: 'White' }, { v: 'transparent', l: 'Transparent' }, { v: 'dark', l: 'Dark' }], 'white')}
          ${ui.check('cVals', 'Show values on the chart', false)}
          ${ui.check('cGrid', 'Show grid lines', true)}
          ${ui.check('cStack', 'Stack series (bar and area)', false)}
          ${ui.check('cSmooth', 'Smooth lines', false)}
          ${ui.check('cMark', 'Show point markers (line)', true)}
          ${ui.check('cZero', 'Start line chart at zero', false)}
          ${ui.slider('cFont', 'Text size', 70, 160, 100, '%')}
          ${ui.label('Image size (pixels)')}
          <div style="display:flex;gap:8px;margin:0 0 16px"><input type="number" id="cW" class="ewt-num" min="200" max="4000" value="1200" aria-label="Width in pixels"><input type="number" id="cH" class="ewt-num" min="150" max="4000" value="700" aria-label="Height in pixels"></div>`,
  downloadLabel: 'Download PNG', resetLabel: 'Reset data',
  libs: ['common', 'chart'], script: CHART_SCRIPT,
  seoHeading: 'Make a Clean Chart From Your Own Numbers',
  seoHtml: [
    p('Paste a few rows from a spreadsheet, or load a CSV file, and this tool draws the chart straight onto a canvas in your browser. Nothing is sent to a server, and the PNG you download is exactly what the preview shows, only rendered at the size you pick.'),
    h3('Which chart type to use'),
    table(['Chart', 'Use it for'], [['Bar', 'Comparing values across categories'], ['Horizontal bar', 'Long category names or rankings'], ['Line', 'Change over time'], ['Area', 'Totals over time, especially stacked'], ['Pie and doughnut', 'Shares of one whole, with a handful of slices']]),
    h3('How to make a chart'),
    ol(['Paste your data into the box, or load a CSV file. Put labels in the first column and numbers in the others.', 'Choose the chart type and add a title and axis names.', 'Adjust colours, legend and size, then download the PNG.']),
    p('Data format: separate columns with commas, tabs or semicolons. If the first row contains column names they become the legend. Every value after the label must be a plain number; $, % and thousands separators are accepted. Pie and doughnut charts use the first number column.'),
  ].join('\n    '),
  faqs: [
    { q: 'What data format does it accept?', a: 'One row per category. The first column is the label and the following columns are numbers, separated by commas, tabs or semicolons. You can paste straight from a spreadsheet. A header row is optional.' },
    { q: 'Why does it say a value is not a number?', a: 'Every cell after the label must be numeric. The message names the row and column so you can fix it. Currency signs, percent signs and thousands separators are fine; words are not.' },
    { q: 'How many rows and series can I plot?', a: 'Up to 200 rows and 10 series. Pie and doughnut charts show the first series only and do not accept negative numbers.' },
    { q: 'Can I get a transparent background?', a: 'Yes. Choose Transparent for a PNG you can place on any page. Choose Dark for light text on a dark background.' },
    { q: 'Is my data uploaded?', a: 'No. The chart is drawn in this tab and your data never leaves your device.' },
  ],
  features: ['Bar, horizontal bar, line, area, pie and doughnut charts', 'Paste data or load a CSV file', 'Titles, legend, colours and value labels', 'PNG export with transparent background option'],
  cardTitle: 'Chart Maker', cardDescription: 'Make bar, line, area, pie and doughnut charts from pasted or CSV data and download them as PNG, free in your browser.',
  tags: ['chart maker', 'bar chart', 'pie chart', 'line graph', 'graph maker'], iconKey: 'image',
  related: ['image-format-converter', 'easy-image-resizer', 'image-merge-stitch'],
};



/* ---------------- background removal (colour based, no AI) ---------------- */
const bgScript = (def) => String.raw`
var cv=$("stageCanvas"),g=cv.getContext("2d"),wrap=$("stageBox");
var S={img:null,w:0,h:0,px:null,color:[255,255,255],seed:null,method:"${def.method}",tool:"pick",edit:null,name:"image",brush:30,timer:null,last:null,drag:false};
EWT.setupDrop({dropzone:dropzone,input:fileInput,multiple:false,onFiles:function(f){load(f[0])}});
function load(file){
  showStatus("");
  if(!/^image\//.test(file.type)&&!/\.(jpe?g|png|webp|gif|bmp|avif)$/i.test(file.name)){showStatus("Please choose an image (JPG, PNG, WebP, GIF, BMP or AVIF).","error");return}
  EWT.decodeImage(file).then(function(d){
    try{EWT.checkSize(d.width,d.height,"This image")}catch(e){showStatus(msgOf(e),"error");return}
    S.w=d.width;S.h=d.height;S.px=EWT.getPixels(d.canvas).data;S.name=EWT.baseName(file.name);S.edit=new Uint8Array(S.w*S.h);S.seed=null;
    S.color=EWT.bg.estimate(S.px,S.w,S.h);setSwatch();
    cv.width=S.w;cv.height=S.h;$("metaOriginal").textContent=S.w+" × "+S.h+" px, "+fmtBytes(file.size);
    resultPanel.classList.add("show");update(true);
  }).catch(function(e){showStatus(msgOf(e),"error")});
}
function setSwatch(){var c=S.color;$("swatch").style.background="rgb("+c[0]+","+c[1]+","+c[2]+")";$("swatchTxt").textContent="rgb("+c[0]+", "+c[1]+", "+c[2]+")"}
function compute(){
  var tol=Number($("tol").value),soft=Number($("soft").value);
  var m=EWT.bg.mask(S.px,S.w,S.h,{color:S.color,tol:tol,soft:soft,mode:S.method==="all"?"all":"edge",seed:S.method==="point"?S.seed:null});
  if(S.method==="point"&&!S.seed){m=new Uint8Array(S.w*S.h);m.fill(255)}
  var sh=Number($("shrink").value),fe=Number($("feather").value);
  if(sh)m=EWT.bg.shrink(m,S.w,S.h,sh);
  if(fe)m=EWT.bg.feather(m,S.w,S.h,fe);
  var e=S.edit;for(var p=0;p<m.length;p++){if(e[p]===1)m[p]=0;else if(e[p]===2)m[p]=255}
  return m;
}
function update(now){
  if(!S.px)return;
  clearTimeout(S.timer);
  var run=function(){
    var m=compute(),out=EWT.bg.compose(S.px,S.w,S.h,m,{color:S.color,decontaminate:$("decon").checked});
    S.last={m:m,out:out};
    g.putImageData(new ImageData(out,S.w,S.h),0,0);
    var clear=0;for(var i=0;i<m.length;i++)if(m[i]<128)clear++;
    $("metaDims").textContent=Math.round(clear*100/m.length)+"% of the picture made transparent";
    $("pointHint").style.display=S.method==="point"&&!S.seed?"block":"none";
  };
  if(now)run();else S.timer=setTimeout(run,90);
}
function imgPos(e){var r=cv.getBoundingClientRect();return {x:Math.floor((e.clientX-r.left)*S.w/r.width),y:Math.floor((e.clientY-r.top)*S.h/r.height)}}
function paint(q){
  var rad=Math.max(1,Math.round(S.brush*Math.max(S.w,S.h)/1000)),v=S.tool==="erase"?1:2,r2=rad*rad;
  for(var y=Math.max(0,q.y-rad);y<=Math.min(S.h-1,q.y+rad);y++)for(var x=Math.max(0,q.x-rad);x<=Math.min(S.w-1,q.x+rad);x++){var dx=x-q.x,dy=y-q.y;if(dx*dx+dy*dy<=r2)S.edit[y*S.w+x]=v}
}
cv.addEventListener("pointerdown",function(e){
  if(!S.px)return;var q=imgPos(e);if(q.x<0||q.y<0||q.x>=S.w||q.y>=S.h)return;
  if(S.tool==="pick"){
    var i=(q.y*S.w+q.x)*4;if(S.px[i+3]<10){showStatus("That spot is already transparent. Click a coloured part of the background.","info");return}
    S.color=[S.px[i],S.px[i+1],S.px[i+2]];S.seed=[q.x,q.y];setSwatch();showStatus("");update(true);
  }else{cv.setPointerCapture(e.pointerId);S.drag=true;paint(q);update(false)}
});
cv.addEventListener("pointermove",function(e){if(!S.drag)return;paint(imgPos(e));update(false)});
function end(){S.drag=false}cv.addEventListener("pointerup",end);cv.addEventListener("pointercancel",end);
function chips(id,fn){$(id).addEventListener("click",function(e){var c=e.target.closest(".platform-chip");if(!c)return;[].forEach.call($(id).children,function(x){x.classList.remove("is-active")});c.classList.add("is-active");fn(c.getAttribute("data-v"))})}
chips("methodChips",function(v){S.method=v;update(true)});
chips("toolChips",function(v){S.tool=v;cv.style.cursor=v==="pick"?"crosshair":"cell"});
chips("prevChips",function(v){wrap.className="preview-box"+(v==="checker"?" checker":"");wrap.style.background=v==="checker"?"":v});
["tol","soft","shrink","feather","brush","decon"].forEach(function(id){$(id).addEventListener("input",function(){var v=$(id+"V");if(v)v.textContent=$(id).value+(id==="tol"||id==="soft"?"%":" px");if(id==="brush")S.brush=Number($("brush").value);update(false)})});
$("autoBtn").addEventListener("click",function(){if(!S.px)return;S.color=EWT.bg.estimate(S.px,S.w,S.h);S.seed=null;setSwatch();update(true)});
$("clearEdits").addEventListener("click",function(){if(!S.px)return;S.edit.fill(0);update(true)});
downloadBtn.addEventListener("click",function(){
  if(!S.px||!S.last)return;
  var m=S.last.m,any=false;for(var i=0;i<m.length;i++)if(m[i]<255){any=true;break}
  if(!any){showStatus("Nothing was made transparent. Click the background colour in the picture, or raise the tolerance.","error");return}
  downloadBtn.disabled=true;
  EWT.apng.encode([{rgba:S.last.out,delay:0}],S.w,S.h).then(function(u){var b=new Blob([u],{type:"image/png"});EWT.download(b,S.name+"${def.suffix}.png");showStatus("Saved "+S.w+" × "+S.h+" px PNG with transparency, "+fmtBytes(b.size)+".","ok")}).catch(function(e){showStatus(msgOf(e),"error")}).then(function(){downloadBtn.disabled=false});
});
resetBtn.addEventListener("click",function(){S.px=null;S.last=null;resultPanel.classList.remove("show");showStatus("");window.scrollTo({top:0,behavior:"smooth"})});
`;

const bgSide = (d) => `          <h2>${d.h2}</h2>
          <p class="opt-hint" style="margin:0 0 14px">${d.hint}</p>
          ${ui.label('Background colour to remove')}
          <div style="display:flex;align-items:center;gap:10px;margin:0 0 6px"><span id="swatch" style="width:34px;height:34px;border-radius:8px;border:1px solid var(--border);display:inline-block"></span><b id="swatchTxt" style="font-size:13px"></b></div>
          <button class="btn-ghost" type="button" id="autoBtn" style="width:100%;margin:0 0 16px">Detect from the picture edges</button>
          ${ui.label('What to remove')}
          ${ui.chips('methodChips', [{ v: 'edge', l: 'Connected to the edges' }, { v: 'point', l: 'Connected to my click' }, { v: 'all', l: 'This colour everywhere' }], d.method)}
          <p class="opt-hint" id="pointHint" style="display:none;margin:-8px 0 12px">Click the background in the picture to choose where to start.</p>
          ${ui.slider('tol', 'Tolerance', 0, 100, d.tol, '%')}
          ${ui.slider('soft', 'Edge softness', 0, 100, 25, '%')}
          ${ui.slider('shrink', 'Shrink edge (removes a halo)', 0, 8, 0, ' px')}
          ${ui.slider('feather', 'Feather', 0, 10, 0, ' px')}
          ${ui.check('decon', 'Remove background colour from edge pixels', true, 'Reduces a light or coloured fringe around the subject.')}
          ${ui.label('Tool')}
          ${ui.chips('toolChips', [{ v: 'pick', l: 'Pick colour' }, { v: 'erase', l: 'Erase brush' }, { v: 'restore', l: 'Restore brush' }], 'pick')}
          ${ui.slider('brush', 'Brush size', 3, 150, 30, ' px')}
          <button class="btn-ghost" type="button" id="clearEdits" style="width:100%;margin:0 0 16px">Clear brush edits</button>
          ${ui.label('Preview behind the picture')}
          ${ui.chips('prevChips', [{ v: 'checker', l: 'Checker' }, { v: '#ffffff', l: 'White' }, { v: '#111827', l: 'Black' }, { v: '#22c55e', l: 'Green' }], 'checker')}`;

const bgStage = `          <div class="preview-box checker" id="stageBox"><canvas id="stageCanvas" role="img" aria-label="Preview with the background removed" style="cursor:crosshair;touch-action:none"></canvas></div>
          <p class="stage-hint">Click the picture to pick the background colour. Use the brushes to fix any spots.</p>
          <div class="stage-meta"><span>Original: <b id="metaOriginal">—</b></span><span>Result: <b id="metaDims">—</b></span></div>`;

const bgCommon = {
  dropSub: 'JPG, PNG, WebP, GIF, BMP, AVIF accepted',
  accept: 'image/jpeg,image/png,image/webp,image/gif,image/bmp,image/avif,.jpg,.jpeg,.png,.webp,.gif,.bmp,.avif',
  libs: ['common', 'apng', 'bgremove'], downloadLabel: 'Download transparent PNG', resetLabel: 'Choose another image',
  stage: bgStage,
};
const honest = 'This tool removes a background by colour. It does not use artificial intelligence and cannot recognise people or objects, so it works best on plain, evenly lit backgrounds and is not suited to busy or gradient backgrounds.';

export const BGREMOVE = {
  ...bgCommon,
  slug: 'remove-background-from-image', name: 'Remove Background from Image',
  metaTitle: 'Remove Background from Image - Free PNG Cutout | EasyWorkTools.online',
  metaDescription: 'Remove a plain background from an image online for free. Detects the background colour, makes it transparent and saves a PNG. Colour-based, in your browser, nothing uploaded.',
  keywords: ['remove background from image', 'background remover', 'remove white background', 'transparent background maker', 'cutout png'],
  lede: 'Remove a plain background and save the subject as a transparent PNG. The background colour is detected for you; fine-tune it with tolerance and brushes. It works by colour, in your browser, and nothing is uploaded.',
  dropAria: 'Upload an image to remove its background',
  side: bgSide({ h2: 'Remove the background', hint: 'Best for plain backgrounds such as product photos on white, studio shots and logos.', method: 'edge', tol: 20 }),
  script: bgScript({ method: 'edge', suffix: '-no-background' }),
  seoHeading: 'Remove a Plain Background Without Uploading Your Photo',
  seoHtml: [
    p(honest),
    p('The tool looks at the colour along the edges of your picture, treats it as the background, and makes every connected pixel of a similar colour transparent. Tolerance sets how different a colour may be and still be removed, and edge softness blends the cut so it does not look jagged.'),
    h3('When it works well'),
    table(['Picture', 'Result'], [['Product on a white or grey backdrop', 'Clean cut in one step'], ['Logos, icons and screenshots', 'Clean cut, often with a low tolerance'], ['Portrait on an even studio backdrop', 'Good, use the brushes on hair and shadows'], ['Photo with trees, rooms or gradients', 'Not suitable: the background has many colours']]),
    h3('How to remove a background'),
    ol(['Drop an image into the box above. The background colour is detected from the edges.', 'If it picked the wrong colour, click the background in the picture.', 'Raise the tolerance until the background is gone, then use shrink edge or the brushes for the last spots.', 'Download the transparent PNG.']),
    p('The result is saved as a lossless PNG with a real alpha channel at the full size of your original.'),
  ].join('\n    '),
  faqs: [
    { q: 'Is this AI background removal?', a: 'No. It is a colour-based tool and has no model that understands what is in the picture. It removes a background colour you can see and adjust. For complex backgrounds you would need an AI cutout tool.' },
    { q: 'Why is part of my subject disappearing?', a: 'Part of the subject is close to the background colour, or the tolerance is too high. Lower the tolerance, use Connected to the edges so enclosed areas stay, or paint them back with the Restore brush.' },
    { q: 'How do I remove the white halo around the subject?', a: 'Raise the shrink edge by one or two pixels and keep the edge colour clean-up on.' },
    { q: 'Are my images uploaded?', a: 'No. The image is processed in this tab and never leaves your device.' },
    { q: 'What file do I get?', a: 'A PNG at the original size with a transparent background, written losslessly.' },
  ],
  features: ['Detects the background colour from the edges', 'Tolerance, softness, shrink and feather controls', 'Erase and restore brushes', 'Full-size transparent PNG, colour based and not AI'],
  cardTitle: 'Remove Background from Image', cardDescription: 'Remove a plain background by colour and save a transparent PNG, free in your browser. Not AI.',
  tags: ['remove background', 'background remover', 'transparent png', 'cutout'], iconKey: 'img-editor',
  related: ['make-background-transparent', 'image-crop-rotate', 'image-format-converter'],
};

export const BGTRANSPARENT = {
  ...bgCommon,
  slug: 'make-background-transparent', name: 'Make Background Transparent',
  metaTitle: 'Make Background Transparent - Free PNG Maker | EasyWorkTools.online',
  metaDescription: 'Make a colour in your image transparent, such as a white background on a logo. Click the colour, adjust tolerance and download a PNG. In your browser, nothing uploaded.',
  keywords: ['make background transparent', 'transparent background png', 'make white background transparent', 'remove color from image', 'color to transparent'],
  lede: 'Click a colour in your picture to make it transparent. Perfect for turning a white or solid-colour background on a logo, icon or scan into a PNG you can place on anything. It runs in your browser and nothing is uploaded.',
  dropAria: 'Upload an image to make its background transparent',
  side: bgSide({ h2: 'Make a colour transparent', hint: 'Click the colour you want to remove, then adjust the tolerance.', method: 'all', tol: 15 }),
  script: bgScript({ method: 'all', suffix: '-transparent' }),
  seoHeading: 'Turn a Solid Colour Into Transparency',
  seoHtml: [
    p(honest),
    p('Pick any colour in the picture and every pixel close to it becomes transparent. Choose This colour everywhere to clear it across the whole picture, including inside letters and holes, or Connected to the edges to clear only the background and keep the same colour inside the subject.'),
    h3('Choosing the method'),
    table(['Method', 'Use it for'], [['This colour everywhere', 'Logos, icons, line art, signatures and scans on white'], ['Connected to the edges', 'Objects that contain the same colour inside, such as a white shirt on a white wall'], ['Connected to my click', 'Clearing one area only, such as the sky or one patch']]),
    h3('How to make a background transparent'),
    ol(['Drop an image into the box above.', 'Click the colour you want to remove, usually the background.', 'Adjust tolerance until the colour is fully gone. Use softness to smooth the edge.', 'Download the PNG, which keeps a true transparent background.']),
    p('JPG cannot store transparency, so the output is always a PNG. If your picture is a JPG, expect faint noise around the edges that a slightly higher tolerance will clear.'),
  ].join('\n    '),
  faqs: [
    { q: 'Why is the background not fully transparent?', a: 'JPG images have slight colour noise, so the background is not one exact colour. Raise the tolerance a little, or use edge softness for a smoother edge.' },
    { q: 'Can I make white transparent but keep white inside the object?', a: 'Yes. Choose Connected to the edges. Only white that touches the border of the picture is removed. White inside the subject stays.' },
    { q: 'Is this AI?', a: 'No. It works by colour only, so it is ideal for solid backgrounds and not for busy photos.' },
    { q: 'Why is the downloaded file a PNG?', a: 'PNG supports transparency and JPG does not. The PNG is lossless and has the same dimensions as your original.' },
    { q: 'Are my images uploaded?', a: 'No. Everything happens in this tab.' },
  ],
  features: ['Click a colour to make it transparent', 'Remove everywhere, from the edges or from a point', 'Tolerance, softness, shrink and feather', 'Erase and restore brushes, full-size PNG'],
  cardTitle: 'Make Background Transparent', cardDescription: 'Click a colour to make it transparent and save a PNG, free in your browser.',
  tags: ['transparent background', 'make transparent', 'remove white background', 'png'], iconKey: 'img-editor',
  related: ['remove-background-from-image', 'image-format-converter', 'image-border-rounded'],
};

export const TOOLS = [CHART, BGREMOVE, BGTRANSPARENT];
