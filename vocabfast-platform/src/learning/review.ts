import type { Exercise, ExerciseType, Lesson } from './types';
import { levelLessons, type CefrLevel } from './curriculum';
import { getDueConcepts, getMasterySnapshot } from './mastery';

function uniqueExercises(exercises: Exercise[]) {
  const seen = new Set<string>();
  return exercises.filter(exercise => {
    if (seen.has(exercise.id)) return false;
    seen.add(exercise.id);
    return true;
  });
}

function randomized<T>(items: T[]) {
  return items
    .map(item => ({ item, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(entry => entry.item);
}

export function buildAdaptiveReviewLesson(level: CefrLevel = 'A1'): Lesson {
  const due = getDueConcepts();
  const mastery = getMasterySnapshot();
  const lessons = levelLessons(level);
  const allowedConcepts = new Set(lessons.flatMap(lesson=>lesson.exercises.flatMap(exercise=>exercise.conceptIds)));
  const relevantDue = due.filter(item=>allowedConcepts.has(item.conceptId));
  const relevantMastery = mastery.filter(item=>allowedConcepts.has(item.conceptId));
  const focus = (relevantDue.length ? relevantDue : relevantMastery).slice(0, 10).map(item => item.conceptId);
  const allExercises = lessons.flatMap(lesson => lesson.exercises);
  const targeted = focus.length
    ? allExercises.filter(exercise => exercise.conceptIds.some(conceptId => focus.includes(conceptId)))
    : allExercises.slice(0, 12);
  const exercises = randomized(uniqueExercises(targeted)).slice(0, 10);

  return {
    id: `review-${level.toLowerCase()}-${Date.now()}`,
    courseId: 'de-en',
    level,
    unitId: 'adaptive-review',
    title: relevantDue.length ? `${level} · Fällige Wiederholung` : `${level} · Intelligente Wiederholung`,
    subtitle: relevantDue.length ? 'Heute fällige Konzepte werden gezielt wiederholt.' : 'VocabFast priorisiert deine schwächsten bekannten Konzepte in diesem CEFR-Level.',
    estimatedMinutes: Math.max(5, Math.ceil(exercises.length * .8)),
    newConcepts: [],
    exercises: exercises.length ? exercises : lessons[0].exercises.slice(0, 8)
  };
}

export function buildModeLesson(types: ExerciseType[], title: string, subtitle: string, level: CefrLevel = 'A1'): Lesson {
  const lessons = levelLessons(level);
  const all = lessons.flatMap(lesson => lesson.exercises).filter(exercise => types.includes(exercise.type));
  const allowedConcepts = new Set(all.flatMap(exercise=>exercise.conceptIds));
  const mastery = getMasterySnapshot().filter(item=>allowedConcepts.has(item.conceptId));
  const weak = mastery.slice(0, 12).map(item => item.conceptId);
  const prioritized = weak.length
    ? [...all.filter(exercise => exercise.conceptIds.some(id => weak.includes(id))), ...all]
    : all;
  const exercises = randomized(uniqueExercises(prioritized)).slice(0, 10);
  return {
    id: `practice-${level.toLowerCase()}-${Date.now()}`,
    courseId: 'de-en',
    level,
    unitId: 'focused-practice',
    title:`${level} · ${title}`,
    subtitle,
    estimatedMinutes: Math.max(5, Math.ceil(exercises.length * .9)),
    newConcepts: [],
    exercises: exercises.length ? exercises : lessons[0].exercises.slice(0, 8)
  };
}
