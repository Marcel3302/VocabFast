/**
 * VocabFast Cloudflare Worker
 * - Serves the static app from ./public via the ASSETS binding
 * - Handles /api/translate and /api/example directly in the Worker
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/health') {
      return json({
        ok: true,
        service: 'vocabfast-worker',
        translation: true,
        deepLConfigured: Boolean(env.DEEPL_API_KEY)
      }, 200);
    }

    if (url.pathname === '/api/translate') {
      if (request.method === 'OPTIONS') return optionsResponse();
      if (!['GET', 'POST'].includes(request.method)) return json({ error: 'Methode nicht erlaubt.' }, 405);
      return handleTranslation(request, env);
    }

    if (url.pathname === '/api/example') {
      if (request.method !== 'GET') return json({ error: 'Methode nicht erlaubt.' }, 405);
      return handleExample(url);
    }

    return env.ASSETS.fetch(request);
  }
};

async function handleTranslation(request, env) {
  let input = {};
  if (request.method === 'GET') {
    const url = new URL(request.url);
    input = {
      text: url.searchParams.get('q') || '',
      source: url.searchParams.get('source') || 'EN',
      target: url.searchParams.get('target') || 'DE',
      context: url.searchParams.get('context') || ''
    };
  } else {
    try {
      input = await request.json();
    } catch (_) {
      return json({ error: 'Ungültige Anfrage.' }, 400);
    }
  }

  const text = String(input.text || input.q || '').trim();
  const source = normalizeLanguage(input.source || 'EN');
  const target = normalizeLanguage(input.target || 'DE');
  const subjectContext = String(input.context || '').trim().slice(0, 1200);

  if (!text) return json({ error: 'Bitte einen Text eingeben.' }, 400);
  if (text.length > 500) return json({ error: 'Bitte maximal 500 Zeichen pro Übersetzung verwenden.' }, 400);
  if (!['EN', 'DE'].includes(source) || !['EN', 'DE'].includes(target) || source === target) {
    return json({ error: 'Diese Version unterstützt Englisch ↔ Deutsch.' }, 400);
  }

  const errors = [];

  // Best option for reliable specialist vocabulary: official DeepL API.
  // Configure DEEPL_API_KEY as a Cloudflare Worker secret; never commit it to GitHub.
  if (env.DEEPL_API_KEY) {
    try {
      const translation = await translateWithDeepL(env, text, source, target, subjectContext);
      if (translation) {
        return json({ translation, provider: 'deepl', contextApplied: Boolean(subjectContext), source, target }, 200);
      }
    } catch (error) {
      errors.push(`DeepL: ${errorMessage(error)}`);
    }
  }

  // Public fallbacks are not tied to the VocabFast word list. They can translate
  // new words and specialist terms, subject to the availability/limits of the provider.
  try {
    const translation = await translateWithGoogleFallback(text, source, target);
    if (translation) return json({ translation, provider: 'google-fallback', contextApplied: false, source, target }, 200);
  } catch (error) {
    errors.push(`Google: ${errorMessage(error)}`);
  }

  try {
    const translation = await translateWithMyMemory(text, source, target);
    if (translation) return json({ translation, provider: 'mymemory', contextApplied: false, source, target }, 200);
  } catch (error) {
    errors.push(`MyMemory: ${errorMessage(error)}`);
  }

  return json({
    error: 'Der Übersetzungsserver ist erreichbar, aber aktuell konnte kein externer Übersetzungsdienst antworten. Für zuverlässige Fachübersetzungen kannst du optional einen DEEPL_API_KEY als Worker-Secret hinterlegen.',
    detail: errors.join(' | ')
  }, 502);
}

async function translateWithDeepL(env, text, source, target, subjectContext) {
  const key = String(env.DEEPL_API_KEY || '').trim();
  const endpoint = String(env.DEEPL_API_URL || '').trim() ||
    (key.endsWith(':fx') ? 'https://api-free.deepl.com/v2/translate' : 'https://api.deepl.com/v2/translate');

  const payload = {
    text: [text],
    source_lang: source,
    target_lang: target,
    preserve_formatting: true
  };
  if (subjectContext) payload.context = subjectContext;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `DeepL-Auth-Key ${key}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`HTTP ${response.status}${detail ? ` – ${detail.slice(0, 180)}` : ''}`);
  }

  const data = await response.json();
  return cleanTranslation(data?.translations?.[0]?.text || '');
}

async function translateWithGoogleFallback(text, source, target) {
  const sl = source.toLowerCase();
  const tl = target.toLowerCase();
  const endpoint = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(sl)}&tl=${encodeURIComponent(tl)}&dt=t&q=${encodeURIComponent(text)}`;
  const response = await fetch(endpoint, {
    headers: { 'Accept': 'application/json' },
    cf: { cacheTtl: 3600, cacheEverything: true }
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  const chunks = Array.isArray(data?.[0])
    ? data[0].map(x => Array.isArray(x) ? x[0] : '').filter(Boolean)
    : [];
  return cleanTranslation(chunks.join(' '));
}

async function translateWithMyMemory(text, source, target) {
  const langpair = `${source.toLowerCase()}|${target.toLowerCase()}`;
  const endpoint = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${encodeURIComponent(langpair)}`;
  const response = await fetch(endpoint, {
    headers: { 'Accept': 'application/json', 'User-Agent': 'VocabFast/0.7' },
    cf: { cacheTtl: 3600, cacheEverything: true }
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  return cleanTranslation(decodeEntities(data?.responseData?.translatedText || ''));
}

async function handleExample(url) {
  const q = (url.searchParams.get('q') || '').trim();
  if (!q) return json({ error: 'Missing q parameter' }, 400);
  if (q.length > 60 || !/^[A-Za-z][A-Za-z'’-]*$/.test(q)) return json({ example: exampleFallback(q) }, 200, 86400);

  try {
    const endpoint = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(q)}`;
    const response = await fetch(endpoint, { cf: { cacheTtl: 604800, cacheEverything: true } });
    if (!response.ok) return json({ example: exampleFallback(q) }, 200, 86400);
    const data = await response.json();
    const examples = [];
    for (const entry of Array.isArray(data) ? data : []) {
      for (const meaning of entry.meanings || []) {
        for (const definition of meaning.definitions || []) {
          if (definition.example && typeof definition.example === 'string') examples.push(definition.example.trim());
        }
      }
    }
    const lower = q.toLowerCase();
    const example = examples.find(x => x.toLowerCase().includes(lower)) || examples[0] || exampleFallback(q);
    return json({ example: example.length > 180 ? example.slice(0, 177) + '…' : example }, 200, 86400);
  } catch (_) {
    return json({ example: exampleFallback(q) }, 200, 86400);
  }
}

function exampleFallback(word) {
  return `The word “${word}” is useful in everyday English.`;
}

function normalizeLanguage(value) {
  const v = String(value || '').trim().toUpperCase();
  if (v === 'EN-US' || v === 'EN-GB') return 'EN';
  if (v === 'DE-DE' || v === 'DE-AT') return 'DE';
  return v;
}

function cleanTranslation(value) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, 500);
}

function decodeEntities(value) {
  return String(value || '')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&amp;/gi, '&');
}

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

function json(data, status = 200, maxAge = 0) {
  const headers = {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': maxAge ? `public, max-age=${maxAge}` : 'no-store',
    'access-control-allow-origin': '*'
  };
  return new Response(JSON.stringify(data), { status, headers });
}

function optionsResponse() {
  return new Response(null, {
    status: 204,
    headers: {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET, POST, OPTIONS',
      'access-control-allow-headers': 'Content-Type'
    }
  });
}
