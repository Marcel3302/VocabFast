import { useEffect, useMemo, useRef, useState } from 'react';
import { languageByCode } from '../data/catalog';
import { readPreferences } from '../learning/preferences';
import { canRecognizeSpeech, recognizeLanguage, speakLanguage } from '../learning/speech';
import './ai-assistant.css';

type ChatMessage={role:'user'|'assistant';text:string};
type ChatMode='coach'|'conversation'|'general';
type AiResponse={reply?:string;error?:string;remaining?:number|null};

function currentContext(){
  const preferences=readPreferences();
  const active=document.querySelector('.main-nav button.active span:last-child')?.textContent?.trim()||document.querySelector('.companion-mobile-nav button.active small')?.textContent?.trim()||'VocabFast';
  const heading=document.querySelector('.content h1, .content h2')?.textContent?.trim()||'';
  const learningPair=document.querySelector('.language-switch-copy small')?.textContent?.trim()||'';
  const language=document.querySelector('.language-switch-copy strong')?.textContent?.trim()||languageByCode(preferences.targetLanguage).name;
  const level=(learningPair.match(/\b(A1|A2|B1|B2|C1|C2)\b/)?.[1]||'');
  const translationInput=(document.querySelector('.translator-input textarea') as HTMLTextAreaElement|null)?.value?.trim().slice(0,1200)||'';
  const translationOutput=(document.querySelector('.translator-result-edit textarea') as HTMLTextAreaElement|null)?.value?.trim().slice(0,1200)||'';
  return{
    page:active,heading,learningPair,language,level,translationInput,translationOutput,
    sourceLanguage:preferences.sourceLanguage,targetLanguage:preferences.targetLanguage,
    sourceLabel:languageByCode(preferences.sourceLanguage).name,targetLabel:languageByCode(preferences.targetLanguage).name
  };
}

function promptsFor(page:string,mode:ChatMode,targetLabel:string){
  if(mode==='conversation')return[
    'Lass uns über meinen heutigen Tag auf '+targetLabel+' sprechen.',
    'Frag mich nach meinen Hobbys und führe ein echtes Gespräch.',
    'Diskutiere mit mir über Reisen, Arbeit oder Technik.',
    'Starte ein spontanes C1-Gespräch und passe dich meinem Niveau an.'
  ];
  if(mode==='general')return['Erkläre mir ein Thema, das mich interessiert.','Hilf mir bei einer Idee oder Entscheidung.','Lass uns einfach über ein interessantes Thema sprechen.','Beantworte mir eine allgemeine Frage.'];
  if(page.toLocaleLowerCase().includes('translate'))return['Warum wurde das so übersetzt?','Mach die Übersetzung natürlicher.','Erkläre mir die wichtigsten Wörter.','Gib mir 3 passende Beispielsätze.'];
  if(page.toLocaleLowerCase().includes('speak'))return['Gib mir eine kurze Sprechübung.','Korrigiere einen typischen Satz für mein Level.','Gib mir 5 Smalltalk-Sätze.','Wie kann ich flüssiger antworten?'];
  if(page.toLocaleLowerCase().includes('travel'))return['Welche Sätze brauche ich hier wirklich?','Mach eine kurze Reisesimulation mit mir.','Gib mir 5 Notfall-Sätze.','Was soll ich vor der Reise lernen?'];
  return['Was soll ich als Nächstes lernen?','Erkläre mir Grammatik einfach.','Teste meinen Wortschatz.','Gib mir eine spontane Übung.'];
}

export default function AiAssistant(){
  const [available,setAvailable]=useState(()=>Boolean(document.querySelector('.app-shell')));
  const [open,setOpen]=useState(false),[mode,setMode]=useState<ChatMode>('coach'),[messages,setMessages]=useState<ChatMessage[]>([]),[input,setInput]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[remaining,setRemaining]=useState<number|null>(null),[listening,setListening]=useState(false);
  const endRef=useRef<HTMLDivElement|null>(null),recognitionRef=useRef<{stop:()=>void}|null>(null);
  useEffect(()=>{const root=document.getElementById('root');if(!root)return;const update=()=>setAvailable(Boolean(document.querySelector('.app-shell')));update();const observer=new MutationObserver(update);observer.observe(root,{childList:true,subtree:true});return()=>observer.disconnect();},[]);
  useEffect(()=>{if(open)endRef.current?.scrollIntoView({behavior:'smooth',block:'end'});},[messages,open,busy]);
  useEffect(()=>()=>recognitionRef.current?.stop(),[]);
  const context=useMemo(()=>open?currentContext():null,[open,messages.length,mode]);
  const targetLabel=context?.targetLabel||context?.language||'Zielsprache';
  const quickPrompts=promptsFor(context?.page||'',mode,targetLabel);
  const voiceLanguage=mode==='conversation'?(context?.targetLanguage||'en'):(context?.sourceLanguage||'de');
  if(!available)return null;

  function switchMode(next:ChatMode){
    if(next===mode)return;
    recognitionRef.current?.stop();setListening(false);setMode(next);setMessages([]);setError('');setInput('');
  }

  function startVoice(){
    if(listening){recognitionRef.current?.stop();return;}
    if(!canRecognizeSpeech()){setError('Dein Browser unterstützt hier keine Spracherkennung. Du kannst deine Nachricht eintippen.');return;}
    setError('');setListening(true);
    const recognition=recognizeLanguage(voiceLanguage,value=>setInput(value),()=>{setListening(false);recognitionRef.current=null;},()=>{setListening(false);recognitionRef.current=null;setError('Die Spracherkennung konnte nicht gestartet werden.');});
    recognitionRef.current=recognition;
    if(!recognition)setListening(false);
  }

  async function ask(value=input){
    const text=value.trim();if(!text||busy)return;
    const history=messages.slice(-12);setMessages(current=>[...current,{role:'user',text}]);setInput('');setBusy(true);setError('');
    try{
      const ctx=currentContext();
      const response=await fetch('/api/platform/assistant',{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:text,history,mode,context:ctx})});
      const data=await response.json().catch(()=>({})) as AiResponse;
      if(!response.ok||!data.reply)throw new Error(data.error||'VocabFast AI konnte gerade nicht antworten.');
      setMessages(current=>[...current,{role:'assistant',text:data.reply!}]);
      setRemaining(typeof data.remaining==='number'?data.remaining:null);
    }catch(reason){setError(reason instanceof Error?reason.message:'VocabFast AI konnte gerade nicht antworten.');}
    finally{setBusy(false);}
  }

  return <div className={'vf-ai '+(open?'open':'')}>
    {open&&<section className="vf-ai-panel" role="dialog" aria-modal="false" aria-label="VocabFast AI">
      <header><div><span>✦</span><div><strong>VocabFast AI</strong><small>{mode==='conversation'?'Freies Gespräch · '+targetLabel:mode==='general'?'Allgemeine KI':(context?.page||'Lerncoach')+' · '+targetLabel}</small></div></div><button onClick={()=>setOpen(false)} aria-label="VocabFast AI schließen">×</button></header>
      <div className="vf-ai-modes" role="tablist" aria-label="KI-Modus">
        <button className={mode==='coach'?'active':''} onClick={()=>switchMode('coach')}>Lerncoach</button>
        <button className={mode==='conversation'?'active':''} onClick={()=>switchMode('conversation')}>Freies Gespräch</button>
        <button className={mode==='general'?'active':''} onClick={()=>switchMode('general')}>Allgemeine KI</button>
      </div>
      <div className="vf-ai-body">
        {!messages.length&&<div className="vf-ai-intro"><strong>{mode==='conversation'?'Sprich frei auf '+targetLabel+'.':mode==='general'?'Frag mich praktisch alles.':'Wobei soll ich dir beim Lernen helfen?'}</strong><p>{mode==='conversation'?'Ich führe ein natürliches Gespräch auf deinem aktuellen Niveau, stelle Rückfragen und korrigiere nur die wichtigsten Fehler, ohne den Gesprächsfluss zu zerstören.':mode==='general'?'Hier kannst du auch über Themen sprechen, die nichts mit Sprachlernen zu tun haben.':'Ich kenne die sichtbare VocabFast-Seite und passe Erklärungen, Grammatik, Wortschatz und Übungen an deinen Lernpfad an.'}</p><div>{quickPrompts.map(prompt=><button key={prompt} onClick={()=>void ask(prompt)}>{prompt}</button>)}</div></div>}
        {messages.map((message,index)=><div key={message.role+'-'+index} className={'vf-ai-message '+message.role}><span>{message.text}</span>{message.role==='assistant'&&<button className="vf-ai-speak" onClick={()=>speakLanguage(message.text,voiceLanguage,.9)} aria-label="KI-Antwort anhören">🔊</button>}</div>)}
        {busy&&<div className="vf-ai-thinking"><i/><span>VocabFast AI denkt …</span></div>}
        {error&&<div className="vf-ai-error" role="alert">{error}</div>}
        <div ref={endRef}/>
      </div>
      <form onSubmit={event=>{event.preventDefault();void ask();}}>
        <div className="vf-ai-compose"><textarea rows={2} maxLength={1400} value={input} onChange={event=>setInput(event.target.value)} placeholder={mode==='conversation'?'Sprich oder schreibe auf '+targetLabel+' …':'Schreib deine Nachricht …'}/><button type="button" className={'vf-ai-mic '+(listening?'active':'')} onClick={startVoice} aria-label={listening?'Aufnahme beenden':'Mit Mikrofon sprechen'}>{listening?'■':'🎙'}</button></div>
        <div><small>{remaining!==null?remaining+' KI-Anfragen in dieser Stunde übrig':mode==='conversation'?'Gespräch auf '+targetLabel:'VocabFast AI'}</small><button className="view-primary" type="submit" disabled={busy||!input.trim()}>Senden</button></div>
      </form>
    </section>}
    <button className="vf-ai-launcher" onClick={()=>setOpen(value=>!value)} aria-label={open?'VocabFast AI schließen':'VocabFast AI öffnen'}><span>✦</span><strong>AI</strong></button>
  </div>;
}
