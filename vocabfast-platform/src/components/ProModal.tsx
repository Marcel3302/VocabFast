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

  useEffect(()=>{let active=true;setStatusLoading(true);fetch('/api/preview/billing/status',{credentials:'same-origin',cache:'no-store'}).then(async r=>{const data=await r.json().catch(()=>({}));if(!r.ok)throw new Error(data.error||'Zahlungsstatus nicht verfügbar.');return data as BillingStatus}).then(data=>{if(active){setBilling(data);setError('')}}).catch(()=>{if(active)setError('Pro ist in der öffentlichen Beta derzeit noch nicht buchbar.');}).finally(()=>{if(active)setStatusLoading(false)});return()=>{active=false}},[]);
  useEffect(()=>{const previous=document.body.style.overflow;document.body.style.overflow='hidden';const onKey=(event:KeyboardEvent)=>{if(event.key==='Escape'&&!opening)onClose();};window.addEventListener('keydown',onKey);return()=>{document.body.style.overflow=previous;window.removeEventListener('keydown',onKey);};},[onClose,opening]);

  const testMode=billing?.mode==='test';
  const liveMode=billing?.mode==='live';
  const activePlan=user?.plan==='pro'||billing?.plan==='pro';
  const canCheckout=Boolean(liveMode&&billing?.checkoutReady&&!activePlan);
  const canManage=Boolean(liveMode&&billing?.checkoutReady&&activePlan);

  async function openBilling(){
    if(opening||(!canCheckout&&!canManage))return;
    setOpening(true);setError('');
    try{
      const endpoint=activePlan?'portal':'checkout';
      const response=await fetch(`/api/preview/billing/${endpoint}`,{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json'}});
      const data=await response.json().catch(()=>({}));
      if(!response.ok||!data.url)throw new Error(data.error||'Stripe konnte nicht geöffnet werden.');
      const url=new URL(data.url);
      if(url.protocol!=='https:'||!['checkout.stripe.com','billing.stripe.com'].includes(url.hostname))throw new Error('Ungültige Zahlungsadresse.');
      window.location.assign(url.href);
    }catch(reason){setError(reason instanceof Error?reason.message:'Stripe konnte nicht geöffnet werden.');setOpening(false);}
  }

  const actionLabel=opening?'Stripe wird geöffnet …':activePlan&&liveMode?'Abo verwalten →':canCheckout?'VocabFast Pro starten →':activePlan?'Pro-Zugang aktiv':'Pro kommt nach der Beta';
  const actionDisabled=opening||statusLoading||(!canCheckout&&!canManage);

  return <div className="pro-modal-backdrop" role="presentation" onMouseDown={()=>{if(!opening)onClose();}}>
    <section className="pro-modal" role="dialog" aria-modal="true" aria-labelledby="pro-modal-title" aria-describedby="pro-modal-description" onMouseDown={event=>event.stopPropagation()}>
      <button className="pro-modal-close" onClick={onClose} disabled={opening} aria-label="Pro Fenster schließen">×</button>
      <div className="pro-modal-hero">
        <span className="pro-pill">VOCABFAST PRO · BETA</span>
        <h1 id="pro-modal-title">{activePlan?'Dein Pro-Zugang ist aktiv.':'Mehr Tiefe für dein Sprachtraining.'}</h1>
        <p id="pro-modal-description">{activePlan?'Die erweiterten Lernfunktionen sind für dein Konto freigeschaltet.':'Pro erweitert VocabFast um intensives Training, Fachsprache, PDF-Wortscanner, Analyse und den KI-Coach. Während der öffentlichen Beta ist Pro noch nicht regulär buchbar.'}</p>
        <div className="pro-price"><strong>{liveMode?'Pro':'BETA'}</strong><span>{liveMode?' · Preis im sicheren Stripe-Checkout':' · kostenloser Kern bleibt nutzbar'}</span></div>
        <small>{liveMode?'Wenn Pro live verfügbar ist, siehst du den verbindlichen Preis vor dem Abschluss direkt bei Stripe.':'Wir schalten echte Zahlungen erst frei, wenn Billing und rechtliche Unterlagen für den Live-Betrieb final geprüft sind.'}</small>
        <div className="pro-sandbox-trust"><span>✓ Keine Testkäufe für Nutzer</span><span>✓ Free bleibt nutzbar</span><span>✓ Live-Zahlung erst nach Freigabe</span></div>
      </div>
      {activePlan&&<div className="pro-status-note success"><strong>PRO AKTIV</strong>{billing?.subscriptionStatus&&<> · Status: {billing.subscriptionStatus}</>}</div>}
      <div className="pro-feature-grid">{proFeatures.map(([title,copy])=><article key={title}><span>✓</span><div><strong>{title}</strong><p>{copy}</p></div></article>)}</div>
      <div className="plan-compare">
        <article><span>FREE</span><h2>VocabFast Free</h2><strong>0 €</strong><ul><li>verfügbare Sprachlernpfade</li><li>persönlicher Wortschatz & Review</li><li>Voice Training</li><li>Übersetzer & Fortschritt</li><li>Travel Companion</li></ul></article>
        <article className="recommended"><span>PRO</span><h2>VocabFast Pro</h2><strong>{liveMode?'verfügbar':'kommt nach der Beta'}</strong><ul><li>alles aus Free</li><li>PDF-Wortscanner mit OCR</li><li>intensives adaptives Training</li><li>Fachbereiche</li><li>KI-Coach & erweiterte Analyse</li></ul></article>
      </div>
      {error?<p className="pro-status-note warning" role="alert">{error}</p>:null}
      <button className="pro-preview-action" disabled={actionDisabled} onClick={()=>void openBilling()}>{actionLabel}</button>
      {!liveMode&&<small className="pro-status-note neutral">ÖFFENTLICHE BETA: Es gibt aktuell keinen regulären kostenpflichtigen Abschluss. Eine eventuell intern konfigurierte Stripe-Sandbox wird Nutzern nicht als Kauf angeboten.</small>}
      {testMode&&activePlan&&<small className="pro-status-note test">Dieses Konto besitzt einen internen Test-/Beta-Zugang. Daraus entsteht kein kostenpflichtiges Abo.</small>}
      <div className="pro-legal-links"><a href="/nutzungsbedingungen.html">Nutzungsbedingungen</a><span>·</span><a href="/widerruf.html">Pro & Widerruf</a><span>·</span><a href="/datenschutz.html">Datenschutz</a></div>
    </section>
  </div>;
}
