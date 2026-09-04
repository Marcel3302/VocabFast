import type { Exercise, ExerciseType, Lesson } from './types';
import { englishA1Lessons } from './curriculum';
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

export function buildAdaptiveReviewLesson(): Lesson {
  const due = getDueConcepts();
  const mastery = getMasterySnapshot();
  const focus = (due.length ? due : mastery).slice(0, 10).map(item => item.conceptId);
  const allExercises = englishA1Lessons.flatMap(lesson => lesson.exercises);
  const targeted = focus.length
    ? allExercises.filter(exercise => exercise.conceptIds.some(conceptId => focus.includes(conceptId)))
    : allExercises.slice(0, 10);
  const exercises = randomized(uniqueExercises(targeted)).slice(0, 10);

  return {
    id: `review-${Date.now()}`,
    courseId: 'de-en',
    level: 'A1',
    unitId: 'adaptive-review',
    title: due.length ? 'Fällige Wiederholung' : 'Intelligente Wiederholung',
    subtitle: due.length ? 'Heute fällige Konzepte werden gezielt wiederholt.' : 'VocabFast priorisiert deine schwächsten bekannten Konzepte.',
    estimatedMinutes: Math.max(5, Math.ceil(exercises.length * .8)),
    newConcepts: [],
    exercises: exercises.length ? exercises : englishA1Lessons[0].exercises.slice(0, 8)
  };
}

export function buildModeLesson(types: ExerciseType[], title: string, subtitle: string): Lesson {
  const all = englishA1Lessons.flatMap(lesson => lesson.exercises).filter(exercise => types.includes(exercise.type));
  const mastery = getMasterySnapshot();
  const weak = mastery.slice(0, 12).map(item => item.conceptId);
  const prioritized = weak.length
    ? [...all.filter(exercise => exercise.conceptIds.some(id => weak.includes(id))), ...all]
    : all;
  const exercises = randomized(uniqueExercises(prioritized)).slice(0, 10);
  return {
    id: `practice-${Date.now()}`,
    courseId: 'de-en',
    level: 'A1',
    unitId: 'focused-practice',
    title,
    subtitle,
    estimatedMinutes: Math.max(5, Math.ceil(exercises.length * .9)),
    newConcepts: [],
    exercises: exercises.length ? exercises : englishA1Lessons[0].exercises.slice(0, 8)
  };
}
