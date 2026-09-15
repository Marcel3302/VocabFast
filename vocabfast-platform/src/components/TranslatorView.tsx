import { useEffect, useMemo, useRef, useState } from 'react';
import { translationLanguages } from '../data/catalog';
import { findDuplicateWord, makeWord, mergeWords, readWords, saveWords } from '../learning/personal-words';
import type { LanguageCode } from '../learning/preferences';
import { speakLanguage, speechLocales } from '../learning/speech';
import { queueSpeakDraft } from '../learning/study-flow';
import './translator-view.css';
import './translator-reliability.css';
import './translator-editing.css';

type Props={sourceLanguage:LanguageCode;targetLanguage:LanguageCode;onOpenWords:()=>void;onOpenSpeak?:()=>void};
type TranslationResult={translation:string;alternatives:string[];note:string;source:string;target:string;provider?:string};
type HistoryItem={id:string;text:string;translation:string;source:LanguageCode;target:LanguageCode;createdAt:number};
type Draft={text:string;source?:LanguageCode};
type SpeechRecognizer={lang:string;interimResults:boolean;continuous:boolean;start:()=>void;stop:()=>void;onresult:((event:unknown)=>void)|null;onerror:((event:unknown)=>void)|null;onend:(()=>void)|null};
type SpeechRecognizerCtor=new()=>SpeechRecognizer;

const HISTORY_KEY='vocabfast-translate-history-v1';
const DRAFT_KEY='vocabfast-translate-draft-v1';
const AUTO_TRANSLATE_DELAY_MS=550;
const invalidTranslation=new Set(['[object object]','object object','undefined','null']);
function usableTranslation(value:unknown):value is string{return typeof value==='string'&&Boolean(value.trim())&&!invalidTranslation.has(value.trim().toLocaleLowerCase());}

async function translate(text:string,source:string,target:string){
  const controller=new AbortController();
  const timeout=window.setTimeout(()=>controller.abort(),12000);
  try{
    const response=await fetch('/api/platform/translate',{method:'POST',credentials:'same-origin',cache:'no-store',signal:controller.signal,headers:{'Content-Type':'application/json'},body:JSON.stringify({text,source,target})});
    const data=await response.json().catch(()=>({})) as Partial<TranslationResult>&{error?:string};
    if(!response.ok)throw new Error(data.error||'Übersetzung fehlgeschlagen.');
    const translation=usableTranslation(data.translation)?data.translation.trim():'';
    if(!translation)throw new Error('Der Übersetzungsdienst hat keine brauchbare Antwort geliefert. Bitte versuche es erneut.');
    return {translation,alternatives:Array.isArray(data.alternatives)?data.alternatives.filter(item=>usableTranslation(item)).slice(0,3):[],note:typeof data.note==='string'?data.note:'',source:typeof data.source==='string'?data.source:source,target:typeof data.target==='string'?data.target:target,provider:typeof data.provider==='string'?data.provider:undefined};
  }catch(reason){
    if(reason instanceof DOMException&&reason.name==='AbortError')throw new Error('Die Übersetzung dauert zu lange. Bitte versuche es noch einmal.');
    throw reason;
  }finally{window.clearTimeout(timeout);}
}

function readHistory():HistoryItem[]{
  try{
    const parsed=JSON.parse(localStorage.getItem(HISTORY_KEY)||'[]') as HistoryItem[];
    return Array.isArray(parsed)?parsed.filter(item=>item&&typeof item.text==='string'&&usableTranslation(item.translation)).slice(0,20):[];
  }catch{return [];}
}
function writeHistory(items:HistoryItem[]){try{localStorage.setItem(HISTORY_KEY,JSON.stringify(items.slice(0,20)));}catch{/* Verlauf ist Komfortfunktion. */}}
function readDraft():Draft|null{
  try{
    const raw=localStorage.getItem(DRAFT_KEY);if(!raw)return null;localStorage.removeItem(DRAFT_KEY);
    const parsed=JSON.parse(raw) as Partial<Draft>;return typeof parsed.text==='string'?{text:parsed.text,source:parsed.source}:null;
  }catch{return null;}
}
function speechCtor():SpeechRecognizerCtor|null{
  const speechWindow=window as unknown as {SpeechRecognition?:SpeechRecognizerCtor;webkitSpeechRecognition?:SpeechRecognizerCtor};
  return speechWindow.SpeechRecognition??speechWindow.webkitSpeechRecognition??null;
}
function speak(text:string,language:LanguageCode){return speakLanguage(text,language,.92);}
function validLanguage(value:unknown):value is LanguageCode{return typeof value==='string'&&translationLanguages.some(language=>language.code===value);}

export default function TranslatorView({sourceLanguage,targetLanguage,onOpenWords,onOpenSpeak}:Props){
  const draftRef=useRef<Draft|null>(null);if(draftRef.current===null)draftRef.current=readDraft()??{text:''};
  const draft=draftRef.current;
  const initialSource=validLanguage(draft.source)?draft.source:sourceLanguage;
  const initialTarget:LanguageCode=initialSource===targetLanguage?(targetLanguage==='en'?'de':'en'):targetLanguage;
  const [source,setSource]=useState<LanguageCode>(initialSource),[target,setTarget]=useState<LanguageCode>(initialTarget);
  const [text,setText]=useState(draft.text||'');const [result,setResult]=useState<TranslationResult|null>(null);const [busy,setBusy]=useState(false);const [error,setError]=useState('');const [saved,setSaved]=useState('');const [copied,setCopied]=useState('');
  const [history,setHistory]=useState<HistoryItem[]>(()=>readHistory());const [listening,setListening]=useState(false);const recognitionRef=useRef<SpeechRecognizer|null>(null);
  const requestVersionRef=useRef(0),skipAutoOnceRef=useRef(false);
  const sourceMeta=useMemo(()=>translationLanguages.find(item=>item.code===source),[source]);
  const targetMeta=useMemo(()=>translationLanguages.find(item=>item.code===target),[target]);
  const activeSourceMeta=useMemo(()=>translationLanguages.find(item=>item.code===sourceLanguage),[sourceLanguage]);
  const activeTargetMeta=useMemo(()=>translationLanguages.find(item=>item.code===targetLanguage),[targetLanguage]);
  useEffect(()=>()=>{recognitionRef.current?.stop();window.speechSynthesis?.cancel();requestVersionRef.current+=1;},[]);
  useEffect(()=>{
    if(skipAutoOnceRef.current){skipAutoOnceRef.current=false;return;}
    const input=text.trim();
    if(!input||source===target)return;
    const timer=window.setTimeout(()=>{void run(input,source,target);},AUTO_TRANSLATE_DELAY_MS);
    return()=>window.clearTimeout(timer);
  },[text,source,target]);

  function resetResult(){setResult(null);setError('');setSaved('');setCopied('');}
  function invalidateResult(){requestVersionRef.current+=1;setBusy(false);resetResult();}
  function changeText(value:string){invalidateResult();setText(value);}
  function remember(input:string,output:string,from:LanguageCode,to:LanguageCode){
    const item:HistoryItem={id:`${Date.now()}-${Math.random().toString(36).slice(2,7)}`,text:input,translation:output,source:from,target:to,createdAt:Date.now()};
    setHistory(current=>{const next=[item,...current.filter(entry=>!(entry.text===input&&entry.translation===output))].slice(0,20);writeHistory(next);return next;});
  }
  async function run(value=text,from=source,to=target){
    const input=value.trim();if(!input||from===to)return;
    const requestId=++requestVersionRef.current;
    setBusy(true);setError('');setSaved('');setCopied('');
    try{
      const next=await translate(input,from,to);
      if(requestId!==requestVersionRef.current)return;
      setResult(next);remember(input,next.translation,from,to);
    }catch(reason){
      if(requestId!==requestVersionRef.current)return;
      setResult(null);setError(reason instanceof Error?reason.message:'Übersetzung fehlgeschlagen.');
    }finally{if(requestId===requestVersionRef.current)setBusy(false);}
  }
  function swap(){const nextSource=target,nextTarget=source;const nextText=result?.translation??text;invalidateResult();setSource(nextSource);setTarget(nextTarget);setText(nextText);}
  async function copy(value:string,label='Kopiert'){try{await navigator.clipboard?.writeText(value);setCopied(`✓ ${label}`);window.setTimeout(()=>setCopied(''),1800);}catch{setCopied('');setError('Kopieren ist in diesem Browser nicht verfügbar.');}}
  function editTranslation(value:string){setResult(current=>current?{...current,translation:value}:current);setSaved('');setCopied('');setError('');}
  function saveResult(openAfter=false){
    if(!result)return false;
    const sourceText=text.trim(),editedTranslation=result.translation.trim();
    if(!editedTranslation){setSaved('');setError('Bitte gib eine Übersetzung ein, bevor du sie speicherst.');return false;}
    if(sourceText.length>200||editedTranslation.length>500){setSaved('');setError('Für eine Karteikarte darf der Ausgangstext höchstens 200 Zeichen und die Übersetzung höchstens 500 Zeichen haben.');return false;}
    const forwardPair=source===sourceLanguage&&target===targetLanguage;
    const reversePair=source===targetLanguage&&target===sourceLanguage;
    if(!forwardPair&&!reversePair){setSaved('');setError(`Karteikarten werden im aktuellen Lernpfad ${activeSourceMeta?.name||sourceLanguage} → ${activeTargetMeta?.name||targetLanguage} gespeichert. Stelle den Übersetzer auf dieses Sprachpaar oder die umgekehrte Richtung.`);return false;}
    const learningWord=forwardPair?editedTranslation:sourceText;
    const knownTranslation=forwardPair?sourceText:editedTranslation;
    const current=readWords(),duplicate=findDuplicateWord(current,learningWord);
    if(duplicate){setSaved('');setError(`„${learningWord}“ ist bereits in deinen Wörtern gespeichert. Doppelte Wörter werden nicht noch einmal angelegt.`);return false;}
    const next=mergeWords(current,[makeWord(learningWord,knownTranslation,'Übersetzer')]);
    try{
      saveWords(next);remember(sourceText,editedTranslation,source,target);
      setSaved(`✓ „${learningWord}“ als Karteikarte gespeichert.`);setError('');
      if(openAfter)window.setTimeout(onOpenWords,120);
      return true;
    }catch{setSaved('');setError('Die Karteikarte konnte nicht gespeichert werden.');return false;}
  }
  function practiceSpeaking(){
    if(!result||!onOpenSpeak)return;
    const sourceText=text.trim(),editedTranslation=result.translation.trim();let targetText='',supportText='';
    if(target===targetLanguage){targetText=editedTranslation;supportText=sourceText;}
    else if(source===targetLanguage){targetText=sourceText;supportText=editedTranslation;}
    if(!targetText){setError(`Sprechtraining ist mit deinem aktuellen Lernpfad ${activeSourceMeta?.symbol} → ${activeTargetMeta?.symbol} verbunden. Übersetze zuerst in deine Lernsprache oder aus deiner Lernsprache.`);return;}
    queueSpeakDraft({targetText,supportText,sourceLanguage,targetLanguage});onOpenSpeak();
  }
  function dictate(){
    const Ctor=speechCtor();if(!Ctor){setError('Spracherkennung wird von diesem Browser nicht unterstützt. Tippe den Text ein oder verwende einen Browser mit Web-Speech-Unterstützung.');return;}
    recognitionRef.current?.stop();const recognition=new Ctor();recognition.lang=speechLocales[source]||source;recognition.interimResults=false;recognition.continuous=false;
    recognition.onresult=(event:unknown)=>{const speechEvent=event as {results?:ArrayLike<ArrayLike<{transcript?:string}>>};const transcript=speechEvent.results?.[0]?.[0]?.transcript?.trim()||'';if(transcript)changeText(transcript);};
    recognition.onerror=()=>setError('Das Mikrofon konnte deine Sprache nicht erkennen. Prüfe die Mikrofonfreigabe und versuche es erneut.');recognition.onend=()=>setListening(false);recognitionRef.current=recognition;setListening(true);setError('');recognition.start();
  }
  function restore(item:HistoryItem){requestVersionRef.current+=1;setBusy(false);skipAutoOnceRef.current=true;setSource(item.source);setTarget(item.target);setText(item.text);setResult({translation:item.translation,alternatives:[],note:'Aus deinem Übersetzungsverlauf wiederhergestellt.',source:item.source,target:item.target,provider:'history'});setError('');setSaved('');setCopied('');window.scrollTo({top:0,behavior:'smooth'});}
  function clearHistory(){setHistory([]);writeHistory([]);}
  const canSavePair=(source===sourceLanguage&&target===targetLanguage)||(source===targetLanguage&&target===sourceLanguage);
  const canSpeakPractice=Boolean(onOpenSpeak&&result&&(source===targetLanguage||target===targetLanguage));
  const quickPhrases=source==='de'?['Wo befindet sich der Bahnhof?','Ich habe eine Reservierung.','Können Sie das bitte langsamer sagen?','Ich brauche Hilfe.']:[];
  const providerLabel=result?.provider==='cloudflare-ai-translation'?'VocabFast AI':result?.provider==='cloudflare-translation'?'VocabFast Translation':result?.provider==='standard-fallback'?'Translation Fallback':result?.provider==='ai-fallback'?'KI-Fallback':result?.provider==='history'?'Aus Verlauf':'Übersetzung';

  return <section className="platform-view translator-view">
    <div className="view-hero compact translator-hero"><div><span className="eyebrow">VOCABFAST TRANSLATE</span><h1>Verstehen, antworten und direkt weiterlernen.</h1><p>Text, Sprache und Reise-Schnellhilfe in einem Werkzeug. Übersetze natürlich, höre das Ergebnis an und übernimm wichtige Sätze direkt in Wortschatz und Sprechtraining.</p></div><div className="translator-hero-badge"><strong>{translationLanguages.length}</strong><span>Sprachen</span><small>Text · Voice · Lernen</small></div></div>

    <div className="translator-card">
      <div className="translator-language-row"><label><span>Von</span><select value={source} onChange={event=>{requestVersionRef.current+=1;setBusy(false);setSource(event.target.value as LanguageCode);resetResult();}}>{translationLanguages.map(language=><option key={language.code} value={language.code} disabled={language.code===target}>{language.name} · {language.nativeName}</option>)}</select></label><button className="translator-swap" onClick={swap} aria-label="Sprachen tauschen">⇄</button><label><span>Nach</span><select value={target} onChange={event=>{requestVersionRef.current+=1;setBusy(false);setTarget(event.target.value as LanguageCode);resetResult();}}>{translationLanguages.map(language=><option key={language.code} value={language.code} disabled={language.code===source}>{language.name} · {language.nativeName}</option>)}</select></label></div>
      {quickPhrases.length>0&&<div className="translator-quick-phrases"><span>SCHNELLSTART</span>{quickPhrases.map(phrase=><button key={phrase} disabled={busy} onClick={()=>changeText(phrase)}>{phrase}</button>)}</div>}
      <div className="translator-grid"><div className="translator-input"><div className="translator-pane-head"><strong>{sourceMeta?.name}</strong><small>{text.length}/3000</small></div><textarea maxLength={3000} value={text} onChange={event=>changeText(event.target.value)} onKeyDown={event=>{if((event.ctrlKey||event.metaKey)&&event.key==='Enter'){event.preventDefault();void run();}}} placeholder="Schreibe oder sprich deinen Text …"/><div className="translator-actions"><button className={`translator-mic ${listening?'listening':''}`} onClick={dictate} disabled={listening||busy} title="Text sprechen">{listening?'◉ Höre zu …':'🎙 Sprechen'}</button><small>Automatisch nach kurzer Pause · Strg/⌘ + Enter</small><button onClick={()=>changeText('')} disabled={!text}>Leeren</button><button className="view-primary" onClick={()=>void run()} disabled={busy||!text.trim()||source===target}>{busy?'Übersetze …':'Jetzt übersetzen'}</button></div></div><div className="translator-output"><div className="translator-pane-head"><strong>{targetMeta?.name}</strong><small>{result?providerLabel:busy?'Übersetzt automatisch …':'Automatik bereit'}</small></div>{error?<div className="translator-error translator-error-retry" role="alert"><span>{error}</span><button onClick={()=>void run()} disabled={busy||!text.trim()}>Erneut versuchen</button></div>:result?<div className="translator-result"><div className="translator-result-title"><label className="translator-result-edit"><span>Übersetzung bearbeiten</span><textarea value={result.translation} maxLength={3000} onChange={event=>editTranslation(event.target.value)} aria-label="Übersetzung bearbeiten"/></label><button onClick={()=>{if(!speak(result.translation,target))setError('Vorlesen wird von diesem Browser nicht unterstützt.');}} aria-label="Übersetzung vorlesen">🔊</button></div>{result.alternatives.length>0&&<div className="translator-alternatives"><span>Natürliche Varianten</span>{result.alternatives.map(value=><button key={value} onClick={()=>editTranslation(value)}>{value}</button>)}</div>}{result.note&&<div className="translator-note"><span>LERNHINWEIS</span><p>{result.note}</p></div>}<div className="translator-result-actions"><button className="translator-copy" onClick={()=>void copy(result.translation,'Übersetzung kopiert')}>Kopieren</button><button className="translator-save" onClick={()=>saveResult(false)} disabled={!result.translation.trim()||text.trim().length>200||result.translation.trim().length>500}>+ Als Karteikarte speichern</button><button className="translator-study" onClick={()=>saveResult(true)} disabled={!canSavePair||!result.translation.trim()||text.trim().length>200||result.translation.trim().length>500}>Speichern & üben →</button>{canSpeakPractice&&<button className="translator-speak-next" onClick={practiceSpeaking}>🎙 Diesen Satz sprechen</button>}</div>{!canSavePair&&<div className="translator-pair-hint">Karteikarten gehören zum aktiven Lernpfad {activeSourceMeta?.symbol} → {activeTargetMeta?.symbol}. Übersetzen bleibt trotzdem in allen {translationLanguages.length} Sprachen möglich.</div>}{copied&&<div className="translator-saved" role="status">{copied}</div>}{saved&&<div className="translator-saved" role="status">{saved}</div>}</div>:<div className="translator-empty"><strong>{sourceMeta?.symbol} → {targetMeta?.symbol}</strong><span>{busy?'VocabFast übersetzt gerade automatisch …':'Deine Übersetzung erscheint automatisch hier.'}</span><small>{busy?'Falls der erste Dienst ausfällt, versucht VocabFast automatisch einen Fallback.':'Tippe einfach los – der Übersetzer startet nach einer kurzen Pause.'}</small></div>}</div></div>
    </div>

    {result&&<section className="translator-learning-loop"><div><span className="eyebrow">WEITER MIT DIESEM SATZ</span><h2>Aus einer Übersetzung wird Lernstoff.</h2><p>Du kannst die Übersetzung vor dem Speichern anpassen. Danach wird genau deine bearbeitete Version für Karteikarten und Sprechtraining verwendet.</p></div><div className="translator-loop-steps"><button disabled={!canSavePair} onClick={()=>saveResult(true)}><b>1</b><span><strong>Speichern & Review</strong><small>Direkt zu deinen Übungswörtern</small></span></button>{onOpenSpeak&&<button disabled={!canSpeakPractice} onClick={practiceSpeaking}><b>2</b><span><strong>Laut sprechen</strong><small>Eigener Satz im Speak-Modus</small></span></button>}<button onClick={()=>{const nextText=result.translation;const nextSource=target,nextTarget=source;invalidateResult();setText(nextText);setSource(nextSource);setTarget(nextTarget);}}><b>3</b><span><strong>Antwort formulieren</strong><small>Übersetzung zurück in die andere Richtung</small></span></button></div></section>}

    <section className="translator-history-section"><div className="translator-history-head"><div><span>VERLAUF</span><h2>Die letzten Übersetzungen bleiben griffbereit.</h2><p>Öffne frühere Sätze erneut und verwandle nützliche Formulierungen später in Lernstoff.</p></div>{history.length>0&&<button onClick={clearHistory}>Verlauf löschen</button>}</div>{history.length?<div className="translator-history-grid">{history.slice(0,8).map(item=><button key={item.id} onClick={()=>restore(item)}><span>{translationLanguages.find(language=>language.code===item.source)?.symbol} → {translationLanguages.find(language=>language.code===item.target)?.symbol}</span><strong>{item.text}</strong><small>{item.translation}</small></button>)}</div>:<div className="translator-history-empty">Deine ersten Übersetzungen erscheinen automatisch hier.</div>}</section>
  </section>;
}
