import { useMemo, useState } from 'react';
import { languages, learnableLanguages, languageByCode } from '../data/catalog';
import { withActivePair, type LanguageCode, type LearnerPreferences, type LearningReason } from '../learning/preferences';
import './onboarding.css';

type Props = { initial: LearnerPreferences; onDone: (preferences: LearnerPreferences) => void; };
const reasons: Array<{ id: LearningReason; title: string; copy: string; icon: string }> = [
  { id:'alltag', title:'Alltag', copy:'Sicher verstehen und sprechen.', icon:'◌' },
  { id:'reise', title:'Reisen', copy:'Hotel, Restaurant und unterwegs.', icon:'✈' },
  { id:'beruf', title:'Beruf', copy:'Meetings, E-Mails und Gespräche.', icon:'↗' },
  { id:'fachsprache', title:'Fachsprache', copy:'Gezielt für deinen Fachbereich.', icon:'◇' }
];

export default function Onboarding({ initial, onDone }: Props) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState(initial.name);
  const [sourceLanguage,setSourceLanguage]=useState<LanguageCode>(initial.sourceLanguage);
  const [targetLanguage,setTargetLanguage]=useState<LanguageCode>(initial.targetLanguage);
  const [reason, setReason] = useState<LearningReason>(initial.reason);
  const [minutes, setMinutes] = useState<LearnerPreferences['dailyMinutes']>(initial.dailyMinutes);
  const source=languageByCode(sourceLanguage),target=languageByCode(targetLanguage);
  const targetOptions=useMemo(()=>learnableLanguages.filter(language=>language.code!==sourceLanguage),[sourceLanguage]);

  function chooseSource(code:LanguageCode){
    setSourceLanguage(code);
    if(code===targetLanguage){const fallback=learnableLanguages.find(language=>language.code!==code);if(fallback)setTargetLanguage(fallback.code as LanguageCode);}
  }
  const finish = () => {
    const paired=withActivePair(initial,sourceLanguage,targetLanguage);
    onDone({ ...paired, name: name.trim() || 'Lernender', reason, dailyMinutes: minutes, onboarded: true });
  };

  return <div className="onboarding-shell" role="dialog" aria-modal="true">
    <div className="onboarding-card">
      <div className="onboarding-brand"><span className="brand-mark">V</span><div><strong>VocabFast</strong><small>Dein persönlicher Sprachpfad</small></div></div>
      <div className="onboarding-progress">{[0,1,2,3].map(value=><span key={value} className={step>=value?'active':''}/>)}</div>

      {step===0&&<section>
        <span className="eyebrow">DEINE SPRACHEN</span><h1>In welcher Sprache möchtest du lernen?</h1>
        <p>Wähle zuerst deine Ausgangssprache und danach die Sprache, die du aktiv lernen möchtest. Du kannst später mehrere Lernsprachen parallel führen.</p>
        <label className="name-field"><span>Wie dürfen wir dich nennen?</span><input value={name} onChange={event=>setName(event.target.value)} maxLength={40} autoFocus /></label>
        <div className="language-pair-setup">
          <label><span>Meine Ausgangssprache</span><select value={sourceLanguage} onChange={event=>chooseSource(event.target.value as LanguageCode)}>{languages.map(language=><option key={language.code} value={language.code}>{language.name} · {language.nativeName}</option>)}</select></label>
          <div className="pair-arrow">→</div>
          <label><span>Ich möchte lernen</span><select value={targetLanguage} onChange={event=>setTargetLanguage(event.target.value as LanguageCode)}>{targetOptions.map(language=><option key={language.code} value={language.code}>{language.name} · {language.nativeName}</option>)}</select></label>
        </div>
        <div className="pair-preview"><span>{source.symbol}</span><b>→</b><span>{target.symbol}</span><div><strong>{target.name} lernen</strong><small>mit {source.name} als Hilfs- und Übersetzungssprache</small></div></div>
        <small className="onboarding-note">Englisch ist als A1–C2-Kurs verfügbar. Kroatisch startet mit einem vollständigen A1-Grundkurs und wird weiter ausgebaut. Übersetzen funktioniert zwischen allen angebotenen Sprachen.</small>
        <button className="onboarding-primary" onClick={()=>setStep(1)}>Weiter →</button>
      </section>}

      {step===1&&<section>
        <span className="eyebrow">DEIN ZIEL</span><h1>Wofür möchtest du {target.name} wirklich können?</h1><p>VocabFast nutzt dein Ziel für Übungen, Situationen und Empfehlungen.</p>
        <div className="reason-grid">{reasons.map(item=><button key={item.id} className={reason===item.id?'selected':''} onClick={()=>setReason(item.id)}><span>{item.icon}</span><div><strong>{item.title}</strong><small>{item.copy}</small></div></button>)}</div>
        <div className="onboarding-actions"><button className="onboarding-back" onClick={()=>setStep(0)}>Zurück</button><button className="onboarding-primary" onClick={()=>setStep(2)}>Weiter →</button></div>
      </section>}

      {step===2&&<section>
        <span className="eyebrow">DEIN RHYTHMUS</span><h1>Wie viel Zeit passt wirklich in deinen Tag?</h1><p>Ein realistisches Ziel ist besser als ein großes Ziel, das du nach wenigen Tagen aufgibst.</p>
        <div className="minutes-grid">{([5,10,15,20] as const).map(value=><button key={value} className={minutes===value?'selected':''} onClick={()=>setMinutes(value)}><strong>{value}</strong><span>Minuten</span><small>{value===5?'Locker':value===10?'Konstant':value===15?'Ambitioniert':'Intensiv'}</small></button>)}</div>
        <div className="onboarding-actions"><button className="onboarding-back" onClick={()=>setStep(1)}>Zurück</button><button className="onboarding-primary" onClick={()=>setStep(3)}>Weiter →</button></div>
      </section>}

      {step===3&&<section className="ready-step">
        <div className="ready-orbit"><span>{target.symbol}</span><strong>START</strong></div><span className="eyebrow">DEIN PLAN IST BEREIT</span>
        <h1>{name.trim() || 'Du'}, dein {target.name} beginnt mit echten Situationen.</h1>
        <p>Dein Fortschritt wird für diese Sprachkombination separat gespeichert. Wenn du später eine weitere Sprache hinzufügst, bleibt dieser Lernstand vollständig erhalten.</p>
        <div className="ready-summary"><div><span>Ziel</span><strong>{reasons.find(item=>item.id===reason)?.title}</strong></div><div><span>Täglich</span><strong>{minutes} Minuten</strong></div><div><span>Lernpfad</span><strong>{source.symbol} → {target.symbol}</strong></div></div>
        <div className="onboarding-actions"><button className="onboarding-back" onClick={()=>setStep(2)}>Zurück</button><button className="onboarding-primary" onClick={finish}>Einstufung starten →</button></div>
      </section>}
    </div>
  </div>;
}
