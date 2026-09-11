const PING_INTERVAL_MS=30_000;
const IDLE_AFTER_MS=120_000;
let timer:number|undefined;
let lastInteraction=Date.now();
let running=false;
let listenersInstalled=false;

function markActive(){lastInteraction=Date.now();}
function recentlyActive(){return Date.now()-lastInteraction<=IDLE_AFTER_MS;}
async function ping(keepalive=false,forceVisible=false){
  if(!running||!recentlyActive()||(!forceVisible&&document.visibilityState!=='visible'))return;
  try{await fetch('/api/preview/activity',{method:'POST',credentials:'same-origin',cache:'no-store',keepalive,headers:{'Content-Type':'application/json'},body:'{}'});}catch{/* Analytics may never interrupt learning. */}
}
function handleVisibility(){if(document.visibilityState==='visible'){markActive();void ping();}else void ping(true,true);}
function finalPing(){void ping(true,true);}
function installListeners(){
  if(listenersInstalled)return;
  listenersInstalled=true;
  const events:Array<keyof WindowEventMap>=['pointerdown','keydown','touchstart','scroll','focus'];
  for(const event of events)window.addEventListener(event,markActive,{passive:true});
  document.addEventListener('visibilitychange',handleVisibility);
  window.addEventListener('pagehide',finalPing);
}

export function startActivityTracking(){
  if(typeof window==='undefined'||running)return;
  installListeners();running=true;lastInteraction=Date.now();
  void ping();
  timer=window.setInterval(()=>void ping(),PING_INTERVAL_MS);
}

export function stopActivityTracking(){
  if(typeof window==='undefined'||!running)return;
  void ping(true,true);running=false;
  if(timer!==undefined){window.clearInterval(timer);timer=undefined;}
}
