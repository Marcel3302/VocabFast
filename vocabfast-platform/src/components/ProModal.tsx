import './pro-modal.css';

type Props = { onClose: () => void };

const proFeatures = [
  ['KI-Sprachcoach', 'Rollenspiele, freie Dialoge und persönliches Feedback'],
  ['Aussprache & Sprechen', 'Spracherkennung, Aussprachetraining und gezielte Wiederholung'],
  ['Fachsprache', 'Aviation, Business, Medizin, Technik & IT und Tourismus'],
  ['Dokumentlernen', 'Eigene PDFs und Texte in persönliche Übungen verwandeln'],
  ['Adaptive Analyse', 'Schwachstellen, Mastery und intelligente Wiederholungen'],
  ['Kompetenztests', 'Strukturierte Tests und Fortschrittsnachweise']
];

export default function ProModal({ onClose }: Props) {
  return <div className="pro-modal-backdrop" role="dialog" aria-modal="true" onMouseDown={onClose}>
    <section className="pro-modal" onMouseDown={event=>event.stopPropagation()}>
      <button className="pro-modal-close" onClick={onClose} aria-label="Pro Fenster schließen">×</button>
      <div className="pro-modal-hero">
        <span className="pro-pill">VOCABFAST PRO</span>
        <h1>Mehr als Lektionen. Ein persönliches Sprachtraining.</h1>
        <p>Pro verbindet unbegrenztes Training mit Sprechen, Fachsprache, Analyse und später dem VocabFast KI-Coach.</p>
        <div className="pro-price"><strong>19,99 €</strong><span>/ Monat</span></div>
        <small>Geplanter Zielpreis · Checkout wird vor dem Produktivstart separat freigeschaltet.</small>
      </div>
      <div className="pro-feature-grid">{proFeatures.map(([title,copy])=><article key={title}><span>✓</span><div><strong>{title}</strong><p>{copy}</p></div></article>)}</div>
      <div className="plan-compare">
        <article><span>FREE</span><h2>VocabFast Free</h2><strong>0 €</strong><ul><li>strukturierter Grundkurs</li><li>Wortschatz & Grammatik</li><li>Hörtraining</li><li>Basis-Fortschritt</li></ul></article>
        <article className="recommended"><span>PRO · EMPFOHLEN</span><h2>VocabFast Pro</h2><strong>19,99 € <small>/ Monat</small></strong><ul><li>alles aus Free</li><li>unbegrenzte adaptive Übungen</li><li>Sprechen & Aussprache</li><li>alle Fachbereiche</li><li>KI-Coach & Dokumentlernen</li></ul></article>
      </div>
      <button className="pro-preview-action" onClick={onClose}>Weiter im kostenlosen Prototyp</button>
    </section>
  </div>;
}
