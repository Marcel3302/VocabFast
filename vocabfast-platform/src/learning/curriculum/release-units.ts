import type { Lesson } from '../types';

type Level='A2'|'B1';
type Blueprint={
  level:Level;
  unit:number;
  lesson:number;
  unitTitle:string;
  unitSubtitle:string;
  title:string;
  subtitle:string;
  goal:string;
  german:string;
  english:string;
  gapSentence:string;
  gapChoices:string[];
  gapAnswer:string;
  listening:string;
  listeningMeaning:string;
  conceptId:string;
};

const blueprints:Blueprint[]=[
  {
    level:'A2',unit:3,lesson:1,
    unitTitle:'Arbeit & Kommunikation',unitSubtitle:'Telefonieren, Aufgaben erklären, höflich nachfragen und kurze Nachrichten schreiben.',
    title:'Am Telefon',subtitle:'Sich melden, verbinden lassen und eine Nachricht hinterlassen.',goal:'Ein kurzes berufliches Telefongespräch beginnen.',
    german:'Guten Morgen, hier ist Lara König. Könnte ich bitte mit Herrn Brown sprechen?',
    english:'Good morning, this is Lara König. Could I speak to Mr Brown, please?',
    gapSentence:'Could I ___ to Mr Brown, please?',gapChoices:['speak','talking','spoke','speaking'],gapAnswer:'speak',
    listening:'He is in a meeting at the moment. Can I take a message?',listeningMeaning:'Er ist gerade in einer Besprechung. Kann ich eine Nachricht aufnehmen?',
    conceptId:'cefr.a2.phone-calls'
  },
  {
    level:'A2',unit:3,lesson:2,
    unitTitle:'Arbeit & Kommunikation',unitSubtitle:'Telefonieren, Aufgaben erklären, höflich nachfragen und kurze Nachrichten schreiben.',
    title:'Mein Arbeitsalltag',subtitle:'Aufgaben, Routinen und Verantwortlichkeiten verständlich beschreiben.',goal:'Die eigene Arbeit mit einfachen Details beschreiben.',
    german:'Normalerweise beantworte ich morgens E-Mails und spreche danach mit Kunden.',
    english:'I usually answer emails in the morning and then speak to customers.',
    gapSentence:'I am responsible ___ customer requests.',gapChoices:['for','of','to','with'],gapAnswer:'for',
    listening:'Most days I start at eight and finish at half past four.',listeningMeaning:'An den meisten Tagen beginne ich um acht und höre um halb fünf auf.',
    conceptId:'cefr.a2.work-routines'
  },
  {
    level:'A2',unit:3,lesson:3,
    unitTitle:'Arbeit & Kommunikation',unitSubtitle:'Telefonieren, Aufgaben erklären, höflich nachfragen und kurze Nachrichten schreiben.',
    title:'Höflich nachfragen',subtitle:'Unklare Informationen prüfen und um Wiederholung bitten.',goal:'Nachfragen, wenn etwas nicht verstanden wurde.',
    german:'Entschuldigung, könnten Sie das bitte noch einmal erklären?',
    english:'Sorry, could you explain that again, please?',
    gapSentence:'Could you ___ that again more slowly?',gapChoices:['say','said','saying','to say'],gapAnswer:'say',
    listening:'Do you mean that the delivery will arrive on Thursday?',listeningMeaning:'Meinen Sie, dass die Lieferung am Donnerstag ankommt?',
    conceptId:'cefr.a2.clarifying'
  },
  {
    level:'A2',unit:3,lesson:4,
    unitTitle:'Arbeit & Kommunikation',unitSubtitle:'Telefonieren, Aufgaben erklären, höflich nachfragen und kurze Nachrichten schreiben.',
    title:'Kurze E-Mails',subtitle:'Bitten und Informationen freundlich und klar formulieren.',goal:'Eine kurze berufliche Bitte schreiben.',
    german:'Könnten Sie mir bitte die aktualisierte Datei bis morgen schicken?',
    english:'Could you please send me the updated file by tomorrow?',
    gapSentence:'Please let me know if you ___ any questions.',gapChoices:['have','had','having','has'],gapAnswer:'have',
    listening:'Thanks for your message. I will send the document this afternoon.',listeningMeaning:'Danke für Ihre Nachricht. Ich werde das Dokument heute Nachmittag schicken.',
    conceptId:'cefr.a2.email-requests'
  },
  {
    level:'B1',unit:3,lesson:1,
    unitTitle:'Sicher im Berufsalltag',unitSubtitle:'Missverständnisse klären, Fortschritt berichten, Optionen vergleichen und Lösungen vertreten.',
    title:'Missverständnisse klären',subtitle:'Aussagen präzisieren, ohne unnötig hart zu wirken.',goal:'Ein Missverständnis sachlich korrigieren.',
    german:'Ich glaube, da gab es ein Missverständnis. Ich meinte Freitag, nicht Donnerstag.',
    english:'I think there has been a misunderstanding. I meant Friday, not Thursday.',
    gapSentence:'What I ___ was that we should wait until Friday.',gapChoices:['meant','mean','have mean','was meaning to'],gapAnswer:'meant',
    listening:'Let me clarify what I meant before we make a decision.',listeningMeaning:'Lassen Sie mich klarstellen, was ich gemeint habe, bevor wir eine Entscheidung treffen.',
    conceptId:'cefr.b1.clarification'
  },
  {
    level:'B1',unit:3,lesson:2,
    unitTitle:'Sicher im Berufsalltag',unitSubtitle:'Missverständnisse klären, Fortschritt berichten, Optionen vergleichen und Lösungen vertreten.',
    title:'Status-Update',subtitle:'Fortschritt, offene Punkte und nächste Schritte strukturiert erklären.',goal:'Ein kurzes Projektupdate geben.',
    german:'Wir haben den wichtigsten Teil abgeschlossen, aber zwei Aufgaben sind noch offen.',
    english:'We have completed the main part, but two tasks are still outstanding.',
    gapSentence:'So far, we ___ three of the five tasks.',gapChoices:['have completed','completed yesterday','are completing since','complete'],gapAnswer:'have completed',
    listening:'The testing phase is on schedule, although we still need feedback from the client.',listeningMeaning:'Die Testphase liegt im Zeitplan, obwohl wir noch Rückmeldung vom Kunden benötigen.',
    conceptId:'cefr.b1.status-updates'
  },
  {
    level:'B1',unit:3,lesson:3,
    unitTitle:'Sicher im Berufsalltag',unitSubtitle:'Missverständnisse klären, Fortschritt berichten, Optionen vergleichen und Lösungen vertreten.',
    title:'Optionen vergleichen',subtitle:'Vor- und Nachteile nachvollziehbar gegeneinander abwägen.',goal:'Zwei Möglichkeiten mit einer Begründung vergleichen.',
    german:'Die erste Option ist günstiger, während die zweite langfristig flexibler wäre.',
    english:'The first option is cheaper, whereas the second would be more flexible in the long term.',
    gapSentence:'The new system costs more; ___, it would save us time every week.',gapChoices:['however','because','unless','despite'],gapAnswer:'however',
    listening:'Both solutions are possible, but the second one gives us more room to grow.',listeningMeaning:'Beide Lösungen sind möglich, aber die zweite gibt uns mehr Spielraum für Wachstum.',
    conceptId:'cefr.b1.comparing-options'
  },
  {
    level:'B1',unit:3,lesson:4,
    unitTitle:'Sicher im Berufsalltag',unitSubtitle:'Missverständnisse klären, Fortschritt berichten, Optionen vergleichen und Lösungen vertreten.',
    title:'Eine Lösung vertreten',subtitle:'Einen Vorschlag machen und ihn mit Folgen und Nutzen begründen.',goal:'Eine Lösung überzeugend, aber offen formulieren.',
    german:'Ich würde vorschlagen, dass wir klein anfangen und die Ergebnisse nach zwei Wochen überprüfen.',
    english:'I would suggest starting small and reviewing the results after two weeks.',
    gapSentence:'I suggest ___ the change with one team first.',gapChoices:['testing','test','to test','tested'],gapAnswer:'testing',
    listening:'If the trial works well, we can introduce the change to the other teams later.',listeningMeaning:'Wenn der Test gut funktioniert, können wir die Änderung später bei den anderen Teams einführen.',
    conceptId:'cefr.b1.proposals'
  }
];

const difficulty:Record<Level,2|3>={A2:2,B1:3};
const baseXp:Record<Level,number>={A2:8,B1:10};

function tokens(value:string){
  return value.replace(/([,.!?;:])/g,' $1 ').replace(/\s+/g,' ').trim().split(' ');
}

function scramble(value:string){
  const parts=tokens(value);
  if(parts.length<5)return [...parts].reverse();
  const cut=Math.max(2,Math.floor(parts.length*.55));
  return [...parts.slice(cut),...parts.slice(0,cut)];
}

function peers(bp:Blueprint){return blueprints.filter(item=>item.level===bp.level&&item!==bp);}

function makeLesson(bp:Blueprint):Lesson{
  const id=`en-${bp.level.toLowerCase()}-u${bp.unit}-l${bp.lesson}`;
  const conceptIds=[bp.conceptId];
  const alternatives=peers(bp).slice(0,3);
  const sentenceChoices=[bp.english,...alternatives.map(item=>item.english)].slice(0,4);
  const meaningChoices=[bp.listeningMeaning,...alternatives.map(item=>item.listeningMeaning)].slice(0,4);
  const xp=baseXp[bp.level];
  return {
    id,courseId:'de-en',level:bp.level,unitId:`en-${bp.level.toLowerCase()}-u${bp.unit}`,
    title:bp.title,subtitle:bp.subtitle,estimatedMinutes:10,newConcepts:conceptIds,
    exercises:[
      {id:`${id}-e1`,type:'multiple-choice',instruction:'Wähle die Formulierung, die die deutsche Aussage am besten trifft.',prompt:bp.german,choices:sentenceChoices,answer:bp.english,conceptIds,difficulty:difficulty[bp.level],xp,explanation:`Trainingsziel: ${bp.goal}`},
      {id:`${id}-e2`,type:'translation',instruction:'Übersetze natürlich ins Englische.',prompt:bp.goal,sourceText:bp.german,acceptedAnswers:[bp.english],conceptIds,difficulty:difficulty[bp.level],xp:xp+2},
      {id:`${id}-e3`,type:'sentence-build',instruction:'Baue den vollständigen Satz.',prompt:bp.german,tokens:scramble(bp.english),answer:bp.english,conceptIds,difficulty:difficulty[bp.level],xp:xp+2},
      {id:`${id}-e4`,type:'fill-gap',instruction:'Ergänze die Form, die grammatisch und im Kontext am besten passt.',prompt:bp.goal,sentence:bp.gapSentence,choices:bp.gapChoices,answer:bp.gapAnswer,conceptIds,difficulty:difficulty[bp.level],xp},
      {id:`${id}-e5`,type:'listening',instruction:'Höre zu und wähle die passende Bedeutung.',prompt:'Konzentriere dich auf die Kernaussage.',speech:bp.listening,choices:meaningChoices,answer:bp.listeningMeaning,conceptIds,difficulty:difficulty[bp.level],xp:xp+3},
      {id:`${id}-e6`,type:'dictation',instruction:'Schreibe den gehörten Satz möglichst vollständig.',prompt:'Achte auf kleine Funktionswörter und Verbformen.',speech:bp.listening,acceptedAnswers:[bp.listening],conceptIds,difficulty:difficulty[bp.level],xp:xp+4},
      {id:`${id}-e7`,type:'speaking',instruction:'Sprich die Aussage laut und möglichst natürlich.',prompt:bp.goal,speech:bp.english,acceptedAnswers:[bp.english],conceptIds,difficulty:difficulty[bp.level],xp:xp+4},
      {id:`${id}-e8`,type:'multiple-choice',instruction:'Welche Formulierung würdest du in dieser Situation am ehesten verwenden?',prompt:bp.goal,choices:sentenceChoices,answer:bp.english,conceptIds,difficulty:difficulty[bp.level],xp:xp+2}
    ]
  };
}

function unitFor(level:Level,unit:number){
  const items=blueprints.filter(item=>item.level===level&&item.unit===unit);
  const first=items[0];
  return {id:`en-${level.toLowerCase()}-u${unit}`,number:unit,title:first.unitTitle,subtitle:first.unitSubtitle,lessons:items.map(makeLesson)};
}

export const englishA2ReleaseUnits=[unitFor('A2',3)];
export const englishB1ReleaseUnits=[unitFor('B1',3)];
