import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { registerPwa } from './pwa';
import './styles.css';
import './accessibility.css';
import './deferred-loading.css';
import './admin/admin-usage.css';

const adminRoute=window.location.pathname==='/admin'||window.location.pathname.startsWith('/admin/');
const AdminPortal=lazy(()=>import('./admin/AdminPortal'));
if(!adminRoute)registerPwa();

function LoadingShell(){return <div className="platform-loading"><div><i/><strong>VocabFast wird geladen …</strong></div></div>;}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {adminRoute?<Suspense fallback={<LoadingShell/>}><AdminPortal/></Suspense>:<App/>}
  </React.StrictMode>
);
