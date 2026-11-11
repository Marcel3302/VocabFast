const CACHE_PREFIX='vocabfast-platform-shell-';
const ACTIVE_CACHE='vocabfast-platform-shell-v2';

async function clearLegacyPwaCaches() {
  if(!('caches' in window))return;
  try {
    const keys=await caches.keys();
    await Promise.all(keys.filter(key=>key.startsWith(CACHE_PREFIX)&&key!==ACTIVE_CACHE).map(key=>caches.delete(key)));
  } catch {
    // Cache cleanup is best effort; the app must still start normally.
  }
}

export function registerPwa() {
  if (!('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    void clearLegacyPwaCaches().finally(()=>{
      navigator.serviceWorker.register('/sw.js',{scope:'/'}).then(registration=>registration.update()).catch(() => {
        // The app still works normally when service workers are unavailable.
      });
    });
  });
}
