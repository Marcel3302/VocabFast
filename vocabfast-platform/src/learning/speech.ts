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

export function canRecognizeSpeech() {
  return typeof window !== 'undefined' && Boolean(recognitionCtor());
}

export function speakEnglish(text: string, rate = .9) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = rate;
  utterance.pitch = 1;
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
  recognition.maxAlternatives = 1;
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
