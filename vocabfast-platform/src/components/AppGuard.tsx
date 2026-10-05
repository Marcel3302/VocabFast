import { Component, type ErrorInfo, type ReactNode, useEffect, useState } from 'react';
import './app-guard.css';

type BoundaryProps={children:ReactNode};
type BoundaryState={failed:boolean};

export class AppErrorBoundary extends Component<BoundaryProps,BoundaryState>{
  state:BoundaryState={failed:false};
  static getDerivedStateFromError():BoundaryState{return{failed:true};}
  componentDidCatch(error:Error,info:ErrorInfo){console.error('VocabFast UI error',error,info);}
  render(){
    if(this.state.failed)return <main className="vf-recovery"><section><div className="vf-recovery-mark">V</div><span>VOCABFAST · WIEDERHERSTELLUNG</span><h1>Die App konnte diese Ansicht nicht laden.</h1><p>Dein gespeicherter Lernstand bleibt erhalten. Lade VocabFast neu; falls das Problem wiederkommt, kannst du zur Startseite zurückkehren.</p><div><button onClick={()=>window.location.reload()}>Neu laden</button><button onClick={()=>{window.location.href='/'}}>Zur Startseite</button></div><small>Es wurden keine lokalen Lerndaten durch diesen Fehler gelöscht.</small></section></main>;
    return this.props.children;
  }
}

export function ConnectivityGuard(){
  const [online,setOnline]=useState(()=>navigator.onLine);
  useEffect(()=>{const up=()=>setOnline(true),down=()=>setOnline(false);window.addEventListener('online',up);window.addEventListener('offline',down);return()=>{window.removeEventListener('online',up);window.removeEventListener('offline',down);};},[]);
  if(online)return null;
  return <div className="vf-offline" role="status"><span>Offline</span><strong>Einige Lerninhalte bleiben verfügbar.</strong><small>Übersetzung, Synchronisierung und KI-Funktionen brauchen eine Internetverbindung.</small></div>;
}
