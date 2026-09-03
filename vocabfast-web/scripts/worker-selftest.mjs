import worker from '../src/worker-v6.js';

class ObjBody {
  constructor(buf, meta={}){ this.buf=buf; this.size=buf.length; this.httpMetadata=meta.httpMetadata||{}; this.customMetadata=meta.customMetadata||{}; this.body=new Blob([buf]).stream(); }
  async text(){ return new TextDecoder().decode(this.buf); }
}
class MockR2 {
  constructor(){ this.map=new Map(); }
  async put(key, value, opts={}){let buf;if(typeof value==='string')buf=new TextEncoder().encode(value);else if(value instanceof ArrayBuffer)buf=new Uint8Array(value);else if(ArrayBuffer.isView(value))buf=new Uint8Array(value.buffer,value.byteOffset,value.byteLength);else if(value instanceof Blob)buf=new Uint8Array(await value.arrayBuffer());else if(value?.getReader){const ab=await new Response(value).arrayBuffer();buf=new Uint8Array(ab)}else throw new Error('unsupported put value');this.map.set(key,{buf,opts});return {}}
  async get(key){const x=this.map.get(key);return x?new ObjBody(x.buf,x.opts):null}
  async head(key){const x=this.map.get(key);return x?{key,size:x.buf.length}:null}
  async delete(keys){if(!Array.isArray(keys))keys=[keys];for(const k of keys)this.map.delete(k)}
  async list({prefix='',cursor,limit=1000}={}){const all=[...this.map.keys()].filter(k=>k.startsWith(prefix)).sort(),start=cursor?Number(cursor):0,part=all.slice(start,start+limit),next=start+part.length;return {objects:part.map(key=>({key,size:this.map.get(key).buf.length})),truncated:next<all.length,cursor:next<all.length?String(next):undefined}}
}
let grammarSeq=0;
const AI={run:async(_model,{prompt})=>{
  if(String(prompt).includes('zweisprachige Fachwortliste'))return {response:JSON.stringify([{en:'refractory lining',de:'feuerfeste Ausmauerung',level:'B2',importance:5},{en:'firebrick',de:'Schamottestein',level:'B2',importance:5}])};
  const n=Math.min(30,Math.max(12,Number(String(prompt).match(/Erstelle (\d+)/)?.[1]||20))),rows=[];
  for(let i=0;i<n;i++){const k=++grammarSeq;rows.push({text:`Unique grammar sentence ${k}: ___ the procedure correctly.`,answer:'Does',options:['Do','Does','Is','Has'],topic:'Present Simple',level:'A1',explanation:'Third-person singular question form.'})}
  return {response:JSON.stringify(rows)};
}};
const bucket=new MockR2();
const env={PDFS:bucket,ASSETS:{fetch:()=>new Response('asset')},AI,ADMIN_USERNAME:'admin',ADMIN_PASSWORD:'StrongAdminPassword-123!'};
const call=(path,opts={})=>worker.fetch(new Request(`https://example.test${path}`,opts),env);
const j=async r=>({status:r.status,data:await r.json(),cookie:r.headers.get('set-cookie')});
const jsonHeaders=c=>({Cookie:c,'Content-Type':'application/json'});

let r=await call('/api/health'),x=await j(r);if(x.status!==200||!x.data.ok)throw new Error('health');
r=await call('/api/auth/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'Test User',email:'test@example.com',password:'password123'})});x=await j(r);if(x.status!==201||!x.cookie)throw new Error('register '+JSON.stringify(x));const userId=x.data.user.id,userCookie=x.cookie.split(';')[0];
r=await call('/api/me',{headers:{Cookie:userCookie}});x=await j(r);if(x.data.user?.effectivePlan!=='free')throw new Error('new account must be free');
r=await call('/api/topics/generate',{method:'POST',headers:jsonHeaders(userCookie),body:JSON.stringify({name:'Feuerfest Ausmauerung, Schamotte',count:80})});x=await j(r);if(x.status!==403||x.data.code!=='PRO_REQUIRED')throw new Error('free topic pro gate');
r=await call('/api/tests/grammar/generate',{method:'POST',headers:jsonHeaders(userCookie),body:JSON.stringify({areas:['Present Simple'],levels:['A1'],count:10,mode:'practice'})});x=await j(r);if(x.status!==200||x.data.questions?.length!==10)throw new Error('free grammar practice');
r=await call('/api/tests/grammar/generate',{method:'POST',headers:jsonHeaders(userCookie),body:JSON.stringify({areas:['Present Simple'],levels:['A1'],count:20,mode:'test'})});x=await j(r);if(x.status!==403)throw new Error('free chapter test pro gate');
const freeFd=new FormData();freeFd.append('file',new File([new TextEncoder().encode('%PDF-1.4\nfree')],'free.pdf',{type:'application/pdf'}));r=await call('/api/pdfs',{method:'POST',headers:{Cookie:userCookie},body:freeFd});x=await j(r);if(x.status!==403)throw new Error('free pdf pro gate');

r=await call('/api/admin/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:'admin',password:env.ADMIN_PASSWORD})});x=await j(r);if(x.status!==200||!x.cookie)throw new Error('admin login');const adminCookie=x.cookie.split(';')[0];
r=await call(`/api/admin/users/${userId}`,{method:'PUT',headers:jsonHeaders(adminCookie),body:JSON.stringify({plan:'pro'})});x=await j(r);if(x.status!==200||x.data.profile?.effectivePlan!=='pro')throw new Error('promote pro');
r=await call('/api/me',{headers:{Cookie:userCookie}});x=await j(r);if(x.data.user?.effectivePlan!=='pro')throw new Error('pro me');
r=await call('/api/topics/generate',{method:'POST',headers:jsonHeaders(userCookie),body:JSON.stringify({name:'Feuerfest Ausmauerung, Schamotte',count:80})});x=await j(r);if(x.status!==200||!Array.isArray(x.data.words)||x.data.words.length<20)throw new Error('pro topic generation');
r=await call('/api/tests/grammar/generate',{method:'POST',headers:jsonHeaders(userCookie),body:JSON.stringify({areas:['Present Simple'],levels:['A1'],count:20,mode:'test',exclude:['old sentence']})});x=await j(r);if(x.status!==200||x.data.questions?.length!==20||new Set(x.data.questions.map(q=>q.text)).size!==20)throw new Error('pro grammar chapter');
const firstGrammar=new Set(x.data.questions.map(q=>q.text));r=await call('/api/tests/grammar/generate',{method:'POST',headers:jsonHeaders(userCookie),body:JSON.stringify({areas:['Present Simple'],levels:['A1'],count:20,mode:'test'})});x=await j(r);if(x.status!==200||x.data.questions?.length!==20||x.data.questions.some(q=>firstGrammar.has(q.text)))throw new Error('grammar repeat history');

const fd=new FormData();fd.append('context','Helicopter');fd.append('file',new File([new TextEncoder().encode('%PDF-1.4\nhello')],'manual.pdf',{type:'application/pdf'}));
r=await call('/api/pdfs',{method:'POST',headers:{Cookie:userCookie},body:fd});x=await j(r);if(x.status!==201||!x.data.id)throw new Error('pro pdf upload '+JSON.stringify(x));const pdfId=x.data.id;
r=await call(`/api/admin/users/${userId}/pdfs`,{headers:{Cookie:adminCookie}});x=await j(r);if(x.status!==200||x.data.pdfs?.length!==1)throw new Error('admin pdf list');
r=await call(`/api/admin/users/${userId}/pdfs/${pdfId}/file`,{headers:{Cookie:adminCookie}});if(r.status!==200||!(r.headers.get('content-type')||'').includes('application/pdf'))throw new Error('admin pdf download');
r=await call(`/api/admin/users/${userId}/pdfs/${pdfId}`,{method:'DELETE',headers:{Cookie:adminCookie}});x=await j(r);if(!x.data.ok)throw new Error('admin pdf delete');
r=await call(`/api/admin/users/${userId}/state`,{method:'PUT',headers:jsonHeaders(adminCookie),body:JSON.stringify({state:{learning:[{en:'rotor',de:'Rotor',level:'B1'}],stats:{xp:999}}})});x=await j(r);if(!x.data.ok)throw new Error('admin state update');
console.log('WORKER V12 PRO/ADMIN/PDF/GRAMMAR SELFTEST OK');
