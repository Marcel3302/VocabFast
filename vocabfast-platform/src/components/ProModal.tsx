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

const SANDBOX_PAYMENT_LINK='https://buy.stripe.com/test_eVq8wP3oo9W2aAnbyX6c001';

const proFeatures = [
  ['KI-Sprachcoach', 'Rollenspiele, freie Dialoge und persönliches Feedback'],
  ['PDF-Wortscanner', 'Wörter aus PDFs und Scan-Unterlagen markieren, übersetzen und direkt speichern'],
  ['Aussprache & Sprechen', 'Spracherkennung, bessere Stimmen und gezielte Wiederholung'],
  ['Fachsprache', 'Aviation, Business, Medizin, Technik & IT und Tourismus'],
  ['Adaptive Analyse', 'Schwachstellen, Mastery und intelligente Wiederholungen'],
  ['Intensives Training', 'Zusätzliche Produktions-, Hör-, Diktat- und Sprechübungen']
];

function periodLabel(value?:string|null){if(!value)return '';try{return new Intl.DateTimeFormat('de-AT',{dateStyle:'medium'}).format(new Date(value));}catch{return '';}}

export default function ProModal({ onClose,user }: Props) {
  const [opening,setOpening]=useState(false),[error,setError]=useState('');
  const [billing,setBilling]=useState<BillingStatus|null>(null);
  const [statusLoading,setStatusLoading]=useState(true);

  async function loadBillingStatus() {
    setStatusLoading(true);
    try {
      const response=await fetch('/api/preview/billing/status',{credentials:'same-origin',cache:'no-store'});
      const data=await response.json().catch(()=>({})) as BillingStatus&{error?:string};
      if(!response.ok)throw new Error(data.error||'Zahlungsstatus nicht verfügbar.');
      setBilling(data);
      setError('');
      return data;
    } finally {
      setStatusLoading(false);
    }
  }

  useEffect(()=>{let active=true;setStatusLoading(true);fetch('/api/preview/billing/status',{credentials:'same-origin',cache:'no-store'}).then(async r=>{const data=await r.json().catch(()=>({}));if(!r.ok)throw new Error(data.error||'Zahlungsstatus nicht verfügbar.');return data as BillingStatus}).then(data=>{if(active){setBilling(data);setError('')}}).catch(reason=>{if(active)setError(reason instanceof Error?reason.message:'Der Zahlungsstatus konnte nicht geladen werden.');}).finally(()=>{if(active)setStatusLoading(false)});return()=>{active=false}},[]);
  const activePlan=user?.plan==='pro'||billing?.plan==='pro';
  const renewalDate=periodLabel(billing?.currentPeriodEnd);

  async function checkout(){
    if(opening)return;
    setOpening(true);setError('');
    try{
      if(!activePlan){
        const url=new URL(SANDBOX_PAYMENT_LINK);
        if(url.protocol!=='https:'||url.hostname!=='buy.stripe.com')throw new Error('Ungültige Stripe-Testadresse.');
        window.location.assign(url.href);
        return;
      }

      if(!billing?.checkoutReady){
        setError('Dein Pro-Testzugang ist für diese Sitzung aktiv. Eine echte Abo-Verwaltung ist in der Sandbox noch nicht erforderlich.');
        setOpening(false);
        return;
      }

      const response=await fetch('/api/preview/billing/portal',{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json'}});
      const data=await response.json().catch(()=>({}));
      if(!response.ok||!data.url)throw new Error(data.error||'Stripe konnte nicht geöffnet werden.');
      const url=new URL(data.url);
      if(url.protocol!=='https:'||url.hostname!=='billing.stripe.com')throw new Error('Ungültige Zahlungsadresse.');
      window.location.assign(url.href);
    }catch(reason){setError(reason instanceof Error?reason.message:'Stripe konnte nicht geöffnet werden.');setOpening(false);}
  }

  const actionLabel=opening?'Stripe-Testcheckout wird geöffnet …':activePlan?'PRO TEST AKTIV':'Stripe-Testkauf starten →';

  return <div className="pro-modal-backdrop" role="dialog" aria-modal="true" onMouseDown={onClose}>
    <section className="pro-modal" onMouseDown={event=>event.stopPropagation()}>
      <button className="pro-modal-close" onClick={onClose} aria-label="Pro Fenster schließen">×</button>
      <div className="pro-modal-hero">
        <span className="pro-pill">VOCABFAST PRO · TEST</span>
        <h1>{activePlan?'Dein Pro-Testzugang ist aktiv.':'Mehr als Lektionen. Ein persönliches Sprachtraining.'}</h1>
        <p>{activePlan?'Du kannst die erweiterten Lernfunktionen in dieser Testsitzung ausprobieren.':'Pro verbindet intensives Training mit Sprechen, Fachsprache, PDF-Wortscanner, Analyse und dem VocabFast Coach.'}</p>
        <div className="pro-price"><strong>19,99 €</strong><span>/ Monat</span></div>
        <small>Sandbox/Testmodus · es wird kein echtes Geld belastet.</small>
      </div>
      {activePlan&&<div className="pro-status-note success"><strong>PRO TEST AKTIV</strong>{billing?.subscriptionStatus&&<> · Status: {billing.subscriptionStatus}</>}</div>}
      <div className="pro-feature-grid">{proFeatures.map(([title,copy])=><article key={title}><span>✓</span><div><strong>{title}</strong><p>{copy}</p></div></article>)}</div>
      <div className="plan-compare">
        <article><span>FREE</span><h2>VocabFast Free</h2><strong>0 €</strong><ul><li>verfügbare Sprachlernpfade</li><li>Wortschatz & Grammatik</li><li>Hörtraining</li><li>Basis-Fortschritt</li></ul></article>
        <article className="recommended"><span>PRO TEST</span><h2>VocabFast Pro</h2><strong>19,99 € <small>/ Monat</small></strong><ul><li>alles aus Free</li><li>PDF-Wortscanner mit OCR</li><li>intensives adaptives Training</li><li>Sprechen & Aussprache</li><li>Fachbereiche</li><li>KI-Coach & erweiterte Analyse</li></ul></article>
      </div>
      {error?<p className="pro-status-note warning" role="alert">{error}</p>:null}
      <button className="pro-preview-action" disabled={opening||statusLoading||activePlan} onClick={()=>void checkout()}>{actionLabel}</button>
      {!activePlan&&<small className="pro-status-note neutral">Du wirst zu Stripe Sandbox weitergeleitet. Nach einem erfolgreichen Testcheckout wird Pro für diese Browsersitzung freigeschaltet.</small>}
      <small className="pro-status-note test">TESTMODUS: Es wird kein echtes Geld belastet. Diese Freischaltung dient nur zum Erproben des Kaufablaufs.</small>
      <div className="pro-legal-links"><a href="https://vocabfast.net/nutzungsbedingungen.html">Nutzungsbedingungen</a><span>·</span><a href="https://vocabfast.net/widerruf.html">Widerruf</a><span>·</span><a href="https://vocabfast.net/datenschutz.html">Datenschutz</a></div>
    </section>
  </div>;
}