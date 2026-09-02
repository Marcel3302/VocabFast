/**
 * VocabFast Cloudflare Worker v11
 *
 * - Static website from ./public
 * - Workers AI translation with automatic EN/DE language detection
 * - Optional DeepL fallback for explicit translations
 * - Email + password accounts using a SQLite-backed Durable Object
 * - Server-side sync of words, achievements and learner profile
 */

const TRANSLATION_MODEL = '@cf/meta/m2m100-1.2b';
const CONTEXT_MODEL = '@cf/zai-org/glm-4.7-flash';
const SESSION_COOKIE = 'vf_session';
const SESSION_DAYS = 30;
const PBKDF2_ITERATIONS = 100000;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/health') {
      return json({
        ok: true,
        service: 'vocabfast-worker-v11',
        aiBinding: Boolean(env.AI),
        accountStorage: Boolean(env.USER_STORE),
        deepLConfigured: Boolean(env.DEEPL_API_KEY),
        translationModel: TRANSLATION_MODEL,
        contextModel: CONTEXT_MODEL,
        batchTranslation: true,
        passwordKdfIterations: PBKDF2_ITERATIONS
      });
    }

    if (url.pathname === '/api/translate-batch') {
      if (request.method === 'OPTIONS') return optionsResponse();
      if (request.method !== 'POST') return json({ error: 'Methode nicht erlaubt.' }, 405);
      return handleTranslationBatch(request, env);
    }

    if (url.pathname === '/api/translate') {
      if (request.method === 'OPTIONS') return optionsResponse();
      if (!['GET', 'POST'].includes(request.method)) return json({ error: 'Methode nicht erlaubt.' }, 405);
      return handleTranslation(request, env);
    }

    if (url.pathname === '/api/example') {
      if (request.method !== 'GET') return json({ error: 'Methode nicht erlaubt.' }, 405);
      return handleExample(url, env);
    }

    if (url.pathname.startsWith('/api/auth/') || url.pathname === '/api/user-data') {
      if (!env.USER_STORE) return json({ error: 'Kontospeicher ist nicht konfiguriert.' }, 503);
      const id = env.USER_STORE.idFromName('vocabfast-global-user-store');
      return env.USER_STORE.get(id).fetch(request);
    }

    return env.ASSETS.fetch(request);
  }
};

export class UserStore {
  constructor(ctx, env) {
    this.ctx = ctx;
    this.env = env;
  }

  async fetch(request) {
    const url = new URL(request.url);
    try {
      if (url.pathname === '/api/auth/register' && request.method === 'POST') return this.register(request);
      if (url.pathname === '/api/auth/login' && request.method === 'POST') return this.login(request);
      if (url.pathname === '/api/auth/logout' && request.method === 'POST') return this.logout(request);
      if (url.pathname === '/api/auth/me' && request.method === 'GET') return this.me(request);
      if (url.pathname === '/api/user-data' && request.method === 'GET') return this.getUserData(request);
      if (url.pathname === '/api/user-data' && request.method === 'PUT') return this.putUserData(request);
      return json({ error: 'Nicht gefunden.' }, 404);
    } catch (error) {
      console.error('UserStore error', error);
      return json({ error: 'Serverfehler beim Benutzerkonto.' }, 500);
    }
  }

  async register(request) {
    const body = await safeJson(request);
    const email = normalizeEmail(body.email);
    const password = String(body.password || '');
    const validation = validateCredentials(email, password);
    if (validation) return json({ error: validation }, 400);

    const existing = await this.ctx.storage.get(`user-email:${email}`);
    if (existing) return json({ error: 'Für diese E-Mail-Adresse gibt es bereits ein Konto.' }, 409);

    const salt = randomBase64Url(18);
    const passwordHash = await hashPassword(password, salt);
    const user = {
      id: crypto.randomUUID(),
      email,
      passwordHash,
      salt,
      passwordIterations: PBKDF2_ITERATIONS,
      createdAt: new Date().toISOString()
    };

    await this.ctx.storage.put(`user-email:${email}`, user);
    await this.ctx.storage.put(`user-id:${user.id}`, { id: user.id, email: user.email, createdAt: user.createdAt });
    return this.createSessionResponse(user, 201);
  }

  async login(request) {
    const body = await safeJson(request);
    const email = normalizeEmail(body.email);
    const password = String(body.password || '');
    if (!email || !password) return json({ error: 'Bitte E-Mail und Passwort eingeben.' }, 400);

    const user = await this.ctx.storage.get(`user-email:${email}`);
    if (!user) return json({ error: 'E-Mail oder Passwort ist falsch.' }, 401);

    const passwordHash = await hashPassword(password, user.salt, user.passwordIterations || PBKDF2_ITERATIONS);
    if (!safeStringEqual(passwordHash, user.passwordHash)) return json({ error: 'E-Mail oder Passwort ist falsch.' }, 401);
    return this.createSessionResponse(user, 200);
  }

  async createSessionResponse(user, status) {
    const token = randomBase64Url(32);
    const tokenHash = await sha256Base64Url(token);
    const expiresAt = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
    await this.ctx.storage.put(`session:${tokenHash}`, { userId: user.id, email: user.email, expiresAt });

    return json({ user: publicUser(user) }, status, 0, {
      'set-cookie': sessionCookie(token, expiresAt)
    });
  }

  async logout(request) {
    const token = readCookie(request, SESSION_COOKIE);
    if (token) {
      const tokenHash = await sha256Base64Url(token);
      await this.ctx.storage.delete(`session:${tokenHash}`);
    }
    return json({ ok: true }, 200, 0, {
      'set-cookie': `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`
    });
  }

  async me(request) {
    const auth = await this.authenticate(request);
    if (!auth) return json({ user: null }, 200);
    return json({ user: { id: auth.userId, email: auth.email } }, 200);
  }

  async getUserData(request) {
    const auth = await this.authenticate(request);
    if (!auth) return json({ error: 'Nicht angemeldet.' }, 401);
    const data = await this.ctx.storage.get(`data:${auth.userId}`);
    return json({ data: data || null }, 200);
  }

  async putUserData(request) {
    const auth = await this.authenticate(request);
    if (!auth) return json({ error: 'Nicht angemeldet.' }, 401);
    const body = await safeJson(request);
    const words = Array.isArray(body.words) ? body.words : [];
    const achievements = Array.isArray(body.achievements) ? body.achievements : [];
    const profile = body.profile && typeof body.profile === 'object' && !Array.isArray(body.profile) ? body.profile : {};

    const payload = { words, achievements, profile, updatedAt: new Date().toISOString() };
    const serialized = JSON.stringify(payload);
    if (serialized.length > 1_800_000) return json({ error: 'Die gespeicherten Lerndaten sind zu groß.' }, 413);

    await this.ctx.storage.put(`data:${auth.userId}`, payload);
    return json({ ok: true, updatedAt: payload.updatedAt }, 200);
  }

  async authenticate(request) {
    const token = readCookie(request, SESSION_COOKIE);
    if (!token) return null;
    const tokenHash = await sha256Base64Url(token);
    const session = await this.ctx.storage.get(`session:${tokenHash}`);
    if (!session) return null;
    if (!session.expiresAt || session.expiresAt < Date.now()) {
      await this.ctx.storage.delete(`session:${tokenHash}`);
      return null;
    }
    return session;
  }
}

async function handleTranslation(request, env) {
  const input = await readTranslationInput(request);
  if (input.error) return json({ error: input.error }, 400);

  const text = String(input.text || input.q || '').trim();
  const requestedSource = normalizeLanguage(input.source || 'AUTO');
  const requestedTarget = normalizeLanguage(input.target || 'AUTO');
  const subjectContext = String(input.context || '').trim().slice(0, 1200);

  if (!text) return json({ error: 'Bitte ein Wort oder einen Begriff eingeben.' }, 400);
  if (text.length > 800) return json({ error: 'Bitte maximal 800 Zeichen pro Übersetzung verwenden.' }, 400);

  const autoMode = !['EN', 'DE'].includes(requestedSource) || !['EN', 'DE'].includes(requestedTarget) || requestedSource === requestedTarget;
  const attempts = [];

  if (autoMode) {
    // 1) Best path for individual words and specialist terms: one multilingual model
    // detects the language and translates in the same request.
    if (env.AI) {
      try {
        const result = await autoDetectAndTranslateWithAI(env, text, subjectContext);
        if (validAutoTranslation(result, text)) {
          return json({
            translation: result.translation,
            source: result.source,
            target: result.target,
            detectedLanguage: result.source,
            provider: 'cloudflare-ai-auto',
            contextApplied: Boolean(subjectContext)
          });
        }
      } catch (error) {
        attempts.push(`AI-Auto: ${errorMessage(error)}`);
      }

      // 2) Robust fallback for single words: translate in both directions with the
      // dedicated translation model. This resolves cases such as "brick" and "beton"
      // even when the language classifier is temporarily unavailable.
      try {
        const result = await autoDetectWithBidirectionalAI(env, text);
        if (validAutoTranslation(result, text)) {
          return json({
            translation: result.translation,
            source: result.source,
            target: result.target,
            detectedLanguage: result.source,
            provider: 'cloudflare-ai-bidirectional',
            contextApplied: false
          });
        }
      } catch (error) {
        attempts.push(`AI-Bidirektional: ${errorMessage(error)}`);
      }
    }

    // 3) Network fallback with automatic source detection.
    try {
      const result = await translateWithGoogleAuto(text);
      if (validAutoTranslation(result, text)) {
        return json({ ...result, detectedLanguage: result.source, provider: 'google-auto-fallback', contextApplied: false });
      }
    } catch (error) {
      attempts.push(`Google-Auto: ${errorMessage(error)}`);
    }

    console.error('VocabFast auto translation failed:', attempts.join(' | '));
    return json({
      error: 'Die Autoübersetzung ist gerade nicht verfügbar.',
      detail: attempts.join(' | ')
    }, 502);
  }

  const source = requestedSource;
  const target = requestedTarget;

  // Explicit list translations (EN -> DE) should use the dedicated translation model first.
  const explicit = await translateExplicitWithFallbacks(env, text, source, target, subjectContext, attempts);
  if (explicit) return json({ translation: explicit.translation, source, target, detectedLanguage: source, provider: explicit.provider, contextApplied: explicit.contextApplied });

  console.error('VocabFast explicit translation failed:', attempts.join(' | '));
  return json({ error: 'Die Übersetzung ist gerade nicht verfügbar.', detail: attempts.join(' | ') }, 502);
}

async function handleTranslationBatch(request, env) {
  let body = {};
  try { body = await request.json(); } catch (_) { return json({ error: 'Ungültige Anfrage.' }, 400); }
  const texts = Array.isArray(body.texts) ? body.texts.map(x => String(x || '').trim()).filter(Boolean) : [];
  const source = normalizeLanguage(body.source || 'EN');
  const target = normalizeLanguage(body.target || 'DE');
  const context = String(body.context || '').trim().slice(0, 500);

  if (!texts.length) return json({ results: [] });
  if (texts.length > 30) return json({ error: 'Maximal 30 Wörter pro Batch.' }, 400);
  if (!['EN', 'DE'].includes(source) || !['EN', 'DE'].includes(target) || source === target) return json({ error: 'Ungültige Sprachrichtung.' }, 400);

  const unique = [...new Set(texts)].slice(0, 30);
  const results = await Promise.all(unique.map(async text => {
    const attempts = [];
    try {
      const translated = await translateExplicitWithFallbacks(env, text, source, target, context, attempts);
      if (translated?.translation) return { text, translation: translated.translation, ok: true, provider: translated.provider };
    } catch (error) {
      attempts.push(errorMessage(error));
    }
    return { text, translation: '', ok: false, error: attempts.join(' | ') || 'Übersetzung fehlgeschlagen.' };
  }));

  return json({ source, target, results });
}

async function translateExplicitWithFallbacks(env, text, source, target, subjectContext, attempts = []) {
  if (env.AI) {
    try {
      const translation = await translateWithWorkersAI(env, text, source, target);
      if (translation && normalizeForComparison(translation) !== normalizeForComparison(text)) {
        return { translation, provider: 'cloudflare-ai-translation', contextApplied: false };
      }
      if (translation) attempts.push('M2M100: Ausgabe war identisch zur Eingabe');
    } catch (error) {
      attempts.push(`M2M100: ${errorMessage(error)}`);
    }
  }

  if (env.DEEPL_API_KEY) {
    try {
      const translation = await translateWithDeepL(env, text, source, target, subjectContext);
      if (translation) return { translation, provider: 'deepl', contextApplied: Boolean(subjectContext) };
    } catch (error) {
      attempts.push(`DeepL: ${errorMessage(error)}`);
    }
  }

  if (env.AI) {
    try {
      const translation = await translateWithInstructionAI(env, text, source, target, subjectContext);
      if (translation && normalizeForComparison(translation) !== normalizeForComparison(text)) {
        return { translation, provider: 'cloudflare-ai-context', contextApplied: Boolean(subjectContext) };
      }
      if (translation) attempts.push('Kontext-AI: Ausgabe war identisch zur Eingabe');
    } catch (error) {
      attempts.push(`Kontext-AI: ${errorMessage(error)}`);
    }
  }

  try {
    const translation = await translateWithGoogleFallback(text, source, target);
    if (translation && normalizeForComparison(translation) !== normalizeForComparison(text)) {
      return { translation, provider: 'google-fallback', contextApplied: false };
    }
  } catch (error) {
    attempts.push(`Google: ${errorMessage(error)}`);
  }

  try {
    const translation = await translateWithMyMemory(text, source, target);
    if (translation && normalizeForComparison(translation) !== normalizeForComparison(text)) {
      return { translation, provider: 'mymemory-fallback', contextApplied: false };
    }
  } catch (error) {
    attempts.push(`MyMemory: ${errorMessage(error)}`);
  }

  return null;
}

async function autoDetectAndTranslateWithAI(env, text, subjectContext) {
  const contextLine = subjectContext ? `\nSpecialist/learning context: ${subjectContext}` : '';
  const response = await env.AI.run(CONTEXT_MODEL, {
    messages: [
      {
        role: 'system',
        content: 'You translate between German and English. Detect whether the input is German or English and translate it into the other language. Technical terms and professional jargon are allowed. Return exactly one line in this format: SOURCE|TARGET|TRANSLATION. SOURCE and TARGET must be EN or DE. Example: brick -> EN|DE|Ziegelstein. Example: Beton -> DE|EN|concrete. No explanation.'
      },
      { role: 'user', content: `Text: ${text}${contextLine}` }
    ],
    temperature: 0,
    max_completion_tokens: 100
  });
  const raw = extractTextGeneration(response);
  const parsed = parseAutoTranslation(raw);
  if (!parsed) throw new Error(`Ungültige Modellantwort: ${String(raw || '').slice(0, 140)}`);
  return parsed;
}

function parseAutoTranslation(raw) {
  let value = String(raw || '').trim().replace(/^```(?:text|json)?\s*/i, '').replace(/```$/i, '').trim();
  // Preferred pipe format.
  const pipe = value.match(/\b(EN|DE)\s*\|\s*(EN|DE)\s*\|\s*(.+)$/is);
  if (pipe) {
    const source = normalizeLanguage(pipe[1]);
    const target = normalizeLanguage(pipe[2]);
    const translation = cleanTranslation(pipe[3]);
    if (source !== target && translation) return { source, target, translation };
  }
  // Backwards-compatible JSON parser in case the model chooses JSON anyway.
  const start = value.indexOf('{');
  const end = value.lastIndexOf('}');
  if (start >= 0 && end > start) {
    try {
      const obj = JSON.parse(value.slice(start, end + 1));
      const source = normalizeLanguage(obj.source);
      const target = normalizeLanguage(obj.target);
      const translation = cleanTranslation(obj.translation);
      if (['EN', 'DE'].includes(source) && ['EN', 'DE'].includes(target) && source !== target && translation) return { source, target, translation };
    } catch (_) {}
  }
  return null;
}

function validAutoTranslation(result, original) {
  return Boolean(result && ['EN', 'DE'].includes(result.source) && ['EN', 'DE'].includes(result.target) && result.source !== result.target && result.translation && normalizeForComparison(result.translation) !== normalizeForComparison(original));
}

async function autoDetectWithBidirectionalAI(env, text) {
  const [enToDeResult, deToEnResult] = await Promise.allSettled([
    translateWithWorkersAI(env, text, 'EN', 'DE'),
    translateWithWorkersAI(env, text, 'DE', 'EN')
  ]);
  const enToDe = enToDeResult.status === 'fulfilled' ? cleanTranslation(enToDeResult.value) : '';
  const deToEn = deToEnResult.status === 'fulfilled' ? cleanTranslation(deToEnResult.value) : '';
  const original = normalizeForComparison(text);
  const enChanged = Boolean(enToDe) && normalizeForComparison(enToDe) !== original;
  const deChanged = Boolean(deToEn) && normalizeForComparison(deToEn) !== original;

  if (enChanged && !deChanged) return { source: 'EN', target: 'DE', translation: enToDe };
  if (deChanged && !enChanged) return { source: 'DE', target: 'EN', translation: deToEn };

  const guessed = detectLanguageHeuristic(text);
  if (guessed === 'DE' && deChanged) return { source: 'DE', target: 'EN', translation: deToEn };
  if (guessed === 'EN' && enChanged) return { source: 'EN', target: 'DE', translation: enToDe };
  if (deChanged) return { source: 'DE', target: 'EN', translation: deToEn };
  if (enChanged) return { source: 'EN', target: 'DE', translation: enToDe };
  throw new Error('Beide Übersetzungsrichtungen lieferten keine verwertbare Änderung.');
}

async function translateWithGoogleAuto(text) {
  const firstUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=de&dt=t&q=${encodeURIComponent(text)}`;
  const firstResponse = await fetch(firstUrl, { headers: { 'Accept': 'application/json' } });
  if (!firstResponse.ok) throw new Error(`HTTP ${firstResponse.status}`);
  const first = await firstResponse.json();
  const detected = String(first?.[2] || '').toLowerCase();
  const firstTranslation = cleanTranslation(Array.isArray(first?.[0]) ? first[0].map(x => Array.isArray(x) ? x[0] : '').filter(Boolean).join(' ') : '');
  if (detected.startsWith('de')) {
    const translation = await translateWithGoogleFallback(text, 'DE', 'EN');
    return { source: 'DE', target: 'EN', translation };
  }
  if (firstTranslation) return { source: 'EN', target: 'DE', translation: firstTranslation };
  throw new Error('Keine Autoübersetzung erhalten.');
}

async function readTranslationInput(request) {
  if (request.method === 'GET') {
    const url = new URL(request.url);
    return {
      text: url.searchParams.get('q') || '',
      source: url.searchParams.get('source') || 'AUTO',
      target: url.searchParams.get('target') || 'AUTO',
      context: url.searchParams.get('context') || ''
    };
  }
  try {
    return await request.json();
  } catch (_) {
    return { error: 'Ungültige Anfrage.' };
  }
}

async function translateWithInstructionAI(env, text, source, target, subjectContext) {
  const sourceName = source === 'EN' ? 'English' : 'German';
  const targetName = target === 'DE' ? 'German' : 'English';
  const contextLine = subjectContext ? `\nSpecialist context: ${subjectContext}` : '';
  const response = await env.AI.run(CONTEXT_MODEL, {
    messages: [
      {
        role: 'system',
        content: `Translate precisely from ${sourceName} to ${targetName}. Return only the best translation, no explanation, no label, no quotation marks. Handle technical and specialist terminology correctly.`
      },
      { role: 'user', content: `Text: ${text}${contextLine}` }
    ],
    temperature: 0,
    max_completion_tokens: 100
  });
  return cleanModelTranslation(extractTextGeneration(response));
}

async function translateWithWorkersAI(env, text, source, target) {
  const result = await env.AI.run(TRANSLATION_MODEL, {
    text,
    source_lang: source === 'EN' ? 'english' : 'german',
    target_lang: target === 'EN' ? 'english' : 'german'
  });

  const candidate = result?.translated_text || result?.translation || result?.translations?.[0]?.translated_text || result?.translations?.[0]?.translation || result?.translations?.[0]?.text || '';
  const translation = cleanTranslation(candidate);
  if (!translation) throw new Error('Modell hat keine Übersetzung zurückgegeben.');
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
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith('“') && v.endsWith('”'))) v = v.slice(1, -1).trim();
  return cleanTranslation(v);
}

async function translateWithDeepL(env, text, source, target, subjectContext) {
  const key = String(env.DEEPL_API_KEY || '').trim();
  const endpoint = String(env.DEEPL_API_URL || '').trim() || (key.endsWith(':fx') ? 'https://api-free.deepl.com/v2/translate' : 'https://api.deepl.com/v2/translate');
  const payload = { text: [text], source_lang: source, target_lang: target, preserve_formatting: true };
  if (subjectContext) payload.context = subjectContext;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Authorization': `DeepL-Auth-Key ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  return cleanTranslation(data?.translations?.[0]?.text || '');
}

async function translateWithGoogleFallback(text, source, target) {
  const endpoint = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${source.toLowerCase()}&tl=${target.toLowerCase()}&dt=t&q=${encodeURIComponent(text)}`;
  const response = await fetch(endpoint, { headers: { 'Accept': 'application/json' } });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  const chunks = Array.isArray(data?.[0]) ? data[0].map(x => Array.isArray(x) ? x[0] : '').filter(Boolean) : [];
  return cleanTranslation(chunks.join(' '));
}

async function translateWithMyMemory(text, source, target) {
  const langpair = `${source.toLowerCase()}|${target.toLowerCase()}`;
  const endpoint = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${encodeURIComponent(langpair)}`;
  const response = await fetch(endpoint, { headers: { 'Accept': 'application/json', 'User-Agent': 'VocabFast/0.9' } });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  return cleanTranslation(decodeEntities(data?.responseData?.translatedText || ''));
}

async function handleExample(url, env) {
  const q = (url.searchParams.get('q') || '').trim();
  if (!q) return json({ error: 'Missing q parameter' }, 400);

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
    } catch (_) {}
  }

  if (q.length <= 60 && /^[A-Za-z][A-Za-z'’-]*$/.test(q)) {
    try {
      const endpoint = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(q)}`;
      const response = await fetch(endpoint);
      if (response.ok) {
        const data = await response.json();
        const examples = [];
        for (const entry of Array.isArray(data) ? data : []) {
          for (const meaning of entry.meanings || []) for (const definition of meaning.definitions || []) if (definition.example) examples.push(String(definition.example).trim());
        }
        const lower = q.toLowerCase();
        const example = examples.find(x => x.toLowerCase().includes(lower)) || examples[0];
        if (example) return json({ example: example.slice(0, 220), provider: 'dictionary' }, 200, 86400);
      }
    } catch (_) {}
  }
  return json({ example: `I learned the word “${q}” today.`, provider: 'local-fallback' }, 200, 86400);
}

function detectLanguageHeuristic(text) {
  const s = ` ${String(text || '').toLowerCase()} `;
  if (/[äöüß]/.test(s)) return 'DE';
  const germanHints = [' der ',' die ',' das ',' ein ',' eine ',' und ',' oder ',' mit ',' für ',' auf ',' ist ',' sind ',' ich ',' du ',' wir ',' nicht ',' von ',' zu ',' im ',' am ','ung ','heit ','keit ','isch '];
  const englishHints = [' the ',' a ',' an ',' and ',' or ',' with ',' for ',' is ',' are ',' i ',' you ',' we ',' not ',' of ',' to ','ing ','tion '];
  let de = 0, en = 0;
  germanHints.forEach(x => { if (s.includes(x)) de++; });
  englishHints.forEach(x => { if (s.includes(x)) en++; });
  return de > en ? 'DE' : 'EN';
}

function normalizeLanguage(value) {
  const v = String(value || '').trim().toUpperCase();
  if (v === 'EN-US' || v === 'EN-GB' || v === 'ENGLISH') return 'EN';
  if (v === 'DE-DE' || v === 'DE-AT' || v === 'GERMAN' || v === 'DEUTSCH') return 'DE';
  return v;
}

function normalizeForComparison(value) {
  return String(value || '').toLowerCase().trim().replace(/[.,!?;:'"“”‘’()\-]/g, '').replace(/\s+/g, ' ');
}

function cleanTranslation(value) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, 800);
}

function decodeEntities(value) {
  return String(value || '').replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'").replace(/&lt;/gi, '<').replace(/&gt;/gi, '>').replace(/&amp;/gi, '&');
}

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

function publicUser(user) {
  return { id: user.id, email: user.email, createdAt: user.createdAt };
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function validateCredentials(email, password) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Bitte eine gültige E-Mail-Adresse eingeben.';
  if (password.length < 8) return 'Das Passwort muss mindestens 8 Zeichen haben.';
  if (password.length > 128) return 'Das Passwort ist zu lang.';
  return '';
}

async function safeJson(request) {
  try { return await request.json(); } catch (_) { return {}; }
}

function readCookie(request, name) {
  const cookie = request.headers.get('cookie') || '';
  for (const part of cookie.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return decodeURIComponent(rest.join('='));
  }
  return '';
}

function sessionCookie(token, expiresAt) {
  const maxAge = Math.max(1, Math.floor((expiresAt - Date.now()) / 1000));
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

function randomBase64Url(byteLength) {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return bytesToBase64Url(bytes);
}

async function hashPassword(password, saltBase64Url, iterations = PBKDF2_ITERATIONS) {
  const keyMaterial = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: base64UrlToBytes(saltBase64Url), iterations: Math.min(100000, Math.max(1000, Number(iterations) || PBKDF2_ITERATIONS)) }, keyMaterial, 256);
  return bytesToBase64Url(new Uint8Array(bits));
}

async function sha256Base64Url(value) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(value || '')));
  return bytesToBase64Url(new Uint8Array(digest));
}

function safeStringEqual(a, b) {
  const x = String(a || ''), y = String(b || '');
  if (x.length !== y.length) return false;
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x.charCodeAt(i) ^ y.charCodeAt(i);
  return diff === 0;
}

function bytesToBase64Url(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlToBytes(value) {
  const base64 = String(value || '').replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - base64.length % 4) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, c => c.charCodeAt(0));
}

function json(data, status = 200, maxAge = 0, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': maxAge ? `public, max-age=${maxAge}` : 'no-store',
      'access-control-allow-origin': '*',
      ...extraHeaders
    }
  });
}

function optionsResponse() {
  return new Response(null, {
    status: 204,
    headers: {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET, POST, PUT, OPTIONS',
      'access-control-allow-headers': 'Content-Type'
    }
  });
}
