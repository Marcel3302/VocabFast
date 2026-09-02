/**
 * VocabFast Cloudflare Worker v9
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
const PBKDF2_ITERATIONS = 210000;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/health') {
      return json({
        ok: true,
        service: 'vocabfast-worker-v9',
        aiBinding: Boolean(env.AI),
        accountStorage: Boolean(env.USER_STORE),
        deepLConfigured: Boolean(env.DEEPL_API_KEY),
        translationModel: TRANSLATION_MODEL,
        contextModel: CONTEXT_MODEL
      });
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

    const passwordHash = await hashPassword(password, user.salt);
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

  // For the simple Add screen we let the multilingual LLM detect the language and translate
  // in one operation. This also handles specialist terminology much better than a fixed word list.
  if (env.AI && autoMode) {
    try {
      const result = await autoDetectAndTranslateWithAI(env, text, subjectContext);
      if (result?.translation && result?.source && result?.target) {
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
      attempts.push(`Workers AI auto: ${errorMessage(error)}`);
    }
  }

  const source = ['EN', 'DE'].includes(requestedSource) ? requestedSource : detectLanguageHeuristic(text);
  const target = ['EN', 'DE'].includes(requestedTarget) && requestedTarget !== source ? requestedTarget : (source === 'DE' ? 'EN' : 'DE');

  // Prefer an instruction-following multilingual model for explicit translations too.
  if (env.AI) {
    try {
      const translation = await translateWithInstructionAI(env, text, source, target, subjectContext);
      if (translation && normalizeForComparison(translation) !== normalizeForComparison(text)) {
        return json({ translation, source, target, detectedLanguage: source, provider: 'cloudflare-ai', contextApplied: Boolean(subjectContext) });
      }
      if (translation) attempts.push('Workers AI: Ausgabe war identisch zur Eingabe');
    } catch (error) {
      attempts.push(`Workers AI: ${errorMessage(error)}`);
    }
  }

  if (env.DEEPL_API_KEY) {
    try {
      const translation = await translateWithDeepL(env, text, source, target, subjectContext);
      if (translation) return json({ translation, source, target, detectedLanguage: source, provider: 'deepl', contextApplied: Boolean(subjectContext) });
    } catch (error) {
      attempts.push(`DeepL: ${errorMessage(error)}`);
    }
  }

  if (env.AI) {
    try {
      const translation = await translateWithWorkersAI(env, text, source, target);
      if (translation && normalizeForComparison(translation) !== normalizeForComparison(text)) {
        return json({ translation, source, target, detectedLanguage: source, provider: 'cloudflare-ai-translation', contextApplied: false });
      }
    } catch (error) {
      attempts.push(`Workers AI translation: ${errorMessage(error)}`);
    }
  }

  try {
    const translation = await translateWithGoogleFallback(text, source, target);
    if (translation) return json({ translation, source, target, detectedLanguage: source, provider: 'google-fallback', contextApplied: false });
  } catch (error) {
    attempts.push(`Google fallback: ${errorMessage(error)}`);
  }

  try {
    const translation = await translateWithMyMemory(text, source, target);
    if (translation) return json({ translation, source, target, detectedLanguage: source, provider: 'mymemory-fallback', contextApplied: false });
  } catch (error) {
    attempts.push(`MyMemory fallback: ${errorMessage(error)}`);
  }

  return json({ error: 'Die automatische Übersetzung konnte die Anfrage gerade nicht abschließen.', detail: attempts.join(' | ') }, 502);
}

async function autoDetectAndTranslateWithAI(env, text, subjectContext) {
  const contextLine = subjectContext ? `\nSpecialist/learning context: ${subjectContext}` : '';
  const response = await env.AI.run(CONTEXT_MODEL, {
    messages: [
      {
        role: 'system',
        content: 'You are the translation engine for a German-English vocabulary trainer. Detect whether the user input is German or English, then translate it into the other language. This must work for ordinary vocabulary, technical terminology, professional jargon and short phrases. If a term is ambiguous, use the specialist context when supplied. Return ONLY valid compact JSON with exactly these keys: source, target, translation. source and target must each be EN or DE. translation must contain the best natural translation only, without explanations. Do not simply copy the input unless the correct translation genuinely has identical spelling. For example, English brick means German Ziegelstein, and German Luftfahrt means English aviation.'
      },
      { role: 'user', content: `Text: ${text}${contextLine}` }
    ],
    temperature: 0,
    max_completion_tokens: 140,
    reasoning_effort: 'low'
  });
  const raw = extractTextGeneration(response);
  const parsed = parseTranslationJson(raw);
  if (!parsed) throw new Error(`Ungültige Modellantwort: ${String(raw || '').slice(0, 120)}`);
  return parsed;
}

function parseTranslationJson(raw) {
  let value = String(raw || '').trim();
  value = value.replace(/^```(?:json)?\s*/i, '').replace(/```$/i, '').trim();
  const start = value.indexOf('{');
  const end = value.lastIndexOf('}');
  if (start >= 0 && end > start) value = value.slice(start, end + 1);
  try {
    const obj = JSON.parse(value);
    const source = normalizeLanguage(obj.source);
    const target = normalizeLanguage(obj.target);
    const translation = cleanTranslation(obj.translation);
    if (!['EN', 'DE'].includes(source) || !['EN', 'DE'].includes(target) || source === target || !translation) return null;
    return { source, target, translation };
  } catch (_) {
    return null;
  }
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
    max_completion_tokens: 100,
    reasoning_effort: 'low'
  });
  return cleanModelTranslation(extractTextGeneration(response));
}

async function translateWithWorkersAI(env, text, source, target) {
  const result = await env.AI.run(TRANSLATION_MODEL, {
    text,
    source_lang: source.toLowerCase(),
    target_lang: target.toLowerCase()
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

async function hashPassword(password, saltBase64Url) {
  const keyMaterial = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: base64UrlToBytes(saltBase64Url), iterations: PBKDF2_ITERATIONS }, keyMaterial, 256);
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
