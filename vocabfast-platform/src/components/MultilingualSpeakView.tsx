import { useMemo, useState } from 'react';
import type { CefrLevel } from '../learning/curriculum';
import type { LanguageCode } from '../learning/preferences';
import { consumeSpeakDraft } from '../learning/study-flow';
import { recognizeLanguage, speakLanguage } from '../learning/speech';
import './companion-views.css';

type Props={
  level:CefrLevel;
  targetLanguage:LanguageCode;
  languageName:string;
  onOpenPractice:()=>void;
  onOpenWords:()=>void;
};

type Prompt={label:string;icon:string;prompt:string;hint:string};

const promptPacks:Partial<Record<LanguageCode,Prompt[]>>={
  hr:[
    {label:'Smalltalk',icon:'☕',prompt:'Bok! Kako si danas?',hint:'Odgovori cijelom rečenicom i postavi jedno kratko pitanje.'},
    {label:'Hotel',icon:'🏨',prompt:'Dobra večer. Imate li rezervaciju?',hint:'Reci na koje ime glasi rezervacija i koliko noći ostaješ.'},
    {label:'Restaurant',icon:'🍽',prompt:'Jeste li spremni naručiti?',hint:'Naruči jelo i pitaj što preporučuju.'},
    {label:'Reise',icon:'✈',prompt:'Oprostite, kamo želite ići?',hint:'Reci svoje odredište i pitaj za najbrži put.'}
  ]
};

function normalized(value:string){return value.toLocaleLowerCase().normalize('NFKC').replace(/[^\p{L}\p{N}' ]/gu,' ').replace(/\s+/g,' ').trim();}
function phraseScore(expected:string,heard:string){
  const wanted=normalized(expected).split(' ').filter(Boolean),spoken=normalized(heard).split(' ').filter(Boolean);if(!wanted.length||!spoken.length)return 0;
  const spokenSet=new Set(spoken),hits=wanted.filter(word=>spokenSet.has(word)).length;
  return Math.max(0,Math.min(100,Math.round(hits/wanted.length*100)));
}

export default function MultilingualSpeakView({level,targetLanguage,languageName,onOpenPractice,onOpenWords}:Props){
  const prompts=useMemo(()=>promptPacks[targetLanguage]??[],[targetLanguage]);
  const [selected,setSelected]=useState(0);
  const [listening,setListening]=useState(false);
  const [heard,setHeard]=useState('');
  const [feedback,setFeedback]=useState('');
  const [draft,setDraft]=useState(()=>consumeSpeakDraft());
  const [draftListening,setDraftListening]=useState(false);
  const [draftHeard,setDraftHeard]=useState('');
  const [draftFeedback,setDraftFeedback]=useState('');
  const current=prompts[selected]??null;

  function startFreeResponse(){
    if(!current||listening)return;
    setHeard('');setFeedback('');setListening(true);
    const recognition=recognizeLanguage(targetLanguage,transcript=>setHeard(transcript),()=>setListening(false),()=>{setListening(false);setFeedback('Die Spracherkennung konnte deine Antwort nicht zuverlässig erkennen. Prüfe die Mikrofonfreigabe und versuche es erneut.');});
    if(!recognition){setListening(false);setFeedback('Dieser Browser unterstützt hier keine Spracherkennung. Du kannst den Satz trotzdem anhören und laut beantworten.');return;}
    const originalEnd=recognition.onend;recognition.onend=()=>{originalEnd?.();setHeard(value=>{const words=normalized(value).split(' ').filter(Boolean).length;setFeedback(words>=7?'Sehr gut – du hast in einem vollständigen Gedanken geantwortet. Wiederhole ihn jetzt etwas flüssiger.':words>=4?'Guter Start. Ergänze noch ein Detail oder eine Rückfrage.':'Versuche einen ganzen Satz. Perfekt muss er nicht sein – wichtig ist, dass du weiterredest.');return value;});};
  }

  function startDraftPractice(){
    if(!draft||draftListening)return;
    setDraftHeard('');setDraftFeedback('');setDraftListening(true);
    const recognition=recognizeLanguage(targetLanguage,transcript=>setDraftHeard(transcript),()=>setDraftListening(false),()=>{setDraftListening(false);setDraftFeedback('Die Spracherkennung konnte den Satz nicht zuverlässig erkennen.');});
    if(!recognition){setDraftListening(false);setDraftFeedback('Spracherkennung ist in diesem Browser nicht verfügbar. Höre den Satz an und sprich ihn trotzdem laut nach.');return;}
    const originalEnd=recognition.onend;recognition.onend=()=>{originalEnd?.();setDraftHeard(value=>{const score=phraseScore(draft.targetText,value);setDraftFeedback(score>=85?`Sehr stark · ${score}% der Kernwörter erkannt. Jetzt noch einmal flüssig ohne Ablesen.`:score>=60?`Guter Versuch · ${score}% erkannt. Höre noch einmal zu und wiederhole die fehlenden Teile.`:`${score}% erkannt. Teile den Satz in zwei Stücke und sprich langsamer nach.`);return value;});};
  }

  return <section className="platform-view companion-view speak-view">
    <div className="companion-hero companion-hero-speak"><div><span className="eyebrow">SPEAK · {languageName.toUpperCase()}</span><h1>{languageName} aktiv sprechen.</h1><p>Hören, frei antworten und eigene Sätze aus Translate direkt nachsprechen. Das Sprechtraining ist auf deinen {languageName}-Lernpfad und dein Niveau {level} abgestimmt.</p><div className="companion-hero-actions"><button className="view-primary" onClick={()=>document.getElementById(draft?'multilingual-draft':'multilingual-sprint')?.scrollIntoView({behavior:'smooth'})}>🎙 {draft?'Meinen Satz trainieren':'Voice Sprint starten'}</button><button onClick={onOpenPractice}>Weitere Übungen</button></div></div><div className="companion-orb"><span>VOICE</span><strong>{level}</strong><small>{languageName}</small></div></div>

    {draft&&draft.targetLanguage===targetLanguage&&<section className="translate-speak-card" id="multilingual-draft"><div className="translate-speak-head"><div><span className="companion-kicker">AUS TRANSLATE</span><h2>Dein eigener Satz wird zur Sprechübung.</h2><p>Höre die richtige Aussprache, sprich nach und prüfe, welche Wörter erkannt wurden.</p></div><button onClick={()=>{setDraft(null);setDraftHeard('');setDraftFeedback('');}}>Fertig</button></div><div className="translate-speak-phrase"><small>ZIELSATZ</small><strong>{draft.targetText}</strong><span>{draft.supportText}</span></div><div className="translate-speak-actions"><button onClick={()=>speakLanguage(draft.targetText,targetLanguage,.9)}>🔊 Anhören</button><button className={draftListening?'listening':''} onClick={startDraftPractice} disabled={draftListening}>🎙 {draftListening?'Ich höre zu …':'Jetzt sprechen'}</button><button onClick={onOpenWords}>Zu meinen Karten</button></div><div className="translate-speak-result"><span>ERKANNT</span><strong>{draftHeard||'Noch kein Versuch.'}</strong><p>{draftFeedback||'Höre einmal zu, schaue dann weg und sprich den Satz möglichst frei.'}</p></div></section>}

    <section className="voice-sprint-card" id="multilingual-sprint"><div className="voice-sprint-head"><div><span className="companion-kicker">2-MINUTEN VOICE SPRINT</span><h2>Reale Situationen statt nur Vokabeln.</h2><p>Antworte laut in {languageName}. VocabFast bewertet nicht deine Persönlichkeit, sondern ob du wirklich ins Sprechen kommst.</p></div><div className="voice-step">{current?selected+1:0}<span>/ {prompts.length}</span></div></div>{current?<><div className="voice-scenarios" role="tablist" aria-label="Sprechsituation wählen">{prompts.map((item,index)=><button key={item.label} className={selected===index?'active':''} onClick={()=>{setSelected(index);setHeard('');setFeedback('');}}><span>{item.icon}</span>{item.label}</button>)}</div><div className="voice-prompt"><div className="voice-speaker">AI</div><div><small>DEIN GESPRÄCHSPARTNER SAGT</small><strong>{current.prompt}</strong><p>{current.hint}</p></div><button className="voice-listen" onClick={()=>speakLanguage(current.prompt,targetLanguage,.9)} aria-label="Satz anhören">🔊</button></div><div className="voice-response"><button className={`voice-mic ${listening?'listening':''}`} onClick={startFreeResponse} disabled={listening}><span>{listening?'◉':'🎙'}</span><strong>{listening?'Ich höre zu …':'Antwort sprechen'}</strong><small>{listening?`Sprich jetzt auf ${languageName}`:'Mikrofon starten'}</small></button><div className="voice-result"><span>DEINE ANTWORT</span><strong>{heard||'Noch keine Antwort aufgenommen.'}</strong><p>{feedback||'Du bekommst direkt kurzes Feedback dazu, ob deine Antwort schon als echter Gesprächsbeitrag funktioniert.'}</p></div></div><div className="voice-sprint-footer"><button onClick={()=>{setSelected((selected+prompts.length-1)%prompts.length);setHeard('');setFeedback('');}}>← Zurück</button><button className="view-primary" onClick={()=>{setSelected((selected+1)%prompts.length);setHeard('');setFeedback('');}}>Nächste Situation →</button></div></>:<div className="translator-history-empty">Für {languageName} werden die Real-Life-Szenarien noch aufgebaut. Eigene Sätze aus Translate kannst du trotzdem bereits sprechen und anhören.</div>}</section>

    <div className="companion-split"><article className="companion-card"><span className="companion-kicker">PERSÖNLICHER WORTSCHATZ</span><h3>Deine echten Wörter statt einer Zufallsliste.</h3><p>Alles, was du aus Translate oder PDFs speicherst, landet in deinem {languageName}-Wortschatz und kann wiederholt werden.</p><button onClick={onOpenWords}>Meine Wörter öffnen →</button></article><article className="companion-card accent"><span className="companion-kicker">WEITERTRAINIEREN</span><h3>Vom Sprechen zurück ins Lernen.</h3><p>Nutze danach kurze Reviews, damit neue Sätze nicht nur einmal funktionieren.</p><button onClick={onOpenPractice}>Persönlich üben →</button></article></div>
  </section>;
}
