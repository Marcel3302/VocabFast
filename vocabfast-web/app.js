(() => {
'use strict';

const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clone = x => JSON.parse(JSON.stringify(x));
const shuffle = arr => { const a=[...arr]; for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; };
const uid = w => `${(w.en||'').trim().toLowerCase()}|${(w.de||'').trim().toLowerCase()}`;
const pathKey = path => path.join(' › ');
const LEVEL_ORDER = {A1:1,A2:2,B1:3,B2:4,C1:5,C2:6,'—':99};
const BUILTIN = window.VOCAB_DATA || [];
const GRAMMAR = window.GRAMMAR_DATA || [];

const CORE_TERMS = new Set([
  'main rotor','rotor blade','rotor head','rotor mast','swashplate','collective','collective pitch','cyclic','cyclic pitch','tail rotor','anti-torque','autorotation','vortex ring state','retreating blade stall','mast bumping','low rotor rpm','governor','freewheeling unit','transmission','gearbox','engine','turbine','fuel','hydraulic pressure','oil pressure','airspeed','altitude','heading','attitude','landing gear','flight control','flight controls','pilot','aircraft','helicopter','runway','taxiway','weather','wind','visibility','cloud','pressure','temperature','safety','warning','caution','emergency','checklist','procedure','maintenance','inspection','failure','fire','battery','generator','alternator','navigation','radio','clearance','approach','landing','takeoff','hover','ground effect','weight','balance','center of gravity','centre of gravity'
]);

function wordImportance(w){
  const explicit = Number(w?.importance);
  if (explicit >= 1 && explicit <= 5) return explicit;
  const en=(w?.en||'').toLowerCase().trim();
  if (CORE_TERMS.has(en)) return 5;
  if ([...CORE_TERMS].some(t => t.length>7 && en.includes(t))) return 5;
  const base = {A1:5,A2:5,B1:4,B2:3,C1:2,C2:2}[w?.level] || 3;
  if (w?.level==='C2' && en.split(/\s+/).length>=3) return 1;
  return base;
}

function dedupe(words){
  const m=new Map();
  for(const w of words||[]){ if(!w?.en) continue; const k=uid(w); if(!m.has(k)) m.set(k,w); }
  return [...m.values()];
}
function collectWords(node,out=[]){ out.push(...(node?.words||[])); for(const c of node?.children||[]) collectWords(c,out); return out; }

const DEFAULT_STATE = () => ({
  learning: [],
  customTopics: [],
  settings: {sort:'importance-desc'},
  stats: {xp:0,vocabCorrect:0,vocabAnswered:0,grammarCorrect:0,grammarAnswered:0,pdfUploads:0,customTopics:0,studyDates:[]},
  mastery: {}
});

let user=null;
let state=DEFAULT_STATE();
let topicRoots=[];
let selectedPath=[];
let expandedPaths=new Set();
let topicSelected=new Set();
let learnSelected=new Set();
let pdfList=[];
let pdfLibrarySelected=new Set();
let activePdf=null;
let pdfWords=[];
let pdfSelected=new Set();
let practiceOverride=null;
let practiceCorrect=0;
let practiceAnswered=0;
let syncTimer=null;
let syncing=false;
let pendingSync=false;

const toast = msg => {
  const t=$('#toast'); t.textContent=msg; t.classList.add('show');
  clearTimeout(toast._t); toast._t=setTimeout(()=>t.classList.remove('show'),2400);
};

async function api(path, options={}){
  const opts={credentials:'same-origin',...options,headers:{...(options.headers||{})}};
  if(options.body && !(options.body instanceof FormData) && typeof options.body!=='string'){
    opts.headers['Content-Type']='application/json'; opts.body=JSON.stringify(options.body);
  }
  const res=await fetch(`/api${path}`,opts);
  let data=null; const type=res.headers.get('content-type')||'';
  if(type.includes('application/json')) data=await res.json();
  if(!res.ok){
    const err=new Error(data?.error || `Serverfehler ${res.status}`); err.status=res.status; throw err;
  }
  return data ?? res;
}

function requireLogin(){
  if(user) return true;
  switchView('account'); toast('Bitte zuerst anmelden oder ein Konto erstellen.'); return false;
}

function normalizeState(raw){
  const base=DEFAULT_STATE(), x=raw && typeof raw==='object' ? raw : {};
  base.learning=Array.isArray(x.learning)?dedupe(x.learning):[];
  base.customTopics=Array.isArray(x.customTopics)?x.customTopics:[];
  base.settings={...base.settings,...(x.settings||{})};
  base.stats={...base.stats,...(x.stats||{})};
  if(!Array.isArray(base.stats.studyDates)) base.stats.studyDates=[];
  base.mastery=x.mastery && typeof x.mastery==='object'?x.mastery:{};
  return base;
}

function updateSyncStatus(text, isError=false){
  const e=$('#syncStatus'); if(e){e.textContent=text||''; e.classList.toggle('error-text',isError);}
  const b=$('#syncBanner');
  if(isError && text){b.textContent=text;b.classList.remove('hidden');}
  else b.classList.add('hidden');
}

function scheduleSync(){
  if(!user) return;
  pendingSync=true;
  clearTimeout(syncTimer);
  updateSyncStatus('Änderungen werden synchronisiert …');
  syncTimer=setTimeout(syncState,450);
}

async function syncState(){
  if(!user || syncing || !pendingSync) return;
  syncing=true; pendingSync=false;
  try{
    await api('/state',{method:'PUT',body:state});
    updateSyncStatus(`Synchronisiert · ${new Date().toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'})}`);
  }catch(err){
    pendingSync=true; updateSyncStatus(`Synchronisierung fehlgeschlagen: ${err.message}`,true);
  }finally{
    syncing=false;
    if(pendingSync) syncTimer=setTimeout(syncState,1300);
  }
}

function recordStudy(){
  const d=new Date().toISOString().slice(0,10);
  const set=new Set(state.stats.studyDates||[]); set.add(d); state.stats.studyDates=[...set].sort().slice(-365);
}
function addXp(n){ state.stats.xp=Math.max(0,(state.stats.xp||0)+n); recordStudy(); scheduleSync(); renderRankUi(); }

const RANKS = [
  ['Bronze III','B3',0],['Bronze II','B2',150],['Bronze I','B1',350],
  ['Silber III','S3',650],['Silber II','S2',1000],['Silber I','S1',1450],
  ['Gold III','G3',2000],['Gold II','G2',2700],['Gold I','G1',3500],
  ['Platin III','P3',4500],['Platin II','P2',5700],['Platin I','P1',7100],
  ['Diamant III','D3',8800],['Diamant II','D2',10800],['Diamant I','D1',13200],
  ['Master','M',16000],['Grandmaster','GM',20000]
];
function currentRank(){
  const xp=state.stats.xp||0; let idx=0;
  for(let i=0;i<RANKS.length;i++) if(xp>=RANKS[i][2]) idx=i;
  return {idx,rank:RANKS[idx],next:RANKS[idx+1]||null,xp};
}
function renderRankUi(){
  const r=currentRank();
  $('#rankPill').textContent=`${r.rank[0]} · ${r.xp.toLocaleString('de-DE')} XP`;
  $('#rankName').textContent=r.rank[0]; $('#rankEmblem').textContent=r.rank[1]; $('#rankXpText').textContent=`${r.xp.toLocaleString('de-DE')} XP`;
  const start=r.rank[2], end=r.next?.[2] ?? Math.max(start+1,r.xp), pct=r.next?Math.min(100,((r.xp-start)/(end-start))*100):100;
  $('#rankProgressBar').style.width=`${pct}%`;
  $('#nextRankText').textContent=r.next?`${(end-r.xp).toLocaleString('de-DE')} XP bis ${r.next[0]}`:'Höchster Rang erreicht';
}

function achievementData(){
  const s=state.stats, words=state.learning.length, days=(s.studyDates||[]).length;
  return [
    ['Erster Schritt','1 Wort gespeichert',words>=1],['Wortsammler','50 Wörter gespeichert',words>=50],['Wortschatz 250','250 Wörter gespeichert',words>=250],['Lexikon','1.000 Wörter gespeichert',words>=1000],
    ['Treffsicher','25 Vokabelantworten richtig',(s.vocabCorrect||0)>=25],['Vokabel-Ass','250 Vokabelantworten richtig',(s.vocabCorrect||0)>=250],['Grammar Starter','25 Grammatikfragen richtig',(s.grammarCorrect||0)>=25],['Grammar Pro','250 Grammatikfragen richtig',(s.grammarCorrect||0)>=250],
    ['Dokumentenjäger','1 PDF hochgeladen',(s.pdfUploads||0)>=1],['Bibliothekar','10 PDFs hochgeladen',(s.pdfUploads||0)>=10],['Eigener Lehrplan','1 eigenes Thema erstellt',(s.customTopics||0)>=1],['Dranbleiber','7 verschiedene Lerntage',days>=7],['Routine','30 verschiedene Lerntage',days>=30],['XP 5K','5.000 XP erreicht',(s.xp||0)>=5000]
  ];
}

function rebuildTopics(){
  topicRoots=clone(BUILTIN);
  for(const item of state.customTopics||[]){
    if(item && Array.isArray(item.parentPath)){
      const rec={id:item.id||crypto.randomUUID(),name:item.name||'Eigenes Thema',words:item.words||[],children:item.children||[],custom:true};
      if(!item.parentPath.length){topicRoots.push(rec);continue;}
      let nodes=topicRoots,cur=null;
      for(const p of item.parentPath){cur=nodes.find(n=>n.name===p); if(!cur){cur=null;break;} nodes=cur.children||(cur.children=[]);}
      if(cur){cur.children=cur.children||[];cur.children.push(rec);} else topicRoots.push(rec);
    } else if(item?.name){
      topicRoots.push(clone(item));
    }
  }
}
function allTopics(){ return topicRoots; }
function findNode(path){ let nodes=topicRoots,cur=null; for(const p of path){cur=nodes.find(n=>n.name===p);if(!cur)return null;nodes=cur.children||[];}return cur; }
function countNode(n){return dedupe(collectWords(n,[])).length;}
function currentWords(){ return selectedPath.length?dedupe(collectWords(findNode(selectedPath)||{},[])):dedupe(topicRoots.flatMap(n=>collectWords(n,[]))); }

function sortWords(words){
  const mode=state.settings.sort||'importance-desc';
  return [...words].sort((a,b)=>{
    if(mode==='importance-desc') return wordImportance(b)-wordImportance(a) || (LEVEL_ORDER[a.level]||99)-(LEVEL_ORDER[b.level]||99) || a.en.localeCompare(b.en);
    if(mode==='level-asc') return (LEVEL_ORDER[a.level]||99)-(LEVEL_ORDER[b.level]||99) || wordImportance(b)-wordImportance(a) || a.en.localeCompare(b.en);
    if(mode==='level-desc') return (LEVEL_ORDER[b.level]||99)-(LEVEL_ORDER[a.level]||99) || wordImportance(b)-wordImportance(a) || a.en.localeCompare(b.en);
    return a.en.localeCompare(b.en,undefined,{sensitivity:'base'});
  });
}

function learningSet(){return new Set(state.learning.map(uid));}
function addWords(words){
  if(!requireLogin()) return;
  const have=learningSet(); let n=0;
  for(const w of dedupe(words)){
    if(!have.has(uid(w))){state.learning.push({...w,importance:wordImportance(w)});have.add(uid(w));n++;}
  }
  if(n){state.stats.wordsAdded=(state.stats.wordsAdded||0)+n; addXp(Math.min(n,50)); scheduleSync();}
  renderWords(); renderLearning(); renderProgress();
  toast(n?`${n} Wörter hinzugefügt`:'Alle Wörter sind bereits gespeichert');
}
function removeWordsByKeys(keys){
  const set=new Set(keys); state.learning=state.learning.filter(w=>!set.has(uid(w))); for(const k of set) delete state.mastery[k]; scheduleSync();
}

function switchView(name){
  $$('.view').forEach(v=>v.classList.toggle('active',v.id===`view-${name}`));
  $$('#mainNav button').forEach(b=>b.classList.toggle('active',b.dataset.view===name));
  document.body.classList.remove('nav-open');
  if(name==='words')renderLearning();
  if(name==='practice')makePracticeRound();
  if(name==='pdf')renderPdfLibrary();
  if(name==='grammar'){renderGrammar();makeGrammarQuiz();}
  if(name==='progress')renderProgress();
  if(name==='account')renderAccount();
  window.scrollTo({top:0,behavior:'instant'});
}
$$('#mainNav button').forEach(b=>b.onclick=()=>switchView(b.dataset.view));
$$('[data-view-link]').forEach(b=>b.onclick=()=>switchView(b.dataset.viewLink));
$('#mobileMenu').onclick=()=>document.body.classList.toggle('nav-open');
$('#collapseSidebar').onclick=()=>$('#topicSidebar').classList.toggle('compact');

function visibleTopicMatch(n,q){return n.name.toLowerCase().includes(q)||(n.children||[]).some(c=>visibleTopicMatch(c,q));}
function renderTree(){
  const root=$('#topicTree'); root.innerHTML=''; const q=$('#topicSearch').value.trim().toLowerCase();
  function make(n,path){
    if(q && !visibleTopicMatch(n,q)) return null;
    const key=pathKey(path), has=(n.children||[]).length>0, open=q?true:expandedPaths.has(key);
    const wrap=document.createElement('div'); wrap.className='topic-node';
    const row=document.createElement('div'); row.className='topic-row';
    row.innerHTML=`<button class="fold ${has?'':'placeholder'}" aria-label="${open?'Einklappen':'Aufklappen'}">${has?(open?'▾':'▸'):'·'}</button><button class="topic-name ${pathKey(selectedPath)===key?'active':''}"><span>${esc(n.name)}</span><small>${countNode(n).toLocaleString('de-DE')}</small></button><button class="topic-add" title="Gesamtes Thema zur Lernliste">＋</button>`;
    row.querySelector('.topic-name').onclick=()=>{selectedPath=path;for(let i=1;i<path.length;i++)expandedPaths.add(pathKey(path.slice(0,i)));renderTopics();};
    row.querySelector('.topic-add').onclick=e=>{e.stopPropagation();addWords(collectWords(n,[]));};
    if(has)row.querySelector('.fold').onclick=()=>{open?expandedPaths.delete(key):expandedPaths.add(key);renderTree();};
    wrap.appendChild(row);
    if(has && open){const children=document.createElement('div');children.className='topic-children';for(const c of n.children){const el=make(c,[...path,c.name]);if(el)children.appendChild(el);}wrap.appendChild(children);}
    return wrap;
  }
  for(const n of topicRoots){const el=make(n,[n.name]);if(el)root.appendChild(el);}
}

function renderTopics(){ renderTree(); renderWords(); }
function getVisibleWords(){
  const q=$('#wordSearch').value.trim().toLowerCase(), level=$('#levelFilter').value, missing=$('#unsavedOnly').checked, saved=learningSet();
  return sortWords(currentWords().filter(w=>(!q||`${w.en} ${w.de}`.toLowerCase().includes(q))&&(!level||w.level===level)&&(!missing||!saved.has(uid(w)))));
}
function updateTopicSelectionButton(visible){const btn=$('#toggleTopicSelection');const all=visible.length&&visible.every(w=>topicSelected.has(uid(w)));btn.textContent=all?'Sichtbare abwählen':'Alle sichtbaren markieren';}
function renderWords(){
  const box=$('#topicWordRows'), visible=getVisibleWords(); box.innerHTML=''; $('#topicTitle').textContent=selectedPath.at(-1)||'Alle Themen'; $('#topicBreadcrumb').textContent=selectedPath.length?selectedPath.join(' › '):'Gesamter Wortschatz'; $('#topicWordCount').textContent=`${visible.length.toLocaleString('de-DE')} sichtbare Wörter`;
  const saved=learningSet();
  for(const w of visible){const tr=document.createElement('div');tr.className='word-row';const key=uid(w);tr.innerHTML=`<label class="select-cell"><input class="check" type="checkbox" ${topicSelected.has(key)?'checked':''}></label><div><strong>${esc(w.en)}</strong><small>Wichtigkeit ${wordImportance(w)}/5</small></div><div>${esc(w.de)}</div><div><span class="level">${esc(w.level||'—')}</span></div><div>${saved.has(key)?'<span class="saved">Gespeichert</span>':'<button class="btn primary addone">＋ Liste</button>'}</div>`;tr.querySelector('.check').onchange=e=>{e.target.checked?topicSelected.add(key):topicSelected.delete(key);updateTopicSelectionButton(visible);};const b=tr.querySelector('.addone');if(b)b.onclick=()=>addWords([w]);box.appendChild(tr);}
  updateTopicSelectionButton(visible);
}
$('#toggleTopicSelection').onclick=()=>{const v=getVisibleWords(),all=v.length&&v.every(w=>topicSelected.has(uid(w)));for(const w of v)all?topicSelected.delete(uid(w)):topicSelected.add(uid(w));renderWords();};
$('#addSelectedTopicWords').onclick=()=>addWords(currentWords().filter(w=>topicSelected.has(uid(w))));
$('#addVisibleWords').onclick=()=>addWords(getVisibleWords());
$('#wordSearch').oninput=renderWords; $('#levelFilter').onchange=renderWords; $('#unsavedOnly').onchange=renderWords; $('#topicSearch').oninput=renderTree;

function getVisibleLearning(){const q=$('#learningSearch').value.trim().toLowerCase();return sortWords(state.learning.filter(w=>!q||`${w.en} ${w.de}`.toLowerCase().includes(q)));}
function updateLearnSelectionInfo(v){const all=v.length&&v.every(w=>learnSelected.has(uid(w)));$('#selectAllLearn').textContent=all?'Alle abwählen':'Alle markieren';$('#learnSelectionInfo').textContent=`${learnSelected.size} markiert · ${state.learning.length} gespeichert`;}
function renderLearning(){
  const box=$('#learningRows'),v=getVisibleLearning();box.innerHTML='';
  if(!user){box.insertAdjacentHTML('beforeend','<div class="empty">Melde dich an, damit deine Lernliste auf allen Geräten synchronisiert wird.</div>');updateLearnSelectionInfo([]);return;}
  for(const w of v){const k=uid(w),tr=document.createElement('div');tr.className='word-row learning-row';tr.innerHTML=`<label><input class="check" type="checkbox" ${learnSelected.has(k)?'checked':''}></label><div><strong>${esc(w.en)}</strong><small>Wichtigkeit ${wordImportance(w)}/5</small></div><div>${esc(w.de||'(Übersetzung ergänzen)')}</div><div><span class="level">${esc(w.level||'—')}</span></div><div><button class="btn danger del">Löschen</button></div>`;tr.querySelector('.check').onchange=e=>{e.target.checked?learnSelected.add(k):learnSelected.delete(k);updateLearnSelectionInfo(v);};tr.querySelector('.del').onclick=()=>{removeWordsByKeys([k]);learnSelected.delete(k);renderLearning();renderWords();};box.appendChild(tr);}updateLearnSelectionInfo(v);
}
$('#learningSearch').oninput=renderLearning;
$('#selectAllLearn').onclick=()=>{const v=getVisibleLearning(),all=v.length&&v.every(w=>learnSelected.has(uid(w)));for(const w of v)all?learnSelected.delete(uid(w)):learnSelected.add(uid(w));renderLearning();};
$('#deleteSelectedLearn').onclick=()=>{if(!learnSelected.size)return toast('Keine Wörter markiert');if(confirm(`${learnSelected.size} markierte Wörter löschen?`)){removeWordsByKeys([...learnSelected]);learnSelected.clear();renderLearning();renderWords();}};
$('#deleteAllLearn').onclick=()=>{if(state.learning.length&&confirm(`Wirklich alle ${state.learning.length} Wörter löschen?`)){state.learning=[];state.mastery={};learnSelected.clear();scheduleSync();renderLearning();renderWords();}};
$('#exportCsv').onclick=()=>{const rows=[['English','Deutsch','Level','Importance'],...sortWords(state.learning).map(w=>[w.en,w.de,w.level||'',wordImportance(w)])];const csv=rows.map(r=>r.map(x=>`"${String(x??'').replaceAll('"','""')}"`).join(';')).join('\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv'}));a.download='vocabfast-words.csv';a.click();URL.revokeObjectURL(a.href);};

function makePracticeRound(){
  const box=$('#practiceBox');box.innerHTML='';
  if(!user){box.innerHTML='<div class="empty">Melde dich an, um deine gespeicherten Wörter zu üben und Fortschritt zu synchronisieren.</div>';return;}
  const pool=sortWords(state.learning);if(!pool.length){box.innerHTML='<div class="empty">Speichere zuerst Wörter in „Meine Wörter“.</div>';return;}
  const words=practiceOverride?.length?practiceOverride:shuffle(pool).slice(0,10);practiceOverride=null;practiceCorrect=0;practiceAnswered=0;$('#practiceScore').textContent='0 / 0';box.innerHTML='';
  words.forEach((w,i)=>{const card=document.createElement('div');card.className='quiz-card';card.innerHTML=`<div class="quiz-no">${i+1}</div><div class="quiz-question">${esc(w.en)}</div><input class="answer-input" placeholder="Deutsche Übersetzung"><button class="btn checkanswer">Prüfen</button><div class="feedback"></div>`;const input=card.querySelector('input'),btn=card.querySelector('.checkanswer'),fb=card.querySelector('.feedback');const check=()=>{if(card.dataset.done)return;const ok=input.value.trim().toLowerCase()===String(w.de||'').trim().toLowerCase();card.dataset.done='1';practiceAnswered++;state.stats.vocabAnswered=(state.stats.vocabAnswered||0)+1;if(ok){practiceCorrect++;state.stats.vocabCorrect=(state.stats.vocabCorrect||0)+1;addXp(8);fb.textContent='✓ Richtig';fb.className='feedback ok';}else{addXp(2);fb.textContent=`Richtig: ${w.de}`;fb.className='feedback bad';}$('#practiceScore').textContent=`${practiceCorrect} / ${practiceAnswered}`;scheduleSync();};btn.onclick=check;input.onkeydown=e=>{if(e.key==='Enter')check();};box.appendChild(card);});
}
$('#newPractice').onclick=()=>makePracticeRound();

async function renderPdfLibrary(){
  const box=$('#pdfCards');box.innerHTML='';if(!user){box.innerHTML='<div class="empty">Melde dich an, damit PDFs sicher in deinem Konto gespeichert werden.</div>';return;}
  try{pdfList=await api('/pdfs');}catch(err){box.innerHTML=`<div class="empty error-text">${esc(err.message)}</div>`;return;}
  if(!pdfList.length){box.innerHTML='<div class="empty">Noch keine PDFs gespeichert.</div>';updatePdfSelectionButton();return;}
  for(const p of pdfList){const card=document.createElement('div');card.className='pdf-card';card.innerHTML=`<input class="check pdfselect" type="checkbox" ${pdfLibrarySelected.has(p.id)?'checked':''}><div class="pdf-icon">PDF</div><div class="pdf-copy"><h3>${esc(p.name)}</h3><div class="muted">${new Date(p.created).toLocaleString('de-DE')} · ${(p.size/1024/1024).toFixed(1)} MB${p.context?' · '+esc(p.context):''}</div></div><div class="actions wrap"><button class="btn analyze">Wörter anzeigen</button><button class="btn danger del">Löschen</button></div>`;card.querySelector('.pdfselect').onchange=e=>{e.target.checked?pdfLibrarySelected.add(p.id):pdfLibrarySelected.delete(p.id);updatePdfSelectionButton();};card.querySelector('.analyze').onclick=()=>analyzePdf(p);card.querySelector('.del').onclick=async()=>{if(confirm(`„${p.name}“ löschen?`)){await api(`/pdfs/${encodeURIComponent(p.id)}`,{method:'DELETE'});pdfLibrarySelected.delete(p.id);if(activePdf?.id===p.id)closeAnalysis();await renderPdfLibrary();toast('PDF gelöscht');}};box.appendChild(card);}updatePdfSelectionButton();
}
function updatePdfSelectionButton(){const all=pdfList.length&&pdfList.every(p=>pdfLibrarySelected.has(p.id));$('#selectAllPdf').textContent=all?'Alle abwählen':'Alle markieren';$('#pdfSelectInfo').textContent=`${pdfLibrarySelected.size} markiert · ${pdfList.length} PDFs`;}
$('#selectAllPdf').onclick=()=>{const all=pdfList.length&&pdfList.every(p=>pdfLibrarySelected.has(p.id));for(const p of pdfList)all?pdfLibrarySelected.delete(p.id):pdfLibrarySelected.add(p.id);renderPdfLibrary();};
$('#pdfInput').onchange=async e=>{if(!requireLogin()){e.target.value='';return;}const file=e.target.files?.[0];if(!file)return;const fd=new FormData();fd.append('file',file);fd.append('context',$('#pdfContext').value.trim());try{await api('/pdfs',{method:'POST',body:fd});state.stats.pdfUploads=(state.stats.pdfUploads||0)+1;addXp(20);await renderPdfLibrary();toast('PDF gespeichert');}catch(err){toast(err.message);}finally{e.target.value='';}};
$('#deleteSelectedPdf').onclick=async()=>{if(!pdfLibrarySelected.size)return toast('Keine PDFs markiert');if(confirm(`${pdfLibrarySelected.size} markierte PDFs löschen?`)){for(const id of [...pdfLibrarySelected])await api(`/pdfs/${encodeURIComponent(id)}`,{method:'DELETE'});pdfLibrarySelected.clear();closeAnalysis();await renderPdfLibrary();toast('Markierte PDFs gelöscht');}};
$('#deleteAllPdf').onclick=async()=>{if(pdfList.length&&confirm(`Wirklich alle ${pdfList.length} PDFs löschen?`)){await api('/pdfs',{method:'DELETE'});pdfLibrarySelected.clear();closeAnalysis();await renderPdfLibrary();toast('PDF-Bibliothek geleert');}};
function closeAnalysis(){activePdf=null;pdfWords=[];pdfSelected.clear();$('#pdfAnalysis').classList.add('hidden');}
$('#closePdfAnalysis').onclick=closeAnalysis;
async function loadPdfJs(){if(window._pdfjs)return window._pdfjs;const mod=await import('https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.min.mjs');mod.GlobalWorkerOptions.workerSrc='https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs';window._pdfjs=mod;return mod;}
async function analyzePdf(p){
  activePdf=p;$('#pdfAnalysis').classList.remove('hidden');$('#activePdfName').textContent=p.name;$('#pdfWordRows').innerHTML='<div class="empty">PDF wird analysiert …</div>';try{const res=await fetch(`/api/pdfs/${encodeURIComponent(p.id)}/file`,{credentials:'same-origin'});if(!res.ok)throw new Error(`PDF konnte nicht geladen werden (${res.status})`);const pdfjs=await loadPdfJs(),bytes=await res.arrayBuffer(),doc=await pdfjs.getDocument({data:bytes}).promise;let text='';for(let i=1;i<=doc.numPages;i++){const page=await doc.getPage(i),content=await page.getTextContent();text+=' '+content.items.map(x=>x.str).join(' ');}const freq=new Map();for(const m of text.toLowerCase().matchAll(/[a-z][a-z'-]{2,}/g)){const w=m[0].replace(/^['-]+|['-]+$/g,'');if(w.length>2)freq.set(w,(freq.get(w)||0)+1);}pdfWords=[...freq.entries()].sort((a,b)=>b[1]-a[1]).slice(0,1200).map(([en,count])=>{const known=findKnownWord(en);return known?{...known,count}:{en,de:'(aus PDF – Übersetzung ergänzen)',level:'—',count,importance:Math.min(5,Math.max(1,Math.round(Math.log2(count+1))))};});pdfSelected.clear();renderPdfWords();}catch(err){$('#pdfWordRows').innerHTML=`<div class="empty error-text">${esc(err.message)}</div>`;}
}
function findKnownWord(en){const x=en.toLowerCase();for(const root of topicRoots){const f=collectWords(root,[]).find(w=>(w.en||'').toLowerCase()===x);if(f)return f;}return null;}
function visiblePdfWords(){const q=$('#pdfWordSearch').value.trim().toLowerCase();return sortWords(pdfWords.filter(w=>!q||`${w.en} ${w.de}`.toLowerCase().includes(q)));}
function renderPdfWords(){const box=$('#pdfWordRows'),v=visiblePdfWords(),scroll=box.scrollTop;box.innerHTML='';for(const w of v){const k=uid(w),row=document.createElement('div');row.className='pdf-word-chip';row.innerHTML=`<label><input class="check" type="checkbox" ${pdfSelected.has(k)?'checked':''}><strong>${esc(w.en)}</strong><span>${w.count||''}×</span><small>${esc(w.de)}</small></label>`;row.querySelector('input').onchange=e=>{e.target.checked?pdfSelected.add(k):pdfSelected.delete(k);updatePdfWordSelection(v);};box.appendChild(row);}box.scrollTop=scroll;updatePdfWordSelection(v);}
function updatePdfWordSelection(v){const all=v.length&&v.every(w=>pdfSelected.has(uid(w)));$('#selectVisiblePdfWords').textContent=all?'Sichtbare abwählen':'Alle sichtbaren markieren';$('#pdfWordInfo').textContent=`${pdfSelected.size} markiert · ${pdfWords.length} erkannt`;}
$('#pdfWordSearch').oninput=renderPdfWords;
$('#selectVisiblePdfWords').onclick=()=>{const v=visiblePdfWords(),all=v.length&&v.every(w=>pdfSelected.has(uid(w)));for(const w of v)all?pdfSelected.delete(uid(w)):pdfSelected.add(uid(w));renderPdfWords();};
$('#addSelectedPdfWords').onclick=()=>addWords(pdfWords.filter(w=>pdfSelected.has(uid(w))));

let grammarQuiz=[];
function renderGrammar(){const box=$('#grammarModules');box.innerHTML='';for(const g of GRAMMAR){const card=document.createElement('article');card.className='grammar-card';card.innerHTML=`<div class="grammar-level">${esc(g.level)}</div><h3>${esc(g.title)}</h3><p>${esc(g.summary)}</p><div class="grammar-detail">${g.explanation}</div><div class="example-list">${(g.examples||[]).map(x=>`<div><span>›</span>${esc(x)}</div>`).join('')}</div>`;box.appendChild(card);}}
function makeGrammarQuiz(){
  const level=$('#grammarLevel').value;let pool=GRAMMAR.filter(g=>!level||g.level===level).flatMap(g=>(g.questions||[]).map(q=>({...q,level:g.level,module:g.title})));if(pool.length<10)pool=GRAMMAR.flatMap(g=>(g.questions||[]).map(q=>({...q,level:g.level,module:g.title})));grammarQuiz=shuffle(pool).slice(0,10);const box=$('#grammarQuiz');box.innerHTML='';$('#grammarScore').textContent='0 / 0';let correct=0,answered=0;grammarQuiz.forEach((q,i)=>{const card=document.createElement('div');card.className='quiz-card';card.innerHTML=`<div class="quiz-no">${i+1} · ${esc(q.level)} · ${esc(q.module)}</div><div class="quiz-question">${esc(q.q)}</div><input class="answer-input" placeholder="Antwort"><button class="btn checkgrammar">Prüfen</button><div class="feedback"></div>`;const input=card.querySelector('input'),fb=card.querySelector('.feedback'),check=()=>{if(card.dataset.done)return;const acceptable=[q.a,...(q.alt||[])].map(x=>String(x).trim().toLowerCase()),ok=acceptable.includes(input.value.trim().toLowerCase());card.dataset.done='1';answered++;state.stats.grammarAnswered=(state.stats.grammarAnswered||0)+1;if(ok){correct++;state.stats.grammarCorrect=(state.stats.grammarCorrect||0)+1;addXp(10);fb.textContent='✓ Richtig';fb.className='feedback ok';}else{addXp(2);fb.textContent=`Richtig: ${q.a}${q.note?' · '+q.note:''}`;fb.className='feedback bad';}$('#grammarScore').textContent=`${correct} / ${answered}`;scheduleSync();};card.querySelector('.checkgrammar').onclick=check;input.onkeydown=e=>{if(e.key==='Enter')check();};box.appendChild(card);});
}
$('#newGrammarQuiz').onclick=makeGrammarQuiz;$('#grammarLevel').onchange=makeGrammarQuiz;

function renderProgress(){renderRankUi();const a=$('#achievementGrid');a.innerHTML='';for(const [name,desc,ok] of achievementData()){const c=document.createElement('div');c.className=`achievement ${ok?'unlocked':'locked'}`;c.innerHTML=`<div class="achievement-icon">${ok?'★':'◇'}</div><div><strong>${esc(name)}</strong><p>${esc(desc)}</p></div>`;a.appendChild(c);}const s=state.stats;$('#progressStats').innerHTML=`<div><strong>${state.learning.length}</strong><span>gespeicherte Wörter</span></div><div><strong>${s.vocabCorrect||0}</strong><span>Vokabeln richtig</span></div><div><strong>${s.grammarCorrect||0}</strong><span>Grammatik richtig</span></div><div><strong>${(s.studyDates||[]).length}</strong><span>Lerntage</span></div>`;}

function renderAccount(){
  $('#loggedOutAccount').classList.toggle('hidden',!!user);$('#loggedInAccount').classList.toggle('hidden',!user);$('#loginNavButton').textContent=user?(user.name||user.email):'Anmelden';
  if(user){$('#profileEmail').textContent=user.email;$('#profileName').value=user.name||'';$('#accountSyncInfo').textContent='Dein Lernstand, Achievements, eigene Themen und PDFs werden über dieses Konto synchronisiert.';}renderRankUi();
}
$('#loginForm').onsubmit=async e=>{e.preventDefault();try{const data=await api('/auth/login',{method:'POST',body:{email:$('#loginEmail').value,password:$('#loginPassword').value}});await afterLogin(data.user);toast('Angemeldet');switchView('topics');}catch(err){toast(err.message);}};
$('#registerForm').onsubmit=async e=>{e.preventDefault();try{const data=await api('/auth/register',{method:'POST',body:{name:$('#registerName').value,email:$('#registerEmail').value,password:$('#registerPassword').value}});await afterLogin(data.user);toast('Konto erstellt');switchView('topics');}catch(err){toast(err.message);}};
async function afterLogin(u){user=u;const data=await api('/state');state=normalizeState(data.state);rebuildTopics();$('#globalSort').value=state.settings.sort||'importance-desc';learnSelected.clear();topicSelected.clear();pdfLibrarySelected.clear();renderAll();}
$('#logout').onclick=async()=>{try{await api('/auth/logout',{method:'POST'});}catch{}user=null;state=DEFAULT_STATE();rebuildTopics();practiceOverride=null;closeAnalysis();renderAll();switchView('account');toast('Abgemeldet');};
$('#saveProfile').onclick=async()=>{if(!user)return;try{const data=await api('/profile',{method:'PUT',body:{name:$('#profileName').value.trim()}});user=data.user;renderAccount();toast('Profil gespeichert');}catch(err){toast(err.message);}};
$('#deleteAccount').onclick=async()=>{if(!user)return;const pw=$('#deletePassword').value;if(!pw)return toast('Passwort zur Bestätigung eingeben');if(!confirm('Konto, Lernstand und alle PDFs wirklich endgültig löschen?'))return;try{await api('/account',{method:'DELETE',body:{password:pw}});user=null;state=DEFAULT_STATE();rebuildTopics();pdfList=[];renderAll();switchView('account');toast('Konto wurde gelöscht');}catch(err){toast(err.message);}};

async function detectLegacy(){
  const candidates=['vocabforge_learning','vocabfast_learning','vocabforge_custom_topics','vocabfast_custom_topics'];let found=0;for(const k of candidates)if(localStorage.getItem(k))found++;let dbPdf=0;try{const req=indexedDB.open('VocabFastPDFs');await new Promise(res=>{req.onsuccess=()=>{const db=req.result;if(db.objectStoreNames.contains('pdfs')){const tx=db.transaction('pdfs','readonly'),r=tx.objectStore('pdfs').count();r.onsuccess=()=>{dbPdf=r.result||0;res();};r.onerror=()=>res();}else res();};req.onerror=()=>res();});}catch{}$('#legacyImport').classList.toggle('hidden',!(found||dbPdf));$('#legacyStatus').textContent=(found||dbPdf)?`Alte lokale Daten gefunden${dbPdf?` · ${dbPdf} PDF(s)`:''}.`:'';
}
$('#importLegacy').onclick=async()=>{
  if(!requireLogin())return;const parse=k=>{try{return JSON.parse(localStorage.getItem(k)||'null');}catch{return null;}};const oldWords=parse('vocabforge_learning')||parse('vocabfast_learning')||[],oldTopics=parse('vocabforge_custom_topics')||parse('vocabfast_custom_topics')||[];let added=0;const have=learningSet();for(const w of Array.isArray(oldWords)?oldWords:[]){if(w?.en&&!have.has(uid(w))){state.learning.push(w);have.add(uid(w));added++;}}if(Array.isArray(oldTopics)&&oldTopics.length){state.customTopics.push(...oldTopics);state.stats.customTopics=(state.stats.customTopics||0)+oldTopics.length;}
  let pdfAdded=0;try{const db=await new Promise((res,rej)=>{const r=indexedDB.open('VocabFastPDFs');r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);});if(db.objectStoreNames.contains('pdfs')){const all=await new Promise((res,rej)=>{const r=db.transaction('pdfs','readonly').objectStore('pdfs').getAll();r.onsuccess=()=>res(r.result||[]);r.onerror=()=>rej(r.error);});for(const p of all){const blob=p.blob||p.file;if(blob instanceof Blob){const fd=new FormData();fd.append('file',blob,p.name||'import.pdf');fd.append('context',p.context||'Importierte Browser-PDF');try{await api('/pdfs',{method:'POST',body:fd});pdfAdded++;}catch{}}}}
  }catch{}
  rebuildTopics();scheduleSync();await syncState();await renderPdfLibrary();renderTopics();renderLearning();$('#legacyStatus').textContent=`Importiert: ${added} neue Wörter · ${oldTopics.length||0} Themen · ${pdfAdded} PDFs. Die alten lokalen Daten wurden zur Sicherheit nicht automatisch gelöscht.`;toast('Alt-Daten importiert');
};

$('#globalSort').onchange=()=>{state.settings.sort=$('#globalSort').value;scheduleSync();renderWords();renderLearning();if(pdfWords.length)renderPdfWords();};

function renderAll(){
  rebuildTopics();renderTopics();renderLearning();renderGrammar();renderProgress();renderAccount();renderRankUi();
}

async function init(){
  try{const me=await api('/me');user=me.user;if(user){const data=await api('/state');state=normalizeState(data.state);}else state=DEFAULT_STATE();}
  catch(err){console.error(err);user=null;state=DEFAULT_STATE();updateSyncStatus(`Cloud-Synchronisierung nicht verfügbar: ${err.message}`,true);}
  rebuildTopics();$('#globalSort').value=state.settings.sort||'importance-desc';renderAll();makeGrammarQuiz();detectLegacy();
}

init();
})();
