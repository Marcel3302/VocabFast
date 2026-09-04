(() => {
  'use strict';

  const $=(s,root=document)=>root.querySelector(s);
  const $$=(s,root=document)=>[...root.querySelectorAll(s)];
  const ADMIN_ROUTE=location.pathname.replace(/\/+$/,'')==='/admin';

  function installAccessStyles(){
    if($('#vfAccessGateStyles'))return;
    const style=document.createElement('style');
    style.id='vfAccessGateStyles';
    style.textContent=`
      html.vf-auth-checking body{visibility:hidden!important}

      html.vf-guest body{visibility:visible!important}
      html.vf-guest .topbar,
      html.vf-guest #syncBanner,
      html.vf-guest #toast,
      html.vf-guest dialog{display:none!important}
      html.vf-guest main{display:block!important;min-height:100vh!important;padding:28px!important}
      html.vf-guest main>.view{display:none!important}
      html.vf-guest #view-account{display:block!important;width:100%!important;min-height:calc(100vh - 56px)!important}
      html.vf-guest #view-account .account-panel{width:min(920px,100%)!important;max-width:920px!important;margin:0 auto!important}
      html.vf-guest #view-account .account-panel>*:not(.hero):not(#accountLoggedOut){display:none!important}
      html.vf-guest #view-account .hero{display:flex!important;justify-content:center!important;text-align:center!important}
      html.vf-guest #accountLoggedOut{display:grid!important;pointer-events:auto!important}
      html.vf-guest #accountLoggedOut *{pointer-events:auto!important}
      html.vf-guest #accountLoggedIn,
      html.vf-guest #v8AdminLogin,
      html.vf-guest #v8AdminNav,
      html.vf-guest #view-admin{display:none!important}

      html:not(.vf-admin-route) #v8AdminLogin,
      html:not(.vf-admin-route) #v8AdminNav,
      html:not(.vf-admin-route) #view-admin,
      html:not(.vf-admin-route) [data-view="admin"]{display:none!important}

      html.vf-admin-route body{visibility:visible!important;min-height:100vh!important;background:#071019!important}
      html.vf-admin-route .topbar,
      html.vf-admin-route #syncBanner,
      html.vf-admin-route #toast,
      html.vf-admin-route dialog{display:none!important}
      html.vf-admin-route main{display:grid!important;place-items:center!important;min-height:100vh!important;padding:28px!important}
      html.vf-admin-route main>.view{display:none!important}
      html.vf-admin-route:not(.vf-admin-authorized) #view-account{display:block!important;width:min(560px,100%)!important}
      html.vf-admin-route:not(.vf-admin-authorized) #view-account .account-panel{width:100%!important;max-width:560px!important;margin:0 auto!important}
      html.vf-admin-route:not(.vf-admin-authorized) #view-account .account-panel>*:not(#v8AdminLogin){display:none!important}
      html.vf-admin-route:not(.vf-admin-authorized) #v8AdminLogin{display:block!important;margin:0!important;pointer-events:auto!important}
      html.vf-admin-route:not(.vf-admin-authorized) #v8AdminLogin *{pointer-events:auto!important}
      html.vf-admin-route.vf-admin-authorized #view-account{display:none!important}
      html.vf-admin-route.vf-admin-authorized #view-admin{display:block!important;width:100%!important;max-width:1500px!important}
      html.vf-admin-route.vf-admin-authorized #view-admin[hidden]{display:block!important}
      html.vf-admin-route #v8AdminNav{display:none!important}

      #cefrEstimate{display:grid;grid-template-columns:92px 1fr;gap:18px;align-items:center;border:1px solid #31516a;background:linear-gradient(135deg,#0b1924,#101a24);border-radius:16px;padding:18px;margin:0 0 18px}
      #cefrEstimate h2{margin:2px 0 5px;font-size:24px}
      #cefrEstimate p{margin:4px 0}
      .vf-cefr-badge{width:78px;height:78px;border-radius:22px;display:grid;place-items:center;background:linear-gradient(145deg,#1c3b22,#244d28);border:1px solid #5b8e49;color:#caffaa;font-size:27px;font-weight:950;box-shadow:inset 0 0 20px rgba(130,237,47,.08)}
      @media(max-width:720px){
        html.vf-guest main,html.vf-admin-route main{padding:14px!important}
        #cefrEstimate{grid-template-columns:64px 1fr}
        .vf-cefr-badge{width:58px;height:58px;border-radius:16px;font-size:22px}
      }
    `;
    document.head.appendChild(style);
  }

  function activateView(name){
    $$('.view').forEach(v=>v.classList.toggle('active',v.id===`view-${name}`));
    $$('#mainNav button').forEach(b=>b.classList.toggle('active',b.dataset.view===name));
  }

  function goToWords(){const btn=$('#mainNav [data-view="words"]');if(btn)btn.click()}
  function prepareStartPage(){const brand=$('.brand[data-view-link]');if(brand)brand.dataset.viewLink='words';setTimeout(goToWords,0);setTimeout(goToWords,250)}

  function showGuest(){
    if(ADMIN_ROUTE)return;
    document.documentElement.classList.remove('vf-auth-checking');
    document.documentElement.classList.add('vf-guest');
    activateView('account');
    $('#accountLoggedOut')?.classList.remove('hidden');
    $('#accountLoggedIn')?.classList.add('hidden');
  }

  function showUser(){
    if(ADMIN_ROUTE)return;
    const wasGuest=document.documentElement.classList.contains('vf-guest');
    document.documentElement.classList.remove('vf-auth-checking','vf-guest');
    if(wasGuest)prepareStartPage();
  }

  async function checkUserSession(){
    if(ADMIN_ROUTE)return;
    try{
      const r=await fetch('/api/me',{credentials:'same-origin',cache:'no-store'});
      let d={};try{d=await r.json()}catch{}
      if(r.ok&&d?.user)showUser();else showGuest();
    }catch{showGuest()}
  }

  function showAdminLogin(){
    if(!ADMIN_ROUTE)return;
    document.documentElement.classList.remove('vf-admin-authorized');
    activateView('account');
    $('#view-admin')?.setAttribute('hidden','');
    $('#v8AdminLogin')?.removeAttribute('hidden');
  }

  function showAdminArea(){
    if(!ADMIN_ROUTE)return;
    document.documentElement.classList.add('vf-admin-authorized');
    document.body?.classList.add('v17-admin-authorized');
    $('#v8AdminLogin')?.setAttribute('hidden','');
    $('#view-admin')?.removeAttribute('hidden');
    activateView('admin');
  }

  async function checkAdminSession(){
    if(!ADMIN_ROUTE)return;
    try{
      const r=await fetch('/api/admin/me',{credentials:'same-origin',cache:'no-store'});
      let d={};try{d=await r.json()}catch{}
      if(r.ok&&d?.admin)showAdminArea();else showAdminLogin();
    }catch{showAdminLogin()}
  }

  function scheduleUserRefresh(){
    setTimeout(checkUserSession,250);
    setTimeout(checkUserSession,900);
  }

  function scheduleAdminRefresh(){
    setTimeout(checkAdminSession,250);
    setTimeout(checkAdminSession,900);
  }

  function bindAccessRefresh(){
    document.addEventListener('submit',e=>{
      if(e.target?.matches?.('#loginForm,#registerForm'))scheduleUserRefresh();
    },true);
    document.addEventListener('click',e=>{
      if(e.target.closest?.('#logout'))scheduleUserRefresh();
      if(e.target.closest?.('#v8AdminLoginButton'))scheduleAdminRefresh();
      if(e.target.closest?.('#v8AdminLogout'))scheduleAdminRefresh();
    },true);
  }

  function numberFromCard(label){
    const card=$$('.stat-card').find(c=>c.querySelector('span')?.textContent.trim()===label);
    if(!card)return 0;
    const text=card.querySelector('strong')?.textContent||'0';
    return Number(text.replace(/[^0-9,.-]/g,'').replaceAll('.','').replace(',','.'))||0;
  }
  function percentFromCard(label){return Math.max(0,Math.min(100,numberFromCard(label)))}
  function estimateCefr(){
    const saved=numberFromCard('Gespeicherte Wörter'),vocabCorrect=numberFromCard('Vokabel richtig'),grammarCorrect=numberFromCard('Grammatik richtig'),vocabAcc=percentFromCard('Vokabelquote'),grammarAcc=percentFromCard('Grammatikquote'),xp=numberFromCard('XP');
    const vAnswered=vocabAcc>0?Math.round(vocabCorrect/(vocabAcc/100)):0,gAnswered=grammarAcc>0?Math.round(grammarCorrect/(grammarAcc/100)):0,answered=vAnswered+gAnswered,weightedAcc=answered?((vAnswered*vocabAcc)+(gAnswered*grammarAcc))/answered:0;
    let score=0;score+=Math.min(34,Math.log10(saved+1)*12);score+=Math.min(26,Math.log10(answered+1)*11);score+=Math.min(20,Math.log10(xp+1)*6);if(answered>=20)score+=Math.max(-8,Math.min(12,(weightedAcc-65)*0.45));
    const levels=['A1','A2','B1','B2','C1','C2'],gates=[0,24,39,55,72,88];let idx=0;for(let i=0;i<gates.length;i++)if(score>=gates[i])idx=i;if(answered<20)idx=Math.min(idx,1);else if(answered<60)idx=Math.min(idx,2);else if(answered<140)idx=Math.min(idx,3);else if(answered<300)idx=Math.min(idx,4);return{level:levels[idx],confidence:answered>=250?'gut':answered>=60?'mittel':'niedrig',saved,answered,accuracy:Math.round(weightedAcc)};
  }
  function renderCefr(){
    const grid=$('#statsGrid');if(!grid)return;
    let panel=$('#cefrEstimate');
    if(!panel){panel=document.createElement('div');panel.id='cefrEstimate';panel.innerHTML='<div class="vf-cefr-badge" id="cefrLevel">A1</div><div><div class="eyebrow">Grobe Sprachlevel-Schätzung</div><h2 id="cefrTitle">Noch zu wenig Lerndaten</h2><p id="cefrDetail" class="muted"></p><p class="tiny muted">Orientierung nach CEFR A1–C2. Kein offizieller Einstufungstest.</p></div>';grid.parentNode.insertBefore(panel,grid)}
    const e=estimateCefr();
    $('#cefrLevel').textContent=e.level;
    $('#cefrTitle').textContent=`Geschätztes Niveau: ${e.level}`;
    $('#cefrDetail').textContent=`Berechnet aus ${e.saved.toLocaleString('de-DE')} gespeicherten Wörtern und ca. ${e.answered.toLocaleString('de-DE')} beantworteten Übungen. Datenbasis: ${e.confidence}${e.answered?` · Trefferquote ca. ${e.accuracy}%`:''}. Je mehr du übst, desto aussagekräftiger wird die Schätzung.`;
  }

  installAccessStyles();
  bindAccessRefresh();

  if(ADMIN_ROUTE){
    document.documentElement.classList.add('vf-admin-route');
    document.title='VocabFast Admin';
    setTimeout(checkAdminSession,0);
    setTimeout(checkAdminSession,600);
  }else{
    document.documentElement.classList.add('vf-auth-checking');
    setTimeout(checkUserSession,0);
  }

  window.addEventListener('load',()=>{
    if(ADMIN_ROUTE)checkAdminSession();else checkUserSession();
    const grid=$('#statsGrid');
    if(grid){new MutationObserver(renderCefr).observe(grid,{childList:true,subtree:true,characterData:true});renderCefr()}
  });
  window.addEventListener('pageshow',()=>ADMIN_ROUTE?checkAdminSession():checkUserSession());
})();
