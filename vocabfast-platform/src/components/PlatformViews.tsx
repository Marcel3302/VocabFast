import { conceptCatalog, conceptMeta } from '../learning/concepts';
import { englishCourseLevels } from '../learning/curriculum';
import { getMasterySnapshot } from '../learning/mastery';
import type { PlatformProgress } from '../learning/progress';
import type { ExerciseType, Lesson } from '../learning/types';
import { specialties } from '../data/catalog';
import './platform-views.css';

type OpenLesson = (lesson: Lesson) => void;
type ReviewBuilder = () => Lesson;
type ModeBuilder = (types: ExerciseType[], title: string, subtitle: string) => Lesson;

function strengthLabel(value: number) {
  if (value >= .8) return 'Sehr sicher';
  if (value >= .6) return 'Sicher';
  if (value >= .4) return 'Im Aufbau';
  if (value > 0) return 'Üben';
  return 'Neu';
}

export function PracticeView({ openLesson, buildReview, buildMode }: { openLesson: OpenLesson; buildReview: ReviewBuilder; buildMode: ModeBuilder }) {
  const mastery = getMasterySnapshot();
  const weak = mastery.filter(item => item.strength < .55).length;
  const due = mastery.filter(item => new Date(item.dueAt).getTime() <= Date.now()).length;
  return <section className="platform-view">
    <div className="view-hero"><div><span className="eyebrow">ADAPTIVES TRAINING</span><h1>Übe genau das, was heute den größten Unterschied macht.</h1><p>VocabFast kombiniert fällige Wiederholungen mit deinen schwächsten Konzepten. Das ausgewählte CEFR-Level bestimmt den Übungspool.</p></div><button className="view-primary" onClick={()=>openLesson(buildReview())}>Intelligente Übung starten →</button></div>
    <div className="metric-grid"><article><span>Fällig</span><strong>{due}</strong><small>Konzepte zur Wiederholung</small></article><article><span>Im Aufbau</span><strong>{weak}</strong><small>noch nicht sichere Konzepte</small></article><article><span>Gelernt</span><strong>{mastery.length}</strong><small>bereits berührte Konzepte</small></article></div>
    <div className="view-section-head"><div><span className="eyebrow">TRAININGSMODI</span><h2>Kurze Sessions, klarer Fokus</h2></div></div>
    <div className="mode-grid">
      <button onClick={()=>openLesson(buildReview())}><span className="mode-icon">◎</span><div><strong>Adaptive Wiederholung</strong><p>Mischt Fehler, Fälligkeiten und schwache Konzepte.</p></div><em>Empfohlen</em></button>
      <button onClick={()=>openLesson(buildMode(['speaking'],'Sprechtraining','Kurze Sätze laut sprechen und direkt prüfen lassen.'))}><span className="mode-icon">🎙</span><div><strong>Sprechen</strong><p>Aktives Sprechen mit Browser-Spracherkennung.</p></div><em>Mikrofon</em></button>
      <button onClick={()=>openLesson(buildMode(['listening','dictation'],'Hörtraining','Englisch verstehen, bevor du übersetzt.'))}><span className="mode-icon">▶</span><div><strong>Hören & Diktat</strong><p>Audio verstehen und präzise verschriftlichen.</p></div><em>Audio</em></button>
      <button onClick={()=>openLesson(buildMode(['translation','sentence-build','fill-gap'],'Aktives Englisch','Sätze selbst produzieren statt nur erkennen.'))}><span className="mode-icon">Aa</span><div><strong>Sätze & Grammatik</strong><p>Übersetzen, bauen und Lücken gezielt lösen.</p></div><em>Aktiv</em></button>
    </div>
  </section>;
}

export function WordsView() {
  const masteryMap = new Map(getMasterySnapshot().map(item => [item.conceptId, item]));
  const known = conceptCatalog.filter(item => masteryMap.has(item.id));
  const undiscovered = conceptCatalog.filter(item => !masteryMap.has(item.id));
  const categories = ['Wortschatz','Grammatik','Kommunikation'] as const;
  return <section className="platform-view">
    <div className="view-hero compact"><div><span className="eyebrow">DEIN WORTSCHATZ</span><h1>Nicht nur Wörter sammeln. Bedeutung wirklich behalten.</h1><p>Jedes Konzept bekommt eine Stärke und einen nächsten Wiederholungszeitpunkt. Grammatik und Kommunikationsmuster werden genauso behandelt wie einzelne Wörter.</p></div></div>
    <div className="category-summary">{categories.map(category=><article key={category}><span>{category}</span><strong>{known.filter(item=>item.category===category).length}</strong><small>aktiv gelernt</small></article>)}</div>
    <div className="view-section-head"><div><span className="eyebrow">AKTIV</span><h2>{known.length} gelernte Konzepte</h2></div></div>
    <div className="concept-list">{known.length ? known.map(meta=>{const m=masteryMap.get(meta.id)!;return <article key={meta.id}><div className="concept-main"><span className="concept-type">{meta.category}</span><strong>{meta.label}</strong><small>{meta.translation}</small></div><div className="concept-strength"><div><span style={{width:`${Math.round(m.strength*100)}%`}}/></div><strong>{Math.round(m.strength*100)}%</strong><small>{strengthLabel(m.strength)}</small></div></article>}) : <div className="empty-state"><strong>Noch keine Lerndaten.</strong><span>Starte deine erste Lektion – danach füllt sich dieser Bereich automatisch.</span></div>}</div>
    {undiscovered.length>0 && <><div className="view-section-head"><div><span className="eyebrow">ALS NÄCHSTES</span><h2>Im A1–C1 Gesamtkurs</h2></div></div><div className="locked-concepts">{undiscovered.slice(0,18).map(meta=><span key={meta.id}><b>{meta.label}</b><small>{meta.translation}</small></span>)}</div></>}
  </section>;
}

export function SpecialtyView({ openPro }: { openPro: () => void }) {
  return <section className="platform-view">
    <div className="view-hero specialty-hero"><div><span className="eyebrow">VOCABFAST PRO · FACHSPRACHE</span><h1>Alltagsenglisch reicht im Beruf oft nicht.</h1><p>Fachbereiche bauen auf derselben Lernengine auf, verwenden aber eigene Situationen, Wortschätze, Sprechübungen und Kompetenztests.</p></div><div className="price-badge"><strong>19,99 €</strong><span>Pro / Monat</span></div></div>
    <div className="specialty-view-grid">{specialties.map(item=><article key={item.id}><div className="specialty-view-icon">{item.icon}</div><span className="pro-label">PRO</span><h2>{item.name}</h2><p>{item.description}</p><ul><li>situative Lektionen</li><li>Fachwortschatz, Hören & Sprechen</li><li>Kompetenztests</li></ul><button onClick={openPro}>Pro-Vorschau öffnen →</button></article>)}</div>
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
    <div className="view-hero compact"><div><span className="eyebrow">FORTSCHRITT</span><h1>Du siehst nicht nur, was erledigt ist – sondern was sitzt.</h1><p>Fortschritt wird über A1 bis C1 aus Lektionen, Genauigkeit, Streak und Konzeptstärke zusammengesetzt.</p></div></div>
    <div className="metric-grid four"><article><span>Gesamt-XP</span><strong>{progress.totalXp}</strong><small>aus allen Sessions</small></article><article><span>Sessions</span><strong>{progress.sessions}</strong><small>Trainingseinheiten</small></article><article><span>Genauigkeit</span><strong>{average}%</strong><small>Ø Kurslektionen</small></article><article><span>Streak</span><strong>{progress.currentStreak}</strong><small>Bestwert {progress.longestStreak}</small></article></div>
    <div className="view-section-head"><div><span className="eyebrow">KURSSTATUS</span><h2>A1 bis C1</h2></div></div>
    <div className="unit-progress-grid">{englishCourseLevels.map(level=>{const lessons=level.units.flatMap(unit=>unit.lessons);const complete=lessons.filter(lesson=>progress.completedLessonIds.includes(lesson.id)).length;const percent=Math.round(complete/lessons.length*100);return <article key={level.id}><div><span>{level.id}</span><strong>{level.title}</strong><small>{complete}/{lessons.length} Lektionen</small></div><div className="unit-progress-ring"><strong>{percent}%</strong></div></article>})}</div>
    <div className="progress-panels"><article><div className="view-section-head inner"><div><span className="eyebrow">MASTERY</span><h2>Konzeptstatus</h2></div></div><div className="mastery-summary"><div><span className="mastery-dot strong"/><strong>{strong}</strong><small>sicher</small></div><div><span className="mastery-dot learning"/><strong>{learning}</strong><small>im Aufbau</small></div><div><span className="mastery-dot new"/><strong>{Math.max(conceptCatalog.length-mastery.length,0)}</strong><small>noch neu</small></div></div></article><article><div className="view-section-head inner"><div><span className="eyebrow">NÄCHSTER FOKUS</span><h2>Schwächste Konzepte</h2></div></div><div className="weak-list">{weakest.length?weakest.map(item=>{const meta=conceptMeta(item.conceptId);return <div key={item.conceptId}><span><strong>{meta.label}</strong><small>{meta.translation}</small></span><b>{Math.round(item.strength*100)}%</b></div>}):<div className="empty-inline">Noch keine Daten – starte eine Lektion.</div>}</div></article></div>
  </section>;
}
