import type { LessonResult } from './types';

export type PlatformProgress = {
  completedLessonIds: string[];
  results: Record<string, LessonResult>;
  totalXp: number;
  sessions: number;
};

const STORAGE_KEY = 'vocabfast.platform.progress.v1';

const emptyProgress: PlatformProgress = {
  completedLessonIds: [],
  results: {},
  totalXp: 0,
  sessions: 0
};

export function readProgress(): PlatformProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...emptyProgress };
    const parsed = JSON.parse(raw) as Partial<PlatformProgress>;
    return {
      completedLessonIds: Array.isArray(parsed.completedLessonIds) ? parsed.completedLessonIds : [],
      results: parsed.results && typeof parsed.results === 'object' ? parsed.results : {},
      totalXp: Number(parsed.totalXp) || 0,
      sessions: Number(parsed.sessions) || 0
    };
  } catch {
    return { ...emptyProgress };
  }
}

export function saveLessonResult(result: LessonResult): PlatformProgress {
  const current = readProgress();
  const isCurriculumLesson = !result.lessonId.startsWith('review-');
  const completedLessonIds = isCurriculumLesson && !current.completedLessonIds.includes(result.lessonId)
    ? [...current.completedLessonIds, result.lessonId]
    : current.completedLessonIds;
  const next: PlatformProgress = {
    completedLessonIds,
    results: isCurriculumLesson ? { ...current.results, [result.lessonId]: result } : current.results,
    totalXp: current.totalXp + result.xp,
    sessions: current.sessions + 1
  };
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* optional prototype persistence */ }
  return next;
}
