import { useMemo, useState } from 'react';
import { buildGrammarLesson, grammarTopicsForLevel } from '../learning/grammar';
import { englishCourseLevels, type CefrLevel } from '../learning/curriculum';
import type { Lesson } from '../learning/types';
import './grammar-view.css';

type Props = { activeLevel:CefrLevel; openLesson:(lesson:Lesson)=>void; onSelectLevel:(level:CefrLevel)=>void };

export default function GrammarView({ activeLevel, openLesson, onSelectLevel }:Props) {
  const [selectedId,setSelectedId]=useState(()=>grammarTopicsForLevel(activeLevel)[0]?.id ?? 'a1-be');
  const topics=useMemo(()=>grammarTopicsForLevel(activeLevel),[activeLevel]);
  const selected=topics.find(topic=>topic.id===selectedId) ?? topics[0];

  function chooseLevel(level:CefrLevel) {
    onSelectLevel(level);
    const first=grammarTopicsForLevel(level)[0];
    if(first)setSelectedId(first.id);
  }

  if(!selected)return null;

  return <section className="grammar-view platform-view">
    <div className="view-hero grammar-hero"><div><span className="eyebrow">GRAMMAR LAB · A1–C2</span><h1>Grammatik verstehen, sehen und direkt anwenden.</h1><p>Keine isolierten Regelblöcke: Jede Struktur verbindet Erklärung, Beispiele, typische Fehler, Hören, Schreiben und aktives Sprechen.</p></div><button className="view-primary" onClick={()=>openLesson(buildGrammarLesson(selected.id))}>{selected.level} Training starten →</button></div>

    <div className="grammar-level-tabs" aria-label="Grammatikniveau auswählen">{englishCourseLevels.map(level=><button key={level.id} className={level.id===activeLevel?'active':''} onClick={()=>chooseLevel(level.id)}><strong>{level.id}</strong><span>{level.title}</span></button>)}</div>

    <div className="grammar-layout">
      <aside className="grammar-topic-list"><div className="view-section-head inner"><div><span className="eyebrow">{activeLevel} THEMEN</span><h2>Struktur wählen</h2></div></div>{topics.map(topic=><button key={topic.id} className={selected.id===topic.id?'active':''} onClick={()=>setSelectedId(topic.id)}><span>{topic.level}</span><div><strong>{topic.title}</strong><small>{topic.subtitle}</small></div></button>)}</aside>

      <div className="grammar-detail">
        <div className="grammar-detail-head"><div><span className="eyebrow">{selected.level} · GRAMMATIK</span><h2>{selected.title}</h2><p>{selected.subtitle}</p></div><span className="grammar-badge">Aa</span></div>
        <article className="grammar-rule"><span>REGEL</span><p>{selected.rule}</p></article>
        <div className="grammar-example-grid">{selected.examples.map(example=><article key={example.english}><span>BEISPIEL</span><strong>{example.english}</strong><small>{example.german}</small></article>)}</div>
        <div className="grammar-mistake"><div><span>HÄUFIGER FEHLER</span><del>{selected.mistake}</del></div><div><span>BESSER</span><strong>{selected.correct}</strong></div></div>
        <div className="grammar-apply"><div><span className="eyebrow">AKTIV ANWENDEN</span><h3>{selected.promptGerman}</h3><p>Das Training mischt Produktion und Wiedererkennung und nutzt diese Regel anschließend für deine Mastery.</p></div><button onClick={()=>openLesson(buildGrammarLesson(selected.id))}>8 Aufgaben starten →</button></div>
      </div>
    </div>
  </section>;
}
