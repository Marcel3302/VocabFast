const PING_INTERVAL_MS=30_000;
const IDLE_AFTER_MS=120_000;
let timer:number|undefined;
let lastInteraction=Date.now();
let running=false;

function localDay(){
  const now=new Date(),year=now.getFullYear(),month=String(now.getMonth()+1).padStart(2,'0'),day=String(now.getDate()).padStart(2,'0');
  return `${year}-${month}-${day}`;
}
function markActive(){lastInteraction=Date.now();}
function engaged(){return document.visibilityState==='visible'&&Date.now()-lastInteraction<=IDLE_AFTER_MS;}
async function ping(keepalive=false){
  if(!running||!engaged())return;
  try{await fetch('/api/preview/activity',{method:'POST',credentials:'same-origin',cache:'no-store',keepalive,headers:{'Content-Type':'application/json'},body:JSON.stringify({day:localDay()})});}catch{/* Analytics may never interrupt learning. */}
}
function finalPing(){if(running&&document.visibilityState==='visible')void ping(true);}

export function startActivityTracking(){
  if(typeof window==='undefined'||running)return;
  running=true;lastInteraction=Date.now();
  const events:Array<keyof WindowEventMap>=['pointerdown','keydown','touchstart','scroll','focus'];
  for(const event of events)window.addEventListener(event,markActive,{passive:true});
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){markActive();void ping();}else finalPing();});
  window.addEventListener('pagehide',finalPing);
  void ping();
  timer=window.setInterval(()=>void ping(),PING_INTERVAL_MS);
}

export function stopActivityTracking(){
  if(typeof window==='undefined'||!running)return;
  running=false;
  if(timer!==undefined){window.clearInterval(timer);timer=undefined;}
}
