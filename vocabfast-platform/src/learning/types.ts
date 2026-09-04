export type ExerciseType = 'multiple-choice' | 'translation' | 'sentence-build' | 'fill-gap' | 'listening' | 'dictation';

export type ExerciseBase = {
  id: string;
  type: ExerciseType;
  instruction: string;
  prompt: string;
  conceptIds: string[];
  difficulty: 1 | 2 | 3 | 4 | 5;
  xp: number;
  explanation?: string;
};

export type MultipleChoiceExercise = ExerciseBase & {
  type: 'multiple-choice';
  choices: string[];
  answer: string;
};

export type TranslationExercise = ExerciseBase & {
  type: 'translation';
  sourceText: string;
  acceptedAnswers: string[];
};

export type SentenceBuildExercise = ExerciseBase & {
  type: 'sentence-build';
  tokens: string[];
  answer: string;
};

export type FillGapExercise = ExerciseBase & {
  type: 'fill-gap';
  sentence: string;
  choices: string[];
  answer: string;
};

export type ListeningExercise = ExerciseBase & {
  type: 'listening';
  speech: string;
  choices: string[];
  answer: string;
};

export type DictationExercise = ExerciseBase & {
  type: 'dictation';
  speech: string;
  acceptedAnswers: string[];
};

export type Exercise = MultipleChoiceExercise | TranslationExercise | SentenceBuildExercise | FillGapExercise | ListeningExercise | DictationExercise;

export type Lesson = {
  id: string;
  courseId: string;
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  unitId: string;
  title: string;
  subtitle: string;
  estimatedMinutes: number;
  newConcepts: string[];
  exercises: Exercise[];
};

export type LessonResult = {
  lessonId: string;
  correct: number;
  total: number;
  accuracy: number;
  xp: number;
};
