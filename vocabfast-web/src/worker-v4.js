import workerV3 from './worker-v3.js';

const API_VERSION = 'vocabfast-v4-ai-topics';
const MODEL = '@cf/google/gemma-4-26b-a4b-it';

function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-VocabFast-API':API_VERSION}});}
function cleanText(v,max=160){return String(v||'').trim().replace(/\s+/g,' ').slice(0,max);}
function level(v){const x=String(v||'B2').toUpperCase();return /^(A1|A2|B1|B2|C1|C2)$/.test(x)?x:'B2';}
function normalizeWord(w){
  if(!w||typeof w!=='object')return null;
  const en=cleanText(w.en??w.english??w.term,120),de=cleanText(w.de??w.german??w.translation,180);
  if(!en||!de)return null;
  return {en,de,level:level(w.level??w.cefr),importance:Math.max(1,Math.min(5,Number(w.importance)||3))};
}
function dedupe(words){const m=new Map();for(const w of words.map(normalizeWord).filter(Boolean)){const k=w.en.toLowerCase()+'|'+w.de.toLowerCase();if(!m.has(k))m.set(k,w);}return [...m.values()];}

const REFRACTORY = [
['refractory lining','feuerfeste Ausmauerung','B2',5],['refractory material','Feuerfestwerkstoff','B2',5],['refractory brick','Feuerfeststein','B2',5],['firebrick','Schamottestein / Feuerfeststein','B2',5],['fireclay brick','Schamottestein','B2',5],['fireclay','Feuer-/Schamotteton','B2',4],['chamotte','Schamotte','B2',5],['grog','Schamottegrog / gebrannter Tonzuschlag','C1',4],['refractory mortar','Feuerfestmörtel','B2',5],['refractory cement','Feuerfestzement','B2',4],['castable refractory','Gießfeuerfestmasse','C1',5],['low-cement castable','zementarme Gießmasse','C1',4],['ultra-low-cement castable','ultrazementarme Gießmasse','C2',3],['no-cement castable','zementfreie Gießmasse','C2',3],['refractory concrete','Feuerfestbeton','B2',5],['ramming mix','Stampfmasse','C1',4],['gunning mix','Spritzmasse','C1',4],['shotcrete refractory','gespritzte Feuerfestmasse','C1',3],['plastic refractory','plastische Feuerfestmasse','C1',3],['patching material','Reparaturmasse','B2',4],['refractory coating','Feuerfestbeschichtung','B2',3],['ceramic fiber','Keramikfaser','B2',4],['ceramic fiber blanket','Keramikfasermatte','B2',4],['insulating firebrick','Isolierfeuerstein','C1',4],['insulating refractory','wärmedämmender Feuerfestwerkstoff','C1',3],['backup lining','Hintermauerung / Backup-Auskleidung','C1',4],['working lining','Arbeitsfutter / Verschleißauskleidung','C1',5],['safety lining','Sicherheitsfutter','C1',3],['hot face','Heißseite / Feuerseite','B2',5],['cold face','Kaltseite','B2',4],['lining thickness','Ausmauerungsdicke','B2',4],['brick course','Steinlage','B2',4],['bond pattern','Mauerverband','C1',3],['running bond','Läuferverband','C1',3],['ring lining','Ringausmauerung','C1',4],['arch brick','Gewölbestein','C1',4],['wedge brick','Keilstein','C1',4],['key brick','Schlussstein','C1',4],['skewback','Widerlagerstein','C2',3],['expansion joint','Dehnfuge','B2',5],['expansion allowance','Dehnungszugabe','C1',4],['refractory anchor','Feuerfestanker','B2',5],['anchor system','Ankersystem','B2',4],['V-anchor','V-Anker','C1',4],['Y-anchor','Y-Anker','C1',4],['stud anchor','Bolzenanker','C1',4],['anchor spacing','Ankerabstand','C1',4],['stainless steel anchor','Edelstahlanker','C1',3],['burn-off tip','Abbrandspitze des Ankers','C2',2],['formwork','Schalung','B1',4],['casting','Vergießen / Einbringen','B2',4],['ramming','Stampfen','B2',4],['gunning','Spritzauftrag','C1',4],['trowelling','Glätten mit Kelle','B2',3],['vibration compaction','Vibrationsverdichtung','C1',4],['curing','Nachbehandlung / Aushärten','B2',5],['drying','Trocknung','B1',5],['dry-out','kontrolliertes Austrocknen','C1',5],['dry-out schedule','Trocknungsplan','C1',5],['heat-up curve','Aufheizkurve','C1',5],['controlled heat-up','kontrolliertes Aufheizen','C1',5],['holding temperature','Haltetemperatur','B2',4],['steam spalling','Dampf-Abplatzung','C2',4],['explosive spalling','explosionsartiges Abplatzen','C2',5],['spalling','Abplatzen','C1',5],['cracking','Rissbildung','B2',5],['joint opening','Fugenöffnung','C1',3],['erosion','Erosion / Abtrag','B2',4],['abrasion','Abrieb','B2',4],['chemical attack','chemischer Angriff','B2',4],['slag attack','Schlackenangriff','C1',5],['alkali attack','Alkaliangriff','C1',4],['corrosion resistance','Korrosionsbeständigkeit','C1',4],['slag resistance','Schlackenbeständigkeit','C1',5],['thermal shock resistance','Temperaturwechselbeständigkeit','C1',5],['refractoriness','Feuerfestigkeit','C1',5],['refractoriness under load','Druckerweichung / Feuerfestigkeit unter Last','C2',4],['softening temperature','Erweichungstemperatur','C1',4],['service temperature','Anwendungstemperatur','B2',5],['maximum service temperature','maximale Anwendungstemperatur','B2',5],['thermal conductivity','Wärmeleitfähigkeit','B2',5],['thermal expansion','Wärmeausdehnung','B2',5],['permanent linear change','bleibende Längenänderung','C2',4],['bulk density','Rohdichte','C1',4],['apparent porosity','scheinbare Porosität','C1',4],['open porosity','offene Porosität','C1',4],['cold crushing strength','Kaltdruckfestigkeit','C2',5],['modulus of rupture','Biegebruchfestigkeit','C2',4],['hot modulus of rupture','Heißbiegefestigkeit','C2',4],['creep in compression','Druckkriechen','C2',4],['pyrometric cone equivalent','Segerkegelwert / Feuerfestigkeitskennwert','C2',3],['alumina','Aluminiumoxid','B2',4],['silica','Siliziumdioxid','B2',4],['magnesia','Magnesiumoxid','C1',4],['doloma','Doloma / gebrannter Dolomit','C1',3],['silicon carbide','Siliziumkarbid','C1',4],['zirconia','Zirkonoxid','C1',3],['andalusite','Andalusit','C1',3],['mullite','Mullit','C1',4],['bauxite','Bauxit','B2',3],['calcium aluminate cement','Calciumaluminatzement','C1',5],['binder','Bindemittel','B2',4],['aggregate','Zuschlagstoff / Korn','B2',4],['fine fraction','Feinanteil','C1',3],['grain size distribution','Korngrößenverteilung','C1',4],['water addition','Wasserzugabe','B2',4],['mixing time','Mischzeit','B2',3],['installation temperature','Einbautemperatur','B2',3],['furnace lining','Ofenausmauerung','B2',5],['kiln lining','Ofenauskleidung','B2',5],['rotary kiln lining','Drehrohrofenausmauerung','C1',5],['ladle lining','Pfannenausmauerung','C1',5],['tundish lining','Verteilerrinnen-/Tundish-Auskleidung','C2',4],['boiler lining','Kesselausmauerung','C1',4],['incinerator lining','Verbrennungsanlagenausmauerung','C1',4],['burner block','Brennerstein','C1',5],['peep-hole block','Schaulochstein','C2',3],['wear lining','Verschleißauskleidung','C1',4],['lining inspection','Ausmauerungsinspektion','B2',5],['hot spot','Heißstelle','B1',5],['shell temperature','Manteltemperatur','B2',4],['thermography','Thermografie','B2',4],['lining repair','Ausmauerungsreparatur','B2',5],['brick replacement','Steinaustausch','B2',4],['demolition','Ausbruch / Abbruch','B2',4],['refractory removal','Ausbruch der Feuerfestauskleidung','C1',4]
].map(([en,de,level,importance])=>({en,de,level,importance}));

function fallbackFor(topic){
  const t=topic.toLowerCase();
  if(/feuerfest|ausmauer|schamotte|refractory|firebrick|ofenfutter|ofenauskleidung/.test(t)) return REFRACTORY;
  return [];
}

async function authenticated(request,env){
  const url=new URL('/api/me',request.url);
  const headers=new Headers();const cookie=request.headers.get('Cookie');if(cookie)headers.set('Cookie',cookie);
  const res=await workerV3.fetch(new Request(url,{method:'GET',headers}),env);
  if(!res.ok)return false;
  try{return !!(await res.json()).user;}catch{return false;}
}

function extractArray(text){
  const raw=String(text||'').replace(/```(?:json)?/gi,'').replace(/```/g,'').trim();
  try{const x=JSON.parse(raw);return Array.isArray(x)?x:Array.isArray(x?.words)?x.words:[];}catch{}
  const a=raw.indexOf('['),b=raw.lastIndexOf(']');
  if(a>=0&&b>a){try{const x=JSON.parse(raw.slice(a,b+1));return Array.isArray(x)?x:[];}catch{}}
  return [];
}

async function generateTopic(request,env){
  if(!(await authenticated(request,env)))return json({error:'Bitte zuerst anmelden.',code:'AUTH_REQUIRED'},401);
  let body={};try{body=await request.json();}catch{}
  const name=cleanText(body.name,140),parent=Array.isArray(body.parent)?body.parent.map(x=>cleanText(x,80)).filter(Boolean):[];
  const count=Math.max(40,Math.min(180,Number(body.count)||120));
  if(name.length<3)return json({error:'Bitte einen konkreten Themennamen eingeben.'},400);
  const builtIn=fallbackFor(name+' '+parent.join(' '));
  if(!env.AI?.run){
    if(builtIn.length)return json({words:builtIn.slice(0,count),source:'curated-fallback',model:null});
    return json({error:'Workers AI ist noch nicht mit VocabFast verbunden.',code:'AI_BINDING_MISSING'},503);
  }
  const prompt=`Du erstellst eine hochwertige zweisprachige Fachwortliste für einen deutschsprachigen Englisch-Lernenden.\nThema: ${name}\nÜbergeordnet: ${parent.join(' > ')||'keins'}\nErzeuge bis zu ${count} wirklich themenspezifische englische Fachbegriffe, Bauteile, Materialien, Werkzeuge, Prozesse, Fehlerbilder, Prüfverfahren, Eigenschaften und typische technische Wortgruppen. Keine allgemeinen Füllwörter. Von grundlegenden Begriffen bis zu sehr spezialisiertem C2-/Native-Fachwortschatz.\nAntworte AUSSCHLIESSLICH als JSON-Array. Jedes Objekt exakt: {"en":"English term","de":"präzise deutsche Übersetzung","level":"A1|A2|B1|B2|C1|C2","importance":1-5}. Keine Markdown-Erklärung.`;
  try{
    const result=await env.AI.run(MODEL,{prompt,max_tokens:7000,temperature:0.2});
    const text=result?.response??result?.result?.response??result?.text??'';
    const aiWords=dedupe(extractArray(text));
    const words=dedupe([...builtIn,...aiWords]).slice(0,count);
    if(words.length<10&&builtIn.length)return json({words:builtIn.slice(0,count),source:'curated-fallback',model:MODEL});
    if(!words.length)return json({error:'Die KI hat keine verwertbare Fachwortliste zurückgegeben. Bitte den Themennamen genauer formulieren.',code:'AI_EMPTY'},502);
    return json({words,source:'workers-ai',model:MODEL});
  }catch(err){
    console.error('topic generation failed',err?.stack||err);
    if(builtIn.length)return json({words:builtIn.slice(0,count),source:'curated-fallback',model:MODEL,warning:'Workers AI war nicht verfügbar; kuratierte Fachwortliste verwendet.'});
    return json({error:'Fachwort-Generierung ist momentan nicht verfügbar. Bitte erneut versuchen.',code:'AI_GENERATION_FAILED'},503);
  }
}

export default {
  async fetch(request,env){
    const path=new URL(request.url).pathname;
    if(path==='/api/topics/generate'&&request.method==='POST')return generateTopic(request,env);
    if(path==='/api/health'&&request.method==='GET'){
      const base=await workerV3.fetch(request,env);let data={};try{data=await base.json();}catch{}return json({...data,apiVersion:API_VERSION,workersAI:!!env.AI});
    }
    return workerV3.fetch(request,env);
  }
};
