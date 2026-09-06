import { useEffect, useMemo, useState } from 'react';
import { courseStats } from '../learning/curriculum';
import './admin.css';

type AdminContext={
  username?:string;
  name?:string;
  email?:string;
  superadmin?:boolean;
  permissions?:string[];
};

type PlatformAccount={
  id:string;
  email:string;
  name:string;
  plan:'free'|'pro';
  disabled:boolean;
  adminNote?:string;
  createdAt:number;
  updatedAt?:number;
  lastSeenAt?:number;
  activeNow:boolean;
  sessionCount:number;
  xp:number;
  lessons:number;
  learningSessions:number;
  streak:number;
  lastStudyDate?:string|null;
  activeLevel?:string;
  placementLevel?:string|null;
  placementScore?:number;
  placementTotal?:number;
  savedAt?:string|null;
};

type Mode='loading'|'login'|'admin'|'error';
type StatusFilter='all'|'active'|'inactive'|'disabled';
type PlanFilter='all'|'free'|'pro';
type SortMode='activity'|'created'|'name';

type ApiOptions={method?:string;body?:unknown;adminWrite?:boolean};

async function requestJson<T>(path:string,options:ApiOptions={}) {
  const method=options.method||'GET';
  const headers:Record<string,string>={Accept:'application/json'};
  if(options.body!==undefined)headers['Content-Type']='application/json';
  if(options.adminWrite||(!['GET','HEAD'].includes(method)&&path.startsWith('/api/preview/admin/')))headers['X-VocabFast-Admin']='1';
  const response=await fetch(path,{
    method,
    credentials:'same-origin',
    cache:'no-store',
    headers,
    body:options.body===undefined?undefined:JSON.stringify(options.body)
  });
  const data=await response.json().catch(()=>({})) as T&{error?:string};
  if(!response.ok)throw new Error(data.error||`Serverfehler ${response.status}`);
  return data;
}

function fmtDate(value?:number|string|null) {
  if(!value)return '–';
  try{return new Intl.DateTimeFormat('de-AT',{dateStyle:'medium'}).format(new Date(value));}catch{return '–';}
}

function fmtDateTime(value?:number|string|null) {
  if(!value)return 'Noch nie';
  try{return new Intl.DateTimeFormat('de-AT',{dateStyle:'medium',timeStyle:'short'}).format(new Date(value));}catch{return '–';}
}

function relativeActivity(value?:number) {
  if(!value)return 'Noch nie aktiv';
  const minutes=Math.max(0,Math.round((Date.now()-value)/60000));
  if(minutes<1)return 'gerade eben';
  if(minutes<60)return `vor ${minutes} Min.`;
  const hours=Math.round(minutes/60);
  if(hours<24)return `vor ${hours} Std.`;
  const days=Math.round(hours/24);
  return `vor ${days} Tg.`;
}

export default function AdminPortal() {
  const [mode,setMode]=useState<Mode>('loading');
  const [context,setContext]=useState<AdminContext|null>(null);
  const [accounts,setAccounts]=useState<PlatformAccount[]>([]);
  const [selected,setSelected]=useState<PlatformAccount|null>(null);
  const [query,setQuery]=useState('');
  const [statusFilter,setStatusFilter]=useState<StatusFilter>('all');
  const [planFilter,setPlanFilter]=useState<PlanFilter>('all');
  const [sortMode,setSortMode]=useState<SortMode>('activity');
  const [username,setUsername]=useState('admin');
  const [password,setPassword]=useState('');
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  const [busy,setBusy]=useState(false);
  const [activeWindowMinutes,setActiveWindowMinutes]=useState(15);
  const stats=useMemo(()=>courseStats(),[]);

  const filteredAccounts=useMemo(()=>{
    const q=query.trim().toLowerCase();
    const filtered=accounts.filter(account=>{
      if(q&&!`${account.name} ${account.email} ${account.id}`.toLowerCase().includes(q))return false;
      if(planFilter!=='all'&&account.plan!==planFilter)return false;
      if(statusFilter==='active'&&!account.activeNow)return false;
      if(statusFilter==='inactive'&&(account.activeNow||account.disabled))return false;
      if(statusFilter==='disabled'&&!account.disabled)return false;
      return true;
    });
    return filtered.sort((a,b)=>{
      if(sortMode==='name')return (a.name||a.email).localeCompare(b.name||b.email,'de');
      if(sortMode==='created')return (b.createdAt||0)-(a.createdAt||0);
      return (b.lastSeenAt||b.createdAt||0)-(a.lastSeenAt||a.createdAt||0);
    });
  },[accounts,query,statusFilter,planFilter,sortMode]);

  const activeCount=accounts.filter(account=>account.activeNow).length;
  const proCount=accounts.filter(account=>account.plan==='pro').length;
  const disabledCount=accounts.filter(account=>account.disabled).length;

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
    try {
      const data=await requestJson<{context:AdminContext}>('/api/preview/admin/context');
      setContext(data.context);
      await loadAccounts();
      setMode('admin');
    } catch(reason) {
      const message=reason instanceof Error?reason.message:'Admin-Anmeldung erforderlich.';
      if(/Anmeldung erforderlich|401|anmeld/i.test(message)){setMode('login');return;}
      setError(message);setMode('login');
    }
  }

  async function loadAccounts(preferredId?:string) {
    const data=await requestJson<{accounts:PlatformAccount[];activeWindowMinutes?:number}>('/api/preview/admin/accounts');
    const next=Array.isArray(data.accounts)?data.accounts:[];
    setAccounts(next);
    setActiveWindowMinutes(Number(data.activeWindowMinutes)||15);
    const id=preferredId||selected?.id;
    if(id) {
      const row=next.find(account=>account.id===id);
      if(row)setSelected(row);
    }
  }

  async function openAccount(id:string) {
    setBusy(true);setError('');
    try {
      const data=await requestJson<{account:PlatformAccount}>(`/api/preview/admin/accounts/${encodeURIComponent(id)}`);
      setSelected(data.account);
      setAccounts(current=>current.map(account=>account.id===id?data.account:account));
    } catch(reason) {
      setError(reason instanceof Error?reason.message:'Konto konnte nicht geladen werden.');
    } finally {setBusy(false);}
  }

  async function login(event:React.FormEvent) {
    event.preventDefault();if(busy)return;
    setBusy(true);setError('');
    try {
      await requestJson('/api/admin/login',{method:'POST',body:{username,password}});
      setPassword('');
      await bootstrap();
    } catch(reason) {
      const message=reason instanceof Error?reason.message:'Admin-Anmeldung fehlgeschlagen.';
      setError(window.location.hostname.endsWith('.workers.dev')?'Der geschützte Admin-Login ist nur über vocabfast.net verfügbar.':message);
      setMode('login');
    } finally {setBusy(false);}
  }

  async function logout() {
    setBusy(true);
    try{await requestJson('/api/admin/logout',{method:'POST'});}catch{/* Session wird in der Oberfläche trotzdem verworfen. */}
    setContext(null);setAccounts([]);setSelected(null);setMode('login');setBusy(false);
  }

  async function saveAccount(event:React.FormEvent<HTMLFormElement>) {
    event.preventDefault();if(!selected)return;
    const form=new FormData(event.currentTarget);
    const payload:Record<string,unknown>={};
    if(can('users.edit')) {
      payload.name=String(form.get('name')||'').trim();
      payload.email=String(form.get('email')||'').trim();
      payload.adminNote=String(form.get('adminNote')||'').trim();
      payload.disabled=form.get('disabled')==='on';
    }
    if(can('plans.manage'))payload.plan=form.get('plan')==='pro'?'pro':'free';
    setBusy(true);setError('');
    try {
      const data=await requestJson<{account:PlatformAccount}>(`/api/preview/admin/accounts/${encodeURIComponent(selected.id)}`,{method:'PATCH',body:payload,adminWrite:true});
      setSelected(data.account);
      setAccounts(current=>current.map(account=>account.id===data.account.id?data.account:account));
      flash('Kontodaten gespeichert.');
    } catch(reason) {
      setError(reason instanceof Error?reason.message:'Änderungen konnten nicht gespeichert werden.');
    } finally {setBusy(false);}
  }

  async function revokeSessions() {
    if(!selected||!can('security.manage'))return;
    if(!window.confirm('Alle Anmeldungen dieses Kontos wirklich beenden?'))return;
    setBusy(true);setError('');
    try {
      await requestJson(`/api/preview/admin/accounts/${encodeURIComponent(selected.id)}/sessions`,{method:'DELETE',adminWrite:true});
      await loadAccounts(selected.id);flash('Alle Sitzungen wurden beendet.');
    } catch(reason) {setError(reason instanceof Error?reason.message:'Sitzungen konnten nicht beendet werden.');}
    finally{setBusy(false);}
  }

  async function resetPassword(event:React.FormEvent<HTMLFormElement>) {
    event.preventDefault();if(!selected||!can('security.manage'))return;
    const form=new FormData(event.currentTarget),temporaryPassword=String(form.get('temporaryPassword')||'');
    if(temporaryPassword.length<12){setError('Das temporäre Passwort muss mindestens 12 Zeichen lang sein.');return;}
    if(!window.confirm('Temporäres Passwort setzen und alle bestehenden Sitzungen beenden?'))return;
    setBusy(true);setError('');
    try {
      await requestJson(`/api/preview/admin/accounts/${encodeURIComponent(selected.id)}/password`,{method:'POST',body:{temporaryPassword},adminWrite:true});
      event.currentTarget.reset();await loadAccounts(selected.id);flash('Temporäres Passwort gesetzt.');
    } catch(reason) {setError(reason instanceof Error?reason.message:'Passwort konnte nicht geändert werden.');}
    finally{setBusy(false);}
  }

  async function resetProgress() {
    if(!selected||!can('progress.edit'))return;
    if(!window.confirm('Den gesamten gespeicherten Lernstand dieses Kontos wirklich zurücksetzen?'))return;
    setBusy(true);setError('');
    try {
      await requestJson(`/api/preview/admin/accounts/${encodeURIComponent(selected.id)}/state`,{method:'DELETE',adminWrite:true});
      await openAccount(selected.id);flash('Lernstand zurückgesetzt.');
    } catch(reason) {setError(reason instanceof Error?reason.message:'Lernstand konnte nicht zurückgesetzt werden.');}
    finally{setBusy(false);}
  }

  async function deleteAccount() {
    if(!selected||!can('accounts.manage'))return;
    if(!window.confirm(`Konto ${selected.email} wirklich endgültig löschen?`))return;
    if(!window.confirm('Diese Aktion kann nicht rückgängig gemacht werden. Fortfahren?'))return;
    setBusy(true);setError('');
    try {
      await requestJson(`/api/preview/admin/accounts/${encodeURIComponent(selected.id)}`,{method:'DELETE',adminWrite:true});
      setSelected(null);await loadAccounts();flash('Konto endgültig gelöscht.');
    } catch(reason) {setError(reason instanceof Error?reason.message:'Konto konnte nicht gelöscht werden.');}
    finally{setBusy(false);}
  }

  if(mode==='loading')return <div className="admin-shell center"><div className="admin-loader"/><p>Geschützten Adminzugang prüfen …</p></div>;

  if(mode==='login')return <div className="admin-shell login-shell">
    <a className="admin-back" href="/">← VocabFast</a>
    <form className="admin-login-card" onSubmit={login}>
      <div className="admin-login-mark">V</div><span>GESCHÜTZTER BEREICH</span><h1>VocabFast Admin</h1>
      <p>Der Verwaltungsbereich verwendet eine eigene serverseitige Admin-Sitzung. Normale Nutzerkonten erhalten hier keinen Zugriff.</p>
      <label><span>Benutzername</span><input autoComplete="username" value={username} onChange={event=>setUsername(event.target.value)}/></label>
      <label><span>Passwort</span><input type="password" autoComplete="current-password" value={password} onChange={event=>setPassword(event.target.value)}/></label>
      {error&&<div className="admin-error">{error}</div>}
      <button disabled={busy||!username||!password}>{busy?'Anmeldung …':'Sicher anmelden →'}</button>
      <small>Transportverschlüsselung über HTTPS · Session-Cookie HttpOnly/Secure · Admin-APIs serverseitig geprüft</small>
    </form>
  </div>;

  if(mode==='error')return <div className="admin-shell center"><h1>Adminbereich nicht erreichbar</h1><p>{error}</p><button className="admin-retry" onClick={()=>void bootstrap()}>Erneut versuchen</button></div>;

  return <div className="admin-shell">
    <header className="admin-top">
      <div className="admin-brand"><span>V</span><div><strong>VocabFast Admin</strong><small>{context?.superadmin?'Superadmin':'Verwaltung'}</small></div></div>
      <div className="admin-top-actions"><span>{context?.name||context?.username||context?.email||'Admin'}</span><a href="/">Lernplattform</a><button onClick={()=>void logout()} disabled={busy}>Abmelden</button></div>
    </header>

    <main className="admin-main">
      <section className="admin-hero compact"><div><span>ADMIN KONSOLE</span><h1>Konten und Aktivität im Blick behalten.</h1><p>„Aktiv“ bedeutet: Das Konto hat innerhalb der letzten {activeWindowMinutes} Minuten eine gültige Sitzung verwendet. Alle Änderungen laufen über geschützte Admin-Endpunkte und werden nicht im Browser allein freigeschaltet.</p></div><div className="admin-security-badge"><b>LOCKED</b><span>server-side auth</span></div></section>
      {notice&&<div className="admin-notice">✓ {notice}</div>}{error&&<div className="admin-global-error">{error}</div>}

      <div className="admin-metrics">
        <article><span>Registriert</span><strong>{accounts.length}</strong><small>alle Plattformkonten</small></article>
        <article><span>Aktuell aktiv</span><strong>{activeCount}</strong><small>letzte {activeWindowMinutes} Minuten</small></article>
        <article><span>Pro</span><strong>{proCount}</strong><small>freigeschaltete Konten</small></article>
        <article><span>Gesperrt</span><strong>{disabledCount}</strong><small>kein Login möglich</small></article>
      </div>

      <section className="admin-console">
        <aside className="admin-user-list-panel">
          <div className="admin-user-list-head"><div><span>ACCOUNTS</span><strong>{filteredAccounts.length}/{accounts.length}</strong></div><button onClick={()=>void loadAccounts()} disabled={busy} title="Aktualisieren">↻</button></div>
          <input className="admin-search" type="search" placeholder="Name, E-Mail oder ID suchen …" value={query} onChange={event=>setQuery(event.target.value)}/>
          <div className="admin-filter-grid">
            <select value={statusFilter} onChange={event=>setStatusFilter(event.target.value as StatusFilter)}><option value="all">Alle Status</option><option value="active">Aktuell aktiv</option><option value="inactive">Inaktiv</option><option value="disabled">Gesperrt</option></select>
            <select value={planFilter} onChange={event=>setPlanFilter(event.target.value as PlanFilter)}><option value="all">Free & Pro</option><option value="free">Nur Free</option><option value="pro">Nur Pro</option></select>
            <select value={sortMode} onChange={event=>setSortMode(event.target.value as SortMode)}><option value="activity">Letzte Aktivität</option><option value="created">Neu registriert</option><option value="name">Name A–Z</option></select>
          </div>
          <div className="admin-user-list">
            {filteredAccounts.map(account=><button key={account.id} className={selected?.id===account.id?'active':''} onClick={()=>void openAccount(account.id)}>
              <span className="admin-avatar">{(account.name||account.email||'VF').slice(0,2).toUpperCase()}</span>
              <span className="admin-user-copy"><strong>{account.name||account.email}</strong><small>{account.email}</small><em><i className={account.activeNow?'online':'offline'}/>{account.disabled?'Gesperrt':account.activeNow?'Aktiv':relativeActivity(account.lastSeenAt)} · {account.plan.toUpperCase()} · {account.xp.toLocaleString('de-AT')} XP</em></span>
            </button>)}
            {!filteredAccounts.length&&<div className="admin-empty compact"><strong>Keine Treffer</strong><span>Filter oder Suche anpassen.</span></div>}
          </div>
        </aside>

        <section className="admin-workspace">
          {!selected?<div className="admin-empty"><strong>Konto auswählen</strong><span>Links ein Konto öffnen, um Daten, Plan, Zugang und Lernstand zu verwalten.</span></div>:<>
            <div className="admin-profile-head">
              <div className="admin-avatar large">{(selected.name||selected.email||'VF').slice(0,2).toUpperCase()}</div>
              <div><span><i className={selected.activeNow?'online':'offline'}/>{selected.disabled?'GESPERRT':selected.activeNow?'AKTUELL AKTIV':'INAKTIV'}</span><h2>{selected.name||selected.email}</h2><p>{selected.email} · registriert {fmtDate(selected.createdAt)}</p></div>
              <b className={selected.plan==='pro'?'pro':''}>{selected.plan.toUpperCase()}</b>
            </div>

            <div className="admin-detail-grid">
              <article className="admin-detail-card admin-learning-summary"><div className="admin-card-head"><div><span>AKTIVITÄT</span><h3>Nutzung & Lernstand</h3></div><button type="button" onClick={()=>void openAccount(selected.id)} disabled={busy}>Aktualisieren</button></div>
                <div className="admin-account-metrics"><div><span>Letzte Aktivität</span><strong>{relativeActivity(selected.lastSeenAt)}</strong><small>{fmtDateTime(selected.lastSeenAt)}</small></div><div><span>Offene Sitzungen</span><strong>{selected.sessionCount}</strong><small>gültige Logins</small></div><div><span>XP</span><strong>{selected.xp.toLocaleString('de-AT')}</strong><small>{selected.learningSessions} Lern-Sessions</small></div><div><span>Lektionen</span><strong>{selected.lessons}</strong><small>Streak {selected.streak}</small></div><div><span>Aktives Level</span><strong>{selected.activeLevel||'A1'}</strong><small>Lernpfad</small></div><div><span>Einstufung</span><strong>{selected.placementLevel||'–'}</strong><small>{selected.placementTotal?`${selected.placementScore}/${selected.placementTotal}`:'noch nicht absolviert'}</small></div></div>
              </article>

              <form className="admin-detail-card" onSubmit={saveAccount}><div className="admin-card-head"><div><span>KONTO</span><h3>Kontodaten ändern</h3></div><small>ID {selected.id.slice(0,8)}…</small></div>
                <div className="admin-form-grid"><label><span>Name</span><input name="name" defaultValue={selected.name} disabled={!can('users.edit')}/></label><label><span>E-Mail</span><input name="email" type="email" defaultValue={selected.email} disabled={!can('users.edit')}/></label><label><span>Plan</span><select name="plan" defaultValue={selected.plan} disabled={!can('plans.manage')}><option value="free">Free</option><option value="pro">Pro</option></select></label><label className="admin-check"><input name="disabled" type="checkbox" defaultChecked={selected.disabled} disabled={!can('users.edit')}/><span>Konto sperren</span></label><label className="full"><span>Interne Notiz</span><textarea name="adminNote" rows={4} defaultValue={selected.adminNote||''} disabled={!can('users.edit')} placeholder="Nur für die Verwaltung sichtbar"/></label></div>
                <div className="admin-actions"><button className="primary" disabled={busy||(!can('users.edit')&&!can('plans.manage'))}>Änderungen speichern</button></div>
              </form>

              <article className="admin-detail-card"><div className="admin-card-head"><div><span>SICHERHEIT</span><h3>Sitzungen & Passwort</h3></div></div><p className="admin-card-copy">Sicherheitsaktionen werden serverseitig geprüft. Passwortwerte werden nicht aus dem Account-Speicher ausgelesen oder im Adminbereich angezeigt.</p><div className="admin-actions"><button type="button" onClick={()=>void revokeSessions()} disabled={busy||!can('security.manage')}>Alle Sitzungen abmelden</button><button type="button" onClick={()=>void resetProgress()} disabled={busy||!can('progress.edit')}>Lernstand zurücksetzen</button></div><form className="admin-password-form" onSubmit={resetPassword}><label><span>Temporäres Passwort</span><input type="password" name="temporaryPassword" minLength={12} autoComplete="new-password" placeholder="mindestens 12 Zeichen" disabled={!can('security.manage')}/></label><button disabled={busy||!can('security.manage')}>Temporäres Passwort setzen</button></form></article>

              <article className="admin-detail-card danger-zone"><div className="admin-card-head"><div><span>GEFAHRENZONE</span><h3>Konto endgültig löschen</h3></div></div><p>Entfernt Konto, gespeicherten Lernstand und alle zugehörigen Plattform-Sitzungen. Diese Aktion kann nicht rückgängig gemacht werden.</p><button type="button" className="danger" onClick={()=>void deleteAccount()} disabled={busy||!can('accounts.manage')}>Konto endgültig löschen</button></article>
            </div>
          </>}
        </section>
      </section>

      <section className="admin-release-panel"><div><span>PLATTFORMSTATUS</span><h2>Release-Infrastruktur</h2><p>{stats.levels} CEFR-Stufen · {stats.units} Units · {stats.lessons} Lektionen · {stats.exercises} Übungen im aktuellen Build.</p></div><div className="admin-security-lines"><span>✓ Admin nicht in der Kunden-Navigation verlinkt</span><span>✓ noindex / nofollow</span><span>✓ HttpOnly/Secure Admin-Session</span><span>✓ Schreibzugriffe mit Berechtigungsprüfung</span></div></section>
    </main>
  </div>;
}
