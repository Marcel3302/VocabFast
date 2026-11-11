import type { Lesson } from '../types';
import type { CefrLevel, CourseUnit } from './index';

type Pair={de:string;en:string;title:string};
function makeUnit(level:CefrLevel,number:number,id:string,title:string,subtitle:string,pairs:Pair[]):CourseUnit{
  const targets=pairs.map(item=>item.en),sources=pairs.map(item=>item.de);
  const lessons:Lesson[]=pairs.map((pair,index)=>({id:`en-${level.toLowerCase()}-${id}-l${index+1}`,courseId:'de-en',level,unitId:`en-${level.toLowerCase()}-${id}`,title:pair.title,subtitle:pair.de,estimatedMinutes:8,newConcepts:[`english.${level.toLowerCase()}.${id}.${index+1}`],exercises:[
    {id:`${id}-${index}-mc`,type:'multiple-choice',instruction:'Welche englische Formulierung passt am besten?',prompt:pair.de,choices:targets,answer:pair.en,conceptIds:[`english.${level.toLowerCase()}.${id}.${index+1}`],difficulty:Math.min(5,Math.max(1,number)) as 1|2|3|4|5,xp:7},
    {id:`${id}-${index}-tr`,type:'translation',instruction:'Formuliere natürlich auf Englisch.',prompt:'Produziere die Aussage aktiv.',sourceText:pair.de,acceptedAnswers:[pair.en,pair.en.replace(/[.!?]$/,'')],conceptIds:[`english.${level.toLowerCase()}.${id}.${index+1}`],difficulty:Math.min(5,Math.max(1,number)) as 1|2|3|4|5,xp:10},
    {id:`${id}-${index}-li`,type:'listening',instruction:'Höre die Aussage und wähle die Bedeutung.',prompt:'Was wurde gesagt?',speech:pair.en,choices:sources,answer:pair.de,conceptIds:[`english.${level.toLowerCase()}.${id}.${index+1}`],difficulty:Math.min(5,Math.max(1,number)) as 1|2|3|4|5,xp:10},
    {id:`${id}-${index}-di`,type:'dictation',instruction:'Schreibe die gehörte Formulierung.',prompt:'Achte auf natürliche Wortverbindungen.',speech:pair.en,acceptedAnswers:[pair.en,pair.en.replace(/[.!?]$/,'')],conceptIds:[`english.${level.toLowerCase()}.${id}.${index+1}`],difficulty:Math.min(5,Math.max(1,number+1)) as 1|2|3|4|5,xp:12},
    {id:`${id}-${index}-sp`,type:'speaking',instruction:'Sprich die Formulierung selbst.',prompt:pair.de,speech:pair.en,acceptedAnswers:[pair.en,pair.en.replace(/[.!?]$/,'')],conceptIds:[`english.${level.toLowerCase()}.${id}.${index+1}`],difficulty:Math.min(5,Math.max(1,number+1)) as 1|2|3|4|5,xp:12}
  ]}));
  return{id:`en-${level.toLowerCase()}-${id}`,number,title,subtitle,lessons};
}

export const englishExtensionUnits:Record<CefrLevel,CourseUnit[]>={
  A1:[makeUnit('A1',5,'real-world','Englisch direkt benutzen','Nachfragen, unterwegs sein und kleine Probleme lösen.',[
    {title:'Noch einmal, bitte',de:'Können Sie das bitte wiederholen?',en:'Could you say that again, please?'},
    {title:'Bushaltestelle finden',de:'Ich suche die Bushaltestelle.',en:'I’m looking for the bus stop.'},
    {title:'Etwas bestellen',de:'Kann ich bitte eine Flasche Wasser haben?',en:'Can I have a bottle of water, please?'},
    {title:'Problem im Hotel',de:'Ich habe ein Problem mit meinem Zimmer.',en:'I have a problem with my room.'}
  ])],
  A2:[makeUnit('A2',7,'travel-solutions','Reiseprobleme lösen','Änderungen, Empfehlungen und Verzögerungen verständlich erklären.',[
    {title:'Zug verpasst',de:'Ich habe meinen Zug verpasst. Was soll ich tun?',en:'I missed my train. What should I do?'},
    {title:'Reservierung ändern',de:'Ich möchte meine Reservierung ändern.',en:'I’d like to change my reservation.'},
    {title:'Empfehlung fragen',de:'Können Sie ein lokales Restaurant empfehlen?',en:'Could you recommend a local restaurant?'},
    {title:'Wartezeit erklären',de:'Ich warte seit zwanzig Minuten.',en:'I’ve been waiting for twenty minutes.'}
  ])],
  B1:[makeUnit('B1',9,'opinions','Meinungen & Lösungen','Begründen, erklären und gemeinsam eine Lösung finden.',[
    {title:'Meinung ausdrücken',de:'Meiner Meinung nach ist das die beste Option.',en:'In my opinion, this is the best option.'},
    {title:'Grund nennen',de:'Der Hauptgrund ist, dass es zuverlässiger ist.',en:'The main reason is that it is more reliable.'},
    {title:'Kompromiss finden',de:'Könnten wir einen Kompromiss finden?',en:'Could we find a compromise?'},
    {title:'Ablauf erklären',de:'Lassen Sie mich erklären, was passiert ist.',en:'Let me explain what happened.'}
  ])],
  B2:[makeUnit('B2',11,'professional','Professionell argumentieren','Positionen präzisieren, Evidenz einordnen und Optionen abwägen.',[
    {title:'Perspektive',de:'Aus meiner Sicht überwiegen die Vorteile.',en:'From my perspective, the advantages outweigh the drawbacks.'},
    {title:'Daten einordnen',de:'Die Daten deuten darauf hin, dass sich der Trend fortsetzt.',en:'The data suggests that the trend is continuing.'},
    {title:'Klarstellen',de:'Ich möchte einen Punkt klarstellen, bevor wir weitermachen.',en:'I’d like to clarify one point before we continue.'},
    {title:'Optionen abwägen',de:'Wir müssen die Vor- und Nachteile sorgfältig abwägen.',en:'We need to weigh the advantages and disadvantages carefully.'}
  ])],
  C1:[makeUnit('C1',13,'nuance','Nuance & Register','Subtile Unterschiede, Einschränkungen und Wirkung präzise ausdrücken.',[
    {title:'Besonders überzeugend',de:'Was ich besonders überzeugend finde, ist die praktische Wirkung.',en:'What I find particularly compelling is the practical impact.'},
    {title:'Feiner Unterschied',de:'Zwischen diesen beiden Positionen besteht ein feiner Unterschied.',en:'There is a subtle distinction between these two positions.'},
    {title:'Nicht implizieren',de:'Ich möchte damit nicht andeuten, dass die Alternative falsch ist.',en:'I don’t mean to imply that the alternative is wrong.'},
    {title:'Neue Entwicklungen',de:'Angesichts der jüngsten Entwicklungen sollten wir die Annahmen neu prüfen.',en:'In light of recent developments, we should reassess our assumptions.'}
  ])],
  C2:[makeUnit('C2',9,'mastery','Präzision auf C2-Niveau','Komplexe Argumente strukturieren und implizite Schwächen elegant benennen.',[
    {title:'Erster Eindruck',de:'Auf den ersten Blick wirkt der Vorschlag überzeugend, doch die Details erzählen eine andere Geschichte.',en:'At first glance, the proposal seems convincing, yet the details tell a different story.'},
    {title:'Kern des Arguments',de:'Das Argument hängt von einer Annahme ab, die noch nicht belegt wurde.',en:'The argument hinges on an assumption that has not yet been substantiated.'},
    {title:'Übersehener Aspekt',de:'Diese Interpretation übersieht einen entscheidenden Aspekt des Problems.',en:'This interpretation overlooks a crucial aspect of the problem.'},
    {title:'Einwand einordnen',de:'Wie dem auch sei, der Einwand verdient eine sorgfältige Prüfung.',en:'Be that as it may, the objection deserves careful consideration.'}
  ])]
};
