import { useEffect, useMemo, useRef, useState } from 'react';
import type { CefrLevel } from '../learning/curriculum';
import { canRecognizeSpeech, preferredSpeechVoice, recognizeLanguage, speakLanguage } from '../learning/speech';
import './ai-talk-view.css';

type Message={role:'user'|'assistant';text:string};
type Props={
  targetLanguage:string;
  targetLabel:string;
  sourceLanguage:string;
  sourceLabel:string;
  level:CefrLevel;
  audioRate:number;
};

const topics=[
  {icon:'☕',title:'Alltag',prompt:'Lass uns locker über meinen heutigen Tag sprechen.'},
  {icon:'✈',title:'Reisen',prompt:'Lass uns über Reisen, neue Orte und typische Situationen unterwegs sprechen.'},
  {icon:'💼',title:'Arbeit',prompt:'Lass uns über meinen Beruf, Projekte, Kollegen und Arbeitssituationen sprechen.'},
  {icon:'🎮',title:'Hobbys',prompt:'Frag mich nach meinen Hobbys und entwickle daraus ein natürliches Gespräch.'},
  {icon:'⚙',title:'Technik',prompt:'Lass uns über Technik, Apps, Computer und neue Entwicklungen sprechen.'},
  {icon:'💬',title:'Freies Thema',prompt:'Starte ein spontanes Gespräch über ein interessantes Alltagsthema.'},
];

export default function AiTalkView({targetLanguage,targetLabel,sourceLanguage,sourceLabel,level,audioRate}:Props){
  const [messages,setMessages]=useState<Message[]>([]);
  const [input,setInput]=useState('');
  const [busy,setBusy]=useState(false);
  const [listening,setListening]=useState(false);
  const [autoVoice,setAutoVoice]=useState(true);
  const [error,setError]=useState('');
  const [topic,setTopic]=useState('Freies Thema');
  const [remaining,setRemaining]=useState<number|null>(null);
  const recognitionRef=useRef<{stop:()=>void}|null>(null);
  const latestTranscript=useRef('');
  const endRef=useRef<HTMLDivElement|null>(null);
  const voice=useMemo(()=>preferredSpeechVoice(targetLanguage,'female'),[targetLanguage,messages.length]);

  useEffect(()=>()=>{recognitionRef.current?.stop();window.speechSynthesis?.cancel();},[]);
  useEffect(()=>{endRef.current?.scrollIntoView({behavior:'smooth',block:'end'});},[messages,busy]);

  async function ask(raw:string){
    const text=raw.trim();if(!text||busy)return;
    const history=messages.slice(-14);
    setMessages(current=>[...current,{role:'user',text}]);setInput('');setBusy(true);setError('');
    try{
      const response=await fetch('/api/platform/assistant',{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json'},body:JSON.stringify({
        message:text,history,mode:'conversation',
        context:{page:'AI Talk',heading:'Freies Sprechen',learningPair:sourceLabel+' → '+targetLabel+' · '+level,language:targetLabel,level,sourceLanguage,targetLanguage,sourceLabel,targetLabel}
      })});
      const data=await response.json().catch(()=>({})) as {reply?:string;error?:string;remaining?:number|null};
      if(!response.ok||!data.reply)throw new Error(data.error||'AI Talk konnte gerade nicht antworten.');
      setMessages(current=>[...current,{role:'assistant',text:data.reply!}]);
      setRemaining(typeof data.remaining==='number'?data.remaining:null);
      if(autoVoice)speakLanguage(data.reply,targetLanguage,audioRate,'female');
    }catch(reason){setError(reason instanceof Error?reason.message:'AI Talk konnte gerade nicht antworten.');}
    finally{setBusy(false);}
  }

  function startListening(){
    if(listening){recognitionRef.current?.stop();return;}
    if(!canRecognizeSpeech()){setError('Dein Browser unterstützt die Spracherkennung hier nicht. Du kannst trotzdem tippen.');return;}
    setError('');setListening(true);latestTranscript.current='';
    const recognition=recognizeLanguage(targetLanguage,value=>{latestTranscript.current=value;setInput(value);},()=>{setListening(false);recognitionRef.current=null;const spoken=latestTranscript.current.trim();if(spoken)void ask(spoken);},()=>{setListening(false);recognitionRef.current=null;setError('Das Mikrofon konnte deine Sprache nicht erkennen. Prüfe die Browserfreigabe.');});
    recognitionRef.current=recognition;
    if(!recognition)setListening(false);
  }

  function startTopic(title:string,prompt:string){
    setTopic(title);setMessages([]);setError('');setInput('');window.speechSynthesis?.cancel();void ask(prompt);
  }

  function resetConversation(){recognitionRef.current?.stop();window.speechSynthesis?.cancel();setMessages([]);setInput('');setError('');setListening(false);}

  return <section className="platform-view ai-talk-view">
    <div className="ai-talk-hero">
      <div className="ai-talk-hero-copy">
        <span className="eyebrow">AI TALK · {targetLabel.toUpperCase()} · {level}</span>
        <h1>Führe echte Gespräche statt Übungen abzuarbeiten.</h1>
        <p>Sprich frei über Alltag, Reisen, Arbeit, Technik oder dein eigenes Thema. VocabFast antwortet auf {targetLabel}, stellt natürliche Rückfragen und korrigiert nur die wichtigsten Fehler.</p>
        <div className="ai-talk-status-row">
          <span><i className="online-dot"/> AI Gesprächspartnerin bereit</span>
          <span>🎙 Spracheingabe</span>
          <span>🔊 Auto-Stimme {autoVoice?'an':'aus'}</span>
        </div>
      </div>
      <div className="ai-talk-avatar-card">
        <div className="ai-talk-avatar"><span>AI</span></div>
        <strong>VocabFast Voice</strong>
        <small>{voice?voice.name:'weiblich klingende Systemstimme'}</small>
        <button onClick={()=>setAutoVoice(value=>!value)}>{autoVoice?'Automatisches Vorlesen an':'Automatisches Vorlesen aus'}</button>
      </div>
    </div>

    <div className="ai-talk-layout">
      <aside className="ai-talk-topics">
        <div><span className="eyebrow">GESPRÄCH STARTEN</span><h2>Thema wählen</h2><p>Oder starte einfach mit dem Mikrofon und sprich über das, was dich interessiert.</p></div>
        <div className="ai-talk-topic-grid">{topics.map(item=><button key={item.title} className={topic===item.title?'active':''} onClick={()=>startTopic(item.title,item.prompt)}><span>{item.icon}</span><div><strong>{item.title}</strong><small>Neues Gespräch</small></div></button>)}</div>
        <button className="ai-talk-new" onClick={resetConversation}>↻ Neues leeres Gespräch</button>
      </aside>

      <section className="ai-talk-stage">
        <header><div><span className="ai-talk-live-dot"/> <strong>{topic}</strong><small>{targetLabel} · {level}</small></div><button onClick={()=>setAutoVoice(value=>!value)} aria-pressed={autoVoice}>{autoVoice?'🔊 Stimme an':'🔇 Stimme aus'}</button></header>
        <div className="ai-talk-transcript">
          {!messages.length&&<div className="ai-talk-empty"><div className="ai-talk-avatar large"><span>AI</span></div><strong>Bereit, wenn du es bist.</strong><p>Wähle links ein Thema oder drücke unten auf das Mikrofon. Deine Antwort wird nach dem Sprechen automatisch gesendet.</p></div>}
          {messages.map((message,index)=><article key={message.role+'-'+index} className={message.role}><div className="ai-talk-bubble"><small>{message.role==='assistant'?'VOCABFAST AI':'DU'}</small><p>{message.text}</p>{message.role==='assistant'&&<button onClick={()=>speakLanguage(message.text,targetLanguage,audioRate,'female')}>🔊 Anhören</button>}</div></article>)}
          {busy&&<div className="ai-talk-thinking"><i/><span>VocabFast AI antwortet …</span></div>}
          {error&&<div className="ai-talk-error">{error}</div>}
          <div ref={endRef}/>
        </div>
        <div className="ai-talk-compose">
          <button className={'ai-talk-mic '+(listening?'listening':'')} onClick={startListening}><span>{listening?'■':'🎙'}</span><strong>{listening?'Ich höre zu …':'Sprechen'}</strong><small>{listening?'Zum Stoppen tippen':'Antwort wird automatisch gesendet'}</small></button>
          <div className="ai-talk-input-wrap"><textarea rows={3} value={input} onChange={event=>setInput(event.target.value)} placeholder={'Oder auf '+targetLabel+' schreiben …'} maxLength={1400}/><div><small>{remaining!==null?remaining+' KI-Anfragen in dieser Stunde übrig':'Freies Gespräch · '+level}</small><button className="view-primary" disabled={!input.trim()||busy||listening} onClick={()=>void ask(input)}>Senden →</button></div></div>
        </div>
      </section>
    </div>
  </section>;
}
