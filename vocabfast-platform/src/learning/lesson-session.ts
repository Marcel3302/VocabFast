import type { DictationExercise, Exercise, Lesson, ListeningExercise, SpeakingExercise, TranslationExercise } from './types';

const LAST_SESSION_PREFIX='vocabfast.lesson-session.v2:';
const instructionVariants:Record<string,string[]>={
  'multiple-choice':['Wähle die beste Antwort.','Welche Lösung passt hier?','Entscheide dich für die passende Formulierung.','Wähle die richtige Variante.'],
  translation:['Übersetze sinngemäß in die Zielsprache.','Formuliere diese Aussage natürlich in der Zielsprache.','Wie würdest du das in der Zielsprache sagen?','Übertrage den Satz ohne Wort-für-Wort-Denken.'],
  'sentence-build':['Bringe die Wörter in eine natürliche Reihenfolge.','Baue den Satz korrekt zusammen.','Rekonstruiere den Zielsatz.','Ordne die Satzteile richtig.'],
  'fill-gap':['Welches Wort fehlt?','Ergänze die passende Form.','Vervollständige den Satz aus dem Kontext.','Finde das fehlende Wort.'],
  listening:['Höre genau zu und wähle die passende Antwort.','Was hast du gehört?','Höre den Satz und entscheide dich.','Verstehe die Aussage aus dem Audio.'],
  dictation:['Höre zu und schreibe den Satz.','Schreibe exakt auf, was du hörst.','Diktat: Rekonstruiere den gehörten Satz.','Höre noch einmal genau auf jedes Wort.'],
  speaking:['Sprich die Aussage selbst.','Sage den Zielsatz laut und natürlich.','Trainiere die aktive Aussprache.','Sprich den Satz ohne abzulesen, wenn du kannst.']
};

function random(){try{const value=new Uint32Array(1);crypto.getRandomValues(value);return value[0]/4294967296;}catch{return Math.random();}}
function shuffle<T>(items:T[]){const copy=[...items];for(let i=copy.length-1;i>0;i-=1){const j=Math.floor(random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]];}return copy;}
function pick<T>(items:T[]){return items[Math.floor(random()*items.length)]??items[0];}
function words(value:string){return value.match(/[\p{L}\p{M}\p{N}'’\-]+/gu)??[];}
function sentenceTokens(value:string){return value.replace(/([,.!?;:])/g,' $1 ').replace(/\s+/g,' ').trim().split(' ').filter(Boolean);}
function answerText(exercise:Exercise){if(exercise.type==='translation'||exercise.type==='dictation'||exercise.type==='speaking')return exercise.acceptedAnswers[0]||'';if(exercise.type==='sentence-build'||exercise.type==='multiple-choice'||exercise.type==='fill-gap'||exercise.type==='listening')return exercise.answer||'';return '';}
function targetSentences(lesson:Lesson){return [...new Set(lesson.exercises.map(answerText).filter(value=>value&&value.length>2))];}
function sourceHint(lesson:Lesson){const translation=lesson.exercises.find((item):item is TranslationExercise=>item.type==='translation');return translation?.sourceText||lesson.subtitle;}
function targetConcepts(lesson:Lesson){const translation=lesson.exercises.find((item):item is TranslationExercise=>item.type==='translation');return translation?.conceptIds?.length?translation.conceptIds:lesson.newConcepts;}
function varyBase(exercise:Exercise,session:string,index:number):Exercise{
  const instruction=pick(instructionVariants[exercise.type]??[exercise.instruction]);
  const base={...exercise,id:`${exercise.id}-${session}-b${index}`,instruction};
  if('choices' in base)return {...base,choices:shuffle(base.choices)} as Exercise;
  if(base.type==='sentence-build')return {...base,tokens:shuffle(base.tokens)};
  return base;
}
function gapVariant(lesson:Lesson,target:string,session:string,index:number):Exercise|null{
  const tokens=words(target).filter(word=>word.length>1);if(tokens.length<2)return null;
  const answer=pick(tokens);let used=false;
  const sentence=target.replace(new RegExp(`(^|\\s)${answer.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}(?=\\s|[,.!?;:]|$)`,'u'),match=>{if(used)return match;used=true;return match.replace(answer,'___');});
  if(!used)return null;
  const bank=[...new Set(targetSentences(lesson).flatMap(words).filter(word=>word!==answer&&word.length>1))];
  const choices=shuffle([answer,...shuffle(bank).slice(0,3)]);
  return{id:`${lesson.id}-${session}-gap${index}`,type:'fill-gap',instruction:pick(instructionVariants['fill-gap']),prompt:sourceHint(lesson),sentence,choices,answer,conceptIds:targetConcepts(lesson),difficulty:2,xp:8,explanation:'Nutze den gesamten Satz als Kontext, nicht nur ein einzelnes Signalwort.'};
}
function buildVariant(lesson:Lesson,target:string,session:string,index:number):Exercise|null{
  const tokens=sentenceTokens(target);if(tokens.length<2)return null;
  return{id:`${lesson.id}-${session}-build${index}`,type:'sentence-build',instruction:pick(instructionVariants['sentence-build']),prompt:sourceHint(lesson),tokens:shuffle(tokens),answer:target,conceptIds:targetConcepts(lesson),difficulty:2,xp:9};
}
function speechVariant(lesson:Lesson,target:string,session:string,index:number):SpeakingExercise{return{id:`${lesson.id}-${session}-speak${index}`,type:'speaking',instruction:pick(instructionVariants.speaking),prompt:pick(['Sprich möglichst flüssig.','Achte auf Rhythmus und Satzmelodie.','Versuche zuerst ohne Hilfe zu antworten.','Sprich in natürlichem Tempo.']),speech:target,acceptedAnswers:[target],conceptIds:targetConcepts(lesson),difficulty:2,xp:10};}
function dictationVariant(lesson:Lesson,target:string,session:string,index:number):DictationExercise{return{id:`${lesson.id}-${session}-dict${index}`,type:'dictation',instruction:pick(instructionVariants.dictation),prompt:pick(['Achte auf kurze Wörter und Endungen.','Höre auf die komplette Wortfolge.','Schreibe erst nach dem vollständigen Hören.','Kontrolliere anschließend die Wortstellung.']),speech:target,acceptedAnswers:[target],conceptIds:targetConcepts(lesson),difficulty:2,xp:10};}
function listeningVariant(lesson:Lesson,target:string,session:string,index:number):ListeningExercise{
  const targets=targetSentences(lesson),choices=shuffle([target,...shuffle(targets.filter(value=>value!==target)).slice(0,3)]);
  return{id:`${lesson.id}-${session}-listen${index}`,type:'listening',instruction:pick(instructionVariants.listening),prompt:'Welche Aussage hörst du?',speech:target,choices,answer:target,conceptIds:targetConcepts(lesson),difficulty:2,xp:9};
}
function signature(exercises:Exercise[]){return exercises.map(item=>`${item.type}:${answerText(item)}:${item.instruction}`).join('|');}
function previousSignature(lessonId:string){try{return localStorage.getItem(`${LAST_SESSION_PREFIX}${lessonId}`)||'';}catch{return '';}}
function rememberSignature(lessonId:string,value:string){try{localStorage.setItem(`${LAST_SESSION_PREFIX}${lessonId}`,value);}catch{/* optional */}}

export function createLessonSession(lesson:Lesson):Lesson{
  const previous=previousSignature(lesson.id);let best:Exercise[]=[];
  for(let attempt=0;attempt<5;attempt+=1){
    const session=`${Date.now().toString(36)}${Math.floor(random()*1e6).toString(36)}`;
    const targets=shuffle(targetSentences(lesson));
    const pool:Exercise[]=[...lesson.exercises.map((exercise,index)=>varyBase(exercise,session,index))];
    targets.forEach((target,index)=>{const gap=gapVariant(lesson,target,session,index),build=buildVariant(lesson,target,session,index);if(gap)pool.push(gap);if(build)pool.push(build);pool.push(speechVariant(lesson,target,session,index),dictationVariant(lesson,target,session,index),listeningVariant(lesson,target,session,index));});
    const desired=Math.min(16,Math.max(12,lesson.exercises.length));
    const selected=shuffle(pool).slice(0,desired);
    const types=new Set(selected.map(item=>item.type));
    for(const required of ['translation','listening','speaking'] as const){if(types.has(required))continue;const replacement=pool.find(item=>item.type===required&&!selected.includes(item));if(replacement)selected[Math.floor(random()*selected.length)]=replacement;}
    best=shuffle(selected);if(signature(best)!==previous)break;
  }
  const value=signature(best);rememberSignature(lesson.id,value);
  return{...lesson,estimatedMinutes:Math.max(lesson.estimatedMinutes,Math.ceil(best.length*.75)),exercises:best};
}
