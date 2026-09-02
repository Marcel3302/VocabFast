(function () {
  'use strict';

  const STORAGE_KEY = 'vocabfast.words.v2';
  const app = document.getElementById('app');

  const BASIC_WORDS = [
    ['the','der / die / das'],['be','sein'],['and','und'],['of','von'],['a','ein / eine'],['in','in'],['to','zu'],['have','haben'],['it','es'],['I','ich'],
    ['that','dass / das'],['for','für'],['you','du / Sie'],['he','er'],['with','mit'],['on','auf'],['do','tun / machen'],['say','sagen'],['this','dies / das'],['they','sie'],
    ['at','bei / an'],['but','aber'],['we','wir'],['his','sein'],['from','von / aus'],['not','nicht'],['by','durch / von'],['she','sie'],['or','oder'],['as','als / wie'],
    ['what','was'],['go','gehen'],['their','ihr'],['can','können'],['who','wer'],['get','bekommen'],['if','wenn / falls'],['would','würde'],['her','ihr / sie'],['all','alle'],
    ['my','mein'],['make','machen'],['about','über'],['know','wissen / kennen'],['will','werden'],['up','oben / hinauf'],['one','eins'],['time','Zeit'],['there','dort'],['year','Jahr'],
    ['so','so'],['think','denken'],['when','wann / wenn'],['which','welche/r/s'],['them','sie / ihnen'],['some','einige'],['me','mich / mir'],['people','Menschen'],['take','nehmen'],['out','hinaus / aus'],
    ['into','in / hinein'],['just','nur / gerade'],['see','sehen'],['him','ihn / ihm'],['your','dein / Ihr'],['come','kommen'],['could','könnte'],['now','jetzt'],['than','als'],['like','mögen / wie'],
    ['other','andere'],['how','wie'],['then','dann'],['its','sein / ihr'],['our','unser'],['two','zwei'],['more','mehr'],['these','diese'],['want','wollen'],['way','Weg / Art'],
    ['look','schauen / aussehen'],['first','erste/r/s'],['also','auch'],['new','neu'],['because','weil'],['day','Tag'],['use','benutzen'],['no','nein / kein'],['man','Mann'],['find','finden'],
    ['here','hier'],['thing','Ding / Sache'],['give','geben'],['many','viele'],['well','gut'],['only','nur'],['those','jene / die'],['tell','sagen / erzählen'],['very','sehr'],['even','sogar'],
    ['back','zurück / Rücken'],['any','irgendein'],['good','gut'],['woman','Frau'],['through','durch'],['us','uns'],['life','Leben'],['child','Kind'],['work','Arbeit / arbeiten'],['down','hinunter / unten'],
    ['may','dürfen / möglicherweise'],['after','nach'],['should','sollte'],['call','anrufen / nennen'],['world','Welt'],['over','über'],['school','Schule'],['still','noch / ruhig'],['try','versuchen'],['last','letzte/r/s'],
    ['ask','fragen'],['need','brauchen'],['too','auch / zu'],['feel','fühlen'],['three','drei'],['state','Staat / Zustand'],['never','nie'],['become','werden'],['between','zwischen'],['high','hoch'],
    ['really','wirklich'],['something','etwas'],['most','meiste'],['another','andere/r/s'],['much','viel'],['family','Familie'],['own','eigen'],['leave','verlassen'],['put','stellen / legen'],['old','alt'],
    ['while','während'],['mean','bedeuten'],['keep','behalten'],['student','Schüler / Student'],['why','warum'],['let','lassen'],['great','großartig'],['same','gleich'],['big','groß'],['group','Gruppe'],
    ['begin','beginnen'],['seem','scheinen'],['country','Land'],['help','helfen'],['talk','sprechen'],['where','wo'],['turn','drehen / werden'],['problem','Problem'],['every','jede/r/s'],['start','starten / beginnen'],
    ['hand','Hand'],['might','könnte'],['show','zeigen'],['part','Teil'],['against','gegen'],['place','Ort / platzieren'],['such','solche/r/s'],['again','wieder'],['few','wenige'],['case','Fall'],
    ['week','Woche'],['company','Firma'],['system','System'],['each','jede/r/s'],['right','richtig / rechts'],['program','Programm'],['hear','hören'],['question','Frage'],['during','während'],['play','spielen'],
    ['government','Regierung'],['run','laufen'],['small','klein'],['number','Zahl'],['off','aus / weg'],['always','immer'],['move','bewegen'],['night','Nacht'],['live','leben'],['point','Punkt'],
    ['believe','glauben'],['hold','halten'],['today','heute'],['bring','bringen'],['happen','passieren'],['next','nächste/r/s'],['without','ohne'],['before','vor'],['large','groß'],['million','Million']
  ];

  const FALLBACK_DICTIONARY = Object.fromEntries(BASIC_WORDS.map(([en,de]) => [en.toLowerCase(), de]));
  Object.assign(FALLBACK_DICTIONARY, {
    achievement: 'Erfolg / Errungenschaft', environment: 'Umwelt', opportunity: 'Möglichkeit / Gelegenheit', supplier: 'Lieferant', revenue: 'Umsatz',
    development: 'Entwicklung', customer: 'Kunde', liability: 'Haftung / Verbindlichkeit', growth: 'Wachstum', language: 'Sprache', learn: 'lernen', word: 'Wort'
  });

  const state = {
    page: 'home',
    words: loadWords(),
    toast: '',
    filter: 'all',
    search: '',
    sort: 'new',
    trainer: { queue: [], index: 0, mode: 'write', result: null, answer: '', revealed: false },
    add: { english: '', german: '', status: '', translating: false, listening: false },
    topSearch: ''
  };

  function makeId() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') return window.crypto.randomUUID();
    return 'w_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
  }

  function createWord(english, german, source) {
    const now = new Date().toISOString();
    return { id: makeId(), english: english.trim(), german: german.trim(), level: 3, streak: 0, active: true, source: source || 'manual', correct: 0, wrong: 0, createdAt: now, updatedAt: now };
  }

  function starterWords() {
    return [
      createWord('environment','Umwelt'), createWord('achievement','Erfolg / Errungenschaft'), createWord('opportunity','Möglichkeit / Gelegenheit'), createWord('supplier','Lieferant'), createWord('revenue','Umsatz')
    ];
  }

  function loadWords() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return starterWords();
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : starterWords();
    } catch (_) { return starterWords(); }
  }

  function saveWords() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.words)); }
    catch (_) { showToast('Speichern im Browser ist blockiert.'); }
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  }

  function normalize(value) {
    return String(value || '').toLowerCase().trim().replace(/[.,!?;:()"'’]/g, '').replace(/\s+/g,' ');
  }

  function correctAnswer(answer, expected) {
    const a = normalize(answer);
    return expected.split(/[\/;,]/).map(normalize).filter(Boolean).includes(a);
  }

  function counts() {
    return {
      total: state.words.length,
      active: state.words.filter(w => w.active).length,
      red: state.words.filter(w => w.active && w.level === 3).length,
      yellow: state.words.filter(w => w.active && w.level === 2).length,
      green: state.words.filter(w => w.active && w.level === 1).length,
      learned: state.words.filter(w => w.level === 1).length
    };
  }

  function levelColor(level) { return level === 3 ? 'red' : level === 2 ? 'yellow' : 'green'; }
  function levelName(level) { return level === 3 ? 'Neu' : level === 2 ? 'Lernen' : 'Sicher'; }

  function showToast(text) {
    state.toast = text;
    render();
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => { state.toast = ''; render(); }, 2300);
  }

  function shell(content) {
    const nav = [
      ['home','⌂','Übersicht'],['trainer','▶','Trainer'],['add','＋','Hinzufügen'],['top','★','Top Wörter'],['words','▤','Meine Wörter']
    ];
    return `
      <div class="shell">
        <aside class="sidebar">
          <button class="brand" data-page="home"><span class="brand-mark">V</span><span>VocabFast</span></button>
          <nav class="nav">${nav.map(([key,icon,label]) => `<button class="${state.page===key?'active':''}" data-page="${key}">${icon}&nbsp;&nbsp;${label}</button>`).join('')}</nav>
          <div class="side-note">Stabiler MVP<br>Daten lokal in diesem Browser</div>
        </aside>
        <main class="main">${content}</main>
        <nav class="mobile-nav">${nav.map(([key,icon,label]) => `<button class="${state.page===key?'active':''}" data-page="${key}">${icon}<br>${label}</button>`).join('')}</nav>
        ${state.toast ? `<div class="toast">✓ ${escapeHtml(state.toast)}</div>` : ''}
      </div>`;
  }

  function heading(eyebrow,title,subtitle) {
    return `<div><p class="eyebrow">${escapeHtml(eyebrow)}</p><h1>${escapeHtml(title)}</h1><p class="subtitle">${escapeHtml(subtitle)}</p></div>`;
  }

  function homePage() {
    const c = counts();
    const progress = c.total ? Math.round(c.learned / c.total * 100) : 0;
    const recent = [...state.words].sort((a,b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0,5);
    return shell(`<div class="page">
      ${heading('DEIN LERNBEREICH','Schnell Wörter lernen.','Eigene Vokabeln erfassen, üben und Schritt für Schritt von Rot auf Grün bringen.')}
      <section class="hero">
        <div><span class="pill">⚡ Heute lernen</span><h2>${c.active ? `${c.active} Wörter warten auf dich.` : 'Alles geschafft.'}</h2><p>${c.active ? 'Starte eine kurze Runde. Jede richtige 5er-Serie bringt ein Wort eine Stufe weiter.' : 'Füge neue Wörter hinzu oder aktiviere pausierte Wörter.'}</p><button class="primary" data-page="trainer" ${c.active?'':'disabled'}>▶ Training starten</button></div>
        <div class="hero-score"><div><strong>${progress}%</strong><small>sicher</small></div></div>
      </section>
      <div class="stats">
        <div class="stat"><span class="dot red"></span><div><strong>${c.red}</strong><small>Stufe 3 · Neu</small></div></div>
        <div class="stat"><span class="dot yellow"></span><div><strong>${c.yellow}</strong><small>Stufe 2 · Lernen</small></div></div>
        <div class="stat"><span class="dot green"></span><div><strong>${c.green}</strong><small>Stufe 1 · Sicher</small></div></div>
      </div>
      <div class="grid2">
        <section class="panel"><div class="panel-head"><div><p class="eyebrow">SCHNELLSTART</p><h3>Wort erfassen</h3></div></div><div class="quick">
          <button data-page="add"><strong>＋ Wort eingeben</strong><small>Deutsch selbst eintragen oder automatisch übersetzen</small></button>
          <button data-page="add"><strong>🎤 Wort sprechen</strong><small>Mit Chrome oder Edge direkt ins Eingabefeld sprechen</small></button>
          <button data-page="top"><strong>★ Basiswortschatz</strong><small>Häufige Wörter durchsuchen und übernehmen</small></button>
        </div></section>
        <section class="panel"><div class="panel-head"><div><p class="eyebrow">ZULETZT</p><h3>Deine Wörter</h3></div><button class="ghost" data-page="words">Alle</button></div>
          ${recent.length ? recent.map(w => `<div class="recent-row"><span class="dot ${levelColor(w.level)}"></span><div><strong>${escapeHtml(w.english)}</strong><small>${escapeHtml(w.german)}</small></div><span>Stufe ${w.level}</span></div>`).join('') : '<div class="empty">Noch keine Wörter gespeichert.</div>'}
        </section>
      </div>
    </div>`);
  }

  function addPage() {
    const a = state.add;
    return shell(`<div class="page">
      ${heading('HINZUFÜGEN','Ein Wort. Ein Klick. Weiterlernen.','Neue Wörter starten immer in Stufe 3. Du kannst Englisch tippen oder über das Mikrofon sprechen.')}
      <div class="form-grid">
        <section class="panel">
          <div class="panel-head"><div><p class="eyebrow">SCHNELL HINZUFÜGEN</p><h3>Englisch → Deutsch</h3></div><span>EN → DE</span></div>
          <form id="add-form">
            <label for="english">Englisch</label>
            <div class="row"><input id="english" name="english" autocomplete="off" placeholder="z. B. achievement" value="${escapeHtml(a.english)}"><button class="secondary" type="button" id="mic-btn">${a.listening?'●':'🎤'}</button></div>
            <label for="german">Deutsch</label>
            <input id="german" name="german" autocomplete="off" placeholder="z. B. Erfolg / Errungenschaft" value="${escapeHtml(a.german)}">
            <div class="row" style="margin-top:12px"><button class="secondary" type="button" id="translate-btn" ${a.translating?'disabled':''}>${a.translating?'Übersetze …':'✨ Automatisch übersetzen'}</button><button class="primary" type="submit">＋ Hinzufügen</button></div>
          </form>
          <div class="level-hint"><span class="dot red"></span> Neue Wörter starten in Stufe 3 mit Serie 0/5.</div>
          ${a.status ? `<div class="status">${escapeHtml(a.status)}</div>` : ''}
        </section>
        <section class="panel">
          <div class="panel-head"><div><p class="eyebrow">DIESE VERSION</p><h3>Zuerst stabil</h3></div><span>✓</span></div>
          <p class="help">Bild- und PDF-Erkennung habe ich bewusst aus dieser Reparaturversion entfernt. Damit vermeiden wir, dass große OCR/PDF-Pakete die ganze Seite beim Start blockieren.</p>
          <p class="help">Sobald diese Basis bei dir sauber läuft, können wir Bild/PDF als nächsten Schritt wieder hinzufügen – getrennt geladen, sodass die Kern-App niemals davon abhängig ist.</p>
          <div class="notice">Automatische Übersetzung läuft nach dem Cloudflare-Deploy über <b>/api/translate</b>. Für viele häufige Wörter gibt es zusätzlich einen eingebauten Offline-Fallback.</div>
        </section>
      </div>
    </div>`);
  }

  function initTrainer(force) {
    const activeIds = state.words.filter(w => w.active).map(w => w.id);
    if (force || !state.trainer.queue.length || state.trainer.queue.every(id => !activeIds.includes(id))) {
      state.trainer.queue = shuffle(activeIds);
      state.trainer.index = 0;
      state.trainer.result = null;
      state.trainer.answer = '';
      state.trainer.revealed = false;
    }
  }

  function trainerPage() {
    initTrainer(false);
    const t = state.trainer;
    const active = state.words.filter(w => w.active);
    if (!active.length) return shell(`<div class="page narrow">${heading('TRAINER','Keine aktiven Wörter','Füge ein neues Wort hinzu oder aktiviere ein pausiertes Wort wieder.')}<div class="empty"><button class="primary" data-page="add">＋ Wort hinzufügen</button></div></div>`);
    if (t.index >= t.queue.length) return shell(`<div class="page narrow">${heading('RUNDE GESCHAFFT','Runde abgeschlossen','Du hast alle Wörter dieser Runde einmal bearbeitet.')}<section class="panel" style="margin-top:28px;text-align:center;padding:46px"><div style="font-size:48px">✓</div><h2>Gut gemacht</h2><p class="subtitle" style="margin-inline:auto">Starte direkt noch eine Runde oder überprüfe deine Wortliste.</p><button class="primary" id="new-round">Neue Runde</button></section></div>`);
    const word = state.words.find(w => w.id === t.queue[t.index]);
    if (!word) { initTrainer(true); return trainerPage(); }
    const feedback = t.result ? `<div class="feedback"><div><strong>${t.result==='correct'?'✓ Richtig':'✕ Noch nicht'}</strong>${t.result==='wrong'?`<span>Richtig wäre: <b>${escapeHtml(word.english)}</b></span>`:''}<span>Aktuelle Serie: ${word.streak}/5 · Stufe ${word.level}</span></div><button class="primary" id="next-word">Weiter →</button></div>` : '';
    return shell(`<div class="page narrow">
      ${heading('TRAINER','Schnelle Runde','Deutsch sehen, Englisch aktiv abrufen.')}
      <div class="trainer-meta"><div class="segmented"><button data-mode="write" class="${t.mode==='write'?'active':''}">Schreiben</button><button data-mode="think" class="${t.mode==='think'?'active':''}">Denken</button></div><span>${t.index+1} / ${t.queue.length}</span></div>
      <div class="progress"><span style="width:${Math.round(t.index/t.queue.length*100)}%"></span></div>
      <section class="trainer-card">
        <div class="trainer-top"><span class="badge"><span class="dot ${levelColor(word.level)}"></span>Stufe ${word.level} · ${word.streak}/5</span><button class="ghost" id="speak-current">🔊</button></div>
        <p class="question">Wie heißt das auf Englisch?</p><h2 class="prompt">${escapeHtml(word.german)}</h2>
        ${t.mode==='write' ? `<form id="answer-form" class="answer-row"><input id="answer" autocomplete="off" autofocus placeholder="Englisches Wort eingeben" value="${escapeHtml(t.answer)}" ${t.result?'disabled':''}>${t.result?'':'<button class="primary">Prüfen</button>'}</form>` : `<div class="think">${!t.revealed?'<button class="secondary" id="reveal-answer">Antwort anzeigen</button>':!t.result?`<div class="revealed">${escapeHtml(word.english)}</div><div class="think-actions"><button class="danger" data-grade="wrong">✕ Nicht gewusst</button><button class="success" data-grade="correct">✓ Gewusst</button></div>`:''}</div>`}
        ${feedback}
      </section>
      <p class="help" style="margin-top:12px">Falsch setzt nur die aktuelle 5er-Serie auf 0. Nach 5 richtigen Antworten steigt das Wort von Rot → Gelb und nach weiteren 5 von Gelb → Grün.</p>
      ${word.level===1 ? '<button class="ghost" id="pause-current">Wort aus aktivem Training entfernen</button>' : ''}
    </div>`);
  }

  function wordsPage() {
    const q = state.search.toLowerCase();
    let list = state.words.filter(w => w.english.toLowerCase().includes(q) || w.german.toLowerCase().includes(q));
    if (state.filter === 'inactive') list = list.filter(w => !w.active);
    else if (state.filter !== 'all') list = list.filter(w => w.active && String(w.level) === state.filter);
    if (state.sort === 'new') list.sort((a,b) => b.createdAt.localeCompare(a.createdAt));
    if (state.sort === 'hard') list.sort((a,b) => b.level-a.level || b.wrong-a.wrong);
    if (state.sort === 'az') list.sort((a,b) => a.english.localeCompare(b.english));
    return shell(`<div class="page">
      ${heading('BIBLIOTHEK','Meine Wörter',`${state.words.length} Wörter gespeichert · lokal in diesem Browser.`)}
      <div class="toolbar"><input id="word-search" placeholder="Englisch oder Deutsch suchen …" value="${escapeHtml(state.search)}"><select id="word-sort"><option value="new" ${state.sort==='new'?'selected':''}>Neueste zuerst</option><option value="hard" ${state.sort==='hard'?'selected':''}>Schwierigste zuerst</option><option value="az" ${state.sort==='az'?'selected':''}>A–Z</option></select></div>
      <div class="filters">${[['all','Alle'],['3','🔴 Stufe 3'],['2','🟡 Stufe 2'],['1','🟢 Stufe 1'],['inactive','Pausiert']].map(([k,l]) => `<button data-filter="${k}" class="${state.filter===k?'active':''}">${l}</button>`).join('')}<button id="export-btn">Backup exportieren</button></div>
      <div class="word-list">${list.length ? list.map(w => `<div class="word-item ${w.active?'':'inactive'}">
        <div class="word-main"><strong>${escapeHtml(w.english)}</strong><small>${escapeHtml(w.german)}</small></div>
        <span class="badge"><span class="dot ${levelColor(w.level)}"></span>Stufe ${w.level}</span>
        <div class="streak-cell"><small>${w.streak}/5</small><div class="mini-bars">${[0,1,2,3,4].map(i=>`<i class="${i<w.streak?'on':''}"></i>`).join('')}</div></div>
        <div class="status-cell"><button class="ghost" data-toggle="${w.id}">${w.active?'Aktiv':'Pausiert'}</button></div>
        <div class="actions"><button class="ghost" data-speak="${w.id}">🔊</button><button class="danger" data-delete="${w.id}">×</button></div>
      </div>`).join('') : '<div class="empty">Keine passenden Wörter gefunden.</div>'}</div>
    </div>`);
  }

  function topPage() {
    const q = state.topSearch.toLowerCase();
    const known = new Set(state.words.map(w => w.english.toLowerCase()));
    const list = BASIC_WORDS.filter(([en,de]) => en.toLowerCase().includes(q) || de.toLowerCase().includes(q)).slice(0,100);
    return shell(`<div class="page">
      ${heading('BASISWORTSCHATZ','Häufige englische Wörter','Diese stabile Testversion enthält zunächst eine kleinere integrierte Liste. Nach dem Funktionstest erweitern wir sie auf echte 2.000 Wörter.')}
      <div class="toolbar" style="grid-template-columns:1fr"><input id="top-search" placeholder="Wort suchen …" value="${escapeHtml(state.topSearch)}"></div>
      <div class="top-grid">${list.map(([en,de]) => `<div class="top-row"><div><strong>${escapeHtml(en)}</strong><small>${escapeHtml(de)}</small></div><button class="${known.has(en.toLowerCase())?'ghost':'primary'}" data-add-top="${escapeHtml(en)}" ${known.has(en.toLowerCase())?'disabled':''}>${known.has(en.toLowerCase())?'✓ Gespeichert':'+ Hinzufügen'}</button></div>`).join('')}</div>
      <div class="notice">Ich habe die externe „Top-2000“-Bibliothek entfernt, weil sie ein möglicher Grund für die leere Seite war. Diese Liste ist jetzt vollständig eingebaut und kann den App-Start nicht mehr blockieren.</div>
    </div>`);
  }

  function render() {
    try {
      const pages = { home: homePage, trainer: trainerPage, add: addPage, words: wordsPage, top: topPage };
      app.innerHTML = (pages[state.page] || homePage)();
      bind();
      if (state.page === 'trainer' && state.trainer.mode === 'write' && !state.trainer.result) {
        setTimeout(() => document.getElementById('answer')?.focus(), 0);
      }
    } catch (error) {
      console.error(error);
      app.innerHTML = `<div class="fatal-error" style="position:static;margin:20px">Die App hat einen Fehler erkannt statt leer zu bleiben: ${escapeHtml(error && error.message ? error.message : String(error))}</div>`;
    }
  }

  function bind() {
    document.querySelectorAll('[data-page]').forEach(el => el.addEventListener('click', () => { state.page = el.dataset.page; if (state.page==='trainer') initTrainer(true); render(); }));

    const addForm = document.getElementById('add-form');
    if (addForm) {
      const english = document.getElementById('english');
      const german = document.getElementById('german');
      english.addEventListener('input', e => state.add.english = e.target.value);
      german.addEventListener('input', e => state.add.german = e.target.value);
      addForm.addEventListener('submit', e => {
        e.preventDefault();
        state.add.english = english.value.trim(); state.add.german = german.value.trim();
        if (!state.add.english || !state.add.german) { state.add.status = 'Bitte Englisch und Deutsch ausfüllen.'; render(); return; }
        if (state.words.some(w => w.english.toLowerCase() === state.add.english.toLowerCase())) { state.add.status = 'Dieses englische Wort ist bereits gespeichert.'; render(); return; }
        state.words.unshift(createWord(state.add.english,state.add.german,'manual')); saveWords();
        const added = state.add.english; state.add = { english:'',german:'',status:'',translating:false,listening:false };
        showToast(`„${added}“ wurde hinzugefügt.`);
      });
      document.getElementById('translate-btn')?.addEventListener('click', async () => {
        state.add.english = english.value.trim();
        if (!state.add.english) { state.add.status='Bitte zuerst ein englisches Wort eingeben.'; render(); return; }
        state.add.translating = true; state.add.status = ''; render();
        try { state.add.german = await translateWord(state.add.english); state.add.status = 'Übersetzung eingefügt. Bitte kurz prüfen.'; }
        catch (err) { state.add.status = err.message || 'Übersetzung nicht verfügbar.'; }
        state.add.translating = false; render();
      });
      document.getElementById('mic-btn')?.addEventListener('click', startSpeechRecognition);
    }

    document.querySelectorAll('[data-mode]').forEach(el => el.addEventListener('click', () => { state.trainer.mode = el.dataset.mode; state.trainer.result=null; state.trainer.revealed=false; state.trainer.answer=''; render(); }));
    document.getElementById('answer-form')?.addEventListener('submit', e => {
      e.preventDefault(); const input = document.getElementById('answer'); state.trainer.answer = input.value; const word = currentTrainerWord(); if (word) grade(word, correctAnswer(input.value, word.english));
    });
    document.getElementById('reveal-answer')?.addEventListener('click', () => { state.trainer.revealed = true; render(); });
    document.querySelectorAll('[data-grade]').forEach(el => el.addEventListener('click', () => { const word = currentTrainerWord(); if (word) grade(word, el.dataset.grade==='correct'); }));
    document.getElementById('next-word')?.addEventListener('click', nextTrainerWord);
    document.getElementById('new-round')?.addEventListener('click', () => { initTrainer(true); render(); });
    document.getElementById('speak-current')?.addEventListener('click', () => { const word = currentTrainerWord(); if (word) speak(word.english); });
    document.getElementById('pause-current')?.addEventListener('click', () => { const word=currentTrainerWord(); if(word){word.active=false;word.updatedAt=new Date().toISOString();saveWords();showToast('Wort wurde pausiert.');initTrainer(true);} });

    document.getElementById('word-search')?.addEventListener('input', e => { state.search=e.target.value; render(); });
    document.getElementById('word-sort')?.addEventListener('change', e => { state.sort=e.target.value; render(); });
    document.querySelectorAll('[data-filter]').forEach(el => el.addEventListener('click', () => { state.filter=el.dataset.filter; render(); }));
    document.querySelectorAll('[data-toggle]').forEach(el => el.addEventListener('click', () => { const w=state.words.find(x=>x.id===el.dataset.toggle); if(w){w.active=!w.active;w.updatedAt=new Date().toISOString();saveWords();render();} }));
    document.querySelectorAll('[data-delete]').forEach(el => el.addEventListener('click', () => { const w=state.words.find(x=>x.id===el.dataset.delete); if(w && confirm(`„${w.english}“ wirklich löschen?`)){state.words=state.words.filter(x=>x.id!==w.id);saveWords();render();} }));
    document.querySelectorAll('[data-speak]').forEach(el => el.addEventListener('click', () => { const w=state.words.find(x=>x.id===el.dataset.speak); if(w)speak(w.english); }));
    document.getElementById('export-btn')?.addEventListener('click', exportWords);

    document.getElementById('top-search')?.addEventListener('input', e => { state.topSearch=e.target.value; render(); });
    document.querySelectorAll('[data-add-top]').forEach(el => el.addEventListener('click', () => { const en=el.dataset.addTop; const pair=BASIC_WORDS.find(([w])=>w===en); if(!pair)return; if(!state.words.some(w=>w.english.toLowerCase()===en.toLowerCase())){state.words.unshift(createWord(pair[0],pair[1],'top'));saveWords();showToast(`„${en}“ wurde hinzugefügt.`);} }));
  }

  function currentTrainerWord() {
    return state.words.find(w => w.id === state.trainer.queue[state.trainer.index]);
  }

  function grade(word, ok) {
    if (state.trainer.result) return;
    if (ok) {
      word.correct = (word.correct || 0) + 1;
      word.streak = (word.streak || 0) + 1;
      if (word.streak >= 5) {
        if (word.level > 1) { word.level -= 1; word.streak = 0; }
        else { word.streak = 5; }
      }
      state.trainer.result = 'correct';
    } else {
      word.wrong = (word.wrong || 0) + 1; word.streak = 0; state.trainer.result = 'wrong';
    }
    word.updatedAt = new Date().toISOString(); saveWords(); render();
  }

  function nextTrainerWord() {
    state.trainer.index += 1; state.trainer.result=null; state.trainer.answer=''; state.trainer.revealed=false; render();
  }

  function shuffle(arr) { return [...arr].sort(() => Math.random() - .5); }

  function speak(text) {
    if (!('speechSynthesis' in window)) { showToast('Aussprache wird in diesem Browser nicht unterstützt.'); return; }
    window.speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang='en-US'; u.rate=.9; window.speechSynthesis.speak(u);
  }

  function startSpeechRecognition() {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) { state.add.status='Spracherkennung wird hier nicht unterstützt. Nutze am besten Chrome oder Edge.'; render(); return; }
    try {
      const rec = new Recognition(); rec.lang='en-US'; rec.interimResults=false; rec.continuous=false;
      state.add.listening=true; state.add.status='Sprich jetzt ein englisches Wort …'; render();
      rec.onresult = e => { state.add.english = (e.results?.[0]?.[0]?.transcript || '').trim(); state.add.listening=false; state.add.status='Wort erkannt. Du kannst es jetzt übersetzen.'; render(); };
      rec.onerror = () => { state.add.listening=false; state.add.status='Mikrofon konnte nicht verwendet werden. Prüfe die Browser-Berechtigung.'; render(); };
      rec.onend = () => { if(state.add.listening){state.add.listening=false;render();} };
      rec.start();
    } catch (_) { state.add.listening=false; state.add.status='Spracherkennung konnte nicht gestartet werden.'; render(); }
  }

  async function translateWord(text) {
    const key = text.toLowerCase().trim();
    try {
      const controller = new AbortController(); const timer=setTimeout(()=>controller.abort(),7000);
      const res = await fetch(`/api/translate?q=${encodeURIComponent(text)}&source=en&target=de`, { signal: controller.signal }); clearTimeout(timer);
      if (res.ok) { const data = await res.json(); if (data.translation) return data.translation; }
    } catch (_) { /* use fallback below */ }
    if (FALLBACK_DICTIONARY[key]) return FALLBACK_DICTIONARY[key];
    throw new Error('Für dieses Wort war gerade keine automatische Übersetzung verfügbar. Du kannst die deutsche Bedeutung manuell eintragen.');
  }

  function exportWords() {
    const blob = new Blob([JSON.stringify(state.words,null,2)],{type:'application/json'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='vocabfast-backup.json'; a.click(); setTimeout(()=>URL.revokeObjectURL(url),0);
  }

  render();
})();
