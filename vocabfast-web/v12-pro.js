(() => {
'use strict';
const $=(s,r=document)=>r.querySelector(s);
async function loadMe(){try{const r=await fetch('/api/me',{credentials:'same-origin'});return (await r.json()).user||null}catch{return null}}
function forceAccountStart(){const b=$('#mainNav button[data-view="account"]');if(b){b.click();return}document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.id==='view-account'));document.querySelectorAll('#mainNav button').forEach(x=>x.classList.toggle('active',x.dataset.view==='account'));window.scrollTo({top:0,behavior:'instant'})}
function updateLegacyLabels(me){const badge=$('#v8PlanBadge');if(badge){badge.textContent=(me?.effectivePlan==='pro'||me?.tier==='elite')?'ELITE':'CORE';badge.classList.remove('v8-hidden')}const plan=$('#v8PlanText');if(plan)plan.textContent=(me?.effectivePlan==='pro'||me?.tier==='elite')?'VocabFast Elite':'VocabFast Core'}
window.addEventListener('load',async()=>{const me=await loadMe();forceAccountStart();updateLegacyLabels(me);setTimeout(()=>updateLegacyLabels(me),600)});
})();
