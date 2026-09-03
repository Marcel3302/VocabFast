(() => {
'use strict';
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>Number(n||0).toLocaleString('de-DE');
let users=[],activeId=null,activeTab='account',detailState=null;
async function api(path,{method='GET',body=null}={}){const o={method,credentials:'same-origin',headers:{}};if(body!==null){o.headers['Content-Type']='application/json';o.body=JSON.stringify(body)}const r=await fetch(`/api${path}`,o);let d=null;try{d=await r.json()}catch{}if(!r.ok)throw new Error(d?.error||`Serverfehler ${r.status}`);return d}
function toast(msg){const t=$('#toast');if(!t)return alert(msg);t.textContent=msg;t.classList.add('show');clearTimeout(toast._v11);toast._v11=setTimeout(()=>t.classList.remove('show'),2800)}
function acc(c,a){return Number(a)>0?Math.round(Number(c||0)/Number(a)*100):0}
function initials(name,email){const s=String(name||email||'?').trim(),p=s.split(/\s+/);return (p.length>1?p[0][0]+p[p.length-1][0]:s.slice(0,2)).toUpperCase()}
function bytes(n){n=Number(n||0);if(n<1024)return `${n} B`;if(n<1048576)return `${(n/1024).toFixed(1)} KB`;return `${(n/1048576).toFixed(1)} MB`}
function ensureShell(){const view=$('#view-admin .panel');if(!view||view.dataset.v11==='1')return false;view.dataset.v11='1';const hero=view.querySelector('.hero');if(hero){hero.classList.add('v11-admin-hero');const h=hero.querySelector('h1');if(h)h.textContent='VocabFast Verwaltung';const p=hero.querySelector('p');if(p)p.textContent='Benutzer, Lernfortschritt, Prüfungen, Pro-Zugänge und Kontohilfe übersichtlich verwalten.'}
 const layout=view.querySelector('.v8-admin-layout');if(layout)layout.classList.add('v11-admin-main');const left=layout?.firstElementChild;if(left)left.classList.add('v11-users-panel');const right=$('#v8AdminDetail');if(right)right.classList.add('v11-workspace');
 if(!$('#v11AdminStats')){const stats=document.createElement('section');stats.id='v11AdminStats';stats.className='v11-admin-stats';(view.querySelector('#v10CreateAccount')||layout)?.before(stats)}
 const search=$('#v8AdminSearch');if(search)search.placeholder='Name oder E-Mail suchen …';loadUsers();return true}
async function loadUsers(){try{const d=await api('/admin/users');users=d.users||[];renderStats();setTimeout(decorateUsers,40)}catch(e){console.warn(e)}}
function renderStats(){const pro=users.filter(u=>u.effectivePlan==='pro').length,locked=users.filter(u=>u.disabled).length,xp=users.reduce((a,u)=>a+Number(u.xp||0),0),words=users.reduce((a,u)=>a+Number(u.words||0),0);$('#v11AdminStats').innerHTML=[['Konten',users.length],['Pro',pro],['Gesperrt',locked],['Gesamt-XP',fmt(xp)],['Gespeicherte Wörter',fmt(words)]].map(([a,b])=>`<div class="v11-stat"><span>${a}</span><strong>${b}</strong></div>`).join('')}
function decorateUsers(){for(const row of $$('#v8UserList .v8-user-row')){if(row.dataset.v11==='1')continue;row.dataset.v11='1';const id=row.dataset.id,u=users.find(x=>x.id===id);if(!u)continue;row.classList.add('v11-user');const text=row.firstElementChild;if(text){text.classList.add('v11-user-copy');text.insertAdjacentHTML('afterbegin',`<span class="v11-avatar">${esc(initials(u.name,u.email))}</span>`);text.insertAdjacentHTML('beforeend',`<span class="v11-user-meta"><em class="${u.effectivePlan==='pro'?'pro':'free'}">${u.effectivePlan==='pro'?'PRO':'FREE'}</em>${u.disabled?'<em class="locked">GESPERRT</em>':''}<span>${fmt(u.words)} Wörter</span><span>${fmt(u.xp)} XP</span></span>`)}}
}
async function enhanceDetail(){const box=$('#v8AdminDetail');if(!box||!box.querySelector('#v8SaveUser'))return;const id=$('#v8UserList .v8-user-row.active')?.dataset.id;if(!id||box.dataset.v11For===id)return;box.dataset.v11For=id;activeId=id;let d;try{d=await api(`/admin/users/${id}`)}catch{return}if(activeId!==id)return;detailState=d.state||{};const p=d.profile||{},st={xp:0,vocabAnswered:0,vocabCorrect:0,grammarAnswered:0,grammarCorrect:0,studyDates:[],...(detailState.stats||{})},tests=Array.isArray(detailState.testHistory)?detailState.testHistory:[],scores=detailState.grammarTopicScores&&typeof detailState.grammarTopicScores==='object'?detailState.grammarTopicScores:{};
 const title=box.querySelector('h2');if(title){title.insertAdjacentHTML('afterend',`<div class="v11-profile-head"><div class="v11-profile-ident"><span class="v11-profile-avatar">${esc(initials(p.name,p.email))}</span><div><div class="v11-profile-title"><strong>${esc(p.email)}</strong>${p.effectivePlan==='pro'?'<span class="v11-badge pro">PRO</span>':'<span class="v11-badge">FREE</span>'}${p.disabled?'<span class="v11-badge danger">GESPERRT</span>':''}</div><div class="v11-profile-kpis"><span><strong>${fmt(st.xp)}</strong> XP</span><span><strong>${fmt((detailState.learning||[]).length)}</strong> Wörter</span><span><strong>${tests.length}</strong> Tests</span><span><strong>${tests.filter(x=>x.passed).length}</strong> Urkunden</span></div></div></div><div class="v12-xp-quick"><label>XP direkt ändern<input id="v12XpQuick" type="number" min="0" value="${Number(st.xp)||0}"></label><button class="btn primary" id="v12SaveXp">XP speichern</button></div></div>`) }
 const nav=document.createElement('nav');nav.className='v11-tabs';nav.innerHTML='<button data-v11tab="account">Konto</button><button data-v11tab="progress">Fortschritt</button><button data-v11tab="tests">Prüfungen</button><button data-v11tab="pdfs">PDFs</button><button data-v11tab="security">Sicherheit</button><button data-v11tab="advanced">Erweitert</button>';const ph=box.querySelector('.v11-profile-head');(ph||title)?.after(nav);
 markGroups(box);const testsPanel=document.createElement('section');testsPanel.className='v11-tab-panel';testsPanel.dataset.v11group='tests';testsPanel.innerHTML=testsHtml(tests,scores);nav.after(testsPanel);bindTests(testsPanel);const pdfPanel=document.createElement('section');pdfPanel.className='v11-tab-panel';pdfPanel.dataset.v11group='pdfs';pdfPanel.innerHTML='<div class="v11-card"><div class="v11-section-title"><div><h3>PDF-Bibliothek dieses Kontos</h3><p class="muted">Alle gespeicherten PDFs direkt ansehen, herunterladen oder löschen.</p></div><button class="btn v11-danger-soft" id="v12DeleteAllPdfs">Alle PDFs löschen</button></div><div id="v12AdminPdfs" class="v12-admin-pdfs"><div class="empty">PDFs werden geladen …</div></div></div>';testsPanel.after(pdfPanel);bindPdfPanel(pdfPanel,id);$('#v12SaveXp')?.addEventListener('click',()=>saveQuickXp(id));
 $$('.v11-tabs button',box).forEach(b=>b.onclick=()=>{activeTab=b.dataset.v11tab;showTab(box)});showTab(box)}
function markGroups(box){const form=box.querySelector('.v8-form-grid');if(form)form.dataset.v11group='account';const actions=form?.nextElementSibling;if(actions?.classList.contains('v8-admin-actions'))actions.dataset.v11group='account';const progress=box.querySelector('.v10-progress-editor');if(progress)progress.dataset.v11group='progress';const hrs=$$('hr',box);let passwordH=$$('h3',box).find(x=>/Kontohilfe|Passwort/i.test(x.textContent));if(passwordH){passwordH.dataset.v11group='security';let n=passwordH.nextElementSibling;while(n&&n.tagName!=='HR'){n.dataset.v11group='security';n=n.nextElementSibling}}const details=box.querySelector('details');if(details)details.dataset.v11group='advanced';const del=$('#v8DeleteUser',box);if(del)del.dataset.v11group='advanced';const status=$('#v8AdminDetailStatus',box);if(status)status.dataset.v11group=activeTab;hrs.forEach(x=>x.classList.add('v11-hide'))}
function showTab(box){$$('.v11-tabs button',box).forEach(b=>b.classList.toggle('active',b.dataset.v11tab===activeTab));$$('[data-v11group]',box).forEach(x=>x.classList.toggle('v11-tab-hidden',x.dataset.v11group!==activeTab));if(activeTab==='advanced'){const d=box.querySelector('details');if(d)d.open=false}}
async function saveQuickXp(id){
  try{
    const s=await currentState();
    s.stats=s.stats||{};
    s.stats.xp=Math.max(0,Number($('#v12XpQuick')?.value)||0);
    await api(`/admin/users/${id}/state`,{method:'PUT',body:{state:s}});
    toast('XP gespeichert');
    await loadUsers();
    const row=$(`#v8UserList .v8-user-row[data-id="${CSS.escape(id)}"]`);
    setTimeout(()=>row?.click(),120);
  }catch(e){toast(e.message)}
}
async function bindPdfPanel(panel,id){
  const box=$('#v12AdminPdfs',panel);
  async function refresh(){
    try{
      const d=await api(`/admin/users/${id}/pdfs`),rows=d.pdfs||[];
      box.innerHTML=rows.length?rows.map(p=>`<div class="v12-pdf-row" data-id="${esc(p.id)}"><div class="v12-pdf-icon">PDF</div><div class="v12-pdf-copy"><strong>${esc(p.name||'Dokument.pdf')}</strong><small>${new Date(p.created||Date.now()).toLocaleString('de-DE')} · ${bytes(p.size)}${p.context?' · '+esc(p.context):''}</small></div><button class="btn v12-pdf-download">Herunterladen</button><button class="btn v11-danger-soft v12-pdf-delete">Löschen</button></div>`).join(''):'<div class="empty">Für dieses Konto sind keine PDFs gespeichert.</div>';
      $$('.v12-pdf-download',box).forEach(btn=>btn.onclick=async()=>{
        const row=btn.closest('.v12-pdf-row'),rid=row.dataset.id;
        try{
          const r=await fetch(`/api/admin/users/${encodeURIComponent(id)}/pdfs/${encodeURIComponent(rid)}/file`,{credentials:'same-origin'});
          if(!r.ok)throw new Error((await r.json().catch(()=>null))?.error||`Serverfehler ${r.status}`);
          const blob=await r.blob(),a=document.createElement('a');
          a.href=URL.createObjectURL(blob);a.download=row.querySelector('strong').textContent||'document.pdf';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
        }catch(e){toast(e.message)}
      });
      $$('.v12-pdf-delete',box).forEach(btn=>btn.onclick=async()=>{
        const rid=btn.closest('.v12-pdf-row').dataset.id;
        if(!confirm('Diese PDF wirklich löschen?'))return;
        try{await api(`/admin/users/${id}/pdfs/${encodeURIComponent(rid)}`,{method:'DELETE'});toast('PDF gelöscht');refresh()}catch(e){toast(e.message)}
      });
    }catch(e){box.innerHTML=`<div class="empty">${esc(e.message)}</div>`}
  }
  $('#v12DeleteAllPdfs',panel).onclick=async()=>{
    if(!confirm('Wirklich ALLE PDFs dieses Kontos löschen?'))return;
    try{await api(`/admin/users/${id}/pdfs`,{method:'DELETE'});toast('PDF-Bibliothek geleert');refresh()}catch(e){toast(e.message)}
  };
  refresh();
}
function testsHtml(tests,scores){return `<div class="v11-section-title"><div><h3>Prüfungen & Kapitelbewertungen</h3><p class="muted">Ergebnisse ansehen, korrigieren oder gezielt löschen.</p></div><button class="btn v11-danger-soft" id="v11ResetTests">Alle Prüfungen & Urkunden löschen</button></div><div class="v11-split"><div class="v11-card"><h3>Prüfungen</h3><div id="v11TestList" class="v11-manage-list">${tests.length?tests.map((t,i)=>`<div class="v11-test-row" data-i="${i}"><div><strong>${esc(t.title||'Test')}</strong><small>${esc(t.kind||'Test')} · ${new Date(t.date||Date.now()).toLocaleDateString('de-DE')}</small></div><label>%<input class="v11-pct" type="number" min="0" max="100" value="${Number(t.percent)||0}"></label><label>Richtig<input class="v11-correct" type="number" min="0" value="${Number(t.correct)||0}"></label><label>Gesamt<input class="v11-total" type="number" min="1" value="${Number(t.total)||1}"></label><label><input class="v11-passed" type="checkbox" ${t.passed?'checked':''}> bestanden</label><button class="btn v11-del-test">Löschen</button></div>`).join(''):'<div class="empty">Keine Prüfungen gespeichert.</div>'}</div>${tests.length?'<button class="btn primary" id="v11SaveTests">Prüfungen speichern</button>':''}</div><div class="v11-card"><h3>Grammatik-Kapitel</h3><div class="v11-manage-list">${Object.entries(scores).length?Object.entries(scores).map(([k,v])=>`<div class="v11-score-row" data-k="${esc(k)}"><div><strong>${esc(k.split('|').slice(1).join('|')||k)}</strong><small>${esc(k.split('|')[0]||'')}</small></div><label>%<input class="v11-spct" type="number" min="0" max="100" value="${Number(v.percent)||0}"></label><button class="btn v11-del-score">Löschen</button></div>`).join(''):'<div class="empty">Keine Kapitelbewertungen.</div>'}</div>${Object.keys(scores).length?'<button class="btn primary" id="v11SaveScores">Kapitelbewertungen speichern</button>':''}</div></div>`}
function bindTests(panel){$('#v11ResetTests',panel).onclick=async()=>{if(!confirm('Alle Prüfungen und Urkunden löschen?'))return;const s=await currentState();s.testHistory=[];await saveState(s,'Prüfungen zurückgesetzt')};$('#v11SaveTests',panel)?.addEventListener('click',async()=>{const s=await currentState(),h=s.testHistory||[];$$('.v11-test-row',panel).forEach(r=>{const t=h[Number(r.dataset.i)];if(t){t.percent=Math.max(0,Math.min(100,Number($('.v11-pct',r).value)||0));t.correct=Math.max(0,Number($('.v11-correct',r).value)||0);t.total=Math.max(1,Number($('.v11-total',r).value)||1);t.passed=$('.v11-passed',r).checked}});await saveState(s,'Prüfungen gespeichert')});$$('.v11-del-test',panel).forEach(b=>b.onclick=async()=>{if(!confirm('Diese Prüfung löschen?'))return;const s=await currentState();s.testHistory.splice(Number(b.closest('.v11-test-row').dataset.i),1);await saveState(s,'Prüfung gelöscht')});$('#v11SaveScores',panel)?.addEventListener('click',async()=>{const s=await currentState(),o=s.grammarTopicScores||{};$$('.v11-score-row',panel).forEach(r=>{if(o[r.dataset.k]){o[r.dataset.k].percent=Math.max(0,Math.min(100,Number($('.v11-spct',r).value)||0));o[r.dataset.k].updatedAt=new Date().toISOString()}});s.grammarTopicScores=o;await saveState(s,'Kapitelbewertungen gespeichert')});$$('.v11-del-score',panel).forEach(b=>b.onclick=async()=>{const s=await currentState();delete s.grammarTopicScores?.[b.closest('.v11-score-row').dataset.k];await saveState(s,'Kapitelbewertung gelöscht')})}
async function currentState(){return (await api(`/admin/users/${activeId}`)).state||{}}
async function saveState(s,msg){await api(`/admin/users/${activeId}/state`,{method:'PUT',body:{state:s}});toast(msg);const row=$(`#v8UserList .v8-user-row[data-id="${CSS.escape(activeId)}"]`);setTimeout(()=>{if(row){row.click();setTimeout(()=>{activeTab='tests';enhanceDetail()},120)}},100)}
function styleCreate(){const d=$('#v10CreateAccount');if(!d||d.dataset.v11==='1')return;d.dataset.v11='1';d.classList.add('v11-create-card');const s=d.querySelector('summary');if(s)s.textContent='+ Neues Benutzerkonto anlegen'}
function tick(){ensureShell();styleCreate();decorateUsers();enhanceDetail()}
function start(){tick();const timer=setInterval(tick,500);setTimeout(()=>clearInterval(timer),20000);document.addEventListener('click',e=>{if(e.target.closest('#v8AdminNav,[data-view="admin"],#v8AdminRefresh,.v8-user-row'))setTimeout(tick,120)},true)}
window.addEventListener('load',start);
})();
