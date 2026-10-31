import { ui } from './core.mjs';
import { p, h3, ol, table } from './converters.mjs';

const NOUPLOAD = 'Nothing is uploaded: the files are processed inside this browser tab.';

/* ---------------------------- still GIF / slideshow GIF ---------------------------- */
const GIF_SCRIPT = String.raw`
var previewImg=$("previewImg"),thumbs=$("thumbs"),metaConverted=$("metaConverted"),metaDims=$("metaDims"),metaCheck=$("metaCheck"),note=$("pageNote"),clearBtn=$("clearBtn");
var frames=[],state={blob:null,url:null,token:0};
EWT.setupDrop({dropzone:dropzone,input:fileInput,multiple:true,onFiles:addFiles});
function setNote(t,cls){if(!t){note.style.display="none";note.textContent="";return}note.textContent=t;note.className="status-msg show "+(cls||"info");note.style.display="block"}
function addFiles(files){
  showStatus("");
  var ok=files.filter(function(f){return /^image\//.test(f.type)||/\.(jpe?g|png|webp|gif|bmp)$/i.test(f.name)});
  if(!ok.length){showStatus(CFG.badFile,"error");return}
  if(ok.length<files.length)showStatus((files.length-ok.length)+" file(s) were skipped because they are not images.","info");
  if(frames.length+ok.length>CFG.maxFrames){ok=ok.slice(0,Math.max(0,CFG.maxFrames-frames.length));showStatus("At most "+CFG.maxFrames+" images can be combined. The extra files were ignored.","info")}
  var errs=[];
  Promise.all(ok.map(function(f){return EWT.decodeImage(f).then(function(d){return {name:f.name,canvas:d.canvas,w:d.width,h:d.height,bytes:f.size}}).catch(function(e){errs.push(msgOf(e));return null})})).then(function(rs){
    rs.forEach(function(r){if(r)frames.push(r)});
    if(errs.length)showStatus(errs.join(" "),"error");
    if(!frames.length)return;
    resultPanel.classList.add("show");renderThumbs();convert();
  });
}
function renderThumbs(){
  thumbs.innerHTML="";
  frames.forEach(function(f,i){
    var d=document.createElement("div"),im=document.createElement("img"),b=document.createElement("button");
    d.className="th";d.title=f.name;
    var c=document.createElement("canvas");c.width=64;c.height=64;var g=c.getContext("2d"),s=Math.max(64/f.w,64/f.h);g.drawImage(f.canvas,(64-f.w*s)/2,(64-f.h*s)/2,f.w*s,f.h*s);
    im.src=c.toDataURL("image/png");im.alt=f.name;
    b.type="button";b.textContent="×";b.setAttribute("aria-label","Remove "+f.name);
    b.addEventListener("click",function(){frames.splice(i,1);if(!frames.length){reset();return}renderThumbs();convert()});
    d.appendChild(im);d.appendChild(b);thumbs.appendChild(d);
  });
  $("frameCount").textContent=frames.length+(frames.length===1?" image (still GIF)":" images (animated GIF)");
}
function outSize(){
  var f=frames[0],m=Number($("gifWidth").value)||0,w=f.w,h=f.h;
  if(m&&w>m){h=Math.max(1,Math.round(h*m/w));w=m}
  return {w:w,h:h};
}
function frameRgba(f,w,h,multi){
  var c=EWT.newCanvas(w,h),g=c.getContext("2d");
  g.imageSmoothingEnabled=true;g.imageSmoothingQuality="high";
  if(!multi){g.drawImage(f.canvas,0,0,w,h)}
  else{
    g.fillStyle=$("bgColor").value||"#ffffff";g.fillRect(0,0,w,h);
    var fit=$("fit").value,sx=w/f.w,sy=h/f.h,s=fit==="cover"?Math.max(sx,sy):Math.min(sx,sy);
    if(fit==="stretch")g.drawImage(f.canvas,0,0,w,h);
    else{var dw=f.w*s,dh=f.h*s;g.drawImage(f.canvas,(w-dw)/2,(h-dh)/2,dw,dh)}
  }
  return EWT.getPixels(c).data;
}
function convert(){
  if(!frames.length)return;
  var tok=++state.token;downloadBtn.disabled=true;metaCheck.textContent="Working…";showStatus("Creating GIF…","info");
  setTimeout(function(){
    try{
      var sz=outSize(),multi=frames.length>1;
      EWT.checkSize(sz.w,sz.h,"The GIF");
      if(sz.w*sz.h*4*frames.length>400000000)throw EWT.userError("These "+frames.length+" images at "+sz.w+" × "+sz.h+" px need too much memory. Choose a smaller width or use fewer images.");
      var delay=Number($("delay").value),list=frames.map(function(f){return {rgba:frameRgba(f,sz.w,sz.h,multi),delay:delay}});
      var r=EWT.gif.encode(sz.w,sz.h,list,{dither:$("dither").checked,loop:$("loop").value==="once"?1:0});
      if(tok!==state.token)return;
      var blob=new Blob([r.bytes],{type:"image/gif"});
      state.blob=blob;downloadBtn.disabled=false;showStatus("");
      metaConverted.textContent=fmtBytes(blob.size);metaDims.textContent=sz.w+" × "+sz.h+" px";
      var msg=[];
      if(r.hasTransparency)msg.push("Transparent pixels kept (GIF supports 1-bit transparency, so soft edges become hard).");
      if(!multi)msg.push("Add more images to make an animated GIF.");
      msg.push("GIF is limited to 256 colours per frame; photographs show some banding.");
      setNote(msg.join(" "));
      if(state.url)URL.revokeObjectURL(state.url);
      state.url=URL.createObjectURL(blob);
      previewImg.onload=function(){metaCheck.textContent=(previewImg.naturalWidth===sz.w&&previewImg.naturalHeight===sz.h)?"Opened OK in this browser ("+frames.length+" frame"+(multi?"s":"")+")":"Size mismatch"};
      previewImg.onerror=function(){metaCheck.textContent="Browser could not display it"};
      previewImg.src=state.url;
    }catch(e){state.blob=null;downloadBtn.disabled=true;metaCheck.textContent="—";showStatus(msgOf(e),"error")}
  },30);
}
var rerun=EWT.debounce(convert,200);
resultPanel.addEventListener("input",function(e){var t=e.target;if(!t||!t.id)return;var v=$(t.id+"V");if(v&&t.type==="range")v.textContent=t.value+" ms";rerun()});
resultPanel.addEventListener("change",function(e){var t=e.target;if(t&&(t.tagName==="SELECT"||t.type==="checkbox"))rerun()});
downloadBtn.addEventListener("click",function(){if(state.blob)EWT.download(state.blob,(frames.length>1?"animation":EWT.baseName(frames[0].name))+".gif")});
function reset(){state.token++;frames=[];state.blob=null;if(state.url){URL.revokeObjectURL(state.url);state.url=null}thumbs.innerHTML="";resultPanel.classList.remove("show");showStatus("");setNote("");window.scrollTo({top:0,behavior:"smooth"})}
resetBtn.addEventListener("click",reset);
`;

function gifSpec(d) {
  return {
    slug: d.slug, name: d.name, metaTitle: `${d.name} - Free Online | EasyWorkTools.online`,
    metaDescription: d.metaDescription, keywords: d.keywords, lede: d.lede,
    dropSub: d.dropSub, accept: 'image/jpeg,image/png,image/webp,image/gif,image/bmp,.jpg,.jpeg,.png,.webp,.gif,.bmp', multiple: true, dropAria: d.dropAria,
    stage: `          <div class="preview-box checker"><img id="previewImg" alt="Preview of the GIF"></div>
          <div class="thumb-row" id="thumbs"></div>
          <p class="stage-hint" id="frameCount"></p>
          <div class="stage-meta"><span>Result: <b id="metaConverted">—</b></span></div>`,
    side: `          <h2>GIF output</h2>
          <dl class="kv"><dt>Size</dt><dd id="metaDims">—</dd><dt>Format</dt><dd>GIF</dd><dt>Check</dt><dd id="metaCheck">—</dd></dl>
          ${ui.select('gifWidth', 'Width', [{ v: '0', l: 'Keep original size' }, { v: '1280', l: 'Up to 1280 px wide' }, { v: '800', l: 'Up to 800 px wide' }, { v: '480', l: 'Up to 480 px wide' }, { v: '320', l: 'Up to 320 px wide' }], '0')}
          ${ui.check('dither', 'Dither colours (smoother gradients)', true)}
          ${ui.slider('delay', 'Time per image (animation)', 50, 3000, 500, ' ms', 50).replace('<input type="range"', '<input type="range" data-unit=" ms"')}
          ${ui.select('loop', 'Animation loop', [{ v: 'forever', l: 'Repeat forever' }, { v: 'once', l: 'Play once' }], 'forever')}
          ${ui.select('fit', 'Fit images of different sizes', [{ v: 'contain', l: 'Fit inside (keep all of each image)' }, { v: 'cover', l: 'Fill (crop the edges)' }, { v: 'stretch', l: 'Stretch' }], 'contain')}
          ${ui.color('bgColor', 'Background behind smaller images', '#ffffff')}
          ${ui.note('pageNote')}`,
    downloadLabel: 'Download GIF', resetLabel: 'Start over',
    libs: ['common', 'gif'],
    script: 'var CFG=' + JSON.stringify({ maxFrames: 60, badFile: d.badFile }) + ';\n' + GIF_SCRIPT,
    seoHeading: d.seoHeading, seoHtml: d.seoHtml, faqs: d.faqs, features: d.features,
    cardTitle: d.name, cardDescription: d.cardDescription, tags: d.tags, iconKey: 'fmt-convert', related: d.related,
  };
}

const gifFaqCommon = [
  { q: 'Why does my photo look grainy or banded as a GIF?', a: 'GIF can only use 256 colours per frame. The tool picks the best 256 and can dither them, which hides banding in gradients but adds fine noise. For photos, PNG, WebP or AVIF look better.' },
  { q: 'Can I make an animated GIF?', a: 'Yes. Add two or more images (up to 60). They become frames in the order you added them, with the time per image you choose. Remove a frame with the × on its thumbnail.' },
  { q: 'Is transparency kept?', a: 'For a single image, yes: fully transparent pixels stay transparent. GIF supports only on or off transparency, so soft edges become hard. For an animation the frames are placed on the background colour you choose.' },
  { q: 'Is my image uploaded?', a: NOUPLOAD },
];

export const GIFS = [
  gifSpec({
    slug: 'jpg-to-gif', name: 'JPG to GIF Converter', badFile: 'Please choose image files (JPG, PNG, WebP, GIF or BMP).',
    metaDescription: 'Convert JPG to GIF online for free, or combine several JPGs into an animated GIF. Colour dithering, size and timing controls. Runs in your browser, nothing uploaded.',
    keywords: ['jpg to gif', 'jpeg to gif converter', 'convert jpg to gif online', 'jpg to animated gif', 'images to gif'],
    lede: 'Convert a JPG to GIF, or drop several JPGs to make an animated GIF. The GIF is created in this tab. Nothing is uploaded.',
    dropSub: 'JPG, PNG, WebP, GIF, BMP accepted — add several for an animation', dropAria: 'Upload JPG images to convert to GIF',
    cardDescription: 'Convert JPG images to GIF online for free, or combine several into an animated GIF.',
    tags: ['jpg to gif', 'jpeg to gif', 'animated gif maker', 'images to gif'],
    features: ['Still or animated GIF from JPG images', 'Median-cut 256-colour palette with optional dithering', 'Frame timing, loop and size controls', 'Runs entirely in your browser'],
    seoHeading: 'Convert JPG to GIF, or Turn Several JPGs into an Animation',
    seoHtml: [
      p('GIF is still the format that plays everywhere, in chat apps, emails and forums. This tool turns a JPG into a GIF, or combines several images into a looping slideshow. Each frame is reduced to the best 256 colours with a median-cut palette, with optional dithering, and written as a standard GIF89a file.'),
      h3('Still GIF or animation'),
      table(['You add', 'You get'], [['One image', 'A still GIF'], ['Two or more images', 'An animated GIF, one frame per image, in the order added'], ['Images of different sizes', 'Fitted to the first image’s size (fit, fill or stretch)']]),
      h3('How to convert JPG to GIF'),
      ol(['Drop one JPG, or several for an animation.', 'Choose the width, time per image and whether to dither.', 'Check the preview. It is the finished GIF decoded by your browser.', 'Download the GIF.']),
      p('GIF files from photographs are larger than JPGs and have limited colour. Use a smaller width and fewer frames to keep the file small.'),
    ].join('\n    '),
    faqs: gifFaqCommon,
    related: ['png-to-gif', 'gif-to-apng', 'image-format-converter'],
  }),
  gifSpec({
    slug: 'png-to-gif', name: 'PNG to GIF Converter', badFile: 'Please choose image files (PNG, JPG, WebP, GIF or BMP).',
    metaDescription: 'Convert PNG to GIF online for free and keep transparent areas, or combine several PNGs into an animated GIF. Runs in your browser, nothing uploaded.',
    keywords: ['png to gif', 'png to gif converter', 'convert png to gif online', 'png to animated gif', 'png to gif transparent'],
    lede: 'Convert a PNG to GIF, keeping transparent areas, or drop several PNGs to make an animated GIF. The GIF is created in this tab. Nothing is uploaded.',
    dropSub: 'PNG, JPG, WebP, GIF, BMP accepted — add several for an animation', dropAria: 'Upload PNG images to convert to GIF',
    cardDescription: 'Convert PNG images to GIF online for free, keeping transparency, or build an animated GIF.',
    tags: ['png to gif', 'png to animated gif', 'transparent gif', 'images to gif'],
    features: ['Still or animated GIF from PNG images', 'Transparent pixels kept for single images', 'Frame timing, loop and size controls', 'Runs entirely in your browser'],
    seoHeading: 'Convert PNG to GIF and Keep Transparency',
    seoHtml: [
      p('PNG to GIF is useful for icons, stickers and simple animations. GIF supports one transparent colour, so fully transparent pixels in your PNG stay transparent; semi-transparent edges are snapped to on or off. Add several PNGs to make an animated GIF.'),
      table(['', 'PNG', 'GIF'], [['Colours', 'Millions', '256 per frame'], ['Transparency', 'Smooth alpha', 'On or off'], ['Animation', 'Only APNG', 'Yes, everywhere'], ['File size for photos', 'Large', 'Large and banded']]),
      h3('How to convert PNG to GIF'),
      ol(['Drop one PNG, or several for an animation.', 'Choose the width, timing and dithering.', 'Check the preview and download the GIF.']),
      p('Soft shadows and anti-aliased edges can leave a light or dark fringe against some backgrounds because GIF cannot blend. Pick the background colour of the page you will use the GIF on when making an animation.'),
    ].join('\n    '),
    faqs: gifFaqCommon,
    related: ['jpg-to-gif', 'gif-to-apng', 'png-to-avif'],
  }),
];

/* ---------------------------- GIF to APNG ---------------------------- */
const APNG_SCRIPT = String.raw`
var previewImg=$("previewImg"),metaOriginal=$("metaOriginal"),metaConverted=$("metaConverted"),metaDims=$("metaDims"),metaCheck=$("metaCheck"),note=$("pageNote");
var state={gif:null,name:"animation",blob:null,url:null,token:0};
EWT.setupDrop({dropzone:dropzone,input:fileInput,multiple:false,onFiles:function(f){load(f[0])}});
function setNote(t){if(!t){note.style.display="none";note.textContent="";return}note.textContent=t;note.className="status-msg show info";note.style.display="block"}
function load(file){
  showStatus("");setNote("");
  if(!/\.gif$/i.test(file.name)&&file.type!=="image/gif"){showStatus("Please choose a GIF file (.gif).","error");return}
  if(!file.size){showStatus("That file is empty.","error");return}
  showStatus("Reading "+file.name+" …","info");
  EWT.readBytes(file).then(function(b){
    var g;
    try{g=EWT.gif.decode(b)}catch(e){throw EWT.userError("This file could not be read as a GIF: "+(e.message||"it may be damaged")+".")}
    EWT.checkSize(g.width,g.height,"This GIF");
    if(g.frames.length*g.width*g.height*4>600000000)throw EWT.userError("This GIF has "+g.frames.length+" frames of "+g.width+" × "+g.height+" px, which needs more memory than a browser tab can safely use.");
    state.gif=g;state.name=EWT.baseName(file.name);
    metaOriginal.textContent=fmtBytes(file.size);
    resultPanel.classList.add("show");showStatus("");convert();
  }).catch(function(e){showStatus(msgOf(e),"error")});
}
function readAcTL(u){
  var dv=new DataView(u.buffer,u.byteOffset,u.byteLength),p=8;
  while(p+12<=u.length){var len=dv.getUint32(p),t=String.fromCharCode(u[p+4],u[p+5],u[p+6],u[p+7]);if(t==="acTL")return {frames:dv.getUint32(p+8),plays:dv.getUint32(p+12)};p+=12+len}
  return null;
}
function convert(){
  if(!state.gif)return;
  var tok=++state.token,g=state.gif;downloadBtn.disabled=true;metaCheck.textContent="Working…";showStatus("Creating APNG…","info");
  var speed=Number($("speed").value),minDelay=$("fixDelay").checked;
  var fr=g.frames.map(function(f){var d=f.delay;if(minDelay&&d<20)d=100;return {rgba:f.rgba,delay:Math.max(10,Math.round(d/speed))}});
  var loop=$("loop").value==="once"?1:(g.loop===null||g.loop===undefined?0:g.loop);
  EWT.apng.encode(fr,g.width,g.height,{loop:loop}).then(function(u){
    if(tok!==state.token)return;
    var blob=new Blob([u],{type:"image/png"}),ac=readAcTL(u),total=fr.reduce(function(a,f){return a+f.delay},0);
    state.blob=blob;downloadBtn.disabled=false;showStatus("");
    metaConverted.textContent=fmtBytes(blob.size);metaDims.textContent=g.width+" × "+g.height+" px";
    setNote(g.frames.length>1?(g.frames.length+" frames, "+(total/1000).toFixed(2)+" s per loop. APNG plays in all current browsers; some older apps show only the first frame."):"This GIF has a single frame, so the result is an ordinary PNG.");
    if(state.url)URL.revokeObjectURL(state.url);state.url=URL.createObjectURL(blob);
    previewImg.onload=function(){metaCheck.textContent=(ac?ac.frames+" frames in the file":"single frame")+", opened OK in this browser"};
    previewImg.onerror=function(){metaCheck.textContent="Browser could not display it"};
    previewImg.src=state.url;
  }).catch(function(e){if(tok!==state.token)return;state.blob=null;downloadBtn.disabled=true;metaCheck.textContent="—";showStatus(msgOf(e),"error")});
}
var rerun=EWT.debounce(convert,150);
resultPanel.addEventListener("change",function(e){var t=e.target;if(t&&(t.tagName==="SELECT"||t.type==="checkbox"))rerun()});
downloadBtn.addEventListener("click",function(){if(state.blob)EWT.download(state.blob,state.name+".apng.png")});
resetBtn.addEventListener("click",function(){state.token++;state.gif=null;state.blob=null;if(state.url){URL.revokeObjectURL(state.url);state.url=null}resultPanel.classList.remove("show");showStatus("");setNote("");window.scrollTo({top:0,behavior:"smooth"})});
`;

export const GIF_APNG = {
  slug: 'gif-to-apng', name: 'GIF to APNG Converter',
  metaTitle: 'GIF to APNG Converter - Free Online | EasyWorkTools.online',
  metaDescription: 'Convert animated GIF to APNG online for free: full 24-bit colour, smooth alpha transparency, frame timing and loop kept. Runs in your browser, nothing uploaded.',
  keywords: ['gif to apng', 'gif to apng converter', 'convert gif to apng online', 'animated png maker', 'gif to animated png'],
  lede: 'Convert an animated GIF to APNG (animated PNG), which stores the frames losslessly in full colour with proper transparency. Nothing is uploaded.',
  dropSub: 'GIF (.gif) accepted', accept: 'image/gif,.gif', dropAria: 'Upload a GIF to convert to APNG',
  stage: `          <div class="preview-box checker"><img id="previewImg" alt="Preview of the APNG"></div>
          <div class="stage-meta"><span>Original: <b id="metaOriginal">—</b></span><span>Converted: <b id="metaConverted">—</b></span></div>`,
  side: `          <h2>APNG output</h2>
          <dl class="kv"><dt>Size</dt><dd id="metaDims">—</dd><dt>Format</dt><dd>APNG</dd><dt>Check</dt><dd id="metaCheck">—</dd></dl>
          ${ui.select('speed', 'Playback speed', [{ v: '0.5', l: '0.5× (slower)' }, { v: '1', l: '1× (original)' }, { v: '2', l: '2× (faster)' }], '1')}
          ${ui.select('loop', 'Loop', [{ v: 'gif', l: 'Same as the GIF' }, { v: 'once', l: 'Play once' }], 'gif')}
          ${ui.check('fixDelay', 'Treat very short delays (under 20 ms) as 100 ms, like browsers do', true)}
          ${ui.note('pageNote')}`,
  downloadLabel: 'Download APNG', resetLabel: 'Convert another GIF',
  libs: ['common', 'gif', 'apng'], script: APNG_SCRIPT,
  seoHeading: 'Convert Animated GIF to APNG',
  seoHtml: [
    p('APNG is an extension of PNG that adds animation. Compared with GIF it supports millions of colours and smooth (alpha) transparency, so shadows and anti-aliased edges look right on any background. Every current browser plays it. This tool decodes every GIF frame, applies the GIF’s disposal rules to get the true picture at each step, and writes a lossless APNG with the same timing.'),
    table(['', 'GIF', 'APNG'], [['Colours', '256 per frame', '24-bit'], ['Transparency', 'On or off', 'Smooth alpha'], ['Browser support', 'Everything', 'All current browsers'], ['File size', 'Often small', 'Often larger for photos, smaller for flat art']]),
    h3('How to convert GIF to APNG'),
    ol(['Drop your GIF into the box above.', 'Pick the speed and loop behaviour if you want to change them.', 'Check the preview, which is the finished APNG playing in your browser.', 'Download it.']),
    p('The conversion keeps the GIF’s 256 colours exactly; it cannot add colour that the GIF never had. The file is saved with a .png extension (name.apng.png) so every system recognises it.'),
  ].join('\n    '),
  faqs: [
    { q: 'Will the colours improve?', a: 'No. Converting stores exactly the colours the GIF contained. APNG allows more colours and soft transparency, but the GIF has already lost that information.' },
    { q: 'Where does APNG work?', a: 'In current Chrome, Edge, Firefox, Safari and Opera, and in many messengers and editors. Apps that do not understand APNG show the first frame as a normal PNG.' },
    { q: 'Why is the APNG larger than my GIF?', a: 'The frames are stored losslessly as 32-bit images. Only the rectangle that changes between frames is stored, which helps a lot for simple animations but cannot match GIF’s palette compression on photographic frames.' },
    { q: 'Are frame timing and looping kept?', a: 'Yes. Each frame keeps its own delay, and the loop count is copied. GIF delays under 20 ms are treated as 100 ms by browsers, which the tool can mirror.' },
    { q: 'Is my GIF uploaded?', a: NOUPLOAD },
  ],
  features: ['Decodes every frame with disposal and transparency', 'Lossless 32-bit APNG with per-frame timing', 'Speed and loop controls', 'Runs entirely in your browser'],
  cardTitle: 'GIF to APNG Converter', cardDescription: 'Convert animated GIFs to full-colour APNG with smooth transparency, free in your browser.',
  tags: ['gif to apng', 'animated png', 'convert gif', 'apng maker'], iconKey: 'fmt-convert',
  related: ['jpg-to-gif', 'png-to-gif', 'image-format-converter'],
};
