(() => {
  'use strict';

  const SEARCH_IDS = ['topicSearch', 'wordSearch', 'learnSearch', 'pdfWordSearch'];

  function emitInput(el) {
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function clearCredentialAutofill(el) {
    if (!el || el.dataset.vfSearchTouched === '1') return;
    const value = String(el.value || '').trim();
    if (!value) return;
    const loginEmail = String(document.querySelector('#loginEmail')?.value || '').trim().toLowerCase();
    const registerEmail = String(document.querySelector('#registerEmail')?.value || '').trim().toLowerCase();
    const lower = value.toLowerCase();
    if (value.includes('@') || (loginEmail && lower === loginEmail) || (registerEmail && lower === registerEmail)) {
      el.value = '';
      emitInput(el);
    }
  }

  function protectSearch(el) {
    if (!el || el.dataset.vfAutofillProtected === '1') return;
    el.dataset.vfAutofillProtected = '1';
    el.setAttribute('type', 'search');
    el.setAttribute('autocomplete', 'off');
    el.setAttribute('autocorrect', 'off');
    el.setAttribute('autocapitalize', 'none');
    el.setAttribute('spellcheck', 'false');
    el.setAttribute('name', `vf-filter-${el.id}`);
    el.setAttribute('readonly', 'readonly');

    const unlock = () => {
      clearCredentialAutofill(el);
      el.dataset.vfSearchTouched = '1';
      el.removeAttribute('readonly');
    };

    el.addEventListener('pointerdown', unlock, { once: true });
    el.addEventListener('focus', unlock, { once: true });
    el.addEventListener('keydown', unlock, { once: true });

    // Chromium password managers sometimes inject credentials shortly after page load.
    // Clear only credential-looking values while the user has not interacted with the search field.
    [0, 100, 350, 800, 1600, 3000].forEach(ms => setTimeout(() => clearCredentialAutofill(el), ms));
  }

  function init() {
    SEARCH_IDS.forEach(id => protectSearch(document.getElementById(id)));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
  window.addEventListener('load', init, { once: true });
})();
