import { useEffect, useMemo, useRef, useState } from 'react';
import { languages } from './data/catalog';
import LessonPlayer from './components/LessonPlayer';
import DashboardView from './components/DashboardView';
import CourseView from './components/CourseView';
import PlacementTest from './components/PlacementTest';
import Onboarding from './components/Onboarding';
import ProModal from './components/ProModal';
import ProfileView from './components/ProfileView';
import CoachView from './components/CoachView';
import GrammarView from './components/GrammarView';
import WelcomeGate from './components/WelcomeGate';
import { PracticeView, ProgressView, SpecialtyView, WordsView } from './components/PlatformViews';
import { firstEnglishLesson, levelLessons, type CefrLevel } from './learning/curriculum';
import { readCourseState, saveActiveLevel, savePlacement, type PlacementBreakdown } from './learning/course-state';
import { defaultPreferences, readPreferences, savePreferences } from './learning/preferences';
import { buildAdaptiveReviewLesson, buildModeLesson } from './learning/review';
import { readProgress, resetLocalProgress, saveLessonResult } from './learning/progress';
import { bootstrapAccount, clearPlatformStorage, flushAccountSync, logoutAccount, queueAccountSync, type AccountUser } from './learning/account';
import { checkoutSucceededInPreview, clearCheckoutQuery } from './learning/billing';
import type { LearnerPreferences } from './learning/preferences';
import type { Lesson, LessonResult } from './learning/types';
import './course.css';
import './enhancements.css';
import './layout-polish.css';

const navItems = [
  ['home', 'Lernpfad'],
  ['course', 'A1–C2 Kurs'],
  ['grammar', 'Grammatik'],
  ['practice', 'Üben'],
  ['coach', 'Coach'],
  ['words', 'Wortschatz'],
  ['specialty', 'Fachsprache'],
  ['progress', 'Fortschritt']
] as const;

const navIcons=['⌂','A1','Aa','◎','AI','W','◇','↗'];
type NavId = typeof navItems[number][0] | 'profile';
type AccountPhase='loading'|'guest'|'ready';

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0,2).map(part=>part[0]).join('').toUpperCase() || 'VF';
}

function App() {
  const booted=useRef(false);
  const [accountPhase,setAccountPhase]=useState<AccountPhase>('loading');
  const [accountUser,setAccountUser]=useState<AccountUser|null>(null);
  const [authNotice,setAuthNotice]=useState('');
  const [activeNav, setActiveNav] = useState<NavId>('home');
  const [languageOpen, setLanguageOpen] = useState(false);
  const [languageCode, setLanguageCode] = useState('en');
  const [lessonOpen, setLessonOpen] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<Lesson>(firstEnglishLesson);
  const [progress, setProgress] = useState(() => readProgress());
  const [preferences, setPreferences] = useState(() => readPreferences());
  const [courseState, setCourseState] = useState(() => readCourseState());
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [placementOpen, setPlacementOpen] = useState(false);
  const [proOpen, setProOpen] = useState(false);
  const [lastResult, setLastResult] = useState<LessonResult | null>(null);
  const [checkoutSuccess,setCheckoutSuccess]=useState(()=>checkoutSucceededInPreview());
  const activeLanguage = useMemo(() => languages.find(language => language.code === languageCode) ?? languages[0], [languageCode]);
  const activeLessons = levelLessons(courseState.activeLevel);
  const curriculumCompleted = activeLessons.filter(lesson => progress.completedLessonIds.includes(lesson.id)).length;

  useEffect(()=>{
    if(booted.current)return;
    booted.current=true;
    void hydrateAccount();
  },[]);

  useEffect(()=>{
    if(!checkoutSuccess)return;
    clearCheckoutQuery();
  },[checkoutSuccess]);

  async function hydrateAccount() {
    setAccountPhase('loading');
    setAuthNotice('');
    try{
      const result=await bootstrapAccount();
      if(!result.user){setAccountUser(null);setAccountPhase('guest');return;}
      if(!result.hasRemoteState)savePreferences({...defaultPreferences,name:result.user.name,onboarded:false});
      const nextPreferences=readPreferences();
      const nextProgress=readProgress();
      const nextCourse=readCourseState();
      setAccountUser(result.user);
      setPreferences(nextPreferences);
      setProgress(nextProgress);
      setCourseState(nextCourse);
      setLastResult(null);
      setOnboardingOpen(!nextPreferences.onboarded);
      setPlacementOpen(nextPreferences.onboarded&&!nextCourse.placement&&nextProgress.completedLessonIds.length===0);
      setAccountPhase('ready');
    }catch(reason){
      setAccountUser(null);
      setAuthNotice(reason instanceof Error?reason.message:'Die Konto-API konnte nicht geladen werden.');
      setAccountPhase('guest');
    }
  }

  async function handleAuthenticated(_user:AccountUser,_isNew:boolean) {
    await hydrateAccount();
  }

  function openLesson(lesson: Lesson) {
    setSelectedLesson(lesson);
    setLessonOpen(true);
  }

  function handleComplete(result: LessonResult) {
    setLastResult(result);
    setProgress(saveLessonResult(result));
    queueAccountSync();
  }

  function saveLearnerPreferences(next: LearnerPreferences) {
    setPreferences(savePreferences(next));
    queueAccountSync();
  }

  function selectLevel(level: CefrLevel) {
    setCourseState(saveActiveLevel(level));
    queueAccountSync();
  }

  function finishPlacement(level:CefrLevel,score:number,total:number,details:{breakdown:PlacementBreakdown;focus:string[]}) {
    setCourseState(savePlacement(score,total,level,details.breakdown,details.focus));
    setPlacementOpen(false);
    setActiveNav('home');
    queueAccountSync(100);
  }

  function finishOnboarding(next: LearnerPreferences) {
    saveLearnerPreferences(next);
    setCourseState(saveActiveLevel('A1'));
    setOnboardingOpen(false);
    setActiveNav('home');
    setPlacementOpen(true);
    queueAccountSync(100);
  }

  function resetProgress() {
    resetLocalProgress();
    setProgress(readProgress());
    setLastResult(null);
    setActiveNav('home');
    queueAccountSync(100);
  }

  async function signOut() {
    await flushAccountSync();
    await logoutAccount().catch(()=>{});
    clearPlatformStorage();
    setAccountUser(null);
    setPreferences(readPreferences());
    setProgress(readProgress());
    setCourseState(readCourseState());
    setOnboardingOpen(false);
    setPlacementOpen(false);
    setLessonOpen(false);
    setActiveNav('home');
    setAuthNotice('Du wurdest abgemeldet.');
    setAccountPhase('guest');
  }

  function renderView() {
    const buildReview = () => buildAdaptiveReviewLesson(courseState.activeLevel);
    const buildMode = (types: Parameters<typeof buildModeLesson>[0], title: string, subtitle: string) => buildModeLesson(types,title,subtitle,courseState.activeLevel);
    if (activeNav === 'course') return <CourseView progress={progress} courseState={courseState} onSelectLevel={selectLevel} openLesson={openLesson} openPlacement={()=>setPlacementOpen(true)} />;
    if (activeNav === 'grammar') return <GrammarView activeLevel={courseState.activeLevel} openLesson={openLesson} onSelectLevel={selectLevel}/>;
    if (activeNav === 'practice') return <PracticeView openLesson={openLesson} buildReview={buildReview} buildMode={buildMode} />;
    if (activeNav === 'coach') return <CoachView audioRate={preferences.audioRate} />;
    if (activeNav === 'words') return <WordsView />;
    if (activeNav === 'specialty') return <SpecialtyView openPro={()=>setProOpen(true)} />;
    if (activeNav === 'progress') return <ProgressView progress={progress} />;
    if (activeNav === 'profile') return <ProfileView preferences={preferences} progress={progress} onSave={saveLearnerPreferences} onResetProgress={resetProgress} />;
    return <DashboardView progress={progress} preferences={preferences} activeLevel={courseState.activeLevel} lastResult={lastResult} openLesson={openLesson} buildReview={buildReview} openPro={()=>setProOpen(true)} openCourse={()=>setActiveNav('course')} openPlacement={()=>setPlacementOpen(true)} onSelectLevel={selectLevel} />;
  }

  if(accountPhase==='loading')return <div className="platform-loading"><div><i/><strong>Dein VocabFast-Konto wird geladen …</strong></div></div>;
  if(accountPhase==='guest')return <WelcomeGate onAuthenticated={handleAuthenticated} notice={authNotice}/>;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-row"><div className="brand-mark" aria-hidden="true">V</div><div><strong>VocabFast</strong><span>Language Platform</span></div></div>
        <button className="language-switch" onClick={() => setLanguageOpen(true)}><span className="language-badge">{activeLanguage.symbol}</span><span className="language-switch-copy"><small>Ich lerne · {courseState.activeLevel}</small><strong>{activeLanguage.name}</strong></span><span className="chevron">⌄</span></button>
        <nav className="main-nav" aria-label="Hauptnavigation">{navItems.map(([id,label],index)=><button key={id} className={activeNav===id?'active':''} onClick={()=>setActiveNav(id)}><span className="nav-icon">{navIcons[index]}</span><span>{label}</span></button>)}</nav>
        <div className="sidebar-spacer"/>
        <div className="pro-mini-card"><span className="pro-pill">PRO</span><strong>Mehr aus jeder Minute.</strong><p>KI-Coach, Fachsprache, Analyse und unbegrenztes Training.</p><button onClick={()=>setProOpen(true)}>Pro entdecken</button></div>
        <button className={`profile-link ${activeNav==='profile'?'active':''}`} onClick={()=>setActiveNav('profile')}><span>{initials(preferences.name)}</span><div><strong>{preferences.name}</strong><small>{progress.currentStreak} Tage Streak · {progress.totalXp} XP</small></div></button>
        <div className="account-session-row"><span><strong>{accountUser?.email}</strong><small>Preview-Konto · gespeichert</small></span><button onClick={()=>void signOut()}>Abmelden</button></div>
      </aside>

      <main className="content">
        <header className="topbar"><div className="mobile-brand"><div className="brand-mark">V</div><strong>VocabFast</strong></div><div className="topbar-stats"><div><span>◆</span><strong>{progress.totalXp}</strong><small>XP gesamt</small></div><div><span>🔥</span><strong>{progress.currentStreak}</strong><small>Streak</small></div><div><span>◉</span><strong>{curriculumCompleted}/{activeLessons.length}</strong><small>{courseState.activeLevel} Lektionen</small></div></div></header>
        {checkoutSuccess&&<div className="checkout-success"><div><span><strong>Stripe-Testcheckout abgeschlossen.</strong> Der Test war erfolgreich; es wurde kein echtes Geld belastet und noch kein produktiver Pro-Status gesetzt.</span><button onClick={()=>setCheckoutSuccess(false)} aria-label="Hinweis schließen">×</button></div></div>}
        {renderView()}
      </main>

      {languageOpen&&<div className="modal-backdrop" onMouseDown={()=>setLanguageOpen(false)}><section className="language-modal" onMouseDown={event=>event.stopPropagation()}><div className="modal-head"><div><span className="eyebrow">SPRACHEN</span><h2>Was möchtest du lernen?</h2><p>Die Engine ist für zehn Zielsprachen vorbereitet. Deutsch → Englisch besitzt jetzt einen spielbaren A1–C2-Kursrücken und wird als erstes vollständig auf Produktionsqualität gebracht.</p></div><button onClick={()=>setLanguageOpen(false)}>×</button></div><div className="language-grid">{languages.map(language=><button key={language.code} disabled={!language.available} className={languageCode===language.code?'selected':''} onClick={()=>{setLanguageCode(language.code);setLanguageOpen(false)}}><span className="language-tile-symbol">{language.symbol}</span><div><strong>{language.name}</strong><small>{language.nativeName}</small></div><em>{language.available?'Verfügbar':'In Vorbereitung'}</em></button>)}</div></section></div>}
      {lessonOpen&&<LessonPlayer lesson={selectedLesson} audioRate={preferences.audioRate} onClose={()=>setLessonOpen(false)} onComplete={handleComplete}/>} 
      {onboardingOpen&&<Onboarding initial={preferences} onDone={finishOnboarding}/>} 
      {placementOpen&&<PlacementTest onClose={()=>setPlacementOpen(false)} onFinish={finishPlacement}/>} 
      {proOpen&&<ProModal onClose={()=>setProOpen(false)}/>} 
    </div>
  );
}

export default App;
