import baseWorker from './preview-entry.js';
export { PreviewAccountStore, PlatformAnalyticsStore } from './preview-entry.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === '/api/platform/translate' || url.pathname === '/api/platform/pdf-translate') {
      const module = await import('./translation-service.js');
      return module.robustTranslateApi(request, env, baseWorker, { requirePro: url.pathname.endsWith('/pdf-translate') });
    }
    return baseWorker.fetch(request, env, ctx);
  }
};
