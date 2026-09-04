import { useState } from 'react';
import type { LearnerPreferences, LearningReason } from '../learning/preferences';
import type { PlatformProgress } from '../learning/progress';
import './profile-view.css';

type Props = {
  preferences: LearnerPreferences;
  progress: PlatformProgress;
  onSave: (preferences: LearnerPreferences) => void;
  onResetProgress: () => void;
};

const reasonLabels: Record<LearningReason,string> = {
  alltag: 'Alltag', reise: 'Reisen', beruf: 'Beruf', fachsprache: 'Fachsprache'
};

export default function ProfileView({ preferences, progress, onSave, onResetProgress }: Props) {
  const [draft, setDraft] = useState(preferences);
  const [saved, setSaved] = useState(false);

  function save() {
    onSave({ ...draft, name: draft.name.trim() || 'Lernender' });
    setSaved(true);
    window.setTimeout(()=>setSaved(false), 1800);
  }

  function reset() {
    if (!window.confirm('Deinen Lernfortschritt wirklich zurücksetzen? Die Änderung wird auch mit deinem Preview-Konto synchronisiert.')) return;
    onResetProgress();
  }

  return <section className="profile-view platform-view">
    <div className="view-hero profile-hero"><div><span className="eyebrow">DEIN PROFIL</span><h1>Dein Lernplan soll zu deinem echten Alltag passen.</h1><p>Tagesziel, Lernfokus und Audio werden mit deinem Preview-Konto gespeichert. Der Browser hält zusätzlich eine lokale Arbeitskopie für schnelle Reaktionen.</p></div><div className="profile-avatar">{draft.name.slice(0,2).toUpperCase()}</div></div>
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
        <div className="view-section-head inner"><div><span className="eyebrow">DEINE DATEN</span><h2>Konto-Synchronisierung</h2></div></div>
        <div className="profile-stats"><div><strong>{progress.totalXp}</strong><span>XP</span></div><div><strong>{progress.sessions}</strong><span>Sessions</span></div><div><strong>{progress.currentStreak}</strong><span>Streak</span></div><div><strong>{progress.completedLessonIds.length}</strong><span>Lektionen</span></div></div>
        <div className="local-note"><strong>Preview-Konto + lokaler Cache</strong><p>Lektionen, Ergebnisse, XP, Streak, Einstellungen, Einstufung und Mastery werden in dieser Testumgebung deinem Preview-Konto zugeordnet. Diese Konten sind bewusst von den produktiven VocabFast-Konten getrennt.</p></div>
        <button className="danger-button" onClick={reset}>Lernfortschritt zurücksetzen</button>
      </article>
    </div>
  </section>;
}
