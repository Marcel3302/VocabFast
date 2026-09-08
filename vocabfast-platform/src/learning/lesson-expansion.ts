import type { Exercise, Lesson, ListeningExercise, TranslationExercise } from './types';

function sentenceTokens(value: string) {
  return value.replace(/([,.!?;:])/g, ' $1 ').replace(/\s+/g, ' ').trim().split(' ');
}
function rotateTokens(tokens: string[],offset=.55) {
  if (tokens.length < 4) return [...tokens].reverse();
  const cut = Math.max(2, Math.floor(tokens.length * offset));
  return [...tokens.slice(cut), ...tokens.slice(0, cut)];
}
function translationOf(lesson: Lesson) { return lesson.exercises.find((exercise): exercise is TranslationExercise => exercise.type === 'translation'); }
function listeningOf(lesson: Lesson) { return lesson.exercises.find((exercise): exercise is ListeningExercise => exercise.type === 'listening'); }

export function expandLesson(lesson: Lesson): Lesson {
  if (lesson.exercises.length >= 12) return lesson;
  const translation = translationOf(lesson);
  const listening = listeningOf(lesson);
  const target = translation?.acceptedAnswers[0] || listening?.speech || '';
  if (!target) return lesson;
  const conceptIds = translation?.conceptIds?.length ? translation.conceptIds : lesson.newConcepts;
  const difficulty = translation?.difficulty ?? lesson.exercises[0]?.difficulty ?? 2;
  const baseXp = Math.max(4, translation?.xp ?? lesson.exercises[0]?.xp ?? 6);
  const source=translation?.sourceText || lesson.subtitle;
  const additions: Exercise[] = [
    {id:`${lesson.id}-recall-speaking`,type:'speaking',instruction:'Aktiver Abruf: Sprich den Zielsatz ohne Hilfen.',prompt:source,speech:target,acceptedAnswers:[target],conceptIds,difficulty,xp:baseXp+3,explanation:'Aktives Sprechen stärkt den Abruf stärker als reines Wiedererkennen.'},
    {id:`${lesson.id}-recall-dictation`,type:'dictation',instruction:'Höre den Satz und schreibe ihn vollständig aus dem Gedächtnis.',prompt:'Achte auf Funktionswörter, Wortstellung und Endungen.',speech:target,acceptedAnswers:[target],conceptIds,difficulty,xp:baseXp+3},
    {id:`${lesson.id}-recall-build`,type:'sentence-build',instruction:'Baue den Zielsatz noch einmal ohne Übersetzungshilfe.',prompt:lesson.title,tokens:rotateTokens(sentenceTokens(target)),answer:target,conceptIds,difficulty,xp:baseXp+2},
    translation ? {id:`${lesson.id}-recall-translation`,type:'translation',instruction:'Transfer: Übersetze die Aussage erneut möglichst natürlich.',prompt:'Formuliere sinngemäß und achte auf eine natürliche Zielsprache.',sourceText:translation.sourceText,acceptedAnswers:translation.acceptedAnswers,conceptIds,difficulty,xp:baseXp+4,explanation:'Die zweite Produktionsrunde prüft, ob die Struktur wirklich abrufbar ist.'} : {id:`${lesson.id}-recall-listening-speaking`,type:'speaking',instruction:'Höre die Aussage und sprich sie anschließend selbst.',prompt:'Imitiere Rhythmus und Satzmelodie.',speech:listening?.speech || target,acceptedAnswers:[listening?.speech || target],conceptIds,difficulty,xp:baseXp+4},
    {id:`${lesson.id}-speed-speaking`,type:'speaking',instruction:'Flüssigkeitsrunde: Sprich den Satz noch einmal in natürlichem Tempo.',prompt:'Fokus: Rhythmus, Sicherheit und zusammenhängende Aussprache.',speech:target,acceptedAnswers:[target],conceptIds,difficulty,xp:baseXp+4},
    {id:`${lesson.id}-precision-dictation`,type:'dictation',instruction:'Präzisionsrunde: Höre erneut und schreibe jedes Wort korrekt.',prompt:'Kontrolliere besonders kurze Funktionswörter und Endungen.',speech:target,acceptedAnswers:[target],conceptIds,difficulty,xp:baseXp+4},
    {id:`${lesson.id}-second-build`,type:'sentence-build',instruction:'Rekonstruiere den Satz ein zweites Mal mit neuer Wortreihenfolge.',prompt:'Abruf statt Wiedererkennen.',tokens:rotateTokens(sentenceTokens(target),.36),answer:target,conceptIds,difficulty,xp:baseXp+3},
    translation ? {id:`${lesson.id}-final-transfer`,type:'translation',instruction:'Abschluss-Transfer: Produziere die Aussage ohne Vorlage in der Zielsprache.',prompt:'Versuche die Formulierung zuerst aus dem Gedächtnis.',sourceText:translation.sourceText,acceptedAnswers:translation.acceptedAnswers,conceptIds,difficulty,xp:baseXp+5} : {id:`${lesson.id}-final-speaking`,type:'speaking',instruction:'Abschluss: Sprich den Satz frei und deutlich.',prompt:'Eine letzte aktive Produktionsrunde.',speech:target,acceptedAnswers:[target],conceptIds,difficulty,xp:baseXp+5}
  ];
  const needed = Math.max(0, 12 - lesson.exercises.length);
  return {...lesson,estimatedMinutes:Math.max(lesson.estimatedMinutes,Math.ceil((lesson.exercises.length+needed)*.8)),exercises:[...lesson.exercises,...additions.slice(0,needed)]};
}
