import platform from './preview-entry.js';
import { aiAssistantApi } from './ai-assistant-service.js';
export { PreviewAccountStore, PlatformAnalyticsStore } from './preview-entry.js';

export default {
  async fetch(request,env,ctx){
    const url=new URL(request.url);
    if(url.pathname==='/api/platform/assistant')return aiAssistantApi(request,env);
    return platform.fetch(request,env,ctx);
  }
};
