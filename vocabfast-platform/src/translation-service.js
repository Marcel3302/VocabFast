const LANGUAGE_NAMES={en:'English',hr:'Croatian',es:'Spanish',fr:'French',de:'German',it:'Italian',pt:'Portuguese',zh:'Chinese',ja:'Japanese',ko:'Korean',ar:'Arabic'};
const MEMORY_CODES={en:'en',hr:'hr',es:'es',fr:'fr',de:'de',it:'it',pt:'pt',zh:'zh-CN',ja:'ja',ko:'ko',ar:'ar'};

function json(data,status=200,headers={}){return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow, noarchive',...headers}})}
function sameOrigin(request){const origin=request.headers.get('Origin');return !origin||origin===new URL(request.url).origin;}
function clean(value,max=3000){return String(value??'').replace(/\0/g,'').trim().slice(0,max);}
function key(value){return clean(value).toLocaleLowerCase().normalize('NFKD').replace(/[\p{M}\p{P}\p{S}\s]+/gu,'');}
function useful(source,translation){const a=key(source),b=key(translation);return Boolean(b)&&(!(a.length>14||clean(source).split(/\s+/).length>3)||a!==b);}
function split(text,max=430){const chunks=[];let rest=clean(text);while(rest.length>max){let cut=rest.lastIndexOf(' ',max);if(cut<Math.floor(max*.55))cut=max;chunks.push(rest.slice(0,cut).trim());rest=rest.slice(cut).trim();}if(rest)chunks.push(rest);return chunks;}
function entities(value){return String(value||'').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>');}
function translatedValue(result){
  if(typeof result==='string')return clean(result);
  return clean(result?.translated_text??result?.translatedText??result?.translation??result?.result?.translated_text??result?.result?.translation??result?.response);
}

async function cloudflareTranslate(text,source,target,env){
  if(!env?.AI?.run)throw new Error('translation-model-unavailable');
  const parts=[];
  for(const chunk of split(text,900)){
    const result=await env.AI.run('@cf/meta/m2m100-1.2b',{text:chunk,source_lang:source,target_lang:target});
    const translated=translatedValue(result);if(!translated)throw new Error('translation-model-empty');parts.push(translated);
  }
  const translation=parts.join(' ');if(!useful(text,translation))throw new Error('translation-model-unchanged');
  return{translation,alternatives:[],note:'Übersetzt mit dem VocabFast Translation Engine. Fachbegriffe können je nach Kontext mehrere richtige Varianten haben.',source,target,provider:'cloudflare-translation'};
}

async function memoryTranslate(text,source,target){
  const from=MEMORY_CODES[source],to=MEMORY_CODES[target];if(!from||!to)throw new Error('language');
  const chunks=split(text),parts=[];let alternatives=[];
  for(const chunk of chunks){
    const endpoint=new URL('https://api.mymemory.translated.net/get');endpoint.searchParams.set('q',chunk);endpoint.searchParams.set('langpair',`${from}|${to}`);
    const response=await fetch(endpoint,{headers:{Accept:'application/json','User-Agent':'VocabFast/2.0'}});if(!response.ok)throw new Error(`memory-${response.status}`);
    const data=await response.json().catch(()=>null),translated=clean(entities(data?.responseData?.translatedText));if(!translated)throw new Error('empty');parts.push(translated);
    if(chunks.length===1&&Array.isArray(data?.matches))alternatives=data.matches.map(item=>clean(entities(item?.translation),800)).filter(Boolean);
  }
  const translation=parts.join(' ');if(!useful(text,translation))throw new Error('unchanged');
  alternatives=alternatives.filter(item=>key(item)!==key(translation)).filter((item,index,list)=>list.findIndex(value=>key(value)===key(item))===index).slice(0,3);
  return{translation,alternatives,note:'Fallback-Übersetzung. Bei Fachbegriffen kann der richtige Ausdruck vom Satzkontext abhängen.',source,target,provider:'standard-fallback'};
}

async function aiTranslate(text,source,target,env){
  if(!env?.AI?.run)throw new Error('ai-unavailable');
  const system=`You are a translation engine. Translate faithfully from ${LANGUAGE_NAMES[source]} to ${LANGUAGE_NAMES[target]}. Never answer the message, only translate it. Preserve names, numbers and tone. Return ONLY JSON with keys translation, alternatives, note. alternatives is an array with at most 3 natural variants. note is one short learner hint.`;
  const result=await env.AI.run(env.AI_CHAT_MODEL||'@cf/meta/llama-3.1-8b-instruct-fast',{messages:[{role:'system',content:system},{role:'user',content:text}],max_tokens:650,temperature:0});
  let raw=String(result?.response||result?.result?.response||'').trim();raw=raw.replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'');let parsed;try{parsed=JSON.parse(raw);}catch{parsed={translation:raw,alternatives:[],note:''};}
  const translation=clean(parsed?.translation);if(!useful(text,translation))throw new Error('ai-invalid');
  return{translation,alternatives:Array.isArray(parsed?.alternatives)?parsed.alternatives.map(value=>clean(value,800)).filter(Boolean).slice(0,3):[],note:clean(parsed?.note,700)||'KI-Fallback wurde verwendet.',source,target,provider:'ai-fallback'};
}

async function userFor(request,env,baseWorker){const url=new URL('/api/preview/me',request.url),probe=new Request(url,{method:'GET',headers:request.headers});const response=await baseWorker.fetch(probe,env),data=await response.json().catch(()=>null);return response.ok?data?.user||null:null;}

export async function robustTranslateApi(request,env,baseWorker,{requirePro=false}={}){
  if(request.method!=='POST')return json({error:'Methode nicht erlaubt.'},405,{Allow:'POST'});
  if(!sameOrigin(request))return json({error:'Ungültiger Ursprung.'},403);
  const user=await userFor(request,env,baseWorker);if(!user)return json({error:'Bitte zuerst anmelden.'},401);
  if(requirePro&&user.plan!=='pro')return json({error:'Der PDF-Wortscanner ist in VocabFast Pro enthalten.'},403);
  const data=await request.json().catch(()=>({})),source=String(data.source||''),target=String(data.target||''),text=clean(data.text);
  if(!LANGUAGE_NAMES[source]||!LANGUAGE_NAMES[target]||source===target)return json({error:'Bitte wähle zwei unterschiedliche unterstützte Sprachen.'},400);
  if(!text)return json({error:'Bitte gib einen Text ein.'},400);
  try{return json(await cloudflareTranslate(text,source,target,env));}catch(primary){console.warn('translation model failed',String(primary));}
  try{return json(await memoryTranslate(text,source,target));}catch(second){console.warn('translation fallback failed',String(second));}
  try{return json(await aiTranslate(text,source,target,env));}catch(third){console.error('all translation providers failed',String(third));}
  return json({error:'Die Übersetzung ist gerade nicht erreichbar. Bitte versuche es in einem Moment erneut.'},503);
}
