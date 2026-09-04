import { useMemo, useState } from 'react';
import { speakEnglish } from '../learning/speech';
import './coach-view.css';

type Message = { id: string; role: 'coach' | 'user'; text: string; source?: 'api' | 'demo' };
type Scenario = { id: string; title: string; subtitle: string; icon: string; opening: string; prompts: string[] };

const scenarios: Scenario[] = [
  { id:'cafe', title:'Im Café', subtitle:'Bestellen und bezahlen', icon:'☕', opening:'Good morning! What would you like to drink?', prompts:['I would like a coffee, please.','A tea, please.','The bill, please.'] },
  { id:'hotel', title:'Im Hotel', subtitle:'Einchecken und nachfragen', icon:'⌂', opening:'Hello! Welcome to the hotel. What is your name?', prompts:['My name is Marcel.','I have a reservation.','Where is my room?'] },
  { id:'airport', title:'Am Flughafen', subtitle:'Ticket, Gate und Richtung', icon:'✈', opening:'Hello. Where are you travelling today?', prompts:['I am travelling to London.','Where is gate twelve?','I need help, please.'] },
  { id:'work', title:'Erstes Gespräch', subtitle:'Beruf und Alltag', icon:'↗', opening:'Nice to meet you. What do you do?', prompts:['I work in IT.','I am from Austria.','I speak German and English.'] }
];

function demoReply(scenario: string, text: string) {
  const value = text.toLowerCase();
  if (scenario==='cafe') {
    if (value.includes('coffee')) return 'Of course. One coffee. Would you like milk or sugar?';
    if (value.includes('tea')) return 'Sure. What kind of tea would you like?';
    if (value.includes('bill')) return 'Certainly. Here is the bill. Thank you!';
    return 'Great. Try ordering with “I would like …, please.”';
  }
  if (scenario==='hotel') {
    if (value.includes('reservation')) return 'Perfect. May I have your name, please?';
    if (value.includes('name')) return 'Thank you. I found your booking. Your room is on the second floor.';
    if (value.includes('where') || value.includes('room')) return 'Your room is upstairs. Turn left after the elevator.';
    return 'Good. You can also say: “I have a reservation.”';
  }
  if (scenario==='airport') {
    if (value.includes('london')) return 'Great. Your flight to London leaves from gate twelve.';
    if (value.includes('gate')) return 'Gate twelve is straight ahead and then on the right.';
    if (value.includes('help')) return 'Of course. Tell me what you need help with.';
    return 'Try saying where you are travelling or ask for your gate.';
  }
  if (value.includes('it') || value.includes('work')) return 'Interesting! What do you like about your work?';
  if (value.includes('austria')) return 'Nice! Which city in Austria are you from?';
  if (value.includes('speak')) return 'That is great. How often do you use English?';
  return 'Good answer. Try adding one more detail in a full sentence.';
}

export default function CoachView({ audioRate=.9 }: { audioRate?: number }) {
  const [scenarioId, setScenarioId] = useState(scenarios[0].id);
  const scenario = useMemo(()=>scenarios.find(item=>item.id===scenarioId) ?? scenarios[0],[scenarioId]);
  const [messages, setMessages] = useState<Message[]>([{id:'opening',role:'coach',text:scenarios[0].opening,source:'demo'}]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [mode, setMode] = useState<'demo'|'live'>('demo');

  function selectScenario(id: string) {
    const next = scenarios.find(item=>item.id===id) ?? scenarios[0];
    setScenarioId(next.id);
    setMessages([{id:`opening-${next.id}`,role:'coach',text:next.opening,source:'demo'}]);
    setInput('');
    setMode('demo');
  }

  async function send(textOverride?: string) {
    const text = (textOverride ?? input).trim();
    if (!text || sending) return;
    const userMessage: Message = { id:`u-${Date.now()}`, role:'user', text };
    const history = [...messages,userMessage];
    setMessages(history);
    setInput('');
    setSending(true);

    try {
      const controller = new AbortController();
      const timeout = window.setTimeout(()=>controller.abort(),4500);
      const response = await fetch('/api/platform/coach', {
        method:'POST',
        credentials:'same-origin',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ scenario:scenario.id, message:text, history:history.slice(-8).map(item=>({role:item.role,text:item.text})) }),
        signal:controller.signal
      });
      window.clearTimeout(timeout);
      if (!response.ok) throw new Error('coach unavailable');
      const data = await response.json() as { reply?: string };
      if (!data.reply) throw new Error('empty reply');
      setMode('live');
      setMessages(current=>[...current,{id:`c-${Date.now()}`,role:'coach',text:data.reply!,source:'api'}]);
    } catch {
      const reply = demoReply(scenario.id,text);
      setMode('demo');
      setMessages(current=>[...current,{id:`c-${Date.now()}`,role:'coach',text:reply,source:'demo'}]);
    } finally {
      setSending(false);
    }
  }

  return <section className="coach-view platform-view">
    <div className="view-hero coach-view-hero"><div><span className="eyebrow">VOCABFAST COACH · PROTOTYP</span><h1>Übe Gespräche, die du außerhalb einer Lern-App wirklich brauchst.</h1><p>Der Coach versucht automatisch die geschützte VocabFast-API zu verwenden. In der eigenständigen Vorschau fällt er auf einen lokalen Demo-Dialog zurück.</p></div><div className={`coach-mode ${mode}`}><span>{mode==='live'?'● LIVE AI':'● DEMO'}</span><small>{mode==='live'?'Workers AI verbunden':'lokaler Szenario-Modus'}</small></div></div>

    <div className="coach-layout">
      <aside className="scenario-list"><div className="view-section-head inner"><div><span className="eyebrow">SITUATION</span><h2>Wähle ein Gespräch</h2></div></div>{scenarios.map(item=><button key={item.id} className={scenario.id===item.id?'active':''} onClick={()=>selectScenario(item.id)}><span>{item.icon}</span><div><strong>{item.title}</strong><small>{item.subtitle}</small></div></button>)}</aside>
      <div className="chat-panel">
        <div className="chat-head"><div><span className="eyebrow">{scenario.title.toUpperCase()}</span><h2>{scenario.subtitle}</h2></div><button onClick={()=>speakEnglish(messages.filter(item=>item.role==='coach').at(-1)?.text ?? scenario.opening,audioRate)}>▶ Letzte Antwort anhören</button></div>
        <div className="chat-messages">{messages.map(message=><div key={message.id} className={`chat-message ${message.role}`}><span>{message.role==='coach'?'VF':'DU'}</span><div><p>{message.text}</p>{message.role==='coach'&&<button onClick={()=>speakEnglish(message.text,audioRate)}>▶ anhören</button>}</div></div>)}{sending&&<div className="chat-message coach"><span>VF</span><div><p className="typing">VocabFast antwortet …</p></div></div>}</div>
        <div className="quick-prompts">{scenario.prompts.map(prompt=><button key={prompt} onClick={()=>send(prompt)}>{prompt}</button>)}</div>
        <div className="chat-input"><textarea value={input} onChange={event=>setInput(event.target.value)} onKeyDown={event=>{if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();void send();}}} placeholder="Antworte auf Englisch …" rows={2}/><button disabled={!input.trim()||sending} onClick={()=>void send()}>Senden →</button></div>
        <small className="coach-disclaimer">Die Demo korrigiert noch nicht zuverlässig jede freie Antwort. Vor dem Release wird der Live-Coach serverseitig authentifiziert, limitiert und mit Lernkontext verbunden.</small>
      </div>
    </div>
  </section>;
}
