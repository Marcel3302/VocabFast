import type { LessonResult } from './types';

export type PlatformProgress = {
  completedLessonIds: string[];
  results: Record<string, LessonResult>;
  totalXp: number;
  sessions: number;
  studyDates: string[];
  currentStreak: number;
  longestStreak: number;
  lastStudyDate: string | null;
};

const STORAGE_KEY = 'vocabfast.platform.progress.v2';
const LEGACY_KEY = 'vocabfast.platform.progress.v1';

const emptyProgress: PlatformProgress = {
  completedLessonIds: [],
  results: {},
  totalXp: 0,
  sessions: 0,
  studyDates: [],
  currentStreak: 0,
  longestStreak: 0,
  lastStudyDate: null
};

function dateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function calculateStreak(dates: string[]) {
  const unique = [...new Set(dates)].sort();
  if (!unique.length) return { current: 0, longest: 0 };
  let longest = 1;
  let running = 1;
  for (let i = 1; i < unique.length; i += 1) {
    const previous = new Date(`${unique[i - 1]}T12:00:00`);
    const current = new Date(`${unique[i]}T12:00:00`);
    const days = Math.round((current.getTime() - previous.getTime()) / 86400000);
    running = days === 1 ? running + 1 : 1;
    longest = Math.max(longest, running);
  }
  const today = new Date(`${dateKey()}T12:00:00`);
  const last = new Date(`${unique[unique.length - 1]}T12:00:00`);
  const gap = Math.round((today.getTime() - last.getTime()) / 86400000);
  const current = gap <= 1 ? running : 0;
  return { current, longest };
}

function normalize(parsed: Partial<PlatformProgress>): PlatformProgress {
  const studyDates = Array.isArray(parsed.studyDates) ? parsed.studyDates.filter(value => typeof value === 'string') : [];
  const streak = calculateStreak(studyDates);
  return {
    completedLessonIds: Array.isArray(parsed.completedLessonIds) ? parsed.completedLessonIds : [],
    results: parsed.results && typeof parsed.results === 'object' ? parsed.results : {},
    totalXp: Number(parsed.totalXp) || 0,
    sessions: Number(parsed.sessions) || 0,
    studyDates,
    currentStreak: streak.current,
    longestStreak: Math.max(Number(parsed.longestStreak) || 0, streak.longest),
    lastStudyDate: typeof parsed.lastStudyDate === 'string' ? parsed.lastStudyDate : studyDates.at(-1) ?? null
  };
}

export function readProgress(): PlatformProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_KEY);
    if (!raw) return { ...emptyProgress };
    return normalize(JSON.parse(raw) as Partial<PlatformProgress>);
  } catch {
    return { ...emptyProgress };
  }
}

export function saveLessonResult(result: LessonResult): PlatformProgress {
  const current = readProgress();
  const isCurriculumLesson = !result.lessonId.startsWith('review-') && !result.lessonId.startsWith('practice-');
  const completedLessonIds = isCurriculumLesson && !current.completedLessonIds.includes(result.lessonId)
    ? [...current.completedLessonIds, result.lessonId]
    : current.completedLessonIds;
  const today = dateKey();
  const studyDates = current.studyDates.includes(today) ? current.studyDates : [...current.studyDates, today];
  const streak = calculateStreak(studyDates);
  const next: PlatformProgress = {
    completedLessonIds,
    results: isCurriculumLesson ? { ...current.results, [result.lessonId]: result } : current.results,
    totalXp: current.totalXp + result.xp,
    sessions: current.sessions + 1,
    studyDates,
    currentStreak: streak.current,
    longestStreak: Math.max(current.longestStreak, streak.longest),
    lastStudyDate: today
  };
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* optional local persistence */ }
  return next;
}

export function sessionsToday(progress: PlatformProgress) {
  return progress.studyDates.includes(dateKey()) ? 1 : 0;
}

export function resetLocalProgress() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(LEGACY_KEY);
  localStorage.removeItem('vocabfast.platform.mastery.v1');
}
