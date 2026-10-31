import { ui } from './core.mjs';
import { p, h3, ol, table } from './converters.mjs';

const SCRIPT = String.raw`
var cv=$("stageCanvas"),g=cv.getContext("2d"),metaOriginal=$("metaOriginal"),metaDims=$("metaDims");
var st={img:null,w:0,h:0,cx:0,cy:0,zoom:1,name:"profile",shape:"circle",fmt:"png",size:800,drag:null,busy:0};
var PREV=480;cv.width=PREV;cv.height=PREV;
EWT.setupDrop({dropzone:dropzone,input:fileInput,multiple:false,onFiles:function(f){load(f[0])}});
function load(file){
  showStatus("");
  if(!/^image\//.test(file.type)&&!/\.(jpe?g|png|webp|gif|bmp|avif)$/i.test(file.name)){showStatus("Please choose a photo (JPG, PNG, WebP, GIF or BMP).","error");return}
  EWT.decodeImage(file).then(function(d){
    st.img=d.canvas;st.w=d.width;st.h=d.height;st.cx=d.width/2;st.cy=d.height/2;st.zoom=1;st.name=EWT.baseName(file.name);
    $("zoom").value=100;$("zoomV").textContent="100%";
    metaOriginal.textContent=d.width+" × "+d.height+" px, "+fmtBytes(file.size);
    resultPanel.classList.add("show");draw();
  }).catch(function(e){showStatus(msgOf(e),"error")});
}
function side(){return Math.min(st.w,st.h)/st.zoom}
function clampCenter(){
  var s=side();
  /* keep the crop window mostly over the photo */
  var minx=Math.min(st.w/2,s/2),maxx=Math.max(st.w/2,st.w-s/2),miny=Math.min(st.h/2,s/2),maxy=Math.max(st.h/2,st.h-s/2);
  st.cx=Math.max(minx,Math.min(maxx,st.cx));st.cy=Math.max(miny,Math.min(maxy,st.cy));
}
function opts(){return {shape:st.shape,bgMode:$("bgMode").value,bg:$("bgColor").value,bw:Number($("bw").value)/100,bc:$("bc").value}}
function shapePath(c,N,o){
  c.beginPath();
  if(o.shape==="circle")c.arc(N/2,N/2,N/2,0,Math.PI*2);
  else if(o.shape==="rounded"){var r=N*0.22;if(c.roundRect)c.roundRect(0,0,N,N,r);else c.rect(0,0,N,N)}
  else c.rect(0,0,N,N);
}
function render(c,N,o){
  c.clearRect(0,0,N,N);
  c.save();shapePath(c,N,o);c.clip();
  if(o.bgMode==="color"){c.fillStyle=o.bg;c.fillRect(0,0,N,N)}
  var s=side();
  c.imageSmoothingEnabled=true;c.imageSmoothingQuality="high";
  c.translate(N/2,N/2);c.scale(N/s,N/s);c.drawImage(st.img,-st.cx,-st.cy);
  c.restore();
  if(o.bw>0){
    c.save();shapePath(c,N,o);c.clip();
    shapePath(c,N,o);c.lineWidth=o.bw*N*2;c.strokeStyle=o.bc;c.stroke();c.restore();
  }
}
function draw(){
  if(!st.img)return;
  clampCenter();
  var o=opts();
  g.clearRect(0,0,PREV,PREV);
  /* checker for transparent areas is the CSS background of the canvas box */
  render(g,PREV,o);
  metaDims.textContent=st.size+" × "+st.size+" px "+(st.fmt==="jpg"?"JPG":"PNG");
  $("posInfo").textContent="Drag the photo to move it. Use the slider or mouse wheel to zoom.";
}
function pos(e){var r=cv.getBoundingClientRect();return {x:(e.clientX-r.left)*PREV/r.width,y:(e.clientY-r.top)*PREV/r.height}}
cv.addEventListener("pointerdown",function(e){if(!st.img)return;cv.setPointerCapture(e.pointerId);var q=pos(e);st.drag={x:q.x,y:q.y,cx:st.cx,cy:st.cy};cv.style.cursor="grabbing"});
cv.addEventListener("pointermove",function(e){if(!st.drag)return;var q=pos(e),k=side()/PREV;st.cx=st.drag.cx-(q.x-st.drag.x)*k;st.cy=st.drag.cy-(q.y-st.drag.y)*k;draw()});
function endDrag(){st.drag=null;cv.style.cursor="grab"}
cv.addEventListener("pointerup",endDrag);cv.addEventListener("pointercancel",endDrag);
cv.addEventListener("wheel",function(e){if(!st.img)return;e.preventDefault();var z=Math.max(50,Math.min(500,Number($("zoom").value)*(e.deltaY<0?1.06:0.94)));$("zoom").value=Math.round(z);zoomChanged()},{passive:false});
cv.addEventListener("keydown",function(e){
  if(!st.img)return;var k=side()*0.02,m=false;
  if(e.key==="ArrowLeft"){st.cx-=k;m=true}else if(e.key==="ArrowRight"){st.cx+=k;m=true}else if(e.key==="ArrowUp"){st.cy-=k;m=true}else if(e.key==="ArrowDown"){st.cy+=k;m=true}
  if(m){e.preventDefault();draw()}
});
function zoomChanged(){st.zoom=Number($("zoom").value)/100;$("zoomV").textContent=Math.round(st.zoom*100)+"%";draw()}
$("zoom").addEventListener("input",zoomChanged);
$("centerBtn").addEventListener("click",function(){if(!st.img)return;st.cx=st.w/2;st.cy=st.h/2;draw()});
["bgMode","bgColor","bw","bc"].forEach(function(id){$(id).addEventListener("input",function(){var v=$(id+"V");if(v)v.textContent=$(id).value+"%";if(id==="bgMode")$("bgBox").style.display=$("bgMode").value==="color"?"block":"none";draw()})});
function chipGroup(id,fn){$(id).addEventListener("click",function(e){var c=e.target.closest(".platform-chip");if(!c)return;[].forEach.call($(id).children,function(x){x.classList.remove("is-active")});c.classList.add("is-active");fn(c.getAttribute("data-v"));draw()})}
chipGroup("shapeChips",function(v){st.shape=v});
chipGroup("sizeChips",function(v){st.size=Number(v);$("customSize").value=""});
chipGroup("fmtChips",function(v){st.fmt=v;downloadBtn.textContent="Download "+v.toUpperCase()});
$("customSize").addEventListener("input",function(){var n=Math.round(Number($("customSize").value));if(n>=64&&n<=4096){st.size=n;[].forEach.call($("sizeChips").children,function(x){x.classList.remove("is-active")});draw()}});
downloadBtn.addEventListener("click",function(){
  if(!st.img)return;
  var N=st.size,o=opts();
  try{EWT.checkSize(N,N,"The profile photo")}catch(e){showStatus(msgOf(e),"error");return}
  var out=EWT.newCanvas(N,N),c=out.getContext("2d"),type=st.fmt==="jpg"?"image/jpeg":"image/png";
  if(st.fmt==="jpg"){
    /* JPG has no transparency: fill with the background colour (white when the background is transparent) */
    c.fillStyle=o.bgMode==="color"?o.bg:"#ffffff";c.fillRect(0,0,N,N);
    var tmp=EWT.newCanvas(N,N);render(tmp.getContext("2d"),N,o);c.drawImage(tmp,0,0);
  }else render(c,N,o);
  EWT.canvasToBlob(out,type,0.95).then(function(b){EWT.download(b,st.name+"-profile-"+N+"."+(st.fmt==="jpg"?"jpg":"png"));showStatus("Saved "+N+" × "+N+" px, "+fmtBytes(b.size)+".","ok")}).catch(function(e){showStatus(msgOf(e),"error")});
});
resetBtn.addEventListener("click",function(){st.img=null;resultPanel.classList.remove("show");showStatus("");window.scrollTo({top:0,behavior:"smooth"})});
`;

export const PROFILE = {
  slug: 'profile-photo-maker', name: 'Profile Photo Maker',
  metaTitle: 'Profile Photo Maker - Crop Circle Avatar | EasyWorkTools.online',
  metaDescription: 'Make a profile picture online for free: crop your photo to a circle, rounded square or square, add a border and background, and export at 400, 800 or 1080 px as PNG or JPG.',
  keywords: ['profile photo maker', 'profile picture maker', 'circle crop profile picture', 'avatar maker online', 'round profile photo'],
  lede: 'Crop your photo into a perfect profile picture. Drag and zoom to frame your face, choose a circle or rounded square, add a border and background, and download it at the size you need. Nothing is uploaded.',
  dropSub: 'JPG, PNG, WebP, GIF, BMP accepted', accept: 'image/jpeg,image/png,image/webp,image/gif,image/bmp,.jpg,.jpeg,.png,.webp,.gif,.bmp', dropAria: 'Upload a photo to make a profile picture',
  stage: `          <div class="preview-box checker" style="overflow:hidden;padding:0"><canvas id="stageCanvas" tabindex="0" role="img" aria-label="Profile photo preview. Drag to move the photo, use the arrow keys to nudge it." style="width:100%;max-width:480px;cursor:grab;touch-action:none"></canvas></div>
          <p class="stage-hint" id="posInfo"></p>
          <div class="stage-meta"><span>Original: <b id="metaOriginal">—</b></span><span>Export: <b id="metaDims">—</b></span></div>`,
  side: `          <h2>Profile photo</h2>
          ${ui.label('Shape')}
          ${ui.chips('shapeChips', [{ v: 'circle', l: 'Circle' }, { v: 'rounded', l: 'Rounded square' }, { v: 'square', l: 'Square' }], 'circle')}
          ${ui.slider('zoom', 'Zoom', 50, 500, 100, '%').replace('<input type="range"', '<input type="range" data-unit="%"')}
          <button class="btn-ghost" type="button" id="centerBtn" style="width:100%;margin:-4px 0 16px">Re-centre the photo</button>
          ${ui.select('bgMode', 'Background', [{ v: 'none', l: 'Transparent (PNG)' }, { v: 'color', l: 'Solid colour' }], 'none')}
          <div id="bgBox" style="display:none">${ui.color('bgColor', 'Background colour', '#e5e7eb', 'Shows where the photo does not fill the frame, and is used behind the photo when saving as JPG.')}</div>
          ${ui.slider('bw', 'Border width', 0, 15, 0, '%').replace('<input type="range"', '<input type="range" data-unit="%"')}
          ${ui.color('bc', 'Border colour', '#ffffff')}
          ${ui.label('Export size (pixels)')}
          ${ui.chips('sizeChips', [{ v: '400', l: '400' }, { v: '800', l: '800' }, { v: '1080', l: '1080' }], '800')}
          <input type="number" id="customSize" class="ewt-num" min="64" max="4096" placeholder="Custom size, 64 to 4096" style="margin:-6px 0 16px">
          ${ui.label('File type')}
          ${ui.chips('fmtChips', [{ v: 'png', l: 'PNG' }, { v: 'jpg', l: 'JPG' }], 'png')}`,
  downloadLabel: 'Download PNG', resetLabel: 'Choose another photo',
  libs: ['common'], script: SCRIPT,
  seoHeading: 'Make a Profile Picture That Fits Every Platform',
  seoHtml: [
    p('Social networks, chat apps and work tools all show profile pictures in a circle or a rounded square, and they crop whatever you upload. Doing the crop yourself means you decide what shows: you frame the face, pick the shape and the border, and upload a file that already fits. This tool does the framing in your browser and exports a square image at the size you choose.'),
    h3('Suggested sizes'),
    table(['Size', 'Good for'], [['400 × 400', 'Forums, comment avatars, email signatures'], ['800 × 800', 'Most social networks and work tools, with room for high-density screens'], ['1080 × 1080', 'Large displays and platforms that downscale themselves']]),
    h3('How to make a profile photo'),
    ol(['Drop a photo into the box above.', 'Drag the photo so your face is centred, and zoom with the slider or the mouse wheel.', 'Pick a circle, rounded square or square, and add a border or background if you like.', 'Choose the export size and PNG or JPG, then download.']),
    p('For a circle with transparent corners choose PNG. JPG cannot store transparency, so the area outside the circle is filled with your background colour (white if you left it transparent). The picture is cropped from your original file, not from the preview, so the export is as sharp as the photo allows. This is a manual crop tool: it does not detect faces and does not create AI avatars.'),
  ].join('\n    '),
  faqs: [
    { q: 'Does it find my face automatically?', a: 'No. You position the photo yourself by dragging and zooming. There is no face detection and no AI involved.' },
    { q: 'Will the corners of the circle be transparent?', a: 'Yes in PNG. JPG cannot be transparent, so the corners are filled with the background colour you pick, or white.' },
    { q: 'Can the photo be smaller than the export size?', a: 'Yes, but it will be enlarged and look soft. Choose a size no larger than your photo’s shorter side for the sharpest result.' },
    { q: 'How do I nudge the photo precisely?', a: 'Click the preview and use the arrow keys, or drag with the mouse or your finger.' },
    { q: 'Is my photo uploaded?', a: 'No. The cropping and export happen in this tab and the photo never leaves your device.' },
  ],
  features: ['Circle, rounded square or square crop', 'Drag, wheel and slider zoom', 'Border and background controls', 'Export 400, 800, 1080 or a custom size as PNG or JPG'],
  cardTitle: 'Profile Photo Maker', cardDescription: 'Crop a photo into a circle or rounded-square profile picture with border and background, free in your browser.',
  tags: ['profile photo maker', 'circle crop', 'avatar maker', 'profile picture'], iconKey: 'crop-rotate',
  related: ['image-crop-rotate', 'image-border-rounded', 'easy-image-resizer'],
};
