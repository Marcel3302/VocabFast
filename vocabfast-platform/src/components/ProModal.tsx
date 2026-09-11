
import { type AccountUser } from '../learning/account';
import { useEffect, useState } from 'react';
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

export default function ProModal({ onClose,user }: Props) {
  const [opening,setOpening]=useState(false),[error,setError]=useState('');
  const [billing,setBilling]=useState<{ready:boolean;mode:string;plan:string}|null>(null);
  useEffect(()=>{let active=true;fetch('/api/preview/billing/status').then(async r=>{if(!r.ok)throw new Error();return r.json()}).then(data=>{if(active)setBilling(data)}).catch(()=>{if(active)setError('Der Zahlungsstatus konnte nicht geladen werden. Bitte öffne dieses Fenster später erneut.');});return()=>{active=false}},[]);
  const developerHost=()=>billing?.mode==='test';
  const canCheckout=Boolean(billing?.ready),showTestNote=developerHost();
  async function checkout(){if(!canCheckout||opening)return;setOpening(true);setError('');try{const response=await fetch(`/api/preview/billing/${user?.plan==='pro'?'portal':'checkout'}`,{method:'POST',credentials:'same-origin'});const data=await response.json();if(!response.ok||!data.url)throw new Error(data.error||'Stripe konnte nicht geöffnet werden.');const url=new URL(data.url);if(!['checkout.stripe.com','billing.stripe.com'].includes(url.hostname)||url.protocol!=='https:')throw new Error('Ungültige Zahlungsadresse.');window.location.assign(url.href);}catch(reason){setError(reason instanceof Error?reason.message:'Stripe konnte nicht geöffnet werden.');setOpening(false);}}

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
      {error&&<p className="pro-test-note" role="alert">{error}</p>}
      {billing&&!billing.ready&&<p className="pro-test-note">Pro-Zahlungen sind noch nicht freigeschaltet. Dein kostenloser Lernzugang bleibt nutzbar.</p>}
      {canCheckout&&<>
        <button className="pro-preview-action" disabled={opening} onClick={()=>void checkout()}>{opening?'Stripe wird geöffnet …':user?.plan==='pro'?'Abo verwalten →':showTestNote?'Testzahlung bei Stripe →':'Weiter zu Stripe →'}</button>
        {showTestNote&&<small className="pro-test-note">Stripe-Testmodus: Der Zahlungsablauf kann ausprobiert werden, ohne dass echtes Geld belastet wird.</small>}
      </>}
      <div className="pro-test-note"><a href="https://vocabfast.net/nutzungsbedingungen.html">Nutzungsbedingungen</a> · <a href="https://vocabfast.net/widerruf.html">Widerruf</a> · <a href="https://vocabfast.net/datenschutz.html">Datenschutz</a></div>
    </section>
  </div>;
}
