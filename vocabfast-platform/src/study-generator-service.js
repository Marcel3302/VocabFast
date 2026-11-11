const MODEL='@cf/meta/llama-3.1-8b-instruct-fast';

function json(data,status=200,headers={}){return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow, noarchive',...headers}})}
function sameOrigin(request){const origin=request.headers.get('Origin');return !origin||origin===new URL(request.url).origin;}
function clean(value,max=1800){return String(value??'').replace(/\0/g,'').trim().replace(/\s+/g,' ').slice(0,max);}
function accountStore(env){if(!env?.PREVIEW_ACCOUNTS)throw new Error('account-store-unavailable');const id=env.PREVIEW_ACCOUNTS.idFromName('global');return env.PREVIEW_ACCOUNTS.get(id);}
async function platformUser(request,env){const probe=new Request(new URL('/api/preview/me',request.url),{method:'GET',headers:request.headers});const response=await accountStore(env).fetch(probe);if(!response.ok)return null;const data=await response.json().catch(()=>({}));return data.user||null;}
async function takeQuota(request,env){const probe=new Request(new URL('/api/preview/coach-quota',request.url),{method:'POST',headers:request.headers});return accountStore(env).fetch(probe);}
function parseJson(value){const text=String(value??'').replace(/^```(?:json)?/i,'').replace(/```$/,'').trim();try{return JSON.parse(text)}catch{}const start=text.indexOf('{'),end=text.lastIndexOf('}');if(start<0||end<=start)return null;try{return JSON.parse(text.slice(start,end+1))}catch{return null}}
function stringArray(value,max=12){return Array.isArray(value)?value.map(item=>clean(item,500)).filter(Boolean).slice(0,max):[]}
function normalizePack(raw,kind){
  if(!raw||typeof raw!=='object')return null;
  const theory=stringArray(raw.theory,8);
  const items=Array.isArray(raw.items)?raw.items.map(item=>({term:clean(item?.term,120),translation:clean(item?.translation,160),example:clean(item?.example,260),exampleTranslation:clean(item?.exampleTranslation,300),note:clean(item?.note,240)})).filter(item=>item.term&&item.translation).slice(0,14):[];
  const exercises=Array.isArray(raw.exercises)?raw.exercises.map((item,index)=>{
    const type=['multiple-choice','translation','fill-gap','speaking','dictation'].includes(String(item?.type))?String(item.type):'translation';
    const question=clean(item?.question,320),answer=clean(item?.answer,320),explanation=clean(item?.explanation,420);
    const choices=stringArray(item?.choices,6);
    if(!question||!answer)return null;
    return{id:'ai-'+index,type,question,answer,choices:choices.includes(answer)?choices:[answer,...choices].slice(0,4),explanation};
  }).filter(Boolean).slice(0,16):[];
  if(theory.length<2||exercises.length<8||(kind==='vocabulary'&&items.length<6))return null;
  return{title:clean(raw.title,120)|| (kind==='grammar'?'Grammatiktraining':'Wortschatztraining'),theory,items,exercises};
}

export async function studySessionApi(request,env){
  if(request.method!=='POST')return json({error:'Methode nicht erlaubt.'},405,{Allow:'POST'});
  if(!sameOrigin(request))return json({error:'Ungültiger Ursprung.'},403);
  const user=await platformUser(request,env);if(!user)return json({error:'Bitte zuerst anmelden.'},401);
  if(!env?.AI?.run)return json({error:'Das KI-Lernlabor ist gerade nicht verfügbar.'},503);
  const quota=await takeQuota(request,env);if(!quota.ok)return json({error:quota.status===429?'Dein KI-Limit für diese Stunde ist erreicht.':'Das KI-Lernlabor ist gerade nicht verfügbar.'},quota.status===429?429:503);
  const data=await request.json().catch(()=>({}));
  const kind=data.kind==='grammar'?'grammar':'vocabulary';
  const level=/^(A1|A2|B1|B2|C1)$/.test(String(data.level||''))?String(data.level):'A1';
  const targetLabel=clean(data.targetLabel,80)||'target language',sourceLabel=clean(data.sourceLabel,80)||'German';
  const topic=clean(data.topic,120)|| (kind==='grammar'?'alltagsrelevante Grammatik':'alltagsrelevanter Wortschatz');
  const exclude=Array.isArray(data.exclude)?data.exclude.map(item=>clean(item,180)).filter(Boolean).slice(-40):[];
  const exclusion=exclude.length?' Do not reuse or closely paraphrase these recent tasks/answers: '+exclude.join(' | ')+'.':'';
  const schema='Return ONLY valid JSON with this shape: {"title":"...","theory":["..."],"items":[{"term":"target word or phrase","translation":"'+sourceLabel+' meaning","example":"natural '+targetLabel+' example","exampleTranslation":"'+sourceLabel+' translation","note":"usage/register/collocation"}],"exercises":[{"type":"multiple-choice|translation|fill-gap|speaking|dictation","question":"instruction or source prompt","answer":"correct '+targetLabel+' answer","choices":["..."],"explanation":"short feedback"}]}. For fill-gap, question must contain ___ and answer is the missing target-language word or phrase.';
  const goal=kind==='vocabulary'
    ?'Create a practical CEFR '+level+' vocabulary pack for '+targetLabel+' about '+topic+'. Teach 10-12 high-value words, phrases, collocations and chunks that a learner can actually use in real life. Theory should explain usage patterns, word families, collocations, register or memory hooks rather than generic motivation. Generate 12-16 varied exercises across recognition, active translation, fill gaps, speaking and dictation.'
    :'Create a practical CEFR '+level+' grammar pack for '+targetLabel+' about '+topic+'. Explain the grammar in '+sourceLabel+' with compact rules, patterns, contrasts, common mistakes and real-life examples. The grammar must be specific to '+targetLabel+', not a translated English rule. Generate 12-16 varied exercises that require production and understanding, including speaking and contextual choices.';
  const prompt=goal+' Support explanations in '+sourceLabel+'. Keep target-language answers natural and level-appropriate. Avoid obscure textbook sentences. Every generated session must feel different from previous sessions.'+exclusion+' '+schema;
  try{
    const result=await env.AI.run(env.AI_CHAT_MODEL||MODEL,{messages:[{role:'system',content:'You create accurate CEFR language-learning material. Respect the requested target language and level. Prefer natural everyday language, real communication and pedagogically useful examples. Output JSON only.'},{role:'user',content:prompt}],max_tokens:2400,temperature:.72});
    const pack=normalizePack(parseJson(result?.response||result?.result?.response||''),kind);
    if(!pack)return json({error:'Die KI konnte diesmal kein stabiles Lernpaket erzeugen. Bitte erneut generieren.'},503);
    return json({ok:true,kind,level,targetLabel,pack});
  }catch(error){console.error('study session generation failed',error);return json({error:'Das KI-Lernlabor ist vorübergehend nicht erreichbar.'},503)}
}
