(() => {
'use strict';
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=w=>`${String(w?.en||'').trim().toLowerCase()}|${String(w?.de||'').trim().toLowerCase()}`;
const norm=s=>String(s||'').trim().toLowerCase().replace(/[.,;:!?()]/g,'').replace(/\s+/g,' ');
const stage=w=>{const n=Number(w?.learnStage??w?.stage??3);return [1,2,3].includes(n)?n:3};
const levelOrder={A1:1,A2:2,B1:3,B2:4,C1:5,C2:6,'—':99};
const shuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const importance=w=>{const n=Number(w?.importance);return n>=1&&n<=5?n:({A1:5,A2:5,B1:4,B2:3,C1:2,C2:2}[w?.level]||3)};
let state=null,queue=[],index=0,correct=0,answered=0,selectedKeys=null,advanceTimer=null,active=false;

async function api(path,opts={}){
  const o={credentials:'same-origin',...opts,headers:{...(opts.headers||{})}};
  if(o.body&&typeof o.body!=='string'&&!(o.body instanceof FormData)){o.headers['Content-Type']='application/json';o.body=JSON.stringify(o.body)}
  const r=await fetch(`/api${path}`,o),type=r.headers.get('content-type')||'';const data=type.includes('json')?await r.json():null;
  if(!r.ok)throw new Error(data?.error||`Serverfehler ${r.status}`);return data??r;
}
async function loadState(){const me=await api('/me');if(!me.user)throw new Error('Bitte zuerst anmelden.');const x=await api('/state');state=x.state||{};state.learning=Array.isArray(state.learning)?state.learning:[];state.stats=state.stats||{};state.mastery=state.mastery||{};return state}
async function saveState(){if(state)await api('/state',{method:'PUT',body:state})}
function replaceControl(id){const old=$('#'+id);if(!old)return null;const v=old.value,el=old.cloneNode(true);el.value=v;old.replaceWith(el);return el}
function selectedFromTable(){return new Set($$('#learningTable .wrow:not(.head)').filter(r=>r.querySelector('input[type=checkbox]')?.checked).map(r=>`${r.children[2]?.textContent.trim().toLowerCase()}|${r.children[3]?.textContent.trim().toLowerCase()}`))}
function setStopEnabled(v){const b=$('#stopPracticeV5');if(b)b.disabled=!v}
function setupControls(){
  const actions=$('#practiceMode')?.parentElement;if(!actions)return;
  for(const id of ['practiceMode','practiceLevel','practiceStageV4','practiceOrderV4','newPractice'])replaceControl(id);
  const start=$('#newPractice');if(start){start.textContent='Neue Runde starten';start.addEventListener('click',e=>{e.preventDefault();startPractice()})}
  for(const id of ['practiceMode','practiceLevel','practiceStageV4','practiceOrderV4'])$('#'+id)?.addEventListener('change',()=>startPractice());
  let stop=$('#stopPracticeV5');if(!stop){stop=document.createElement('button');stop.id='stopPracticeV5';stop.className='btn';stop.textContent='Übung beenden';actions.appendChild(stop)}
  stop.addEventListener('click',e=>{e.preventDefault();stopPractice()});setStopEnabled(false);
  const p=$('#view-practice .hero p');if(p)p.textContent='Alle ausgewählten Wörter werden pro Runde genau einmal abgefragt. Richtig = automatisch weiter. Falsch = du klickst selbst auf Weiter.';
}
function pool(){
  let p=[...(state?.learning||[])];if(selectedKeys?.size)p=p.filter(w=>selectedKeys.has(uid(w)));
  const lvl=$('#practiceLevel')?.value||'',st=Number($('#practiceStageV4')?.value||0);if(lvl)p=p.filter(w=>w.level===lvl);if(st)p=p.filter(w=>stage(w)===st);
  const order=$('#practiceOrderV4')?.value||'random';
  if(order==='random')return shuffle(p);
  if(order==='stage')return p.sort((a,b)=>stage(b)-stage(a)||a.en.localeCompare(b.en));
  if(order==='level')return p.sort((a,b)=>(levelOrder[a.level]||99)-(levelOrder[b.level]||99)||a.en.localeCompare(b.en));
  if(order==='important')return p.sort((a,b)=>importance(b)-importance(a)||a.en.localeCompare(b.en));
  return p.sort((a,b)=>a.en.localeCompare(b.en,undefined,{sensitivity:'base'}));
}
function updateScore(){const e=$('#practiceRoundScore');if(e)e.textContent=`${correct} richtig · ${answered}/${queue.length}`}
function record(ok,w){
  const k=uid(w),s=state.stats,m=state.mastery;s.vocabAnswered=(s.vocabAnswered||0)+1;answered++;
  if(ok){s.vocabCorrect=(s.vocabCorrect||0)+1;s.xp=(s.xp||0)+8;correct++;m[k]=Math.min(10,(m[k]||0)+1);w.learnStage=Math.max(1,stage(w)-1)}
  else{m[k]=Math.max(0,(m[k]||0)-1);w.learnStage=Math.min(3,stage(w)+1)}
  const day=new Date().toISOString().slice(0,10),days=new Set(s.studyDates||[]);days.add(day);s.studyDates=[...days].sort().slice(-365);updateScore();saveState().catch(console.warn)
}
function summary(title='Runde abgeschlossen'){
  clearTimeout(advanceTimer);advanceTimer=null;active=false;setStopEnabled(false);const box=$('#practiceBox');if(!box)return;
  const open=Math.max(0,queue.length-answered);box.innerHTML=`<div class="question v4-single v4-finished"><div class="eyebrow">${esc(title)}</div><h2>${correct} von ${answered} beantworteten Fragen richtig</h2><p class="muted">${open?`${open} Wörter waren noch offen.`:'Alle Wörter dieser Runde wurden genau einmal abgefragt.'}</p><button class="btn primary" id="practiceV5Restart">Neue komplette Runde starten</button></div>`;
  $('#practiceV5Restart').addEventListener('click',startPractice)
}
function stopPractice(){if(active)summary('Übung beendet')}
function next(){clearTimeout(advanceTimer);advanceTimer=null;index++;render()}
function finishAnswer(ok,w,card){record(ok,w);if(ok){card.querySelector('.explain')?.insertAdjacentHTML('beforeend',' <span class="muted">Nächste Frage …</span>');advanceTimer=setTimeout(next,650)}else{const b=document.createElement('button');b.className='btn primary v4-next';b.textContent=index<queue.length-1?'Weiter zur nächsten Frage →':'Runde abschließen';b.addEventListener('click',next);card.appendChild(b)}}
function render(){
  clearTimeout(advanceTimer);advanceTimer=null;if(index>=queue.length){summary();return}const box=$('#practiceBox');if(!box)return;box.innerHTML='';
  const w=queue[index],k=uid(w),all=state.learning||[];let mode=$('#practiceMode')?.value||'mixed';if(mode==='mixed'){const r=Math.random();mode=r<.4?'en-de':r<.8?'de-en':'typing'}
  let prompt,answer,field;if(mode==='de-en'){prompt=w.de;answer=w.en;field='en'}else if(mode==='typing'){const flip=Math.random()<.5;prompt=flip?w.de:w.en;answer=flip?w.en:w.de;field=flip?'en':'de'}else{prompt=w.en;answer=w.de;field='de'}
  const card=document.createElement('div');card.className='question v4-single';card.innerHTML=`<div class="qmeta"><span>Frage ${index+1} von ${queue.length}</span><span class="badge ${w.level||''}">${esc(w.level||'—')}</span><span class="v4-stage-pill stage-${stage(w)}">Lernstufe ${stage(w)}</span></div><h3>${esc(prompt)}</h3><div class="answer-zone"></div><div class="explain" aria-live="polite"></div>`;const zone=card.querySelector('.answer-zone');let done=false;
  if(mode==='typing'){
    zone.innerHTML='<input class="typing-answer" placeholder="Antwort eingeben …" autocomplete="off"><button class="btn primary">Prüfen</button>';const input=zone.querySelector('input'),check=()=>{if(done)return;done=true;const ok=norm(input.value)===norm(answer);input.classList.add(ok?'correct-input':'wrong-input');input.disabled=true;zone.querySelector('button').disabled=true;card.querySelector('.explain').innerHTML=ok?'✓ Richtig':`Richtig wäre: <strong>${esc(answer)}</strong>`;finishAnswer(ok,w,card)};zone.querySelector('button').addEventListener('click',check);input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();check()}});setTimeout(()=>input.focus(),0)
  }else{
    const distract=shuffle(all.filter(x=>uid(x)!==k).map(x=>x[field]).filter(Boolean)).filter((x,i,a)=>a.indexOf(x)===i).slice(0,3);for(const op of shuffle([answer,...distract])){const b=document.createElement('button');b.className='btn option';b.textContent=op;b.addEventListener('click',()=>{if(done)return;done=true;$$('button',zone).forEach(x=>x.disabled=true);const ok=op===answer;b.classList.add(ok?'correct':'wrong');if(!ok)$$('button',zone).find(x=>x.textContent===answer)?.classList.add('correct');card.querySelector('.explain').textContent=ok?'✓ Richtig':`Richtig: ${answer}`;finishAnswer(ok,w,card)});zone.appendChild(b)}
  }
  box.appendChild(card)
}
async function startPractice(){
  clearTimeout(advanceTimer);advanceTimer=null;try{await loadState()}catch(e){const box=$('#practiceBox');if(box)box.innerHTML=`<div class="empty">${esc(e.message)}</div>`;return}
  queue=pool();index=correct=answered=0;if(!queue.length){active=false;setStopEnabled(false);$('#practiceBox').innerHTML='<div class="empty">Keine Wörter für diese Auswahl.</div>';return}
  active=true;setStopEnabled(true);const source=$('#practiceSource');if(source)source.textContent=selectedKeys?.size?`${queue.length} markierte Wörter`:`Meine Wörter (${queue.length} in dieser Runde)`;updateScore();render()
}
window.addEventListener('load',()=>{
  setupControls();
  document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.id==='practiceSelected'){selectedKeys=selectedFromTable();setTimeout(startPractice,180)}else if(b.dataset?.view==='practice'){if(b.id!=='practiceSelected')selectedKeys=null;setTimeout(startPractice,180)}},false)
});
})();
