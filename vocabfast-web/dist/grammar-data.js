window.GRAMMAR_DATA = [
  {
    level:'A1', title:'Present Simple',
    use:'Gewohnheiten, Fakten, Fahrpläne und Dinge, die regelmäßig passieren.',
    form:'I/you/we/they + Grundform. He/she/it + Verb-s. Fragen und Verneinung mit do/does.',
    signals:['always','usually','often','sometimes','every day','never'],
    examples:['I check the weather every morning.','She flies twice a week.','Does the engine sound normal?'],
    pitfalls:['Bei he/she/it das -s nicht vergessen.','Nach does steht wieder die Grundform: Does he fly?'],
    questions:[
      ['She ___ the checklist before every flight.','checks',['check','checks','is checking'],'Regelmäßige Handlung; bei she bekommt das Verb -s.'],
      ['They ___ at the airport every Monday.','work',['works','work','are work'],'Bei they wird die Grundform benutzt.'],
      ['___ he know the procedure?','Does',['Do','Does','Is'],'Frage im Present Simple mit he: Does + Grundform.'],
      ['The rotor ___ clockwise.','turns',['turn','turns','is turn'],'Ein technischer Fakt; Singular subject rotor → turns.']
    ]
  },
  {
    level:'A1', title:'Present Continuous',
    use:'Handlungen, die gerade jetzt stattfinden, oder vorübergehende Situationen.',
    form:'am/is/are + Verb-ing.',
    signals:['now','right now','at the moment','currently','today'],
    examples:['I am reading the manual now.','They are preparing the helicopter.'],
    pitfalls:['Das Hilfsverb am/is/are darf nicht fehlen.','Nicht für allgemeine Gewohnheiten verwenden.'],
    questions:[
      ['The mechanic ___ the engine right now.','is inspecting',['inspects','is inspecting','inspect'],'Right now verlangt eine laufende Handlung: is + -ing.'],
      ['We ___ for clearance at the moment.','are waiting',['wait','are waiting','waits'],'We + are + waiting.'],
      ['I ___ the fuel quantity now.','am checking',['check','am checking','checking'],'I + am + Verb-ing.']
    ]
  },
  {
    level:'A1', title:'Articles & basic nouns',
    use:'a/an für etwas nicht Bestimmtes; the für etwas Bestimmtes oder bereits Bekanntes.',
    form:'a + Konsonantenlaut, an + Vokallaut, the + bestimmtes Nomen.',
    signals:['first mention','known object','unique thing'],
    examples:['I saw a helicopter. The helicopter was red.','It is an engine component.'],
    pitfalls:['Es geht um den Laut, nicht nur den Buchstaben: an hour, a university.'],
    questions:[
      ['We need ___ new battery.','a',['a','an','the'],'Battery beginnt mit einem Konsonantenlaut.'],
      ['This is ___ unusual vibration.','an',['a','an','the'],'Unusual beginnt mit einem Vokallaut.'],
      ['Close ___ door we opened earlier.','the',['a','an','the'],'Die Tür ist bereits bekannt und damit bestimmt.']
    ]
  },
  {
    level:'A2', title:'Past Simple',
    use:'Abgeschlossene Handlungen zu einem klaren Zeitpunkt in der Vergangenheit.',
    form:'Verb-ed oder unregelmäßige 2. Form. Fragen/Verneinung mit did + Grundform.',
    signals:['yesterday','last week','in 2024','two hours ago'],
    examples:['We landed at 18:00.','Did you check the oil?'],
    pitfalls:['Nach did keine Vergangenheitsform: Did you go? nicht Did you went?'],
    questions:[
      ['The crew ___ the fault yesterday.','reported',['reports','reported','has report'],'Yesterday signalisiert Past Simple.'],
      ['Did the pilot ___ the warning?','hear',['heard','hear','hearing'],'Nach did steht die Grundform.'],
      ['We ___ at 14:30.','took off',['take off','took off','have taken off'],'Klar abgeschlossener Zeitpunkt in der Vergangenheit.']
    ]
  },
  {
    level:'A2', title:'Present Perfect',
    use:'Erfahrungen, Ergebnisse mit Bezug zur Gegenwart und Handlungen ohne konkreten vergangenen Zeitpunkt.',
    form:'have/has + past participle.',
    signals:['already','yet','ever','never','just','since','for'],
    examples:['I have already completed the check.','She has never flown at night.'],
    pitfalls:['Nicht zusammen mit einem abgeschlossenen Zeitpunkt wie yesterday verwenden.'],
    questions:[
      ['I ___ this procedure before.','have used',['used yesterday','have used','am use'],'Before ohne konkreten Zeitpunkt passt zum Present Perfect.'],
      ['She ___ the report yet.','has not finished',['did not finished','has not finished','not has finish'],'Has + past participle; yet steht oft in Fragen/Verneinungen.'],
      ['___ you ever flown in icing conditions?','Have',['Did','Have','Are'],'Erfahrung bis heute: Have you ever …?']
    ]
  },
  {
    level:'A2', title:'Comparatives & superlatives',
    use:'Vergleiche zwischen zwei oder mehreren Dingen.',
    form:'short adjective: -er/-est; long adjective: more/most; irregular: good-better-best.',
    signals:['than','the most','the least'],
    examples:['This route is shorter.','That is the most efficient method.'],
    pitfalls:['Nicht more better sagen.'],
    questions:[
      ['This aircraft is ___ than the older model.','lighter',['light','lighter','more light'],'Kurzes Adjektiv: light → lighter.'],
      ['This is the ___ option available.','safest',['safer','safest','most safeest'],'Superlativ: the safest.'],
      ['The new system is ___ reliable.','more',['more','most','many'],'Mehrsilbiges Adjektiv: more reliable.']
    ]
  },
  {
    level:'B1', title:'Conditionals 0–3',
    use:'Fakten, reale Zukunft, hypothetische Gegenwart und irreale Vergangenheit ausdrücken.',
    form:'0: if + present, present. 1: if + present, will. 2: if + past, would. 3: if + past perfect, would have + participle.',
    signals:['if','unless','provided that','as long as'],
    examples:['If pressure drops, the warning appears.','If the weather improves, we will depart.','If I had known, I would have acted differently.'],
    pitfalls:['Im normalen First Conditional kein will direkt nach if.'],
    questions:[
      ['If the weather improves, we ___ depart.','will',['would','will','would have'],'Reale zukünftige Möglichkeit: First Conditional.'],
      ['If I were you, I ___ the manual again.','would read',['will read','would read','would have read'],'Hypothetischer Rat: Second Conditional.'],
      ['If they had noticed the leak, they ___ the flight.','would have cancelled',['will cancel','would cancel','would have cancelled'],'Irreale Vergangenheit: Third Conditional.'],
      ['If oil pressure falls, the warning light ___.','illuminates',['will illuminated','illuminates','would illuminate'],'Allgemeiner technischer Zusammenhang: Zero Conditional.']
    ]
  },
  {
    level:'B1', title:'Passive Voice',
    use:'Wenn Handlung, Ergebnis oder Objekt wichtiger ist als die handelnde Person. Sehr häufig in Technik und Handbüchern.',
    form:'be in der passenden Zeit + past participle.',
    signals:['is required','must be checked','was installed','has been approved'],
    examples:['The filter is replaced every 100 hours.','The component was inspected yesterday.'],
    pitfalls:['Zeitform steckt im Verb be; das Hauptverb bleibt past participle.'],
    questions:[
      ['The filter ___ every 100 hours.','is replaced',['replaces','is replaced','is replace'],'Present Simple Passive: is + replaced.'],
      ['The gearbox ___ yesterday.','was inspected',['inspected','was inspected','has inspect'],'Past Passive: was + past participle.'],
      ['The bolts must ___ to the specified torque.','be tightened',['tighten','be tightened','be tighten'],'Modalverb + be + past participle.']
    ]
  },
  {
    level:'B1', title:'Relative clauses',
    use:'Zusatzinformationen über Personen, Dinge, Orte oder Zeitpunkte geben.',
    form:'who für Personen, which für Dinge, that für Personen/Dinge in defining clauses, where für Orte.',
    signals:['who','which','that','where','whose'],
    examples:['The engineer who signed the form is here.','The valve that failed was replaced.'],
    pitfalls:['Bei nicht notwendigen Zusatzinformationen stehen Kommas; dort normalerweise kein that.'],
    questions:[
      ['The sensor ___ failed was replaced.','that',['where','that','whose'],'Defining relative clause für ein Ding: that/which.'],
      ['The pilot, ___ had extensive experience, remained calm.','who',['that','who','where'],'Person in non-defining clause: who.'],
      ['This is the hangar ___ the aircraft is stored.','where',['which','where','who'],'Ort: where.']
    ]
  },
  {
    level:'B2', title:'Modal verbs & deduction',
    use:'Wahrscheinlichkeit, logische Schlussfolgerungen, Pflicht, Möglichkeit und Empfehlung präzise ausdrücken.',
    form:'modal + Grundform; Vergangenheit oft modal + have + past participle.',
    signals:['must','might','could','can’t','should','may have'],
    examples:['The sensor might be faulty.','They must have missed the warning.'],
    pitfalls:['Nach Modalverben kein to (außer ought to).'],
    questions:[
      ['The gauge is at zero; the sensor ___ be faulty.','might',['might','must to','is might'],'Möglichkeit: might + Grundform.'],
      ['The lights are on, so someone ___ be inside.','must',['must','can’t','would'],'Starke logische Schlussfolgerung: must.'],
      ['They ___ have overlooked the note.','may',['may','are may','may to'],'Vergangene Möglichkeit: may have + participle.'],
      ['He was in another country, so he ___ have performed the inspection.','can’t',['must','can’t','should'],'Logisch unmögliche Vergangenheit: can’t have + participle.']
    ]
  },
  {
    level:'B2', title:'Reported Speech',
    use:'Aussagen, Fragen und Anweisungen indirekt wiedergeben.',
    form:'Bei vergangenem reporting verb häufig backshift: present→past, will→would, have done→had done.',
    signals:['said that','told me','asked whether','reported that'],
    examples:['He said that the system was operational.','She asked whether we had checked the oil.'],
    pitfalls:['tell braucht meist ein Objekt: told me; say nicht zwingend.'],
    questions:[
      ['He said that the system ___ operational.','was',['is','was','will'],'Nach said erfolgt hier der normale Backshift.'],
      ['She asked whether we ___ the checklist.','had completed',['complete','had completed','will complete'],'Die ursprüngliche Handlung liegt vor dem Fragen: past perfect.'],
      ['The instructor told us ___ the procedure.','to repeat',['repeat','to repeat','repeating us'],'Befehl/Anweisung indirekt: told + object + to-infinitive.']
    ]
  },
  {
    level:'B2', title:'Gerunds & infinitives',
    use:'Bestimmte Verben verlangen -ing, andere to-infinitive; bei einigen ändert sich die Bedeutung.',
    form:'enjoy/avoid/consider + -ing; want/decide/need + to-infinitive.',
    signals:['avoid','consider','suggest','decide','intend','manage'],
    examples:['Avoid touching the hot surface.','We decided to delay departure.'],
    pitfalls:['stop doing ≠ stop to do; remember doing ≠ remember to do.'],
    questions:[
      ['Avoid ___ the switch unnecessarily.','operating',['to operate','operating','operate to'],'Avoid wird mit Gerundium verwendet.'],
      ['We decided ___ the inspection.','to repeat',['repeating','to repeat','repeat to'],'Decide + to-infinitive.'],
      ['The crew considered ___ the flight.','cancelling',['to cancel','cancelling','cancel to'],'Consider + -ing.']
    ]
  },
  {
    level:'C1', title:'Inversion for emphasis',
    use:'Formelle oder emphatische Satzstruktur nach negativen und limitierenden Ausdrücken.',
    form:'Negative/limitierende Phrase + Hilfsverb + Subjekt + Hauptverb.',
    signals:['rarely','never','not only','only then','under no circumstances','hardly'],
    examples:['Rarely have I encountered such turbulence.','Only then did we understand the problem.'],
    pitfalls:['Wenn kein Hilfsverb vorhanden ist, do/does/did einsetzen.'],
    questions:[
      ['Rarely ___ such severe turbulence.','have I encountered',['I have encountered','have I encountered','I encountered'],'Rarely am Satzanfang löst Inversion aus.'],
      ['Only after landing ___ the fault.','did we discover',['we discovered','did we discover','we did discovered'],'Fronted only-phrase verlangt Inversion im Hauptsatz.'],
      ['Under no circumstances ___ the guard be removed during operation.','should',['the guard should','should','does'],'Nach negativer Frontstellung folgt Hilfsverb vor Subjekt.'],
      ['Not only ___ the fault, but she also documented it.','did she identify',['she identified','did she identify','she did identified'],'Not only am Satzanfang → Inversion.']
    ]
  },
  {
    level:'C1', title:'Cleft sentences & emphasis',
    use:'Bestimmte Informationen gezielt hervorheben.',
    form:'It was X that/who …; What + clause + be + focus.',
    signals:['it was','what matters','the thing that','all I need'],
    examples:['It was the tail rotor that caused the vibration.','What matters is the final result.'],
    pitfalls:['Clefts sind stilistische Hervorhebung und sollten nicht in jedem Satz verwendet werden.'],
    questions:[
      ['It was the tail rotor ___ caused the vibration.','that',['what','that','where'],'It-cleft: that/who.'],
      ['What we need ___ a clearer procedure.','is',['are','is','be'],'Wh-cleft mit singular focus phrase: is.'],
      ['It was only after shutdown ___ the leak became visible.','that',['what','when that','that'],'It-cleft mit Zeitphrase: that.']
    ]
  },
  {
    level:'C1', title:'Advanced linking & concession',
    use:'Komplexe Zusammenhänge, Gegensatz, Einschränkung und Folge elegant verbinden.',
    form:'although/even though + clause; despite/in spite of + noun/-ing; nevertheless/nonetheless als Satzadverbien.',
    signals:['nevertheless','nonetheless','whereas','albeit','despite','notwithstanding'],
    examples:['Despite the delay, the inspection was thorough.','The result was unexpected; nevertheless, it was valid.'],
    pitfalls:['Despite nicht direkt mit vollständigem that-Satz verwenden.'],
    questions:[
      ['___ the poor visibility, the crew continued the approach.','Despite',['Although','Despite','Whereas'],'Despite + noun phrase.'],
      ['The test was difficult; ___, all criteria were met.','nevertheless',['because','nevertheless','whereas of'],'Satzadverb für einen Gegensatz.'],
      ['The two systems are similar, ___ they use different sensors.','although',['despite','although','notwithstanding of'],'Although + vollständiger Nebensatz.']
    ]
  },
  {
    level:'C2', title:'Mandative subjunctive',
    use:'Formelle Empfehlungen, Forderungen und Notwendigkeiten besonders in amerikanischem und internationalem Fachenglisch.',
    form:'recommend/require/insist/essential + that + Subjekt + Grundform; passiv: that X be done.',
    signals:['recommend that','require that','insist that','essential that','suggest that'],
    examples:['The inspector recommended that the part be replaced.','It is essential that every item remain traceable.'],
    pitfalls:['Auch bei he/she/it bleibt die Grundform ohne -s.'],
    questions:[
      ['The inspector recommended that the part ___ immediately.','be replaced',['is replaced','be replaced','was replaced'],'Mandative subjunctive: Grundform be.'],
      ['It is essential that every record ___ traceable.','remain',['remains','remain','remained'],'Nach essential that steht im formellen Subjunctive die Grundform.'],
      ['The authority requires that the operator ___ the change.','document',['documents','document','documented'],'Mandative subjunctive: document ohne -s.']
    ]
  },
  {
    level:'C2', title:'Advanced participle clauses',
    use:'Information verdichten und zeitliche/kausale Beziehungen elegant ausdrücken.',
    form:'Present participle (-ing), past participle oder perfect participle (having + participle).',
    signals:['having completed','given','assuming','considering','provided'],
    examples:['Having identified the discrepancy, the crew delayed departure.','Given the conditions, the decision was reasonable.'],
    pitfalls:['Das implizite Subjekt der participle clause muss logisch zum Hauptsatz passen; sonst entsteht ein dangling participle.'],
    questions:[
      ['___ the discrepancy, the crew delayed departure.','Having identified',['Identifying had','Having identified','Have identified'],'Die Identifikation geschah vor der Verzögerung.'],
      ['___ the available evidence, a wiring fault is plausible.','Given',['Giving','Given','Having give'],'Given = angesichts/unter Berücksichtigung von.'],
      ['___ all checks, the technician signed the release.','Having completed',['Completed having','Having completed','Have completing'],'Perfect participle markiert Vorzeitigkeit.']
    ]
  },
  {
    level:'C2', title:'Hedging & epistemic precision',
    use:'Aussagen bewusst nach Sicherheit, Wahrscheinlichkeit und Evidenz abstufen – zentral in akademischem und professionellem Englisch.',
    form:'appears/seems to, may well, is likely/unlikely to, arguably, tends to, cannot be ruled out.',
    signals:['apparently','ostensibly','arguably','conceivably','likely','purportedly'],
    examples:['The evidence appears to indicate a transient fault.','A sensor anomaly cannot be ruled out.'],
    pitfalls:['Hedging bedeutet nicht Unsicherheit um jeden Preis; die Stärke muss zur Evidenz passen.'],
    questions:[
      ['The evidence ___ suggest a transient electrical fault.','appears to',['appears','appears to','is appear to'],'Appear to + infinitive formuliert eine vorsichtige Schlussfolgerung.'],
      ['A calibration error cannot be ___.','ruled out',['ruled out','rule out','ruling out'],'Feste passive Wendung: cannot be ruled out.'],
      ['The discrepancy is ___ attributable to sensor drift.','arguably',['argue','arguably','argument'],'Adverb arguably modifiziert die gesamte Behauptung.'],
      ['The new procedure is ___ to reduce ambiguity.','likely',['likelihood','likely','liking'],'be likely to + infinitive.']
    ]
  },
  {
    level:'C2', title:'Nominalisation & formal register',
    use:'In Berichten und wissenschaftlicher Sprache Vorgänge kompakt als Nomen ausdrücken.',
    form:'analyse→analysis, comply→compliance, fail→failure, implement→implementation.',
    signals:['implementation','assessment','compliance','mitigation','verification'],
    examples:['Implementation of the measure reduced risk.','Verification of compliance is required.'],
    pitfalls:['Zu viele Nominalisierungen machen Texte schwer lesbar; gezielt einsetzen.'],
    questions:[
      ['___ of the revised procedure begins next month.','Implementation',['Implement','Implementation','Implementing is'],'Formeller Nominalstil verlangt hier ein Nomen.'],
      ['The report calls for further ___ of the evidence.','assessment',['assess','assessment','assessed'],'Nach further steht hier das Nomen assessment.'],
      ['Regulatory ___ must be demonstrated.','compliance',['comply','compliance','compliant with'],'Benötigt wird das Nomen compliance.']
    ]
  }
];
