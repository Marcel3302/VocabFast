import { platformBilling } from './platform-billing.js';
import previewWorker from './preview-worker.js';
import { PlatformAnalyticsStore } from './platform-analytics.js';
import { robustTranslateApi } from './translation-service.js';
export { PreviewAccountStore } from './preview-worker.js';
export { PlatformAnalyticsStore } from './platform-analytics.js';

const PRODUCTION_ORIGIN='https://vocabfast.net';
const PRODUCTION_WORKER_ORIGIN=PRODUCTION_ORIGIN;
const ADMIN_AUTH_PATHS=new Set(['/api/admin/login','/api/admin/logout','/api/admin/me']);
const RESET_TOKEN_TTL_MS=20*60*1000;
const RESET_MIN_INTERVAL_MS=60*1000;
const resetThrottle=new Map();
const encoder=new TextEncoder();
const decoder=new TextDecoder();

function json(data,status=200,headers={}){return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow, noarchive',...headers}})}
function sameOrigin(request){const origin=request.headers.get('Origin');return !origin||origin===new URL(request.url).origin;}
function accountStore(env){if(!env?.PREVIEW_ACCOUNTS)throw new Error('Account storage is not configured.');const id=env.PREVIEW_ACCOUNTS.idFromName('global');return env.PREVIEW_ACCOUNTS.get(id);}
function analyticsStore(env){if(!env?.PLATFORM_ANALYTICS)throw new Error('Analytics storage is not configured.');const id=env.PLATFORM_ANALYTICS.idFromName('global');return env.PLATFORM_ANALYTICS.get(id);}
function syntheticAccount(account){return /^ci-\d+-\d+@example\.invalid$/i.test(String(account?.email||''));}
function normalizeEmail(value){return String(value??'').replace(/\0/g,'').trim().toLowerCase().slice(0,180);}
function b64url(bytes){let value='';for(const byte of bytes)value+=String.fromCharCode(byte);return btoa(value).replaceAll('+','-').replaceAll('/','_').replaceAll('=','');}
function fromB64url(value){const normalized=String(value||'').replaceAll('-','+').replaceAll('_','/');const padded=normalized+'='.repeat((4-normalized.length%4)%4);return Uint8Array.from(atob(padded),char=>char.charCodeAt(0));}

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

async function resetHmacKey(account){
  const credential=String(account?.passwordHash||'');
  if(credential.length<32)throw new Error('account-reset-key-missing');
  const digest=await crypto.subtle.digest('SHA-256',encoder.encode(`vocabfast-password-reset:${credential}`));
  return crypto.subtle.importKey('raw',digest,{name:'HMAC',hash:'SHA-256'},false,['sign','verify']);
}
function decodeResetPayload(token){
  const [encoded,signature,...rest]=String(token||'').split('.');
  if(!encoded||!signature||rest.length)return null;
  try{return {encoded,signature,payload:JSON.parse(decoder.decode(fromB64url(encoded)))};}catch{return null;}
}
async function makeResetToken(account){
  const payload={uid:account.id,e:normalizeEmail(account.email),exp:Date.now()+RESET_TOKEN_TTL_MS};
  const encoded=b64url(encoder.encode(JSON.stringify(payload))),key=await resetHmacKey(account),signature=new Uint8Array(await crypto.subtle.sign('HMAC',key,encoder.encode(encoded)));
  return `${encoded}.${b64url(signature)}`;
}
async function verifyResetToken(token,account){
  const decoded=decodeResetPayload(token);if(!decoded)return null;
  try{
    const key=await resetHmacKey(account),valid=await crypto.subtle.verify('HMAC',key,fromB64url(decoded.signature),encoder.encode(decoded.encoded));
    if(!valid||decoded.payload?.uid!==account.id||normalizeEmail(decoded.payload?.e)!==normalizeEmail(account.email)||Number(decoded.payload?.exp)<=Date.now())return null;
    return decoded.payload;
  }catch{return null;}
}
async function internalAccounts(env){
  const response=await accountStore(env).fetch(new Request('https://accounts.internal/api/preview/admin/accounts',{method:'GET'}));
  if(!response.ok)return [];
  const data=await response.json().catch(()=>({}));
  return Array.isArray(data.accounts)?data.accounts:[];
}
async function internalAccount(env,userId){
  const response=await accountStore(env).fetch(new Request(`https://accounts.internal/api/preview/admin/accounts/${encodeURIComponent(userId)}`,{method:'GET'}));
  if(!response.ok)return null;
  const data=await response.json().catch(()=>({}));
  return data.account||null;
}
async function sendResetEmail(env,email,token){
  const apiKey=String(env?.RESEND_API_KEY||''),from=String(env?.PASSWORD_RESET_FROM||'');
  if(!apiKey||!from)return false;
  const resetUrl=`${PRODUCTION_ORIGIN}/?reset=${encodeURIComponent(token)}`;
  const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json'},body:JSON.stringify({from,to:[email],subject:'VocabFast Passwort zurücksetzen',text:`Du hast angefordert, dein VocabFast-Passwort zurückzusetzen. Öffne innerhalb von 20 Minuten diesen Link:\n\n${resetUrl}\n\nFalls du das nicht warst, kannst du diese E-Mail ignorieren.`,html:`<div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:auto;padding:24px;color:#17243a"><h1 style="font-size:24px">VocabFast Passwort zurücksetzen</h1><p>Du hast angefordert, dein Passwort zurückzusetzen.</p><p><a href="${resetUrl}" style="display:inline-block;padding:12px 18px;border-radius:10px;background:#3569e5;color:#fff;text-decoration:none;font-weight:700">Neues Passwort festlegen</a></p><p style="color:#66758a">Der Link ist 20 Minuten gültig. Falls du das nicht warst, kannst du diese E-Mail ignorieren.</p></div>`})});
  if(!response.ok)console.error('password reset email failed',response.status,await response.text().catch(()=>''));
  return response.ok;
}
async function requestPasswordReset(request,env){
  if(request.method!=='POST')return json({error:'Methode nicht erlaubt.'},405,{Allow:'POST'});
  if(!sameOrigin(request))return json({error:'Ungültiger Ursprung.'},403);
  const data=await request.json().catch(()=>({})),email=normalizeEmail(data.email);
  if(!/^\S+@\S+\.\S+$/.test(email))return json({error:'Bitte gib eine gültige E-Mail-Adresse ein.'},400);
  if(!env?.RESEND_API_KEY||!env?.PASSWORD_RESET_FROM)return json({error:'Der automatische Passwort-Reset wird gerade eingerichtet. Bitte nutze bis dahin den Kontakt im Impressum.'},503);
  const now=Date.now(),last=Number(resetThrottle.get(email)||0);
  if(now-last<RESET_MIN_INTERVAL_MS)return json({ok:true,message:'Wenn ein Konto existiert, wurde bereits eine Reset-E-Mail angefordert.'});
  resetThrottle.set(email,now);
  const account=(await internalAccounts(env)).find(item=>normalizeEmail(item?.email)===email&&!item?.disabled);
  if(account){
    try{const token=await makeResetToken(account);await sendResetEmail(env,email,token);}catch(error){console.error('password reset request failed',error);}
  }
  return json({ok:true,message:'Wenn für diese E-Mail ein Konto existiert, erhältst du gleich einen Reset-Link.'});
}
async function confirmPasswordReset(request,env){
  if(request.method!=='POST')return json({error:'Methode nicht erlaubt.'},405,{Allow:'POST'});
  if(!sameOrigin(request))return json({error:'Ungültiger Ursprung.'},403);
  const data=await request.json().catch(()=>({})),newPassword=String(data.newPassword||''),decoded=decodeResetPayload(data.token);
  if(newPassword.length<12)return json({error:'Das neue Passwort muss mindestens 12 Zeichen lang sein.'},400);
  if(newPassword.length>256)return json({error:'Das neue Passwort ist zu lang.'},400);
  if(!decoded?.payload?.uid)return json({error:'Der Reset-Link ist ungültig oder abgelaufen. Bitte fordere einen neuen an.'},400);
  const account=await internalAccount(env,decoded.payload.uid),payload=account?await verifyResetToken(data.token,account):null;
  if(!account||account.disabled||!payload)return json({error:'Der Reset-Link ist nicht mehr gültig. Bitte fordere einen neuen an.'},400);
  const upstream=await accountStore(env).fetch(new Request(`https://accounts.internal/api/preview/admin/accounts/${encodeURIComponent(payload.uid)}/password`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({temporaryPassword:newPassword})}));
  if(!upstream.ok){const result=await upstream.json().catch(()=>({}));return json({error:result.error||'Das Passwort konnte nicht geändert werden.'},upstream.status);}
  return json({ok:true,message:'Passwort geändert. Du kannst dich jetzt anmelden.'});
}
function publicSurfaceResponse(response,url){
  if(url.pathname.startsWith('/api/')||url.pathname.startsWith('/admin'))return response;
  const headers=new Headers(response.headers);headers.delete('X-Robots-Tag');
  return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
}

export default{async fetch(request,env,ctx){
  const url=new URL(request.url);
  if(url.pathname.startsWith('/api/preview/billing/'))return platformBilling(request,env);
  if(url.pathname==='/api/preview/auth/password-reset/request')return requestPasswordReset(request,env);
  if(url.pathname==='/api/preview/auth/password-reset/confirm')return confirmPasswordReset(request,env);
  if(url.pathname==='/api/admin/context'&&request.method==='GET'){try{const context=await verifyAdminSession(request,env);return context?json({context}):json({error:'Admin-Anmeldung erforderlich.'},401)}catch(error){console.error('admin context bridge error',error);return json({error:'Der geschützte Adminzugang ist gerade nicht erreichbar.'},503)}}
  if(ADMIN_AUTH_PATHS.has(url.pathname)){try{return await proxyAdminAuth(request,env)}catch(error){console.error('admin auth proxy error',error);return json({error:'Der geschützte Adminzugang ist gerade nicht erreichbar.'},503)}}
  if(url.pathname.startsWith('/api/preview/admin/')){try{return await platformAdmin(request,env)}catch(error){console.error('platform admin gateway error',error);return json({error:'Der Adminbereich ist gerade nicht erreichbar.'},503)}}
  if(url.pathname==='/api/preview/activity')return activityApi(request,env);
  if(url.pathname==='/api/preview/account'&&request.method==='DELETE')return deleteAccountWithAnalytics(request,env);
  if(url.pathname==='/api/platform/translate')return robustTranslateApi(request,env,previewWorker);
  if(url.pathname==='/api/platform/pdf-translate')return robustTranslateApi(request,env,previewWorker,{requirePro:true});
  return publicSurfaceResponse(await previewWorker.fetch(request,env,ctx),url);
}};
