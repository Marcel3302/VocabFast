import { queueAccountSync } from './account';

export type DuolingoCourse={
  id:string;
  title:string;
  learningLanguage:string;
  fromLanguage:string;
  xp:number;
  crowns:number;
};

export type DuolingoProfile={
  username:string;
  name:string;
  streak:number;
  totalXp:number;
  monthlyXp:number;
  learningLanguage:string;
  fromLanguage:string;
  courses:DuolingoCourse[];
  fetchedAt:number;
};

export type DuolingoConnection={
  username:string;
  profile:DuolingoProfile|null;
  connectedAt:number;
  updatedAt:number;
};

const KEY='vocabfast.platform.duolingo.v1';

export function readDuolingoConnection():DuolingoConnection|null{
  try{
    const raw=localStorage.getItem(KEY);if(!raw)return null;
    const parsed=JSON.parse(raw) as Partial<DuolingoConnection>;
    if(typeof parsed.username!=='string'||!parsed.username.trim())return null;
    return{
      username:parsed.username.trim(),
      profile:parsed.profile&&typeof parsed.profile==='object'?parsed.profile as DuolingoProfile:null,
      connectedAt:Number(parsed.connectedAt)||Date.now(),
      updatedAt:Number(parsed.updatedAt)||0
    };
  }catch{return null;}
}

function save(connection:DuolingoConnection|null){
  try{
    if(connection)localStorage.setItem(KEY,JSON.stringify(connection));
    else localStorage.removeItem(KEY);
    queueAccountSync(100);
  }catch{/* optional */}
}

export async function fetchDuolingoProfile(username:string):Promise<DuolingoProfile>{
  const response=await fetch('/api/platform/duolingo?username='+encodeURIComponent(username.trim()),{credentials:'same-origin',cache:'no-store',headers:{Accept:'application/json'}});
  const data=await response.json().catch(()=>({})) as {profile?:DuolingoProfile;error?:string};
  if(!response.ok||!data.profile)throw new Error(data.error||'Duolingo konnte nicht synchronisiert werden.');
  return data.profile;
}

export async function connectDuolingo(username:string){
  const current=readDuolingoConnection(),profile=await fetchDuolingoProfile(username);
  const connection:DuolingoConnection={
    username:profile.username||username.trim(),
    profile,
    connectedAt:current?.username.toLowerCase()===username.trim().toLowerCase()?current.connectedAt:Date.now(),
    updatedAt:Date.now()
  };
  save(connection);return connection;
}

export async function refreshDuolingo(){
  const current=readDuolingoConnection();if(!current)return null;
  const profile=await fetchDuolingoProfile(current.username);
  const next={...current,username:profile.username||current.username,profile,updatedAt:Date.now()};
  save(next);return next;
}

export function disconnectDuolingo(){save(null);}

export function duolingoSyncDue(maxAgeMs=6*60*60*1000){
  const current=readDuolingoConnection();
  return Boolean(current&&Date.now()-current.updatedAt>maxAgeMs);
}
