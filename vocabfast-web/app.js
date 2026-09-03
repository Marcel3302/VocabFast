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
  $('#toggleAllTopics').textContent=expandedPaths.size?'Alle schließen':'Alle öffnen';
}
function gatherExpandable(){const out=[];function walk(n,p){if((n.children||[]).length){out.push(pathKey(p));for(const c of n.children)walk(c,[...p,c.name]);}}for(const n of topicRoots)walk(n,[n.name]);return out;}
$('#toggleAllTopics').onclick=()=>{if(expandedPaths.size)expandedPaths.clear();else expandedPaths=new Set(gatherExpandable());renderTree();};
$('#topicSearch').oninput=renderTree;

function renderTopics(){
  renderTree(); const n=selectedPath.length?findNode(selectedPath):null;
  $('#topicTitle').textContent=n?n.name:'Alle Themen'; $('#crumb').textContent=selectedPath.length?selectedPath.join(' › '):'Themen';
  const words=currentWords(); $('#topicSubtitle').textContent=`${words.length.toLocaleString('de-DE')} Wörter · Grundlagen bis C2/Native und Fachsprache`;
  const sub=$('#subcats');sub.innerHTML='';const children=n?(n.children||[]):topicRoots;
  for(const c of children.slice(0,60)){
    const cw=dedupe(collectWords(c,[])); const levels=new Set(cw.map(w=>w.level));
    const card=document.createElement('button');card.className='topic-card';
    card.innerHTML=`<span class="topic-card-icon">${(c.children||[]).length?'▦':'Aa'}</span><span><strong>${esc(c.name)}</strong><small>${cw.length.toLocaleString('de-DE')} Wörter · ${[...levels].sort((a,b)=>(LEVEL_ORDER[a]||99)-(LEVEL_ORDER[b]||99)).join('–')}</small></span><span class="arrow">→</span>`;
    card.onclick=()=>{selectedPath=[...selectedPath,c.name];for(let i=1;i<selectedPath.length;i++)expandedPaths.add(pathKey(selectedPath.slice(0,i)));renderTopics();};sub.appendChild(card);
  }
  renderWords(); fillParentSelect();
}

function filteredWords(){
  let w=currentWords(); const q=$('#wordSearch').value.trim().toLowerCase(),lvl=$('#levelFilter').value,imp=$('#importanceFilter').value,have=learningSet();
  if(q)w=w.filter(x=>(`${x.en} ${x.de}`).toLowerCase().includes(q));
  if(lvl)w=w.filter(x=>x.level===lvl);
  if(imp)w=w.filter(x=>wordImportance(x)===Number(imp));
  if($('#missingOnly').checked)w=w.filter(x=>!have.has(uid(x)));
  return sortWords(w);
}
function updateTopicSelectionButton(words=filteredWords()){
  const keys=words.map(uid), all=keys.length>0&&keys.every(k=>topicSelected.has(k));
  $('#toggleTopicSelection').textContent=all?'Sichtbare abwählen':'Sichtbare markieren';
  $('#topicSelectionInfo').textContent=`${topicSelected.size} markiert · ${words.length.toLocaleString('de-DE')} sichtbar`;
}
function renderWords(){
  const box=$('#wordTable'),words=filteredWords(),have=learningSet();
  box.innerHTML='<div class="wrow head"><div></div><div>#</div><div>Englisch</div><div>Deutsch</div><div>Level</div><div>Priorität</div><div>Aktion</div></div>';
  if(!words.length){box.insertAdjacentHTML('beforeend','<div class="empty">Keine passenden Wörter.</div>');updateTopicSelectionButton(words);return;}
  const f=document.createDocumentFragment(); words.slice(0,6000).forEach((w,i)=>{
    const r=document.createElement('div');r.className='wrow';const key=uid(w),added=have.has(key),imp=wordImportance(w);
    r.innerHTML=`<div><input class="check topic-check" type="checkbox" ${topicSelected.has(key)?'checked':''}></div><div>${i+1}</div><div class="en">${esc(w.en)}</div><div class="de">${esc(w.de)}</div><div><span class="badge ${w.level||''}">${w.level==='C2'?'C2★':esc(w.level||'—')}</span></div><div><span class="priority p${imp}">${imp}/5</span></div><div><button class="btn small ${added?'':'primary'}">${added?'✓ gespeichert':'＋ Liste'}</button></div>`;
    r.querySelector('.topic-check').onchange=e=>{e.target.checked?topicSelected.add(key):topicSelected.delete(key);updateTopicSelectionButton(words);};
    r.querySelector('button.btn').onclick=()=>{if(!requireLogin())return;if(added){removeWordsByKeys([key]);renderWords();renderLearning();toast('Wort aus Liste entfernt');}else addWords([w]);}; f.appendChild(r);
  });box.appendChild(f);updateTopicSelectionButton(words);
}
['wordSearch','levelFilter','importanceFilter','missingOnly'].forEach(id=>$('#'+id).addEventListener(id==='wordSearch'?'input':'change',renderWords));
$('#toggleTopicSelection').onclick=()=>{const words=filteredWords(),keys=words.map(uid),all=keys.length&&keys.every(k=>topicSelected.has(k));for(const k of keys)all?topicSelected.delete(k):topicSelected.add(k);renderWords();};
$('#addSelectedTopic').onclick=()=>{const map=new Map(currentWords().map(w=>[uid(w),w]));addWords([...topicSelected].map(k=>map.get(k)).filter(Boolean));topicSelected.clear();renderWords();};
$('#addAllTopic').onclick=()=>addWords(filteredWords());

function filteredLearning(){
  let rows=state.learning;const q=$('#learnSearch').value.trim().toLowerCase(),lvl=$('#learnLevelFilter').value,imp=$('#learnImportanceFilter').value;
  if(q)rows=rows.filter(w=>(`${w.en} ${w.de}`).toLowerCase().includes(q));if(lvl)rows=rows.filter(w=>w.level===lvl);if(imp)rows=rows.filter(w=>wordImportance(w)===Number(imp));return sortWords(rows);
}
function updateLearnSelectionInfo(rows=filteredLearning()){
  const keys=rows.map(uid),all=keys.length>0&&keys.every(k=>learnSelected.has(k));$('#selectAllLearn').textContent=all?'Alles abwählen':'Alle markieren';$('#learnSelectionInfo').textContent=`${learnSelected.size} markiert · ${state.learning.length.toLocaleString('de-DE')} gespeichert`;
}
function renderLearning(){
  const rows=filteredLearning(),box=$('#learningTable');box.innerHTML='<div class="wrow head"><div></div><div>#</div><div>Englisch</div><div>Deutsch</div><div>Level</div><div>Priorität</div><div>Aktion</div></div>';
  if(!user){box.insertAdjacentHTML('beforeend','<div class="empty">Melde dich an, damit deine Lernliste auf allen Geräten synchronisiert wird.</div>');updateLearnSelectionInfo([]);return;}
  if(!rows.length){box.insertAdjacentHTML('beforeend','<div class="empty">Noch keine passenden Wörter gespeichert.</div>');updateLearnSelectionInfo(rows);return;}
  const f=document.createDocumentFragment(); rows.forEach((w,i)=>{const key=uid(w),imp=wordImportance(w);const r=document.createElement('div');r.className='wrow';r.innerHTML=`<div><input class="check" type="checkbox" ${learnSelected.has(key)?'checked':''}></div><div>${i+1}</div><div class="en">${esc(w.en)}</div><div class="de">${esc(w.de)}</div><div><span class="badge ${w.level||''}">${w.level==='C2'?'C2★':esc(w.level||'—')}</span></div><div><span class="priority p${imp}">${imp}/5</span></div><div><button class="btn danger small">Löschen</button></div>`;r.querySelector('input').onchange=e=>{e.target.checked?learnSelected.add(key):learnSelected.delete(key);updateLearnSelectionInfo(rows);};r.querySelector('button').onclick=()=>{removeWordsByKeys([key]);learnSelected.delete(key);renderLearning();renderWords();toast('Wort gelöscht');};f.appendChild(r);});box.appendChild(f);updateLearnSelectionInfo(rows);
}
['learnSearch','learnLevelFilter','learnImportanceFilter'].forEach(id=>$('#'+id).addEventListener(id==='learnSearch'?'input':'change',renderLearning));
$('#selectAllLearn').onclick=()=>{const rows=filteredLearning(),keys=rows.map(uid),all=keys.length&&keys.every(k=>learnSelected.has(k));for(const k of keys)all?learnSelected.delete(k):learnSelected.add(k);renderLearning();};
$('#deleteSelectedLearn').onclick=()=>{if(!learnSelected.size)return toast('Keine Wörter markiert');if(confirm(`${learnSelected.size} markierte Wörter löschen?`)){removeWordsByKeys(learnSelected);learnSelected.clear();renderLearning();renderWords();toast('Markierte Wörter gelöscht');}};
$('#deleteAllLearn').onclick=()=>{if(state.learning.length&&confirm(`Wirklich alle ${state.learning.length} Wörter löschen?`)){state.learning=[];state.mastery={};learnSelected.clear();scheduleSync();renderLearning();renderWords();toast('Lernliste geleert');}};
$('#practiceSelected').onclick=()=>{if(!learnSelected.size)return toast('Markiere zuerst Wörter.');practiceOverride=state.learning.filter(w=>learnSelected.has(uid(w)));switchView('practice');};
$('#exportLearn').onclick=()=>{const csv='English,Deutsch,Level,Wichtigkeit\n'+state.learning.map(w=>[w.en,w.de,w.level,wordImportance(w)].map(x=>'"'+String(x||'').replaceAll('"','""')+'"').join(',')).join('\n');downloadBlob(new Blob([csv],{type:'text/csv;charset=utf-8'}),'vocabfast-meine-woerter.csv');};
function downloadBlob(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1200);}

function practicePool(){
  let pool=practiceOverride?.length?practiceOverride:state.learning;const lvl=$('#practiceLevel').value;if(lvl)pool=pool.filter(w=>w.level===lvl);return dedupe(pool);
}
function normalizeAnswer(s){return String(s||'').trim().toLowerCase().replace(/[.,;:!?()]/g,'').replace(/\s+/g,' ');}
function practiceDistractors(correct,pool,field){return shuffle(pool.filter(w=>uid(w)!==uid(correct)).map(w=>w[field]).filter(Boolean)).filter((x,i,a)=>a.indexOf(x)===i).slice(0,3);}
function scorePractice(isCorrect,key){
  state.stats.vocabAnswered=(state.stats.vocabAnswered||0)+1;practiceAnswered++;
  if(isCorrect){state.stats.vocabCorrect=(state.stats.vocabCorrect||0)+1;practiceCorrect++;state.mastery[key]=Math.min(10,(state.mastery[key]||0)+1);addXp(8);}else{state.mastery[key]=Math.max(0,(state.mastery[key]||0)-1);recordStudy();scheduleSync();}
  $('#practiceRoundScore').textContent=`${practiceCorrect} / ${practiceAnswered}`;renderProgress();
}
function makePracticeRound(){
  const box=$('#practiceBox');practiceCorrect=0;practiceAnswered=0;$('#practiceRoundScore').textContent='0 / 0';
  if(!user){box.innerHTML='<div class="empty">Melde dich an, um deine gespeicherten Wörter zu üben und Fortschritt zu synchronisieren.</div>';return;}
  let pool=practicePool();if(!pool.length){box.innerHTML='<div class="empty">Deine Lernliste enthält für diese Auswahl noch keine Wörter. Füge zuerst Wörter aus den Themen oder einem PDF hinzu.</div>';return;}
  $('#practiceSource').textContent=practiceOverride?.length?`${practiceOverride.length} markierte Wörter`:`Meine Wörter (${pool.length})`;
  const qs=shuffle(pool).slice(0,10);box.innerHTML='';
  qs.forEach((w,i)=>{
    let mode=$('#practiceMode').value;if(mode==='mixed')mode=Math.random()<.45?'en-de':Math.random()<.82?'de-en':'typing';
    const q=document.createElement('div');q.className='question';const key=uid(w);let prompt,answer,field;
    if(mode==='de-en'){prompt=w.de;answer=w.en;field='en';}else if(mode==='typing'){const flip=Math.random()<.5;prompt=flip?w.de:w.en;answer=flip?w.en:w.de;field=flip?'en':'de';}else{prompt=w.en;answer=w.de;field='de';}
    q.innerHTML=`<div class="qmeta"><span>Frage ${i+1}</span><span class="badge ${w.level||''}">${w.level||'—'}</span><span class="priority p${wordImportance(w)}">${wordImportance(w)}/5</span></div><h3>${esc(prompt)}</h3><div class="answer-zone"></div><div class="explain"></div>`;
    const zone=q.querySelector('.answer-zone');let answered=false;
    if(mode==='typing'){
      zone.innerHTML='<input class="typing-answer" placeholder="Antwort eingeben …"><button class="btn primary">Prüfen</button>';
      const check=()=>{if(answered)return;answered=true;const val=zone.querySelector('input').value,isCorrect=normalizeAnswer(val)===normalizeAnswer(answer);zone.querySelector('input').classList.add(isCorrect?'correct-input':'wrong-input');q.querySelector('.explain').innerHTML=isCorrect?'✓ Richtig':`Richtig wäre: <strong>${esc(answer)}</strong>`;scorePractice(isCorrect,key);};zone.querySelector('button').onclick=check;zone.querySelector('input').onkeydown=e=>{if(e.key==='Enter')check();};
    }else{
      let opts=practiceDistractors(w,pool,field);if(opts.length<3){const global=dedupe(topicRoots.flatMap(n=>collectWords(n,[])));opts=[...opts,...practiceDistractors(w,global,field)].filter((x,j,a)=>a.indexOf(x)===j).slice(0,3);}opts=shuffle([answer,...opts]);
      for(const op of opts){const b=document.createElement('button');b.className='btn option';b.textContent=op;b.onclick=()=>{if(answered)return;answered=true;$$('button',zone).forEach(x=>x.disabled=true);const ok=op===answer;b.classList.add(ok?'correct':'wrong');if(!ok)$$('button',zone).find(x=>x.textContent===answer)?.classList.add('correct');q.querySelector('.explain').textContent=ok?'✓ Richtig':`Richtig: ${answer}`;scorePractice(ok,key);};zone.appendChild(b);}
    }
    box.appendChild(q);
  });
}
$('#newPractice').onclick=()=>{practiceOverride=null;makePracticeRound();};$('#practiceMode').onchange=makePracticeRound;$('#practiceLevel').onchange=makePracticeRound;

async function renderPdfLibrary(){
  const box=$('#pdfLibrary');box.innerHTML='';
  if(!user){box.innerHTML='<div class="empty">Melde dich an, um PDFs dauerhaft in deinem VocabFast-Konto zu speichern.</div>';pdfList=[];updatePdfSelectionButton();return;}
  try{pdfList=await api('/pdfs');}catch(err){box.innerHTML=`<div class="empty error-text">PDF-Bibliothek konnte nicht geladen werden: ${esc(err.message)}</div>`;return;}
  if(!pdfList.length){box.innerHTML='<div class="empty">Noch keine PDFs gespeichert. Deine Uploads werden nach dem Hochladen mit deinem Konto verknüpft.</div>';updatePdfSelectionButton();return;}
  for(const p of pdfList){const card=document.createElement('div');card.className='pdf-card';card.innerHTML=`<input class="check pdfselect" type="checkbox" ${pdfLibrarySelected.has(p.id)?'checked':''}><div class="pdf-icon">PDF</div><div class="pdf-copy"><h3>${esc(p.name)}</h3><div class="muted">${new Date(p.created).toLocaleString('de-DE')} · ${(p.size/1024/1024).toFixed(1)} MB${p.context?' · '+esc(p.context):''}</div></div><div class="actions wrap"><button class="btn analyze">Wörter anzeigen</button><button class="btn danger del">Löschen</button></div>`;card.querySelector('.pdfselect').onchange=e=>{e.target.checked?pdfLibrarySelected.add(p.id):pdfLibrarySelected.delete(p.id);updatePdfSelectionButton();};card.querySelector('.analyze').onclick=()=>analyzePdf(p);card.querySelector('.del').onclick=async()=>{if(confirm(`„${p.name}“ löschen?`)){await api(`/pdfs/${encodeURIComponent(p.id)}`,{method:'DELETE'});pdfLibrarySelected.delete(p.id);if(activePdf?.id===p.id)closeAnalysis();await renderPdfLibrary();toast('PDF gelöscht');}};box.appendChild(card);}updatePdfSelectionButton();
}
function updatePdfSelectionButton(){const ids=pdfList.map(p=>p.id),all=ids.length&&ids.every(id=>pdfLibrarySelected.has(id));$('#selectAllPdf').textContent=all?'Alle PDFs abwählen':'Alle PDFs markieren';}
$('#selectAllPdf').onclick=()=>{const ids=pdfList.map(p=>p.id),all=ids.length&&ids.every(id=>pdfLibrarySelected.has(id));for(const id of ids)all?pdfLibrarySelected.delete(id):pdfLibrarySelected.add(id);renderPdfLibrary();};
$('#pdfInput').onchange=async e=>{
  if(!requireLogin()){e.target.value='';return;}const files=[...e.target.files];if(!files.length)return;const ctx=$('#pdfContext').value.trim();let done=0;
  try{for(const file of files){if(file.size>30*1024*1024){toast(`${file.name}: maximal 30 MB`);continue;}const fd=new FormData();fd.append('file',file);fd.append('context',ctx);await api('/pdfs',{method:'POST',body:fd});done++;state.stats.pdfUploads=(state.stats.pdfUploads||0)+1;addXp(5);}toast(`${done} PDF${done===1?'':'s'} gespeichert`);await renderPdfLibrary();}catch(err){toast(`Upload fehlgeschlagen: ${err.message}`);}finally{e.target.value='';}
};
$('#deleteSelectedPdf').onclick=async()=>{if(!pdfLibrarySelected.size)return toast('Keine PDFs markiert');if(confirm(`${pdfLibrarySelected.size} markierte PDFs löschen?`)){for(const id of [...pdfLibrarySelected])await api(`/pdfs/${encodeURIComponent(id)}`,{method:'DELETE'});pdfLibrarySelected.clear();closeAnalysis();await renderPdfLibrary();toast('Markierte PDFs gelöscht');}};
$('#deleteAllPdf').onclick=async()=>{if(pdfList.length&&confirm(`Wirklich alle ${pdfList.length} PDFs löschen?`)){await api('/pdfs',{method:'DELETE'});pdfLibrarySelected.clear();closeAnalysis();await renderPdfLibrary();toast('PDF-Bibliothek geleert');}};

const STOP=new Set(('the a an and or but if then than to of in on at by for from with without into onto as is are was were be been being have has had do does did can could may might must shall should will would not no yes this that these those it its they them their we our you your he him his she her i me my mine who whom whose which what when where why how there here all any some each every both either neither more most less least many much few several other another same own such only also very too so just about above below before after during while until between among across through per via section figure table page chapter appendix note notes warning caution procedure procedures shall').split(/\s+/));
async function loadPdfJs(){if(window._pdfjs)return window._pdfjs;const mod=await import('https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.min.mjs');mod.GlobalWorkerOptions.workerSrc='https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs';window._pdfjs=mod;return mod;}
async function analyzePdf(p){
  if(!requireLogin())return;activePdf=p;$('#pdfAnalysis').classList.remove('hidden');$('#analysisTitle').textContent=p.name;$('#analysisStatus').textContent='PDF wird gelesen …';pdfSelected.clear();pdfWords=[];renderPdfWords();
  try{const [pdfjs,res]=await Promise.all([loadPdfJs(),fetch(`/api/pdfs/${encodeURIComponent(p.id)}/file`,{credentials:'same-origin'})]);if(!res.ok)throw new Error('PDF konnte nicht geladen werden');const buf=await res.arrayBuffer();const doc=await pdfjs.getDocument({data:buf}).promise;let text='';for(let i=1;i<=doc.numPages;i++){const pg=await doc.getPage(i),ct=await pg.getTextContent();text+=' '+ct.items.map(x=>x.str).join(' ');$('#analysisStatus').textContent=`Seite ${i}/${doc.numPages} gelesen …`;}const counts=new Map();for(const raw of text.match(/[A-Za-z][A-Za-z'-]{1,40}/g)||[]){const w=raw.toLowerCase().replace(/^['-]+|['-]+$/g,'');if(w.length<2||STOP.has(w)||/^\d/.test(w))continue;counts.set(w,(counts.get(w)||0)+1);}pdfWords=[...counts].sort((a,b)=>b[1]-a[1]).slice(0,3000).map(([word,count])=>({word,count}));$('#analysisStatus').textContent=`${pdfWords.length.toLocaleString('de-DE')} unterschiedliche englische Wörter erkannt. Anklicken zum Markieren.`;renderPdfWords();$('#pdfAnalysis').scrollIntoView({behavior:'smooth',block:'start'});}catch(err){console.error(err);$('#analysisStatus').textContent='PDF konnte nicht gelesen werden. Text-PDFs funktionieren direkt; Scan-PDFs benötigen OCR.';}
}
function knownWordMap(){const m=new Map();for(const n of topicRoots)for(const w of collectWords(n,[]))if(!m.has(w.en.toLowerCase()))m.set(w.en.toLowerCase(),w);return m;}
function visiblePdfWords(){const q=$('#pdfWordSearch').value.trim().toLowerCase();let rows=q?pdfWords.filter(x=>x.word.includes(q)):pdfWords;const known=knownWordMap(),mode=state.settings.sort||'importance-desc';if(mode==='alpha')rows=[...rows].sort((a,b)=>a.word.localeCompare(b.word));else if(mode.startsWith('level'))rows=[...rows].sort((a,b)=>{const wa=known.get(a.word)||{level:'—'},wb=known.get(b.word)||{level:'—'};return mode==='level-asc'?(LEVEL_ORDER[wa.level]||99)-(LEVEL_ORDER[wb.level]||99):(LEVEL_ORDER[wb.level]||99)-(LEVEL_ORDER[wa.level]||99);});else rows=[...rows].sort((a,b)=>{const wa=known.get(a.word),wb=known.get(b.word);return (wb?wordImportance(wb):Math.min(5,Math.max(1,Math.ceil(Math.log10(b.count+1)*2))))-(wa?wordImportance(wa):Math.min(5,Math.max(1,Math.ceil(Math.log10(a.count+1)*2))))||b.count-a.count;});return rows;}
function renderPdfWords(){const box=$('#pdfWordCloud'),scroll=box.scrollTop,rows=visiblePdfWords(),known=knownWordMap();box.innerHTML='';for(const x of rows){const w=known.get(x.word),imp=w?wordImportance(w):Math.min(5,Math.max(1,Math.ceil(Math.log10(x.count+1)*2)));const b=document.createElement('button');b.className='chip'+(pdfSelected.has(x.word)?' selected':'');b.innerHTML=`<b>${esc(x.word)}</b><small>${x.count}× · P${imp}${w?.level?' · '+w.level:''}</small>`;b.onclick=()=>{pdfSelected.has(x.word)?pdfSelected.delete(x.word):pdfSelected.add(x.word);b.classList.toggle('selected',pdfSelected.has(x.word));updatePdfWordSelection(rows);};box.appendChild(b);}box.scrollTop=scroll;updatePdfWordSelection(rows);}
function updatePdfWordSelection(rows=visiblePdfWords()){const keys=rows.map(x=>x.word),all=keys.length&&keys.every(k=>pdfSelected.has(k));$('#selectVisiblePdfWords').textContent=all?'Sichtbare abwählen':'Sichtbare markieren';$('#addPdfWords').textContent=`${pdfSelected.size} Wörter hinzufügen`;}
$('#pdfWordSearch').oninput=renderPdfWords;$('#selectVisiblePdfWords').onclick=()=>{const rows=visiblePdfWords(),keys=rows.map(x=>x.word),all=keys.length&&keys.every(k=>pdfSelected.has(k));for(const k of keys)all?pdfSelected.delete(k):pdfSelected.add(k);renderPdfWords();};
$('#addPdfWords').onclick=()=>{const trans=knownWordMap();addWords([...pdfSelected].map(en=>trans.get(en)||{en,de:'(aus PDF – Übersetzung ergänzen)',level:'—',importance:2}));pdfSelected.clear();renderPdfWords();};
function closeAnalysis(){$('#pdfAnalysis').classList.add('hidden');activePdf=null;pdfWords=[];pdfSelected.clear();}$('#closeAnalysis').onclick=closeAnalysis;

function renderGrammar(){
  const lvl=$('#grammarLevel').value,box=$('#grammarTopics');box.innerHTML='';for(const g of GRAMMAR.filter(x=>!lvl||x.level===lvl)){
    const d=document.createElement('details');d.className='grammar-card';d.innerHTML=`<summary><span class="badge ${g.level}">${g.level==='C2'?'C2★':g.level}</span><span><strong>${esc(g.title)}</strong><small>${esc(g.use)}</small></span><span class="summary-arrow">＋</span></summary><div class="grammar-body"><div class="grammar-grid"><div><h4>Wann benutzt man es?</h4><p>${esc(g.use)}</p></div><div><h4>Form</h4><p>${esc(g.form)}</p></div><div><h4>Signalwörter / Muster</h4><div class="tag-row">${(g.signals||[]).map(x=>`<span>${esc(x)}</span>`).join('')}</div></div><div><h4>Typische Fehler</h4><ul>${(g.pitfalls||[]).map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div></div><h4>Beispiele</h4><div class="example-list">${(g.examples||[]).map(x=>`<code>${esc(x)}</code>`).join('')}</div><button class="btn practice-grammar">10 Fragen zu diesem Thema</button></div>`;d.querySelector('.practice-grammar').onclick=e=>{e.preventDefault();makeGrammarQuiz(g.questions.map(q=>({g,q})));document.querySelector('#grammarQuiz').scrollIntoView({behavior:'smooth'});};box.appendChild(d);
  }
}
function grammarPool(){const lvl=$('#grammarLevel').value;return GRAMMAR.filter(g=>!lvl||g.level===lvl).flatMap(g=>g.questions.map(q=>({g,q})));}
function makeGrammarQuiz(items){
  let pool=items?.length?items:grammarPool();const box=$('#grammarQuiz');box.innerHTML='';if(!pool.length){box.innerHTML='<div class="empty">Keine Übungen für diese Auswahl.</div>';return;}let qs=shuffle(pool);while(qs.length<10)qs.push(...shuffle(pool));qs=qs.slice(0,10);
  qs.forEach((x,i)=>{const [text,answer,opts,why]=x.q;const q=document.createElement('div');q.className='question';q.innerHTML=`<div class="qmeta"><span>Frage ${i+1}</span><span class="badge ${x.g.level}">${x.g.level==='C2'?'C2★':x.g.level}</span><span>${esc(x.g.title)}</span></div><h3>${esc(text)}</h3><div class="answer-zone"></div><div class="explain"></div>`;const zone=q.querySelector('.answer-zone');let answered=false;for(const op of shuffle(opts)){const b=document.createElement('button');b.className='btn option';b.textContent=op;b.onclick=()=>{if(answered)return;answered=true;$$('button',zone).forEach(z=>z.disabled=true);const ok=op===answer;b.classList.add(ok?'correct':'wrong');if(!ok)$$('button',zone).find(z=>z.textContent===answer)?.classList.add('correct');q.querySelector('.explain').innerHTML=`${ok?'✓ Richtig.':'Richtig ist: <strong>'+esc(answer)+'</strong>.'} ${esc(why)}`;if(user){state.stats.grammarAnswered=(state.stats.grammarAnswered||0)+1;if(ok){state.stats.grammarCorrect=(state.stats.grammarCorrect||0)+1;addXp(6);}else{recordStudy();scheduleSync();}renderProgress();}};zone.appendChild(b);}box.appendChild(q);});
}
$('#grammarLevel').onchange=()=>{renderGrammar();makeGrammarQuiz();};$('#newGrammarQuiz').onclick=()=>makeGrammarQuiz();

function renderProgress(){
  renderRankUi();const s=state.stats,vAcc=s.vocabAnswered?Math.round((s.vocabCorrect/s.vocabAnswered)*100):0,gAcc=s.grammarAnswered?Math.round((s.grammarCorrect/s.grammarAnswered)*100):0;
  const stats=[['Gespeicherte Wörter',state.learning.length],['Vokabel richtig',s.vocabCorrect||0],['Vokabelquote',`${vAcc}%`],['Grammatik richtig',s.grammarCorrect||0],['Grammatikquote',`${gAcc}%`],['PDF-Uploads',s.pdfUploads||0],['Lerntage',(s.studyDates||[]).length],['XP',s.xp||0]];
  $('#statsGrid').innerHTML=stats.map(([a,b])=>`<div class="stat-card"><span>${esc(a)}</span><strong>${typeof b==='number'?b.toLocaleString('de-DE'):esc(b)}</strong></div>`).join('');
  $('#achievementGrid').innerHTML=achievementData().map(([name,desc,ok])=>`<div class="achievement ${ok?'unlocked':'locked'}"><div class="medal">${ok?'★':'◇'}</div><div><strong>${esc(name)}</strong><small>${esc(desc)}</small></div></div>`).join('');
  const r=currentRank();$('#rankRoadmap').innerHTML=RANKS.map((x,i)=>`<div class="road-rank ${i<=r.idx?'reached':''} ${i===r.idx?'current':''}"><span>${esc(x[1])}</span><strong>${esc(x[0])}</strong><small>${x[2].toLocaleString('de-DE')} XP</small></div>`).join('');
}

function topicPaths(){const out=[[]];function walk(n,p){const path=[...p,n.name];out.push(path);for(const c of n.children||[])walk(c,path);}for(const n of topicRoots)walk(n,[]);return out;}
function fillParentSelect(){const s=$('#customParent');if(!s)return;const val=s.value;s.innerHTML='<option value="[]">Oberste Ebene</option>'+topicPaths().slice(1).map(p=>`<option value='${esc(JSON.stringify(p))}'>${esc(p.join(' › '))}</option>`).join('');if([...s.options].some(o=>o.value===val))s.value=val;}
$('#newTopic').onclick=()=>{if(!requireLogin())return;fillParentSelect();$('#topicDialog').showModal();};
function parseCustom(){return $('#customTopicWords').value.split(/\n+/).map(line=>{const m=line.match(/^\s*(.*?)\s*=\s*(.*?)(?:\s*\|\s*(A1|A2|B1|B2|C1|C2))?\s*$/i);return m?{en:m[1].trim(),de:m[2].trim(),level:(m[3]||'B2').toUpperCase()}:null;}).filter(Boolean);}
function keywordWords(name,parent){const text=(name+' '+parent.join(' ')).toLowerCase(),tokens=text.split(/[^a-zäöüß]+/).filter(x=>x.length>2);let scored=[];function walk(n,path=[]){const hay=(path.join(' ')+' '+n.name).toLowerCase(),score=tokens.reduce((a,t)=>a+(hay.includes(t)?2:0),0);if(score)scored.push([score,n]);for(const c of n.children||[])walk(c,[...path,n.name]);}for(const n of BUILTIN)walk(n);scored.sort((a,b)=>b[0]-a[0]);let words=[];for(const [,n] of scored.slice(0,10))words.push(...collectWords(n,[]));if(words.length<300)words.push(...dedupe(BUILTIN.flatMap(n=>collectWords(n,[]))).filter(w=>w.level==='C1'||w.level==='C2').slice(0,700));return sortWords(dedupe(words)).slice(0,1200);}
$('#autoGenerateTopic').onclick=()=>{const name=$('#customTopicName').value.trim();if(!name)return toast('Bitte zuerst einen Themennamen eingeben');const parent=JSON.parse($('#customParent').value||'[]'),w=keywordWords(name,parent);$('#customTopicWords').value=w.map(x=>`${x.en} = ${x.de} | ${x.level||'B2'}`).join('\n');toast(`${w.length} passende Wörter vorbereitet`);};
$('#saveCustomTopic').onclick=()=>{if(!requireLogin())return;const name=$('#customTopicName').value.trim();if(!name)return toast('Themenname fehlt');const parent=JSON.parse($('#customParent').value||'[]'),words=dedupe(parseCustom());state.customTopics.push({id:crypto.randomUUID(),name,parentPath:parent,words,children:[]});state.stats.customTopics=(state.stats.customTopics||0)+1;addXp(10);rebuildTopics();scheduleSync();$('#topicDialog').close();$('#customTopicName').value='';$('#customTopicWords').value='';selectedPath=[];renderTopics();renderProgress();toast(`Thema „${name}“ gespeichert`);};

function renderAccount(){
  $('#accountLoggedOut').classList.toggle('hidden',!!user);$('#accountLoggedIn').classList.toggle('hidden',!user);$('#userPill').textContent=user?(user.name||user.email.split('@')[0]):'Anmelden';
  if(user){$('#accountEmail').textContent=user.email;$('#profileName').value=user.name||'';detectLegacy();}
}
$('#loginForm').onsubmit=async e=>{e.preventDefault();try{const data=await api('/auth/login',{method:'POST',body:{email:$('#loginEmail').value,password:$('#loginPassword').value}});await afterLogin(data.user);toast('Angemeldet');switchView('topics');}catch(err){toast(err.message);}};
$('#registerForm').onsubmit=async e=>{e.preventDefault();try{const data=await api('/auth/register',{method:'POST',body:{name:$('#registerName').value,email:$('#registerEmail').value,password:$('#registerPassword').value}});await afterLogin(data.user);toast('Konto erstellt');switchView('topics');}catch(err){toast(err.message);}};
async function afterLogin(u){user=u;const data=await api('/state');state=normalizeState(data.state);rebuildTopics();$('#globalSort').value=state.settings.sort||'importance-desc';learnSelected.clear();topicSelected.clear();pdfLibrarySelected.clear();renderAll();}
$('#logout').onclick=async()=>{try{await api('/auth/logout',{method:'POST'});}catch{}user=null;state=DEFAULT_STATE();rebuildTopics();practiceOverride=null;closeAnalysis();renderAll();switchView('account');toast('Abgemeldet');};
$('#saveProfile').onclick=async()=>{if(!user)return;try{const data=await api('/profile',{method:'PUT',body:{name:$('#profileName').value.trim()}});user=data.user;renderAccount();toast('Profil gespeichert');}catch(err){toast(err.message);}};
$('#deleteAccount').onclick=async()=>{if(!user)return;const pw=$('#deletePassword').value;if(!pw)return toast('Passwort zur Bestätigung eingeben');if(!confirm('Konto, Lernstand und alle PDFs wirklich endgültig löschen?'))return;try{await api('/account',{method:'DELETE',body:{password:pw}});user=null;state=DEFAULT_STATE();rebuildTopics();pdfList=[];renderAll();switchView('account');toast('Konto wurde gelöscht');}catch(err){toast(err.message);}};

async function detectLegacy(){
  let lw=0,ct=0,pdfs=0;try{lw=JSON.parse(localStorage.getItem('vf_learning')||'[]').length||0;ct=JSON.parse(localStorage.getItem('vf_custom_topics')||'[]').length||0;}catch{}
  try{pdfs=(await legacyPdfAll()).length;}catch{}
  $('#legacyStatus').textContent=(lw||ct||pdfs)?`Gefunden: ${lw} Wörter · ${ct} eigene Themen · ${pdfs} PDFs`:'Keine alten Browserdaten auf diesem Gerät gefunden.';
}
function legacyPdfAll(){return new Promise((resolve)=>{if(!('indexedDB'in window))return resolve([]);const r=indexedDB.open('vocabfast_db');r.onerror=()=>resolve([]);r.onsuccess=()=>{const d=r.result;if(!d.objectStoreNames.contains('pdfs'))return resolve([]);const g=d.transaction('pdfs').objectStore('pdfs').getAll();g.onsuccess=()=>resolve(g.result||[]);g.onerror=()=>resolve([]);};});}
$('#importLegacy').onclick=async()=>{
  if(!user)return;let oldWords=[],oldTopics=[];try{oldWords=JSON.parse(localStorage.getItem('vf_learning')||'[]');oldTopics=JSON.parse(localStorage.getItem('vf_custom_topics')||'[]');}catch{}
  const have=learningSet();let added=0;for(const w of oldWords)if(w?.en&&!have.has(uid(w))){state.learning.push({...w,importance:wordImportance(w)});have.add(uid(w));added++;}
  if(Array.isArray(oldTopics)&&oldTopics.length)state.customTopics.push(...oldTopics);
  const oldPdfs=await legacyPdfAll();let pdfAdded=0;for(const p of oldPdfs){if(pdfList.some(x=>x.name===p.name&&x.size===p.size))continue;try{const fd=new FormData();fd.append('file',p.blob,p.name);fd.append('context',p.context||'');await api('/pdfs',{method:'POST',body:fd});pdfAdded++;}catch(err){console.warn('Legacy PDF import',err);}}
  rebuildTopics();scheduleSync();await syncState();await renderPdfLibrary();renderTopics();renderLearning();$('#legacyStatus').textContent=`Importiert: ${added} neue Wörter · ${oldTopics.length||0} Themen · ${pdfAdded} PDFs. Die alten lokalen Daten wurden zur Sicherheit nicht automatisch gelöscht.`;toast('Alt-Daten importiert');
};

$('#globalSort').onchange=()=>{state.settings.sort=$('#globalSort').value;scheduleSync();renderWords();renderLearning();if(pdfWords.length)renderPdfWords();};

function renderAll(){
  rebuildTopics();renderTopics();renderLearning();renderGrammar();renderProgress();renderAccount();renderRankUi();
}

async function init(){
  try{const me=await api('/me');user=me.user;if(user){const data=await api('/state');state=normalizeState(data.state);}else state=DEFAULT_STATE();}
  catch(err){console.error(err);user=null;state=DEFAULT_STATE();updateSyncStatus('Cloud-Synchronisierung ist noch nicht verfügbar. Prüfe das Cloudflare-Deployment.',true);}
  rebuildTopics();$('#globalSort').value=state.settings.sort||'importance-desc';renderAll();makeGrammarQuiz();
}

init();
})();
