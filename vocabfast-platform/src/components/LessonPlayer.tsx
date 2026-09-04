import { useEffect, useMemo, useState } from 'react';
import type { Exercise, Lesson, LessonResult } from '../learning/types';
import { recordConceptAnswer } from '../learning/mastery';
import './lesson-player.css';

type Props = {
  lesson: Lesson;
  onClose: () => void;
  onComplete: (result: LessonResult) => void;
};

function normalize(value: string) {
  return value
    .toLocaleLowerCase('en')
    .replace(/[.,!?;:'’“”\"()]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function expectedAnswer(exercise: Exercise) {
  if (exercise.type === 'translation' || exercise.type === 'dictation') return exercise.acceptedAnswers[0];
  if (exercise.type === 'sentence-build' || exercise.type === 'multiple-choice' || exercise.type === 'fill-gap' || exercise.type === 'listening') return exercise.answer;
  return '';
}

function speak(text: string) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = .9;
  window.speechSynthesis.speak(utterance);
}

export default function LessonPlayer({ lesson, onClose, onComplete }: Props) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState('');
  const [text, setText] = useState('');
  const [built, setBuilt] = useState<number[]>([]);
  const [checked, setChecked] = useState<boolean | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [xp, setXp] = useState(0);
  const [finished, setFinished] = useState(false);

  const exercise = lesson.exercises[index];
  const progress = finished ? 100 : Math.round((index / lesson.exercises.length) * 100);
  const builtText = useMemo(() => exercise?.type === 'sentence-build' ? built.map(i => exercise.tokens[i]).join(' ') : '', [built, exercise]);

  useEffect(() => {
    setSelected('');
    setText('');
    setBuilt([]);
    setChecked(null);
  }, [index]);

  function hasAnswer() {
    if (!exercise) return false;
    if (exercise.type === 'translation' || exercise.type === 'dictation') return text.trim().length > 0;
    if (exercise.type === 'sentence-build') return built.length > 0;
    return selected.length > 0;
  }

  function check() {
    if (!exercise || checked !== null) return;
    let correct = false;
    if (exercise.type === 'multiple-choice' || exercise.type === 'fill-gap' || exercise.type === 'listening') correct = selected === exercise.answer;
    if (exercise.type === 'translation' || exercise.type === 'dictation') correct = exercise.acceptedAnswers.some(answer => normalize(answer) === normalize(text));
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

  if (finished) {
    const accuracy = Math.round((correctCount / lesson.exercises.length) * 100);
    return (
      <div className="lesson-overlay" role="dialog" aria-modal="true">
        <div className="lesson-shell lesson-finish">
          <div className="finish-mark">✓</div>
          <span className="lesson-kicker">LEKTION ABGESCHLOSSEN</span>
          <h2>{lesson.title}</h2>
          <p>Stark gemacht. Dein Lernmodell hat jede Antwort auf Konzeptebene aktualisiert und plant die nächsten Wiederholungen.</p>
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

          {(exercise.type === 'multiple-choice') && (
            <div className="answer-grid">
              {exercise.choices.map(choice => <button key={choice} disabled={checked !== null} className={selected === choice ? 'selected' : ''} onClick={() => setSelected(choice)}>{choice}</button>)}
            </div>
          )}

          {exercise.type === 'fill-gap' && (
            <div className="fill-wrap">
              <div className="sentence-card">{exercise.sentence}</div>
              <div className="answer-grid compact">
                {exercise.choices.map(choice => <button key={choice} disabled={checked !== null} className={selected === choice ? 'selected' : ''} onClick={() => setSelected(choice)}>{choice}</button>)}
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
              <button className="audio-button" onClick={() => speak(exercise.speech)}><span>▶</span><div><strong>Audio abspielen</strong><small>Noch einmal anhören</small></div></button>
              {exercise.type === 'listening' ? (
                <div className="answer-grid">
                  {exercise.choices.map(choice => <button key={choice} disabled={checked !== null} className={selected === choice ? 'selected' : ''} onClick={() => setSelected(choice)}>{choice}</button>)}
                </div>
              ) : (
                <textarea autoFocus value={text} disabled={checked !== null} onChange={event => setText(event.target.value)} placeholder="Schreibe den gehörten Satz …" rows={4} />
              )}
            </div>
          )}
        </main>

        <footer className={`lesson-footer ${checked === true ? 'correct' : checked === false ? 'wrong' : ''}`}>
          {checked === null ? (
            <div className="footer-actions"><span className="keyboard-hint">Tipp: Erst antworten, dann prüfen.</span><button className="lesson-primary" disabled={!hasAnswer()} onClick={check}>Antwort prüfen</button></div>
          ) : (
            <div className="feedback-row">
              <div className="feedback-copy"><span className="feedback-icon">{checked ? '✓' : '!'}</span><div><strong>{checked ? 'Richtig!' : 'Noch nicht ganz.'}</strong>{!checked && <p>Richtig wäre: <b>{expectedAnswer(exercise)}</b></p>}{exercise.explanation && <small>{exercise.explanation}</small>}</div></div>
              <button className="lesson-primary" onClick={next}>{index === lesson.exercises.length - 1 ? 'Auswertung' : 'Weiter'}</button>
            </div>
          )}
        </footer>
      </div>
    </div>
  );
}
