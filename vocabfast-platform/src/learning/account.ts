export type AccountUser = {
  id:string;
  email:string;
  name:string;
  createdAt:number;
  plan:'free'|'pro';
};

export type AuthResult = {
  user:AccountUser;
  isNew:boolean;
};

export type PlatformSnapshot = {
  schema:1;
  savedAt?:string;
  storage:Record<string,string>;
};

const PLATFORM_PREFIX='vocabfast.platform.';
let syncTimer:number|undefined;
let syncInFlight:Promise<void>|null=null;

function freshApiUrl(path:string) {
  const separator=path.includes('?')?'&':'?';
  return `${path}${separator}_=${Date.now()}`;
}

async function responseJson<T>(response:Response):Promise<T> {
  const data=await response.json().catch(()=>({})) as T&{error?:string};
  if(!response.ok)throw new Error(data.error||'Die Anfrage ist fehlgeschlagen.');
  return data;
}

function clearBillingReturnQuery() {
  if(typeof window==='undefined')return;
  const url=new URL(window.location.href);
  url.searchParams.delete('upgrade');
  url.searchParams.delete('session_id');
  url.searchParams.delete('billing');
  window.history.replaceState({},'',`${url.pathname}${url.search}${url.hash}`);
}

async function reconcileBillingReturn() {
  if(typeof window==='undefined')return;
  const params=new URLSearchParams(window.location.search),upgrade=params.get('upgrade'),sessionId=params.get('session_id');
  if(upgrade!=='success'||!sessionId){if(upgrade==='cancelled'||params.get('billing')==='return')clearBillingReturnQuery();return;}
  try {
    const response=await fetch('/api/preview/billing/sync',{
      method:'POST',credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId})
    });
    await responseJson<{ok:boolean;plan:'free'|'pro'}>(response);
    window.dispatchEvent(new CustomEvent('vocabfast-billing',{detail:'updated'}));
  } catch(error) {
    console.error('billing return reconciliation failed',error);
    window.dispatchEvent(new CustomEvent('vocabfast-billing',{detail:'error'}));
  } finally {
    clearBillingReturnQuery();
  }
}

export async function currentAccount():Promise<AccountUser|null> {
  const response=await fetch(freshApiUrl('/api/preview/me'),{credentials:'same-origin',cache:'no-store',headers:{Accept:'application/json'}});
  const data=await responseJson<{user:AccountUser|null}>(response);
  return data.user;
}

export async function registerAccount(input:{name:string;email:string;password:string}):Promise<AuthResult> {
  const response=await fetch('/api/preview/auth/register',{
    method:'POST',credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json'},body:JSON.stringify(input)
  });
  return responseJson<AuthResult>(response);
}

export async function loginAccount(input:{email:string;password:string}):Promise<AuthResult> {
  const response=await fetch('/api/preview/auth/login',{
    method:'POST',credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json'},body:JSON.stringify(input)
  });
  return responseJson<AuthResult>(response);
}

export async function logoutAccount() {
  const response=await fetch('/api/preview/auth/logout',{method:'POST',credentials:'same-origin',cache:'no-store'});
  await responseJson<{ok:boolean}>(response);
}

export async function changeAccountPassword(input:{currentPassword:string;newPassword:string}) {
  const response=await fetch('/api/preview/account/password',{
    method:'POST',credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json'},body:JSON.stringify(input)
  });
  await responseJson<{ok:boolean}>(response);
}

export async function deleteAccount(password:string) {
  const response=await fetch('/api/preview/account',{
    method:'DELETE',credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json'},body:JSON.stringify({password})
  });
  await responseJson<{ok:boolean}>(response);
}

export function clearPlatformStorage() {
  const keys:string[]=[];
  for(let index=0;index<localStorage.length;index+=1) {
    const key=localStorage.key(index);
    if(key?.startsWith(PLATFORM_PREFIX))keys.push(key);
  }
  for(const key of keys)localStorage.removeItem(key);
}

export function capturePlatformSnapshot():PlatformSnapshot {
  const storage:Record<string,string>={};
  for(let index=0;index<localStorage.length;index+=1) {
    const key=localStorage.key(index);
    if(!key?.startsWith(PLATFORM_PREFIX))continue;
    const value=localStorage.getItem(key);
    if(value!==null)storage[key]=value;
  }
  return {schema:1,storage};
}

export function applyPlatformSnapshot(snapshot:PlatformSnapshot|null) {
  clearPlatformStorage();
  if(!snapshot||snapshot.schema!==1||!snapshot.storage||typeof snapshot.storage!=='object')return;
  for(const [key,value] of Object.entries(snapshot.storage)) {
    if(key.startsWith(PLATFORM_PREFIX)&&typeof value==='string')localStorage.setItem(key,value);
  }
}

export async function loadAccountState():Promise<boolean> {
  const response=await fetch(freshApiUrl('/api/preview/state'),{credentials:'same-origin',cache:'no-store',headers:{Accept:'application/json'}});
  const data=await responseJson<{state:PlatformSnapshot|null}>(response);
  applyPlatformSnapshot(data.state);
  return Boolean(data.state);
}

export async function saveAccountState() {
  const state=capturePlatformSnapshot();
  const response=await fetch('/api/preview/state',{
    method:'PUT',credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json'},body:JSON.stringify({state})
  });
  await responseJson<{ok:boolean}>(response);
}

export function queueAccountSync(delay=750) {
  if(typeof window==='undefined')return;
  if(syncTimer!==undefined)window.clearTimeout(syncTimer);
  syncTimer=window.setTimeout(()=>{
    syncTimer=undefined;
    syncInFlight=saveAccountState().then(()=>window.dispatchEvent(new CustomEvent('vocabfast-sync',{detail:'saved'}))).catch(()=>window.dispatchEvent(new CustomEvent('vocabfast-sync',{detail:'error'}))).then(()=>{}).finally(()=>{syncInFlight=null;});
  },delay);
}

export async function flushAccountSync() {
  if(syncTimer!==undefined) {
    window.clearTimeout(syncTimer);
    syncTimer=undefined;
  }
  if(syncInFlight)await syncInFlight;
  await saveAccountState().catch(()=>{});
}

export async function bootstrapAccount() {
  await reconcileBillingReturn();
  const user=await currentAccount();
  if(!user)return {user:null as AccountUser|null,hasRemoteState:false};
  const hasRemoteState=await loadAccountState();
  return {user,hasRemoteState};
}
