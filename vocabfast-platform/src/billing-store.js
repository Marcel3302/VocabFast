const ACTIVE_STATUSES=new Set(['active','trialing','past_due']);

function json(data,status=200){
  return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});
}

async function readBody(request){
  try{return await request.json();}catch{return {};}
}

function idOf(value){return typeof value==='string'?value:value?.id||null;}

function subscriptionIdOf(object){
  return idOf(object?.subscription)||idOf(object?.parent?.subscription_details?.subscription)||(String(object?.id||'').startsWith('sub_')?object.id:null);
}

function safeStatus(value){return String(value||'').slice(0,40);}

function effectivePlan(record){
  if(!record)return 'free';
  if(ACTIVE_STATUSES.has(String(record.subscriptionStatus||'')))return 'pro';
  return record.manualPlan==='pro'?'pro':'free';
}

function publicRecord(record){
  if(!record)return {plan:'free',source:'free',subscriptionStatus:'',cancelAtPeriodEnd:false,currentPeriodEnd:null,paymentIssue:false,customerIdPresent:false,subscriptionIdPresent:false,updatedAt:null};
  const plan=effectivePlan(record);
  const stripeActive=ACTIVE_STATUSES.has(String(record.subscriptionStatus||''));
  return {
    plan,
    source:stripeActive?'stripe':record.manualPlan==='pro'?'admin':'free',
    subscriptionStatus:safeStatus(record.subscriptionStatus),
    cancelAtPeriodEnd:!!record.cancelAtPeriodEnd,
    currentPeriodEnd:record.currentPeriodEnd||null,
    paymentIssue:!!record.paymentIssue,
    customerIdPresent:!!record.customerId,
    subscriptionIdPresent:!!record.subscriptionId,
    updatedAt:record.updatedAt||null
  };
}

export class PreviewBillingStore {
  constructor(state){this.storage=state.storage;}

  async userRecord(userId){return await this.storage.get(`user:${userId}`)||null;}

  async saveUser(userId,patch){
    const previous=await this.userRecord(userId)||{userId,manualPlan:null,createdAt:Date.now()};
    const next={...previous,...patch,userId,updatedAt:Date.now()};
    await this.storage.put(`user:${userId}`,next);
    if(next.customerId)await this.storage.put(`customer:${next.customerId}`,userId);
    if(next.subscriptionId)await this.storage.put(`subscription:${next.subscriptionId}`,userId);
    return next;
  }

  async resolveUser(object){
    const metadataId=String(object?.metadata?.vocabfast_user_id||'').trim();
    if(metadataId)return metadataId;
    const subscriptionId=subscriptionIdOf(object);
    if(subscriptionId){const mapped=await this.storage.get(`subscription:${subscriptionId}`);if(mapped)return mapped;}
    const customerId=idOf(object?.customer);
    if(customerId){const mapped=await this.storage.get(`customer:${customerId}`);if(mapped)return mapped;}
    return null;
  }

  async applyEvent(event){
    const eventId=String(event?.id||'').trim();
    if(!eventId)return {received:false,error:'Stripe event id missing'};
    if(await this.storage.get(`event:${eventId}`))return {received:true,duplicate:true};
    const type=String(event?.type||''),object=event?.data?.object||{};
    let userId=null,record=null;

    if(type==='checkout.session.completed'){
      const platform=String(object?.metadata?.platform||object?.metadata?.vocabfast_platform||'');
      if(platform&&platform!=='language-v2'){
        await this.storage.put(`event:${eventId}`,{type,ignored:true,processedAt:Date.now()});
        return {received:true,ignored:true};
      }
      userId=String(object?.client_reference_id||object?.metadata?.vocabfast_user_id||'').trim();
      const subscriptionId=idOf(object?.subscription),customerId=idOf(object?.customer);
      if(userId&&subscriptionId){
        record=await this.saveUser(userId,{
          subscriptionId,customerId,
          subscriptionStatus:'active',
          cancelAtPeriodEnd:false,
          currentPeriodEnd:null,
          paymentIssue:false,
          checkoutSessionId:object?.id||null,
          stripeEmail:object?.customer_details?.email||object?.customer_email||null,
          lastEventId:eventId
        });
      }
    } else if(type.startsWith('customer.subscription.')){
      userId=await this.resolveUser(object);
      if(userId){
        const status=type==='customer.subscription.deleted'?'canceled':safeStatus(object?.status||type.split('.').pop());
        const period=object?.current_period_end?new Date(Number(object.current_period_end)*1000).toISOString():null;
        record=await this.saveUser(userId,{
          subscriptionId:object?.id||null,
          customerId:idOf(object?.customer),
          subscriptionStatus:status,
          cancelAtPeriodEnd:!!object?.cancel_at_period_end,
          currentPeriodEnd:period,
          paymentIssue:status==='past_due'||status==='unpaid',
          lastEventId:eventId
        });
      }
    } else if(type==='invoice.payment_failed'||type==='invoice.payment_action_required'||type==='invoice.paid'||type==='invoice.payment_succeeded'){
      userId=await this.resolveUser(object);
      if(userId){
        const failed=type==='invoice.payment_failed'||type==='invoice.payment_action_required';
        record=await this.saveUser(userId,{paymentIssue:failed,lastPaymentEventAt:Date.now(),lastEventId:eventId});
      }
    }

    await this.storage.put(`event:${eventId}`,{type,userId:userId||null,processedAt:Date.now()});
    return {received:true,handled:!!userId,plan:record?effectivePlan(record):undefined};
  }

  async handleStatus(userId){
    const record=await this.userRecord(userId);
    return json({billing:publicRecord(record)});
  }

  async handleList(){
    const stored=await this.storage.list({prefix:'user:'}),items=[];
    for(const [,record] of stored)if(record?.userId)items.push({userId:record.userId,...publicRecord(record)});
    return json({billing:items});
  }

  async handleManual(request,userId){
    const data=await readBody(request),plan=data?.plan==='pro'?'pro':'free';
    const next=await this.saveUser(userId,{manualPlan:plan==='pro'?'pro':null,manualUpdatedAt:Date.now()});
    return json({billing:publicRecord(next)});
  }

  async handleDelete(userId){
    const record=await this.userRecord(userId);
    if(record?.customerId)await this.storage.delete(`customer:${record.customerId}`);
    if(record?.subscriptionId)await this.storage.delete(`subscription:${record.subscriptionId}`);
    await this.storage.delete(`user:${userId}`);
    return json({ok:true});
  }

  async fetch(request){
    const url=new URL(request.url),path=url.pathname;
    if(path==='/internal/billing/event'&&request.method==='POST')return json(await this.applyEvent(await readBody(request)));
    if(path==='/internal/billing/list'&&request.method==='GET')return this.handleList();
    let match=path.match(/^\/internal\/billing\/status\/([^/]+)$/);
    if(match&&request.method==='GET')return this.handleStatus(decodeURIComponent(match[1]));
    match=path.match(/^\/internal\/billing\/manual\/([^/]+)$/);
    if(match&&request.method==='PUT')return this.handleManual(request,decodeURIComponent(match[1]));
    match=path.match(/^\/internal\/billing\/user\/([^/]+)$/);
    if(match&&request.method==='DELETE')return this.handleDelete(decodeURIComponent(match[1]));
    return json({error:'Billing route not found'},404);
  }
}
