import { useMemo, useState } from 'react';
import type { CefrLevel } from '../learning/curriculum';
import './companion-views.css';

type SpeakProps={
  level:CefrLevel;
  isPro:boolean;
  onOpenCoach:()=>void;
  onOpenPractice:()=>void;
  onOpenWords:()=>void;
  onOpenPro:()=>void;
};

type TravelProps={
  languageName:string;
  languageSymbol:string;
  level:CefrLevel;
  completedLessons:number;
  totalLessons:number;
  totalXp:number;
  streak:number;
  onOpenTranslator:()=>void;
  onOpenPractice:()=>void;
};

type MeProps={
  name:string;
  languageName:string;
  level:CefrLevel;
  totalXp:number;
  streak:number;
  completedLessons:number;
  totalLessons:number;
  onOpenProgress:()=>void;
  onOpenProfile:()=>void;
  onOpenWords:()=>void;
  onOpenPractice:()=>void;
};

type TripPlan={destination:string;date:string};
const TRIP_KEY='vocabfast-trip-plan-v1';

function readTrip():TripPlan{
  try{
    const parsed=JSON.parse(localStorage.getItem(TRIP_KEY)||'{}') as Partial<TripPlan>;
    return {destination:typeof parsed.destination==='string'?parsed.destination:'',date:typeof parsed.date==='string'?parsed.date:''};
  }catch{return {destination:'',date:''};}
}

function daysUntil(date:string){
  if(!date)return null;
  const target=new Date(`${date}T12:00:00`),today=new Date();
  if(Number.isNaN(target.getTime()))return null;
  today.setHours(12,0,0,0);
  return Math.ceil((target.getTime()-today.getTime())/86400000);
}

function clamp(value:number,min=0,max=100){return Math.max(min,Math.min(max,Math.round(value)));}

export function SpeakView({level,isPro,onOpenCoach,onOpenPractice,onOpenWords,onOpenPro}:SpeakProps){
  const scenarios=[
    ['☕','Smalltalk','Locker sprechen, reagieren und Rückfragen stellen.'],
    ['🏨','Hotel','Einchecken, Wünsche äußern und Probleme lösen.'],
    ['🍽','Restaurant','Bestellen, nachfragen und spontan reagieren.'],
    ['✈','Reise','Flughafen, Orientierung und typische Situationen.'],
  ];
  const startCoach=()=>isPro?onOpenCoach():onOpenPro();
  return <section className="platform-view companion-view speak-view">
    <div className="companion-hero companion-hero-speak">
      <div><span className="eyebrow">SPEAK · REAL LIFE</span><h1>Sprich, statt nur Antworten anzuklicken.</h1><p>Trainiere echte Situationen auf deinem Niveau {level}. VocabFast hilft dir, schneller zu reagieren und sicherer zu sprechen.</p><div className="companion-hero-actions"><button className="view-primary" onClick={startCoach}>🎙 Real Life Mode starten</button><button onClick={onOpenPractice}>Sprechübungen öffnen</button></div></div>
      <div className="companion-orb"><span>AI</span><strong>{level}</strong><small>passt sich dir an</small></div>
    </div>

    <div className="companion-section-head"><div><span>ROLLENSPIELE</span><h2>Übe Situationen, die wirklich passieren.</h2></div><small>Hören · Sprechen · Reagieren</small></div>
    <div className="scenario-grid">{scenarios.map(([icon,title,text])=><button key={title} className="scenario-card" onClick={startCoach}><span>{icon}</span><div><strong>{title}</strong><p>{text}</p></div><b>→</b></button>)}</div>

    <div className="companion-split">
      <article className="companion-card"><span className="companion-kicker">DEIN GESPRÄCH</span><h3>Aus Fehlern werden neue Übungen.</h3><p>Nach dem Sprechen kannst du schwierige Wörter direkt wiederholen und in deinen persönlichen Wortschatz übernehmen.</p><button onClick={onOpenWords}>Meine Wörter öffnen →</button></article>
      <article className="companion-card accent"><span className="companion-kicker">SCHNELLER FORTSCHRITT</span><h3>Keine perfekte Antwort nötig.</h3><p>Im Real-Life-Training zählt, dass du verstanden wirst. Danach verbesserst du Ausdruck, Wortwahl und Sicherheit Schritt für Schritt.</p><button onClick={onOpenPractice}>Jetzt trainieren →</button></article>
    </div>
  </section>;
}

export function TravelView({languageName,languageSymbol,level,completedLessons,totalLessons,totalXp,streak,onOpenTranslator,onOpenPractice}:TravelProps){
  const initial=useMemo(readTrip,[]);
  const [destination,setDestination]=useState(initial.destination);
  const [date,setDate]=useState(initial.date);
  const [saved,setSaved]=useState(false);
  const days=daysUntil(date);
  const lessonRatio=totalLessons?completedLessons/totalLessons:0;
  const readiness=clamp(24+lessonRatio*38+Math.min(totalXp/80,25)+Math.min(streak*1.5,13));
  const modules=[
    ['Hotel',clamp(readiness+11),'Einchecken, Fragen und Probleme lösen'],
    ['Restaurant',clamp(readiness+4),'Bestellen, Wünsche und Allergien erklären'],
    ['Orientierung',clamp(readiness-7),'Nach dem Weg fragen und Verkehr verstehen'],
    ['Notfälle',clamp(readiness-14),'Schnell Hilfe bekommen und Wichtiges erklären'],
  ];
  function save(){localStorage.setItem(TRIP_KEY,JSON.stringify({destination:destination.trim(),date}));setSaved(true);window.setTimeout(()=>setSaved(false),1800);}
  return <section className="platform-view companion-view travel-view">
    <div className="companion-hero companion-hero-travel">
      <div><span className="eyebrow">TRAVEL COMPANION</span><h1>Von heute bis zur Reise – und unterwegs an deiner Seite.</h1><p>Plane dein Reiseziel, trainiere die wichtigsten Situationen und nutze VocabFast unterwegs als schnellen Sprachhelfer.</p></div>
      <div className="travel-readiness"><span>{languageSymbol}</span><strong>{readiness}%</strong><small>Reisebereitschaft</small></div>
    </div>

    <div className="trip-planner-card">
      <div className="trip-planner-copy"><span className="companion-kicker">MEINE REISE</span><h2>{destination||'Wohin geht deine nächste Reise?'}</h2><p>{days===null?'Lege Ziel und Reisedatum fest. VocabFast richtet dein Training darauf aus.':days<0?'Deine geplante Reise liegt bereits in der Vergangenheit.':days===0?'Heute geht es los. Nutze den Schnellzugriff für reale Situationen.':`Noch ${days} ${days===1?'Tag':'Tage'} – genug Zeit für einen fokussierten ${languageName}-Plan.`}</p></div>
      <div className="trip-planner-fields"><label><span>Reiseziel</span><input value={destination} onChange={event=>setDestination(event.target.value)} placeholder="z. B. Rom, Italien"/></label><label><span>Abreise</span><input type="date" value={date} onChange={event=>setDate(event.target.value)}/></label><button className="view-primary" onClick={save}>Reiseplan speichern</button>{saved&&<small>✓ Gespeichert</small>}</div>
    </div>

    <div className="companion-section-head"><div><span>DEIN REISEPLAN · {level}</span><h2>Die Situationen, die zuerst sitzen sollten.</h2></div><button onClick={onOpenPractice}>Training öffnen →</button></div>
    <div className="travel-module-grid">{modules.map(([title,value,text])=><article key={String(title)}><div className="travel-module-top"><strong>{title}</strong><b>{value}%</b></div><div className="travel-module-track"><i style={{width:`${value}%`}}/></div><p>{text}</p></article>)}</div>

    <div className="help-card">
      <div><span className="companion-kicker">HELP ME · SCHNELLHILFE</span><h2>Wenn du jetzt sofort etwas sagen musst.</h2><p>Öffne direkt den Übersetzer für Arzt, Polizei, Unfall, verlorene Dokumente, Hotelprobleme oder eine nicht funktionierende Karte.</p></div>
      <div className="help-actions">{['🩺 Medizin','👮 Polizei','⚠ Unfall','🪪 Dokumente','🏨 Hotel','💳 Karte'].map(item=><button key={item} onClick={onOpenTranslator}>{item}<span>→</span></button>)}</div>
    </div>
  </section>;
}

export function MeView({name,languageName,level,totalXp,streak,completedLessons,totalLessons,onOpenProgress,onOpenProfile,onOpenWords,onOpenPractice}:MeProps){
  const completion=totalLessons?clamp((completedLessons/totalLessons)*100):0;
  return <section className="platform-view companion-view me-view">
    <div className="companion-hero companion-hero-me"><div><span className="eyebrow">MY VOCABFAST</span><h1>{name}, dein Lernen soll sich an dich anpassen.</h1><p>Hier laufen Fortschritt, persönlicher Wortschatz, Lernroutine und deine nächsten Schwerpunkte zusammen.</p></div><div className="me-level"><span>{languageName}</span><strong>{level}</strong><small>aktuelles Niveau</small></div></div>

    <div className="me-stat-grid"><article><span>XP</span><strong>{totalXp}</strong><small>gesammelt</small></article><article><span>STREAK</span><strong>{streak}</strong><small>Tage</small></article><article><span>LEKTIONEN</span><strong>{completedLessons}/{totalLessons}</strong><small>in diesem Level</small></article><article><span>FORTSCHRITT</span><strong>{completion}%</strong><small>aktueller Abschnitt</small></article></div>

    <div className="companion-split">
      <article className="memory-card"><div className="memory-icon">✦</div><div><span className="companion-kicker">VOCABFAST MEMORY</span><h2>Dein persönliches Lernprofil.</h2><p>VocabFast nutzt deinen Kursfortschritt, Wiederholungen und gespeicherten Wortschatz, damit du dich auf das konzentrierst, was für dich gerade am meisten bringt.</p><div className="memory-actions"><button className="view-primary" onClick={onOpenPractice}>Persönlich üben</button><button onClick={onOpenWords}>Wortschatz ansehen</button></div></div></article>
      <article className="companion-card"><span className="companion-kicker">DEINE DATEN</span><h3>Alles an einem Ort.</h3><p>Öffne die detaillierte Lernstatistik oder passe Sprachen, Audio, Lernziel und dein Profil an.</p><div className="stack-actions"><button onClick={onOpenProgress}>Fortschritt & Statistik →</button><button onClick={onOpenProfile}>Profil & Einstellungen →</button></div></article>
    </div>
  </section>;
}
