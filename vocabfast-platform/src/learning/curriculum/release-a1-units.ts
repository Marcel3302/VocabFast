import type { Lesson } from '../types';

type Blueprint={
  unit:3|4;lesson:1|2|3|4;unitTitle:string;unitSubtitle:string;title:string;subtitle:string;goal:string;
  german:string;english:string;sentenceChoices:string[];gapSentence:string;gapChoices:string[];gapAnswer:string;
  listening:string;listeningMeaning:string;listeningChoices:string[];conceptId:string;
};

const blueprints:Blueprint[]=[
  {
    unit:3,lesson:1,unitTitle:'Unterwegs in der Stadt',unitSubtitle:'Nach dem Weg fragen, öffentliche Verkehrsmittel nutzen, einkaufen und bestellen.',
    title:'Nach dem Weg fragen',subtitle:'Orte finden und einfache Richtungen verstehen.',goal:'Nach einem Ort fragen und eine kurze Wegbeschreibung verstehen.',
    german:'Entschuldigung, wo ist der Bahnhof?',english:'Excuse me, where is the train station?',
    sentenceChoices:['Excuse me, where is the train station?','Excuse me, when is the train station?','Excuse me, where the train station is?','Excuse me, which is the train station from?'],
    gapSentence:'Turn ___ at the bank and walk straight ahead.',gapChoices:['left','near','between','across'],gapAnswer:'left',
    listening:'The station is next to the supermarket, opposite the hotel.',listeningMeaning:'Der Bahnhof ist neben dem Supermarkt, gegenüber vom Hotel.',
    listeningChoices:['Der Bahnhof ist neben dem Supermarkt, gegenüber vom Hotel.','Der Bahnhof ist hinter dem Hotel und weit vom Supermarkt entfernt.','Das Hotel ist im Bahnhof neben dem Supermarkt.','Der Supermarkt ist im Hotel gegenüber vom Bahnhof.'],conceptId:'cefr.a1.directions'
  },
  {
    unit:3,lesson:2,unitTitle:'Unterwegs in der Stadt',unitSubtitle:'Nach dem Weg fragen, öffentliche Verkehrsmittel nutzen, einkaufen und bestellen.',
    title:'Bus & Bahn',subtitle:'Tickets, Haltestellen und einfache Fahrinformationen verstehen.',goal:'Nach einem Ticket fragen und eine Abfahrtsinformation verstehen.',
    german:'Ich hätte gern eine Fahrkarte ins Stadtzentrum.',english:'I would like a ticket to the city centre, please.',
    sentenceChoices:['I would like a ticket to the city centre, please.','I like a ticket from the city centre, please.','I would like ticket at the city centre, please.','I would want the city centre for a ticket, please.'],
    gapSentence:'What time does the next bus ___?',gapChoices:['leave','leaves','leaving','left'],gapAnswer:'leave',
    listening:'The next bus leaves at ten past nine from stop four.',listeningMeaning:'Der nächste Bus fährt um zehn nach neun von Haltestelle vier ab.',
    listeningChoices:['Der nächste Bus fährt um zehn nach neun von Haltestelle vier ab.','Der Bus Nummer neun fährt um zehn Uhr von Haltestelle vier ab.','Der nächste Bus kommt um Viertel nach neun an Haltestelle zehn an.','Haltestelle vier ist zehn Minuten vom nächsten Bus entfernt.'],conceptId:'cefr.a1.transport'
  },
  {
    unit:3,lesson:3,unitTitle:'Unterwegs in der Stadt',unitSubtitle:'Nach dem Weg fragen, öffentliche Verkehrsmittel nutzen, einkaufen und bestellen.',
    title:'Im Geschäft',subtitle:'Preise, Größen und Mengen in einfachen Einkaufsgesprächen verwenden.',goal:'Nach einem Preis oder einer anderen Größe fragen.',
    german:'Wie viel kostet dieses T-Shirt?',english:'How much is this T-shirt?',
    sentenceChoices:['How much is this T-shirt?','How many is this T-shirt?','How much are this T-shirt?','What money has this T-shirt?'],
    gapSentence:'Do you have this ___ a larger size?',gapChoices:['in','on','at','for'],gapAnswer:'in',
    listening:'It is twenty euros, and we also have it in blue.',listeningMeaning:'Es kostet zwanzig Euro, und wir haben es auch in Blau.',
    listeningChoices:['Es kostet zwanzig Euro, und wir haben es auch in Blau.','Es kostet zwölf Euro, aber es gibt nur die blaue Größe.','Es kostet zwanzig Euro mehr als das blaue T-Shirt.','Das blaue T-Shirt kostet zwei Euro und ist ausverkauft.'],conceptId:'cefr.a1.shopping'
  },
  {
    unit:3,lesson:4,unitTitle:'Unterwegs in der Stadt',unitSubtitle:'Nach dem Weg fragen, öffentliche Verkehrsmittel nutzen, einkaufen und bestellen.',
    title:'Im Café bestellen',subtitle:'Getränke und einfache Speisen höflich bestellen und bezahlen.',goal:'Eine einfache Bestellung aufgeben und nach der Rechnung fragen.',
    german:'Ich nehme einen Kaffee und ein Sandwich, bitte.',english:'I would like a coffee and a sandwich, please.',
    sentenceChoices:['I would like a coffee and a sandwich, please.','I am liking a coffee and sandwich, please.','I would like coffee and the sandwich are, please.','I take to a coffee with sandwich, please.'],
    gapSentence:'Can I have the ___, please?',gapChoices:['bill','price','money','pay'],gapAnswer:'bill',
    listening:'Would you like milk or sugar with your coffee?',listeningMeaning:'Möchten Sie Milch oder Zucker zu Ihrem Kaffee?',
    listeningChoices:['Möchten Sie Milch oder Zucker zu Ihrem Kaffee?','Möchten Sie Kaffee oder Milch mit Zucker kaufen?','Ist in Ihrem Kaffee Milch und Zucker enthalten?','Möchten Sie für Milch oder Zucker bezahlen?'],conceptId:'cefr.a1.cafe-order'
  },
  {
    unit:4,lesson:1,unitTitle:'Alltag sicher meistern',unitSubtitle:'Über Fähigkeiten, Zuhause, Gesundheit und einfache Einladungen sprechen.',
    title:'Was kannst du?',subtitle:'Fähigkeiten und einfache Möglichkeiten mit can ausdrücken.',goal:'Sagen, was du kannst oder nicht kannst.',
    german:'Ich kann ein bisschen Englisch sprechen, aber ich kann nicht gut schreiben.',english:'I can speak a little English, but I cannot write well.',
    sentenceChoices:['I can speak a little English, but I cannot write well.','I can to speak a little English, but I not can write well.','I am can speak a little English, but I cannot writing well.','I speak can a little English, but I do not can write well.'],
    gapSentence:'___ you swim?',gapChoices:['Can','Do can','Are can','Can to'],gapAnswer:'Can',
    listening:'My sister can drive, but she cannot ride a motorbike.',listeningMeaning:'Meine Schwester kann Auto fahren, aber sie kann nicht Motorrad fahren.',
    listeningChoices:['Meine Schwester kann Auto fahren, aber sie kann nicht Motorrad fahren.','Meine Schwester fährt mit dem Motorrad, aber nicht mit dem Auto.','Meine Schwester möchte Auto und Motorrad fahren lernen.','Meine Schwester kann weder Auto noch Motorrad fahren.'],conceptId:'cefr.a1.can-ability'
  },
  {
    unit:4,lesson:2,unitTitle:'Alltag sicher meistern',unitSubtitle:'Über Fähigkeiten, Zuhause, Gesundheit und einfache Einladungen sprechen.',
    title:'Bei mir zu Hause',subtitle:'Räume und Gegenstände mit there is / there are beschreiben.',goal:'Ein Zimmer und die Position wichtiger Dinge beschreiben.',
    german:'In meinem Zimmer gibt es ein Bett und zwei Stühle.',english:'There is a bed and there are two chairs in my room.',
    sentenceChoices:['There is a bed and there are two chairs in my room.','There are a bed and there is two chairs in my room.','It has a bed and two chairs are in my room there.','There is bed and two chair in my room.'],
    gapSentence:'There ___ some books on the table.',gapChoices:['are','is','be','has'],gapAnswer:'are',
    listening:'The keys are on the table next to the window.',listeningMeaning:'Die Schlüssel liegen auf dem Tisch neben dem Fenster.',
    listeningChoices:['Die Schlüssel liegen auf dem Tisch neben dem Fenster.','Die Schlüssel hängen am Fenster über dem Tisch.','Der Tisch steht auf den Schlüsseln neben dem Fenster.','Die Schlüssel liegen unter dem Tisch gegenüber vom Fenster.'],conceptId:'cefr.a1.there-is-are'
  },
  {
    unit:4,lesson:3,unitTitle:'Alltag sicher meistern',unitSubtitle:'Über Fähigkeiten, Zuhause, Gesundheit und einfache Einladungen sprechen.',
    title:'Mir geht es nicht gut',subtitle:'Einfache Beschwerden nennen und grundlegende Hinweise verstehen.',goal:'Eine einfache Beschwerde beschreiben und einen Rat verstehen.',
    german:'Ich habe Kopfschmerzen und fühle mich müde.',english:'I have a headache and I feel tired.',
    sentenceChoices:['I have a headache and I feel tired.','I am a headache and I have tired.','I have head pain and I am feel tired.','My headache has me tired.'],
    gapSentence:'You should drink some water and ___.',gapChoices:['rest','rests','resting','to resting'],gapAnswer:'rest',
    listening:'Take this medicine twice a day after food.',listeningMeaning:'Nehmen Sie dieses Medikament zweimal täglich nach dem Essen.',
    listeningChoices:['Nehmen Sie dieses Medikament zweimal täglich nach dem Essen.','Nehmen Sie nach zwei Tagen dieses Medikament vor dem Essen.','Essen Sie zweimal täglich, bevor Sie dieses Medikament kaufen.','Nehmen Sie zwei Medikamente jeden Tag ohne Essen.'],conceptId:'cefr.a1.health-basics'
  },
  {
    unit:4,lesson:4,unitTitle:'Alltag sicher meistern',unitSubtitle:'Über Fähigkeiten, Zuhause, Gesundheit und einfache Einladungen sprechen.',
    title:'Etwas gemeinsam machen',subtitle:'Einladen, annehmen und höflich ablehnen.',goal:'Eine einfache Einladung aussprechen und darauf reagieren.',
    german:'Möchtest du am Samstag mit uns ins Kino gehen?',english:'Would you like to go to the cinema with us on Saturday?',
    sentenceChoices:['Would you like to go to the cinema with us on Saturday?','Do you like go to the cinema with us in Saturday?','Would you like going cinema with we on Saturday?','Are you like to go at the cinema with us Saturday?'],
    gapSentence:'That sounds great. What time shall we ___?',gapChoices:['meet','meeting','met','to meet'],gapAnswer:'meet',
    listening:'Thanks for asking, but I cannot come on Saturday. How about Sunday?',listeningMeaning:'Danke für die Einladung, aber ich kann am Samstag nicht kommen. Wie wäre es mit Sonntag?',
    listeningChoices:['Danke für die Einladung, aber ich kann am Samstag nicht kommen. Wie wäre es mit Sonntag?','Danke, ich komme am Samstag und Sonntag sehr gern.','Ich kann am Sonntag nicht kommen, aber Samstag passt.','Ich frage am Samstag, ob wir am Sonntag kommen dürfen.'],conceptId:'cefr.a1.invitations'
  }
];

function tokens(value:string){return value.replace(/([,.!?;:])/g,' $1 ').replace(/\s+/g,' ').trim().split(' ');}
function scramble(value:string){const parts=tokens(value);if(parts.length<5)return [...parts].reverse();const cut=Math.max(2,Math.floor(parts.length*.55));return [...parts.slice(cut),...parts.slice(0,cut)];}

function makeLesson(bp:Blueprint):Lesson{
  const id=`en-a1-u${bp.unit}-l${bp.lesson}`,conceptIds=[bp.conceptId];
  return {
    id,courseId:'de-en',level:'A1',unitId:`en-a1-u${bp.unit}`,title:bp.title,subtitle:bp.subtitle,estimatedMinutes:9,newConcepts:conceptIds,
    exercises:[
      {id:`${id}-e1`,type:'multiple-choice',instruction:'Welche englische Formulierung passt am besten?',prompt:bp.german,choices:bp.sentenceChoices,answer:bp.english,conceptIds,difficulty:1,xp:6,explanation:`Trainingsziel: ${bp.goal}`},
      {id:`${id}-e2`,type:'translation',instruction:'Übersetze den Satz ins Englische.',prompt:bp.goal,sourceText:bp.german,acceptedAnswers:[bp.english],conceptIds,difficulty:1,xp:8},
      {id:`${id}-e3`,type:'sentence-build',instruction:'Baue den vollständigen englischen Satz.',prompt:bp.german,tokens:scramble(bp.english),answer:bp.english,conceptIds,difficulty:1,xp:7},
      {id:`${id}-e4`,type:'fill-gap',instruction:'Wähle die Form, die in den Satz passt.',prompt:bp.goal,sentence:bp.gapSentence,choices:bp.gapChoices,answer:bp.gapAnswer,conceptIds,difficulty:1,xp:6},
      {id:`${id}-e5`,type:'listening',instruction:'Höre zu und wähle die passende Bedeutung.',prompt:'Konzentriere dich auf Ort, Zeit und wichtige Details.',speech:bp.listening,choices:bp.listeningChoices,answer:bp.listeningMeaning,conceptIds,difficulty:1,xp:8},
      {id:`${id}-e6`,type:'dictation',instruction:'Höre zu und schreibe den englischen Satz.',prompt:'Du kannst das Audio mehrmals abspielen.',speech:bp.listening,acceptedAnswers:[bp.listening],conceptIds,difficulty:1,xp:9},
      {id:`${id}-e7`,type:'speaking',instruction:'Sprich den Zielsatz laut und natürlich.',prompt:bp.goal,speech:bp.english,acceptedAnswers:[bp.english],conceptIds,difficulty:1,xp:9},
      {id:`${id}-e8`,type:'multiple-choice',instruction:'Welche Antwort ist grammatisch und für die Situation passend?',prompt:bp.goal,choices:bp.sentenceChoices,answer:bp.english,conceptIds,difficulty:1,xp:7}
    ]
  };
}

function unitFor(unit:3|4){
  const items=blueprints.filter(item=>item.unit===unit),first=items[0];
  return {id:`en-a1-u${unit}`,number:unit,title:first.unitTitle,subtitle:first.unitSubtitle,lessons:items.map(makeLesson)};
}

export const englishA1ReleaseUnits=[unitFor(3),unitFor(4)];
