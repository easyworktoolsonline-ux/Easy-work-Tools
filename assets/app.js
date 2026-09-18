(function(){const DATA=window.__SITE_DATA__||{tools:[],posts:[],pages:[]};
const TOOLS=Array.isArray(DATA.tools)?DATA.tools:[];
const POSTS=Array.isArray(DATA.posts)?DATA.posts:[];
let TRAFFIC={};
function trafficValue(item){
  const key=String(item?.url||'').replace(/^\//,'').replace(/\/$/,'');
  const n=Number(TRAFFIC[key]||0);
  return Number.isFinite(n)?n:0;
}
function byTrafficDesc(a,b){return trafficValue(b)-trafficValue(a)}
function sortByTraffic(list){return [...list].sort(byTrafficDesc)}
function siteUrl(url){const raw=String(url||'');if(!raw)return '#';if(/^(?:https?:|mailto:|tel:|#|javascript:)/i.test(raw))return raw;if(location.protocol==='file:'){const clean=raw.replace(/^\/+/, '');const base=location.href.split('/').slice(0,-1).join('/')+'/';return new URL(clean,base).href}return raw}
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
}const all=[...DATA.tools.map(x=>({...x,type:'Tool'})),...DATA.posts.map(x=>({...x,type:'Blog'})),...DATA.pages];const panel=document.getElementById('searchPanel'),results=document.getElementById('searchResults'),status=document.getElementById('searchStatus');function esc(s){return String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}function iconSvg(key){const c='viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"';if(key==='image')return `<svg ${c}><defs><linearGradient id="gImg" x1="7" y1="7" x2="41" y2="41"><stop stop-color="#FACC15"/><stop offset=".48" stop-color="#22C55E"/><stop offset="1" stop-color="#3B82F6"/></linearGradient></defs><rect x="6" y="7" width="36" height="34" rx="8" fill="url(#gImg)"/><rect x="11" y="12" width="26" height="24" rx="5" fill="white"/><circle cx="19" cy="19" r="3" fill="#FACC15"/><path d="M13 32l7-8 6 6 4-4 5 6" stroke="#3B82F6" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;if(key==='text-case')return `<svg ${c}><defs><linearGradient id="gTextCute" x1="7" y1="7" x2="41" y2="41"><stop stop-color="#FF6B6B"/><stop offset=".45" stop-color="#A855F7"/><stop offset="1" stop-color="#22C55E"/></linearGradient></defs><rect x="6" y="7" width="36" height="34" rx="10" fill="url(#gTextCute)"/><circle cx="16" cy="17" r="5" fill="#FACC15"/><circle cx="32" cy="31" r="5" fill="#38BDF8"/><path d="M12 34 19 13h4l7 21M15 27h12" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path d="M29 14h7M32.5 10.5v7" stroke="white" stroke-width="2.5" stroke-linecap="round"/></svg>`;return `<svg ${c}><rect x="6" y="7" width="36" height="34" rx="8" fill="#2583D6"/><path d="M14 15h20v18H14z" fill="white"/><path d="M18 20h12M18 25h9M18 30h6" stroke="#22C5E8" stroke-width="2.5" stroke-linecap="round"/></svg>`}window.runSearch=function(q){q=(q||'').trim().toLowerCase();if(!q){if(panel)panel.classList.remove('show');if(results)results.innerHTML='';if(status)status.textContent='Start typing to search the whole site.';return}const hits=all.filter(x=>(x.title+' '+(x.description||'')+' '+(x.tags||[]).join(' ')).toLowerCase().includes(q)).slice(0,12);if(panel)panel.classList.add('show');if(status)status.textContent=hits.length?`${hits.length} result${hits.length===1?'':'s'} found`:'No matching results found.';results.innerHTML=hits.map(x=>`<a class="search-item" href="${esc(siteUrl(x.url))}"><strong>${esc(x.title)}</strong><span>${esc(x.type||'Page')}</span><p>${esc(x.description||'')}</p></a>`).join('')};window.closeSearch=()=>panel.classList.remove('show');const nav=document.getElementById('navSearch'),hero=document.getElementById('heroSearch');if(nav){nav.addEventListener('input',()=>runSearch(nav.value));nav.addEventListener('keydown',e=>{if(e.key==='Escape')closeSearch()})}if(hero)hero.addEventListener('input',()=>runSearch(hero.value));document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();nav&&nav.focus()}});updateContentCounts();initLandingAnimations();initLiveStats();renderTrafficSorted();loadTraffic();trackCurrentPage();const toolCount=document.getElementById('toolCount');if(toolCount)toolCount.textContent=TOOLS.length;const blogCount=document.getElementById('blogCount');if(blogCount)blogCount.textContent=POSTS.length;const form=document.getElementById('toolFeedbackForm'),feedbackStatus=document.getElementById('feedbackStatus');if(form&&feedbackStatus)form.addEventListener('submit',e=>{e.preventDefault();const data=new FormData(form),type=String(data.get('requestType')||'Tool feedback'),tool=String(data.get('toolName')||'Not specified'),details=String(data.get('details')||'').trim();if(details.length<10){feedbackStatus.textContent='Please add a little more detail so the request can be understood.';feedbackStatus.className='form-status error';return}const subject=`EasyWorkTools request: ${type}`;const body=`Request type: ${type}\nTool: ${tool}\n\nDetails:\n${details}`;window.location.href=`mailto:EasyWorkTools.online@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;feedbackStatus.textContent='Opening your email app with the request ready to send.';feedbackStatus.className='form-status success'});})();