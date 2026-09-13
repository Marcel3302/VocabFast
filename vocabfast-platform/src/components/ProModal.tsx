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
  ['PDF-Wortscanner', 'Wörter aus PDFs markieren, übersetzen und direkt speichern'],
  ['Aussprache & Sprechen', 'Spracherkennung, bessere Stimmen und gezielte Wiederholung'],
  ['Fachsprache', 'Aviation, Business, Medizin, Technik & IT und Tourismus'],
  ['Adaptive Analyse', 'Schwachstellen, Mastery und intelligente Wiederholungen'],
  ['Intensives Training', 'Zusätzliche Produktions-, Hör-, Diktat- und Sprechübungen']
];

export default function ProModal({ onClose,user }: Props) {
  const [opening,setOpening]=useState(false),[error,setError]=useState('');
  const [billing,setBilling]=useState<BillingStatus|null>(null);
  const [statusLoading,setStatusLoading]=useState(true);

  useEffect(()=>{let active=true;setStatusLoading(true);fetch('/api/preview/billing/status',{credentials:'same-origin',cache:'no-store'}).then(async r=>{const data=await r.json().catch(()=>({}));if(!r.ok)throw new Error(data.error||'Zahlungsstatus nicht verfügbar.');return data as BillingStatus}).then(data=>{if(active){setBilling(data);setError('')}}).catch(reason=>{if(active)setError(reason instanceof Error?reason.message:'Der Zahlungsstatus konnte nicht geladen werden.');}).finally(()=>{if(active)setStatusLoading(false)});return()=>{active=false}},[]);
  useEffect(()=>{const previous=document.body.style.overflow;document.body.style.overflow='hidden';const onKey=(event:KeyboardEvent)=>{if(event.key==='Escape'&&!opening)onClose();};window.addEventListener('keydown',onKey);return()=>{document.body.style.overflow=previous;window.removeEventListener('keydown',onKey);};},[onClose,opening]);
  const testMode=billing?.mode==='test';
  const activePlan=user?.plan==='pro'||billing?.plan==='pro';

  async function checkout(){
    if(opening)return;
    setOpening(true);setError('');
    try{
      if(!activePlan&&testMode){
        const url=new URL(SANDBOX_PAYMENT_LINK);
        if(url.protocol!=='https:'||url.hostname!=='buy.stripe.com')throw new Error('Ungültige Stripe-Testadresse.');
        window.location.assign(url.href);
        return;
      }

      if(activePlan&&!billing?.checkoutReady){
        setError('Dein Pro-Testzugang ist für diese Sitzung aktiv. Eine echte Abo-Verwaltung ist in der Sandbox noch nicht erforderlich.');
        setOpening(false);
        return;
      }

      const endpoint=activePlan?'portal':'checkout';
      const response=await fetch(`/api/preview/billing/${endpoint}`,{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json'}});
      const data=await response.json().catch(()=>({}));
      if(!response.ok||!data.url)throw new Error(data.error||'Stripe konnte nicht geöffnet werden.');
      const url=new URL(data.url);
      if(url.protocol!=='https:'||!['checkout.stripe.com','billing.stripe.com'].includes(url.hostname))throw new Error('Ungültige Zahlungsadresse.');
      window.location.assign(url.href);
    }catch(reason){setError(reason instanceof Error?reason.message:'Stripe konnte nicht geöffnet werden.');setOpening(false);}
  }

  const actionLabel=opening?'Stripe-Testcheckout wird geöffnet …':activePlan?'PRO TEST AKTIV':statusLoading?'Testmodus wird geprüft …':testMode?'Stripe-Testkauf starten →':'VocabFast Pro starten →';

  return <div className="pro-modal-backdrop" role="presentation" onMouseDown={()=>{if(!opening)onClose();}}>
    <section className="pro-modal" role="dialog" aria-modal="true" aria-labelledby="pro-modal-title" aria-describedby="pro-modal-description" onMouseDown={event=>event.stopPropagation()}>
      <button className="pro-modal-close" onClick={onClose} disabled={opening} aria-label="Pro Fenster schließen">×</button>
      <div className="pro-modal-hero">
        <span className="pro-pill">VOCABFAST PRO · SANDBOX</span>
        <h1 id="pro-modal-title">{activePlan?'Dein Pro-Testzugang ist aktiv.':'Mehr als Lektionen. Ein persönliches Sprachtraining.'}</h1>
        <p id="pro-modal-description">{activePlan?'Die erweiterten Lernfunktionen sind für diese Testsitzung freigeschaltet.':'Pro verbindet intensives Training mit Sprechen, Fachsprache, PDF-Wortscanner, Analyse und dem VocabFast Coach.'}</p>
        <div className="pro-price"><strong>19,99 €</strong><span>/ Monat</span></div>
        <small>Geplanter Monatsbetrag · aktuell ausschließlich Stripe Sandbox.</small>
        <div className="pro-sandbox-trust"><span>✓ Keine echte Abbuchung</span><span>✓ Stripe-Testcheckout</span><span>✓ Sofortige Testfreischaltung</span></div>
      </div>
      {activePlan&&<div className="pro-status-note success"><strong>PRO TEST AKTIV</strong>{billing?.subscriptionStatus&&<> · Status: {billing.subscriptionStatus}</>}</div>}
      <div className="pro-feature-grid">{proFeatures.map(([title,copy])=><article key={title}><span>✓</span><div><strong>{title}</strong><p>{copy}</p></div></article>)}</div>
      <div className="plan-compare">
        <article><span>FREE</span><h2>VocabFast Free</h2><strong>0 €</strong><ul><li>verfügbare Sprachlernpfade</li><li>Wortschatz & Grammatik</li><li>Hör- und Sprechtraining</li><li>Übersetzer & Fortschritt</li></ul></article>
        <article className="recommended"><span>PRO TEST</span><h2>VocabFast Pro</h2><strong>19,99 € <small>/ Monat</small></strong><ul><li>alles aus Free</li><li>PDF-Wortscanner mit OCR</li><li>intensives adaptives Training</li><li>Sprechen & Aussprache</li><li>Fachbereiche</li><li>KI-Coach & erweiterte Analyse</li></ul></article>
      </div>
      {error?<p className="pro-status-note warning" role="alert">{error}</p>:null}
      <button className="pro-preview-action" disabled={opening||statusLoading||activePlan} onClick={()=>void checkout()}>{actionLabel}</button>
      {!activePlan&&testMode&&<small className="pro-status-note neutral">Du wirst zu Stripe Sandbox weitergeleitet. Nach einem erfolgreichen Testcheckout wird Pro für diese Browsersitzung freigeschaltet.</small>}
      {testMode&&<small className="pro-status-note test">TESTMODUS: Es wird kein echtes Geld belastet. Die aktuelle Freischaltung dient ausschließlich zum Erproben des Kaufablaufs.</small>}
      <div className="pro-legal-links"><a href="https://vocabfast.net/nutzungsbedingungen.html">Nutzungsbedingungen</a><span>·</span><a href="https://vocabfast.net/widerruf.html">Widerruf</a><span>·</span><a href="https://vocabfast.net/datenschutz.html">Datenschutz</a></div>
    </section>
  </div>;
}
