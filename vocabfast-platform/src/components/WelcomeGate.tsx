import { useRef, useState } from 'react';
import { loginAccount, registerAccount, type AccountUser } from '../learning/account';
import './welcome-gate.css';
import './welcome-auth-polish.css';

type Props={onAuthenticated:(user:AccountUser,isNew:boolean)=>void|Promise<void>;notice?:string};
type Mode='login'|'register';
const legalBase='https://vocabfast.net';

export default function WelcomeGate({onAuthenticated,notice}:Props){
  const [mode,setMode]=useState<Mode>('login'),[name,setName]=useState(''),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[confirmPassword,setConfirmPassword]=useState(''),[showPassword,setShowPassword]=useState(false),[error,setError]=useState(''),[busy,setBusy]=useState(false);
  const authRef=useRef<HTMLElement|null>(null),nameRef=useRef<HTMLInputElement|null>(null),emailRef=useRef<HTMLInputElement|null>(null);
  function selectMode(nextMode:Mode){setMode(nextMode);setError('');setConfirmPassword('');}
  function focusAuth(nextMode:Mode){selectMode(nextMode);requestAnimationFrame(()=>{authRef.current?.scrollIntoView({behavior:'smooth',block:'center'});window.setTimeout(()=>nextMode==='register'?nameRef.current?.focus():emailRef.current?.focus(),260);});}
  async function submit(event:React.FormEvent){
    event.preventDefault();if(busy)return;setError('');
    if(mode==='register'&&password.length<12){setError('Dein Passwort muss mindestens 12 Zeichen lang sein.');return;}
    if(mode==='register'&&password!==confirmPassword){setError('Die beiden Passwörter stimmen nicht überein.');return;}
    setBusy(true);
    try{const result=mode==='register'?await registerAccount({name,email,password}):await loginAccount({email,password});setPassword('');setConfirmPassword('');await onAuthenticated(result.user,result.isNew);}catch(reason){setError(reason instanceof Error?reason.message:'Die Anmeldung ist fehlgeschlagen.');}finally{setBusy(false);}
  }
  const passwordsMatch=Boolean(confirmPassword)&&password===confirmPassword;
  return <div className="welcome-shell">
    <header className="welcome-topbar">
      <a className="welcome-brand" href="/" aria-label="VocabFast Startseite"><span>V</span><div><strong>VocabFast</strong><small>Language Learning</small></div></a>
      <span className="welcome-preview-label">Mehrsprachig · Persönlich · Synchronisiert</span>
    </header>

    <main className="welcome-main">
      <section className="welcome-story">
        <span className="welcome-kicker">SPRACHEN LERNEN. SICHER ANWENDEN.</span>
        <h1>Lerne Sprachen so, dass du sie wirklich benutzen kannst.</h1>
        <p>VocabFast verbindet klare Lernpfade mit aktivem Sprechen, Hörtraining, intelligenten Wiederholungen und einem integrierten Übersetzer. Du lernst in kurzen, fokussierten Einheiten – und behältst deinen Fortschritt auch dann, wenn du zwischen mehreren Sprachen wechselst.</p>

        <div className="welcome-hero-actions">
          <button className="welcome-hero-primary" onClick={()=>focusAuth('register')}>Kostenlos loslegen <span>→</span></button>
          <button className="welcome-hero-secondary" onClick={()=>focusAuth('login')}>Bereits registriert</button>
        </div>
        <div className="welcome-trust-line"><span>✓ Kostenlos starten</span><span>✓ Kein Zahlungsmittel nötig</span><span>✓ Lernstand automatisch gespeichert</span></div>

        <div className="welcome-points">
          <article><span>01</span><div><strong>Dein Weg, dein Tempo.</strong><p>Wähle Ausgangs- und Lernsprache, lege dein Ziel fest und wechsle später jederzeit zwischen mehreren Lernpfaden.</p></div></article>
          <article><span>02</span><div><strong>Mehr als nur Wiedererkennen.</strong><p>Übersetzen, Satzbau, Hören, Diktat und Sprechen trainieren genau das, was du im echten Gespräch brauchst: aktives Abrufen.</p></div></article>
          <article><span>03</span><div><strong>Mehrere Sprachen. Ein Konto.</strong><p>Fortschritt, Level, XP und Wiederholungen bleiben für jede Sprachkombination getrennt erhalten.</p></div></article>
        </div>

        <div className="welcome-level-block">
          <div><span>STRUKTURIERTES LERNEN</span><strong>Schritt für Schritt statt planloser Einzelübungen.</strong></div>
          <div className="welcome-level-rail" aria-label="CEFR Lernpfad"><span>A1</span><i/><span>A2</span><i/><span>B1</span><i/><span>B2</span><i/><span>C1</span><i/><span>C2</span></div>
        </div>

        <div className="welcome-value-strip">
          <article><span>FREE</span><strong>Ein starker Einstieg für regelmäßiges Lernen.</strong><p>Lernpfade, Übersetzer, Hör- und Sprechübungen, Wiederholung und Fortschritt.</p><em>0 €</em></article>
          <article className="pro"><span>PRO</span><strong>Mehr Tiefe für ambitioniertes Lernen.</strong><p>KI-Coach, Fachsprache und zusätzliche Analyse- und Trainingsfunktionen.</p><em>19,99 € / Monat</em></article>
        </div>
      </section>

      <aside className="welcome-side">
        <section className="welcome-auth-card" ref={authRef}>
          <div className="welcome-auth-head"><span className="welcome-auth-mark">V</span><div><small>DEIN VOCABFAST KONTO</small><h2>{mode==='login'?'Schön, dass du wieder da bist.':'In wenigen Schritten startklar.'}</h2></div></div>
          <div className="welcome-auth-tabs"><button className={mode==='login'?'active':''} onClick={()=>selectMode('login')}>Anmelden</button><button className={mode==='register'?'active':''} onClick={()=>selectMode('register')}>Registrieren</button></div>
          {notice&&<div className="welcome-notice">{notice}</div>}
          {mode==='register'&&<div className="welcome-register-promise"><strong>Nach der Registrierung:</strong><span>Sprachen wählen → Lernziel festlegen → passenden Einstieg finden → direkt loslegen.</span></div>}
          <form onSubmit={submit}>
            {mode==='register'&&<label><span>Name</span><input ref={nameRef} autoComplete="name" value={name} onChange={event=>setName(event.target.value)} placeholder="Wie dürfen wir dich nennen?" required minLength={2}/></label>}
            <label><span>E-Mail</span><input ref={emailRef} type="email" autoComplete="email" value={email} onChange={event=>setEmail(event.target.value)} placeholder="name@beispiel.at" required/></label>
            <div className="welcome-field"><label htmlFor="vf-password">Passwort</label><div className="welcome-password-row"><input id="vf-password" type={showPassword?'text':'password'} autoComplete={mode==='register'?'new-password':'current-password'} value={password} onChange={event=>setPassword(event.target.value)} placeholder={mode==='register'?'Mindestens 12 Zeichen':'Dein Passwort'} required minLength={mode==='register'?12:1}/><button type="button" className="welcome-password-toggle" onClick={()=>setShowPassword(value=>!value)}>{showPassword?'Verbergen':'Anzeigen'}</button></div></div>
            {mode==='register'&&<><div className="welcome-field"><label htmlFor="vf-password-confirm">Passwort wiederholen</label><div className="welcome-password-row"><input id="vf-password-confirm" type={showPassword?'text':'password'} autoComplete="new-password" value={confirmPassword} onChange={event=>setConfirmPassword(event.target.value)} placeholder="Passwort erneut eingeben" required minLength={12}/></div></div><div className="welcome-password-hint"><span>Mindestens 12 Zeichen.</span>{confirmPassword&&<strong className={passwordsMatch?'match':'mismatch'}>{passwordsMatch?'✓ Passwörter stimmen überein':'Passwörter stimmen noch nicht überein'}</strong>}</div></>}
            {error&&<div className="welcome-error">{error}</div>}
            <button className="welcome-submit" disabled={busy||!email||!password||(mode==='register'&&(!name.trim()||password.length<12||password!==confirmPassword))}>{busy?'Bitte warten …':mode==='login'?'Anmelden →':'Kostenloses Konto erstellen →'}</button>
          </form>
          <div className="welcome-card-note">{mode==='register'?<>Mit der Registrierung akzeptierst du unsere <a href={`${legalBase}/nutzungsbedingungen.html`}>Nutzungsbedingungen</a> und bestätigst, die <a href={`${legalBase}/datenschutz.html`}>Datenschutzhinweise</a> gelesen zu haben.</>:<>Nach der Anmeldung wird dein gespeicherter Lernstand automatisch geladen.</>}</div>
          <div className="welcome-security"><span>✓</span><p><strong>Dein Lernstand bleibt bei dir.</strong> Konto und Fortschritt werden sicher gespeichert und geräteübergreifend synchronisiert.</p></div>
        </section>

        <section className="welcome-side-note" aria-label="VocabFast Vorteile">
          <span>WARUM VOCABFAST?</span>
          <strong>Ein ruhiger, klarer Lernbereich ohne unnötigen Ballast.</strong>
          <div><em>Mehrere Lernsprachen</em><em>Übersetzer integriert</em><em>Fortschritt getrennt gespeichert</em></div>
        </section>
      </aside>
    </main>

    <footer className="welcome-footer"><span>© {new Date().getFullYear()} VocabFast</span><nav aria-label="Rechtliche Informationen"><a href={`${legalBase}/impressum.html`}>Impressum</a><a href={`${legalBase}/datenschutz.html`}>Datenschutz</a><a href={`${legalBase}/nutzungsbedingungen.html`}>Nutzungsbedingungen</a><a href={`${legalBase}/widerruf.html`}>Widerruf</a></nav></footer>
  </div>;
}
