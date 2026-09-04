import { useEffect, useMemo, useState } from 'react';
import { courseStats, englishCourseLevels } from '../learning/curriculum';
import { previewBilling } from '../learning/billing';
import './admin.css';

type Admin = { username:string; role?:string };
type UserRow = { id:string; email?:string; name?:string; effectivePlan?:string; plan?:string; createdAt?:number; words?:number; xp?:number; disabled?:boolean };
type Mode = 'loading'|'preview'|'login'|'admin'|'error';

function fmtDate(value?:number) {
  if(!value)return '–';
  try{return new Intl.DateTimeFormat('de-AT',{dateStyle:'medium'}).format(new Date(value));}catch{return '–';}
}

export default function AdminPortal() {
  const [mode,setMode]=useState<Mode>('loading');
  const [admin,setAdmin]=useState<Admin|null>(null);
  const [users,setUsers]=useState<UserRow[]>([]);
  const [username,setUsername]=useState('admin');
  const [password,setPassword]=useState('');
  const [error,setError]=useState('');
  const [busy,setBusy]=useState(false);
  const stats=useMemo(()=>courseStats(),[]);

  useEffect(()=>{
    document.title='VocabFast Admin';
    let robots=document.querySelector('meta[name="robots"]') as HTMLMetaElement|null;
    if(!robots){robots=document.createElement('meta');robots.name='robots';document.head.appendChild(robots);}
    robots.content='noindex,nofollow,noarchive';
    void bootstrap();
  },[]);

  async function bootstrap() {
    setMode('loading');setError('');
    try{
      const health=await fetch('/api/preview/health',{credentials:'same-origin'});
      if(health.ok){
        const data=await health.json() as {environment?:string};
        if(data.environment==='preview'){setMode('preview');return;}
      }
    }catch{/* production has no preview health endpoint */}
    try{
      const response=await fetch('/api/admin/me',{credentials:'same-origin',headers:{Accept:'application/json'}});
      if(!response.ok){setMode('login');return;}
      const data=await response.json() as {admin?:Admin|null};
      if(!data.admin){setMode('login');return;}
      setAdmin(data.admin);await loadUsers();setMode('admin');
    }catch{setMode('error');setError('Der Admin-Server ist derzeit nicht erreichbar.');}
  }

  async function loadUsers() {
    const response=await fetch('/api/admin/users',{credentials:'same-origin',headers:{Accept:'application/json'}});
    if(!response.ok)throw new Error('Benutzer konnten nicht geladen werden.');
    const data=await response.json() as {users?:UserRow[]};
    setUsers(Array.isArray(data.users)?data.users:[]);
  }

  async function login(event:React.FormEvent) {
    event.preventDefault();if(busy)return;
    setBusy(true);setError('');
    try{
      const response=await fetch('/api/admin/login',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({username,password})});
      const data=await response.json() as {admin?:Admin;error?:string};
      if(!response.ok||!data.admin)throw new Error(data.error||'Admin-Anmeldung fehlgeschlagen.');
      setAdmin(data.admin);setPassword('');await loadUsers();setMode('admin');
    }catch(reason){setError(reason instanceof Error?reason.message:'Admin-Anmeldung fehlgeschlagen.');}
    finally{setBusy(false);}
  }

  async function logout() {
    setBusy(true);
    try{await fetch('/api/admin/logout',{method:'POST',credentials:'same-origin'});}catch{/* local session still cleared by UI */}
    setAdmin(null);setUsers([]);setMode('login');setBusy(false);
  }

  if(mode==='loading')return <div className="admin-shell center"><div className="admin-loader"/><p>Adminbereich wird geprüft …</p></div>;

  if(mode==='preview')return <div className="admin-shell">
    <header className="admin-top"><div className="admin-brand"><span>V</span><div><strong>VocabFast Admin</strong><small>Language Platform Preview</small></div></div><a href="/">← Zur Lernplattform</a></header>
    <main className="admin-main"><section className="admin-hero"><div><span>ISOLIERTE VORSCHAU</span><h1>Adminbereich ist vorhanden – Nutzerdaten bleiben hier bewusst getrennt.</h1><p>Die Cloudflare-Preview besitzt keine Produktionssessions, keine R2-Benutzerdaten und keine Admin-Secrets. Auf der späteren produktiven Plattform verwendet dieselbe Oberfläche die geschützten <code>/api/admin/*</code>-Endpunkte.</p></div><div className="admin-preview-badge"><strong>PREVIEW</strong><span>read only</span></div></section>
      <div className="admin-metrics"><article><span>CEFR-Stufen</span><strong>{stats.levels}</strong><small>A1–C2</small></article><article><span>Units</span><strong>{stats.units}</strong><small>aktuell spielbar</small></article><article><span>Lektionen</span><strong>{stats.lessons}</strong><small>Entwicklungsstand</small></article><article><span>Aufgaben</span><strong>{stats.exercises}</strong><small>inkl. Active Recall</small></article></div>
      <section className="admin-panel"><div className="admin-panel-head"><div><span>KURSSTATUS</span><h2>Content-Pipeline</h2></div><small>keine produktiven Kundendaten</small></div><div className="admin-level-table">{englishCourseLevels.map(level=><div key={level.id}><b>{level.id}</b><span><strong>{level.title}</strong><small>{level.units.length}/{level.productionTargetUnits} Ziel-Units</small></span><em>{level.units.flatMap(unit=>unit.lessons).length} Lektionen</em></div>)}</div></section>
      <section className="admin-panel"><div className="admin-panel-head"><div><span>BILLING</span><h2>Stripe Preview</h2></div><small>TESTMODE</small></div><div className="admin-billing-row"><div><strong>{previewBilling.plan}</strong><span>{previewBilling.monthlyPriceEur.toFixed(2).replace('.',',')} € / Monat</span></div><div><strong>Stripe Test Checkout</strong><span>Kein Live-Umsatz · kein Pro-Entitlement in dieser Preview</span></div></div></section>
    </main></div>;

  if(mode==='login')return <div className="admin-shell login-shell"><a className="admin-back" href="/">← VocabFast</a><form className="admin-login-card" onSubmit={login}><div className="admin-login-mark">V</div><span>GESCHÜTZTER BEREICH</span><h1>VocabFast Admin</h1><p>Separater Administrator-Zugang. Normale Benutzeranmeldungen funktionieren hier nicht.</p><label><span>Benutzername</span><input autoComplete="username" value={username} onChange={event=>setUsername(event.target.value)}/></label><label><span>Passwort</span><input type="password" autoComplete="current-password" value={password} onChange={event=>setPassword(event.target.value)}/></label>{error&&<div className="admin-error">{error}</div>}<button disabled={busy||!username||!password}>{busy?'Anmeldung …':'Sicher anmelden →'}</button></form></div>;

  if(mode==='error')return <div className="admin-shell center"><h1>Adminbereich nicht erreichbar</h1><p>{error}</p><button className="admin-retry" onClick={()=>void bootstrap()}>Erneut versuchen</button></div>;

  const proUsers=users.filter(user=>(user.effectivePlan||user.plan)==='pro').length;
  return <div className="admin-shell"><header className="admin-top"><div className="admin-brand"><span>V</span><div><strong>VocabFast Admin</strong><small>Produktionsverwaltung</small></div></div><div className="admin-top-actions"><span>{admin?.username||'admin'}</span><button onClick={()=>void logout()} disabled={busy}>Abmelden</button></div></header><main className="admin-main"><section className="admin-hero compact"><div><span>ADMIN KONSOLE</span><h1>Benutzer, Pläne und Plattformstatus an einem Ort.</h1><p>Diese Ansicht liest ausschließlich geschützte Admin-APIs. Sensible Aktionen werden nicht in die öffentliche Lernoberfläche eingebaut.</p></div></section><div className="admin-metrics"><article><span>Benutzer</span><strong>{users.length}</strong><small>Konten</small></article><article><span>Pro</span><strong>{proUsers}</strong><small>aktive Pläne</small></article><article><span>Free</span><strong>{Math.max(0,users.length-proUsers)}</strong><small>Konten</small></article><article><span>Gesperrt</span><strong>{users.filter(user=>user.disabled).length}</strong><small>Konten</small></article></div><section className="admin-panel"><div className="admin-panel-head"><div><span>BENUTZER</span><h2>Kontenübersicht</h2></div><button onClick={()=>void loadUsers()}>Aktualisieren</button></div><div className="admin-users-table"><div className="admin-user-row header"><span>Name</span><span>E-Mail</span><span>Plan</span><span>XP</span><span>Erstellt</span></div>{users.map(user=><div className="admin-user-row" key={user.id}><span><strong>{user.name||'–'}</strong><small>{user.disabled?'Gesperrt':'Aktiv'}</small></span><span>{user.email||'–'}</span><span><b>{(user.effectivePlan||user.plan||'free').toUpperCase()}</b></span><span>{Number(user.xp||0).toLocaleString('de-AT')}</span><span>{fmtDate(user.createdAt)}</span></div>)}</div></section></main></div>;
}
