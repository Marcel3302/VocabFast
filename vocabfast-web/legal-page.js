(() => {
'use strict';
const cfg=window.VOCABFAST_LEGAL||{};
const required=['providerName','addressLine1','postalCode','city','email'];
const missing=required.filter(k=>!String(cfg[k]||'').trim());
const value=k=>String(cfg[k]||'').trim();
document.querySelectorAll('[data-legal]').forEach(el=>{const k=el.dataset.legal,v=value(k);if(v){el.textContent=v;el.classList.remove('legal-missing')}else{el.textContent='—';el.classList.add('legal-missing')}});
document.querySelectorAll('[data-legal-row]').forEach(el=>{const k=el.dataset.legalRow;if(!value(k))el.hidden=true});
document.querySelectorAll('[data-legal-email]').forEach(el=>{const k=el.dataset.legalEmail||'email',v=value(k);if(v){el.textContent=v;el.href=`mailto:${v}`}else{el.textContent='—';el.removeAttribute('href');el.classList.add('legal-missing')}});
document.querySelectorAll('[data-legal-phone]').forEach(el=>{const v=value('phone');if(v){el.textContent=v;el.href=`tel:${v.replace(/\s+/g,'')}`}else{el.closest('[data-legal-row]')?.setAttribute('hidden','')}});
document.querySelectorAll('[data-year]').forEach(el=>el.textContent=String(new Date().getFullYear()));
const warning=document.querySelector('#legalSetupWarning');if(warning){warning.hidden=!missing.length;if(missing.length)warning.innerHTML='<strong>Vor Veröffentlichung vervollständigen:</strong> Anbietername, ladungsfähige Anschrift und öffentliche Kontakt-E-Mail sind noch nicht in <code>legal-config.js</code> hinterlegt.'}
})();
