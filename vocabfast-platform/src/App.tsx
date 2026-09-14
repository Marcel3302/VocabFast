import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { languageByCode, languages, learnableLanguages } from './data/catalog';
import DashboardView from './components/DashboardView';
import CourseView from './components/CourseView';
import WelcomeGate from './components/WelcomeGate';
import { SpeakView, TravelView, MeView } from './components/CompanionViews';
import { firstLesson, levelLessons, type CefrLevel } from './learning/curriculum';
import { readCourseState, saveActiveLevel, savePlacement, type PlacementBreakdown } from './learning/course-state';
import { defaultPreferences, readPreferences, savePreferences, withActivePair, type LanguageCode, type LearnerPreferences } from './learning/preferences';
import { buildAdaptiveReviewLesson, buildModeLesson } from './learning/review';
import { readProgress, readProgressForPair, resetLocalProgress, saveLessonResult } from './learning/progress';
import { bootstrapAccount, clearPlatformStorage, currentAccount, flushAccountSync, logoutAccount, queueAccountSync, type AccountUser } from './learning/account';
import type { Lesson, LessonResult } from './learning/types';
import { recordStudySeconds } from './learning/study-time';
import './course.css';
import './enhancements.css';
import './layout-polish.css';
import './mobile-release.css';
import './language-hub.css';

const LessonPlayer=lazy(()=>import('./components/LessonPlayer'));
const PlacementTest=lazy(()=>import('./components/PlacementTest'));
const Onboarding=lazy(()=>import('./components/Onboarding'));
const ProModal=lazy(()=>import('./components/ProModal'));
const ProfileView=lazy(()=>import('./components/ProfileView'));
const CoachView=lazy(()=>import('./components/CoachView'));
const GrammarView=lazy(()=>import('./components/GrammarView'));
const TranslatorView=lazy(()=>import('./components/TranslatorView'));
const PracticeView=lazy(()=>import('./components/PlatformViews').then(module=>({default:module.PracticeView})));
const ProgressView=lazy(()=>import('./components/PlatformViews').then(module=>({default:module.ProgressView})));
const SpecialtyView=lazy(()=>import('./components/PlatformViews').then(module=>({default:module.SpecialtyView})));
const WordsView=lazy(()=>import('./components/PlatformViews').then(module=>({default:module.WordsView})));

type NavId='home'|'speak'|'travel'|'me'|'course'|'grammar'|'practice'|'coach'|'translate'|'words'|'specialty'|'progress'|'profile';
type AccountPhase='loading'|'guest'|'ready';
type OnboardingStart={mode:'placement'}|{mode:'manual';level:CefrLevel};

function initials(name:string){return name.trim().split(/\s+/).slice(0,2).map(part=>part[0]).join('').toUpperCase()||'VF';}
function ViewLoading(){return <div className="deferred-view-loading" role="status"><i/><span>Inhalt wird geladen …</span></div>;}
function ModalLoading(){return <div className="deferred-modal-loading" role="status"><div><i/><strong>VocabFast lädt …</strong></div></div>;}

export default function App(){
  const booted=useRef(false);
  const learningSeconds=useRef(0);
  const [syncError,setSyncError]=useState(false);
  useEffect(()=>{const update=(event:Event)=>setSyncError((event as CustomEvent).detail==='error');window.addEventListener('vocabfast-sync',update);return()=>window.removeEventListener('vocabfast-sync',update);},[]);

  const [accountPhase,setAccountPhase]=useState<AccountPhase>('loading');
  const [accountUser,setAccountUser]=useState<AccountUser|null>(null);
  const [authNotice,setAuthNotice]=useState('');
  const [activeNav,setActiveNav]=useState<NavId>('home');
  const [mobileMoreOpen,setMobileMoreOpen]=useState(false);
  const [languageOpen,setLanguageOpen]=useState(false);
  const [lessonOpen,setLessonOpen]=useState(false);
  const [selectedLesson,setSelectedLesson]=useState<Lesson>(()=>firstLesson('en'));
  const [progress,setProgress]=useState(()=>readProgress());
  const [preferences,setPreferences]=useState(()=>readPreferences());
  const [courseState,setCourseState]=useState(()=>readCourseState());
  const [newPairSource,setNewPairSource]=useState<LanguageCode>(preferences.sourceLanguage);
  const [newPairTarget,setNewPairTarget]=useState<LanguageCode>(preferences.targetLanguage==='en'?'hr':'en');
  const [onboardingOpen,setOnboardingOpen]=useState(false);
  const [placementOpen,setPlacementOpen]=useState(false);
  const [proOpen,setProOpen]=useState(false);
  const [lastResult,setLastResult]=useState<LessonResult|null>(null);

  const targetLanguage=preferences.targetLanguage;
  const sourceLanguage=preferences.sourceLanguage;
  const targetMeta=languageByCode(targetLanguage);
  const sourceMeta=languageByCode(sourceLanguage);
  const englishMode=targetLanguage==='en';
  const isPro=accountUser?.plan==='pro';
  const activeLessons=levelLessons(courseState.activeLevel,targetLanguage);
  const curriculumCompleted=activeLessons.filter(lesson=>progress.completedLessonIds.includes(lesson.id)).length;
  const courseRange=targetMeta.levels.length>1?`${targetMeta.levels[0]}–${targetMeta.levels[targetMeta.levels.length-1]}`:targetMeta.levels[0]||'Kurs';
  const pendingPairId=`${newPairSource}-${newPairTarget}`;
  const pendingPairExists=preferences.learningPairs.some(pair=>pair.id===pendingPairId);
  const navItems=useMemo(()=>englishMode?[['home','Learn'],['speak','Speak'],['travel','Travel'],['translate','Translate'],['me','Me']] as const:[['home','Learn'],['travel','Travel'],['translate','Translate'],['me','Me']] as const,[englishMode]);
  const icons:Record<string,string>={home:'L',speak:'◉',travel:'✦',translate:'⇄',me:'●'};

  useEffect(()=>{if(!lessonOpen)return;let last=Date.now();const timer=window.setInterval(()=>{const now=Date.now();if(document.visibilityState==='visible')learningSeconds.current+=Math.min((now-last)/1000,2);last=now;},1000);return()=>clearInterval(timer);},[lessonOpen]);
  useEffect(()=>{if(booted.current)return;booted.current=true;void hydrateAccount();},[]);
  useEffect(()=>{
    if(accountPhase!=='ready')return;
    let active=true;
    const refreshPlan=async()=>{try{const user=await currentAccount();if(active&&user)setAccountUser(current=>current&&current.id===user.id&&current.plan===user.plan&&current.name===user.name&&current.email===user.email?current:user);}catch{/* Bestehende Sitzung bleibt bei kurzen Netzwerkfehlern aktiv. */}};
    const onFocus=()=>void refreshPlan();
    const onVisibility=()=>{if(document.visibilityState==='visible')void refreshPlan();};
    window.addEventListener('focus',onFocus);document.addEventListener('visibilitychange',onVisibility);
    const timer=window.setInterval(()=>void refreshPlan(),30000);
    return()=>{active=false;window.removeEventListener('focus',onFocus);document.removeEventListener('visibilitychange',onVisibility);window.clearInterval(timer);};
  },[accountPhase]);

  async function hydrateAccount(){
    setAccountPhase('loading');setAuthNotice('');
    try{
      const result=await bootstrapAccount();
      if(!result.user){setAccountUser(null);setAccountPhase('guest');return;}
      if(!result.hasRemoteState)savePreferences({...defaultPreferences,name:result.user.name,onboarded:false});
      const nextPreferences=readPreferences(),nextProgress=readProgress(),nextCourse=readCourseState();
      setAccountUser(result.user);setPreferences(nextPreferences);setProgress(nextProgress);setCourseState(nextCourse);
      setSelectedLesson(firstLesson(nextPreferences.targetLanguage));setLastResult(null);
      setOnboardingOpen(!nextPreferences.onboarded);
      setPlacementOpen(false);
      setAccountPhase('ready');
    }catch(reason){setAccountUser(null);setAuthNotice(reason instanceof Error?reason.message:'Dein Konto konnte gerade nicht geladen werden.');setAccountPhase('guest');}
  }

  async function handleAuthenticated(){await hydrateAccount();}
  function navigateTo(id:NavId){setActiveNav(id);setMobileMoreOpen(false);window.scrollTo({top:0,behavior:'smooth'});}
  function openNavigation(id:NavId){if(englishMode&&!isPro&&(id==='coach'||id==='specialty')){setMobileMoreOpen(false);setProOpen(true);return;}navigateTo(id);}
  function openLesson(lesson:Lesson){learningSeconds.current=0;setSelectedLesson(lesson);setLessonOpen(true);}
  function handleComplete(result:LessonResult){recordStudySeconds(learningSeconds.current);learningSeconds.current=0;setLastResult(result);setProgress(saveLessonResult(result));queueAccountSync();}
  function saveLearnerPreferences(next:LearnerPreferences){const saved=savePreferences(next);setPreferences(saved);queueAccountSync();}

  async function switchLearningPair(next:LearnerPreferences){
    await flushAccountSync();
    const saved=savePreferences(next);setPreferences(saved);
    const nextProgress=readProgress(),nextCourse=readCourseState();
    setProgress(nextProgress);setCourseState(nextCourse);setSelectedLesson(firstLesson(saved.targetLanguage));setLastResult(null);setLessonOpen(false);setPlacementOpen(false);setActiveNav('home');queueAccountSync(100);
  }

  function openLanguageSwitcher(){
    setNewPairSource(preferences.sourceLanguage);
    const nextTarget=learnableLanguages.find(item=>item.code!==preferences.sourceLanguage&&item.code!==preferences.targetLanguage)??learnableLanguages.find(item=>item.code!==preferences.sourceLanguage);
    setNewPairTarget((nextTarget?.code??'en') as LanguageCode);
    setLanguageOpen(true);
  }
  function chooseNewPairSource(code:LanguageCode){setNewPairSource(code);if(code===newPairTarget){const fallback=learnableLanguages.find(item=>item.code!==code);if(fallback)setNewPairTarget(fallback.code as LanguageCode);}}
  async function addLearningPair(){if(newPairSource===newPairTarget)return;const next=withActivePair(preferences,newPairSource,newPairTarget);setLanguageOpen(false);await switchLearningPair(next);}
  function selectLevel(level:CefrLevel){setCourseState(saveActiveLevel(level));queueAccountSync();}
  function finishPlacement(level:CefrLevel,score:number,total:number,details:{breakdown:PlacementBreakdown;focus:string[]}){setCourseState(savePlacement(score,total,level,details.breakdown,details.focus));setPlacementOpen(false);setActiveNav('home');queueAccountSync(100);}
  function finishOnboarding(next:LearnerPreferences,start:OnboardingStart){const saved=savePreferences(next);setPreferences(saved);const level=start.mode==='manual'?start.level:'A1';setCourseState(saveActiveLevel(level));setProgress(readProgress());setOnboardingOpen(false);setActiveNav('home');setPlacementOpen(saved.targetLanguage==='en'&&start.mode==='placement');queueAccountSync(100);}
  function resetProgress(){resetLocalProgress();setProgress(readProgress());setCourseState(readCourseState());setLastResult(null);setActiveNav('home');queueAccountSync(100);}
  function returnToGuest(notice:string){clearPlatformStorage();setAccountUser(null);setPreferences(readPreferences());setProgress(readProgress());setCourseState(readCourseState());setOnboardingOpen(false);setPlacementOpen(false);setLessonOpen(false);setProOpen(false);setMobileMoreOpen(false);setActiveNav('home');setAuthNotice(notice);setAccountPhase('guest');}
  async function signOut(){await flushAccountSync();await logoutAccount().catch(()=>{});returnToGuest('Du wurdest abgemeldet.');}
  function handleAccountDeleted(){returnToGuest('Dein Konto und deine gespeicherten Lernfortschritte wurden gelöscht.');}

  function renderView(){
    const buildReview=()=>buildAdaptiveReviewLesson(courseState.activeLevel,targetLanguage);
    const buildMode=(types:Parameters<typeof buildModeLesson>[0],title:string,subtitle:string)=>buildModeLesson(types,title,subtitle,courseState.activeLevel,targetLanguage);
    if(activeNav==='speak'&&englishMode)return <SpeakView level={courseState.activeLevel} isPro={isPro} onOpenCoach={()=>openNavigation('coach')} onOpenPractice={()=>navigateTo('practice')} onOpenWords={()=>navigateTo('words')} onOpenPro={()=>setProOpen(true)}/>;
    if(activeNav==='travel')return <TravelView languageName={targetMeta.name} languageSymbol={targetMeta.symbol} level={courseState.activeLevel} completedLessons={curriculumCompleted} totalLessons={activeLessons.length} totalXp={progress.totalXp} streak={progress.currentStreak} onOpenTranslator={()=>navigateTo('translate')} onOpenPractice={()=>navigateTo('practice')}/>;
    if(activeNav==='me')return <MeView name={preferences.name} languageName={targetMeta.name} level={courseState.activeLevel} totalXp={progress.totalXp} streak={progress.currentStreak} completedLessons={curriculumCompleted} totalLessons={activeLessons.length} onOpenProgress={()=>navigateTo('progress')} onOpenProfile={()=>navigateTo('profile')} onOpenWords={()=>englishMode?navigateTo('words'):navigateTo('course')} onOpenPractice={()=>navigateTo('practice')}/>;
    if(activeNav==='course')return <CourseView progress={progress} courseState={courseState} targetLanguage={targetLanguage} onSelectLevel={selectLevel} openLesson={openLesson} openPlacement={()=>setPlacementOpen(true)}/>;
    if(activeNav==='translate')return <TranslatorView sourceLanguage={sourceLanguage} targetLanguage={targetLanguage} onOpenWords={()=>englishMode?navigateTo('words'):navigateTo('course')} onOpenSpeak={englishMode?()=>navigateTo('speak'):undefined}/>;
    if(activeNav==='practice')return <PracticeView openLesson={openLesson} buildReview={buildReview} buildMode={buildMode} languageLabel={targetMeta.name}/>;
    if(activeNav==='progress')return <ProgressView progress={progress} targetLanguage={targetLanguage}/>;
    if(activeNav==='profile')return <ProfileView preferences={preferences} progress={progress} isPro={isPro} onSave={saveLearnerPreferences} onSwitchPair={next=>void switchLearningPair(next)} onResetProgress={resetProgress} onAccountDeleted={handleAccountDeleted}/>;
    if(englishMode&&activeNav==='grammar')return <GrammarView activeLevel={courseState.activeLevel} openLesson={openLesson} onSelectLevel={selectLevel}/>;
    if(englishMode&&activeNav==='coach')return <CoachView audioRate={preferences.audioRate} level={courseState.activeLevel}/>;
    if(englishMode&&activeNav==='words')return <WordsView isPro={isPro} openPro={()=>setProOpen(true)}/>;
    if(englishMode&&activeNav==='specialty')return <SpecialtyView/>;
    return <DashboardView progress={progress} preferences={preferences} activeLevel={courseState.activeLevel} placement={courseState.placement} lastResult={lastResult} targetLanguage={targetLanguage} isPro={isPro} openLesson={openLesson} buildReview={buildReview} openPro={()=>setProOpen(true)} openCourse={()=>setActiveNav('course')} openPlacement={()=>setPlacementOpen(true)} openTranslator={()=>setActiveNav('translate')} onSelectLevel={selectLevel}/>;
  }

  if(accountPhase==='loading')return <div className="platform-loading"><div><i/><strong>Dein VocabFast-Konto wird geladen …</strong></div></div>;
  if(accountPhase==='guest')return <WelcomeGate onAuthenticated={handleAuthenticated} notice={authNotice}/>;
  const learnActive=['home','course','grammar','practice','words','specialty'].includes(activeNav);
  const speakActive=['speak','coach'].includes(activeNav);
  const meActive=['me','progress','profile'].includes(activeNav);

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand-row"><div className="brand-mark">V</div><div><strong>VocabFast</strong><span>Language Companion</span></div></div>
      <button className="language-switch" onClick={openLanguageSwitcher} aria-label="Lernsprache und Lernpfad wechseln"><span className="language-badge">{targetMeta.symbol}</span><span className="language-switch-copy"><small>{sourceMeta.symbol} → {targetMeta.symbol} · {courseState.activeLevel}</small><strong>{targetMeta.name}</strong></span><span className="chevron">⌄</span></button>
      <nav className="main-nav" aria-label="Hauptnavigation">{navItems.map(([id,label])=><button key={id} className={(id==='home'?learnActive:id==='speak'?speakActive:id==='me'?meActive:activeNav===id)?'active':''} onClick={()=>openNavigation(id as NavId)}><span className="nav-icon">{icons[id]}</span><span>{label}</span></button>)}</nav>
      <div className="sidebar-spacer"/>
      {englishMode&&!isPro&&<div className="pro-mini-card"><button type="button" className="pro-pill pro-link" onClick={()=>setProOpen(true)}>PRO</button><strong>Real Life freischalten.</strong><p>KI-Gespräche, intensives Sprechtraining, Fachsprache und mehr.</p><button onClick={()=>setProOpen(true)}>Pro entdecken</button></div>}
      <button className={`profile-link ${meActive?'active':''}`} onClick={()=>setActiveNav('me')}><span>{initials(preferences.name)}</span><div><strong>{preferences.name}</strong><small>{progress.currentStreak} Tage Streak · {progress.totalXp} XP</small></div></button>
      <div className="account-session-row"><span><strong>{accountUser?.email}</strong><small>{syncError?'Speichern fehlgeschlagen':'Konto verbunden'}</small></span><button onClick={()=>void signOut()}>Abmelden</button></div>
    </aside>

    <main className="content">
      <header className="topbar"><div className="mobile-brand"><div className="brand-mark">V</div><div><strong>VocabFast</strong><small>{targetMeta.name} · {courseState.activeLevel}</small></div></div><div className="topbar-stats"><div><span>◆</span><strong>{progress.totalXp}</strong><small>XP</small></div><div><span>🔥</span><strong>{progress.currentStreak}</strong><small>Streak</small></div><div><span>◉</span><strong>{curriculumCompleted}/{activeLessons.length}</strong><small>Lektionen</small></div></div></header>
      {syncError&&<div className="sync-warning" role="alert">Dein letzter Lernstand konnte nicht synchronisiert werden.<button onClick={()=>queueAccountSync(0)}>Erneut speichern</button></div>}
      <Suspense fallback={<ViewLoading/>}>{renderView()}</Suspense>
    </main>

    <nav className="mobile-bottom-nav companion-mobile-nav" aria-label="Mobile Hauptnavigation">
      <button className={learnActive?'active':''} onClick={()=>navigateTo('home')}><span>L</span><small>Learn</small></button>
      {englishMode&&<button className={speakActive?'active':''} onClick={()=>navigateTo('speak')}><span>◉</span><small>Speak</small></button>}
      <button className={activeNav==='travel'?'active':''} onClick={()=>navigateTo('travel')}><span>✦</span><small>Travel</small></button>
      <button className={activeNav==='translate'?'active':''} onClick={()=>navigateTo('translate')}><span>⇄</span><small>Translate</small></button>
      <button className={meActive?'active':''} onClick={()=>navigateTo('me')}><span>●</span><small>Me</small></button>
    </nav>

    {languageOpen&&<div className="modal-backdrop" onMouseDown={()=>setLanguageOpen(false)}><section className="language-modal language-hub" onMouseDown={event=>event.stopPropagation()}><div className="modal-head"><div><span className="eyebrow">SPRACHEN & LERNPFADE</span><h2>Was möchtest du jetzt lernen?</h2><p>Wechsle zwischen deinen Lernsprachen oder füge direkt einen neuen Lernpfad hinzu. Fortschritt und Level bleiben für jede Sprachkombination getrennt gespeichert.</p></div><button onClick={()=>setLanguageOpen(false)} aria-label="Sprachauswahl schließen">×</button></div><div className="language-hub-body"><div className="language-current-summary"><span className="language-current-symbol">{targetMeta.symbol}</span><div className="language-current-copy"><span>Aktueller Lernpfad</span><strong>{targetMeta.name}</strong><small>{sourceMeta.name} → {targetMeta.name} · {courseRange}</small></div><div className="language-current-stat"><strong>{courseState.activeLevel}</strong><small>Level</small></div><div className="language-current-stat"><strong>{progress.totalXp}</strong><small>XP</small></div><div className="language-current-stat"><strong>{progress.currentStreak}</strong><small>Streak</small></div></div><div className="language-hub-section-head"><div><span>DEINE LERNPFADE</span><strong>Schnell wechseln, ohne Fortschritt zu verlieren</strong></div><small>{preferences.learningPairs.length} {preferences.learningPairs.length===1?'Lernpfad':'Lernpfade'}</small></div><div className="language-grid">{preferences.learningPairs.map(pair=>{const source=languageByCode(pair.sourceLanguage),target=languageByCode(pair.targetLanguage),active=pair.sourceLanguage===sourceLanguage&&pair.targetLanguage===targetLanguage,pairProgress=readProgressForPair(pair.sourceLanguage,pair.targetLanguage),range=target.levels.length>1?`${target.levels[0]}–${target.levels[target.levels.length-1]}`:target.levels[0]||'Kurs';return <button key={pair.id} className={active?'selected':''} disabled={active} onClick={()=>{setLanguageOpen(false);void switchLearningPair({...preferences,sourceLanguage:pair.sourceLanguage,targetLanguage:pair.targetLanguage})}}><span className="language-tile-symbol">{target.symbol}</span><div className="language-pair-copy"><span>{range} Lernpfad</span><strong>{target.name}</strong><small>Unterstützung auf {source.name}</small><div className="language-pair-metrics"><i>{pairProgress.totalXp} XP</i><i>{pairProgress.completedLessonIds.length} Lektionen</i><i>{pairProgress.currentStreak} Tage</i></div></div><em>{active?'Aktiv':'Öffnen'}</em></button>})}</div><div className="language-add-panel"><div className="language-add-title"><div><strong>Neuen Lernpfad hinzufügen</strong><small>Du kannst mehrere Sprachen parallel lernen und jederzeit wechseln.</small></div><span>FORTSCHRITT BLEIBT ERHALTEN</span></div><div className="language-add-grid"><label><span>Unterstützungssprache</span><select value={newPairSource} onChange={event=>chooseNewPairSource(event.target.value as LanguageCode)}>{languages.map(language=><option key={language.code} value={language.code}>{language.name} · {language.nativeName}</option>)}</select></label><div className="language-add-arrow">→</div><label><span>Lernsprache</span><select value={newPairTarget} onChange={event=>setNewPairTarget(event.target.value as LanguageCode)}>{learnableLanguages.filter(language=>language.code!==newPairSource).map(language=><option key={language.code} value={language.code}>{language.name} · {language.levels[0]}–{language.levels[language.levels.length-1]}</option>)}</select></label><button className="language-add-button" onClick={()=>void addLearningPair()}>{pendingPairExists?'Lernpfad öffnen':'Hinzufügen & öffnen'}</button></div></div><div className="language-hub-footer"><button className="language-hub-translator" onClick={()=>{setLanguageOpen(false);setActiveNav('translate')}}>⇄ Übersetzer für alle {languages.length} Sprachen öffnen</button><button className="language-hub-profile" onClick={()=>{setLanguageOpen(false);setActiveNav('me')}}>Mein VocabFast öffnen</button></div></div></section></div>}

    <Suspense fallback={(lessonOpen||onboardingOpen||placementOpen||proOpen)?<ModalLoading/>:null}>
      {lessonOpen&&<LessonPlayer lesson={selectedLesson} audioRate={preferences.audioRate} targetLanguage={targetLanguage} sourceLanguage={sourceLanguage} targetLabel={targetMeta.name} sourceLabel={sourceMeta.name} onClose={()=>setLessonOpen(false)} onComplete={handleComplete}/>} 
      {onboardingOpen&&<Onboarding initial={preferences} onDone={finishOnboarding}/>} 
      {placementOpen&&englishMode&&<PlacementTest onClose={()=>setPlacementOpen(false)} onFinish={finishPlacement}/>} 
      {proOpen&&englishMode&&!isPro&&<ProModal user={accountUser} onClose={()=>setProOpen(false)}/>} 
    </Suspense>
  </div>;
}