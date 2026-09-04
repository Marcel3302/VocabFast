const securityHeaders = {
  'X-Content-Type-Options':'nosniff',
  'Referrer-Policy':'strict-origin-when-cross-origin',
  'Permissions-Policy':'camera=(), geolocation=(), microphone=(self), payment=(self)',
  'X-Frame-Options':'DENY',
  'X-Robots-Tag':'noindex, nofollow, noarchive'
};

const SESSION_COOKIE='vf_preview_session';
const SESSION_DAYS=30;
const PASSWORD_ITERATIONS=120000;
const encoder=new TextEncoder();

function json(data,status=200,headers={}) {
  return new Response(JSON.stringify(data),{
    status,
    headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...headers}
  });
}

function withSecurity(response,url) {
  const headers=new Headers(response.headers);
  for(const [key,value] of Object.entries(securityHeaders))headers.set(key,value);
  if(!headers.has('Cache-Control'))headers.set('Cache-Control',url.pathname.includes('/assets/')?'public, max-age=31536000, immutable':'no-cache');
  return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
}

function clean(value,max=120) {
  return String(value??'').replace(/\0/g,'').trim().replace(/\s+/g,' ').slice(0,max);
}

function normalizeEmail(value) {
  return clean(value,180).toLowerCase();
}

function cookies(request) {
  const out={};
  for(const part of (request.headers.get('Cookie')||'').split(';')) {
    const index=part.indexOf('=');
    if(index>0)out[part.slice(0,index).trim()]=decodeURIComponent(part.slice(index+1).trim());
  }
  return out;
}

async function body(request) {
  try{return await request.json();}catch{return {};}
}

function sameOrigin(request) {
  const origin=request.headers.get('Origin');
  return !origin||origin===new URL(request.url).origin;
}

function bytesToB64(bytes) {
  let value='';
  for(const byte of bytes)value+=String.fromCharCode(byte);
  return btoa(value);
}

function b64ToBytes(value) {
  return Uint8Array.from(atob(String(value||'')),char=>char.charCodeAt(0));
}

function randomToken(size=32) {
  const bytes=crypto.getRandomValues(new Uint8Array(size));
  return bytesToB64(bytes).replaceAll('+','-').replaceAll('/','_').replaceAll('=','');
}

async function sha256(value) {
  const digest=new Uint8Array(await crypto.subtle.digest('SHA-256',encoder.encode(String(value))));
  return [...digest].map(byte=>byte.toString(16).padStart(2,'0')).join('');
}

function safeEqual(a,b) {
  const left=String(a??''),right=String(b??'');
  if(left.length!==right.length)return false;
  let diff=0;
  for(let index=0;index<left.length;index+=1)diff|=left.charCodeAt(index)^right.charCodeAt(index);
  return diff===0;
}

async function derivePassword(password,salt,iterations=PASSWORD_ITERATIONS) {
  const base=await crypto.subtle.importKey('raw',encoder.encode(String(password)),'PBKDF2',false,['deriveBits']);
  const bits=await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt,iterations},base,256);
  return bytesToB64(new Uint8Array(bits));
}

function sessionCookie(token,maxAge=SESSION_DAYS*86400) {
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

function publicUser(account) {
  return account?{id:account.id,email:account.email,name:account.name,createdAt:account.createdAt,plan:account.plan==='pro'?'pro':'free'}:null;
}

function accountStore(env) {
  if(!env?.PREVIEW_ACCOUNTS)throw new Error('Preview account storage is not configured.');
  const id=env.PREVIEW_ACCOUNTS.idFromName('global');
  return env.PREVIEW_ACCOUNTS.get(id);
}

export class PreviewAccountStore {
  constructor(state) {
    this.storage=state.storage;
  }

  async accountBySession(request) {
    const token=cookies(request)[SESSION_COOKIE];
    if(!token)return null;
    const hash=await sha256(token);
    const session=await this.storage.get(`session:${hash}`);
    if(!session)return null;
    if(Number(session.expiresAt)<=Date.now()) {
      await this.storage.delete(`session:${hash}`);
      return null;
    }
    const account=await this.storage.get(`account:${session.userId}`);
    return account?{account,tokenHash:hash}:null;
  }

  async createSession(account) {
    const token=randomToken();
    const hash=await sha256(token);
    const now=Date.now();
    await this.storage.put(`session:${hash}`,{userId:account.id,createdAt:now,expiresAt:now+SESSION_DAYS*86400000});
    return token;
  }

  async register(request) {
    if(!sameOrigin(request))return json({error:'Ungültiger Ursprung.'},403);
    const data=await body(request);
    const name=clean(data.name,60),email=normalizeEmail(data.email),password=String(data.password||'');
    if(name.length<2)return json({error:'Bitte gib deinen Namen ein.'},400);
    if(!/^\S+@\S+\.\S+$/.test(email))return json({error:'Bitte gib eine gültige E-Mail-Adresse ein.'},400);
    if(password.length<12)return json({error:'Das Passwort muss mindestens 12 Zeichen lang sein.'},400);
    if(password.length>256)return json({error:'Das Passwort ist zu lang.'},400);
    const emailHash=await sha256(email);
    if(await this.storage.get(`email:${emailHash}`))return json({error:'Für diese E-Mail existiert bereits ein Konto.'},409);
    const id=crypto.randomUUID();
    const salt=crypto.getRandomValues(new Uint8Array(16));
    const passwordHash=await derivePassword(password,salt);
    const account={id,email,name,plan:'free',createdAt:Date.now(),passwordSalt:bytesToB64(salt),passwordHash,passwordIterations:PASSWORD_ITERATIONS};
    await this.storage.put(`account:${id}`,account);
    await this.storage.put(`email:${emailHash}`,id);
    const token=await this.createSession(account);
    return json({ok:true,user:publicUser(account),isNew:true},201,{'Set-Cookie':sessionCookie(token)});
  }

  async login(request) {
    if(!sameOrigin(request))return json({error:'Ungültiger Ursprung.'},403);
    const data=await body(request);
    const email=normalizeEmail(data.email),password=String(data.password||'');
    const emailHash=await sha256(email);
    const rateKey=`login-rate:${emailHash}`;
    const now=Date.now();
    const rate=await this.storage.get(rateKey)||{count:0,resetAt:now+15*60*1000};
    const activeRate=Number(rate.resetAt)>now?rate:{count:0,resetAt:now+15*60*1000};
    if(Number(activeRate.count)>=10)return json({error:'Zu viele Anmeldeversuche. Bitte in einigen Minuten erneut versuchen.'},429);
    const id=await this.storage.get(`email:${emailHash}`);
    const account=id?await this.storage.get(`account:${id}`):null;
    let valid=false;
    if(account?.passwordSalt&&account?.passwordHash) {
      try{
        const derived=await derivePassword(password,b64ToBytes(account.passwordSalt),Number(account.passwordIterations)||PASSWORD_ITERATIONS);
        valid=safeEqual(derived,account.passwordHash);
      }catch{valid=false;}
    }
    if(!valid) {
      await this.storage.put(rateKey,{count:Number(activeRate.count)+1,resetAt:activeRate.resetAt});
      return json({error:'E-Mail oder Passwort ist falsch.'},401);
    }
    await this.storage.delete(rateKey);
    const token=await this.createSession(account);
    return json({ok:true,user:publicUser(account),isNew:false},200,{'Set-Cookie':sessionCookie(token)});
  }

  async logout(request) {
    if(!sameOrigin(request))return json({error:'Ungültiger Ursprung.'},403);
    const token=cookies(request)[SESSION_COOKIE];
    if(token)await this.storage.delete(`session:${await sha256(token)}`);
    return json({ok:true},200,{'Set-Cookie':sessionCookie('',0)});
  }

  async me(request) {
    const session=await this.accountBySession(request);
    return json({user:session?publicUser(session.account):null});
  }

  async stateApi(request) {
    const session=await this.accountBySession(request);
    if(!session)return json({error:'Bitte zuerst anmelden.'},401);
    const key=`state:${session.account.id}`;
    if(request.method==='GET') {
      const state=await this.storage.get(key);
      return json({state:state??null});
    }
    if(request.method==='PUT') {
      if(!sameOrigin(request))return json({error:'Ungültiger Ursprung.'},403);
      const data=await body(request);
      const state=data.state??data;
      let serialized='';
      try{serialized=JSON.stringify(state);}catch{return json({error:'Der Lernstand konnte nicht verarbeitet werden.'},400);}
      if(serialized.length>1_500_000)return json({error:'Der Lernstand ist zu groß.'},413);
      const next={...state,savedAt:new Date().toISOString()};
      await this.storage.put(key,next);
      return json({ok:true,savedAt:next.savedAt});
    }
    return json({error:'Methode nicht erlaubt.'},405,{Allow:'GET, PUT'});
  }

  async fetch(request) {
    const path=new URL(request.url).pathname;
    if(path==='/api/preview/auth/register'&&request.method==='POST')return this.register(request);
    if(path==='/api/preview/auth/login'&&request.method==='POST')return this.login(request);
    if(path==='/api/preview/auth/logout'&&request.method==='POST')return this.logout(request);
    if(path==='/api/preview/me'&&request.method==='GET')return this.me(request);
    if(path==='/api/preview/state')return this.stateApi(request);
    return json({error:'Preview account route not found.'},404);
  }
}

export default {
  async fetch(request,env) {
    const url=new URL(request.url);
    if(url.pathname==='/api/preview/health') {
      return withSecurity(json({ok:true,service:'vocabfast-language-preview',environment:'preview',accounts:'durable-object-v1'}),url);
    }

    if(url.pathname.startsWith('/api/preview/auth/')||url.pathname==='/api/preview/me'||url.pathname==='/api/preview/state') {
      try{return withSecurity(await accountStore(env).fetch(request),url);}
      catch(error){console.error('preview account api error',error);return withSecurity(json({error:'Die Preview-Konto-API ist gerade nicht verfügbar.'},503),url);}
    }

    if(url.pathname.startsWith('/api/')) {
      return withSecurity(json({error:'Dieser isolierte Preview-Worker stellt keine Produktions-API bereit.'},404),url);
    }

    const response=await env.ASSETS.fetch(request);
    return withSecurity(response,url);
  }
};
