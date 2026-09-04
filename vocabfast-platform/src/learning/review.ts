import type { Exercise, Lesson } from './types';
import { englishA1Lessons } from './curriculum/en-a1';
import { getDueConcepts, getMasterySnapshot } from './mastery';

function uniqueExercises(exercises: Exercise[]) {
  const seen = new Set<string>();
  return exercises.filter(exercise => {
    if (seen.has(exercise.id)) return false;
    seen.add(exercise.id);
    return true;
  });
}

export function buildAdaptiveReviewLesson(): Lesson {
  const due = getDueConcepts();
  const mastery = getMasterySnapshot();
  const focus = (due.length ? due : mastery).slice(0, 8).map(item => item.conceptId);
  const allExercises = englishA1Lessons.flatMap(lesson => lesson.exercises);
  const targeted = focus.length
    ? allExercises.filter(exercise => exercise.conceptIds.some(conceptId => focus.includes(conceptId)))
    : allExercises.slice(0, 6);
  const exercises = uniqueExercises(targeted).slice(0, 8);

  return {
    id: `review-${Date.now()}`,
    courseId: 'de-en',
    level: 'A1',
    unitId: 'adaptive-review',
    title: due.length ? 'Fällige Wiederholung' : 'Intelligente Wiederholung',
    subtitle: due.length ? 'Heute fällige Konzepte werden gezielt wiederholt.' : 'VocabFast priorisiert deine schwächsten bekannten Konzepte.',
    estimatedMinutes: Math.max(4, Math.ceil(exercises.length * .8)),
    newConcepts: [],
    exercises: exercises.length ? exercises : englishA1Lessons[0].exercises.slice(0, 6)
  };
}
