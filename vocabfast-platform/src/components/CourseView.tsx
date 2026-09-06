import { courseStats, englishCourseLevels, levelLessons, type CefrLevel } from '../learning/curriculum';
import type { CourseState } from '../learning/course-state';
import type { PlatformProgress } from '../learning/progress';
import type { Lesson } from '../learning/types';
import './course-view.css';

type Props = {
  progress: PlatformProgress;
  courseState: CourseState;
  onSelectLevel: (level: CefrLevel) => void;
  openLesson: (lesson: Lesson) => void;
  openPlacement: () => void;
};

function levelProgress(level: CefrLevel, progress: PlatformProgress) {
  const lessons = levelLessons(level);
  const done = lessons.filter(lesson=>progress.completedLessonIds.includes(lesson.id)).length;
  return { done, total:lessons.length, percent:lessons.length?Math.round(done/lessons.length*100):0 };
}

export default function CourseView({ progress, courseState, onSelectLevel, openLesson, openPlacement }: Props) {
  const stats = courseStats();
  return <section className="course-hub platform-view">
    <div className="course-hub-hero">
      <div>
        <span className="eyebrow">ENGLISCH · CEFR A1 BIS C2</span>
        <h1>Ein Lernsystem vom ersten Satz bis zum sprachlichen Feinschliff.</h1>
        <p>Wähle dein aktuelles Niveau oder starte mit der Einstufung. Der Kurs verbindet Wortschatz, Grammatik, Hören, Sprechen und aktive Produktion zu einem klaren Lernpfad.</p>
        <div className="course-hub-actions"><button className="view-primary" onClick={openPlacement}>36-Fragen-Einstufung →</button><button className="course-ghost" onClick={()=>openLesson(levelLessons(courseState.activeLevel)[0])}>Aktuelles Level starten</button></div>
      </div>
      <div className="course-stat-cluster">
        <article><strong>{stats.levels}</strong><span>CEFR-Stufen</span></article>
        <article><strong>{stats.units}</strong><span>Lernblöcke</span></article>
        <article><strong>{stats.lessons}</strong><span>Lektionen</span></article>
        <article><strong>{stats.exercises}</strong><span>Aufgaben</span></article>
      </div>
    </div>

    {courseState.placement&&<div className="placement-summary"><div><span className="eyebrow">LETZTE EINSTUFUNG</span><strong>{courseState.placement.recommendedLevel}</strong><p>{courseState.placement.score}/{courseState.placement.total} Orientierungsfragen richtig</p>{courseState.placement.focus?.[0]&&<small>Fokus: {courseState.placement.focus[0]}</small>}</div><button onClick={openPlacement}>Neu einstufen</button></div>}

    <div className="course-levels">
      {englishCourseLevels.map(level=>{
        const lp = levelProgress(level.id,progress);
        const active = level.id===courseState.activeLevel;
        const firstOpen = level.units.flatMap(unit=>unit.lessons).find(lesson=>!progress.completedLessonIds.includes(lesson.id)) ?? level.units[0].lessons[0];
        return <article key={level.id} className={`course-level-card ${active?'active':''}`}>
          <div className="course-level-side"><div className="course-level-badge">{level.id}</div><span>{active?'AKTIV':'CEFR'}</span></div>
          <div className="course-level-main">
            <div className="course-level-title"><div><span>{level.descriptor}</span><h2>{level.title}</h2></div><div className="course-level-progress"><strong>{lp.percent}%</strong><small>{lp.done}/{lp.total} Lektionen</small></div></div>
            <p className="course-level-goal">{level.goal}</p>
            <div className="course-unit-grid">{level.units.map(unit=>{
              const done = unit.lessons.filter(lesson=>progress.completedLessonIds.includes(lesson.id)).length;
              return <div key={unit.id} className="course-unit-mini"><div><span>UNIT {unit.number}</span><strong>{unit.title}</strong></div><small>{done}/{unit.lessons.length} · {unit.subtitle}</small></div>;
            })}</div>
            <div className="course-level-actions"><button className="course-select" onClick={()=>onSelectLevel(level.id)}>{active?'Ausgewählt':`${level.id} auswählen`}</button><button className="course-start" onClick={()=>{onSelectLevel(level.id);openLesson(firstOpen);}}>Lektion starten →</button></div>
          </div>
        </article>;
      })}
    </div>
  </section>;
}
