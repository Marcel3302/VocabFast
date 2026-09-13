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
      <a className="welcome-brand" href="/" aria-label="VocabFast Startseite"><span>V</span><div><strong>VocabFast</strong><small>Language Learning</small></div></a>
      <div className="welcome-topbar-actions"><span className="welcome-preview-label">Mehrsprachig · Persönlich · Synchronisiert</span><button onClick={()=>focusAuth('login')}>Anmelden</button></div>
    </header>

    <main className="welcome-main">
      <section className="welcome-story">
        <span className="welcome-kicker">SPRACHEN LERNEN. SICHER ANWENDEN.</span>
        <h1>Aus „ich verstehe es“ wird <em>„ich kann es sagen“.</em></h1>
        <p>VocabFast verbindet strukturierte Lernpfade mit aktivem Sprechen, Hörtraining, intelligenten Wiederholungen, Übersetzer und persönlichem Wortschatz. Kurze, fokussierte Einheiten bringen dich vom Erkennen zum sicheren Anwenden.</p>

        <div className="welcome-hero-actions">
          <button className="welcome-hero-primary" onClick={()=>focusAuth('register')}>Kostenlos loslegen <span>→</span></button>
          <button className="welcome-hero-secondary" onClick={()=>focusAuth('login')}>Ich habe schon ein Konto</button>
        </div>
        <div className="welcome-trust-line"><span>✓ Kostenlos starten</span><span>✓ Kein Zahlungsmittel nötig</span><span>✓ Fortschritt geräteübergreifend</span><span>✓ Pro-Käufe aktuell nur Sandbox-Test</span></div>

        <section className="welcome-product-preview" aria-label="Produktvorschau von VocabFast">
          <div className="preview-window-bar"><span/><span/><span/><strong>VOCABFAST · PRODUKTVORSCHAU</strong></div>
          <div className="preview-app">
            <aside className="preview-sidebar" aria-hidden="true"><b>V</b><i className="active">⌂</i><i>A2</i><i>Aa</i><i>AI</i><i>⇄</i><i>W</i></aside>
            <div className="preview-content">
              <div className="preview-head"><div><small>DEIN LERNPFAD</small><strong>Heute ein Stück sicherer.</strong></div><span>EN · A2</span></div>
              <div className="preview-grid">
                <article className="preview-next"><small>NÄCHSTER SCHRITT</small><h3>Everyday conversations</h3><p>Hören · Satzbau · Sprechen · 8 Minuten</p><div className="preview-progress"><span/></div><button type="button" tabIndex={-1}>Weiterlernen →</button></article>
                <article className="preview-score"><small>HEUTE</small><strong>12</strong><span>Minuten gelernt</span><div><b>◆ 240 XP</b><b>🔥 6 Tage</b></div></article>
              </div>
              <div className="preview-tools"><span><b>AI</b> Sprachcoach</span><span><b>⇄</b> Übersetzer</span><span><b>W</b> Wortschatz</span><span><b>✈</b> Fachsprache</span></div>
            </div>
          </div>
        </section>

        <div className="welcome-capability-band">
          <article><strong>Englisch A1–C2</strong><span>strukturierter Lernpfad</span></article>
          <article><strong>Kroatisch A1–A2</strong><span>eigener Kursfortschritt</span></article>
          <article><strong>{translationLanguages.length} Sprachen</strong><span>im integrierten Übersetzer</span></article>
          <article><strong>{learnableLanguages.length} Lernpfade</strong><span>mit getrenntem Fortschritt</span></article>
        </div>

        <div className="welcome-points">
          <article><span>01</span><div><strong>Ein klarer nächster Schritt.</strong><p>Level, Lernpfad, Tagesziel und Wiederholung greifen ineinander. Du musst nicht überlegen, womit du heute anfangen sollst.</p></div></article>
          <article><span>02</span><div><strong>Aktiv produzieren statt nur erkennen.</strong><p>Übersetzen, Satzbau, Hören, Diktat und Sprechen trainieren genau das, was im echten Gespräch zählt: Wörter und Strukturen selbst abrufen.</p></div></article>
          <article><span>03</span><div><strong>Dein eigener Wortschatz wächst mit.</strong><p>Speichere Übersetzungen, nutze Level-Wortschatz und trainiere persönliche Karten mit Wiederholungslogik. Pro ergänzt den PDF-Wortscanner.</p></div></article>
          <article><span>04</span><div><strong>Mehrere Sprachen. Ein Konto.</strong><p>Fortschritt, Level, XP und Wiederholungen bleiben für jede Sprachkombination getrennt erhalten und werden synchronisiert.</p></div></article>
        </div>

        <div className="welcome-level-block">
          <div><span>STRUKTURIERTES LERNEN</span><strong>Vom Einstieg bis zur sicheren, differenzierten Anwendung.</strong></div>
          <div className="welcome-level-rail" aria-label="CEFR Lernpfad"><span>A1</span><i/><span>A2</span><i/><span>B1</span><i/><span>B2</span><i/><span>C1</span><i/><span>C2</span></div>
        </div>

        <div className="welcome-value-strip">
          <article><span>FREE</span><strong>Alles, was du für regelmäßiges Lernen brauchst.</strong><p>Lernpfade, Übersetzer, Wortschatz, Hör- und Sprechübungen, Wiederholung und Fortschritt.</p><em>0 €</em></article>
          <article className="pro"><span>PRO · TEST</span><strong>Mehr Tiefe für ambitioniertes Training.</strong><p>KI-Coach, Fachsprache, PDF-Wortscanner und zusätzliche Analyse- und Trainingsfunktionen.</p><em>19,99 € / Monat · Stripe Sandbox</em></article>
        </div>
      </section>

      <aside className="welcome-side">
        <section className="welcome-auth-card" ref={authRef}>
          <div className="welcome-auth-head"><span className="welcome-auth-mark">V</span><div><small>DEIN VOCABFAST KONTO</small><h2>{mode==='login'?'Willkommen zurück.':'In wenigen Schritten startklar.'}</h2></div></div>
          <div className="welcome-auth-tabs"><button className={mode==='login'?'active':''} onClick={()=>selectMode('login')}>Anmelden</button><button className={mode==='register'?'active':''} onClick={()=>selectMode('register')}>Registrieren</button></div>
          {notice&&<div className="welcome-notice" role="status" aria-live="polite">{notice}</div>}
          {mode==='register'&&<div className="welcome-register-promise"><strong>Dein Start dauert nur wenige Minuten.</strong><span>Sprachen wählen → Ziel festlegen → Level bestimmen → erste Einheit starten.</span></div>}
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

        <section className="welcome-side-note" aria-label="VocabFast Vorteile">
          <span>WARUM VOCABFAST?</span>
          <strong>Ein ruhiger Lernbereich, der sich auf Fortschritt statt Ablenkung konzentriert.</strong>
          <div><em>Mehrere Lernsprachen</em><em>Übersetzer integriert</em><em>Wortschatz mit Wiederholung</em><em>Mobil & Desktop</em></div>
        </section>
        <section className="welcome-test-note"><span>TESTBETRIEB</span><p>VocabFast befindet sich aktuell in Entwicklung. Pro-Zahlungen laufen ausschließlich über Stripe Sandbox und belasten kein echtes Geld.</p></section>
      </aside>
    </main>

    <footer className="welcome-footer"><span>© {new Date().getFullYear()} VocabFast · Entwicklungs- und Testbetrieb</span><nav aria-label="Rechtliche Informationen"><a href={`${legalBase}/impressum.html`}>Impressum</a><a href={`${legalBase}/datenschutz.html`}>Datenschutz</a><a href={`${legalBase}/nutzungsbedingungen.html`}>Nutzungsbedingungen</a><a href={`${legalBase}/widerruf.html`}>Widerruf</a></nav></footer>
  </div>;
}
