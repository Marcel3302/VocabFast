import { useMemo, useState } from 'react';
import { languages } from './data/catalog';
import LessonPlayer from './components/LessonPlayer';
import DashboardView from './components/DashboardView';
import { PracticeView, ProgressView, SpecialtyView, WordsView } from './components/PlatformViews';
import { englishA1Lessons, firstEnglishLesson } from './learning/curriculum/en-a1';
import { buildAdaptiveReviewLesson } from './learning/review';
import { readProgress, saveLessonResult } from './learning/progress';
import type { Lesson, LessonResult } from './learning/types';
import './course.css';

const navItems = [
  ['home', 'Lernpfad'],
  ['practice', 'Üben'],
  ['words', 'Wortschatz'],
  ['specialty', 'Fachsprache'],
  ['progress', 'Fortschritt']
] as const;

type NavId = typeof navItems[number][0];

function App() {
  const [activeNav, setActiveNav] = useState<NavId>('home');
  const [languageOpen, setLanguageOpen] = useState(false);
  const [languageCode, setLanguageCode] = useState('en');
  const [lessonOpen, setLessonOpen] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<Lesson>(firstEnglishLesson);
  const [progress, setProgress] = useState(() => readProgress());
  const [lastResult, setLastResult] = useState<LessonResult | null>(null);
  const activeLanguage = useMemo(() => languages.find(language => language.code === languageCode) ?? languages[0], [languageCode]);
  const curriculumCompleted = englishA1Lessons.filter(lesson => progress.completedLessonIds.includes(lesson.id)).length;

  function openLesson(lesson: Lesson) {
    setSelectedLesson(lesson);
    setLessonOpen(true);
  }

  function handleComplete(result: LessonResult) {
    setLastResult(result);
    setProgress(saveLessonResult(result));
  }

  function renderView() {
    if (activeNav === 'practice') return <PracticeView openLesson={openLesson} buildReview={buildAdaptiveReviewLesson} />;
    if (activeNav === 'words') return <WordsView />;
    if (activeNav === 'specialty') return <SpecialtyView />;
    if (activeNav === 'progress') return <ProgressView progress={progress} />;
    return <DashboardView progress={progress} lastResult={lastResult} openLesson={openLesson} buildReview={buildAdaptiveReviewLesson} />;
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-row"><div className="brand-mark" aria-hidden="true">V</div><div><strong>VocabFast</strong><span>Language Platform</span></div></div>
        <button className="language-switch" onClick={() => setLanguageOpen(true)}><span className="language-badge">{activeLanguage.symbol}</span><span className="language-switch-copy"><small>Ich lerne</small><strong>{activeLanguage.name}</strong></span><span className="chevron">⌄</span></button>
        <nav className="main-nav" aria-label="Hauptnavigation">{navItems.map(([id,label],index)=><button key={id} className={activeNav===id?'active':''} onClick={()=>setActiveNav(id)}><span className="nav-icon">{['⌂','◎','Aa','◇','↗'][index]}</span><span>{label}</span></button>)}</nav>
        <div className="sidebar-spacer"/>
        <div className="pro-mini-card"><span className="pro-pill">PRO</span><strong>Mehr aus jeder Minute.</strong><p>KI-Coach, Fachsprache, Analyse und unbegrenztes Training.</p><button onClick={()=>setActiveNav('specialty')}>Pro entdecken</button></div>
        <button className="profile-link" onClick={()=>setActiveNav('progress')}><span>MS</span><div><strong>Marcel</strong><small>{progress.sessions} Lernsession{progress.sessions===1?'':'s'}</small></div></button>
      </aside>

      <main className="content">
        <header className="topbar"><div className="mobile-brand"><div className="brand-mark">V</div><strong>VocabFast</strong></div><div className="topbar-stats"><div><span>◆</span><strong>{progress.totalXp}</strong><small>XP gesamt</small></div><div><span>🔥</span><strong>{progress.sessions?1:0}</strong><small>Tag</small></div><div><span>◉</span><strong>{curriculumCompleted}/8</strong><small>Einheit 1</small></div></div></header>
        {renderView()}
      </main>

      {languageOpen&&<div className="modal-backdrop" onMouseDown={()=>setLanguageOpen(false)}><section className="language-modal" onMouseDown={event=>event.stopPropagation()}><div className="modal-head"><div><span className="eyebrow">SPRACHEN</span><h2>Was möchtest du lernen?</h2><p>Die Lernengine ist für zehn Sprachen vorbereitet. Englisch wird zuerst vollständig ausgebaut.</p></div><button onClick={()=>setLanguageOpen(false)}>×</button></div><div className="language-grid">{languages.map(language=><button key={language.code} disabled={!language.available} className={languageCode===language.code?'selected':''} onClick={()=>{setLanguageCode(language.code);setLanguageOpen(false)}}><span className="language-tile-symbol">{language.symbol}</span><div><strong>{language.name}</strong><small>{language.nativeName}</small></div><em>{language.available?'Verfügbar':'In Vorbereitung'}</em></button>)}</div></section></div>}
      {lessonOpen&&<LessonPlayer lesson={selectedLesson} onClose={()=>setLessonOpen(false)} onComplete={handleComplete}/>} 
    </div>
  );
}

export default App;
