import { studySeconds } from '../learning/study-time';
import { specialties, languageByCode } from '../data/catalog';
import { courseLevels, levelById, type CefrLevel } from '../learning/curriculum';
import type { PlacementResult } from '../learning/course-state';
import type { LearnerPreferences } from '../learning/preferences';
import type { PlatformProgress } from '../learning/progress';
import type { Lesson, LessonResult } from '../learning/types';
import './dashboard-experience.css';

type Props={progress:PlatformProgress;preferences:LearnerPreferences;activeLevel:CefrLevel;placement:PlacementResult|null;lastResult:LessonResult|null;targetLanguage:string;isPro?:boolean;openLesson:(lesson:Lesson)=>void;buildReview:()=>Lesson;openPro:()=>void;openCourse:()=>void;openPlacement:()=>void;openTranslator:()=>void;onSelectLevel:(level:CefrLevel)=>void};
const placementLabels={grammar:'Grammatik',vocabulary:'Wortschatz',communication:'Kommunikation'} as const;

export default function DashboardView({progress,preferences,activeLevel,placement,lastResult,targetLanguage,isPro=false,openLesson,buildReview,openPro,openCourse,openPlacement,openTranslator,onSelectLevel}:Props){
  const language=languageByCode(targetLanguage),levels=courseLevels(targetLanguage),level=levelById(activeLevel,targetLanguage),lessons=level.units.flatMap(unit=>unit.lessons);
  const curriculumCompleted=lessons.filter(lesson=>progress.completedLessonIds.includes(lesson.id)).length,courseProgress=lessons.length?Math.round(curriculumCompleted/lessons.length*100):0,nextLesson=lessons.find(lesson=>!progress.completedLessonIds.includes(lesson.id))??lessons[lessons.length-1],fullEnglish=targetLanguage==='en';
  const minutes=Math.floor(studySeconds()/60),goalPercent=Math.min(100,Math.round(studySeconds()/(preferences.dailyMinutes*60)*100)),studiedToday=goalPercent>=100;
  const placementAreas=placement?.breakdown?(Object.keys(placementLabels) as Array<keyof typeof placementLabels>).map(key=>{const item=placement.breakdown![key];return{key,label:placementLabels[key],percent:item.total?Math.round(item.score/item.total*100):0}}):[];
  const doneUnits=level.units.filter(unit=>unit.lessons.every(lesson=>progress.completedLessonIds.includes(lesson.id))).length;
  const nextUnit=level.units.find(unit=>unit.lessons.some(lesson=>!progress.completedLessonIds.includes(lesson.id)))??level.units[level.units.length-1];
  const greeting=new Date().getHours()<11?'Guten Morgen':new Date().getHours()<18?'Hallo':'Guten Abend';
  const todayMessage=studiedToday?'Tagesziel geschafft. Wenn du noch Energie hast, wiederhole nur schwierige Inhalte.':goalPercent>0?'Du bist schon drin – eine kurze Einheit reicht, um heute sauber abzuschließen.':'Starte klein: eine Lektion ist genug, um den Rhythmus zu halten.';

  return <div className="page-grid learn-dashboard"><section className="primary-column">
    <div className="learn-hero">
      <div className="learn-hero-copy"><span className="eyebrow">{greeting.toUpperCase()} · {preferences.name.toUpperCase()}</span><h1>Was bringt dich heute am weitesten?</h1><p>{todayMessage}</p><div className="learn-hero-actions"><button className="primary-action" onClick={()=>openLesson(nextLesson)}>Weiter mit „{nextLesson.title}“ <span>→</span></button><button className="secondary-action" onClick={()=>openLesson(buildReview())}>Smart Review</button></div></div>
      <div className="learn-focus-ring" aria-label={`${courseProgress}% Fortschritt im aktuellen Level`}><div><span>{language.symbol}</span><strong>{courseProgress}%</strong><small>{language.name} · {activeLevel}</small></div></div>
    </div>

    <div className="learn-command-grid">
      <button className="learn-command primary" onClick={()=>openLesson(nextLesson)}><span className="learn-command-icon">▶</span><div><small>NÄCHSTER SCHRITT</small><strong>{nextLesson.title}</strong><p>{nextLesson.estimatedMinutes} Min · direkt weitermachen</p></div><b>→</b></button>
      <button className="learn-command" onClick={()=>openLesson(buildReview())}><span className="learn-command-icon">◎</span><div><small>SMART REVIEW</small><strong>Unsicheres festigen</strong><p>Kurze Wiederholung aus deinem Lernstand</p></div><b>→</b></button>
      <button className="learn-command" onClick={openTranslator}><span className="learn-command-icon">⇄</span><div><small>QUICK TOOL</small><strong>Etwas verstehen</strong><p>Text sprechen, übersetzen und speichern</p></div><b>→</b></button>
    </div>

    <section className="today-plan-card">
      <div className="today-plan-head"><div><span className="eyebrow">HEUTE</span><h2>Dein {preferences.dailyMinutes}-Minuten-Plan</h2><p>Du musst nicht alles machen. VocabFast priorisiert die sinnvollsten Schritte.</p></div><div className="today-progress"><strong>{goalPercent}%</strong><span>{minutes}/{preferences.dailyMinutes} Min</span></div></div>
      <div className="today-plan-track"><i style={{width:`${goalPercent}%`}}/></div>
      <div className="today-plan-steps"><button onClick={()=>openLesson(nextLesson)} className={curriculumCompleted>0?'done':''}><span>{curriculumCompleted>0?'✓':'1'}</span><div><strong>Neue Inhalte</strong><small>{nextLesson.title}</small></div><em>{nextLesson.estimatedMinutes} Min</em></button><button onClick={()=>openLesson(buildReview())}><span>2</span><div><strong>Wiederholen</strong><small>Schwierige Inhalte aktiv abrufen</small></div><em>5 Min</em></button><button onClick={openTranslator}><span>3</span><div><strong>Real-Life Mini-Aufgabe</strong><small>Übersetze einen Satz, den du heute wirklich brauchst</small></div><em>2 Min</em></button></div>
    </section>

    <div className="section-heading learn-section-heading"><div><span className="eyebrow">DEIN LEVEL</span><h2>{language.name} · {activeLevel} {level.title}</h2></div><button className="text-button" onClick={openCourse}>Kompletten Kurs öffnen →</button></div>
    <div className="cefr-strip learn-level-strip" aria-label="CEFR-Level auswählen">{levels.map(item=><button key={item.id} className={item.id===activeLevel?'active':''} onClick={()=>onSelectLevel(item.id)}><strong>{item.id}</strong><small>{item.title}</small></button>)}</div>

    <section className="current-path-card">
      <div className="current-path-head"><div><span className="eyebrow">AKTUELLER LERNBLOCK</span><h2>{nextUnit.title}</h2><p>{nextUnit.subtitle}</p></div><div><strong>{doneUnits}/{level.units.length}</strong><small>Units fertig</small></div></div>
      <div className="unit-overview-grid">{level.units.map((unit,index)=>{const done=unit.lessons.filter(lesson=>progress.completedLessonIds.includes(lesson.id)).length,percent=unit.lessons.length?Math.round(done/unit.lessons.length*100):0;return <button key={unit.id} className={percent===100?'complete':unit.id===nextUnit.id?'active':''} onClick={openCourse}><span>{percent===100?'✓':unit.number}</span><div><strong>{unit.title}</strong><small>{done}/{unit.lessons.length} Lektionen</small><div><i style={{width:`${percent}%`}}/></div></div><b>{percent}%</b></button>})}</div>
      <button className="current-path-cta" onClick={openCourse}>Kursdetails & alle Lektionen öffnen <span>→</span></button>
    </section>

    {fullEnglish&&placement&&<section className="personal-plan-card compact-plan"><div className="personal-plan-head"><div><span className="eyebrow">DEINE EINSTUFUNG</span><h2>Empfohlener Start: {placement.recommendedLevel}</h2><p>Deine Einstufung hilft VocabFast dabei, den Lernweg sinnvoll zu priorisieren.</p></div><div className="personal-plan-level"><span>START</span><strong>{placement.recommendedLevel}</strong><small>{placement.score}/{placement.total} richtig</small></div></div>{placementAreas.length>0&&<div className="personal-plan-bars">{placementAreas.map(item=><div key={item.key}><span><strong>{item.label}</strong><small>{item.percent}%</small></span><div><i style={{width:`${item.percent}%`}}/></div></div>)}</div>}<div className="personal-plan-focus"><div>{(placement.focus?.length?placement.focus:['Kurze tägliche Einheiten festigen deinen Fortschritt.']).slice(0,2).map(item=><p key={item}>✓ {item}</p>)}</div><button onClick={openPlacement}>Einstufung wiederholen</button></div></section>}

    {lastResult&&<section className="last-session-card"><div><span className="eyebrow">LETZTE EINHEIT</span><h2>{lastResult.accuracy}% richtig · +{lastResult.xp} XP</h2><p>{lastResult.accuracy>=85?'Stark. Jetzt lohnt sich der nächste Lernschritt.':'Die Fehler aus dieser Einheit sind perfektes Material für eine kurze Wiederholung.'}</p></div><button onClick={()=>openLesson(buildReview())}>Fehler wiederholen →</button></section>}

    {fullEnglish&&!isPro&&<section className="learn-pro-preview"><div><span className="pro-pill">PRO</span><h2>Wenn du mehr sprechen willst als klicken.</h2><p>Real-Life KI-Gespräche, Fachsprache und intensiveres Feedback erweitern deinen normalen Lernpfad.</p></div><div className="specialty-mini-list">{specialties.slice(0,3).map(item=><span key={item.id}>{item.icon} {item.name}</span>)}</div><button onClick={openPro}>Pro ansehen →</button></section>}
  </section>

  <aside className="right-column learn-side">
    <section className="daily-card daily-card-modern"><div className="card-heading"><div><span className="eyebrow">HEUTE</span><h3>{studiedToday?'Ziel geschafft':'Noch ein kurzer Schritt'}</h3></div><strong>{studiedToday?'✓':`${goalPercent}%`}</strong></div><div className="daily-ring"><div><strong>{`${goalPercent}%`}</strong><span>{`${minutes} / ${preferences.dailyMinutes} Min`}</span></div></div><p>{studiedToday?'Du musst heute nichts mehr beweisen. Morgen geht es einfach weiter.':'Regelmäßige kurze Sessions schlagen seltene Marathon-Einheiten.'}</p></section>

    <section className="coach-card coach-card-modern"><div className="coach-head"><div className="coach-mark">✦</div><div><span className="eyebrow">VOCABFAST MEMORY</span><h3>{progress.sessions?'Dein sinnvollster nächster Schritt':'Lass uns deinen Lernrhythmus starten'}</h3></div></div><div className="coach-insight"><span>Aktueller Fokus</span><strong>{language.name} {activeLevel}</strong><small>{level.descriptor}</small></div><button onClick={()=>openLesson(progress.sessions?buildReview():lessons[0])}>{progress.sessions?'Empfohlenes Training':'Erste Einheit starten'}</button></section>

    <section className="streak-card streak-card-modern"><div className="card-heading"><div><span className="eyebrow">ROUTINE</span><h3>{progress.currentStreak} Tage am Stück</h3></div><span className="streak-fire">🔥</span></div><div className="streak-number"><strong>{progress.currentStreak}</strong><span>aktueller Streak</span></div><p>Bestwert: {progress.longestStreak} Tage. Ein verpasster Tag löscht deinen Fortschritt nicht – entscheidend ist der Wiedereinstieg.</p></section>

    {fullEnglish&&!placement&&<section className="placement-side-card"><span className="eyebrow">NOCH UNSICHER?</span><h3>Finde deinen besten Einstieg.</h3><p>Der Einstufungstest hilft dir, nicht zu leicht und nicht zu schwer zu starten.</p><button onClick={openPlacement}>Niveau bestimmen</button></section>}
  </aside></div>;
}