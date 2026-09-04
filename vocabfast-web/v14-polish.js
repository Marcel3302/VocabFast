(() => {
'use strict';
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>Number(n||0).toLocaleString('de-DE');
let me=window.VF_SESSION_USER||null,billing=null,state=null,loadId=0,booted=false;
async function api(path,opts={}){const r=await fetch(`/api${path}`,{credentials:'same-origin',...opts});let d={};try{d=await r.json()}catch{}if(!r.ok)throw new Error(d.error||`Serverfehler ${r.status}`);return d}
function go(view){const b=$(`#mainNav button[data-view="${view}"]`);if(b)b.click()}
function isElite(){return !!me&&(me.tier==='elite'||me.effectivePlan==='pro')}
function planName(){return isElite()?'Elite':'Core'}
function addPlanPill(){if($('#v14PlanPill'))return;const tools=$('.top-tools');if(!tools)return;const el=document.createElement('button');el.id='v14PlanPill';el.className='v14-plan-pill';el.type='button';el.onclick=()=>go('account');tools.insertBefore(el,$('#userPill')||null)}
function renderPlanPill(){addPlanPill();$('#v8PlanBadge')?.setAttribute('hidden','');const el=$('#v14PlanPill');if(!el)return;if(!me){el.hidden=true;return}el.hidden=false;const issue=!!billing?.paymentIssue;el.className=`v14-plan-pill${isElite()?' elite':''}${issue?' issue':''}`;el.textContent=issue?'Zahlung prüfen':`VocabFast ${planName()}`}
function studyStreak(){const dates=Array.isArray(state?.stats?.studyDates)?state.stats.studyDates:[];if(!dates.length)return 0;const seen=new Set(dates.map(x=>String(x).slice(0,10)));let d=new Date(),n=0;for(;;){const k=d.toISOString().slice(0,10);if(!seen.has(k))break;n++;d.setDate(d.getDate()-1)}return n}
function homeMarkup(){const ready=!!state,words=ready&&Array.isArray(state.learning)?state.learning.length:null,xp=ready?Number(state?.stats?.xp||0):null,streak=ready?studyStreak():null;return `<section class="v14-home" aria-label="VocabFast Übersicht"><article class="v14-welcome"><div class="v14-kicker">Dein Lernzentrum</div><h2>${me?`Willkommen${me?.name?`, ${esc(me.name)}`:''}.`:'Englisch lernen, ohne den Überblick zu verlieren.'}</h2><p>${me?'Starte eine kurze Runde, arbeite an deiner Grammatik oder öffne deine gespeicherten Wörter.':'Lege ein kostenloses Core-Konto an, damit Wörter, Fortschritt und PDFs auf allen Geräten synchron bleiben.'}</p><div class="v14-metrics"><div class="v14-metric"><span>Wörter</span><strong>${me?(ready?fmt(words):'…'):'—'}</strong></div><div class="v14-metric"><span>XP</span><strong>${me?(ready?fmt(xp):'…'):'—'}</strong></div><div class="v14-metric"><span>Lernserie</span><strong>${me?(ready?`${streak} Tag${streak===1?'':'e'}`:'…'):'—'}</strong></div><div class="v14-metric"><span>Plan</span><strong>${me?planName():'Gast'}</strong></div></div></article><aside class="v14-quick"><h3>Schnell starten</h3><p>Die wichtigsten Bereiche direkt erreichbar.</p><div class="v14-actions"><button class="v14-action" data-go="practice">Üben<small>10 kurze Fragen</small></button><button class="v14-action" data-go="grammar">Grammatik<small>A1 bis C2</small></button><button class="v14-action" data-go="topics">Themen<small>Wortschatz entdecken</small></button><button class="v14-action" data-go="progress">Fortschritt<small>XP & Level</small></button></div></aside></section>`}
function mountHome(){const panel=$('#view-words .panel');if(!panel)return;let host=$('#v14Home');if(!host){host=document.createElement('div');host.id='v14Home';panel.prepend(host)}host.innerHTML=homeMarkup();$$('[data-go]',host).forEach(b=>b.onclick=()=>go(b.dataset.go))}
async function checkout(){const btn=$('#v14Upgrade');if(btn){btn.disabled=true;btn.textContent='Stripe wird geöffnet …'}try{const d=await api('/billing/checkout',{method:'POST'});location.href=d.checkoutUrl}catch(e){if(btn){btn.disabled=false;btn.textContent='Elite freischalten'}alert(e.message)}}
function billingMarkup(){const elite=isElite(),issue=!!billing?.paymentIssue,status=billing?.subscriptionStatus||'',mode=billing?.mode==='live'?'Live':'Sandbox';return `<article class="account-card v14-billing-card"><div class="v14-billing-main"><div class="v14-billing-icon">VF</div><div><div class="v14-kicker">Plan & Abrechnung</div><h2>VocabFast ${elite?'Elite':'Core'}</h2><p>${elite?'Alle Elite-Funktionen sind für dein Konto freigeschaltet.':'Core bleibt kostenlos. Elite schaltet PDF-Lernen, KI-Fachwortlisten, große Tests, Urkunden und CSV frei.'}</p><div class="v14-billing-meta"><span class="v14-tag ${elite?'gold':''}">${elite?'Elite aktiv':'Core'}</span><span class="v14-tag">7,99 € / Monat</span><span class="v14-tag">Stripe ${mode}</span>${status?`<span class="v14-tag">${esc(status)}</span>`:''}${issue?'<span class="v14-tag warn">Zahlungsproblem</span>':''}</div></div></div><div class="v14-billing-actions">${elite?'':'<button class="btn primary" id="v14Upgrade">Elite freischalten</button>'}<button class="btn" id="v14BillingRefresh">Status aktualisieren</button><div class="v14-billing-note">Sicherer Checkout über Stripe · monatlich kündbar</div></div></article>`}
function mountBilling(){if(!me)return;const grid=$('#accountLoggedIn .account-grid');if(!grid)return;$('#v14BillingCard')?.remove();const wrap=document.createElement('div');wrap.id='v14BillingCard';wrap.style.display='contents';wrap.innerHTML=billingMarkup();const danger=grid.querySelector('.danger-zone');danger?grid.insertBefore(wrap,danger):grid.appendChild(wrap);$('#v14Upgrade')?.addEventListener('click',checkout);$('#v14BillingRefresh')?.addEventListener('click',()=>refresh(me,true))}
function simplifyNav(){const map={topics:'Themen',words:'Wörter',practice:'Üben',pdf:'PDF',grammar:'Grammatik',progress:'Fortschritt',account:'Konto'};for(const b of $$('#mainNav button[data-view]'))if(map[b.dataset.view])b.textContent=map[b.dataset.view]}
async function refresh(user,force=false){
  const id=++loadId;
  if(user!==undefined)me=user;
  if(!me&&window.VF_SESSION_USER)me=window.VF_SESSION_USER;
  if(!me&&force){try{me=(await api('/me')).user||null}catch{me=null}}
  renderPlanPill();mountHome();
  if(!me){state=null;billing=null;mountHome();return}
  const [s,b]=await Promise.allSettled([api('/state'),api('/billing/status')]);
  if(id!==loadId)return;
  state=s.status==='fulfilled'?s.value.state||null:state;
  billing=b.status==='fulfilled'?b.value:billing;
  window.VF_STATE_SNAPSHOT=state;
  renderPlanPill();mountHome();mountBilling();
}
function boot(){if(booted)return;booted=true;simplifyNav();const hint=$('#v13BillingHint');if(hint)hint.textContent='Sicherer Checkout über Stripe · monatlich kündbar.';me=window.VF_SESSION_USER||me;renderPlanPill();mountHome();refresh(me,!me);document.addEventListener('click',e=>{if(e.target.closest('[data-view="account"],[data-view="words"]'))requestAnimationFrame(()=>{mountHome();mountBilling()})},true)}
window.addEventListener('vocabfast:session',e=>{me=e.detail?.user||null;state=me?state:null;billing=me?billing:null;refresh(me)});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else queueMicrotask(boot);
})();
