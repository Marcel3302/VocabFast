import { englishA1Lessons as englishA1Unit1Lessons } from './en-a1';
import { englishA1Unit2Lessons } from './en-a1-unit2';

export const englishA1Units = [
  {
    id: 'en-a1-u1',
    number: 1,
    title: 'Erste Gespräche',
    subtitle: 'Begrüßen, vorstellen, bestellen und erste Fragen stellen.',
    lessons: englishA1Unit1Lessons
  },
  {
    id: 'en-a1-u2',
    number: 2,
    title: 'Im Alltag',
    subtitle: 'Familie, Tagesablauf, Uhrzeit, Einkaufen, Zuhause und unterwegs.',
    lessons: englishA1Unit2Lessons
  }
] as const;

export const englishA1Lessons = englishA1Units.flatMap(unit => [...unit.lessons]);
export const firstEnglishLesson = englishA1Lessons[0];

export function lessonIndex(lessonId: string) {
  return englishA1Lessons.findIndex(lesson => lesson.id === lessonId);
}

export function lessonIsUnlocked(lessonId: string, completedLessonIds: string[]) {
  const index = lessonIndex(lessonId);
  if (index <= 0) return true;
  return completedLessonIds.includes(englishA1Lessons[index - 1].id);
}
