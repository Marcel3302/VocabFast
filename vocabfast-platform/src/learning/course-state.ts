import type { CefrLevel } from './curriculum';

export type PlacementBreakdown = {
  grammar:{score:number;total:number};
  vocabulary:{score:number;total:number};
  communication:{score:number;total:number};
};

export type PlacementResult = {
  score: number;
  total: number;
  recommendedLevel: CefrLevel;
  completedAt: string;
  breakdown?: PlacementBreakdown;
  focus?: string[];
};

export type CourseState = {
  activeLevel: CefrLevel;
  placement: PlacementResult | null;
};

const STORAGE_KEY = 'vocabfast.platform.course.v1';
const levels: CefrLevel[] = ['A1','A2','B1','B2','C1','C2'];

const emptyState: CourseState = {
  activeLevel:'A1',
  placement:null
};

function normalizeBreakdown(value:unknown):PlacementBreakdown|undefined {
  if(!value||typeof value!=='object')return undefined;
  const raw=value as Partial<PlacementBreakdown>;
  const make=(part:PlacementBreakdown[keyof PlacementBreakdown]|undefined)=>({score:Number(part?.score)||0,total:Number(part?.total)||0});
  return {grammar:make(raw.grammar),vocabulary:make(raw.vocabulary),communication:make(raw.communication)};
}

export function readCourseState(): CourseState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...emptyState };
    const parsed = JSON.parse(raw) as Partial<CourseState>;
    const activeLevel = levels.includes(parsed.activeLevel as CefrLevel) ? parsed.activeLevel as CefrLevel : 'A1';
    const placement = parsed.placement && levels.includes(parsed.placement.recommendedLevel as CefrLevel)
      ? {
          score:Number(parsed.placement.score) || 0,
          total:Number(parsed.placement.total) || 36,
          recommendedLevel:parsed.placement.recommendedLevel as CefrLevel,
          completedAt:String(parsed.placement.completedAt || ''),
          breakdown:normalizeBreakdown(parsed.placement.breakdown),
          focus:Array.isArray(parsed.placement.focus)?parsed.placement.focus.map(String).slice(0,4):undefined
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

export function savePlacement(score:number,total:number,recommendedLevel:CefrLevel,breakdown?:PlacementBreakdown,focus?:string[]) {
  const next: CourseState = {
    activeLevel:recommendedLevel,
    placement:{ score, total, recommendedLevel, completedAt:new Date().toISOString(), breakdown, focus }
  };
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* standalone preview may block storage */ }
  return next;
}
