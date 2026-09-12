import { languages, learnableLanguages } from '../data/catalog';

export type LearningReason = 'alltag' | 'reise' | 'beruf' | 'fachsprache';
export type LanguageCode = 'en'|'hr'|'es'|'fr'|'de'|'it'|'pt'|'zh'|'ja'|'ko'|'ar';
export type LearningPair = {
  id:string;
  sourceLanguage:LanguageCode;
  targetLanguage:LanguageCode;
  createdAt:number;
};

export type LearnerPreferences = {
  name: string;
  sourceLanguage: LanguageCode;
  targetLanguage: LanguageCode;
  learningPairs: LearningPair[];
  dailyMinutes: 5 | 10 | 15 | 20;
  reason: LearningReason;
  audioRate: .75 | .9 | 1;
  onboarded: boolean;
};

const STORAGE_KEY = 'vocabfast.platform.preferences.v2';
const LEGACY_KEY = 'vocabfast.platform.preferences.v1';
const languageCodes=new Set(languages.map(language=>language.code));
const learnableCodes=new Set(learnableLanguages.map(language=>language.code));

function validLanguage(value:unknown,fallback:LanguageCode):LanguageCode {
  return languageCodes.has(String(value)) ? String(value) as LanguageCode : fallback;
}

function pairId(source:LanguageCode,target:LanguageCode) {
  return `${source}-${target}`;
}

function normalizePair(value:unknown):LearningPair|null {
  if(!value||typeof value!=='object')return null;
  const raw=value as Partial<LearningPair>;
  const source=validLanguage(raw.sourceLanguage,'de');
  const target=validLanguage(raw.targetLanguage,'en');
  if(source===target||!learnableCodes.has(target))return null;
  return {id:pairId(source,target),sourceLanguage:source,targetLanguage:target,createdAt:Number(raw.createdAt)||Date.now()};
}

export const defaultPreferences: LearnerPreferences = {
  name: 'Lernender',
  sourceLanguage: 'de',
  targetLanguage: 'en',
  learningPairs: [{id:'de-en',sourceLanguage:'de',targetLanguage:'en',createdAt:Date.now()}],
  dailyMinutes: 10,
  reason: 'alltag',
  audioRate: .9,
  onboarded: false
};

export function activePairKey(preferences?:LearnerPreferences) {
  const current=preferences??readPreferences();
  return pairId(current.sourceLanguage,current.targetLanguage);
}

export function withActivePair(preferences:LearnerPreferences,sourceLanguage:LanguageCode,targetLanguage:LanguageCode) {
  const source=validLanguage(sourceLanguage,'de'),target=validLanguage(targetLanguage,'en');
  if(source===target||!learnableCodes.has(target))return preferences;
  const id=pairId(source,target);
  const pairs=preferences.learningPairs.some(pair=>pair.id===id)
    ? preferences.learningPairs
    : [...preferences.learningPairs,{id,sourceLanguage:source,targetLanguage:target,createdAt:Date.now()}];
  return {...preferences,sourceLanguage:source,targetLanguage:target,learningPairs:pairs};
}

export function removeLearningPair(preferences:LearnerPreferences,id:string) {
  if(preferences.learningPairs.length<=1)return preferences;
  const pairs=preferences.learningPairs.filter(pair=>pair.id!==id);
  if(pairs.length===preferences.learningPairs.length)return preferences;
  if(activePairKey(preferences)!==id)return {...preferences,learningPairs:pairs};
  const next=pairs[0];
  return {...preferences,sourceLanguage:next.sourceLanguage,targetLanguage:next.targetLanguage,learningPairs:pairs};
}

export function readPreferences(): LearnerPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_KEY);
    if (!raw) return { ...defaultPreferences, learningPairs:[...defaultPreferences.learningPairs] };
    const parsed = JSON.parse(raw) as Partial<LearnerPreferences>;
    const sourceLanguage=validLanguage(parsed.sourceLanguage,'de');
    let targetLanguage=validLanguage(parsed.targetLanguage,'en');
    if(sourceLanguage===targetLanguage||!learnableCodes.has(targetLanguage))targetLanguage='en';
    let learningPairs=Array.isArray(parsed.learningPairs)?parsed.learningPairs.map(normalizePair).filter(Boolean) as LearningPair[]:[];
    const currentId=pairId(sourceLanguage,targetLanguage);
    if(!learningPairs.some(pair=>pair.id===currentId))learningPairs=[...learningPairs,{id:currentId,sourceLanguage,targetLanguage,createdAt:Date.now()}];
    const seen=new Set<string>();
    learningPairs=learningPairs.filter(pair=>!seen.has(pair.id)&&seen.add(pair.id));
    return {
      name: typeof parsed.name === 'string' && parsed.name.trim() ? parsed.name.trim().slice(0, 40) : defaultPreferences.name,
      sourceLanguage,
      targetLanguage,
      learningPairs,
      dailyMinutes: [5,10,15,20].includes(Number(parsed.dailyMinutes)) ? parsed.dailyMinutes as LearnerPreferences['dailyMinutes'] : 10,
      reason: ['alltag','reise','beruf','fachsprache'].includes(String(parsed.reason)) ? parsed.reason as LearningReason : 'alltag',
      audioRate: [.75,.9,1].includes(Number(parsed.audioRate)) ? parsed.audioRate as LearnerPreferences['audioRate'] : .9,
      onboarded: Boolean(parsed.onboarded)
    };
  } catch {
    return { ...defaultPreferences, learningPairs:[...defaultPreferences.learningPairs] };
  }
}

export function savePreferences(next: LearnerPreferences) {
  const normalized=withActivePair(next,next.sourceLanguage,next.targetLanguage);
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized)); localStorage.removeItem(LEGACY_KEY); } catch { /* local persistence can fail */ }
  return normalized;
}
