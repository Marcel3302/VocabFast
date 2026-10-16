type RecognitionAlternative = { transcript: string; confidence: number };
type RecognitionResult = { 0: RecognitionAlternative; isFinal: boolean; length: number };
type RecognitionEventLike = { results: ArrayLike<RecognitionResult> };
type RecognitionLike = {lang:string;continuous:boolean;interimResults:boolean;maxAlternatives:number;onresult:((event:RecognitionEventLike)=>void)|null;onerror:(()=>void)|null;onend:(()=>void)|null;start:()=>void;stop:()=>void};
type RecognitionCtor = new () => RecognitionLike;

export const speechLocales:Record<string,string>={
  en:'en-US',hr:'hr-HR',sl:'sl-SI',es:'es-ES',fr:'fr-FR',de:'de-DE',it:'it-IT',pt:'pt-PT',nl:'nl-NL',pl:'pl-PL',cs:'cs-CZ',tr:'tr-TR',el:'el-GR',ru:'ru-RU',uk:'uk-UA',zh:'zh-CN',ja:'ja-JP',ko:'ko-KR',ar:'ar-SA'
};
function recognitionCtor():RecognitionCtor|null { const scope=window as typeof window&{SpeechRecognition?:RecognitionCtor;webkitSpeechRecognition?:RecognitionCtor};return scope.SpeechRecognition??scope.webkitSpeechRecognition??null; }
export type VoicePreference='natural'|'female';
const femaleVoicePattern=/female|woman|aria|ava|jenny|samantha|victoria|zira|susan|hazel|serena|sonia|natasha|emma|olivia|sofia|helena|katja|anna|paulina|monica|monika|laura|alice|amelie|clara|elena|isabella|lucia|marie|mei|xiaoxiao|nanami|sunhi|salma|leila/i;
function voiceScore(voice:SpeechSynthesisVoice,language:string,preference:VoicePreference='natural') {
  const name=voice.name.toLowerCase(),locale=speechLocales[language]||language,base=locale.split('-')[0];let score=0;
  if(voice.lang.toLowerCase()===locale.toLowerCase())score+=45;else if(voice.lang.toLowerCase().startsWith(`${base.toLowerCase()}-`))score+=30;
  if(/natural|neural|premium|enhanced|online/.test(name))score+=30;
  if(/google|microsoft|apple/.test(name))score+=10;
  if(preference==='female'&&femaleVoicePattern.test(name))score+=38;
  if(voice.localService)score+=3;return score;
}
export function preferredSpeechVoice(language='en',preference:VoicePreference='natural') {
  if(typeof window==='undefined'||!('speechSynthesis' in window))return null;
  const base=(speechLocales[language]||language).split('-')[0].toLowerCase();
  return window.speechSynthesis.getVoices().filter(voice=>voice.lang.toLowerCase().startsWith(base)).sort((a,b)=>voiceScore(b,language,preference)-voiceScore(a,language,preference))[0]??null;
}
export function canRecognizeSpeech(){return typeof window!=='undefined'&&Boolean(recognitionCtor());}
export function speakLanguage(text:string,language='en',rate=.9,preference:VoicePreference='natural',onEnd?:()=>void){
  if(typeof window==='undefined'||!('speechSynthesis' in window))return false;
  window.speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(text),voice=preferredSpeechVoice(language,preference);
  if(voice){utterance.voice=voice;utterance.lang=voice.lang;}else utterance.lang=speechLocales[language]||language;
  utterance.rate=Math.max(.65,Math.min(1.08,rate));utterance.pitch=preference==='female'?1.03:.98;utterance.volume=1;if(onEnd)utterance.onend=onEnd;window.speechSynthesis.speak(utterance);return true;
}
export function recognizeLanguage(language:string,onTranscript:(value:string)=>void,onDone:()=>void,onError:()=>void){
  const Ctor=recognitionCtor();if(!Ctor)return null;const recognition=new Ctor();recognition.lang=speechLocales[language]||language;recognition.continuous=false;recognition.interimResults=true;recognition.maxAlternatives=3;
  recognition.onresult=event=>{let transcript='';for(let index=0;index<event.results.length;index+=1)transcript+=`${event.results[index][0]?.transcript??''} `;onTranscript(transcript.trim());};
  recognition.onerror=onError;recognition.onend=onDone;recognition.start();return recognition;
}
export function speakEnglish(text:string,rate=.9){return speakLanguage(text,'en',rate);}
export function recognizeEnglish(onTranscript:(value:string)=>void,onDone:()=>void,onError:()=>void){return recognizeLanguage('en',onTranscript,onDone,onError);}
