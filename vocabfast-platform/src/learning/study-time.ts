import { activePairKey } from './preferences';
const key=()=>`vocabfast.platform.study-time.v1:${activePairKey()}`;
const today=()=>new Date().toLocaleDateString('sv-SE');
export function studySeconds(){try{return Number(JSON.parse(localStorage.getItem(key())||'{}')[today()])||0;}catch{return 0;}}
export function recordStudySeconds(seconds:number){let days:Record<string,number>={};try{days=JSON.parse(localStorage.getItem(key())||'{}');}catch{/* start a valid log */}days[today()]=(days[today()]||0)+Math.max(0,Math.round(seconds));localStorage.setItem(key(),JSON.stringify(days));}
