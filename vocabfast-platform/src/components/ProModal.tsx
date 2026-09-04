import { previewBilling } from '../learning/billing';
import './pro-modal.css';

type Props = { onClose: () => void };

const proFeatures = [
  ['KI-Sprachcoach', 'Rollenspiele, freie Dialoge und persönliches Feedback'],
  ['Aussprache & Sprechen', 'Spracherkennung, bessere Stimmen und gezielte Wiederholung'],
  ['Fachsprache', 'Aviation, Business, Medizin, Technik & IT und Tourismus'],
  ['Dokumentlernen', 'Eigene PDFs und Texte in persönliche Übungen verwandeln'],
  ['Adaptive Analyse', 'Schwachstellen, Mastery und intelligente Wiederholungen'],
  ['Kompetenztests', 'Strukturierte Tests, Einstufung und Fortschrittsnachweise']
];

export default function ProModal({ onClose }: Props) {
  function checkout() {
    window.location.assign(previewBilling.checkoutUrl);
  }

  return <div className="pro-modal-backdrop" role="dialog" aria-modal="true" onMouseDown={onClose}>
    <section className="pro-modal" onMouseDown={event=>event.stopPropagation()}>
      <button className="pro-modal-close" onClick={onClose} aria-label="Pro Fenster schließen">×</button>
      <div className="pro-modal-hero">
        <span className="pro-pill">VOCABFAST PRO</span>
        <h1>Mehr als Lektionen. Ein persönliches Sprachtraining.</h1>
        <p>Pro verbindet unbegrenztes Training mit Sprechen, Fachsprache, Analyse und dem VocabFast Coach.</p>
        <div className="pro-price"><strong>19,99 €</strong><span>/ Monat</span></div>
        <small>Cloudflare-Preview · Stripe läuft aktuell ausschließlich im Testmodus.</small>
      </div>
      <div className="pro-feature-grid">{proFeatures.map(([title,copy])=><article key={title}><span>✓</span><div><strong>{title}</strong><p>{copy}</p></div></article>)}</div>
      <div className="plan-compare">
        <article><span>FREE</span><h2>VocabFast Free</h2><strong>0 €</strong><ul><li>strukturierter A1–C2-Kursrücken</li><li>Wortschatz & Grammatik</li><li>Hörtraining</li><li>Basis-Fortschritt</li></ul></article>
        <article className="recommended"><span>PRO · EMPFOHLEN</span><h2>VocabFast Pro</h2><strong>19,99 € <small>/ Monat</small></strong><ul><li>alles aus Free</li><li>unbegrenzte adaptive Übungen</li><li>Sprechen & Aussprache</li><li>alle Fachbereiche</li><li>KI-Coach & Dokumentlernen</li></ul></article>
      </div>
      <button className="pro-preview-action" onClick={checkout}>Stripe-Testcheckout öffnen →</button>
      <small className="pro-test-note">Es wird in dieser Preview kein echtes Geld belastet und noch kein produktiver Pro-Status vergeben.</small>
    </section>
  </div>;
}
