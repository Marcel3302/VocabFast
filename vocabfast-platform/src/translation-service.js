const LANGUAGE_NAMES={en:'English',hr:'Croatian',sl:'Slovenian',es:'Spanish',fr:'French',de:'German',it:'Italian',pt:'Portuguese',nl:'Dutch',pl:'Polish',cs:'Czech',tr:'Turkish',el:'Greek',ru:'Russian',uk:'Ukrainian',zh:'Chinese',ja:'Japanese',ko:'Korean',ar:'Arabic'};
const MEMORY_CODES={en:'en',hr:'hr',sl:'sl',es:'es',fr:'fr',de:'de',it:'it',pt:'pt',nl:'nl',pl:'pl',cs:'cs',tr:'tr',el:'el',ru:'ru',uk:'uk',zh:'zh-CN',ja:'ja',ko:'ko',ar:'ar'};
const AI_TRANSLATION_MAX_CHARS=1200;

function json(data,status=200,headers={}){return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow, noarchive',...headers}})}
function sameOrigin(request){const origin=request.headers.get('Origin');return !origin||origin===new URL(request.url).origin;}
function textOnly(value,max=3000){return typeof value==='string'?value.replace(/\0/g,'').trim().slice(0,max):'';}
function clean(value,max=3000){return textOnly(value,max);}
function key(value){return clean(value).toLocaleLowerCase().normalize('NFKD').replace(/[\p{M}\p{P}\p{S}\s]+/gu,'');}
function useful(source,translation){const a=key(source),b=key(translation);return Boolean(b)&&b!=='objectobject'&&b!=='undefined'&&b!=='null'&&(!(a.length>14||clean(source).split(/\s+/).length>3)||a!==b);}
function split(text,max=430){const chunks=[];let rest=clean(text);while(rest.length>max){let cut=rest.lastIndexOf(' ',max);if(cut<Math.floor(max*.55))cut=max;chunks.push(rest.slice(0,cut).trim());rest=rest.slice(cut).trim();}if(rest)chunks.push(rest);return chunks;}
function entities(value){return typeof value==='string'?value.replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>'):'';}
function translatedValue(result){
  if(typeof result==='string')return clean(result);
  const candidates=[result?.translated_text,result?.translatedText,result?.translation,result?.result?.translated_text,result?.result?.translatedText,result?.result?.translation,result?.response?.translated_text,result?.response?.translatedText,result?.response?.translation,result?.response];
  for(const candidate of candidates){const value=textOnly(candidate);if(value)return value;}
  return'';
}
function uniqueAlternatives(values,translation){return (Array.isArray(values)?values:[]).map(value=>textOnly(value,800)).filter(Boolean).filter(value=>key(value)!==key(translation)).filter((value,index,list)=>list.findIndex(item=>key(item)===key(value))===index).slice(0,3);}
function unwrapAiPayload(result){
  const candidates=[result?.response,result?.result?.response,result?.result,result?.output,result];
  for(const candidate of candidates){
    if(candidate&&typeof candidate==='object'&&!Array.isArray(candidate)){
      if(typeof candidate.translation==='string')return candidate;
      if(candidate.response&&typeof candidate.response==='object'&&typeof candidate.response.translation==='string')return candidate.response;
      if(candidate.result&&typeof candidate.result==='object'&&typeof candidate.result.translation==='string')return candidate.result;
    }
    if(typeof candidate==='string'){
      let raw=candidate.trim().replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'');
      if(!raw)continue;
      try{const parsed=JSON.parse(raw);if(parsed&&typeof parsed==='object')return parsed;}catch{
        if(raw!=='[object Object]'&&raw!=='undefined'&&raw!=='null')return{translation:raw,alternatives:[],note:''};
      }
    }
  }
  return null;
}

async function cloudflareTranslate(text,source,target,env){
  if(!env?.AI?.run)throw new Error('translation-model-unavailable');
  const parts=[];
  for(const chunk of split(text,900)){
    const result=await env.AI.run('@cf/meta/m2m100-1.2b',{text:chunk,source_lang:source,target_lang:target});
    const translated=translatedValue(result);if(!useful(chunk,translated))throw new Error('translation-model-empty');parts.push(translated);
  }
  const translation=parts.join(' ');if(!useful(text,translation))throw new Error('translation-model-unchanged');
  return{translation,alternatives:[],note:'Übersetzt mit der spezialisierten VocabFast Translation Engine. Bei Fachbegriffen können mehrere Varianten richtig sein.',source,target,provider:'cloudflare-translation'};
}

async function aiTranslate(text,source,target,env){
  if(!env?.AI?.run)throw new Error('ai-unavailable');
  const system=`You are the high-quality translation engine inside VocabFast. Translate from ${LANGUAGE_NAMES[source]} to ${LANGUAGE_NAMES[target]} using the meaning and context of the complete input. Never answer or continue the user's message: only translate it. Preserve names, numbers, units, technical terms, register, tone and formatting. Prefer the natural expression a native speaker would actually use, while staying faithful to the source. For ambiguous words choose the meaning best supported by context. Return ONLY valid JSON: {"translation":"...","alternatives":["..."],"note":"..."}. Give at most 3 genuinely useful alternatives. The note must be one short learner hint in German when useful, otherwise empty.`;
  const result=await env.AI.run(env.AI_CHAT_MODEL||'@cf/meta/llama-3.1-8b-instruct-fast',{messages:[{role:'system',content:system},{role:'user',content:text}],max_tokens:1100,temperature:.1});
  const parsed=unwrapAiPayload(result);if(!parsed)throw new Error('ai-response-shape');
  const translation=textOnly(parsed.translation);if(!useful(text,translation))throw new Error('ai-invalid');
  return{translation,alternatives:uniqueAlternatives(parsed.alternatives,translation),note:textOnly(parsed.note,700)||'Kontextbezogen mit VocabFast AI übersetzt.',source,target,provider:'cloudflare-ai-translation'};
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
  return{translation,alternatives:uniqueAlternatives(alternatives,translation),note:'Fallback-Übersetzung. Bei Fachbegriffen kann der richtige Ausdruck vom Satzkontext abhängen.',source,target,provider:'standard-fallback'};
}

async function runTranslation(text,source,target,env,{aiFirst=true}={}){
  if(aiFirst&&text.length<=AI_TRANSLATION_MAX_CHARS){
    try{return await aiTranslate(text,source,target,env);}catch(primary){console.warn('ai translation failed',String(primary));}
  }
  try{return await cloudflareTranslate(text,source,target,env);}catch(second){console.warn('translation model failed',String(second));}
  if(!aiFirst&&text.length<=AI_TRANSLATION_MAX_CHARS){
    try{return await aiTranslate(text,source,target,env);}catch(third){console.warn('ai translation fallback failed',String(third));}
  }
  try{return await memoryTranslate(text,source,target);}catch(last){console.error('all translation providers failed',String(last));}
  throw new Error('translation-unavailable');
}
async function userFor(request,env,baseWorker){const url=new URL('/api/preview/me',request.url),probe=new Request(url,{method:'GET',headers:request.headers});const response=await baseWorker.fetch(probe,env),data=await response.json().catch(()=>null);return response.ok?data?.user||null:null;}

export async function robustTranslateApi(request,env,baseWorker,{requirePro=false}={}){
  if(request.method==='GET'&&new URL(request.url).searchParams.get('health')==='1'){
    try{const result=await runTranslation('Guten Morgen, ich habe eine Reservierung.','de','en',env,{aiFirst:true});return json({ok:true,provider:result.provider,engine:'translation',languages:Object.keys(LANGUAGE_NAMES).length,checkedAt:new Date().toISOString()});}catch{return json({ok:false,engine:'translation'},503);}
  }
  if(request.method!=='POST')return json({error:'Methode nicht erlaubt.'},405,{Allow:'POST'});
  if(!sameOrigin(request))return json({error:'Ungültiger Ursprung.'},403);
  const user=await userFor(request,env,baseWorker);if(!user)return json({error:'Bitte zuerst anmelden.'},401);
  if(requirePro&&user.plan!=='pro')return json({error:'Der PDF-Wortscanner ist in VocabFast Pro enthalten.'},403);
  const data=await request.json().catch(()=>({})),source=String(data.source||''),target=String(data.target||''),text=clean(data.text);
  if(!LANGUAGE_NAMES[source]||!LANGUAGE_NAMES[target]||source===target)return json({error:'Bitte wähle zwei unterschiedliche unterstützte Sprachen.'},400);
  if(!text)return json({error:'Bitte gib einen Text ein.'},400);
  try{return json(await runTranslation(text,source,target,env,{aiFirst:!requirePro}));}catch{return json({error:'Die Übersetzung ist gerade nicht erreichbar. Bitte versuche es in einem Moment erneut.'},503);}
}
