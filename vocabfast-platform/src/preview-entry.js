import { platformBilling } from './platform-billing.js';
import previewWorker from './preview-worker.js';
import { PlatformAnalyticsStore } from './platform-analytics.js';
export { PreviewAccountStore } from './preview-worker.js';
export { PlatformAnalyticsStore } from './platform-analytics.js';

const PRODUCTION_ORIGIN='https://vocabfast.net';
const PRODUCTION_WORKER_ORIGIN=PRODUCTION_ORIGIN;
const ADMIN_AUTH_PATHS=new Set(['/api/admin/login','/api/admin/logout','/api/admin/me']);
const LANGUAGE_NAMES={en:'English',hr:'Croatian',es:'Spanish',fr:'French',de:'German',it:'Italian',pt:'Portuguese',zh:'Chinese',ja:'Japanese',ko:'Korean',ar:'Arabic'};
const MEMORY_CODES={en:'en',hr:'hr',es:'es',fr:'fr',de:'de',it:'it',pt:'pt',zh:'zh-CN',ja:'ja',ko:'ko',ar:'ar'};

function json(data,status=200,headers={}){return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow, noarchive',...headers}})}
function sameOrigin(request){const origin=request.headers.get('Origin');return !origin||origin===new URL(request.url).origin;}
function accountStore(env){if(!env?.PREVIEW_ACCOUNTS)throw new Error('Account storage is not configured.');const id=env.PREVIEW_ACCOUNTS.idFromName('global');return env.PREVIEW_ACCOUNTS.get(id);}
function analyticsStore(env){if(!env?.PLATFORM_ANALYTICS)throw new Error('Analytics storage is not configured.');const id=env.PLATFORM_ANALYTICS.idFromName('global');return env.PLATFORM_ANALYTICS.get(id);}
function syntheticAccount(account){return /^ci-\d+-\d+@example\.invalid$/i.test(String(account?.email||''));}

async function productionRequest(env,request,path){
  const sourceUrl=new URL(request.url),targetUrl=new URL(path||`${sourceUrl.pathname}${sourceUrl.search}`,PRODUCTION_WORKER_ORIGIN),headers=new Headers(request.headers);
  headers.set('Origin',PRODUCTION_ORIGIN);headers.set('Referer',`${PRODUCTION_ORIGIN}/admin`);headers.set('Accept','application/json');headers.delete('host');
  const init={method:request.method,headers,redirect:'manual'};
  if(request.method!=='GET'&&request.method!=='HEAD')init.body=await request.arrayBuffer();
  return accountStore(env).fetch(new Request(targetUrl,init));
}
async function proxyAdminAuth(request,env){if(!sameOrigin(request))return json({error:'Ungültiger Ursprung.'},403);const upstream=await productionRequest(env,request),responseHeaders=new Headers(upstream.headers);responseHeaders.set('Cache-Control','no-store');responseHeaders.set('X-Robots-Tag','noindex, nofollow, noarchive');return new Response(upstream.body,{status:upstream.status,statusText:upstream.statusText,headers:responseHeaders});}
async function verifyAdminSession(request,env){const cookie=request.headers.get('Cookie')||'';if(!cookie.includes('vf_admin='))return null;const headers=new Headers({Accept:'application/json',Cookie:cookie,'User-Agent':'VocabFast-Platform-Admin-Gateway'});const upstream=await productionRequest(env,new Request(request.url,{method:'GET',headers}),'/api/admin/me');if(!upstream.ok)return null;const data=await upstream.json().catch(()=>null),admin=data?.admin;if(!admin)return null;return{superadmin:true,username:admin.username||'admin',name:'Superadmin',createdAt:admin.createdAt||null,expiresAt:admin.expiresAt||null,permissions:['users.read','users.edit','plans.manage','security.manage','progress.edit','accounts.manage']};}

async function analyticsSummaries(env,userIds){
  if(!userIds.length)return {};
  const response=await analyticsStore(env).fetch(new Request('https://analytics.internal/internal/analytics/summaries',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({userIds})}));
  if(!response.ok)return {};
  const data=await response.json().catch(()=>({}));
  return data.summaries&&typeof data.summaries==='object'?data.summaries:{};
}
async function analyticsOne(env,userId){
  const response=await analyticsStore(env).fetch(new Request(`https://analytics.internal/internal/analytics/user/${encodeURIComponent(userId)}`,{method:'GET'}));
  if(!response.ok)return {};
  const data=await response.json().catch(()=>({}));
  return data.usage&&typeof data.usage==='object'?data.usage:{};
}
async function removeAnalytics(env,userId){
  if(!userId)return;
  await analyticsStore(env).fetch(new Request(`https://analytics.internal/internal/analytics/user/${encodeURIComponent(userId)}`,{method:'DELETE'})).catch(()=>{});
}
async function enrichAdminResponse(upstream,env){
  const status=upstream.status,data=await upstream.json().catch(()=>null);
  if(!data||!upstream.ok)return data?json(data,status):json({error:'Admin-Daten konnten nicht gelesen werden.'},502);
  if(Array.isArray(data.accounts)){
    const accounts=data.accounts.filter(account=>!syntheticAccount(account));
    const usage=await analyticsSummaries(env,accounts.map(account=>account.id).filter(Boolean));
    return json({...data,accounts:accounts.map(account=>({...account,...(usage[account.id]||{})}))},status);
  }
  if(data.account?.id)return json({...data,account:{...data.account,...await analyticsOne(env,data.account.id)}},status);
  return json(data,status);
}

async function platformAdmin(request,env){
  const context=await verifyAdminSession(request,env);if(!context)return json({error:'Admin-Anmeldung erforderlich.'},401);const url=new URL(request.url);
  if(url.pathname==='/api/preview/admin/context'&&request.method==='GET')return json({context});
  if(!sameOrigin(request))return json({error:'Ungültiger Ursprung.'},403);
  const write=request.method!=='GET'&&request.method!=='HEAD';if(write&&request.headers.get('X-VocabFast-Admin')!=='1')return json({error:'Admin-Sicherheitsprüfung fehlgeschlagen.'},403);
  if(url.pathname==='/api/preview/admin/accounts'&&request.method==='GET')return enrichAdminResponse(await accountStore(env).fetch(request),env);
  const match=url.pathname.match(/^\/api\/preview\/admin\/accounts\/([^/]+)(?:\/(?:sessions|password|state))?$/);
  if(match){
    const userId=decodeURIComponent(match[1]),upstream=await accountStore(env).fetch(request);
    if(request.method==='DELETE'&&!url.pathname.endsWith('/sessions')&&!url.pathname.endsWith('/state')&&upstream.ok)await removeAnalytics(env,userId);
    return enrichAdminResponse(upstream,env);
  }
  return json({error:'Admin-Route nicht gefunden.'},404);
}

async function authenticatedPlatformUser(request,env){const url=new URL('/api/preview/me',request.url),probe=new Request(url,{method:'GET',headers:request.headers});const response=await previewWorker.fetch(probe,env),data=await response.json().catch(()=>null);return response.ok?data?.user||null:null;}
async function activityApi(request,env){
  if(request.method!=='POST')return json({error:'Methode nicht erlaubt.'},405,{Allow:'POST'});
  if(!sameOrigin(request))return json({error:'Ungültiger Ursprung.'},403);
  const user=await authenticatedPlatformUser(request,env);if(!user)return json({error:'Bitte zuerst anmelden.'},401);
  return analyticsStore(env).fetch(new Request('https://analytics.internal/internal/analytics/ping',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({userId:user.id})}));
}
async function deleteAccountWithAnalytics(request,env){
  const user=await authenticatedPlatformUser(request,env),response=await previewWorker.fetch(request,env);
  if(response.ok&&user?.id)await removeAnalytics(env,user.id);
  return response;
}
function cleanText(value,max=3000){return String(value??'').replace(/\0/g,'').trim().slice(0,max);}
function splitTranslationText(text,max=440){
  const chunks=[];let rest=text.trim();
  while(rest.length>max){let cut=rest.lastIndexOf(' ',max);if(cut<Math.floor(max*.55))cut=max;chunks.push(rest.slice(0,cut).trim());rest=rest.slice(cut).trim();}
  if(rest)chunks.push(rest);return chunks;
}
async function memoryTranslate(text,source,target){
  const sourceCode=MEMORY_CODES[source],targetCode=MEMORY_CODES[target];
  if(!sourceCode||!targetCode)throw new Error('fallback-language');
  const chunks=splitTranslationText(text),translated=[];let alternatives=[];
  for(const chunk of chunks){
    const endpoint=new URL('https://api.mymemory.translated.net/get');endpoint.searchParams.set('q',chunk);endpoint.searchParams.set('langpair',`${sourceCode}|${targetCode}`);
    const response=await fetch(endpoint,{headers:{Accept:'application/json','User-Agent':'VocabFast/1.0'}});if(!response.ok)throw new Error(`fallback-${response.status}`);
    const data=await response.json().catch(()=>null),value=cleanText(data?.responseData?.translatedText,3000);if(!value)throw new Error('fallback-empty');translated.push(value);
    if(chunks.length===1&&Array.isArray(data?.matches))alternatives=data.matches.map(item=>cleanText(item?.translation,1000)).filter(item=>item&&item.toLocaleLowerCase()!==value.toLocaleLowerCase()).filter((item,index,list)=>list.findIndex(entry=>entry.toLocaleLowerCase()===item.toLocaleLowerCase())===index).slice(0,3);
  }
  return{translation:translated.join(' '),alternatives,note:'Automatische Übersetzung. Prüfe bei Fachbegriffen den Kontext.',source,target};
}
async function aiTranslate(text,source,target,env){
  if(!env?.AI?.run)throw new Error('ai-unavailable');
  const system=`You are VocabFast Translate. Translate from ${LANGUAGE_NAMES[source]} to ${LANGUAGE_NAMES[target]}. Return only valid JSON with keys translation, alternatives, note. alternatives must contain at most 3 natural alternatives. note should be a short helpful learner note in ${LANGUAGE_NAMES[source]}. Preserve meaning, register, names and numbers. Never add facts.`;
  const result=await env.AI.run(env.AI_CHAT_MODEL||'@cf/meta/llama-3.1-8b-instruct',{messages:[{role:'system',content:system},{role:'user',content:text}],max_tokens:500,temperature:.15});let raw=String(result?.response||result?.result?.response||'').trim(),parsed=null;raw=raw.replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'');try{parsed=JSON.parse(raw)}catch{parsed={translation:raw,alternatives:[],note:''}}const translation=cleanText(parsed?.translation,3000);if(!translation)throw new Error('ai-empty');return{translation,alternatives:Array.isArray(parsed?.alternatives)?parsed.alternatives.map(value=>cleanText(value,1000)).filter(Boolean).slice(0,3):[],note:cleanText(parsed?.note,800),source,target};
}
async function translateApi(request,env){
  if(request.method!=='POST')return json({error:'Methode nicht erlaubt.'},405,{Allow:'POST'});if(!sameOrigin(request))return json({error:'Ungültiger Ursprung.'},403);const user=await authenticatedPlatformUser(request,env);if(!user)return json({error:'Bitte zuerst anmelden.'},401);
  const data=await request.json().catch(()=>({})),source=String(data.source||''),target=String(data.target||''),text=cleanText(data.text);if(!LANGUAGE_NAMES[source]||!LANGUAGE_NAMES[target]||source===target)return json({error:'Bitte wähle zwei unterschiedliche unterstützte Sprachen.'},400);if(!text)return json({error:'Bitte gib einen Text ein.'},400);
  try{return json(await aiTranslate(text,source,target,env));}catch(aiError){console.warn('translation ai unavailable, using fallback',String(aiError));try{return json(await memoryTranslate(text,source,target));}catch(fallbackError){console.error('translation fallback error',fallbackError);return json({error:'Die Übersetzung ist vorübergehend nicht verfügbar. Bitte versuche es gleich erneut.'},503);}}
}

export default{async fetch(request,env,ctx){const url=new URL(request.url);if(url.pathname.startsWith('/api/preview/billing/'))return platformBilling(request,env);if(url.pathname==='/api/admin/context'&&request.method==='GET'){try{const context=await verifyAdminSession(request,env);return context?json({context}):json({error:'Admin-Anmeldung erforderlich.'},401)}catch(error){console.error('admin context bridge error',error);return json({error:'Der geschützte Adminzugang ist gerade nicht erreichbar.'},503)}}if(ADMIN_AUTH_PATHS.has(url.pathname)){try{return await proxyAdminAuth(request,env)}catch(error){console.error('admin auth proxy error',error);return json({error:'Der geschützte Adminzugang ist gerade nicht erreichbar.'},503)}}if(url.pathname.startsWith('/api/preview/admin/')){try{return await platformAdmin(request,env)}catch(error){console.error('platform admin gateway error',error);return json({error:'Der Adminbereich ist gerade nicht erreichbar.'},503)}}if(url.pathname==='/api/preview/activity')return activityApi(request,env);if(url.pathname==='/api/preview/account'&&request.method==='DELETE')return deleteAccountWithAnalytics(request,env);if(url.pathname==='/api/platform/translate')return translateApi(request,env);return previewWorker.fetch(request,env,ctx)}};