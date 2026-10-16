import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import { AppErrorBoundary, ConnectivityGuard } from './components/AppGuard';
import { registerPwa } from './pwa';
import './data/level-vocabulary-extra';
import './styles.css';
import './accessibility.css';
import './deferred-loading.css';
import './admin/admin-usage.css';
import './premium-polish.css';
import './redesign-2026.css';
import './modern-ui.css';

const adminRoute=location.pathname.startsWith('/admin');
const App=lazy(()=>import('./App'));
const AdminPortal=lazy(()=>import('./admin/AdminPortal'));
const AiAssistant=lazy(()=>import('./components/AiAssistant'));
if(!adminRoute)registerPwa();
function LoadingShell(){return <div className="platform-loading"><div><i/><strong>VocabFast wird geladen …</strong></div></div>;}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppErrorBoundary>
      {!adminRoute&&<ConnectivityGuard/>}
      {adminRoute?<Suspense fallback={<LoadingShell/>}><AdminPortal/></Suspense>:<Suspense fallback={<LoadingShell/>}><App/><Suspense fallback={null}><AiAssistant/></Suspense></Suspense>}
    </AppErrorBoundary>
  </React.StrictMode>
);