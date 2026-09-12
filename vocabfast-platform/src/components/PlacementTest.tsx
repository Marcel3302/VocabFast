import { useMemo, useState } from 'react';
import type { CefrLevel } from '../learning/curriculum';
import type { PlacementBreakdown } from '../learning/course-state';
import './placement-test.css';

type Area='grammar'|'vocabulary'|'communication';

type Question = {
  level:CefrLevel;
  area:Area;
  prompt:string;
  context?:string;
  choices:string[];
  answer:string;
};

type Props = {
  onClose:()=>void;
  onFinish:(level:CefrLevel,score:number,total:number,details:{breakdown:PlacementBreakdown;focus:string[]})=>void;
};

const questions:Question[] = [
  {level:'A1',area:'grammar',prompt:'Complete the sentence.',context:'My name ___ Anna.',choices:['is','am','are','be'],answer:'is'},
  {level:'A1',area:'grammar',prompt:'Complete the question.',context:'Where ___ you from?',choices:['are','do','is','did'],answer:'are'},
  {level:'A1',area:'vocabulary',prompt:'What does “receipt” mean in a shop?',choices:['Kassenbon','Rechnung','Rezept','Reservierung'],answer:'Kassenbon'},
  {level:'A1',area:'communication',prompt:'Choose the reply that fits best.',context:'“How are you?”',choices:["I'm fine, thanks. And you?","I'm twenty-five years old.",'It is at home.','Yes, I do.'],answer:"I'm fine, thanks. And you?"},
  {level:'A1',area:'vocabulary',prompt:'Choose the word that completes the sentence.',context:'I usually ___ breakfast at seven.',choices:['have','go','take','do'],answer:'have'},
  {level:'A1',area:'communication',prompt:'Complete the question you would ask for directions.',context:'Excuse me, ___ is the station?',choices:['where','when','who','why'],answer:'where'},

  {level:'A2',area:'grammar',prompt:'Choose the form that fits the time expression.',context:'I have lived here ___ 2024.',choices:['since','for','from','during'],answer:'since'},
  {level:'A2',area:'grammar',prompt:'Choose the best form.',context:'When I arrived, they ___ dinner.',choices:['were having','had','are having','have'],answer:'were having'},
  {level:'A2',area:'vocabulary',prompt:'Choose the correct verb.',context:'Can I ___ your charger for a minute?',choices:['borrow','lend','bring','owe'],answer:'borrow'},
  {level:'A2',area:'communication',prompt:'Which request is most suitable at a hotel?',context:'Your room is very noisy and you want another one.',choices:['Could I change to a quieter room, please?','Could you change the noise from my room?','I would change my room because it is quiet.','May the room become another one?'],answer:'Could I change to a quieter room, please?'},
  {level:'A2',area:'vocabulary',prompt:'What does “refund” mean?',choices:['Rückerstattung','Anzahlung','Reservierung','Lieferung'],answer:'Rückerstattung'},
  {level:'A2',area:'communication',prompt:'Choose the sentence that makes a clear arrangement.',context:'You want to meet a colleague at 18:00.',choices:["Would six o'clock work for you?","Do you work until six o'clock?","Would you work at six o'clock?","Could six o'clock be your work?"],answer:"Would six o'clock work for you?"},

  {level:'B1',area:'grammar',prompt:'Choose the connector that fits the sentence.',context:'___ the idea is expensive, it could save time later.',choices:['Although','Despite','Because','Unless'],answer:'Although'},
  {level:'B1',area:'grammar',prompt:'Choose the sentence that expresses hypothetical advice.',choices:['If I were you, I would ask first.','If I was you, I will ask first.','If I am you, I would ask first.','If I had been you, I ask first.'],answer:'If I were you, I would ask first.'},
  {level:'B1',area:'vocabulary',prompt:'Choose the verb that collocates naturally.',context:'We need to ___ the problem before Friday.',choices:['solve','settle out','answer','repair'],answer:'solve'},
  {level:'B1',area:'communication',prompt:'Choose the most accurate reported statement.',context:'Yesterday she said: “The meeting has been moved.”',choices:['She said that the meeting had been moved.','She said that the meeting has moved.','She told that the meeting had moved.','She said the meeting would have moved.'],answer:'She said that the meeting had been moved.'},
  {level:'B1',area:'vocabulary',prompt:'Which word best fits the sentence?',context:'We have to finish the report before the ___.',choices:['deadline','schedule','appointment','occasion'],answer:'deadline'},
  {level:'B1',area:'communication',prompt:'Which sentence is the clearest presentation signpost?',choices:['Now I would like to move on to the next point.','Now I would like the next point to move on.','Now I am moving the next point forward.','Now the next point would like to continue.'],answer:'Now I would like to move on to the next point.'},

  {level:'B2',area:'grammar',prompt:'Complete the unreal past condition.',context:'If we had known earlier, we ___ differently.',choices:['would have acted','would act','had acted','would be acting'],answer:'would have acted'},
  {level:'B2',area:'grammar',prompt:'Choose the form that is both polite and grammatically natural.',context:'I would appreciate it if you ___ the details by Friday.',choices:['could confirm','can confirm','would have confirmed','must confirm'],answer:'could confirm'},
  {level:'B2',area:'vocabulary',prompt:'Choose the phrase that describes a trend becoming stable.',context:'After a sharp increase, demand ___.',choices:['levelled off','dropped out','broke even','held back'],answer:'levelled off'},
  {level:'B2',area:'communication',prompt:'Choose the best professional wording.',context:'You agree with part of a proposal but want to express a reservation.',choices:['I agree with the overall direction, although I have some concerns about the timeline.','I agree with the proposal, so I have concerns about the timeline.','I accept the proposal despite I have concerns about the timeline.','I agree the proposal while the timeline concerns me completely.'],answer:'I agree with the overall direction, although I have some concerns about the timeline.'},
  {level:'B2',area:'vocabulary',prompt:'Choose the closest meaning of “drawback”.',context:'The main drawback is the initial cost.',choices:['disadvantage','requirement','consequence','uncertainty'],answer:'disadvantage'},
  {level:'B2',area:'communication',prompt:'Which sentence acknowledges a counterargument without accepting it completely?',choices:['That is a fair point, but the evidence still seems too limited to support the conclusion.','That is a fair point, therefore the conclusion must be correct.','That point is fair, unless the evidence is limited.','That is a fair conclusion, although the evidence proves it.'],answer:'That is a fair point, but the evidence still seems too limited to support the conclusion.'},

  {level:'C1',area:'grammar',prompt:'Choose the formal conditional structure.',context:'___ demand continue to fall, we would need to reconsider our assumptions.',choices:['Should','Would','Were','Had'],answer:'Should'},
  {level:'C1',area:'grammar',prompt:'Choose the inversion that is grammatically correct.',context:'Rarely ___ such a rapid change in consumer behaviour.',choices:['have we seen','we have seen','did we have seen','we saw'],answer:'have we seen'},
  {level:'C1',area:'vocabulary',prompt:'Choose the word that best completes the collocation.',context:'The report raises ___ concerns about the reliability of the data.',choices:['serious','heavy','strongly','deeply'],answer:'serious'},
  {level:'C1',area:'communication',prompt:'Which sentence expresses a nuanced disagreement most effectively?',choices:['I can see the merit of the proposal, but I am not convinced it addresses the underlying issue.','I appreciate the proposal, yet I disagree with every part of its underlying issue.','The proposal has merit, whereas it therefore fails to solve the issue.','I can understand the proposal, although this makes the issue incorrect.'],answer:'I can see the merit of the proposal, but I am not convinced it addresses the underlying issue.'},
  {level:'C1',area:'vocabulary',prompt:'Choose the closest meaning of “reluctantly”.',choices:['unwillingly','uncertainly','indirectly','carelessly'],answer:'unwillingly'},
  {level:'C1',area:'communication',prompt:'Which sentence best synthesises two sources without overstating them?',choices:['Taken together, the findings suggest a common trend, though the studies offer different explanations for it.','Taken together, both studies prove the same cause from different results.','Both studies are similar, so their explanations must also be the same.','The findings are common because the two sources discuss the same subject.'],answer:'Taken together, the findings suggest a common trend, though the studies offer different explanations for it.'},

  {level:'C2',area:'grammar',prompt:'Choose the form that completes the inversion.',context:'Not until the final figures were released ___ how misleading the estimate had been.',choices:['did we realise','we realised','had we realised','we had realised'],answer:'did we realise'},
  {level:'C2',area:'grammar',prompt:'Choose the most idiomatic concessive structure.',context:'___ the concerns may be, they do not invalidate the central argument.',choices:['Valid though','However valid','As valid as','Valid although'],answer:'Valid though'},
  {level:'C2',area:'vocabulary',prompt:'Choose the verb that best completes the academic collocation.',context:'The report stops short of ___ a direct causal link.',choices:['asserting','assuring','assigning','assuming'],answer:'asserting'},
  {level:'C2',area:'communication',prompt:'Which formulation is appropriately cautious about the evidence?',choices:['The findings are consistent with an association, but they do not in themselves establish causality.','The findings demonstrate an association and therefore make causality highly likely.','The findings appear associated, which is effectively the same as demonstrating causality.','The findings cannot establish causality, so no association can reasonably be inferred.'],answer:'The findings are consistent with an association, but they do not in themselves establish causality.'},
  {level:'C2',area:'vocabulary',prompt:'What does “equivocal” most nearly mean in this context?',context:'The evidence remains equivocal.',choices:['ambiguous','equivalent','unequal','unbiased'],answer:'ambiguous'},
  {level:'C2',area:'communication',prompt:'Choose the recommendation that is precise, restrained and executive in tone.',context:'The evidence is incomplete and the rollout would be difficult to reverse.',choices:['On balance, I would defer the rollout until the underlying assumptions have been tested more rigorously.','I would cancel the rollout because incomplete evidence makes the proposal fundamentally unsound.','The rollout should probably wait, although it may also be reasonable to proceed immediately.','Given the evidence, the only responsible option is to reject the rollout outright.'],answer:'On balance, I would defer the rollout until the underlying assumptions have been tested more rigorously.'}
];

const levels:CefrLevel[]=['A1','A2','B1','B2','C1','C2'];
const promotionThreshold:Record<CefrLevel,number>={A1:4,A2:4,B1:5,B2:5,C1:5,C2:5};

const levelCopy:Record<CefrLevel,{title:string;text:string}>={
  A1:{title:'A1 · Grundlagen',text:'Baue zuerst ein sicheres Fundament aus Wortstellung, Alltagswortschatz und einfachen Gesprächen auf.'},
  A2:{title:'A2 · Alltag',text:'Die Grundlagen sitzen. Jetzt lohnt sich mehr Selbstständigkeit in Reise-, Service- und Alltagssituationen.'},
  B1:{title:'B1 · Selbstständig',text:'Du kannst schon viel. Der nächste Schritt ist zusammenhängendes Erzählen, Begründen und Problemlösen.'},
  B2:{title:'B2 · Sicher & präzise',text:'Du bist im soliden fortgeschrittenen Bereich. Fokus: Präzision, Register, Argumentation und komplexere Strukturen.'},
  C1:{title:'C1 · Fortgeschritten',text:'Dein Englisch ist stark. Arbeite jetzt an Nuance, impliziter Bedeutung, Synthese und professioneller Wirkung.'},
  C2:{title:'C2 · Feinschliff',text:'Du bewegst dich auf sehr hohem Niveau. Der Fokus liegt auf stilistischer Kontrolle, feinen Bedeutungsunterschieden und Registerwechsel.'}
};

const areaLabels:Record<Area,string>={grammar:'Grammatik & Strukturen',vocabulary:'Wortschatz & Kollokationen',communication:'Kommunikation & Präzision'};

function shuffle<T>(items:T[]):T[] {
  const copy=[...items];
  for(let i=copy.length-1;i>0;i-=1) {
    const j=Math.floor(Math.random()*(i+1));
    [copy[i],copy[j]]=[copy[j],copy[i]];
  }
  return copy;
}

function levelScores(testQuestions:Question[],answers:Record<number,string>) {
  const scores:Record<CefrLevel,number>={A1:0,A2:0,B1:0,B2:0,C1:0,C2:0};
  testQuestions.forEach((question,index)=>{if(answers[index]===question.answer)scores[question.level]+=1;});
  return scores;
}

function recommendation(testQuestions:Question[],answers:Record<number,string>):CefrLevel {
  const scores=levelScores(testQuestions,answers);
  if(scores.A1<promotionThreshold.A1)return 'A1';
  if(scores.A2<promotionThreshold.A2)return 'A2';
  if(scores.B1<promotionThreshold.B1)return 'B1';
  if(scores.B2<promotionThreshold.B2)return 'B2';
  if(scores.C1<promotionThreshold.C1)return 'C1';
  return scores.C2>=promotionThreshold.C2?'C2':'C1';
}

function breakdown(testQuestions:Question[],answers:Record<number,string>):PlacementBreakdown {
  const result:PlacementBreakdown={grammar:{score:0,total:0},vocabulary:{score:0,total:0},communication:{score:0,total:0}};
  testQuestions.forEach((question,index)=>{
    result[question.area].total+=1;
    if(answers[index]===question.answer)result[question.area].score+=1;
  });
  return result;
}

function focusFor(result:PlacementBreakdown,level:CefrLevel) {
  const areas=(Object.keys(result) as Area[]).map(area=>({area,ratio:result[area].total?result[area].score/result[area].total:0})).sort((a,b)=>a.ratio-b.ratio);
  const focus:string[]=[];
  for(const item of areas.slice(0,2)) {
    if(item.area==='grammar')focus.push('Zeitformen, Satzbau und Verknüpfungen gezielt festigen.');
    if(item.area==='vocabulary')focus.push('Aktiven Wortschatz und natürliche Kollokationen systematisch ausbauen.');
    if(item.area==='communication')focus.push('Mehr freie Produktion, Register und natürliche Formulierungen trainieren.');
  }
  if(level==='A1'||level==='A2')focus.push('Kurze tägliche Hör- und Sprechübungen bringen jetzt besonders viel.');
  else if(level==='B1'||level==='B2')focus.push('Meinungen, Erfahrungen und berufliche Situationen in längeren Antworten üben.');
  else focus.push('Nuance, implizite Bedeutung und stilistische Kontrolle bewusst trainieren.');
  return focus.slice(0,3);
}

export default function PlacementTest({onClose,onFinish}:Props) {
  const [started,setStarted]=useState(false);
  const [index,setIndex]=useState(0);
  const [answers,setAnswers]=useState<Record<number,string>>({});
  const [finished,setFinished]=useState(false);
  const [attempt,setAttempt]=useState(0);
  const testQuestions=useMemo(()=>questions.map(question=>({...question,choices:shuffle(question.choices)})),[attempt]);
  const question=testQuestions[index];
  const selected=answers[index]??'';
  const score=useMemo(()=>testQuestions.reduce((sum,item,i)=>sum+(answers[i]===item.answer?1:0),0),[answers,testQuestions]);
  const levelProfile=useMemo(()=>levelScores(testQuestions,answers),[answers,testQuestions]);
  const recommended=useMemo(()=>recommendation(testQuestions,answers),[answers,testQuestions]);
  const resultBreakdown=useMemo(()=>breakdown(testQuestions,answers),[answers,testQuestions]);
  const focus=useMemo(()=>focusFor(resultBreakdown,recommended),[resultBreakdown,recommended]);
  const progress=finished?100:Math.round(((index+(selected?1:0))/testQuestions.length)*100);

  function next() {
    if(!selected)return;
    if(index>=testQuestions.length-1){setFinished(true);return;}
    setIndex(value=>value+1);
  }

  function restart() {
    setAnswers({});setIndex(0);setFinished(false);setStarted(false);setAttempt(value=>value+1);
  }

  if(!started)return <div className="placement-backdrop" role="dialog" aria-modal="true" aria-labelledby="placementIntroTitle"><section className="placement-card result placement-intro"><button className="placement-close" onClick={onClose} aria-label="Einstufung schließen">×</button><span className="placement-kicker">PERSÖNLICHE EINSTUFUNG</span><div className="placement-result-badge intro">36</div><h1 id="placementIntroTitle">Finde den sinnvollsten Startpunkt.</h1><p>36 Fragen prüfen Grammatik, Wortschatz und kommunikative Präzision. Die Antwortpositionen werden gemischt und die höheren Stufen verwenden bewusst ähnlich plausible Optionen, damit Raten und offensichtliche Muster die Einstufung möglichst wenig verzerren.</p><div className="placement-note">Dauer: ungefähr 8–12 Minuten. Antworte nach Gefühl und ohne nachzuschlagen. Während des Tests wird die geprüfte CEFR-Stufe nicht angezeigt. Die Auswertung ist eine VocabFast-Lernempfehlung und kein offizieller CEFR-Sprachnachweis.</div><button className="placement-primary placement-big-start" onClick={()=>setStarted(true)}>36 Fragen starten →</button></section></div>;

  if(finished) {
    const copy=levelCopy[recommended];
    return <div className="placement-backdrop" role="dialog" aria-modal="true" aria-labelledby="placementResultTitle"><section className="placement-card result"><button className="placement-close" onClick={onClose} aria-label="Einstufung schließen">×</button><span className="placement-kicker">DEINE LERNEMPFEHLUNG</span><div className="placement-result-badge">{recommended}</div><h1 id="placementResultTitle">{copy.title}</h1><p>{copy.text}</p><div className="placement-score"><strong>{score}/{testQuestions.length}</strong><span>Aufgaben richtig · Rohwert</span></div><div className="placement-level-profile" aria-label="Niveauprofil">{levels.map(level=><div key={level}><span>{level}</span><strong>{levelProfile[level]}/6</strong><i><b style={{width:`${Math.round(levelProfile[level]/6*100)}%`}}/></i></div>)}</div><div className="placement-breakdown">{(Object.keys(resultBreakdown) as Area[]).map(area=>{const item=resultBreakdown[area];const percent=item.total?Math.round(item.score/item.total*100):0;return <div key={area}><span><strong>{areaLabels[area]}</strong><small>{item.score}/{item.total} · {percent}%</small></span><div><i style={{width:`${percent}%`}}/></div></div>;})}</div><div className="placement-focus"><span>DEINE NÄCHSTEN SCHWERPUNKTE</span>{focus.map(item=><p key={item}>✓ {item}</p>)}</div><div className="placement-note">Für B1 bis C2 reicht eine knappe Mehrheit nicht mehr zum Hochstufen. C2 wird nur empfohlen, wenn auch die C1- und C2-Blöcke jeweils sehr stark gelöst wurden. Die Empfehlung ist bewusst eher konservativ.</div><div className="placement-actions"><button className="placement-secondary" onClick={restart}>Neu testen</button><button className="placement-primary" onClick={()=>onFinish(recommended,score,testQuestions.length,{breakdown:resultBreakdown,focus})}>Mit {recommended} starten →</button></div></section></div>;
  }

  return <div className="placement-backdrop" role="dialog" aria-modal="true" aria-labelledby="placementQuestionTitle"><section className="placement-card"><header className="placement-head"><button className="placement-close" onClick={onClose} aria-label="Einstufung schließen">×</button><div className="placement-progress"><span style={{width:`${progress}%`}}/></div><strong>{index+1}/{testQuestions.length}</strong></header><div className="placement-body"><div className="placement-level"><span>{areaLabels[question.area]}</span></div><span className="placement-kicker">EINSTUFUNGSTEST</span><h1 id="placementQuestionTitle">{question.prompt}</h1>{question.context&&<p className="placement-context">{question.context}</p>}<div className="placement-choices">{question.choices.map((choice,choiceIndex)=><button key={choice} className={selected===choice?'selected':''} onClick={()=>setAnswers(current=>({...current,[index]:choice}))}><span>{String.fromCharCode(65+choiceIndex)}</span><strong>{choice}</strong></button>)}</div></div><footer className="placement-footer"><span>{areaLabels[question.area]}</span><button className="placement-primary" disabled={!selected} onClick={next}>{index===testQuestions.length-1?'Auswerten':'Weiter →'}</button></footer></section></div>;
}
