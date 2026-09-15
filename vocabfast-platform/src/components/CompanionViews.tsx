import { useEffect, useMemo, useRef, useState } from 'react';
import type { CefrLevel } from '../learning/curriculum';
import { consumeSpeakDraft, queueTranslateDraft } from '../learning/study-flow';
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
type SpeechRecognizer={
  lang:string;
  interimResults:boolean;
  continuous:boolean;
  start:()=>void;
  stop:()=>void;
  onresult:((event:unknown)=>void)|null;
  onerror:((event:unknown)=>void)|null;
  onend:(()=>void)|null;
};
type SpeechRecognizerCtor=new()=>SpeechRecognizer;

const TRIP_KEY='vocabfast-trip-plan-v1';

const voicePrompts=[
  {label:'Smalltalk',icon:'☕',prompt:'Hi! How are you doing today?',hint:'Antworte in einem ganzen Satz und stelle danach eine Frage zurück.'},
  {label:'Hotel',icon:'🏨',prompt:'Good evening. Do you have a reservation?',hint:'Sag, auf welchen Namen die Reservierung läuft und für wie viele Nächte.'},
  {label:'Restaurant',icon:'🍽',prompt:'Are you ready to order?',hint:'Bestelle etwas und frage zusätzlich nach einer Empfehlung.'},
  {label:'Reise',icon:'✈',prompt:'Excuse me, where are you trying to go?',hint:'Erkläre dein Ziel und frage nach dem schnellsten Weg.'},
];

const travelPhrases=[
  {label:'Hotel',icon:'🏨',text:'Ich habe eine Reservierung auf meinen Namen. Können Sie mir bitte beim Einchecken helfen?'},
  {label:'Restaurant',icon:'🍽',text:'Können Sie mir etwas Typisches empfehlen? Ich möchte gerne bestellen.'},
  {label:'Taxi',icon:'🚕',text:'Können Sie mich bitte zu dieser Adresse bringen? Wie lange dauert die Fahrt ungefähr?'},
  {label:'Orientierung',icon:'🧭',text:'Entschuldigung, wie komme ich am schnellsten zum Stadtzentrum?'},
];

const emergencyPhrases=[
  {label:'Medizin',icon:'🩺',text:'Ich brauche medizinische Hilfe. Bitte rufen Sie einen Arzt oder einen Rettungswagen.'},
  {label:'Polizei',icon:'👮',text:'Ich brauche Hilfe von der Polizei. Können Sie mir bitte helfen?'},
  {label:'Unfall',icon:'⚠',text:'Es gab einen Unfall. Wir brauchen Hilfe. Niemand soll sich bewegen, bis Hilfe da ist.'},
  {label:'Dokumente',icon:'🪪',text:'Ich habe meine Dokumente verloren. Wo kann ich den Verlust melden?'},
  {label:'Hotelproblem',icon:'🏨',text:'Ich habe ein Problem mit meiner Buchung oder meinem Zimmer. Können Sie mir bitte helfen?'},
  {label:'Karte',icon:'💳',text:'Meine Bankkarte funktioniert nicht. Gibt es eine andere Möglichkeit zu bezahlen?'},
];

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
function normalized(value:string){return value.toLowerCase().replace(/[^a-z0-9' ]/g,' ').replace(/\s+/g,' ').trim();}
function phraseScore(expected:string,heard:string){
  const wanted=normalized(expected).split(' ').filter(Boolean),spoken=normalized(heard).split(' ').filter(Boolean);if(!wanted.length||!spoken.length)return 0;
  const spokenSet=new Set(spoken),hits=wanted.filter(word=>spokenSet.has(word)).length;
  return clamp((hits/wanted.length)*100);
}
function recognizerCtor():SpeechRecognizerCtor|null{
  const speechWindow=window as unknown as {SpeechRecognition?:SpeechRecognizerCtor;webkitSpeechRecognition?:SpeechRecognizerCtor};
  return speechWindow.SpeechRecognition??speechWindow.webkitSpeechRecognition??null;
}
function speak(text:string,lang='en-US'){
  if(!('speechSynthesis' in window))return;
  window.speechSynthesis.cancel();
  const utterance=new SpeechSynthesisUtterance(text);utterance.lang=lang;utterance.rate=.92;window.speechSynthesis.speak(utterance);
}

export function SpeakView({level,isPro,onOpenCoach,onOpenPractice,onOpenWords,onOpenPro}:SpeakProps){
  const [selected,setSelected]=useState(0);
  const [listening,setListening]=useState(false);
  const [heard,setHeard]=useState('');
  const [feedback,setFeedback]=useState('');
  const [translateDraft,setTranslateDraft]=useState(()=>consumeSpeakDraft());
  const [phraseListening,setPhraseListening]=useState(false);
  const [phraseHeard,setPhraseHeard]=useState('');
  const [phraseFeedback,setPhraseFeedback]=useState('');
  const recognitionRef=useRef<SpeechRecognizer|null>(null);
  const current=voicePrompts[selected];
  const startCoach=()=>isPro?onOpenCoach():onOpenPro();

  useEffect(()=>()=>{recognitionRef.current?.stop();window.speechSynthesis?.cancel();},[]);

  function choose(index:number){setSelected(index);setHeard('');setFeedback('');}
  function listen(){
    const Ctor=recognizerCtor();
    if(!Ctor){setFeedback('Dein Browser unterstützt Spracherkennung hier leider nicht. Du kannst den Satz trotzdem anhören und laut beantworten.');return;}
    recognitionRef.current?.stop();
    const recognition=new Ctor();recognition.lang='en-US';recognition.interimResults=false;recognition.continuous=false;
    recognition.onresult=(event:unknown)=>{
      const result=event as {results?:ArrayLike<ArrayLike<{transcript?:string}>>};
      const transcript=result.results?.[0]?.[0]?.transcript?.trim()||'';
      setHeard(transcript);
      const words=normalized(transcript).split(' ').filter(Boolean).length;
      setFeedback(words>=8?'Sehr gut – du hast in einem vollständigen Gedanken geantwortet. Versuche dieselbe Antwort jetzt noch einmal etwas natürlicher.':words>=4?'Guter Start. Ergänze noch einen Grund, ein Detail oder eine Rückfrage.':'Versuche einen ganzen Satz. Perfekt muss er nicht sein – wichtig ist, dass du weiterredest.');
    };
    recognition.onerror=()=>setFeedback('Das Mikrofon konnte deine Antwort nicht erkennen. Prüfe die Mikrofonfreigabe und versuche es erneut.');
    recognition.onend=()=>setListening(false);
    recognitionRef.current=recognition;setListening(true);setHeard('');setFeedback('');recognition.start();
  }
  function listenPracticePhrase(){
    if(!translateDraft)return;
    const Ctor=recognizerCtor();if(!Ctor){setPhraseFeedback('Spracherkennung ist in diesem Browser nicht verfügbar. Höre den Satz an und sprich ihn trotzdem laut nach.');return;}
    recognitionRef.current?.stop();const recognition=new Ctor();recognition.lang='en-US';recognition.interimResults=false;recognition.continuous=false;
    recognition.onresult=(event:unknown)=>{
      const result=event as {results?:ArrayLike<ArrayLike<{transcript?:string}>>};const transcript=result.results?.[0]?.[0]?.transcript?.trim()||'';setPhraseHeard(transcript);
      const score=phraseScore(translateDraft.targetText,transcript);
      setPhraseFeedback(score>=85?`Sehr stark · ${score}% der Kernwörter erkannt. Sprich den Satz noch einmal flüssiger, ohne abzulesen.`:score>=60?`Guter Versuch · ${score}% erkannt. Höre den Satz noch einmal an und wiederhole die fehlenden Teile.`:`${score}% erkannt. Teile den Satz in zwei Stücke, höre ihn erneut an und sprich langsam nach.`);
    };
    recognition.onerror=()=>setPhraseFeedback('Das Mikrofon konnte den Satz nicht zuverlässig erkennen. Prüfe die Freigabe und versuche es erneut.');recognition.onend=()=>setPhraseListening(false);recognitionRef.current=recognition;setPhraseListening(true);setPhraseHeard('');setPhraseFeedback('');recognition.start();
  }

  return <section className="platform-view companion-view speak-view">
    <div className="companion-hero companion-hero-speak">
      <div><span className="eyebrow">SPEAK · REAL LIFE</span><h1>Sprich. Reagiere. Werde sicher.</h1><p>Kein endloses Multiple Choice: Trainiere echte Situationen auf deinem Niveau {level}. Der kostenlose Voice Sprint funktioniert direkt im Browser, der KI-Coach führt längere Gespräche.</p><div className="companion-hero-actions"><button className="view-primary" onClick={()=>document.getElementById(translateDraft?'translate-speak-practice':'voice-sprint')?.scrollIntoView({behavior:'smooth'})}>🎙 {translateDraft?'Meinen Satz trainieren':'Voice Sprint starten'}</button><button onClick={startCoach}>{isPro?'KI-Gespräch öffnen':'KI Real Life · Pro'}</button></div></div>
      <div className="companion-orb"><span>LIVE</span><strong>{level}</strong><small>sprechen statt tippen</small></div>
    </div>

    {translateDraft&&<section className="translate-speak-card" id="translate-speak-practice"><div className="translate-speak-head"><div><span className="companion-kicker">AUS DEINER ÜBERSETZUNG</span><h2>Mach aus dem Satz aktive Sprache.</h2><p>Höre ihn an, sprich ihn ohne Ablesen nach und vergleiche, was die Spracherkennung verstanden hat.</p></div><button onClick={()=>{setTranslateDraft(null);setPhraseHeard('');setPhraseFeedback('');}}>Fertig</button></div><div className="translate-speak-phrase"><small>ZIELSATZ</small><strong>{translateDraft.targetText}</strong><span>{translateDraft.supportText}</span></div><div className="translate-speak-actions"><button onClick={()=>speak(translateDraft.targetText)}>🔊 Anhören</button><button className={phraseListening?'listening':''} onClick={listenPracticePhrase} disabled={phraseListening}>🎙 {phraseListening?'Ich höre zu …':'Jetzt sprechen'}</button><button onClick={onOpenWords}>Zu meinen Karten</button></div><div className="translate-speak-result"><span>ERKANNT</span><strong>{phraseHeard||'Noch kein Versuch.'}</strong><p>{phraseFeedback||'Tipp: Höre einmal zu, schaue dann weg und sprich den Satz frei.'}</p></div></section>}

    <section className="voice-sprint-card" id="voice-sprint">
      <div className="voice-sprint-head"><div><span className="companion-kicker">2-MINUTEN VOICE SPRINT</span><h2>Eine Situation. Eine echte Antwort.</h2><p>Höre den Satz, antworte frei und lass VocabFast prüfen, ob du wirklich ins Sprechen kommst.</p></div><div className="voice-step">{selected+1}<span>/ {voicePrompts.length}</span></div></div>
      <div className="voice-scenarios" role="tablist" aria-label="Sprechsituation wählen">{voicePrompts.map((item,index)=><button key={item.label} className={selected===index?'active':''} onClick={()=>choose(index)}><span>{item.icon}</span>{item.label}</button>)}</div>
      <div className="voice-prompt"><div className="voice-speaker">AI</div><div><small>DEIN GESPRÄCHSPARTNER SAGT</small><strong>{current.prompt}</strong><p>{current.hint}</p></div><button className="voice-listen" onClick={()=>speak(current.prompt)} aria-label="Satz anhören">🔊</button></div>
      <div className="voice-response"><button className={`voice-mic ${listening?'listening':''}`} onClick={listen} disabled={listening}><span>{listening?'◉':'🎙'}</span><strong>{listening?'Ich höre zu …':'Antwort sprechen'}</strong><small>{listening?'Sprich jetzt auf Englisch':'Mikrofon starten'}</small></button><div className="voice-result"><span>DEINE ANTWORT</span><strong>{heard||'Noch keine Antwort aufgenommen.'}</strong><p>{feedback||'Du bekommst direkt kurzes Feedback zur Länge und Gesprächsbereitschaft deiner Antwort.'}</p></div></div>
      <div className="voice-sprint-footer"><button onClick={()=>choose((selected+voicePrompts.length-1)%voicePrompts.length)}>← Zurück</button><button className="view-primary" onClick={()=>choose((selected+1)%voicePrompts.length)}>Nächste Situation →</button></div>
    </section>

    <div className="companion-section-head"><div><span>WEITERTRAINIEREN</span><h2>Aus Sprechen wird echter Fortschritt.</h2></div><small>Hören · Sprechen · Wiederholen</small></div>
    <div className="companion-split">
      <article className="companion-card"><span className="companion-kicker">PERSÖNLICHER WORTSCHATZ</span><h3>Speichere genau die Wörter, die dir fehlen.</h3><p>Baue aus realen Situationen deinen eigenen Wortschatz auf, statt Wörter zu lernen, die du nie verwendest.</p><button onClick={onOpenWords}>Meine Wörter öffnen →</button></article>
      <article className="companion-card accent"><span className="companion-kicker">INTELLIGENTE WIEDERHOLUNG</span><h3>Schwierige Inhalte kommen wieder.</h3><p>Nutze kurze Übungsblöcke zwischen Gesprächen, damit neue Formulierungen nicht gleich wieder verschwinden.</p><button onClick={onOpenPractice}>Persönlich üben →</button></article>
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
  const readiness=clamp(18+lessonRatio*42+Math.min(totalXp/70,27)+Math.min(streak*1.5,13));
  const modules=[
    ['Hotel',clamp(readiness+11),'Einchecken, Fragen und Probleme lösen'],
    ['Restaurant',clamp(readiness+4),'Bestellen, Wünsche und Allergien erklären'],
    ['Orientierung',clamp(readiness-7),'Nach dem Weg fragen und Verkehr verstehen'],
    ['Notfälle',clamp(readiness-14),'Schnell Hilfe bekommen und Wichtiges erklären'],
  ];
  function save(){localStorage.setItem(TRIP_KEY,JSON.stringify({destination:destination.trim(),date}));setSaved(true);window.setTimeout(()=>setSaved(false),1800);}
  function openHelp(text:string){queueTranslateDraft(text,'de');onOpenTranslator();}
  return <section className="platform-view companion-view travel-view">
    <div className="companion-hero companion-hero-travel">
      <div><span className="eyebrow">TRAVEL COMPANION</span><h1>Vorbereiten. Reisen. Weiterlernen.</h1><p>VocabFast baut vor deiner Reise die wichtigen Situationen auf und wird unterwegs zum schnellen Sprachhelfer – ohne dass du zwischen fünf Apps wechseln musst.</p></div>
      <div className="travel-readiness"><span>{languageSymbol}</span><strong>{readiness}%</strong><small>Reisebereitschaft</small></div>
    </div>

    <div className="trip-planner-card">
      <div className="trip-planner-copy"><span className="companion-kicker">MEINE REISE</span><h2>{destination||'Wohin geht deine nächste Reise?'}</h2><p>{days===null?'Lege Ziel und Reisedatum fest. VocabFast richtet deine Vorbereitung darauf aus.':days<0?'Die geplante Reise ist vorbei. Plane die nächste – dein Lernfortschritt bleibt erhalten.':days===0?'Heute geht es los. Die Schnellhilfe ist jetzt dein wichtigster Bereich.':`Noch ${days} ${days===1?'Tag':'Tage'} – nutze kurze, regelmäßige Einheiten für einen fokussierten ${languageName}-Plan.`}</p></div>
      <div className="trip-planner-fields"><label><span>Reiseziel</span><input value={destination} onChange={event=>setDestination(event.target.value)} placeholder="z. B. Rom, Italien"/></label><label><span>Abreise</span><input type="date" value={date} onChange={event=>setDate(event.target.value)}/></label><button className="view-primary" onClick={save}>Reiseplan speichern</button>{saved&&<small>✓ Reiseplan gespeichert</small>}</div>
    </div>

    <div className="travel-focus-banner"><div><span>HEUTE EMPFOHLEN</span><strong>{readiness<45?'Notfälle + Orientierung':readiness<75?'Hotel + Restaurant':'Freie Gespräche & spontane Situationen'}</strong><small>Basierend auf deinem aktuellen {level}-Fortschritt</small></div><button onClick={onOpenPractice}>Training starten →</button></div>

    <div className="companion-section-head"><div><span>REISEBEREITSCHAFT · {level}</span><h2>Was vor der Abreise wirklich sitzen sollte.</h2></div><button onClick={onOpenPractice}>Alle Übungen →</button></div>
    <div className="travel-module-grid">{modules.map(([title,value,text])=><article key={String(title)}><div className="travel-module-top"><strong>{title}</strong><b>{value}%</b></div><div className="travel-module-track"><i style={{width:`${value}%`}}/></div><p>{text}</p></article>)}</div>

    <section className="travel-phrase-kit"><div><span className="companion-kicker">REISESATZ-KIT</span><h2>Ein Klick bis zum nutzbaren Satz.</h2><p>Öffne typische Reisesituationen direkt in Translate. Dort kannst du übersetzen, anhören, speichern und – bei Englisch – sofort ins Sprechtraining wechseln.</p></div><div>{travelPhrases.map(item=><button key={item.label} onClick={()=>openHelp(item.text)}><span>{item.icon}</span><strong>{item.label}</strong><small>Öffnen →</small></button>)}</div></section>

    <div className="help-card">
      <div><span className="companion-kicker">HELP ME · SCHNELLHILFE</span><h2>Wenn du jetzt sofort verstanden werden musst.</h2><p>Wähle die Situation. VocabFast bereitet einen klaren Satz vor und öffnet ihn direkt im Übersetzer. Dort kannst du ihn übersetzen, vorlesen und kopieren.</p></div>
      <div className="help-actions">{emergencyPhrases.map(item=><button key={item.label} onClick={()=>openHelp(item.text)}><span>{item.icon} {item.label}</span><b>→</b></button>)}</div>
    </div>
  </section>;
}

export function MeView({name,languageName,level,totalXp,streak,completedLessons,totalLessons,onOpenProgress,onOpenProfile,onOpenWords,onOpenPractice}:MeProps){
  const completion=totalLessons?clamp((completedLessons/totalLessons)*100):0;
  const focus=streak===0?'Starte heute mit einer kurzen Einheit und baue eine Routine auf.':completion<35?'Bleib im aktuellen Level und festige die Grundlagen mit kurzen Wiederholungen.':completion<75?'Mische Kurslektionen mit aktivem Sprechen, damit Wissen abrufbar wird.':'Du bist weit im Level: mehr freie Anwendung und gezielte Fehlerkorrektur bringen jetzt am meisten.';
  const nextGoal=completion<25?25:completion<50?50:completion<75?75:100;
  return <section className="platform-view companion-view me-view">
    <div className="companion-hero companion-hero-me"><div><span className="eyebrow">MY VOCABFAST</span><h1>{name}, hier wird Lernen persönlich.</h1><p>Fortschritt, Routine, persönlicher Wortschatz und nächste Schwerpunkte laufen hier zusammen – damit du nicht selbst überlegen musst, was als Nächstes sinnvoll ist.</p></div><div className="me-level"><span>{languageName}</span><strong>{level}</strong><small>aktuelles Niveau</small></div></div>

    <div className="me-stat-grid"><article><span>XP</span><strong>{totalXp}</strong><small>gesammelt</small></article><article><span>STREAK</span><strong>{streak}</strong><small>Tage</small></article><article><span>LEKTIONEN</span><strong>{completedLessons}/{totalLessons}</strong><small>in diesem Level</small></article><article><span>FORTSCHRITT</span><strong>{completion}%</strong><small>aktueller Abschnitt</small></article></div>

    <section className="coach-recommendation"><div className="coach-recommendation-mark">✦</div><div><span>VOCABFAST MEMORY · EMPFEHLUNG</span><h2>{focus}</h2><div className="coach-goal"><div><i style={{width:`${Math.min(100,(completion/nextGoal)*100)}%`}}/></div><small>Nächstes Etappenziel: {nextGoal}% im aktuellen Level</small></div></div><button className="view-primary" onClick={onOpenPractice}>Empfohlenes Training</button></section>

    <div className="me-action-grid">
      <button onClick={onOpenWords}><span>W</span><div><strong>Mein Wortschatz</strong><small>Eigene Wörter und Wiederholung</small></div><b>→</b></button>
      <button onClick={onOpenProgress}><span>↗</span><div><strong>Statistik</strong><small>Fortschritt im Detail</small></div><b>→</b></button>
      <button onClick={onOpenProfile}><span>⚙</span><div><strong>Lernprofil</strong><small>Sprachen, Ziel und Audio</small></div><b>→</b></button>
      <button onClick={onOpenPractice}><span>◎</span><div><strong>Smart Review</strong><small>Unsichere Inhalte trainieren</small></div><b>→</b></button>
    </div>

    <div className="companion-split">
      <article className="memory-card"><div className="memory-icon">✦</div><div><span className="companion-kicker">VOCABFAST MEMORY</span><h2>Die App soll dich mit jeder Session besser verstehen.</h2><p>Dein Kursfortschritt, Wiederholungen, Wortschatz und deine Routine werden zu einem Lernprofil verbunden. So rücken Inhalte nach vorne, die dir aktuell wirklich etwas bringen.</p><div className="memory-actions"><button className="view-primary" onClick={onOpenPractice}>Persönlich üben</button><button onClick={onOpenWords}>Wortschatz ansehen</button></div></div></article>
      <article className="companion-card accent"><span className="companion-kicker">DEIN PRINZIP</span><h3>Keine perfekte Serie nötig.</h3><p>Ein verpasster Tag ist kein Neustart. VocabFast zeigt dir den sinnvollsten Wiedereinstieg und hält dein langfristiges Ziel im Blick.</p><button onClick={onOpenProgress}>Meinen Fortschritt ansehen →</button></article>
    </div>
  </section>;
}
