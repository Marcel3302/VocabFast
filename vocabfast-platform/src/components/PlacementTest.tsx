import { useMemo, useState } from 'react';
import type { CefrLevel } from '../learning/curriculum';
import './placement-test.css';

type Question = {
  level: CefrLevel;
  prompt: string;
  context?: string;
  choices: string[];
  answer: string;
};

type Props = {
  onClose: () => void;
  onFinish: (level: CefrLevel, score: number, total: number) => void;
};

const questions: Question[] = [
  { level:'A1', prompt:'Choose the correct sentence.', context:'Du stellst dich vor.', choices:['I am Anna.','I Anna am.','I is Anna.','Me am Anna.'], answer:'I am Anna.' },
  { level:'A1', prompt:'Complete the question.', context:'Where ___ you from?', choices:['are','is','am','be'], answer:'are' },
  { level:'A2', prompt:'Choose the best form.', context:'I ___ my grandparents last weekend.', choices:['visited','have visit','visiting','am visited'], answer:'visited' },
  { level:'A2', prompt:'Which sentence is most natural?', context:'Du bittest im Hotel höflich um Hilfe.', choices:['Could you send someone to check it?','You send someone now.','Someone checking this.','Send maybe person.'], answer:'Could you send someone to check it?' },
  { level:'B1', prompt:'Choose the best connector.', context:'___ the idea is expensive, it could save time later.', choices:['Although','During','Unless to','Because of that it'], answer:'Although' },
  { level:'B1', prompt:'Choose the correct hypothetical advice.', context:'Ein Rat an einen Kollegen.', choices:['If I were you, I would ask first.','If I am you, I ask first.','If I was you, I will asking.','Were I you, I ask yesterday.'], answer:'If I were you, I would ask first.' },
  { level:'B2', prompt:'Choose the most professional wording.', context:'Du willst eine Frist höflich bestätigen lassen.', choices:['I would appreciate it if you could confirm the deadline.','You must confirm deadline now.','I want deadline confirmation from you.','Confirm the deadline, thanks maybe.'], answer:'I would appreciate it if you could confirm the deadline.' },
  { level:'B2', prompt:'Complete the unreal past condition.', context:'If we had known earlier, we would have ___ differently.', choices:['acted','act','acting','acts'], answer:'acted' },
  { level:'C1', prompt:'Choose the most nuanced disagreement.', context:'Du widersprichst in einer strategischen Besprechung.', choices:['I can see the merit of the proposal, but I am not convinced it addresses the underlying issue.','This proposal is wrong.','I do not like it because no.','The proposal cannot and that is all.'], answer:'I can see the merit of the proposal, but I am not convinced it addresses the underlying issue.' },
  { level:'C1', prompt:'Choose the best formal conditional.', context:'___ demand continue to fall, we would need to reconsider our assumptions.', choices:['Should','Would','Did','Having'], answer:'Should' }
];

function recommendation(score: number): CefrLevel {
  if (score <= 2) return 'A1';
  if (score <= 4) return 'A2';
  if (score <= 6) return 'B1';
  if (score <= 8) return 'B2';
  return 'C1';
}

const levelCopy: Record<CefrLevel, { title:string; text:string }> = {
  A1:{title:'A1 · Grundlagen',text:'Starte mit dem Fundament und baue sichere kurze Sätze auf.'},
  A2:{title:'A2 · Alltag',text:'Du hast Grundlagen und kannst direkt in selbstständigere Alltagssituationen einsteigen.'},
  B1:{title:'B1 · Selbstständig',text:'Du kannst bereits viel verstehen und solltest jetzt zusammenhängender argumentieren und erzählen.'},
  B2:{title:'B2 · Sicher & präzise',text:'Dein nächster Schwerpunkt ist differenzierter Ausdruck in Beruf, Reisen und komplexeren Diskussionen.'},
  C1:{title:'C1 · Fortgeschritten',text:'Du zeigst sehr starke Grundlagen. Im C1-Bereich geht es vor allem um Nuance, Register und Wirkung.'}
};

export default function PlacementTest({ onClose, onFinish }: Props) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number,string>>({});
  const [finished, setFinished] = useState(false);
  const question = questions[index];
  const selected = answers[index] ?? '';
  const score = useMemo(()=>questions.reduce((sum,item,i)=>sum+(answers[i]===item.answer?1:0),0),[answers]);
  const recommended = recommendation(score);
  const progress = finished ? 100 : Math.round(((index + (selected ? 1 : 0)) / questions.length) * 100);

  function next() {
    if (!selected) return;
    if (index >= questions.length - 1) {
      setFinished(true);
      return;
    }
    setIndex(value=>value+1);
  }

  if (finished) {
    const copy = levelCopy[recommended];
    return <div className="placement-backdrop" role="dialog" aria-modal="true" aria-labelledby="placementResultTitle">
      <section className="placement-card result">
        <button className="placement-close" onClick={onClose} aria-label="Einstufung schließen">×</button>
        <span className="placement-kicker">SCHNELLE EINSTUFUNG</span>
        <div className="placement-result-badge">{recommended}</div>
        <h1 id="placementResultTitle">{copy.title}</h1>
        <p>{copy.text}</p>
        <div className="placement-score"><strong>{score}/{questions.length}</strong><span>Aufgaben richtig</span></div>
        <div className="placement-note">Diese Schnell-Einstufung ist eine Lernempfehlung und kein offizieller CEFR-Sprachnachweis. Der spätere Produktions-Test wird umfangreicher und kompetenzbasiert.</div>
        <div className="placement-actions"><button className="placement-secondary" onClick={()=>{setAnswers({});setIndex(0);setFinished(false);}}>Nochmal testen</button><button className="placement-primary" onClick={()=>onFinish(recommended,score,questions.length)}>Mit {recommended} starten →</button></div>
      </section>
    </div>;
  }

  return <div className="placement-backdrop" role="dialog" aria-modal="true" aria-labelledby="placementQuestionTitle">
    <section className="placement-card">
      <header className="placement-head">
        <button className="placement-close" onClick={onClose} aria-label="Einstufung schließen">×</button>
        <div className="placement-progress"><span style={{width:`${progress}%`}}/></div>
        <strong>{index+1}/{questions.length}</strong>
      </header>
      <div className="placement-body">
        <div className="placement-level"><span>{question.level}</span><small>Orientierungsfrage</small></div>
        <span className="placement-kicker">EINSTUFUNGSTEST</span>
        <h1 id="placementQuestionTitle">{question.prompt}</h1>
        {question.context&&<p className="placement-context">{question.context}</p>}
        <div className="placement-choices">{question.choices.map((choice,choiceIndex)=><button key={choice} className={selected===choice?'selected':''} onClick={()=>setAnswers(current=>({...current,[index]:choice}))}><span>{String.fromCharCode(65+choiceIndex)}</span><strong>{choice}</strong></button>)}</div>
      </div>
      <footer className="placement-footer"><span>Beantworte nach Gefühl – nicht nachschlagen.</span><button className="placement-primary" disabled={!selected} onClick={next}>{index===questions.length-1?'Auswerten':'Weiter →'}</button></footer>
    </section>
  </div>;
}
