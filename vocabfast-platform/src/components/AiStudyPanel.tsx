import { useEffect, useMemo, useState } from 'react';
import type { CefrLevel } from '../learning/curriculum';
import type { Exercise, Lesson } from '../learning/types';
import './ai-study-panel.css';

type Kind='vocabulary'|'grammar';
type PackItem={term:string;translation:string;example:string;exampleTranslation:string;note:string};
type PackExercise={id:string;type:'multiple-choice'|'translation'|'fill-gap'|'speaking'|'dictation';question:string;answer:string;choices:string[];explanation:string};
type StudyPack={title:string;theory:string[];items:PackItem[];exercises:PackExercise[]};
type Props={kind:Kind;level:CefrLevel;targetLanguage:string;targetLabel:string;sourceLanguage:string;sourceLabel:string;openLesson:(lesson:Lesson)=>void};

const vocabularyTopics=['Alltag & Smalltalk','Reisen & Orientierung','Arbeit & Beruf','Essen & Restaurant','Gefühle & Meinungen','Technik & Medien','Probleme lösen','Freizeit & Hobbys'];
const grammarTopics:Record<string,string[]>={
 A1:['Grundsatzbau & Fragen','Präsens & einfache Verben','Artikel, Zahl & Besitz','Verneinung & Höflichkeit'],
 A2:['Vergangenheit & Erfahrungen','Zukunft & Pläne','Vergleiche & Steigerung','Bedingungen & Begründungen'],
 B1:['Nebensätze & Verknüpfungen','Zeitformen sicher kombinieren','Modalität & höfliche Nuancen','Relativsätze & komplexere Sätze'],
 B2:['Hypothesen & Bedingungen','Passiv & Fokus','Indirekte Rede','Präzise Verknüpfung & Argumentation'],
 C1:['Register & Stil','Nuancierte Modalität','Verdichtung & komplexe Satzmuster','Kohäsion, Fokus & rhetorische Wirkung']
};

function historyKey(kind:Kind,targetLanguage:string,level:CefrLevel){return 'vocabfast.ai-study.history.v1:'+kind+':'+targetLanguage+':'+level;}
function cacheKey(kind:Kind,targetLanguage:string,level:CefrLevel){return 'vocabfast.ai-study.pack.v1:'+kind+':'+targetLanguage+':'+level;}
function readHistory(kind:Kind,targetLanguage:string,level:CefrLevel){try{const value=JSON.parse(localStorage.getItem(historyKey(kind,targetLanguage,level))||'[]');return Array.isArray(value)?value.filter(item=>typeof item==='string').slice(-40):[];}catch{return[];}}
function remember(kind:Kind,targetLanguage:string,level:CefrLevel,exercises:PackExercise[]){try{const previous=readHistory(kind,targetLanguage,level),next=[...previous,...exercises.map(item=>(item.question+' → '+item.answer).slice(0,180))].slice(-40);localStorage.setItem(historyKey(kind,targetLanguage,level),JSON.stringify(next));}catch{/* optional */}}
function readCached(kind:Kind,targetLanguage:string,level:CefrLevel):StudyPack|null{try{const value=JSON.parse(localStorage.getItem(cacheKey(kind,targetLanguage,level))||'null');return value&&Array.isArray(value.theory)&&Array.isArray(value.exercises)?value:null;}catch{return null;}}
function saveCached(kind:Kind,targetLanguage:string,level:CefrLevel,pack:StudyPack){try{localStorage.setItem(cacheKey(kind,targetLanguage,level),JSON.stringify(pack));}catch{/* optional */}}

function toExercise(item:PackExercise,index:number,kind:Kind,level:CefrLevel):Exercise{
 const base={id:'ai-study-'+Date.now()+'-'+index,instruction:item.question,prompt:kind==='grammar'?'Wende die Struktur im Kontext an.':'Nutze den Ausdruck aktiv im Kontext.',conceptIds:['ai-study.'+kind+'.'+level],difficulty:(level==='A1'?1:level==='A2'?2:level==='B1'?3:level==='B2'?4:5) as 1|2|3|4|5,xp:10,explanation:item.explanation};
 if(item.type==='multiple-choice')return{...base,type:'multiple-choice',choices:item.choices.length?item.choices:[item.answer],answer:item.answer};
 if(item.type==='fill-gap')return{...base,type:'fill-gap',sentence:item.question,choices:item.choices.length?item.choices:[item.answer],answer:item.answer};
 if(item.type==='speaking')return{...base,type:'speaking',speech:item.answer,acceptedAnswers:[item.answer]};
 if(item.type==='dictation')return{...base,type:'dictation',speech:item.answer,acceptedAnswers:[item.answer]};
 return{...base,type:'translation',sourceText:item.question,acceptedAnswers:[item.answer]};
}
function packLesson(pack:StudyPack,kind:Kind,level:CefrLevel,targetLanguage:string):Lesson{
 return{id:'ai-'+kind+'-'+targetLanguage+'-'+level+'-'+Date.now(),courseId:'ai-study',level,unitId:'ai-'+kind,title:pack.title,subtitle:'Frisch generierte '+(kind==='grammar'?'Grammatik':'Wortschatz')+'-Session',estimatedMinutes:12,newConcepts:[],exercises:pack.exercises.map((item,index)=>toExercise(item,index,kind,level))};
}

export default function AiStudyPanel({kind,level,targetLanguage,targetLabel,sourceLanguage,sourceLabel,openLesson}:Props){
 const [topic,setTopic]=useState(''),[pack,setPack]=useState<StudyPack|null>(()=>readCached(kind,targetLanguage,level)),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const topics=useMemo(()=>kind==='vocabulary'?vocabularyTopics:(grammarTopics[level]||grammarTopics.A1),[kind,level]);
 useEffect(()=>{setPack(readCached(kind,targetLanguage,level));setTopic('');setError('');},[kind,targetLanguage,level]);
 async function generate(){
   if(busy)return;setBusy(true);setError('');
   try{
     const response=await fetch('/api/platform/study-session',{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json'},body:JSON.stringify({kind,level,targetLanguage,targetLabel,sourceLanguage,sourceLabel,topic:topic||topics[Math.floor(Math.random()*topics.length)],exclude:readHistory(kind,targetLanguage,level)})});
     const data=await response.json().catch(()=>({})) as {pack?:StudyPack;error?:string};
     if(!response.ok||!data.pack)throw new Error(data.error||'Neue Lernrunde konnte nicht erzeugt werden.');
     setPack(data.pack);saveCached(kind,targetLanguage,level,data.pack);remember(kind,targetLanguage,level,data.pack.exercises);
   }catch(reason){setError(reason instanceof Error?reason.message:'Neue Lernrunde konnte nicht erzeugt werden.');}
   finally{setBusy(false);}
 }
 const label=kind==='grammar'?'Grammatik':'Wortschatz';
 return <section className="ai-study-panel">
   <div className="ai-study-head"><div><span className="eyebrow">AI {label.toUpperCase()} LAB · {level}</span><h2>{targetLabel} wirklich aktiv lernen</h2><p>{kind==='grammar'?'Kurze Theorie, typische Fehler, echte Beispiele und jedes Mal neue Grammatikaufgaben.':'Nützliche Wörter, Chunks und Kollokationen mit Beispielen – danach eine frische aktive Übungsrunde.'}</p></div><button className="view-primary" disabled={busy} onClick={()=>void generate()}>{busy?'Wird neu erzeugt …':pack?'Neue Runde generieren →':'Lernpaket generieren →'}</button></div>
   <div className="ai-study-controls"><div>{topics.map(item=><button key={item} className={topic===item?'active':''} onClick={()=>setTopic(item)}>{item}</button>)}</div><input value={topic} onChange={event=>setTopic(event.target.value)} placeholder="Oder eigenes Thema eingeben …" maxLength={120}/></div>
   {error&&<div className="ai-study-error">{error}</div>}
   {!pack&&!busy&&<div className="ai-study-empty"><strong>Starte mit einem Thema, das du wirklich brauchst.</strong><span>VocabFast erstellt daraus Theorie, Beispiele und eine neue Übungsrunde passend zu {targetLabel} {level}.</span></div>}
   {pack&&<><div className="ai-study-theory"><span>THEORIE</span><h3>{pack.title}</h3>{pack.theory.map((text,index)=><p key={index}>{text}</p>)}</div>
   {kind==='vocabulary'&&pack.items.length>0&&<div className="ai-study-words">{pack.items.map(item=><article key={item.term+'-'+item.translation}><div><strong>{item.term}</strong><span>{item.translation}</span></div><p>{item.example}</p><small>{item.exampleTranslation}</small>{item.note&&<em>{item.note}</em>}</article>)}</div>}
   <div className="ai-study-start"><div><strong>{pack.exercises.length} frische Aufgaben bereit</strong><span>Übersetzen, Lücken, Auswahl, Diktat und Sprechen werden zusätzlich neu gemischt.</span></div><button className="view-primary" onClick={()=>openLesson(packLesson(pack,kind,level,targetLanguage))}>Übung starten →</button></div></>}
 </section>;
}
