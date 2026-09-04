export type LearningReason = 'alltag' | 'reise' | 'beruf' | 'fachsprache';

export type LearnerPreferences = {
  name: string;
  targetLanguage: 'en';
  dailyMinutes: 5 | 10 | 15 | 20;
  reason: LearningReason;
  audioRate: .75 | .9 | 1;
  onboarded: boolean;
};

const STORAGE_KEY = 'vocabfast.platform.preferences.v1';

export const defaultPreferences: LearnerPreferences = {
  name: 'Marcel',
  targetLanguage: 'en',
  dailyMinutes: 10,
  reason: 'alltag',
  audioRate: .9,
  onboarded: false
};

export function readPreferences(): LearnerPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaultPreferences };
    const parsed = JSON.parse(raw) as Partial<LearnerPreferences>;
    return {
      name: typeof parsed.name === 'string' && parsed.name.trim() ? parsed.name.trim().slice(0, 40) : defaultPreferences.name,
      targetLanguage: 'en',
      dailyMinutes: [5,10,15,20].includes(Number(parsed.dailyMinutes)) ? parsed.dailyMinutes as LearnerPreferences['dailyMinutes'] : 10,
      reason: ['alltag','reise','beruf','fachsprache'].includes(String(parsed.reason)) ? parsed.reason as LearningReason : 'alltag',
      audioRate: [.75,.9,1].includes(Number(parsed.audioRate)) ? parsed.audioRate as LearnerPreferences['audioRate'] : .9,
      onboarded: Boolean(parsed.onboarded)
    };
  } catch {
    return { ...defaultPreferences };
  }
}

export function savePreferences(next: LearnerPreferences) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* local prototype can run without storage */ }
  return next;
}
