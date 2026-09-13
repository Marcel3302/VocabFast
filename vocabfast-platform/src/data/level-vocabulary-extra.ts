import type { CefrLevel } from '../learning/curriculum';
import { levelVocabulary, type LevelVocabularyWord } from './level-vocabulary';

type Entry=[string,string];

const extras:Record<CefrLevel,Entry[]>={
 A1:[
  ['Monday','Montag'],['Tuesday','Dienstag'],['Wednesday','Mittwoch'],['Thursday','Donnerstag'],['Friday','Freitag'],['Saturday','Samstag'],['Sunday','Sonntag'],['January','Jänner / Januar'],['February','Februar'],['March','März'],
  ['April','April'],['May','Mai'],['June','Juni'],['July','Juli'],['August','August'],['September','September'],['October','Oktober'],['November','November'],['December','Dezember'],['red','rot'],
  ['blue','blau'],['green','grün'],['yellow','gelb'],['black','schwarz'],['white','weiß'],['brown','braun'],['grey','grau'],['orange','orange'],['pink','rosa'],['head','Kopf'],
  ['hand','Hand'],['eye','Auge'],['ear','Ohr'],['mouth','Mund'],['nose','Nase'],['hair','Haare'],['face','Gesicht'],['arm','Arm'],['leg','Bein'],['foot','Fuß'],
  ['back','Rücken'],['shirt','Hemd / Shirt'],['trousers','Hose'],['shoes','Schuhe'],['jacket','Jacke'],['dress','Kleid'],['hat','Hut / Mütze'],['kitchen','Küche'],['bathroom','Badezimmer'],['bedroom','Schlafzimmer'],
  ['door','Tür'],['window','Fenster'],['table','Tisch'],['chair','Stuhl'],['bed','Bett'],['left','links'],['right','rechts'],['straight','geradeaus'],['near','nahe'],['far','weit entfernt'],
  ['up','oben / hinauf'],['down','unten / hinunter'],['inside','drinnen'],['outside','draußen'],['walk','gehen / spazieren'],['run','laufen'],['sit','sitzen'],['stand','stehen'],['listen','zuhören'],['look','schauen'],
  ['watch','ansehen / beobachten'],['ask','fragen'],['tell','erzählen / sagen'],['call','anrufen'],['easy','einfach'],['difficult','schwierig'],['fast','schnell'],['slow','langsam'],['beautiful','schön'],['same','gleich']
 ],
 A2:[
  ['neighbour','Nachbar / Nachbarin'],['pharmacy','Apotheke'],['dentist','Zahnarzt / Zahnärztin'],['cough','Husten'],['fever','Fieber'],['sore throat','Halsschmerzen'],['stomach ache','Bauchschmerzen'],['insurance','Versicherung'],['emergency','Notfall'],['ambulance','Rettungswagen'],
  ['station','Bahnhof / Station'],['platform','Bahnsteig'],['delay','Verspätung'],['departure','Abfahrt'],['arrival','Ankunft'],['destination','Zielort'],['map','Karte'],['direction','Richtung'],['crossing','Kreuzung / Übergang'],['traffic','Verkehr'],
  ['supermarket','Supermarkt'],['bakery','Bäckerei'],['cash','Bargeld'],['card payment','Kartenzahlung'],['discount','Rabatt'],['size','Größe'],['fit','passen'],['try on','anprobieren'],['queue','Warteschlange'],['cashier','Kassierer / Kassiererin'],
  ['washing machine','Waschmaschine'],['fridge','Kühlschrank'],['heating','Heizung'],['electricity','Strom'],['key','Schlüssel'],['landlord','Vermieter / Vermieterin'],['neighbourhood','Wohngegend'],['floor','Stockwerk / Boden'],['lift','Aufzug'],['balcony','Balkon'],
  ['birthday','Geburtstag'],['wedding','Hochzeit'],['present','Geschenk'],['party','Feier'],['visit','besuchen / Besuch'],['meet','treffen'],['miss','vermissen / verpassen'],['promise','versprechen'],['surprised','überrascht'],['excited','aufgeregt / begeistert'],
  ['bored','gelangweilt'],['nervous','nervös'],['friendly','freundlich'],['helpful','hilfsbereit'],['kind','nett / freundlich'],['strange','seltsam'],['simple','einfach'],['local','lokal / örtlich'],['recent','kürzlich / neu'],['daily','täglich'],
  ['twice','zweimal'],['almost','fast'],['maybe','vielleicht'],['quite','ziemlich'],['around','ungefähr / rund um'],['without','ohne'],['during','während'],['until','bis'],['across','über / gegenüber'],['through','durch'],
  ['pick up','abholen'],['turn on','einschalten'],['turn off','ausschalten'],['look for','suchen nach'],['look after','sich kümmern um'],['wake up','aufwachen'],['get dressed','sich anziehen'],['take off','ausziehen / abheben'],['check in','einchecken'],['check out','auschecken']
 ],
 B1:[
  ['achievement','Erfolg / Leistung'],['background','Hintergrund'],['benefit from','profitieren von'],['budget','Budget'],['candidate','Bewerber / Kandidat'],['colleague','Kollege / Kollegin'],['contract','Vertrag'],['department','Abteilung'],['employer','Arbeitgeber'],['employee','Arbeitnehmer / Mitarbeiter'],
  ['employment','Beschäftigung'],['interview','Vorstellungsgespräch'],['salary','Gehalt'],['training','Ausbildung / Training'],['workload','Arbeitsbelastung'],['promotion','Beförderung'],['qualification','Qualifikation'],['application','Bewerbung / Anwendung'],['experience abroad','Auslandserfahrung'],['remote work','Telearbeit / Homeoffice'],
  ['headline','Schlagzeile'],['article','Artikel'],['broadcast','Sendung / Übertragung'],['reporter','Reporter / Reporterin'],['source','Quelle'],['advertisement','Werbung / Anzeige'],['social media','soziale Medien'],['audience','Publikum'],['review','Bewertung / Rezension'],['publish','veröffentlichen'],
  ['public transport','öffentliche Verkehrsmittel'],['accommodation','Unterkunft'],['sightseeing','Besichtigung'],['tourist attraction','Sehenswürdigkeit'],['route','Route / Strecke'],['border','Grenze'],['abroad','im Ausland'],['delay a decision','eine Entscheidung verschieben'],['travel insurance','Reiseversicherung'],['guided tour','Führung'],
  ['pollution','Verschmutzung'],['recycling','Recycling'],['climate','Klima'],['energy','Energie'],['waste','Abfall'],['protect','schützen'],['nature','Natur'],['wildlife','Tierwelt'],['public space','öffentlicher Raum'],['traffic jam','Stau'],
  ['generation','Generation'],['society','Gesellschaft'],['tradition','Tradition'],['custom','Brauch / Gewohnheit'],['generation gap','Generationenunterschied'],['volunteer','Freiwilliger / freiwillig helfen'],['charity','Wohltätigkeitsorganisation'],['neighbourhood project','Nachbarschaftsprojekt'],['local council','Gemeinderat'],['resident','Bewohner / Bewohnerin'],
  ['point of view','Standpunkt'],['in my view','meiner Ansicht nach'],['on the one hand','einerseits'],['on the other hand','andererseits'],['as a result','infolgedessen'],['in addition','zusätzlich'],['for example','zum Beispiel'],['in contrast','im Gegensatz'],['even though','obwohl'],['as long as','solange'],
  ['carry out','durchführen'],['find out','herausfinden'],['give up','aufgeben'],['set up','einrichten / gründen'],['work out','herausfinden / trainieren'],['take part','teilnehmen'],['look forward to','sich freuen auf'],['get along with','sich verstehen mit'],['deal with a problem','ein Problem bewältigen'],['make progress','Fortschritte machen']
 ],
 B2:[
  ['accountability','Rechenschaftspflicht'],['acquisition','Erwerb / Übernahme'],['allocate resources','Ressourcen zuteilen'],['benchmark','Vergleichsmaßstab'],['compliance','Einhaltung von Regeln'],['constraint','Einschränkung'],['cost-effective','kosteneffizient'],['stakeholder','Interessensgruppe'],['workflow','Arbeitsablauf'],['feasibility','Machbarkeit'],
  ['forecast','Prognose'],['performance indicator','Leistungskennzahl'],['productivity','Produktivität'],['revenue','Umsatz'],['shortage','Mangel'],['surplus','Überschuss'],['supply chain','Lieferkette'],['turnover','Umsatz / Fluktuation'],['workforce','Belegschaft'],['long-term','langfristig'],
  ['in the light of','angesichts'],['to a certain extent','bis zu einem gewissen Grad'],['by contrast','im Gegensatz dazu'],['in response to','als Reaktion auf'],['with regard to','hinsichtlich'],['in terms of','in Bezug auf'],['on behalf of','im Namen von'],['in accordance with','in Übereinstimmung mit'],['regardless of','ungeachtet'],['provided that','vorausgesetzt, dass'],
  ['address an issue','ein Problem angehen'],['raise concerns','Bedenken äußern'],['reach an agreement','eine Einigung erzielen'],['meet a requirement','eine Anforderung erfüllen'],['take responsibility','Verantwortung übernehmen'],['draw a conclusion','eine Schlussfolgerung ziehen'],['make an assumption','eine Annahme treffen'],['pose a risk','ein Risiko darstellen'],['set a precedent','einen Präzedenzfall schaffen'],['take into account','berücksichtigen'],
  ['counterargument','Gegenargument'],['credibility','Glaubwürdigkeit'],['discourse','Diskurs'],['emphasis','Betonung'],['finding','Ergebnis / Befund'],['methodology','Methodik'],['observation','Beobachtung'],['parameter','Parameter'],['phenomenon','Phänomen'],['variable','Variable'],
  ['bias towards','Neigung / Verzerrung zugunsten'],['correlate','korrelieren'],['differentiate','differenzieren'],['infer','schlussfolgern'],['quantify','quantifizieren'],['replicate','replizieren / wiederholen'],['validate','validieren / bestätigen'],['verify','überprüfen'],['compile','zusammenstellen'],['summarise','zusammenfassen'],
  ['mandatory','verpflichtend'],['optional','optional'],['provisional','vorläufig'],['transparent','transparent'],['uncertain','unsicher'],['unforeseen','unvorhergesehen'],['reasonable','vernünftig'],['controversy surrounding','Kontroverse um'],['comparable','vergleichbar'],['measurable','messbar'],
  ['phase out','schrittweise abschaffen'],['roll out','einführen / ausrollen'],['scale up','ausweiten'],['follow up','nachverfolgen'],['rule out','ausschließen'],['point out','hinweisen auf'],['bring about','bewirken'],['come up with','sich etwas ausdenken'],['carry forward','weiterführen'],['break down','aufschlüsseln / zusammenbrechen']
 ],
 C1:[
  ['albeit','obwohl / wenn auch'],['allegedly','angeblich'],['analogous','vergleichbar / analog'],['arbitrary','willkürlich'],['articulate','präzise ausdrücken'],['assert','behaupten / geltend machen'],['attain','erreichen'],['bolster','stärken / untermauern'],['coercive','zwangsausübend'],['compelling','überzeugend'],
  ['constrain','einschränken'],['contingent on','abhängig von'],['converge','zusammenlaufen / konvergieren'],['detrimental','schädlich'],['deviate','abweichen'],['discern','erkennen / unterscheiden'],['disproportionate','unverhältnismäßig'],['diverge','auseinandergehen'],['empirical','empirisch'],['encompass','umfassen'],
  ['entail','mit sich bringen'],['exacerbate','verschärfen'],['feasible','machbar'],['formulate','formulieren'],['hinder','behindern'],['induce','hervorrufen'],['intrinsic','wesenseigen'],['mitigate','abmildern'],['obsolete','veraltet'],['pervasive','allgegenwärtig / weit verbreitet'],
  ['prerequisite','Voraussetzung'],['reconcile','in Einklang bringen'],['redundant','überflüssig'],['resilient','widerstandsfähig'],['salient','hervorstechend / wesentlich'],['skeptical','skeptisch'],['tentative','vorläufig / zögerlich'],['unprecedented','beispiellos'],['versatile','vielseitig'],['vulnerable','verwundbar / anfällig'],
  ['a body of evidence','eine Gesamtheit von Belegen'],['a growing body of research','zunehmende Forschungsbasis'],['at face value','für bare Münze genommen'],['by no means','keineswegs'],['for the sake of','um ... willen'],['in retrospect','im Rückblick'],['insofar as','insofern als'],['on the grounds that','mit der Begründung, dass'],['to that end','zu diesem Zweck'],['with hindsight','im Nachhinein'],
  ['challenge an assumption','eine Annahme hinterfragen'],['draw a distinction','eine Unterscheidung treffen'],['lend credibility to','Glaubwürdigkeit verleihen'],['place emphasis on','den Schwerpunkt legen auf'],['shed light on','Licht werfen auf'],['stand to reason','naheliegend sein'],['take issue with','Einwände erheben gegen'],['yield results','Ergebnisse liefern'],['bear in mind','im Gedächtnis behalten'],['call into question','in Frage stellen'],
  ['causal mechanism','Kausalmechanismus'],['conceptual framework','konzeptioneller Rahmen'],['confounding factor','Störfaktor'],['empirical evidence','empirischer Beleg'],['ethical consideration','ethische Erwägung'],['external validity','externe Validität'],['longitudinal study','Längsschnittstudie'],['peer review','Begutachtung durch Fachkollegen'],['statistical significance','statistische Signifikanz'],['systematic review','systematische Übersichtsarbeit'],
  ['discreet','diskret / unauffällig'],['discrete','getrennt / diskret'],['notable','bemerkenswert'],['ostensibly','scheinbar / vorgeblich'],['presumably','vermutlich'],['primarily','hauptsächlich'],['simultaneously','gleichzeitig'],['subsequently','anschließend'],['thereafter','danach'],['conversely','umgekehrt']
 ],
 C2:[
  ['aberration','Abweichung / Ausreißer'],['acquiesce','widerwillig zustimmen'],['adduce','als Beleg anführen'],['ameliorate','verbessern / mildern'],['anomaly','Anomalie'],['apocryphal','zweifelhaft überliefert'],['circumscribe','eingrenzen'],['conflate','fälschlich gleichsetzen'],['deleterious','schädlich'],['delineate','präzise abgrenzen'],
  ['denote','bezeichnen'],['disambiguate','Eindeutigkeit herstellen'],['disseminate','verbreiten'],['elucidate','erläutern / erhellen'],['ephemeral','kurzlebig'],['equanimity','Gelassenheit'],['extrapolate','extrapolieren'],['fallacious','trügerisch / fehlerhaft'],['fortuitous','zufällig günstig'],['germane','sachbezogen / relevant'],
  ['heterogeneous','heterogen'],['idiosyncratic','eigentümlich / individuell'],['impute','zuschreiben / unterstellen'],['incontrovertible','unwiderlegbar'],['inextricable','untrennbar'],['juxtapose','gegenüberstellen'],['latent','latent / verborgen'],['mercurial','unbeständig / sprunghaft'],['obfuscate','verschleiern'],['ostensible','scheinbar / vorgeblich'],
  ['parsimonious','sparsam / knapp in Annahmen'],['perfunctory','oberflächlich / routinemäßig'],['rebut','entkräften'],['relegate','zurückstufen / verweisen'],['repudiate','zurückweisen'],['salutary','heilsam / nützlich'],['spurious','scheinbar / unecht'],['tacit','stillschweigend'],['tenuous','schwach / dünn'],['unequivocal','eindeutig'],
  ['a moot point','ein strittiger Punkt'],['all things considered','alles in allem'],['be that as it may','wie dem auch sei'],['for all intents and purposes','praktisch gesehen'],['in and of itself','an und für sich'],['in no uncertain terms','unmissverständlich'],['not least because','nicht zuletzt weil'],['to all intents and purposes','im Wesentlichen'],['to the extent that','in dem Maße, wie'],['without prejudice to','unbeschadet von'],
  ['draw an analogy','eine Analogie ziehen'],['entertain the possibility','die Möglichkeit in Betracht ziehen'],['make a compelling case','überzeugend argumentieren'],['merit closer scrutiny','genauere Prüfung verdienen'],['rest on the premise','auf der Prämisse beruhen'],['run counter to','im Widerspruch stehen zu'],['stand up to scrutiny','einer Prüfung standhalten'],['take something as given','etwas als gegeben annehmen'],['weigh competing claims','konkurrierende Behauptungen abwägen'],['withstand criticism','Kritik standhalten'],
  ['epistemic uncertainty','epistemische Unsicherheit'],['counterfactual reasoning','kontrafaktisches Denken'],['inferential leap','zu großer Schlussfolgerungsschritt'],['methodological caveat','methodischer Vorbehalt'],['normative claim','normative Aussage'],['semantic ambiguity','semantische Mehrdeutigkeit'],['causal inference','kausale Schlussfolgerung'],['burden of proof','Beweislast'],['logical consistency','logische Konsistenz'],['conceptual distinction','begriffliche Unterscheidung'],
  ['incisive','scharfsinnig'],['meticulous','akribisch'],['nuanced','nuanciert'],['pithy','prägnant'],['qualified statement','eingeschränkte Aussage'],['rhetorical device','rhetorisches Mittel'],['subtle distinction','feiner Unterschied'],['unsubstantiated','unbelegt'],['well-founded','gut begründet'],['cogent','stichhaltig']
 ]
};

function extend(level:CefrLevel,entries:Entry[]) {
  const existing=new Set(levelVocabulary[level].map(item=>item.word.trim().toLocaleLowerCase()));
  const additions:LevelVocabularyWord[]=[];
  for(const [word,translation] of entries) {
    const key=word.trim().toLocaleLowerCase();
    if(!key||existing.has(key))continue;
    existing.add(key);
    additions.push({word,translation});
  }
  levelVocabulary[level].push(...additions);
}

for(const level of Object.keys(extras) as CefrLevel[])extend(level,extras[level]);

export { extras as extendedLevelVocabulary };
