import type { VocabItem, VocabSource } from './types';

const STORAGE_KEY = 'vocabfast.words.v1';

export function loadWords(): VocabItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return starterWords();
    return JSON.parse(raw) as VocabItem[];
  } catch {
    return starterWords();
  }
}

export function saveWords(words: VocabItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(words));
}

export function createWord(english: string, german: string, source: VocabSource = 'manual'): VocabItem {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    english: english.trim(),
    german: german.trim(),
    level: 3,
    streak: 0,
    active: true,
    source,
    correct: 0,
    wrong: 0,
    createdAt: now,
    updatedAt: now,
  };
}

export function starterWords(): VocabItem[] {
  return [
    createWord('environment', 'Umwelt'),
    createWord('achievement', 'Erfolg / Errungenschaft'),
    createWord('opportunity', 'Möglichkeit / Gelegenheit'),
    createWord('supplier', 'Lieferant'),
    createWord('revenue', 'Umsatz'),
  ];
}

export async function translateWord(text: string, source = 'en', target = 'de'): Promise<string> {
  const res = await fetch(`/api/translate?q=${encodeURIComponent(text)}&source=${source}&target=${target}`);
  if (!res.ok) throw new Error('Übersetzung aktuell nicht verfügbar.');
  const data = await res.json() as { translation?: string; error?: string };
  if (!data.translation) throw new Error(data.error || 'Keine Übersetzung gefunden.');
  return data.translation;
}

export function normalize(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[.,!?;:()"'’]/g, '')
    .replace(/\s+/g, ' ');
}

export function isCorrectAnswer(answer: string, expected: string) {
  const actual = normalize(answer);
  const candidates = expected
    .split(/[\/;,]/)
    .map(normalize)
    .filter(Boolean);
  return candidates.includes(actual);
}

export function extractTokens(text: string): string[] {
  const matches = text.match(/[A-Za-z]+(?:['’-][A-Za-z]+)*/g) || [];
  return Array.from(new Set(matches.map((w) => w.toLowerCase()))).filter((w) => w.length > 1);
}
