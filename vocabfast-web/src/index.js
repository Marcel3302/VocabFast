/**
 * VocabFast Cloudflare Worker v8
 *
 * Translation priority:
 * 1) DeepL, when DEEPL_API_KEY is configured (optional)
 * 2) Cloudflare Workers AI (native, no separate API key in the app)
 * 3) Public fallbacks, only as a last resort
 *
 * Static assets are served from ./public through the ASSETS binding.
 */

const TRANSLATION_MODEL = '@cf/meta/m2m100-1.2b';
const CONTEXT_MODEL = '@cf/zai-org/glm-4.7-flash';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/health') {
      return json({
        ok: true,
        service: 'vocabfast-worker-v8',
        aiBinding: Boolean(env.AI),
        deepLConfigured: Boolean(env.DEEPL_API_KEY),
        translationModel: TRANSLATION_MODEL,
        contextModel: CONTEXT_MODEL
      }, 200);
    }

    if (url.pathname === '/api/translate') {
      if (request.method === 'OPTIONS') return optionsResponse();
      if (!['GET', 'POST'].includes(request.method)) {
        return json({ error: 'Methode nicht erlaubt.' }, 405);
      }
      return handleTranslation(request, env);
    }

    if (url.pathname === '/api/example') {
      if (request.method !== 'GET') return json({ error: 'Methode nicht erlaubt.' }, 405);
      return handleExample(url, env);
    }

    return env.ASSETS.fetch(request);
  }
};

async function handleTranslation(request, env) {
  const input = await readTranslationInput(request);
  if (input.error) return json({ error: input.error }, 400);

  const text = String(input.text || input.q || '').trim();
  const source = normalizeLanguage(input.source || 'EN');
  const target = normalizeLanguage(input.target || 'DE');
  const subjectContext = String(input.context || '').trim().slice(0, 1200);

  if (!text) return json({ error: 'Bitte einen Text eingeben.' }, 400);
  if (text.length > 800) return json({ error: 'Bitte maximal 800 Zeichen pro Übersetzung verwenden.' }, 400);
  if (!['EN', 'DE'].includes(source) || !['EN', 'DE'].includes(target) || source === target) {
    return json({ error: 'Diese Version unterstützt Englisch ↔ Deutsch.' }, 400);
  }

  const attempts = [];

  // Optional: DeepL remains the preferred provider when the user configures a key.
  if (env.DEEPL_API_KEY) {
    try {
      const translation = await translateWithDeepL(env, text, source, target, subjectContext);
      if (translation) {
        return json({ translation, provider: 'deepl', source, target, contextApplied: Boolean(subjectContext) }, 200);
      }
    } catch (error) {
      attempts.push(`DeepL: ${errorMessage(error)}`);
    }
  }

  // Native Cloudflare AI. If a specialist context is supplied, use a multilingual
  // instruction model so that ambiguous terminology can be interpreted in context.
  if (env.AI && subjectContext) {
    try {
      const translation = await translateWithContextAI(env, text, source, target, subjectContext);
      if (translation) {
        return json({ translation, provider: 'cloudflare-ai-context', source, target, contextApplied: true }, 200);
      }
    } catch (error) {
      attempts.push(`Workers AI context: ${errorMessage(error)}`);
    }
  }

  // Native Cloudflare translation model for all arbitrary words/phrases.
  if (env.AI) {
    try {
      const translation = await translateWithWorkersAI(env, text, source, target);
      if (translation) {
        return json({ translation, provider: 'cloudflare-ai-translation', source, target, contextApplied: false }, 200);
      }
    } catch (error) {
      attempts.push(`Workers AI translation: ${errorMessage(error)}`);
    }
  } else {
    attempts.push('Workers AI: AI-Binding fehlt');
  }

  // Last-resort public providers. These are intentionally not the primary path.
  try {
    const translation = await translateWithGoogleFallback(text, source, target);
    if (translation) {
      return json({ translation, provider: 'google-fallback', source, target, contextApplied: false }, 200);
    }
  } catch (error) {
    attempts.push(`Google fallback: ${errorMessage(error)}`);
  }

  try {
    const translation = await translateWithMyMemory(text, source, target);
    if (translation) {
      return json({ translation, provider: 'mymemory-fallback', source, target, contextApplied: false }, 200);
    }
  } catch (error) {
    attempts.push(`MyMemory fallback: ${errorMessage(error)}`);
  }

  return json({
    error: 'Der Worker läuft, aber kein Übersetzungsdienst konnte die Anfrage abschließen.',
    detail: attempts.join(' | ')
  }, 502);
}

async function readTranslationInput(request) {
  if (request.method === 'GET') {
    const url = new URL(request.url);
    return {
      text: url.searchParams.get('q') || '',
      source: url.searchParams.get('source') || 'EN',
      target: url.searchParams.get('target') || 'DE',
      context: url.searchParams.get('context') || ''
    };
  }
  try {
    return await request.json();
  } catch (_) {
    return { error: 'Ungültige Anfrage.' };
  }
}

async function translateWithWorkersAI(env, text, source, target) {
  const result = await env.AI.run(TRANSLATION_MODEL, {
    text,
    source_lang: source.toLowerCase(),
    target_lang: target.toLowerCase()
  });

  const candidate =
    result?.translated_text ||
    result?.translation ||
    result?.translations?.[0]?.translated_text ||
    result?.translations?.[0]?.translation ||
    result?.translations?.[0]?.text ||
    '';

  const translation = cleanTranslation(candidate);
  if (!translation) throw new Error('Modell hat keine Übersetzung zurückgegeben.');
  return translation;
}

async function translateWithContextAI(env, text, source, target, subjectContext) {
  const sourceName = source === 'EN' ? 'English' : 'German';
  const targetName = target === 'DE' ? 'German' : 'English';

  const response = await env.AI.run(CONTEXT_MODEL, {
    messages: [
      {
        role: 'system',
        content: `You are a precise bilingual English-German terminology translator. Translate exactly from ${sourceName} to ${targetName}. Return only the best translation, without explanation, quotation marks, labels, alternatives or punctuation added around it. Prefer the meaning appropriate to the supplied specialist context.`
      },
      {
        role: 'user',
        content: `Specialist context: ${subjectContext}\nText: ${text}`
      }
    ],
    temperature: 0.1,
    max_completion_tokens: 100,
    reasoning_effort: 'low'
  });

  const candidate = extractTextGeneration(response);
  const translation = cleanModelTranslation(candidate);
  if (!translation) throw new Error('Kontextmodell hat keine Übersetzung zurückgegeben.');
  return translation;
}

function extractTextGeneration(result) {
  if (!result) return '';
  if (typeof result === 'string') return result;
  if (typeof result.response === 'string') return result.response;
  const choice = Array.isArray(result.choices) ? result.choices[0] : null;
  if (typeof choice?.message?.content === 'string') return choice.message.content;
  if (typeof choice?.text === 'string') return choice.text;
  return '';
}

function cleanModelTranslation(value) {
  let v = String(value || '').trim();
  v = v.replace(/^```(?:text)?\s*/i, '').replace(/```$/i, '').trim();
  v = v.replace(/^\s*(?:translation|übersetzung)\s*:\s*/i, '').trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith('“') && v.endsWith('”'))) {
    v = v.slice(1, -1).trim();
  }
  return cleanTranslation(v);
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
    throw new Error(`HTTP ${response.status}${detail ? ` – ${detail.slice(0, 160)}` : ''}`);
  }

  const data = await response.json();
  return cleanTranslation(data?.translations?.[0]?.text || '');
}

async function translateWithGoogleFallback(text, source, target) {
  const endpoint = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${source.toLowerCase()}&tl=${target.toLowerCase()}&dt=t&q=${encodeURIComponent(text)}`;
  const response = await fetch(endpoint, { headers: { 'Accept': 'application/json' } });
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
    headers: { 'Accept': 'application/json', 'User-Agent': 'VocabFast/0.8' }
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  return cleanTranslation(decodeEntities(data?.responseData?.translatedText || ''));
}

async function handleExample(url, env) {
  const q = (url.searchParams.get('q') || '').trim();
  if (!q) return json({ error: 'Missing q parameter' }, 400);

  // Prefer Workers AI for natural examples, including specialist words.
  if (env.AI && q.length <= 80) {
    try {
      const response = await env.AI.run(CONTEXT_MODEL, {
        messages: [
          { role: 'system', content: 'Write one short, natural English example sentence for an English learner. Use the requested word or phrase exactly where grammatically reasonable. Return only the sentence.' },
          { role: 'user', content: q }
        ],
        temperature: 0.2,
        max_completion_tokens: 60,
        reasoning_effort: 'low'
      });
      const sentence = cleanModelTranslation(extractTextGeneration(response));
      if (sentence) return json({ example: sentence.slice(0, 220), provider: 'cloudflare-ai' }, 200, 86400);
    } catch (_) {
      // Continue to dictionary fallback.
    }
  }

  if (q.length <= 60 && /^[A-Za-z][A-Za-z'’-]*$/.test(q)) {
    try {
      const endpoint = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(q)}`;
      const response = await fetch(endpoint);
      if (response.ok) {
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
        const example = examples.find(x => x.toLowerCase().includes(lower)) || examples[0];
        if (example) return json({ example: example.slice(0, 220), provider: 'dictionary' }, 200, 86400);
      }
    } catch (_) {}
  }

  return json({ example: `I learned the word “${q}” today.`, provider: 'local-fallback' }, 200, 86400);
}

function normalizeLanguage(value) {
  const v = String(value || '').trim().toUpperCase();
  if (v === 'EN-US' || v === 'EN-GB') return 'EN';
  if (v === 'DE-DE' || v === 'DE-AT') return 'DE';
  return v;
}

function cleanTranslation(value) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, 800);
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
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': maxAge ? `public, max-age=${maxAge}` : 'no-store',
      'access-control-allow-origin': '*'
    }
  });
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
