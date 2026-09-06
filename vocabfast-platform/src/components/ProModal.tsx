import { previewBilling } from '../learning/billing';
import type { AccountUser } from '../learning/account';
import './pro-modal.css';

type Props = { onClose: () => void; user?:AccountUser|null };

const proFeatures = [
  ['KI-Sprachcoach', 'Rollenspiele, freie Dialoge und persönliches Feedback'],
  ['Aussprache & Sprechen', 'Spracherkennung, bessere Stimmen und gezielte Wiederholung'],
  ['Fachsprache', 'Aviation, Business, Medizin, Technik & IT und Tourismus'],
  ['Dokumentlernen', 'Eigene PDFs und Texte in persönliche Übungen verwandeln'],
  ['Adaptive Analyse', 'Schwachstellen, Mastery und intelligente Wiederholungen'],
  ['Kompetenztests', 'Strukturierte Tests, Einstufung und Fortschrittsnachweise']
];

function stripeCheckoutAllowed() {
  if(typeof window==='undefined')return false;
  const host=window.location.hostname;
  return host==='vocabfast.net'||host==='www.vocabfast.net'||host.endsWith('.workers.dev')||host==='localhost'||host==='127.0.0.1';
}

function developerHost() {
  if(typeof window==='undefined')return false;
  const host=window.location.hostname;
  return host.endsWith('.workers.dev')||host==='localhost'||host==='127.0.0.1';
}

function accountCheckoutUrl(user?:AccountUser|null) {
  if(!previewBilling.checkoutUrl)return '';
  try {
    const url=new URL(previewBilling.checkoutUrl);
    if(user?.id)url.searchParams.set('client_reference_id',user.id);
    if(user?.email)url.searchParams.set('prefilled_email',user.email);
    return url.toString();
  } catch {return previewBilling.checkoutUrl;}
}

export default function ProModal({ onClose,user }: Props) {
  const checkoutUrl=accountCheckoutUrl(user);
  const canCheckout=Boolean(checkoutUrl)&&stripeCheckoutAllowed();
  const showTestNote=previewBilling.mode==='test'&&developerHost();

  function checkout() {
    if(!canCheckout)return;
    window.location.assign(checkoutUrl);
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
      {canCheckout&&<>
        <button className="pro-preview-action" onClick={checkout}>Weiter zu Stripe →</button>
        {showTestNote&&<small className="pro-test-note">Stripe-Testmodus: Der Zahlungsablauf kann ausprobiert werden, ohne dass echtes Geld belastet wird.</small>}
      </>}
      <div className="pro-test-note"><a href="https://vocabfast.net/nutzungsbedingungen.html">Nutzungsbedingungen</a> · <a href="https://vocabfast.net/widerruf.html">Widerruf</a> · <a href="https://vocabfast.net/datenschutz.html">Datenschutz</a></div>
    </section>
  </div>;
}
