import { useMemo, useState } from 'react';
import { translationLanguages } from '../data/catalog';
import type { LanguageCode } from '../learning/preferences';
import './translator-view.css';

type Props={sourceLanguage:LanguageCode;targetLanguage:LanguageCode;onSwap:(source:LanguageCode,target:LanguageCode)=>void};
type TranslationResult={translation:string;alternatives:string[];note:string;source:string;target:string};

async function translate(text:string,source:string,target:string){
  const response=await fetch('/api/platform/translate',{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json'},body:JSON.stringify({text,source,target})});
  const data=await response.json().catch(()=>({})) as Partial<TranslationResult>&{error?:string};
  if(!response.ok)throw new Error(data.error||'Übersetzung fehlgeschlagen.');
  return data as TranslationResult;
}

export default function TranslatorView({sourceLanguage,targetLanguage,onSwap}:Props){
  const [source,setSource]=useState<LanguageCode>(sourceLanguage),[target,setTarget]=useState<LanguageCode>(targetLanguage);
  const [text,setText]=useState('');const [result,setResult]=useState<TranslationResult|null>(null);const [busy,setBusy]=useState(false);const [error,setError]=useState('');
  const sourceMeta=useMemo(()=>translationLanguages.find(item=>item.code===source),[source]);
  const targetMeta=useMemo(()=>translationLanguages.find(item=>item.code===target),[target]);
  async function run(){if(!text.trim()||source===target||busy)return;setBusy(true);setError('');try{setResult(await translate(text,source,target));}catch(reason){setError(reason instanceof Error?reason.message:'Übersetzung fehlgeschlagen.');}finally{setBusy(false);}}
  function swap(){const nextSource=target,nextTarget=source;setSource(nextSource);setTarget(nextTarget);if(result){setText(result.translation);setResult(null);}onSwap(nextSource,nextTarget);}
  return <section className="platform-view translator-view">
    <div className="view-hero compact"><div><span className="eyebrow">VOCABFAST TRANSLATE</span><h1>Übersetzen und dabei wirklich lernen.</h1><p>Übersetze zwischen allen VocabFast-Sprachen. Du bekommst eine natürliche Hauptübersetzung, Varianten und einen kurzen Lernhinweis.</p></div></div>
    <div className="translator-card">
      <div className="translator-language-row"><label><span>Von</span><select value={source} onChange={event=>setSource(event.target.value as LanguageCode)}>{translationLanguages.map(language=><option key={language.code} value={language.code}>{language.name} · {language.nativeName}</option>)}</select></label><button className="translator-swap" onClick={swap} aria-label="Sprachen tauschen">⇄</button><label><span>Nach</span><select value={target} onChange={event=>setTarget(event.target.value as LanguageCode)}>{translationLanguages.map(language=><option key={language.code} value={language.code}>{language.name} · {language.nativeName}</option>)}</select></label></div>
      <div className="translator-grid"><div className="translator-input"><div className="translator-pane-head"><strong>{sourceMeta?.name}</strong><small>{text.length}/3000</small></div><textarea maxLength={3000} value={text} onChange={event=>setText(event.target.value)} placeholder="Text eingeben …"/><div className="translator-actions"><button onClick={()=>setText('')} disabled={!text}>Leeren</button><button className="view-primary" onClick={()=>void run()} disabled={busy||!text.trim()||source===target}>{busy?'Übersetze …':'Übersetzen →'}</button></div></div><div className="translator-output"><div className="translator-pane-head"><strong>{targetMeta?.name}</strong><small>{result?'Übersetzung':'Bereit'}</small></div>{error?<div className="translator-error">{error}</div>:result?<div className="translator-result"><h2>{result.translation}</h2>{result.alternatives.length>0&&<div className="translator-alternatives"><span>Natürliche Varianten</span>{result.alternatives.map(value=><button key={value} onClick={()=>navigator.clipboard?.writeText(value)}>{value}</button>)}</div>}{result.note&&<div className="translator-note"><span>LERNHINWEIS</span><p>{result.note}</p></div>}<button className="translator-copy" onClick={()=>navigator.clipboard?.writeText(result.translation)}>Übersetzung kopieren</button></div>:<div className="translator-empty"><strong>{sourceMeta?.symbol} → {targetMeta?.symbol}</strong><span>Deine Übersetzung erscheint hier.</span></div>}</div></div>
    </div>
  </section>;
}
