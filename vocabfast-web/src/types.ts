export type VocabLevel = 1 | 2 | 3;
export type VocabSource = 'manual' | 'voice' | 'image' | 'pdf' | 'top2000';

export interface VocabItem {
  id: string;
  english: string;
  german: string;
  level: VocabLevel;
  streak: number;
  active: boolean;
  source: VocabSource;
  correct: number;
  wrong: number;
  createdAt: string;
  updatedAt: string;
}

export type PageKey = 'home' | 'trainer' | 'add' | 'top' | 'words';
