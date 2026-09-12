import type { Exercise, ExerciseType, Lesson } from './types';
import { levelLessons, type CefrLevel } from './curriculum';
import { getDueConcepts, getMasterySnapshot } from './mastery';

function uniqueExercises(exercises: Exercise[]) {
  const seen = new Set<string>();
  return exercises.filter(exercise => { if (seen.has(exercise.id)) return false; seen.add(exercise.id); return true; });
}
function randomized<T>(items: T[]) { return items.map(item=>({item,sort:Math.random()})).sort((a,b)=>a.sort-b.sort).map(entry=>entry.item); }

export function buildAdaptiveReviewLesson(level:CefrLevel='A1',targetLanguage='en'):Lesson {
  const due=getDueConcepts(),mastery=getMasterySnapshot(),lessons=levelLessons(level,targetLanguage);
  const safeLessons=lessons.length?lessons:levelLessons('A1',targetLanguage);
  const allowedConcepts=new Set(safeLessons.flatMap(lesson=>lesson.exercises.flatMap(exercise=>exercise.conceptIds)));
  const relevantDue=due.filter(item=>allowedConcepts.has(item.conceptId)),relevantMastery=mastery.filter(item=>allowedConcepts.has(item.conceptId));
  const focus=(relevantDue.length?relevantDue:relevantMastery).slice(0,10).map(item=>item.conceptId);
  const allExercises=safeLessons.flatMap(lesson=>lesson.exercises);
  const targeted=focus.length?allExercises.filter(exercise=>exercise.conceptIds.some(conceptId=>focus.includes(conceptId))):allExercises.slice(0,12);
  const exercises=randomized(uniqueExercises(targeted)).slice(0,10),label=targetLanguage==='hr'?'Kroatisch':'Englisch';
  return {id:`review-${targetLanguage}-${level.toLowerCase()}-${Date.now()}`,courseId:`adaptive-${targetLanguage}`,level,unitId:'adaptive-review',title:relevantDue.length?`${level} · Fällige Wiederholung`:`${level} · Intelligente Wiederholung`,subtitle:relevantDue.length?`Heute fällige ${label}-Konzepte werden gezielt wiederholt.`:`VocabFast priorisiert deine schwächsten bekannten Konzepte in ${label}.`,estimatedMinutes:Math.max(5,Math.ceil(exercises.length*.8)),newConcepts:[],exercises:exercises.length?exercises:safeLessons[0]?.exercises.slice(0,8)??[]};
}

export function buildModeLesson(types:ExerciseType[],title:string,subtitle:string,level:CefrLevel='A1',targetLanguage='en'):Lesson {
  const lessons=levelLessons(level,targetLanguage),safeLessons=lessons.length?lessons:levelLessons('A1',targetLanguage);
  const all=safeLessons.flatMap(lesson=>lesson.exercises).filter(exercise=>types.includes(exercise.type));
  const allowedConcepts=new Set(all.flatMap(exercise=>exercise.conceptIds));
  const mastery=getMasterySnapshot().filter(item=>allowedConcepts.has(item.conceptId)),weak=mastery.slice(0,12).map(item=>item.conceptId);
  const prioritized=weak.length?[...all.filter(exercise=>exercise.conceptIds.some(id=>weak.includes(id))),...all]:all;
  const exercises=randomized(uniqueExercises(prioritized)).slice(0,10);
  return {id:`practice-${targetLanguage}-${level.toLowerCase()}-${Date.now()}`,courseId:`practice-${targetLanguage}`,level,unitId:'focused-practice',title:`${level} · ${title}`,subtitle,estimatedMinutes:Math.max(5,Math.ceil(exercises.length*.9)),newConcepts:[],exercises:exercises.length?exercises:safeLessons[0]?.exercises.slice(0,8)??[]};
}
