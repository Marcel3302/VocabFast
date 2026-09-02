import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Archive,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ChevronRight,
  CirclePlus,
  FileText,
  Filter,
  Flame,
  Gauge,
  Image as ImageIcon,
  Languages,
  ListFilter,
  Mic,
  MoreHorizontal,
  Play,
  Search,
  Sparkles,
  Star,
  Trash2,
  Trophy,
  Upload,
  Volume2,
  X,
  Zap,
} from 'lucide-react';
import { words as popularEnglishWords } from 'popular-english-words';
import { createWord, extractTokens, isCorrectAnswer, loadWords, saveWords, translateWord } from './lib';
import type { PageKey, VocabItem, VocabLevel, VocabSource } from './types';

type FilterKey = 'all' | '3' | '2' | '1' | 'inactive';
type ImportState = { text: string; tokens: string[]; selected: Set<string>; filename: string };

const LEVEL_META: Record<VocabLevel, { label: string; color: string; className: string }> = {
  3: { label: 'Neu', color: 'Rot', className: 'level-red' },
  2: { label: 'Lernen', color: 'Gelb', className: 'level-yellow' },
  1: { label: 'Sicher', color: 'Grün', className: 'level-green' },
};

function App() {
  const [page, setPage] = useState<PageKey>('home');
  const [words, setWords] = useState<VocabItem[]>(() => loadWords());
  const [toast, setToast] = useState('');
  const [proOpen, setProOpen] = useState(false);

  useEffect(() => saveWords(words), [words]);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 2500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const counts = useMemo(() => ({
    total: words.length,
    active: words.filter((w) => w.active).length,
    red: words.filter((w) => w.active && w.level === 3).length,
    yellow: words.filter((w) => w.active && w.level === 2).length,
    green: words.filter((w) => w.active && w.level === 1).length,
    learned: words.filter((w) => w.level === 1).length,
  }), [words]);

  function addVocab(english: string, german: string, source: VocabSource = 'manual') {
    const normalized = english.trim().toLowerCase();
    if (!normalized || !german.trim()) return false;
    if (words.some((w) => w.english.toLowerCase() === normalized)) {
      setToast(`„${english}“ ist bereits in deiner Liste.`);
      return false;
    }
    setWords((prev) => [createWord(english, german, source), ...prev]);
    setToast(`„${english}“ wurde hinzugefügt.`);
    return true;
  }

  function updateWord(id: string, patch: Partial<VocabItem>) {
    setWords((prev) => prev.map((w) => w.id === id ? { ...w, ...patch, updatedAt: new Date().toISOString() } : w));
  }

  function removeWord(id: string) {
    setWords((prev) => prev.filter((w) => w.id !== id));
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <button className="brand" onClick={() => setPage('home')}>
          <span className="brand-mark"><Zap size={19} strokeWidth={2.6} /></span>
          <span>VocabFast</span>
        </button>
        <nav>
          <NavButton active={page === 'home'} icon={<Gauge size={20} />} label="Übersicht" onClick={() => setPage('home')} />
          <NavButton active={page === 'trainer'} icon={<Play size={20} />} label="Trainer" onClick={() => setPage('trainer')} />
          <NavButton active={page === 'add'} icon={<CirclePlus size={20} />} label="Hinzufügen" onClick={() => setPage('add')} />
          <NavButton active={page === 'top'} icon={<Trophy size={20} />} label="Top 2000" onClick={() => setPage('top')} />
          <NavButton active={page === 'words'} icon={<BookOpen size={20} />} label="Meine Wörter" onClick={() => setPage('words')} />
        </nav>
        <div className="sidebar-spacer" />
        <button className="pro-card" onClick={() => setProOpen(true)}>
          <span className="pro-icon"><Sparkles size={18} /></span>
          <span><strong>VocabFast Pro</strong><small>Alle Import-Funktionen</small></span>
          <ChevronRight size={18} />
        </button>
        <div className="local-note">MVP · Daten lokal im Browser</div>
      </aside>

      <main className="main">
        <header className="mobile-header">
          <button className="brand mini" onClick={() => setPage('home')}><span className="brand-mark"><Zap size={17} /></span><span>VocabFast</span></button>
          <button className="icon-btn" onClick={() => setProOpen(true)}><Sparkles size={18} /></button>
        </header>

        {page === 'home' && <Home counts={counts} words={words} setPage={setPage} />}
        {page === 'trainer' && <Trainer words={words} updateWord={updateWord} setToast={setToast} />}
        {page === 'add' && <AddWords addVocab={addVocab} />}
        {page === 'top' && <TopWords addVocab={addVocab} words={words} />}
        {page === 'words' && <WordsList words={words} updateWord={updateWord} removeWord={removeWord} />}
      </main>

      <nav className="bottom-nav">
        <MobileNav active={page === 'home'} icon={<Gauge size={20} />} label="Home" onClick={() => setPage('home')} />
        <MobileNav active={page === 'trainer'} icon={<Play size={20} />} label="Trainer" onClick={() => setPage('trainer')} />
        <MobileNav active={page === 'add'} icon={<CirclePlus size={23} />} label="Neu" onClick={() => setPage('add')} emphasized />
        <MobileNav active={page === 'top'} icon={<Trophy size={20} />} label="Top 2000" onClick={() => setPage('top')} />
        <MobileNav active={page === 'words'} icon={<BookOpen size={20} />} label="Wörter" onClick={() => setPage('words')} />
      </nav>

      {toast && <div className="toast"><Check size={17} /> {toast}</div>}
      {proOpen && <ProModal onClose={() => setProOpen(false)} />}
    </div>
  );
}

function NavButton({ active, icon, label, onClick }: { active: boolean; icon: React.ReactNode; label: string; onClick: () => void }) {
  return <button className={`nav-item ${active ? 'active' : ''}`} onClick={onClick}>{icon}<span>{label}</span></button>;
}

function MobileNav({ active, icon, label, onClick, emphasized = false }: { active: boolean; icon: React.ReactNode; label: string; onClick: () => void; emphasized?: boolean }) {
  return <button className={`mobile-nav-item ${active ? 'active' : ''} ${emphasized ? 'emphasized' : ''}`} onClick={onClick}>{icon}<small>{label}</small></button>;
}

function Home({ counts, words, setPage }: { counts: { total: number; active: number; red: number; yellow: number; green: number; learned: number }; words: VocabItem[]; setPage: (p: PageKey) => void }) {
  const recent = words.slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 4);
  const progress = counts.total ? Math.round((counts.learned / counts.total) * 100) : 0;

  return (
    <div className="page-wrap">
      <div className="page-title-row">
        <div><p className="eyebrow">DEIN LERNBEREICH</p><h1>Bereit für ein paar Wörter?</h1><p className="subtitle">Kurze Einheiten. Genau die Vokabeln, die du wirklich brauchst.</p></div>
        <button className="primary desktop-only" onClick={() => setPage('trainer')}><Play size={18} fill="currentColor" /> Training starten</button>
      </div>

      <section className="hero-card">
        <div>
          <span className="pill"><Flame size={15} /> Heute lernen</span>
          <h2>{counts.active === 0 ? 'Alles geschafft.' : `${counts.active} Wörter warten auf dich.`}</h2>
          <p>{counts.active ? 'Starte eine schnelle Runde und bring deine Wörter Schritt für Schritt auf Grün.' : 'Aktiviere Wörter oder füge neue hinzu, um weiterzulernen.'}</p>
          <button className="hero-button" onClick={() => setPage('trainer')} disabled={!counts.active}><Play size={18} fill="currentColor" /> Training starten <ArrowRight size={18} /></button>
        </div>
        <div className="hero-progress-wrap">
          <div className="hero-progress" style={{ '--progress': `${progress * 3.6}deg` } as React.CSSProperties}><span>{progress}%<small>sicher</small></span></div>
        </div>
      </section>

      <div className="level-grid">
        <StatCard level={3} count={counts.red} detail="noch nicht sicher" />
        <StatCard level={2} count={counts.yellow} detail="im Lernprozess" />
        <StatCard level={1} count={counts.green} detail="bereits sicher" />
      </div>

      <div className="content-grid">
        <section className="panel">
          <div className="panel-head"><div><p className="eyebrow">SCHNELLSTART</p><h3>Wörter erfassen</h3></div></div>
          <div className="quick-grid">
            <QuickAction icon={<Languages />} title="Wort eingeben" text="Manuell oder automatisch übersetzen" onClick={() => setPage('add')} />
            <QuickAction icon={<Mic />} title="Wort sprechen" text="Per Mikrofon erkennen lassen" onClick={() => setPage('add')} />
            <QuickAction icon={<ImageIcon />} title="Bild / PDF" text="Text erkennen und Wörter auswählen" onClick={() => setPage('add')} />
            <QuickAction icon={<Trophy />} title="Top 2000" text="Grundwortschatz gezielt üben" onClick={() => setPage('top')} />
          </div>
        </section>

        <section className="panel recent-panel">
          <div className="panel-head"><div><p className="eyebrow">ZULETZT</p><h3>Deine Wörter</h3></div><button className="text-btn" onClick={() => setPage('words')}>Alle ansehen</button></div>
          <div className="recent-list">
            {recent.map((word) => <WordRow key={word.id} word={word} compact />)}
            {!recent.length && <Empty text="Noch keine Wörter gespeichert." />}
          </div>
        </section>
      </div>
    </div>
  );
}

function StatCard({ level, count, detail }: { level: VocabLevel; count: number; detail: string }) {
  const m = LEVEL_META[level];
  return <div className="stat-card"><span className={`level-dot ${m.className}`} /><div><strong>{count}</strong><span>Stufe {level} · {m.label}</span><small>{detail}</small></div></div>;
}

function QuickAction({ icon, title, text, onClick }: { icon: React.ReactNode; title: string; text: string; onClick: () => void }) {
  return <button className="quick-action" onClick={onClick}><span>{icon}</span><div><strong>{title}</strong><small>{text}</small></div><ChevronRight size={18} /></button>;
}

function Trainer({ words, updateWord, setToast }: { words: VocabItem[]; updateWord: (id: string, patch: Partial<VocabItem>) => void; setToast: (s: string) => void }) {
  const activeWords = useMemo(() => words.filter((w) => w.active), [words]);
  const [queue, setQueue] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null);
  const [mode, setMode] = useState<'write' | 'think'>('write');
  const [revealed, setRevealed] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setQueue(shuffle(activeWords.map((w) => w.id)));
    setIndex(0);
  }, [activeWords.length]);

  const current = words.find((w) => w.id === queue[index]);
  const done = queue.length > 0 && index >= queue.length;

  function next() {
    setAnswer(''); setResult(null); setRevealed(false);
    setIndex((i) => i + 1);
    window.setTimeout(() => inputRef.current?.focus(), 30);
  }

  function grade(correct: boolean) {
    if (!current || result) return;
    const nowStreak = correct ? current.streak + 1 : 0;
    let newLevel = current.level;
    let newStreak = nowStreak;
    if (correct && nowStreak >= 5 && current.level > 1) {
      newLevel = (current.level - 1) as VocabLevel;
      newStreak = 0;
      setToast(`Stufe geschafft: „${current.english}“ ist jetzt ${LEVEL_META[newLevel].color}.`);
    }
    updateWord(current.id, {
      streak: newStreak,
      level: newLevel,
      correct: current.correct + (correct ? 1 : 0),
      wrong: current.wrong + (correct ? 0 : 1),
    });
    setResult(correct ? 'correct' : 'wrong');
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!current || !answer.trim()) return;
    grade(isCorrectAnswer(answer, current.english));
  }

  if (!activeWords.length) return <div className="page-wrap narrow"><PageHeading eyebrow="TRAINER" title="Keine aktiven Wörter" subtitle="Füge neue Wörter hinzu oder aktiviere Wörter aus deiner Liste." /><Empty text="Dein Trainer ist aktuell leer." /></div>;
  if (done) return <div className="page-wrap narrow"><PageHeading eyebrow="RUNDE GESCHAFFT" title="Stark – einmal durch." subtitle={`Du hast ${queue.length} Wörter in dieser Runde bearbeitet.`} /><div className="finish-card"><Trophy size={52} /><h2>Runde abgeschlossen</h2><p>Eine kurze Pause reicht. Danach kannst du direkt die nächste Runde starten.</p><button className="primary" onClick={() => { setQueue(shuffle(activeWords.map(w => w.id))); setIndex(0); }}>Neue Runde</button></div></div>;
  if (!current) return null;

  return (
    <div className="page-wrap narrow">
      <PageHeading eyebrow="TRAINER" title="Schnelle Runde" subtitle="Deutsch sehen, Englisch aktiv abrufen." />
      <div className="trainer-meta">
        <div className="segmented"><button className={mode === 'write' ? 'active' : ''} onClick={() => setMode('write')}>Schreiben</button><button className={mode === 'think' ? 'active' : ''} onClick={() => setMode('think')}>Denken</button></div>
        <span>{index + 1} / {queue.length}</span>
      </div>
      <div className="progress-line"><span style={{ width: `${((index) / queue.length) * 100}%` }} /></div>

      <section className={`trainer-card ${result ? `result-${result}` : ''}`}>
        <div className="trainer-top"><LevelBadge word={current} /><button className="icon-btn" title="Englische Aussprache" onClick={() => speak(current.english)}><Volume2 size={19} /></button></div>
        <p className="question-label">Wie heißt das auf Englisch?</p>
        <h2 className="prompt-word">{current.german}</h2>

        {mode === 'write' ? (
          <form onSubmit={submit} className="answer-form">
            <input ref={inputRef} autoFocus value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Englisches Wort eingeben …" disabled={!!result} autoComplete="off" />
            {!result && <button className="primary" disabled={!answer.trim()}>Prüfen</button>}
          </form>
        ) : (
          <div className="think-area">
            {!revealed && <button className="secondary big" onClick={() => setRevealed(true)}>Antwort anzeigen</button>}
            {revealed && !result && <div className="reveal-answer"><strong>{current.english}</strong><div><button className="danger-soft" onClick={() => grade(false)}><X size={17} /> Nicht gewusst</button><button className="success-soft" onClick={() => grade(true)}><Check size={17} /> Gewusst</button></div></div>}
          </div>
        )}

        {result && <div className={`feedback ${result}`}>
          <div className="feedback-icon">{result === 'correct' ? <Check /> : <X />}</div>
          <div><strong>{result === 'correct' ? 'Richtig' : 'Noch nicht.'}</strong>{result === 'wrong' && <span>Richtig wäre: <b>{current.english}</b></span>}<span>Serie: {current.streak}/5 bis zur nächsten Stufe</span></div>
          <button className="primary" onClick={next}>Weiter <ArrowRight size={17} /></button>
        </div>}
      </section>

      <div className="trainer-footer"><span>Falsch = aktuelle 5er-Serie zurück auf 0. Die Stufe bleibt erhalten.</span>{current.level === 1 && <button className="text-btn" onClick={() => updateWord(current.id, { active: false })}><Archive size={16} /> Wort deaktivieren</button>}</div>
    </div>
  );
}

function AddWords({ addVocab }: { addVocab: (english: string, german: string, source?: VocabSource) => boolean }) {
  const [english, setEnglish] = useState('');
  const [german, setGerman] = useState('');
  const [translating, setTranslating] = useState(false);
  const [listening, setListening] = useState(false);
  const [importState, setImportState] = useState<ImportState | null>(null);
  const [importing, setImporting] = useState(false);
  const [addingSelected, setAddingSelected] = useState(false);
  const [status, setStatus] = useState('');

  async function autoTranslate() {
    if (!english.trim()) return;
    setTranslating(true); setStatus('');
    try { setGerman(await translateWord(english.trim())); }
    catch (e) { setStatus(e instanceof Error ? e.message : 'Übersetzung fehlgeschlagen.'); }
    finally { setTranslating(false); }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (addVocab(english, german, 'manual')) { setEnglish(''); setGerman(''); }
  }

  function startSpeech() {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) { setStatus('Spracherkennung wird in diesem Browser nicht unterstützt. Nutze am besten Chrome oder Edge.'); return; }
    const rec = new Recognition();
    rec.lang = 'en-US'; rec.interimResults = false; rec.continuous = false;
    rec.onresult = (event) => { const text = event.results[0]?.[0]?.transcript || ''; setEnglish(text.trim()); setListening(false); };
    rec.onerror = () => { setStatus('Mikrofon konnte nicht verwendet werden. Prüfe die Browser-Berechtigung.'); setListening(false); };
    rec.onend = () => setListening(false);
    setListening(true); setStatus('Sprich jetzt ein englisches Wort …'); rec.start();
  }

  async function handleFile(file?: File) {
    if (!file) return;
    setImporting(true); setStatus('Datei wird gelesen …'); setImportState(null);
    try {
      let text = '';
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        text = await extractPdf(file, setStatus);
      } else if (file.type.startsWith('image/')) {
        text = await extractImage(file, setStatus);
      } else {
        throw new Error('Bitte ein Bild oder PDF auswählen.');
      }
      const tokens = extractTokens(text);
      setImportState({ text, tokens, selected: new Set(), filename: file.name });
      setStatus(tokens.length ? `${tokens.length} unterschiedliche englische Wörter erkannt.` : 'Kein verwertbarer Text erkannt.');
    } catch (e) { setStatus(e instanceof Error ? e.message : 'Datei konnte nicht verarbeitet werden.'); }
    finally { setImporting(false); }
  }

  function toggleToken(token: string) {
    setImportState((prev) => {
      if (!prev) return prev;
      const selected = new Set(prev.selected);
      selected.has(token) ? selected.delete(token) : selected.add(token);
      return { ...prev, selected };
    });
  }

  async function addSelected() {
    if (!importState?.selected.size) return;
    setAddingSelected(true);
    const selected = Array.from(importState.selected);
    let added = 0;
    for (let i = 0; i < selected.length; i++) {
      const token = selected[i];
      setStatus(`Übersetze ${i + 1}/${selected.length}: ${token}`);
      try {
        const translation = await translateWord(token);
        if (addVocab(token, translation, importState.filename.toLowerCase().endsWith('.pdf') ? 'pdf' : 'image')) added++;
      } catch { /* continue */ }
    }
    setStatus(`${added} Wörter wurden übersetzt und hinzugefügt.`);
    setImportState((prev) => prev ? { ...prev, selected: new Set() } : prev);
    setAddingSelected(false);
  }

  return (
    <div className="page-wrap">
      <PageHeading eyebrow="HINZUFÜGEN" title="Ein Wort. Ein Klick. Weiterlernen." subtitle="Tippen, sprechen oder direkt aus einem Dokument übernehmen." />
      <div className="add-grid">
        <section className="panel add-panel">
          <div className="panel-head"><div><p className="eyebrow">SCHNELL HINZUFÜGEN</p><h3>Englisches Wort</h3></div><Languages size={21} /></div>
          <form onSubmit={submit}>
            <label>Englisch</label>
            <div className="input-with-action"><input value={english} onChange={(e) => setEnglish(e.target.value)} placeholder="z. B. achievement" /><button type="button" className={`mic-btn ${listening ? 'listening' : ''}`} onClick={startSpeech} title="Wort sprechen"><Mic size={19} /></button></div>
            <div className="between-label"><label>Deutsch</label><button type="button" className="text-btn" onClick={autoTranslate} disabled={!english.trim() || translating}><Sparkles size={15} /> {translating ? 'Übersetze …' : 'Automatisch übersetzen'}</button></div>
            <input value={german} onChange={(e) => setGerman(e.target.value)} placeholder="z. B. Erfolg / Errungenschaft" />
            <button className="primary full" disabled={!english.trim() || !german.trim()}><CirclePlus size={18} /> Als Stufe 3 hinzufügen</button>
          </form>
          <div className="hint"><span className="level-dot level-red" /> Neue Wörter starten immer in Stufe 3.</div>
        </section>

        <section className="panel add-panel">
          <div className="panel-head"><div><p className="eyebrow">IMPORT</p><h3>Bild oder PDF</h3></div><Upload size={21} /></div>
          <label className={`dropzone ${importing ? 'busy' : ''}`}>
            <input type="file" accept="image/*,.pdf,application/pdf" onChange={(e) => handleFile(e.target.files?.[0])} />
            <span className="drop-icon">{importing ? <Sparkles /> : <><ImageIcon /><FileText /></>}</span>
            <strong>{importing ? 'Text wird erkannt …' : 'Datei auswählen'}</strong>
            <small>JPG, PNG oder PDF · danach Wörter einfach anklicken</small>
          </label>
          <p className="support-note">Text-PDFs werden direkt ausgelesen. Bei gescannten PDF-Seiten versucht die App zusätzlich OCR.</p>
        </section>
      </div>

      {status && <div className="status-line"><Sparkles size={16} /> {status}</div>}

      {importState && importState.tokens.length > 0 && <section className="panel token-panel">
        <div className="panel-head"><div><p className="eyebrow">{importState.filename}</p><h3>Welche Wörter willst du lernen?</h3><p className="muted">Klicke unbekannte Wörter an. Die Übersetzung wird beim Hinzufügen automatisch ergänzt.</p></div><span className="selection-count">{importState.selected.size} gewählt</span></div>
        <div className="token-cloud">{importState.tokens.map((token) => <button key={token} className={importState.selected.has(token) ? 'selected' : ''} onClick={() => toggleToken(token)}>{token}{importState.selected.has(token) && <Check size={13} />}</button>)}</div>
        <div className="token-actions"><button className="secondary" onClick={() => setImportState((prev) => prev ? { ...prev, selected: new Set(prev.tokens) } : prev)}>Alle auswählen</button><button className="primary" onClick={addSelected} disabled={!importState.selected.size || addingSelected}><CirclePlus size={18} /> {addingSelected ? 'Wird hinzugefügt …' : `${importState.selected.size} Wörter hinzufügen`}</button></div>
      </section>}
    </div>
  );
}

function TopWords({ addVocab, words }: { addVocab: (english: string, german: string, source?: VocabSource) => boolean; words: VocabItem[] }) {
  const top2000 = useMemo(() => popularEnglishWords.getMostPopular(2500).filter((w) => /^[a-zA-Z'-]+$/.test(w)).slice(0, 2000), []);
  const [index, setIndex] = useState(0);
  const [translation, setTranslation] = useState('');
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [browse, setBrowse] = useState(false);
  const known = new Set(words.map((w) => w.english.toLowerCase()));
  const current = top2000[index % top2000.length];
  const filtered = useMemo(() => top2000.filter((w) => w.includes(search.toLowerCase())).slice(0, 100), [top2000, search]);

  async function reveal(word = current) {
    setLoading(true); setTranslation('');
    try { setTranslation(await translateWord(word)); }
    catch { setTranslation('Übersetzung nicht verfügbar'); }
    finally { setLoading(false); }
  }

  function next() { setIndex((i) => (i + 1) % top2000.length); setTranslation(''); }
  function previous() { setIndex((i) => (i - 1 + top2000.length) % top2000.length); setTranslation(''); }

  return (
    <div className="page-wrap narrow-wide">
      <PageHeading eyebrow="GRUNDWORTSCHATZ" title="Die 2000 wichtigsten Wörter" subtitle="Separat von deinen eigenen Vokabeln. Unbekannte Wörter kannst du mit einem Klick übernehmen." />
      <div className="top-tabs"><button className={!browse ? 'active' : ''} onClick={() => setBrowse(false)}>Schnelltraining</button><button className={browse ? 'active' : ''} onClick={() => setBrowse(true)}>Liste durchsuchen</button></div>

      {!browse ? <section className="top-card">
        <div className="top-rank">#{index + 1} von {top2000.length}</div>
        <h2>{current}</h2>
        <button className="speaker-float" onClick={() => speak(current)}><Volume2 size={21} /></button>
        {!translation ? <button className="secondary big" onClick={() => reveal()} disabled={loading}>{loading ? 'Übersetze …' : 'Übersetzung anzeigen'}</button> : <div className="top-translation"><span>Deutsch</span><strong>{translation}</strong></div>}
        <div className="top-controls"><button className="icon-btn big-icon" onClick={previous}><ArrowLeft /></button><button className="primary" disabled={!translation || translation === 'Übersetzung nicht verfügbar' || known.has(current.toLowerCase())} onClick={() => addVocab(current, translation, 'top2000')}>{known.has(current.toLowerCase()) ? <><Check size={18} /> Schon gespeichert</> : <><CirclePlus size={18} /> Zu meinen Wörtern</>}</button><button className="icon-btn big-icon" onClick={next}><ArrowRight /></button></div>
      </section> : <section className="panel">
        <div className="searchbox"><Search size={18} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="In Top 2000 suchen …" /></div>
        <div className="top-list">{filtered.map((word) => <TopListItem key={word} word={word} saved={known.has(word.toLowerCase())} addVocab={addVocab} />)}</div>
        <p className="support-note">Aus Performance-Gründen zeigt die Suche maximal 100 Treffer gleichzeitig.</p>
      </section>}
    </div>
  );
}

function TopListItem({ word, saved, addVocab }: { word: string; saved: boolean; addVocab: (english: string, german: string, source?: VocabSource) => boolean }) {
  const [translation, setTranslation] = useState('');
  const [loading, setLoading] = useState(false);
  async function translateAndAdd() {
    if (saved) return;
    setLoading(true);
    try { const t = translation || await translateWord(word); setTranslation(t); addVocab(word, t, 'top2000'); }
    finally { setLoading(false); }
  }
  return <div className="top-list-row"><div><strong>{word}</strong>{translation && <small>{translation}</small>}</div><button className={saved ? 'saved-btn' : 'small-btn'} disabled={saved || loading} onClick={translateAndAdd}>{saved ? <><Check size={15} /> Gespeichert</> : loading ? '…' : '+ Hinzufügen'}</button></div>;
}

function WordsList({ words, updateWord, removeWord }: { words: VocabItem[]; updateWord: (id: string, patch: Partial<VocabItem>) => void; removeWord: (id: string) => void }) {
  const [filter, setFilter] = useState<FilterKey>('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'new' | 'hard' | 'az'>('new');
  const visible = useMemo(() => {
    let list = words.filter((w) => w.english.toLowerCase().includes(search.toLowerCase()) || w.german.toLowerCase().includes(search.toLowerCase()));
    if (filter === 'inactive') list = list.filter((w) => !w.active);
    else if (filter !== 'all') list = list.filter((w) => w.active && w.level === Number(filter));
    if (sort === 'new') list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (sort === 'hard') list.sort((a, b) => b.level - a.level || b.wrong - a.wrong);
    if (sort === 'az') list.sort((a, b) => a.english.localeCompare(b.english));
    return list;
  }, [words, search, filter, sort]);

  function exportJson() {
    const blob = new Blob([JSON.stringify(words, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'vocabfast-backup.json'; a.click(); URL.revokeObjectURL(url);
  }

  return (
    <div className="page-wrap">
      <div className="page-title-row"><PageHeading eyebrow="BIBLIOTHEK" title="Meine Wörter" subtitle={`${words.length} Wörter gespeichert · Fortschritt bleibt auf diesem Browser erhalten.`} /><button className="secondary desktop-only" onClick={exportJson}>Backup exportieren</button></div>
      <section className="panel words-panel">
        <div className="toolbar"><div className="searchbox"><Search size={18} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Englisch oder Deutsch suchen …" /></div><div className="sort-select"><ListFilter size={17} /><select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}><option value="new">Neueste zuerst</option><option value="hard">Schwierigste zuerst</option><option value="az">A–Z</option></select></div></div>
        <div className="filter-row"><Filter size={16} /><FilterButton active={filter === 'all'} onClick={() => setFilter('all')}>Alle</FilterButton><FilterButton active={filter === '3'} onClick={() => setFilter('3')}><span className="level-dot level-red" /> Stufe 3</FilterButton><FilterButton active={filter === '2'} onClick={() => setFilter('2')}><span className="level-dot level-yellow" /> Stufe 2</FilterButton><FilterButton active={filter === '1'} onClick={() => setFilter('1')}><span className="level-dot level-green" /> Stufe 1</FilterButton><FilterButton active={filter === 'inactive'} onClick={() => setFilter('inactive')}><Archive size={14} /> Deaktiviert</FilterButton></div>
        <div className="word-table"><div className="word-table-head"><span>Vokabel</span><span>Stufe</span><span>Serie</span><span>Status</span><span /></div>{visible.map((word) => <WordRow key={word.id} word={word} updateWord={updateWord} removeWord={removeWord} />)}{!visible.length && <Empty text="Keine passenden Wörter gefunden." />}</div>
      </section>
    </div>
  );
}

function WordRow({ word, compact = false, updateWord, removeWord }: { word: VocabItem; compact?: boolean; updateWord?: (id: string, patch: Partial<VocabItem>) => void; removeWord?: (id: string) => void }) {
  if (compact) return <div className="recent-row"><span className={`level-dot ${LEVEL_META[word.level].className}`} /><div><strong>{word.english}</strong><small>{word.german}</small></div><span>Stufe {word.level}</span></div>;
  return <div className={`word-row ${!word.active ? 'inactive' : ''}`}><div className="word-main"><strong>{word.english}</strong><small>{word.german}</small></div><div><span className={`level-badge ${LEVEL_META[word.level].className}`}><span /> Stufe {word.level}</span></div><div className="streak-mini"><span>{word.streak}/5</span><div>{[0,1,2,3,4].map(i => <i key={i} className={i < word.streak ? 'on' : ''} />)}</div></div><div><button className={`status-toggle ${word.active ? 'active' : ''}`} onClick={() => updateWord?.(word.id, { active: !word.active })}>{word.active ? 'Aktiv' : 'Pausiert'}</button></div><div className="row-actions"><button className="icon-btn" onClick={() => speak(word.english)} title="Aussprache"><Volume2 size={17} /></button><button className="icon-btn danger-icon" onClick={() => removeWord?.(word.id)} title="Löschen"><Trash2 size={17} /></button></div></div>;
}

function FilterButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button className={`filter-btn ${active ? 'active' : ''}`} onClick={onClick}>{children}</button>;
}

function LevelBadge({ word }: { word: VocabItem }) {
  return <span className={`level-badge ${LEVEL_META[word.level].className}`}><span /> Stufe {word.level} · {word.streak}/5</span>;
}

function PageHeading({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  return <div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="subtitle">{subtitle}</p></div>;
}

function Empty({ text }: { text: string }) { return <div className="empty"><BookOpen size={28} /><span>{text}</span></div>; }

function ProModal({ onClose }: { onClose: () => void }) {
  return <div className="modal-backdrop" onMouseDown={onClose}><div className="modal" onMouseDown={(e) => e.stopPropagation()}><button className="modal-close" onClick={onClose}><X /></button><span className="pro-icon big"><Sparkles /></span><p className="eyebrow">VOCABFAST PRO</p><h2>Mehr Wörter. Weniger Aufwand.</h2><p className="subtitle">Die Oberfläche für das spätere Abo ist bereits eingeplant. In diesem Test-MVP ist noch keine echte Zahlung aktiviert.</p><div className="price-grid"><div><strong>4,99 €</strong><span>pro Monat</span></div><div className="recommended"><small>EMPFOHLEN</small><strong>39,99 €</strong><span>pro Jahr</span></div></div><ul className="feature-list"><li><Check /> Unbegrenzte eigene Wörter</li><li><Check /> Bild- und PDF-Import</li><li><Check /> Mikrofon & automatische Übersetzung</li><li><Check /> Später: Cloud-Sync & Gerätewechsel</li></ul><button className="primary full" disabled><Sparkles size={18} /> Abo im MVP noch nicht aktiviert</button><p className="modal-note">Für die Produktivversion kann hier z. B. Stripe für die Web-App und später Store-Abos für iOS/Android angeschlossen werden.</p></div></div>;
}

function shuffle<T>(items: T[]): T[] { return [...items].sort(() => Math.random() - 0.5); }
function speak(text: string) { if ('speechSynthesis' in window) { window.speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang = 'en-US'; u.rate = 0.9; window.speechSynthesis.speak(u); } }

async function extractImage(file: File, setStatus: (s: string) => void) {
  setStatus('OCR wird geladen …');
  const Tesseract = await import('tesseract.js');
  const result = await Tesseract.recognize(file, 'eng', { logger: (m) => { if (m.status === 'recognizing text' && typeof m.progress === 'number') setStatus(`Texterkennung ${Math.round(m.progress * 100)} % …`); } });
  return result.data.text;
}

async function extractPdf(file: File, setStatus: (s: string) => void) {
  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();
  const bytes = new Uint8Array(await file.arrayBuffer());
  const pdf = await pdfjs.getDocument({ data: bytes }).promise;
  const parts: string[] = [];
  const maxPages = Math.min(pdf.numPages, 12);
  for (let i = 1; i <= maxPages; i++) {
    setStatus(`PDF-Seite ${i}/${maxPages} wird gelesen …`);
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    let pageText = content.items.map((item) => 'str' in item ? item.str : '').join(' ').trim();
    if (pageText.length < 10) {
      setStatus(`Scan auf Seite ${i}: OCR läuft …`);
      const viewport = page.getViewport({ scale: 1.35 });
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = viewport.width; canvas.height = viewport.height;
        await page.render({ canvasContext: ctx, viewport }).promise;
        const Tesseract = await import('tesseract.js');
        const ocr = await Tesseract.recognize(canvas, 'eng');
        pageText = ocr.data.text;
      }
    }
    parts.push(pageText);
  }
  if (pdf.numPages > maxPages) setStatus(`Die ersten ${maxPages} Seiten wurden verarbeitet.`);
  return parts.join('\n');
}

export default App;
