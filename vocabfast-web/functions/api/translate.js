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
  try {
    body = await context.request.json();
  } catch (_) {
    return json({ error: 'Invalid JSON body' }, 400);
  }
  return handleTranslation(context, body || {});
}

async function handleTranslation(context, input) {
  const text = String(input.text || input.q || '').trim();
  const source = normalizeLanguage(input.source || 'EN', 'EN');
  const target = normalizeLanguage(input.target || 'DE', 'DE');
  const subjectContext = String(input.context || '').trim().slice(0, 1200);

  if (!text) return json({ error: 'Missing text' }, 400);
  if (text.length > 500) return json({ error: 'Text too long' }, 400);
  if (!['EN', 'DE'].includes(source) || !['EN', 'DE'].includes(target) || source === target) {
    return json({ error: 'Only EN↔DE is supported in this version' }, 400);
  }

  const errors = [];

  // Best quality path: optional DeepL API secret configured in Cloudflare.
  if (context.env && context.env.DEEPL_API_KEY) {
    try {
      const translation = await translateWithDeepL(context.env, text, source, target, subjectContext);
      if (translation) {
        return json({ translation, provider: 'deepl', contextApplied: Boolean(subjectContext) }, 200);
      }
    } catch (error) {
      errors.push(`DeepL: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // No-key fallback. This still translates arbitrary words/phrases and is not tied to VocabFast's word lists.
  try {
    const translation = await translateWithMyMemory(text, source, target);
    if (translation) {
      return json({ translation, provider: 'mymemory', contextApplied: false }, 200);
    }
  } catch (error) {
    errors.push(`MyMemory: ${error instanceof Error ? error.message : String(error)}`);
  }

  return json({ error: 'Translation provider unavailable', detail: errors.join(' | ') }, 502);
}

async function translateWithDeepL(env, text, source, target, subjectContext) {
  const key = String(env.DEEPL_API_KEY || '').trim();
  const endpoint = String(env.DEEPL_API_URL || '').trim() ||
    (key.endsWith(':fx') ? 'https://api-free.deepl.com/v2/translate' : 'https://api.deepl.com/v2/translate');

  const payload = {
    text: [text],
    source_lang: source,
    target_lang: target,
    preserve_formatting: true,
    custom_instructions: [
      'Translate accurately for a vocabulary trainer. Return only the translation, without explanations.',
      'If the supplied context is technical, prefer the established technical term that fits that context.'
    ]
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
    throw new Error(`HTTP ${response.status}${detail ? ` – ${detail.slice(0, 160)}` : ''}`);
  }
  const data = await response.json();
  return cleanTranslation(data?.translations?.[0]?.text || '');
}

async function translateWithMyMemory(text, source, target) {
  const endpoint = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${encodeURIComponent(source.toLowerCase())}%7C${encodeURIComponent(target.toLowerCase())}`;
  const response = await fetch(endpoint, {
    headers: { 'User-Agent': 'VocabFast/0.5' },
    cf: { cacheTtl: 3600, cacheEverything: true }
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  const candidate = data?.responseData?.translatedText || '';
  return cleanTranslation(decodeEntities(candidate));
}

function normalizeLanguage(value, fallback) {
  const v = String(value || fallback).trim().toUpperCase();
  return v === 'EN-US' || v === 'EN-GB' ? 'EN' : v === 'DE-DE' || v === 'DE-AT' ? 'DE' : v;
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

function json(data, status) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store'
    }
  });
}
