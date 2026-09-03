(() => {
'use strict';
const nativeFetch=window.fetch.bind(window);
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=w=>`${String(w?.en||'').trim().toLowerCase()}|${String(w?.de||'').trim().toLowerCase()}`;
const stage=w=>{const n=Number(w?.learnStage??w?.stage??3);return n===1||n===2||n===3?n:3};
const LEVEL={A1:1,A2:2,B1:3,B2:4,C1:5,C2:6,'—':99};
let cloud=null,user=null,stageMap=new Map(),practiceDirty=false,selectedPracticeKeys=null,queue=[],qi=0,correct=0,answered=0;

async function api(path,opts={}){
  const o={credentials:'same-origin',...opts,headers:{...(opts.headers||{})}};
  if(o.body&&!(o.body instanceof FormData)&&typeof o.body!=='string'){o.headers['Content-Type']='application/json';o.body=JSON.stringify(o.body)}
  const r=await nativeFetch(`/api${path}`,o),type=r.headers.get('content-type')||'';let data=null;if(type.includes('json'))data=await r.json();if(!r.ok)throw new Error(data?.error||`Serverfehler ${r.status}`);return data??r;
}
async function refreshCloud(){
  try{const me=await api('/me');user=me.user;if(!user){cloud=null;stageMap.clear();return false}const x=await api('/state');cloud=x.state||{};cloud.learning=Array.isArray(cloud.learning)?cloud.learning:[];cloud.stats=cloud.stats||{};cloud.mastery=cloud.mastery||{};stageMap=new Map(cloud.learning.map(w=>[uid(w),stage(w)]));return true}catch(e){console.warn('V4 cloud refresh',e);return false}
}
async function saveCloud(){if(!user||!cloud)return;await api('/state',{method:'PUT',body:cloud})}

window.fetch=async function(input,init={}){
  try{
    const url=typeof input==='string'?input:input?.url||'';
    if(url.includes('/api/state')&&String(init?.method||'GET').toUpperCase()==='PUT'&&typeof init.body==='string'&&(stageMap.size||practiceDirty)){
      const body=JSON.parse(init.body);if(Array.isArray(body.learning))body.learning=body.learning.map(w=>({...w,learnStage:stageMap.get(uid(w))??stage(w)}));
      if(practiceDirty&&cloud){body.stats={...(body.stats||{}),...(cloud.stats||{})};body.mastery={...(body.mastery||{}),...(cloud.mastery||{})}}
      init={...init,body:JSON.stringify(body)};
    }
  }catch(e){console.warn('V4 state merge',e)}
  return nativeFetch(input,init);
};

function ensureLearningControls(){
  const bar=$('#learnSearch')?.closest('.filterbar');if(!bar)return;
  if(!$('#learnStageFilterV4')){const s=document.createElement('select');s.id='learnStageFilterV4';s.innerHTML='<option value="">Alle Lernstufen</option><option value="3">3 – neu</option><option value="2">2 – lernen</option><option value="1">1 – sicher</option>';s.onchange=applyLearningView;bar.insertBefore(s,$('#learnSelectionInfo'))}
  if(!$('#learnStageSortV4')){const s=document.createElement('select');s.id='learnStageSortV4';s.innerHTML='<option value="default">Standard-Sortierung</option><option value="3-1">Lernstufe 3 → 1</option><option value="1-3">Lernstufe 1 → 3</option>';s.onchange=applyLearningView;bar.insertBefore(s,$('#learnSelectionInfo'))}
}
async function decorateLearning(){
  const box=$('#learningTable');if(!box)return;if(!cloud)await refreshCloud();ensureLearningControls();
  const head=box.querySelector('.wrow.head');if(head&&!head.querySelector('.v4-stage-head')){const c=document.createElement('div');c.className='v4-stage-head';c.textContent='Lernstufe';head.insertBefore(c,head.children[5])}
  for(const r of [...box.querySelectorAll('.wrow:not(.head)')]){
    if(r.children.length<7||r.querySelector('.v4-stage-cell'))continue;const en=r.children[2]?.textContent.trim(),de=r.children[3]?.textContent.trim(),key=`${en.toLowerCase()}|${de.toLowerCase()}`;const w=cloud?.learning?.find(x=>uid(x)===key);const st=stageMap.get(key)??stage(w);
    const c=document.createElement('div');c.className='v4-stage-cell';c.innerHTML=`<select class="v4-stage stage-${st}"><option value="3" ${st===3?'selected':''}>3 · neu</option><option value="2" ${st===2?'selected':''}>2 · lernen</option><option value="1" ${st===1?'selected':''}>1 · sicher</option></select>`;r.insertBefore(c,r.children[5]);
    c.querySelector('select').onchange=async e=>{const n=Number(e.target.value);stageMap.set(key,n);const cw=cloud?.learning?.find(x=>uid(x)===key);if(cw)cw.learnStage=n;e.target.className=`v4-stage stage-${n}`;try{await saveCloud()}catch(err){console.warn(err)}applyLearningView()};
  }
  applyLearningView();
}
function applyLearningView(){
  const box=$('#learningTable');if(!box)return;const filter=Number($('#learnStageFilterV4')?.value||0),sort=$('#learnStageSortV4')?.value||'default',rows=[...box.querySelectorAll('.wrow:not(.head)')];
  for(const r of rows){const st=Number(r.querySelector('.v4-stage')?.value||3);r.style.display=filter&&st!==filter?'none':''}
  if(sort!=='default'){rows.sort((a,b)=>{const A=Number(a.querySelector('.v4-stage')?.value||3),B=Number(b.querySelector('.v4-stage')?.value||3);return sort==='3-1'?B-A:A-B});for(const r of rows)box.appendChild(r)}
}

function ensurePracticeControls(){
  const actions=$('#practiceMode')?.parentElement;if(!actions)return;
  if(!$('#practiceStageV4')){const s=document.createElement('select');s.id='practiceStageV4';s.innerHTML='<option value="">Alle Lernstufen</option><option value="3">Stufe 3 – neu</option><option value="2">Stufe 2 – lernen</option><option value="1">Stufe 1 – sicher</option>';actions.insertBefore(s,$('#newPractice'));s.onchange=startPractice}
  if(!$('#practiceOrderV4')){const s=document.createElement('select');s.id='practiceOrderV4';s.innerHTML='<option value="random">Zufällig gemischt</option><option value="stage">Lernstufe 3 → 1</option><option value="level">CEFR A1 → C2</option><option value="important">Wichtigkeit ↓</option><option value="alpha">Alphabetisch A → Z</option>';actions.insertBefore(s,$('#newPractice'));s.onchange=startPractice}
  const p=$('#view-practice .hero p');if(p)p.textContent='Alle passenden Wörter werden pro Runde genau einmal abgefragt. Lernstufe 3 = neu, 2 = lernen, 1 = sicher.';
}
const shuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
function importance(w){const n=Number(w?.importance);return n>=1&&n<=5?n:({A1:5,A2:5,B1:4,B2:3,C1:2,C2:2}[w?.level]||3)}
function practicePool(){let p=cloud?.learning||[];if(selectedPracticeKeys?.size)p=p.filter(w=>selectedPracticeKeys.has(uid(w)));const lvl=$('#practiceLevel')?.value,st=Number($('#practiceStageV4')?.value||0);if(lvl)p=p.filter(w=>w.level===lvl);if(st)p=p.filter(w=>stageMap.get(uid(w))===st||(!stageMap.has(uid(w))&&stage(w)===st));const ord=$('#practiceOrderV4')?.value||'random';if(ord==='random')p=shuffle(p);else if(ord==='stage')p=[...p].sort((a,b)=>(stageMap.get(uid(b))??stage(b))-(stageMap.get(uid(a))??stage(a))||a.en.localeCompare(b.en));else if(ord==='level')p=[...p].sort((a,b)=>(LEVEL[a.level]||99)-(LEVEL[b.level]||99)||a.en.localeCompare(b.en));else if(ord==='important')p=[...p].sort((a,b)=>importance(b)-importance(a)||a.en.localeCompare(b.en));else p=[...p].sort((a,b)=>a.en.localeCompare(b.en));return p}
function norm(s){return String(s||'').trim().toLowerCase().replace(/[.,;:!?()]/g,'').replace(/\s+/g,' ')}
function updateRank(){const xp=Number(cloud?.stats?.xp||0),ranks=[['Bronze III',0],['Bronze II',150],['Bronze I',350],['Silber III',650],['Silber II',1000],['Silber I',1450],['Gold III',2000],['Gold II',2700],['Gold I',3500],['Platin III',4500],['Platin II',5700],['Platin I',7100],['Diamant III',8800],['Diamant II',10800],['Diamant I',13200],['Master',16000],['Grandmaster',20000]];let name=ranks[0][0];for(const r of ranks)if(xp>=r[1])name=r[0];if($('#rankPill'))$('#rankPill').textContent=`${name} · ${xp.toLocaleString('de-DE')} XP`}
async function score(ok,w){const key=uid(w),s=cloud.stats||(cloud.stats={}),m=cloud.mastery||(cloud.mastery={});s.vocabAnswered=(s.vocabAnswered||0)+1;answered++;if(ok){s.vocabCorrect=(s.vocabCorrect||0)+1;s.xp=(s.xp||0)+8;correct++;m[key]=Math.min(10,(m[key]||0)+1);w.learnStage=Math.max(1,(stageMap.get(key)??stage(w))-1)}else{m[key]=Math.max(0,(m[key]||0)-1);w.learnStage=Math.min(3,(stageMap.get(key)??stage(w))+1)}stageMap.set(key,w.learnStage);practiceDirty=true;try{await saveCloud()}catch(e){console.warn(e)}updateRank();$('#practiceRoundScore').textContent=`${correct} richtig · ${answered}/${queue.length}`}
function renderQuestion(){
  const box=$('#practiceBox');if(!box)return;box.innerHTML='';if(qi>=queue.length){box.innerHTML=`<div class="question v4-single v4-finished"><div class="eyebrow">Runde abgeschlossen</div><h2>${correct} von ${answered} richtig</h2><p class="muted">Deine Lernstufen und dein Fortschritt wurden mit dem Konto synchronisiert.</p><button class="btn primary" id="v4Repeat">10 neue Fragen</button></div>`;$('#v4Repeat').onclick=startPractice;decorateLearning();return}
  const w=queue[qi],key=uid(w),all=cloud.learning||[];let mode=$('#practiceMode')?.value||'mixed';if(mode==='mixed')mode=Math.random()<.45?'en-de':Math.random()<.82?'de-en':'typing';let prompt,answer,field;if(mode==='de-en'){prompt=w.de;answer=w.en;field='en'}else if(mode==='typing'){const flip=Math.random()<.5;prompt=flip?w.de:w.en;answer=flip?w.en:w.de;field=flip?'en':'de'}else{prompt=w.en;answer=w.de;field='de'}
  const q=document.createElement('div');q.className='question v4-single';q.innerHTML=`<div class="qmeta"><span>Frage ${qi+1} von ${queue.length}</span><span class="badge ${w.level||''}">${esc(w.level||'—')}</span><span class="v4-stage-pill stage-${stageMap.get(key)??stage(w)}">Lernstufe ${stageMap.get(key)??stage(w)}</span></div><h3>${esc(prompt)}</h3><div class="answer-zone"></div><div class="explain"></div>`;const zone=q.querySelector('.answer-zone');let done=false;
  const finish=async ok=>{if(done)return;done=true;await score(ok,w);const b=document.createElement('button');b.className='btn primary v4-next';b.textContent=qi<queue.length-1?'Nächste Frage →':'Runde abschließen';b.onclick=()=>{qi++;renderQuestion()};q.appendChild(b)};
  if(mode==='typing'){zone.innerHTML='<input class="typing-answer" placeholder="Antwort eingeben …"><button class="btn primary">Prüfen</button>';const check=()=>{if(done)return;const val=zone.querySelector('input').value,ok=norm(val)===norm(answer);zone.querySelector('input').classList.add(ok?'correct-input':'wrong-input');q.querySelector('.explain').innerHTML=ok?'✓ Richtig':`Richtig wäre: <strong>${esc(answer)}</strong>`;finish(ok)};zone.querySelector('button').onclick=check;zone.querySelector('input').onkeydown=e=>{if(e.key==='Enter')check()}}
  else{let distract=shuffle(all.filter(x=>uid(x)!==key).map(x=>x[field]).filter(Boolean)).filter((x,i,a)=>a.indexOf(x)===i).slice(0,3),opts=shuffle([answer,...distract]);for(const op of opts){const b=document.createElement('button');b.className='btn option';b.textContent=op;b.onclick=()=>{if(done)return;$$('button',zone).forEach(x=>x.disabled=true);const ok=op===answer;b.classList.add(ok?'correct':'wrong');if(!ok)$$('button',zone).find(x=>x.textContent===answer)?.classList.add('correct');q.querySelector('.explain').textContent=ok?'✓ Richtig':`Richtig: ${answer}`;finish(ok)};zone.appendChild(b)}}box.appendChild(q)
}
async function startPractice(){ensurePracticeControls();if(!(await refreshCloud()))return;let p=practicePool();if(!p.length){$('#practiceBox').innerHTML='<div class="empty">Keine Wörter für diese Auswahl. Ändere CEFR-Level/Lernstufe oder füge Wörter hinzu.</div>';return}queue=p;qi=correct=answered=0;$('#practiceSource').textContent=selectedPracticeKeys?.size?`${selectedPracticeKeys.size} markierte Wörter`:`Meine Wörter (${cloud.learning.length})`;$('#practiceRoundScore').textContent=`0 richtig · 0/${queue.length}`;renderQuestion()}

function normalizeLegacyWord(w){if(!w||typeof w!=='object')return null;const en=String(w.en??w.english??w.word??w.front??w.term??w.e??'').trim(),de=String(w.de??w.german??w.translation??w.back??w.meaning??w.d??'').trim();if(!en||!de||en.length>160||de.length>240)return null;const l=String(w.level??w.cefr??'B1').toUpperCase();return {en,de,level:/^(A1|A2|B1|B2|C1|C2)$/.test(l)?l:'B1',importance:Number(w.importance)||undefined,learnStage:stage(w)}}
function harvest(v,out,d=0){if(d>5||v==null)return;if(Array.isArray(v)){if(v.length>25000)return;for(const w of v.map(normalizeLegacyWord).filter(Boolean))out.words.push(w);for(const x of v){if(x&&typeof x==='object'&&Array.isArray(x.words)&&(x.name||x.title)){const ws=x.words.map(normalizeLegacyWord).filter(Boolean);if(ws.length)out.topics.push({id:x.id||crypto.randomUUID(),name:String(x.name||x.title).slice(0,100),parentPath:Array.isArray(x.parentPath)?x.parentPath:[],words:ws,children:[]})}else harvest(x,out,d+1)}return}if(typeof v==='object')for(const x of Object.values(v))harvest(x,out,d+1)}
function readStore(dbName,store){return new Promise(resolve=>{try{const r=indexedDB.open(dbName);r.onerror=()=>resolve([]);r.onsuccess=()=>{const db=r.result;if(!db.objectStoreNames.contains(store)){db.close();return resolve([])}const g=db.transaction(store).objectStore(store).getAll();g.onsuccess=()=>{db.close();resolve(g.result||[])};g.onerror=()=>{db.close();resolve([])}}}catch{resolve([])}})}
async function scanLegacy(){const out={words:[],topics:[],pdfs:[],sources:[]};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);let v;try{v=JSON.parse(localStorage.getItem(k))}catch{continue}const before=out.words.length+out.topics.length;harvest(v,out);if(out.words.length+out.topics.length>before)out.sources.push(`localStorage:${k}`)}let names=['vocabfast_db'];try{if(indexedDB.databases)names.push(...(await indexedDB.databases()).map(x=>x.name).filter(Boolean))}catch{}for(const dbName of [...new Set(names)]){await new Promise(resolve=>{try{const r=indexedDB.open(dbName);r.onerror=()=>resolve();r.onsuccess=async()=>{const db=r.result,stores=[...db.objectStoreNames];db.close();for(const st of stores){const rows=await readStore(dbName,st);let used=false;for(const row of rows){const blob=row?.blob??row?.file??row?.pdf;if(blob instanceof Blob){out.pdfs.push({...row,blob,name:row.name||row.filename||'document.pdf',size:row.size||blob.size});used=true}else{const b=out.words.length+out.topics.length;harvest(row,out);if(out.words.length+out.topics.length>b)used=true}}if(used)out.sources.push(`IndexedDB:${dbName}/${st}`)}resolve()}}catch{resolve()}})}const wm=new Map();for(const w of out.words)if(!wm.has(uid(w)))wm.set(uid(w),w);out.words=[...wm.values()];return out}
let legacyCache=null;async function detectLegacyV4(){const s=$('#legacyStatus');if(!s||!user)return;s.textContent='Suche nach alten Browserdaten …';try{legacyCache=await scanLegacy();s.textContent=(legacyCache.words.length||legacyCache.topics.length||legacyCache.pdfs.length)?`Gefunden: ${legacyCache.words.length} Wörter · ${legacyCache.topics.length} Themen · ${legacyCache.pdfs.length} PDFs · ${legacyCache.sources.length} Speicherquellen`:'Keine kompatiblen alten Browserdaten auf diesem Gerät gefunden.'}catch(e){s.textContent=`Suche fehlgeschlagen: ${e.message}`}}
async function importLegacyV4(){if(!(await refreshCloud()))return;const b=$('#importLegacy'),s=$('#legacyStatus'),old=b.textContent;b.disabled=true;b.textContent='Import läuft …';try{const f=legacyCache||await scanLegacy(),have=new Set(cloud.learning.map(uid));let wa=0;for(const w of f.words)if(!have.has(uid(w))){cloud.learning.push(w);have.add(uid(w));wa++}cloud.customTopics=Array.isArray(cloud.customTopics)?cloud.customTopics:[];const tk=new Set(cloud.customTopics.map(t=>(t.name||'').toLowerCase()+'|'+(t.parentPath||[]).join('>')));let ta=0;for(const t of f.topics){const k=(t.name||'').toLowerCase()+'|'+(t.parentPath||[]).join('>');if(!tk.has(k)){cloud.customTopics.push(t);tk.add(k);ta++}}await saveCloud();let pa=0;for(const p of f.pdfs){try{const fd=new FormData();fd.append('file',p.blob,p.name||'document.pdf');fd.append('context',p.context||'Import aus alter Browser-Version');await api('/pdfs',{method:'POST',body:fd});pa++}catch(e){console.warn(e)}}s.textContent=`Import abgeschlossen: ${wa} Wörter · ${ta} Themen · ${pa} PDFs. Seite wird aktualisiert …`;setTimeout(()=>location.reload(),900)}catch(e){s.textContent=`Import fehlgeschlagen: ${e.message}`}finally{b.disabled=false;b.textContent=old}}

async function generateTopicV4(){const b=$('#autoGenerateTopic'),name=$('#customTopicName')?.value.trim();if(!name)return;if(!user)await refreshCloud();const parent=(()=>{try{return JSON.parse($('#customParent')?.value||'[]')}catch{return []}})(),old=b.textContent;b.disabled=true;b.textContent='⚡ Fachwörter werden erstellt …';try{const data=await api('/topics/generate',{method:'POST',body:{name,parent,count:140}}),words=Array.isArray(data.words)?data.words:[];if(!words.length)throw new Error('Keine Fachwörter erhalten.');$('#customTopicWords').value=words.map(w=>`${w.en} = ${w.de} | ${w.level||'B2'}`).join('\n');b.textContent=`✓ ${words.length} Fachwörter erstellt`;setTimeout(()=>b.textContent=old,1800)}catch(e){alert(`Automatische Fachwort-Erstellung: ${e.message}`);b.textContent=old}finally{b.disabled=false}}

function patchProgress(){if(!cloud)return;const s=cloud.stats||{},v=s.vocabAnswered?Math.round((s.vocabCorrect||0)/s.vocabAnswered*100):0,g=s.grammarAnswered?Math.round((s.grammarCorrect||0)/s.grammarAnswered*100):0,grid=$('#statsGrid');if(grid)grid.innerHTML=[['Gespeicherte Wörter',cloud.learning?.length||0],['Vokabel richtig',s.vocabCorrect||0],['Vokabelquote',v+'%'],['Grammatik richtig',s.grammarCorrect||0],['Grammatikquote',g+'%'],['PDF-Uploads',s.pdfUploads||0],['Lerntage',(s.studyDates||[]).length],['XP',s.xp||0]].map(([a,b])=>`<div class="stat-card"><span>${a}</span><strong>${typeof b==='number'?b.toLocaleString('de-DE'):b}</strong></div>`).join('');updateRank()}

window.addEventListener('load',async()=>{
  ensureLearningControls();ensurePracticeControls();await refreshCloud();decorateLearning();if(user)detectLegacyV4();
  const lt=$('#learningTable');if(lt)new MutationObserver(()=>setTimeout(async()=>{await refreshCloud();decorateLearning()},80)).observe(lt,{childList:true,subtree:false});
  document.addEventListener('click',e=>{
    const t=e.target.closest('button');if(!t)return;
    if(t.id==='practiceSelected'){selectedPracticeKeys=new Set($$('#learningTable .wrow:not(.head)').filter(r=>r.querySelector('input[type=checkbox]')?.checked).map(r=>`${r.children[2]?.textContent.trim().toLowerCase()}|${r.children[3]?.textContent.trim().toLowerCase()}`));setTimeout(startPractice,80)}
    else if(t.dataset?.view==='practice'){if(t.id!=='practiceSelected')selectedPracticeKeys=null;setTimeout(startPractice,80)}
    else if(t.dataset?.view==='progress')setTimeout(async()=>{await refreshCloud();patchProgress()},80);
    else if(t.dataset?.view==='account')setTimeout(async()=>{await refreshCloud();if(user)detectLegacyV4()},150);
  });
  // V12: practice controls are owned exclusively by practice-grammar-v6.js.
  $('#autoGenerateTopic')?.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();generateTopicV4()},true);
  $('#importLegacy')?.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();importLegacyV4()},true);
});
})();
