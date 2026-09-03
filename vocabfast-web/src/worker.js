const SESSION_COOKIE = 'vf_session';
const SESSION_DAYS = 30;
let schemaPromise;

function json(data,status=200,headers={}){
  return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...headers}});
}
function error(message,status=400){return json({error:message},status);}
function normalizeEmail(v){return String(v||'').trim().toLowerCase();}
function cleanName(v){return String(v||'').trim().slice(0,60);}
function parseCookies(request){
  const out={};for(const part of (request.headers.get('Cookie')||'').split(';')){const i=part.indexOf('=');if(i>0)out[part.slice(0,i).trim()]=decodeURIComponent(part.slice(i+1).trim());}return out;
}
function bytesToBase64(bytes){let s='';for(const b of bytes)s+=String.fromCharCode(b);return btoa(s);}
function base64ToBytes(s){const raw=atob(s);return Uint8Array.from(raw,c=>c.charCodeAt(0));}
function bytesToHex(bytes){return [...bytes].map(b=>b.toString(16).padStart(2,'0')).join('');}
function randomToken(bytes=32){return bytesToBase64(crypto.getRandomValues(new Uint8Array(bytes))).replaceAll('+','-').replaceAll('/','_').replaceAll('=','');}
async function sha256Hex(input){const data=new TextEncoder().encode(input);return bytesToHex(new Uint8Array(await crypto.subtle.digest('SHA-256',data)));}
async function hashPassword(password,saltBytes){
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);
  const bits=await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:saltBytes,iterations:120000},key,256);
  return bytesToBase64(new Uint8Array(bits));
}
function safeEqual(a,b){if(typeof a!=='string'||typeof b!=='string'||a.length!==b.length)return false;let diff=0;for(let i=0;i<a.length;i++)diff|=a.charCodeAt(i)^b.charCodeAt(i);return diff===0;}
function sessionCookie(token,request,maxAge=SESSION_DAYS*86400){const secure=new URL(request.url).protocol==='https:'?'; Secure':'';return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax${secure}; Max-Age=${maxAge}`;}
function clearSessionCookie(request){const secure=new URL(request.url).protocol==='https:'?'; Secure':'';return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax${secure}; Max-Age=0`;}

async function ensureSchema(env){
  if(schemaPromise)return schemaPromise;
  schemaPromise=env.DB.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL DEFAULT '',
      password_hash TEXT NOT NULL,
      password_salt TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_expiry ON sessions(expires_at);
    CREATE TABLE IF NOT EXISTS user_state (
      user_id TEXT PRIMARY KEY,
      state_json TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS pdfs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      context TEXT NOT NULL DEFAULT '',
      size INTEGER NOT NULL,
      r2_key TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_pdfs_user_created ON pdfs(user_id, created_at DESC);
  `).catch(err=>{schemaPromise=null;throw err;});
  return schemaPromise;
}

function defaultState(){return {learning:[],customTopics:[],settings:{sort:'importance-desc'},stats:{xp:0,vocabCorrect:0,vocabAnswered:0,grammarCorrect:0,grammarAnswered:0,pdfUploads:0,customTopics:0,studyDates:[]},mastery:{}};}
async function readBody(request){try{return await request.json();}catch{return {};}}

async function createSession(env,userId,request){
  const token=randomToken(),hash=await sha256Hex(token),now=Date.now(),expires=now+SESSION_DAYS*86400000;
  await env.DB.prepare('INSERT INTO sessions (token_hash,user_id,expires_at,created_at) VALUES (?,?,?,?)').bind(hash,userId,expires,now).run();
  return {token,cookie:sessionCookie(token,request)};
}
async function getUser(request,env){
  const token=parseCookies(request)[SESSION_COOKIE];if(!token)return null;const hash=await sha256Hex(token),now=Date.now();
  const row=await env.DB.prepare(`SELECT u.id,u.email,u.name,u.created_at,s.expires_at FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>?`).bind(hash,now).first();
  if(!row)return null;return {id:row.id,email:row.email,name:row.name,createdAt:row.created_at,sessionHash:hash};
}
async function authUser(request,env){const u=await getUser(request,env);if(!u)throw Object.assign(new Error('Bitte anmelden.'),{status:401});return u;}

async function apiRouter(request,env){
  await ensureSchema(env);
  const url=new URL(request.url),path=url.pathname.slice(4) || '/',method=request.method.toUpperCase();
  try{
    if(path==='/auth/register'&&method==='POST'){
      const body=await readBody(request),email=normalizeEmail(body.email),name=cleanName(body.name),password=String(body.password||'');
      if(!/^\S+@\S+\.\S+$/.test(email))return error('Bitte eine gültige E-Mail eingeben.');
      if(password.length<8)return error('Das Passwort muss mindestens 8 Zeichen lang sein.');
      const exists=await env.DB.prepare('SELECT id FROM users WHERE email=?').bind(email).first();if(exists)return error('Für diese E-Mail existiert bereits ein Konto.',409);
      const id=crypto.randomUUID(),salt=crypto.getRandomValues(new Uint8Array(16)),passwordHash=await hashPassword(password,salt),now=Date.now();
      await env.DB.batch([
        env.DB.prepare('INSERT INTO users (id,email,name,password_hash,password_salt,created_at) VALUES (?,?,?,?,?,?)').bind(id,email,name,passwordHash,bytesToBase64(salt),now),
        env.DB.prepare('INSERT INTO user_state (user_id,state_json,updated_at) VALUES (?,?,?)').bind(id,JSON.stringify(defaultState()),now)
      ]);
      const session=await createSession(env,id,request);return json({user:{id,email,name,createdAt:now}},201,{'Set-Cookie':session.cookie});
    }

    if(path==='/auth/login'&&method==='POST'){
      const body=await readBody(request),email=normalizeEmail(body.email),password=String(body.password||'');
      const row=await env.DB.prepare('SELECT id,email,name,password_hash,password_salt,created_at FROM users WHERE email=?').bind(email).first();
      if(!row)return error('E-Mail oder Passwort ist falsch.',401);
      const candidate=await hashPassword(password,base64ToBytes(row.password_salt));if(!safeEqual(candidate,row.password_hash))return error('E-Mail oder Passwort ist falsch.',401);
      const session=await createSession(env,row.id,request);return json({user:{id:row.id,email:row.email,name:row.name,createdAt:row.created_at}},200,{'Set-Cookie':session.cookie});
    }

    if(path==='/auth/logout'&&method==='POST'){
      const token=parseCookies(request)[SESSION_COOKIE];if(token){const hash=await sha256Hex(token);await env.DB.prepare('DELETE FROM sessions WHERE token_hash=?').bind(hash).run();}
      return json({ok:true},200,{'Set-Cookie':clearSessionCookie(request)});
    }

    if(path==='/me'&&method==='GET'){
      const u=await getUser(request,env);return json({user:u?{id:u.id,email:u.email,name:u.name,createdAt:u.createdAt}:null});
    }

    if(path==='/state'&&method==='GET'){
      const u=await authUser(request,env);const row=await env.DB.prepare('SELECT state_json,updated_at FROM user_state WHERE user_id=?').bind(u.id).first();
      if(!row){const st=defaultState();await env.DB.prepare('INSERT INTO user_state (user_id,state_json,updated_at) VALUES (?,?,?)').bind(u.id,JSON.stringify(st),Date.now()).run();return json({state:st});}
      let st;try{st=JSON.parse(row.state_json);}catch{st=defaultState();}return json({state:st,updatedAt:row.updated_at});
    }

    if(path==='/state'&&method==='PUT'){
      const u=await authUser(request,env),body=await readBody(request),raw=JSON.stringify(body||{});if(raw.length>1_800_000)return error('Der Lernstand ist zu groß für eine einzelne Synchronisierung.',413);
      await env.DB.prepare(`INSERT INTO user_state (user_id,state_json,updated_at) VALUES (?,?,?) ON CONFLICT(user_id) DO UPDATE SET state_json=excluded.state_json,updated_at=excluded.updated_at`).bind(u.id,raw,Date.now()).run();return json({ok:true});
    }

    if(path==='/profile'&&method==='PUT'){
      const u=await authUser(request,env),body=await readBody(request),name=cleanName(body.name);await env.DB.prepare('UPDATE users SET name=? WHERE id=?').bind(name,u.id).run();return json({user:{id:u.id,email:u.email,name,createdAt:u.createdAt}});
    }

    if(path==='/pdfs'&&method==='GET'){
      const u=await authUser(request,env);const {results=[]}=await env.DB.prepare('SELECT id,name,context,size,created_at AS created FROM pdfs WHERE user_id=? ORDER BY created_at DESC').bind(u.id).all();return json(results);
    }

    if(path==='/pdfs'&&method==='POST'){
      const u=await authUser(request,env),form=await request.formData(),file=form.get('file'),context=String(form.get('context')||'').slice(0,250);
      if(!file || typeof file==='string')return error('Keine PDF-Datei erhalten.');
      if(file.size>30*1024*1024)return error('PDFs dürfen maximal 30 MB groß sein.',413);
      const name=String(file.name||'document.pdf').slice(0,240);if(file.type!=='application/pdf'&&!name.toLowerCase().endsWith('.pdf'))return error('Nur PDF-Dateien sind erlaubt.');
      const id=crypto.randomUUID(),key=`${u.id}/${id}.pdf`,now=Date.now();
      await env.PDFS.put(key,file.stream(),{httpMetadata:{contentType:'application/pdf'},customMetadata:{originalName:name}});
      try{await env.DB.prepare('INSERT INTO pdfs (id,user_id,name,context,size,r2_key,created_at) VALUES (?,?,?,?,?,?,?)').bind(id,u.id,name,context,file.size,key,now).run();}
      catch(err){await env.PDFS.delete(key);throw err;}
      return json({id,name,context,size:file.size,created:now},201);
    }

    const fileMatch=path.match(/^\/pdfs\/([^/]+)\/file$/);
    if(fileMatch&&method==='GET'){
      const u=await authUser(request,env),id=decodeURIComponent(fileMatch[1]),row=await env.DB.prepare('SELECT name,size,r2_key FROM pdfs WHERE id=? AND user_id=?').bind(id,u.id).first();if(!row)return error('PDF nicht gefunden.',404);
      const obj=await env.PDFS.get(row.r2_key);if(!obj)return error('PDF-Datei fehlt im Speicher.',404);
      return new Response(obj.body,{headers:{'Content-Type':'application/pdf','Content-Length':String(row.size),'Content-Disposition':`inline; filename*=UTF-8''${encodeURIComponent(row.name)}`,'Cache-Control':'private, no-store'}});
    }

    const pdfMatch=path.match(/^\/pdfs\/([^/]+)$/);
    if(pdfMatch&&method==='DELETE'){
      const u=await authUser(request,env),id=decodeURIComponent(pdfMatch[1]),row=await env.DB.prepare('SELECT r2_key FROM pdfs WHERE id=? AND user_id=?').bind(id,u.id).first();if(!row)return error('PDF nicht gefunden.',404);
      await env.PDFS.delete(row.r2_key);await env.DB.prepare('DELETE FROM pdfs WHERE id=? AND user_id=?').bind(id,u.id).run();return json({ok:true});
    }

    if(path==='/pdfs'&&method==='DELETE'){
      const u=await authUser(request,env),{results=[]}=await env.DB.prepare('SELECT r2_key FROM pdfs WHERE user_id=?').bind(u.id).all();const keys=results.map(x=>x.r2_key);for(let i=0;i<keys.length;i+=500)await env.PDFS.delete(keys.slice(i,i+500));await env.DB.prepare('DELETE FROM pdfs WHERE user_id=?').bind(u.id).run();return json({ok:true,count:keys.length});
    }

    if(path==='/account'&&method==='DELETE'){
      const u=await authUser(request,env),body=await readBody(request),password=String(body.password||''),row=await env.DB.prepare('SELECT password_hash,password_salt FROM users WHERE id=?').bind(u.id).first();
      const candidate=await hashPassword(password,base64ToBytes(row.password_salt));if(!safeEqual(candidate,row.password_hash))return error('Passwort ist falsch.',401);
      const {results=[]}=await env.DB.prepare('SELECT r2_key FROM pdfs WHERE user_id=?').bind(u.id).all(),keys=results.map(x=>x.r2_key);for(let i=0;i<keys.length;i+=500)await env.PDFS.delete(keys.slice(i,i+500));
      await env.DB.batch([
        env.DB.prepare('DELETE FROM pdfs WHERE user_id=?').bind(u.id),env.DB.prepare('DELETE FROM sessions WHERE user_id=?').bind(u.id),env.DB.prepare('DELETE FROM user_state WHERE user_id=?').bind(u.id),env.DB.prepare('DELETE FROM users WHERE id=?').bind(u.id)
      ]);
      return json({ok:true},200,{'Set-Cookie':clearSessionCookie(request)});
    }

    return error('API-Endpunkt nicht gefunden.',404);
  }catch(err){
    console.error(err);if(err?.status)return error(err.message,err.status);return error('Interner Serverfehler.',500);
  }
}

export default {
  async fetch(request,env){
    const url=new URL(request.url);
    if(url.pathname.startsWith('/api/'))return apiRouter(request,env);
    return env.ASSETS.fetch(request);
  }
};
