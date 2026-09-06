import { useEffect, useMemo, useRef, useState } from 'react';
import type { Exercise, Lesson, LessonResult } from '../learning/types';
import { recordConceptAnswer } from '../learning/mastery';
import { canRecognizeSpeech, recognizeEnglish, speakEnglish } from '../learning/speech';
import './lesson-player.css';
import './speech-practice.css';

type Props = {
  lesson: Lesson;
  audioRate?: number;
  onClose: () => void;
  onComplete: (result: LessonResult) => void;
};

function normalize(value: string) {
  return value
    .toLocaleLowerCase('en')
    .replace(/\b(i am)\b/g,"i'm")
    .replace(/\b(cannot)\b/g,"can't")
    .replace(/\b(do not)\b/g,"don't")
    .replace(/\b(does not)\b/g,"doesn't")
    .replace(/\b(did not)\b/g,"didn't")
    .replace(/\b(will not)\b/g,"won't")
    .replace(/\b(would not)\b/g,"wouldn't")
    .replace(/\b(could not)\b/g,"couldn't")
    .replace(/\b(should not)\b/g,"shouldn't")
    .replace(/[.,!?;:'’“”\"()\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function editDistance(left:string,right:string) {
  const a=normalize(left),b=normalize(right);
  if(a===b)return 0;
  if(!a.length)return b.length;
  if(!b.length)return a.length;
  const prev=Array.from({length:b.length+1},(_,index)=>index);
  for(let i=1;i<=a.length;i+=1) {
    let diagonal=prev[0];
    prev[0]=i;
    for(let j=1;j<=b.length;j+=1) {
      const old=prev[j];
      prev[j]=Math.min(prev[j]+1,prev[j-1]+1,diagonal+(a[i-1]===b[j-1]?0:1));
      diagonal=old;
    }
  }
  return prev[b.length];
}

function similarity(left:string,right:string) {
  const a=normalize(left),b=normalize(right);
  if(!a||!b)return 0;
  if(a===b)return 1;
  const max=Math.max(a.length,b.length);
  return max?1-editDistance(a,b)/max:1;
}

function answerMatches(input:string,answers:string[],threshold:number) {
  const value=normalize(input);
  if(!value)return false;
  return answers.some(answer=>{
    const expected=normalize(answer);
    if(value===expected)return true;
    const wordCount=Math.max(value.split(' ').length,expected.split(' ').length);
    if(wordCount<=2)return false;
    return similarity(value,expected)>=threshold;
  });
}

function hashString(value:string) {
  let hash=2166136261;
  for(let index=0;index<value.length;index+=1){hash^=value.charCodeAt(index);hash=Math.imul(hash,16777619);}
  return hash>>>0;
}

function seededChoices<T>(items:T[],seedText:string) {
  const copy=[...items];
  let seed=hashString(seedText)||1;
  function random(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}
  for(let index=copy.length-1;index>0;index-=1){const swap=Math.floor(random()*(index+1));[copy[index],copy[swap]]=[copy[swap],copy[index]];}
  return copy;
}

function expectedAnswer(exercise: Exercise) {
  if (exercise.type === 'translation' || exercise.type === 'dictation' || exercise.type === 'speaking') return exercise.acceptedAnswers[0];
  if (exercise.type === 'sentence-build' || exercise.type === 'multiple-choice' || exercise.type === 'fill-gap' || exercise.type === 'listening') return exercise.answer;
  return '';
}

export default function LessonPlayer({ lesson, audioRate = .9, onClose, onComplete }: Props) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState('');
  const [text, setText] = useState('');
  const [built, setBuilt] = useState<number[]>([]);
  const [checked, setChecked] = useState<boolean | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [xp, setXp] = useState(0);
  const [finished, setFinished] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState('');
  const recognitionRef = useRef<{ stop: () => void } | null>(null);

  const exercise = lesson.exercises[index];
  const progress = finished ? 100 : Math.round((index / lesson.exercises.length) * 100);
  const builtText = useMemo(() => exercise?.type === 'sentence-build' ? built.map(i => exercise.tokens[i]).join(' ') : '', [built, exercise]);
  const speechSupported = canRecognizeSpeech();
  const choices=useMemo(()=>{
    if(!exercise||!('choices' in exercise))return [] as string[];
    return seededChoices(exercise.choices,`${lesson.id}:${exercise.id}`);
  },[exercise,lesson.id]);

  useEffect(() => {
    setSelected('');
    setText('');
    setBuilt([]);
    setChecked(null);
    setSpeechError('');
    setIsListening(false);
    recognitionRef.current?.stop();
    recognitionRef.current = null;
  }, [index]);

  useEffect(() => () => recognitionRef.current?.stop(), []);

  function hasAnswer() {
    if (!exercise) return false;
    if (exercise.type === 'translation' || exercise.type === 'dictation' || exercise.type === 'speaking') return text.trim().length > 0;
    if (exercise.type === 'sentence-build') return built.length > 0;
    return selected.length > 0;
  }

  function check() {
    if (!exercise || checked !== null) return;
    let correct = false;
    if (exercise.type === 'multiple-choice' || exercise.type === 'fill-gap' || exercise.type === 'listening') correct = selected === exercise.answer;
    if (exercise.type === 'translation') correct = answerMatches(text,exercise.acceptedAnswers,.9);
    if (exercise.type === 'dictation') correct = answerMatches(text,exercise.acceptedAnswers,.86);
    if (exercise.type === 'speaking') correct = answerMatches(text,exercise.acceptedAnswers,.78);
    if (exercise.type === 'sentence-build') correct = normalize(builtText) === normalize(exercise.answer);

    setChecked(correct);
    recordConceptAnswer(exercise.conceptIds, correct);
    if (correct) {
      setCorrectCount(value => value + 1);
      setXp(value => value + exercise.xp);
    }
  }

  function next() {
    if (index >= lesson.exercises.length - 1) {
      setFinished(true);
      return;
    }
    setIndex(value => value + 1);
  }

  function finishLesson() {
    const result: LessonResult = {
      lessonId: lesson.id,
      correct: correctCount,
      total: lesson.exercises.length,
      accuracy: Math.round((correctCount / lesson.exercises.length) * 100),
      xp
    };
    onComplete(result);
    onClose();
  }

  function toggleToken(tokenIndex: number) {
    if (checked !== null) return;
    setBuilt(current => current.includes(tokenIndex) ? current.filter(item => item !== tokenIndex) : [...current, tokenIndex]);
  }

  function startSpeaking() {
    if (!exercise || exercise.type !== 'speaking' || isListening || checked !== null) return;
    setText('');
    setSpeechError('');
    setIsListening(true);
    const recognition = recognizeEnglish(
      transcript => setText(transcript),
      () => { setIsListening(false); recognitionRef.current = null; },
      () => { setIsListening(false); setSpeechError('Die Spracherkennung konnte nicht gestartet werden. Du kannst den Satz unten auch eintippen.'); recognitionRef.current = null; }
    );
    recognitionRef.current = recognition;
    if (!recognition) {
      setIsListening(false);
      setSpeechError('Dein Browser unterstützt hier keine Spracherkennung. Tippe den gesprochenen Satz unten ein oder verwende einen Browser mit Web-Spracherkennung.');
    }
  }

  if (finished) {
    const accuracy = Math.round((correctCount / lesson.exercises.length) * 100);
    const headline = accuracy >= 90 ? 'Ausgezeichnet.' : accuracy >= 70 ? 'Starke Session.' : 'Guter Anfang.';
    return (
      <div className="lesson-overlay" role="dialog" aria-modal="true">
        <div className="lesson-shell lesson-finish">
          <div className="finish-mark">✓</div>
          <span className="lesson-kicker">LEKTION ABGESCHLOSSEN</span>
          <h2>{headline}</h2>
          <p>{lesson.title} ist gespeichert. Jede Antwort hat dein Lernmodell aktualisiert und beeinflusst die nächste adaptive Wiederholung.</p>
          <div className="finish-stats">
            <div><strong>{accuracy}%</strong><span>Genauigkeit</span></div>
            <div><strong>{correctCount}/{lesson.exercises.length}</strong><span>Richtig</span></div>
            <div><strong>+{xp}</strong><span>XP</span></div>
          </div>
          <button className="lesson-primary wide" onClick={finishLesson}>Zurück zum Lernpfad</button>
        </div>
      </div>
    );
  }

  return (
    <div className="lesson-overlay" role="dialog" aria-modal="true" aria-labelledby="lessonTitle">
      <div className="lesson-shell">
        <header className="lesson-header">
          <button className="lesson-close" onClick={onClose} aria-label="Lektion schließen">×</button>
          <div className="lesson-progress"><span style={{ width: `${progress}%` }} /></div>
          <div className="lesson-xp"><span>◆</span><strong>{xp}</strong></div>
        </header>

        <main className="lesson-content">
          <div className="lesson-meta">
            <span className="lesson-kicker">{lesson.level} · {lesson.title}</span>
            <span>{index + 1} / {lesson.exercises.length}</span>
          </div>
          <h1 id="lessonTitle">{exercise.instruction}</h1>
          <p className="lesson-prompt">{exercise.prompt}</p>

          {exercise.type === 'multiple-choice' && (
            <div className="answer-grid">
              {choices.map(choice => <button key={choice} disabled={checked !== null} className={selected === choice ? 'selected' : ''} onClick={() => setSelected(choice)}>{choice}</button>)}
            </div>
          )}

          {exercise.type === 'fill-gap' && (
            <div className="fill-wrap">
              <div className="sentence-card">{exercise.sentence}</div>
              <div className="answer-grid compact">
                {choices.map(choice => <button key={choice} disabled={checked !== null} className={selected === choice ? 'selected' : ''} onClick={() => setSelected(choice)}>{choice}</button>)}
              </div>
            </div>
          )}

          {exercise.type === 'translation' && (
            <div className="translation-wrap">
              <div className="source-card"><span>DE</span><strong>{exercise.sourceText}</strong></div>
              <textarea autoFocus value={text} disabled={checked !== null} onChange={event => setText(event.target.value)} placeholder="Deine englische Übersetzung …" rows={4} />
            </div>
          )}

          {exercise.type === 'sentence-build' && (
            <div className="builder-wrap">
              <div className={`build-target ${built.length ? 'has-words' : ''}`}>{built.length ? built.map(i => <button key={i} disabled={checked !== null} onClick={() => toggleToken(i)}>{exercise.tokens[i]}</button>) : <span>Tippe die Wörter in der richtigen Reihenfolge an.</span>}</div>
              <div className="token-bank">
                {exercise.tokens.map((token, tokenIndex) => <button key={`${token}-${tokenIndex}`} disabled={built.includes(tokenIndex) || checked !== null} onClick={() => toggleToken(tokenIndex)}>{token}</button>)}
              </div>
            </div>
          )}

          {(exercise.type === 'listening' || exercise.type === 'dictation') && (
            <div className="listening-wrap">
              <button className="audio-button" onClick={() => speakEnglish(exercise.speech, audioRate)}><span>▶</span><div><strong>Audio abspielen</strong><small>Englische Stimme · {audioRate===.75?'langsam':audioRate===1?'normal':'Lernmodus'}</small></div></button>
              {exercise.type === 'listening' ? (
                <div className="answer-grid">
                  {choices.map(choice => <button key={choice} disabled={checked !== null} className={selected === choice ? 'selected' : ''} onClick={() => setSelected(choice)}>{choice}</button>)}
                </div>
              ) : (
                <textarea autoFocus value={text} disabled={checked !== null} onChange={event => setText(event.target.value)} placeholder="Schreibe den gehörten Satz …" rows={4} />
              )}
            </div>
          )}

          {exercise.type === 'speaking' && (
            <div className="speaking-wrap">
              <div className="speak-target">
                <span className="speak-label">ZIELSATZ</span>
                <strong>{exercise.speech}</strong>
                <button onClick={()=>speakEnglish(exercise.speech, audioRate)}>▶ Aussprache anhören</button>
              </div>
              <button className={`record-button ${isListening?'recording':''}`} disabled={checked!==null} onClick={startSpeaking}>
                <span className="record-orb">{isListening?'■':'●'}</span>
                <div><strong>{isListening?'Ich höre zu …':'Aufnahme starten'}</strong><small>{speechSupported?'Sprich den Zielsatz in dein Mikrofon.':'Alternativ kannst du den Satz unten eingeben.'}</small></div>
              </button>
              <div className="transcript-card">
                <span>ERKANNT</span>
                <textarea value={text} disabled={checked!==null} onChange={event=>setText(event.target.value)} placeholder={isListening?'Sprich jetzt …':'Dein erkannter Satz erscheint hier.'} rows={3}/>
              </div>
              {speechError&&<div className="speech-notice">{speechError}</div>}
              <small className="speech-privacy">VocabFast speichert dabei keine Audioaufnahme. Je nach Browser kann die Spracherkennung über den Dienst des Browser-Anbieters verarbeitet werden.</small>
            </div>
          )}
        </main>

        <footer className={`lesson-footer ${checked === true ? 'correct' : checked === false ? 'wrong' : ''}`}>
          {checked === null ? (
            <div className="footer-actions"><span className="keyboard-hint">Erst antworten, dann prüfen.</span><button className="lesson-primary" disabled={!hasAnswer()} onClick={check}>Antwort prüfen</button></div>
          ) : (
            <div className="feedback-row">
              <div className="feedback-copy"><span className="feedback-icon">{checked ? '✓' : '!'}</span><div><strong>{checked ? 'Richtig!' : 'Noch nicht ganz.'}</strong>{!checked && <p>Eine passende Lösung wäre: <b>{expectedAnswer(exercise)}</b></p>}{exercise.explanation && <small>{exercise.explanation}</small>}</div></div>
              <button className="lesson-primary" onClick={next}>{index === lesson.exercises.length - 1 ? 'Auswertung' : 'Weiter'}</button>
            </div>
          )}
        </footer>
      </div>
    </div>
  );
}
