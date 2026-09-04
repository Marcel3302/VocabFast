import type { CefrLevel } from './curriculum';

export type PlacementResult = {
  score: number;
  total: number;
  recommendedLevel: CefrLevel;
  completedAt: string;
};

export type CourseState = {
  activeLevel: CefrLevel;
  placement: PlacementResult | null;
};

const STORAGE_KEY = 'vocabfast.platform.course.v1';
const levels: CefrLevel[] = ['A1','A2','B1','B2','C1'];

const emptyState: CourseState = {
  activeLevel:'A1',
  placement:null
};

export function readCourseState(): CourseState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...emptyState };
    const parsed = JSON.parse(raw) as Partial<CourseState>;
    const activeLevel = levels.includes(parsed.activeLevel as CefrLevel) ? parsed.activeLevel as CefrLevel : 'A1';
    const placement = parsed.placement && levels.includes(parsed.placement.recommendedLevel as CefrLevel)
      ? {
          score:Number(parsed.placement.score) || 0,
          total:Number(parsed.placement.total) || 10,
          recommendedLevel:parsed.placement.recommendedLevel as CefrLevel,
          completedAt:String(parsed.placement.completedAt || '')
        }
      : null;
    return { activeLevel, placement };
  } catch {
    return { ...emptyState };
  }
}

export function saveActiveLevel(level: CefrLevel) {
  const current = readCourseState();
  const next: CourseState = { ...current, activeLevel:level };
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* standalone preview may block storage */ }
  return next;
}

export function savePlacement(score: number, total: number, recommendedLevel: CefrLevel) {
  const next: CourseState = {
    activeLevel:recommendedLevel,
    placement:{ score, total, recommendedLevel, completedAt:new Date().toISOString() }
  };
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* standalone preview may block storage */ }
  return next;
}
