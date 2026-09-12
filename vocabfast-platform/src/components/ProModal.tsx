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
type BillingHealth={ok?:boolean;mode?:'test'|'live'|string;checkoutReady?:boolean;webhookReady?:boolean;error?:string};

const proFeatures = [
  ['KI-Sprachcoach', 'Rollenspiele, freie Dialoge und persönliches Feedback'],
  ['Aussprache & Sprechen', 'Spracherkennung, bessere Stimmen und gezielte Wiederholung'],
  ['Fachsprache', 'Aviation, Business, Medizin, Technik & IT und Tourismus'],
  ['Intensives Training', 'Zusätzliche Produktions-, Hör-, Diktat- und Sprechübungen'],
  ['Adaptive Analyse', 'Schwachstellen, Mastery und intelligente Wiederholungen'],
  ['Kompetenztraining', 'Gezielte Sessions nach Niveau, Lernziel und Übungstyp']
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
  const testMode=billing?.mode==='test';
  const canCheckout=Boolean(billing?.checkoutReady);
  const activePlan=(billing?.plan||user?.plan)==='pro';
  const renewalDate=periodLabel(billing?.currentPeriodEnd);

  async function verifyCheckoutReady() {
    if(canCheckout)return true;
    const response=await fetch('/api/preview/billing/health',{credentials:'same-origin',cache:'no-store',headers:{Accept:'application/json'}});
    const health=await response.json().catch(()=>({})) as BillingHealth;
    if(!response.ok)throw new Error(health.error||'Die Stripe-Verknüpfung konnte nicht geprüft werden.');
    if(!health.checkoutReady) {
      setBilling(current=>current?{...current,mode:health.mode||current.mode,checkoutReady:false,webhookReady:Boolean(health.webhookReady)}:current);
      throw new Error('Stripe ist noch nicht vollständig mit VocabFast verknüpft. Bitte zuerst die Stripe-Schlüssel und die Pro-Price-ID in Cloudflare konfigurieren.');
    }
    await loadBillingStatus().catch(()=>null);
    return true;
  }

  async function checkout(){
    if(opening)return;
    setOpening(true);setError('');
    try{
      await verifyCheckoutReady();
      const response=await fetch(`/api/preview/billing/${activePlan?'portal':'checkout'}`,{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json'}});
      const data=await response.json().catch(()=>({}));
      if(!response.ok||!data.url)throw new Error(data.error||'Stripe konnte nicht geöffnet werden.');
      const url=new URL(data.url);
      if(!['checkout.stripe.com','billing.stripe.com'].includes(url.hostname)||url.protocol!=='https:')throw new Error('Ungültige Zahlungsadresse.');
      window.location.assign(url.href);
    }catch(reason){setError(reason instanceof Error?reason.message:'Stripe konnte nicht geöffnet werden.');setOpening(false);}
  }

  const actionLabel=opening?'Stripe wird geöffnet …':activePlan?'Abo sicher verwalten →':statusLoading?'Stripe-Verknüpfung prüfen …':canCheckout?(testMode?'Pro-Testkauf bei Stripe starten →':'Pro für 19,99 € / Monat kaufen →'):'Stripe-Verknüpfung prüfen →';

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
        <article><span>FREE</span><h2>VocabFast Free</h2><strong>0 €</strong><ul><li>verfügbare Sprachlernpfade</li><li>Wortschatz & Grammatik</li><li>Hörtraining</li><li>Basis-Fortschritt</li></ul></article>
        <article className="recommended"><span>PRO · EMPFOHLEN</span><h2>VocabFast Pro</h2><strong>19,99 € <small>/ Monat</small></strong><ul><li>alles aus Free</li><li>intensives adaptives Training</li><li>Sprechen & Aussprache</li><li>Fachbereiche</li><li>KI-Coach & erweiterte Analyse</li></ul></article>
      </div>
      {error&&<p className="pro-test-note" role="alert">{error}</p>}
      {billing&&!billing.checkoutReady&&<p className="pro-test-note">Die Stripe-Verknüpfung ist noch nicht vollständig aktiv. Der Button bleibt sichtbar und prüft die Verbindung erneut, statt einfach zu verschwinden.</p>}
      <button className="pro-preview-action" disabled={opening||statusLoading} onClick={()=>void checkout()}>{actionLabel}</button>
      {!activePlan&&canCheckout&&<small className="pro-test-note">Nach dem erfolgreichen Stripe-Checkout wird der Pro-Zugang deinem angemeldeten VocabFast-Konto zugeordnet.</small>}
      {testMode&&canCheckout&&<small className="pro-test-note">Stripe-Testmodus: Der Checkout funktioniert vollständig, es wird aber noch kein echtes Geld belastet.</small>}
      <div className="pro-test-note"><a href="https://vocabfast.net/nutzungsbedingungen.html">Nutzungsbedingungen</a> · <a href="https://vocabfast.net/widerruf.html">Widerruf</a> · <a href="https://vocabfast.net/datenschutz.html">Datenschutz</a></div>
    </section>
  </div>;
}
