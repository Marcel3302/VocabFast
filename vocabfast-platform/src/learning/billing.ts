export type BillingStatus = {
  ready:boolean;
  checkoutReady?:boolean;
  webhookReady?:boolean;
  mode:'test'|'live'|string;
  plan:'free'|'pro'|string;
  subscriptionStatus?:string;
  cancelAtPeriodEnd?:boolean;
  currentPeriodEnd?:string|null;
};

async function billingJson<T>(response:Response):Promise<T> {
  const data=await response.json().catch(()=>({})) as T&{error?:string};
  if(!response.ok)throw new Error(data.error||'Der Zahlungsstatus konnte nicht geladen werden.');
  return data;
}

export async function loadBillingStatus():Promise<BillingStatus> {
  const response=await fetch('/api/preview/billing/status',{
    credentials:'same-origin',
    cache:'no-store',
    headers:{Accept:'application/json'}
  });
  return billingJson<BillingStatus>(response);
}

export async function createBillingDestination(kind:'checkout'|'portal') {
  const response=await fetch(`/api/preview/billing/${kind}`,{
    method:'POST',
    credentials:'same-origin',
    cache:'no-store',
    headers:{'Content-Type':'application/json'}
  });
  return billingJson<{url:string;mode?:string}>(response);
}
