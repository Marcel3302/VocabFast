import previewWorker from './preview-worker.js';
export { PreviewAccountStore } from './preview-worker.js';

const PRODUCTION_ORIGIN='https://vocabfast.net';
const ADMIN_PROXY_PATHS=new Set(['/api/admin/login','/api/admin/logout','/api/admin/context']);

function json(data,status=200,headers={}) {
  return new Response(JSON.stringify(data),{
    status,
    headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow, noarchive',...headers}
  });
}

async function proxyAdminRequest(request) {
  const sourceUrl=new URL(request.url);
  const targetPath=sourceUrl.pathname==='/api/admin/context'?'/api/admin/me':sourceUrl.pathname;
  const targetUrl=new URL(`${targetPath}${sourceUrl.search}`,PRODUCTION_ORIGIN);
  const headers=new Headers(request.headers);
  headers.set('Origin',PRODUCTION_ORIGIN);
  headers.set('Referer',`${PRODUCTION_ORIGIN}/admin`);
  headers.set('Accept','application/json');
  headers.delete('host');

  const init={method:request.method,headers,redirect:'manual'};
  if(request.method!=='GET'&&request.method!=='HEAD')init.body=await request.arrayBuffer();

  const upstream=await fetch(targetUrl,init);

  if(sourceUrl.pathname==='/api/admin/context') {
    if(!upstream.ok)return json({error:'Admin-Anmeldung erforderlich.'},401);
    const data=await upstream.json().catch(()=>null);
    const admin=data?.admin;
    if(!admin)return json({error:'Admin-Anmeldung erforderlich.'},401);
    return json({
      superadmin:true,
      username:admin.username||'admin',
      name:'Superadmin',
      createdAt:admin.createdAt||null,
      expiresAt:admin.expiresAt||null
    });
  }

  const responseHeaders=new Headers(upstream.headers);
  responseHeaders.set('Cache-Control','no-store');
  responseHeaders.set('X-Robots-Tag','noindex, nofollow, noarchive');
  return new Response(upstream.body,{status:upstream.status,statusText:upstream.statusText,headers:responseHeaders});
}

export default {
  async fetch(request,env,ctx) {
    const url=new URL(request.url);
    const onWorkersPreview=url.hostname.endsWith('.workers.dev');
    const isContextRoute=url.pathname==='/api/admin/context';
    if((onWorkersPreview&&ADMIN_PROXY_PATHS.has(url.pathname))||isContextRoute) {
      try{return await proxyAdminRequest(request);}
      catch(error){
        console.error('preview admin auth proxy error',error);
        return json({error:'Der geschützte Adminzugang ist gerade nicht erreichbar.'},503);
      }
    }
    return previewWorker.fetch(request,env,ctx);
  }
};
