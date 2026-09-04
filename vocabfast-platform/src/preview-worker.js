const securityHeaders = {
  'X-Content-Type-Options':'nosniff',
  'Referrer-Policy':'strict-origin-when-cross-origin',
  'Permissions-Policy':'camera=(), geolocation=(), microphone=(self), payment=()',
  'X-Robots-Tag':'noindex, nofollow, noarchive'
};

function json(data,status=200) {
  return new Response(JSON.stringify(data),{
    status,
    headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...securityHeaders}
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/preview/health') {
      return json({ ok:true, service:'vocabfast-language-preview', environment:'preview' });
    }

    if (url.pathname.startsWith('/api/')) {
      return json({ error:'Dieser isolierte Preview-Worker stellt keine Produktions-API bereit.' },404);
    }

    const response = await env.ASSETS.fetch(request);
    const headers = new Headers(response.headers);
    for (const [key,value] of Object.entries(securityHeaders)) headers.set(key,value);
    headers.set('Cache-Control', url.pathname.includes('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache');
    return new Response(response.body,{ status:response.status, statusText:response.statusText, headers });
  }
};
