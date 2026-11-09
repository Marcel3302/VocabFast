import { lazy, Suspense, useState } from 'react';
import { studySeconds } from '../learning/study-time';
import { specialties, languageByCode } from '../data/catalog';
import { courseLevels, levelById, type CefrLevel } from '../learning/curriculum';
import type { PlacementResult } from '../learning/course-state';
import type { LearnerPreferences } from '../learning/preferences';
import type { PlatformProgress } from '../learning/progress';
import type { Lesson, LessonResult } from '../learning/types';
import './dashboard-experience.css';
import './dashboard-toolkit.css';
import './dashboard-simple.css';

const PDFReader=lazy(()=>import('./PDFReader'));

type Props={progress:PlatformProgress;preferences:LearnerPreferences;activeLevel:CefrLevel;placement:PlacementResult|null;lastResult:LessonResult|null;targetLanguage:string;isPro?:boolean;openLesson:(lesson:Lesson)=>void;buildReview:()=>Lesson;openPro:()=>void;openCourse:()=>void;openPlacement:()=>void;openTranslator:()=>void;openGrammar:()=>void;openWords:()=>void;openTalk:()=>void;openPractice:()=>void;onSelectLevel:(level:CefrLevel)=>void};
const placementLabels={grammar:'Grammatik',vocabulary:'Wortschatz',communication:'Kommunikation'} as const;

export default function DashboardView({progress,preferences,activeLevel,placement,lastResult,targetLanguage,isPro=false,openLesson,buildReview,openPro,openCourse,openPlacement,openTranslator,openGrammar,openWords,openTalk,openPractice,onSelectLevel}:Props){
  const [readerOpen,setReaderOpen]=useState(false);
  const language=languageByCode(targetLanguage),levels=courseLevels(targetLanguage),level=levelById(activeLevel,targetLanguage),lessons=level.units.flatMap(unit=>unit.lessons);
  const curriculumCompleted=lessons.filter(lesson=>progress.completedLessonIds.includes(lesson.id)).length,courseProgress=lessons.length?Math.round(curriculumCompleted/lessons.length*100):0,nextLesson=lessons.find(lesson=>!progress.completedLessonIds.includes(lesson.id))??lessons[lessons.length-1],fullEnglish=targetLanguage==='en';
  const minutes=Math.floor(studySeconds()/60),goalPercent=Math.min(100,Math.round(studySeconds()/(preferences.dailyMinutes*60)*100)),studiedToday=goalPercent>=100;
  const placementAreas=placement?.breakdown?(Object.keys(placementLabels) as Array<keyof typeof placementLabels>).map(key=>{const item=placement.breakdown![key];return{key,label:placementLabels[key],percent:item.total?Math.round(item.score/item.total*100):0}}):[];
  const doneUnits=level.units.filter(unit=>unit.lessons.every(lesson=>progress.completedLessonIds.includes(lesson.id))).length;
  const nextUnit=level.units.find(unit=>unit.lessons.some(lesson=>!progress.completedLessonIds.includes(lesson.id)))??level.units[level.units.length-1];
  const greeting=new Date().getHours()<11?'Guten Morgen':new Date().getHours()<18?'Hallo':'Guten Abend';
  const todayMessage=studiedToday?'Tagesziel geschafft. Wenn du noch Energie hast, wiederhole nur schwierige Inhalte.':goalPercent>0?'Du bist schon drin – eine kurze Einheit reicht, um heute sauber abzuschließen.':'Starte klein: eine Lektion ist genug, um den Rhythmus zu halten.';

  return <><div className="page-grid learn-dashboard"><section className="primary-column">
    <div className="learn-hero learn-hero-simple">
      <div className="learn-hero-copy"><span className="eyebrow">{greeting.toUpperCase()} · {preferences.name.toUpperCase()}</span><h1>Einfach anfangen. VocabFast führt dich weiter.</h1><p>{todayMessage}</p><div className="learn-hero-actions"><button className="primary-action" onClick={()=>openLesson(nextLesson)}>Weiterlernen · {nextLesson.title} <span>→</span></button><button className="secondary-action" onClick={()=>openLesson(buildReview())}>Smart Review</button></div></div>
      <div className="learn-focus-ring" aria-label={courseProgress+'% Fortschritt im aktuellen Level'}><div><span>{language.symbol}</span><strong>{courseProgress}%</strong><small>{language.name} · {activeLevel}</small></div></div>
    </div>

    <section className="learn-modes">
      <div className="learn-simple-heading"><div><span className="eyebrow">WAS WILLST DU JETZT MACHEN?</span><h2>Direkt zum richtigen Lernmodus</h2></div></div>
      <div className="learn-mode-grid">
        <button className="learn-mode talk" onClick={openTalk}><span>✦</span><div><strong>AI Talk</strong><small>frei sprechen & zuhören</small></div><b>→</b></button>
        <button className="learn-mode" onClick={openPractice}><span>◎</span><div><strong>Üben</strong><small>gemischte neue Aufgaben</small></div><b>→</b></button>
        <button className="learn-mode" onClick={openWords}><span>W</span><div><strong>Wortschatz</strong><small>Vokabeln aktiv lernen</small></div><b>→</b></button>
        <button className="learn-mode" onClick={openGrammar}><span>Aa</span><div><strong>Grammatik</strong><small>Regeln verstehen & anwenden</small></div><b>→</b></button>
        <button className="learn-mode" onClick={openTranslator}><span>⇄</span><div><strong>Translate</strong><small>übersetzen, hören & speichern</small></div><b>→</b></button>
        <button className="learn-mode" onClick={()=>setReaderOpen(true)}><span>PDF</span><div><strong>PDF Reader</strong><small>mit eigenen Unterlagen lernen</small></div><b>→</b></button>
      </div>
    </section>

    <section className="learn-status-strip">
      <div><span>HEUTE</span><strong>{minutes}/{preferences.dailyMinutes} Min</strong><div className="mini-progress"><i style={{width:goalPercent+'%'}}/></div></div>
      <div><span>STREAK</span><strong>{progress.currentStreak} Tage</strong><small>Bestwert {progress.longestStreak}</small></div>
      <div><span>FORTSCHRITT</span><strong>{curriculumCompleted}/{lessons.length} Lektionen</strong><small>{progress.totalXp} XP gesamt</small></div>
      <button onClick={()=>openLesson(buildReview())}><span>◎</span><div><strong>Wiederholen</strong><small>Schwieriges festigen</small></div></button>
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

    {fullEnglish&&!isPro&&<section className="learn-pro-preview"><div><span className="pro-pill">PRO</span><h2>Wenn du noch tiefer lernen willst.</h2><p>Zusätzliche Fachsprache, intensivere Trainings und erweiterte Lernwerkzeuge ergänzen deinen normalen Lernpfad.</p></div><div className="specialty-mini-list">{specialties.slice(0,3).map(item=><span key={item.id}>{item.icon} {item.name}</span>)}</div><button onClick={openPro}>Pro ansehen →</button></section>}
  </section>

</div>{readerOpen&&<Suspense fallback={<div className="deferred-modal-loading"><div><i/><strong>PDF Reader wird geladen …</strong></div></div>}><PDFReader sourceLanguage={preferences.targetLanguage} targetLanguage={preferences.sourceLanguage} onClose={()=>setReaderOpen(false)}/></Suspense>}</>;
}
