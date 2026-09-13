import { useMemo, useState } from 'react';
import { translationLanguages } from '../data/catalog';
import { makeWord, mergeWords, readWords, saveWords } from '../learning/personal-words';
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
  const [text,setText]=useState('');const [result,setResult]=useState<TranslationResult|null>(null);const [busy,setBusy]=useState(false);const [error,setError]=useState('');const [saved,setSaved]=useState('');const [copied,setCopied]=useState('');
  const sourceMeta=useMemo(()=>translationLanguages.find(item=>item.code===source),[source]);
  const targetMeta=useMemo(()=>translationLanguages.find(item=>item.code===target),[target]);
  const activeSourceMeta=useMemo(()=>translationLanguages.find(item=>item.code===sourceLanguage),[sourceLanguage]);
  const activeTargetMeta=useMemo(()=>translationLanguages.find(item=>item.code===targetLanguage),[targetLanguage]);
  function resetResult(){setResult(null);setError('');setSaved('');setCopied('');}
  async function run(){if(!text.trim()||source===target||busy)return;setBusy(true);setError('');setSaved('');setCopied('');try{setResult(await translate(text,source,target));}catch(reason){setError(reason instanceof Error?reason.message:'Übersetzung fehlgeschlagen.');}finally{setBusy(false);}}
  function swap(){const nextSource=target,nextTarget=source;setSource(nextSource);setTarget(nextTarget);if(result)setText(result.translation);resetResult();onSwap(nextSource,nextTarget);}
  async function copy(value:string,label='Kopiert'){try{await navigator.clipboard?.writeText(value);setCopied(`✓ ${label}`);window.setTimeout(()=>setCopied(''),1800);}catch{setCopied('');setError('Kopieren ist in diesem Browser nicht verfügbar.');}}
  function saveResult(){
    if(!result)return;
    const sourceText=text.trim();
    if(sourceText.length>200||result.translation.length>500){setSaved('');setError('Für eine Karteikarte darf der Ausgangstext höchstens 200 Zeichen und die Übersetzung höchstens 500 Zeichen haben.');return;}
    const forwardPair=source===sourceLanguage&&target===targetLanguage;
    const reversePair=source===targetLanguage&&target===sourceLanguage;
    if(!forwardPair&&!reversePair){setSaved('');setError(`Karteikarten werden im aktuellen Lernpfad ${activeSourceMeta?.name||sourceLanguage} → ${activeTargetMeta?.name||targetLanguage} gespeichert. Stelle den Übersetzer auf dieses Sprachpaar oder die umgekehrte Richtung.`);return;}
    const learningWord=forwardPair?result.translation:sourceText;
    const knownTranslation=forwardPair?sourceText:result.translation;
    const current=readWords(),next=mergeWords(current,[makeWord(learningWord,knownTranslation,'Übersetzer')]);
    if(next.length===current.length){setSaved('Bereits in deinem Wortschatz.');setError('');return;}
    try{saveWords(next);setSaved(`✓ „${learningWord}“ als Karteikarte gespeichert.`);setError('');}catch{setSaved('');setError('Die Karteikarte konnte nicht gespeichert werden.');}
  }
  const canSavePair=(source===sourceLanguage&&target===targetLanguage)||(source===targetLanguage&&target===sourceLanguage);
  return <section className="platform-view translator-view">
    <div className="view-hero compact"><div><span className="eyebrow">VOCABFAST TRANSLATE</span><h1>Übersetzen und dabei wirklich lernen.</h1><p>Übersetze zwischen allen VocabFast-Sprachen. Du bekommst eine natürliche Hauptübersetzung, Varianten und einen kurzen Lernhinweis – und kannst passende Ergebnisse direkt in deinen Wortschatz übernehmen.</p></div></div>
    <div className="translator-card">
      <div className="translator-language-row"><label><span>Von</span><select value={source} onChange={event=>{setSource(event.target.value as LanguageCode);resetResult();}}>{translationLanguages.map(language=><option key={language.code} value={language.code} disabled={language.code===target}>{language.name} · {language.nativeName}</option>)}</select></label><button className="translator-swap" onClick={swap} aria-label="Sprachen tauschen">⇄</button><label><span>Nach</span><select value={target} onChange={event=>{setTarget(event.target.value as LanguageCode);resetResult();}}>{translationLanguages.map(language=><option key={language.code} value={language.code} disabled={language.code===source}>{language.name} · {language.nativeName}</option>)}</select></label></div>
      <div className="translator-grid"><div className="translator-input"><div className="translator-pane-head"><strong>{sourceMeta?.name}</strong><small>{text.length}/3000</small></div><textarea maxLength={3000} value={text} onChange={event=>{setText(event.target.value);setSaved('');setCopied('');}} onKeyDown={event=>{if((event.ctrlKey||event.metaKey)&&event.key==='Enter'){event.preventDefault();void run();}}} placeholder="Text eingeben …"/><div className="translator-actions"><small>Strg/⌘ + Enter</small><button onClick={()=>{setText('');resetResult();}} disabled={!text}>Leeren</button><button className="view-primary" onClick={()=>void run()} disabled={busy||!text.trim()||source===target}>{busy?'Übersetze …':'Übersetzen →'}</button></div></div><div className="translator-output"><div className="translator-pane-head"><strong>{targetMeta?.name}</strong><small>{result?'Übersetzung':'Bereit'}</small></div>{error?<div className="translator-error" role="alert">{error}</div>:result?<div className="translator-result"><h2>{result.translation}</h2>{result.alternatives.length>0&&<div className="translator-alternatives"><span>Natürliche Varianten</span>{result.alternatives.map(value=><button key={value} onClick={()=>void copy(value,'Variante kopiert')}>{value}</button>)}</div>}{result.note&&<div className="translator-note"><span>LERNHINWEIS</span><p>{result.note}</p></div>}<div className="translator-result-actions"><button className="translator-copy" onClick={()=>void copy(result.translation,'Übersetzung kopiert')}>Übersetzung kopieren</button><button className="translator-save" onClick={saveResult} disabled={text.trim().length>200||result.translation.length>500}>+ Als Karteikarte speichern</button></div>{!canSavePair&&<div className="translator-pair-hint">Karteikarten gehören zum aktiven Lernpfad {activeSourceMeta?.symbol} → {activeTargetMeta?.symbol}. Übersetzen bleibt trotzdem in allen {translationLanguages.length} Sprachen möglich.</div>}{copied&&<div className="translator-saved" role="status">{copied}</div>}{saved&&<div className="translator-saved" role="status">{saved}</div>}</div>:<div className="translator-empty"><strong>{sourceMeta?.symbol} → {targetMeta?.symbol}</strong><span>Deine Übersetzung erscheint hier.</span></div>}</div></div>
    </div>
  </section>;
}
