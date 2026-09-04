(() => {
  'use strict';

  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];

  function goToWords(){
    const btn=$('#mainNav [data-view="words"]');
    if(btn) btn.click();
  }

  function prepareStartPage(){
    const brand=$('.brand[data-view-link]');
    if(brand) brand.dataset.viewLink='words';
    setTimeout(goToWords,0);
    setTimeout(goToWords,350);
  }

  function protectAdminLoginEntry(){
    const isAdminEntry=location.pathname.replace(/\/+$/,'')==='/admin';
    if(isAdminEntry) return;
    const removePublicAdminLogin=()=>$('#v8AdminLogin')?.remove();
    removePublicAdminLogin();
    new MutationObserver(removePublicAdminLogin).observe(document.documentElement,{childList:true,subtree:true});
  }

  function numberFromCard(label){
    const card=$$('.stat-card').find(c=>c.querySelector('span')?.textContent.trim()===label);
    if(!card) return 0;
    const text=card.querySelector('strong')?.textContent||'0';
    return Number(text.replace(/[^0-9,.-]/g,'').replaceAll('.','').replace(',','.'))||0;
  }
  function percentFromCard(label){return Math.max(0,Math.min(100,numberFromCard(label)));}

  function estimateCefr(){
    const saved=numberFromCard('Gespeicherte Wörter');
    const vocabCorrect=numberFromCard('Vokabel richtig');
    const grammarCorrect=numberFromCard('Grammatik richtig');
    const vocabAcc=percentFromCard('Vokabelquote');
    const grammarAcc=percentFromCard('Grammatikquote');
    const xp=numberFromCard('XP');
    const vAnswered=vocabAcc>0?Math.round(vocabCorrect/(vocabAcc/100)):0;
    const gAnswered=grammarAcc>0?Math.round(grammarCorrect/(grammarAcc/100)):0;
    const answered=vAnswered+gAnswered;
    const weightedAcc=answered?((vAnswered*vocabAcc)+(gAnswered*grammarAcc))/answered:0;

    let score=0;
    score+=Math.min(34,Math.log10(saved+1)*12);
    score+=Math.min(26,Math.log10(answered+1)*11);
    score+=Math.min(20,Math.log10(xp+1)*6);
    if(answered>=20) score+=Math.max(-8,Math.min(12,(weightedAcc-65)*0.45));

    const levels=['A1','A2','B1','B2','C1','C2'];
    const gates=[0,24,39,55,72,88];
    let idx=0;
    for(let i=0;i<gates.length;i++) if(score>=gates[i]) idx=i;
    if(answered<20) idx=Math.min(idx,1);
    else if(answered<60) idx=Math.min(idx,2);
    else if(answered<140) idx=Math.min(idx,3);
    else if(answered<300) idx=Math.min(idx,4);
    const confidence=answered>=250?'gut':answered>=60?'mittel':'niedrig';
    return {level:levels[idx],confidence,saved,answered,accuracy:Math.round(weightedAcc)};
  }

  function renderCefr(){
    const grid=$('#statsGrid');
    if(!grid) return;
    let panel=$('#cefrEstimate');
    if(!panel){
      panel=document.createElement('div');
      panel.id='cefrEstimate';
      panel.innerHTML='<div class="vf-cefr-badge" id="cefrLevel">A1</div><div><div class="eyebrow">Grobe Sprachlevel-Schätzung</div><h2 id="cefrTitle">Noch zu wenig Lerndaten</h2><p id="cefrDetail" class="muted"></p><p class="tiny muted">Orientierung nach CEFR A1–C2. Kein offizieller Einstufungstest.</p></div>';
      grid.parentNode.insertBefore(panel,grid);
    }
    const e=estimateCefr();
    $('#cefrLevel').textContent=e.level;
    $('#cefrTitle').textContent=`Geschätztes Niveau: ${e.level}`;
    $('#cefrDetail').textContent=`Berechnet aus ${e.saved.toLocaleString('de-DE')} gespeicherten Wörtern und ca. ${e.answered.toLocaleString('de-DE')} beantworteten Übungen. Datenbasis: ${e.confidence}${e.answered?` · Trefferquote ca. ${e.accuracy}%`:''}. Je mehr du übst, desto aussagekräftiger wird die Schätzung.`;
  }

  function addStyles(){
    const style=document.createElement('style');
    style.textContent='#cefrEstimate{display:grid;grid-template-columns:92px 1fr;gap:18px;align-items:center;border:1px solid #31516a;background:linear-gradient(135deg,#0b1924,#101a24);border-radius:16px;padding:18px;margin:0 0 18px}#cefrEstimate h2{margin:2px 0 5px;font-size:24px}#cefrEstimate p{margin:4px 0}.vf-cefr-badge{width:78px;height:78px;border-radius:22px;display:grid;place-items:center;background:linear-gradient(145deg,#1c3b22,#244d28);border:1px solid #5b8e49;color:#caffaa;font-size:27px;font-weight:950;box-shadow:inset 0 0 20px rgba(130,237,47,.08)}@media(max-width:720px){#cefrEstimate{grid-template-columns:64px 1fr}.vf-cefr-badge{width:58px;height:58px;border-radius:16px;font-size:22px}}';
    document.head.appendChild(style);
  }

  window.addEventListener('load',()=>{
    protectAdminLoginEntry();
    addStyles();
    prepareStartPage();
    const grid=$('#statsGrid');
    if(grid){new MutationObserver(renderCefr).observe(grid,{childList:true,subtree:true,characterData:true});renderCefr();}
    const loggedIn=$('#accountLoggedIn');
    if(loggedIn){new MutationObserver(()=>{if(!loggedIn.classList.contains('hidden'))setTimeout(goToWords,0);}).observe(loggedIn,{attributes:true,attributeFilter:['class']});}
  });
})();
