export type ConceptMastery = {
  conceptId: string;
  attempts: number;
  correct: number;
  streak: number;
  strength: number;
  lastSeenAt: string;
  dueAt: string;
};

const STORAGE_KEY = 'vocabfast.platform.mastery.v1';

function readAll(): Record<string, ConceptMastery> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) as Record<string, ConceptMastery> : {};
  } catch {
    return {};
  }
}

function clamp(value: number) {
  return Math.max(0, Math.min(1, value));
}

function dueDelayMs(strength: number, correct: boolean) {
  if (!correct) return 10 * 60 * 1000;
  if (strength >= .85) return 14 * 24 * 60 * 60 * 1000;
  if (strength >= .65) return 7 * 24 * 60 * 60 * 1000;
  if (strength >= .4) return 3 * 24 * 60 * 60 * 1000;
  return 24 * 60 * 60 * 1000;
}

export function recordConceptAnswer(conceptIds: string[], correct: boolean) {
  const all = readAll();
  const now = new Date();

  for (const conceptId of conceptIds) {
    const previous = all[conceptId];
    const nextStrength = clamp((previous?.strength ?? .12) + (correct ? .12 : -.18));
    all[conceptId] = {
      conceptId,
      attempts: (previous?.attempts ?? 0) + 1,
      correct: (previous?.correct ?? 0) + (correct ? 1 : 0),
      streak: correct ? (previous?.streak ?? 0) + 1 : 0,
      strength: nextStrength,
      lastSeenAt: now.toISOString(),
      dueAt: new Date(now.getTime() + dueDelayMs(nextStrength, correct)).toISOString()
    };
  }

  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(all)); } catch { /* prototype storage can fail in private modes */ }
  return all;
}

export function getMasterySnapshot() {
  return Object.values(readAll()).sort((a, b) => a.strength - b.strength || b.attempts - a.attempts);
}

export function getDueConcepts(reference = new Date()) {
  const now = reference.getTime();
  return getMasterySnapshot()
    .filter(item => new Date(item.dueAt).getTime() <= now)
    .sort((a, b) => a.strength - b.strength);
}
