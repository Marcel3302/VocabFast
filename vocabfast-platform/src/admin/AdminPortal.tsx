import { useEffect, useMemo, useState } from 'react';
import { courseStats, englishCourseLevels } from '../learning/curriculum';
import './admin.css';

type AdminContext = { username?:string; name?:string; email?:string; superadmin?:boolean; permissions?:string[] };
type UserRow = {
  id:string;
  email?:string;
  name?:string;
  effectivePlan?:string;
  plan?:string;
  proUntil?:string|null;
  createdAt?:number;
  words?:number;
  xp?:number;
  disabled?:boolean;
  adminNote?:string;
  mustChangePassword?:boolean;
};
type UserDetail = { profile:UserRow; state?:Record<string,unknown>; pdfCount?:number };
type ProgressData = { stats?:Record<string,number>; learningCount?:number; grammarScores?:Record<string,{percent?:number}|number>; testCount?:number };
type TestRow = { title?:string; kind?:string; percent?:number; passed?:boolean };
type TestsData = { tests?:TestRow[]; grammarScores?:Record<string,{percent?:number}|number> };
type PdfRow = { id:string; name?:string; created?:number; size?:number };
type ModeratorData = { enabled?:boolean; capabilities?:string[]; note?:string };
type RightsData = { permissions?:string[] };
type Mode = 'loading'|'preview'|'login'|'admin'|'error';
type Tab = 'account'|'progress'|'tests'|'pdfs'|'rights'|'security';

const permissionOptions = [
  ['users.read','Benutzer ansehen'],
  ['users.edit','Kontodaten bearbeiten'],
  ['progress.edit','Fortschritt bearbeiten'],
  ['tests.edit','Prüfungsdaten bearbeiten'],
  ['pdfs.manage','Dokumente verwalten'],
  ['plans.manage','Pro-Zugänge verwalten'],
  ['security.manage','Passwörter & Sitzungen verwalten'],
  ['accounts.manage','Konten löschen']
] as const;

function fmtDate(value?:number|string|null) {
  if(!value)return '–';
  try{return new Intl.DateTimeFormat('de-AT',{dateStyle:'medium'}).format(new Date(value));}catch{return '–';}
}

function fmtDateTime(value?:number|string|null) {
  if(!value)return '–';
  try{return new Intl.DateTimeFormat('de-AT',{dateStyle:'medium',timeStyle:'short'}).format(new Date(value));}catch{return '–';}
}

function planOf(user?:UserRow|null) {
  const effective=String(user?.effectivePlan||'').toLowerCase();
  if(effective==='pro'||effective==='elite')return 'pro';
  return user?.plan==='pro'?'pro':'free';
}

async function api<T>(path:string, options:{method?:string; body?:unknown}={}) {
  const response=await fetch(`/api${path}`,{
    method:options.method||'GET',
    credentials:'same-origin',
    cache:'no-store',
    headers:options.body===undefined?{Accept:'application/json'}:{Accept:'application/json','Content-Type':'application/json'},
    body:options.body===undefined?undefined:JSON.stringify(options.body)
  });
  const data=await response.json().catch(()=>({})) as T&{error?:string};
  if(!response.ok)throw new Error(data.error||`Serverfehler ${response.status}`);
  return data;
}

export default function AdminPortal() {
  const [mode,setMode]=useState<Mode>('loading');
  const [context,setContext]=useState<AdminContext|null>(null);
  const [users,setUsers]=useState<UserRow[]>([]);
  const [selected,setSelected]=useState<UserDetail|null>(null);
  const [tab,setTab]=useState<Tab>('account');
  const [query,setQuery]=useState('');
  const [username,setUsername]=useState('admin');
  const [password,setPassword]=useState('');
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  const [busy,setBusy]=useState(false);
  const [progress,setProgress]=useState<ProgressData|null>(null);
  const [tests,setTests]=useState<TestsData|null>(null);
  const [pdfs,setPdfs]=useState<PdfRow[]|null>(null);
  const [rights,setRights]=useState<RightsData|null>(null);
  const [moderator,setModerator]=useState<ModeratorData|null>(null);
  const stats=useMemo(()=>courseStats(),[]);
  const visibleUsers=useMemo(()=>{
    const q=query.trim().toLowerCase();
    return users.filter(user=>!q||`${user.name||''} ${user.email||''}`.toLowerCase().includes(q));
  },[users,query]);

  useEffect(()=>{
    document.title='VocabFast Admin';
    let robots=document.querySelector('meta[name="robots"]') as HTMLMetaElement|null;
    if(!robots){robots=document.createElement('meta');robots.name='robots';document.head.appendChild(robots);}
    robots.content='noindex,nofollow,noarchive';
    void bootstrap();
  },[]);

  function can(permission:string) {
    return Boolean(context?.superadmin||context?.permissions?.includes(permission));
  }

  function flash(message:string) {
    setNotice(message);
    window.setTimeout(()=>setNotice(current=>current===message?'':current),2600);
  }

  async function bootstrap() {
    setMode('loading');setError('');
    try{
      const health=await fetch('/api/preview/health',{credentials:'same-origin',cache:'no-store'});
      if(health.ok){
        const data=await health.json() as {environment?:string};
        if(data.environment==='preview'){setMode('preview');return;}
      }
    }catch{/* production has no preview health endpoint */}
    try{
      const nextContext=await api<AdminContext>('/admin/context');
      setContext(nextContext);
      await loadUsers();
      setMode('admin');
    }catch(reason){
      const message=reason instanceof Error?reason.message:'Admin-Anmeldung erforderlich.';
      if(/Anmeldung erforderlich|401|anmelden/i.test(message)){setMode('login');return;}
      setMode('login');
    }
  }

  async function loadUsers(selectId?:string) {
    const data=await api<{users?:UserRow[]}>('/admin/users');
    const next=Array.isArray(data.users)?data.users:[];
    setUsers(next);
    const id=selectId||selected?.profile.id;
    if(id&&next.some(user=>user.id===id))await selectUser(id,false);
  }

  async function selectUser(id:string, resetTab=true) {
    setBusy(true);setError('');
    try{
      const detail=await api<UserDetail>(`/admin/users/${encodeURIComponent(id)}`);
      setSelected(detail);
      if(resetTab)setTab('account');
      setProgress(null);setTests(null);setPdfs(null);setRights(null);setModerator(null);
    }catch(reason){setError(reason instanceof Error?reason.message:'Konto konnte nicht geladen werden.');}
    finally{setBusy(false);}
  }

  async function login(event:React.FormEvent) {
    event.preventDefault();if(busy)return;
    setBusy(true);setError('');
    try{
      await api('/admin/login',{method:'POST',body:{username,password}});
      const nextContext=await api<AdminContext>('/admin/context');
      setContext(nextContext);setPassword('');
      await loadUsers();setMode('admin');
    }catch(reason){setError(reason instanceof Error?reason.message:'Admin-Anmeldung fehlgeschlagen.');}
    finally{setBusy(false);}
  }

  async function logout() {
    setBusy(true);
    try{await api('/admin/logout',{method:'POST'});}catch{/* UI trotzdem zurücksetzen */}
    setContext(null);setUsers([]);setSelected(null);setMode('login');setBusy(false);
  }

  async function saveAccount(event:React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if(!selected)return;
    const form=new FormData(event.currentTarget);
    const payload:Record<string,unknown>={};
    if(can('users.edit')){
      payload.name=String(form.get('name')||'').trim();
      payload.email=String(form.get('email')||'').trim();
      payload.adminNote=String(form.get('adminNote')||'').trim();
      payload.disabled=form.get('disabled')==='on';
    }
    if(can('plans.manage')){
      payload.plan=form.get('plan')==='pro'?'pro':'free';
      const until=String(form.get('proUntil')||'');
      payload.proUntil=until?new Date(`${until}T23:59:59`).toISOString():null;
    }
    setBusy(true);setError('');
    try{
      const data=await api<{profile?:UserRow}>(`/admin/users/${encodeURIComponent(selected.profile.id)}`,{method:'PUT',body:payload});
      const profile=data.profile||{...selected.profile,...payload} as UserRow;
      setSelected({...selected,profile});
      setUsers(current=>current.map(user=>user.id===profile.id?{...user,...profile}:user));
      flash('Kontodaten gespeichert.');
    }catch(reason){setError(reason instanceof Error?reason.message:'Änderungen konnten nicht gespeichert werden.');}
    finally{setBusy(false);}
  }

  async function loadProgress() {
    if(!selected)return;
    setBusy(true);setError('');
    try{setProgress(await api<ProgressData>(`/admin/users/${encodeURIComponent(selected.profile.id)}/progress`));}
    catch(reason){setError(reason instanceof Error?reason.message:'Fortschritt konnte nicht geladen werden.');}
    finally{setBusy(false);}
  }

  async function saveProgress(event:React.FormEvent<HTMLFormElement>) {
    event.preventDefault();if(!selected)return;
    const form=new FormData(event.currentTarget);
    const payload={xp:Number(form.get('xp')||0),vocabAnswered:Number(form.get('vocabAnswered')||0),vocabCorrect:Number(form.get('vocabCorrect')||0),grammarAnswered:Number(form.get('grammarAnswered')||0),grammarCorrect:Number(form.get('grammarCorrect')||0)};
    setBusy(true);setError('');
    try{
      const data=await api<{stats?:Record<string,number>}>(`/admin/users/${encodeURIComponent(selected.profile.id)}/progress`,{method:'PUT',body:payload});
      setProgress(current=>({...current,stats:data.stats||payload}));
      setUsers(current=>current.map(user=>user.id===selected.profile.id?{...user,xp:payload.xp}:user));
      flash('Fortschritt gespeichert.');
    }catch(reason){setError(reason instanceof Error?reason.message:'Fortschritt konnte nicht gespeichert werden.');}
    finally{setBusy(false);}
  }

  async function loadTests() {
    if(!selected)return;
    setBusy(true);setError('');
    try{setTests(await api<TestsData>(`/admin/users/${encodeURIComponent(selected.profile.id)}/tests`));}
    catch(reason){setError(reason instanceof Error?reason.message:'Prüfungsdaten konnten nicht geladen werden.');}
    finally{setBusy(false);}
  }

  async function clearTests(action:'clearTests'|'clearGrammar') {
    if(!selected||!can('tests.edit'))return;
    const label=action==='clearTests'?'alle gespeicherten Prüfungen':'alle Grammatikbewertungen';
    if(!window.confirm(`Wirklich ${label} löschen?`))return;
    setBusy(true);setError('');
    try{await api(`/admin/users/${encodeURIComponent(selected.profile.id)}/tests`,{method:'PUT',body:{action}});await loadTests();flash('Prüfungsdaten aktualisiert.');}
    catch(reason){setError(reason instanceof Error?reason.message:'Prüfungsdaten konnten nicht geändert werden.');}
    finally{setBusy(false);}
  }

  async function loadPdfs() {
    if(!selected)return;
    setBusy(true);setError('');
    try{const data=await api<{pdfs?:PdfRow[]}>(`/admin/users/${encodeURIComponent(selected.profile.id)}/pdfs`);setPdfs(Array.isArray(data.pdfs)?data.pdfs:[]);}
    catch(reason){setError(reason instanceof Error?reason.message:'Dokumente konnten nicht geladen werden.');}
    finally{setBusy(false);}
  }

  async function downloadPdf(pdf:PdfRow) {
    if(!selected)return;
    const response=await fetch(`/api/admin/users/${encodeURIComponent(selected.profile.id)}/pdfs/${encodeURIComponent(pdf.id)}/file`,{credentials:'same-origin'});
    if(!response.ok){setError('Download fehlgeschlagen.');return;}
    const blob=await response.blob();
    const url=URL.createObjectURL(blob),anchor=document.createElement('a');
    anchor.href=url;anchor.download=pdf.name||'document.pdf';anchor.click();
    window.setTimeout(()=>URL.revokeObjectURL(url),1000);
  }

  async function deletePdf(pdfId?:string) {
    if(!selected||!can('pdfs.manage'))return;
    const all=!pdfId;
    if(!window.confirm(all?'Wirklich alle Dokumente dieses Kontos löschen?':'Dieses Dokument wirklich löschen?'))return;
    setBusy(true);setError('');
    try{
      const path=all?`/admin/users/${encodeURIComponent(selected.profile.id)}/pdfs`:`/admin/users/${encodeURIComponent(selected.profile.id)}/pdfs/${encodeURIComponent(pdfId!)}`;
      await api(path,{method:'DELETE'});await loadPdfs();flash(all?'Alle Dokumente gelöscht.':'Dokument gelöscht.');
    }catch(reason){setError(reason instanceof Error?reason.message:'Dokument konnte nicht gelöscht werden.');}
    finally{setBusy(false);}
  }

  async function loadRights() {
    if(!selected||!context?.superadmin)return;
    setBusy(true);setError('');
    try{
      const [permissionData,moderatorData]=await Promise.all([
        api<RightsData>(`/admin/users/${encodeURIComponent(selected.profile.id)}/permissions`),
        api<{moderator?:ModeratorData}>(`/admin/users/${encodeURIComponent(selected.profile.id)}/moderator`)
      ]);
      setRights(permissionData);setModerator(moderatorData.moderator||{});
    }catch(reason){setError(reason instanceof Error?reason.message:'Rollen konnten nicht geladen werden.');}
    finally{setBusy(false);}
  }

  async function saveRights(event:React.FormEvent<HTMLFormElement>) {
    event.preventDefault();if(!selected||!context?.superadmin)return;
    const form=new FormData(event.currentTarget);
    const permissions=form.getAll('permissions').map(String);
    const capabilities=form.getAll('capabilities').map(String);
    const moderatorEnabled=form.get('moderatorEnabled')==='on';
    const note=String(form.get('moderatorNote')||'');
    setBusy(true);setError('');
    try{
      await Promise.all([
        api(`/admin/users/${encodeURIComponent(selected.profile.id)}/permissions`,{method:'PUT',body:{permissions}}),
        api(`/admin/users/${encodeURIComponent(selected.profile.id)}/moderator`,{method:'PUT',body:{enabled:moderatorEnabled,capabilities,note}})
      ]);
      setRights({permissions});setModerator({enabled:moderatorEnabled,capabilities,note});flash('Rollen und Rechte gespeichert.');
    }catch(reason){setError(reason instanceof Error?reason.message:'Rollen konnten nicht gespeichert werden.');}
    finally{setBusy(false);}
  }

  async function resetPassword(event:React.FormEvent<HTMLFormElement>) {
    event.preventDefault();if(!selected||!can('security.manage'))return;
    const form=new FormData(event.currentTarget),temporary=String(form.get('temporaryPassword')||'');
    if(temporary.length<12){setError('Das temporäre Passwort muss mindestens 12 Zeichen lang sein.');return;}
    if(!window.confirm('Temporäres Passwort setzen und bestehende Sitzungen des Kontos beenden?'))return;
    setBusy(true);setError('');
    try{await api(`/admin/users/${encodeURIComponent(selected.profile.id)}/password`,{method:'POST',body:{password:temporary}});event.currentTarget.reset();flash('Temporäres Passwort gesetzt.');}
    catch(reason){setError(reason instanceof Error?reason.message:'Passwort konnte nicht gesetzt werden.');}
    finally{setBusy(false);}
  }

  async function revokeSessions() {
    if(!selected||!can('security.manage')||!window.confirm('Alle aktiven Sitzungen dieses Kontos beenden?'))return;
    setBusy(true);setError('');
    try{await api(`/admin/users/${encodeURIComponent(selected.profile.id)}/sessions`,{method:'DELETE'});flash('Alle Sitzungen wurden beendet.');}
    catch(reason){setError(reason instanceof Error?reason.message:'Sitzungen konnten nicht beendet werden.');}
    finally{setBusy(false);}
  }

  async function deleteUser() {
    if(!selected||!can('accounts.manage'))return;
    if(!window.confirm(`Konto ${selected.profile.email||selected.profile.name||selected.profile.id} wirklich endgültig löschen?`))return;
    if(!window.confirm('Diese Aktion kann nicht rückgängig gemacht werden. Fortfahren?'))return;
    setBusy(true);setError('');
    try{await api(`/admin/users/${encodeURIComponent(selected.profile.id)}`,{method:'DELETE'});setSelected(null);await loadUsers();flash('Konto gelöscht.');}
    catch(reason){setError(reason instanceof Error?reason.message:'Konto konnte nicht gelöscht werden.');}
    finally{setBusy(false);}
  }

  function changeTab(next:Tab) {
    setTab(next);setError('');
    if(next==='progress'&&!progress)void loadProgress();
    if(next==='tests'&&!tests)void loadTests();
    if(next==='pdfs'&&!pdfs)void loadPdfs();
    if(next==='rights'&&!rights)void loadRights();
  }

  if(mode==='loading')return <div className="admin-shell center"><div className="admin-loader"/><p>Adminbereich wird geprüft …</p></div>;

  if(mode==='preview')return <div className="admin-shell">
    <header className="admin-top"><div className="admin-brand"><span>V</span><div><strong>VocabFast Admin</strong><small>Release Preview</small></div></div><a href="/">← Zur Lernplattform</a></header>
    <main className="admin-main"><section className="admin-hero"><div><span>GESICHERTE VORSCHAU</span><h1>Der Adminbereich ist Teil der neuen Plattform.</h1><p>Die Vorschau zeigt bewusst keine produktiven Kundendaten. Beim späteren Release verbindet sich dieselbe Oberfläche mit den geschützten Admin-Endpunkten der Produktionsumgebung.</p></div><div className="admin-preview-badge"><strong>READY</strong><span>isoliert</span></div></section>
      <div className="admin-metrics"><article><span>CEFR-Stufen</span><strong>{stats.levels}</strong><small>A1–C2</small></article><article><span>Units</span><strong>{stats.units}</strong><small>Kursstruktur</small></article><article><span>Lektionen</span><strong>{stats.lessons}</strong><small>aktuell im Build</small></article><article><span>Aufgaben</span><strong>{stats.exercises}</strong><small>interaktiv</small></article></div>
      <section className="admin-panel"><div className="admin-panel-head"><div><span>KURSSTATUS</span><h2>Content-Pipeline</h2></div><small>keine Kundendaten in der Vorschau</small></div><div className="admin-level-table">{englishCourseLevels.map(level=><div key={level.id}><b>{level.id}</b><span><strong>{level.title}</strong><small>{level.units.length}/{level.productionTargetUnits} Ziel-Units</small></span><em>{level.units.flatMap(unit=>unit.lessons).length} Lektionen</em></div>)}</div></section>
    </main></div>;

  if(mode==='login')return <div className="admin-shell login-shell"><a className="admin-back" href="/">← VocabFast</a><form className="admin-login-card" onSubmit={login}><div className="admin-login-mark">V</div><span>GESCHÜTZTER BEREICH</span><h1>VocabFast Admin</h1><p>Separater Administrator-Zugang. Normale Benutzeranmeldungen funktionieren hier nicht.</p><label><span>Benutzername</span><input autoComplete="username" value={username} onChange={event=>setUsername(event.target.value)}/></label><label><span>Passwort</span><input type="password" autoComplete="current-password" value={password} onChange={event=>setPassword(event.target.value)}/></label>{error&&<div className="admin-error">{error}</div>}<button disabled={busy||!username||!password}>{busy?'Anmeldung …':'Sicher anmelden →'}</button></form></div>;

  if(mode==='error')return <div className="admin-shell center"><h1>Adminbereich nicht erreichbar</h1><p>{error}</p><button className="admin-retry" onClick={()=>void bootstrap()}>Erneut versuchen</button></div>;

  const proUsers=users.filter(user=>planOf(user)==='pro').length;
  const disabledUsers=users.filter(user=>user.disabled).length;
  const totalXp=users.reduce((sum,user)=>sum+Number(user.xp||0),0);

  return <div className="admin-shell">
    <header className="admin-top"><div className="admin-brand"><span>V</span><div><strong>VocabFast Admin</strong><small>{context?.superadmin?'Superadmin':'Verwaltung'}</small></div></div><div className="admin-top-actions"><span>{context?.name||context?.username||context?.email||'Admin'}</span><a href="/">Lernplattform</a><button onClick={()=>void logout()} disabled={busy}>Abmelden</button></div></header>
    <main className="admin-main">
      <section className="admin-hero compact"><div><span>ADMIN KONSOLE</span><h1>Konten, Pläne, Fortschritt und Sicherheit an einem Ort.</h1><p>Die neue Verwaltung nutzt die bestehenden geschützten Produktions-APIs weiter. Damit bleibt der Adminbereich auch nach dem Wechsel auf die neue Lernplattform erhalten.</p></div></section>
      {notice&&<div className="admin-notice">✓ {notice}</div>}{error&&<div className="admin-global-error">{error}</div>}
      <div className="admin-metrics"><article><span>Benutzer</span><strong>{users.length}</strong><small>Konten</small></article><article><span>Pro</span><strong>{proUsers}</strong><small>aktive Zugänge</small></article><article><span>Gesperrt</span><strong>{disabledUsers}</strong><small>Konten</small></article><article><span>Gesamt-XP</span><strong>{totalXp.toLocaleString('de-AT')}</strong><small>über alle Konten</small></article></div>

      <section className="admin-console">
        <aside className="admin-user-list-panel">
          <div className="admin-user-list-head"><div><span>BENUTZER</span><strong>{visibleUsers.length}</strong></div><button onClick={()=>void loadUsers()} disabled={busy}>↻</button></div>
          <input className="admin-search" type="search" placeholder="Name oder E-Mail suchen …" value={query} onChange={event=>setQuery(event.target.value)}/>
          <div className="admin-user-list">{visibleUsers.map(user=><button key={user.id} className={selected?.profile.id===user.id?'active':''} onClick={()=>void selectUser(user.id)}><span className="admin-avatar">{(user.name||user.email||'VF').slice(0,2).toUpperCase()}</span><span><strong>{user.name||user.email||'Unbenannt'}</strong><small>{user.email||'–'}</small><em>{planOf(user)==='pro'?'PRO':'FREE'} · {Number(user.xp||0).toLocaleString('de-AT')} XP{user.disabled?' · GESPERRT':''}</em></span></button>)}</div>
        </aside>

        <section className="admin-workspace">
          {!selected?<div className="admin-empty"><strong>Konto auswählen</strong><span>Wähle links einen Benutzer, um Details und Verwaltungsfunktionen zu öffnen.</span></div>:<>
            <div className="admin-profile-head"><div className="admin-avatar large">{(selected.profile.name||selected.profile.email||'VF').slice(0,2).toUpperCase()}</div><div><span>{selected.profile.disabled?'GESPERRT':'AKTIVES KONTO'}</span><h2>{selected.profile.name||selected.profile.email}</h2><p>{selected.profile.email} · erstellt {fmtDate(selected.profile.createdAt)}</p></div><b className={planOf(selected.profile)==='pro'?'pro':''}>{planOf(selected.profile)==='pro'?'PRO':'FREE'}</b></div>
            <nav className="admin-tabs">
              <button className={tab==='account'?'active':''} onClick={()=>changeTab('account')}>Konto</button>
              <button className={tab==='progress'?'active':''} onClick={()=>changeTab('progress')}>Fortschritt</button>
              <button className={tab==='tests'?'active':''} onClick={()=>changeTab('tests')}>Prüfungen</button>
              <button className={tab==='pdfs'?'active':''} onClick={()=>changeTab('pdfs')}>Dokumente</button>
              {context?.superadmin&&<button className={tab==='rights'?'active':''} onClick={()=>changeTab('rights')}>Rollen</button>}
              <button className={tab==='security'?'active':''} onClick={()=>changeTab('security')}>Sicherheit</button>
            </nav>

            {tab==='account'&&<form className="admin-detail-card" onSubmit={saveAccount}><div className="admin-card-head"><div><span>KONTO</span><h3>Kontodaten & Zugang</h3></div><small>ID {selected.profile.id}</small></div><div className="admin-form-grid"><label><span>Name</span><input name="name" defaultValue={selected.profile.name||''} disabled={!can('users.edit')}/></label><label><span>E-Mail</span><input name="email" type="email" defaultValue={selected.profile.email||''} disabled={!can('users.edit')}/></label><label><span>Plan</span><select name="plan" defaultValue={selected.profile.plan==='pro'?'pro':'free'} disabled={!can('plans.manage')}><option value="free">VocabFast Free</option><option value="pro">VocabFast Pro</option></select></label><label><span>Pro bis (optional)</span><input name="proUntil" type="date" defaultValue={selected.profile.proUntil?new Date(selected.profile.proUntil).toISOString().slice(0,10):''} disabled={!can('plans.manage')}/></label><label className="wide"><span>Interne Admin-Notiz</span><textarea name="adminNote" rows={4} defaultValue={selected.profile.adminNote||''} disabled={!can('users.edit')}/></label><label className="admin-check wide"><input name="disabled" type="checkbox" defaultChecked={selected.profile.disabled} disabled={!can('users.edit')}/><span>Konto sperren</span></label></div><div className="admin-actions"><button className="primary" disabled={busy||(!can('users.edit')&&!can('plans.manage'))}>Änderungen speichern</button></div></form>}

            {tab==='progress'&&<div className="admin-detail-card"><div className="admin-card-head"><div><span>FORTSCHRITT</span><h3>Lernstatistik</h3></div><button onClick={()=>void loadProgress()} disabled={busy}>Neu laden</button></div>{!progress?<div className="admin-empty compact"><strong>Noch nicht geladen</strong><button onClick={()=>void loadProgress()}>Fortschritt laden</button></div>:<form onSubmit={saveProgress}><div className="admin-form-grid metrics"><label><span>XP</span><input name="xp" type="number" min="0" defaultValue={Number(progress.stats?.xp||0)} disabled={!can('progress.edit')}/></label><label><span>Vokabel beantwortet</span><input name="vocabAnswered" type="number" min="0" defaultValue={Number(progress.stats?.vocabAnswered||0)} disabled={!can('progress.edit')}/></label><label><span>Vokabel richtig</span><input name="vocabCorrect" type="number" min="0" defaultValue={Number(progress.stats?.vocabCorrect||0)} disabled={!can('progress.edit')}/></label><label><span>Grammatik beantwortet</span><input name="grammarAnswered" type="number" min="0" defaultValue={Number(progress.stats?.grammarAnswered||0)} disabled={!can('progress.edit')}/></label><label><span>Grammatik richtig</span><input name="grammarCorrect" type="number" min="0" defaultValue={Number(progress.stats?.grammarCorrect||0)} disabled={!can('progress.edit')}/></label></div><div className="admin-inline-stats"><span><strong>{progress.learningCount||0}</strong> Wörter</span><span><strong>{progress.testCount||0}</strong> Prüfungen</span></div><div className="admin-actions"><button className="primary" disabled={busy||!can('progress.edit')}>Fortschritt speichern</button></div></form>}</div>}

            {tab==='tests'&&<div className="admin-detail-card"><div className="admin-card-head"><div><span>PRÜFUNGEN</span><h3>Tests & Grammatikbewertungen</h3></div><button onClick={()=>void loadTests()} disabled={busy}>Neu laden</button></div>{!tests?<div className="admin-empty compact"><strong>Noch nicht geladen</strong><button onClick={()=>void loadTests()}>Prüfungsdaten laden</button></div>:<><div className="admin-test-list">{(tests.tests||[]).length?(tests.tests||[]).map((test,index)=><div key={`${test.title}-${index}`}><span><strong>{test.title||'Test'}</strong><small>{test.kind||'VocabFast Test'} · {Number(test.percent||0)}%</small></span><b>{test.passed?'Bestanden':'Nicht bestanden'}</b></div>):<div className="admin-empty compact"><span>Keine Prüfungen gespeichert.</span></div>}</div><div className="admin-actions split"><button className="danger" disabled={!can('tests.edit')||busy} onClick={()=>void clearTests('clearTests')}>Prüfungen löschen</button><button disabled={!can('tests.edit')||busy} onClick={()=>void clearTests('clearGrammar')}>Grammatikwerte zurücksetzen</button></div></>}</div>}

            {tab==='pdfs'&&<div className="admin-detail-card"><div className="admin-card-head"><div><span>DOKUMENTE</span><h3>Gespeicherte PDFs</h3></div><button onClick={()=>void loadPdfs()} disabled={busy}>Neu laden</button></div>{pdfs===null?<div className="admin-empty compact"><strong>Noch nicht geladen</strong><button onClick={()=>void loadPdfs()}>Dokumente laden</button></div>:<><div className="admin-pdf-list">{pdfs.length?pdfs.map(pdf=><div key={pdf.id}><span className="pdf-mark">PDF</span><span><strong>{pdf.name||'Dokument.pdf'}</strong><small>{fmtDateTime(pdf.created)} · {Math.round(Number(pdf.size||0)/1024)} KB</small></span><button onClick={()=>void downloadPdf(pdf)}>Download</button>{can('pdfs.manage')&&<button className="danger" onClick={()=>void deletePdf(pdf.id)}>Löschen</button>}</div>):<div className="admin-empty compact"><span>Keine Dokumente gespeichert.</span></div>}</div>{can('pdfs.manage')&&pdfs.length>0&&<div className="admin-actions"><button className="danger" onClick={()=>void deletePdf()}>Alle Dokumente löschen</button></div>}</>}</div>}

            {tab==='rights'&&context?.superadmin&&<div className="admin-detail-card"><div className="admin-card-head"><div><span>ROLLEN & RECHTE</span><h3>Interne Verwaltungsrechte</h3></div><button onClick={()=>void loadRights()} disabled={busy}>Neu laden</button></div>{!rights||!moderator?<div className="admin-empty compact"><strong>Noch nicht geladen</strong><button onClick={()=>void loadRights()}>Rollen laden</button></div>:<form onSubmit={saveRights}><div className="admin-rights-grid">{permissionOptions.map(([value,label])=><label key={value}><input type="checkbox" name="permissions" value={value} defaultChecked={rights.permissions?.includes(value)}/><span><strong>{label}</strong><small>{value}</small></span></label>)}</div><div className="admin-role-box"><label className="admin-check"><input type="checkbox" name="moderatorEnabled" defaultChecked={moderator.enabled}/><span>Moderatorrolle aktiv</span></label><div className="admin-rights-grid compact"><label><input type="checkbox" name="capabilities" value="report" defaultChecked={moderator.capabilities?.includes('report')}/><span><strong>Beanstandungen</strong><small>Probleme dokumentieren</small></span></label><label><input type="checkbox" name="capabilities" value="comment" defaultChecked={moderator.capabilities?.includes('comment')}/><span><strong>Kommentare</strong><small>Rückfragen ergänzen</small></span></label><label><input type="checkbox" name="capabilities" value="document" defaultChecked={moderator.capabilities?.includes('document')}/><span><strong>Dokumentation</strong><small>Verbesserungen pflegen</small></span></label></div><label><span>Rollen-Notiz</span><textarea name="moderatorNote" rows={3} defaultValue={moderator.note||''}/></label></div><div className="admin-actions"><button className="primary" disabled={busy}>Rollen speichern</button></div></form>}</div>}

            {tab==='security'&&<div className="admin-detail-card"><div className="admin-card-head"><div><span>SICHERHEIT</span><h3>Kontohilfe & kritische Aktionen</h3></div></div><form className="admin-security-form" onSubmit={resetPassword}><label><span>Temporäres Passwort</span><input name="temporaryPassword" type="password" minLength={12} placeholder="Mindestens 12 Zeichen" disabled={!can('security.manage')}/></label><button className="primary" disabled={busy||!can('security.manage')}>Temporäres Passwort setzen</button></form><div className="admin-security-actions"><button disabled={busy||!can('security.manage')} onClick={()=>void revokeSessions()}>Alle Sitzungen beenden</button>{can('accounts.manage')&&<button className="danger" disabled={busy} onClick={()=>void deleteUser()}>Konto endgültig löschen</button>}</div><p className="admin-security-note">Ein temporäres Passwort markiert das Konto für einen Passwortwechsel und beendet bestehende Sitzungen. Das Löschen eines Kontos ist nicht rückgängig zu machen.</p></div>}
          </>}
        </section>
      </section>
    </main>
  </div>;
}
