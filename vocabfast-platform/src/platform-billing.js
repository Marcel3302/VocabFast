const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
const objectId=value=>typeof value==='string'?value:value?.id;
function config(env){const mode=env.PLATFORM_STRIPE_MODE==='live'?'live':'test';return{mode,key:env[`PLATFORM_STRIPE_KEY_${mode.toUpperCase()}`],secret:env[`PLATFORM_STRIPE_WEBHOOK_${mode.toUpperCase()}`],price:env[`PLATFORM_STRIPE_PRICE_${mode.toUpperCase()}`]};}
function store(env){return env.PREVIEW_ACCOUNTS.get(env.PREVIEW_ACCOUNTS.idFromName('global'));}
async function stripe(c,path,body){const response=await fetch(`https://api.stripe.com/v1/${path}`,{method:body?'POST':'GET',headers:{Authorization:`Bearer ${c.key}`,'Stripe-Version':'2026-07-29.dahlia',...(body?{'Content-Type':'application/x-www-form-urlencoded'}:{})},...(body?{body:new URLSearchParams(body)}:{})});const data=await response.json();if(!response.ok)throw new Error(data?.error?.message||'Stripe ist gerade nicht erreichbar. Bitte versuche es später erneut.');return data;}
export async function verifiedEvent(request,secret){
 if(!secret)throw new Error('Webhook ist noch nicht eingerichtet.');
 const parts=(request.headers.get('Stripe-Signature')||'').split(','),timestamp=parts.find(p=>p.startsWith('t='))?.slice(2),signatures=parts.filter(p=>p.startsWith('v1=')).map(p=>p.slice(3));
 if(!timestamp||!/^\d+$/.test(timestamp)||Math.abs(Date.now()/1000-Number(timestamp))>300)throw new Error('Ungültige Stripe-Signatur.');
 const raw=await request.text(),encoder=new TextEncoder(),key=await crypto.subtle.importKey('raw',encoder.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['verify']);
 let valid=false;for(const signature of signatures){if(!/^[a-f0-9]{64}$/i.test(signature))continue;const bytes=Uint8Array.from(signature.match(/../g),hex=>parseInt(hex,16));if(await crypto.subtle.verify('HMAC',key,bytes,encoder.encode(`${timestamp}.${raw}`)))valid=true;}
 if(!valid)throw new Error('Ungültige Stripe-Signatur.');return JSON.parse(raw);
}
async function publishSubscription(env,c,subscription,eventId,created){
 if(subscription.metadata?.platform!=='language-v2'||!subscription.items?.data?.some(item=>objectId(item.price)===c.price))return {ignored:true};
 const userId=subscription.metadata?.vocabfast_user_id;if(!userId)return {ignored:true};
 const response=await store(env).fetch(new Request('https://internal/internal/platform-billing',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({userId,eventId,created,subscriptionId:subscription.id,customerId:objectId(subscription.customer),status:subscription.status,cancelAtPeriodEnd:subscription.cancel_at_period_end,currentPeriodEnd:subscription.current_period_end?new Date(Number(subscription.current_period_end)*1000).toISOString():null})}));
 if(!response.ok)throw new Error('Abo-Status konnte nicht gespeichert werden.');
 return {ignored:false,userId};
}
async function currentUser(request,env){const response=await store(env).fetch(new Request(new URL('/api/preview/me',request.url),{headers:request.headers}));const data=await response.json().catch(()=>({}));return data.user||null;}
async function billingRecord(env,userId){const response=await store(env).fetch(new Request(`https://internal/internal/platform-billing?user=${encodeURIComponent(userId)}`));return response.json().catch(()=>({}));}
async function refreshSubscription(env,c,userId,record){
 if(!c.key||!record?.subscriptionId)return {record,user:null};
 const subscription=await stripe(c,`subscriptions/${encodeURIComponent(record.subscriptionId)}`);
 const result=await publishSubscription(env,c,subscription,`refresh:${subscription.id}:${subscription.status}:${subscription.current_period_end||0}`,Math.floor(Date.now()/1000));
 if(result.ignored)return {record,user:null};
 const refreshedRecord=await billingRecord(env,userId);
 return {record:refreshedRecord,subscription};
}
export async function platformBilling(request,env){
 const url=new URL(request.url),c=config(env),checkoutReady=Boolean(c.key&&c.price),webhookReady=Boolean(c.secret),ready=checkoutReady;
 if(url.pathname==='/api/preview/billing/webhook'){
  if(request.method!=='POST')return json({error:'Methode nicht erlaubt.'},405);
  if(!checkoutReady||!webhookReady)return json({error:'Stripe-Webhook ist noch nicht vollständig eingerichtet.'},503);
  let event;try{event=await verifiedEvent(request,c.secret);}catch{return json({error:'Ungültige Stripe-Signatur.'},400);}
  if(event.livemode!==(c.mode==='live'))return json({error:'Stripe-Modus stimmt nicht überein.'},400);
  const object=event.data?.object||{},subscriptionId=event.type?.startsWith('customer.subscription.')?object.id:objectId(object.subscription)||objectId(object.parent?.subscription_details?.subscription);
  if(!subscriptionId)return json({received:true,ignored:true});
  try{const subscription=await stripe(c,`subscriptions/${encodeURIComponent(subscriptionId)}`);const result=await publishSubscription(env,c,subscription,event.id,event.created);return json({received:true,...result});}
  catch(error){console.error('stripe webhook processing failed',error);return json({error:'Zahlungsstatus konnte nicht verarbeitet werden.'},503);}
 }
 const user=await currentUser(request,env);if(!user)return json({error:'Bitte zuerst anmelden.'},401);
 if(url.pathname==='/api/preview/billing/status'&&request.method==='GET'){
  let record=await billingRecord(env,user.id);
  if(record.subscriptionId&&checkoutReady){try{record=(await refreshSubscription(env,c,user.id,record)).record;}catch(error){console.error('stripe status refresh failed',error);}}
  const refreshedUser=await currentUser(request,env);
  return json({ready,checkoutReady,webhookReady,mode:c.mode,plan:refreshedUser?.plan||user.plan,subscriptionStatus:record.status||'',cancelAtPeriodEnd:Boolean(record.cancelAtPeriodEnd),currentPeriodEnd:record.currentPeriodEnd||null});
 }
 if(request.method!=='POST')return json({error:'Methode nicht erlaubt.'},405);
 if(request.headers.get('Origin')!==url.origin)return json({error:'Ungültiger Ursprung.'},403);
 if(!checkoutReady)return json({error:'Pro-Zahlungen sind noch nicht freigeschaltet. Die Stripe-Verknüpfung wird eingerichtet.'},503);
 try{
  const record=await billingRecord(env,user.id);
  if(url.pathname==='/api/preview/billing/refresh'){
   if(!record.subscriptionId)return json({ok:true,plan:user.plan,subscriptionStatus:record.status||''});
   const refreshed=await refreshSubscription(env,c,user.id,record),refreshedUser=await currentUser(request,env);
   return json({ok:true,plan:refreshedUser?.plan||user.plan,subscriptionStatus:refreshed.record.status||''});
  }
  if(url.pathname==='/api/preview/billing/sync'){
   const body=await request.json().catch(()=>({})),sessionId=String(body.sessionId||'');
   if(!/^cs_(?:test_)?[A-Za-z0-9]+$/.test(sessionId))return json({error:'Ungültige Checkout-Sitzung.'},400);
   const session=await stripe(c,`checkout/sessions/${encodeURIComponent(sessionId)}`);
   if(session.client_reference_id!==user.id||session.metadata?.platform!=='language-v2')return json({error:'Diese Zahlung gehört nicht zu deinem Konto.'},403);
   const subscriptionId=objectId(session.subscription);if(!subscriptionId)return json({error:'Für diese Zahlung wurde noch kein Abo gefunden.'},409);
   const subscription=await stripe(c,`subscriptions/${encodeURIComponent(subscriptionId)}`);const result=await publishSubscription(env,c,subscription,`checkout-sync:${session.id}`,Math.floor(Date.now()/1000));
   if(result.ignored)return json({error:'Das Stripe-Abo passt nicht zum VocabFast-Pro-Produkt.'},409);
   const refreshed=await currentUser(request,env);return json({ok:true,plan:refreshed?.plan||'free',subscriptionStatus:subscription.status});
  }
  if(url.pathname==='/api/preview/billing/portal'){if(!record.customerId)return json({error:'Zu diesem Konto besteht noch kein Stripe-Abo.'},409);const session=await stripe(c,'billing_portal/sessions',{customer:record.customerId,return_url:`${url.origin}/?billing=return`});return json({url:session.url});}
  if(url.pathname!=='/api/preview/billing/checkout')return json({error:'Route nicht gefunden.'},404);
  if(user.plan==='pro')return json({error:'Dein Pro-Zugang ist bereits aktiv.'},409);
  const session=await stripe(c,'checkout/sessions',{mode:'subscription','line_items[0][price]':c.price,'line_items[0][quantity]':'1',success_url:`${url.origin}/?upgrade=success&session_id={CHECKOUT_SESSION_ID}`,cancel_url:`${url.origin}/?upgrade=cancelled`,client_reference_id:user.id,...(record.customerId?{customer:record.customerId}:{customer_email:user.email}),'metadata[platform]':'language-v2','metadata[vocabfast_user_id]':user.id,'subscription_data[metadata][platform]':'language-v2','subscription_data[metadata][vocabfast_user_id]':user.id,'subscription_data[metadata][price_key]':'vocabfast-pro-monthly'});return json({url:session.url,mode:c.mode});
 }catch(error){console.error('stripe billing route failed',error);return json({error:error instanceof Error?error.message:'Stripe ist gerade nicht erreichbar.'},503);}
}
