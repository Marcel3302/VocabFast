import { englishA1Lessons as englishA1Unit1Lessons } from './en-a1';
import { englishA1Unit2Lessons } from './en-a1-unit2';
import { englishA2Units, englishB1Units, englishB2Units, englishC1Units } from './advanced';
import type { Lesson } from '../types';

export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1';

export type CourseUnit = {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  lessons: Lesson[];
};

export type CourseLevel = {
  id: CefrLevel;
  title: string;
  descriptor: string;
  goal: string;
  units: CourseUnit[];
  productionTargetUnits: number;
};

export const englishA1Units: CourseUnit[] = [
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
];

export const englishCourseLevels: CourseLevel[] = [
  {
    id:'A1', title:'Grundlagen', descriptor:'Ankommen & erste Gespräche',
    goal:'Einfache Alltagssituationen verstehen, kurze Sätze bilden und grundlegende Bedürfnisse ausdrücken.',
    units:englishA1Units, productionTargetUnits:4
  },
  {
    id:'A2', title:'Alltag', descriptor:'Selbstständig in bekannten Situationen',
    goal:'Über Erfahrungen, Pläne und Probleme sprechen und typische Reise- und Servicesituationen bewältigen.',
    units:englishA2Units, productionTargetUnits:6
  },
  {
    id:'B1', title:'Selbstständig', descriptor:'Zusammenhängend kommunizieren',
    goal:'Meinungen begründen, Erlebnisse strukturiert erzählen und im Beruf oder auf Reisen sicher reagieren.',
    units:englishB1Units, productionTargetUnits:8
  },
  {
    id:'B2', title:'Sicher & präzise', descriptor:'Komplexe Themen professionell behandeln',
    goal:'Argumentieren, verhandeln, Texte zusammenfassen und auch anspruchsvollere Situationen differenziert bewältigen.',
    units:englishB2Units, productionTargetUnits:10
  },
  {
    id:'C1', title:'Fortgeschritten', descriptor:'Nuance, Register & professionelle Wirkung',
    goal:'Komplexe Inhalte präzise, spontan und adressatengerecht ausdrücken und implizite Bedeutungen sicher erfassen.',
    units:englishC1Units, productionTargetUnits:12
  }
];

export const englishA1Lessons = englishA1Units.flatMap(unit => unit.lessons);
export const englishAllLessons = englishCourseLevels.flatMap(level => level.units.flatMap(unit => unit.lessons));
export const firstEnglishLesson = englishA1Lessons[0];

export function levelById(id: CefrLevel) {
  return englishCourseLevels.find(level => level.id === id) ?? englishCourseLevels[0];
}

export function levelLessons(id: CefrLevel) {
  return levelById(id).units.flatMap(unit => unit.lessons);
}

export function lessonIndex(lessonId: string) {
  return englishAllLessons.findIndex(lesson => lesson.id === lessonId);
}

export function lessonIsUnlocked(lessonId: string, completedLessonIds: string[]) {
  const lesson = englishAllLessons.find(item => item.id === lessonId);
  if (!lesson) return false;
  const lessons = levelLessons(lesson.level as CefrLevel);
  const index = lessons.findIndex(item => item.id === lessonId);
  if (index <= 0) return true;
  return completedLessonIds.includes(lessons[index - 1].id);
}

export function courseStats() {
  const lessons = englishAllLessons.length;
  const exercises = englishAllLessons.reduce((sum, lesson) => sum + lesson.exercises.length, 0);
  const units = englishCourseLevels.reduce((sum, level) => sum + level.units.length, 0);
  return { lessons, exercises, units, levels: englishCourseLevels.length };
}
