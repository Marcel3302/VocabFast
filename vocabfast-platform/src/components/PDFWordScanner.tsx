import { useMemo, useState } from 'react';
import { translationLanguages } from '../data/catalog';
import { makeWord, mergeWords, readWords, saveWords } from '../learning/personal-words';
import { readPreferences, type LanguageCode } from '../learning/preferences';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import './pdf-word-scanner.css';

type Props={onSaved?:(count:number)=>void};
type PageText={page:number;text:string;wordCount:number};
type TranslationResult={translation:string};

const ocrCodes:Partial<Record<LanguageCode,string>>={en:'eng',de:'deu',hr:'hrv',sl:'slv',it:'ita',es:'spa',fr:'fra',pt:'por',nl:'nld',pl:'pol',cs:'ces',tr:'tur',el:'ell',ru:'rus',uk:'ukr',zh:'chi_sim',ja:'jpn',ko:'kor',ar:'ara'};
const isWord=(value:string)=>/^\p{L}[\p{L}\p{M}'’\-]{1,}$/u.test(value);
const normalize=(value:string)=>value.trim().toLocaleLowerCase();
const wait=(ms:number)=>new Promise(resolve=>window.setTimeout(resolve,ms));
function uniqueWords(text:string){const matches=text.match(/\p{L}[\p{L}\p{M}'’\-]{1,}/gu)??[];const seen=new Set<string>();return matches.filter(word=>{const key=normalize(word);if(seen.has(key))return false;seen.add(key);return true;});}
function displayTokens(text:string){return text.split(/(\p{L}[\p{L}\p{M}'’\-]*)/gu).filter(Boolean);}

async function translateWord(text:string,source:LanguageCode,target:LanguageCode){
  let lastError='';
  for(let attempt=0;attempt<2;attempt+=1){
    const response=await fetch('/api/platform/pdf-translate',{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json'},body:JSON.stringify({text,source,target})});
    const data=await response.json().catch(()=>({})) as Partial<TranslationResult>&{error?:string};
    if(response.ok&&data.translation)return data.translation;
    lastError=data.error||`„${text}“ konnte nicht übersetzt werden.`;
    if(response.status===401||response.status===403||response.status===400)throw new Error(lastError);
    if(attempt===0)await wait(300);
  }
  throw new Error(lastError||`„${text}“ konnte nicht übersetzt werden.`);
}

export default function PDFWordScanner({onSaved}:Props){
  const preferences=readPreferences();
  const [source,setSource]=useState<LanguageCode>(preferences.targetLanguage);
  const [target,setTarget]=useState<LanguageCode>(preferences.sourceLanguage);
  const [fileName,setFileName]=useState('');
  const [pages,setPages]=useState<PageText[]>([]);
  const [pageIndex,setPageIndex]=useState(0);
  const [selected,setSelected]=useState<Record<string,string>>({});
  const [busy,setBusy]=useState(false);
  const [saving,setSaving]=useState(false);
  const [status,setStatus]=useState('');
  const [error,setError]=useState('');
  const [usedOcr,setUsedOcr]=useState(false);
  const [totalPages,setTotalPages]=useState(0);
  const [search,setSearch]=useState('');
  const [globalSearch,setGlobalSearch]=useState('');
  const current=pages[pageIndex];
  const pageWords=useMemo(()=>current?uniqueWords(current.text):[],[current]);
  const filteredWords=useMemo(()=>search.trim()?pageWords.filter(word=>normalize(word).includes(normalize(search))):pageWords,[pageWords,search]);
  const allWords=useMemo(()=>uniqueWords(pages.map(page=>page.text).join(' ')).sort((left,right)=>left.localeCompare(right,'de',{sensitivity:'base'})),[pages]);
  const visibleAllWords=useMemo(()=>globalSearch.trim()?allWords.filter(word=>normalize(word).includes(normalize(globalSearch))):allWords,[allWords,globalSearch]);
  const selectedWords=Object.values(selected);

  function toggle(word:string){const key=normalize(word);setSelected(current=>{const next={...current};if(next[key])delete next[key];else next[key]=word;return next;});}
  function selectVisible(){setSelected(current=>{const next={...current};for(const word of visibleAllWords)next[normalize(word)]=word;return next;});}
  function swap(){setSource(target);setTarget(source);}
  function clear(){setPages([]);setSelected({});setPageIndex(0);setFileName('');setStatus('');setError('');setUsedOcr(false);setTotalPages(0);setSearch('');setGlobalSearch('');}

  async function loadPdf(file:File){
    clear();
    if(file.type!=='application/pdf'&&!file.name.toLowerCase().endsWith('.pdf')){setError('Bitte wähle eine PDF-Datei aus.');return;}
    if(file.size>30_000_000){setError('Die PDF darf höchstens 30 MB groß sein.');return;}
    setBusy(true);setFileName(file.name);setStatus('PDF wird gelesen …');
    try{
      const pdfjs=await import('pdfjs-dist');
      pdfjs.GlobalWorkerOptions.workerSrc=pdfWorker;
      const pdf=await pdfjs.getDocument({data:new Uint8Array(await file.arrayBuffer())}).promise;
      setTotalPages(pdf.numPages);
      const count=Math.min(pdf.numPages,60);
      const extracted:PageText[]=[];
      for(let pageNo=1;pageNo<=count;pageNo+=1){
        setStatus(`Text wird gelesen · Seite ${pageNo}/${count}`);
        const page=await pdf.getPage(pageNo);
        const content=await page.getTextContent();
        const text=content.items.map(item=>('str' in item?String(item.str):'')).join(' ').replace(/\s+/g,' ').trim();
        extracted.push({page:pageNo,text,wordCount:uniqueWords(text).length});
      }
      const uniqueCount=uniqueWords(extracted.map(page=>page.text).join(' ')).length;
      if(uniqueCount>=5){setPages(extracted);setStatus(`${uniqueCount} unterschiedliche Wörter aus ${count}${pdf.numPages>count?` von ${pdf.numPages}`:''} Seiten erkannt.`);return;}

      setStatus('Keine Textebene gefunden · OCR wird gestartet …');
      const {createWorker}=await import('tesseract.js');
      const ocrPageCount=Math.min(pdf.numPages,8);
      const worker=await createWorker(ocrCodes[source]||'eng');
      const ocrPages:PageText[]=[];
      try{
        for(let pageNo=1;pageNo<=ocrPageCount;pageNo+=1){
          setStatus(`OCR analysiert Scan · Seite ${pageNo}/${ocrPageCount}`);
          const page=await pdf.getPage(pageNo),viewport=page.getViewport({scale:1.6});
          const canvas=document.createElement('canvas');
          canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);
          const context=canvas.getContext('2d');if(!context)throw new Error('PDF-Seite konnte nicht gerendert werden.');
          await page.render({canvasContext:context,viewport,canvas}).promise;
          const result=await worker.recognize(canvas);
          const text=String(result.data.text||'').replace(/\s+/g,' ').trim();
          ocrPages.push({page:pageNo,text,wordCount:uniqueWords(text).length});
        }
      }finally{await worker.terminate();}
      const ocrWords=uniqueWords(ocrPages.map(page=>page.text).join(' ')).length;
      if(!ocrWords)throw new Error('In dieser Scan-PDF konnte kein lesbarer Text erkannt werden.');
      setUsedOcr(true);setPages(ocrPages);setStatus(`OCR abgeschlossen · ${ocrWords} unterschiedliche Wörter auf ${ocrPageCount} Seiten erkannt${pdf.numPages>ocrPageCount?'. Bei Scan-PDFs werden aus Leistungsgründen die ersten 8 Seiten verarbeitet.':''}`);
    }catch(reason){setError(reason instanceof Error?reason.message:'Die PDF konnte nicht verarbeitet werden.');setPages([]);}
    finally{setBusy(false);}
  }

  async function translateAndSave(){
    const terms=selectedWords.slice(0,60);
    if(!terms.length||saving)return;
    if(source===target){setError('Quell- und Zielsprache müssen unterschiedlich sein.');return;}
    setSaving(true);setError('');setStatus(`0/${terms.length} Wörter verarbeitet …`);
    const translated:{word:string;translation:string}[]=[];
    const failed:string[]=[];
    try{
      for(let i=0;i<terms.length;i+=1){
        const term=terms[i];
        try{
          const translation=await translateWord(term,source,target);
          translated.push({word:term,translation});
        }catch(reason){
          const message=reason instanceof Error?reason.message:'';
          if(message.includes('VocabFast Pro')||message.includes('Bitte zuerst anmelden'))throw reason;
          failed.push(term);
        }
        setStatus(`${i+1}/${terms.length} Wörter verarbeitet · ${translated.length} übersetzt${failed.length?` · ${failed.length} übersprungen`:''}`);
        if(i<terms.length-1)await wait(90);
      }
      if(!translated.length)throw new Error('Keines der ausgewählten Wörter konnte übersetzt werden. Bitte versuche es erneut.');
      const before=readWords();
      const tag=`PDF · ${fileName.replace(/\.pdf$/i,'').slice(0,44)||'Dokument'}`;
      const after=mergeWords(before,translated.map(item=>makeWord(item.word,item.translation,tag)));
      saveWords(after);
      const added=after.length-before.length;
      setStatus(`${added} neue Übungswörter gespeichert${failed.length?` · ${failed.length} konnten nicht übersetzt werden`:''}${translated.length-added>0?` · ${translated.length-added} waren bereits vorhanden`:''}.`);
      setSelected(failed.reduce<Record<string,string>>((next,term)=>{next[normalize(term)]=term;return next;},{}));
      onSaved?.(added);
      if(failed.length)setError(`${failed.length} Wörter wurden übersprungen. Sie bleiben markiert, damit du es erneut versuchen kannst.`);
    }catch(reason){setError(reason instanceof Error?reason.message:'Die markierten Wörter konnten nicht gespeichert werden.');}
    finally{setSaving(false);}
  }

  return <section className="pdf-scanner">
    <div className="pdf-scanner-head"><div><span className="eyebrow">PDF-WORTSCANNER · PRO</span><h3>Wörter direkt aus deinen Unterlagen übernehmen.</h3><p>PDF öffnen, Wörter im Text oder in der vollständigen Wortliste anklicken und automatisch übersetzen lassen. Jedes Wort wird in der PDF-Gesamtliste nur einmal angezeigt.</p></div>{pages.length>0&&<button onClick={clear}>Andere PDF</button>}</div>
    {!pages.length&&<label className={`pdf-drop ${busy?'busy':''}`}><input type="file" accept="application/pdf,.pdf" disabled={busy} onChange={event=>{const file=event.target.files?.[0];if(file)void loadPdf(file);event.target.value='';}}/><span>{busy?'PDF wird analysiert …':'PDF auswählen oder hier öffnen'}</span><small>PRO · Text-PDFs bis 30 MB · Scan-PDFs mit OCR-Fallback</small></label>}
    {pages.length>0&&<>
      <div className="pdf-controls"><label><span>Sprache im PDF</span><select value={source} onChange={event=>setSource(event.target.value as LanguageCode)}>{translationLanguages.map(language=><option key={language.code} value={language.code} disabled={language.code===target}>{language.name}</option>)}</select></label><button className="pdf-swap" onClick={swap} aria-label="Übersetzungsrichtung tauschen">⇄</button><label><span>Übersetzen nach</span><select value={target} onChange={event=>setTarget(event.target.value as LanguageCode)}>{translationLanguages.map(language=><option key={language.code} value={language.code} disabled={language.code===source}>{language.name}</option>)}</select></label><div className="pdf-file-meta"><strong>{fileName}</strong><small>{totalPages} Seiten · {allWords.length} eindeutige Wörter{usedOcr?' · OCR':''}</small></div></div>
      <div className="pdf-workspace"><aside className="pdf-pages"><span>SEITEN</span>{pages.map((page,index)=><button key={page.page} className={index===pageIndex?'active':''} onClick={()=>{setPageIndex(index);setSearch('')}}><strong>{page.page}</strong><small>{page.wordCount} Wörter</small></button>)}</aside><div className="pdf-page"><div className="pdf-page-toolbar"><div><strong>Seite {current?.page}</strong><small>Wörter anklicken, um sie zu markieren</small></div><label><span>⌕</span><input type="search" value={search} onChange={event=>setSearch(event.target.value)} placeholder="Wort auf dieser Seite suchen …"/></label></div>{search.trim()?<div className="pdf-word-results">{filteredWords.length?filteredWords.map(word=><button key={normalize(word)} className={selected[normalize(word)]?'selected':''} onClick={()=>toggle(word)}>{word}</button>):<span>Keine Treffer auf dieser Seite.</span>}</div>:<div className="pdf-text" aria-label={`Text von Seite ${current?.page}`}>{displayTokens(current?.text||'').map((token,index)=>isWord(token)?<button key={`${index}-${token}`} className={selected[normalize(token)]?'selected':''} onClick={()=>toggle(token)}>{token}</button>:<span key={`${index}-space`}>{token}</span>)}</div>}</div></div>
      <section className="pdf-all-words"><div className="pdf-all-words-head"><div><span className="eyebrow">ALLE WÖRTER DER PDF</span><h4>{allWords.length} eindeutige Wörter</h4><p>Jedes erkannte Wort wird hier genau einmal aufgelistet – unabhängig davon, wie oft oder auf welcher Seite es vorkommt.</p></div><div className="pdf-all-word-actions"><label><span>⌕</span><input type="search" value={globalSearch} onChange={event=>setGlobalSearch(event.target.value)} placeholder="In allen Wörtern suchen …"/></label><button onClick={selectVisible} disabled={!visibleAllWords.length}>Sichtbare markieren</button><button onClick={()=>setSelected({})} disabled={!selectedWords.length}>Auswahl leeren</button></div></div><div className="pdf-all-word-list">{visibleAllWords.length?visibleAllWords.map(word=><button key={normalize(word)} className={selected[normalize(word)]?'selected':''} onClick={()=>toggle(word)}>{word}</button>):<span>Keine Wörter gefunden.</span>}</div></section>
      <div className="pdf-selection"><div><span>MARKIERT</span><strong>{selectedWords.length} Wörter</strong><small>{selectedWords.length>60?'Maximal 60 Wörter werden pro Durchgang übernommen.':'Du kannst im PDF-Text und in der Gesamtliste markieren.'}</small></div><div className="pdf-selected-list">{selectedWords.slice(0,20).map(word=><button key={normalize(word)} onClick={()=>toggle(word)}>{word} ×</button>)}{selectedWords.length>20&&<span>+{selectedWords.length-20} weitere</span>}</div><button className="view-primary" disabled={!selectedWords.length||saving} onClick={()=>void translateAndSave()}>{saving?'Übersetze & speichere …':`${Math.min(selectedWords.length,60)} Wörter übersetzen & speichern →`}</button></div>
    </>}
    {status&&<p className="pdf-status" role="status">{status}</p>}{error&&<p className="pdf-error" role="alert">{error}</p>}
  </section>;
}