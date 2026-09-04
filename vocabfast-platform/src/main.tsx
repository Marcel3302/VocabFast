import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import AdminPortal from './admin/AdminPortal';
import { registerPwa } from './pwa';
import './styles.css';

const adminRoute=window.location.pathname==='/admin'||window.location.pathname.startsWith('/admin/');
if(!adminRoute)registerPwa();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {adminRoute?<AdminPortal/>:<App/>}
  </React.StrictMode>
);
