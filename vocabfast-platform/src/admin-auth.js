const encode=new TextEncoder();
const json=(data,status=200,headers={})=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store',...headers}});
const hash=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',encode.encode(value))),b=>b.toString(16).padStart(2,'0')).join('');
const tokenFrom=request=>(request.headers.get('Cookie')||'').split(';').map(v=>v.trim()).find(v=>v.startsWith('vf_admin='))?.slice(9)||'';
const equal=(a,b)=>{if(a.length!==b.length)return false;let diff=0;for(let i=0;i<a.length;i++)diff|=a.charCodeAt(i)^b.charCodeAt(i);return diff===0;};
export async function adminAuth(request,env,storage){
 const path=new URL(request.url).pathname,token=tokenFrom(request),now=Date.now();
 if(request.method!=='GET'&&request.headers.get('Origin')!==new URL(request.url).origin)return json({error:'Ungültiger Ursprung.'},403);
 if(path==='/api/admin/logout'&&request.method==='POST'){if(token)await storage.delete('admin-session:'+await hash(token));return json({ok:true},200,{'Set-Cookie':'vf_admin=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0'});}
 if(path==='/api/admin/me'&&request.method==='GET'){
  if(!token||!env.ADMIN_PASSWORD)return json({admin:null});
  const session=await storage.get('admin-session:'+await hash(token));
  if(!session||session.expiresAt<=now||session.credentialVersion!==await hash(env.ADMIN_PASSWORD))return json({admin:null});
  return json({admin:{username:session.username,createdAt:session.createdAt,expiresAt:session.expiresAt}});
 }
 if(path!=='/api/admin/login'||request.method!=='POST')return json({error:'Route nicht gefunden.'},404);
 if(!env.ADMIN_PASSWORD)return json({error:'Der Adminzugang muss nach der Wiederherstellung neu eingerichtet werden. Bitte ADMIN_PASSWORD in Cloudflare als Secret hinterlegen.',code:'ADMIN_SETUP_REQUIRED'},503);
 const rateKey='admin-rate:'+await hash(request.headers.get('CF-Connecting-IP')||'unknown');
 const previous=await storage.get(rateKey);const rate=previous?.until>now?previous:{count:0,until:now+300000};
 if(rate.count>=10)return json({error:'Zu viele Anmeldeversuche. Bitte in fünf Minuten erneut versuchen.'},429,{'Retry-After':'300'});
 await storage.put(rateKey,{...rate,count:rate.count+1});
 let data;try{data=await request.json();}catch{return json({error:'Ungültige Anfrage.'},400);}
 const username=String(data.username||'').trim();const password=String(data.password||'');
 const matches=equal(await hash(password),await hash(env.ADMIN_PASSWORD));
 if(username.toLowerCase()!==String(env.ADMIN_USERNAME||'admin').toLowerCase()||!matches)return json({error:'Benutzername oder Passwort ist falsch.'},401);
 const bytes=crypto.getRandomValues(new Uint8Array(32));const sessionToken=Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
 await storage.put('admin-session:'+await hash(sessionToken),{username,createdAt:now,expiresAt:now+28800000,credentialVersion:await hash(env.ADMIN_PASSWORD)});
 await storage.delete(rateKey);
 return json({ok:true,admin:{username,role:'admin'}},200,{'Set-Cookie':`vf_admin=${sessionToken}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=28800`});
}
