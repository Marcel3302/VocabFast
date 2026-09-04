(() => {
'use strict';
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const ADMIN_ROUTE=location.pathname.replace(/\/+$/,'')==='/admin';
const nativeFetch=window.fetch.bind(window),cache=new Map();

function cacheKey(input){try{return new URL(typeof input==='string'?input:input.url,location.origin).pathname}catch{return ''}}
function cacheStateFromBody(body){
  if(typeof body!=='string')return;
  try{const state=JSON.parse(body),response=new Response(JSON.stringify({state}),{status:200,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});cache.set('/api/state',{until:Date.now()+30000,promise:Promise.resolve(response)});window.VF_STATE_SNAPSHOT=state}catch{}
}
window.fetch=(input,init={})=>{
  const method=String(init.method||(input instanceof Request?input.method:'GET')).toUpperCase();
  const path=cacheKey(input);
  if(method!=='GET'){
    if(path.includes('/api/auth/')||path==='/api/account/password'||path==='/api/admin/login'||path==='/api/admin/logout')cache.delete('/api/me');
    if(path==='/api/state'){
      cache.delete('/api/state');
      const request=nativeFetch(input,init);
      if(method==='PUT')return request.then(r=>{if(r.ok)cacheStateFromBody(init.body);return r});
      return request;
    }
    return nativeFetch(input,init);
  }
  const ttl=path==='/api/me'?60000:path==='/api/state'?30000:path==='/api/billing/status'?15000:0;
  if(!ttl)return nativeFetch(input,init);
  const hit=cache.get(path),now=Date.now();
  if(hit&&hit.until>now)return hit.promise.then(r=>r.clone());
  const promise=nativeFetch(input,init).then(r=>{if(!r.ok)cache.delete(path);return r}).catch(e=>{cache.delete(path);throw e});
  cache.set(path,{until:now+ttl,promise});
  return promise.then(r=>r.clone());
};

function installStyles(){
  const s=document.createElement('style');s.id='vfAccessGateStyles';s.textContent=`
  html.vf-auth-pending body{visibility:hidden!important}
  html.vf-guest body{visibility:visible!important}
  html.vf-guest .topbar,html.vf-guest #syncBanner,html.vf-guest #toast,html.vf-guest dialog{display:none!important}
  html.vf-guest main>.view{display:none!important}
  html.vf-guest #view-account{display:block!important;min-height:100vh!important;padding:28px!important}
  html.vf-guest #view-account .account-panel{max-width:920px!important;margin:0 auto!important}
  html.vf-guest #view-account .account-panel>*:not(.hero):not(#accountLoggedOut){display:none!important}
  html.vf-guest #accountLoggedOut{display:grid!important;pointer-events:auto!important}
  html.vf-guest #accountLoggedOut *{pointer-events:auto!important}
  html:not(.vf-admin-route) #v8AdminLogin,html:not(.vf-admin-route) #v8AdminNav,html:not(.vf-admin-route) #view-admin,html:not(.vf-admin-route) [data-view="admin"]{display:none!important}
  html.vf-admin-route body{visibility:visible!important;min-height:100vh!important;background:#071019!important}
  html.vf-admin-route .topbar,html.vf-admin-route #syncBanner,html.vf-admin-route #toast,html.vf-admin-route dialog{display:none!important}
  html.vf-admin-route main{display:none!important}
  html.vf-admin-route.vf-admin-authorized main{display:block!important;padding:24px!important}
  html.vf-admin-route.vf-admin-authorized main>.view{display:none!important}
  html.vf-admin-route.vf-admin-authorized #view-admin{display:block!important;width:100%!important;max-width:1500px!important;margin:0 auto!important}
  #vfAdminGate{position:fixed;inset:0;z-index:99999;display:grid;place-items:center;padding:24px;background:#071019;color:#eef7ff;font-family:inherit}
  #vfAdminGate[hidden]{display:none!important}
  .vf-admin-card{width:min(440px,100%);background:#0d1b26;border:1px solid #284154;border-radius:18px;padding:28px;box-shadow:0 24px 70px rgba(0,0,0,.35)}
  .vf-admin-card h1{margin:0 0 8px;font-size:28px}.vf-admin-card p{margin:0 0 22px;color:#8ea5b7}.vf-admin-card label{display:block;margin:14px 0 6px;font-weight:700}.vf-admin-card input{width:100%;box-sizing:border-box;padding:12px 14px;border-radius:10px;border:1px solid #345064;background:#08131c;color:#fff}.vf-admin-card button{width:100%;margin-top:18px;padding:12px 14px;border:0;border-radius:10px;background:#83ef2d;color:#10200c;font-weight:900;cursor:pointer}.vf-admin-card button:disabled{opacity:.55;cursor:wait}.vf-admin-status{min-height:20px;margin-top:12px;color:#ffadad}
  #v8PlanBadge{display:none!important}
  `;document.head.appendChild(s);
}

function activate(name){$$('.view').forEach(v=>v.classList.toggle('active',v.id===`view-${name}`));$$('#mainNav button').forEach(b=>b.classList.toggle('active',b.dataset.view===name))}
function planLabel(u){return u&&(u.tier==='elite'||u.effectivePlan==='pro')?'Elite':'Core'}
function normalizeStatus(u){window.VF_SESSION_USER=u||null;const legacy=$('#v8PlanBadge');if(legacy)legacy.style.display='none';const pill=$('#v14PlanPill');if(pill&&u)pill.textContent=`VocabFast ${planLabel(u)}`;window.dispatchEvent(new CustomEvent('vocabfast:session',{detail:{user:u||null}}))}
function showGuest(){document.documentElement.classList.remove('vf-auth-pending');document.documentElement.classList.add('vf-guest');activate('account');$('#accountLoggedOut')?.classList.remove('hidden');$('#accountLoggedIn')?.classList.add('hidden');normalizeStatus(null)}
function showUser(u){document.documentElement.classList.remove('vf-auth-pending','vf-guest');normalizeStatus(u)}
async function checkUser(){if(ADMIN_ROUTE)return;try{const r=await fetch('/api/me',{credentials:'same-origin',cache:'no-store'}),d=await r.json();r.ok&&d?.user?showUser(d.user):showGuest()}catch{showGuest()}}

function ensureAdminGate(){
  if($('#vfAdminGate'))return;
  document.body.insertAdjacentHTML('beforeend',`<div id="vfAdminGate"><form class="vf-admin-card" id="vfAdminForm"><h1>VocabFast Admin</h1><p>Separater Verwaltungszugang</p><label>Benutzername</label><input id="vfAdminUser" autocomplete="username" value="admin"><label>Passwort</label><input id="vfAdminPassword" type="password" autocomplete="current-password" autofocus><button id="vfAdminSubmit" type="submit">Admin anmelden</button><div class="vf-admin-status" id="vfAdminStatus"></div></form></div>`);
  $('#vfAdminForm').addEventListener('submit',async e=>{e.preventDefault();const b=$('#vfAdminSubmit'),st=$('#vfAdminStatus');b.disabled=true;st.textContent='Anmeldung …';try{const r=await nativeFetch('/api/admin/login',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:$('#vfAdminUser').value,password:$('#vfAdminPassword').value})}),d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||'Admin-Anmeldung fehlgeschlagen.');location.reload()}catch(err){st.textContent=err.message;b.disabled=false}})
}
async function checkAdmin(){if(!ADMIN_ROUTE)return;ensureAdminGate();try{const r=await nativeFetch('/api/admin/me',{credentials:'same-origin',cache:'no-store'}),d=await r.json().catch(()=>({}));if(r.ok&&d?.admin){document.documentElement.classList.add('vf-admin-authorized');$('#vfAdminGate')?.setAttribute('hidden','');setTimeout(()=>{const v=$('#view-admin');if(v){v.removeAttribute('hidden');activate('admin')}},120)}else{document.documentElement.classList.remove('vf-admin-authorized');$('#vfAdminGate')?.removeAttribute('hidden')}}catch{$('#vfAdminGate')?.removeAttribute('hidden')}}

installStyles();
if(ADMIN_ROUTE){document.documentElement.classList.add('vf-admin-route');document.title='VocabFast Admin';if(document.body)ensureAdminGate();else addEventListener('DOMContentLoaded',ensureAdminGate,{once:true});checkAdmin()}else{document.documentElement.classList.add('vf-auth-pending');checkUser()}

document.addEventListener('submit',e=>{if(!ADMIN_ROUTE&&e.target?.matches?.('#loginForm,#registerForm')){setTimeout(checkUser,180);setTimeout(checkUser,700)}},true);
document.addEventListener('click',e=>{if(!ADMIN_ROUTE&&e.target.closest?.('#logout')){cache.clear();setTimeout(checkUser,150)}},true);
document.addEventListener('pointerover',e=>{if(!ADMIN_ROUTE&&window.VF_SESSION_USER&&e.target.closest?.('[data-view="practice"],.v14-action[data-go="practice"]'))fetch('/api/state',{credentials:'same-origin'}).catch(()=>{})},{passive:true});
addEventListener('load',()=>{ADMIN_ROUTE?checkAdmin():checkUser();setTimeout(()=>normalizeStatus(window.VF_SESSION_USER),200)});
addEventListener('pageshow',()=>ADMIN_ROUTE?checkAdmin():checkUser());
})();