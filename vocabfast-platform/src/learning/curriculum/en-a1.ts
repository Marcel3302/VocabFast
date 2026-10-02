import type { Lesson } from '../types';

export const englishA1Lessons: Lesson[] = [
  {
    id: 'en-a1-u1-l1', courseId: 'de-en', level: 'A1', unitId: 'en-a1-u1',
    title: 'Hallo! Ich bin …', subtitle: 'Begrüßen, sich vorstellen und erste Sätze mit “to be”.', estimatedMinutes: 6,
    newConcepts: ['greeting.hello','intro.name','pronoun.i','verb.be.am','greeting.goodbye'],
    exercises: [
      { id:'l1e1', type:'multiple-choice', instruction:'Wähle die passende Übersetzung.', prompt:'Hallo!', choices:['Hello!','Good night!','Thank you!','Please!'], answer:'Hello!', conceptIds:['greeting.hello'], difficulty:1, xp:5, explanation:'“Hello” ist eine neutrale Begrüßung und passt fast immer.' },
      { id:'l1e2', type:'translation', instruction:'Übersetze ins Englische.', prompt:'Stell dich vor.', sourceText:'Ich bin Marcel.', acceptedAnswers:['I am Marcel.','I’m Marcel.','I am Marcel','I’m Marcel'], conceptIds:['pronoun.i','verb.be.am','intro.name'], difficulty:1, xp:8, explanation:'Für „Ich bin …“ verwendest du “I am …” oder die Kurzform “I’m …”.' },
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
  },
  {
    id: 'en-a1-u1-l4', courseId: 'de-en', level: 'A1', unitId: 'en-a1-u1',
    title: 'Zahlen & Alter', subtitle: 'Zahlen verstehen, das Alter nennen und danach fragen.', estimatedMinutes: 7,
    newConcepts: ['number.1-20','age.ask','age.answer','verb.be.are'],
    exercises: [
      { id:'l4e1', type:'multiple-choice', instruction:'Wähle die richtige Zahl.', prompt:'twelve', choices:['12','20','2','10'], answer:'12', conceptIds:['number.1-20'], difficulty:1, xp:5 },
      { id:'l4e2', type:'multiple-choice', instruction:'Wähle das richtige Wort.', prompt:'18', choices:['eighteen','eight','eighty','eleven'], answer:'eighteen', conceptIds:['number.1-20'], difficulty:1, xp:5 },
      { id:'l4e3', type:'sentence-build', instruction:'Baue die Frage.', prompt:'Wie alt bist du?', tokens:['old','are','How','you','?'], answer:'How old are you?', conceptIds:['age.ask','verb.be.are'], difficulty:2, xp:9 },
      { id:'l4e4', type:'translation', instruction:'Übersetze ins Englische.', prompt:'Nenne dein Alter.', sourceText:'Ich bin 25 Jahre alt.', acceptedAnswers:['I am 25 years old.','I’m 25 years old.','I am 25 years old','I’m 25 years old'], conceptIds:['age.answer','verb.be.am'], difficulty:2, xp:10, explanation:'Im Englischen verwendet man beim Alter “to be”: “I am 25 years old.”' },
      { id:'l4e5', type:'fill-gap', instruction:'Ergänze das richtige Verb.', prompt:'Alter erfragen', sentence:'How old ___ you?', choices:['are','am','is','be'], answer:'are', conceptIds:['age.ask','verb.be.are'], difficulty:2, xp:8 },
      { id:'l4e6', type:'listening', instruction:'Höre zu und wähle das Alter.', prompt:'Wie alt ist die Person?', speech:'I am nineteen years old.', choices:['19','9','90','16'], answer:'19', conceptIds:['age.answer','number.1-20'], difficulty:2, xp:10 },
      { id:'l4e7', type:'dictation', instruction:'Höre zu und schreibe die Frage.', prompt:'Diktat', speech:'How old are you?', acceptedAnswers:['How old are you?','How old are you'], conceptIds:['age.ask','verb.be.are'], difficulty:2, xp:12 },
      { id:'l4e8', type:'translation', instruction:'Übersetze ins Englische.', prompt:'Abschluss', sourceText:'Ich bin 18 Jahre alt.', acceptedAnswers:['I am 18 years old.','I’m 18 years old.','I am 18 years old','I’m 18 years old'], conceptIds:['age.answer','number.1-20','verb.be.am'], difficulty:2, xp:10 }
    ]
  },
  {
    id: 'en-a1-u1-l5', courseId: 'de-en', level: 'A1', unitId: 'en-a1-u1',
    title: 'Woher kommst du?', subtitle: 'Herkunft, Länder und einfache Antworten mit “from”.', estimatedMinutes: 7,
    newConcepts: ['origin.ask','origin.from','country.austria','country.germany','country.england'],
    exercises: [
      { id:'l5e1', type:'multiple-choice', instruction:'Wähle die passende Übersetzung.', prompt:'Österreich', choices:['Austria','Australia','Germany','England'], answer:'Austria', conceptIds:['country.austria'], difficulty:1, xp:5 },
      { id:'l5e2', type:'sentence-build', instruction:'Baue die Frage.', prompt:'Woher kommst du?', tokens:['from','are','Where','you','?'], answer:'Where are you from?', conceptIds:['origin.ask','origin.from','verb.be.are'], difficulty:2, xp:9 },
      { id:'l5e3', type:'translation', instruction:'Übersetze ins Englische.', prompt:'Herkunft nennen', sourceText:'Ich komme aus Österreich.', acceptedAnswers:['I am from Austria.','I’m from Austria.','I am from Austria','I’m from Austria'], conceptIds:['origin.from','country.austria','verb.be.am'], difficulty:2, xp:10 },
      { id:'l5e4', type:'fill-gap', instruction:'Ergänze das richtige Wort.', prompt:'Herkunft', sentence:'I am ___ Germany.', choices:['from','at','to','on'], answer:'from', conceptIds:['origin.from','country.germany'], difficulty:1, xp:7 },
      { id:'l5e5', type:'listening', instruction:'Höre zu und wähle das Land.', prompt:'Woher kommt die Person?', speech:'I am from England.', choices:['England','Austria','Germany','Italy'], answer:'England', conceptIds:['origin.from','country.england'], difficulty:2, xp:10 },
      { id:'l5e6', type:'multiple-choice', instruction:'Welche Frage passt zur Antwort?', prompt:'“I’m from Austria.”', choices:['Where are you from?','How old are you?','What is your name?','Would you like tea?'], answer:'Where are you from?', conceptIds:['origin.ask','origin.from'], difficulty:2, xp:8 },
      { id:'l5e7', type:'dictation', instruction:'Höre zu und schreibe den Satz.', prompt:'Diktat', speech:'I am from Germany.', acceptedAnswers:['I am from Germany.','I am from Germany','I’m from Germany.','I’m from Germany'], conceptIds:['origin.from','country.germany'], difficulty:2, xp:12 },
      { id:'l5e8', type:'translation', instruction:'Übersetze ins Englische.', prompt:'Abschluss', sourceText:'Woher kommst du?', acceptedAnswers:['Where are you from?','Where are you from'], conceptIds:['origin.ask','origin.from','verb.be.are'], difficulty:2, xp:10 }
    ]
  },
  {
    id: 'en-a1-u1-l6', courseId: 'de-en', level: 'A1', unitId: 'en-a1-u1',
    title: 'Einfache Fragen', subtitle: 'Name, Wohnort und Sprache in kurzen Gesprächen erfragen.', estimatedMinutes: 8,
    newConcepts: ['question.what-name','question.where-live','question.speak-english','verb.live','verb.speak'],
    exercises: [
      { id:'l6e1', type:'sentence-build', instruction:'Baue die Frage.', prompt:'Wie heißt du?', tokens:['your','What','name','is','?'], answer:'What is your name?', conceptIds:['question.what-name','intro.name'], difficulty:2, xp:9 },
      { id:'l6e2', type:'translation', instruction:'Übersetze ins Englische.', prompt:'Wohnort erfragen', sourceText:'Wo wohnst du?', acceptedAnswers:['Where do you live?','Where do you live'], conceptIds:['question.where-live','verb.live'], difficulty:2, xp:10 },
      { id:'l6e3', type:'multiple-choice', instruction:'Wähle die passende Antwort.', prompt:'Where do you live?', choices:['I live in Vienna.','I am 20 years old.','My name is Tom.','Thank you.'], answer:'I live in Vienna.', conceptIds:['question.where-live','verb.live'], difficulty:2, xp:8 },
      { id:'l6e4', type:'fill-gap', instruction:'Ergänze das Verb.', prompt:'Wohnort', sentence:'I ___ in Graz.', choices:['live','speak','am','like'], answer:'live', conceptIds:['verb.live'], difficulty:1, xp:7 },
      { id:'l6e5', type:'translation', instruction:'Übersetze ins Englische.', prompt:'Sprache erfragen', sourceText:'Sprichst du Englisch?', acceptedAnswers:['Do you speak English?','Do you speak English'], conceptIds:['question.speak-english','verb.speak'], difficulty:3, xp:12 },
      { id:'l6e6', type:'listening', instruction:'Höre zu und wähle die Antwort.', prompt:'Was sagt die Person?', speech:'Yes, I speak English.', choices:['Ja, ich spreche Englisch.','Nein, ich spreche kein Englisch.','Ich wohne in England.','Ich komme aus England.'], answer:'Ja, ich spreche Englisch.', conceptIds:['verb.speak'], difficulty:2, xp:10 },
      { id:'l6e7', type:'dictation', instruction:'Höre zu und schreibe die Frage.', prompt:'Diktat', speech:'Where do you live?', acceptedAnswers:['Where do you live?','Where do you live'], conceptIds:['question.where-live','verb.live'], difficulty:3, xp:14 },
      { id:'l6e8', type:'multiple-choice', instruction:'Welche Frage fragt nach einem Namen?', prompt:'Wähle die richtige Frage.', choices:['What is your name?','Where are you from?','How old are you?','Do you speak English?'], answer:'What is your name?', conceptIds:['question.what-name','intro.name'], difficulty:2, xp:8 }
    ]
  },
  {
    id: 'en-a1-u1-l7', courseId: 'de-en', level: 'A1', unitId: 'en-a1-u1',
    title: 'Das ist ein …', subtitle: 'Gegenstände benennen und “a/an”, “this” und “that” verwenden.', estimatedMinutes: 8,
    newConcepts: ['article.a','article.an','demonstrative.this','demonstrative.that','noun.book','noun.apple'],
    exercises: [
      { id:'l7e1', type:'multiple-choice', instruction:'Wähle den richtigen Artikel.', prompt:'___ book', choices:['a','an','the are','am'], answer:'a', conceptIds:['article.a','noun.book'], difficulty:1, xp:5, explanation:'Vor einem Konsonantenlaut steht meist “a”: “a book”.' },
      { id:'l7e2', type:'multiple-choice', instruction:'Wähle den richtigen Artikel.', prompt:'___ apple', choices:['an','a','are','is'], answer:'an', conceptIds:['article.an','noun.apple'], difficulty:1, xp:5, explanation:'Vor einem Vokallaut steht “an”: “an apple”.' },
      { id:'l7e3', type:'sentence-build', instruction:'Baue den Satz.', prompt:'Das ist ein Buch.', tokens:['a','This','book','is','.'], answer:'This is a book.', conceptIds:['demonstrative.this','article.a','noun.book','verb.be.is'], difficulty:2, xp:9 },
      { id:'l7e4', type:'translation', instruction:'Übersetze ins Englische.', prompt:'Etwas in der Nähe', sourceText:'Das ist ein Apfel.', acceptedAnswers:['This is an apple.','This is an apple'], conceptIds:['demonstrative.this','article.an','noun.apple','verb.be.is'], difficulty:2, xp:10 },
      { id:'l7e5', type:'fill-gap', instruction:'Ergänze das passende Wort.', prompt:'Etwas weiter weg', sentence:'___ is a book.', choices:['That','An','Am','From'], answer:'That', conceptIds:['demonstrative.that','noun.book'], difficulty:2, xp:8 },
      { id:'l7e6', type:'listening', instruction:'Höre zu und wähle den Satz.', prompt:'Audio verstehen', speech:'This is an apple.', choices:['This is an apple.','That is a book.','I like coffee.','I am from Austria.'], answer:'This is an apple.', conceptIds:['demonstrative.this','article.an','noun.apple'], difficulty:2, xp:10 },
      { id:'l7e7', type:'dictation', instruction:'Höre zu und schreibe den Satz.', prompt:'Diktat', speech:'That is a book.', acceptedAnswers:['That is a book.','That is a book'], conceptIds:['demonstrative.that','article.a','noun.book'], difficulty:2, xp:12 },
      { id:'l7e8', type:'translation', instruction:'Übersetze ins Englische.', prompt:'Abschluss', sourceText:'Das ist ein Buch.', acceptedAnswers:['This is a book.','This is a book'], conceptIds:['demonstrative.this','article.a','noun.book'], difficulty:2, xp:10 }
    ]
  },
  {
    id: 'en-a1-u1-l8', courseId: 'de-en', level: 'A1', unitId: 'en-a1-u1',
    title: 'Einheit 1 · Checkpoint', subtitle: 'Mische Begrüßung, Vorstellung, Café, Alter, Herkunft und Fragen.', estimatedMinutes: 10,
    newConcepts: [],
    exercises: [
      { id:'l8e1', type:'translation', instruction:'Übersetze ins Englische.', prompt:'Vorstellung', sourceText:'Hallo, mein Name ist Mia.', acceptedAnswers:['Hello, my name is Mia.','Hello my name is Mia.','Hi, my name is Mia.','Hi my name is Mia.'], conceptIds:['greeting.hello','intro.name'], difficulty:2, xp:10 },
      { id:'l8e2', type:'sentence-build', instruction:'Baue die Frage.', prompt:'Woher kommst du?', tokens:['you','Where','from','are','?'], answer:'Where are you from?', conceptIds:['origin.ask','origin.from'], difficulty:2, xp:10 },
      { id:'l8e3', type:'fill-gap', instruction:'Ergänze das richtige Wort.', prompt:'Im Café', sentence:'I would ___ a coffee, please.', choices:['like','live','from','name'], answer:'like', conceptIds:['cafe.want','cafe.coffee','courtesy.please'], difficulty:2, xp:9 },
      { id:'l8e4', type:'listening', instruction:'Höre zu und wähle die Bedeutung.', prompt:'Hörverständnis', speech:'I am twenty years old.', choices:['Ich bin 20 Jahre alt.','Ich wohne seit 20 Jahren hier.','Ich komme um 20 Uhr.','Ich möchte 20 Kaffees.'], answer:'Ich bin 20 Jahre alt.', conceptIds:['age.answer'], difficulty:2, xp:12 },
      { id:'l8e5', type:'translation', instruction:'Übersetze ins Englische.', prompt:'Wohnort', sourceText:'Ich wohne in Wien.', acceptedAnswers:['I live in Vienna.','I live in Vienna'], conceptIds:['verb.live'], difficulty:2, xp:10 },
      { id:'l8e6', type:'multiple-choice', instruction:'Wähle die beste Reaktion.', prompt:'Thank you!', choices:['You’re welcome.','I am Austria.','How old.','A book.'], answer:'You’re welcome.', conceptIds:['courtesy.you-are-welcome'], difficulty:1, xp:7 },
      { id:'l8e7', type:'dictation', instruction:'Höre zu und schreibe die Frage.', prompt:'Diktat', speech:'Do you speak English?', acceptedAnswers:['Do you speak English?','Do you speak English'], conceptIds:['question.speak-english','verb.speak'], difficulty:3, xp:14 },
      { id:'l8e8', type:'translation', instruction:'Übersetze ins Englische.', prompt:'Gegenstand', sourceText:'Das ist ein Apfel.', acceptedAnswers:['This is an apple.','This is an apple'], conceptIds:['demonstrative.this','article.an','noun.apple'], difficulty:2, xp:10 },
      { id:'l8e9', type:'sentence-build', instruction:'Baue die Frage.', prompt:'Wie alt bist du?', tokens:['are','old','How','you','?'], answer:'How old are you?', conceptIds:['age.ask','verb.be.are'], difficulty:2, xp:10 },
      { id:'l8e10', type:'translation', instruction:'Übersetze ins Englische.', prompt:'Abschluss', sourceText:'Ich komme aus Österreich. Auf Wiedersehen!', acceptedAnswers:['I am from Austria. Goodbye!','I’m from Austria. Goodbye!','I am from Austria, goodbye!','I’m from Austria, goodbye!'], conceptIds:['origin.from','country.austria','greeting.goodbye'], difficulty:3, xp:14 }
    ]
  }
];

export const firstEnglishLesson = englishA1Lessons[0];
