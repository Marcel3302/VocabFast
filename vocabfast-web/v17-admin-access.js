(() => {
'use strict';
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const isAdminEntry=()=>location.pathname.replace(/\/+$/,'')==='/admin';
async function adminSession(){try{const r=await fetch('/api/admin/me',{credentials:'same-origin',cache:'no-store'});if(!r.ok)return false;const d=await r.json();return !!d?.admin}catch{return false}}
function hideAdminSurface(){document.body.classList.remove('v17-admin-entry','v17-admin-authorized');$('#v8AdminLogin')?.setAttribute('hidden','');$('#v8AdminNav')?.setAttribute('hidden','');$('#view-admin')?.setAttribute('hidden','');$$('[data-view="admin"]').forEach(x=>x.setAttribute('hidden',''))}
function showAdminEntry(){document.body.classList.add('v17-admin-entry');$('#v8AdminLogin')?.removeAttribute('hidden')}
function showAuthorized(){document.body.classList.add('v17-admin-authorized');$('#v8AdminNav')?.removeAttribute('hidden');$('#view-admin')?.removeAttribute('hidden');$$('[data-view="admin"]').forEach(x=>x.removeAttribute('hidden'))}
async function enforce(){hideAdminSurface();if(isAdminEntry())showAdminEntry();if(await adminSession())showAuthorized()}
function redirectBlockedAdminView(){const adminView=$('#view-admin');if(!adminView?.classList.contains('active')||document.body.classList.contains('v17-admin-authorized'))return;adminView.classList.remove('active');$('#view-account')?.classList.add('active');$$('#mainNav button').forEach(b=>b.classList.toggle('active',b.dataset.view==='account'))}
window.addEventListener('load',()=>setTimeout(enforce,180));window.addEventListener('pageshow',()=>setTimeout(enforce,80));
document.addEventListener('click',e=>{const adminTarget=e.target.closest('[data-view="admin"],#v8AdminNav');if(adminTarget&&!document.body.classList.contains('v17-admin-authorized')){e.preventDefault();e.stopImmediatePropagation();redirectBlockedAdminView()}setTimeout(()=>{if(!document.body.classList.contains('v17-admin-authorized')){$('#v8AdminNav')?.setAttribute('hidden','');$('#view-admin')?.setAttribute('hidden','')}if(!isAdminEntry())$('#v8AdminLogin')?.setAttribute('hidden','')},0)},true);
const observer=new MutationObserver(()=>{if(!isAdminEntry())$('#v8AdminLogin')?.setAttribute('hidden','');if(!document.body.classList.contains('v17-admin-authorized')){$('#v8AdminNav')?.setAttribute('hidden','');$('#view-admin')?.setAttribute('hidden','');redirectBlockedAdminView()}});
observer.observe(document.documentElement,{subtree:true,childList:true});
})();
