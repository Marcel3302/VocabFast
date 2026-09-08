type RecognitionAlternative = { transcript: string; confidence: number };
type RecognitionResult = { 0: RecognitionAlternative; isFinal: boolean; length: number };
type RecognitionEventLike = { results: ArrayLike<RecognitionResult> };
type RecognitionLike = {lang:string;continuous:boolean;interimResults:boolean;maxAlternatives:number;onresult:((event:RecognitionEventLike)=>void)|null;onerror:(()=>void)|null;onend:(()=>void)|null;start:()=>void;stop:()=>void};
type RecognitionCtor = new () => RecognitionLike;

const speechLocales:Record<string,string>={en:'en-US',hr:'hr-HR',es:'es-ES',fr:'fr-FR',de:'de-DE',it:'it-IT',pt:'pt-PT',zh:'zh-CN',ja:'ja-JP',ko:'ko-KR',ar:'ar-SA'};
function recognitionCtor():RecognitionCtor|null { const scope=window as typeof window&{SpeechRecognition?:RecognitionCtor;webkitSpeechRecognition?:RecognitionCtor};return scope.SpeechRecognition??scope.webkitSpeechRecognition??null; }
function voiceScore(voice:SpeechSynthesisVoice,language:string) {
  const name=voice.name.toLowerCase(),locale=speechLocales[language]||language,base=locale.split('-')[0];let score=0;
  if(voice.lang.toLowerCase()===locale.toLowerCase())score+=40;else if(voice.lang.toLowerCase().startsWith(`${base.toLowerCase()}-`))score+=28;
  if(/natural|neural|premium|enhanced/.test(name))score+=28;
  if(/aria|jenny|samantha|daniel|google|microsoft|apple/.test(name))score+=12;
  if(voice.localService)score+=3;return score;
}
function preferredVoice(language='en') {
  if(typeof window==='undefined'||!('speechSynthesis' in window))return null;
  const base=(speechLocales[language]||language).split('-')[0].toLowerCase();
  return window.speechSynthesis.getVoices().filter(voice=>voice.lang.toLowerCase().startsWith(base)).sort((a,b)=>voiceScore(b,language)-voiceScore(a,language))[0]??null;
}
export function canRecognizeSpeech(){return typeof window!=='undefined'&&Boolean(recognitionCtor());}
export function speakLanguage(text:string,language='en',rate=.9){
  if(typeof window==='undefined'||!('speechSynthesis' in window))return false;
  window.speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(text),voice=preferredVoice(language);
  if(voice){utterance.voice=voice;utterance.lang=voice.lang;}else utterance.lang=speechLocales[language]||language;
  utterance.rate=Math.max(.65,Math.min(1.08,rate));utterance.pitch=.98;utterance.volume=1;window.speechSynthesis.speak(utterance);return true;
}
export function recognizeLanguage(language:string,onTranscript:(value:string)=>void,onDone:()=>void,onError:()=>void){
  const Ctor=recognitionCtor();if(!Ctor)return null;const recognition=new Ctor();recognition.lang=speechLocales[language]||language;recognition.continuous=false;recognition.interimResults=true;recognition.maxAlternatives=3;
  recognition.onresult=event=>{let transcript='';for(let index=0;index<event.results.length;index+=1)transcript+=`${event.results[index][0]?.transcript??''} `;onTranscript(transcript.trim());};
  recognition.onerror=onError;recognition.onend=onDone;recognition.start();return recognition;
}
export function speakEnglish(text:string,rate=.9){return speakLanguage(text,'en',rate);}
export function recognizeEnglish(onTranscript:(value:string)=>void,onDone:()=>void,onError:()=>void){return recognizeLanguage('en',onTranscript,onDone,onError);}
