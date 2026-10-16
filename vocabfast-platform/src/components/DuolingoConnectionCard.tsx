import { useEffect, useState } from 'react';
import { connectDuolingo, disconnectDuolingo, duolingoSyncDue, readDuolingoConnection, refreshDuolingo, type DuolingoConnection } from '../learning/duolingo';
import './duolingo-connection.css';

export default function DuolingoConnectionCard(){
  const [connection,setConnection]=useState<DuolingoConnection|null>(()=>readDuolingoConnection());
  const [username,setUsername]=useState(()=>readDuolingoConnection()?.username||'');
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState('');
  const [error,setError]=useState('');

  useEffect(()=>{if(!connection||!duolingoSyncDue())return;void sync();},[]);

  async function connect(){
    const value=username.trim();if(!value){setError('Bitte gib deinen Duolingo-Benutzernamen ein.');return;}
    setBusy(true);setError('');setMessage('');
    try{const next=await connectDuolingo(value);setConnection(next);setUsername(next.username);setMessage('Duolingo ist verbunden.');}
    catch(reason){setError(reason instanceof Error?reason.message:'Duolingo konnte nicht verbunden werden.');}
    finally{setBusy(false);}
  }
  async function sync(){
    setBusy(true);setError('');setMessage('');
    try{const next=await refreshDuolingo();setConnection(next);if(next)setUsername(next.username);setMessage('Duolingo-Daten aktualisiert.');}
    catch(reason){setError(reason instanceof Error?reason.message:'Duolingo konnte nicht aktualisiert werden.');}
    finally{setBusy(false);}
  }
  function remove(){
    if(!window.confirm('Duolingo-Verknüpfung wirklich trennen?'))return;
    disconnectDuolingo();setConnection(null);setUsername('');setMessage('Duolingo-Verknüpfung getrennt.');setError('');
  }
  const p=connection?.profile;
  return <article className="profile-panel duolingo-panel">
    <div className="duo-head"><div><span className="duo-logo">D</span><div><span className="eyebrow">DUOLINGO</span><h2>Duolingo verknüpfen</h2></div></div>{connection&&<em>Verbunden</em>}</div>
    {!connection?<><p>Verbinde dein öffentliches Duolingo-Profil per Benutzername. VocabFast liest nur öffentliche Profildaten – kein Passwort und kein Duolingo-Session-Token.</p><div className="duo-connect-row"><input value={username} onChange={event=>setUsername(event.target.value)} placeholder="Duolingo-Benutzername" autoCapitalize="none" autoCorrect="off"/><button className="profile-save" disabled={busy} onClick={()=>void connect()}>{busy?'Verbinde …':'Verbinden'}</button></div></>:<>
      <div className="duo-profile"><div><small>PROFIL</small><strong>{p?.name||connection.username}</strong><span>@{connection.username}</span></div><div><small>STREAK</small><strong>{p?.streak??0}</strong><span>Tage</span></div><div><small>GESAMT-XP</small><strong>{p?.totalXp??0}</strong><span>Duolingo</span></div></div>
      {p?.courses?.length?<div className="duo-courses">{p.courses.slice(0,6).map(course=><div key={course.id||course.title}><strong>{course.title||course.learningLanguage.toUpperCase()}</strong><span>{course.xp} XP</span></div>)}</div>:null}
      <div className="duo-actions"><button className="profile-save" disabled={busy} onClick={()=>void sync()}>{busy?'Aktualisiere …':'Jetzt synchronisieren'}</button><button onClick={remove}>Trennen</button></div>
      <p className="duo-note">Automatische Wortlisten-Synchronisierung ist nicht aktiv: Duolingo stellt dafür keine stabile öffentliche Wortschatz-Schnittstelle bereit. Deine VocabFast-Wörter bleiben unverändert.</p>
    </>}
    {message&&<div className="profile-message success">{message}</div>}{error&&<div className="profile-message error">{error}</div>}
  </article>;
}
