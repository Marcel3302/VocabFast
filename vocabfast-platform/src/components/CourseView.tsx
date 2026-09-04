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
        <span className="eyebrow">ENGLISCH · CEFR A1 BIS C1</span>
        <h1>Ein Lernsystem vom ersten Satz bis zu professioneller Nuance.</h1>
        <p>Die neue Plattform besitzt jetzt einen durchgängigen spielbaren Kursrücken über fünf CEFR-Stufen. Die Inhalte werden weiter ausgebaut und vor Veröffentlichung didaktisch geprüft.</p>
        <div className="course-hub-actions"><button className="view-primary" onClick={openPlacement}>Niveau einschätzen →</button><button className="course-ghost" onClick={()=>openLesson(levelLessons(courseState.activeLevel)[0])}>Aktuelles Level testen</button></div>
      </div>
      <div className="course-stat-cluster">
        <article><strong>{stats.levels}</strong><span>CEFR-Stufen</span></article>
        <article><strong>{stats.units}</strong><span>spielbare Units</span></article>
        <article><strong>{stats.lessons}</strong><span>Lektionen</span></article>
        <article><strong>{stats.exercises}</strong><span>Aufgaben</span></article>
      </div>
    </div>

    {courseState.placement&&<div className="placement-summary"><div><span className="eyebrow">LETZTE EINSTUFUNG</span><strong>{courseState.placement.recommendedLevel}</strong><p>{courseState.placement.score}/{courseState.placement.total} Orientierungsfragen richtig</p></div><button onClick={openPlacement}>Neu einstufen</button></div>}

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
            <div className="course-production-note"><span>Produktionsziel</span><div className="course-production-track"><i style={{width:`${Math.min(100,Math.round(level.units.length/level.productionTargetUnits*100))}%`}}/></div><small>{level.units.length} von geplanten {level.productionTargetUnits} großen Lernblöcken im aktuellen Entwicklungsstand</small></div>
            <div className="course-level-actions"><button className="course-select" onClick={()=>onSelectLevel(level.id)}>{active?'Ausgewählt':`${level.id} auswählen`}</button><button className="course-start" onClick={()=>{onSelectLevel(level.id);openLesson(firstOpen);}}>Lektion testen →</button></div>
          </div>
        </article>;
      })}
    </div>

    <div className="course-roadmap-note"><strong>Wichtig zur Kursqualität</strong><p>Die sichtbaren A1–C1-Stufen sind jetzt technisch und inhaltlich spielbar. Sie sind noch kein vollständig abgeschlossener CEFR-Kurs. Vor einem öffentlichen Versprechen wie „vollständiges C1“ werden deutlich mehr Units, Wortschatzabdeckung, Grammatikprogression, Hörmaterial, freie Produktion und externe Content-QA ergänzt.</p></div>
  </section>;
}
