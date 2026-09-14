import { useEffect, useMemo, useRef, useState } from 'react';
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { translationLanguages } from '../data/catalog';
import { makeWord, mergeWords, readWords, saveWords } from '../learning/personal-words';
import type { LanguageCode } from '../learning/preferences';
import './pdf-reader.css';

type Props={
  sourceLanguage:LanguageCode;
  targetLanguage:LanguageCode;
  onClose:()=>void;
};
type PageText={page:number;text:string};
type TranslationResult={translation:string;alternatives?:string[];note?:string};
type ReaderState={lastPage:number;bookmarks:number[]};

const TEXT_PAGE_LIMIT=120;
const MAX_FILE_SIZE=40_000_000;
const localeMap:Partial<Record<LanguageCode,string>>={de:'de-DE',en:'en-US',it:'it-IT',es:'es-ES',fr:'fr-FR',hr:'hr-HR',pt:'pt-PT',zh:'zh-CN',ja:'ja-JP',ko:'ko-KR',ar:'ar-SA'};
const ocrCodes:Partial<Record<LanguageCode,string>>={en:'eng',de:'deu',it:'ita',es:'spa',fr:'fra',hr:'hrv',pt:'por',zh:'chi_sim',ja:'jpn',ko:'kor',ar:'ara'};

function cleanText(value:string){return value.replace(/\s+/g,' ').trim();}
function signature(file:File){return `${file.name}:${file.size}:${file.lastModified}`;}
function stateKey(id:string){return `vocabfast-pdf-reader:${id}`;}
function readState(id:string):ReaderState{
  try{const raw=JSON.parse(localStorage.getItem(stateKey(id))||'{}') as Partial<ReaderState>;return{lastPage:Math.max(1,Number(raw.lastPage)||1),bookmarks:Array.isArray(raw.bookmarks)?raw.bookmarks.filter(value=>Number.isInteger(value)&&value>0):[]};}catch{return{lastPage:1,bookmarks:[]};}
}
function writeState(id:string,state:ReaderState){try{localStorage.setItem(stateKey(id),JSON.stringify(state));}catch{/* local reading progress is optional */}}
function speak(text:string,language:LanguageCode){
  if(!('speechSynthesis' in window)||!text.trim())return false;
  window.speechSynthesis.cancel();
  const utterance=new SpeechSynthesisUtterance(text.slice(0,12000));
  utterance.lang=localeMap[language]||'en-US';utterance.rate=.92;
  window.speechSynthesis.speak(utterance);return true;
}
async function translateText(text:string,source:LanguageCode,target:LanguageCode){
  const response=await fetch('/api/platform/translate',{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json'},body:JSON.stringify({text,source,target})});
  const data=await response.json().catch(()=>({})) as Partial<TranslationResult>&{error?:string};
  if(!response.ok||!data.translation)throw new Error(data.error||'Der markierte Text konnte nicht übersetzt werden.');
  return data as TranslationResult;
}

export default function PDFReader({sourceLanguage,targetLanguage,onClose}:Props){
  const canvasRef=useRef<HTMLCanvasElement|null>(null);
  const pdfRef=useRef<PDFDocumentProxy|null>(null);
  const renderTaskRef=useRef<{cancel:()=>void}|null>(null);
  const readerIdRef=useRef('');
  const [fileName,setFileName]=useState('');
  const [documentVersion,setDocumentVersion]=useState(0);
  const [totalPages,setTotalPages]=useState(0);
  const [page,setPage]=useState(1);
  const [scale,setScale]=useState(1.15);
  const [pages,setPages]=useState<PageText[]>([]);
  const [search,setSearch]=useState('');
  const [selectedText,setSelectedText]=useState('');
  const [translation,setTranslation]=useState<TranslationResult|null>(null);
  const [source,setSource]=useState<LanguageCode>(sourceLanguage);
  const [target,setTarget]=useState<LanguageCode>(targetLanguage);
  const [bookmarks,setBookmarks]=useState<number[]>([]);
  const [loading,setLoading]=useState(false);
  const [rendering,setRendering]=useState(false);
  const [translating,setTranslating]=useState(false);
  const [ocrBusy,setOcrBusy]=useState(false);
  const [status,setStatus]=useState('');
  const [error,setError]=useState('');

  const currentText=pages.find(item=>item.page===page)?.text||'';
  const progress=totalPages?Math.round(page/totalPages*100):0;
  const searchResults=useMemo(()=>{
    const query=search.trim().toLocaleLowerCase();if(!query)return [];
    return pages.flatMap(item=>{
      const lower=item.text.toLocaleLowerCase(),index=lower.indexOf(query);if(index<0)return [];
      const start=Math.max(0,index-70),end=Math.min(item.text.length,index+query.length+100);
      return [{page:item.page,snippet:`${start?'…':''}${item.text.slice(start,end)}${end<item.text.length?'…':''}`}];
    }).slice(0,30);
  },[pages,search]);

  useEffect(()=>()=>{renderTaskRef.current?.cancel();window.speechSynthesis?.cancel();void pdfRef.current?.destroy();},[]);
  useEffect(()=>{
    const pdf=pdfRef.current,canvas=canvasRef.current;if(!pdf||!canvas||!totalPages)return;
    let active=true;setRendering(true);setError('');renderTaskRef.current?.cancel();
    void (async()=>{
      try{
        const pdfPage=await pdf.getPage(page);if(!active)return;
        const viewport=pdfPage.getViewport({scale});const context=canvas.getContext('2d');if(!context)throw new Error('Die PDF-Seite konnte nicht dargestellt werden.');
        const ratio=Math.min(window.devicePixelRatio||1,2);canvas.width=Math.ceil(viewport.width*ratio);canvas.height=Math.ceil(viewport.height*ratio);canvas.style.width=`${Math.ceil(viewport.width)}px`;canvas.style.height=`${Math.ceil(viewport.height)}px`;
        context.setTransform(ratio,0,0,ratio,0,0);const task=pdfPage.render({canvasContext:context,viewport,canvas});renderTaskRef.current=task;await task.promise;
      }catch(reason){if(active&&!(reason instanceof Error&&reason.name==='RenderingCancelledException'))setError(reason instanceof Error?reason.message:'Die Seite konnte nicht gerendert werden.');}
      finally{if(active)setRendering(false);}
    })();
    if(readerIdRef.current)writeState(readerIdRef.current,{lastPage:page,bookmarks});
    return()=>{active=false;renderTaskRef.current?.cancel();};
  },[page,scale,totalPages,documentVersion,bookmarks]);

  async function loadPdf(file:File){
    if(file.type!=='application/pdf'&&!file.name.toLowerCase().endsWith('.pdf')){setError('Bitte wähle eine PDF-Datei aus.');return;}
    if(file.size>MAX_FILE_SIZE){setError('Die PDF darf höchstens 40 MB groß sein.');return;}
    setLoading(true);setError('');setStatus('PDF wird geöffnet …');setTranslation(null);setSelectedText('');setSearch('');
    try{
      await pdfRef.current?.destroy();const pdfjs=await import('pdfjs-dist');pdfjs.GlobalWorkerOptions.workerSrc=pdfWorker;
      const pdf=await pdfjs.getDocument({data:new Uint8Array(await file.arrayBuffer())}).promise;pdfRef.current=pdf;
      const id=signature(file),saved=readState(id);readerIdRef.current=id;setFileName(file.name);setTotalPages(pdf.numPages);setBookmarks(saved.bookmarks.filter(value=>value<=pdf.numPages));setPage(Math.min(saved.lastPage,pdf.numPages));setDocumentVersion(value=>value+1);
      const pageCount=Math.min(pdf.numPages,TEXT_PAGE_LIMIT),extracted:PageText[]=[];
      for(let pageNo=1;pageNo<=pageCount;pageNo+=1){
        setStatus(`Textindex wird aufgebaut · Seite ${pageNo}/${pageCount}`);const pdfPage=await pdf.getPage(pageNo);const content=await pdfPage.getTextContent();const text=cleanText(content.items.map(item=>('str' in item?String(item.str):'')).join(' '));extracted.push({page:pageNo,text});
      }
      setPages(extracted);const searchable=extracted.filter(item=>item.text.length>20).length;
      setStatus(`${pdf.numPages} Seiten geöffnet · ${searchable} Seiten mit durchsuchbarem Text${pdf.numPages>TEXT_PAGE_LIMIT?` · Suche auf die ersten ${TEXT_PAGE_LIMIT} Seiten begrenzt`:''}.`);
    }catch(reason){setError(reason instanceof Error?reason.message:'Die PDF konnte nicht geöffnet werden.');pdfRef.current=null;setTotalPages(0);setPages([]);}
    finally{setLoading(false);}
  }

  function close(){window.speechSynthesis?.cancel();onClose();}
  function jump(next:number){if(!totalPages)return;setPage(Math.min(totalPages,Math.max(1,next)));setSelectedText('');setTranslation(null);}
  function toggleBookmark(){setBookmarks(current=>current.includes(page)?current.filter(value=>value!==page):[...current,page].sort((a,b)=>a-b));}
  function captureSelection(){const value=window.getSelection()?.toString().trim()||'';if(value)setSelectedText(value.slice(0,2000));}
  function usePageText(){if(!currentText){setError('Auf dieser Seite wurde noch kein Text erkannt. Nutze bei einem Scan zuerst OCR.');return;}setSelectedText(currentText.slice(0,2000));setTranslation(null);}
  async function translateSelection(){
    const text=selectedText.trim();if(!text||source===target||translating)return;setTranslating(true);setError('');
    try{setTranslation(await translateText(text,source,target));}catch(reason){setError(reason instanceof Error?reason.message:'Die Auswahl konnte nicht übersetzt werden.');}finally{setTranslating(false);}
  }
  async function saveSelection(){
    if(!selectedText.trim()||!translation?.translation)return;
    if(selectedText.trim().length>200||translation.translation.length>500){setError('Zum Speichern als Lernkarte wähle bitte höchstens 200 Zeichen aus.');return;}
    try{const before=readWords(),tag=`PDF Reader · ${fileName.replace(/\.pdf$/i,'').slice(0,42)}`,after=mergeWords(before,[makeWord(selectedText.trim(),translation.translation,tag)]);saveWords(after);setStatus(after.length===before.length?'Diese Lernkarte ist bereits vorhanden.':'✓ Auswahl wurde zu deinen Übungswörtern hinzugefügt.');}catch{setError('Die Lernkarte konnte nicht gespeichert werden.');}
  }
  async function ocrCurrentPage(){
    const pdf=pdfRef.current;if(!pdf||ocrBusy)return;setOcrBusy(true);setError('');setStatus(`OCR analysiert Seite ${page} …`);
    try{
      const pdfPage:PDFPageProxy=await pdf.getPage(page),viewport=pdfPage.getViewport({scale:1.8});const canvas=document.createElement('canvas');canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);const context=canvas.getContext('2d');if(!context)throw new Error('OCR-Vorschau konnte nicht erstellt werden.');await pdfPage.render({canvasContext:context,viewport,canvas}).promise;
      const {createWorker}=await import('tesseract.js');const worker=await createWorker(ocrCodes[source]||'eng');let text='';try{const result=await worker.recognize(canvas);text=cleanText(result.data.text||'');}finally{await worker.terminate();}
      if(!text)throw new Error('Auf dieser Seite konnte kein lesbarer Text erkannt werden.');
      setPages(current=>{const exists=current.some(item=>item.page===page);const next=exists?current.map(item=>item.page===page?{page,text}:item):[...current,{page,text}].sort((a,b)=>a.page-b.page);return next;});setStatus(`OCR abgeschlossen · ${text.split(/\s+/).length} Wörter auf Seite ${page} erkannt.`);
    }catch(reason){setError(reason instanceof Error?reason.message:'OCR konnte die Seite nicht lesen.');}
    finally{setOcrBusy(false);}
  }

  return <div className="pdf-reader-backdrop" role="dialog" aria-modal="true" aria-label="VocabFast PDF Reader">
    <section className="pdf-reader-shell">
      <header className="pdf-reader-header"><div className="pdf-reader-brand"><span>V</span><div><strong>VocabFast Reader</strong><small>{fileName||'PDF Study Workspace'}</small></div></div>{fileName&&<div className="pdf-reader-progress"><div><i style={{width:`${progress}%`}}/></div><span>{progress}% gelesen</span></div>}<button className="pdf-reader-close" onClick={close} aria-label="PDF Reader schließen">×</button></header>

      {!totalPages?<div className="pdf-reader-empty"><div className="pdf-reader-empty-icon">PDF</div><span className="eyebrow">READ · UNDERSTAND · LEARN</span><h1>Deine Unterlagen werden zum Lernwerkzeug.</h1><p>Öffne Skripten, Handbücher oder Lernunterlagen. VocabFast verbindet Lesen, Suche, Vorlesen, OCR, Übersetzung und deinen persönlichen Wortschatz in einem Reader.</p><label className={`pdf-reader-upload ${loading?'busy':''}`}><input type="file" accept="application/pdf,.pdf" disabled={loading} onChange={event=>{const file=event.target.files?.[0];if(file)void loadPdf(file);event.target.value='';}}/><strong>{loading?'PDF wird vorbereitet …':'PDF öffnen'}</strong><small>Bis 40 MB · Verarbeitung direkt im Browser</small></label><div className="pdf-reader-feature-grid"><article><span>⌕</span><strong>Im Dokument suchen</strong><small>Treffer führen dich direkt auf die richtige Seite.</small></article><article><span>🔊</span><strong>Vorlesen lassen</strong><small>Markierten Text oder ganze Seiten anhören.</small></article><article><span>⇄</span><strong>Direkt übersetzen</strong><small>Text markieren, verstehen und als Lernkarte speichern.</small></article><article><span>OCR</span><strong>Scans erkennen</strong><small>Auch Seiten ohne Textebene einzeln analysieren.</small></article></div></div>:
      <div className="pdf-reader-workspace">
        <aside className="pdf-reader-sidebar"><div className="pdf-reader-file"><span>PDF</span><div><strong>{fileName}</strong><small>{totalPages} Seiten</small></div></div><label className="pdf-reader-search"><span>⌕</span><input type="search" value={search} onChange={event=>setSearch(event.target.value)} placeholder="Im PDF suchen …"/></label>{search.trim()?<div className="pdf-reader-results"><span>{searchResults.length} Treffer</span>{searchResults.length?searchResults.map(result=><button key={`${result.page}-${result.snippet}`} onClick={()=>jump(result.page)}><strong>Seite {result.page}</strong><small>{result.snippet}</small></button>):<p>Kein Treffer im Textindex.</p>}</div>:<div className="pdf-reader-nav"><span>LESEZEICHEN</span>{bookmarks.length?bookmarks.map(value=><button key={value} className={value===page?'active':''} onClick={()=>jump(value)}><strong>Seite {value}</strong><small>Gespeichert</small></button>):<p>Noch keine Lesezeichen. Markiere wichtige Seiten mit ☆.</p>}</div>}<div className="pdf-reader-sidebar-actions"><button onClick={()=>{setTotalPages(0);setPages([]);setFileName('');setSearch('');setSelectedText('');setTranslation(null);void pdfRef.current?.destroy();pdfRef.current=null;}}>Andere PDF öffnen</button></div></aside>

        <main className="pdf-reader-document"><div className="pdf-reader-toolbar"><div className="pdf-page-controls"><button onClick={()=>jump(page-1)} disabled={page<=1}>←</button><label><input type="number" min={1} max={totalPages} value={page} onChange={event=>jump(Number(event.target.value)||1)}/><span>/ {totalPages}</span></label><button onClick={()=>jump(page+1)} disabled={page>=totalPages}>→</button></div><div className="pdf-zoom-controls"><button onClick={()=>setScale(value=>Math.max(.7,Number((value-.1).toFixed(2))))}>−</button><span>{Math.round(scale*100)}%</span><button onClick={()=>setScale(value=>Math.min(1.9,Number((value+.1).toFixed(2))))}>+</button></div><button className={bookmarks.includes(page)?'bookmarked':''} onClick={toggleBookmark}>{bookmarks.includes(page)?'★ Lesezeichen':'☆ Lesezeichen'}</button></div><div className="pdf-canvas-stage">{rendering&&<div className="pdf-rendering">Seite wird dargestellt …</div>}<canvas ref={canvasRef}/></div></main>

        <aside className="pdf-reader-study"><div className="pdf-study-head"><div><span className="eyebrow">STUDY MODE</span><h2>Mit dem Text arbeiten</h2></div><button onClick={usePageText}>Seite wählen</button></div><div className="pdf-reader-text" onMouseUp={captureSelection}>{currentText||<span>Auf dieser Seite wurde keine Textebene gefunden. Bei Scan-PDFs kannst du OCR starten.</span>}</div><div className="pdf-text-actions"><button onClick={()=>{if(!speak(selectedText||currentText,source))setError('Vorlesen wird von diesem Browser nicht unterstützt.');}} disabled={!selectedText&&!currentText}>🔊 {selectedText?'Auswahl':'Seite'} vorlesen</button><button onClick={()=>window.speechSynthesis?.cancel()}>■ Stop</button><button onClick={()=>void ocrCurrentPage()} disabled={ocrBusy}>{ocrBusy?'OCR läuft …':'OCR für diese Seite'}</button></div><div className="pdf-selection-box"><span>MARKIERTER TEXT</span><textarea value={selectedText} onChange={event=>{setSelectedText(event.target.value.slice(0,2000));setTranslation(null);}} placeholder="Text im rechten Lesebereich markieren oder hier einfügen …"/><div className="pdf-language-pair"><select value={source} onChange={event=>setSource(event.target.value as LanguageCode)}>{translationLanguages.map(language=><option key={language.code} value={language.code} disabled={language.code===target}>{language.name}</option>)}</select><span>→</span><select value={target} onChange={event=>setTarget(event.target.value as LanguageCode)}>{translationLanguages.map(language=><option key={language.code} value={language.code} disabled={language.code===source}>{language.name}</option>)}</select></div><button className="view-primary" disabled={!selectedText.trim()||translating||source===target} onClick={()=>void translateSelection()}>{translating?'Übersetze …':'Auswahl übersetzen →'}</button></div>{translation&&<div className="pdf-translation-card"><span>ÜBERSETZUNG</span><h3>{translation.translation}</h3>{translation.note&&<p>{translation.note}</p>}<div><button onClick={()=>speak(translation.translation,target)}>🔊 Anhören</button><button onClick={()=>void navigator.clipboard?.writeText(translation.translation)}>Kopieren</button><button onClick={()=>void saveSelection()}>+ Lernkarte</button></div></div>}{status&&<p className="pdf-reader-status" role="status">{status}</p>}{error&&<p className="pdf-reader-error" role="alert">{error}</p>}</aside>
      </div>}
    </section>
  </div>;
}
