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
/* The heading level for a card grid's titles.

   The build renders these cards server-side as well, so the level must be
   decided identically in both places. It is therefore carried on the element as
   data-card-heading rather than sniffed from the DOM - sniffing is ambiguous once
   the cards themselves are in the tree, because their own headings then match
   any "is there an <h2> here" query.

   Convention used by the build:
     - a grid inside a <section> that has its own <h2> (the homepage sections)
       uses h3 cards;
     - a grid on a listing page, where the page has a single <h1> and no
       preceding <h2>, uses h2 cards.

   Falling back to h2 keeps the outline valid if the attribute is ever missing. */
function cardHeadingTag(grid){
  const declared=grid&&grid.dataset&&grid.dataset.cardHeading;
  return declared==='h3'?'h3':'h2';
}
async function loadTraffic(){
  try{
    const r=await fetch('/api/traffic',{cache:'no-store',headers:{'Accept':'application/json'}});
    if(!r.ok)return;
    const data=await r.json();
    if(!data||!data.counts)return;
    // Rebuilding a grid throws away and recreates every card: wasted work and a
    // layout-shift risk. Only re-render when the counts really change something.
    const next=data.counts;
    const changed=Object.keys(next).some(k=>Number(next[k]||0)!==Number(TRAFFIC[k]||0));
    TRAFFIC=next;
    if(changed)renderTrafficSorted();
  }catch(e){}
}
function trackCurrentPage(){
  const path=location.pathname.replace(/^\//,'').replace(/\/$/,'');
  // Same guards the endpoint enforces, so a bad path can never produce a 4xx.
  if(!path||path.length>300||path.indexOf('..')>-1)return;
  const key='ewt-tracked:'+path;
  try{
    // One beacon per path per session, and none at all once an endpoint has
    // answered with an error: analytics stay best-effort and silent.
    if(sessionStorage.getItem(key)||sessionStorage.getItem('ewt-track-off'))return;
  }catch(e){}
  fetch('/api/track',{
    method:'POST',
    keepalive:true,
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({path})
  }).then(r=>{
    try{
      if(r.ok)sessionStorage.setItem(key,'1');
      else sessionStorage.setItem('ewt-track-off','1');
    }catch(e){}
  }).catch(()=>{
    try{sessionStorage.setItem('ewt-track-off','1')}catch(e){}
  });
}

function initNavigationActions(){
  const root=document.documentElement;
  const toggle=document.getElementById('themeToggle');
  const share=document.getElementById('shareButton');
  let theme='light';
  try{
    theme=localStorage.getItem('ewt-theme')==='dark'?'dark':'light';
  }catch(error){
    console.warn('Could not load the saved appearance preference.',error);
  }
  const applyTheme=()=>{
    const dark=theme==='dark';
    root.dataset.theme=theme;
    if(toggle){
      toggle.classList.toggle('is-dark',dark);
      toggle.setAttribute('aria-pressed',dark?'true':'false');
      toggle.setAttribute('aria-label',dark?'Switch to light mode':'Switch to dark mode');
      toggle.title=dark?'Switch to light mode':'Switch to dark mode';
    }
  };
  applyTheme();
  if(toggle)toggle.addEventListener('click',()=>{
    theme=theme==='dark'?'light':'dark';
    applyTheme();
    try{
      localStorage.setItem('ewt-theme',theme);
    }catch(error){
      console.warn('Could not save the appearance preference.',error);
    }
  });

  if(share){
    const status=document.createElement('div');
    status.className='nav-action-status';
    status.setAttribute('role','status');
    status.setAttribute('aria-live','polite');
    status.hidden=true;
    document.body.appendChild(status);
    let statusTimer=0;
    const announce=message=>{
      status.textContent=message;
      status.hidden=false;
      window.clearTimeout(statusTimer);
      statusTimer=window.setTimeout(()=>{status.hidden=true},3500);
    };
    share.addEventListener('click',async()=>{
      const shareData={title:'EasyWorkTools.online',text:'Explore free online tools and guides.',url:location.href};
      if(navigator.share){
        try{
          await navigator.share(shareData);
          return;
        }catch(error){
          if(error&&error.name==='AbortError')return;
        }
      }
      try{
        if(!navigator.clipboard||!navigator.clipboard.writeText)throw new Error('Clipboard access is unavailable.');
        await navigator.clipboard.writeText(shareData.url);
        announce('Page link copied to clipboard.');
      }catch(error){
        console.error('Could not share or copy the page link.',error);
        announce('Sharing is unavailable in this browser.');
      }
    });
  }
}
initNavigationActions();

function initLandingAnimations(){
  const word=document.getElementById('heroWord');
  const wordText=word?.querySelector('.hero-word-text');
  if(word && wordText){
    const words=['Tasks','Life','Everything','Work','Business','Education'];
    let i=0;
    const applyHeroWordStyle=()=>{
      word.classList.remove('hero-word-task','hero-word-work','hero-word-life','hero-word-everything','hero-word-business','hero-word-education');
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
    /* The card is labelled "FREE UTILITIES", so it counts utilities - the tools.
       This used to add POSTS.length as well, which reported 249 by counting 121
       blog articles as utilities. TOOLS.length is the real number. */
    const resourceCount=Number(DATA.resourceCount||0);
    utilityEl.textContent=(TOOLS.length+resourceCount)+'+';
  }
}
function initLiveStats(){
  /* The three statistics cards.
     These used to count up and down on a 4.2s interval, which made the published
     figures flicker. They are now written once and left alone, so the numbers on
     screen are stable and identical to the markup. The figures below are the
     same ones written into index.html - they are stated, not measured, and the
     third card (the tool count) is real and read from the manifest elsewhere. */
  const stats=[
    {el:document.querySelectorAll('.tool-stat strong')[0],value:34.31,suffix:'K+',digits:2},
    {el:document.querySelectorAll('.tool-stat strong')[1],value:500.8,suffix:'K+',digits:1}
  ];
  stats.forEach(({el,value,suffix,digits})=>{
    if(!el)return;
    el.textContent=value.toFixed(digits)+suffix;
  });
}
/* Category slug for the /tools/ filter. Must stay identical to catSlug() in
   scripts/categories.mjs, which is what produced the same values in the static
   HTML - if the two ever disagree, the filter silently matches nothing. */
function catSlug(name){
  return String(name||'').trim().toLowerCase().replace(/\s+tools$/i,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
}
/* The data attributes the /tools/ filter reads. renderTrafficSorted() rebuilds
   these grids from the site data to traffic-sort them, so it has to reproduce
   exactly what scripts/build-indexes.mjs wrote into the static markup. */
function toolCardAttrs(t){
  const tags=Array.isArray(t.tags)?t.tags:[];
  return ' data-cat="'+esc(catSlug(t.category))+'"'
    +' data-tags="'+esc(tags.join('|'))+'"'
    +' data-title="'+esc(t.title)+'"';
}
function renderTrafficSorted() {
  /* The homepage "Our Most Popular Tools" grid is owned by the category tab bar
     in assets/tool-tabs.js, and its sixteen cards come from the selection that
     scripts/popular-tools.mjs computes at build time. Rebuilding it here from a
     traffic sort discarded that curated set outright, and because loadTraffic()
     calls this function again the moment traffic data arrives, it also wiped
     whatever tab the visitor had open. The tab bar is the single owner now, so
     this skips the grid entirely when it is present. */
  const toolsGrid=document.getElementById('toolsGrid');
  if(toolsGrid&&!document.querySelector('.tool-tabs')){
    const toolLimit=Number(toolsGrid.dataset.limit||0);
    const landingTools=toolLimit>0?sortByTraffic(TOOLS).slice(0,toolLimit):sortByTraffic(TOOLS);
    const ht=cardHeadingTag(toolsGrid);
    toolsGrid.innerHTML=landingTools.map(t=>`<a class="card" href="${esc(siteUrl(t.url))}"${toolCardAttrs(t)}><div class="card-top"><div class="icon icon-svg">${iconSvg(t.url && t.url.includes('online-text-case-converter') ? 'text-case-converter' : t.iconKey)}</div></div><${ht}>${esc(t.title)}</${ht}><p>${esc(t.description)}</p></a>`).join('');
  }
  /* /tools/ filters this grid by ?cat= (see assets/tool-filter.js). Rebuilding
   * it here from a traffic sort discarded the card elements the filter had just
   * hidden, so every category came back and the page showed all 127 tools under
   * an active category chip. The filter is the single owner, so this skips the
   * grid whenever that filter is on the page - exactly like the #toolsGrid guard
   * above, which does the same for the tab bar. */
  const allToolsGrid=document.getElementById('allToolsGrid');
  if(allToolsGrid&&!document.getElementById('toolFilter')){
    const all=sortByTraffic(TOOLS);
    const ht=cardHeadingTag(allToolsGrid);
    allToolsGrid.innerHTML=all.map(t=>`<a class="card" href="${esc(siteUrl(t.url))}"${toolCardAttrs(t)}><div class="card-top"><div class="icon icon-svg">${iconSvg(t.url && t.url.includes('online-text-case-converter') ? 'text-case-converter' : t.iconKey)}</div></div><${ht}>${esc(t.title)}</${ht}><p>${esc(t.description)}</p></a>`).join('');
  }const blogGrid=document.getElementById('blogGrid');
  if(blogGrid){const ht=cardHeadingTag(blogGrid);
    blogGrid.innerHTML=sortByTraffic(POSTS).slice(0,6).map(p=>`<a class="card blog-card" href="${esc(siteUrl(p.url))}"><div class="card-top"><div class="icon icon-svg">${iconSvg('blog')}</div></div><${ht}>${esc(p.title)}</${ht}><p>${esc(p.description)}</p></a>`).join('');}
  const blogIndexGrid=document.getElementById('blogIndexGrid');
  if(blogIndexGrid){const ht=cardHeadingTag(blogIndexGrid);
    blogIndexGrid.innerHTML=sortByTraffic(POSTS).map(p=>`<a class="card blog-card" href="${esc(siteUrl(p.url))}"><div class="card-top"><div class="icon icon-svg">${iconSvg('blog')}</div></div><${ht}>${esc(p.title)}</${ht}><p>${esc(p.description)}</p></a>`).join('');}
}const all=[...DATA.tools.map(x=>({...x,type:'Tool'})),...DATA.posts.map(x=>({...x,type:'Blog'})),...DATA.pages];const panel=document.getElementById('searchPanel'),results=document.getElementById('searchResults'),status=document.getElementById('searchStatus');function esc(s){return String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}function iconSvg(key){const c='viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"';if(key==='image')return `<svg ${c}><defs><linearGradient id="gImg" x1="7" y1="7" x2="41" y2="41"><stop stop-color="#FACC15"/><stop offset=".48" stop-color="#22C55E"/><stop offset="1" stop-color="#3B82F6"/></linearGradient></defs><rect x="6" y="7" width="36" height="34" rx="8" fill="url(#gImg)"/><rect x="11" y="12" width="26" height="24" rx="5" fill="white"/><circle cx="19" cy="19" r="3" fill="#FACC15"/><path d="M13 32l7-8 6 6 4-4 5 6" stroke="#3B82F6" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;if(key==='text-case')return `<svg ${c}><defs><linearGradient id="gTextCute" x1="7" y1="7" x2="41" y2="41"><stop stop-color="#FF6B6B"/><stop offset=".45" stop-color="#A855F7"/><stop offset="1" stop-color="#22C55E"/></linearGradient></defs><rect x="6" y="7" width="36" height="34" rx="10" fill="url(#gTextCute)"/><circle cx="16" cy="17" r="5" fill="#FACC15"/><circle cx="32" cy="31" r="5" fill="#38BDF8"/><path d="M12 34 19 13h4l7 21M15 27h12" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path d="M29 14h7M32.5 10.5v7" stroke="white" stroke-width="2.5" stroke-linecap="round"/></svg>`;if(key==='text-case-converter')return `<svg ${c}><path d="M10 28 17.5 9 25 28" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path d="M13.9 22h7.2" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round"/><path d="M36.5 14v14" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round"/><path d="M36.5 16.75a4.75 4.75 0 1 0 0 9.5" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round"/><path d="M7 35h34" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round"/><path d="M7 31.2v7.6M41 31.2v7.6" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round"/></svg>`;if(key==='thumbnail')return `<svg ${c}><defs><linearGradient id="gThumb" x1="7" y1="7" x2="41" y2="41"><stop stop-color="#FACC15"/><stop offset=".5" stop-color="#F43F5E"/><stop offset="1" stop-color="#8B5CF6"/></linearGradient></defs><rect x="5" y="9" width="38" height="30" rx="8" fill="url(#gThumb)"/><rect x="10" y="14" width="28" height="20" rx="4" fill="white"/><path d="M21 19.5v9l8-4.5z" fill="#F43F5E"/><path d="M24 36v6M19 42h10" stroke="#0F172A" stroke-width="2.6" stroke-linecap="round"/></svg>`;if(key==='compressor')return `<svg ${c}><rect x="6" y="7" width="36" height="34" rx="10" fill="#111827"/><path d="M24 14v8m0 0l-5-5m5 5l5-5" stroke="#FACC15" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path d="M24 34v-8m0 0l-5 5m5-5l5 5" stroke="#22C55E" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;if(key==='percentage')return `<svg ${c}><rect x="6" y="7" width="36" height="34" rx="10" fill="#7C3AED"/><circle cx="17" cy="18" r="4" fill="#fff"/><circle cx="31" cy="30" r="4" fill="#FACC15"/><path d="M15 33L33 15" stroke="#fff" stroke-width="3" stroke-linecap="round"/></svg>`;if(key==='age')return `<svg ${c}><rect x="6" y="9" width="36" height="30" rx="6" fill="#1D4ED8"/><rect x="6" y="9" width="36" height="9" rx="6" fill="#FACC15"/><circle cx="24" cy="29" r="6" fill="#fff"/><circle cx="24" cy="29" r="2.4" fill="#1D4ED8"/></svg>`;if(key==='password')return `<svg ${c}><path d="M24 6l16 6v11c0 10-7 16-16 19-9-3-16-9-16-19V12z" fill="#111827"/><circle cx="21" cy="22" r="5" fill="#FACC15"/><rect x="24" y="24" width="11" height="4" rx="2" fill="#FACC15" transform="rotate(45 24 24)"/></svg>`;if(key==='json')return `<svg ${c}><rect x="6" y="7" width="36" height="34" rx="10" fill="#16A34A"/><path d="M18 15c-4 0-4 3-4 6s0 6-4 6c4 0 4 3 4 6s0 6 4 6" stroke="#fff" stroke-width="2.6" stroke-linecap="round" fill="none"/><path d="M30 15c4 0 4 3 4 6s0 6 4 6c-4 0-4 3-4 6s0 6-4 6" stroke="#FACC15" stroke-width="2.6" stroke-linecap="round" fill="none"/></svg>`;if(key==='unit')return `<svg ${c}><rect x="6" y="7" width="36" height="34" rx="10" fill="#0EA5E9"/><path d="M13 18h18l-5-5m5 5l-5 5" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path d="M35 30H17l5 5m-5-5l5-5" stroke="#FACC15" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;if(key==='jpeg')return `<svg ${c}><rect x="6" y="9" width="36" height="28" rx="8" fill="#F97316"/><rect x="11" y="14" width="26" height="18" rx="4" fill="#fff"/><circle cx="18" cy="20" r="2.6" fill="#F97316"/><path d="M13 29l6-7 5 5 4-4 6 6" stroke="#111827" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;if(key==='ytags')return `<svg ${c}><rect x="5" y="11" width="26" height="20" rx="6" fill="#EF4444"/><path d="M15 17l8 4.5-8 4.5z" fill="#fff"/><path d="M31 24l9-6v16l-9-6z" fill="#111827"/><circle cx="38" cy="13" r="4" fill="#FACC15"/></svg>`;
if(key==='json-csv')return `<svg ${c}><rect x="6" y="7" width="36" height="34" rx="10" fill="#22C55E"/><rect x="12" y="14" width="10" height="20" rx="2" fill="#fff"/><path d="M27 17h8M27 22h8M27 27h5" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/></svg>`;if(key==='svg-optim')return `<svg ${c}><rect x="6" y="7" width="36" height="34" rx="10" fill="#8B5CF6"/><path d="M24 13l9 5v12l-9 5-9-5V18z" fill="#fff" opacity=".92"/><circle cx="24" cy="24" r="4" fill="#8B5CF6"/></svg>`;if(key==='heic-jpg')return `<svg ${c}><rect x="5" y="9" width="38" height="28" rx="8" fill="#FB923C"/><rect x="11" y="14" width="26" height="18" rx="4" fill="#fff"/><circle cx="18" cy="20" r="2.6" fill="#FB923C"/><path d="M13 29l6-7 5 5 4-4 6 6" stroke="#111827" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;if(key==='jpg-pdf')return `<svg ${c}><rect x="8" y="6" width="26" height="34" rx="4" fill="#EF4444"/><path d="M8 6h18l8 8v26H8z" fill="#F87171"/><text x="12" y="30" font-family="Arial" font-size="9" font-weight="400" fill="#fff">PDF</text></svg>`;if(key==='pdf-merge')return `<svg ${c}><rect x="6" y="10" width="22" height="28" rx="4" fill="#0EA5E9"/><rect x="20" y="16" width="22" height="28" rx="4" fill="#0369A1"/><path d="M22 27h6m-3-3v6" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/></svg>`;if(key==='pdf-compress')return `<svg ${c}><rect x="6" y="7" width="36" height="34" rx="10" fill="#334155"/><path d="M18 14v7h-7m21-7v7h7M18 34v-7h-7m21 7v-7h7" stroke="#FACC15" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;if(key==='word-count')return `<svg ${c}><rect x="6" y="7" width="36" height="34" rx="10" fill="#2563EB"/><path d="M14 18h20M14 24h20M14 30h12" stroke="#fff" stroke-width="3" stroke-linecap="round"/></svg>`;if(key==='dedupe')return `<svg ${c}><rect x="6" y="7" width="36" height="34" rx="10" fill="#EC4899"/><rect x="13" y="12" width="17" height="17" rx="4" fill="#fff" opacity=".55"/><rect x="19" y="19" width="17" height="17" rx="4" fill="#fff"/></svg>`;if(key==='text-sort')return `<svg ${c}><rect x="6" y="7" width="36" height="34" rx="10" fill="#6366F1"/><path d="M14 16h13M14 24h9M14 32h5" stroke="#fff" stroke-width="2.8" stroke-linecap="round"/><path d="M35 15v18m0 0l-4-4m4 4l4-4" stroke="#FACC15" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;if(key==='keyword-density')return `<svg ${c}><rect x="6" y="7" width="36" height="34" rx="10" fill="#06B6D4"/><circle cx="21" cy="21" r="8" fill="none" stroke="#fff" stroke-width="3"/><path d="M27 27l7 7" stroke="#fff" stroke-width="3" stroke-linecap="round"/></svg>`;if(key==='meta-tag')return `<svg ${c}><rect x="6" y="7" width="36" height="34" rx="10" fill="#A855F7"/><path d="M14 24l9-9h11v11l-9 9z" fill="#fff"/><circle cx="30" cy="18" r="2.2" fill="#A855F7"/></svg>`;if(key==='url-slug')return `<svg ${c}><rect x="6" y="7" width="36" height="34" rx="10" fill="#84CC16"/><path d="M17 24h14M14 18h6m-6 12h6m14-12h6m-6 12h6" stroke="#fff" stroke-width="2.8" stroke-linecap="round"/></svg>`;if(key==='url-encode')return `<svg ${c}><rect x="6" y="7" width="36" height="34" rx="10" fill="#0284C7"/><circle cx="17" cy="17" r="3.4" fill="#fff"/><circle cx="31" cy="31" r="3.4" fill="#fff"/><path d="M31 17L17 31" stroke="#fff" stroke-width="2.8" stroke-linecap="round"/></svg>`;if(key==='base64')return `<svg ${c}><rect x="6" y="7" width="36" height="34" rx="10" fill="#475569"/><path d="M19 16l-6 8 6 8M29 16l6 8-6 8" stroke="#FACC15" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;if(key==='regex')return `<svg ${c}><rect x="6" y="7" width="36" height="34" rx="10" fill="#F43F5E"/><path d="M24 14v12M18.5 17l11 6M18.5 23l11-6" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/><circle cx="24" cy="32" r="2.4" fill="#fff"/></svg>`;if(key==='timestamp')return `<svg ${c}><rect x="6" y="7" width="36" height="34" rx="10" fill="#D97706"/><circle cx="24" cy="25" r="11" fill="none" stroke="#fff" stroke-width="2.8"/><path d="M24 19v6l5 3" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M19 12h10" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/></svg>`;if(key==='color-picker')return `<svg ${c}><rect x="6" y="7" width="36" height="34" rx="10" fill="#111827"/><circle cx="18" cy="18" r="5" fill="#EF4444"/><circle cx="30" cy="18" r="5" fill="#22C55E"/><circle cx="24" cy="29" r="5" fill="#3B82F6"/></svg>`;if(key==='minifier')return `<svg ${c}><rect x="6" y="7" width="36" height="34" rx="10" fill="#0F172A"/><path d="M19 15l-7 9 7 9M29 15l7 9-7 9" stroke="#22D3EE" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;if(key==='html-entity')return `<svg ${c}><rect x="6" y="7" width="36" height="34" rx="10" fill="#059669"/><text x="12" y="30" font-family="Georgia,serif" font-size="20" font-weight="400" fill="#fff">&amp;</text></svg>`;if(key==='url-parser')return `<svg ${c}><rect x="6" y="7" width="36" height="34" rx="10" fill="#1D4ED8"/><path d="M20 28l-3.5 3.5a5 5 0 01-7-7L13 21M28 20l3.5-3.5a5 5 0 017 7L35 27" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/><path d="M19 29l10-10" stroke="#FACC15" stroke-width="2.6" stroke-linecap="round" stroke-dasharray="2 3"/></svg>`;
if(key==='text-clean')return `<svg ${c}><rect x="6" y="7" width="36" height="34" rx="10" fill="#0D9488"/><path d="M15 30l14-14M15 16h6M29 32h6" stroke="#fff" stroke-width="2.8" stroke-linecap="round"/></svg>`;
if(key==='line-tools')return `<svg ${c}><rect x="6" y="7" width="36" height="34" rx="10" fill="#7C3AED"/><path d="M14 16h20M14 24h14M14 32h20" stroke="#fff" stroke-width="2.8" stroke-linecap="round"/><circle cx="34" cy="24" r="2.4" fill="#FACC15"/></svg>`;
if(key==='find-replace')return `<svg ${c}><rect x="6" y="7" width="36" height="34" rx="10" fill="#DB2777"/><circle cx="20" cy="20" r="7" fill="none" stroke="#fff" stroke-width="2.6"/><path d="M25 25l7 7" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/><path d="M17 32h14" stroke="#FACC15" stroke-width="2.6" stroke-linecap="round"/></svg>`;
if(key==='text-compare')return `<svg ${c}><rect x="6" y="7" width="36" height="34" rx="10" fill="#0891B2"/><path d="M18 14v20M30 14v20" stroke="#fff" stroke-width="2.8" stroke-linecap="round"/><path d="M14 20h8M26 28h8" stroke="#FACC15" stroke-width="2.8" stroke-linecap="round"/></svg>`;
if(key==='text-extract')return `<svg ${c}><rect x="6" y="7" width="36" height="34" rx="10" fill="#CA8A04"/><rect x="13" y="13" width="22" height="16" rx="3" fill="none" stroke="#fff" stroke-width="2.4"/><path d="M17 34l7-7 7 7" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
if(key==='lorem-ipsum')return `<svg ${c}><rect x="6" y="7" width="36" height="34" rx="10" fill="#65A30D"/><path d="M14 16h20M14 22h20M14 28h14" stroke="#fff" stroke-width="2.8" stroke-linecap="round"/></svg>`;
if(key==='readability')return `<svg ${c}><rect x="6" y="7" width="36" height="34" rx="10" fill="#EA580C"/><path d="M24 14v20M14 34h20" stroke="#fff" stroke-width="2.8" stroke-linecap="round"/><circle cx="24" cy="14" r="3" fill="#FACC15"/></svg>`;
if(key==='markdown')return `<svg ${c}><rect x="6" y="7" width="36" height="34" rx="10" fill="#1E293B"/><path d="M13 30V17l6 7 6-7v13" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M31 18v8m0 0l-3-3m3 3l3-3" stroke="#FACC15" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

if(key==='canonical-check')return `<svg ${c}><rect x="6" y="7" width="36" height="34" rx="10" fill="#3B82F6"/><rect x="12" y="12" width="24" height="17" rx="3" fill="#fff"/><path d="M12 17.5h24" stroke="#3B82F6" stroke-width="2.4"/><path d="M16 22.5h9M16 26.5h6" stroke="#93C5FD" stroke-width="2.2" stroke-linecap="round"/><path d="M24 31l4 4 7-8" stroke="#FACC15" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`;if(key==='favicon-gen')return `<svg ${c}><rect x="6" y="7" width="36" height="34" rx="10" fill="#6D28D9"/><rect x="12" y="13" width="17" height="17" rx="5" fill="#fff"/><rect x="16" y="17" width="9" height="9" rx="2.5" fill="#6D28D9"/><path d="M34 13l1.6 4 4 1.6-4 1.6-1.6 4-1.6-4-4-1.6 4-1.6z" fill="#FACC15"/><path d="M31 31h9M35.5 26.5v9" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/></svg>`;if(key==='hash')return `<svg ${c}><rect x="6" y="7" width="36" height="34" rx="10" fill="#0369A1"/><path d="M21 16l-3 16M30 16l-3 16" stroke="#fff" stroke-width="3" stroke-linecap="round"/><path d="M17 22h16M16 29h16" stroke="#FACC15" stroke-width="3" stroke-linecap="round"/></svg>`;if(key==='hreflang')return `<svg ${c}><rect x="6" y="7" width="36" height="34" rx="10" fill="#15803D"/><circle cx="24" cy="24" r="12" fill="none" stroke="#fff" stroke-width="2.6"/><ellipse cx="24" cy="24" rx="5.5" ry="12" fill="none" stroke="#FACC15" stroke-width="2.4"/><path d="M13 19.5h22M13 28.5h22" stroke="#fff" stroke-width="2.4"/></svg>`;if(key==='http-header')return `<svg ${c}><rect x="6" y="7" width="36" height="34" rx="10" fill="#1E3A8A"/><rect x="11" y="13" width="26" height="22" rx="4" fill="#fff"/><path d="M11 20.5h26" stroke="#1E3A8A" stroke-width="2.4"/><circle cx="15" cy="16.7" r="1.7" fill="#FACC15"/><circle cx="20" cy="16.7" r="1.7" fill="#F87171"/><path d="M15 25.5h13M15 30h8" stroke="#60A5FA" stroke-width="2.4" stroke-linecap="round"/></svg>`;if(key==='bg-color')return `<svg ${c}><rect x="6" y="7" width="36" height="34" rx="10" fill="#F59E0B"/><rect x="11" y="12" width="26" height="18" rx="3" fill="#fff"/><circle cx="16" cy="17" r="2.2" fill="#F59E0B"/><path d="M12 28l6-7 4.5 5 3.5-3.5 6.5 5.5" stroke="#B45309" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/><circle cx="17" cy="35" r="3.6" fill="#fff"/><circle cx="25" cy="35" r="3.6" fill="#EF4444"/><circle cx="33" cy="35" r="3.6" fill="#3B82F6"/></svg>`;if(key==='border-round')return `<svg ${c}><rect x="6" y="7" width="36" height="34" rx="10" fill="#9333EA"/><rect x="14" y="15" width="20" height="18" rx="8" fill="none" stroke="#fff" stroke-width="2.8"/><rect x="11" y="12" width="5" height="5" rx="1.5" fill="#FACC15"/><rect x="32" y="12" width="5" height="5" rx="1.5" fill="#FACC15"/><rect x="11" y="31" width="5" height="5" rx="1.5" fill="#FACC15"/><rect x="32" y="31" width="5" height="5" rx="1.5" fill="#FACC15"/></svg>`;if(key==='collage')return `<svg ${c}><rect x="6" y="7" width="36" height="34" rx="10" fill="#D946EF"/><rect x="11" y="12" width="12" height="11" rx="2.5" fill="#fff"/><rect x="25" y="12" width="12" height="11" rx="2.5" fill="#FCE7F3"/><rect x="11" y="25" width="12" height="11" rx="2.5" fill="#FCE7F3"/><rect x="25" y="25" width="12" height="11" rx="2.5" fill="#FACC15"/></svg>`;if(key==='img-palette')return `<svg ${c}><rect x="6" y="7" width="36" height="34" rx="10" fill="#14B8A6"/><circle cx="24" cy="24" r="13" fill="#fff"/><circle cx="18" cy="20" r="2.6" fill="#EF4444"/><circle cx="25" cy="17" r="2.6" fill="#FACC15"/><circle cx="31" cy="23" r="2.6" fill="#3B82F6"/><circle cx="27" cy="30" r="2.6" fill="#7C3AED"/><circle cx="33.5" cy="33.5" r="5" fill="#14B8A6"/></svg>`;if(key==='img-compare')return `<svg ${c}><rect x="6" y="7" width="36" height="34" rx="10" fill="#4F46E5"/><rect x="11" y="13" width="12" height="22" rx="3" fill="#C7D2FE"/><rect x="25" y="13" width="12" height="22" rx="3" fill="#fff"/><path d="M24 11v26" stroke="#FACC15" stroke-width="3" stroke-dasharray="5 4"/><path d="M13 32l4-5 3 3.5" stroke="#312E81" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M27 32l4-5 3 3.5" stroke="#4F46E5" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`;if(key==='crop-rotate')return `<svg ${c}><rect x="6" y="7" width="36" height="34" rx="10" fill="#166534"/><path d="M15 13v13a3 3 0 0 0 3 3h13" stroke="#fff" stroke-width="2.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M10 18h13a3 3 0 0 1 3 3v13" stroke="#fff" stroke-width="2.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M30 13.5A7.5 7.5 0 0 1 37 20" stroke="#FACC15" stroke-width="2.8" fill="none" stroke-linecap="round"/><path d="M37 15.5V20h-4.5" stroke="#FACC15" stroke-width="2.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`;if(key==='dimensions')return `<svg ${c}><rect x="6" y="7" width="36" height="34" rx="10" fill="#C2410C"/><rect x="16" y="13" width="20" height="15" rx="3" fill="#fff"/><path d="M17 26l5-6 4 4.5 3-3 5 4.5" stroke="#C2410C" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M16 34h20" stroke="#FACC15" stroke-width="2.4" stroke-linecap="round"/><path d="M20 31.5l-4 2.5 4 2.5M32 31.5l4 2.5-4 2.5" stroke="#FACC15" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M11 13v15" stroke="#FACC15" stroke-width="2.4" stroke-linecap="round"/><path d="M8.5 17L11 13l2.5 4M8.5 24L11 28l2.5-4" stroke="#FACC15" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`;if(key==='img-editor')return `<svg ${c}><rect x="6" y="7" width="36" height="34" rx="10" fill="#7C2D12"/><rect x="10" y="12" width="22" height="16" rx="3" fill="#fff"/><circle cx="15" cy="17" r="2.2" fill="#7C2D12"/><path d="M11 26l5.5-6.5 4.5 5 3.5-3.5 5.5 5.5" stroke="#7C2D12" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M37 12l4 4-11.5 11.5-5.5 1.5 1.5-5.5z" fill="#FACC15" stroke="#fff" stroke-width="1.8" stroke-linejoin="round"/></svg>`;if(key==='fmt-convert')return `<svg ${c}><rect x="6" y="7" width="36" height="34" rx="10" fill="#075985"/><rect x="8" y="16" width="11" height="16" rx="3" fill="#fff"/><path d="M11 21h5M11 25h5M11 29h3" stroke="#075985" stroke-width="2" stroke-linecap="round"/><rect x="29" y="16" width="11" height="16" rx="3" fill="#FACC15"/><path d="M32 21h5M32 25h5M32 29h3" stroke="#075985" stroke-width="2" stroke-linecap="round"/><path d="M21 24h6m0 0l-2.5-2.5M27 24l-2.5 2.5" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`;if(key==='hash-check')return `<svg ${c}><rect x="6" y="7" width="36" height="34" rx="10" fill="#115E59"/><path d="M14 27a10 10 0 0 1 20 0v3" stroke="#fff" stroke-width="2.8" fill="none" stroke-linecap="round"/><path d="M19 29a5.5 5.5 0 0 1 11 0v5" stroke="#FACC15" stroke-width="2.8" fill="none" stroke-linecap="round"/><path d="M24 31v6" stroke="#fff" stroke-width="2.8" stroke-linecap="round"/></svg>`;if(key==='merge-stitch')return `<svg ${c}><rect x="6" y="7" width="36" height="34" rx="10" fill="#047857"/><rect x="9" y="13" width="17" height="22" rx="3" fill="#fff"/><rect x="22" y="13" width="17" height="22" rx="3" fill="#A7F3D0"/><path d="M10 30c3-4 6 4 9 0s6 4 9 0 6 4 8 0" stroke="#064E3B" stroke-width="2.4" fill="none" stroke-linecap="round"/></svg>`;if(key==='metadata')return `<svg ${c}><rect x="6" y="7" width="36" height="34" rx="10" fill="#1E40AF"/><rect x="11" y="13" width="26" height="22" rx="3" fill="#fff"/><circle cx="17" cy="19" r="2.4" fill="#1E40AF"/><path d="M12 33l6-8 4.5 5.5 3.5-3.5 6.5 6" stroke="#1E40AF" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/><circle cx="32" cy="27" r="5.5" fill="#FACC15"/><circle cx="32" cy="24" r="1.4" fill="#1E40AF"/><path d="M32 27v4.5" stroke="#1E40AF" stroke-width="2.4" stroke-linecap="round"/></svg>`;if(key==='splitter')return `<svg ${c}><rect x="6" y="7" width="36" height="34" rx="10" fill="#BE185D"/><rect x="11" y="13" width="26" height="17" rx="3" fill="#fff"/><path d="M24 13v17" stroke="#BE185D" stroke-width="3" stroke-dasharray="4 3"/><path d="M19 36h-6m0 0l3-3m-3 3l3 3" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M29 36h6m0 0l-3-3m3 3l-3 3" stroke="#FACC15" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`;if(key==='img-base64')return `<svg ${c}><rect x="6" y="7" width="36" height="34" rx="10" fill="#4338CA"/><rect x="10" y="12" width="18" height="15" rx="3" fill="#fff"/><circle cx="15" cy="16.5" r="2" fill="#4338CA"/><path d="M11 25l4.5-6 4 4.5 3-3 4.5 4.5" stroke="#4338CA" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M32 27l-4.5 6 4.5 6" stroke="#FACC15" stroke-width="2.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M37 27l4.5 6-4.5 6" stroke="#FACC15" stroke-width="2.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`;if(key==='watermark')return `<svg ${c}><rect x="6" y="7" width="36" height="34" rx="10" fill="#7E22CE"/><rect x="11" y="13" width="26" height="22" rx="3" fill="#fff"/><circle cx="17" cy="19" r="2.4" fill="#7E22CE"/><path d="M12 33l6-8 4.5 5.5 3.5-3.5 6.5 6" stroke="#7E22CE" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M33 17l2 4.1 4.5.7-3.3 3.2.8 4.5-4-2.1-4 2.1.8-4.5-3.3-3.2 4.5-.7z" fill="#FACC15" opacity=".6" stroke="#7E22CE" stroke-width="1.4" stroke-linejoin="round"/></svg>`;if(key==='jwt')return `<svg ${c}><rect x="6" y="7" width="36" height="34" rx="10" fill="#5B21B6"/><circle cx="17" cy="24" r="7" fill="none" stroke="#fff" stroke-width="3"/><path d="M24 24h13" stroke="#fff" stroke-width="3" stroke-linecap="round"/><path d="M32 24v5M37 24v4" stroke="#FACC15" stroke-width="3" stroke-linecap="round"/><circle cx="17" cy="24" r="2.5" fill="#FACC15"/></svg>`;if(key==='pdf-images')return `<svg ${c}><rect x="6" y="7" width="36" height="34" rx="10" fill="#DC2626"/><rect x="10" y="12" width="13" height="18" rx="2.5" fill="#fff"/><path d="M13 17h7M13 21h7M13 25h4" stroke="#DC2626" stroke-width="2" stroke-linecap="round"/><rect x="25" y="18" width="13" height="13" rx="2.5" fill="#FECACA"/><circle cx="29" cy="22" r="1.6" fill="#DC2626"/><path d="M26 29l3-3.5 2.5 2.5 1.5-1.5 3 2.5" stroke="#DC2626" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M13 35h22" stroke="#FACC15" stroke-width="2.4" stroke-linecap="round"/><path d="M16.5 32.5L13 35l3.5 2.5M31.5 32.5L35 35l-3.5 2.5" stroke="#FACC15" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`;if(key==='pdf-meta')return `<svg ${c}><rect x="6" y="7" width="36" height="34" rx="10" fill="#991B1B"/><path d="M13 11h13l8 8v16a3 3 0 0 1-3 3H13a3 3 0 0 1-3-3V14a3 3 0 0 1 3-3z" fill="#fff"/><path d="M26 11v8h8" fill="#FCA5A5"/><path d="M15 24h11M15 29h7" stroke="#991B1B" stroke-width="2.2" stroke-linecap="round"/><path d="M37 25l3.5 3.5-7.5 7.5-4.5.5.5-4.5z" fill="#FACC15" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/></svg>`;if(key==='pdf-organizer')return `<svg ${c}><rect x="6" y="7" width="36" height="34" rx="10" fill="#7F1D1D"/><rect x="10" y="13" width="13" height="17" rx="2.5" fill="#fff"/><path d="M13 18h7M13 22h7M13 26h4" stroke="#7F1D1D" stroke-width="1.8" stroke-linecap="round"/><rect x="22" y="19" width="13" height="17" rx="2.5" fill="#FCA5A5"/><path d="M25 24h7M25 28h7M25 32h4" stroke="#7F1D1D" stroke-width="1.8" stroke-linecap="round"/><path d="M24 11h9m0 0l-3-3m3 3l-3 3" stroke="#FACC15" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`;if(key==='pdf-watermark')return `<svg ${c}><rect x="6" y="7" width="36" height="34" rx="10" fill="#B91C1C"/><rect x="11" y="11" width="26" height="27" rx="3" fill="#fff"/><path d="M15 15h18M15 36h18" stroke="#FECACA" stroke-width="2.6" stroke-linecap="round"/><path d="M24 18l2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4-3.9-3.8 5.4-.8z" fill="#B91C1C" opacity=".3"/><path d="M24 18l2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4-3.9-3.8 5.4-.8z" fill="none" stroke="#B91C1C" stroke-width="1.6" stroke-linejoin="round"/></svg>`;if(key==='redirect-rules')return `<svg ${c}><rect x="6" y="7" width="36" height="34" rx="10" fill="#A16207"/><circle cx="14" cy="24" r="4" fill="#fff"/><path d="M18 24h6" stroke="#fff" stroke-width="2.8" stroke-linecap="round"/><path d="M24 24c5 0 4-9 9-9" stroke="#fff" stroke-width="2.8" fill="none" stroke-linecap="round"/><path d="M24 24c5 0 4 9 9 9" stroke="#FACC15" stroke-width="2.8" fill="none" stroke-linecap="round"/><path d="M29 11.5l4 3.5-4 3.5" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M29 29.5l4 3.5-4 3.5" stroke="#FACC15" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`;if(key==='robots-txt')return `<svg ${c}><rect x="6" y="7" width="36" height="34" rx="10" fill="#374151"/><rect x="13" y="18" width="22" height="17" rx="5" fill="#fff"/><circle cx="19.5" cy="25" r="3" fill="#374151"/><circle cx="28.5" cy="25" r="3" fill="#374151"/><path d="M20 31h8" stroke="#374151" stroke-width="2.2" stroke-linecap="round"/><path d="M24 18v-4" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/><circle cx="24" cy="12.5" r="2.6" fill="#FACC15"/><path d="M10 24v3M38 24v3" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/></svg>`;if(key==='schema-ld')return `<svg ${c}><rect x="6" y="7" width="36" height="34" rx="10" fill="#065F46"/><path d="M21 19l7 2M20 21l2.5 7M31 24l-5.5 5.5" stroke="#A7F3D0" stroke-width="2.4" stroke-linecap="round"/><circle cx="17" cy="17" r="4.5" fill="#fff"/><circle cx="33" cy="21" r="4" fill="#FACC15"/><circle cx="23" cy="33" r="4" fill="#A7F3D0"/></svg>`;if(key==='seo-analyzer')return `<svg ${c}><rect x="6" y="7" width="36" height="34" rx="10" fill="#0E7490"/><path d="M13 34v-4M19 34v-7M25 34v-10" stroke="#fff" stroke-width="3" stroke-linecap="round"/><circle cx="31" cy="20" r="6.5" fill="none" stroke="#FACC15" stroke-width="3"/><path d="M35.8 24.8L40 29" stroke="#FACC15" stroke-width="3.2" stroke-linecap="round"/></svg>`;if(key==='serp-preview')return `<svg ${c}><rect x="6" y="7" width="36" height="34" rx="10" fill="#1D4ED8"/><rect x="10" y="12" width="28" height="24" rx="4" fill="#fff"/><circle cx="15" cy="17.5" r="2" fill="#1D4ED8"/><path d="M19.5 17.5h14" stroke="#1D4ED8" stroke-width="2.6" stroke-linecap="round"/><path d="M14 24h18M14 28.5h13" stroke="#93C5FD" stroke-width="2.4" stroke-linecap="round"/><path d="M14 33h9" stroke="#22C55E" stroke-width="2.4" stroke-linecap="round"/></svg>`;if(key==='social-resize')return `<svg ${c}><rect x="6" y="7" width="36" height="34" rx="10" fill="#C026D3"/><rect x="16" y="16" width="17" height="15" rx="3" fill="#fff"/><circle cx="21" cy="21" r="2" fill="#C026D3"/><path d="M17 29l4-5 3.5 4 3-3 4.5 4" stroke="#C026D3" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M11 16v-5h5" stroke="#FACC15" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M37 32v5h-5" stroke="#FACC15" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M11 11l6 6M37 37l-6-6" stroke="#FACC15" stroke-width="2.6" stroke-linecap="round"/></svg>`;if(key==='social-preview')return `<svg ${c}><rect x="6" y="7" width="36" height="34" rx="10" fill="#0F766E"/><rect x="11" y="12" width="26" height="24" rx="4" fill="#fff"/><rect x="14" y="15" width="20" height="10" rx="2.5" fill="#A7F3D0"/><circle cx="19" cy="19" r="1.8" fill="#0F766E"/><path d="M15 24l4-4.5 3 3.5 2.5-2.5 4.5 3.5" stroke="#0F766E" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 29.5h20" stroke="#0F766E" stroke-width="2.4" stroke-linecap="round"/><path d="M14 33.5h12" stroke="#94A3B8" stroke-width="2.2" stroke-linecap="round"/></svg>`;if(key==='uuid')return `<svg ${c}><rect x="6" y="7" width="36" height="34" rx="10" fill="#4C1D95"/><rect x="10" y="16" width="12" height="7" rx="2" fill="#fff"/><rect x="24" y="16" width="7" height="7" rx="2" fill="#FACC15"/><rect x="33" y="16" width="7" height="7" rx="2" fill="#C4B5FD"/><rect x="10" y="26" width="7" height="7" rx="2" fill="#C4B5FD"/><rect x="19" y="26" width="7" height="7" rx="2" fill="#fff"/><rect x="28" y="26" width="12" height="7" rx="2" fill="#FACC15"/></svg>`;if(key==='sitemap-xml')return `<svg ${c}><rect x="6" y="7" width="36" height="34" rx="10" fill="#0C4A6E"/><rect x="19" y="11" width="11" height="8" rx="2.5" fill="#fff"/><rect x="9" y="29" width="11" height="8" rx="2.5" fill="#FACC15"/><rect x="29" y="29" width="11" height="8" rx="2.5" fill="#FACC15"/><path d="M24.5 19v5M14.5 29v-5h20v5M24.5 24v5" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round"/></svg>`;if(key==='readability-score')return `<svg ${c}><rect x="6" y="7" width="36" height="34" rx="10" fill="#B45309"/><path d="M13 31a11 11 0 0 1 22 0" stroke="#fff" stroke-width="3.2" fill="none" stroke-linecap="round"/><path d="M24 31l8-7" stroke="#FACC15" stroke-width="3" stroke-linecap="round"/><circle cx="24" cy="31" r="3.4" fill="#FACC15"/><path d="M17.5 23.5l1.5 1M24 20v2.5M30.5 23.5l-1.5 1" stroke="#FDE68A" stroke-width="1.8" stroke-linecap="round"/></svg>`;if(key==='blog')return `<svg ${c}><rect x="6" y="7" width="36" height="34" rx="10" fill="#14532D"/><rect x="11" y="12" width="26" height="24" rx="3" fill="#fff"/><rect x="14" y="15" width="10" height="9" rx="2" fill="#86EFAC"/><path d="M27 17.5h7M27 21.5h7M14 28.5h20M14 32.5h13" stroke="#14532D" stroke-width="2.2" stroke-linecap="round"/></svg>`;return `<svg ${c}><rect x="6" y="7" width="36" height="34" rx="8" fill="#2583D6"/><path d="M14 15h20v18H14z" fill="white"/><path d="M18 20h12M18 25h9M18 30h6" stroke="#22C5E8" stroke-width="2.5" stroke-linecap="round"/></svg>`}/* Exposed so assets/tool-tabs.js can render the same icon artwork for the cards it
 * paints. Without this the tab bar would have no access to the icon set, which is
 * defined inside this IIFE. */
/* Slug -> tool lookup for assets/tool-tabs.js, derived from the
   __SITE_DATA__ payload the page has already fetched, so the tab bar does
   not need a second copy of the catalogue in the HTML. Keys match the
   build-side toolKey(): "tools/age-calculator/" -> "age-calculator". */
window.ewtToolsByKey={};
TOOLS.forEach(function(t){
  /* __SITE_DATA__ carries absolute urls ("/tools/age-calculator/") while
     tools-manifest.json stores them relative ("tools/age-calculator/"). Both
     have to collapse to the same key the build uses, so the leading slash is
     stripped first - anchoring on "tools/" alone silently produced
     "tools/age-calculator" and every lookup missed. */
  var k=String(t.url||'').replace(/^\/+/,'').replace(/^tools\//,'').replace(/\/+$/g,'');
  if(k)window.ewtToolsByKey[k]=t;
});
/* catSlug is exposed alongside the index so the tab bar stamps the same
   normalised data-cat on the cards it paints as the build stamps on the
   server-rendered ones. */
window.ewtCatSlug=catSlug;window.iconSvg=iconSvg;window.runSearch=function(q){q=(q||'').trim().toLowerCase();if(!q){if(panel)panel.classList.remove('show');if(results)results.innerHTML='';if(status)status.textContent='Start typing to search the whole site.';return}const hits=all.filter(x=>(x.title+' '+(x.description||'')+' '+(x.tags||[]).join(' ')).toLowerCase().includes(q)).slice(0,12);if(panel)panel.classList.add('show');if(status)status.textContent=hits.length?`${hits.length} result${hits.length===1?'':'s'} found`:'No matching results found.';results.innerHTML=hits.map(x=>`<a class="search-item" href="${esc(siteUrl(x.url))}"><strong>${esc(x.title)}</strong><span>${esc(x.type||'Page')}</span><p>${esc(x.description||'')}</p></a>`).join('')};window.closeSearch=()=>panel.classList.remove('show');const nav=document.getElementById('navSearch'),hero=document.getElementById('heroSearch'),toolsSearch=document.getElementById('toolsSearch');if(nav){nav.addEventListener('input',()=>runSearch(nav.value));nav.addEventListener('keydown',e=>{if(e.key==='Escape')closeSearch()})}if(hero)hero.addEventListener('input',()=>runSearch(hero.value));if(toolsSearch){const toolsSearchForm=toolsSearch.closest('form');if(toolsSearchForm)toolsSearchForm.addEventListener('submit',e=>{e.preventDefault();runSearch(toolsSearch.value)});toolsSearch.addEventListener('keydown',e=>{if(e.key==='Escape')closeSearch()})}document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();nav&&nav.focus()}});updateContentCounts();initLandingAnimations();initLiveStats();renderTrafficSorted();loadTraffic();trackCurrentPage();const toolCount=document.getElementById('toolCount');if(toolCount)toolCount.textContent=TOOLS.length+'+';const blogCount=document.getElementById('blogCount');if(blogCount)blogCount.textContent=POSTS.length+'+';
/* Note: the "Send a Request" feedback form on the homepage (#toolFeedbackFormLocal) is
   handled by its own dedicated inline script in index.html (hidden-iframe POST technique),
   not by this shared app.js bundle. The generic #toolFeedbackForm handler that used to live
   here was dead code (no page has an element with that id) and has been removed. */
})();
