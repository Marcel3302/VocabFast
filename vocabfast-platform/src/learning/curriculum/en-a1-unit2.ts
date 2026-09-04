import type { Lesson } from '../types';

export const englishA1Unit2Lessons: Lesson[] = [
  {
    id: 'en-a1-u2-l1', courseId: 'de-en', level: 'A1', unitId: 'en-a1-u2',
    title: 'Familie & Menschen', subtitle: 'Über Familie sprechen und einfache Beziehungen beschreiben.', estimatedMinutes: 8,
    newConcepts: ['family.mother','family.father','family.brother','family.sister','verb.have'],
    exercises: [
      { id:'u2l1e1', type:'multiple-choice', instruction:'Wähle die Übersetzung.', prompt:'Mutter', choices:['mother','father','sister','friend'], answer:'mother', conceptIds:['family.mother'], difficulty:1, xp:5 },
      { id:'u2l1e2', type:'multiple-choice', instruction:'Wähle die Übersetzung.', prompt:'Bruder', choices:['brother','father','mother','family'], answer:'brother', conceptIds:['family.brother'], difficulty:1, xp:5 },
      { id:'u2l1e3', type:'fill-gap', instruction:'Ergänze das Verb.', prompt:'Über deine Familie sprechen', sentence:'I ___ one sister.', choices:['have','am','is','are'], answer:'have', conceptIds:['verb.have','family.sister'], difficulty:2, xp:8, explanation:'Für Besitz verwendest du mit “I” das Verb “have”.' },
      { id:'u2l1e4', type:'translation', instruction:'Übersetze ins Englische.', prompt:'Familie beschreiben', sourceText:'Ich habe einen Bruder.', acceptedAnswers:['I have a brother.','I have a brother'], conceptIds:['verb.have','family.brother','article.a'], difficulty:2, xp:10 },
      { id:'u2l1e5', type:'listening', instruction:'Höre zu und wähle die richtige Aussage.', prompt:'Wer wird genannt?', speech:'This is my father.', choices:['Mein Vater.','Meine Mutter.','Mein Bruder.','Meine Schwester.'], answer:'Mein Vater.', conceptIds:['family.father','demonstrative.this'], difficulty:2, xp:10 },
      { id:'u2l1e6', type:'sentence-build', instruction:'Baue den Satz.', prompt:'Das ist meine Schwester.', tokens:['sister','This','my','is','.'], answer:'This is my sister.', conceptIds:['family.sister','demonstrative.this','verb.be.is'], difficulty:2, xp:10 },
      { id:'u2l1e7', type:'speaking', instruction:'Sprich den Satz laut.', prompt:'Stell deine Familie vor.', speech:'I have one brother and one sister.', acceptedAnswers:['I have one brother and one sister.','I have one brother and one sister'], conceptIds:['verb.have','family.brother','family.sister'], difficulty:2, xp:14, explanation:'Sprich langsam und deutlich. Besonders “brother” und “sister” sollten klar erkennbar sein.' },
      { id:'u2l1e8', type:'dictation', instruction:'Höre zu und schreibe den Satz.', prompt:'Familien-Diktat', speech:'My mother is from Austria.', acceptedAnswers:['My mother is from Austria.','My mother is from Austria'], conceptIds:['family.mother','origin.from','country.austria'], difficulty:2, xp:12 }
    ]
  },
  {
    id: 'en-a1-u2-l2', courseId: 'de-en', level: 'A1', unitId: 'en-a1-u2',
    title: 'Mein Tagesablauf', subtitle: 'Aufstehen, arbeiten, essen und schlafen im einfachen Präsens.', estimatedMinutes: 9,
    newConcepts: ['routine.get-up','routine.work','routine.eat','routine.sleep','present.simple-i'],
    exercises: [
      { id:'u2l2e1', type:'multiple-choice', instruction:'Wähle die Übersetzung.', prompt:'aufstehen', choices:['get up','go home','eat','sleep'], answer:'get up', conceptIds:['routine.get-up'], difficulty:1, xp:5 },
      { id:'u2l2e2', type:'multiple-choice', instruction:'Wähle die Übersetzung.', prompt:'arbeiten', choices:['work','sleep','speak','live'], answer:'work', conceptIds:['routine.work'], difficulty:1, xp:5 },
      { id:'u2l2e3', type:'sentence-build', instruction:'Baue den Satz.', prompt:'Ich arbeite am Morgen.', tokens:['morning','I','in','work','the','.'], answer:'I work in the morning.', conceptIds:['routine.work','present.simple-i','time.morning'], difficulty:2, xp:10 },
      { id:'u2l2e4', type:'fill-gap', instruction:'Ergänze das Verb.', prompt:'Tagesablauf', sentence:'I ___ breakfast at seven.', choices:['eat','am','have to','sleep'], answer:'eat', conceptIds:['routine.eat','present.simple-i','time.at'], difficulty:2, xp:8 },
      { id:'u2l2e5', type:'translation', instruction:'Übersetze ins Englische.', prompt:'Über deinen Tag sprechen', sourceText:'Ich stehe um sieben Uhr auf.', acceptedAnswers:['I get up at seven.','I get up at seven o’clock.','I get up at seven oclock.'], conceptIds:['routine.get-up','present.simple-i','time.at'], difficulty:2, xp:10 },
      { id:'u2l2e6', type:'listening', instruction:'Höre zu und wähle die Aktivität.', prompt:'Was macht die Person?', speech:'I work in the afternoon.', choices:['Sie arbeitet.','Sie schläft.','Sie isst.','Sie fährt nach Hause.'], answer:'Sie arbeitet.', conceptIds:['routine.work','time.afternoon'], difficulty:2, xp:10 },
      { id:'u2l2e7', type:'speaking', instruction:'Sprich über deinen Tagesablauf.', prompt:'Sag den Satz laut.', speech:'I get up at seven and I work in the morning.', acceptedAnswers:['I get up at seven and I work in the morning.','I get up at seven and I work in the morning'], conceptIds:['routine.get-up','routine.work','present.simple-i','time.morning'], difficulty:3, xp:15 },
      { id:'u2l2e8', type:'dictation', instruction:'Höre zu und schreibe den Satz.', prompt:'Tagesablauf', speech:'I sleep at night.', acceptedAnswers:['I sleep at night.','I sleep at night'], conceptIds:['routine.sleep','time.night'], difficulty:2, xp:12 }
    ]
  },
  {
    id: 'en-a1-u2-l3', courseId: 'de-en', level: 'A1', unitId: 'en-a1-u2',
    title: 'Uhrzeit & Termine', subtitle: 'Nach der Uhrzeit fragen und einfache Termine verstehen.', estimatedMinutes: 9,
    newConcepts: ['time.ask','time.oclock','time.half-past','time.at','time.morning','time.afternoon','time.night'],
    exercises: [
      { id:'u2l3e1', type:'sentence-build', instruction:'Baue die Frage.', prompt:'Wie spät ist es?', tokens:['time','What','it','is','?'], answer:'What time is it?', conceptIds:['time.ask'], difficulty:2, xp:9 },
      { id:'u2l3e2', type:'multiple-choice', instruction:'Wähle die Uhrzeit.', prompt:'It is three o’clock.', choices:['3:00','3:30','2:45','4:00'], answer:'3:00', conceptIds:['time.oclock'], difficulty:1, xp:6 },
      { id:'u2l3e3', type:'multiple-choice', instruction:'Wähle die Uhrzeit.', prompt:'It is half past six.', choices:['6:30','6:00','5:30','7:30'], answer:'6:30', conceptIds:['time.half-past'], difficulty:2, xp:7 },
      { id:'u2l3e4', type:'fill-gap', instruction:'Ergänze die Präposition.', prompt:'Termin nennen', sentence:'The meeting is ___ ten o’clock.', choices:['at','from','in','on'], answer:'at', conceptIds:['time.at','time.oclock'], difficulty:2, xp:8 },
      { id:'u2l3e5', type:'translation', instruction:'Übersetze ins Englische.', prompt:'Termin', sourceText:'Der Termin ist um neun Uhr.', acceptedAnswers:['The appointment is at nine o’clock.','The appointment is at nine oclock.','The appointment is at nine.'], conceptIds:['time.at','time.oclock','appointment.basic'], difficulty:2, xp:11 },
      { id:'u2l3e6', type:'listening', instruction:'Höre zu und wähle die Uhrzeit.', prompt:'Wann beginnt es?', speech:'The appointment is at half past four.', choices:['4:30','4:00','3:30','5:30'], answer:'4:30', conceptIds:['time.half-past','appointment.basic'], difficulty:2, xp:10 },
      { id:'u2l3e7', type:'speaking', instruction:'Sprich die Uhrzeit.', prompt:'Sag den Satz laut.', speech:'It is half past eight.', acceptedAnswers:['It is half past eight.','It is half past eight'], conceptIds:['time.half-past'], difficulty:2, xp:14 },
      { id:'u2l3e8', type:'dictation', instruction:'Höre zu und schreibe den Satz.', prompt:'Uhrzeit', speech:'What time is it?', acceptedAnswers:['What time is it?','What time is it'], conceptIds:['time.ask'], difficulty:2, xp:12 }
    ]
  },
  {
    id: 'en-a1-u2-l4', courseId: 'de-en', level: 'A1', unitId: 'en-a1-u2',
    title: 'Einkaufen', subtitle: 'Preise fragen, Farben nennen und einfache Wünsche äußern.', estimatedMinutes: 10,
    newConcepts: ['shopping.price','shopping.how-much','shopping.size','color.red','color.blue','color.black'],
    exercises: [
      { id:'u2l4e1', type:'multiple-choice', instruction:'Wähle die Übersetzung.', prompt:'Wie viel kostet das?', choices:['How much is this?','Where is this?','What time is it?','How old is this?'], answer:'How much is this?', conceptIds:['shopping.how-much','shopping.price','demonstrative.this'], difficulty:2, xp:7 },
      { id:'u2l4e2', type:'multiple-choice', instruction:'Wähle die Farbe.', prompt:'blue', choices:['blau','rot','schwarz','weiß'], answer:'blau', conceptIds:['color.blue'], difficulty:1, xp:5 },
      { id:'u2l4e3', type:'fill-gap', instruction:'Ergänze das Wort.', prompt:'Nach dem Preis fragen', sentence:'How ___ is this?', choices:['much','old','from','time'], answer:'much', conceptIds:['shopping.how-much'], difficulty:2, xp:8 },
      { id:'u2l4e4', type:'translation', instruction:'Übersetze ins Englische.', prompt:'Im Geschäft', sourceText:'Ich möchte das blaue T-Shirt.', acceptedAnswers:['I would like the blue T-shirt.','I would like the blue T shirt.','I’d like the blue T-shirt.','I would like the blue shirt.'], conceptIds:['cafe.want','color.blue','shopping.size'], difficulty:2, xp:11 },
      { id:'u2l4e5', type:'listening', instruction:'Höre zu und wähle den Preis.', prompt:'Wie viel kostet es?', speech:'It is twenty euros.', choices:['20 €','12 €','2 €','30 €'], answer:'20 €', conceptIds:['shopping.price','number.1-20'], difficulty:2, xp:10 },
      { id:'u2l4e6', type:'sentence-build', instruction:'Baue die Frage.', prompt:'Wie viel kostet das?', tokens:['this','much','is','How','?'], answer:'How much is this?', conceptIds:['shopping.how-much','demonstrative.this'], difficulty:2, xp:10 },
      { id:'u2l4e7', type:'speaking', instruction:'Sprich mit dem Verkäufer.', prompt:'Sag den Satz laut.', speech:'I would like this in black, please.', acceptedAnswers:['I would like this in black, please.','I would like this in black please.','I would like this in black please'], conceptIds:['cafe.want','color.black','courtesy.please','demonstrative.this'], difficulty:3, xp:15 },
      { id:'u2l4e8', type:'dictation', instruction:'Höre zu und schreibe die Frage.', prompt:'Preisfrage', speech:'How much is this?', acceptedAnswers:['How much is this?','How much is this'], conceptIds:['shopping.how-much'], difficulty:2, xp:12 }
    ]
  },
  {
    id: 'en-a1-u2-l5', courseId: 'de-en', level: 'A1', unitId: 'en-a1-u2',
    title: 'Zu Hause', subtitle: 'Räume und Gegenstände beschreiben mit “there is” und “there are”.', estimatedMinutes: 9,
    newConcepts: ['home.kitchen','home.bedroom','home.bathroom','home.living-room','there.is','there.are'],
    exercises: [
      { id:'u2l5e1', type:'multiple-choice', instruction:'Wähle die Übersetzung.', prompt:'Küche', choices:['kitchen','bedroom','bathroom','living room'], answer:'kitchen', conceptIds:['home.kitchen'], difficulty:1, xp:5 },
      { id:'u2l5e2', type:'multiple-choice', instruction:'Wähle die Übersetzung.', prompt:'Schlafzimmer', choices:['bedroom','bathroom','kitchen','garden'], answer:'bedroom', conceptIds:['home.bedroom'], difficulty:1, xp:5 },
      { id:'u2l5e3', type:'fill-gap', instruction:'Ergänze die Struktur.', prompt:'Ein Raum', sentence:'There ___ a kitchen.', choices:['is','are','am','have'], answer:'is', conceptIds:['there.is','home.kitchen'], difficulty:2, xp:8 },
      { id:'u2l5e4', type:'fill-gap', instruction:'Ergänze die Struktur.', prompt:'Mehrere Räume', sentence:'There ___ two bedrooms.', choices:['are','is','am','has'], answer:'are', conceptIds:['there.are','home.bedroom'], difficulty:2, xp:8 },
      { id:'u2l5e5', type:'translation', instruction:'Übersetze ins Englische.', prompt:'Wohnung beschreiben', sourceText:'Es gibt ein Badezimmer.', acceptedAnswers:['There is a bathroom.','There is a bathroom'], conceptIds:['there.is','home.bathroom','article.a'], difficulty:2, xp:10 },
      { id:'u2l5e6', type:'listening', instruction:'Höre zu und wähle den Raum.', prompt:'Welcher Raum wird genannt?', speech:'There is a small living room.', choices:['Wohnzimmer','Küche','Schlafzimmer','Badezimmer'], answer:'Wohnzimmer', conceptIds:['there.is','home.living-room'], difficulty:2, xp:10 },
      { id:'u2l5e7', type:'speaking', instruction:'Beschreibe dein Zuhause.', prompt:'Sag den Satz laut.', speech:'There is a kitchen and a living room.', acceptedAnswers:['There is a kitchen and a living room.','There is a kitchen and a living room'], conceptIds:['there.is','home.kitchen','home.living-room'], difficulty:3, xp:15 },
      { id:'u2l5e8', type:'sentence-build', instruction:'Baue den Satz.', prompt:'Es gibt zwei Schlafzimmer.', tokens:['bedrooms','There','two','are','.'], answer:'There are two bedrooms.', conceptIds:['there.are','home.bedroom'], difficulty:2, xp:10 }
    ]
  },
  {
    id: 'en-a1-u2-l6', courseId: 'de-en', level: 'A1', unitId: 'en-a1-u2',
    title: 'Nach dem Weg fragen', subtitle: 'Links, rechts und geradeaus in einfachen Wegbeschreibungen.', estimatedMinutes: 9,
    newConcepts: ['direction.where','direction.left','direction.right','direction.straight','place.station','place.hotel'],
    exercises: [
      { id:'u2l6e1', type:'multiple-choice', instruction:'Wähle die Übersetzung.', prompt:'links', choices:['left','right','straight','behind'], answer:'left', conceptIds:['direction.left'], difficulty:1, xp:5 },
      { id:'u2l6e2', type:'multiple-choice', instruction:'Wähle die Übersetzung.', prompt:'geradeaus', choices:['straight','left','right','near'], answer:'straight', conceptIds:['direction.straight'], difficulty:1, xp:5 },
      { id:'u2l6e3', type:'sentence-build', instruction:'Baue die Frage.', prompt:'Wo ist der Bahnhof?', tokens:['station','Where','the','is','?'], answer:'Where is the station?', conceptIds:['direction.where','place.station','verb.be.is'], difficulty:2, xp:10 },
      { id:'u2l6e4', type:'translation', instruction:'Übersetze ins Englische.', prompt:'Wegbeschreibung', sourceText:'Gehen Sie geradeaus.', acceptedAnswers:['Go straight.','Go straight'], conceptIds:['direction.straight'], difficulty:2, xp:9 },
      { id:'u2l6e5', type:'fill-gap', instruction:'Ergänze die Richtung.', prompt:'Wegbeschreibung', sentence:'Turn ___ at the hotel.', choices:['left','from','time','old'], answer:'left', conceptIds:['direction.left','place.hotel'], difficulty:2, xp:8 },
      { id:'u2l6e6', type:'listening', instruction:'Höre zu und wähle die Richtung.', prompt:'Was sollst du tun?', speech:'Turn right and go straight.', choices:['Rechts abbiegen und geradeaus.','Links abbiegen.','Zurückgehen.','Am Hotel warten.'], answer:'Rechts abbiegen und geradeaus.', conceptIds:['direction.right','direction.straight'], difficulty:2, xp:10 },
      { id:'u2l6e7', type:'speaking', instruction:'Frag nach dem Weg.', prompt:'Sag die Frage laut.', speech:'Excuse me, where is the station?', acceptedAnswers:['Excuse me, where is the station?','Excuse me where is the station?','Excuse me where is the station'], conceptIds:['courtesy.sorry','direction.where','place.station'], difficulty:3, xp:15 },
      { id:'u2l6e8', type:'dictation', instruction:'Höre zu und schreibe den Satz.', prompt:'Wegbeschreibung', speech:'Turn left and go straight.', acceptedAnswers:['Turn left and go straight.','Turn left and go straight'], conceptIds:['direction.left','direction.straight'], difficulty:2, xp:12 }
    ]
  },
  {
    id: 'en-a1-u2-l7', courseId: 'de-en', level: 'A1', unitId: 'en-a1-u2',
    title: 'Unterwegs', subtitle: 'Tickets, Bahnhof, Bus und Flughafen in typischen Reisesituationen.', estimatedMinutes: 10,
    newConcepts: ['travel.ticket','travel.train','travel.bus','travel.airport','travel.need','travel.to'],
    exercises: [
      { id:'u2l7e1', type:'multiple-choice', instruction:'Wähle die Übersetzung.', prompt:'Fahrkarte / Ticket', choices:['ticket','train','bus','gate'], answer:'ticket', conceptIds:['travel.ticket'], difficulty:1, xp:5 },
      { id:'u2l7e2', type:'multiple-choice', instruction:'Wähle die Übersetzung.', prompt:'Flughafen', choices:['airport','station','hotel','street'], answer:'airport', conceptIds:['travel.airport'], difficulty:1, xp:5 },
      { id:'u2l7e3', type:'sentence-build', instruction:'Baue den Satz.', prompt:'Ich brauche ein Ticket nach Wien.', tokens:['Vienna','need','ticket','I','to','a','.'], answer:'I need a ticket to Vienna.', conceptIds:['travel.need','travel.ticket','travel.to','article.a'], difficulty:2, xp:11 },
      { id:'u2l7e4', type:'fill-gap', instruction:'Ergänze das richtige Wort.', prompt:'Reiseziel', sentence:'A ticket ___ London, please.', choices:['to','from','at','in'], answer:'to', conceptIds:['travel.ticket','travel.to','courtesy.please'], difficulty:2, xp:8 },
      { id:'u2l7e5', type:'translation', instruction:'Übersetze ins Englische.', prompt:'Am Schalter', sourceText:'Ich brauche ein Ticket nach Berlin, bitte.', acceptedAnswers:['I need a ticket to Berlin, please.','I need a ticket to Berlin please.','I need a ticket to Berlin please'], conceptIds:['travel.need','travel.ticket','travel.to','courtesy.please'], difficulty:2, xp:12 },
      { id:'u2l7e6', type:'listening', instruction:'Höre zu und wähle das Verkehrsmittel.', prompt:'Womit fährt die Person?', speech:'The train is at platform three.', choices:['Zug','Bus','Flugzeug','Taxi'], answer:'Zug', conceptIds:['travel.train'], difficulty:2, xp:10 },
      { id:'u2l7e7', type:'speaking', instruction:'Bestelle ein Ticket.', prompt:'Sag den Satz laut.', speech:'One ticket to London, please.', acceptedAnswers:['One ticket to London, please.','One ticket to London please.','One ticket to London please'], conceptIds:['travel.ticket','travel.to','courtesy.please'], difficulty:2, xp:15 },
      { id:'u2l7e8', type:'dictation', instruction:'Höre zu und schreibe den Satz.', prompt:'Am Bahnhof', speech:'The bus is at the station.', acceptedAnswers:['The bus is at the station.','The bus is at the station'], conceptIds:['travel.bus','place.station'], difficulty:2, xp:12 }
    ]
  },
  {
    id: 'en-a1-u2-l8', courseId: 'de-en', level: 'A1', unitId: 'en-a1-u2',
    title: 'Alltags-Checkpoint', subtitle: 'Eine gemischte Session aus Familie, Alltag, Zeit, Einkaufen, Weg und Reise.', estimatedMinutes: 12,
    newConcepts: [],
    exercises: [
      { id:'u2l8e1', type:'translation', instruction:'Übersetze ins Englische.', prompt:'Familie', sourceText:'Ich habe eine Schwester.', acceptedAnswers:['I have a sister.','I have a sister'], conceptIds:['verb.have','family.sister','article.a'], difficulty:2, xp:10 },
      { id:'u2l8e2', type:'sentence-build', instruction:'Baue den Satz.', prompt:'Ich stehe um sieben Uhr auf.', tokens:['seven','up','I','at','get','.'], answer:'I get up at seven.', conceptIds:['routine.get-up','time.at','present.simple-i'], difficulty:2, xp:10 },
      { id:'u2l8e3', type:'listening', instruction:'Höre zu und wähle die Uhrzeit.', prompt:'Termin', speech:'The appointment is at nine o’clock.', choices:['9:00','9:30','8:00','10:00'], answer:'9:00', conceptIds:['appointment.basic','time.oclock','time.at'], difficulty:2, xp:10 },
      { id:'u2l8e4', type:'translation', instruction:'Übersetze ins Englische.', prompt:'Einkaufen', sourceText:'Wie viel kostet das?', acceptedAnswers:['How much is this?','How much is this'], conceptIds:['shopping.how-much','demonstrative.this'], difficulty:2, xp:10 },
      { id:'u2l8e5', type:'fill-gap', instruction:'Ergänze die richtige Form.', prompt:'Zu Hause', sentence:'There ___ two bedrooms.', choices:['are','is','am','have'], answer:'are', conceptIds:['there.are','home.bedroom'], difficulty:2, xp:8 },
      { id:'u2l8e6', type:'listening', instruction:'Höre zu und wähle die Richtung.', prompt:'Wegbeschreibung', speech:'Go straight and turn left.', choices:['Geradeaus und links.','Rechts und zurück.','Nur links.','Zum Bahnhof.'], answer:'Geradeaus und links.', conceptIds:['direction.straight','direction.left'], difficulty:2, xp:10 },
      { id:'u2l8e7', type:'speaking', instruction:'Meistere eine Reisesituation.', prompt:'Sag den vollständigen Satz laut.', speech:'Excuse me, I need a ticket to Vienna, please.', acceptedAnswers:['Excuse me, I need a ticket to Vienna, please.','Excuse me I need a ticket to Vienna please.','Excuse me I need a ticket to Vienna please'], conceptIds:['courtesy.sorry','travel.need','travel.ticket','travel.to','courtesy.please'], difficulty:3, xp:18 },
      { id:'u2l8e8', type:'dictation', instruction:'Höre zu und schreibe den Satz.', prompt:'Abschluss-Diktat', speech:'I work in the morning and I sleep at night.', acceptedAnswers:['I work in the morning and I sleep at night.','I work in the morning and I sleep at night'], conceptIds:['routine.work','routine.sleep','time.morning','time.night'], difficulty:3, xp:15 }
    ]
  }
];
