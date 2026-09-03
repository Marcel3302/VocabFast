import workerV6 from './worker-v6.js';

const USER_COOKIE='vf_session';
const PRIMARY_MODEL='@cf/google/gemma-4-26b-a4b-it';
const FALLBACK_MODEL='@cf/zai-org/glm-4.7-flash';
const enc=new TextEncoder();

function json(data,status=200,headers={}){return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-VocabFast-API':'vocabfast-v7-grammar-fix',...headers}})}
function clean(v,max=400){return String(v??'').trim().replace(/\s+/g,' ').slice(0,max)}
function cookies(req){const out={};for(const p of (req.headers.get('Cookie')||'').split(';')){const i=p.indexOf('=');if(i>0)out[p.slice(0,i).trim()]=decodeURIComponent(p.slice(i+1).trim())}return out}
async function sha(v){const b=new Uint8Array(await crypto.subtle.digest('SHA-256',enc.encode(String(v))));return [...b].map(x=>x.toString(16).padStart(2,'0')).join('')}
function bucket(env){if(!env?.PDFS?.get||!env?.PDFS?.put)throw Object.assign(new Error('R2 ist nicht verbunden.'),{status:503});return env.PDFS}
async function getJson(b,k){const o=await b.get(k);if(!o)return null;try{return JSON.parse(await o.text())}catch{return null}}
async function putJson(b,k,v){await b.put(k,JSON.stringify(v),{httpMetadata:{contentType:'application/json; charset=utf-8'}})}
function effectivePlan(p){if(p?.plan!=='pro')return 'free';if(!p.proUntil)return 'pro';const t=Date.parse(p.proUntil);return Number.isFinite(t)&&t>Date.now()?'pro':'free'}
async function currentUser(req,env){const raw=cookies(req)[USER_COOKIE];if(!raw)return null;const dot=raw.indexOf('.');if(dot<1)return null;const id=raw.slice(0,dot),token=raw.slice(dot+1);if(!id||token.length<20)return null;const b=bucket(env),s=await getJson(b,`accounts/sessions/${id}/${await sha(token)}.json`);if(!s||Number(s.expiresAt)<=Date.now())return null;const profile=await getJson(b,`accounts/profiles/${id}.json`);return profile?{profile}:null}
async function requirePro(req,env,feature){const u=await currentUser(req,env);if(!u)throw Object.assign(new Error('Bitte zuerst anmelden.'),{status:401,code:'AUTH_REQUIRED'});if(effectivePlan(u.profile)!=='pro')throw Object.assign(new Error(`${feature} ist eine VocabFast-Pro-Funktion.`),{status:403,code:'PRO_REQUIRED'});return u}
async function body(req){try{return await req.json()}catch{return {}}}
function qnorm(v){return clean(v,500).toLowerCase().replace(/[^a-z0-9äöüß]+/gi,' ').replace(/\s+/g,' ').trim()}

function aiText(r){
  if(typeof r==='string')return r;
  const values=[r?.response,r?.result?.response,r?.text,r?.result?.text,r?.choices?.[0]?.message?.content,r?.result?.choices?.[0]?.message?.content,r?.choices?.[0]?.text,r?.result?.choices?.[0]?.text];
  for(const v of values){
    if(typeof v==='string'&&v.trim())return v;
    if(Array.isArray(v)){
      const s=v.map(x=>typeof x==='string'?x:(x?.text??x?.content??'')).join('\n').trim();
      if(s)return s;
    }
  }
  return '';
}
function extractArray(text){
  const raw=String(text||'').replace(/```(?:json)?/gi,'').replace(/```/g,'').trim();
  if(!raw)return [];
  try{const x=JSON.parse(raw);return Array.isArray(x)?x:Array.isArray(x?.questions)?x.questions:[]}catch{}
  const a=raw.indexOf('['),z=raw.lastIndexOf(']');
  if(a>=0&&z>a)try{return JSON.parse(raw.slice(a,z+1))}catch{}
  const oa=raw.indexOf('{'),oz=raw.lastIndexOf('}');
  if(oa>=0&&oz>oa)try{const x=JSON.parse(raw.slice(oa,oz+1));return Array.isArray(x?.questions)?x.questions:[]}catch{}
  return [];
}
function normalizeQ(q){
  if(!q||typeof q!=='object')return null;
  const text=clean(q.text??q.question,320),answer=clean(q.answer,160),topic=clean(q.topic,140),level=clean(q.level,3).toUpperCase(),explanation=clean(q.explanation,420);
  let options=Array.isArray(q.options)?q.options.map(x=>clean(x,160)).filter(Boolean):[];
  options=[...new Set(options)];
  if(!text||!answer||options.length<2)return null;
  const exact=options.find(x=>x===answer)||options.find(x=>x.toLocaleLowerCase('de-DE')===answer.toLocaleLowerCase('de-DE'));
  if(exact){options=options.map(x=>x===exact?answer:x)}else options=[answer,...options.filter(x=>x.toLocaleLowerCase('de-DE')!==answer.toLocaleLowerCase('de-DE'))];
  options=[...new Set(options)].slice(0,4);
  if(options.length<3)return null;
  return {text,answer,options,topic,level:/^(A1|A2|B1|B2|C1|C2)$/.test(level)?level:'B2',explanation};
}
async function runModel(env,model,prompt,temperature){
  const system='Du bist ein Generator für hochwertige Englisch-Grammatikaufgaben. Antworte ausschließlich mit gültigem JSON. Keine Markdown-Codeblöcke, keine Einleitung und kein Kommentar außerhalb des JSON.';
  const input={messages:[{role:'system',content:system},{role:'user',content:prompt}],max_completion_tokens:7000,temperature};
  if(model===PRIMARY_MODEL)input.chat_template_kwargs={enable_thinking:false};
  return await env.AI.run(model,input);
}

async function grammarTest(req,env){
  const u=await currentUser(req,env);if(!u)return json({error:'Bitte zuerst anmelden.'},401);
  if(!env.AI?.run)return json({error:'Workers AI ist für die Grammatiktests nicht verfügbar.'},503);
  const x=await body(req),areas=Array.isArray(x.areas)?x.areas.map(v=>clean(v,120)).filter(Boolean).slice(0,20):[],levels=Array.isArray(x.levels)?x.levels.map(v=>clean(v,3).toUpperCase()).filter(v=>/^(A1|A2|B1|B2|C1|C2)$/.test(v)):[],count=Math.max(5,Math.min(50,Number(x.count)||20)),practice=x.mode==='practice';
  if(!areas.length&&!levels.length)return json({error:'Bitte mindestens einen Grammatikbereich auswählen.'},400);
  if(!practice||count>10)await requirePro(req,env,count>=50?'Kompetenztests':'20-Fragen-Kapiteltests');

  const b=bucket(env),state=await getJson(b,`accounts/state/${u.profile.id}.json`)||{},historyKey=`${practice?'practice':'test'}|${areas.slice().sort().join('§')}|${levels.slice().sort().join(',')}`,stored=!practice&&Array.isArray(state.grammarQuestionHistory?.[historyKey])?state.grammarQuestionHistory[historyKey]:[],external=Array.isArray(x.exclude)?x.exclude.map(v=>clean(v,320)).filter(Boolean):[],forbidden=new Set([...stored,...external].slice(-1200).map(qnorm).filter(Boolean)),seen=new Map(),errors=[];
  const models=[PRIMARY_MODEL,PRIMARY_MODEL,PRIMARY_MODEL,FALLBACK_MODEL,FALLBACK_MODEL,FALLBACK_MODEL];

  for(let attempt=0;attempt<models.length&&seen.size<count;attempt++){
    const need=count-seen.size,ask=Math.min(32,Math.max(need+10,16)),avoid=[...forbidden,...seen.keys()].slice(-90).join(' | ').slice(-6500);
    const prompt=`Erstelle ${ask} neue, unterschiedliche Englisch-Grammatik-${practice?'Übungsfragen':'Prüfungsfragen'} für einen deutschsprachigen Lernenden. CEFR: ${levels.join(', ')||'gemischt'}. Bereiche: ${areas.join('; ')||'passende Grammatik'}. Jede Aufgabe muss einen neuen eigenständigen englischen Beispielsatz enthalten. Verwende keine bereits benutzten Sätze und keine fast identischen Varianten. Verbotene Sätze/Strukturen: ${avoid||'keine'}. Nutze abwechslungsreich Lückentext, Fehlererkennung, Satzwahl und Meaning-in-context. Antworte ausschließlich als JSON-Objekt im Format {"questions":[{"text":"...","answer":"...","options":["...","...","...","..."],"topic":"geprüfter Bereich","level":"A1|A2|B1|B2|C1|C2","explanation":"kurze Begründung"}]}. Die richtige answer muss in options enthalten sein. Alle Fragen müssen inhaltlich eindeutig lösbar sein.`;
    try{
      const r=await runModel(env,models[attempt],prompt,.35+attempt*.05),raw=aiText(r),parsed=extractArray(raw).map(normalizeQ).filter(Boolean);
      if(!raw)errors.push(`${models[attempt]}: leere AI-Antwort`);
      else if(!parsed.length)errors.push(`${models[attempt]}: Antwort nicht als Fragen-JSON lesbar`);
      for(const q of parsed){const k=qnorm(q.text);if(!k||forbidden.has(k)||seen.has(k))continue;seen.set(k,q);if(seen.size>=count)break}
    }catch(e){errors.push(`${models[attempt]}: ${clean(e?.message||e,220)}`);console.error('grammar v7 generation attempt',attempt+1,models[attempt],e)}
  }

  const questions=[...seen.values()].slice(0,count);
  if(questions.length<count)return json({error:`Es konnten nur ${questions.length} von ${count} neuen eindeutigen Fragen erzeugt werden. Bitte erneut starten.`,code:'TEST_INCOMPLETE',generated:questions.length,diagnostic:errors.slice(-3)},502);
  if(!practice){state.grammarQuestionHistory=state.grammarQuestionHistory&&typeof state.grammarQuestionHistory==='object'?state.grammarQuestionHistory:{};state.grammarQuestionHistory[historyKey]=[...(state.grammarQuestionHistory[historyKey]||[]),...questions.map(q=>q.text)].slice(-1500);await putJson(b,`accounts/state/${u.profile.id}.json`,state)}
  return json({questions,model:PRIMARY_MODEL,modelsTried:[...new Set(models.slice(0,Math.max(1,Math.ceil(count/Math.max(1,questions.length)))))],disclaimer:'CEFR-orientierte VocabFast-Aufgaben, kein offizieller externer Sprachtest.'});
}

export default {async fetch(req,env){const path=new URL(req.url).pathname;if(path==='/api/tests/grammar/generate'&&req.method==='POST'){try{return await grammarTest(req,env)}catch(e){console.error('v7 grammar error',e);return json({error:e?.message||'Interner Serverfehler.',code:e?.code},e?.status||500)}}return workerV6.fetch(req,env)}};
