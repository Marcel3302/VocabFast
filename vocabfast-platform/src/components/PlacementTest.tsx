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
  {level:'A1',area:'grammar',prompt:'Choose the correct sentence.',context:'Du stellst dich vor.',choices:['I am Anna.','I Anna am.','I is Anna.','Me am Anna.'],answer:'I am Anna.'},
  {level:'A1',area:'grammar',prompt:'Complete the question.',context:'Where ___ you from?',choices:['are','is','am','be'],answer:'are'},
  {level:'A1',area:'vocabulary',prompt:'What does “receipt” mean?',choices:['Kassenbon','Rezept','Reise','Zimmer'],answer:'Kassenbon'},
  {level:'A1',area:'communication',prompt:'What is the most natural reply?',context:'“Nice to meet you.”',choices:['Nice to meet you too.','I meet nice.','Yes, meeting.','No meet.'],answer:'Nice to meet you too.'},
  {level:'A1',area:'vocabulary',prompt:'Choose the correct word.',context:'I drink ___ in the morning.',choices:['coffee','airport','ticket','bedroom'],answer:'coffee'},
  {level:'A1',area:'communication',prompt:'How do you ask politely for water?',choices:['Could I have some water, please?','Water give me.','I water now.','You have water me?'],answer:'Could I have some water, please?'},

  {level:'A2',area:'grammar',prompt:'Choose the correct past form.',context:'I ___ my grandparents last weekend.',choices:['visited','have visit','visiting','am visited'],answer:'visited'},
  {level:'A2',area:'grammar',prompt:'Choose the correct conditional.',context:'If the train is late, I ___ take the bus.',choices:['will','would','have','am'],answer:'will'},
  {level:'A2',area:'vocabulary',prompt:'Which word fits a hotel problem?',context:'The air conditioning is not ___.',choices:['working','travelling','ordering','arriving'],answer:'working'},
  {level:'A2',area:'communication',prompt:'Which sentence is most natural?',context:'Du bittest im Hotel höflich um Hilfe.',choices:['Could you send someone to check it?','You send someone now.','Someone checking this.','Send maybe person.'],answer:'Could you send someone to check it?'},
  {level:'A2',area:'vocabulary',prompt:'What is a “refund”?',choices:['Rückerstattung','Reservierung','Rechnung','Umleitung'],answer:'Rückerstattung'},
  {level:'A2',area:'communication',prompt:'Choose the best way to make an arrangement.',choices:['Would six o’clock work for you?','Six works you?','At six you come yes?','You six available maybe.'],answer:'Would six o’clock work for you?'},

  {level:'B1',area:'grammar',prompt:'Choose the best connector.',context:'___ the idea is expensive, it could save time later.',choices:['Although','During','Unless to','Because of that it'],answer:'Although'},
  {level:'B1',area:'grammar',prompt:'Choose the correct hypothetical advice.',choices:['If I were you, I would ask first.','If I am you, I ask first.','If I was you, I will asking.','Were I you, I ask yesterday.'],answer:'If I were you, I would ask first.'},
  {level:'B1',area:'vocabulary',prompt:'Choose the best verb.',context:'We need to ___ the problem before Friday.',choices:['solve','borrow','attend','avoid from'],answer:'solve'},
  {level:'B1',area:'communication',prompt:'Which sentence reports what someone said?',choices:['She said that the meeting had been moved.','She says meeting move yesterday now.','Meeting said she moved.','She told that move meeting.'],answer:'She said that the meeting had been moved.'},
  {level:'B1',area:'vocabulary',prompt:'What does “deadline” mean?',choices:['Frist','Vorschlag','Fortschritt','Lieferant'],answer:'Frist'},
  {level:'B1',area:'communication',prompt:'Choose the best presentation signpost.',choices:['Now I would like to move on to the next point.','Now next point I moving.','I go point next.','Next is now because.'],answer:'Now I would like to move on to the next point.'},

  {level:'B2',area:'grammar',prompt:'Complete the unreal past condition.',context:'If we had known earlier, we would have ___ differently.',choices:['acted','act','acting','acts'],answer:'acted'},
  {level:'B2',area:'grammar',prompt:'Choose the best form.',context:'I would appreciate it if you ___ confirm the details.',choices:['could','can to','will to','must to'],answer:'could'},
  {level:'B2',area:'vocabulary',prompt:'Choose the best trend phrase.',context:'After a sharp increase, demand ___.',choices:['levelled off','put away','came over','made out'],answer:'levelled off'},
  {level:'B2',area:'communication',prompt:'Choose the most professional wording.',context:'Du willst eine Frist höflich bestätigen lassen.',choices:['I would appreciate it if you could confirm the deadline.','You must confirm deadline now.','I want deadline confirmation from you.','Confirm the deadline, thanks maybe.'],answer:'I would appreciate it if you could confirm the deadline.'},
  {level:'B2',area:'vocabulary',prompt:'What does “drawback” mean in this context?',context:'The main drawback is the initial cost.',choices:['Nachteil','Nachfrage','Schlussfolgerung','Voraussetzung'],answer:'Nachteil'},
  {level:'B2',area:'communication',prompt:'Which sentence best acknowledges a counterargument?',choices:['The evidence is useful, but it does not fully support the conclusion.','Evidence good, conclusion done.','I ignore the other argument.','The conclusion is because evidence.'],answer:'The evidence is useful, but it does not fully support the conclusion.'},

  {level:'C1',area:'grammar',prompt:'Choose the best formal conditional.',context:'___ demand continue to fall, we would need to reconsider our assumptions.',choices:['Should','Would','Did','Having'],answer:'Should'},
  {level:'C1',area:'grammar',prompt:'Choose the correct emphasis.',context:'What ___ is the long-term value, not just the immediate saving.',choices:['matters','matter','mattering','is matter'],answer:'matters'},
  {level:'C1',area:'vocabulary',prompt:'Choose the closest meaning of “underlying issue”.',choices:['zugrunde liegendes Problem','sichtbarer Vorteil','kurzfristige Frist','zufällige Lösung'],answer:'zugrunde liegendes Problem'},
  {level:'C1',area:'communication',prompt:'Choose the most nuanced disagreement.',choices:['I can see the merit of the proposal, but I am not convinced it addresses the underlying issue.','This proposal is wrong.','I do not like it because no.','The proposal cannot and that is all.'],answer:'I can see the merit of the proposal, but I am not convinced it addresses the underlying issue.'},
  {level:'C1',area:'vocabulary',prompt:'What does “reluctantly” mean?',choices:['widerwillig','eindeutig','vorschnell','beiläufig'],answer:'widerwillig'},
  {level:'C1',area:'communication',prompt:'Which sentence best synthesises two sources?',choices:['Taken together, the findings suggest a common trend, but not the same explanation.','Source one and source two are there.','Both texts say things separately.','The sources are equal because yes.'],answer:'Taken together, the findings suggest a common trend, but not the same explanation.'},

  {level:'C2',area:'grammar',prompt:'Complete the inversion.',context:'Only then ___ the scale of the problem become apparent.',choices:['did','was','had','does'],answer:'did'},
  {level:'C2',area:'grammar',prompt:'Choose the most controlled concession.',context:'Valid ___ the concerns may be, they do not change the conclusion.',choices:['though','because','unless','therefore'],answer:'though'},
  {level:'C2',area:'vocabulary',prompt:'Choose the strongest natural collocation.',context:'The proposal ___ substantial risks.',choices:['carries','takes','holds on','brings up with'],answer:'carries'},
  {level:'C2',area:'communication',prompt:'Choose the most precise academic qualification.',choices:['The findings point to an association, but do not in themselves establish causality.','The results prove everything.','There is correlation so there is causation.','The results are kind of linked somehow.'],answer:'The findings point to an association, but do not in themselves establish causality.'},
  {level:'C2',area:'vocabulary',prompt:'What does “warrants careful scrutiny” mean?',choices:['erfordert sorgfältige Prüfung','garantiert Zustimmung','verhindert jede Analyse','beschleunigt automatisch'],answer:'erfordert sorgfältige Prüfung'},
  {level:'C2',area:'communication',prompt:'Choose the best executive-level recommendation.',choices:['Proceeding with the rollout would be premature until the underlying assumptions have been reassessed.','Do not launch because I said so.','We maybe wait because things.','Launch is bad and no more.'],answer:'Proceeding with the rollout would be premature until the underlying assumptions have been reassessed.'}
];

const levels:CefrLevel[]=['A1','A2','B1','B2','C1','C2'];

const levelCopy:Record<CefrLevel,{title:string;text:string}>={
  A1:{title:'A1 · Grundlagen',text:'Baue zuerst ein sicheres Fundament aus Wortstellung, Alltagswortschatz und einfachen Gesprächen auf.'},
  A2:{title:'A2 · Alltag',text:'Die Grundlagen sitzen. Jetzt lohnt sich mehr Selbstständigkeit in Reise-, Service- und Alltagssituationen.'},
  B1:{title:'B1 · Selbstständig',text:'Du kannst schon viel. Der nächste Schritt ist zusammenhängendes Erzählen, Begründen und Problemlösen.'},
  B2:{title:'B2 · Sicher & präzise',text:'Du bist im soliden fortgeschrittenen Bereich. Fokus: Präzision, Register, Argumentation und komplexere Zeitformen.'},
  C1:{title:'C1 · Fortgeschritten',text:'Dein Englisch ist stark. Arbeite jetzt an Nuance, impliziter Bedeutung, Synthese und professioneller Wirkung.'},
  C2:{title:'C2 · Feinschliff',text:'Du bewegst dich auf sehr hohem Niveau. Der Fokus liegt auf stilistischer Kontrolle, feinen Bedeutungsunterschieden und Registerwechsel.'}
};

const areaLabels:Record<Area,string>={grammar:'Grammatik & Strukturen',vocabulary:'Wortschatz & Kollokationen',communication:'Kommunikation & Präzision'};

function levelScores(answers:Record<number,string>) {
  const scores:Record<CefrLevel,number>={A1:0,A2:0,B1:0,B2:0,C1:0,C2:0};
  questions.forEach((question,index)=>{if(answers[index]===question.answer)scores[question.level]+=1;});
  return scores;
}

function recommendation(answers:Record<number,string>):CefrLevel {
  const scores=levelScores(answers);
  let recommended:CefrLevel='A1';
  for(let index=0;index<levels.length-1;index+=1) {
    const level=levels[index];
    if(scores[level]>=4)recommended=levels[index+1];
    else break;
  }
  return recommended;
}

function breakdown(answers:Record<number,string>):PlacementBreakdown {
  const result:PlacementBreakdown={grammar:{score:0,total:0},vocabulary:{score:0,total:0},communication:{score:0,total:0}};
  questions.forEach((question,index)=>{
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
  const question=questions[index];
  const selected=answers[index]??'';
  const score=useMemo(()=>questions.reduce((sum,item,i)=>sum+(answers[i]===item.answer?1:0),0),[answers]);
  const recommended=useMemo(()=>recommendation(answers),[answers]);
  const resultBreakdown=useMemo(()=>breakdown(answers),[answers]);
  const focus=useMemo(()=>focusFor(resultBreakdown,recommended),[resultBreakdown,recommended]);
  const progress=finished?100:Math.round(((index+(selected?1:0))/questions.length)*100);

  function next() {
    if(!selected)return;
    if(index>=questions.length-1){setFinished(true);return;}
    setIndex(value=>value+1);
  }

  if(!started)return <div className="placement-backdrop" role="dialog" aria-modal="true" aria-labelledby="placementIntroTitle"><section className="placement-card result placement-intro"><button className="placement-close" onClick={onClose} aria-label="Einstufung schließen">×</button><span className="placement-kicker">PERSÖNLICHE EINSTUFUNG</span><div className="placement-result-badge intro">36</div><h1 id="placementIntroTitle">Finde den sinnvollsten Startpunkt.</h1><p>36 kurze Fragen prüfen Grammatik, Wortschatz und kommunikative Präzision von A1 bis C2. Danach bekommst du eine ungefähre CEFR-Empfehlung und konkrete Schwerpunkte für dein Training.</p><div className="placement-note">Dauer: ungefähr 8–12 Minuten. Antworte nach Gefühl und ohne nachzuschlagen. Die Auswertung ist eine VocabFast-Lernempfehlung und kein offizieller CEFR-Sprachnachweis.</div><button className="placement-primary placement-big-start" onClick={()=>setStarted(true)}>36 Fragen starten →</button></section></div>;

  if(finished) {
    const copy=levelCopy[recommended];
    return <div className="placement-backdrop" role="dialog" aria-modal="true" aria-labelledby="placementResultTitle"><section className="placement-card result"><button className="placement-close" onClick={onClose} aria-label="Einstufung schließen">×</button><span className="placement-kicker">DEINE LERNEMPFEHLUNG</span><div className="placement-result-badge">{recommended}</div><h1 id="placementResultTitle">{copy.title}</h1><p>{copy.text}</p><div className="placement-score"><strong>{score}/{questions.length}</strong><span>Aufgaben richtig</span></div><div className="placement-breakdown">{(Object.keys(resultBreakdown) as Area[]).map(area=>{const item=resultBreakdown[area];const percent=item.total?Math.round(item.score/item.total*100):0;return <div key={area}><span><strong>{areaLabels[area]}</strong><small>{item.score}/{item.total} · {percent}%</small></span><div><i style={{width:`${percent}%`}}/></div></div>;})}</div><div className="placement-focus"><span>DEINE NÄCHSTEN SCHWERPUNKTE</span>{focus.map(item=><p key={item}>✓ {item}</p>)}</div><div className="placement-note">Die Empfehlung dient dazu, deinen Lernpfad sinnvoll zu starten. Du kannst jedes CEFR-Level später jederzeit frei auswählen.</div><div className="placement-actions"><button className="placement-secondary" onClick={()=>{setAnswers({});setIndex(0);setFinished(false);setStarted(false);}}>Neu testen</button><button className="placement-primary" onClick={()=>onFinish(recommended,score,questions.length,{breakdown:resultBreakdown,focus})}>Mit {recommended} starten →</button></div></section></div>;
  }

  return <div className="placement-backdrop" role="dialog" aria-modal="true" aria-labelledby="placementQuestionTitle"><section className="placement-card"><header className="placement-head"><button className="placement-close" onClick={onClose} aria-label="Einstufung schließen">×</button><div className="placement-progress"><span style={{width:`${progress}%`}}/></div><strong>{index+1}/{questions.length}</strong></header><div className="placement-body"><div className="placement-level"><span>{question.level}</span><small>{areaLabels[question.area]}</small></div><span className="placement-kicker">EINSTUFUNGSTEST</span><h1 id="placementQuestionTitle">{question.prompt}</h1>{question.context&&<p className="placement-context">{question.context}</p>}<div className="placement-choices">{question.choices.map((choice,choiceIndex)=><button key={choice} className={selected===choice?'selected':''} onClick={()=>setAnswers(current=>({...current,[index]:choice}))}><span>{String.fromCharCode(65+choiceIndex)}</span><strong>{choice}</strong></button>)}</div></div><footer className="placement-footer"><span>{question.level} · {areaLabels[question.area]}</span><button className="placement-primary" disabled={!selected} onClick={next}>{index===questions.length-1?'Auswerten':'Weiter →'}</button></footer></section></div>;
}
