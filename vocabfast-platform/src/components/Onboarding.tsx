import { useMemo, useState } from 'react';
import { languages, learnableLanguages, languageByCode } from '../data/catalog';
import type { CefrLevel } from '../learning/curriculum';
import { withActivePair, type LanguageCode, type LearnerPreferences, type LearningReason } from '../learning/preferences';
import './onboarding.css';

type StartChoice={mode:'placement'}|{mode:'manual';level:CefrLevel};
type Props = { initial: LearnerPreferences; onDone: (preferences: LearnerPreferences,start:StartChoice) => void; };
const reasons: Array<{ id: LearningReason; title: string; copy: string; icon: string }> = [
  { id:'alltag', title:'Alltag', copy:'Verstehen, antworten und sicher sprechen.', icon:'◌' },
  { id:'reise', title:'Reisen', copy:'Unterwegs, im Hotel und im Restaurant.', icon:'✈' },
  { id:'beruf', title:'Beruf', copy:'Gespräche, Meetings und Nachrichten.', icon:'↗' },
  { id:'fachsprache', title:'Fachsprache', copy:'Gezielt für deinen persönlichen Fachbereich.', icon:'◇' }
];

export default function Onboarding({ initial, onDone }: Props) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState(initial.name);
  const [sourceLanguage,setSourceLanguage]=useState<LanguageCode>(initial.sourceLanguage);
  const [targetLanguage,setTargetLanguage]=useState<LanguageCode>(initial.targetLanguage);
  const [reason, setReason] = useState<LearningReason>(initial.reason);
  const [minutes, setMinutes] = useState<LearnerPreferences['dailyMinutes']>(initial.dailyMinutes);
  const [startMode,setStartMode]=useState<'placement'|'manual'>('manual');
  const [manualLevel,setManualLevel]=useState<CefrLevel>('A1');
  const source=languageByCode(sourceLanguage),target=languageByCode(targetLanguage);
  const targetOptions=useMemo(()=>learnableLanguages.filter(language=>language.code!==sourceLanguage),[sourceLanguage]);
  const availableLevels=(target.levels.filter(level=>['A1','A2','B1','B2','C1','C2'].includes(level)) as CefrLevel[]);

  function chooseSource(code:LanguageCode){
    setSourceLanguage(code);
    if(code===targetLanguage){const fallback=learnableLanguages.find(language=>language.code!==code);if(fallback)setTargetLanguage(fallback.code as LanguageCode);}
  }
  function chooseTarget(code:LanguageCode){
    setTargetLanguage(code);
    const meta=languageByCode(code);
    const first=meta.levels.find(level=>['A1','A2','B1','B2','C1','C2'].includes(level)) as CefrLevel|undefined;
    if(first)setManualLevel(first);
    if(code!=='en')setStartMode('manual');
  }
  const finish = () => {
    const paired=withActivePair(initial,sourceLanguage,targetLanguage);
    const preferences={ ...paired, name: name.trim() || 'Lernender', reason, dailyMinutes: minutes, onboarded: true };
    const start:StartChoice=targetLanguage==='en'&&startMode==='placement'?{mode:'placement'}:{mode:'manual',level:manualLevel};
    onDone(preferences,start);
  };

  return <div className="onboarding-shell" role="dialog" aria-modal="true">
    <div className="onboarding-card">
      <div className="onboarding-brand"><span className="brand-mark">V</span><div><strong>VocabFast</strong><small>Dein persönlicher Lernpfad</small></div></div>
      <div className="onboarding-progress" aria-label={`Schritt ${step+1} von 4`}>{[0,1,2,3].map(value=><span key={value} className={step>=value?'active':''}/>)}</div>

      {step===0&&<section>
        <span className="eyebrow">SCHRITT 1 · DEINE SPRACHEN</span><h1>Welche Sprache möchtest du lernen?</h1>
        <p>Wähle zuerst die Sprache, in der VocabFast dich unterstützen soll, und danach deine Lernsprache. Weitere Lernpfade kannst du später jederzeit hinzufügen.</p>
        <label className="name-field"><span>Wie dürfen wir dich nennen?</span><input value={name} onChange={event=>setName(event.target.value)} maxLength={40} autoFocus /></label>
        <div className="language-pair-setup">
          <label><span>Meine Ausgangssprache</span><select value={sourceLanguage} onChange={event=>chooseSource(event.target.value as LanguageCode)}>{languages.map(language=><option key={language.code} value={language.code}>{language.name} · {language.nativeName}</option>)}</select></label>
          <div className="pair-arrow">→</div>
          <label><span>Meine Lernsprache</span><select value={targetLanguage} onChange={event=>chooseTarget(event.target.value as LanguageCode)}>{targetOptions.map(language=><option key={language.code} value={language.code}>{language.name} · {language.nativeName}</option>)}</select></label>
        </div>
        <div className="pair-preview"><span>{source.symbol}</span><b>→</b><span>{target.symbol}</span><div><strong>{target.name} lernen</strong><small>{source.name} unterstützt dich bei Erklärungen und Übersetzungen</small></div></div>
        <small className="onboarding-note">Aktuell verfügbar: Englisch A1–C2 und Kroatisch A1–A2. Der Übersetzer unterstützt alle angebotenen Sprachen. Weitere strukturierte Lernpfade werden ergänzt.</small>
        <button className="onboarding-primary" onClick={()=>setStep(1)}>Weiter →</button>
      </section>}

      {step===1&&<section>
        <span className="eyebrow">SCHRITT 2 · DEIN ZIEL</span><h1>Wofür möchtest du {target.name} nutzen?</h1><p>Dein Ziel hilft VocabFast dabei, Übungen und Situationen sinnvoll zu priorisieren.</p>
        <div className="reason-grid">{reasons.map(item=><button key={item.id} className={reason===item.id?'selected':''} onClick={()=>setReason(item.id)}><span>{item.icon}</span><div><strong>{item.title}</strong><small>{item.copy}</small></div></button>)}</div>
        <div className="onboarding-actions"><button className="onboarding-back" onClick={()=>setStep(0)}>Zurück</button><button className="onboarding-primary" onClick={()=>setStep(2)}>Weiter →</button></div>
      </section>}

      {step===2&&<section>
        <span className="eyebrow">SCHRITT 3 · DEIN RHYTHMUS</span><h1>Wie viel Zeit passt gut in deinen Alltag?</h1><p>Wähle ein Tagesziel, das du realistisch oft erreichen kannst. Regelmäßigkeit ist wichtiger als lange Einzelsessions.</p>
        <div className="minutes-grid">{([5,10,15,20] as const).map(value=><button key={value} className={minutes===value?'selected':''} onClick={()=>setMinutes(value)}><strong>{value}</strong><span>Minuten</span><small>{value===5?'Locker':value===10?'Konstant':value===15?'Ambitioniert':'Intensiv'}</small></button>)}</div>
        <div className="onboarding-actions"><button className="onboarding-back" onClick={()=>setStep(1)}>Zurück</button><button className="onboarding-primary" onClick={()=>setStep(3)}>Weiter →</button></div>
      </section>}

      {step===3&&<section className="ready-step">
        <span className="eyebrow">SCHRITT 4 · DEIN STARTPUNKT</span>
        <h1>{name.trim() || 'Du'}, wo möchtest du einsteigen?</h1>
        <p>Der Einstufungstest ist freiwillig. Du kannst dein Level selbst wählen und den Test später jederzeit im Kurs nachholen.</p>
        {targetLanguage==='en'&&<div className="start-choice-grid">
          <button className={startMode==='manual'?'selected':''} onClick={()=>setStartMode('manual')}><span>01</span><div><strong>Level selbst wählen</strong><small>Sofort starten. Du kannst dein Level später jederzeit ändern.</small></div></button>
          <button className={startMode==='placement'?'selected':''} onClick={()=>setStartMode('placement')}><span>02</span><div><strong>Freiwilligen Einstufungstest machen</strong><small>Ca. 10–15 Minuten mit Grammatik, Wortschatz, Lesen und Situationen.</small></div></button>
        </div>}
        {(startMode==='manual'||targetLanguage!=='en')&&<div className="manual-level-panel"><div><strong>Mein Startlevel</strong><small>Wenn du unsicher bist, wähle lieber eine Stufe niedriger. Du kannst jederzeit wechseln.</small></div><div className="manual-level-grid">{availableLevels.map(level=><button key={level} className={manualLevel===level?'selected':''} onClick={()=>setManualLevel(level)}><strong>{level}</strong><span>{level==='A1'?'Anfänger':level==='A2'?'Grundlagen':level==='B1'?'Selbstständig':level==='B2'?'Sicher':level==='C1'?'Fortgeschritten':'Sehr sicher'}</span></button>)}</div></div>}
        <div className="ready-summary"><div><span>Ziel</span><strong>{reasons.find(item=>item.id===reason)?.title}</strong></div><div><span>Täglich</span><strong>{minutes} Minuten</strong></div><div><span>Start</span><strong>{startMode==='placement'&&targetLanguage==='en'?'Einstufungstest':manualLevel}</strong></div></div>
        <div className="onboarding-actions"><button className="onboarding-back" onClick={()=>setStep(2)}>Zurück</button><button className="onboarding-primary" onClick={finish}>{startMode==='placement'&&targetLanguage==='en'?'Test freiwillig starten →':`Mit ${manualLevel} starten →`}</button></div>
      </section>}
    </div>
  </div>;
}
