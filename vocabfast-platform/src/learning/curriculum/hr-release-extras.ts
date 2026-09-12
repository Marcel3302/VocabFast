import type { Lesson } from '../types';

type Level='A1'|'A2';
type Card={
  unitId:string;
  level:Level;
  number:number;
  title:string;
  subtitle:string;
  de:string;
  hr:string;
  concept:string;
  gapSentence:string;
  gapChoices:string[];
  gapAnswer:string;
};

const cards:Card[]=[
  {unitId:'hr-a1-u1',level:'A1',number:5,title:'Höflich vorstellen',subtitle:'Formell nach dem Namen fragen.',de:'Guten Tag. Wie heißen Sie?',hr:'Dobar dan. Kako se zovete?',concept:'hr.a1.formal-introduction',gapSentence:'Dobar dan. Kako se ___?',gapChoices:['zovete','zovem','zoveš','zvati'],gapAnswer:'zovete'},
  {unitId:'hr-a1-u1',level:'A1',number:6,title:'Sprachkenntnisse nennen',subtitle:'Einfach sagen, wie gut man Kroatisch spricht.',de:'Ich spreche ein wenig Kroatisch, aber nicht sehr gut.',hr:'Govorim malo hrvatski, ali ne baš dobro.',concept:'hr.a1.language-skill',gapSentence:'Govorim ___ hrvatski, ali ne baš dobro.',gapChoices:['malo','mnogo','sutra','ovdje'],gapAnswer:'malo'},
  {unitId:'hr-a1-u2',level:'A1',number:5,title:'Menge bestellen',subtitle:'Eine einfache Menge im Geschäft nennen.',de:'Ein Kilo Tomaten, bitte.',hr:'Kilogram rajčica, molim.',concept:'hr.a1.quantity',gapSentence:'Kilogram ___, molim.',gapChoices:['rajčica','računa','kolodvora','sobe'],gapAnswer:'rajčica'},
  {unitId:'hr-a1-u2',level:'A1',number:6,title:'Nach vegetarischem Essen fragen',subtitle:'Im Restaurant nach einer passenden Option fragen.',de:'Haben Sie heute eine vegetarische Suppe?',hr:'Imate li danas vegetarijansku juhu?',concept:'hr.a1.food-question',gapSentence:'Imate li danas vegetarijansku ___?',gapChoices:['juhu','kartu','sobu','stanicu'],gapAnswer:'juhu'},
  {unitId:'hr-a1-u3',level:'A1',number:5,title:'Fahrkarte kaufen',subtitle:'Am Schalter ein einfaches Ticket verlangen.',de:'Eine Fahrkarte nach Zadar, bitte.',hr:'Jednu kartu za Zadar, molim.',concept:'hr.a1.ticket',gapSentence:'Jednu ___ za Zadar, molim.',gapChoices:['kartu','kavu','vodu','sobu'],gapAnswer:'kartu'},
  {unitId:'hr-a1-u3',level:'A1',number:6,title:'Entfernung erfragen',subtitle:'Schnell prüfen, ob ein Ziel weit entfernt ist.',de:'Ist das Zentrum weit von hier?',hr:'Je li centar daleko odavde?',concept:'hr.a1.distance',gapSentence:'Je li centar ___ odavde?',gapChoices:['daleko','skupo','gladno','sporo'],gapAnswer:'daleko'},
  {unitId:'hr-a1-u4',level:'A1',number:5,title:'Über das Wetter sprechen',subtitle:'Einfaches Wetter für heute und morgen beschreiben.',de:'Heute ist es sonnig, aber morgen wird es regnen.',hr:'Danas je sunčano, a sutra će padati kiša.',concept:'hr.a1.weather',gapSentence:'Danas je sunčano, a sutra će padati ___.',gapChoices:['kiša','kava','soba','karta'],gapAnswer:'kiša'},
  {unitId:'hr-a1-u4',level:'A1',number:6,title:'Jemanden einladen',subtitle:'Nach Zeit für ein Treffen fragen.',de:'Hast du heute Abend Zeit für einen Kaffee?',hr:'Imaš li večeras vremena za kavu?',concept:'hr.a1.invitation',gapSentence:'Imaš li večeras vremena za ___?',gapChoices:['kavu','posao','hotel','autobus'],gapAnswer:'kavu'},

  {unitId:'hr-a2-u1',level:'A2',number:5,title:'Planänderung erklären',subtitle:'Erklären, warum ein Vorhaben nicht geklappt hat.',de:'Wir wollten schwimmen gehen, aber das Wetter war schlecht.',hr:'Htjeli smo ići plivati, ali vrijeme je bilo loše.',concept:'hr.a2.changed-plan',gapSentence:'Htjeli smo ići plivati, ali vrijeme je bilo ___.',gapChoices:['loše','rano','blizu','skupo'],gapAnswer:'loše'},
  {unitId:'hr-a2-u1',level:'A2',number:6,title:'Ersten Besuch beschreiben',subtitle:'Eine neue Erfahrung kurz bewerten.',de:'Das war mein erster Besuch in Rijeka und die Stadt hat mir sehr gefallen.',hr:'To je bio moj prvi posjet Rijeci i grad mi se jako svidio.',concept:'hr.a2.first-visit',gapSentence:'To je bio moj prvi ___ Rijeci.',gapChoices:['posjet','račun','sastanak','kolodvor'],gapAnswer:'posjet'},
  {unitId:'hr-a2-u2',level:'A2',number:5,title:'In der Apotheke',subtitle:'Ein Symptom erklären und um Hilfe bitten.',de:'Seit gestern habe ich Halsschmerzen. Haben Sie etwas dagegen?',hr:'Od jučer me boli grlo. Imate li nešto za to?',concept:'hr.a2.pharmacy',gapSentence:'Od jučer me boli ___.',gapChoices:['grlo','vrijeme','račun','kofer'],gapAnswer:'grlo'},
  {unitId:'hr-a2-u2',level:'A2',number:6,title:'Verlorenes Gepäck melden',subtitle:'Ein Reiseproblem klar und knapp melden.',de:'Mein Koffer ist nicht angekommen. Wo kann ich das melden?',hr:'Moj kofer nije stigao. Gdje to mogu prijaviti?',concept:'hr.a2.lost-luggage',gapSentence:'Moj kofer nije stigao. Gdje to mogu ___?',gapChoices:['prijaviti','ručati','platiti','spavati'],gapAnswer:'prijaviti'},
  {unitId:'hr-a2-u3',level:'A2',number:5,title:'Deadline zusagen',subtitle:'Eine Aufgabe mit einer Bedingung terminieren.',de:'Ich kann die Aufgabe bis Freitag fertig machen, wenn ich heute die Daten bekomme.',hr:'Mogu završiti zadatak do petka ako danas dobijem podatke.',concept:'hr.a2.deadline',gapSentence:'Mogu završiti zadatak do petka ako danas dobijem ___.',gapChoices:['podatke','autobus','večeru','sobu'],gapAnswer:'podatke'},
  {unitId:'hr-a2-u3',level:'A2',number:6,title:'Verspätung ankündigen',subtitle:'Einen Grund nennen und die Folge erklären.',de:'Die Besprechung dauert wahrscheinlich länger, deshalb komme ich später.',hr:'Sastanak će vjerojatno trajati duže, zato ću doći kasnije.',concept:'hr.a2.delay',gapSentence:'Sastanak će vjerojatno trajati duže, zato ću doći ___.',gapChoices:['kasnije','jučer','ondje','nikada'],gapAnswer:'kasnije'},
  {unitId:'hr-a2-u4',level:'A2',number:5,title:'Präferenz begründen',subtitle:'Eine persönliche Vorliebe mit einem Grund verbinden.',de:'Mir passt es besser, am Meer zu bleiben, weil es dort ruhiger ist.',hr:'Više mi odgovara ostati na moru jer je tamo mirnije.',concept:'hr.a2.preference',gapSentence:'Više mi odgovara ostati na moru jer je tamo ___.',gapChoices:['mirnije','skuplje','kasnije','zatvoreno'],gapAnswer:'mirnije'},
  {unitId:'hr-a2-u4',level:'A2',number:6,title:'Vorschlag mit Bedingung',subtitle:'Einen gemeinsamen Plan vorsichtig vorschlagen.',de:'Wenn das Wetter gut bleibt, könnten wir morgen einen Ausflug machen.',hr:'Ako vrijeme ostane dobro, mogli bismo sutra na izlet.',concept:'hr.a2.conditional-suggestion',gapSentence:'Ako vrijeme ostane dobro, mogli bismo sutra na ___.',gapChoices:['izlet','račun','sastanak','kolodvor'],gapAnswer:'izlet'}
];

function tokens(value:string){
  const parts=value.replace(/([,.!?;:])/g,' $1 ').replace(/\s+/g,' ').trim().split(' ');
  const cut=Math.max(1,Math.floor(parts.length*.45));
  return [...parts.slice(cut),...parts.slice(0,cut)];
}

function makeLesson(card:Card):Lesson{
  const sameLevel=cards.filter(other=>other.level===card.level&&other!==card);
  const meaningChoices=[card.de,...sameLevel.slice((card.number*2)%Math.max(1,sameLevel.length-3)).map(other=>other.de)].slice(0,4);
  const contextChoices=[card.hr,...sameLevel.slice((card.number*3)%Math.max(1,sameLevel.length-3)).map(other=>other.hr)].slice(0,4);
  const difficulty=card.level==='A1'?1:2;
  const xp=card.level==='A1'?7:9;
  const id=`${card.unitId}-l${card.number}`;
  return {id,courseId:'multi-hr',level:card.level,unitId:card.unitId,title:card.title,subtitle:card.subtitle,estimatedMinutes:11,newConcepts:[card.concept],exercises:[
    {id:`${id}-e1`,type:'multiple-choice',instruction:'Wähle die kroatische Formulierung, die in dieser Situation wirklich passt.',prompt:card.de,choices:contextChoices,answer:card.hr,conceptIds:[card.concept],difficulty,xp,explanation:'Vergleiche Bedeutung und Satzfunktion – nicht nur einzelne bekannte Wörter.'},
    {id:`${id}-e2`,type:'translation',instruction:'Übersetze die Aussage natürlich ins Kroatische.',prompt:card.subtitle,sourceText:card.de,acceptedAnswers:[card.hr],conceptIds:[card.concept],difficulty,xp:xp+2},
    {id:`${id}-e3`,type:'sentence-build',instruction:'Ordne die Wörter zu einem natürlichen kroatischen Satz.',prompt:card.de,tokens:tokens(card.hr),answer:card.hr,conceptIds:[card.concept],difficulty,xp:xp+1},
    {id:`${id}-e4`,type:'fill-gap',instruction:'Ergänze das Wort, das grammatisch und inhaltlich am besten passt.',prompt:card.subtitle,sentence:card.gapSentence,choices:card.gapChoices,answer:card.gapAnswer,conceptIds:[card.concept],difficulty,xp:xp+1},
    {id:`${id}-e5`,type:'listening',instruction:'Höre den kroatischen Satz und wähle seine Bedeutung.',prompt:'Was wird tatsächlich gesagt?',speech:card.hr,choices:meaningChoices,answer:card.de,conceptIds:[card.concept],difficulty,xp:xp+2},
    {id:`${id}-e6`,type:'dictation',instruction:'Schreibe den gehörten kroatischen Satz möglichst vollständig.',prompt:'Achte auf Wortstellung und Endungen.',speech:card.hr,acceptedAnswers:[card.hr],conceptIds:[card.concept],difficulty,xp:xp+3},
    {id:`${id}-e7`,type:'speaking',instruction:'Sprich die Aussage auf Kroatisch.',prompt:card.de,speech:card.hr,acceptedAnswers:[card.hr],conceptIds:[card.concept],difficulty,xp:xp+4},
    {id:`${id}-e8`,type:'multiple-choice',instruction:'Welche Aussage würdest du für dieses Kommunikationsziel am ehesten verwenden?',prompt:card.subtitle,choices:contextChoices,answer:card.hr,conceptIds:[card.concept],difficulty,xp:xp+2}
  ]};
}

function group(level:Level){
  return cards.filter(card=>card.level===level).reduce<Record<string,Lesson[]>>((result,card)=>{
    (result[card.unitId]??=[]).push(makeLesson(card));
    return result;
  },{});
}

export const croatianA1ExtraLessonsByUnit=group('A1');
export const croatianA2ExtraLessonsByUnit=group('A2');
