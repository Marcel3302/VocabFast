(() => {
'use strict';
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function api(path,{method='GET',body=null}={}){const o={method,credentials:'same-origin',headers:{}};if(body!==null){o.headers['Content-Type']='application/json';o.body=JSON.stringify(body)}const r=await fetch(`/api${path}`,o);let d=null;try{d=await r.json()}catch{}if(!r.ok)throw new Error(d?.error||`Serverfehler ${r.status}`);return d}
function toast(msg){const t=$('#toast');if(!t)return alert(msg);t.textContent=msg;t.classList.add('show');clearTimeout(toast._v9);toast._v9=setTimeout(()=>t.classList.remove('show'),3000)}
function formatDate(v){const d=new Date(v);return Number.isNaN(d.getTime())?'—':d.toLocaleDateString('de-DE')}
function ascii(s){return String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue').replace(/Ä/g,'Ae').replace(/Ö/g,'Oe').replace(/Ü/g,'Ue').replace(/ß/g,'ss').replace(/[–—]/g,'-').replace(/[“”„]/g,'"').replace(/[’‘]/g,"'").replace(/[^\x20-\x7E]/g,'')}
function certId(t){return t?.certId||`VF-${ascii(t?.id||'LEGACY').replace(/[^A-Za-z0-9]/g,'').slice(0,18).toUpperCase()||'LEGACY'}`}

function cleanLegacyUi(){
  $('#grammarScoreV6')?.remove();
  const quiz=$('#grammarQuiz');if(quiz){quiz.classList.add('v9-force-hidden');const d=quiz.previousElementSibling;if(d?.classList.contains('section-divider'))d.classList.add('v9-force-hidden')}
  $('#newGrammarQuiz')?.classList.add('v9-force-hidden');
  $('#v8AdminLogin')?.remove();
  const p=$('#view-practice .hero p');if(p)p.textContent='Alle gespeicherten bzw. ausgewählten Wörter werden in einer Runde genau einmal abgefragt – je nach Einstellung zufällig gemischt oder sortiert. Richtige Antwort: nach 0,5 Sekunden automatisch weiter. Falsche Antwort: manuell weiter. Lernstufe 3 = neu, 2 = lernen, 1 = sicher.';
}
function installUnifiedAdminLogin(){
  const form=$('#loginForm'),input=$('#loginEmail');if(!form||!input||form.dataset.v9Admin==='1')return;
  form.dataset.v9Admin='1';input.type='text';input.autocomplete='username';input.placeholder='E-Mail oder Benutzername';
  const label=form.querySelector('label');if(label)label.textContent='E-Mail oder Benutzername';
  form.addEventListener('submit',async e=>{
    const identifier=input.value.trim();if(identifier.toLowerCase()!=='admin')return;
    e.preventDefault();e.stopImmediatePropagation();
    try{const d=await api('/auth/login',{method:'POST',body:{email:identifier,password:$('#loginPassword')?.value||''}});if(!d.admin)throw new Error('Administrator konnte nicht angemeldet werden.');toast('Administrator angemeldet');setTimeout(()=>location.reload(),350)}catch(err){toast(err.message)}
  },true);
}

function patchAdminRows(){
  const box=$('#v8UserList');if(!box)return;
  for(const row of $$('.v8-user-row',box)){
    if(row.dataset.v9Quick==='1')continue;row.dataset.v9Quick='1';
    const id=row.dataset.id,pro=!!row.querySelector('.v8-plan-pro'),locked=[...row.querySelectorAll('.v8-fail')].some(x=>/gesperrt/i.test(x.textContent));
    const actions=document.createElement('div');actions.className='v9-user-quick';
    actions.innerHTML=`<button class="btn v9-quick-open">Öffnen</button><button class="btn v9-quick-pro">${pro?'Pro entziehen':'Pro geben'}</button><button class="btn ${locked?'':'v8-danger'} v9-quick-lock">${locked?'Entsperren':'Sperren'}</button>`;
    row.lastElementChild?.remove();row.appendChild(actions);
    actions.querySelector('.v9-quick-open').onclick=e=>{e.stopPropagation();row.click()};
    actions.querySelector('.v9-quick-pro').onclick=async e=>{e.stopPropagation();try{await api(`/admin/users/${id}`,{method:'PUT',body:{plan:pro?'free':'pro',proUntil:null}});toast(pro?'Pro entzogen':'Pro freigeschaltet');$('#v8AdminRefresh')?.click()}catch(err){toast(err.message)}};
    actions.querySelector('.v9-quick-lock').onclick=async e=>{e.stopPropagation();try{await api(`/admin/users/${id}`,{method:'PUT',body:{disabled:!locked}});toast(locked?'Konto entsperrt':'Konto gesperrt');$('#v8AdminRefresh')?.click()}catch(err){toast(err.message)}};
  }
}

function ensureProgressCertificates(){
  const progress=$('#view-progress .panel');if(!progress||$('#v9Certificates'))return;
  const rank=$('#rankRoadmap');const wrap=document.createElement('section');wrap.id='v9Certificates';wrap.className='v9-certs-section';
  wrap.innerHTML=`<div class="v9-certs-heading"><div><div class="eyebrow">Erreichte Kompetenznachweise</div><h2>Meine Urkunden</h2><p class="muted">Bestandene VocabFast-Kompetenztests bleiben in deinem Konto gespeichert. Du kannst jede Urkunde ansehen und jederzeit erneut als PDF herunterladen.</p></div></div><div id="v9CertificateStats" class="stats-grid v9-certificate-stats"></div><div id="v9CertificateArchive" class="v9-certificate-grid"><div class="empty">Noch keine Urkunden vorhanden.</div></div>`;
  if(rank)rank.after(wrap);else progress.appendChild(wrap);
}
async function loadHistory(){const x=await api('/state');return Array.isArray(x.state?.testHistory)?x.state.testHistory:[]}
async function renderCertificateArchive(){
  ensureProgressCertificates();const box=$('#v9CertificateArchive'),stats=$('#v9CertificateStats');if(!box)return;
  try{const h=await loadHistory(),certs=h.filter(t=>t&&t.passed),best=certs.length?Math.max(...certs.map(x=>Number(x.percent)||0)):0,grammar=certs.filter(x=>x.kind==='Grammatik').length,vocab=certs.filter(x=>x.kind==='Wortschatz').length;
    if(stats)stats.innerHTML=[['Urkunden',certs.length],['Bestes Ergebnis',certs.length?`${best}%`:'—'],['Grammatik',grammar],['Wortschatz',vocab]].map(([a,b])=>`<div class="stat-card"><span>${a}</span><strong>${b}</strong></div>`).join('');
    box.innerHTML=certs.length?certs.slice(0,30).map(t=>`<article class="v9-certificate-card" data-id="${esc(t.id)}"><div class="v9-certificate-top"><span class="v9-certificate-badge">Urkunde</span><strong>${t.percent}%</strong></div><h3>${esc(t.title)}</h3><p class="muted">${esc((t.areas||[]).join(', '))||'—'}</p><div class="v9-certificate-meta"><span>${esc(t.kind||'Test')}</span><span>${formatDate(t.date)}</span><span>${esc(certId(t))}</span></div><div class="v9-cert-actions"><button class="btn v9-preview-cert">Vorschau</button><button class="btn primary v9-download-cert">PDF herunterladen</button></div></article>`).join(''):'<div class="empty">Noch keine bestandenen Tests mit Urkunde vorhanden.</div>';
    $$('.v9-certificate-card',box).forEach(card=>{const t=certs.find(x=>x.id===card.dataset.id);card.querySelector('.v9-preview-cert').onclick=()=>previewCertificate(t);card.querySelector('.v9-download-cert').onclick=()=>downloadCertificate(t)});
  }catch(e){if(stats)stats.innerHTML='';box.innerHTML='<div class="empty">Bitte anmelden, um deine Urkunden zu sehen.</div>'}
}

function ensurePreviewModal(){
  let m=$('#v9CertModal');if(m)return m;document.body.insertAdjacentHTML('beforeend',`<div id="v9CertModal" class="v9-cert-modal"><div class="v9-cert-modal-inner"><div id="v9CertPreview"></div><div class="v9-cert-modal-actions"><button class="btn" id="v9CertClose">Schließen</button><button class="btn primary" id="v9CertDownload">PDF herunterladen</button></div></div></div>`);m=$('#v9CertModal');$('#v9CertClose').onclick=()=>m.classList.remove('open');m.addEventListener('click',e=>{if(e.target===m)m.classList.remove('open')});return m
}
async function previewCertificate(t){
  if(!t?.passed)return;let name='VocabFast Nutzer';try{const me=await api('/me');name=me.user?.name||me.user?.email||name}catch{}
  const m=ensurePreviewModal(),box=$('#v9CertPreview');box.innerHTML=`<div class="v9-cert-paper"><div class="v9-cert-brand">VOCABFAST</div><div class="v9-cert-kicker">KOMPETENZURKUNDE</div><div class="v9-cert-sub">Sprachleistung und Lernfortschritt</div><div class="v9-cert-rule"></div><p>Hiermit wird bestätigt, dass</p><div class="v9-cert-name">${esc(name)}</div><p>den folgenden VocabFast-Kompetenztest mit Erfolg abgeschlossen hat</p><div class="v9-cert-title">${esc(t.title)}</div><div class="v9-cert-score"><strong>${t.percent}%</strong><span>${t.correct} von ${t.total} Antworten richtig</span></div><div class="v9-cert-areas"><strong>Tatsächlich geprüfte Bereiche</strong>${(t.areas||[]).map(a=>`<span>• ${esc(a)}</span>`).join('')}</div><div class="v9-cert-footer"><span>${formatDate(t.date)}</span><span>${esc(certId(t))}</span></div><div class="v9-cert-disclaimer">VocabFast-Kompetenzurkunde · kein staatlich oder institutionell akkreditiertes Sprachzertifikat.</div></div>`;$('#v9CertDownload').onclick=()=>downloadCertificate(t);m.classList.add('open')
}

function pdfEsc(s){return ascii(s).replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)')}
function wrap(s,max=76){const words=ascii(s).split(/\s+/),lines=[],cur=[];for(const w of words){if([...cur,w].join(' ').length>max&&cur.length){lines.push(cur.join(' '));cur.length=0}cur.push(w)}if(cur.length)lines.push(cur.join(' '));return lines}
function centerX(text,size,left=70,right=525,factor=.52){const width=ascii(text).length*size*factor;return Math.max(left,Math.min((left+right-width)/2,right-width))}
function pText(c,x,y,size,text,font='F1'){c.push(`BT /${font} ${size} Tf ${x.toFixed(1)} ${y.toFixed(1)} Td (${pdfEsc(text)}) Tj ET`)}
function pRect(c,x,y,w,h,fill=null,stroke=null,lw=1){if(fill)c.push(`${fill} rg ${x} ${y} ${w} ${h} re f`);if(stroke)c.push(`${stroke} RG ${lw} w ${x} ${y} ${w} ${h} re S`)}
function pLine(c,x1,y1,x2,y2,color='0.16 0.23 0.32 RG',w=1){c.push(`${color} ${w} w ${x1} ${y1} m ${x2} ${y2} l S`)}
function makeCertificatePdf(t,name){
  const c=[],date=formatDate(t.date),areas=(t.areas||[]).filter(Boolean),id=certId(t);pRect(c,0,0,595,842,'0.98 0.97 0.94');pRect(c,24,24,547,794,null,'0.73 0.60 0.24',3);pRect(c,36,36,523,770,null,'0.13 0.20 0.30',1.2);pRect(c,60,748,475,34,'0.90 0.97 0.88');pText(c,centerX('VOCABFAST',14),760,14,'VOCABFAST','F2');pText(c,centerX('KOMPETENZURKUNDE',28),706,28,'KOMPETENZURKUNDE','F2');pText(c,centerX('Sprachleistung und Lernfortschritt',12),684,12,'Sprachleistung und Lernfortschritt');pLine(c,170,672,425,672,'0.73 0.60 0.24 RG',1.5);pText(c,centerX('Hiermit wird bestaetigt, dass',13),645,13,'Hiermit wird bestaetigt, dass');const n=ascii(name||'VocabFast Nutzer').slice(0,60);pText(c,centerX(n,24),608,24,n,'F2');pText(c,centerX('den folgenden VocabFast-Kompetenztest mit Erfolg abgeschlossen hat',13),580,13,'den folgenden VocabFast-Kompetenztest mit Erfolg abgeschlossen hat');pRect(c,100,520,395,42,'0.11 0.18 0.26','0.11 0.18 0.26',1);pText(c,centerX(t.title,18,110,485),534,18,t.title,'F2');pRect(c,92,452,411,46,'0.95 0.93 0.86','0.73 0.60 0.24',1.2);pText(c,centerX(`${t.percent}%  -  ${t.correct}/${t.total} richtig`,22,100,494),468,22,`${t.percent}%  -  ${t.correct}/${t.total} richtig`,'F2');pText(c,centerX('BESTANDEN - Bestehensgrenze mehr als 90 Prozent',10,100,494),447,10,'BESTANDEN - Bestehensgrenze mehr als 90 Prozent','F2');pRect(c,78,176,439,246,'0.99 0.99 0.98','0.24 0.35 0.47',1);pText(c,96,398,13,'Tatsaechlich gepruefte Bereiche','F2');let y=376,overflow=false;for(const a of areas){for(const line of wrap('- '+a,60)){if(y<214){overflow=true;break}pText(c,96,y,10.5,line);y-=15}if(overflow)break}if(overflow)pText(c,96,214,10,'... weitere gepruefte Inhalte laut VocabFast-Testprotokoll');pLine(c,96,142,240,142);pLine(c,352,142,496,142);pText(c,106,128,10,'Digital bestaetigt durch VocabFast');pText(c,375,128,10,'Ausgestellt am '+date);pText(c,78,92,10,'Zertifikat-ID: '+id,'F2');pText(c,78,74,8,'Diese Urkunde dokumentiert eine bestandene VocabFast-Pruefung und ist kein staatlich akkreditiertes Sprachzertifikat.');const stream=c.join('\n'),objs=[`<< /Type /Catalog /Pages 2 0 R >>`,`<< /Type /Pages /Kids [3 0 R] /Count 1 >>`,`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>`,`<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>`,`<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>`,`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`];let out='%PDF-1.4\n',off=[0];for(let i=0;i<objs.length;i++){off.push(out.length);out+=`${i+1} 0 obj\n${objs[i]}\nendobj\n`}const xref=out.length;out+=`xref\n0 ${objs.length+1}\n0000000000 65535 f \n`;for(let i=1;i<off.length;i++)out+=`${String(off[i]).padStart(10,'0')} 00000 n \n`;out+=`trailer\n<< /Size ${objs.length+1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;return new TextEncoder().encode(out)
}
async function downloadCertificate(t){if(!t?.passed)return toast('Nur bestandene Tests besitzen eine Urkunde.');try{const me=await api('/me'),name=me.user?.name||me.user?.email||'VocabFast Nutzer',bytes=makeCertificatePdf(t,name),blob=new Blob([bytes],{type:'application/pdf'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`VocabFast_Urkunde_${ascii(t.title).replace(/[^A-Za-z0-9]+/g,'_').slice(0,50)}_${t.percent}Prozent.pdf`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1200)}catch(e){toast(`Urkunde konnte nicht erstellt werden: ${e.message}`)}}

async function patchTestHistory(){const box=$('#v8TestHistory');if(!box)return;let h=[];try{h=await loadHistory()}catch{return}for(const row of $$('.v8-history-row',box)){if(row.dataset.v9Cert==='1')continue;const title=row.querySelector('strong')?.textContent||'',pct=Number((row.querySelector('.v8-pass')?.textContent||'').replace('%',''));const t=h.find(x=>x.passed&&x.title===title&&Number(x.percent)===pct);if(!t)continue;row.dataset.v9Cert='1';const cell=row.lastElementChild||row;const actions=document.createElement('div');actions.className='v9-inline-cert-actions';actions.innerHTML='<button class="btn">Vorschau</button><button class="btn primary">Schöne PDF</button>';actions.children[0].onclick=()=>previewCertificate(t);actions.children[1].onclick=()=>downloadCertificate(t);cell.appendChild(actions)}}
async function latestPassedFromModal(){const pct=Number(($('.v8-result-score')?.textContent||'').replace('%',''));for(let i=0;i<6;i++){try{const h=await loadHistory(),t=h.find(x=>x.passed&&Number(x.percent)===pct&&Date.now()-Date.parse(x.date)<120000);if(t)return t}catch{}await new Promise(r=>setTimeout(r,250))}return null}

const observer=new MutationObserver(()=>{cleanLegacyUi();installUnifiedAdminLogin();patchAdminRows();patchTestHistory()});
window.addEventListener('load',()=>{
  cleanLegacyUi();installUnifiedAdminLogin();ensureProgressCertificates();renderCertificateArchive();observer.observe(document.body,{childList:true,subtree:true});
  document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset?.view==='practice')setTimeout(cleanLegacyUi,80);if(b.dataset?.view==='grammar')setTimeout(cleanLegacyUi,80);if(b.dataset?.view==='progress')setTimeout(renderCertificateArchive,120);if(b.dataset?.view==='test')setTimeout(patchTestHistory,180);if(/^Urkunde als PDF$/i.test(b.textContent.trim())){e.preventDefault();e.stopImmediatePropagation();latestPassedFromModal().then(t=>t?downloadCertificate(t):toast('Die Urkunde wird noch gespeichert. Bitte öffne sie gleich unter Fortschritt → Meine Urkunden.'))}},true);
});
})();
