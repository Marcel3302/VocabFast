import { activePairKey } from './preferences';
import { queueAccountSync } from './account';

export type PersonalWord = { id:string; word:string; translation:string; tag:string; stage:0|1|2|3; hits:number; dueAt:number; createdAt?:number };
const key=()=>`vocabfast.platform.personal-words.v1:${activePairKey()}`;

export function normalizeWordIdentity(value:string){return value.trim().replace(/\s+/g,' ').toLocaleLowerCase();}
export function findDuplicateWord(current:PersonalWord[],word:string,ignoreId?:string){const identity=normalizeWordIdentity(word);return current.find(item=>item.id!==ignoreId&&normalizeWordIdentity(item.word)===identity)??null;}
export function dedupeWords(words:PersonalWord[]){const seen=new Set<string>();return words.filter(item=>{const identity=normalizeWordIdentity(item.word);if(!identity||seen.has(identity))return false;seen.add(identity);return true;});}
export function readWords():PersonalWord[]{try{const parsed=JSON.parse(localStorage.getItem(key())||'[]');return Array.isArray(parsed)?dedupeWords(parsed):[];}catch{return [];}}
export function saveWords(words:PersonalWord[]){const unique=dedupeWords(words);localStorage.setItem(key(),JSON.stringify(unique));queueAccountSync();return unique;}
export function makeWord(word:string,translation:string,tag='Eigene Wörter'):PersonalWord{return{id:crypto.randomUUID(),word:word.trim(),translation:translation.trim(),tag:tag.trim()||'Eigene Wörter',stage:3,hits:0,dueAt:0,createdAt:Date.now()};}
export function rateWord(word:PersonalWord,correct:boolean,now=Date.now()):PersonalWord{
  let stage=word.stage,hits=correct?word.hits+1:0;
  if(!correct)stage=stage===1?2:3;
  else if(hits>=5){stage=Math.max(0,stage-1) as PersonalWord['stage'];hits=0;}
  const delay=correct?({0:3650,1:7,2:1,3:0}[stage]*86400000):0;
  return{...word,stage,hits,dueAt:now+delay};
}
export function mergeWords(current:PersonalWord[],incoming:PersonalWord[]){const base=dedupeWords(current),seen=new Set(base.map(item=>normalizeWordIdentity(item.word)));return[...base,...incoming.filter(item=>{const identity=normalizeWordIdentity(item.word);if(!identity||seen.has(identity))return false;seen.add(identity);return true;})];}
export function parseWordImport(text:string):PersonalWord[]{
  let rows:unknown;
  if(text.trim().startsWith('[')){try{rows=JSON.parse(text);}catch{throw new Error('Die JSON-Datei ist ungültig.');}}
  else rows=text.split(/\r?\n/).filter(line=>line.trim()).map((line,index)=>{const [word,translation,tag,...extra]=line.split('\t');if(!word?.trim()||!translation?.trim()||extra.length)throw new Error(`Zeile ${index+1}: Wort und Übersetzung mit einem Tab trennen.`);return{word,translation,tag};});
  if(!Array.isArray(rows)||!rows.length||rows.length>5000)throw new Error('Bitte importiere zwischen 1 und 5.000 Wörtern.');
  return rows.map((row,index)=>{if(!row||typeof row.word!=='string'||typeof row.translation!=='string'||!row.word.trim()||!row.translation.trim()||row.word.length>200||row.translation.length>500)throw new Error(`Eintrag ${index+1}: Wort oder Übersetzung fehlt oder ist zu lang.`);return makeWord(row.word,row.translation,typeof row.tag==='string'?row.tag.slice(0,60):undefined);});
}
