(() => {
  'use strict';

  const $=(s,root=document)=>root.querySelector(s);
  const $$=(s,root=document)=>[...root.querySelectorAll(s)];
  const ADMIN_ROUTE=location.pathname.replace(/\/+$/,'')==='/admin';
  let userAuthenticated=false,authTimer=null,adminTimer=null;

  function installAccessStyles(){
    if($('#vfAccessGateStyles'))return;
    const style=document.createElement('style');
    style.id='vfAccessGateStyles';
    style.textContent=`
      html.vf-auth-checking body{visibility:hidden!important}
      html.vf-guest-locked body{visibility:visible!important}
      html.vf-guest-locked .topbar{justify-content:center!important}
      html.vf-guest-locked .topbar #mobileMenu,
      html.vf-guest-locked .topbar #mainNav,
      html.vf-guest-locked .topbar .top-tools,
      html.vf-guest-locked #syncBanner{display:none!important}
      html.vf-guest-locked main>.view{display:none!important}
      html.vf-guest-locked #view-account{display:block!important;min-height:calc(100vh - 90px)}
      html.vf-guest-locked #view-account .account-panel{max-width:920px;margin:28px auto!important}
      html.vf-guest-locked #view-account .account-panel>*:not(.hero):not(#accountLoggedOut){display:none!important}
      html.vf-guest-locked #view-account .hero{text-align:center;justify-content:center!important}
      html.vf-guest-locked #accountLoggedOut{display:grid!important}
      html.vf-guest-locked #accountLoggedIn,
      html.vf-guest-locked #v8AdminLogin,
      html.vf-guest-locked #v8AdminNav,
      html.vf-guest-locked #view-admin{display:none!important}
      html.vf-admin-route body{min-height:100vh!important;background:#071019!important}
      html.vf-admin-route .topbar,
      html.vf-admin-route #syncBanner,
      html.vf-admin-route #toast,
      html.vf-admin-route dialog{display:none!important}
      html.vf-admin-route main{min-height:100vh!important;display:grid!important;place-items:center!important;padding:28px!important}
      html.vf-admin-route main>.view{display:none!important}
      html.vf-admin-route:not(.vf-admin-authorized) #view-account{display:block!important;width:min(560px,100%)!important}
      html.vf-admin-route:not(.vf-admin-authorized) #view-account .account-panel{width:100%!important;max-width:560px!important;margin:0 auto!important}
      html.vf-admin-route:not(.vf-admin-authorized) #view-account .account-panel>*:not(#v8AdminLogin){display:none!important}
      html.vf-admin-route:not(.vf-admin-authorized) #v8AdminLogin{display:block!important;margin:0!important}
      html.vf-admin-route.vf-admin-authorized #view-account{display:none!important}
      html.vf-admin-route.vf-admin-authorized body #view-admin{display:block!important;width:100%!important;max-width:1500px!important}
      html.vf-admin-route.vf-admin-authorized body #view-admin[hidden]{display:block!important}
      html.vf-admin-route #v8AdminNav{display:none!important}
      #cefrEstimate{display:grid;grid-template-columns:92px 1fr;gap:18px;align-items:center;border:1px solid #31516a;background:linear-gradient(135deg,#0b1924,#101a24);border-radius:16px;padding:18px;margin:0 0 18px}
      #cefrEstimate h2{margin:2px 0 5px;font-size:24px}
      #cefrEstimate p{margin:4px 0}
      .vf-cefr-badge{width:78px;height:78px;border-radius:22px;display:grid;place-items:center;background:linear-gradient(145deg,#1c3b22,#244d28);border:1px solid #5b8e49;color:#caffaa;font-size:27px;font-weight:950;box-shadow:inset 0 0 20px rgba(130,237,47,.08)}
      @media(max-width:720px){#cefrEstimate{grid-template-columns:64px 1fr}.vf-cefr-badge{width:58px;height:58px;border-radius:16px;font-size:22px}html.vf-guest-locked #view-account .account-panel{margin:12px auto!important}}
    `;
    document.head.appendChild(style);
  }

  function goToWords(){const btn=$('#mainNav [data-view="words"]');if(btn)btn.click()}
  function prepareStartPage(){const brand=$('.brand[data-view-link]');if(brand)brand.dataset.viewLink='words';setTimeout(goToWords,0);setTimeout(goToWords,350)}

  function activateView(name){
    $$('.view').forEach(v=>v.classList.toggle('active',v.id===`view-${name}`));
    $$('#mainNav button').forEach(b=>b.classList.toggle('active',b.dataset.view===name));
  }

  function showGuestLogin(){
    userAuthenticated=false;
    document.documentElement.classList.remove('vf-auth-checking');
    document.documentElement.classList.add('vf-guest-locked');
    activateView('account');
    $('#accountLoggedOut')?.classList.remove('hidden');
    $('#accountLoggedIn')?.classList.add('hidden');
    $('#v8AdminLogin')?.remove();
  }

  function unlockUserApp(){
    if(ADMIN_ROUTE)return;
    const wasLocked=!userAuthenticated;
    userAuthenticated=true;
    document.documentElement.classList.remove('vf-auth-checking','vf-guest-locked');
    if(wasLocked)prepareStartPage();
  }

  async function checkUserSession(){
    if(ADMIN_ROUTE)return;
    try{
      const r=await fetch('/api/me',{credentials:'same-origin',cache:'no-store'});
      let d={};try{d=await r.json()}catch{}
      if(r.ok&&d?.user)unlockUserApp();else showGuestLogin();
    }catch{showGuestLogin()}
  }

  function scheduleUserCheck(delay=80){clearTimeout(authTimer);authTimer=setTimeout(checkUserSession,delay)}

  function showAdminLogin(){
    document.documentElement.classList.remove('vf-admin-authorized');
    document.body?.classList.remove('v17-admin-authorized');
    activateView('account');
    $('#view-admin')?.setAttribute('hidden','');
    $('#v8AdminLogin')?.removeAttribute('hidden');
  }

  function showAdminArea(){
    document.documentElement.classList.add('vf-admin-authorized');
    document.body?.classList.add('v17-admin-authorized');
    $('#view-admin')?.removeAttribute('hidden');
    $('#v8AdminLogin')?.setAttribute('hidden','');
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

  function scheduleAdminCheck(delay=80){clearTimeout(adminTimer);adminTimer=setTimeout(checkAdminSession,delay)}

  function protectAdminLoginEntry(){
    if(ADMIN_ROUTE)return;
    const remove=()=>$('#v8AdminLogin')?.remove();
    remove();
    new MutationObserver(remove).observe(document.documentElement,{childList:true,subtree:true});
  }

  function watchAccessState(){
    if(ADMIN_ROUTE){
      const observer=new MutationObserver(records=>{
        const relevant=records.some(r=>r.type==='childList'&&[...r.addedNodes].some(n=>n.nodeType===1&&(n.matches?.('#v8AdminLogin,#view-admin')||n.querySelector?.('#v8AdminLogin,#view-admin'))));
        if(relevant)scheduleAdminCheck(40);
      });
      observer.observe(document.documentElement,{subtree:true,childList:true});
      return;
    }
    const observer=new MutationObserver(()=>{
      $('#v8AdminLogin')?.remove();
      const loggedIn=$('#accountLoggedIn'),loggedOut=$('#accountLoggedOut');
      if(loggedIn&&!loggedIn.classList.contains('hidden'))unlockUserApp();
      else if(loggedOut&&!loggedOut.classList.contains('hidden')&&userAuthenticated)scheduleUserCheck(50);
      if(!userAuthenticated&&document.documentElement.classList.contains('vf-guest-locked'))activateView('account');
    });
    observer.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class','hidden']});
  }

  function numberFromCard(label){const card=$$('.stat-card').find(c=>c.querySelector('span')?.textContent.trim()===label);if(!card)return 0;const text=card.querySelector('strong')?.textContent||'0';return Number(text.replace(/[^0-9,.-]/g,'').replaceAll('.','').replace(',','.'))||0}
  function percentFromCard(label){return Math.max(0,Math.min(100,numberFromCard(label)))}
  function estimateCefr(){
    const saved=numberFromCard('Gespeicherte Wörter'),vocabCorrect=numberFromCard('Vokabel richtig'),grammarCorrect=numberFromCard('Grammatik richtig'),vocabAcc=percentFromCard('Vokabelquote'),grammarAcc=percentFromCard('Grammatikquote'),xp=numberFromCard('XP');
    const vAnswered=vocabAcc>0?Math.round(vocabCorrect/(vocabAcc/100)):0,gAnswered=grammarAcc>0?Math.round(grammarCorrect/(grammarAcc/100)):0,answered=vAnswered+gAnswered,weightedAcc=answered?((vAnswered*vocabAcc)+(gAnswered*grammarAcc))/answered:0;
    let score=0;score+=Math.min(34,Math.log10(saved+1)*12);score+=Math.min(26,Math.log10(answered+1)*11);score+=Math.min(20,Math.log10(xp+1)*6);if(answered>=20)score+=Math.max(-8,Math.min(12,(weightedAcc-65)*0.45));
    const levels=['A1','A2','B1','B2','C1','C2'],gates=[0,24,39,55,72,88];let idx=0;for(let i=0;i<gates.length;i++)if(score>=gates[i])idx=i;if(answered<20)idx=Math.min(idx,1);else if(answered<60)idx=Math.min(idx,2);else if(answered<140)idx=Math.min(idx,3);else if(answered<300)idx=Math.min(idx,4);return{level:levels[idx],confidence:answered>=250?'gut':answered>=60?'mittel':'niedrig',saved,answered,accuracy:Math.round(weightedAcc)}
  }
  function renderCefr(){const grid=$('#statsGrid');if(!grid)return;let panel=$('#cefrEstimate');if(!panel){panel=document.createElement('div');panel.id='cefrEstimate';panel.innerHTML='<div class="vf-cefr-badge" id="cefrLevel">A1</div><div><div class="eyebrow">Grobe Sprachlevel-Schätzung</div><h2 id="cefrTitle">Noch zu wenig Lerndaten</h2><p id="cefrDetail" class="muted"></p><p class="tiny muted">Orientierung nach CEFR A1–C2. Kein offizieller Einstufungstest.</p></div>';grid.parentNode.insertBefore(panel,grid)}const e=estimateCefr();$('#cefrLevel').textContent=e.level;$('#cefrTitle').textContent=`Geschätztes Niveau: ${e.level}`;$('#cefrDetail').textContent=`Berechnet aus ${e.saved.toLocaleString('de-DE')} gespeicherten Wörtern und ca. ${e.answered.toLocaleString('de-DE')} beantworteten Übungen. Datenbasis: ${e.confidence}${e.answered?` · Trefferquote ca. ${e.accuracy}%`:''}. Je mehr du übst, desto aussagekräftiger wird die Schätzung.`}

  installAccessStyles();
  if(ADMIN_ROUTE){
    document.documentElement.classList.add('vf-admin-route');
    document.title='VocabFast Admin';
  }else document.documentElement.classList.add('vf-auth-checking');
  protectAdminLoginEntry();
  watchAccessState();

  window.addEventListener('load',()=>{
    if(ADMIN_ROUTE)checkAdminSession();else checkUserSession();
    const grid=$('#statsGrid');if(grid){new MutationObserver(renderCefr).observe(grid,{childList:true,subtree:true,characterData:true});renderCefr()}
  });
  window.addEventListener('pageshow',()=>ADMIN_ROUTE?scheduleAdminCheck(40):scheduleUserCheck(40));
})();
