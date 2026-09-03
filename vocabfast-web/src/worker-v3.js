import legacyWorker from './worker.js';

const SESSION_COOKIE = 'vf_session';
const SESSION_DAYS = 30;
const PASSWORD_ITERATIONS = 100000;
const API_VERSION = 'r2-account-v3';

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-VocabFast-API': API_VERSION, ...headers } });
}
function error(message, status = 400, code) { return json(code ? { error: message, code } : { error: message }, status); }
function normalizeEmail(v) { return String(v || '').trim().toLowerCase(); }
function cleanName(v) { return String(v || '').trim().slice(0, 60); }
function parseCookies(request) { const out = {}; for (const part of (request.headers.get('Cookie') || '').split(';')) { const i = part.indexOf('='); if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim()); } return out; }
function bytesToBase64(bytes) { let s = ''; for (const b of bytes) s += String.fromCharCode(b); return btoa(s); }
function base64ToBytes(s) { if (typeof s !== 'string' || !s) throw Object.assign(new Error('Kontodaten sind beschädigt.'), { status: 409, code: 'ACCOUNT_DATA_INVALID' }); try { return Uint8Array.from(atob(s), c => c.charCodeAt(0)); } catch { throw Object.assign(new Error('Kontodaten sind beschädigt.'), { status: 409, code: 'ACCOUNT_DATA_INVALID' }); } }
function bytesToHex(bytes) { return [...bytes].map(b => b.toString(16).padStart(2, '0')).join(''); }
function randomToken(bytes = 32) { return bytesToBase64(crypto.getRandomValues(new Uint8Array(bytes))).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', ''); }
async function sha256Hex(input) { const data = new TextEncoder().encode(input); return bytesToHex(new Uint8Array(await crypto.subtle.digest('SHA-256', data))); }
async function hashPassword(password, saltBytes, iterations = PASSWORD_ITERATIONS) {
  const count = Number(iterations || PASSWORD_ITERATIONS);
  if (!Number.isInteger(count) || count < 10000 || count > 100000) throw Object.assign(new Error('Dieses Konto nutzt eine nicht unterstützte Passwortversion.'), { status: 409, code: 'PASSWORD_VERSION_UNSUPPORTED' });
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: saltBytes, iterations: count }, key, 256);
  return bytesToBase64(new Uint8Array(bits));
}
function safeEqual(a, b) { if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false; let diff = 0; for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i); return diff === 0; }
function sessionCookie(value, request, maxAge = SESSION_DAYS * 86400) { const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : ''; return `${SESSION_COOKIE}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax${secure}; Max-Age=${maxAge}`; }
function clearSessionCookie(request) { const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : ''; return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax${secure}; Max-Age=0`; }
function storage(env) { const bucket = env?.PDFS; if (!bucket || typeof bucket.get !== 'function' || typeof bucket.put !== 'function') throw Object.assign(new Error('Cloud-Speicher (R2) ist nicht verbunden.'), { status: 503, code: 'R2_BINDING_MISSING' }); return bucket; }
async function getJson(bucket, key) { const obj = await bucket.get(key); if (!obj) return null; try { return JSON.parse(await obj.text()); } catch { return null; } }
async function putJson(bucket, key, value) { await bucket.put(key, JSON.stringify(value), { httpMetadata: { contentType: 'application/json; charset=utf-8' } }); }
async function listKeys(bucket, prefix) { const keys = []; let cursor; do { const page = await bucket.list({ prefix, cursor, limit: 1000 }); for (const o of page.objects || []) keys.push(o.key); cursor = page.truncated ? page.cursor : undefined; } while (cursor); return keys; }
async function deleteKeys(bucket, keys) { for (let i = 0; i < keys.length; i += 1000) { const part = keys.slice(i, i + 1000); if (part.length) await bucket.delete(part); } }
async function readBody(request) { try { return await request.json(); } catch { return {}; } }
function defaultState() { return { learning: [], customTopics: [], settings: { sort: 'importance-desc' }, stats: { xp: 0, vocabCorrect: 0, vocabAnswered: 0, grammarCorrect: 0, grammarAnswered: 0, pdfUploads: 0, customTopics: 0, studyDates: [] }, mastery: {} }; }
const profileKey = id => `accounts/profiles/${id}.json`;
const stateKey = id => `accounts/state/${id}.json`;
const emailKey = async email => `accounts/emails/${await sha256Hex(normalizeEmail(email))}.json`;
const sessionKey = (id, tokenHash) => `accounts/sessions/${id}/${tokenHash}.json`;
const sessionPrefix = id => `accounts/sessions/${id}/`;
const pdfMetaPrefix = id => `pdfmeta/${id}/`;
const pdfFilePrefix = id => `pdfs/${id}/`;
async function createSession(bucket, userId, request) { const token = randomToken(); const tokenHash = await sha256Hex(token); const now = Date.now(); await putJson(bucket, sessionKey(userId, tokenHash), { userId, expiresAt: now + SESSION_DAYS * 86400000, createdAt: now }); return sessionCookie(`${userId}.${token}`, request); }
async function getUser(request, bucket) {
  const raw = parseCookies(request)[SESSION_COOKIE]; if (!raw) return null;
  const dot = raw.indexOf('.'); if (dot < 1) return null;
  const userId = raw.slice(0, dot), token = raw.slice(dot + 1);
  if (!/^[0-9a-f-]{20,60}$/i.test(userId) || token.length < 20) return null;
  const tokenHash = await sha256Hex(token); const session = await getJson(bucket, sessionKey(userId, tokenHash));
  if (!session || Number(session.expiresAt) <= Date.now()) return null;
  const profile = await getJson(bucket, profileKey(userId)); return profile ? { ...profile, tokenHash } : null;
}

async function register(request, env) {
  const bucket = storage(env), body = await readBody(request);
  const email = normalizeEmail(body.email), name = cleanName(body.name), password = String(body.password || '');
  if (!/^\S+@\S+\.\S+$/.test(email)) return error('Bitte eine gültige E-Mail eingeben.');
  if (password.length < 8) return error('Das Passwort muss mindestens 8 Zeichen lang sein.');
  const eKey = await emailKey(email), oldIndex = await getJson(bucket, eKey);
  if (oldIndex?.userId) {
    const oldProfile = await getJson(bucket, profileKey(oldIndex.userId));
    if (!oldProfile) await bucket.delete(eKey);
    else {
      const salt = oldProfile.passwordSalt ?? oldProfile.password_salt, hash = oldProfile.passwordHash ?? oldProfile.password_hash;
      const iterations = Number(oldProfile.passwordIterations ?? oldProfile.password_iterations ?? PASSWORD_ITERATIONS);
      if (!salt || !hash) return error('Dieses Konto ist unvollständig. Bitte den alten Kontoeintrag einmal entfernen und danach neu registrieren.', 409, 'ACCOUNT_DATA_INVALID');
      if (iterations > 100000) return error('Dieses Konto stammt aus der fehlerhaften Passwortversion. Bitte den alten Kontoeintrag einmal entfernen und danach neu registrieren.', 409, 'PASSWORD_VERSION_UNSUPPORTED');
      const candidate = await hashPassword(password, base64ToBytes(salt), iterations);
      if (safeEqual(candidate, hash)) { const cookie = await createSession(bucket, oldProfile.id, request); return json({ user: { id: oldProfile.id, email: oldProfile.email, name: oldProfile.name, createdAt: oldProfile.createdAt }, recovered: true }, 200, { 'Set-Cookie': cookie }); }
      return error('Für diese E-Mail existiert bereits ein Konto. Bitte anmelden.', 409, 'ACCOUNT_EXISTS');
    }
  }
  const id = crypto.randomUUID(), salt = crypto.getRandomValues(new Uint8Array(16)), now = Date.now();
  const passwordHash = await hashPassword(password, salt, PASSWORD_ITERATIONS);
  const profile = { id, email, name, passwordHash, passwordSalt: bytesToBase64(salt), passwordAlgo: 'PBKDF2-SHA256', passwordIterations: PASSWORD_ITERATIONS, createdAt: now };
  try {
    await putJson(bucket, profileKey(id), profile); await putJson(bucket, stateKey(id), defaultState()); await putJson(bucket, eKey, { userId: id, email });
    const cookie = await createSession(bucket, id, request); return json({ user: { id, email, name, createdAt: now } }, 201, { 'Set-Cookie': cookie });
  } catch (err) { await bucket.delete([profileKey(id), stateKey(id), eKey]).catch(() => {}); throw err; }
}

async function login(request, env) {
  const bucket = storage(env), body = await readBody(request), email = normalizeEmail(body.email), password = String(body.password || '');
  const index = await getJson(bucket, await emailKey(email));
  if (!index?.userId) return error('Für diese E-Mail wurde noch kein Konto gefunden. Bitte zuerst registrieren.', 401, 'ACCOUNT_NOT_FOUND');
  const profile = await getJson(bucket, profileKey(index.userId));
  if (!profile) return error('Das Konto ist unvollständig gespeichert. Bitte erneut registrieren.', 409, 'ACCOUNT_PROFILE_MISSING');
  const salt = profile.passwordSalt ?? profile.password_salt, hash = profile.passwordHash ?? profile.password_hash;
  const iterations = Number(profile.passwordIterations ?? profile.password_iterations ?? PASSWORD_ITERATIONS);
  if (!salt || !hash) return error('Kontodaten sind unvollständig.', 409, 'ACCOUNT_DATA_INVALID');
  if (iterations > 100000) return error('Dieses Konto stammt aus der fehlerhaften Passwortversion und muss einmal neu angelegt werden.', 409, 'PASSWORD_VERSION_UNSUPPORTED');
  const candidate = await hashPassword(password, base64ToBytes(salt), iterations);
  if (!safeEqual(candidate, hash)) return error('Das Passwort ist falsch.', 401, 'WRONG_PASSWORD');
  const cookie = await createSession(bucket, profile.id, request);
  return json({ user: { id: profile.id, email: profile.email, name: profile.name, createdAt: profile.createdAt } }, 200, { 'Set-Cookie': cookie });
}

async function deleteAccount(request, env) {
  const bucket = storage(env), user = await getUser(request, bucket);
  if (!user) return error('Bitte anmelden.', 401, 'AUTH_REQUIRED');
  const body = await readBody(request), password = String(body.password || '');
  const salt = user.passwordSalt ?? user.password_salt, hash = user.passwordHash ?? user.password_hash;
  const iterations = Number(user.passwordIterations ?? user.password_iterations ?? PASSWORD_ITERATIONS);
  if (!salt || !hash) return error('Kontodaten sind unvollständig.', 409, 'ACCOUNT_DATA_INVALID');
  const candidate = await hashPassword(password, base64ToBytes(salt), iterations);
  if (!safeEqual(candidate, hash)) return error('Passwort ist falsch.', 401, 'WRONG_PASSWORD');
  const keys = [ ...(await listKeys(bucket, sessionPrefix(user.id))), ...(await listKeys(bucket, pdfMetaPrefix(user.id))), ...(await listKeys(bucket, pdfFilePrefix(user.id))), profileKey(user.id), stateKey(user.id), await emailKey(user.email) ];
  await deleteKeys(bucket, keys);
  return json({ ok: true }, 200, { 'Set-Cookie': clearSessionCookie(request) });
}

export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname;
    try {
      if (path === '/api/health') return json({ ok: true, storage: 'R2', apiVersion: API_VERSION, passwordIterations: PASSWORD_ITERATIONS });
      if (path === '/api/auth/register' && request.method === 'POST') return await register(request, env);
      if (path === '/api/auth/login' && request.method === 'POST') return await login(request, env);
      if (path === '/api/account' && request.method === 'DELETE') return await deleteAccount(request, env);
      return await legacyWorker.fetch(request, env);
    } catch (err) {
      console.error('VocabFast v3 auth error', err?.stack || err);
      if (err?.status) return error(err.message, err.status, err.code);
      return error('Interner Serverfehler bei der Kontoanmeldung. Bitte erneut versuchen.', 500, 'AUTH_INTERNAL_ERROR');
    }
  },
};
