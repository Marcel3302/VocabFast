import { useMemo, useRef, useState } from 'react';
import { loginAccount, registerAccount, type AccountUser } from '../learning/account';
import { learnableLanguages, translationLanguages } from '../data/catalog';
import './welcome-gate.css';
import './welcome-auth-polish.css';

type Props={onAuthenticated:(user:AccountUser,isNew:boolean)=>void|Promise<void>;notice?:string};
type Mode='login'|'register';
const legalBase='https://vocabfast.net';

export default function WelcomeGate({onAuthenticated,notice}:Props){
  const [mode,setMode]=useState<Mode>('login'),[name,setName]=useState(''),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[confirmPassword,setConfirmPassword]=useState(''),[showPassword,setShowPassword]=useState(false),[error,setError]=useState(''),[busy,setBusy]=useState(false);
  const authRef=useRef<HTMLElement|null>(null),nameRef=useRef<HTMLInputElement|null>(null),emailRef=useRef<HTMLInputElement|null>(null);
  const passwordStrength=useMemo(()=>{
    if(!password)return 0;
    return [password.length>=12,password.length>=16,/[a-z]/.test(password)&&/[A-Z]/.test(password),/\d/.test(password),/[^A-Za-z0-9]/.test(password)].filter(Boolean).length;
  },[password]);
  function selectMode(nextMode:Mode){setMode(nextMode);setError('');setConfirmPassword('');}
  function focusAuth(nextMode:Mode){selectMode(nextMode);requestAnimationFrame(()=>{authRef.current?.scrollIntoView({behavior:'smooth',block:'center'});window.setTimeout(()=>nextMode==='register'?nameRef.current?.focus():emailRef.current?.focus(),260);});}
  async function submit(event:React.FormEvent){
    event.preventDefault();if(busy)return;setError('');
    if(mode==='register'&&password.length<12){setError('Dein Passwort muss mindestens 12 Zeichen lang sein.');return;}
    if(mode==='register'&&password!==confirmPassword){setError('Die beiden Passwörter stimmen nicht überein.');return;}
    setBusy(true);
    try{const result=mode==='register'?await registerAccount({name:name.trim(),email:email.trim(),password}):await loginAccount({email:email.trim(),password});setPassword('');setConfirmPassword('');await onAuthenticated(result.user,result.isNew);}catch(reason){setError(reason instanceof Error?reason.message:'Die Anmeldung ist fehlgeschlagen.');}finally{setBusy(false);}
  }
  const passwordsMatch=Boolean(confirmPassword)&&password===confirmPassword;
  const strengthLabel=passwordStrength>=5?'Sehr stark':passwordStrength>=4?'Stark':passwordStrength>=3?'Gut':passwordStrength>=2?'Ausreichend':'Schwach';
  return <div className="welcome-shell">
    <header className="welcome-topbar">
      <a className="welcome-brand" href="/" aria-label="VocabFast Startseite"><span>V</span><div><strong>VocabFast</strong><small>Language Companion</small></div></a>
      <div className="welcome-topbar-actions"><span className="welcome-preview-label">Learn · Speak · Travel · Translate</span><button onClick={()=>focusAuth('login')}>Anmelden</button></div>
    </header>

    <main className="welcome-main">
      <section className="welcome-story">
        <span className="welcome-kicker">LERNE FÜR DAS ECHTE LEBEN</span>
        <h1>Eine Sprache nicht nur lernen. <em>Sie wirklich benutzen.</em></h1>
        <p>VocabFast verbindet deinen Lernpfad mit Sprechen, Reisen, Übersetzen und persönlicher Wiederholung. Statt fünf einzelner Tools bekommst du einen Sprachbegleiter, der dich vom ersten Satz bis zur echten Situation begleitet.</p>

        <div className="welcome-hero-actions">
          <button className="welcome-hero-primary" onClick={()=>focusAuth('register')}>Kostenlos starten <span>→</span></button>
          <button className="welcome-hero-secondary" onClick={()=>focusAuth('login')}>Ich habe schon ein Konto</button>
        </div>
        <div className="welcome-trust-line"><span>✓ Kostenlos starten</span><span>✓ Kein Zahlungsmittel nötig</span><span>✓ Fortschritt synchronisiert</span><span>✓ Für Desktop & Mobil</span></div>

        <section className="welcome-product-preview" aria-label="Produktvorschau von VocabFast">
          <div className="preview-window-bar"><span/><span/><span/><strong>VOCABFAST · LANGUAGE COMPANION</strong></div>
          <div className="preview-app">
            <aside className="preview-sidebar" aria-hidden="true"><b>V</b><i className="active">L</i><i>◉</i><i>✦</i><i>⇄</i><i>●</i></aside>
            <div className="preview-content">
              <div className="preview-head"><div><small>DEIN HEUTIGER FOKUS</small><strong>Was bringt dich heute am weitesten?</strong></div><span>EN · A2</span></div>
              <div className="preview-grid">
                <article className="preview-next"><small>WEITERLERNEN</small><h3>Everyday conversations</h3><p>Hören · Satzbau · Sprechen · 8 Minuten</p><div className="preview-progress"><span/></div><button type="button" tabIndex={-1}>Einheit starten →</button></article>
                <article className="preview-score"><small>REISEBEREITSCHAFT</small><strong>68%</strong><span>für deine nächste Reise</span><div><b>◆ 240 XP</b><b>🔥 6 Tage</b></div></article>
              </div>
              <div className="preview-tools"><span><b>L</b> Learn</span><span><b>◉</b> Speak</span><span><b>✦</b> Travel</span><span><b>⇄</b> Translate</span></div>
            </div>
          </div>
        </section>

        <div className="welcome-capability-band">
          <article><strong>Learn</strong><span>klarer täglicher Lernweg</span></article>
          <article><strong>Speak</strong><span>Voice Sprint & Gespräche</span></article>
          <article><strong>Travel</strong><span>Vorbereitung & Schnellhilfe</span></article>
          <article><strong>{translationLanguages.length} Sprachen</strong><span>übersetzen & vorlesen</span></article>
        </div>

        <div className="welcome-points">
          <article><span>01</span><div><strong>Du weißt immer, was als Nächstes sinnvoll ist.</strong><p>Dein Start-Dashboard bündelt Weiterlernen, Smart Review, Tagesziel und schnelle Werkzeuge, ohne dich mit Menüs zu überladen.</p></div></article>
          <article><span>02</span><div><strong>Sprich vom ersten Tag an.</strong><p>Voice Sprint bringt dich ohne Multiple Choice ins freie Sprechen. Längere KI-Gespräche bauen später auf deinem Niveau und deinen Schwächen auf.</p></div></article>
          <article><span>03</span><div><strong>Reisen wird Teil deines Lernplans.</strong><p>Plane Reiseziel und Datum, trainiere Hotel, Restaurant, Orientierung und Notfälle und öffne wichtige Hilfe-Sätze direkt im Übersetzer.</p></div></article>
          <article><span>04</span><div><strong>Übersetzen endet nicht beim Ergebnis.</strong><p>Sprich Text ein, höre die Übersetzung, nutze deinen Verlauf und speichere wichtige Formulierungen direkt als Lernstoff.</p></div></article>
        </div>

        <div className="welcome-level-block">
          <div><span>PERSÖNLICHER LERNWEG</span><strong>Kurze Einheiten, echte Anwendung und ein System, das deinen Fortschritt zusammenführt.</strong></div>
          <div className="welcome-level-rail" aria-label="CEFR Lernpfad"><span>A1</span><i/><span>A2</span><i/><span>B1</span><i/><span>B2</span><i/><span>C1</span><i/><span>C2</span></div>
        </div>

        <div className="welcome-value-strip">
          <article><span>FREE</span><strong>Eine App, die schon kostenlos wirklich nutzbar ist.</strong><p>Lernpfad, Tagesplan, Voice Sprint, Übersetzer, Wortschatz, Wiederholung, Reiseplanung und Fortschritt.</p><em>0 €</em></article>
          <article className="pro"><span>PRO · TEST</span><strong>Mehr Tiefe für intensives Sprachtraining.</strong><p>KI-Gespräche, Fachsprache, PDF-Wortscanner und zusätzliche Analysefunktionen.</p><em>Stripe aktuell im Testbetrieb</em></article>
        </div>
      </section>

      <aside className="welcome-side">
        <section className="welcome-auth-card" ref={authRef}>
          <div className="welcome-auth-head"><span className="welcome-auth-mark">V</span><div><small>DEIN VOCABFAST KONTO</small><h2>{mode==='login'?'Willkommen zurück.':'Dein Sprachbegleiter ist gleich startklar.'}</h2></div></div>
          <div className="welcome-auth-tabs"><button className={mode==='login'?'active':''} onClick={()=>selectMode('login')}>Anmelden</button><button className={mode==='register'?'active':''} onClick={()=>selectMode('register')}>Registrieren</button></div>
          {notice&&<div className="welcome-notice" role="status" aria-live="polite">{notice}</div>}
          {mode==='register'&&<div className="welcome-register-promise"><strong>Ein Konto, alle Bereiche.</strong><span>Sprachen wählen → Ziel festlegen → Level bestimmen → direkt loslegen.</span></div>}
          <form onSubmit={submit}>
            {mode==='register'&&<label><span>Name</span><input ref={nameRef} autoComplete="name" value={name} onChange={event=>setName(event.target.value)} placeholder="Wie dürfen wir dich nennen?" required minLength={2}/></label>}
            <label><span>E-Mail</span><input ref={emailRef} type="email" inputMode="email" autoCapitalize="none" autoComplete="email" value={email} onChange={event=>setEmail(event.target.value)} placeholder="name@beispiel.at" required/></label>
            <div className="welcome-field"><label htmlFor="vf-password">Passwort</label><div className="welcome-password-row"><input id="vf-password" type={showPassword?'text':'password'} autoComplete={mode==='register'?'new-password':'current-password'} value={password} onChange={event=>setPassword(event.target.value)} placeholder={mode==='register'?'Mindestens 12 Zeichen':'Dein Passwort'} required minLength={mode==='register'?12:1}/><button type="button" className="welcome-password-toggle" onClick={()=>setShowPassword(value=>!value)}>{showPassword?'Verbergen':'Anzeigen'}</button></div></div>
            {mode==='register'&&<><div className="welcome-strength" aria-label={`Passwortstärke: ${strengthLabel}`}><div>{[1,2,3,4,5].map(value=><i key={value} className={passwordStrength>=value?'active':''}/>)}</div><span>{password?strengthLabel:'Passwortstärke'}</span></div><div className="welcome-field"><label htmlFor="vf-password-confirm">Passwort wiederholen</label><div className="welcome-password-row"><input id="vf-password-confirm" type={showPassword?'text':'password'} autoComplete="new-password" value={confirmPassword} onChange={event=>setConfirmPassword(event.target.value)} placeholder="Passwort erneut eingeben" required minLength={12}/></div></div><div className="welcome-password-hint"><span>Mindestens 12 Zeichen. Ein längeres, einzigartiges Passwort ist besser.</span>{confirmPassword&&<strong className={passwordsMatch?'match':'mismatch'}>{passwordsMatch?'✓ Passwörter stimmen überein':'Passwörter stimmen noch nicht überein'}</strong>}</div></>}
            {error&&<div className="welcome-error" role="alert" aria-live="assertive">{error}</div>}
            <button className="welcome-submit" disabled={busy||!email||!password||(mode==='register'&&(!name.trim()||password.length<12||password!==confirmPassword))}>{busy?'Bitte warten …':mode==='login'?'Sicher anmelden →':'Kostenloses Konto erstellen →'}</button>
          </form>
          <div className="welcome-card-note">{mode==='register'?<>Mit der Registrierung akzeptierst du unsere <a href={`${legalBase}/nutzungsbedingungen.html`}>Nutzungsbedingungen</a> und bestätigst, die <a href={`${legalBase}/datenschutz.html`}>Datenschutzhinweise</a> gelesen zu haben.</>:<>Nach der Anmeldung wird dein gespeicherter Lernstand automatisch geladen.</>}</div>
          <div className="welcome-security"><span>✓</span><p><strong>Sicherer Kontozugang.</strong> Dein Passwort wird nicht im Klartext gespeichert. Lernstand und Einstellungen werden deinem Konto zugeordnet.</p></div>
        </section>

        <section className="welcome-side-note" aria-label="VocabFast Vorteile"><span>WARUM VOCABFAST?</span><strong>Ein zusammenhängender Sprachbegleiter statt einer Sammlung einzelner Tools.</strong><div><em>{learnableLanguages.length} aktive Lernpfade</em><em>Voice Training</em><em>Travel Companion</em><em>Übersetzer mit Verlauf</em></div></section>
        <section className="welcome-test-note"><span>TESTBETRIEB</span><p>VocabFast befindet sich aktuell in Entwicklung. Pro-Zahlungen laufen derzeit über Stripe Sandbox und belasten kein echtes Geld.</p></section>
      </aside>
    </main>

    <footer className="welcome-footer"><span>© {new Date().getFullYear()} VocabFast · Entwicklungs- und Testbetrieb</span><nav aria-label="Rechtliche Informationen"><a href={`${legalBase}/impressum.html`}>Impressum</a><a href={`${legalBase}/datenschutz.html`}>Datenschutz</a><a href={`${legalBase}/nutzungsbedingungen.html`}>Nutzungsbedingungen</a><a href={`${legalBase}/widerruf.html`}>Widerruf</a></nav></footer>
  </div>;
}