import previewWorker from './preview-worker.js';
export { PreviewAccountStore } from './preview-worker.js';

const PRODUCTION_ORIGIN='https://vocabfast.net';
const ADMIN_AUTH_PATHS=new Set(['/api/admin/login','/api/admin/logout']);

function json(data,status=200,headers={}) {
  return new Response(JSON.stringify(data),{
    status,
    headers:{
      'Content-Type':'application/json; charset=utf-8',
      'Cache-Control':'no-store',
      'X-Robots-Tag':'noindex, nofollow, noarchive',
      ...headers
    }
  });
}

function sameOrigin(request) {
  const origin=request.headers.get('Origin');
  return !origin||origin===new URL(request.url).origin;
}

function accountStore(env) {
  if(!env?.PREVIEW_ACCOUNTS)throw new Error('Account storage is not configured.');
  const id=env.PREVIEW_ACCOUNTS.idFromName('global');
  return env.PREVIEW_ACCOUNTS.get(id);
}

async function proxyAdminAuth(request) {
  const sourceUrl=new URL(request.url);
  const targetUrl=new URL(`${sourceUrl.pathname}${sourceUrl.search}`,PRODUCTION_ORIGIN);
  const headers=new Headers(request.headers);
  headers.set('Origin',PRODUCTION_ORIGIN);
  headers.set('Referer',`${PRODUCTION_ORIGIN}/admin`);
  headers.set('Accept','application/json');
  headers.delete('host');

  const init={method:request.method,headers,redirect:'manual'};
  if(request.method!=='GET'&&request.method!=='HEAD')init.body=await request.arrayBuffer();
  const upstream=await fetch(targetUrl,init);
  const responseHeaders=new Headers(upstream.headers);
  responseHeaders.set('Cache-Control','no-store');
  responseHeaders.set('X-Robots-Tag','noindex, nofollow, noarchive');
  return new Response(upstream.body,{status:upstream.status,statusText:upstream.statusText,headers:responseHeaders});
}

async function verifyAdminSession(request) {
  const cookie=request.headers.get('Cookie')||'';
  if(!cookie.includes('vf_admin='))return null;
  const headers=new Headers({
    Accept:'application/json',
    Cookie:cookie,
    'User-Agent':'VocabFast-Platform-Admin-Gateway'
  });
  const upstream=await fetch(`${PRODUCTION_ORIGIN}/api/admin/me`,{method:'GET',headers,redirect:'manual'});
  if(!upstream.ok)return null;
  const data=await upstream.json().catch(()=>null);
  const admin=data?.admin;
  if(!admin)return null;
  return {
    superadmin:true,
    username:admin.username||'admin',
    name:'Superadmin',
    createdAt:admin.createdAt||null,
    expiresAt:admin.expiresAt||null,
    permissions:['users.read','users.edit','plans.manage','security.manage','progress.edit','accounts.manage']
  };
}

async function platformAdmin(request,env) {
  const context=await verifyAdminSession(request);
  if(!context)return json({error:'Admin-Anmeldung erforderlich.'},401);

  const url=new URL(request.url);
  if(url.pathname==='/api/preview/admin/context'&&request.method==='GET')return json({context});
  if(!sameOrigin(request))return json({error:'Ungültiger Ursprung.'},403);

  const write=request.method!=='GET'&&request.method!=='HEAD';
  if(write&&request.headers.get('X-VocabFast-Admin')!=='1')return json({error:'Admin-Sicherheitsprüfung fehlgeschlagen.'},403);

  if(url.pathname==='/api/preview/admin/accounts'&&request.method==='GET')return accountStore(env).fetch(request);
  if(/^\/api\/preview\/admin\/accounts\/[^/]+(?:\/(?:sessions|password|state))?$/.test(url.pathname))return accountStore(env).fetch(request);
  return json({error:'Admin-Route nicht gefunden.'},404);
}

export default {
  async fetch(request,env,ctx) {
    const url=new URL(request.url);
    const onWorkersPreview=url.hostname.endsWith('.workers.dev');

    if(url.pathname==='/api/admin/context'&&request.method==='GET') {
      try {
        const context=await verifyAdminSession(request);
        return context?json(context):json({error:'Admin-Anmeldung erforderlich.'},401);
      } catch(error) {
        console.error('admin context bridge error',error);
        return json({error:'Der geschützte Adminzugang ist gerade nicht erreichbar.'},503);
      }
    }

    if(onWorkersPreview&&ADMIN_AUTH_PATHS.has(url.pathname)) {
      try{return await proxyAdminAuth(request);}
      catch(error){
        console.error('preview admin auth proxy error',error);
        return json({error:'Der geschützte Adminzugang ist gerade nicht erreichbar.'},503);
      }
    }

    if(url.pathname.startsWith('/api/preview/admin/')) {
      try{return await platformAdmin(request,env);}
      catch(error){
        console.error('platform admin gateway error',error);
        return json({error:'Der Adminbereich ist gerade nicht erreichbar.'},503);
      }
    }

    return previewWorker.fetch(request,env,ctx);
  }
};
