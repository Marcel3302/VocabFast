import { useState } from 'react';
import { changeAccountPassword, deleteAccount } from '../learning/account';
import type { LearnerPreferences, LearningReason } from '../learning/preferences';
import type { PlatformProgress } from '../learning/progress';
import './profile-view.css';

type Props = {
  preferences: LearnerPreferences;
  progress: PlatformProgress;
  onSave: (preferences: LearnerPreferences) => void;
  onResetProgress: () => void;
  onAccountDeleted: () => void;
};

const reasonLabels: Record<LearningReason,string> = {
  alltag: 'Alltag', reise: 'Reisen', beruf: 'Beruf', fachsprache: 'Fachsprache'
};

export default function ProfileView({ preferences, progress, onSave, onResetProgress, onAccountDeleted }: Props) {
  const [draft, setDraft] = useState(preferences);
  const [saved, setSaved] = useState(false);
  const [currentPassword,setCurrentPassword]=useState('');
  const [newPassword,setNewPassword]=useState('');
  const [repeatPassword,setRepeatPassword]=useState('');
  const [passwordBusy,setPasswordBusy]=useState(false);
  const [securityMessage,setSecurityMessage]=useState('');
  const [securityError,setSecurityError]=useState('');
  const [deletePassword,setDeletePassword]=useState('');
  const [deleteBusy,setDeleteBusy]=useState(false);

  function save() {
    onSave({ ...draft, name: draft.name.trim() || 'Lernender' });
    setSaved(true);
    window.setTimeout(()=>setSaved(false), 1800);
  }

  function reset() {
    if (!window.confirm('Deinen Lernfortschritt wirklich zurücksetzen? Die Änderung wird auch in deinem Konto gespeichert.')) return;
    onResetProgress();
  }

  async function updatePassword(event:React.FormEvent) {
    event.preventDefault();
    setSecurityError('');setSecurityMessage('');
    if(newPassword.length<12){setSecurityError('Das neue Passwort muss mindestens 12 Zeichen lang sein.');return;}
    if(newPassword!==repeatPassword){setSecurityError('Die neuen Passwörter stimmen nicht überein.');return;}
    setPasswordBusy(true);
    try {
      await changeAccountPassword({currentPassword,newPassword});
      setCurrentPassword('');setNewPassword('');setRepeatPassword('');
      setSecurityMessage('Dein Passwort wurde geändert. Andere Anmeldungen wurden beendet.');
    } catch(reason) {
      setSecurityError(reason instanceof Error?reason.message:'Das Passwort konnte nicht geändert werden.');
    } finally {setPasswordBusy(false);}
  }

  async function removeAccount() {
    setSecurityError('');setSecurityMessage('');
    if(!deletePassword){setSecurityError('Bitte bestätige die Löschung mit deinem Passwort.');return;}
    if(!window.confirm('Konto wirklich dauerhaft löschen? Dein gespeicherter Lernfortschritt wird dabei ebenfalls gelöscht.'))return;
    setDeleteBusy(true);
    try {
      await deleteAccount(deletePassword);
      onAccountDeleted();
    } catch(reason) {
      setSecurityError(reason instanceof Error?reason.message:'Das Konto konnte nicht gelöscht werden.');
      setDeleteBusy(false);
    }
  }

  return <section className="profile-view platform-view">
    <div className="view-hero profile-hero"><div><span className="eyebrow">DEIN PROFIL</span><h1>Dein Lernplan soll zu deinem echten Alltag passen.</h1><p>Tagesziel, Lernfokus und Audioeinstellungen werden mit deinem Konto gespeichert und auf deinen Geräten wiederhergestellt.</p></div><div className="profile-avatar">{draft.name.slice(0,2).toUpperCase()}</div></div>
    <div className="profile-grid">
      <article className="profile-panel">
        <div className="view-section-head inner"><div><span className="eyebrow">LERNPLAN</span><h2>Persönliche Einstellungen</h2></div></div>
        <label><span>Name</span><input value={draft.name} onChange={event=>setDraft({...draft,name:event.target.value})}/></label>
        <label><span>Dein Hauptziel</span><select value={draft.reason} onChange={event=>setDraft({...draft,reason:event.target.value as LearningReason})}>{Object.entries(reasonLabels).map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label>
        <fieldset><legend>Tagesziel</legend><div className="setting-pills">{([5,10,15,20] as const).map(value=><button type="button" key={value} className={draft.dailyMinutes===value?'active':''} onClick={()=>setDraft({...draft,dailyMinutes:value})}>{value} Min</button>)}</div></fieldset>
        <fieldset><legend>Audio-Geschwindigkeit</legend><div className="setting-pills">{([{value:.75,label:'Langsam'},{value:.9,label:'Lernmodus'},{value:1,label:'Normal'}] as const).map(item=><button type="button" key={item.value} className={draft.audioRate===item.value?'active':''} onClick={()=>setDraft({...draft,audioRate:item.value})}>{item.label}</button>)}</div></fieldset>
        <button className="profile-save" onClick={save}>{saved?'✓ Gespeichert':'Einstellungen speichern'}</button>
      </article>

      <article className="profile-panel stats-panel">
        <div className="view-section-head inner"><div><span className="eyebrow">DEINE DATEN</span><h2>Konto & Fortschritt</h2></div></div>
        <div className="profile-stats"><div><strong>{progress.totalXp}</strong><span>XP</span></div><div><strong>{progress.sessions}</strong><span>Sessions</span></div><div><strong>{progress.currentStreak}</strong><span>Streak</span></div><div><strong>{progress.completedLessonIds.length}</strong><span>Lektionen</span></div></div>
        <div className="local-note"><strong>Automatisch gespeichert</strong><p>Lektionen, Ergebnisse, XP, Streak, Einstellungen, Einstufung und Mastery werden deinem Konto zugeordnet und regelmäßig synchronisiert.</p></div>
        <button className="danger-button" onClick={reset}>Lernfortschritt zurücksetzen</button>
      </article>

      <article className="profile-panel security-panel">
        <div className="view-section-head inner"><div><span className="eyebrow">SICHERHEIT</span><h2>Passwort ändern</h2></div></div>
        <form onSubmit={updatePassword}>
          <label><span>Aktuelles Passwort</span><input type="password" autoComplete="current-password" value={currentPassword} onChange={event=>setCurrentPassword(event.target.value)}/></label>
          <label><span>Neues Passwort</span><input type="password" autoComplete="new-password" minLength={12} value={newPassword} onChange={event=>setNewPassword(event.target.value)} placeholder="Mindestens 12 Zeichen"/></label>
          <label><span>Neues Passwort wiederholen</span><input type="password" autoComplete="new-password" minLength={12} value={repeatPassword} onChange={event=>setRepeatPassword(event.target.value)}/></label>
          <button className="profile-save" disabled={passwordBusy}>{passwordBusy?'Wird geändert …':'Passwort ändern'}</button>
        </form>
        {securityMessage&&<div className="profile-message success">{securityMessage}</div>}
        {securityError&&<div className="profile-message error">{securityError}</div>}
      </article>

      <article className="profile-panel account-danger-panel">
        <div className="view-section-head inner"><div><span className="eyebrow">KONTO</span><h2>Konto löschen</h2></div></div>
        <p>Wenn du dein Konto löschst, werden dein Konto und der zugehörige gespeicherte Lernstand dauerhaft entfernt.</p>
        <label><span>Passwort zur Bestätigung</span><input type="password" autoComplete="current-password" value={deletePassword} onChange={event=>setDeletePassword(event.target.value)}/></label>
        <button className="danger-button solid" disabled={deleteBusy} onClick={()=>void removeAccount()}>{deleteBusy?'Konto wird gelöscht …':'Konto dauerhaft löschen'}</button>
      </article>
    </div>
  </section>;
}
