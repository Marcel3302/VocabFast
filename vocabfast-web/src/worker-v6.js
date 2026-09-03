import workerV5 from './worker-v5.js';

const USER_COOKIE='vf_session';
const ADMIN_COOKIE='vf_admin';
const MODEL='@cf/google/gemma-4-26b-a4b-it';
const enc=new TextEncoder();
function json(data,status=200,headers={}){return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-VocabFast-API':'vocabfast-v6-pro-admin',...headers}})}
function clean(v,max=300){return String(v??'').trim().replace(/\s+/g,' ').slice(0,max)}
function cookies(req){const out={};for(const p of (req.headers.get('Cookie')||'').split(';')){const i=p.indexOf('=');if(i>0)out[p.slice(0,i).trim()]=decodeURIComponent(p.slice(i+1).trim())}return out}
async function sha(v){const b=new Uint8Array(await crypto.subtle.digest('SHA-256',enc.encode(String(v))));return [...b].map(x=>x.toString(16).padStart(2,'0')).join('')}
function bucket(env){if(!env?.PDFS?.get||!env?.PDFS?.put)throw Object.assign(new Error('R2 ist nicht verbunden.'),{status:503});return env.PDFS}
async function getJson(b,k){const o=await b.get(k);if(!o)return null;try{return JSON.parse(await o.text())}catch{return null}}
async function putJson(b,k,v){await b.put(k,JSON.stringify(v),{httpMetadata:{contentType:'application/json; charset=utf-8'}})}
async function listKeys(b,prefix){const out=[];let cursor;do{const page=await b.list({prefix,cursor,limit:1000});for(const x of page.objects||[])out.push(x.key);cursor=page.truncated?page.cursor:undefined}while(cursor);return out}
function effectivePlan(p){if(p?.plan!=='pro')return 'free';if(!p.proUntil)return 'pro';const t=Date.parse(p.proUntil);return Number.isFinite(t)&&t>Date.now()?'pro':'free'}
async function currentUser(req,env){const raw=cookies(req)[USER_COOKIE];if(!raw)return null;const dot=raw.indexOf('.');if(dot<1)return null;const id=raw.slice(0,dot),token=raw.slice(dot+1);if(!id||token.length<20)return null;const b=bucket(env),s=await getJson(b,`accounts/sessions/${id}/${await sha(token)}.json`);if(!s||Number(s.expiresAt)<=Date.now())return null;const profile=await getJson(b,`accounts/profiles/${id}.json`);return profile?{profile}:null}
async function requirePro(req,env,feature){const u=await currentUser(req,env);if(!u)throw Object.assign(new Error('Bitte zuerst anmelden.'),{status:401,code:'AUTH_REQUIRED'});if(effectivePlan(u.profile)!=='pro')throw Object.assign(new Error(`${feature} ist eine VocabFast-Pro-Funktion.`),{status:403,code:'PRO_REQUIRED'});return u}
async function requireAdmin(req,env){const raw=cookies(req)[ADMIN_COOKIE];if(!raw)throw Object.assign(new Error('Admin-Anmeldung erforderlich.'),{status:401});const s=await getJson(bucket(env),`admin/sessions/${await sha(raw)}.json`);if(!s||Number(s.expiresAt)<=Date.now())throw Object.assign(new Error('Admin-Anmeldung erforderlich.'),{status:401});return true}
function extractArray(text){const raw=String(text||'').replace(/```(?:json)?/gi,'').replace(/```/g,'').trim();try{const x=JSON.parse(raw);return Array.isArray(x)?x:Array.isArray(x?.questions)?x.questions:[]}catch{}const a=raw.indexOf('['),z=raw.lastIndexOf(']');if(a>=0&&z>a)try{return JSON.parse(raw.slice(a,z+1))}catch{}return []}
function normalizeQ(q){if(!q||typeof q!=='object')return null;const text=clean(q.text??q.question,280),answer=clean(q.answer,140),topic=clean(q.topic,130),level=clean(q.level,3).toUpperCase(),explanation=clean(q.explanation,340),options=Array.isArray(q.options)?q.options.map(x=>clean(x,140)).filter(Boolean):[];const unique=[...new Set(options)];if(!text||!answer||unique.length<3||!unique.includes(answer))return null;return {text,answer,options:unique.slice(0,4),topic,level:/^(A1|A2|B1|B2|C1|C2)$/.test(level)?level:'B2',explanation}}
function qnorm(v){return clean(v,350).toLowerCase().replace(/[^a-z0-9äöüß]+/gi,' ').replace(/\s+/g,' ').trim()}
async function body(req){try{return await req.json()}catch{return {}}}
async function grammarTest(req,env){
  const u=await currentUser(req,env);if(!u)return json({error:'Bitte zuerst anmelden.'},401);
  if(!env.AI?.run)return json({error:'Workers AI ist für die Grammatiktests nicht verfügbar.'},503);
  const x=await body(req),areas=Array.isArray(x.areas)?x.areas.map(v=>clean(v,120)).filter(Boolean).slice(0,20):[],levels=Array.isArray(x.levels)?x.levels.map(v=>clean(v,3).toUpperCase()).filter(v=>/^(A1|A2|B1|B2|C1|C2)$/.test(v)):[],count=Math.max(5,Math.min(50,Number(x.count)||20)),practice=x.mode==='practice';
  if(!areas.length&&!levels.length)return json({error:'Bitte mindestens einen Grammatikbereich auswählen.'},400);
  if(!practice||count>10)await requirePro(req,env,count>=50?'Kompetenztests':'20-Fragen-Kapiteltests');
  const b=bucket(env),state=await getJson(b,`accounts/state/${u.profile.id}.json`)||{},historyKey=`${practice?'practice':'test'}|${areas.slice().sort().join('§')}|${levels.slice().sort().join(',')}`,stored=!practice&&Array.isArray(state.grammarQuestionHistory?.[historyKey])?state.grammarQuestionHistory[historyKey]:[],external=Array.isArray(x.exclude)?x.exclude.map(v=>clean(v,300)).filter(Boolean):[],forbidden=new Set([...stored,...external].slice(-900).map(qnorm).filter(Boolean)),seen=new Map();
  for(let attempt=0;attempt<5&&seen.size<count;attempt++){
    const need=count-seen.size,ask=Math.min(30,Math.max(need+8,14)),avoid=[...forbidden,...seen.keys()].slice(-100).join(' | ').slice(-7000);
    const prompt=`Erstelle ${ask} neue, unterschiedliche Englisch-Grammatik-${practice?'Übungsfragen':'Prüfungsfragen'} für einen deutschsprachigen Lernenden. CEFR: ${levels.join(', ')||'gemischt'}. Bereiche: ${areas.join('; ')||'passende Grammatik'}. Jede Frage braucht einen eigenständigen neuen Beispielsatz. Keine Wiederholung, Paraphrase oder nahezu identische Satzstruktur zu: ${avoid||'keinen früheren Sätzen'}. Mischung aus Lückentext, Fehlererkennung, Satzwahl und Meaning-in-context. Gib ausschließlich ein JSON-Array zurück: [{"text":"...","answer":"...","options":["...","...","...","..."],"topic":"geprüfter Bereich","level":"A1|A2|B1|B2|C1|C2","explanation":"kurze Begründung"}]. answer muss exakt in options vorkommen.`;
    try{const r=await env.AI.run(MODEL,{prompt,max_completion_tokens:10000,temperature:.42+attempt*.06});for(const q of extractArray(r?.response??r?.result?.response??r?.text).map(normalizeQ).filter(Boolean)){const k=qnorm(q.text);if(!k||forbidden.has(k)||seen.has(k))continue;seen.set(k,q);if(seen.size>=count)break}}catch(e){console.error('grammar generation attempt',attempt+1,e)}
  }
  const questions=[...seen.values()].slice(0,count);if(questions.length<count)return json({error:`Es konnten nur ${questions.length} von ${count} neuen eindeutigen Fragen erzeugt werden. Bitte erneut starten.`,code:'TEST_INCOMPLETE',generated:questions.length},502);
  if(!practice){state.grammarQuestionHistory=state.grammarQuestionHistory&&typeof state.grammarQuestionHistory==='object'?state.grammarQuestionHistory:{};state.grammarQuestionHistory[historyKey]=[...(state.grammarQuestionHistory[historyKey]||[]),...questions.map(q=>q.text)].slice(-1000);await putJson(b,`accounts/state/${u.profile.id}.json`,state)}
  return json({questions,model:MODEL,disclaimer:'CEFR-orientierte VocabFast-Aufgaben, kein offizieller externer Sprachtest.'});
}
async function adminPdfs(req,env,id,pdfId){await requireAdmin(req,env);const b=bucket(env);if(!pdfId&&req.method==='GET'){const rows=[];for(const k of await listKeys(b,`pdfmeta/${id}/`)){const m=await getJson(b,k);if(m)rows.push(m)}rows.sort((a,z)=>Number(z.created||0)-Number(a.created||0));return json({pdfs:rows})}if(!pdfId&&req.method==='DELETE'){const keys=[...(await listKeys(b,`pdfmeta/${id}/`)),...(await listKeys(b,`pdfs/${id}/`))];if(keys.length)await b.delete(keys);return json({ok:true,deleted:keys.length})}if(pdfId&&req.method==='DELETE'){await b.delete([`pdfmeta/${id}/${pdfId}.json`,`pdfs/${id}/${pdfId}.pdf`]);return json({ok:true})}if(pdfId&&req.method==='GET'&&new URL(req.url).pathname.endsWith('/file')){const meta=await getJson(b,`pdfmeta/${id}/${pdfId}.json`),obj=await b.get(`pdfs/${id}/${pdfId}.pdf`);if(!obj)return json({error:'PDF nicht gefunden.'},404);return new Response(obj.body,{headers:{'Content-Type':'application/pdf','Content-Disposition':`attachment; filename*=UTF-8''${encodeURIComponent(meta?.name||'document.pdf')}`,'Cache-Control':'private, no-store'}})}return json({error:'Nicht unterstützt.'},405)}

export default {async fetch(req,env){const path=new URL(req.url).pathname;try{
  const ap=path.match(/^\/api\/admin\/users\/([^/]+)\/pdfs(?:\/([^/]+)(?:\/file)?)?$/);if(ap)return await adminPdfs(req,env,decodeURIComponent(ap[1]),ap[2]?decodeURIComponent(ap[2]):null);
  if(path==='/api/tests/grammar/generate'&&req.method==='POST')return await grammarTest(req,env);
  if(path==='/api/topics/generate'&&req.method==='POST'){await requirePro(req,env,'Automatische Fachwort-Erstellung');return workerV5.fetch(req,env)}
  if(path==='/api/pdfs'&&req.method==='POST'){await requirePro(req,env,'PDF-Upload und PDF-Analyse');return workerV5.fetch(req,env)}
  if(/^\/api\/pdfs\/[^/]+\/file$/.test(path)&&req.method==='GET'){await requirePro(req,env,'PDF-Analyse');return workerV5.fetch(req,env)}
  return workerV5.fetch(req,env);
}catch(e){console.error('v6 error',e);return json({error:e?.message||'Interner Serverfehler.',code:e?.code},e?.status||500)}}};
