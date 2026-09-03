(() => {
'use strict';
const Native=window.__vfNativeMutationObserver;
if(Native){window.MutationObserver=Native;delete window.__vfNativeMutationObserver}
})();
