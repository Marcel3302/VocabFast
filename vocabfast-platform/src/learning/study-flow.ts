import type { LanguageCode } from './preferences';

export type SpeakDraft={
  targetText:string;
  supportText:string;
  sourceLanguage:LanguageCode;
  targetLanguage:LanguageCode;
  createdAt:number;
};

export const TRANSLATE_DRAFT_KEY='vocabfast-translate-draft-v1';
const SPEAK_DRAFT_KEY='vocabfast-speak-draft-v1';
const MAX_DRAFT_AGE=24*60*60*1000;

export function queueTranslateDraft(text:string,source:LanguageCode){
  try{localStorage.setItem(TRANSLATE_DRAFT_KEY,JSON.stringify({text:text.trim(),source}));}catch{/* Navigation still works if local storage is unavailable. */}
}

export function queueSpeakDraft(draft:Omit<SpeakDraft,'createdAt'>){
  try{localStorage.setItem(SPEAK_DRAFT_KEY,JSON.stringify({...draft,createdAt:Date.now()}));}catch{/* Practice handoff is optional. */}
}

export function consumeSpeakDraft():SpeakDraft|null{
  try{
    const raw=localStorage.getItem(SPEAK_DRAFT_KEY);if(!raw)return null;localStorage.removeItem(SPEAK_DRAFT_KEY);
    const parsed=JSON.parse(raw) as Partial<SpeakDraft>;
    if(typeof parsed.targetText!=='string'||!parsed.targetText.trim()||typeof parsed.supportText!=='string')return null;
    const createdAt=Number(parsed.createdAt)||0;if(createdAt&&Date.now()-createdAt>MAX_DRAFT_AGE)return null;
    return{
      targetText:parsed.targetText.trim().slice(0,500),
      supportText:parsed.supportText.trim().slice(0,500),
      sourceLanguage:String(parsed.sourceLanguage||'de') as LanguageCode,
      targetLanguage:String(parsed.targetLanguage||'en') as LanguageCode,
      createdAt:createdAt||Date.now()
    };
  }catch{return null;}
}
