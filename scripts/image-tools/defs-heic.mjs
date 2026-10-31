import { ui } from './core.mjs';
import { p, h3, ol, table } from './converters.mjs';

const SCRIPT = String.raw`
var list=$("fileList"),summary=$("summary"),items=[],running=false,note=$("pageNote");
EWT.setupDrop({dropzone:dropzone,input:fileInput,multiple:true,onFiles:add});
function isHeic(f){return /\.(heic|heif)$/i.test(f.name)||/image\/hei[cf]/.test(f.type||"")}
function add(files){
  showStatus("");
  var skipped=[];
  files.forEach(function(f){
    if(!isHeic(f)){skipped.push(f.name);return}
    if(!f.size){skipped.push(f.name+" (empty)");return}
    items.push({file:f,state:"queued",blob:null,msg:""});
  });
  if(skipped.length)showStatus("Skipped (not HEIC or HEIF): "+skipped.join(", "),"info");
  if(!items.length)return;
  resultPanel.classList.add("show");render();pump();
}
function render(){
  list.innerHTML="";
  items.forEach(function(it,i){
    var li=document.createElement("li"),n=document.createElement("span"),st=document.createElement("span");
    n.className="n";n.textContent=it.file.name;st.className="st"+(it.state==="failed"?" bad":(it.state==="done"?" good":""));
    st.textContent=it.state==="queued"?"Waiting":(it.state==="working"?"Converting…":(it.state==="done"?(it.dims+" · "+fmtBytes(it.blob.size)):"Failed: "+it.msg));
    li.appendChild(n);li.appendChild(st);
    if(it.state==="done"){var a=document.createElement("button");a.type="button";a.className="btn-ghost";a.style.padding="6px 12px";a.textContent="Download PNG";a.addEventListener("click",function(){EWT.download(it.blob,EWT.baseName(it.file.name)+".png")});li.appendChild(a)}
    list.appendChild(li);
  });
  var done=items.filter(function(x){return x.state==="done"}).length,bad=items.filter(function(x){return x.state==="failed"}).length;
  summary.textContent=done+" of "+items.length+" converted"+(bad?", "+bad+" failed":"");
  downloadBtn.disabled=done===0;
  downloadBtn.textContent=done>1?"Download all as ZIP":"Download PNG";
}
function pump(){
  if(running)return;
  var it=items.filter(function(x){return x.state==="queued"})[0];
  if(!it)return;
  running=true;it.state="working";render();
  EwtLibs.load("heic2any.min.js").then(function(){
    if(typeof window.heic2any!=="function")throw new Error("The HEIC decoder failed to load.");
    return window.heic2any({blob:it.file,toType:"image/png"});
  }).then(function(res){
    var b=Array.isArray(res)?res[0]:res;
    if(!b||!b.size)throw new Error("The decoder returned an empty image.");
    return createImageBitmap(b).then(function(bm){it.dims=bm.width+" × "+bm.height;bm.close&&bm.close();it.blob=b;it.state="done"});
  }).catch(function(e){
    it.state="failed";
    var m=(e&&(e.message||e.code))||"";
    it.msg=/ERR_|format|support|not/i.test(String(m))||!m?"not a HEIC image this decoder supports":String(m).slice(0,80);
  }).then(function(){running=false;render();pump()});
}
downloadBtn.addEventListener("click",function(){
  var done=items.filter(function(x){return x.state==="done"});
  if(!done.length)return;
  if(done.length===1){EWT.download(done[0].blob,EWT.baseName(done[0].file.name)+".png");return}
  EwtLibs.load("jszip.min.js").then(function(){
    var z=new JSZip(),used={};
    done.forEach(function(it){var n=EWT.baseName(it.file.name),k=n,c=1;while(used[k]){k=n+"-"+(++c)}used[k]=1;z.file(k+".png",it.blob)});
    return z.generateAsync({type:"blob"});
  }).then(function(b){EWT.download(b,"heic-to-png.zip")}).catch(function(e){showStatus(msgOf(e),"error")});
});
resetBtn.addEventListener("click",function(){items=[];render();resultPanel.classList.remove("show");showStatus("");window.scrollTo({top:0,behavior:"smooth"})});
`;

export const HEIC_PNG = {
  slug: 'heic-to-png', name: 'HEIC to PNG Converter',
  metaTitle: 'HEIC to PNG Converter - iPhone Photos | EasyWorkTools.online',
  metaDescription: 'Convert HEIC and HEIF photos from iPhone to lossless PNG online for free. Batch convert, download one by one or as a ZIP. Runs in your browser, nothing uploaded.',
  keywords: ['heic to png', 'heic to png converter', 'convert heic to png online', 'iphone photo to png', 'heif to png'],
  lede: 'Convert iPhone HEIC and HEIF photos to lossless PNG. Add one file or many. Everything is decoded in this browser tab and nothing is uploaded.',
  dropSub: 'HEIC and HEIF files accepted, several at once', accept: '.heic,.heif,image/heic,image/heif', multiple: true, dropAria: 'Upload HEIC photos to convert to PNG',
  stage: '          <ul class="ewt-list" id="fileList"></ul>',
  side: `          <h2>PNG output</h2>
          <p class="result-title" id="summary" style="margin:0 0 14px;font-weight:800">0 of 0 converted</p>
          ${ui.note('pageNote')}`,
  downloadLabel: 'Download PNG', resetLabel: 'Clear and start over',
  libs: ['common'], needsLazy: true, script: SCRIPT,
  seoHeading: 'Convert iPhone HEIC Photos to PNG',
  seoHtml: [
    p('iPhones save photos as HEIC (High Efficiency Image Format) to save space, but many Windows programs, websites and editors cannot open it. PNG is lossless and opens anywhere. This tool decodes each HEIC photo with an open-source decoder running in your browser and saves it as a PNG, so the picture and its pixels are preserved.'),
    h3('HEIC vs PNG'),
    table(['', 'HEIC', 'PNG'], [['Compatibility', 'Apple devices, newer Windows with an extension', 'Everything'], ['Compression', 'Lossy, very efficient', 'Lossless, much larger files'], ['Transparency', 'Supported by the format', 'Yes'], ['Best for', 'Storing photos on the phone', 'Editing, sharing, uploading']]),
    h3('How to convert HEIC to PNG'),
    ol(['Drop one or more .heic files into the box above.', 'Wait for each file to show its size. They are processed one after another.', 'Download single PNGs, or all of them as one ZIP.']),
    p('PNG files from photos are large, often 5 to 10 times the size of the HEIC. If you only need a smaller file for sharing, use HEIC to JPG instead.'),
  ].join('\n    '),
  faqs: [
    { q: 'Why are the PNG files so much bigger than the HEIC photos?', a: 'HEIC is a lossy format built for tiny files. PNG stores every pixel without loss, so photographs end up several times larger. Use HEIC to JPG if size matters more than lossless quality.' },
    { q: 'Does it keep the photo’s metadata and orientation?', a: 'The picture comes out upright, but camera metadata such as location and date is not copied to the PNG.' },
    { q: 'What if a file fails?', a: 'That file is marked as failed and the others continue. Some newer HEIC variants (for example certain 10-bit or HDR files) are not supported by the bundled decoder, and files that are not really HEIC are rejected.' },
    { q: 'Are my photos uploaded?', a: 'No. The decoder runs in this tab and the files never leave your device.' },
    { q: 'Is there a limit on files or size?', a: 'There is no fixed limit, but very large photos or hundreds of files use a lot of memory, so convert big batches in parts if your browser slows down.' },
  ],
  features: ['Lossless PNG output', 'Batch conversion with per-file status', 'Download singly or as a ZIP', 'Runs entirely in your browser'],
  cardTitle: 'HEIC to PNG Converter', cardDescription: 'Convert iPhone HEIC and HEIF photos to lossless PNG online for free, in batches.',
  tags: ['heic to png', 'heif to png', 'iphone photo converter', 'convert heic'], iconKey: 'heic-jpg',
  related: ['heic-to-jpg-converter', 'heic-to-avif', 'heic-to-pdf'],
};
