import { learningUnits, specialties } from '../data/catalog';
import { englishA1Lessons } from '../learning/curriculum/en-a1';
import type { PlatformProgress } from '../learning/progress';
import type { Lesson, LessonResult } from '../learning/types';

type Props = {
  progress: PlatformProgress;
  lastResult: LessonResult | null;
  openLesson: (lesson: Lesson) => void;
  buildReview: () => Lesson;
};

export default function DashboardView({ progress, lastResult, openLesson, buildReview }: Props) {
  const curriculumCompleted = englishA1Lessons.filter(lesson => progress.completedLessonIds.includes(lesson.id)).length;
  const unitProgress = Math.round((curriculumCompleted / englishA1Lessons.length) * 100);
  const nextLesson = englishA1Lessons.find(lesson => !progress.completedLessonIds.includes(lesson.id)) ?? englishA1Lessons[englishA1Lessons.length - 1];

  return <div className="page-grid">
    <section className="primary-column">
      <div className="hero-panel">
        <div className="hero-copy">
          <span className="eyebrow">DEIN ENGLISCH STARTET HIER</span>
          <h1>Jede Lektion baut auf dem auf, was du wirklich kannst.</h1>
          <p>VocabFast verbindet kurze Lektionen mit Wiederholungen auf Konzeptebene. Fehler bestimmen, was du als Nächstes übst.</p>
          <div className="hero-actions"><button className="primary-action" onClick={()=>openLesson(nextLesson)}>Weiterlernen <span>→</span></button><button className="secondary-action">Kursplan ansehen</button></div>
        </div>
        <div className="hero-orbit" aria-hidden="true"><div className="orbit-ring ring-one"/><div className="orbit-ring ring-two"/><div className="core-word"><span>A1</span><strong>{unitProgress}%</strong><small>Erste Gespräche</small></div><div className="orbit-dot dot-one">A</div><div className="orbit-dot dot-two">✓</div><div className="orbit-dot dot-three">Aa</div></div>
      </div>

      {lastResult && <div className="section-heading"><div><span className="eyebrow">LETZTE SESSION</span><h2>{lastResult.accuracy}% richtig · +{lastResult.xp} XP</h2></div><button className="text-button" onClick={()=>openLesson(buildReview())}>Gezielt wiederholen</button></div>}

      <div className="section-heading"><div><span className="eyebrow">DEIN WEG</span><h2>Englisch · A1</h2></div><span className="pro-label">Einheit 1 / 4</span></div>
      <div className="learning-path">{learningUnits.map((unit,index)=>{const displayProgress=unit.id===1?unitProgress:unit.progress;return <article key={unit.id} className={`unit-card ${unit.state}`}><div className="path-rail"><div className="unit-node">{unit.state==='done'?'✓':unit.id}</div>{index<learningUnits.length-1&&<div className="rail-line"/>}</div><div className="unit-body"><div className="unit-topline"><span>Einheit {unit.id}</span><span>{unit.lessons} Lektionen</span></div><h3>{unit.title}</h3><p>{unit.subtitle}</p><div className="progress-row"><div className="progress-track"><span style={{width:`${displayProgress}%`}}/></div><strong>{displayProgress}%</strong></div><div className="lesson-chips">{Array.from({length:Math.min(unit.lessons,8)},(_,i)=>i+1).map(lesson=><span key={lesson} className={unit.id===1&&lesson<=curriculumCompleted?'complete':''}>{unit.id===1&&lesson<=curriculumCompleted?'✓':lesson}</span>)}</div>{unit.state==='active'&&<button className="unit-action" onClick={()=>openLesson(nextLesson)}>{nextLesson.title} <span>→</span></button>}{unit.state==='locked'&&<span className="locked-copy">Wird nach der vorherigen Einheit freigeschaltet</span>}</div></article>})}</div>

      <div className="section-heading"><div><span className="eyebrow">EINHEIT 1</span><h2>Erste Gespräche · 8 Lektionen</h2></div><span className="pro-label">A1</span></div>
      <div className="starter-lessons">{englishA1Lessons.map((lesson,index)=>{const completed=progress.completedLessonIds.includes(lesson.id);const unlocked=index===0||progress.completedLessonIds.includes(englishA1Lessons[index-1].id);const result=progress.results[lesson.id];return <button key={lesson.id} className={`starter-lesson ${completed?'completed':''}`} disabled={!unlocked} onClick={()=>openLesson(lesson)}><div className="starter-lesson-top"><span>Lektion {index+1}</span><span className="starter-lesson-status">{completed?'✓':unlocked?'→':'🔒'}</span></div><h3>{lesson.title}</h3><p>{lesson.subtitle}</p><div className="starter-lesson-footer"><span>{lesson.estimatedMinutes} Min · {lesson.exercises.length} Aufgaben</span><strong>{result?`${result.accuracy}%`:(unlocked?'Starten':'Gesperrt')}</strong></div></button>})}</div>
      <div className="adaptive-strip"><div><strong>Adaptive Wiederholung</strong><span>VocabFast nutzt deine Konzeptstärken und Fälligkeiten, um schwache Bereiche gezielt erneut zu mischen.</span></div><button onClick={()=>openLesson(buildReview())}>Intelligente Übung starten</button></div>

      <div className="section-heading specialty-heading"><div><span className="eyebrow">DEIN VORTEIL</span><h2>Fachsprache für echte Situationen</h2></div><span className="pro-label">PRO</span></div>
      <div className="specialty-grid">{specialties.slice(0,4).map(item=><article key={item.id} className="specialty-card"><div className="specialty-icon">{item.icon}</div><div><strong>{item.name}</strong><p>{item.description}</p></div><button aria-label={`${item.name} öffnen`}>→</button></article>)}</div>
    </section>

    <aside className="right-column">
      <section className="daily-card"><div className="card-heading"><div><span className="eyebrow">HEUTE</span><h3>Tagesziel</h3></div><strong>{Math.min(progress.sessions,5)}/5</strong></div><div className="daily-ring"><div><strong>{Math.min(progress.sessions*20,100)}%</strong><span>geschafft</span></div></div><div className="task-list"><div className={progress.sessions>0?'done':''}><span>{progress.sessions>0?'✓':'1'}</span><div><strong>Grundlagen-Lektion</strong><small>{progress.sessions>0?'Abgeschlossen':'6 Minuten'}</small></div></div><div><span>2</span><div><strong>Wiederholung</strong><small>Adaptiv nach Fehlern</small></div></div><div><span>3</span><div><strong>Hörtraining</strong><small>3 Minuten</small></div></div><div><span>4</span><div><strong>Wortschatz</strong><small>8 neue Wörter</small></div></div><div><span>5</span><div><strong>Sprechen</strong><small>3 Minuten</small></div></div></div></section>
      <section className="coach-card"><div className="coach-head"><div className="coach-mark">AI</div><div><span className="eyebrow">VOCABFAST COACH</span><h3>{progress.sessions?'Deine Wiederholung ist personalisiert.':'Wir beginnen mit einem Fundament.'}</h3></div></div><p>{progress.sessions?'Schwächere Konzepte werden häufiger ausgewählt, sichere Inhalte bekommen längere Abstände.':'Deine ersten Antworten zeigen uns, welche Wörter und Strukturen häufiger wiederholt werden sollten.'}</p><div className="coach-insight"><span>Fokus</span><strong>{progress.sessions?'Deine schwächsten Konzepte':'Begrüßung & “to be”'}</strong><small>Adaptive Auswahl</small></div><button onClick={()=>openLesson(progress.sessions?buildReview():englishA1Lessons[0])}>Training starten</button></section>
      <section className="streak-card"><div className="card-heading"><div><span className="eyebrow">KONTINUITÄT</span><h3>{progress.sessions?'Deine Serie läuft':'Deine Serie beginnt heute'}</h3></div><span className="streak-fire">🔥</span></div><div className="week-row">{['M','D','M','D','F','S','S'].map((d,i)=><div key={`${d}-${i}`} className={i===0?'today':''}><span>{i===0&&progress.sessions?'✓':i===0?'•':''}</span><small>{d}</small></div>)}</div><p>Kurze tägliche Einheiten schlagen seltene Marathon-Sessions.</p></section>
      <section className="pro-card"><span className="pro-pill">VOCABFAST PRO</span><h3>Dein persönlicher Sprachcoach.</h3><p>Unbegrenztes KI-Training, Ausspracheanalyse, Fachbereiche, Dokumentlernen und Kompetenztests.</p><div className="price-row"><strong>19,99 €</strong><span>/ Monat</span></div><button>Pro freischalten</button><small>Jederzeit kündbar · Jahresabo später verfügbar</small></section>
    </aside>
  </div>;
}
