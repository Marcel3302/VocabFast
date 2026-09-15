import type { Lesson } from '../types';

type Blueprint = {
  unit:1|2;
  lesson:1|2|3|4;
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

const blueprints: Blueprint[] = [
  {unit:1,lesson:1,unitTitle:'Präzision & Stil',unitSubtitle:'Feinste Bedeutungsunterschiede, Haltung und stilistische Kontrolle.',title:'Behutsam einschränken',subtitle:'Aussagen präzise relativieren, ohne ihre Wirkung zu verlieren.',goal:'Eine starke Aussage akademisch und professionell absichern.',german:'Die Ergebnisse deuten zwar auf einen Zusammenhang hin, lassen jedoch keine eindeutige Kausalität erkennen.',english:'While the findings point to an association, they do not in themselves establish a clear causal relationship.',gapSentence:'The findings do not in themselves ___ a causal relationship.',gapChoices:['establish','establishing','established','to establish'],gapAnswer:'establish',listening:'The evidence is compelling, albeit insufficient to support such a far-reaching conclusion.',listeningMeaning:'Die Belege sind überzeugend, reichen aber für eine so weitreichende Schlussfolgerung nicht aus.',conceptId:'cefr.c2.hedging-precision'},
  {unit:1,lesson:2,unitTitle:'Präzision & Stil',unitSubtitle:'Feinste Bedeutungsunterschiede, Haltung und stilistische Kontrolle.',title:'Verdichten ohne Verlust',subtitle:'Komplexe Aussagen mit Nominalisierung und präzisen Verknüpfungen verdichten.',goal:'Eine komplexe Ursache-Wirkungs-Beziehung kompakt formulieren.',german:'Dass die Nachfrage unerwartet zurückging, führte dazu, dass die Einführung neu bewertet werden musste.',english:'The unexpected decline in demand necessitated a reassessment of the rollout.',gapSentence:'The decline in demand ___ a reassessment of the rollout.',gapChoices:['necessitated','necessitate','was necessitate','necessitating to'],gapAnswer:'necessitated',listening:'The gradual erosion of trust ultimately prompted a fundamental revision of the strategy.',listeningMeaning:'Der allmähliche Vertrauensverlust führte letztlich zu einer grundlegenden Überarbeitung der Strategie.',conceptId:'cefr.c2.nominalisation'},
  {unit:1,lesson:3,unitTitle:'Präzision & Stil',unitSubtitle:'Feinste Bedeutungsunterschiede, Haltung und stilistische Kontrolle.',title:'Fokus verschieben',subtitle:'Mit Inversion und Cleft-Strukturen gezielt rhetorische Schwerpunkte setzen.',goal:'Eine Aussage mit kontrollierter rhetorischer Betonung formulieren.',german:'Erst nachdem die vollständigen Daten vorlagen, wurde das Ausmaß des Problems deutlich.',english:'Only once the full data had become available did the scale of the problem become apparent.',gapSentence:'Only then ___ the scale of the problem become apparent.',gapChoices:['did','was','had','does'],gapAnswer:'did',listening:'What the discussion ultimately revealed was not a lack of options, but a lack of shared priorities.',listeningMeaning:'Die Diskussion zeigte letztlich nicht einen Mangel an Optionen, sondern an gemeinsamen Prioritäten.',conceptId:'cefr.c2.focus-inversion'},
  {unit:1,lesson:4,unitTitle:'Präzision & Stil',unitSubtitle:'Feinste Bedeutungsunterschiede, Haltung und stilistische Kontrolle.',title:'Treffsichere Kollokationen',subtitle:'Wortwahl so steuern, dass anspruchsvolle Aussagen idiomatisch und präzise wirken.',goal:'Eine professionelle Bewertung mit natürlicher Kollokation ausdrücken.',german:'Die vorgeschlagene Lösung birgt erhebliche Risiken, bietet aber auch einen überzeugenden strategischen Vorteil.',english:'The proposed solution carries substantial risks, but it also offers a compelling strategic advantage.',gapSentence:'The proposal ___ substantial risks.',gapChoices:['carries','takes','brings up','holds on'],gapAnswer:'carries',listening:'The decision warrants careful scrutiny rather than immediate rejection.',listeningMeaning:'Die Entscheidung verdient eine sorgfältige Prüfung statt einer sofortigen Ablehnung.',conceptId:'cefr.c2.collocation-control'},
  {unit:2,lesson:1,unitTitle:'Synthese & Wirkung',unitSubtitle:'Implizite Bedeutung, Quellen, Register und strategische Kommunikation souverän steuern.',title:'Konzession mit Gewicht',subtitle:'Gegenpositionen fair einbauen und trotzdem eine klare Schlussfolgerung halten.',goal:'Eine differenzierte Konzession mit klarer eigener Position formulieren.',german:'So berechtigt die Bedenken auch sein mögen, sie ändern nichts an der Notwendigkeit einer langfristigen Lösung.',english:'Valid though the concerns may be, they do not diminish the need for a long-term solution.',gapSentence:'Valid ___ the concerns may be, they do not change the conclusion.',gapChoices:['though','because','unless','therefore'],gapAnswer:'though',listening:'Much as I understand the reluctance to proceed, postponement would create risks of its own.',listeningMeaning:'So sehr ich die Zurückhaltung verstehe, würde eine Verschiebung eigene Risiken schaffen.',conceptId:'cefr.c2.concession'},
  {unit:2,lesson:2,unitTitle:'Synthese & Wirkung',unitSubtitle:'Implizite Bedeutung, Quellen, Register und strategische Kommunikation souverän steuern.',title:'Implizite Haltung lesen',subtitle:'Subtile Distanz, Skepsis und Zustimmung aus Formulierungen ableiten.',goal:'Eine implizite Haltung aus Ton und Wortwahl präzise erschließen.',german:'Seine Formulierung lässt erkennen, dass er den Vorschlag eher duldet als tatsächlich unterstützt.',english:'His wording implies that he is tolerating the proposal rather than genuinely endorsing it.',gapSentence:'His wording implies that he is merely ___ the proposal.',gapChoices:['tolerating','celebrating','discarding','inventing'],gapAnswer:'tolerating',listening:'Her carefully qualified response stopped well short of an unreserved endorsement.',listeningMeaning:'Ihre sorgfältig eingeschränkte Antwort blieb deutlich hinter einer vorbehaltlosen Zustimmung zurück.',conceptId:'cefr.c2.inference-stance'},
  {unit:2,lesson:3,unitTitle:'Synthese & Wirkung',unitSubtitle:'Implizite Bedeutung, Quellen, Register und strategische Kommunikation souverän steuern.',title:'Quellen wirklich synthetisieren',subtitle:'Mehrere Perspektiven zu einer neuen, begründeten Schlussfolgerung verbinden.',goal:'Unterschiedliche Quellen nicht nur zusammenfassen, sondern synthetisieren.',german:'Zusammengenommen legen die Studien nahe, dass nicht ein einzelner Faktor, sondern deren Wechselwirkung entscheidend ist.',english:'Taken together, the studies suggest that it is the interaction between the factors, rather than any single factor, that is decisive.',gapSentence:'Taken ___, the studies point to an interaction effect.',gapChoices:['together','apart','aside','over'],gapAnswer:'together',listening:'Viewed in combination, the findings challenge the assumption that the variables operate independently.',listeningMeaning:'In Kombination betrachtet stellen die Ergebnisse die Annahme infrage, dass die Variablen unabhängig wirken.',conceptId:'cefr.c2.synthesis'},
  {unit:2,lesson:4,unitTitle:'Synthese & Wirkung',unitSubtitle:'Implizite Bedeutung, Quellen, Register und strategische Kommunikation souverän steuern.',title:'Register wechseln',subtitle:'Dieselbe Botschaft je nach Publikum präzise, diplomatisch oder knapp formulieren.',goal:'Eine heikle Empfehlung auf Executive-Niveau präzise formulieren.',german:'Wir sollten die Einführung nicht fortsetzen, solange die zentralen Annahmen nicht erneut geprüft wurden.',english:'Proceeding with the rollout would be premature until the underlying assumptions have been reassessed.',gapSentence:'Proceeding at this stage would be ___.',gapChoices:['premature','prematurely to','prematurity','prematured'],gapAnswer:'premature',listening:'A measured delay would be preferable to committing the organisation to a course of action that may prove difficult to reverse.',listeningMeaning:'Eine kontrollierte Verzögerung wäre besser, als die Organisation auf einen schwer umkehrbaren Kurs festzulegen.',conceptId:'cefr.c2.register-control'}
];

function tokens(value:string){return value.replace(/([,.!?;:])/g,' $1 ').replace(/\s+/g,' ').trim().split(' ')}
function scramble(value:string){const list=tokens(value);const cut=Math.max(2,Math.floor(list.length/2));return [...list.slice(cut),...list.slice(0,cut)]}
function peers(bp:Blueprint){return blueprints.filter(item=>item.unit===bp.unit&&item!==bp)}

function makeLesson(bp:Blueprint): Lesson {
  const id=`en-c2-u${bp.unit}-l${bp.lesson}`;
  const conceptIds=[bp.conceptId];
  const alternatives=peers(bp).slice(0,3);
  const sentenceChoices=[bp.english,...alternatives.map(item=>item.english)];
  const meaningChoices=[bp.listeningMeaning,...alternatives.map(item=>item.listeningMeaning)];
  return {id,courseId:'de-en',level:'C2',unitId:`en-c2-u${bp.unit}`,title:bp.title,subtitle:bp.subtitle,estimatedMinutes:11,newConcepts:conceptIds,exercises:[
    {id:`${id}-e1`,type:'multiple-choice',instruction:'Wähle die präziseste englische Formulierung.',prompt:bp.german,choices:sentenceChoices,answer:bp.english,conceptIds,difficulty:5,xp:16,explanation:`C2-Fokus: ${bp.goal}`},
    {id:`${id}-e2`,type:'translation',instruction:'Übertrage die Aussage idiomatisch und registergerecht.',prompt:bp.goal,sourceText:bp.german,acceptedAnswers:[bp.english],conceptIds,difficulty:5,xp:19},
    {id:`${id}-e3`,type:'sentence-build',instruction:'Rekonstruiere die vollständige C2-Formulierung.',prompt:bp.german,tokens:scramble(bp.english),answer:bp.english,conceptIds,difficulty:5,xp:18},
    {id:`${id}-e4`,type:'fill-gap',instruction:'Ergänze die stilistisch präziseste Form.',prompt:bp.goal,sentence:bp.gapSentence,choices:bp.gapChoices,answer:bp.gapAnswer,conceptIds,difficulty:5,xp:17},
    {id:`${id}-e5`,type:'listening',instruction:'Höre auf Nuance und Haltung.',prompt:'Wähle die passendste Bedeutung.',speech:bp.listening,choices:meaningChoices,answer:bp.listeningMeaning,conceptIds,difficulty:5,xp:19},
    {id:`${id}-e6`,type:'dictation',instruction:'Schreibe die anspruchsvolle Aussage exakt mit.',prompt:'Achte auf Kollokationen und Funktionswörter.',speech:bp.listening,acceptedAnswers:[bp.listening],conceptIds,difficulty:5,xp:20},
    {id:`${id}-e7`,type:'speaking',instruction:'Sprich die Zielaussage mit natürlicher Satzmelodie.',prompt:bp.goal,speech:bp.english,acceptedAnswers:[bp.english],conceptIds,difficulty:5,xp:20},
    {id:`${id}-e8`,type:'multiple-choice',instruction:'Welche Formulierung erfüllt das kommunikative Ziel am besten?',prompt:bp.goal,choices:sentenceChoices,answer:bp.english,conceptIds,difficulty:5,xp:18}
  ]};
}

const lessons=blueprints.map(makeLesson);

export const englishC2Units = ([1,2] as const).map(unit=>{
  const first=blueprints.find(item=>item.unit===unit)!;
  return {id:`en-c2-u${unit}`,number:unit,title:first.unitTitle,subtitle:first.unitSubtitle,lessons:lessons.filter(lesson=>lesson.unitId===`en-c2-u${unit}`)};
});
