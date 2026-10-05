import type { Exercise, Lesson } from './types';
import { localizeGermanTexts } from './localization';

const CACHE_PREFIX='vocabfast.dynamic-lesson.v1:';
const CACHE_VERSION=1;
const difficultyByLevel={A1:1,A2:2,B1:3,B2:4,C1:5,C2:5} as const;

function stripTerminal(value:string){return value.replace(/[.!?。！？؟]+$/u,'').trim();}
function cacheKey(lesson:Lesson,targetLanguage:string){return `${CACHE_PREFIX}${CACHE_VERSION}:${targetLanguage}:${lesson.id}`;}
function readCache(lesson:Lesson,targetLanguage:string){
  try{
    const raw=localStorage.getItem(cacheKey(lesson,targetLanguage));if(!raw)return null;
    const parsed=JSON.parse(raw) as {phrases?:string[]};
    if(!Array.isArray(parsed.phrases)||parsed.phrases.length!==lesson.dynamic?.phrases.length)return null;
    if(parsed.phrases.some(value=>typeof value!=='string'||!value.trim()))return null;
    return parsed.phrases.map(value=>value.trim());
  }catch{return null;}
}
function saveCache(lesson:Lesson,targetLanguage:string,phrases:string[]){try{localStorage.setItem(cacheKey(lesson,targetLanguage),JSON.stringify({phrases,version:CACHE_VERSION}));}catch{/* optional */}}
function usefulTranslation(source:string,target:string,targetLanguage:string){if(!target.trim())return false;if(targetLanguage==='de')return true;return source.trim().toLocaleLowerCase()!==target.trim().toLocaleLowerCase();}

async function translatedPhrases(lesson:Lesson,targetLanguage:string){
  const dynamic=lesson.dynamic;if(!dynamic)return[];
  const cached=readCache(lesson,targetLanguage);if(cached)return cached;
  if(targetLanguage==='de'){saveCache(lesson,targetLanguage,dynamic.phrases);return dynamic.phrases;}
  const result=await localizeGermanTexts(dynamic.phrases,targetLanguage);
  const targets=dynamic.phrases.map(source=>result.translations[source]?.trim()||'');
  const useful=targets.filter((target,index)=>usefulTranslation(dynamic.phrases[index],target,targetLanguage)).length;
  if(useful<Math.ceil(dynamic.phrases.length*.75))throw new Error('Die Zielsprach-Inhalte konnten gerade nicht zuverlässig vorbereitet werden. Bitte versuche die Lektion gleich noch einmal.');
  saveCache(lesson,targetLanguage,targets);return targets;
}

function buildExercises(lesson:Lesson,targets:string[]):Exercise[]{
  const dynamic=lesson.dynamic;if(!dynamic)return lesson.exercises;
  const difficulty=difficultyByLevel[lesson.level];
  const concepts=lesson.newConcepts;
  const xp=6+difficulty*2;
  const sourceChoices=[...dynamic.phrases];
  const targetChoices=[...targets];
  const exercises:Exercise[]=[];
  targets.forEach((target,index)=>{
    const source=dynamic.phrases[index],accepted=[target,stripTerminal(target)].filter((value,pos,array)=>value&&array.indexOf(value)===pos);
    exercises.push(
      {id:`${lesson.id}-mc-${index}`,type:'multiple-choice',instruction:'Wähle die passende Formulierung in der Zielsprache.',prompt:source,choices:targetChoices,answer:target,conceptIds:concepts,difficulty,xp,explanation:dynamic.grammarFocus},
      {id:`${lesson.id}-tr-${index}`,type:'translation',instruction:'Formuliere die Aussage natürlich in der Zielsprache.',prompt:dynamic.scenario,sourceText:source,acceptedAnswers:accepted,conceptIds:concepts,difficulty,xp:xp+2,explanation:`Ziel: ${dynamic.objective} · Fokus: ${dynamic.grammarFocus}`},
      {id:`${lesson.id}-li-${index}`,type:'listening',instruction:'Höre die Aussage und wähle die passende Bedeutung.',prompt:dynamic.scenario,speech:target,choices:sourceChoices,answer:source,conceptIds:concepts,difficulty,xp:xp+2},
      {id:`${lesson.id}-di-${index}`,type:'dictation',instruction:'Höre genau zu und schreibe die Aussage in der Zielsprache.',prompt:dynamic.scenario,speech:target,acceptedAnswers:accepted,conceptIds:concepts,difficulty,xp:xp+3,explanation:dynamic.grammarFocus},
      {id:`${lesson.id}-sp-${index}`,type:'speaking',instruction:'Sprich die Aussage selbst in der Zielsprache.',prompt:source,speech:target,acceptedAnswers:accepted,conceptIds:concepts,difficulty,xp:xp+3,explanation:`Nutze die Aussage so, als wärst du wirklich in dieser Situation: ${dynamic.scenario}`}
    );
  });
  return exercises;
}

export async function materializeDynamicLesson(lesson:Lesson,targetLanguage:string):Promise<Lesson>{
  if(!lesson.dynamic)return lesson;
  const targets=await translatedPhrases(lesson,targetLanguage);
  return{...lesson,estimatedMinutes:Math.max(10,Math.ceil(targets.length*3)),exercises:buildExercises(lesson,targets)};
}
