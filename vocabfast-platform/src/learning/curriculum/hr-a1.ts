import type { Lesson } from '../types';

type Card={title:string;subtitle:string;de:string;hr:string;meaning:string;concept:string;choices:string[]};
type Unit={id:string;number:number;title:string;subtitle:string;cards:Card[]};

const units:Unit[]=[
  {id:'hr-a1-u1',number:1,title:'Prvi razgovori',subtitle:'Begrüßen, vorstellen, danken und erste einfache Fragen stellen.',cards:[
    {title:'Hallo sagen',subtitle:'Natürlich begrüßen und reagieren.',de:'Hallo! Wie geht es dir?',hr:'Bok! Kako si?',meaning:'Hallo! Wie geht es dir?',concept:'hr.a1.greetings',choices:['Bok! Kako si?','Laku noć.','Koliko košta?','Gdje je hotel?']},
    {title:'Sich vorstellen',subtitle:'Name und Herkunft nennen.',de:'Ich heiße Marcel. Ich komme aus Österreich.',hr:'Zovem se Marcel. Dolazim iz Austrije.',meaning:'Ich heiße Marcel. Ich komme aus Österreich.',concept:'hr.a1.introduction',choices:['Zovem se Marcel. Dolazim iz Austrije.','Ne razumijem.','Molim račun.','Vidimo se sutra.']},
    {title:'Danke & bitte',subtitle:'Höflich reagieren.',de:'Vielen Dank. Bitte sehr.',hr:'Hvala puno. Molim.',meaning:'Vielen Dank. Bitte sehr.',concept:'hr.a1.politeness',choices:['Hvala puno. Molim.','Dobro jutro.','Imam rezervaciju.','Trebam liječnika.']},
    {title:'Verstehen prüfen',subtitle:'Nachfragen, wenn etwas unklar ist.',de:'Entschuldigung, ich verstehe nicht. Können Sie das wiederholen?',hr:'Oprostite, ne razumijem. Možete li ponoviti?',meaning:'Entschuldigung, ich verstehe nicht. Können Sie das wiederholen?',concept:'hr.a1.clarification',choices:['Oprostite, ne razumijem. Možete li ponoviti?','Govorim malo hrvatski.','Želim kavu.','Koliko je sati?']}
  ]},
  {id:'hr-a1-u2',number:2,title:'Kafić & kupovina',subtitle:'Bestellen, bezahlen, Preise verstehen und einfache Wünsche äußern.',cards:[
    {title:'Kaffee bestellen',subtitle:'Eine Bestellung höflich formulieren.',de:'Ich möchte einen Kaffee und ein Wasser, bitte.',hr:'Želim jednu kavu i vodu, molim.',meaning:'Ich möchte einen Kaffee und ein Wasser, bitte.',concept:'hr.a1.cafe-order',choices:['Želim jednu kavu i vodu, molim.','Gdje je kolodvor?','Ja sam iz Austrije.','Danas ne radim.']},
    {title:'Die Rechnung',subtitle:'Im Café bezahlen.',de:'Die Rechnung, bitte. Kann ich mit Karte bezahlen?',hr:'Račun, molim. Mogu li platiti karticom?',meaning:'Die Rechnung, bitte. Kann ich mit Karte bezahlen?',concept:'hr.a1.payment',choices:['Račun, molim. Mogu li platiti karticom?','Imate li slobodnu sobu?','Ne govorim brzo.','Ovo je moja sestra.']},
    {title:'Nach dem Preis fragen',subtitle:'Preise verstehen und vergleichen.',de:'Wie viel kostet das?',hr:'Koliko to košta?',meaning:'Wie viel kostet das?',concept:'hr.a1.price',choices:['Koliko to košta?','Kako se zoveš?','Gdje radiš?','Kada dolazi autobus?']},
    {title:'Etwas suchen',subtitle:'Im Geschäft nach einem Produkt fragen.',de:'Haben Sie Wasser ohne Kohlensäure?',hr:'Imate li negaziranu vodu?',meaning:'Haben Sie Wasser ohne Kohlensäure?',concept:'hr.a1.shopping',choices:['Imate li negaziranu vodu?','Ja nemam auto.','Soba je velika.','Vrijeme je lijepo.']}
  ]},
  {id:'hr-a1-u3',number:3,title:'Putovanje & orijentacija',subtitle:'Unterwegs fragen, Verkehrsmittel nutzen und am Hotel ankommen.',cards:[
    {title:'Nach dem Weg fragen',subtitle:'Einen Ort finden.',de:'Entschuldigung, wo ist der Bahnhof?',hr:'Oprostite, gdje je kolodvor?',meaning:'Entschuldigung, wo ist der Bahnhof?',concept:'hr.a1.directions',choices:['Oprostite, gdje je kolodvor?','Želim doručak.','Moj brat je visok.','Danas je ponedjeljak.']},
    {title:'Bus & Abfahrt',subtitle:'Nach Zeiten fragen.',de:'Wann fährt der Bus nach Split?',hr:'Kada polazi autobus za Split?',meaning:'Wann fährt der Bus nach Split?',concept:'hr.a1.transport-time',choices:['Kada polazi autobus za Split?','Koliko imaš godina?','Imam jednu torbu.','Volim more.']},
    {title:'Hotel-Check-in',subtitle:'Eine Reservierung nennen.',de:'Guten Abend. Ich habe eine Reservierung auf den Namen Steiner.',hr:'Dobra večer. Imam rezervaciju na ime Steiner.',meaning:'Guten Abend. Ich habe eine Reservierung auf den Namen Steiner.',concept:'hr.a1.hotel',choices:['Dobra večer. Imam rezervaciju na ime Steiner.','Molim jednu pizzu.','Sutra idem na posao.','Ona govori engleski.']},
    {title:'Hilfe unterwegs',subtitle:'Ein Problem kurz erklären.',de:'Ich habe mich verlaufen. Können Sie mir helfen?',hr:'Izgubio sam se. Možete li mi pomoći?',meaning:'Ich habe mich verlaufen. Können Sie mir helfen?',concept:'hr.a1.travel-help',choices:['Izgubio sam se. Možete li mi pomoći?','Ovo je vrlo ukusno.','Imam dvadeset godina.','Ne pijem kavu.']}
  ]},
  {id:'hr-a1-u4',number:4,title:'Svakodnevni život',subtitle:'Tagesablauf, Familie, Zeit, Gesundheit und einfache Pläne ausdrücken.',cards:[
    {title:'Über den Alltag sprechen',subtitle:'Einen einfachen Tagesablauf beschreiben.',de:'Ich arbeite von Montag bis Freitag.',hr:'Radim od ponedjeljka do petka.',meaning:'Ich arbeite von Montag bis Freitag.',concept:'hr.a1.daily-routine',choices:['Radim od ponedjeljka do petka.','Vlak je brz.','Ona je liječnica.','Ovo nije moje.']},
    {title:'Familie vorstellen',subtitle:'Personen beschreiben.',de:'Das ist meine Schwester. Sie wohnt in Zagreb.',hr:'Ovo je moja sestra. Živi u Zagrebu.',meaning:'Das ist meine Schwester. Sie wohnt in Zagreb.',concept:'hr.a1.family',choices:['Ovo je moja sestra. Živi u Zagrebu.','Imam rezervaciju.','Ne znam adresu.','Pada kiša.']},
    {title:'Nach der Uhrzeit fragen',subtitle:'Zeit verstehen und nennen.',de:'Wie spät ist es?',hr:'Koliko je sati?',meaning:'Wie spät ist es?',concept:'hr.a1.time',choices:['Koliko je sati?','Koliko to košta?','Kako si?','Gdje si?']},
    {title:'Gesundheit',subtitle:'Ein einfaches Problem ausdrücken.',de:'Mir geht es nicht gut. Ich brauche einen Arzt.',hr:'Ne osjećam se dobro. Trebam liječnika.',meaning:'Mir geht es nicht gut. Ich brauche einen Arzt.',concept:'hr.a1.health',choices:['Ne osjećam se dobro. Trebam liječnika.','Želim dvije karte.','Soba je slobodna.','Vidimo se navečer.']}
  ]}
];

function tokens(value:string){return value.replace(/([,.!?;:])/g,' $1 ').replace(/\s+/g,' ').trim().split(' ').reverse();}
function lesson(unit:Unit,card:Card,index:number):Lesson {
  const id=`${unit.id}-l${index+1}`;
  return {id,courseId:'multi-hr',level:'A1',unitId:unit.id,title:card.title,subtitle:card.subtitle,estimatedMinutes:10,newConcepts:[card.concept],exercises:[
    {id:`${id}-e1`,type:'multiple-choice',instruction:'Wähle die passende kroatische Formulierung.',prompt:card.de,choices:card.choices,answer:card.hr,conceptIds:[card.concept],difficulty:1,xp:7,explanation:'Achte auf die ganze Redewendung statt nur auf einzelne Wörter.'},
    {id:`${id}-e2`,type:'translation',instruction:'Übersetze in natürliches Kroatisch.',prompt:card.subtitle,sourceText:card.de,acceptedAnswers:[card.hr],conceptIds:[card.concept],difficulty:1,xp:9},
    {id:`${id}-e3`,type:'sentence-build',instruction:'Baue den kroatischen Satz in der richtigen Reihenfolge.',prompt:card.de,tokens:tokens(card.hr),answer:card.hr,conceptIds:[card.concept],difficulty:1,xp:8},
    {id:`${id}-e4`,type:'listening',instruction:'Höre den kroatischen Satz und wähle seine Bedeutung.',prompt:'Was bedeutet die Aussage?',speech:card.hr,choices:[card.meaning,...units.flatMap(item=>item.cards).filter(other=>other!==card).slice(index,index+3).map(other=>other.meaning)].slice(0,4),answer:card.meaning,conceptIds:[card.concept],difficulty:1,xp:8}
  ]};
}

export const croatianA1Units=units.map(unit=>({id:unit.id,number:unit.number,title:unit.title,subtitle:unit.subtitle,lessons:unit.cards.map((card,index)=>lesson(unit,card,index))}));
