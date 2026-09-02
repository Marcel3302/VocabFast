import { THEME_DICTIONARIES } from './theme-dictionary.js';

/**
 * VocabFast Cloudflare Worker v13
 *
 * - Static website from ./public
 * - Workers AI translation with automatic EN/DE language detection
 * - Optional DeepL fallback for explicit translations
 * - Email + password accounts using a SQLite-backed Durable Object
 * - Server-side sync of words, achievements and learner profile
 */

const TRANSLATION_MODEL = '@cf/meta/m2m100-1.2b';
const CONTEXT_MODEL = '@cf/meta/llama-3.1-8b-instruct-fast';
const SESSION_COOKIE = 'vf_session';
const SESSION_DAYS = 30;
const PBKDF2_ITERATIONS = 100000;
const RESET_TOKEN_MINUTES = 30;
const VERIFY_TOKEN_HOURS = 24;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/health') {
      return json({
        ok: true,
        service: 'vocabfast-worker-v13',
        aiBinding: Boolean(env.AI),
        accountStorage: Boolean(env.USER_STORE),
        deepLConfigured: Boolean(env.DEEPL_API_KEY),
        translationModel: TRANSLATION_MODEL,
        contextModel: CONTEXT_MODEL,
        batchTranslation: true,
        passwordKdfIterations: PBKDF2_ITERATIONS,
        mailConfigured: Boolean(env.RESEND_API_KEY && env.MAIL_FROM)
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
      if (url.pathname === '/api/auth/forgot' && request.method === 'POST') return this.forgotPassword(request);
      if (url.pathname === '/api/auth/reset' && request.method === 'POST') return this.resetPassword(request);
      if (url.pathname === '/api/auth/verify' && ['GET','POST'].includes(request.method)) return this.verifyEmail(request);
      if (url.pathname === '/api/auth/resend-verification' && request.method === 'POST') return this.resendVerification(request);
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
    const mailConfigured = Boolean(this.env.RESEND_API_KEY && this.env.MAIL_FROM);
    const user = {
      id: crypto.randomUUID(),
      email,
      passwordHash,
      salt,
      passwordIterations: PBKDF2_ITERATIONS,
      emailVerified: !mailConfigured,
      createdAt: new Date().toISOString()
    };

    await this.ctx.storage.put(`user-email:${email}`, user);
    await this.ctx.storage.put(`user-id:${user.id}`, { id: user.id, email: user.email, createdAt: user.createdAt, emailVerified: user.emailVerified });

    let verificationSent = false;
    if (mailConfigured) {
      try {
        await this.issueVerificationEmail(request, user);
        verificationSent = true;
      } catch (error) {
        console.error('verification email failed', error);
      }
    }

    return this.createSessionResponse(user, 201, { verificationRequired: !user.emailVerified, verificationSent });
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

  async createSessionResponse(user, status, extra = {}) {
    const token = randomBase64Url(32);
    const tokenHash = await sha256Base64Url(token);
    const expiresAt = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
    await this.ctx.storage.put(`session:${tokenHash}`, { userId: user.id, email: user.email, expiresAt });

    return json({ user: publicUser(user), ...extra }, status, 0, {
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
    const user = await this.ctx.storage.get(`user-email:${auth.email}`);
    return json({ user: user ? publicUser(user) : { id: auth.userId, email: auth.email, emailVerified: true } }, 200);
  }

  async forgotPassword(request) {
    const body = await safeJson(request);
    const email = normalizeEmail(body.email);
    if (!email) return json({ ok: true, message: 'Wenn ein Konto existiert, wurde eine E-Mail versendet.' }, 200);

    const user = await this.ctx.storage.get(`user-email:${email}`);
    if (!user) return json({ ok: true, message: 'Wenn ein Konto existiert, wurde eine E-Mail versendet.' }, 200);
    if (!this.env.RESEND_API_KEY || !this.env.MAIL_FROM) {
      return json({ error: 'Der E-Mail-Versand ist noch nicht konfiguriert. Hinterlege RESEND_API_KEY und MAIL_FROM als Cloudflare-Secrets.' }, 503);
    }

    const last = Number(await this.ctx.storage.get(`reset-rate:${email}`) || 0);
    if (Date.now() - last < 60_000) return json({ ok: true, message: 'Wenn ein Konto existiert, wurde eine E-Mail versendet.' }, 200);
    await this.ctx.storage.put(`reset-rate:${email}`, Date.now());

    const token = randomBase64Url(32);
    const tokenHash = await sha256Base64Url(token);
    const expiresAt = Date.now() + RESET_TOKEN_MINUTES * 60_000;
    await this.ctx.storage.put(`password-reset:${tokenHash}`, { userId: user.id, email, expiresAt });

    const origin = new URL(request.url).origin;
    const link = `${origin}/?reset=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;
    await sendTransactionalEmail(this.env, {
      to: email,
      subject: 'VocabFast – Passwort zurücksetzen',
      html: `<div style="font-family:Arial,sans-serif;line-height:1.55"><h2>Passwort zurücksetzen</h2><p>Du hast ein neues Passwort für VocabFast angefordert.</p><p><a href="${escapeHtmlEmail(link)}" style="display:inline-block;padding:12px 18px;background:#8ee63f;color:#10150b;text-decoration:none;border-radius:8px;font-weight:700">Neues Passwort festlegen</a></p><p>Der Link ist ${RESET_TOKEN_MINUTES} Minuten gültig. Wenn du das nicht angefordert hast, kannst du diese E-Mail ignorieren.</p></div>`
    });
    return json({ ok: true, message: 'Wenn ein Konto existiert, wurde eine E-Mail versendet.' }, 200);
  }

  async resetPassword(request) {
    const body = await safeJson(request);
    const email = normalizeEmail(body.email);
    const token = String(body.token || '').trim();
    const password = String(body.password || '');
    const validation = validateCredentials(email, password);
    if (validation) return json({ error: validation }, 400);
    if (!token) return json({ error: 'Der Reset-Link ist ungültig.' }, 400);

    const tokenHash = await sha256Base64Url(token);
    const reset = await this.ctx.storage.get(`password-reset:${tokenHash}`);
    if (!reset || reset.email !== email || !reset.expiresAt || reset.expiresAt < Date.now()) {
      if (reset) await this.ctx.storage.delete(`password-reset:${tokenHash}`);
      return json({ error: 'Der Reset-Link ist ungültig oder abgelaufen.' }, 400);
    }

    const user = await this.ctx.storage.get(`user-email:${email}`);
    if (!user || user.id !== reset.userId) return json({ error: 'Konto nicht gefunden.' }, 404);
    const salt = randomBase64Url(18);
    user.salt = salt;
    user.passwordHash = await hashPassword(password, salt);
    user.passwordIterations = PBKDF2_ITERATIONS;
    user.passwordChangedAt = new Date().toISOString();
    await this.ctx.storage.put(`user-email:${email}`, user);
    await this.ctx.storage.delete(`password-reset:${tokenHash}`);
    await this.revokeUserSessions(user.id);
    return json({ ok: true, message: 'Passwort wurde geändert. Du kannst dich jetzt anmelden.' }, 200);
  }

  async verifyEmail(request) {
    const url = new URL(request.url);
    const body = request.method === 'POST' ? await safeJson(request) : {};
    const email = normalizeEmail(body.email || url.searchParams.get('email'));
    const token = String(body.token || url.searchParams.get('token') || '').trim();
    if (!email || !token) return json({ error: 'Bestätigungslink ist ungültig.' }, 400);
    const tokenHash = await sha256Base64Url(token);
    const verification = await this.ctx.storage.get(`email-verify:${tokenHash}`);
    if (!verification || verification.email !== email || verification.expiresAt < Date.now()) {
      if (verification) await this.ctx.storage.delete(`email-verify:${tokenHash}`);
      return json({ error: 'Bestätigungslink ist ungültig oder abgelaufen.' }, 400);
    }
    const user = await this.ctx.storage.get(`user-email:${email}`);
    if (!user) return json({ error: 'Konto nicht gefunden.' }, 404);
    user.emailVerified = true;
    user.emailVerifiedAt = new Date().toISOString();
    await this.ctx.storage.put(`user-email:${email}`, user);
    await this.ctx.storage.put(`user-id:${user.id}`, { id: user.id, email: user.email, createdAt: user.createdAt, emailVerified: true });
    await this.ctx.storage.delete(`email-verify:${tokenHash}`);
    return json({ ok: true, user: publicUser(user) }, 200);
  }

  async resendVerification(request) {
    const auth = await this.authenticate(request);
    if (!auth) return json({ error: 'Nicht angemeldet.' }, 401);
    const user = await this.ctx.storage.get(`user-email:${auth.email}`);
    if (!user) return json({ error: 'Konto nicht gefunden.' }, 404);
    if (user.emailVerified) return json({ ok: true, message: 'E-Mail ist bereits bestätigt.' }, 200);
    if (!this.env.RESEND_API_KEY || !this.env.MAIL_FROM) return json({ error: 'E-Mail-Versand ist nicht konfiguriert.' }, 503);
    await this.issueVerificationEmail(request, user);
    return json({ ok: true, message: 'Bestätigungs-E-Mail wurde erneut gesendet.' }, 200);
  }

  async issueVerificationEmail(request, user) {
    const token = randomBase64Url(32);
    const tokenHash = await sha256Base64Url(token);
    const expiresAt = Date.now() + VERIFY_TOKEN_HOURS * 60 * 60 * 1000;
    await this.ctx.storage.put(`email-verify:${tokenHash}`, { userId: user.id, email: user.email, expiresAt });
    const origin = new URL(request.url).origin;
    const link = `${origin}/?verify=${encodeURIComponent(token)}&email=${encodeURIComponent(user.email)}`;
    await sendTransactionalEmail(this.env, {
      to: user.email,
      subject: 'VocabFast – E-Mail bestätigen',
      html: `<div style="font-family:Arial,sans-serif;line-height:1.55"><h2>Willkommen bei VocabFast</h2><p>Bestätige bitte deine E-Mail-Adresse.</p><p><a href="${escapeHtmlEmail(link)}" style="display:inline-block;padding:12px 18px;background:#8ee63f;color:#10150b;text-decoration:none;border-radius:8px;font-weight:700">E-Mail bestätigen</a></p><p>Der Link ist ${VERIFY_TOKEN_HOURS} Stunden gültig.</p></div>`
    });
  }

  async revokeUserSessions(userId) {
    const sessions = await this.ctx.storage.list({ prefix: 'session:' });
    const keys = [];
    for (const [key, value] of sessions) if (value?.userId === userId) keys.push(key);
    if (keys.length) await this.ctx.storage.delete(keys);
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
    // Curated specialist dictionary first. This makes thematic vocabulary deterministic
    // instead of asking a general-purpose model to guess aviation/business/etc. senses.
    const staticResult = findCuratedAutoTranslation(text, subjectContext);
    if (staticResult) {
      return json({
        translation: staticResult.translation, source: staticResult.source, target: staticResult.target,
        detectedLanguage: staticResult.source, provider: 'vocabfast-curated', contextApplied: Boolean(subjectContext)
      });
    }
    // First choice: one Cloudflare-hosted multilingual LLM detects the language
    // and returns a structured translation. This handles isolated words such as
    // "brick" / "Beton" and specialist terminology without relying on Google.
    if (env.AI) {
      // For ordinary words, first classify the input language and then use the
      // dedicated translation model. Separating detection and translation is
      // more reliable than asking one chat model to do both jobs at once.
      if (!subjectContext) {
        try {
          const source = await detectSourceLanguageWithAI(env, text);
          const target = source === 'DE' ? 'EN' : 'DE';
          const translation = await translateWithWorkersAI(env, text, source, target);
          if (translation && normalizeForComparison(translation) !== normalizeForComparison(text)) {
            return json({ translation, source, target, detectedLanguage: source, provider: 'cloudflare-m2m-auto', contextApplied: false });
          }
          if (translation) attempts.push('AI-Erkennung+M2M: Ausgabe war identisch zur Eingabe');
        } catch (error) {
          attempts.push(`AI-Erkennung+M2M: ${errorMessage(error)}`);
        }
      }

      // With a specialist context, a context-aware model gets first chance so
      // that e.g. aviation "approach" becomes "Anflug" rather than "Ansatz".
      try {
        const result = await autoDetectAndTranslateWithAI(env, text, subjectContext);
        if (validAutoTranslation(result, text) || (result?.translation && result?.source && result?.target)) {
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

      // Translate in both directions and keep the plausible direction. This
      // also handles single words for which language detection is difficult.
      try {
        const result = await autoDetectWithBidirectionalAI(env, text, subjectContext);
        if (validAutoTranslation(result, text)) {
          return json({ translation: result.translation, source: result.source, target: result.target, detectedLanguage: result.source, provider: 'cloudflare-ai-bidirectional', contextApplied: Boolean(subjectContext) });
        }
      } catch (error) {
        attempts.push(`AI-Bidirektional: ${errorMessage(error)}`);
      }

      try {
        const result = await autoDetectWithBidirectionalM2M(env, text);
        if (result?.translation) {
          return json({ translation: result.translation, source: result.source, target: result.target, detectedLanguage: result.source, provider: 'cloudflare-m2m-bidirectional', contextApplied: false });
        }
      } catch (error) {
        attempts.push(`M2M-Bidirektional: ${errorMessage(error)}`);
      }
    }

    // Last network fallback. MyMemory is intentionally used only after Workers AI;
    // the previous unofficial Google endpoint frequently returned HTTP 429.
    for (const guessed of [detectLanguageHeuristic(text), detectLanguageHeuristic(text) === 'DE' ? 'EN' : 'DE']) {
      const target = guessed === 'DE' ? 'EN' : 'DE';
      try {
        const translation = await translateWithMyMemory(text, guessed, target);
        if (translation && normalizeForComparison(translation) !== normalizeForComparison(text)) {
          return json({ translation, source: guessed, target, detectedLanguage: guessed, provider: 'mymemory-fallback', contextApplied: false });
        }
      } catch (error) {
        attempts.push(`MyMemory-${guessed}: ${errorMessage(error)}`);
      }
    }

    console.error('VocabFast auto translation failed:', attempts.join(' | '));
    return json({ error: 'Die Autoübersetzung ist gerade nicht verfügbar.', detail: attempts.join(' | ') }, 502);
  }

  const source = requestedSource;
  const target = requestedTarget;

  const curated = findCuratedExplicitTranslation(text, source, target, subjectContext);
  if (curated) return json({ translation: curated, source, target, detectedLanguage: source, provider: 'vocabfast-curated', contextApplied: Boolean(subjectContext) });

  // Explicit translations use a context-aware model first and the dedicated translation model as fallback.
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
  const context = String(body.context || '').trim().slice(0, 900);

  if (!texts.length) return json({ results: [] });
  if (texts.length > 10) return json({ error: 'Maximal 10 Wörter pro Batch.' }, 400);
  if (!['EN', 'DE'].includes(source) || !['EN', 'DE'].includes(target) || source === target) return json({ error: 'Ungültige Sprachrichtung.' }, 400);

  const unique = [...new Set(texts)].slice(0, 10);
  const results = [];

  if (env.AI) {
    // The dedicated translation model is preferred for ordinary vocabulary.
    // Ten calls are made concurrently, matching the endpoint's hard batch limit.
    try {
      const settled = await Promise.allSettled(unique.map(text => translateWithWorkersAI(env, text, source, target)));
      const m2m = settled.map((entry, index) => ({
        text: unique[index],
        translation: entry.status === 'fulfilled' ? cleanTranslation(entry.value) : '',
        ok: entry.status === 'fulfilled' && Boolean(cleanTranslation(entry.value)),
        provider: 'cloudflare-m2m100'
      }));
      if (m2m.every(x => x.ok)) return json({ source, target, results: m2m });
    } catch (error) {
      console.warn('M2M batch failed', error);
    }

    // Context-aware list translation is the fallback for specialist batches or
    // if one of the dedicated model calls fails.
    try {
      const batchTranslations = await translateListWithInstructionAI(env, unique, source, target, context);
      if (batchTranslations.length === unique.length) {
        for (let i = 0; i < unique.length; i++) {
          const translation = cleanTranslation(batchTranslations[i]);
          results.push({ text: unique[i], translation, ok: Boolean(translation), provider: 'cloudflare-ai-list' });
        }
        return json({ source, target, results });
      }
    } catch (error) {
      console.warn('Batch context AI failed', error);
    }
  }

  // Fallback to individual translation if a batch response is malformed.
  for (const text of unique) {
    const attempts = [];
    try {
      const translated = await translateExplicitWithFallbacks(env, text, source, target, context, attempts);
      if (translated?.translation) {
        results.push({ text, translation: translated.translation, ok: true, provider: translated.provider });
        continue;
      }
    } catch (error) { attempts.push(errorMessage(error)); }
    results.push({ text, translation: '', ok: false, error: attempts.join(' | ') || 'Übersetzung fehlgeschlagen.' });
  }
  return json({ source, target, results });
}

async function translateExplicitWithFallbacks(env, text, source, target, subjectContext, attempts = []) {
  if (env.DEEPL_API_KEY) {
    try {
      const translation = await translateWithDeepL(env, text, source, target, subjectContext);
      if (translation) return { translation, provider: 'deepl', contextApplied: Boolean(subjectContext) };
    } catch (error) { attempts.push(`DeepL: ${errorMessage(error)}`); }
  }

  if (env.AI) {
    const runM2M = async () => {
      try {
        const translation = await translateWithWorkersAI(env, text, source, target);
        if (translation) return { translation, provider: 'cloudflare-ai-translation', contextApplied: false };
      } catch (error) { attempts.push(`M2M100: ${errorMessage(error)}`); }
      return null;
    };
    const runContext = async () => {
      try {
        const translation = await translateWithInstructionAI(env, text, source, target, subjectContext);
        if (translation) return { translation, provider: 'cloudflare-ai-context', contextApplied: Boolean(subjectContext) };
      } catch (error) { attempts.push(`Kontext-AI: ${errorMessage(error)}`); }
      return null;
    };

    // Dedicated translation model first for ordinary dictionary words; context
    // model first when the user explicitly supplied a specialist domain.
    if (subjectContext) {
      const contextual = await runContext(); if (contextual) return contextual;
      const m2m = await runM2M(); if (m2m) return m2m;
    } else {
      const m2m = await runM2M(); if (m2m) return m2m;
      const contextual = await runContext(); if (contextual) return contextual;
    }
  }

  try {
    const translation = await translateWithMyMemory(text, source, target);
    if (translation) return { translation, provider: 'mymemory-fallback', contextApplied: false };
  } catch (error) { attempts.push(`MyMemory: ${errorMessage(error)}`); }

  return null;
}



const THEME_CONTEXT_HINTS = {
  aviation: ['aviation','aircraft','airplane','aeroplane','airbus','boeing','cockpit','pilot','flight','maintenance','luftfahrt','flugzeug','flugbetrieb','wartung'],
  basketball: ['basketball','nba','court','coach','basketballtraining','basketball coaching'],
  travel: ['travel','trip','holiday','vacation','hotel','reise','reisen','urlaub','tourismus'],
  business: ['business','company','finance','management','office','geschäft','unternehmen','firma','wirtschaft','finanzen'],
  food: ['food','restaurant','cooking','gastronomy','essen','restaurant','küche','gastronomie'],
  conversation: ['conversation','speaking','daily english','alltag','small talk','sprechen','konversation'],
  health: ['health','medical','medicine','doctor','hospital','gesundheit','medizin','arzt','krankenhaus']
};

function normalizeDictionaryKey(value) {
  return String(value || '').toLowerCase().trim().replace(/[“”„"']/g, '').replace(/\s+/g, ' ');
}

function topicFromContext(context) {
  const c = normalizeDictionaryKey(context);
  if (!c) return '';
  let best = '', bestScore = 0;
  for (const [topic, hints] of Object.entries(THEME_CONTEXT_HINTS)) {
    let score = 0;
    for (const hint of hints) if (c.includes(normalizeDictionaryKey(hint))) score++;
    if (score > bestScore) { best = topic; bestScore = score; }
  }
  return best;
}

function candidateThemeEntriesForEnglish(text) {
  const key = normalizeDictionaryKey(text);
  const entries = [];
  for (const [topic, dictionary] of Object.entries(THEME_DICTIONARIES)) {
    for (const [english, german] of Object.entries(dictionary || {})) {
      if (normalizeDictionaryKey(english) === key) entries.push({ topic, english, german });
    }
  }
  return entries;
}

function germanVariants(value) {
  const full = normalizeDictionaryKey(value);
  const variants = new Set([full]);
  String(value || '').split(/[\/;,]|\s+\bor\b\s+/i).forEach(part => {
    const cleaned = normalizeDictionaryKey(part.replace(/\([^)]*\)/g, ''));
    if (cleaned) variants.add(cleaned);
  });
  return variants;
}

function candidateThemeEntriesForGerman(text) {
  const key = normalizeDictionaryKey(text);
  const entries = [];
  for (const [topic, dictionary] of Object.entries(THEME_DICTIONARIES)) {
    for (const [english, german] of Object.entries(dictionary || {})) {
      if (germanVariants(german).has(key)) entries.push({ topic, english, german });
    }
  }
  return entries;
}

const SAFE_CURATED_WITHOUT_CONTEXT = new Set([
  'altimeter','airspeed indicator','autopilot','auxiliary power unit','avionics','bank angle','black box','bleed air',
  'cabin altitude','center of gravity','crosswind','deicing','flight director','flight level','flight management system',
  'flight recorder','fuselage','glide path','glide slope','horizontal stabilizer','hydraulic accumulator','hydraulic pressure',
  'instrument approach','instrument flight rules','instrument landing system','jet bridge','landing gear','load factor','mayday',
  'nose gear','notam','pitot tube','radio altimeter','rejected takeoff','reverse thrust','runway incursion','slat','speed brake',
  'spoiler','stall speed','static port','tailwind','taxiway','thrust reverser','transponder','turbofan','wake turbulence',
  'angle of attack','bird strike','crew resource management','go-around','ground proximity warning system','pressure bulkhead',
  'winglet','windsock','yoke'
]);

function chooseCuratedEntry(entries, subjectContext) {
  if (!entries.length) return null;
  const topic = topicFromContext(subjectContext);
  if (topic) {
    const exact = entries.find(x => x.topic === topic);
    if (exact) return exact;
  }
  // Without a subject context only deterministic specialist terms are taken from
  // the thematic dictionary. Ambiguous everyday words such as "approach",
  // "gate", "lift" or "pitch" are left to the general translator.
  if (entries.length === 1 && SAFE_CURATED_WITHOUT_CONTEXT.has(normalizeDictionaryKey(entries[0].english))) return entries[0];
  return null;
}

function findCuratedAutoTranslation(text, subjectContext) {
  const english = chooseCuratedEntry(candidateThemeEntriesForEnglish(text), subjectContext);
  if (english) return { source: 'EN', target: 'DE', translation: english.german };
  const german = chooseCuratedEntry(candidateThemeEntriesForGerman(text), subjectContext);
  if (german) return { source: 'DE', target: 'EN', translation: german.english };
  // A few extremely common unambiguous terms are kept locally so the basic translator
  // still works even if an AI model is temporarily unavailable.
  const commonEn = { brick:'Ziegelstein', concrete:'Beton', hello:'Hallo', goodbye:'Auf Wiedersehen', yes:'ja', no:'nein' };
  const commonDe = { ziegelstein:'brick', beton:'concrete', hallo:'hello', 'auf wiedersehen':'goodbye', ja:'yes', nein:'no' };
  const key = normalizeDictionaryKey(text);
  if (commonEn[key]) return { source:'EN', target:'DE', translation:commonEn[key] };
  if (commonDe[key]) return { source:'DE', target:'EN', translation:commonDe[key] };
  return null;
}

function findCuratedExplicitTranslation(text, source, target, subjectContext) {
  if (source === 'EN' && target === 'DE') {
    const entry = chooseCuratedEntry(candidateThemeEntriesForEnglish(text), subjectContext);
    return entry?.german || '';
  }
  if (source === 'DE' && target === 'EN') {
    const entry = chooseCuratedEntry(candidateThemeEntriesForGerman(text), subjectContext);
    return entry?.english || '';
  }
  return '';
}

async function autoDetectWithBidirectionalM2M(env, text) {
  const [enResult, deResult] = await Promise.allSettled([
    translateWithWorkersAI(env, text, 'EN', 'DE'),
    translateWithWorkersAI(env, text, 'DE', 'EN')
  ]);
  const enToDe = enResult.status === 'fulfilled' ? cleanTranslation(enResult.value) : '';
  const deToEn = deResult.status === 'fulfilled' ? cleanTranslation(deResult.value) : '';
  const original = normalizeForComparison(text);
  const enChanged = Boolean(enToDe) && normalizeForComparison(enToDe) !== original;
  const deChanged = Boolean(deToEn) && normalizeForComparison(deToEn) !== original;
  if (enChanged && !deChanged) return { source:'EN', target:'DE', translation:enToDe };
  if (deChanged && !enChanged) return { source:'DE', target:'EN', translation:deToEn };
  const guessed = detectLanguageHeuristic(text);
  if (guessed === 'EN' && enChanged) return { source:'EN', target:'DE', translation:enToDe };
  if (guessed === 'DE' && deChanged) return { source:'DE', target:'EN', translation:deToEn };
  if (enChanged) return { source:'EN', target:'DE', translation:enToDe };
  if (deChanged) return { source:'DE', target:'EN', translation:deToEn };
  throw new Error('Das Übersetzungsmodell hat in beiden Richtungen nur den Ausgangstext zurückgegeben.');
}

async function detectSourceLanguageWithAI(env, text) {
  const response = await env.AI.run(CONTEXT_MODEL, {
    messages: [
      { role: 'system', content: 'Classify one input as German or English. Return only DE or EN. No other text. Treat German nouns such as Beton, Reise, Werkzeug, Luftfahrt as DE. Treat English words such as brick, travel, tool, aviation as EN.' },
      { role: 'user', content: String(text || '').trim() }
    ],
    temperature: 0,
    max_tokens: 6
  });
  const raw = String(extractTextGeneration(response) || '').toUpperCase();
  const match = raw.match(/\b(DE|EN)\b/);
  if (!match) throw new Error(`Spracherkennung lieferte keine gültige Antwort: ${raw.slice(0,80)}`);
  return match[1];
}

async function autoDetectAndTranslateWithAI(env, text, subjectContext) {
  const contextLine = subjectContext ? `
Specialist context: ${subjectContext}` : '';
  const response = await env.AI.run(CONTEXT_MODEL, {
    messages: [
      {
        role: 'system',
        content: 'You are a precise German-English bilingual dictionary. The input is either German or English. Detect the source language and translate it into the other language. For technical terms use the specialist context when provided. Return exactly one line in the form EN|DE|German translation when the input is English, or DE|EN|English translation when the input is German. No explanation, no quotation marks. Never simply repeat the input unless it is genuinely identical in both languages. Examples: brick -> EN|DE|Ziegelstein; Beton -> DE|EN|concrete; in aviation context approach -> EN|DE|Anflug; bank angle -> EN|DE|Querneigungswinkel; altimeter -> EN|DE|Höhenmesser.'
      },
      { role: 'user', content: `Input: ${text}${contextLine}` }
    ],
    temperature: 0,
    max_tokens: 120
  });
  const raw = extractTextGeneration(response);
  const parsed = parseAutoTranslation(raw);
  if (!parsed) throw new Error(`Ungültige Modellantwort: ${String(raw || '').slice(0, 160)}`);
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

async function autoDetectWithBidirectionalAI(env, text, subjectContext = '') {
  const [enToDeResult, deToEnResult] = await Promise.allSettled([
    translateWithInstructionAI(env, text, 'EN', 'DE', subjectContext),
    translateWithInstructionAI(env, text, 'DE', 'EN', subjectContext)
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
  if (enChanged) return { source: 'EN', target: 'DE', translation: enToDe };
  if (deChanged) return { source: 'DE', target: 'EN', translation: deToEn };
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

async function translateListWithInstructionAI(env, texts, source, target, subjectContext) {
  const sourceName = source === 'EN' ? 'English' : 'German';
  const targetName = target === 'DE' ? 'German' : 'English';
  const contextLine = subjectContext ? `\nContext: ${subjectContext}` : '';
  const numbered = texts.map((text, index) => `${index + 1}. ${text}`).join('\n');
  const response = await env.AI.run(CONTEXT_MODEL, {
    messages: [
      {
        role: 'system',
        content: `Translate each numbered ${sourceName} vocabulary item into ${targetName}. Use the standard meaning that best fits the supplied context. For specialist terminology use the established technical term, not a literal word-for-word translation. Return exactly one line per item in the format NUMBER|TRANSLATION, in the same order, and nothing else.`
      },
      { role: 'user', content: `${numbered}${contextLine}` }
    ],
    temperature: 0,
    max_tokens: Math.min(500, 70 + texts.length * 28)
  });
  const raw = extractTextGeneration(response);
  const lines = String(raw || '').split(/\r?\n/).map(x => x.trim()).filter(Boolean);
  const out = Array(texts.length).fill('');
  for (const line of lines) {
    const m = line.match(/^\s*(\d+)\s*[|:\t]\s*(.+?)\s*$/);
    if (!m) continue;
    const index = Number(m[1]) - 1;
    if (index >= 0 && index < out.length) out[index] = cleanModelTranslation(m[2]);
  }
  if (out.filter(Boolean).length !== texts.length) throw new Error(`Batch-Modellantwort unvollständig (${out.filter(Boolean).length}/${texts.length}).`);
  return out;
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
    max_tokens: 100
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
        max_tokens: 60,
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

async function sendTransactionalEmail(env, { to, subject, html }) {
  const apiKey = String(env.RESEND_API_KEY || '').trim();
  const from = String(env.MAIL_FROM || '').trim();
  if (!apiKey || !from) throw new Error('E-Mail-Versand ist nicht konfiguriert.');
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: [to], subject, html })
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`E-Mail-Dienst HTTP ${response.status}${detail ? `: ${detail.slice(0, 180)}` : ''}`);
  }
  return response.json().catch(() => ({}));
}

function escapeHtmlEmail(value) {
  return String(value || '').replace(/[&<>"']/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch]));
}

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

function publicUser(user) {
  return { id: user.id, email: user.email, createdAt: user.createdAt, emailVerified: user.emailVerified !== false };
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
