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

function developerCheckoutAllowed() {
  if(typeof window==='undefined')return false;
  return window.location.hostname.endsWith('.workers.dev')||window.location.hostname==='localhost'||window.location.hostname==='127.0.0.1';
}

export default function ProModal({ onClose }: Props) {
  const canTestCheckout=previewBilling.mode==='test'&&developerCheckoutAllowed();

  function checkout() {
    if(!canTestCheckout)return;
    window.location.assign(previewBilling.checkoutUrl);
  }

  return <div className="pro-modal-backdrop" role="dialog" aria-modal="true" onMouseDown={onClose}>
    <section className="pro-modal" onMouseDown={event=>event.stopPropagation()}>
      <button className="pro-modal-close" onClick={onClose} aria-label="Pro Fenster schließen">×</button>
      <div className="pro-modal-hero">
        <span className="pro-pill">VOCABFAST PRO</span>
        <h1>Mehr als Lektionen. Ein persönliches Sprachtraining.</h1>
        <p>Pro verbindet intensives Training mit Sprechen, Fachsprache, Analyse und dem VocabFast Coach.</p>
        <div className="pro-price"><strong>19,99 €</strong><span>/ Monat</span></div>
        <small>Monatlich kündbar. Free bleibt dauerhaft nutzbar.</small>
      </div>
      <div className="pro-feature-grid">{proFeatures.map(([title,copy])=><article key={title}><span>✓</span><div><strong>{title}</strong><p>{copy}</p></div></article>)}</div>
      <div className="plan-compare">
        <article><span>FREE</span><h2>VocabFast Free</h2><strong>0 €</strong><ul><li>A1–C2-Lernpfad</li><li>Wortschatz & Grammatik</li><li>Hörtraining</li><li>Basis-Fortschritt</li></ul></article>
        <article className="recommended"><span>PRO · EMPFOHLEN</span><h2>VocabFast Pro</h2><strong>19,99 € <small>/ Monat</small></strong><ul><li>alles aus Free</li><li>intensives adaptives Training</li><li>Sprechen & Aussprache</li><li>alle Fachbereiche</li><li>KI-Coach & Dokumentlernen</li></ul></article>
      </div>
      {canTestCheckout&&<><button className="pro-preview-action" onClick={checkout}>Testkauf öffnen →</button><small className="pro-test-note">Interner Testcheckout – es wird kein echtes Geld belastet.</small></>}
      <div className="pro-test-note"><a href="https://vocabfast.net/nutzungsbedingungen.html">Nutzungsbedingungen</a> · <a href="https://vocabfast.net/widerruf.html">Widerruf</a> · <a href="https://vocabfast.net/datenschutz.html">Datenschutz</a></div>
    </section>
  </div>;
}
