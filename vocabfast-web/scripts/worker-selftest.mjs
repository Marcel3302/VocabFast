import worker from '../src/worker.js';

class ObjBody {
  constructor(buf, meta={}){ this.buf=buf; this.size=buf.length; this.httpMetadata=meta.httpMetadata||{}; this.customMetadata=meta.customMetadata||{}; this.body=new Blob([buf]).stream(); }
  async text(){ return new TextDecoder().decode(this.buf); }
}
class MockR2 {
  constructor(){ this.map=new Map(); }
  async put(key, value, opts={}){
    let buf;
    if (typeof value === 'string') buf=new TextEncoder().encode(value);
    else if (value instanceof ArrayBuffer) buf=new Uint8Array(value);
    else if (ArrayBuffer.isView(value)) buf=new Uint8Array(value.buffer,value.byteOffset,value.byteLength);
    else if (value instanceof Blob) buf=new Uint8Array(await value.arrayBuffer());
    else if (value?.getReader){ const ab=await new Response(value).arrayBuffer(); buf=new Uint8Array(ab); }
    else throw new Error('unsupported put value');
    this.map.set(key,{buf,opts});
    return {};
  }
  async get(key){ const x=this.map.get(key); return x?new ObjBody(x.buf,x.opts):null; }
  async head(key){ const x=this.map.get(key); return x?{key,size:x.buf.length}:null; }
  async delete(keys){ if(!Array.isArray(keys)) keys=[keys]; for(const k of keys)this.map.delete(k); }
  async list({prefix='',cursor,limit=1000}={}){ const all=[...this.map.keys()].filter(k=>k.startsWith(prefix)).sort(); const start=cursor?Number(cursor):0; const part=all.slice(start,start+limit); const next=start+part.length; return {objects:part.map(key=>({key,size:this.map.get(key).buf.length})),truncated:next<all.length,cursor:next<all.length?String(next):undefined}; }
}
const bucket=new MockR2();
const env={PDFS:bucket,ASSETS:{fetch:()=>new Response('asset')}};
const call=(path,opts={})=>worker.fetch(new Request(`https://example.test${path}`,opts),env);
const j=async r=>({status:r.status,data:await r.json(),cookie:r.headers.get('set-cookie')});

let r=await call('/api/health'); let x=await j(r); if(x.status!==200||!x.data.ok) throw new Error('health');
r=await call('/api/me'); x=await j(r); if(x.status!==200||x.data.user!==null) throw new Error('me anonymous');
r=await call('/api/auth/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'Test User',email:'test@example.com',password:'password123'})}); x=await j(r); if(x.status!==201||!x.cookie) throw new Error('register '+JSON.stringify(x)); const cookie=x.cookie.split(';')[0];
r=await call('/api/me',{headers:{Cookie:cookie}}); x=await j(r); if(x.data.user?.email!=='test@example.com') throw new Error('me auth');
r=await call('/api/state',{headers:{Cookie:cookie}}); x=await j(r); if(!Array.isArray(x.data.state.learning)) throw new Error('state get');
r=await call('/api/state',{method:'PUT',headers:{Cookie:cookie,'Content-Type':'application/json'},body:JSON.stringify({learning:[{en:'rotor',de:'Rotor',level:'B1'}],customTopics:[],settings:{sort:'level-asc'},stats:{xp:10,studyDates:[]},mastery:{}})}); x=await j(r); if(!x.data.ok) throw new Error('state put');
r=await call('/api/auth/logout',{method:'POST',headers:{Cookie:cookie}}); x=await j(r); if(!x.data.ok) throw new Error('logout');
r=await call('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'test@example.com',password:'password123'})}); x=await j(r); if(x.status!==200||!x.cookie) throw new Error('login '+JSON.stringify(x)); const cookie2=x.cookie.split(';')[0];
const fd=new FormData(); fd.append('context','Helicopter'); fd.append('file',new File([new TextEncoder().encode('%PDF-1.4\nhello')],'manual.pdf',{type:'application/pdf'}));
r=await call('/api/pdfs',{method:'POST',headers:{Cookie:cookie2},body:fd}); x=await j(r); if(x.status!==201||!x.data.id) throw new Error('pdf upload '+JSON.stringify(x)); const pdfId=x.data.id;
r=await call('/api/pdfs',{headers:{Cookie:cookie2}}); x=await j(r); if(x.data.length!==1) throw new Error('pdf list');
r=await call(`/api/pdfs/${pdfId}/file`,{headers:{Cookie:cookie2}}); if(r.status!==200 || !(r.headers.get('content-type')||'').includes('application/pdf')) throw new Error('pdf get');
r=await call(`/api/pdfs/${pdfId}`,{method:'DELETE',headers:{Cookie:cookie2}}); x=await j(r); if(!x.data.ok) throw new Error('pdf delete');
r=await call('/api/account',{method:'DELETE',headers:{Cookie:cookie2,'Content-Type':'application/json'},body:JSON.stringify({password:'password123'})}); x=await j(r); if(!x.data.ok) throw new Error('account delete');
r=await call('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'test@example.com',password:'password123'})}); x=await j(r); if(x.status!==401) throw new Error('deleted account login');
console.log('WORKER R2 SELFTEST OK');
