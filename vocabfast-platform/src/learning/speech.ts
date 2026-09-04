type RecognitionAlternative = { transcript: string; confidence: number };
type RecognitionResult = { 0: RecognitionAlternative; isFinal: boolean; length: number };
type RecognitionEventLike = { results: ArrayLike<RecognitionResult> };

type RecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: RecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type RecognitionCtor = new () => RecognitionLike;

function recognitionCtor(): RecognitionCtor | null {
  const scope = window as typeof window & {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  };
  return scope.SpeechRecognition ?? scope.webkitSpeechRecognition ?? null;
}

function voiceScore(voice:SpeechSynthesisVoice) {
  const name=voice.name.toLowerCase();
  let score=0;
  if(/^en[-_]/i.test(voice.lang))score+=30;
  if(/natural|neural|premium|enhanced/.test(name))score+=28;
  if(/aria|jenny|samantha|daniel|google us english|google uk english/.test(name))score+=20;
  if(/microsoft|google|apple/.test(name))score+=8;
  if(voice.localService)score+=3;
  if(/^en[-_]gb/i.test(voice.lang))score+=2;
  return score;
}

function preferredEnglishVoice() {
  if(typeof window==='undefined'||!('speechSynthesis' in window))return null;
  const voices=window.speechSynthesis.getVoices().filter(voice=>/^en[-_]/i.test(voice.lang));
  return voices.sort((a,b)=>voiceScore(b)-voiceScore(a))[0]??null;
}

export function canRecognizeSpeech() {
  return typeof window !== 'undefined' && Boolean(recognitionCtor());
}

export function speakEnglish(text: string, rate = .9) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  const voice=preferredEnglishVoice();
  if(voice){utterance.voice=voice;utterance.lang=voice.lang;}else utterance.lang='en-US';
  utterance.rate=Math.max(.65,Math.min(1.08,rate));
  utterance.pitch=.98;
  utterance.volume=1;
  window.speechSynthesis.speak(utterance);
  return true;
}

export function recognizeEnglish(onTranscript: (value: string) => void, onDone: () => void, onError: () => void) {
  const Ctor = recognitionCtor();
  if (!Ctor) return null;
  const recognition = new Ctor();
  recognition.lang = 'en-US';
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.maxAlternatives = 3;
  recognition.onresult = event => {
    let transcript = '';
    for (let index = 0; index < event.results.length; index += 1) {
      transcript += `${event.results[index][0]?.transcript ?? ''} `;
    }
    onTranscript(transcript.trim());
  };
  recognition.onerror = onError;
  recognition.onend = onDone;
  recognition.start();
  return recognition;
}
