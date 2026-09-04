import { specialties } from '../data/catalog';
import { englishA1Lessons, englishA1Units, lessonIsUnlocked } from '../learning/curriculum';
import type { LearnerPreferences } from '../learning/preferences';
import type { PlatformProgress } from '../learning/progress';
import type { Lesson, LessonResult } from '../learning/types';

type Props = {
  progress: PlatformProgress;
  preferences: LearnerPreferences;
  lastResult: LessonResult | null;
  openLesson: (lesson: Lesson) => void;
  buildReview: () => Lesson;
  openPro: () => void;
};

export default function DashboardView({ progress, preferences, lastResult, openLesson, buildReview, openPro }: Props) {
  const curriculumCompleted = englishA1Lessons.filter(lesson => progress.completedLessonIds.includes(lesson.id)).length;
  const courseProgress = Math.round((curriculumCompleted / englishA1Lessons.length) * 100);
  const nextLesson = englishA1Lessons.find(lesson => !progress.completedLessonIds.includes(lesson.id)) ?? englishA1Lessons[englishA1Lessons.length - 1];
  const studiedToday = progress.lastStudyDate === new Date().toLocaleDateString('sv-SE');

  return <div className="page-grid">
    <section className="primary-column">
      <div className="hero-panel">
        <div className="hero-copy">
          <span className="eyebrow">{preferences.name.toUpperCase()} · DEIN ENGLISCHPFAD</span>
          <h1>Du lernst nicht Lektionen ab. Du baust echte Sprachfähigkeit auf.</h1>
          <p>16 interaktive A1-Lektionen verbinden Wortschatz, Grammatik, Hören, Sprechen und adaptive Wiederholung in einem einzigen Lernmodell.</p>
          <div className="hero-actions"><button className="primary-action" onClick={()=>openLesson(nextLesson)}>Weiterlernen <span>→</span></button><button className="secondary-action" onClick={()=>document.getElementById('course-units')?.scrollIntoView({behavior:'smooth'})}>Kursplan ansehen</button></div>
        </div>
        <div className="hero-orbit" aria-hidden="true"><div className="orbit-ring ring-one"/><div className="orbit-ring ring-two"/><div className="core-word"><span>A1</span><strong>{courseProgress}%</strong><small>{curriculumCompleted}/16 Lektionen</small></div><div className="orbit-dot dot-one">A</div><div className="orbit-dot dot-two">✓</div><div className="orbit-dot dot-three">🎙</div></div>
      </div>

      {lastResult && <div className="section-heading"><div><span className="eyebrow">LETZTE SESSION</span><h2>{lastResult.accuracy}% richtig · +{lastResult.xp} XP</h2></div><button className="text-button" onClick={()=>openLesson(buildReview())}>Gezielt wiederholen</button></div>}

      <div className="section-heading" id="course-units"><div><span className="eyebrow">DEIN WEG</span><h2>Englisch · A1 Grundkurs</h2></div><span className="pro-label">16 Lektionen</span></div>
      <div className="learning-path">{englishA1Units.map((unit,index)=>{
        const done = unit.lessons.filter(lesson=>progress.completedLessonIds.includes(lesson.id)).length;
        const percent = Math.round((done/unit.lessons.length)*100);
        const unlocked = index===0 || englishA1Units[index-1].lessons.every(lesson=>progress.completedLessonIds.includes(lesson.id));
        const state = percent===100?'done':unlocked?'active':'locked';
        const nextInUnit = unit.lessons.find(lesson=>!progress.completedLessonIds.includes(lesson.id)) ?? unit.lessons[unit.lessons.length-1];
        return <article key={unit.id} className={`unit-card ${state}`}><div className="path-rail"><div className="unit-node">{state==='done'?'✓':unit.number}</div>{index<englishA1Units.length-1&&<div className="rail-line"/>}</div><div className="unit-body"><div className="unit-topline"><span>Einheit {unit.number}</span><span>{unit.lessons.length} Lektionen</span></div><h3>{unit.title}</h3><p>{unit.subtitle}</p><div className="progress-row"><div className="progress-track"><span style={{width:`${percent}%`}}/></div><strong>{percent}%</strong></div><div className="lesson-chips">{unit.lessons.map((lesson,i)=><span key={lesson.id} className={progress.completedLessonIds.includes(lesson.id)?'complete':''}>{progress.completedLessonIds.includes(lesson.id)?'✓':i+1}</span>)}</div>{state==='active'&&<button className="unit-action" onClick={()=>openLesson(nextInUnit)}>{nextInUnit.title} <span>→</span></button>}{state==='locked'&&<span className="locked-copy">Schließe Einheit {unit.number-1} ab, um diesen Lernblock freizuschalten.</span>}</div></article>;
      })}</div>

      {englishA1Units.map(unit=><div key={`${unit.id}-detail`} className="course-unit-detail">
        <div className="section-heading"><div><span className="eyebrow">EINHEIT {unit.number}</span><h2>{unit.title} · {unit.lessons.length} Lektionen</h2></div><span className="pro-label">A1</span></div>
        <div className="starter-lessons">{unit.lessons.map((lesson,index)=>{const completed=progress.completedLessonIds.includes(lesson.id);const unlocked=lessonIsUnlocked(lesson.id,progress.completedLessonIds);const result=progress.results[lesson.id];return <button key={lesson.id} className={`starter-lesson ${completed?'completed':''}`} disabled={!unlocked} onClick={()=>openLesson(lesson)}><div className="starter-lesson-top"><span>Lektion {index+1}</span><span className="starter-lesson-status">{completed?'✓':unlocked?'→':'🔒'}</span></div><h3>{lesson.title}</h3><p>{lesson.subtitle}</p><div className="starter-lesson-footer"><span>{lesson.estimatedMinutes} Min · {lesson.exercises.length} Aufgaben</span><strong>{result?`${result.accuracy}%`:(unlocked?'Starten':'Gesperrt')}</strong></div></button>})}</div>
      </div>)}

      <div className="adaptive-strip"><div><strong>Adaptive Wiederholung</strong><span>VocabFast nutzt Konzeptstärken und Fälligkeiten. Je mehr du lernst, desto persönlicher wird jede Session.</span></div><button onClick={()=>openLesson(buildReview())}>Intelligente Übung starten</button></div>

      <div className="section-heading specialty-heading"><div><span className="eyebrow">DEIN VORTEIL</span><h2>Fachsprache für echte Situationen</h2></div><span className="pro-label">PRO</span></div>
      <div className="specialty-grid">{specialties.slice(0,4).map(item=><article key={item.id} className="specialty-card"><div className="specialty-icon">{item.icon}</div><div><strong>{item.name}</strong><p>{item.description}</p></div><button onClick={openPro} aria-label={`${item.name} öffnen`}>→</button></article>)}</div>
    </section>

    <aside className="right-column">
      <section className="daily-card"><div className="card-heading"><div><span className="eyebrow">HEUTE</span><h3>{preferences.dailyMinutes}-Minuten-Ziel</h3></div><strong>{studiedToday?'✓':'0%'}</strong></div><div className="daily-ring"><div><strong>{studiedToday?'100%':'0%'}</strong><span>{studiedToday?'geschafft':'bereit'}</span></div></div><div className="task-list"><div className={studiedToday?'done':''}><span>{studiedToday?'✓':'1'}</span><div><strong>Nächste Lektion</strong><small>{nextLesson.estimatedMinutes} Minuten</small></div></div><div><span>2</span><div><strong>Wiederholung</strong><small>Adaptiv nach Fehlern</small></div></div><div><span>3</span><div><strong>Hörtraining</strong><small>Browser-Audio</small></div></div><div><span>4</span><div><strong>Sprechen</strong><small>Mikrofon-Übungen</small></div></div></div></section>
      <section className="coach-card"><div className="coach-head"><div className="coach-mark">AI</div><div><span className="eyebrow">VOCABFAST COACH</span><h3>{progress.sessions?'Deine Wiederholung ist personalisiert.':'Wir beginnen mit einem Fundament.'}</h3></div></div><p>{progress.sessions?'Schwächere Konzepte werden häufiger ausgewählt, sichere Inhalte bekommen längere Abstände.':'Deine ersten Antworten zeigen uns, welche Wörter und Strukturen häufiger wiederholt werden sollten.'}</p><div className="coach-insight"><span>Fokus</span><strong>{progress.sessions?'Deine schwächsten Konzepte':'Begrüßung & “to be”'}</strong><small>Adaptive Auswahl</small></div><button onClick={()=>openLesson(progress.sessions?buildReview():englishA1Lessons[0])}>Training starten</button></section>
      <section className="streak-card"><div className="card-heading"><div><span className="eyebrow">KONTINUITÄT</span><h3>{progress.currentStreak} Tage Serie</h3></div><span className="streak-fire">🔥</span></div><div className="streak-number"><strong>{progress.currentStreak}</strong><span>aktueller Streak</span></div><p>Bestwert: {progress.longestStreak} Tage. Kurze tägliche Einheiten schlagen seltene Marathon-Sessions.</p></section>
      <section className="pro-card"><span className="pro-pill">VOCABFAST PRO</span><h3>Dein persönlicher Sprachcoach.</h3><p>Unbegrenztes KI-Training, Ausspracheanalyse, Fachbereiche, Dokumentlernen und Kompetenztests.</p><div className="price-row"><strong>19,99 €</strong><span>/ Monat</span></div><button onClick={openPro}>Pro ansehen</button><small>Prototyp · Checkout noch nicht aktiv</small></section>
    </aside>
  </div>;
}
