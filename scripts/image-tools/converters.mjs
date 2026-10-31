/* Single-file converters: JPG/PNG/WebP/HEIC/TIFF in, TIFF/GIF/AVIF/SVG/EPS/JPG/PNG out. */
import { ui, esc } from './core.mjs';

const OUT = {
  jpg:  { ext: 'jpg',  mime: 'image/jpeg',  label: 'JPG' },
  png:  { ext: 'png',  mime: 'image/png',   label: 'PNG' },
  gif:  { ext: 'gif',  mime: 'image/gif',   label: 'GIF' },
  avif: { ext: 'avif', mime: 'image/avif',  label: 'AVIF' },
  tiff: { ext: 'tiff', mime: 'image/tiff',  label: 'TIFF' },
  svg:  { ext: 'svg',  mime: 'image/svg+xml', label: 'SVG' },
  eps:  { ext: 'eps',  mime: 'application/postscript', label: 'EPS' },
};

export function p(...a) { return a.map(x => `<p>${x}</p>`).join('\n    '); }
export function h3(t) { return `<h3>${t}</h3>`; }
export function ol(items) { return '<ol>\n' + items.map(i => `      <li>${i}</li>`).join('\n') + '\n    </ol>'; }
export function table(head, rows) {
  return `<table class="spec-table">\n      <thead><tr>${head.map(h => `<th>${h}</th>`).join('')}</tr></thead>\n      <tbody>\n` +
    rows.map(r => `        <tr>${r.map((c, i) => `<td>${i === 0 ? `<b>${c}</b>` : c}</td>`).join('')}</tr>`).join('\n') + '\n      </tbody>\n    </table>';
}

/* ------------------- the generic converter script (no backticks / dollar-brace inside) ------------------- */
const BODY = String.raw`
var previewCanvas=$("previewCanvas"),previewImg=$("previewImg"),metaOriginal=$("metaOriginal"),metaConverted=$("metaConverted"),metaDims=$("metaDims"),metaCheck=$("metaCheck"),note=$("pageNote"),stageHint=$("stageHint");
var state={src:null,name:"image",blob:null,token:0,url:null,busy:false};
var out=CFG.out;

EWT.setupDrop({dropzone:dropzone,input:fileInput,multiple:false,onFiles:function(f){loadFile(f[0])}});

function setNote(t){if(!t){note.style.display="none";note.textContent="";return}note.textContent=t;note.className="status-msg show info";note.style.display="block"}
function kindOk(file){
  var e=EWT.ext(file.name),t=file.type||"";
  if(CFG.in==="tiff")return /^(tif|tiff)$/.test(e)||t==="image/tiff";
  if(CFG.in==="heic")return /^(heic|heif)$/.test(e)||/image\/hei[cf]/.test(t);
  return /^image\//.test(t)||/^(jpe?g|png|webp|gif|bmp|svg|avif)$/.test(e);
}
function loadFile(file){
  showStatus("");setNote("");
  if(!kindOk(file)){showStatus(CFG.badFile,"error");return}
  if(!file.size){showStatus("That file is empty.","error");return}
  var tok=++state.token;
  showStatus("Reading "+file.name+" …","info");
  decode(file).then(function(src){
    if(tok!==state.token)return;
    state.src=src;state.name=EWT.baseName(file.name);
    metaOriginal.textContent=fmtBytes(file.size);
    metaDims.textContent=src.width+" × "+src.height+" px";
    if(CFG.in==="raster"&&CFG.primary){
      var e=EWT.ext(file.name),t=file.type||"";
      if(!(new RegExp(CFG.primary,"i").test(e)||new RegExp(CFG.primary,"i").test(t.replace("image/","")))&&!state.pageNote)setNote("This file is not a "+CFG.primaryLabel+" ("+(e||t||"unknown type").toUpperCase()+"), but your browser can open it, so it will be converted anyway.");
    }
    if(src.note)setNote(src.note);
    resultPanel.classList.add("show");showStatus("");
    convert();
  }).catch(function(e){if(tok!==state.token)return;showStatus(msgOf(e),"error")});
}
function decode(file){
  if(CFG.in==="tiff"){
    return EWT.readBytes(file).then(function(b){return EWT.tiff.decode(b)}).then(function(r){
      EWT.checkSize(r.width,r.height,"This TIFF");
      var n=[];if(r.pages>1)n.push("This TIFF has "+r.pages+" pages. Only the first page is converted.");
      if(r.info.orientationApplied)n.push("The camera orientation tag was applied.");
      return {canvas:EWT.putPixels(r.rgba,r.width,r.height),width:r.width,height:r.height,rgba:r.rgba,note:n.join(" ")};
    });
  }
  if(CFG.in==="heic"){
    return EwtLibs.load("heic2any.min.js").then(function(){
      if(typeof window.heic2any!=="function")throw EWT.userError("The HEIC decoder failed to load. Check your connection and try again.");
      return window.heic2any({blob:file,toType:"image/png"});
    }).then(function(res){
      var b=Array.isArray(res)?res[0]:res;
      return EWT.decodeImage(new File([b],"decoded.png",{type:"image/png"}));
    }).catch(function(e){
      if(e&&e.userMessage)throw e;
      throw EWT.userError("This HEIC file could not be decoded ("+((e&&e.message)||"unsupported variant")+"). Some newer HEIC variants are not supported by the bundled decoder.");
    });
  }
  return EWT.decodeImage(file);
}
function pixels(){if(!state.src.rgba)state.src.rgba=EWT.getPixels(state.src.canvas).data;return state.src.rgba}
function opt(id){var e=$(id);return e?e.value:""}
function sized(){
  /* optional "max side" downscale before encoding (AVIF and SVG tracing) */
  var m=Number(opt("maxSide"))||0,c=state.src.canvas,w=c.width,h=c.height;
  if(!m||Math.max(w,h)<=m)return {canvas:c,rgba:pixels(),w:w,h:h,scaled:false};
  var s=m/Math.max(w,h),nw=Math.max(1,Math.round(w*s)),nh=Math.max(1,Math.round(h*s)),n=EWT.newCanvas(nw,nh),g=n.getContext("2d");
  g.imageSmoothingEnabled=true;g.imageSmoothingQuality="high";g.drawImage(c,0,0,nw,nh);
  return {canvas:n,rgba:EWT.getPixels(n).data,w:nw,h:nh,scaled:true};
}
function encode(){
  var s=state.src,w=s.width,h=s.height;
  if(out==="jpg"){
    var flat=EWT.flatten(s.canvas,opt("bgColor")||"#ffffff");
    return EWT.canvasToBlob(flat,"image/jpeg",Number(opt("quality"))/100).then(function(b){return {blob:b,w:w,h:h}});
  }
  if(out==="png"){
    if(s.rgba&&EWT.apng)return EWT.apng.encode([{rgba:s.rgba,delay:0}],w,h).then(function(u){return {blob:new Blob([u],{type:"image/png"}),w:w,h:h}});
    return EWT.canvasToBlob(s.canvas,"image/png").then(function(b){return {blob:b,w:w,h:h}});
  }
  if(out==="gif"){
    var r=EWT.gif.encode(w,h,[{rgba:pixels(),delay:100}],{dither:$("dither").checked});
    return Promise.resolve({blob:new Blob([r.bytes],{type:"image/gif"}),w:w,h:h,info:r.hasTransparency?"Transparent pixels kept (GIF supports 1-bit transparency).":""});
  }
  if(out==="tiff"){
    var u=EWT.tiff.encode(pixels(),w,h,{compression:opt("comp")});
    return Promise.resolve({blob:new Blob([u],{type:"image/tiff"}),w:w,h:h});
  }
  if(out==="avif"){
    return EWT.avif.supported().then(function(ok){
      if(!ok)throw EWT.userError("This browser cannot create AVIF files: it does not offer an AV1 encoder to web pages. Chrome, Edge, Opera and Brave on desktop do. Try one of those, or choose JPG or WebP instead.");
      var z=sized();
      return EWT.avif.encode(z.rgba,z.w,z.h,{quality:Number(opt("quality")),speed:opt("speed")||"quality"}).then(function(r){
        return {blob:r.blob,w:z.w,h:z.h,info:(r.hasAlpha?"Transparency kept in a separate alpha plane. ":"")+(z.scaled?"Resized to "+z.w+" × "+z.h+" px before encoding.":"")};
      });
    });
  }
  if(out==="svg"){
    var cap=Number(opt("maxSide"))||1600,z2=(function(){var c=state.src.canvas;if(Math.max(c.width,c.height)<=cap)return {canvas:c,rgba:pixels(),w:c.width,h:c.height};var sc=cap/Math.max(c.width,c.height),nw=Math.max(1,Math.round(c.width*sc)),nh=Math.max(1,Math.round(c.height*sc)),n=EWT.newCanvas(nw,nh),g=n.getContext("2d");g.imageSmoothingEnabled=true;g.imageSmoothingQuality="high";g.drawImage(c,0,0,nw,nh);return {canvas:n,rgba:EWT.getPixels(n).data,w:nw,h:nh}})();
    var t=EWT.trace.run(z2.rgba,z2.w,z2.h,{colors:Number(opt("colors")),minArea:Number(opt("minArea")),smooth:$("smooth").checked,precision:Number(opt("precision")),displayWidth:w,displayHeight:h});
    if(t.empty)throw EWT.userError("There is nothing to trace: the image is fully transparent.");
    var seen={},n2=0,px=z2.rgba;for(var i=0;i<px.length&&n2<4000;i+=16){var key=(px[i]>>3)*1024+(px[i+1]>>3)*32+(px[i+2]>>3);if(!seen[key]){seen[key]=1;n2++}}
    var info=t.paths+" shapes, "+t.nodes+" points, "+t.colors.length+" colours."+(z2.w!==w?" Traced at "+z2.w+" × "+z2.h+" px and scaled up losslessly.":"");
    if(n2>=2500)info+=" This looks like a photograph: tracing photos gives large, blotchy SVGs. Logos, icons and flat artwork trace best.";
    state.svgText=t.svg;
    return Promise.resolve({blob:new Blob([t.svg],{type:"image/svg+xml"}),w:w,h:h,info:info});
  }
  if(out==="eps"){
    return EWT.eps.encode(pixels(),w,h,{dpi:Number(opt("dpi"))||72,background:opt("bgColor")||"#ffffff",level3:opt("level")==="3",title:state.name+".eps"}).then(function(r){
      return {blob:new Blob([r.bytes],{type:"application/postscript"}),w:w,h:h,info:(r.flattened?"Transparent areas were filled with the background colour because EPS cannot store transparency. ":"")+"Raster image inside an EPS wrapper (PostScript level "+r.level+")."};
    });
  }
  return Promise.reject(EWT.userError("Unsupported output."));
}
function convert(){
  if(!state.src)return;
  var tok=++state.token;
  downloadBtn.disabled=true;metaCheck.textContent="Working…";
  showStatus("Converting…","info");
  setTimeout(function(){
    var p;try{p=encode()}catch(e){p=Promise.reject(e)}
    p.then(function(res){if(tok!==state.token)return;finish(res)})
     .catch(function(e){if(tok!==state.token)return;state.blob=null;downloadBtn.disabled=true;metaCheck.textContent="—";metaConverted.textContent="—";showStatus(msgOf(e),"error")});
  },30);
}
function finish(res){
  state.blob=res.blob;downloadBtn.disabled=false;showStatus("");
  metaConverted.textContent=fmtBytes(res.blob.size);
  setNote(res.info||(state.src.note||""));
  if(state.url){URL.revokeObjectURL(state.url);state.url=null}
  var type=res.blob.type;
  if(/^image\/(jpeg|png|gif|avif|svg\+xml)$/.test(type)){
    state.url=URL.createObjectURL(res.blob);
    previewImg.onload=function(){
      previewImg.style.display="block";previewCanvas.style.display="none";stageHint.textContent="";
      var nw=previewImg.naturalWidth,nh=previewImg.naturalHeight;
      metaCheck.textContent=(out==="svg"||(nw===res.w&&nh===res.h))?"Opened OK in this browser ("+nw+" × "+nh+")":"Size mismatch: "+nw+" × "+nh;
    };
    previewImg.onerror=function(){showPixels("Your browser could not display the finished file, so the preview shows the source pixels.");metaCheck.textContent="Browser could not display it"};
    previewImg.src=state.url;
  }else{
    showPixels("Browsers cannot display ."+CFG.ext.toUpperCase()+" files, so this preview shows the pixels that were written to the file.");
    metaCheck.textContent="Written ("+res.w+" × "+res.h+" px)";
  }
  metaDims.textContent=res.w+" × "+res.h+" px";
}
function showPixels(hint){
  var c=state.src.canvas;previewCanvas.width=c.width;previewCanvas.height=c.height;previewCanvas.getContext("2d").drawImage(c,0,0);
  previewCanvas.style.display="block";previewImg.style.display="none";stageHint.textContent=hint;
}
var rerun=EWT.debounce(convert,180);
resultPanel.addEventListener("input",function(e){
  var t=e.target;if(!t||!t.id)return;
  var v=$(t.id+"V");if(v&&t.type==="range")v.textContent=t.value+(t.getAttribute("data-unit")||"");
  rerun();
});
resultPanel.addEventListener("change",function(e){var t=e.target;if(t&&(t.tagName==="SELECT"||t.type==="checkbox"))rerun()});
downloadBtn.addEventListener("click",function(){if(state.blob)EWT.download(state.blob,state.name+"."+CFG.ext)});
var copyBtn=$("copyBtn");
if(copyBtn)copyBtn.addEventListener("click",function(){
  if(!state.svgText)return;
  (navigator.clipboard&&navigator.clipboard.writeText?navigator.clipboard.writeText(state.svgText):Promise.reject()).then(function(){copyBtn.textContent="Copied";setTimeout(function(){copyBtn.textContent="Copy SVG code"},1600)},function(){showStatus("Your browser blocked copying. Use Download instead.","error")});
});
resetBtn.addEventListener("click",function(){
  state.token++;state.src=null;state.blob=null;state.svgText=null;
  if(state.url){URL.revokeObjectURL(state.url);state.url=null}
  resultPanel.classList.remove("show");showStatus("");setNote("");
  window.scrollTo({top:0,behavior:"smooth"});
});
`;

export function converterScript(cfg) {
  return 'var CFG=' + JSON.stringify(cfg) + ';\n' + BODY;
}

/* Controls for each output format. */
function controls(out, extra = {}) {
  const c = [];
  if (out === 'jpg') {
    c.push(ui.slider('quality', 'Quality', 10, 100, 92, '%').replace('<input type="range"', '<input type="range" data-unit="%"'));
    c.push(ui.color('bgColor', 'Background for transparent areas', '#ffffff', 'JPG cannot store transparency, so transparent pixels are filled with this colour.'));
  }
  if (out === 'gif') c.push(ui.check('dither', 'Dither colours (smoother gradients)', true, 'GIF is limited to 256 colours per frame. Dithering reduces visible banding in photos at the cost of a slightly larger, noisier file.'));
  if (out === 'tiff') c.push(ui.select('comp', 'Compression', [{ v: 'none', l: 'None (largest file, opens everywhere)' }, { v: 'lzw', l: 'LZW (lossless, smaller)' }], extra.comp || 'lzw'));
  if (out === 'avif') {
    c.push(ui.slider('quality', 'Quality', 1, 100, 60, '%').replace('<input type="range"', '<input type="range" data-unit="%"'));
    c.push(ui.select('speed', 'Encoding effort', [{ v: 'quality', l: 'Best compression (slower)' }, { v: 'fast', l: 'Fast (larger file)' }], 'quality'));
    c.push(ui.select('maxSide', 'Longest side', [{ v: '0', l: 'Keep original size' }, { v: '4096', l: 'Limit to 4096 px' }, { v: '3000', l: 'Limit to 3000 px' }, { v: '2048', l: 'Limit to 2048 px' }, { v: '1600', l: 'Limit to 1600 px' }], '0'));
  }
  if (out === 'svg') {
    c.push(ui.slider('colors', 'Number of colours', 2, 32, extra.colors || 8));
    c.push(ui.slider('minArea', 'Ignore specks smaller than', 0, 60, 6, ' px²').replace('<input type="range"', '<input type="range" data-unit=" px²"'));
    c.push(ui.slider('precision', 'Path simplification', 0.2, 3, 0.6, ' px', 0.1).replace('<input type="range"', '<input type="range" data-unit=" px"'));
    c.push(ui.check('smooth', 'Smooth curves (turn off for sharp, straight edges)', true));
    c.push(ui.select('maxSide', 'Tracing resolution', [{ v: '800', l: 'Fast (800 px)' }, { v: '1600', l: 'Standard (1600 px)' }, { v: '2400', l: 'Detailed (2400 px, slower)' }], '1600'));
  }
  if (out === 'eps') {
    c.push(ui.select('dpi', 'Print resolution', [{ v: '72', l: '72 dpi (1 pixel = 1 point)' }, { v: '150', l: '150 dpi' }, { v: '300', l: '300 dpi (print)' }], '72'));
    c.push(ui.color('bgColor', 'Background for transparent areas', '#ffffff', 'EPS cannot store transparency, so transparent pixels are filled with this colour.'));
    c.push(ui.select('level', 'PostScript level', [{ v: '2', l: 'Level 2 — widest compatibility, larger file' }, { v: '3', l: 'Level 3 — Flate compressed, much smaller' }], '2'));
  }
  return c.join('\n          ');
}

function stage() {
  return `          <div class="preview-box checker"><canvas id="previewCanvas" style="display:none"></canvas><img id="previewImg" alt="Preview of the converted file" style="display:none"></div>
          <p class="stage-hint" id="stageHint"></p>
          <div class="stage-meta">
            <span>Original: <b id="metaOriginal">—</b></span>
            <span>Converted: <b id="metaConverted">—</b></span>
          </div>`;
}
function side(out, title, extra) {
  const copy = out === 'svg' ? '\n          <button class="btn-ghost" type="button" id="copyBtn" style="width:100%;margin-top:10px">Copy SVG code</button>' : '';
  return `          <h2>${title}</h2>
          <dl class="kv"><dt>Size</dt><dd id="metaDims">—</dd><dt>Format</dt><dd>${OUT[out].label}</dd><dt>Check</dt><dd id="metaCheck">—</dd></dl>
          ${controls(out, extra)}
          ${ui.note('pageNote')}${copy}`;
}

/* Builds a full spec from a compact definition. */
export function converter(d) {
  const o = OUT[d.out];
  const cfg = { in: d.in, out: d.out, ext: o.ext, primary: d.primary || '', primaryLabel: d.primaryLabel || '', badFile: d.badFile };
  return {
    slug: d.slug, name: d.name, metaTitle: d.metaTitle, metaDescription: d.metaDescription, keywords: d.keywords,
    lede: d.lede, dropSub: d.dropSub, accept: d.accept, dropAria: d.dropAria,
    stage: stage(), side: side(d.out, d.sideTitle || 'Result', d.extra), downloadLabel: `Download ${o.label}`, resetLabel: 'Convert another file',
    libs: ['common', ...(d.libs || [])], needsLazy: d.in === 'heic',
    script: converterScript(cfg),
    seoHeading: d.seoHeading, seoHtml: d.seoHtml, faqs: d.faqs, features: d.features,
    cardTitle: d.cardTitle || d.name, cardDescription: d.cardDescription, tags: d.tags, iconKey: d.iconKey || 'fmt-convert',
    related: d.related,
  };
}
