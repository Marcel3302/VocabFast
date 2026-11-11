import { useMemo, useState } from 'react';
import { buildGrammarLesson, grammarTopicsForLevel } from '../learning/grammar';
import { courseLevels, type CefrLevel } from '../learning/curriculum';
import type { Lesson } from '../learning/types';
import AiStudyPanel from './AiStudyPanel';
import './grammar-view.css';

type Props = {
  activeLevel:CefrLevel;
  openLesson:(lesson:Lesson)=>void;
  onSelectLevel:(level:CefrLevel)=>void;
  targetLanguage:string;
  targetLabel:string;
  sourceLanguage:string;
  sourceLabel:string;
};

export default function GrammarView({ activeLevel, openLesson, onSelectLevel, targetLanguage, targetLabel, sourceLanguage, sourceLabel }:Props) {
  const english=targetLanguage==='en';
  const [selectedId,setSelectedId]=useState(()=>grammarTopicsForLevel(activeLevel)[0]?.id ?? 'a1-be');
  const topics=useMemo(()=>english?grammarTopicsForLevel(activeLevel):[],[activeLevel,english]);
  const selected=topics.find(topic=>topic.id===selectedId) ?? topics[0];
  const levels=courseLevels(targetLanguage).filter(level=>level.id!=='C2'||targetLanguage==='en');

  function chooseLevel(level:CefrLevel) {
    onSelectLevel(level);
    if(english){const first=grammarTopicsForLevel(level)[0];if(first)setSelectedId(first.id);}
  }

  return <section className="grammar-view platform-view">
    <div className="view-hero grammar-hero"><div><span className="eyebrow">GRAMMAR LAB · A1–C1</span><h1>{targetLabel}: Grammatik verstehen und wirklich verwenden.</h1><p>Kurze Theorie, echte Beispiele, typische Fehler und immer wieder neu erzeugte Aufgaben. Ziel ist aktive Sprache statt Regel-Auswendiglernen.</p></div>{english&&selected&&<button className="view-primary" onClick={()=>openLesson(buildGrammarLesson(selected.id))}>{selected.level} Training starten →</button>}</div>

    <div className="grammar-level-tabs" aria-label="Grammatikniveau auswählen">{levels.map(level=><button key={level.id} className={level.id===activeLevel?'active':''} onClick={()=>chooseLevel(level.id)}><strong>{level.id}</strong><span>{level.title}</span></button>)}</div>

    <AiStudyPanel kind="grammar" level={activeLevel} targetLanguage={targetLanguage} targetLabel={targetLabel} sourceLanguage={sourceLanguage} sourceLabel={sourceLabel} openLesson={openLesson}/>

    {english&&selected&&<div className="grammar-layout">
      <aside className="grammar-topic-list"><div className="view-section-head inner"><div><span className="eyebrow">{activeLevel} FESTE THEMEN</span><h2>Struktur wählen</h2></div></div>{topics.map(topic=><button key={topic.id} className={selected.id===topic.id?'active':''} onClick={()=>setSelectedId(topic.id)}><span>{topic.level}</span><div><strong>{topic.title}</strong><small>{topic.subtitle}</small></div></button>)}</aside>

      <div className="grammar-detail">
        <div className="grammar-detail-head"><div><span className="eyebrow">{selected.level} · GRAMMATIK</span><h2>{selected.title}</h2><p>{selected.subtitle}</p></div><span className="grammar-badge">Aa</span></div>
        <article className="grammar-rule"><span>REGEL</span><p>{selected.rule}</p></article>
        <div className="grammar-example-grid">{selected.examples.map(example=><article key={example.english}><span>BEISPIEL</span><strong>{example.english}</strong><small>{example.german}</small></article>)}</div>
        <div className="grammar-mistake"><div><span>HÄUFIGER FEHLER</span><del>{selected.mistake}</del></div><div><span>BESSER</span><strong>{selected.correct}</strong></div></div>
        <div className="grammar-apply"><div><span className="eyebrow">AKTIV ANWENDEN</span><h3>{selected.promptGerman}</h3><p>Zusätzlich zum KI-Lab kannst du die fest geprüften Englisch-Strukturen gezielt trainieren.</p></div><button onClick={()=>openLesson(buildGrammarLesson(selected.id))}>8 Aufgaben starten →</button></div>
      </div>
    </div>}
  </section>;
}
