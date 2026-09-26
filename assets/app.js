(function(){const DATA=window.__SITE_DATA__||{tools:[],posts:[],pages:[]};
const TOOLS=Array.isArray(DATA.tools)?DATA.tools:[];
const POSTS=Array.isArray(DATA.posts)?DATA.posts:[];
const SITE_ROOT=(function(){
  try{
    const cs=document.currentScript;
    const src=cs?cs.getAttribute('src'):'assets/app.js';
    const idx=src.indexOf('assets/app.js');
    const prefix=idx>=0?src.slice(0,idx):'';
    return new URL(prefix, location.href).href;
  }catch(e){return location.href}
})();
let TRAFFIC={};
function trafficValue(item){
  const key=String(item?.url||'').replace(/^\//,'').replace(/\/$/,'');
  const n=Number(TRAFFIC[key]||0);
  return Number.isFinite(n)?n:0;
}
function byTrafficDesc(a,b){return trafficValue(b)-trafficValue(a)}
function sortByTraffic(list){return [...list].sort(byTrafficDesc)}
function siteUrl(url){const raw=String(url||'');if(!raw)return '#';if(/^(?:https?:|mailto:|tel:|#|javascript:)/i.test(raw))return raw;const clean=raw.replace(/^\/+/, '');return new URL(clean, SITE_ROOT).href}
async function loadTraffic(){
  try{
    const r=await fetch('/api/traffic',{cache:'no-store',headers:{'Accept':'application/json'}});
    if(!r.ok)return;
    const data=await r.json();
    if(data&&data.counts) TRAFFIC=data.counts;
    renderTrafficSorted();
  }catch(e){}
}
function trackCurrentPage(){
  const path=location.pathname.replace(/^\//,'').replace(/\/$/,'');
  if(!path)return;
  const key='ewt-tracked:'+path;
  try{
    if(sessionStorage.getItem(key))return;
  }catch(e){}
  fetch('/api/track',{
    method:'POST',
    keepalive:true,
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({path})
  }).then(r=>{
    if(r.ok){try{sessionStorage.setItem(key,'1')}catch(e){}}
  }).catch(()=>{});
}

function initLandingAnimations(){
  const word=document.getElementById('heroWord');
  const wordText=word?.querySelector('.hero-word-text');
  if(word && wordText){
    const words=['Tasks','Life','Everything','Work'];
    let i=0;
    const applyHeroWordStyle=()=>{
      word.classList.remove('hero-word-task','hero-word-work','hero-word-life','hero-word-everything');
      const current=words[i];
      word.classList.add('hero-word-'+current.toLowerCase());
    };
    applyHeroWordStyle();
    setInterval(()=>{
      i=(i+1)%words.length;
      word.classList.add('is-changing');
      setTimeout(()=>{
        wordText.textContent=words[i];
        applyHeroWordStyle();
        word.classList.remove('is-changing');
      },220);
    },2600);
  }
}

function updateContentCounts(){
  const toolEls=document.querySelectorAll('#toolCount,[data-count="tools"],[data-count="tool"]');
  const blogEls=document.querySelectorAll('#blogCount,[data-count="blogs"],[data-count="blog"]');
  toolEls.forEach(el=>{el.textContent=TOOLS.length;});
  blogEls.forEach(el=>{el.textContent=POSTS.length;});
  const utilityEl=document.getElementById('utilityCount');
  if(utilityEl){
    const resourceCount=Number(DATA.resourceCount||0);
    utilityEl.textContent=(TOOLS.length+POSTS.length+resourceCount)+'+';
  }
}
function initLiveStats(){
  const stats=[
    {el:document.querySelector('.tool-stat:nth-child(1) strong'),base:1.7,step:.01,suffix:'M+'},
    {el:document.querySelector('.tool-stat:nth-child(2) strong'),base:72,step:.1,suffix:'M+'}
  ];
  stats.forEach(({el,base,step,suffix})=>{
    if(!el)return;
    let current=base;
    setInterval(()=>{
      current=Math.max(base-step*2,Math.min(base+step*2,current+(Math.random()>.5?step:-step)));
      el.classList.add('stat-live-pulse');
      el.textContent=(base<10?current.toFixed(2):current.toFixed(1))+suffix;
      setTimeout(()=>el.classList.remove('stat-live-pulse'),450);
    },4200);
  });
}
function renderTrafficSorted() {
  const toolsGrid=document.getElementById('toolsGrid');
  if(toolsGrid){
    const toolLimit=Number(toolsGrid.dataset.limit||0);
    const landingTools=toolLimit>0?sortByTraffic(TOOLS).slice(0,toolLimit):sortByTraffic(TOOLS);
    toolsGrid.innerHTML=landingTools.map(t=>`<a class="card" href="${esc(siteUrl(t.url))}"><div class="card-top"><div class="icon icon-svg">${iconSvg(t.iconKey)}</div></div><h3>${esc(t.title)}</h3><p>${esc(t.description)}</p><span class="card-link">Open Tool →</span></a>`).join('');
  }
  const allToolsGrid=document.getElementById('allToolsGrid');
  if(allToolsGrid){
    const all=sortByTraffic(TOOLS);
    allToolsGrid.innerHTML=all.map(t=>`<a class="card" href="${esc(siteUrl(t.url))}"><div class="card-top"><div class="icon icon-svg">${iconSvg(t.iconKey)}</div></div><h3>${esc(t.title)}</h3><p>${esc(t.description)}</p><span class="card-link">Open Tool →</span></a>`).join('');
  }const blogGrid=document.getElementById('blogGrid');
  if(blogGrid)blogGrid.innerHTML=sortByTraffic(POSTS).slice(0,6).map(p=>`<a class="card" href="${esc(siteUrl(p.url))}"><div class="card-top"><div class="icon icon-svg">${iconSvg('blog')}</div></div><h3>${esc(p.title)}</h3><p>${esc(p.description)}</p><span class="card-link">Read Article →</span></a>`).join('');
  const blogIndexGrid=document.getElementById('blogIndexGrid');
  if(blogIndexGrid)blogIndexGrid.innerHTML=sortByTraffic(POSTS).map(p=>`<a class="card" href="${esc(siteUrl(p.url))}"><div class="card-top"><div class="icon icon-svg">${iconSvg('blog')}</div></div><h3>${esc(p.title)}</h3><p>${esc(p.description)}</p><span class="card-link">Read Article →</span></a>`).join('');
}const all=[...DATA.tools.map(x=>({...x,type:'Tool'})),...DATA.posts.map(x=>({...x,type:'Blog'})),...DATA.pages];const panel=document.getElementById('searchPanel'),results=document.getElementById('searchResults'),status=document.getElementById('searchStatus');function esc(s){return String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}function iconSvg(key){const c='viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"';if(key==='image')return `<svg ${c}><defs><linearGradient id="gImg" x1="7" y1="7" x2="41" y2="41"><stop stop-color="#FACC15"/><stop offset=".48" stop-color="#22C55E"/><stop offset="1" stop-color="#3B82F6"/></linearGradient></defs><rect x="6" y="7" width="36" height="34" rx="8" fill="url(#gImg)"/><rect x="11" y="12" width="26" height="24" rx="5" fill="white"/><circle cx="19" cy="19" r="3" fill="#FACC15"/><path d="M13 32l7-8 6 6 4-4 5 6" stroke="#3B82F6" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;if(key==='text-case')return `<svg ${c}><defs><linearGradient id="gTextCute" x1="7" y1="7" x2="41" y2="41"><stop stop-color="#FF6B6B"/><stop offset=".45" stop-color="#A855F7"/><stop offset="1" stop-color="#22C55E"/></linearGradient></defs><rect x="6" y="7" width="36" height="34" rx="10" fill="url(#gTextCute)"/><circle cx="16" cy="17" r="5" fill="#FACC15"/><circle cx="32" cy="31" r="5" fill="#38BDF8"/><path d="M12 34 19 13h4l7 21M15 27h12" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path d="M29 14h7M32.5 10.5v7" stroke="white" stroke-width="2.5" stroke-linecap="round"/></svg>`;if(key==='thumbnail')return `<svg ${c}><defs><linearGradient id="gThumb" x1="7" y1="7" x2="41" y2="41"><stop stop-color="#FACC15"/><stop offset=".5" stop-color="#F43F5E"/><stop offset="1" stop-color="#8B5CF6"/></linearGradient></defs><rect x="5" y="9" width="38" height="30" rx="8" fill="url(#gThumb)"/><rect x="10" y="14" width="28" height="20" rx="4" fill="white"/><path d="M21 19.5v9l8-4.5z" fill="#F43F5E"/><path d="M24 36v6M19 42h10" stroke="#0F172A" stroke-width="2.6" stroke-linecap="round"/></svg>`;if(key==='compressor')return `<svg ${c}><rect x="6" y="7" width="36" height="34" rx="10" fill="#111827"/><path d="M24 14v8m0 0l-5-5m5 5l5-5" stroke="#FACC15" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path d="M24 34v-8m0 0l-5 5m5-5l5 5" stroke="#22C55E" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;if(key==='percentage')return `<svg ${c}><rect x="6" y="7" width="36" height="34" rx="10" fill="#7C3AED"/><circle cx="17" cy="18" r="4" fill="#fff"/><circle cx="31" cy="30" r="4" fill="#FACC15"/><path d="M15 33L33 15" stroke="#fff" stroke-width="3" stroke-linecap="round"/></svg>`;if(key==='age')return `<svg ${c}><rect x="6" y="9" width="36" height="30" rx="6" fill="#1D4ED8"/><rect x="6" y="9" width="36" height="9" rx="6" fill="#FACC15"/><circle cx="24" cy="29" r="6" fill="#fff"/><circle cx="24" cy="29" r="2.4" fill="#1D4ED8"/></svg>`;if(key==='password')return `<svg ${c}><path d="M24 6l16 6v11c0 10-7 16-16 19-9-3-16-9-16-19V12z" fill="#111827"/><circle cx="21" cy="22" r="5" fill="#FACC15"/><rect x="24" y="24" width="11" height="4" rx="2" fill="#FACC15" transform="rotate(45 24 24)"/></svg>`;if(key==='json')return `<svg ${c}><rect x="6" y="7" width="36" height="34" rx="10" fill="#16A34A"/><path d="M18 15c-4 0-4 3-4 6s0 6-4 6c4 0 4 3 4 6s0 6 4 6" stroke="#fff" stroke-width="2.6" stroke-linecap="round" fill="none"/><path d="M30 15c4 0 4 3 4 6s0 6 4 6c-4 0-4 3-4 6s0 6-4 6" stroke="#FACC15" stroke-width="2.6" stroke-linecap="round" fill="none"/></svg>`;if(key==='unit')return `<svg ${c}><rect x="6" y="7" width="36" height="34" rx="10" fill="#0EA5E9"/><path d="M13 18h18l-5-5m5 5l-5 5" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path d="M35 30H17l5 5m-5-5l5-5" stroke="#FACC15" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;if(key==='jpeg')return `<svg ${c}><rect x="6" y="9" width="36" height="28" rx="8" fill="#F97316"/><rect x="11" y="14" width="26" height="18" rx="4" fill="#fff"/><circle cx="18" cy="20" r="2.6" fill="#F97316"/><path d="M13 29l6-7 5 5 4-4 6 6" stroke="#111827" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;if(key==='ytags')return `<svg ${c}><rect x="5" y="11" width="26" height="20" rx="6" fill="#EF4444"/><path d="M15 17l8 4.5-8 4.5z" fill="#fff"/><path d="M31 24l9-6v16l-9-6z" fill="#111827"/><circle cx="38" cy="13" r="4" fill="#FACC15"/></svg>`;
if(key==='json-csv')return `<svg ${c}><rect x="6" y="7" width="36" height="34" rx="10" fill="#22C55E"/><rect x="12" y="14" width="10" height="20" rx="2" fill="#fff"/><path d="M27 17h8M27 22h8M27 27h5" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/></svg>`;if(key==='svg-optim')return `<svg ${c}><rect x="6" y="7" width="36" height="34" rx="10" fill="#8B5CF6"/><path d="M24 13l9 5v12l-9 5-9-5V18z" fill="#fff" opacity=".92"/><circle cx="24" cy="24" r="4" fill="#8B5CF6"/></svg>`;if(key==='heic-jpg')return `<svg ${c}><rect x="5" y="9" width="38" height="28" rx="8" fill="#FB923C"/><rect x="11" y="14" width="26" height="18" rx="4" fill="#fff"/><circle cx="18" cy="20" r="2.6" fill="#FB923C"/><path d="M13 29l6-7 5 5 4-4 6 6" stroke="#111827" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;if(key==='jpg-pdf')return `<svg ${c}><rect x="8" y="6" width="26" height="34" rx="4" fill="#EF4444"/><path d="M8 6h18l8 8v26H8z" fill="#F87171"/><text x="12" y="30" font-family="Arial" font-size="9" font-weight="900" fill="#fff">PDF</text></svg>`;if(key==='pdf-merge')return `<svg ${c}><rect x="6" y="10" width="22" height="28" rx="4" fill="#0EA5E9"/><rect x="20" y="16" width="22" height="28" rx="4" fill="#0369A1"/><path d="M22 27h6m-3-3v6" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/></svg>`;if(key==='pdf-compress')return `<svg ${c}><rect x="6" y="7" width="36" height="34" rx="10" fill="#334155"/><path d="M18 14v7h-7m21-7v7h7M18 34v-7h-7m21 7v-7h7" stroke="#FACC15" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;if(key==='word-count')return `<svg ${c}><rect x="6" y="7" width="36" height="34" rx="10" fill="#2563EB"/><path d="M14 18h20M14 24h20M14 30h12" stroke="#fff" stroke-width="3" stroke-linecap="round"/></svg>`;if(key==='dedupe')return `<svg ${c}><rect x="6" y="7" width="36" height="34" rx="10" fill="#EC4899"/><rect x="13" y="12" width="17" height="17" rx="4" fill="#fff" opacity=".55"/><rect x="19" y="19" width="17" height="17" rx="4" fill="#fff"/></svg>`;if(key==='text-sort')return `<svg ${c}><rect x="6" y="7" width="36" height="34" rx="10" fill="#6366F1"/><path d="M14 16h13M14 24h9M14 32h5" stroke="#fff" stroke-width="2.8" stroke-linecap="round"/><path d="M35 15v18m0 0l-4-4m4 4l4-4" stroke="#FACC15" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;if(key==='keyword-density')return `<svg ${c}><rect x="6" y="7" width="36" height="34" rx="10" fill="#06B6D4"/><circle cx="21" cy="21" r="8" fill="none" stroke="#fff" stroke-width="3"/><path d="M27 27l7 7" stroke="#fff" stroke-width="3" stroke-linecap="round"/></svg>`;if(key==='meta-tag')return `<svg ${c}><rect x="6" y="7" width="36" height="34" rx="10" fill="#A855F7"/><path d="M14 24l9-9h11v11l-9 9z" fill="#fff"/><circle cx="30" cy="18" r="2.2" fill="#A855F7"/></svg>`;if(key==='url-slug')return `<svg ${c}><rect x="6" y="7" width="36" height="34" rx="10" fill="#84CC16"/><path d="M17 24h14M14 18h6m-6 12h6m14-12h6m-6 12h6" stroke="#fff" stroke-width="2.8" stroke-linecap="round"/></svg>`;if(key==='url-encode')return `<svg ${c}><rect x="6" y="7" width="36" height="34" rx="10" fill="#0284C7"/><circle cx="17" cy="17" r="3.4" fill="#fff"/><circle cx="31" cy="31" r="3.4" fill="#fff"/><path d="M31 17L17 31" stroke="#fff" stroke-width="2.8" stroke-linecap="round"/></svg>`;if(key==='base64')return `<svg ${c}><rect x="6" y="7" width="36" height="34" rx="10" fill="#475569"/><path d="M19 16l-6 8 6 8M29 16l6 8-6 8" stroke="#FACC15" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;if(key==='regex')return `<svg ${c}><rect x="6" y="7" width="36" height="34" rx="10" fill="#F43F5E"/><path d="M24 14v12M18.5 17l11 6M18.5 23l11-6" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/><circle cx="24" cy="32" r="2.4" fill="#fff"/></svg>`;if(key==='timestamp')return `<svg ${c}><rect x="6" y="7" width="36" height="34" rx="10" fill="#D97706"/><circle cx="24" cy="25" r="11" fill="none" stroke="#fff" stroke-width="2.8"/><path d="M24 19v6l5 3" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M19 12h10" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/></svg>`;if(key==='color-picker')return `<svg ${c}><rect x="6" y="7" width="36" height="34" rx="10" fill="#111827"/><circle cx="18" cy="18" r="5" fill="#EF4444"/><circle cx="30" cy="18" r="5" fill="#22C55E"/><circle cx="24" cy="29" r="5" fill="#3B82F6"/></svg>`;if(key==='minifier')return `<svg ${c}><rect x="6" y="7" width="36" height="34" rx="10" fill="#0F172A"/><path d="M19 15l-7 9 7 9M29 15l7 9-7 9" stroke="#22D3EE" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;if(key==='html-entity')return `<svg ${c}><rect x="6" y="7" width="36" height="34" rx="10" fill="#059669"/><text x="12" y="30" font-family="Georgia,serif" font-size="20" font-weight="700" fill="#fff">&amp;</text></svg>`;if(key==='url-parser')return `<svg ${c}><rect x="6" y="7" width="36" height="34" rx="10" fill="#1D4ED8"/><path d="M20 28l-3.5 3.5a5 5 0 01-7-7L13 21M28 20l3.5-3.5a5 5 0 017 7L35 27" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/><path d="M19 29l10-10" stroke="#FACC15" stroke-width="2.6" stroke-linecap="round" stroke-dasharray="2 3"/></svg>`;
return `<svg ${c}><rect x="6" y="7" width="36" height="34" rx="8" fill="#2583D6"/><path d="M14 15h20v18H14z" fill="white"/><path d="M18 20h12M18 25h9M18 30h6" stroke="#22C5E8" stroke-width="2.5" stroke-linecap="round"/></svg>`}window.runSearch=function(q){q=(q||'').trim().toLowerCase();if(!q){if(panel)panel.classList.remove('show');if(results)results.innerHTML='';if(status)status.textContent='Start typing to search the whole site.';return}const hits=all.filter(x=>(x.title+' '+(x.description||'')+' '+(x.tags||[]).join(' ')).toLowerCase().includes(q)).slice(0,12);if(panel)panel.classList.add('show');if(status)status.textContent=hits.length?`${hits.length} result${hits.length===1?'':'s'} found`:'No matching results found.';results.innerHTML=hits.map(x=>`<a class="search-item" href="${esc(siteUrl(x.url))}"><strong>${esc(x.title)}</strong><span>${esc(x.type||'Page')}</span><p>${esc(x.description||'')}</p></a>`).join('')};window.closeSearch=()=>panel.classList.remove('show');const nav=document.getElementById('navSearch'),hero=document.getElementById('heroSearch');if(nav){nav.addEventListener('input',()=>runSearch(nav.value));nav.addEventListener('keydown',e=>{if(e.key==='Escape')closeSearch()})}if(hero)hero.addEventListener('input',()=>runSearch(hero.value));document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();nav&&nav.focus()}});updateContentCounts();initLandingAnimations();initLiveStats();renderTrafficSorted();loadTraffic();trackCurrentPage();const toolCount=document.getElementById('toolCount');if(toolCount)toolCount.textContent=TOOLS.length;const blogCount=document.getElementById('blogCount');if(blogCount)blogCount.textContent=POSTS.length;
/* Note: the "Send a Request" feedback form on the homepage (#toolFeedbackFormLocal) is
   handled by its own dedicated inline script in index.html (hidden-iframe POST technique),
   not by this shared app.js bundle. The generic #toolFeedbackForm handler that used to live
   here was dead code (no page has an element with that id) and has been removed. */
})();