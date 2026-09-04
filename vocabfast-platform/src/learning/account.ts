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

async function responseJson<T>(response:Response):Promise<T> {
  const data=await response.json().catch(()=>({})) as T&{error?:string};
  if(!response.ok)throw new Error(data.error||'Die Anfrage ist fehlgeschlagen.');
  return data;
}

export async function currentAccount():Promise<AccountUser|null> {
  const response=await fetch('/api/preview/me',{credentials:'same-origin',headers:{Accept:'application/json'}});
  const data=await responseJson<{user:AccountUser|null}>(response);
  return data.user;
}

export async function registerAccount(input:{name:string;email:string;password:string}):Promise<AuthResult> {
  const response=await fetch('/api/preview/auth/register',{
    method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify(input)
  });
  return responseJson<AuthResult>(response);
}

export async function loginAccount(input:{email:string;password:string}):Promise<AuthResult> {
  const response=await fetch('/api/preview/auth/login',{
    method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify(input)
  });
  return responseJson<AuthResult>(response);
}

export async function logoutAccount() {
  const response=await fetch('/api/preview/auth/logout',{method:'POST',credentials:'same-origin'});
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
  const response=await fetch('/api/preview/state',{credentials:'same-origin',headers:{Accept:'application/json'}});
  const data=await responseJson<{state:PlatformSnapshot|null}>(response);
  applyPlatformSnapshot(data.state);
  return Boolean(data.state);
}

export async function saveAccountState() {
  const state=capturePlatformSnapshot();
  const response=await fetch('/api/preview/state',{
    method:'PUT',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({state})
  });
  await responseJson<{ok:boolean}>(response);
}

export function queueAccountSync(delay=750) {
  if(typeof window==='undefined')return;
  if(syncTimer!==undefined)window.clearTimeout(syncTimer);
  syncTimer=window.setTimeout(()=>{
    syncTimer=undefined;
    syncInFlight=saveAccountState().catch(()=>{}).finally(()=>{syncInFlight=null;});
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
  const user=await currentAccount();
  if(!user)return {user:null as AccountUser|null,hasRemoteState:false};
  const hasRemoteState=await loadAccountState();
  return {user,hasRemoteState};
}
