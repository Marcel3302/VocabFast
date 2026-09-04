import { useState } from 'react';
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
      <a className="welcome-admin-link" href="/admin">Admin</a>
    </header>

    <main className="welcome-main">
      <section className="welcome-story">
        <span className="welcome-kicker">DEIN PERSÖNLICHES SPRACHTRAINING</span>
        <h1>Von deinem echten Niveau bis zu sicherem, natürlichem Englisch.</h1>
        <p>VocabFast verbindet einen strukturierten A1–C2-Lernpfad mit Grammatik, aktivem Sprechen, Hörtraining, Wiederholung und Fachsprache. Dein Fortschritt wird deinem Konto zugeordnet und auf dieser Preview gespeichert.</p>
        <div className="welcome-points">
          <article><span>01</span><div><strong>Erst verstehen, wo du stehst.</strong><p>Nach der ersten Einrichtung bekommst du eine 36-Fragen-Einstufung mit Niveauempfehlung und persönlichen Lernschwerpunkten.</p></div></article>
          <article><span>02</span><div><strong>Dann gezielt statt zufällig lernen.</strong><p>VocabFast merkt sich abgeschlossene Lektionen, XP, Streak, Mastery und schwierige Konzepte.</p></div></article>
          <article><span>03</span><div><strong>Alltag und Fachsprache verbinden.</strong><p>Englisch lernen, Grammatik festigen und später Aviation, Business, Medizin, Technik oder Tourismus ergänzen.</p></div></article>
        </div>
        <div className="welcome-level-rail" aria-label="CEFR Lernpfad"><span>A1</span><i/><span>A2</span><i/><span>B1</span><i/><span>B2</span><i/><span>C1</span><i/><span>C2</span></div>
      </section>

      <section className="welcome-auth-card">
        <div className="welcome-auth-head"><span className="welcome-auth-mark">V</span><div><small>VOCABFAST KONTO</small><h2>{mode==='login'?'Willkommen zurück.':'Dein Lernkonto erstellen.'}</h2></div></div>
        <div className="welcome-auth-tabs"><button className={mode==='login'?'active':''} onClick={()=>{setMode('login');setError('');}}>Anmelden</button><button className={mode==='register'?'active':''} onClick={()=>{setMode('register');setError('');}}>Registrieren</button></div>
        {notice&&<div className="welcome-notice">{notice}</div>}
        <form onSubmit={submit}>
          {mode==='register'&&<label><span>Name</span><input autoComplete="name" value={name} onChange={event=>setName(event.target.value)} placeholder="Wie sollen wir dich nennen?" required minLength={2}/></label>}
          <label><span>E-Mail</span><input type="email" autoComplete="email" value={email} onChange={event=>setEmail(event.target.value)} placeholder="name@beispiel.at" required/></label>
          <label><span>Passwort</span><input type="password" autoComplete={mode==='register'?'new-password':'current-password'} value={password} onChange={event=>setPassword(event.target.value)} placeholder={mode==='register'?'Mindestens 12 Zeichen':'Dein Passwort'} required minLength={mode==='register'?12:1}/></label>
          {error&&<div className="welcome-error">{error}</div>}
          <button className="welcome-submit" disabled={busy||!email||!password||(mode==='register'&&!name.trim())}>{busy?'Bitte warten …':mode==='login'?'Jetzt anmelden →':'Konto erstellen & Niveau bestimmen →'}</button>
        </form>
        <div className="welcome-security"><span>●</span><p><strong>Isolierte Testumgebung.</strong> Dieses Preview-Konto ist von deinen bestehenden produktiven VocabFast-Konten getrennt. Passwörter werden nicht im Klartext gespeichert.</p></div>
      </section>
    </main>
  </div>;
}
