const memoryCache=new Map<string,string>();
let requestSerial=0;

function key(targetLanguage:string,text:string){return `${targetLanguage}\u0000${text}`;}

async function translateGermanText(text:string,targetLanguage:string){
  const cacheKey=key(targetLanguage,text);
  const cached=memoryCache.get(cacheKey);
  if(cached)return cached;
  const response=await fetch('/api/platform/translate',{
    method:'POST',credentials:'same-origin',cache:'no-store',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({source:'de',target:targetLanguage,text})
  });
  const data=await response.json().catch(()=>({})) as {translation?:string};
  const translated=response.ok&&typeof data.translation==='string'&&data.translation.trim()?data.translation.trim():text;
  memoryCache.set(cacheKey,translated);
  return translated;
}

export async function localizeGermanTexts(texts:string[],sourceLanguage:string){
  const serial=++requestSerial;
  const unique=[...new Set(texts.map(text=>text.trim()).filter(Boolean))];
  if(sourceLanguage==='de'||unique.length===0)return {serial,translations:Object.fromEntries(unique.map(text=>[text,text]))};
  const translations:Record<string,string>={};
  await Promise.all(unique.map(async text=>{try{translations[text]=await translateGermanText(text,sourceLanguage);}catch{translations[text]=text;}}));
  return {serial,translations};
}
