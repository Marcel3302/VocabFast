import { conceptCatalog, conceptMeta } from '../learning/concepts';
import { getMasterySnapshot } from '../learning/mastery';
import type { PlatformProgress } from '../learning/progress';
import type { Lesson } from '../learning/types';
import { specialties } from '../data/catalog';
import './platform-views.css';

type OpenLesson = (lesson: Lesson) => void;
type ReviewBuilder = () => Lesson;

function strengthLabel(value: number) {
  if (value >= .8) return 'Sehr sicher';
  if (value >= .6) return 'Sicher';
  if (value >= .4) return 'Im Aufbau';
  if (value > 0) return 'Üben';
  return 'Neu';
}

export function PracticeView({ openLesson, buildReview }: { openLesson: OpenLesson; buildReview: ReviewBuilder }) {
  const mastery = getMasterySnapshot();
  const weak = mastery.filter(item => item.strength < .55).length;
  const due = mastery.filter(item => new Date(item.dueAt).getTime() <= Date.now()).length;
  return <section className="platform-view">
    <div className="view-hero"><div><span className="eyebrow">ADAPTIVES TRAINING</span><h1>Übe genau das, was heute den größten Unterschied macht.</h1><p>VocabFast kombiniert fällige Wiederholungen mit deinen schwächsten Konzepten. Dadurch wird jede Trainingsrunde anders.</p></div><button className="view-primary" onClick={()=>openLesson(buildReview())}>Intelligente Übung starten →</button></div>
    <div className="metric-grid"><article><span>Fällig</span><strong>{due}</strong><small>Konzepte zur Wiederholung</small></article><article><span>Im Aufbau</span><strong>{weak}</strong><small>noch nicht sichere Konzepte</small></article><article><span>Gelernt</span><strong>{mastery.length}</strong><small>bereits berührte Konzepte</small></article></div>
    <div className="view-section-head"><div><span className="eyebrow">TRAININGSMODI</span><h2>Kurze Sessions, klarer Fokus</h2></div></div>
    <div className="mode-grid">
      <button onClick={()=>openLesson(buildReview())}><span className="mode-icon">◎</span><div><strong>Adaptive Wiederholung</strong><p>Mischt Fehler, Fälligkeiten und schwache Konzepte.</p></div><em>Empfohlen</em></button>
      <button onClick={()=>openLesson(buildReview())}><span className="mode-icon">Aa</span><div><strong>Wortschatz & Sätze</strong><p>Aktive Erinnerung statt passivem Wiedererkennen.</p></div><em>5–8 Min</em></button>
      <button onClick={()=>openLesson(buildReview())}><span className="mode-icon">▶</span><div><strong>Hören & Diktat</strong><p>Verstehen, bevor du übersetzt.</p></div><em>Audio</em></button>
    </div>
  </section>;
}

export function WordsView() {
  const masteryMap = new Map(getMasterySnapshot().map(item => [item.conceptId, item]));
  const known = conceptCatalog.filter(item => masteryMap.has(item.id));
  const undiscovered = conceptCatalog.filter(item => !masteryMap.has(item.id));
  return <section className="platform-view">
    <div className="view-hero compact"><div><span className="eyebrow">DEIN WORTSCHATZ</span><h1>Nicht nur Wörter sammeln. Bedeutung wirklich behalten.</h1><p>Jedes Konzept bekommt eine Stärke und einen nächsten Wiederholungszeitpunkt.</p></div></div>
    <div className="view-section-head"><div><span className="eyebrow">AKTIV</span><h2>{known.length} gelernte Konzepte</h2></div></div>
    <div className="concept-list">{known.length ? known.map(meta=>{const m=masteryMap.get(meta.id)!;return <article key={meta.id}><div className="concept-main"><span className="concept-type">{meta.category}</span><strong>{meta.label}</strong><small>{meta.translation}</small></div><div className="concept-strength"><div><span style={{width:`${Math.round(m.strength*100)}%`}}/></div><strong>{Math.round(m.strength*100)}%</strong><small>{strengthLabel(m.strength)}</small></div></article>}) : <div className="empty-state"><strong>Noch keine Lerndaten.</strong><span>Starte deine erste Lektion – danach füllt sich dieser Bereich automatisch.</span></div>}</div>
    {undiscovered.length>0 && <><div className="view-section-head"><div><span className="eyebrow">ALS NÄCHSTES</span><h2>In deinem A1-Kurs</h2></div></div><div className="locked-concepts">{undiscovered.slice(0,12).map(meta=><span key={meta.id}><b>{meta.label}</b><small>{meta.translation}</small></span>)}</div></>}
  </section>;
}

export function SpecialtyView() {
  return <section className="platform-view">
    <div className="view-hero specialty-hero"><div><span className="eyebrow">VOCABFAST PRO · FACHSPRACHE</span><h1>Alltagsenglisch reicht im Beruf oft nicht.</h1><p>Fachbereiche bauen auf derselben Lernengine auf, verwenden aber eigene Situationen, Wortschätze und Kompetenztests.</p></div><div className="price-badge"><strong>19,99 €</strong><span>Pro / Monat</span></div></div>
    <div className="specialty-view-grid">{specialties.map(item=><article key={item.id}><div className="specialty-view-icon">{item.icon}</div><span className="pro-label">PRO</span><h2>{item.name}</h2><p>{item.description}</p><ul><li>situative Lektionen</li><li>Fachwortschatz & Hörtraining</li><li>Kompetenztests</li></ul><button>Bereich vormerken →</button></article>)}</div>
  </section>;
}

export function ProgressView({ progress }: { progress: PlatformProgress }) {
  const mastery = getMasterySnapshot();
  const results = Object.values(progress.results);
  const average = results.length ? Math.round(results.reduce((sum,result)=>sum+result.accuracy,0)/results.length) : 0;
  const strong = mastery.filter(item=>item.strength>=.65).length;
  const learning = mastery.filter(item=>item.strength>0&&item.strength<.65).length;
  const weakest = mastery.slice(0,6);
  return <section className="platform-view">
    <div className="view-hero compact"><div><span className="eyebrow">FORTSCHRITT</span><h1>Du siehst nicht nur, was erledigt ist – sondern was sitzt.</h1><p>Fortschritt wird aus Lektionen, Genauigkeit und Konzeptstärke zusammengesetzt.</p></div></div>
    <div className="metric-grid four"><article><span>Gesamt-XP</span><strong>{progress.totalXp}</strong><small>aus allen Sessions</small></article><article><span>Sessions</span><strong>{progress.sessions}</strong><small>Trainingseinheiten</small></article><article><span>Genauigkeit</span><strong>{average}%</strong><small>Ø abgeschlossene Lektionen</small></article><article><span>Sichere Konzepte</span><strong>{strong}</strong><small>Stärke ≥ 65 %</small></article></div>
    <div className="progress-panels"><article><div className="view-section-head inner"><div><span className="eyebrow">MASTERY</span><h2>Konzeptstatus</h2></div></div><div className="mastery-summary"><div><span className="mastery-dot strong"/><strong>{strong}</strong><small>sicher</small></div><div><span className="mastery-dot learning"/><strong>{learning}</strong><small>im Aufbau</small></div><div><span className="mastery-dot new"/><strong>{Math.max(conceptCatalog.length-mastery.length,0)}</strong><small>noch neu</small></div></div></article><article><div className="view-section-head inner"><div><span className="eyebrow">NÄCHSTER FOKUS</span><h2>Schwächste Konzepte</h2></div></div><div className="weak-list">{weakest.length?weakest.map(item=>{const meta=conceptMeta(item.conceptId);return <div key={item.conceptId}><span><strong>{meta.label}</strong><small>{meta.translation}</small></span><b>{Math.round(item.strength*100)}%</b></div>}):<div className="empty-inline">Noch keine Daten – starte eine Lektion.</div>}</div></article></div>
  </section>;
}
