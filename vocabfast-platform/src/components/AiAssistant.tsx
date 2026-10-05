import { useEffect, useMemo, useRef, useState } from 'react';
import './ai-assistant.css';

type ChatMessage={role:'user'|'assistant';text:string};
type AiResponse={reply?:string;error?:string;remaining?:number|null};

function currentContext(){
  const active=document.querySelector('.main-nav button.active span:last-child')?.textContent?.trim()||document.querySelector('.companion-mobile-nav button.active small')?.textContent?.trim()||'VocabFast';
  const heading=document.querySelector('.content h1, .content h2')?.textContent?.trim()||'';
  const learningPair=document.querySelector('.language-switch-copy small')?.textContent?.trim()||'';
  const language=document.querySelector('.language-switch-copy strong')?.textContent?.trim()||'';
  const level=(learningPair.match(/\b(A1|A2|B1|B2|C1|C2)\b/)?.[1]||'');
  const translationInput=(document.querySelector('.translator-input textarea') as HTMLTextAreaElement|null)?.value?.trim().slice(0,1200)||'';
  const translationOutput=(document.querySelector('.translator-result-edit textarea') as HTMLTextAreaElement|null)?.value?.trim().slice(0,1200)||'';
  return{page:active,heading,learningPair,language,level,translationInput,translationOutput};
}

function promptsFor(page:string){
  if(page.toLocaleLowerCase().includes('translate'))return['Warum wurde das so übersetzt?','Mach die Übersetzung natürlicher.','Erkläre mir die wichtigsten Wörter.','Gib mir 3 passende Beispielsätze.'];
  if(page.toLocaleLowerCase().includes('speak'))return['Gib mir eine kurze Sprechübung.','Korrigiere einen typischen Satz für mein Level.','Gib mir 5 Smalltalk-Sätze.','Wie kann ich flüssiger antworten?'];
  if(page.toLocaleLowerCase().includes('travel'))return['Welche Sätze brauche ich hier wirklich?','Mach eine kurze Reisesimulation mit mir.','Gib mir 5 Notfall-Sätze.','Was soll ich vor der Reise lernen?'];
  return['Was kann ich hier am besten machen?','Was soll ich als Nächstes lernen?','Erkläre mir etwas kurz und einfach.','Gib mir 5 passende Übungssätze.'];
}

export default function AiAssistant(){
  const [available,setAvailable]=useState(()=>Boolean(document.querySelector('.app-shell')));
  const [open,setOpen]=useState(false),[messages,setMessages]=useState<ChatMessage[]>([]),[input,setInput]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[remaining,setRemaining]=useState<number|null>(null);
  const endRef=useRef<HTMLDivElement|null>(null);
  useEffect(()=>{const root=document.getElementById('root');if(!root)return;const update=()=>setAvailable(Boolean(document.querySelector('.app-shell')));update();const observer=new MutationObserver(update);observer.observe(root,{childList:true,subtree:true});return()=>observer.disconnect();},[]);
  useEffect(()=>{if(open)endRef.current?.scrollIntoView({behavior:'smooth',block:'end'});},[messages,open,busy]);
  const context=useMemo(()=>open?currentContext():null,[open,messages.length]);
  const quickPrompts=promptsFor(context?.page||'');
  if(!available)return null;

  async function ask(value=input){
    const text=value.trim();if(!text||busy)return;
    const history=messages.slice(-8);setMessages(current=>[...current,{role:'user',text}]);setInput('');setBusy(true);setError('');
    try{
      const response=await fetch('/api/platform/assistant',{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:text,history,context:currentContext()})});
      const data=await response.json().catch(()=>({})) as AiResponse;
      if(!response.ok||!data.reply)throw new Error(data.error||'VocabFast AI konnte gerade nicht antworten.');
      setMessages(current=>[...current,{role:'assistant',text:data.reply!}]);
      setRemaining(typeof data.remaining==='number'?data.remaining:null);
    }catch(reason){setError(reason instanceof Error?reason.message:'VocabFast AI konnte gerade nicht antworten.');}
    finally{setBusy(false);}
  }

  return <div className={`vf-ai ${open?'open':''}`}>
    {open&&<section className="vf-ai-panel" role="dialog" aria-modal="false" aria-label="VocabFast AI">
      <header><div><span>✦</span><div><strong>VocabFast AI</strong><small>{context?.page||'Lernassistent'} · {context?.language||'dein Lernpfad'}</small></div></div><button onClick={()=>setOpen(false)} aria-label="VocabFast AI schließen">×</button></header>
      <div className="vf-ai-body">
        {!messages.length&&<div className="vf-ai-intro"><strong>Wobei soll ich dir helfen?</strong><p>Ich kenne die sichtbare VocabFast-Seite und passe meine Hilfe an deinen Lernpfad an. Auf Translate kann ich auch die aktuell sichtbare Eingabe und Übersetzung erklären.</p><div>{quickPrompts.map(prompt=><button key={prompt} onClick={()=>void ask(prompt)}>{prompt}</button>)}</div></div>}
        {messages.map((message,index)=><div key={`${message.role}-${index}`} className={`vf-ai-message ${message.role}`}><span>{message.text}</span></div>)}
        {busy&&<div className="vf-ai-thinking"><i/><span>VocabFast AI denkt …</span></div>}
        {error&&<div className="vf-ai-error" role="alert">{error}</div>}
        <div ref={endRef}/>
      </div>
      <form onSubmit={event=>{event.preventDefault();void ask();}}><textarea rows={2} maxLength={1000} value={input} onChange={event=>setInput(event.target.value)} placeholder="Frag VocabFast AI …"/><div><small>{remaining!==null?`${remaining} KI-Anfragen in dieser Stunde übrig`:'Seitenbewusste Lernhilfe'}</small><button className="view-primary" type="submit" disabled={busy||!input.trim()}>Senden</button></div></form>
    </section>}
    <button className="vf-ai-launcher" onClick={()=>setOpen(value=>!value)} aria-label={open?'VocabFast AI schließen':'VocabFast AI öffnen'}><span>✦</span><strong>AI</strong></button>
  </div>;
}
