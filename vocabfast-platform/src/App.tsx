import { useMemo, useState } from 'react';
import { languages, learningUnits, specialties } from './data/catalog';

const navItems = [
  ['home', 'Lernpfad'],
  ['practice', 'Üben'],
  ['words', 'Wortschatz'],
  ['specialty', 'Fachsprache'],
  ['progress', 'Fortschritt']
] as const;

type NavId = typeof navItems[number][0];

function App() {
  const [activeNav, setActiveNav] = useState<NavId>('home');
  const [languageOpen, setLanguageOpen] = useState(false);
  const [languageCode, setLanguageCode] = useState('en');
  const activeLanguage = useMemo(() => languages.find(l => l.code === languageCode) ?? languages[0], [languageCode]);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-row">
          <div className="brand-mark" aria-hidden="true">V</div>
          <div>
            <strong>VocabFast</strong>
            <span>Language Platform</span>
          </div>
        </div>

        <button className="language-switch" onClick={() => setLanguageOpen(true)}>
          <span className="language-badge">{activeLanguage.symbol}</span>
          <span className="language-switch-copy">
            <small>Ich lerne</small>
            <strong>{activeLanguage.name}</strong>
          </span>
          <span className="chevron">⌄</span>
        </button>

        <nav className="main-nav" aria-label="Hauptnavigation">
          {navItems.map(([id, label], index) => (
            <button key={id} className={activeNav === id ? 'active' : ''} onClick={() => setActiveNav(id)}>
              <span className="nav-icon">{['⌂','◎','Aa','◇','↗'][index]}</span>
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-spacer" />
        <div className="pro-mini-card">
          <span className="pro-pill">PRO</span>
          <strong>Mehr aus jeder Minute.</strong>
          <p>KI-Coach, Fachsprache, Analyse und unbegrenztes Training.</p>
          <button>Pro entdecken</button>
        </div>
        <button className="profile-link"><span>MS</span><div><strong>Marcel</strong><small>Level 12</small></div></button>
      </aside>

      <main className="content">
        <header className="topbar">
          <div className="mobile-brand"><div className="brand-mark">V</div><strong>VocabFast</strong></div>
          <div className="topbar-stats">
            <div><span>◆</span><strong>1.840</strong><small>XP</small></div>
            <div><span>🔥</span><strong>12</strong><small>Tage</small></div>
            <div><span>◉</span><strong>4/5</strong><small>Ziel</small></div>
          </div>
        </header>

        <div className="page-grid">
          <section className="primary-column">
            <div className="hero-panel">
              <div className="hero-copy">
                <span className="eyebrow">GUTEN TAG, MARCEL</span>
                <h1>Heute wird dein Englisch ein Stück stärker.</h1>
                <p>Dein Lernpfad passt Wiederholungen und neue Inhalte an deine bisherigen Antworten an.</p>
                <div className="hero-actions">
                  <button className="primary-action">Weiterlernen <span>→</span></button>
                  <button className="secondary-action">Tagesplan ansehen</button>
                </div>
              </div>
              <div className="hero-orbit" aria-hidden="true">
                <div className="orbit-ring ring-one" />
                <div className="orbit-ring ring-two" />
                <div className="core-word"><span>B1</span><strong>72%</strong><small>Im Alltag</small></div>
                <div className="orbit-dot dot-one">A</div>
                <div className="orbit-dot dot-two">✓</div>
                <div className="orbit-dot dot-three">Aa</div>
              </div>
            </div>

            <div className="section-heading">
              <div><span className="eyebrow">DEIN WEG</span><h2>Englisch · B1</h2></div>
              <button className="text-button">Alle Einheiten</button>
            </div>

            <div className="learning-path">
              {learningUnits.map((unit, index) => (
                <article key={unit.id} className={`unit-card ${unit.state}`}>
                  <div className="path-rail">
                    <div className="unit-node">{unit.state === 'done' ? '✓' : unit.id}</div>
                    {index < learningUnits.length - 1 && <div className="rail-line" />}
                  </div>
                  <div className="unit-body">
                    <div className="unit-topline"><span>Einheit {unit.id}</span><span>{unit.lessons} Lektionen</span></div>
                    <h3>{unit.title}</h3>
                    <p>{unit.subtitle}</p>
                    <div className="progress-row"><div className="progress-track"><span style={{width: `${unit.progress}%`}} /></div><strong>{unit.progress}%</strong></div>
                    <div className="lesson-chips">
                      {[1,2,3,4,5].map((lesson) => <span key={lesson} className={lesson <= Math.ceil(unit.progress / 20) ? 'complete' : ''}>{lesson <= Math.floor(unit.progress / 20) ? '✓' : lesson}</span>)}
                    </div>
                    {unit.state === 'active' && <button className="unit-action">Nächste Lektion starten <span>→</span></button>}
                    {unit.state === 'locked' && <span className="locked-copy">Wird nach der vorherigen Einheit freigeschaltet</span>}
                  </div>
                </article>
              ))}
            </div>

            <div className="section-heading specialty-heading">
              <div><span className="eyebrow">DEIN VORTEIL</span><h2>Fachsprache für echte Situationen</h2></div>
              <span className="pro-label">PRO</span>
            </div>
            <div className="specialty-grid">
              {specialties.slice(0, 4).map(item => (
                <article key={item.id} className="specialty-card">
                  <div className="specialty-icon">{item.icon}</div>
                  <div><strong>{item.name}</strong><p>{item.description}</p></div>
                  <button aria-label={`${item.name} öffnen`}>→</button>
                </article>
              ))}
            </div>
          </section>

          <aside className="right-column">
            <section className="daily-card">
              <div className="card-heading"><div><span className="eyebrow">HEUTE</span><h3>Tagesziel</h3></div><strong>4/5</strong></div>
              <div className="daily-ring"><div><strong>80%</strong><span>geschafft</span></div></div>
              <div className="task-list">
                <div className="done"><span>✓</span><div><strong>Neue Wörter</strong><small>10 von 10</small></div></div>
                <div className="done"><span>✓</span><div><strong>Wiederholung</strong><small>15 von 15</small></div></div>
                <div className="done"><span>✓</span><div><strong>Grammatik</strong><small>1 Lektion</small></div></div>
                <div className="done"><span>✓</span><div><strong>Hörtraining</strong><small>5 Minuten</small></div></div>
                <div><span>5</span><div><strong>Sprechen</strong><small>Noch 3 Minuten</small></div></div>
              </div>
            </section>

            <section className="coach-card">
              <div className="coach-head"><div className="coach-mark">AI</div><div><span className="eyebrow">VOCABFAST COACH</span><h3>Ein Muster fällt auf.</h3></div></div>
              <p>Bei Zeitformen bist du sicher. Präpositionen kosten dich aktuell die meisten Punkte.</p>
              <div className="coach-insight"><span>Fokus heute</span><strong>Prepositions of time</strong><small>8-Minuten-Training empfohlen</small></div>
              <button>Training starten</button>
            </section>

            <section className="streak-card">
              <div className="card-heading"><div><span className="eyebrow">KONTINUITÄT</span><h3>12 Tage am Stück</h3></div><span className="streak-fire">🔥</span></div>
              <div className="week-row">{['M','D','M','D','F','S','S'].map((d,i)=><div key={`${d}-${i}`} className={i < 5 ? 'complete' : i === 5 ? 'today' : ''}><span>{i < 5 ? '✓' : i === 5 ? '•' : ''}</span><small>{d}</small></div>)}</div>
              <p>3 weitere Tage bis zum nächsten Meilenstein.</p>
            </section>

            <section className="pro-card">
              <span className="pro-pill">VOCABFAST PRO</span>
              <h3>Dein persönlicher Sprachcoach.</h3>
              <p>Unbegrenztes KI-Training, Ausspracheanalyse, Fachbereiche, Dokumentlernen und Kompetenztests.</p>
              <div className="price-row"><strong>19,99 €</strong><span>/ Monat</span></div>
              <button>Pro freischalten</button>
              <small>Jederzeit kündbar · Jahresabo später verfügbar</small>
            </section>
          </aside>
        </div>
      </main>

      {languageOpen && (
        <div className="modal-backdrop" onMouseDown={() => setLanguageOpen(false)}>
          <section className="language-modal" onMouseDown={event => event.stopPropagation()}>
            <div className="modal-head"><div><span className="eyebrow">SPRACHEN</span><h2>Was möchtest du lernen?</h2><p>Die Lernengine ist für zehn Sprachen vorbereitet. Englisch wird zuerst vollständig ausgebaut.</p></div><button onClick={() => setLanguageOpen(false)}>×</button></div>
            <div className="language-grid">
              {languages.map(language => (
                <button key={language.code} disabled={!language.available} className={languageCode === language.code ? 'selected' : ''} onClick={() => {setLanguageCode(language.code); setLanguageOpen(false)}}>
                  <span className="language-tile-symbol">{language.symbol}</span>
                  <div><strong>{language.name}</strong><small>{language.nativeName}</small></div>
                  <em>{language.available ? 'Verfügbar' : 'In Vorbereitung'}</em>
                </button>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default App;
