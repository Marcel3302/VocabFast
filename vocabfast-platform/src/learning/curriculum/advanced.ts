import type { Lesson } from '../types';

export type AdvancedConceptMeta = {
  id: string;
  label: string;
  translation?: string;
  category: 'Wortschatz' | 'Grammatik' | 'Kommunikation';
};

type Level = 'A2' | 'B1' | 'B2' | 'C1';

type Blueprint = {
  level: Level;
  unit: 1 | 2;
  lesson: 1 | 2 | 3 | 4;
  unitTitle: string;
  unitSubtitle: string;
  title: string;
  subtitle: string;
  goal: string;
  german: string;
  english: string;
  gapSentence: string;
  gapChoices: string[];
  gapAnswer: string;
  listening: string;
  listeningMeaning: string;
  concept: AdvancedConceptMeta;
};

const blueprints: Blueprint[] = [
  {
    level:'A2', unit:1, lesson:1,
    unitTitle:'Selbstständig im Alltag', unitSubtitle:'Pläne, Vergangenes, Gesundheit und Verabredungen sicher ausdrücken.',
    title:'Pläne fürs Wochenende', subtitle:'Über feste Pläne sprechen und Verabredungen beschreiben.',
    goal:'Über einen konkreten Plan am Wochenende sprechen.',
    german:'Am Samstag treffe ich Freunde und wir gehen ins Kino.',
    english:'On Saturday, I am meeting friends and we are going to the cinema.',
    gapSentence:'I am ___ friends on Saturday.', gapChoices:['meeting','met','meet','have met'], gapAnswer:'meeting',
    listening:'We are going to visit my sister on Sunday.', listeningMeaning:'Wir werden am Sonntag meine Schwester besuchen.',
    concept:{id:'cefr.a2.weekend-plans',label:'present arrangements',translation:'feste Pläne ausdrücken',category:'Grammatik'}
  },
  {
    level:'A2', unit:1, lesson:2,
    unitTitle:'Selbstständig im Alltag', unitSubtitle:'Pläne, Vergangenes, Gesundheit und Verabredungen sicher ausdrücken.',
    title:'Mein letztes Wochenende', subtitle:'Vergangene Ereignisse in einer klaren Reihenfolge erzählen.',
    goal:'Eine einfache Erfahrung aus der Vergangenheit erzählen.',
    german:'Letztes Wochenende habe ich meine Großeltern besucht.',
    english:'I visited my grandparents last weekend.',
    gapSentence:'We ___ a great time yesterday.', gapChoices:['had','have','has','having'], gapAnswer:'had',
    listening:'We cooked dinner and watched a film.', listeningMeaning:'Wir kochten Abendessen und sahen einen Film.',
    concept:{id:'cefr.a2.past-events',label:'past simple stories',translation:'einfache Ereignisse in der Vergangenheit',category:'Grammatik'}
  },
  {
    level:'A2', unit:1, lesson:3,
    unitTitle:'Selbstständig im Alltag', unitSubtitle:'Pläne, Vergangenes, Gesundheit und Verabredungen sicher ausdrücken.',
    title:'Gesundheit & Rat', subtitle:'Beschwerden beschreiben und einfache Ratschläge geben.',
    goal:'Einen einfachen gesundheitlichen Rat geben.',
    german:'Du solltest mehr Wasser trinken und dich ausruhen.',
    english:'You should drink more water and get some rest.',
    gapSentence:'You ___ see a doctor if the pain gets worse.', gapChoices:['should','should to','are','had'], gapAnswer:'should',
    listening:'I have a headache and I feel tired.', listeningMeaning:'Ich habe Kopfschmerzen und fühle mich müde.',
    concept:{id:'cefr.a2.health-advice',label:'should for advice',translation:'Ratschläge geben',category:'Kommunikation'}
  },
  {
    level:'A2', unit:1, lesson:4,
    unitTitle:'Selbstständig im Alltag', unitSubtitle:'Pläne, Vergangenes, Gesundheit und Verabredungen sicher ausdrücken.',
    title:'Etwas vereinbaren', subtitle:'Termine vorschlagen, höflich reagieren und Alternativen finden.',
    goal:'Höflich einen Termin vorschlagen.',
    german:'Könnten wir uns morgen um halb sieben treffen?',
    english:'Could we meet tomorrow at half past six?',
    gapSentence:'Would six o’clock ___ for you?', gapChoices:['work','works','worked','working'], gapAnswer:'work',
    listening:'I am free after work, but seven would be better.', listeningMeaning:'Ich habe nach der Arbeit Zeit, aber sieben wäre besser.',
    concept:{id:'cefr.a2.arrangements',label:'polite arrangements',translation:'Verabredungen höflich vereinbaren',category:'Kommunikation'}
  },
  {
    level:'A2', unit:2, lesson:1,
    unitTitle:'Reisen & Services', unitSubtitle:'Probleme lösen, nachfragen und Dienstleistungen selbstständig nutzen.',
    title:'Problem im Hotel', subtitle:'Ein Problem sachlich erklären und um Hilfe bitten.',
    goal:'Ein Problem im Hotel verständlich melden.',
    german:'In meinem Zimmer funktioniert die Klimaanlage nicht.',
    english:'The air conditioning in my room is not working.',
    gapSentence:'Could you ___ someone to check it?', gapChoices:['send','sent','sending','sends'], gapAnswer:'send',
    listening:'The shower is not working properly either.', listeningMeaning:'Die Dusche funktioniert ebenfalls nicht richtig.',
    concept:{id:'cefr.a2.hotel-problem',label:'service problems',translation:'Probleme bei Dienstleistungen melden',category:'Kommunikation'}
  },
  {
    level:'A2', unit:2, lesson:2,
    unitTitle:'Reisen & Services', unitSubtitle:'Probleme lösen, nachfragen und Dienstleistungen selbstständig nutzen.',
    title:'Wenn der Zug ausfällt', subtitle:'Bedingungen und Alternativen bei Reiseproblemen ausdrücken.',
    goal:'Eine einfache Bedingung mit einer Folge formulieren.',
    german:'Wenn der Zug verspätet ist, nehme ich den nächsten Bus.',
    english:'If the train is delayed, I will take the next bus.',
    gapSentence:'If the train is late, I ___ take the bus.', gapChoices:['will','would','am','have'], gapAnswer:'will',
    listening:'The next train leaves from platform six in twenty minutes.', listeningMeaning:'Der nächste Zug fährt in zwanzig Minuten von Gleis sechs ab.',
    concept:{id:'cefr.a2.first-conditional',label:'first conditional',translation:'reale Bedingungen und Folgen',category:'Grammatik'}
  },
  {
    level:'A2', unit:2, lesson:3,
    unitTitle:'Reisen & Services', unitSubtitle:'Probleme lösen, nachfragen und Dienstleistungen selbstständig nutzen.',
    title:'Umtausch & Rückgabe', subtitle:'Waren zurückgeben, Gründe nennen und nach einer Lösung fragen.',
    goal:'Einen Artikel höflich zurückgeben.',
    german:'Ich möchte diese Jacke zurückgeben, weil sie zu klein ist.',
    english:'I would like to return this jacket because it is too small.',
    gapSentence:'Do you still have the ___?', gapChoices:['receipt','recipe','reservation','result'], gapAnswer:'receipt',
    listening:'We can exchange it or give you a refund.', listeningMeaning:'Wir können sie umtauschen oder Ihnen das Geld zurückerstatten.',
    concept:{id:'cefr.a2.returns',label:'returns and refunds',translation:'Rückgabe und Erstattung',category:'Wortschatz'}
  },
  {
    level:'A2', unit:2, lesson:4,
    unitTitle:'Reisen & Services', unitSubtitle:'Probleme lösen, nachfragen und Dienstleistungen selbstständig nutzen.',
    title:'Erfahrungen', subtitle:'Über Erlebnisse sprechen, ohne einen genauen Zeitpunkt zu nennen.',
    goal:'Über eine bisherige Erfahrung sprechen.',
    german:'Ich war schon zweimal in London.',
    english:'I have been to London twice.',
    gapSentence:'Have you ever ___ sushi?', gapChoices:['tried','try','trying','tries'], gapAnswer:'tried',
    listening:'I have never travelled outside Europe.', listeningMeaning:'Ich bin noch nie außerhalb Europas gereist.',
    concept:{id:'cefr.a2.present-perfect',label:'present perfect experiences',translation:'Erfahrungen bis heute',category:'Grammatik'}
  },

  {
    level:'B1', unit:1, lesson:1,
    unitTitle:'Sicher argumentieren', unitSubtitle:'Meinungen begründen, Erfahrungen einordnen und Probleme strukturiert erklären.',
    title:'Eine Meinung begründen', subtitle:'Argumente verbinden und Gegenpunkte berücksichtigen.',
    goal:'Eine Meinung mit einem Gegenargument verbinden.',
    german:'Obwohl die Idee teuer ist, halte ich sie langfristig für sinnvoll.',
    english:'Although the idea is expensive, I think it makes sense in the long term.',
    gapSentence:'___ the idea is expensive, it could save time later.', gapChoices:['Although','Because','Unless','During'], gapAnswer:'Although',
    listening:'I agree with the goal, but I am not sure about the timing.', listeningMeaning:'Ich stimme dem Ziel zu, bin mir aber beim Zeitpunkt nicht sicher.',
    concept:{id:'cefr.b1.contrast',label:'although / however',translation:'Argumente kontrastieren',category:'Grammatik'}
  },
  {
    level:'B1', unit:1, lesson:2,
    unitTitle:'Sicher argumentieren', unitSubtitle:'Meinungen begründen, Erfahrungen einordnen und Probleme strukturiert erklären.',
    title:'Projektfortschritt', subtitle:'Aktuelle Ergebnisse und abgeschlossene Ereignisse zeitlich sauber trennen.',
    goal:'Projektfortschritt mit passenden Zeitformen beschreiben.',
    german:'Wir haben das Projekt diese Woche abgeschlossen, aber gestern noch einen Fehler gefunden.',
    english:'We have finished the project this week, but we found another issue yesterday.',
    gapSentence:'We ___ another issue yesterday.', gapChoices:['found','have found','find','finding'], gapAnswer:'found',
    listening:'The team has completed most of the work, but two tasks are still open.', listeningMeaning:'Das Team hat den Großteil der Arbeit abgeschlossen, aber zwei Aufgaben sind noch offen.',
    concept:{id:'cefr.b1.time-reference',label:'present perfect vs past simple',translation:'Ergebnis und Zeitpunkt unterscheiden',category:'Grammatik'}
  },
  {
    level:'B1', unit:1, lesson:3,
    unitTitle:'Sicher argumentieren', unitSubtitle:'Meinungen begründen, Erfahrungen einordnen und Probleme strukturiert erklären.',
    title:'Reise mit Hindernissen', subtitle:'Mehrere vergangene Ereignisse logisch miteinander verbinden.',
    goal:'Eine Vorgeschichte und ein späteres Ereignis unterscheiden.',
    german:'Als wir am Flughafen ankamen, war unser Flug bereits gestrichen worden.',
    english:'When we arrived at the airport, our flight had already been cancelled.',
    gapSentence:'By the time we arrived, the flight had already ___ cancelled.', gapChoices:['been','be','being','was'], gapAnswer:'been',
    listening:'We had checked in online before the airline cancelled the flight.', listeningMeaning:'Wir hatten online eingecheckt, bevor die Fluggesellschaft den Flug strich.',
    concept:{id:'cefr.b1.past-sequence',label:'past sequence',translation:'Vorvergangenheit und Erzählreihenfolge',category:'Grammatik'}
  },
  {
    level:'B1', unit:1, lesson:4,
    unitTitle:'Sicher argumentieren', unitSubtitle:'Meinungen begründen, Erfahrungen einordnen und Probleme strukturiert erklären.',
    title:'Was würdest du tun?', subtitle:'Hypothetische Ratschläge und Möglichkeiten ausdrücken.',
    goal:'Einen hypothetischen Rat geben.',
    german:'Wenn ich du wäre, würde ich zuerst mit deinem Chef sprechen.',
    english:'If I were you, I would talk to your manager first.',
    gapSentence:'If I ___ you, I would ask for more information.', gapChoices:['were','am','was being','have been'], gapAnswer:'were',
    listening:'I would wait until tomorrow before making a final decision.', listeningMeaning:'Ich würde bis morgen warten, bevor ich eine endgültige Entscheidung treffe.',
    concept:{id:'cefr.b1.second-conditional',label:'second conditional advice',translation:'hypothetische Ratschläge',category:'Grammatik'}
  },
  {
    level:'B1', unit:2, lesson:1,
    unitTitle:'Zusammenhängend sprechen', unitSubtitle:'Berichten, Ziele erklären, Lösungen abwägen und Präsentationen strukturieren.',
    title:'Was jemand gesagt hat', subtitle:'Aussagen anderer sinngemäß wiedergeben.',
    goal:'Eine Aussage in indirekter Rede wiedergeben.',
    german:'Sie sagte, dass das Meeting auf Freitag verschoben worden sei.',
    english:'She said that the meeting had been moved to Friday.',
    gapSentence:'She said the meeting had been ___ to Friday.', gapChoices:['moved','move','moving','moves'], gapAnswer:'moved',
    listening:'He told me that the client needed more time.', listeningMeaning:'Er sagte mir, dass der Kunde mehr Zeit brauche.',
    concept:{id:'cefr.b1.reported-speech',label:'reported speech',translation:'Aussagen indirekt wiedergeben',category:'Grammatik'}
  },
  {
    level:'B1', unit:2, lesson:2,
    unitTitle:'Zusammenhängend sprechen', unitSubtitle:'Berichten, Ziele erklären, Lösungen abwägen und Präsentationen strukturieren.',
    title:'Ziele & Entwicklung', subtitle:'Persönliche Ziele und gewünschte Fortschritte präziser beschreiben.',
    goal:'Ein mittelfristiges Lernziel formulieren.',
    german:'Bis Ende des Jahres möchte ich flüssiger sprechen können.',
    english:'By the end of the year, I want to be able to speak more fluently.',
    gapSentence:'I want to be able to speak more ___ by December.', gapChoices:['fluently','fluent','fluency','flow'], gapAnswer:'fluently',
    listening:'My main goal is to feel more confident during meetings.', listeningMeaning:'Mein wichtigstes Ziel ist, mich in Besprechungen sicherer zu fühlen.',
    concept:{id:'cefr.b1.goals',label:'goals and ability',translation:'Ziele und Fähigkeiten ausdrücken',category:'Kommunikation'}
  },
  {
    level:'B1', unit:2, lesson:3,
    unitTitle:'Zusammenhängend sprechen', unitSubtitle:'Berichten, Ziele erklären, Lösungen abwägen und Präsentationen strukturieren.',
    title:'Lösungen abwägen', subtitle:'Hypothetische Folgen vergleichen und Vorschläge diskutieren.',
    goal:'Eine hypothetische Lösung mit ihrer Folge ausdrücken.',
    german:'Wenn wir früher anfangen würden, hätten wir genug Zeit.',
    english:'If we started earlier, we would have enough time.',
    gapSentence:'If we started now, we ___ finish before six.', gapChoices:['would','will','are','have'], gapAnswer:'would',
    listening:'If we reduced the scope, the team could finish on time.', listeningMeaning:'Wenn wir den Umfang reduzieren würden, könnte das Team rechtzeitig fertig werden.',
    concept:{id:'cefr.b1.problem-solving',label:'hypothetical solutions',translation:'Lösungen und Folgen abwägen',category:'Kommunikation'}
  },
  {
    level:'B1', unit:2, lesson:4,
    unitTitle:'Zusammenhängend sprechen', unitSubtitle:'Berichten, Ziele erklären, Lösungen abwägen und Präsentationen strukturieren.',
    title:'Eine Präsentation führen', subtitle:'Gedanken mit klaren Übergängen strukturieren.',
    goal:'Einen Präsentationsabschnitt ankündigen.',
    german:'Zunächst möchte ich das Problem erklären, bevor ich auf die Lösung eingehe.',
    english:'First, I would like to explain the problem before I move on to the solution.',
    gapSentence:'Now I would like to move ___ to the next point.', gapChoices:['on','at','for','by'], gapAnswer:'on',
    listening:'Let me briefly summarise the three main points before we continue.', listeningMeaning:'Lassen Sie mich die drei wichtigsten Punkte kurz zusammenfassen, bevor wir fortfahren.',
    concept:{id:'cefr.b1.signposting',label:'presentation signposting',translation:'Präsentationen strukturieren',category:'Kommunikation'}
  },

  {
    level:'B2', unit:1, lesson:1,
    unitTitle:'Präzise im Beruf', unitSubtitle:'Verhandeln, Beschwerden lösen und komplexe Bedingungen professionell formulieren.',
    title:'Verhandeln ohne Härte', subtitle:'Zustimmen, relativieren und Bedingungen professionell formulieren.',
    goal:'Einen Standpunkt anerkennen und zugleich eine Bedingung nennen.',
    german:'Ich verstehe Ihren Standpunkt, aber wir müssten den Zeitplan anpassen.',
    english:'I understand your point, but we would need to adjust the timeline.',
    gapSentence:'We would need to ___ the timeline before agreeing.', gapChoices:['adjust','adjusting','adjusted','adjusts'], gapAnswer:'adjust',
    listening:'That could work, provided that the final deadline remains unchanged.', listeningMeaning:'Das könnte funktionieren, vorausgesetzt, die endgültige Frist bleibt unverändert.',
    concept:{id:'cefr.b2.negotiation',label:'negotiation language',translation:'professionell verhandeln und relativieren',category:'Kommunikation'}
  },
  {
    level:'B2', unit:1, lesson:2,
    unitTitle:'Präzise im Beruf', unitSubtitle:'Verhandeln, Beschwerden lösen und komplexe Bedingungen professionell formulieren.',
    title:'Ein Argument entwickeln', subtitle:'Vorteile präzise benennen und logisch weiterführen.',
    goal:'Einen zentralen Vorteil prägnant begründen.',
    german:'Ein wesentlicher Vorteil besteht darin, dass die Lösung langfristig Kosten senkt.',
    english:'A key advantage is that the solution reduces costs in the long term.',
    gapSentence:'A key advantage ___ that the process is easier to maintain.', gapChoices:['is','are','be','being'], gapAnswer:'is',
    listening:'The main drawback is the initial investment required to implement the system.', listeningMeaning:'Der Hauptnachteil ist die anfängliche Investition, die für die Einführung des Systems erforderlich ist.',
    concept:{id:'cefr.b2.argumentation',label:'structured argumentation',translation:'Vor- und Nachteile präzise entwickeln',category:'Kommunikation'}
  },
  {
    level:'B2', unit:1, lesson:3,
    unitTitle:'Präzise im Beruf', unitSubtitle:'Verhandeln, Beschwerden lösen und komplexe Bedingungen professionell formulieren.',
    title:'Komplexe Reisebeschwerde', subtitle:'Ursache, Folge und konkrete Forderung klar miteinander verbinden.',
    goal:'Eine formelle Beschwerde mit Begründung formulieren.',
    german:'Da mein Anschlussflug wegen der Verspätung verpasst wurde, benötige ich eine alternative Verbindung.',
    english:'Since I missed my connecting flight because of the delay, I need an alternative connection.',
    gapSentence:'I missed my connection ___ the first flight was delayed.', gapChoices:['because','despite','unless','whereas'], gapAnswer:'because',
    listening:'I would also like written confirmation of the new itinerary.', listeningMeaning:'Ich hätte außerdem gerne eine schriftliche Bestätigung der neuen Reiseroute.',
    concept:{id:'cefr.b2.formal-complaint',label:'formal complaints',translation:'Ursache, Folge und Forderung verbinden',category:'Kommunikation'}
  },
  {
    level:'B2', unit:1, lesson:4,
    unitTitle:'Präzise im Beruf', unitSubtitle:'Verhandeln, Beschwerden lösen und komplexe Bedingungen professionell formulieren.',
    title:'Was wäre anders gewesen?', subtitle:'Irreale Bedingungen in der Vergangenheit präzise ausdrücken.',
    goal:'Eine nicht eingetretene Vergangenheitssituation bewerten.',
    german:'Hätten wir die Daten früher erhalten, hätten wir anders entschieden.',
    english:'If we had received the data earlier, we would have made a different decision.',
    gapSentence:'If we had known earlier, we would have ___ differently.', gapChoices:['acted','act','acting','acts'], gapAnswer:'acted',
    listening:'We might have avoided the delay if the warning had reached us sooner.', listeningMeaning:'Wir hätten die Verzögerung vielleicht vermieden, wenn uns die Warnung früher erreicht hätte.',
    concept:{id:'cefr.b2.third-conditional',label:'third conditional',translation:'irreale Vergangenheit und Folgen',category:'Grammatik'}
  },
  {
    level:'B2', unit:2, lesson:1,
    unitTitle:'Analyse & Ausdruck', unitSubtitle:'Texte zusammenfassen, Daten beschreiben, Register steuern und Gegenargumente einordnen.',
    title:'Einen Text zusammenfassen', subtitle:'Kernaussagen neutral und kompakt wiedergeben.',
    goal:'Die Hauptaussage eines Artikels neutral zusammenfassen.',
    german:'Der Artikel argumentiert, dass flexible Arbeit die Produktivität steigern kann, wenn Teams klare Ziele haben.',
    english:'The article argues that flexible work can improve productivity when teams have clear goals.',
    gapSentence:'The article ___ that clear goals are essential.', gapChoices:['argues','argue','argued to','is argue'], gapAnswer:'argues',
    listening:'The author also points out that flexibility requires stronger communication.', listeningMeaning:'Der Autor weist außerdem darauf hin, dass Flexibilität eine stärkere Kommunikation erfordert.',
    concept:{id:'cefr.b2.summary',label:'neutral summaries',translation:'Kernaussagen neutral zusammenfassen',category:'Kommunikation'}
  },
  {
    level:'B2', unit:2, lesson:2,
    unitTitle:'Analyse & Ausdruck', unitSubtitle:'Texte zusammenfassen, Daten beschreiben, Register steuern und Gegenargumente einordnen.',
    title:'Trends beschreiben', subtitle:'Entwicklungen präzise und sachlich erläutern.',
    goal:'Eine Entwicklung mit passendem Trendvokabular beschreiben.',
    german:'Die Nachfrage stieg zunächst stark an und stabilisierte sich anschließend.',
    english:'Demand rose sharply at first and then levelled off.',
    gapSentence:'After a sharp increase, demand levelled ___.', gapChoices:['off','up','through','away'], gapAnswer:'off',
    listening:'Sales remained stable for two months before falling slightly in June.', listeningMeaning:'Die Verkäufe blieben zwei Monate stabil, bevor sie im Juni leicht fielen.',
    concept:{id:'cefr.b2.trends',label:'describing trends',translation:'Daten und Entwicklungen beschreiben',category:'Wortschatz'}
  },
  {
    level:'B2', unit:2, lesson:3,
    unitTitle:'Analyse & Ausdruck', unitSubtitle:'Texte zusammenfassen, Daten beschreiben, Register steuern und Gegenargumente einordnen.',
    title:'Professionelle E-Mails', subtitle:'Höflichkeit, Distanz und klare Erwartungen kombinieren.',
    goal:'Eine höfliche formelle Bitte formulieren.',
    german:'Ich wäre Ihnen dankbar, wenn Sie die Unterlagen bis Freitag bestätigen könnten.',
    english:'I would appreciate it if you could confirm the documents by Friday.',
    gapSentence:'I would appreciate it if you ___ confirm the details.', gapChoices:['could','can to','will to','must to'], gapAnswer:'could',
    listening:'Please let me know if you require any further information from our side.', listeningMeaning:'Bitte lassen Sie mich wissen, falls Sie weitere Informationen von unserer Seite benötigen.',
    concept:{id:'cefr.b2.register',label:'formal email register',translation:'höflicher professioneller Stil',category:'Kommunikation'}
  },
  {
    level:'B2', unit:2, lesson:4,
    unitTitle:'Analyse & Ausdruck', unitSubtitle:'Texte zusammenfassen, Daten beschreiben, Register steuern und Gegenargumente einordnen.',
    title:'Gegenargumente prüfen', subtitle:'Überzeugende Aussagen kritisch einordnen und Grenzen benennen.',
    goal:'Ein Argument anerkennen und seine Grenze benennen.',
    german:'Auch wenn das Argument überzeugend klingt, berücksichtigt es nicht die langfristigen Folgen.',
    english:'Although the argument sounds convincing, it does not take the long-term consequences into account.',
    gapSentence:'The proposal fails to take future costs into ___.', gapChoices:['account','order','place','viewing'], gapAnswer:'account',
    listening:'The evidence is useful, but it does not fully support the conclusion being drawn.', listeningMeaning:'Die Belege sind nützlich, stützen die gezogene Schlussfolgerung aber nicht vollständig.',
    concept:{id:'cefr.b2.counterargument',label:'critical counterarguments',translation:'Argumente differenziert einordnen',category:'Kommunikation'}
  },

  {
    level:'C1', unit:1, lesson:1,
    unitTitle:'Professionell mit Nuance', unitSubtitle:'Diplomatisch widersprechen, Risiken bewerten und in anspruchsvollen Situationen präzise führen.',
    title:'Diplomatisch widersprechen', subtitle:'Widerspruch klar äußern, ohne unnötig konfrontativ zu wirken.',
    goal:'Einen Vorschlag anerkennen und dennoch fundiert widersprechen.',
    german:'Ich sehe den Vorteil Ihres Vorschlags, bin aber nicht überzeugt, dass er unser eigentliches Problem löst.',
    english:'I can see the merit of your proposal, but I am not convinced that it addresses the underlying issue.',
    gapSentence:'I can see the ___ of the proposal, but I still have concerns.', gapChoices:['merit','mercy','measure','matter'], gapAnswer:'merit',
    listening:'I appreciate the reasoning behind the idea; however, the evidence does not yet justify the risk.', listeningMeaning:'Ich verstehe die Überlegung hinter der Idee; die Belege rechtfertigen das Risiko jedoch noch nicht.',
    concept:{id:'cefr.c1.diplomatic-disagreement',label:'diplomatic disagreement',translation:'differenziert und professionell widersprechen',category:'Kommunikation'}
  },
  {
    level:'C1', unit:1, lesson:2,
    unitTitle:'Professionell mit Nuance', unitSubtitle:'Diplomatisch widersprechen, Risiken bewerten und in anspruchsvollen Situationen präzise führen.',
    title:'Risiken & Strategie', subtitle:'Formelle Bedingungen und strategische Konsequenzen prägnant formulieren.',
    goal:'Eine formelle Bedingung mit strategischer Konsequenz ausdrücken.',
    german:'Sollte die Nachfrage weiter sinken, müssten wir unsere Annahmen grundlegend überdenken.',
    english:'Should demand continue to fall, we would need to reconsider our assumptions fundamentally.',
    gapSentence:'Should demand continue to fall, we would need to ___ our assumptions.', gapChoices:['reconsider','reconsidering','reconsidered','reconsiders'], gapAnswer:'reconsider',
    listening:'Were the market to change significantly, our current model might no longer be sustainable.', listeningMeaning:'Sollte sich der Markt erheblich verändern, wäre unser derzeitiges Modell möglicherweise nicht mehr tragfähig.',
    concept:{id:'cefr.c1.inversion-conditionals',label:'formal conditional inversion',translation:'formelle Bedingungen ohne if',category:'Grammatik'}
  },
  {
    level:'C1', unit:1, lesson:3,
    unitTitle:'Professionell mit Nuance', unitSubtitle:'Diplomatisch widersprechen, Risiken bewerten und in anspruchsvollen Situationen präzise führen.',
    title:'Überzeugend präsentieren', subtitle:'Komplexe Prioritäten prägnant auf einen strategischen Kern reduzieren.',
    goal:'Eine strategische Kernaussage wirkungsvoll formulieren.',
    german:'Entscheidend ist nicht nur die kurzfristige Einsparung, sondern der strategische Nutzen über mehrere Jahre.',
    english:'What matters is not only the short-term saving, but the strategic value over several years.',
    gapSentence:'What ___ is the long-term value, not just the immediate saving.', gapChoices:['matters','matter','mattering','is matter'], gapAnswer:'matters',
    listening:'The real question is whether the proposal strengthens our position over the next three years.', listeningMeaning:'Die eigentliche Frage ist, ob der Vorschlag unsere Position in den nächsten drei Jahren stärkt.',
    concept:{id:'cefr.c1.emphasis',label:'advanced emphasis',translation:'Kernaussagen rhetorisch hervorheben',category:'Kommunikation'}
  },
  {
    level:'C1', unit:1, lesson:4,
    unitTitle:'Professionell mit Nuance', unitSubtitle:'Diplomatisch widersprechen, Risiken bewerten und in anspruchsvollen Situationen präzise führen.',
    title:'Krisenkommunikation', subtitle:'Unsicherheit transparent machen und gleichzeitig handlungsfähig kommunizieren.',
    goal:'In einer unsicheren Lage präzise und verantwortungsvoll informieren.',
    german:'Zum jetzigen Zeitpunkt können wir die Ursache noch nicht abschließend bestätigen, aber wir haben die betroffenen Systeme isoliert.',
    english:'At this stage, we cannot confirm the root cause conclusively, but we have isolated the affected systems.',
    gapSentence:'We cannot confirm the root cause ___ at this stage.', gapChoices:['conclusively','conclusion','conclude','conclusive to'], gapAnswer:'conclusively',
    listening:'Our priority is to contain the impact while the investigation remains ongoing.', listeningMeaning:'Unsere Priorität ist, die Auswirkungen zu begrenzen, während die Untersuchung weiterläuft.',
    concept:{id:'cefr.c1.crisis-communication',label:'crisis communication',translation:'präzise bei Unsicherheit kommunizieren',category:'Kommunikation'}
  },
  {
    level:'C1', unit:2, lesson:1,
    unitTitle:'Register & Synthese', unitSubtitle:'Idiome einordnen, Quellen verbinden, Schlussfolgerungen ableiten und Executive Summaries formulieren.',
    title:'Nuancen & Idiome', subtitle:'Idiomatiken im professionellen Kontext richtig einordnen.',
    goal:'Eine idiomatische Bewertung natürlich und präzise verwenden.',
    german:'Sein Vorschlag klingt auf dem Papier gut, dürfte in der Praxis aber schwer umzusetzen sein.',
    english:'His proposal looks good on paper, but it is likely to be difficult to implement in practice.',
    gapSentence:'The plan looks good on ___, but the details remain unclear.', gapChoices:['paper','page','sheet','writing'], gapAnswer:'paper',
    listening:'In theory, the approach is straightforward; in practice, several constraints make it more complicated.', listeningMeaning:'Theoretisch ist der Ansatz einfach; praktisch machen mehrere Einschränkungen ihn komplizierter.',
    concept:{id:'cefr.c1.idiomatic-nuance',label:'idiomatic professional English',translation:'Idiome passend und natürlich einsetzen',category:'Wortschatz'}
  },
  {
    level:'C1', unit:2, lesson:2,
    unitTitle:'Register & Synthese', unitSubtitle:'Idiome einordnen, Quellen verbinden, Schlussfolgerungen ableiten und Executive Summaries formulieren.',
    title:'Quellen zusammenführen', subtitle:'Unterschiedliche Aussagen vergleichen und Gemeinsamkeiten präzise herausarbeiten.',
    goal:'Zwei Quellen differenziert in Beziehung setzen.',
    german:'Während beide Studien einen Zusammenhang zeigen, unterscheiden sie sich deutlich in der Erklärung der Ursachen.',
    english:'While both studies show a correlation, they differ considerably in how they explain the underlying causes.',
    gapSentence:'Both studies show a correlation, ___ they explain the causes differently.', gapChoices:['although','because','unless','therefore to'], gapAnswer:'although',
    listening:'Taken together, the findings suggest a common trend, but they do not support the same explanation.', listeningMeaning:'Zusammengenommen deuten die Ergebnisse auf einen gemeinsamen Trend hin, stützen aber nicht dieselbe Erklärung.',
    concept:{id:'cefr.c1.synthesis',label:'source synthesis',translation:'mehrere Quellen differenziert verbinden',category:'Kommunikation'}
  },
  {
    level:'C1', unit:2, lesson:3,
    unitTitle:'Register & Synthese', unitSubtitle:'Idiome einordnen, Quellen verbinden, Schlussfolgerungen ableiten und Executive Summaries formulieren.',
    title:'Zwischen den Zeilen', subtitle:'Implizite Haltung aus Wortwahl und Ton ableiten.',
    goal:'Eine Schlussfolgerung aus sprachlichen Hinweisen formulieren.',
    german:'Aus ihrer Wortwahl lässt sich schließen, dass sie der Entscheidung nur widerwillig zugestimmt hat.',
    english:'Her choice of words suggests that she agreed to the decision reluctantly.',
    gapSentence:'Her tone ___ that she was not entirely convinced.', gapChoices:['suggests','suggest','suggesting','is suggest'], gapAnswer:'suggests',
    listening:'He stopped short of rejecting the proposal, but his wording made his reservations clear.', listeningMeaning:'Er lehnte den Vorschlag nicht ausdrücklich ab, machte seine Vorbehalte durch seine Wortwahl aber deutlich.',
    concept:{id:'cefr.c1.inference',label:'inference from language',translation:'implizite Haltung erschließen',category:'Kommunikation'}
  },
  {
    level:'C1', unit:2, lesson:4,
    unitTitle:'Register & Synthese', unitSubtitle:'Idiome einordnen, Quellen verbinden, Schlussfolgerungen ableiten und Executive Summaries formulieren.',
    title:'Executive Summary', subtitle:'Komplexe Entscheidungen in wenigen präzisen Sätzen zusammenfassen.',
    goal:'Eine klare Empfehlung für eine Management-Zusammenfassung formulieren.',
    german:'Zusammenfassend empfehlen wir, die Einführung zu verschieben, bis die größten operativen Risiken behoben sind.',
    english:'In summary, we recommend postponing the rollout until the main operational risks have been addressed.',
    gapSentence:'We recommend ___ the rollout until the main risks are addressed.', gapChoices:['postponing','postpone','postponed','to postponing'], gapAnswer:'postponing',
    listening:'Overall, the project remains viable, provided that the highest-impact risks are resolved before launch.', listeningMeaning:'Insgesamt bleibt das Projekt tragfähig, sofern die Risiken mit den größten Auswirkungen vor dem Start gelöst werden.',
    concept:{id:'cefr.c1.executive-summary',label:'executive summaries',translation:'komplexe Inhalte prägnant zusammenfassen',category:'Kommunikation'}
  }
];

const difficultyByLevel: Record<Level, 2 | 3 | 4 | 5> = { A2:2, B1:3, B2:4, C1:5 };
const xpByLevel: Record<Level, number> = { A2:8, B1:10, B2:12, C1:14 };

function normalizeTokens(value: string) {
  return value.replace(/([,.!?;:])/g, ' $1 ').replace(/\s+/g, ' ').trim().split(' ');
}

function scrambleTokens(value: string) {
  const tokens = normalizeTokens(value);
  if (tokens.length < 4) return [...tokens].reverse();
  const cut = Math.max(2, Math.floor(tokens.length / 2));
  return [...tokens.slice(cut), ...tokens.slice(0, cut)];
}

function peers(bp: Blueprint) {
  return blueprints.filter(item => item.level === bp.level && item !== bp);
}

function makeLesson(bp: Blueprint): Lesson {
  const id = `en-${bp.level.toLowerCase()}-u${bp.unit}-l${bp.lesson}`;
  const conceptIds = [bp.concept.id];
  const difficulty = difficultyByLevel[bp.level];
  const baseXp = xpByLevel[bp.level];
  const alternatives = peers(bp).slice(0, 3);
  const meaningChoices = [bp.listeningMeaning, ...alternatives.map(item => item.listeningMeaning)].slice(0, 4);
  const sentenceChoices = [bp.english, ...alternatives.map(item => item.english)].slice(0, 4);

  return {
    id,
    courseId:'de-en',
    level:bp.level,
    unitId:`en-${bp.level.toLowerCase()}-u${bp.unit}`,
    title:bp.title,
    subtitle:bp.subtitle,
    estimatedMinutes:9,
    newConcepts:conceptIds,
    exercises:[
      {
        id:`${id}-e1`, type:'multiple-choice', instruction:'Wähle die Aussage mit derselben Bedeutung.', prompt:bp.german,
        choices:sentenceChoices, answer:bp.english, conceptIds, difficulty, xp:baseXp,
        explanation:`Ziel dieser Lektion: ${bp.goal}`
      },
      {
        id:`${id}-e2`, type:'translation', instruction:'Übersetze möglichst natürlich ins Englische.', prompt:bp.goal,
        sourceText:bp.german, acceptedAnswers:[bp.english], conceptIds, difficulty, xp:baseXp + 2
      },
      {
        id:`${id}-e3`, type:'sentence-build', instruction:'Baue den vollständigen englischen Satz.', prompt:bp.german,
        tokens:scrambleTokens(bp.english), answer:bp.english, conceptIds, difficulty, xp:baseXp + 2
      },
      {
        id:`${id}-e4`, type:'fill-gap', instruction:'Ergänze die präziseste Form.', prompt:bp.goal,
        sentence:bp.gapSentence, choices:bp.gapChoices, answer:bp.gapAnswer, conceptIds, difficulty, xp:baseXp
      },
      {
        id:`${id}-e5`, type:'listening', instruction:'Höre zu und wähle die passende Bedeutung.', prompt:'Verstehe die Aussage im Zusammenhang.',
        speech:bp.listening, choices:meaningChoices, answer:bp.listeningMeaning, conceptIds, difficulty, xp:baseXp + 3
      },
      {
        id:`${id}-e6`, type:'dictation', instruction:'Höre genau zu und schreibe den Satz.', prompt:'Achte auf Wortwahl, Zeitform und Satzstruktur.',
        speech:bp.listening, acceptedAnswers:[bp.listening], conceptIds, difficulty, xp:baseXp + 4
      },
      {
        id:`${id}-e7`, type:'speaking', instruction:'Sprich den Zielsatz laut nach.', prompt:bp.goal,
        speech:bp.english, acceptedAnswers:[bp.english], conceptIds, difficulty, xp:baseXp + 4
      },
      {
        id:`${id}-e8`, type:'multiple-choice', instruction:'Welche Formulierung passt am besten zum Lernziel?', prompt:bp.goal,
        choices:sentenceChoices, answer:bp.english, conceptIds, difficulty, xp:baseXp + 2,
        explanation:`${bp.level}: ${bp.title}`
      }
    ]
  };
}

export const advancedConceptCatalog: AdvancedConceptMeta[] = blueprints.map(item => item.concept);
export const advancedEnglishLessons: Lesson[] = blueprints.map(makeLesson);

function unitsFor(level: Level) {
  return ([1,2] as const).map(unitNumber => {
    const first = blueprints.find(item => item.level === level && item.unit === unitNumber)!;
    return {
      id:`en-${level.toLowerCase()}-u${unitNumber}`,
      number:unitNumber,
      title:first.unitTitle,
      subtitle:first.unitSubtitle,
      lessons:advancedEnglishLessons.filter(lesson => lesson.level === level && lesson.unitId === `en-${level.toLowerCase()}-u${unitNumber}`)
    };
  });
}

export const englishA2Units = unitsFor('A2');
export const englishB1Units = unitsFor('B1');
export const englishB2Units = unitsFor('B2');
export const englishC1Units = unitsFor('C1');
