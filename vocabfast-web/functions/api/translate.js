export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  return handleTranslation(context, {
    text: url.searchParams.get('q') || '',
    source: url.searchParams.get('source') || 'EN',
    target: url.searchParams.get('target') || 'DE',
    context: url.searchParams.get('context') || ''
  });
}

export async function onRequestPost(context) {
  let body = {};
  try { body = await context.request.json(); }
  catch (_) { return json({ error: 'Ungültige Anfrage.' }, 400); }
  return handleTranslation(context, body || {});
}

async function handleTranslation(context, input) {
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

  // 1) Optionaler Produktionsweg: offizieller DeepL-API-Key als Cloudflare Secret.
  if (context.env?.DEEPL_API_KEY) {
    try {
      const translation = await translateWithDeepL(context.env, text, source, target, subjectContext);
      if (translation) return json({ translation, provider: 'deepl', contextApplied: Boolean(subjectContext), source, target }, 200);
    } catch (error) { errors.push(`DeepL: ${errorMessage(error)}`); }
  }

  // 2) Key-loser Prototyp-Fallback. Nicht an eine VocabFast-Wortliste gebunden.
  try {
    const translation = await translateWithGoogleFallback(text, source, target);
    if (translation) return json({ translation, provider: 'google-fallback', contextApplied: false, source, target }, 200);
  } catch (error) { errors.push(`Google: ${errorMessage(error)}`); }

  // 3) Zweiter öffentlicher Fallback.
  try {
    const translation = await translateWithMyMemory(text, source, target);
    if (translation) return json({ translation, provider: 'mymemory', contextApplied: false, source, target }, 200);
  } catch (error) { errors.push(`MyMemory: ${errorMessage(error)}`); }

  return json({
    error: 'Kein Online-Übersetzungsdienst war erreichbar. Das Wort muss nicht in VocabFast vorhanden sein; prüfe bitte das Cloudflare-Functions-Deployment oder hinterlege DEEPL_API_KEY.',
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
  const response = await fetch(endpoint, { cf: { cacheTtl: 3600, cacheEverything: true } });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  const chunks = Array.isArray(data?.[0]) ? data[0].map(x => Array.isArray(x) ? x[0] : '').filter(Boolean) : [];
  return cleanTranslation(chunks.join(' '));
}

async function translateWithMyMemory(text, source, target) {
  const endpoint = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${encodeURIComponent(source.toLowerCase())}%7C${encodeURIComponent(target.toLowerCase())}`;
  const response = await fetch(endpoint, {
    headers: { 'User-Agent': 'VocabFast/0.6' },
    cf: { cacheTtl: 3600, cacheEverything: true }
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  return cleanTranslation(decodeEntities(data?.responseData?.translatedText || ''));
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
    .replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<').replace(/&gt;/gi, '>').replace(/&amp;/gi, '&');
}

function errorMessage(error) { return error instanceof Error ? error.message : String(error); }

function json(data, status) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
  });
}
