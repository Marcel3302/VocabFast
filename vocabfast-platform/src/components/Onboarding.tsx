import { useState } from 'react';
import type { LearnerPreferences, LearningReason } from '../learning/preferences';
import './onboarding.css';

type Props = {
  initial: LearnerPreferences;
  onDone: (preferences: LearnerPreferences) => void;
};

const reasons: Array<{ id: LearningReason; title: string; copy: string; icon: string }> = [
  { id:'alltag', title:'Alltag', copy:'Sicher verstehen und sprechen.', icon:'◌' },
  { id:'reise', title:'Reisen', copy:'Hotel, Restaurant und unterwegs.', icon:'✈' },
  { id:'beruf', title:'Beruf', copy:'Meetings, E-Mails und Gespräche.', icon:'↗' },
  { id:'fachsprache', title:'Fachsprache', copy:'Gezielt für deinen Fachbereich.', icon:'◇' }
];

export default function Onboarding({ initial, onDone }: Props) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState(initial.name);
  const [reason, setReason] = useState<LearningReason>(initial.reason);
  const [minutes, setMinutes] = useState<LearnerPreferences['dailyMinutes']>(initial.dailyMinutes);

  const finish = () => onDone({ ...initial, name: name.trim() || 'Lernender', reason, dailyMinutes: minutes, onboarded: true });

  return <div className="onboarding-shell" role="dialog" aria-modal="true">
    <div className="onboarding-card">
      <div className="onboarding-brand"><span className="brand-mark">V</span><div><strong>VocabFast</strong><small>Dein persönlicher Sprachpfad</small></div></div>
      <div className="onboarding-progress"><span className={step>=0?'active':''}/><span className={step>=1?'active':''}/><span className={step>=2?'active':''}/></div>

      {step===0 && <section>
        <span className="eyebrow">WILLKOMMEN</span>
        <h1>Wofür möchtest du Englisch wirklich können?</h1>
        <p>VocabFast nutzt dein Ziel später für Übungen, Situationen und Empfehlungen.</p>
        <label className="name-field"><span>Wie dürfen wir dich nennen?</span><input value={name} onChange={event=>setName(event.target.value)} maxLength={40} autoFocus /></label>
        <div className="reason-grid">{reasons.map(item=><button key={item.id} className={reason===item.id?'selected':''} onClick={()=>setReason(item.id)}><span>{item.icon}</span><div><strong>{item.title}</strong><small>{item.copy}</small></div></button>)}</div>
        <button className="onboarding-primary" onClick={()=>setStep(1)}>Weiter →</button>
      </section>}

      {step===1 && <section>
        <span className="eyebrow">DEIN RHYTHMUS</span>
        <h1>Wie viel Zeit passt wirklich in deinen Tag?</h1>
        <p>Ein realistisches Ziel ist besser als ein großes Ziel, das du nach drei Tagen aufgibst.</p>
        <div className="minutes-grid">{([5,10,15,20] as const).map(value=><button key={value} className={minutes===value?'selected':''} onClick={()=>setMinutes(value)}><strong>{value}</strong><span>Minuten</span><small>{value===5?'Locker':value===10?'Konstant':value===15?'Ambitioniert':'Intensiv'}</small></button>)}</div>
        <div className="onboarding-actions"><button className="onboarding-back" onClick={()=>setStep(0)}>Zurück</button><button className="onboarding-primary" onClick={()=>setStep(2)}>Weiter →</button></div>
      </section>}

      {step===2 && <section className="ready-step">
        <div className="ready-orbit"><span>A1</span><strong>START</strong></div>
        <span className="eyebrow">DEIN PLAN IST BEREIT</span>
        <h1>{name.trim() || 'Du'}, dein Englisch beginnt mit echten Situationen.</h1>
        <p>Du startest bei A1. Kurze Lektionen, Hörtraining, Sprechen und adaptive Wiederholungen bauen Schritt für Schritt aufeinander auf.</p>
        <div className="ready-summary"><div><span>Ziel</span><strong>{reasons.find(item=>item.id===reason)?.title}</strong></div><div><span>Täglich</span><strong>{minutes} Minuten</strong></div><div><span>Sprache</span><strong>Englisch</strong></div></div>
        <div className="onboarding-actions"><button className="onboarding-back" onClick={()=>setStep(1)}>Zurück</button><button className="onboarding-primary" onClick={finish}>Erste Lektion starten →</button></div>
      </section>}
    </div>
  </div>;
}
