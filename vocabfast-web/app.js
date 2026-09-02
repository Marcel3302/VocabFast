(function () {
  'use strict';

  const STORAGE_KEY = 'vocabfast.words.v2';
  const ACHIEVEMENTS_KEY = 'vocabfast.achievements.v1';
  const TRANSLATION_CACHE_KEY = 'vocabfast.translation-cache.v2';
  const PROFILE_KEY = 'vocabfast.profile.v1';
  const CORE_COUNT = 4500;
  const app = document.getElementById('app');

  const CORE_FALLBACK = [
    ['the','der / die / das','A1'],['be','sein','A1'],['of','von','A1'],['and','und','A1'],['in','in','A1'],['to','zu','A1'],['for','für','A1'],['have','haben','A1'],['with','mit','A1'],['on','auf','A1'],
    ['it','es','A1'],['from','von / aus','A1'],['that','dass / das','A1'],['this','dies / das','A1'],['you','du / Sie','A1'],['will','werden','A2'],['do','tun / machen','A1'],['but','aber','A1'],['we','wir','A1'],['can','können','A1'],
    ['make','machen','A1'],['if','wenn / falls','A1'],['also','auch','A1'],['one','eins','A1'],['who','wer','A1'],['time','Zeit','A1'],['other','andere','A1'],['take','nehmen','A1'],['year','Jahr','A1'],['use','benutzen','A1'],
    ['there','dort','A1'],['your','dein / Ihr','A1'],['would','würde','A2'],['see','sehen','A1'],['good','gut','A1'],['about','über','A1'],['new','neu','A1'],['when','wann / wenn','A1'],['give','geben','A1'],['go','gehen','A1'],
    ['get','bekommen','A1'],['say','sagen','A1'],['people','Menschen','A1'],['some','einige','A1'],['only','nur','A1'],['find','finden','A1'],['now','jetzt','A1'],['well','gut','A1'],['what','was','A1'],['first','erste/r/s','A1'],
    ['should','sollte','A2'],['come','kommen','A1'],['provide','bereitstellen','B1'],['know','wissen / kennen','A1'],['work','Arbeit / arbeiten','A1'],['many','viele','A1'],['could','könnte','A2'],['how','wie','A1'],['need','brauchen','A1'],['information','Information','A1'],
    ['look','schauen / aussehen','A1'],['before','vor / bevor','A2'],['like','mögen / wie','A1'],['great','großartig','A1'],['think','denken','A1'],['help','helfen','A1'],['want','wollen','A1'],['important','wichtig','A1'],['possible','möglich','A2'],['learn','lernen','A1'],
    ['however','jedoch','B1'],['although','obwohl','B1'],['therefore','deshalb','B1'],['nevertheless','dennoch','B2'],['meanwhile','inzwischen','B2'],['moreover','darüber hinaus','B2'],['achievement','Erfolg / Errungenschaft','B1'],['environment','Umwelt','A2'],['opportunity','Möglichkeit / Gelegenheit','B1'],['development','Entwicklung','B1']
  ];

  const THEMES = [
    { id:'travel', icon:'✈️', title:'Reisen', description:'Flughafen, Hotel, Orientierung und unterwegs.', words:[
      ['journey','Reise','Our journey starts early tomorrow.'],['destination','Reiseziel','Paris is our final destination.'],['departure','Abflug / Abfahrt','The departure is scheduled for six.'],['arrival','Ankunft','Our arrival was delayed by an hour.'],['luggage','Gepäck','My luggage is already checked in.'],['suitcase','Koffer','Her suitcase is quite heavy.'],['passport','Reisepass','Please keep your passport ready.'],['boarding pass','Bordkarte','I saved my boarding pass on my phone.'],['reservation','Reservierung','I have a reservation for two nights.'],['accommodation','Unterkunft','The accommodation is close to the station.'],['reception','Rezeption','Ask at reception for a city map.'],['available','verfügbar','Is this room still available?'],['single room','Einzelzimmer','I would like a single room.'],['double room','Doppelzimmer','We booked a double room.'],['check-in','Check-in / Anmeldung','Online check-in opens tomorrow.'],['check-out','Check-out / Abreise','Check-out is before eleven.'],['platform','Bahnsteig','The train leaves from platform four.'],['timetable','Fahrplan','I checked the timetable online.'],['delay','Verspätung','There is a twenty-minute delay.'],['connection','Verbindung / Anschluss','We missed our connection in Munich.'],['direction','Richtung / Wegbeschreibung','Can you point me in the right direction?'],['nearby','in der Nähe','There is a pharmacy nearby.'],['entrance','Eingang','The main entrance is around the corner.'],['exit','Ausgang','Take the next exit on the right.'],['currency','Währung','The local currency is the euro.']
    ]},
    { id:'aviation', icon:'🛫', title:'Luftfahrt', description:'Wichtige Begriffe rund um Flugzeug, Flughafen und Betrieb.', words:[
      ['aircraft','Flugzeug / Luftfahrzeug','The aircraft is ready for departure.'],['airline','Fluggesellschaft','The airline changed our gate.'],['airport','Flughafen','We arrived at the airport early.'],['runway','Start- und Landebahn','The aircraft is taxiing toward the runway.'],['taxiway','Rollweg','The pilot followed the taxiway to the gate.'],['gate','Flugsteig / Gate','Boarding starts at gate twelve.'],['cockpit','Cockpit','Only authorized crew may enter the cockpit.'],['cabin','Kabine','The cabin lights were dimmed.'],['crew','Besatzung','The crew welcomed the passengers.'],['pilot','Pilot / Pilotin','The pilot announced some turbulence.'],['flight attendant','Flugbegleiter/in','A flight attendant helped with the bag.'],['passenger','Passagier/in','Every passenger needs a boarding pass.'],['altitude','Flughöhe','The aircraft reached cruising altitude.'],['airspeed','Fluggeschwindigkeit','The crew monitored the airspeed closely.'],['heading','Kurs / Flugrichtung','The aircraft changed its heading.'],['takeoff','Start','Takeoff was smooth despite the wind.'],['landing','Landung','The landing was very gentle.'],['approach','Landeanflug','The aircraft began its final approach.'],['turbulence','Turbulenzen','We experienced light turbulence.'],['weather','Wetter','Bad weather caused several delays.'],['visibility','Sichtweite','Visibility is poor this morning.'],['maintenance','Wartung','The aircraft is undergoing maintenance.'],['fuel','Treibstoff','The crew checked the fuel quantity.'],['emergency','Notfall','The crew practiced the emergency procedure.'],['air traffic control','Flugsicherung','Air traffic control cleared us for takeoff.']
    ]},
    { id:'basketball', icon:'🏀', title:'Basketball', description:'Spiel, Training, Taktik und typische Begriffe.', words:[
      ['court','Spielfeld','The players ran onto the court.'],['basket','Korb','He drove straight to the basket.'],['rim','Ring','The ball bounced off the rim.'],['backboard','Brett','The shot hit the backboard first.'],['dribble','dribbeln','She can dribble with both hands.'],['pass','passen / Pass','Make the extra pass to the corner.'],['shoot','werfen','He likes to shoot from long range.'],['rebound','Rebound','She grabbed an important rebound.'],['assist','Vorlage / Assist','That pass gave him another assist.'],['steal','Ballgewinn / Steal','The guard made a clean steal.'],['block','Block','The center recorded three blocks.'],['turnover','Ballverlust','We made too many turnovers.'],['foul','Foul','The referee called a shooting foul.'],['free throw','Freiwurf','He made both free throws.'],['three-pointer','Dreipunktewurf','She hit a three-pointer at the buzzer.'],['layup','Korbleger','He finished the fast break with a layup.'],['dunk','Dunk','The crowd cheered after the dunk.'],['defense','Verteidigung','Good defense kept the game close.'],['offense','Angriff','Their offense moved the ball quickly.'],['screen','Block / Sperre','The center set a strong screen.'],['timeout','Auszeit','The coach called a timeout.'],['bench','Ersatzbank','The whole bench celebrated the shot.'],['coach','Trainer/in','The coach changed the defense.'],['teammate','Mitspieler/in','Trust your teammate with the pass.'],['score','Punktestand / punkten','The final score was very close.']
    ]},
    { id:'business', icon:'💼', title:'Business & Büro', description:'Meetings, Projekte, Zahlen und Kommunikation.', words:[
      ['meeting','Besprechung','The meeting starts at nine.'],['deadline','Frist','We need to meet the deadline.'],['schedule','Zeitplan','The project is ahead of schedule.'],['task','Aufgabe','I finished the most urgent task.'],['priority','Priorität','Customer safety is our top priority.'],['project','Projekt','The project enters its final phase.'],['budget','Budget','The team stayed within the budget.'],['revenue','Umsatz','Revenue increased this quarter.'],['profit','Gewinn','The company reported a higher profit.'],['cost','Kosten','We need to reduce operating costs.'],['customer','Kunde / Kundin','The customer asked for an update.'],['supplier','Lieferant','Our supplier confirmed the delivery date.'],['invoice','Rechnung','Please send the invoice by email.'],['contract','Vertrag','Both sides signed the contract.'],['agreement','Vereinbarung','We reached an agreement yesterday.'],['proposal','Vorschlag / Angebot','I will present the proposal tomorrow.'],['feedback','Rückmeldung','Thanks for your detailed feedback.'],['responsibility','Verantwortung','This task is my responsibility.'],['department','Abteilung','She works in the finance department.'],['colleague','Kollege / Kollegin','I discussed it with a colleague.'],['manager','Führungskraft / Manager','The manager approved the request.'],['performance','Leistung','Team performance improved this month.'],['strategy','Strategie','We need a clear strategy for growth.'],['target','Ziel','The sales team reached its target.'],['decision','Entscheidung','We will make a decision on Friday.']
    ]},
    { id:'food', icon:'🍽️', title:'Restaurant & Essen', description:'Bestellen, Lebensmittel, Geschmack und Service.', words:[
      ['menu','Speisekarte','Could we see the menu, please?'],['starter','Vorspeise','We shared a starter.'],['main course','Hauptgericht','The main course was excellent.'],['dessert','Nachspeise','Would you like a dessert?'],['bill','Rechnung','Could we have the bill, please?'],['tip','Trinkgeld','We left a small tip.'],['reservation','Reservierung','I made a reservation for seven.'],['table','Tisch','Your table is ready.'],['order','bestellen / Bestellung','Are you ready to order?'],['recommend','empfehlen','What would you recommend?'],['ingredient','Zutat','This dish contains fresh ingredients.'],['allergy','Allergie','I have a nut allergy.'],['vegetarian','vegetarisch','Do you have a vegetarian option?'],['spicy','scharf','The soup is quite spicy.'],['sweet','süß','This sauce is a little sweet.'],['sour','sauer','The lemon tastes sour.'],['bitter','bitter','The coffee is too bitter for me.'],['fresh','frisch','The bread is fresh.'],['delicious','köstlich','The meal was absolutely delicious.'],['hungry','hungrig','I am really hungry.'],['thirsty','durstig','After the walk, we were thirsty.'],['bottle','Flasche','Can we have a bottle of water?'],['glass','Glas','She ordered a glass of juice.'],['fork','Gabel','Could I have another fork?'],['knife','Messer','The knife is on the right.']
    ]},
    { id:'technology', icon:'💻', title:'Technik & Computer', description:'Digitale Geräte, Software und Internet.', words:[
      ['device','Gerät','This device connects through Bluetooth.'],['computer','Computer','My computer needs an update.'],['screen','Bildschirm','The screen is too bright.'],['keyboard','Tastatur','This keyboard is very quiet.'],['mouse','Maus','The wireless mouse needs a new battery.'],['software','Software','We installed the latest software.'],['application','Anwendung / App','The application starts automatically.'],['browser','Browser','Open the page in your browser.'],['website','Webseite','The website loads quickly.'],['network','Netzwerk','The office network is down.'],['connection','Verbindung','The internet connection is unstable.'],['password','Passwort','Choose a strong password.'],['account','Konto','I created a new account.'],['file','Datei','Please attach the file to the email.'],['folder','Ordner','Save the document in this folder.'],['download','herunterladen','The download finished successfully.'],['upload','hochladen','You can upload the PDF here.'],['update','Aktualisierung / aktualisieren','The update fixes several bugs.'],['setting','Einstellung','Change this option in the settings.'],['data','Daten','The data is stored locally.'],['database','Datenbank','The database contains customer records.'],['server','Server','The server responded immediately.'],['cloud','Cloud','The files are backed up in the cloud.'],['security','Sicherheit','Security is important for every account.'],['backup','Sicherungskopie','Create a backup before the update.']
    ]},
    { id:'smalltalk', icon:'💬', title:'Small Talk & Alltag', description:'Schnell natürlicher sprechen und reagieren.', words:[
      ['actually','eigentlich / tatsächlich','Actually, I have already seen that film.'],['probably','wahrscheinlich','I will probably be home by eight.'],['maybe','vielleicht','Maybe we can meet tomorrow.'],['anyway','jedenfalls','Anyway, we should get going.'],['especially','besonders','I especially like the old town.'],['quite','ziemlich','The restaurant is quite good.'],['really','wirklich','I really enjoyed the trip.'],['usually','normalerweise','I usually drink coffee in the morning.'],['sometimes','manchmal','Sometimes I walk to work.'],['recently','kürzlich','I recently started learning English again.'],['fortunately','glücklicherweise','Fortunately, nobody was hurt.'],['unfortunately','leider','Unfortunately, the shop is closed.'],['surprised','überrascht','I was surprised by the result.'],['excited','aufgeregt / begeistert','We are excited about the weekend.'],['worried','besorgt','She is worried about the exam.'],['relaxed','entspannt','I feel relaxed after the holiday.'],['interesting','interessant','That sounds really interesting.'],['boring','langweilig','The meeting was a little boring.'],['agree','zustimmen','I completely agree with you.'],['disagree','nicht zustimmen','I disagree with that point.'],['opinion','Meinung','What is your opinion?'],['experience','Erfahrung','It was a great experience.'],['suggest','vorschlagen','I suggest taking the earlier train.'],['prefer','bevorzugen','I prefer tea to coffee.'],['depends','kommt darauf an','It depends on the weather.']
    ]},
    { id:'health', icon:'🩺', title:'Gesundheit & Körper', description:'Arzt, Beschwerden und grundlegende Gesundheitssprache.', words:[
      ['appointment','Termin','I have a doctor\'s appointment tomorrow.'],['doctor','Arzt / Ärztin','The doctor asked about my symptoms.'],['nurse','Pflegekraft','The nurse checked my temperature.'],['pharmacy','Apotheke','The pharmacy closes at six.'],['medicine','Medikament','Take the medicine with water.'],['pain','Schmerz','The pain is getting better.'],['headache','Kopfschmerzen','I have a slight headache.'],['fever','Fieber','He has a high fever.'],['cough','Husten','The cough lasted for a week.'],['injury','Verletzung','The player returned after an injury.'],['healthy','gesund','Regular exercise helps you stay healthy.'],['exercise','Bewegung / Training','I try to exercise three times a week.'],['sleep','Schlaf / schlafen','I need more sleep.'],['rest','Ruhe / sich ausruhen','You should get some rest.'],['breath','Atem','Take a slow, deep breath.'],['heart','Herz','Exercise is good for your heart.'],['blood','Blut','The test requires a small blood sample.'],['stomach','Magen','My stomach feels much better now.'],['back','Rücken','My back hurts after sitting all day.'],['shoulder','Schulter','He injured his shoulder during training.'],['knee','Knie','She felt pain in her knee.'],['emergency','Notfall','Call emergency services if necessary.'],['symptom','Symptom','A cough can be a common symptom.'],['treatment','Behandlung','The treatment worked well.'],['recover','sich erholen','He needs time to recover.']
    ]}
  ];

  const GRAMMAR = [
    { id:'word-order', title:'1. Satzbau', level:'A1–B1', summary:'Im normalen Aussagesatz steht das Verb meist an Position 2.', rules:[
      'Grundform: Subjekt + Verb + Objekt/Ergänzung.',
      'Beginnt der Satz mit Zeit oder Ort, bleibt das Verb an Position 2 und das Subjekt rutscht dahinter.',
      'Adverbien stehen oft in der Reihenfolge Zeit – Art und Weise – Ort.'
    ], examples:[['I learn English every day.','Ich lerne jeden Tag Englisch.'],['Tomorrow I will call you.','Morgen rufe ich dich an.'],['We usually meet at the office.','Wir treffen uns normalerweise im Büro.']] },
    { id:'be', title:'2. To be', level:'A1', summary:'am / is / are für Zustände, Eigenschaften, Berufe und Orte.', rules:['I am, you/we/they are, he/she/it is.','Verneinung: am not / is not / are not.','Frage: Verb vor das Subjekt: Are you ready?'], examples:[['I am tired.','Ich bin müde.'],['She is at work.','Sie ist bei der Arbeit.'],['Are they ready?','Sind sie bereit?']] },
    { id:'present-simple', title:'3. Present Simple', level:'A1–A2', summary:'Für Routinen, Fakten und regelmäßige Handlungen.', rules:['I/you/we/they work; he/she/it works.','Bei he/she/it kommt meist -s ans Verb.','Fragen und Verneinungen mit do/does.'], examples:[['I work from Monday to Friday.','Ich arbeite von Montag bis Freitag.'],['He speaks English well.','Er spricht gut Englisch.'],['Do you travel often?','Reist du oft?']] },
    { id:'present-continuous', title:'4. Present Continuous', level:'A1–A2', summary:'Für Handlungen, die gerade jetzt oder vorübergehend passieren.', rules:['Form: am/is/are + Verb-ing.','Oft mit now, at the moment, currently.','Zustandsverben wie know oder believe stehen meist nicht im Continuous.'], examples:[['I am learning English right now.','Ich lerne gerade Englisch.'],['They are waiting at the gate.','Sie warten am Gate.'],['She is working from home this week.','Sie arbeitet diese Woche von zu Hause.']] },
    { id:'past-simple', title:'5. Past Simple', level:'A2', summary:'Für abgeschlossene Ereignisse in der Vergangenheit.', rules:['Regelmäßige Verben: -ed.','Unregelmäßige Formen müssen gelernt werden: go → went.','Fragen/Verneinung mit did + Grundform.'], examples:[['We arrived yesterday.','Wir sind gestern angekommen.'],['I went to London last year.','Ich war letztes Jahr in London.'],['Did you see the game?','Hast du das Spiel gesehen?']] },
    { id:'present-perfect', title:'6. Present Perfect', level:'A2–B1', summary:'Vergangenheit mit Bezug zur Gegenwart oder ohne konkrete abgeschlossene Zeitangabe.', rules:['Form: have/has + past participle.','Typisch mit already, yet, ever, never, just, since, for.','Bei konkreten vergangenen Zeitpunkten meist Past Simple.'], examples:[['I have already finished the task.','Ich habe die Aufgabe bereits erledigt.'],['Have you ever been to Canada?','Warst du schon einmal in Kanada?'],['She has lived here for five years.','Sie lebt seit fünf Jahren hier.']] },
    { id:'future', title:'7. Zukunft: will & going to', level:'A2–B1', summary:'Will für spontane Entscheidungen/Prognosen; going to für Pläne oder klare Anzeichen.', rules:['will + Grundform.','am/is/are going to + Grundform.','Für feste Termine ist auch Present Continuous üblich.'], examples:[['I will call you later.','Ich rufe dich später an.'],['We are going to travel in October.','Wir werden im Oktober verreisen.'],['I am meeting Sarah tomorrow.','Ich treffe Sarah morgen.']] },
    { id:'articles', title:'8. Artikel: a, an, the', level:'A1–B1', summary:'a/an für etwas nicht näher Bestimmtes, the für etwas Bestimmtes oder Bekanntes.', rules:['a vor Konsonantlaut, an vor Vokallaut.','the, wenn beide wissen, was gemeint ist.','Bei allgemeinen Plural- oder nicht zählbaren Begriffen oft kein Artikel.'], examples:[['I need a ticket.','Ich brauche ein Ticket.'],['The ticket is in my bag.','Das Ticket ist in meiner Tasche.'],['Information is important.','Information ist wichtig.']] },
    { id:'modals', title:'9. Modalverben', level:'A2–B1', summary:'can, could, should, must, might für Fähigkeit, Möglichkeit, Rat und Pflicht.', rules:['Nach Modalverben steht die Grundform ohne to.','should = Rat; must = starke Pflicht; might = Möglichkeit.','could kann Fähigkeit in der Vergangenheit oder eine höfliche Bitte ausdrücken.'], examples:[['You should practice every day.','Du solltest jeden Tag üben.'],['Could you help me?','Könntest du mir helfen?'],['It might rain later.','Später könnte es regnen.']] },
    { id:'questions', title:'10. Fragen', level:'A1–B1', summary:'Hilfsverb + Subjekt + Verb; Fragewörter stehen davor.', rules:['Do/does für Present Simple, did für Past Simple.','Bei be kommt am/is/are direkt vor das Subjekt.','Fragewörter: what, where, when, why, who, how.'], examples:[['Where do you work?','Wo arbeitest du?'],['Why did they leave?','Warum sind sie gegangen?'],['How are you?','Wie geht es dir?']] },
    { id:'comparisons', title:'11. Vergleiche', level:'A2–B1', summary:'-er / more und -est / most für Vergleiche.', rules:['short → shorter → shortest.','important → more important → most important.','Unregelmäßig: good → better → best.'], examples:[['This route is shorter.','Diese Route ist kürzer.'],['English is more important for my job now.','Englisch ist für meinen Job jetzt wichtiger.'],['That was the best option.','Das war die beste Option.']] },
    { id:'conditionals', title:'12. If-Sätze – Basics', level:'B1–B2', summary:'Bedingungen und ihre möglichen Folgen.', rules:['Zero Conditional: if + present, present für allgemeine Fakten.','First Conditional: if + present, will + Verb für reale Zukunftsmöglichkeiten.','Second Conditional: if + past, would + Verb für hypothetische Situationen.'], examples:[['If I have time, I will call you.','Wenn ich Zeit habe, rufe ich dich an.'],['If you heat ice, it melts.','Wenn man Eis erhitzt, schmilzt es.'],['If I had more time, I would travel more.','Wenn ich mehr Zeit hätte, würde ich mehr reisen.']] },
    { id:'prepositions', title:'13. Häufige Präpositionen', level:'A1–B1', summary:'at, on, in sowie for, since, by und until sind besonders wichtig.', rules:['at für genaue Uhrzeiten; on für Tage/Daten; in für Monate/Jahre/längere Zeiträume.','since = Startpunkt; for = Dauer.','by = spätestens bis; until = bis zu einem Zeitpunkt andauernd.'], examples:[['The meeting starts at nine.','Das Meeting beginnt um neun.'],['I have worked here since 2024.','Ich arbeite seit 2024 hier.'],['Please finish it by Friday.','Bitte erledige es bis Freitag.']] },
    { id:'countable', title:'14. Countable & Uncountable', level:'A2–B1', summary:'Zählbare und nicht zählbare Nomen beeinflussen Artikel und Mengenwörter.', rules:['many/few bei zählbaren Dingen; much/little bei nicht zählbaren.','information, advice, luggage und equipment sind im Englischen nicht zählbar.','Für einzelne Einheiten: a piece of information/advice.'], examples:[['We have many customers.','Wir haben viele Kunden.'],['I need some information.','Ich brauche einige Informationen.'],['She gave me a useful piece of advice.','Sie gab mir einen nützlichen Rat.']] }
  ];

  const LOCAL_EXAMPLES = {
    environment:'We need to protect the environment.', achievement:'Finishing the project was a major achievement.', opportunity:'This job is a great opportunity.', supplier:'The supplier confirmed the delivery date.', revenue:'The company increased its revenue this year.', development:'The development of the product took six months.', customer:'The customer asked for more information.', growth:'The company expects steady growth.', language:'English is an international language.', learn:'I want to learn English faster.', word:'I wrote the new word in my notebook.'
  };

  const FALLBACK_DICTIONARY = Object.fromEntries(CORE_FALLBACK.map(([en,de]) => [en.toLowerCase(), de]));
  THEMES.forEach(theme => theme.words.forEach(([en,de]) => { FALLBACK_DICTIONARY[en.toLowerCase()] = de; LOCAL_EXAMPLES[en.toLowerCase()] = theme.words.find(x=>x[0]===en)[2]; }));

  const state = {
    page: 'home',
    words: loadWords(),
    achievements: loadJson(ACHIEVEMENTS_KEY, []),
    translationCache: loadJson(TRANSLATION_CACHE_KEY, {}),
    profile: loadJson(PROFILE_KEY, { translationContext: '' }),
    toast: '',
    filter: 'all',
    search: '',
    sort: 'new',
    trainer: { queue: [], index: 0, mode: 'write', result: null, answer: '', revealed: false, levelFilter: 'all', exampleLoading: false },
    add: { english: '', german: '', status: '', translating: false, listening: false },
    core: { words: [], loading: false, loaded: false, error: '', search: '', cefr: 'all', page: 0, adding: '', translating: '' },
    themes: { selected: 'travel', search: '', addingAll: false },
    pdf: { fileName: '', status: '', words: [], selected: new Set(), search: '', loading: false, adding: false },
    grammarOpen: 'word-order'
  };

  function makeId() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') return window.crypto.randomUUID();
    return 'w_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
  }

  function loadJson(key, fallback) {
    try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch (_) { return fallback; }
  }

  function createWord(english, german, source, extra) {
    const now = new Date().toISOString();
    return Object.assign({
      id: makeId(), english: english.trim(), german: german.trim(), level: 3, streak: 0, active: true,
      source: source || 'manual', correct: 0, wrong: 0, createdAt: now, updatedAt: now,
      mastered: false, exampleEn: ''
    }, extra || {});
  }

  function starterWords() {
    return [
      createWord('environment','Umwelt','starter',{exampleEn:LOCAL_EXAMPLES.environment}),
      createWord('achievement','Erfolg / Errungenschaft','starter',{exampleEn:LOCAL_EXAMPLES.achievement}),
      createWord('opportunity','Möglichkeit / Gelegenheit','starter',{exampleEn:LOCAL_EXAMPLES.opportunity}),
      createWord('supplier','Lieferant','starter',{exampleEn:LOCAL_EXAMPLES.supplier}),
      createWord('revenue','Umsatz','starter',{exampleEn:LOCAL_EXAMPLES.revenue})
    ];
  }

  function normalizeWordRecord(w) {
    const now = new Date().toISOString();
    return {
      id: w.id || makeId(), english: String(w.english || '').trim(), german: String(w.german || '').trim(),
      level: [1,2,3].includes(Number(w.level)) ? Number(w.level) : 3,
      streak: Math.max(0, Math.min(5, Number(w.streak) || 0)), active: w.active !== false,
      source: w.source || 'manual', correct: Number(w.correct) || 0, wrong: Number(w.wrong) || 0,
      createdAt: w.createdAt || now, updatedAt: w.updatedAt || now, mastered: !!w.mastered,
      exampleEn: w.exampleEn || ''
    };
  }

  function loadWords() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return starterWords();
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return starterWords();
      const clean = parsed.map(normalizeWordRecord).filter(w => w.english && w.german);
      return clean.length ? clean : starterWords();
    } catch (_) { return starterWords(); }
  }

  function saveWords() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.words)); } catch (_) { showToast('Speichern im Browser ist blockiert.'); } }
  function saveAchievements() { try { localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(state.achievements)); } catch (_) {} }
  function saveTranslationCache() { try { localStorage.setItem(TRANSLATION_CACHE_KEY, JSON.stringify(state.translationCache)); } catch (_) {} }
  function saveProfile() { try { localStorage.setItem(PROFILE_KEY, JSON.stringify(state.profile)); } catch (_) {} }

  function escapeHtml(value) { return String(value ?? '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch])); }
  function normalize(value) { return String(value || '').toLowerCase().trim().replace(/[.,!?;:()"'’]/g, '').replace(/\s+/g,' '); }
  function acceptedAnswers(expected) { return String(expected || '').split(/[\/;,]|\bor\b/gi).map(normalize).filter(Boolean); }
  function correctAnswer(answer, expected) {
    const a = normalize(answer);
    if (!a) return false;
    const options = acceptedAnswers(expected);
    return options.some(x => a === x || (x.length > 4 && a === x.replace(/^(der|die|das|ein|eine)\s+/,'').trim()));
  }
  function formatDate(iso) { try { return new Intl.DateTimeFormat('de-AT',{day:'2-digit',month:'2-digit',year:'numeric'}).format(new Date(iso)); } catch (_) { return ''; } }
  function shuffle(arr) { const copy=[...arr]; for(let i=copy.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]];} return copy; }

  function counts() {
    return {
      total: state.words.length,
      active: state.words.filter(w => w.active).length,
      red: state.words.filter(w => w.active && w.level === 3).length,
      yellow: state.words.filter(w => w.active && w.level === 2).length,
      green: state.words.filter(w => w.active && w.level === 1).length,
      mastered: state.achievements.length
    };
  }

  function levelColor(level) { return level === 3 ? 'red' : level === 2 ? 'yellow' : 'green'; }
  function levelName(level) { return level === 3 ? 'Neu' : level === 2 ? 'Festigen' : 'Sicher'; }

  function showToast(text) {
    state.toast = text; render(); clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => { state.toast = ''; render(); }, 2600);
  }

  function shell(content) {
    const nav = [
      ['home','⌂','Übersicht'],['trainer','▶','Trainer'],['add','＋','Hinzufügen'],['core','4500','Kernwörter'],
      ['themes','◈','Themen'],['pdf','PDF','PDF'],['grammar','Aa','Grammatik'],['words','▤','Meine Wörter'],['achievements','🏆','Erfolge']
    ];
    return `<div class="shell">
      <aside class="sidebar">
        <button class="brand" data-page="home"><span class="brand-mark">V</span><span>VocabFast</span></button>
        <nav class="nav">${nav.map(([key,icon,label]) => `<button class="${state.page===key?'active':''}" data-page="${key}"><span class="nav-icon">${icon}</span><span>${label}</span></button>`).join('')}</nav>
        <div class="side-note"><b>VocabFast Test</b><br>Daten lokal in diesem Browser</div>
      </aside>
      <main class="main">${content}</main>
      <nav class="mobile-nav">${nav.map(([key,icon,label]) => `<button class="${state.page===key?'active':''}" data-page="${key}"><span>${icon}</span><small>${label}</small></button>`).join('')}</nav>
      ${state.toast ? `<div class="toast">✓ ${escapeHtml(state.toast)}</div>` : ''}
    </div>`;
  }

  function heading(eyebrow,title,subtitle) { return `<div class="heading"><p class="eyebrow">${escapeHtml(eyebrow)}</p><h1>${escapeHtml(title)}</h1><p class="subtitle">${escapeHtml(subtitle)}</p></div>`; }

  function homePage() {
    const c = counts();
    const progress = c.total ? Math.round(state.words.filter(w=>w.level===1).length / c.total * 100) : 0;
    const recent = [...state.words].sort((a,b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0,5);
    return shell(`<div class="page">
      ${heading('DEIN LERNBEREICH','Schnell Wörter lernen.','Eigene Vokabeln, 4.500 Kernwörter, Themenpakete und Grammatik in einer übersichtlichen App.')}
      <section class="hero">
        <div><span class="pill">⚡ Fokus: aktives Abrufen</span><h2>${c.active ? `${c.active} Wörter sind aktiv.` : 'Keine aktiven Wörter.'}</h2><p>Wähle eine Stufe oder starte eine gemischte Runde. Ab Stufe 2 trainierst du beide Übersetzungsrichtungen.</p>
          <div class="hero-actions"><button class="primary" data-train-level="all" ${c.active?'':'disabled'}>▶ Gemischt starten</button><button class="secondary" data-page="add">＋ Wort hinzufügen</button></div>
        </div>
        <div class="hero-score"><div><strong>${progress}%</strong><small>in Stufe 1</small></div></div>
      </section>
      <div class="stats">
        <button class="stat" data-train-level="3"><span class="dot red"></span><div><strong>${c.red}</strong><small>Stufe 3 · Neu</small></div></button>
        <button class="stat" data-train-level="2"><span class="dot yellow"></span><div><strong>${c.yellow}</strong><small>Stufe 2 · Beidseitig</small></div></button>
        <button class="stat" data-train-level="1"><span class="dot green"></span><div><strong>${c.green}</strong><small>Stufe 1 · Sicher</small></div></button>
        <button class="stat" data-page="achievements"><span class="trophy">🏆</span><div><strong>${c.mastered}</strong><small>Erfolge</small></div></button>
      </div>
      <div class="grid2">
        <section class="panel"><div class="panel-head"><div><p class="eyebrow">SCHNELLSTART</p><h3>Was möchtest du tun?</h3></div></div>
          <div class="quick">
            <button data-page="core"><strong>4500 Kernwörter</strong><small>Frequenzbasiert bis C1 – Grundlage für flüssigeres Sprechen.</small></button>
            <button data-page="themes"><strong>Themenwortschatz</strong><small>Luftfahrt, Basketball, Reisen, Business und mehr.</small></button>
            <button data-page="pdf"><strong>Wörter aus PDF holen</strong><small>PDF hochladen, unbekannte Wörter markieren und übernehmen.</small></button>
            <button data-page="grammar"><strong>Basic Grammar</strong><small>14 kompakte Kapitel mit deutschen Erklärungen und Beispielen.</small></button>
          </div>
        </section>
        <section class="panel"><div class="panel-head"><div><p class="eyebrow">ZULETZT</p><h3>Deine Wörter</h3></div><button class="ghost" data-page="words">Alle</button></div>
          ${recent.length ? recent.map(w=>`<div class="recent-row"><span class="dot ${levelColor(w.level)}"></span><div><strong>${escapeHtml(w.english)}</strong><small>${escapeHtml(w.german)}</small></div><span>${w.mastered?'🏆 ':''}Stufe ${w.level}</span></div>`).join('') : '<div class="empty">Noch keine Wörter.</div>'}
        </section>
      </div>
    </div>`);
  }

  function addPage() {
    const a = state.add;
    return shell(`<div class="page narrow">
      ${heading('VOKABEL HINZUFÜGEN','Neues Wort oder Fachbegriff','Beliebige englische Wörter und Fachbegriffe online übersetzen, anhören und direkt zum persönlichen Trainer hinzufügen.')}
      <div class="form-grid">
        <section class="panel">
          <form id="add-form">
            <label for="english">Englisch</label>
            <div class="row"><input id="english" autocomplete="off" placeholder="z. B. achievement" value="${escapeHtml(a.english)}"><button class="secondary icon-btn" type="button" id="mic-btn" title="Englisches Wort sprechen">${a.listening?'●':'🎤'}</button><button class="secondary icon-btn" type="button" id="speak-add" title="Aussprache anhören">🔊</button></div>
            <label for="german">Deutsch</label>
            <input id="german" autocomplete="off" placeholder="z. B. Erfolg / Errungenschaft" value="${escapeHtml(a.german)}">
            <label for="translation-context">Dein Fachgebiet / Lernkontext <span class="optional">optional</span></label>
            <input id="translation-context" autocomplete="off" placeholder="z. B. Luftfahrt – Flugzeugwartung / Airbus A320" value="${escapeHtml(state.profile.translationContext || '')}">
            <small class="field-help">Die Übersetzung ist nicht auf hinterlegte Wörter begrenzt. Dieser Kontext hilft bei Fachbegriffen und mehrdeutigen Wörtern.</small>
            <div class="row form-actions"><button class="secondary" type="button" id="translate-btn" ${a.translating?'disabled':''}>${a.translating?'Übersetze …':'✨ Frei online übersetzen'}</button><button class="primary" type="submit">＋ Hinzufügen</button></div>
          </form>
          <div class="level-hint"><span class="dot red"></span> Neue Wörter starten in Stufe 3 mit Serie 0/5.</div>
          ${a.status ? `<div class="status">${escapeHtml(a.status)}</div>` : ''}
        </section>
        <section class="panel"><div class="panel-head"><div><p class="eyebrow">LERNSYSTEM</p><h3>Deine Regeln</h3></div></div>
          <div class="rule-list">
            <div><span class="dot red"></span><b>Stufe 3</b><small>5× richtig → Stufe 2. Fehler bleibt in Stufe 3.</small></div>
            <div><span class="dot yellow"></span><b>Stufe 2</b><small>Deutsch ↔ Englisch. 5× richtig → Stufe 1. Ein Fehler → Stufe 3.</small></div>
            <div><span class="dot green"></span><b>Stufe 1</b><small>Deutsch ↔ Englisch. Ein Fehler → Stufe 2. 5× richtig → 🏆 Erfolg.</small></div>
          </div>
        </section>
      </div>
    </div>`);
  }

  function filteredTrainerWords() {
    return state.words.filter(w => w.active && (state.trainer.levelFilter === 'all' || String(w.level) === state.trainer.levelFilter));
  }

  function directionFor(word) {
    if (word.level === 3) return 'de-en';
    return Math.random() < 0.5 ? 'de-en' : 'en-de';
  }

  function initTrainer(force) {
    const eligible = filteredTrainerWords();
    const ids = new Set(eligible.map(w=>w.id));
    if (force || !state.trainer.queue.length || state.trainer.queue.every(item => !ids.has(item.id))) {
      state.trainer.queue = shuffle(eligible).map(w => ({id:w.id, direction:directionFor(w)}));
      state.trainer.index = 0; state.trainer.result = null; state.trainer.answer = ''; state.trainer.revealed = false; state.trainer.exampleLoading = false;
    }
  }

  function currentTrainerEntry() { return state.trainer.queue[state.trainer.index] || null; }
  function currentTrainerWord() { const entry=currentTrainerEntry(); return entry ? state.words.find(w=>w.id===entry.id) : null; }

  function trainerPage() {
    initTrainer(false);
    const t = state.trainer;
    const eligible = filteredTrainerWords();
    const filterButtons = [['all','Alle'],['3','🔴 Nur Stufe 3'],['2','🟡 Nur Stufe 2'],['1','🟢 Nur Stufe 1']];
    if (!eligible.length) return shell(`<div class="page narrow">${heading('TRAINER','Keine Wörter in dieser Auswahl','Wähle eine andere Stufe oder füge neue Wörter hinzu.')}
      <div class="trainer-filters">${filterButtons.map(([k,l])=>`<button data-trainer-level="${k}" class="${t.levelFilter===k?'active':''}">${l}</button>`).join('')}</div>
      <div class="empty panel"><button class="primary" data-page="add">＋ Wort hinzufügen</button></div></div>`);
    if (t.index >= t.queue.length) return shell(`<div class="page narrow">${heading('RUNDE GESCHAFFT','Runde abgeschlossen','Du hast alle Wörter dieser Auswahl einmal bearbeitet.')}
      <section class="panel finish-card"><div class="finish-icon">✓</div><h2>Runde geschafft</h2><p class="subtitle">Starte direkt noch eine Runde oder wechsle die Stufe.</p><button class="primary" id="new-round">Neue Runde</button></section></div>`);

    const entry = currentTrainerEntry();
    const word = currentTrainerWord();
    if (!word || !entry) { initTrainer(true); return trainerPage(); }
    const deToEn = entry.direction === 'de-en';
    const prompt = deToEn ? word.german : word.english;
    const expected = deToEn ? word.english : word.german;
    const question = deToEn ? 'Wie heißt das auf Englisch?' : 'Was bedeutet das auf Deutsch?';
    const placeholder = deToEn ? 'Englisches Wort eingeben' : 'Deutsche Übersetzung eingeben';
    const reveal = expected;
    const example = word.exampleEn || fallbackExample(word.english);
    const feedbackTitle = t.result === 'mastered' ? '🏆 Gemeistert!' : t.result === 'correct' ? '✓ Richtig' : '✕ Noch nicht';
    const feedback = t.result ? `<div class="feedback">
      <div><strong>${feedbackTitle}</strong>${t.result==='wrong'?`<span>Richtig wäre: <b>${escapeHtml(expected)}</b></span>`:''}<span>Aktuell: Stufe ${word.level} · Serie ${word.streak}/5${word.mastered?' · 🏆 bereits gemeistert':''}</span></div>
      <button class="primary" id="next-word">Weiter →</button>
      <div class="example-box"><div><span class="eyebrow">BEISPIELSATZ</span><p>${escapeHtml(example)}</p>${t.exampleLoading?'<small>Suche nach einem besseren Beispielsatz …</small>':''}</div><button class="ghost icon-btn" id="speak-example" title="Beispielsatz anhören">🔊</button></div>
    </div>` : '';

    return shell(`<div class="page narrow">
      ${heading('TRAINER', t.levelFilter==='all'?'Gemischte Runde':`Stufe ${t.levelFilter} trainieren`, t.levelFilter==='3'?'Stufe 3 trainiert Deutsch → Englisch.':'Ab Stufe 2 werden beide Übersetzungsrichtungen gemischt.')}
      <div class="trainer-filters">${filterButtons.map(([k,l])=>`<button data-trainer-level="${k}" class="${t.levelFilter===k?'active':''}">${l}</button>`).join('')}</div>
      <div class="trainer-meta"><div class="segmented"><button data-mode="write" class="${t.mode==='write'?'active':''}">Schreiben</button><button data-mode="think" class="${t.mode==='think'?'active':''}">Denken</button></div><span>${t.index+1} / ${t.queue.length}</span></div>
      <div class="progress"><span style="width:${Math.round(t.index/t.queue.length*100)}%"></span></div>
      <section class="trainer-card">
        <div class="trainer-top"><span class="badge"><span class="dot ${levelColor(word.level)}"></span>Stufe ${word.level} · ${word.streak}/5</span>${!deToEn?'<button class="ghost icon-btn" id="speak-current" title="Englische Aussprache">🔊</button>':''}</div>
        <p class="question">${question}</p><h2 class="prompt">${escapeHtml(prompt)}</h2>
        ${t.mode==='write' ? `<form id="answer-form" class="answer-row"><input id="answer" autocomplete="off" autofocus placeholder="${placeholder}" value="${escapeHtml(t.answer)}" ${t.result?'disabled':''}>${t.result?'':'<button class="primary">Prüfen</button>'}</form>` : `<div class="think">${!t.revealed?'<button class="secondary" id="reveal-answer">Antwort anzeigen</button>':!t.result?`<div class="revealed">${escapeHtml(reveal)} ${deToEn?'<button class="ghost icon-btn" id="speak-revealed">🔊</button>':''}</div><div class="think-actions"><button class="danger" data-grade="wrong">✕ Nicht gewusst</button><button class="success" data-grade="correct">✓ Gewusst</button></div>`:''}</div>`}
        ${feedback}
      </section>
      <div class="trainer-rules"><span>🔴 Fehler: bleibt 3</span><span>🟡 Fehler: → 3</span><span>🟢 Fehler: → 2</span><span>🟢 5× richtig: 🏆 Erfolg</span></div>
      ${word.level===1 ? '<button class="ghost" id="pause-current">Wort aus aktivem Training entfernen</button>' : ''}
    </div>`);
  }

  function wordsPage() {
    const q = state.search.toLowerCase();
    let list = state.words.filter(w => w.english.toLowerCase().includes(q) || w.german.toLowerCase().includes(q));
    if (state.filter === 'inactive') list = list.filter(w => !w.active);
    else if (state.filter === 'mastered') list = list.filter(w => w.mastered);
    else if (state.filter !== 'all') list = list.filter(w => w.active && String(w.level) === state.filter);
    if (state.sort === 'new') list.sort((a,b) => b.createdAt.localeCompare(a.createdAt));
    if (state.sort === 'hard') list.sort((a,b) => b.level-a.level || b.wrong-a.wrong);
    if (state.sort === 'az') list.sort((a,b) => a.english.localeCompare(b.english));
    return shell(`<div class="page">
      ${heading('BIBLIOTHEK','Meine Wörter',`${state.words.length} Wörter gespeichert · lokal in diesem Browser.`)}
      <div class="toolbar"><input id="word-search" placeholder="Englisch oder Deutsch suchen …" value="${escapeHtml(state.search)}"><select id="word-sort"><option value="new" ${state.sort==='new'?'selected':''}>Neueste zuerst</option><option value="hard" ${state.sort==='hard'?'selected':''}>Schwierigste zuerst</option><option value="az" ${state.sort==='az'?'selected':''}>A–Z</option></select></div>
      <div class="filters">${[['all','Alle'],['3','🔴 Stufe 3'],['2','🟡 Stufe 2'],['1','🟢 Stufe 1'],['mastered','🏆 Gemeistert'],['inactive','Pausiert']].map(([k,l]) => `<button data-filter="${k}" class="${state.filter===k?'active':''}">${l}</button>`).join('')}<button id="export-btn">Backup exportieren</button></div>
      <div class="word-list">${list.length ? list.map(w => `<div class="word-item ${w.active?'':'inactive'}">
        <div class="word-main"><strong>${escapeHtml(w.english)} ${w.mastered?'<span title="Gemeistert">🏆</span>':''}</strong><small>${escapeHtml(w.german)}</small></div>
        <span class="badge"><span class="dot ${levelColor(w.level)}"></span>Stufe ${w.level}</span>
        <div class="streak-cell"><small>${w.streak}/5</small><div class="mini-bars">${[0,1,2,3,4].map(i=>`<i class="${i<w.streak?'on':''}"></i>`).join('')}</div></div>
        <div class="status-cell"><button class="ghost" data-toggle="${w.id}">${w.active?'Aktiv':'Pausiert'}</button></div>
        <div class="actions"><button class="ghost" data-speak="${w.id}" title="Aussprache">🔊</button><button class="danger" data-delete="${w.id}" title="Löschen">×</button></div>
      </div>`).join('') : '<div class="empty">Keine passenden Wörter gefunden.</div>'}</div>
    </div>`);
  }

  function achievementsPage() {
    const list = [...state.achievements].sort((a,b)=>(b.lastMasteredAt||'').localeCompare(a.lastMasteredAt||''));
    return shell(`<div class="page">
      ${heading('ERFOLGE','Gemeisterte Wörter',`${list.length} Wörter wurden in Stufe 1 mindestens einmal mit einer zusätzlichen 5er-Serie abgeschlossen.`)}
      <div class="achievement-summary"><div class="big-trophy">🏆</div><div><strong>${list.length}</strong><span>dauerhaft gespeicherte Erfolge</span></div></div>
      <div class="word-list achievements-list">${list.length ? list.map(a=>`<div class="achievement-row"><div><strong>${escapeHtml(a.english)}</strong><small>${escapeHtml(a.german)}</small></div><div><b>${a.times || 1}× gemeistert</b><small>zuletzt ${formatDate(a.lastMasteredAt)}</small></div><button class="ghost" data-ach-speak="${escapeHtml(a.english)}">🔊</button></div>`).join('') : '<div class="empty">Noch kein Wort gemeistert. In Stufe 1 brauchst du fünf weitere richtige Antworten in Folge.</div>'}</div>
    </div>`);
  }

  function corePage() {
    const c = state.core;
    let words = c.words;
    const q = c.search.trim().toLowerCase();
    if (q) words = words.filter(w => w.word.toLowerCase().includes(q));
    if (c.cefr !== 'all') words = words.filter(w=>String(w.cefr).toUpperCase()===c.cefr);
    const perPage = 80;
    const pages = Math.max(1,Math.ceil(words.length/perPage));
    if (c.page >= pages) c.page = pages-1;
    const visible = words.slice(c.page*perPage,(c.page+1)*perPage);
    const known = new Set(state.words.map(w=>w.english.toLowerCase()));
    return shell(`<div class="page">
      ${heading('KERNWORTSCHATZ',`${CORE_COUNT.toLocaleString('de-DE')} wichtige Wörter`,'Frequenzbasierter Wortschatz bis C1 als breite Grundlage für B2–C1 und flüssigeres Sprechen.')}
      <section class="core-hero"><div><strong>${c.loaded ? c.words.length.toLocaleString('de-DE') : CORE_COUNT.toLocaleString('de-DE')}</strong><span>Wörter im Kernpaket</span></div><p>Die Reihenfolge folgt der Häufigkeit. A1–B1 stabilisieren die Basis; B2–C1 erweitern deinen aktiven Wortschatz.</p></section>
      <div class="toolbar core-toolbar"><input id="core-search" placeholder="In 4.500 Wörtern suchen …" value="${escapeHtml(c.search)}"><select id="core-cefr"><option value="all">Alle CEFR-Stufen</option>${['A1','A2','B1','B2','C1'].map(x=>`<option value="${x}" ${c.cefr===x?'selected':''}>${x}</option>`).join('')}</select></div>
      ${c.loading ? '<div class="loading-card">4.500 Kernwörter werden geladen …</div>' : ''}
      ${c.error ? `<div class="notice warning">${escapeHtml(c.error)}</div>` : ''}
      ${!c.loading && visible.length ? `<div class="core-list">${visible.map(item=>{
        const cached=getCachedTranslation(item.word) || FALLBACK_DICTIONARY[item.word.toLowerCase()] || '';
        const isKnown=known.has(item.word.toLowerCase());
        return `<div class="core-row"><div class="rank">#${item.rank}</div><div class="core-main"><strong>${escapeHtml(item.word)}</strong><small>${cached?escapeHtml(cached):`${item.cefr || '–'} · ${item.pos || 'Wort'}`}</small></div><span class="cefr">${escapeHtml(item.cefr || '–')}</span><button class="ghost icon-btn" data-core-speak="${escapeHtml(item.word)}">🔊</button>${cached?'':`<button class="ghost" data-core-translate="${escapeHtml(item.word)}" ${c.translating===item.word?'disabled':''}>${c.translating===item.word?'…':'Deutsch'}</button>`}<button class="${isKnown?'ghost':'primary'}" data-core-add="${escapeHtml(item.word)}" ${isKnown||c.adding===item.word?'disabled':''}>${isKnown?'✓ Gespeichert':c.adding===item.word?'…':'+ Hinzufügen'}</button></div>`;
      }).join('')}</div><div class="pagination"><button class="secondary" data-core-page="${c.page-1}" ${c.page<=0?'disabled':''}>← Zurück</button><span>Seite ${c.page+1} / ${pages}</span><button class="secondary" data-core-page="${c.page+1}" ${c.page>=pages-1?'disabled':''}>Weiter →</button></div>` : (!c.loading?'<div class="empty">Keine Wörter gefunden.</div>':'')}
      <div class="notice">Für diese Testversion werden die 4.500 Wörter über eine Cloudflare Function geladen. Die deutsche Übersetzung wird frei online geladen und nur lokal zwischengespeichert. Der 4.500er-Wortschatz begrenzt den Übersetzer nicht; auch Fachbegriffe können hinzugefügt werden.</div>
    </div>`);
  }

  function themesPage() {
    const current = THEMES.find(t=>t.id===state.themes.selected) || THEMES[0];
    const q = state.themes.search.toLowerCase().trim();
    const list = current.words.filter(([en,de])=>!q || en.toLowerCase().includes(q) || de.toLowerCase().includes(q));
    const known = new Set(state.words.map(w=>w.english.toLowerCase()));
    return shell(`<div class="page">
      ${heading('THEMENWORTSCHATZ','Wörter nach Thema','Zusätzliche Pakete neben dem 4.500er-Kernwortschatz. Jedes Paket kann einzeln oder komplett übernommen werden.')}
      <div class="theme-tabs">${THEMES.map(t=>`<button data-theme="${t.id}" class="${current.id===t.id?'active':''}"><span>${t.icon}</span><b>${t.title}</b><small>${t.words.length} Wörter</small></button>`).join('')}</div>
      <section class="theme-head"><div><span class="theme-icon">${current.icon}</span><div><h2>${current.title}</h2><p>${current.description}</p></div></div><button class="primary" id="add-theme-all" ${state.themes.addingAll?'disabled':''}>${state.themes.addingAll?'Füge hinzu …':`＋ Alle ${current.words.length} hinzufügen`}</button></section>
      <div class="toolbar" style="grid-template-columns:1fr"><input id="theme-search" placeholder="In diesem Thema suchen …" value="${escapeHtml(state.themes.search)}"></div>
      <div class="theme-word-grid">${list.map(([en,de,example])=>`<div class="theme-word"><div><strong>${escapeHtml(en)}</strong><small>${escapeHtml(de)}</small><p>${escapeHtml(example)}</p></div><div class="theme-actions"><button class="ghost icon-btn" data-theme-speak="${escapeHtml(en)}">🔊</button><button class="${known.has(en.toLowerCase())?'ghost':'primary'}" data-theme-add="${escapeHtml(en)}" ${known.has(en.toLowerCase())?'disabled':''}>${known.has(en.toLowerCase())?'✓':'＋'}</button></div></div>`).join('')}</div>
    </div>`);
  }

  function pdfPage() {
    const p = state.pdf;
    const q = p.search.toLowerCase().trim();
    const list = p.words.filter(item=>!q || item.word.includes(q));
    return shell(`<div class="page">
      ${heading('PDF IMPORT','Wörter aus einem PDF','Text aus einem PDF auslesen, unbekannte englische Wörter auswählen und automatisch als neue Vokabeln hinzufügen. Auch Fachbegriffe werden frei online übersetzt.')}
      <section class="panel context-panel"><label for="pdf-context">Fachgebiet / Dokumentkontext <span class="optional">optional</span></label><input id="pdf-context" autocomplete="off" placeholder="z. B. Luftfahrt – Wartungshandbuch / Hydraulik" value="${escapeHtml(state.profile.translationContext || '')}"><small class="field-help">Der Kontext gilt auch für Wörter, die du aus diesem PDF übernimmst.</small></section>
      <section class="upload-card">
        <div class="upload-icon">PDF</div><div><h3>${p.fileName ? escapeHtml(p.fileName) : 'PDF auswählen'}</h3><p>Am besten funktionieren PDFs mit echtem Text. Eingescannte Bild-PDFs benötigen später zusätzlich OCR.</p></div>
        <label class="primary file-button">PDF auswählen<input id="pdf-input" type="file" accept="application/pdf" hidden></label>
      </section>
      ${p.status ? `<div class="status">${escapeHtml(p.status)}</div>` : ''}
      ${p.words.length ? `<div class="pdf-toolbar"><input id="pdf-search" placeholder="Erkannte Wörter filtern …" value="${escapeHtml(p.search)}"><div><button class="ghost" id="pdf-select-all">Alle sichtbaren</button><button class="ghost" id="pdf-clear">Auswahl löschen</button><button class="primary" id="pdf-add-selected" ${p.adding||!p.selected.size?'disabled':''}>${p.adding?'Übersetze & speichere …':`${p.selected.size} Wörter hinzufügen`}</button></div></div>
      <div class="pdf-words">${list.map(item=>`<button class="pdf-chip ${p.selected.has(item.word)?'selected':''}" data-pdf-word="${escapeHtml(item.word)}"><b>${escapeHtml(item.word)}</b><small>${item.count}×</small></button>`).join('')}</div>` : '<div class="notice">PDF.js wird erst geladen, wenn du wirklich ein PDF auswählst. Dadurch kann ein PDF-Problem niemals wieder die gesamte App beim Start blockieren.</div>'}
    </div>`);
  }

  function grammarPage() {
    return shell(`<div class="page">
      ${heading('BASIC GRAMMAR','Englische Grammatik – kompakt','Die wichtigsten Grundlagen für sichere Sätze. Kurze Regeln, deutsche Erklärung und sofort verständliche Beispiele.')}
      <div class="grammar-layout"><aside class="grammar-nav">${GRAMMAR.map(g=>`<button data-grammar="${g.id}" class="${state.grammarOpen===g.id?'active':''}"><b>${g.title}</b><small>${g.level}</small></button>`).join('')}</aside>
      <section class="grammar-content">${renderGrammarLesson(GRAMMAR.find(g=>g.id===state.grammarOpen)||GRAMMAR[0])}</section></div>
    </div>`);
  }

  function renderGrammarLesson(g) {
    return `<div class="grammar-card"><div class="grammar-title"><span class="cefr">${g.level}</span><h2>${g.title}</h2><p>${g.summary}</p></div>
      <h3>Merke dir</h3><ul>${g.rules.map(r=>`<li>${escapeHtml(r)}</li>`).join('')}</ul>
      <h3>Beispiele</h3><div class="grammar-examples">${g.examples.map(([en,de])=>`<div><div><strong>${escapeHtml(en)}</strong><small>${escapeHtml(de)}</small></div><button class="ghost icon-btn" data-grammar-speak="${escapeHtml(en)}">🔊</button></div>`).join('')}</div>
    </div>`;
  }

  function render() {
    try {
      const pages = { home:homePage, trainer:trainerPage, add:addPage, words:wordsPage, achievements:achievementsPage, core:corePage, themes:themesPage, pdf:pdfPage, grammar:grammarPage };
      app.innerHTML = (pages[state.page] || homePage)();
      bind();
      if (state.page === 'trainer' && state.trainer.mode === 'write' && !state.trainer.result) setTimeout(() => document.getElementById('answer')?.focus(), 0);
      if (state.page === 'core' && !state.core.loaded && !state.core.loading) setTimeout(loadCoreWords,0);
    } catch (error) {
      console.error(error);
      app.innerHTML = `<div class="fatal-error" style="position:static;margin:20px">Die App hat einen Fehler erkannt statt leer zu bleiben: ${escapeHtml(error && error.message ? error.message : String(error))}</div>`;
    }
  }

  function setPage(page) {
    state.page = page;
    if (page === 'trainer') initTrainer(true);
    render();
  }

  function bind() {
    document.querySelectorAll('[data-page]').forEach(el => el.addEventListener('click', () => setPage(el.dataset.page)));
    document.querySelectorAll('[data-train-level]').forEach(el => el.addEventListener('click', () => { state.trainer.levelFilter=el.dataset.trainLevel; state.page='trainer'; initTrainer(true); render(); }));

    const addForm = document.getElementById('add-form');
    if (addForm) {
      const english = document.getElementById('english'); const german = document.getElementById('german');
      english.addEventListener('input', e => state.add.english = e.target.value); german.addEventListener('input', e => state.add.german = e.target.value);
      const translationContext = document.getElementById('translation-context');
      translationContext?.addEventListener('input', e => { state.profile.translationContext = e.target.value; saveProfile(); });
      addForm.addEventListener('submit', e => {
        e.preventDefault(); state.add.english=english.value.trim(); state.add.german=german.value.trim();
        if(!state.add.english||!state.add.german){state.add.status='Bitte Englisch und Deutsch ausfüllen.';render();return;}
        if(hasWord(state.add.english)){state.add.status='Dieses englische Wort ist bereits gespeichert.';render();return;}
        const word=createWord(state.add.english,state.add.german,'manual',{exampleEn:LOCAL_EXAMPLES[state.add.english.toLowerCase()]||''}); state.words.unshift(word); saveWords(); prefetchExample(word);
        const added=word.english; state.add={english:'',german:'',status:'',translating:false,listening:false}; showToast(`„${added}“ wurde hinzugefügt.`);
      });
      document.getElementById('translate-btn')?.addEventListener('click', async()=>{
        state.add.english=english.value.trim(); if(!state.add.english){state.add.status='Bitte zuerst ein englisches Wort eingeben.';render();return;}
        state.add.translating=true;state.add.status='';render();
        try{state.add.german=await translateWord(state.add.english);state.add.status=state.profile.translationContext ? 'Übersetzung eingefügt. Dein Fachkontext wurde mitgesendet – bitte kurz prüfen.' : 'Online-Übersetzung eingefügt. Bitte kurz prüfen.';}catch(err){state.add.status=err.message||'Übersetzung nicht verfügbar.';}
        state.add.translating=false;render();
      });
      document.getElementById('mic-btn')?.addEventListener('click',startSpeechRecognition);
      document.getElementById('speak-add')?.addEventListener('click',()=>{const value=document.getElementById('english')?.value.trim(); if(value)speak(value);});
    }

    document.querySelectorAll('[data-mode]').forEach(el=>el.addEventListener('click',()=>{state.trainer.mode=el.dataset.mode;state.trainer.result=null;state.trainer.revealed=false;state.trainer.answer='';render();}));
    document.querySelectorAll('[data-trainer-level]').forEach(el=>el.addEventListener('click',()=>{state.trainer.levelFilter=el.dataset.trainerLevel;initTrainer(true);render();}));
    document.getElementById('answer-form')?.addEventListener('submit',e=>{e.preventDefault();const input=document.getElementById('answer');state.trainer.answer=input.value;const word=currentTrainerWord(),entry=currentTrainerEntry();if(word&&entry){const expected=entry.direction==='de-en'?word.english:word.german;grade(word,correctAnswer(input.value,expected));}});
    document.getElementById('reveal-answer')?.addEventListener('click',()=>{state.trainer.revealed=true;render();});
    document.querySelectorAll('[data-grade]').forEach(el=>el.addEventListener('click',()=>{const word=currentTrainerWord();if(word)grade(word,el.dataset.grade==='correct');}));
    document.getElementById('next-word')?.addEventListener('click',nextTrainerWord);
    document.getElementById('new-round')?.addEventListener('click',()=>{initTrainer(true);render();});
    document.getElementById('speak-current')?.addEventListener('click',()=>{const word=currentTrainerWord();if(word)speak(word.english);});
    document.getElementById('speak-revealed')?.addEventListener('click',()=>{const word=currentTrainerWord();if(word)speak(word.english);});
    document.getElementById('speak-example')?.addEventListener('click',()=>{const word=currentTrainerWord();if(word)speak(word.exampleEn||fallbackExample(word.english));});
    document.getElementById('pause-current')?.addEventListener('click',()=>{const word=currentTrainerWord();if(word){word.active=false;word.updatedAt=new Date().toISOString();saveWords();showToast('Wort wurde pausiert.');initTrainer(true);}});

    document.getElementById('word-search')?.addEventListener('input',e=>{state.search=e.target.value;render();});
    document.getElementById('word-sort')?.addEventListener('change',e=>{state.sort=e.target.value;render();});
    document.querySelectorAll('[data-filter]').forEach(el=>el.addEventListener('click',()=>{state.filter=el.dataset.filter;render();}));
    document.querySelectorAll('[data-toggle]').forEach(el=>el.addEventListener('click',()=>{const w=state.words.find(x=>x.id===el.dataset.toggle);if(w){w.active=!w.active;w.updatedAt=new Date().toISOString();saveWords();render();}}));
    document.querySelectorAll('[data-delete]').forEach(el=>el.addEventListener('click',()=>{const w=state.words.find(x=>x.id===el.dataset.delete);if(w&&confirm(`„${w.english}“ wirklich löschen?`)){state.words=state.words.filter(x=>x.id!==w.id);saveWords();render();}}));
    document.querySelectorAll('[data-speak]').forEach(el=>el.addEventListener('click',()=>{const w=state.words.find(x=>x.id===el.dataset.speak);if(w)speak(w.english);}));
    document.querySelectorAll('[data-ach-speak]').forEach(el=>el.addEventListener('click',()=>speak(el.dataset.achSpeak)));
    document.getElementById('export-btn')?.addEventListener('click',exportWords);

    document.getElementById('core-search')?.addEventListener('input',e=>{state.core.search=e.target.value;state.core.page=0;render();});
    document.getElementById('core-cefr')?.addEventListener('change',e=>{state.core.cefr=e.target.value;state.core.page=0;render();});
    document.querySelectorAll('[data-core-page]').forEach(el=>el.addEventListener('click',()=>{state.core.page=Math.max(0,Number(el.dataset.corePage)||0);render();window.scrollTo({top:0,behavior:'smooth'});}));
    document.querySelectorAll('[data-core-speak]').forEach(el=>el.addEventListener('click',()=>speak(el.dataset.coreSpeak)));
    document.querySelectorAll('[data-core-translate]').forEach(el=>el.addEventListener('click',()=>translateCoreWord(el.dataset.coreTranslate)));
    document.querySelectorAll('[data-core-add]').forEach(el=>el.addEventListener('click',()=>addCoreWord(el.dataset.coreAdd)));

    document.querySelectorAll('[data-theme]').forEach(el=>el.addEventListener('click',()=>{state.themes.selected=el.dataset.theme;state.themes.search='';render();}));
    document.getElementById('theme-search')?.addEventListener('input',e=>{state.themes.search=e.target.value;render();});
    document.querySelectorAll('[data-theme-speak]').forEach(el=>el.addEventListener('click',()=>speak(el.dataset.themeSpeak)));
    document.querySelectorAll('[data-theme-add]').forEach(el=>el.addEventListener('click',()=>addThemeWord(el.dataset.themeAdd)));
    document.getElementById('add-theme-all')?.addEventListener('click',addCurrentTheme);

    document.getElementById('pdf-context')?.addEventListener('input',e=>{state.profile.translationContext=e.target.value;saveProfile();});
    document.getElementById('pdf-input')?.addEventListener('change',e=>{const file=e.target.files&&e.target.files[0];if(file)processPdf(file);});
    document.getElementById('pdf-search')?.addEventListener('input',e=>{state.pdf.search=e.target.value;render();});
    document.querySelectorAll('[data-pdf-word]').forEach(el=>el.addEventListener('click',()=>{const w=el.dataset.pdfWord;state.pdf.selected.has(w)?state.pdf.selected.delete(w):state.pdf.selected.add(w);render();}));
    document.getElementById('pdf-select-all')?.addEventListener('click',()=>{const q=state.pdf.search.toLowerCase().trim();state.pdf.words.filter(x=>!q||x.word.includes(q)).forEach(x=>state.pdf.selected.add(x.word));render();});
    document.getElementById('pdf-clear')?.addEventListener('click',()=>{state.pdf.selected.clear();render();});
    document.getElementById('pdf-add-selected')?.addEventListener('click',addPdfSelected);

    document.querySelectorAll('[data-grammar]').forEach(el=>el.addEventListener('click',()=>{state.grammarOpen=el.dataset.grammar;render();}));
    document.querySelectorAll('[data-grammar-speak]').forEach(el=>el.addEventListener('click',()=>speak(el.dataset.grammarSpeak)));
  }

  function hasWord(english) { return state.words.some(w=>w.english.toLowerCase()===String(english).toLowerCase()); }

  function recordAchievement(word) {
    const now=new Date().toISOString();
    let a=state.achievements.find(x=>x.wordId===word.id || x.english.toLowerCase()===word.english.toLowerCase());
    if(a){a.times=(a.times||1)+1;a.lastMasteredAt=now;a.german=word.german;} else {a={id:makeId(),wordId:word.id,english:word.english,german:word.german,firstMasteredAt:now,lastMasteredAt:now,times:1};state.achievements.push(a);}
    word.mastered=true; saveAchievements();
  }

  function grade(word, ok) {
    if (state.trainer.result) return;
    if (ok) {
      word.correct=(word.correct||0)+1; word.streak=(word.streak||0)+1;
      if(word.streak>=5){
        if(word.level===3){word.level=2;word.streak=0;state.trainer.result='correct';}
        else if(word.level===2){word.level=1;word.streak=0;state.trainer.result='correct';}
        else {recordAchievement(word);word.streak=0;state.trainer.result='mastered';}
      } else state.trainer.result='correct';
    } else {
      word.wrong=(word.wrong||0)+1; word.streak=0;
      if(word.level===2) word.level=3; else if(word.level===1) word.level=2;
      state.trainer.result='wrong';
    }
    word.updatedAt=new Date().toISOString();saveWords();render();prefetchExample(word,true);
  }

  function nextTrainerWord(){state.trainer.index+=1;state.trainer.result=null;state.trainer.answer='';state.trainer.revealed=false;state.trainer.exampleLoading=false;render();}

  function fallbackExample(english) {
    const key=String(english).toLowerCase();
    return LOCAL_EXAMPLES[key] || `I want to use the word “${english}” correctly in English.`;
  }

  async function prefetchExample(word, showLoading) {
    if(!word || word.exampleEn || String(word.english).includes(' ')) return;
    if(showLoading){state.trainer.exampleLoading=true;render();}
    try{
      const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),6500);
      const res=await fetch(`/api/example?q=${encodeURIComponent(word.english)}`,{signal:controller.signal});clearTimeout(timer);
      if(res.ok){const data=await res.json();if(data.example){word.exampleEn=data.example;saveWords();}}
    }catch(_){}
    state.trainer.exampleLoading=false;if(state.page==='trainer')render();
  }

  function speak(text) {
    if(!text)return;
    if(!('speechSynthesis' in window)){showToast('Aussprache wird in diesem Browser nicht unterstützt.');return;}
    window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang='en-US';u.rate=.88;window.speechSynthesis.speak(u);
  }

  function startSpeechRecognition() {
    const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!Recognition){state.add.status='Spracherkennung wird hier nicht unterstützt. Nutze am besten Chrome oder Edge.';render();return;}
    try{
      const rec=new Recognition();rec.lang='en-US';rec.interimResults=false;rec.continuous=false;state.add.listening=true;state.add.status='Sprich jetzt ein englisches Wort …';render();
      rec.onresult=e=>{state.add.english=(e.results?.[0]?.[0]?.transcript||'').trim();state.add.listening=false;state.add.status='Wort erkannt. Du kannst es jetzt übersetzen.';render();};
      rec.onerror=()=>{state.add.listening=false;state.add.status='Mikrofon konnte nicht verwendet werden. Prüfe die Browser-Berechtigung.';render();};
      rec.onend=()=>{if(state.add.listening){state.add.listening=false;render();}};rec.start();
    }catch(_){state.add.listening=false;state.add.status='Spracherkennung konnte nicht gestartet werden.';render();}
  }

  function translationCacheKey(text, context) {
    return `${String(text || '').toLowerCase().trim()}::${String(context || '').toLowerCase().trim()}`;
  }

  function getCachedTranslation(text, context) {
    const ctx = context === undefined ? (state.profile.translationContext || '') : context;
    return state.translationCache[translationCacheKey(text, ctx)] || '';
  }

  async function translateWord(text, overrideContext) {
    const cleanText = String(text || '').trim();
    const contextText = String(overrideContext === undefined ? (state.profile.translationContext || '') : overrideContext).trim();
    if (!cleanText) throw new Error('Bitte zuerst ein englisches Wort oder einen Fachbegriff eingeben.');
    const key = translationCacheKey(cleanText, contextText);
    if (state.translationCache[key]) return state.translationCache[key];

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 10000);
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ text: cleanText, source: 'EN', target: 'DE', context: contextText }),
        signal: controller.signal
      });
      clearTimeout(timer);
      if (res.ok) {
        const data = await res.json();
        if (data.translation) {
          state.translationCache[key] = data.translation;
          saveTranslationCache();
          return data.translation;
        }
      }
    } catch (_) {}

    // Nur als Offline-/Provider-Fallback: Die lokale Liste begrenzt die Übersetzung NICHT mehr.
    const fallback = FALLBACK_DICTIONARY[cleanText.toLowerCase()];
    if (fallback) {
      state.translationCache[key] = fallback;
      saveTranslationCache();
      return fallback;
    }
    throw new Error('Die freie Online-Übersetzung ist gerade nicht erreichbar. Du kannst die deutsche Bedeutung trotzdem manuell eintragen.');
  }

  async function loadCoreWords() {
    state.core.loading=true;state.core.error='';render();
    try{
      const res=await fetch('/api/core-words');if(!res.ok)throw new Error('Kernwortschatz konnte nicht geladen werden.');
      const data=await res.json();
      if(!Array.isArray(data.words)||data.words.length!==CORE_COUNT)throw new Error(`Es wurden ${data.words?.length||0} statt ${CORE_COUNT} Wörter geliefert.`);
      state.core.words=data.words;state.core.loaded=true;
    }catch(err){
      state.core.words=CORE_FALLBACK.map(([word,,cefr],i)=>({word,cefr,rank:i+1,pos:''}));state.core.loaded=true;state.core.error=`Online-Liste nicht erreichbar. Die App bleibt nutzbar und zeigt vorübergehend ${state.core.words.length} eingebaute Wörter. Nach Cloudflare-Deploy sollten exakt ${CORE_COUNT} geladen werden.`;
    }
    state.core.loading=false;render();
  }

  async function translateCoreWord(word) {
    state.core.translating=word;render();try{await translateWord(word);showToast(`„${word}“ wurde übersetzt.`);}catch(err){showToast(err.message||'Übersetzung nicht verfügbar.');}state.core.translating='';render();
  }

  async function addCoreWord(english) {
    if(hasWord(english))return;state.core.adding=english;render();
    try{const german=await translateWord(english);const meta=state.core.words.find(x=>x.word===english)||{};const w=createWord(english,german,'core',{cefr:meta.cefr||'',exampleEn:LOCAL_EXAMPLES[english.toLowerCase()]||''});state.words.unshift(w);saveWords();prefetchExample(w);showToast(`„${english}“ wurde hinzugefügt.`);}catch(err){showToast(err.message||'Wort konnte nicht hinzugefügt werden.');}
    state.core.adding='';render();
  }

  function currentTheme(){return THEMES.find(t=>t.id===state.themes.selected)||THEMES[0];}
  function addThemeWord(english){const item=currentTheme().words.find(x=>x[0]===english);if(!item||hasWord(english))return;state.words.unshift(createWord(item[0],item[1],`theme:${currentTheme().id}`,{exampleEn:item[2]}));saveWords();showToast(`„${english}“ wurde hinzugefügt.`);}
  async function addCurrentTheme(){const theme=currentTheme();state.themes.addingAll=true;render();let added=0;theme.words.forEach(item=>{if(!hasWord(item[0])){state.words.unshift(createWord(item[0],item[1],`theme:${theme.id}`,{exampleEn:item[2]}));added++;}});saveWords();state.themes.addingAll=false;showToast(`${added} Wörter aus „${theme.title}“ hinzugefügt.`);}

  async function processPdf(file) {
    state.pdf.fileName=file.name;state.pdf.status='PDF wird gelesen …';state.pdf.loading=true;state.pdf.words=[];state.pdf.selected=new Set();render();
    try{
      const pdfjsLib=await import('https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.min.mjs');
      pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs';
      const bytes=new Uint8Array(await file.arrayBuffer());const pdf=await pdfjsLib.getDocument({data:bytes}).promise;let text='';
      for(let i=1;i<=pdf.numPages;i++){state.pdf.status=`Lese Seite ${i} von ${pdf.numPages} …`;render();const page=await pdf.getPage(i);const content=await page.getTextContent();text+=' '+content.items.map(x=>x.str||'').join(' ');}
      const matches=(text.match(/[A-Za-z]+(?:['’\-][A-Za-z]+)*/g)||[]).map(x=>x.toLowerCase()).filter(x=>x.length>=2&&x.length<=35);
      const freq=new Map();matches.forEach(w=>freq.set(w,(freq.get(w)||0)+1));
      state.pdf.words=[...freq.entries()].map(([word,count])=>({word,count})).sort((a,b)=>b.count-a.count||a.word.localeCompare(b.word)).slice(0,500);
      state.pdf.status=`${state.pdf.words.length} unterschiedliche englische Wörter erkannt. Klicke die Wörter an, die du lernen möchtest.`;
    }catch(err){console.error(err);state.pdf.status='PDF konnte nicht gelesen werden. Bei gescannten PDFs ist OCR nötig; außerdem kann ein Firmen-Netzwerk das externe PDF-Modul blockieren.';}
    state.pdf.loading=false;render();
  }

  async function addPdfSelected() {
    const selected=[...state.pdf.selected].filter(w=>!hasWord(w));
    if(!selected.length){showToast('Alle ausgewählten Wörter sind bereits gespeichert.');return;}
    if(selected.length>30){showToast('Bitte maximal 30 neue Wörter pro Durchgang auswählen.');return;}
    state.pdf.adding=true;let added=0,failed=0;
    for(let i=0;i<selected.length;i++){
      const en=selected[i];state.pdf.status=`Übersetze ${i+1} von ${selected.length}: ${en}`;render();
      try{const de=await translateWord(en);const w=createWord(en,de,'pdf',{exampleEn:LOCAL_EXAMPLES[en]||''});state.words.unshift(w);added++;prefetchExample(w);}catch(_){failed++;}
    }
    saveWords();state.pdf.adding=false;state.pdf.selected.clear();state.pdf.status=`${added} Wörter hinzugefügt${failed?`, ${failed} konnten nicht automatisch übersetzt werden`:''}.`;render();
  }

  function exportWords() {
    const payload={exportedAt:new Date().toISOString(),words:state.words,achievements:state.achievements};const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='vocabfast-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),0);
  }

  render();
})();
