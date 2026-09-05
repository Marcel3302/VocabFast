import { useRef, useState } from 'react';
import { loginAccount, registerAccount, type AccountUser } from '../learning/account';
import './welcome-gate.css';

type Props={
  onAuthenticated:(user:AccountUser,isNew:boolean)=>void|Promise<void>;
  notice?:string;
};

type Mode='login'|'register';

export default function WelcomeGate({onAuthenticated,notice}:Props) {
  const [mode,setMode]=useState<Mode>('login');
  const [name,setName]=useState('');
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [error,setError]=useState('');
  const [busy,setBusy]=useState(false);
  const authRef=useRef<HTMLElement|null>(null);
  const nameRef=useRef<HTMLInputElement|null>(null);
  const emailRef=useRef<HTMLInputElement|null>(null);

  function focusAuth(nextMode:Mode) {
    setMode(nextMode);
    setError('');
    requestAnimationFrame(()=>{
      authRef.current?.scrollIntoView({behavior:'smooth',block:'center'});
      window.setTimeout(()=>{
        if(nextMode==='register')nameRef.current?.focus();
        else emailRef.current?.focus();
      },260);
    });
  }

  async function submit(event:React.FormEvent) {
    event.preventDefault();
    if(busy)return;
    setBusy(true);setError('');
    try{
      const result=mode==='register'
        ? await registerAccount({name,email,password})
        : await loginAccount({email,password});
      setPassword('');
      await onAuthenticated(result.user,result.isNew);
    }catch(reason){setError(reason instanceof Error?reason.message:'Die Anmeldung ist fehlgeschlagen.');}
    finally{setBusy(false);}
  }

  return <div className="welcome-shell">
    <header className="welcome-topbar">
      <a className="welcome-brand" href="/" aria-label="VocabFast Startseite"><span>V</span><div><strong>VocabFast</strong><small>Language Platform</small></div></a>
      <span className="welcome-preview-label">A1–C2 · Preview</span>
    </header>

    <main className="welcome-main">
      <section className="welcome-story">
        <span className="welcome-kicker">DEIN PERSÖNLICHES SPRACHTRAINING</span>
        <h1>Englisch lernen, das im echten Leben funktioniert.</h1>
        <p>VocabFast verbindet einen strukturierten A1–C2-Lernpfad mit Grammatik, aktivem Sprechen, Hörtraining, Wiederholung und Fachsprache. Statt wahllos Aufgaben abzuarbeiten, startest du dort, wo dein aktuelles Niveau wirklich liegt.</p>

        <div className="welcome-hero-actions">
          <button className="welcome-hero-primary" onClick={()=>focusAuth('register')}>Kostenlos starten <span>→</span></button>
          <button className="welcome-hero-secondary" onClick={()=>focusAuth('login')}>Ich habe schon ein Konto</button>
        </div>
        <div className="welcome-trust-line"><span>✓ Keine Zahlungsdaten für Free</span><span>✓ Fortschritt im Konto gespeichert</span><span>✓ Einstufung vor dem Lernstart</span></div>

        <div className="welcome-points">
          <article><span>01</span><div><strong>Erst verstehen, wo du stehst.</strong><p>36 Fragen prüfen Grammatik, Wortschatz und kommunikative Präzision von A1 bis C2 und geben dir eine konkrete Startempfehlung.</p></div></article>
          <article><span>02</span><div><strong>Dann gezielt statt zufällig lernen.</strong><p>VocabFast merkt sich abgeschlossene Lektionen, XP, Streak, Mastery und schwierige Konzepte und baut daraus deinen nächsten sinnvollen Schritt.</p></div></article>
          <article><span>03</span><div><strong>Alltag und Fachsprache verbinden.</strong><p>Englisch, Grammatik und Aussprache bilden das Fundament. Pro erweitert später um Coach, Fachsprache und persönliche Analyse.</p></div></article>
        </div>

        <div className="welcome-level-rail" aria-label="CEFR Lernpfad"><span>A1</span><i/><span>A2</span><i/><span>B1</span><i/><span>B2</span><i/><span>C1</span><i/><span>C2</span></div>

        <div className="welcome-value-strip">
          <article><span>FREE</span><strong>Ein echter Einstieg, kein Demo-Kurs.</strong><p>A1–C2-Lernpfad, Grammatik, Wortschatz, Hören und Fortschritt als Basis.</p><em>0 €</em></article>
          <article className="pro"><span>PRO</span><strong>Für Nutzer, die schneller und gezielter vorankommen wollen.</strong><p>KI-Coach, Sprechen, Fachsprache, Dokumentlernen und tiefere adaptive Analyse.</p><em>19,99 € / Monat</em></article>
        </div>
      </section>

      <section className="welcome-auth-card" ref={authRef}>
        <div className="welcome-auth-head"><span className="welcome-auth-mark">V</span><div><small>VOCABFAST KONTO</small><h2>{mode==='login'?'Willkommen zurück.':'Dein Lernkonto erstellen.'}</h2></div></div>
        <div className="welcome-auth-tabs"><button className={mode==='login'?'active':''} onClick={()=>{setMode('login');setError('');}}>Anmelden</button><button className={mode==='register'?'active':''} onClick={()=>{setMode('register');setError('');}}>Registrieren</button></div>
        {notice&&<div className="welcome-notice">{notice}</div>}
        {mode==='register'&&<div className="welcome-register-promise"><strong>Dein Start:</strong><span>Konto → kurze Einrichtung → 36-Fragen-Einstufung → persönliche Empfehlung.</span></div>}
        <form onSubmit={submit}>
          {mode==='register'&&<label><span>Name</span><input ref={nameRef} autoComplete="name" value={name} onChange={event=>setName(event.target.value)} placeholder="Wie sollen wir dich nennen?" required minLength={2}/></label>}
          <label><span>E-Mail</span><input ref={emailRef} type="email" autoComplete="email" value={email} onChange={event=>setEmail(event.target.value)} placeholder="name@beispiel.at" required/></label>
          <label><span>Passwort</span><input type="password" autoComplete={mode==='register'?'new-password':'current-password'} value={password} onChange={event=>setPassword(event.target.value)} placeholder={mode==='register'?'Mindestens 12 Zeichen':'Dein Passwort'} required minLength={mode==='register'?12:1}/></label>
          {error&&<div className="welcome-error">{error}</div>}
          <button className="welcome-submit" disabled={busy||!email||!password||(mode==='register'&&!name.trim())}>{busy?'Bitte warten …':mode==='login'?'Jetzt anmelden →':'Kostenloses Konto erstellen →'}</button>
        </form>
        <div className="welcome-card-note">{mode==='register'?'Für die kostenlose Registrierung ist keine Kreditkarte erforderlich.':'Dein Lernstand wird nach der Anmeldung wieder aus deinem Preview-Konto geladen.'}</div>
        <div className="welcome-security"><span>●</span><p><strong>Isolierte Testumgebung.</strong> Dieses Preview-Konto ist von deinen bestehenden produktiven VocabFast-Konten getrennt. Passwörter werden nicht im Klartext gespeichert.</p></div>
      </section>
    </main>
  </div>;
}
