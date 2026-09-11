import { type AccountUser } from '../learning/account';
import { useEffect, useState } from 'react';
import './pro-modal.css';

type Props = { onClose: () => void; user?:AccountUser|null };
type BillingStatus={
  ready:boolean;
  checkoutReady?:boolean;
  webhookReady?:boolean;
  mode:'test'|'live'|string;
  plan:'free'|'pro'|string;
  subscriptionStatus?:string;
  cancelAtPeriodEnd?:boolean;
  currentPeriodEnd?:string|null;
};

const proFeatures = [
  ['KI-Sprachcoach', 'Rollenspiele, freie Dialoge und persönliches Feedback'],
  ['Aussprache & Sprechen', 'Spracherkennung, bessere Stimmen und gezielte Wiederholung'],
  ['Fachsprache', 'Aviation, Business, Medizin, Technik & IT und Tourismus'],
  ['Dokumentlernen', 'Eigene PDFs und Texte in persönliche Übungen verwandeln'],
  ['Adaptive Analyse', 'Schwachstellen, Mastery und intelligente Wiederholungen'],
  ['Kompetenztests', 'Strukturierte Tests, Einstufung und Fortschrittsnachweise']
];

function periodLabel(value?:string|null){if(!value)return '';try{return new Intl.DateTimeFormat('de-AT',{dateStyle:'medium'}).format(new Date(value));}catch{return '';}}

export default function ProModal({ onClose,user }: Props) {
  const [opening,setOpening]=useState(false),[error,setError]=useState('');
  const [billing,setBilling]=useState<BillingStatus|null>(null);
  useEffect(()=>{let active=true;fetch('/api/preview/billing/status',{credentials:'same-origin',cache:'no-store'}).then(async r=>{const data=await r.json().catch(()=>({}));if(!r.ok)throw new Error(data.error||'Zahlungsstatus nicht verfügbar.');return data}).then(data=>{if(active)setBilling(data)}).catch(reason=>{if(active)setError(reason instanceof Error?reason.message:'Der Zahlungsstatus konnte nicht geladen werden.');});return()=>{active=false}},[]);
  const testMode=billing?.mode==='test';
  const canCheckout=Boolean(billing?.ready);
  const activePlan=(billing?.plan||user?.plan)==='pro';
  const renewalDate=periodLabel(billing?.currentPeriodEnd);
  async function checkout(){if(!canCheckout||opening)return;setOpening(true);setError('');try{const response=await fetch(`/api/preview/billing/${activePlan?'portal':'checkout'}`,{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'}});const data=await response.json().catch(()=>({}));if(!response.ok||!data.url)throw new Error(data.error||'Stripe konnte nicht geöffnet werden.');const url=new URL(data.url);if(!['checkout.stripe.com','billing.stripe.com'].includes(url.hostname)||url.protocol!=='https:')throw new Error('Ungültige Zahlungsadresse.');window.location.assign(url.href);}catch(reason){setError(reason instanceof Error?reason.message:'Stripe konnte nicht geöffnet werden.');setOpening(false);}}

  return <div className="pro-modal-backdrop" role="dialog" aria-modal="true" onMouseDown={onClose}>
    <section className="pro-modal" onMouseDown={event=>event.stopPropagation()}>
      <button className="pro-modal-close" onClick={onClose} aria-label="Pro Fenster schließen">×</button>
      <div className="pro-modal-hero">
        <span className="pro-pill">VOCABFAST PRO</span>
        <h1>{activePlan?'Dein Pro-Zugang ist aktiv.':'Mehr als Lektionen. Ein persönliches Sprachtraining.'}</h1>
        <p>{activePlan?'Du hast Zugriff auf die erweiterten Lernfunktionen und kannst dein Abo jederzeit über Stripe verwalten.':'Pro verbindet intensives Training mit Sprechen, Fachsprache, Analyse und dem VocabFast Coach.'}</p>
        <div className="pro-price"><strong>19,99 €</strong><span>/ Monat</span></div>
        <small>Monatlich kündbar. Free bleibt dauerhaft nutzbar.</small>
      </div>
      {activePlan&&<div className="pro-test-note"><strong>PRO AKTIV</strong>{billing?.cancelAtPeriodEnd?<> · endet am {renewalDate||'Ende der aktuellen Laufzeit'}</>:renewalDate?<> · nächste Laufzeit ab {renewalDate}</>:null}{billing?.subscriptionStatus&&<> · Status: {billing.subscriptionStatus}</>}</div>}
      <div className="pro-feature-grid">{proFeatures.map(([title,copy])=><article key={title}><span>✓</span><div><strong>{title}</strong><p>{copy}</p></div></article>)}</div>
      <div className="plan-compare">
        <article><span>FREE</span><h2>VocabFast Free</h2><strong>0 €</strong><ul><li>A1–C2-Lernpfad</li><li>Wortschatz & Grammatik</li><li>Hörtraining</li><li>Basis-Fortschritt</li></ul></article>
        <article className="recommended"><span>PRO · EMPFOHLEN</span><h2>VocabFast Pro</h2><strong>19,99 € <small>/ Monat</small></strong><ul><li>alles aus Free</li><li>intensives adaptives Training</li><li>Sprechen & Aussprache</li><li>alle Fachbereiche</li><li>KI-Coach & Dokumentlernen</li></ul></article>
      </div>
      {error&&<p className="pro-test-note" role="alert">{error}</p>}
      {billing&&!billing.ready&&<p className="pro-test-note">Pro-Zahlungen sind technisch vorbereitet, aber noch nicht vollständig freigeschaltet. Dein kostenloser Lernzugang bleibt uneingeschränkt nutzbar.</p>}
      {canCheckout&&<>
        <button className="pro-preview-action" disabled={opening} onClick={()=>void checkout()}>{opening?'Stripe wird geöffnet …':activePlan?'Abo sicher verwalten →':testMode?'Test-Abo bei Stripe starten →':'Weiter zu Stripe →'}</button>
        {testMode&&<small className="pro-test-note">Stripe-Testmodus: Es wird kein echtes Geld belastet.</small>}
      </>}
      <div className="pro-test-note"><a href="https://vocabfast.net/nutzungsbedingungen.html">Nutzungsbedingungen</a> · <a href="https://vocabfast.net/widerruf.html">Widerruf</a> · <a href="https://vocabfast.net/datenschutz.html">Datenschutz</a></div>
    </section>
  </div>;
}
