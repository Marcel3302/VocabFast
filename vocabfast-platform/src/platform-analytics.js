const MAX_GAP_MS=90_000;
const MAX_DAYS=120;
const REPORTING_TIMEZONE='Europe/Vienna';

function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});}
function cleanId(value){return String(value||'').trim().slice(0,120);}
function reportingDay(){return new Intl.DateTimeFormat('sv-SE',{timeZone:REPORTING_TIMEZONE,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());}
function normalize(record={}){
  const days=record.days&&typeof record.days==='object'?record.days:{};
  return {
    totalActiveSeconds:Math.max(0,Number(record.totalActiveSeconds)||0),
    firstActiveAt:Number(record.firstActiveAt)||0,
    lastActiveAt:Number(record.lastActiveAt)||0,
    lastPingAt:Number(record.lastPingAt)||0,
    days:Object.fromEntries(Object.entries(days).filter(([day])=>/^\d{4}-\d{2}-\d{2}$/.test(day)).map(([day,seconds])=>[day,Math.max(0,Number(seconds)||0)]))
  };
}
function publicUsage(record){
  const usage=normalize(record),today=reportingDay(),entries=Object.entries(usage.days).sort(([a],[b])=>a.localeCompare(b));
  return {
    totalActiveSeconds:Math.round(usage.totalActiveSeconds),
    todayActiveSeconds:Math.round(usage.days[today]||0),
    firstActiveAt:usage.firstActiveAt||null,
    lastActiveAt:usage.lastActiveAt||null,
    activeDays:entries.filter(([,seconds])=>Number(seconds)>0).length,
    recentActivity:entries.slice(-14).map(([date,seconds])=>({date,seconds:Math.round(Number(seconds)||0)})),
    reportingTimezone:REPORTING_TIMEZONE
  };
}

export class PlatformAnalyticsStore {
  constructor(state){this.storage=state.storage;}

  async ping(request){
    if(request.method!=='POST')return json({error:'Methode nicht erlaubt.'},405);
    const data=await request.json().catch(()=>({})),userId=cleanId(data.userId),day=reportingDay();
    if(!userId)return json({error:'Benutzer fehlt.'},400);
    const key=`usage:${userId}`,now=Date.now(),current=normalize(await this.storage.get(key)||{});
    let credit=0;
    if(current.lastPingAt&&now>current.lastPingAt&&now-current.lastPingAt<=MAX_GAP_MS)credit=Math.min(MAX_GAP_MS,now-current.lastPingAt)/1000;
    const days={...current.days};
    if(credit>0)days[day]=(Number(days[day])||0)+credit;
    const dayKeys=Object.keys(days).sort();
    for(const oldDay of dayKeys.slice(0,Math.max(0,dayKeys.length-MAX_DAYS)))delete days[oldDay];
    const next={totalActiveSeconds:current.totalActiveSeconds+credit,firstActiveAt:current.firstActiveAt||now,lastActiveAt:now,lastPingAt:now,days};
    await this.storage.put(key,next);
    return json({ok:true,usage:publicUsage(next)});
  }

  async summaries(request){
    if(request.method!=='POST')return json({error:'Methode nicht erlaubt.'},405);
    const data=await request.json().catch(()=>({})),ids=Array.isArray(data.userIds)?data.userIds.map(cleanId).filter(Boolean).slice(0,1000):[];
    const keys=ids.map(id=>`usage:${id}`),records=keys.length?await this.storage.get(keys):new Map(),summaries={};
    for(const id of ids)summaries[id]=publicUsage(records.get(`usage:${id}`)||{});
    return json({summaries});
  }

  async one(request,userId){
    if(request.method!=='GET')return json({error:'Methode nicht erlaubt.'},405);
    return json({usage:publicUsage(await this.storage.get(`usage:${cleanId(userId)}`)||{})});
  }

  async remove(request,userId){
    if(request.method!=='DELETE')return json({error:'Methode nicht erlaubt.'},405);
    await this.storage.delete(`usage:${cleanId(userId)}`);
    return json({ok:true});
  }

  async fetch(request){
    const path=new URL(request.url).pathname;
    if(path==='/internal/analytics/ping')return this.ping(request);
    if(path==='/internal/analytics/summaries')return this.summaries(request);
    const match=path.match(/^\/internal\/analytics\/user\/([^/]+)$/);
    if(match&&request.method==='GET')return this.one(request,decodeURIComponent(match[1]));
    if(match&&request.method==='DELETE')return this.remove(request,decodeURIComponent(match[1]));
    return json({error:'Analytics-Route nicht gefunden.'},404);
  }
}
