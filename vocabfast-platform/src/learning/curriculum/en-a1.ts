import type { Lesson } from '../types';

export const englishA1Lessons: Lesson[] = [
  {
    id: 'en-a1-u1-l1', courseId: 'de-en', level: 'A1', unitId: 'en-a1-u1',
    title: 'Hallo! Ich bin …', subtitle: 'Begrüßen, sich vorstellen und erste Sätze mit “to be”.', estimatedMinutes: 6,
    newConcepts: ['greeting.hello','intro.name','pronoun.i','verb.be.am','greeting.goodbye'],
    exercises: [
      { id:'l1e1', type:'multiple-choice', instruction:'Wähle die passende Übersetzung.', prompt:'Hallo!', choices:['Hello!','Good night!','Thank you!','Please!'], answer:'Hello!', conceptIds:['greeting.hello'], difficulty:1, xp:5, explanation:'“Hello” ist eine neutrale Begrüßung und passt fast immer.' },
      { id:'l1e2', type:'translation', instruction:'Übersetze ins Englische.', prompt:'Stell dich vor.', sourceText:'Ich bin Marcel.', acceptedAnswers:['I am Marcel.','I’m Marcel.','Im Marcel.'], conceptIds:['pronoun.i','verb.be.am','intro.name'], difficulty:1, xp:8, explanation:'Für „Ich bin …“ verwendest du “I am …” oder die Kurzform “I’m …”.' },
      { id:'l1e3', type:'sentence-build', instruction:'Baue den englischen Satz.', prompt:'Mein Name ist Anna.', tokens:['Anna','name','My','is','.'], answer:'My name is Anna.', conceptIds:['intro.name','verb.be.is'], difficulty:1, xp:8, explanation:'Die feste Struktur lautet “My name is …”.' },
      { id:'l1e4', type:'fill-gap', instruction:'Ergänze das richtige Wort.', prompt:'Vervollständige den Satz.', sentence:'I ___ Lukas.', choices:['am','is','are','be'], answer:'am', conceptIds:['pronoun.i','verb.be.am'], difficulty:1, xp:6, explanation:'Nach “I” steht beim Verb “to be” immer “am”.' },
      { id:'l1e5', type:'listening', instruction:'Höre zu und wähle, was gesagt wurde.', prompt:'Audio verstehen', speech:'Hello, I am Sophie.', choices:['Hello, I am Sophie.','Goodbye, Sophie.','My name is Thomas.','Thank you, Sophie.'], answer:'Hello, I am Sophie.', conceptIds:['greeting.hello','verb.be.am','intro.name'], difficulty:1, xp:10, explanation:'Du hörst zuerst die Begrüßung “Hello” und danach “I am Sophie”.' },
      { id:'l1e6', type:'dictation', instruction:'Höre zu und schreibe den Satz.', prompt:'Schreibe genau, was du hörst.', speech:'My name is David.', acceptedAnswers:['My name is David.','My name is David'], conceptIds:['intro.name','verb.be.is'], difficulty:2, xp:12, explanation:'Achte auf die Wortfolge “My name is …”.' },
      { id:'l1e7', type:'multiple-choice', instruction:'Was passt am besten?', prompt:'Du verabschiedest dich.', choices:['Goodbye!','Hello!','Please!','Sorry!'], answer:'Goodbye!', conceptIds:['greeting.goodbye'], difficulty:1, xp:5, explanation:'“Goodbye” bedeutet „Auf Wiedersehen“.' },
      { id:'l1e8', type:'translation', instruction:'Übersetze ins Englische.', prompt:'Letzte Aufgabe', sourceText:'Hallo, mein Name ist Emma.', acceptedAnswers:['Hello, my name is Emma.','Hello my name is Emma.','Hi, my name is Emma.','Hi my name is Emma.'], conceptIds:['greeting.hello','intro.name','verb.be.is'], difficulty:2, xp:10, explanation:'Du kombinierst Begrüßung und Vorstellung in einem vollständigen Satz.' }
    ]
  },
  {
    id: 'en-a1-u1-l2', courseId: 'de-en', level: 'A1', unitId: 'en-a1-u1',
    title: 'Bitte & danke', subtitle: 'Höflich reagieren und kurze Alltagsphrasen sicher verwenden.', estimatedMinutes: 6,
    newConcepts: ['courtesy.please','courtesy.thanks','courtesy.you-are-welcome','courtesy.sorry'],
    exercises: [
      { id:'l2e1', type:'multiple-choice', instruction:'Wähle die passende Übersetzung.', prompt:'Danke!', choices:['Thank you!','Please!','Sorry!','Hello!'], answer:'Thank you!', conceptIds:['courtesy.thanks'], difficulty:1, xp:5 },
      { id:'l2e2', type:'multiple-choice', instruction:'Wähle die passende Reaktion.', prompt:'Someone says: “Thank you!”', choices:['You’re welcome.','Good night.','My name is Ben.','Hello.'], answer:'You’re welcome.', conceptIds:['courtesy.you-are-welcome'], difficulty:1, xp:6, explanation:'“You’re welcome” ist die übliche Antwort auf “Thank you”.' },
      { id:'l2e3', type:'translation', instruction:'Übersetze ins Englische.', prompt:'Höflich bitten', sourceText:'Bitte.', acceptedAnswers:['Please.','Please'], conceptIds:['courtesy.please'], difficulty:1, xp:6 },
      { id:'l2e4', type:'sentence-build', instruction:'Baue den englischen Satz.', prompt:'Vielen Dank.', tokens:['very','Thank','much','you','.'], answer:'Thank you very much.', conceptIds:['courtesy.thanks'], difficulty:2, xp:8 },
      { id:'l2e5', type:'listening', instruction:'Höre zu und wähle die Bedeutung.', prompt:'Was bedeutet der Satz?', speech:'I am sorry.', choices:['Es tut mir leid.','Vielen Dank.','Bis morgen.','Gern geschehen.'], answer:'Es tut mir leid.', conceptIds:['courtesy.sorry','verb.be.am'], difficulty:1, xp:10 },
      { id:'l2e6', type:'fill-gap', instruction:'Ergänze die passende Wendung.', prompt:'Jemand bedankt sich bei dir.', sentence:'Thank you! — You’re ___.', choices:['welcome','please','hello','sorry'], answer:'welcome', conceptIds:['courtesy.you-are-welcome'], difficulty:2, xp:8 },
      { id:'l2e7', type:'dictation', instruction:'Höre zu und schreibe den Satz.', prompt:'Kurze Höflichkeitsphrase', speech:'Thank you very much.', acceptedAnswers:['Thank you very much.','Thank you very much'], conceptIds:['courtesy.thanks'], difficulty:2, xp:12 },
      { id:'l2e8', type:'translation', instruction:'Übersetze ins Englische.', prompt:'Kombiniere zwei Wendungen.', sourceText:'Danke. Auf Wiedersehen!', acceptedAnswers:['Thank you. Goodbye!','Thank you, goodbye!','Thanks. Goodbye!','Thanks, goodbye!'], conceptIds:['courtesy.thanks','greeting.goodbye'], difficulty:2, xp:10 }
    ]
  },
  {
    id: 'en-a1-u1-l3', courseId: 'de-en', level: 'A1', unitId: 'en-a1-u1',
    title: 'Im Café', subtitle: 'Bestellen, einfache Wünsche äußern und höflich bezahlen.', estimatedMinutes: 8,
    newConcepts: ['cafe.coffee','cafe.tea','cafe.want','cafe.order','cafe.bill'],
    exercises: [
      { id:'l3e1', type:'multiple-choice', instruction:'Wähle die Übersetzung.', prompt:'Kaffee', choices:['coffee','tea','water','bread'], answer:'coffee', conceptIds:['cafe.coffee'], difficulty:1, xp:5 },
      { id:'l3e2', type:'multiple-choice', instruction:'Wähle die Übersetzung.', prompt:'Tee', choices:['tea','coffee','milk','juice'], answer:'tea', conceptIds:['cafe.tea'], difficulty:1, xp:5 },
      { id:'l3e3', type:'sentence-build', instruction:'Baue einen höflichen Satz.', prompt:'Ich möchte einen Kaffee, bitte.', tokens:['coffee','I','a','please','would','like',',','.'], answer:'I would like a coffee, please.', conceptIds:['cafe.want','cafe.coffee','courtesy.please'], difficulty:2, xp:10 },
      { id:'l3e4', type:'fill-gap', instruction:'Ergänze das passende Wort.', prompt:'Bestellung', sentence:'I would ___ a tea, please.', choices:['like','am','name','welcome'], answer:'like', conceptIds:['cafe.want','cafe.tea'], difficulty:2, xp:8 },
      { id:'l3e5', type:'listening', instruction:'Höre die Bestellung.', prompt:'Was bestellt die Person?', speech:'A coffee, please.', choices:['Einen Kaffee.','Einen Tee.','Wasser.','Die Rechnung.'], answer:'Einen Kaffee.', conceptIds:['cafe.order','cafe.coffee','courtesy.please'], difficulty:1, xp:10 },
      { id:'l3e6', type:'translation', instruction:'Übersetze ins Englische.', prompt:'Im Café bezahlen', sourceText:'Die Rechnung, bitte.', acceptedAnswers:['The bill, please.','The bill please.','Bill, please.','Bill please.'], conceptIds:['cafe.bill','courtesy.please'], difficulty:2, xp:10 },
      { id:'l3e7', type:'dictation', instruction:'Höre zu und schreibe die Bestellung.', prompt:'Diktat', speech:'I would like a tea, please.', acceptedAnswers:['I would like a tea, please.','I would like a tea please.','I would like a tea please'], conceptIds:['cafe.want','cafe.tea','courtesy.please'], difficulty:3, xp:14 },
      { id:'l3e8', type:'translation', instruction:'Übersetze ins Englische.', prompt:'Abschluss', sourceText:'Einen Kaffee, bitte. Danke!', acceptedAnswers:['A coffee, please. Thank you!','A coffee please. Thank you!','Coffee, please. Thank you!'], conceptIds:['cafe.coffee','courtesy.please','courtesy.thanks'], difficulty:2, xp:10 }
    ]
  }
];

export const firstEnglishLesson = englishA1Lessons[0];
