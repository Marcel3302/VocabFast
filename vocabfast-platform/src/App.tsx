import { useMemo, useState } from 'react';
import { languages } from './data/catalog';
import LessonPlayer from './components/LessonPlayer';
import DashboardView from './components/DashboardView';
import Onboarding from './components/Onboarding';
import ProModal from './components/ProModal';
import ProfileView from './components/ProfileView';
import CoachView from './components/CoachView';
import { PracticeView, ProgressView, SpecialtyView, WordsView } from './components/PlatformViews';
import { englishA1Lessons, firstEnglishLesson } from './learning/curriculum';
import { readPreferences, savePreferences } from './learning/preferences';
import { buildAdaptiveReviewLesson, buildModeLesson } from './learning/review';
import { readProgress, resetLocalProgress, saveLessonResult } from './learning/progress';
import type { LearnerPreferences } from './learning/preferences';
import type { Lesson, LessonResult } from './learning/types';
import './course.css';
import './enhancements.css';

const navItems = [
  ['home', 'Lernpfad'],
  ['practice', 'Üben'],
  ['coach', 'Coach'],
  ['words', 'Wortschatz'],
  ['specialty', 'Fachsprache'],
  ['progress', 'Fortschritt']
] as const;

type NavId = typeof navItems[number][0] | 'profile';

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0,2).map(part=>part[0]).join('').toUpperCase() || 'VF';
}

function App() {
  const [activeNav, setActiveNav] = useState<NavId>('home');
  const [languageOpen, setLanguageOpen] = useState(false);
  const [languageCode, setLanguageCode] = useState('en');
  const [lessonOpen, setLessonOpen] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<Lesson>(firstEnglishLesson);
  const [progress, setProgress] = useState(() => readProgress());
  const [preferences, setPreferences] = useState(() => readPreferences());
  const [onboardingOpen, setOnboardingOpen] = useState(() => !readPreferences().onboarded);
  const [proOpen, setProOpen] = useState(false);
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

  function saveLearnerPreferences(next: LearnerPreferences) {
    setPreferences(savePreferences(next));
  }

  function finishOnboarding(next: LearnerPreferences) {
    saveLearnerPreferences(next);
    setOnboardingOpen(false);
    setActiveNav('home');
    openLesson(firstEnglishLesson);
  }

  function resetProgress() {
    resetLocalProgress();
    setProgress(readProgress());
    setLastResult(null);
    setActiveNav('home');
  }

  function renderView() {
    if (activeNav === 'practice') return <PracticeView openLesson={openLesson} buildReview={buildAdaptiveReviewLesson} buildMode={buildModeLesson} />;
    if (activeNav === 'coach') return <CoachView audioRate={preferences.audioRate} />;
    if (activeNav === 'words') return <WordsView />;
    if (activeNav === 'specialty') return <SpecialtyView openPro={()=>setProOpen(true)} />;
    if (activeNav === 'progress') return <ProgressView progress={progress} />;
    if (activeNav === 'profile') return <ProfileView preferences={preferences} progress={progress} onSave={saveLearnerPreferences} onResetProgress={resetProgress} />;
    return <DashboardView progress={progress} preferences={preferences} lastResult={lastResult} openLesson={openLesson} buildReview={buildAdaptiveReviewLesson} openPro={()=>setProOpen(true)} />;
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-row"><div className="brand-mark" aria-hidden="true">V</div><div><strong>VocabFast</strong><span>Language Platform</span></div></div>
        <button className="language-switch" onClick={() => setLanguageOpen(true)}><span className="language-badge">{activeLanguage.symbol}</span><span className="language-switch-copy"><small>Ich lerne</small><strong>{activeLanguage.name}</strong></span><span className="chevron">⌄</span></button>
        <nav className="main-nav" aria-label="Hauptnavigation">{navItems.map(([id,label],index)=><button key={id} className={activeNav===id?'active':''} onClick={()=>setActiveNav(id)}><span className="nav-icon">{['⌂','◎','AI','Aa','◇','↗'][index]}</span><span>{label}</span></button>)}</nav>
        <div className="sidebar-spacer"/>
        <div className="pro-mini-card"><span className="pro-pill">PRO</span><strong>Mehr aus jeder Minute.</strong><p>KI-Coach, Fachsprache, Analyse und unbegrenztes Training.</p><button onClick={()=>setProOpen(true)}>Pro entdecken</button></div>
        <button className={`profile-link ${activeNav==='profile'?'active':''}`} onClick={()=>setActiveNav('profile')}><span>{initials(preferences.name)}</span><div><strong>{preferences.name}</strong><small>{progress.currentStreak} Tage Streak · {progress.totalXp} XP</small></div></button>
      </aside>

      <main className="content">
        <header className="topbar"><div className="mobile-brand"><div className="brand-mark">V</div><strong>VocabFast</strong></div><div className="topbar-stats"><div><span>◆</span><strong>{progress.totalXp}</strong><small>XP gesamt</small></div><div><span>🔥</span><strong>{progress.currentStreak}</strong><small>Streak</small></div><div><span>◉</span><strong>{curriculumCompleted}/16</strong><small>A1 Lektionen</small></div></div></header>
        {renderView()}
      </main>

      {languageOpen&&<div className="modal-backdrop" onMouseDown={()=>setLanguageOpen(false)}><section className="language-modal" onMouseDown={event=>event.stopPropagation()}><div className="modal-head"><div><span className="eyebrow">SPRACHEN</span><h2>Was möchtest du lernen?</h2><p>Die Plattform ist für zehn Zielsprachen vorbereitet. Deutsch → Englisch wird zuerst vollständig auf Produktionsqualität gebracht.</p></div><button onClick={()=>setLanguageOpen(false)}>×</button></div><div className="language-grid">{languages.map(language=><button key={language.code} disabled={!language.available} className={languageCode===language.code?'selected':''} onClick={()=>{setLanguageCode(language.code);setLanguageOpen(false)}}><span className="language-tile-symbol">{language.symbol}</span><div><strong>{language.name}</strong><small>{language.nativeName}</small></div><em>{language.available?'Verfügbar':'In Vorbereitung'}</em></button>)}</div></section></div>}
      {lessonOpen&&<LessonPlayer lesson={selectedLesson} audioRate={preferences.audioRate} onClose={()=>setLessonOpen(false)} onComplete={handleComplete}/>} 
      {onboardingOpen&&<Onboarding initial={preferences} onDone={finishOnboarding}/>} 
      {proOpen&&<ProModal onClose={()=>setProOpen(false)}/>} 
    </div>
  );
}

export default App;
