const SESSION_COOKIE = 'vf_session';
const SESSION_DAYS = 30;
const API_VERSION = 'r2-account-v2';

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-VocabFast-API': API_VERSION,
      ...headers,
    },
  });
}
function error(message, status = 400, code = undefined) {
  return json(code ? { error: message, code } : { error: message }, status);
}
function normalizeEmail(v) { return String(v || '').trim().toLowerCase(); }
function cleanName(v) { return String(v || '').trim().slice(0, 60); }
function parseCookies(request) {
  const out = {};
  for (const part of (request.headers.get('Cookie') || '').split(';')) {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}
function bytesToBase64(bytes) {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}
function base64ToBytes(s) {
  if (typeof s !== 'string' || !s.length) throw Object.assign(new Error('Kontodaten sind beschädigt. Bitte Konto neu erstellen.'), { status: 409, code: 'ACCOUNT_DATA_INVALID' });
  try { const raw = atob(s); return Uint8Array.from(raw, c => c.charCodeAt(0)); }
  catch { throw Object.assign(new Error('Kontodaten sind beschädigt. Bitte Konto neu erstellen.'), { status: 409, code: 'ACCOUNT_DATA_INVALID' }); }
}
function bytesToHex(bytes) { return [...bytes].map(b => b.toString(16).padStart(2, '0')).join(''); }
function randomToken(bytes = 32) {
  return bytesToBase64(crypto.getRandomValues(new Uint8Array(bytes)))
    .replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}
async function sha256Hex(input) {
  const data = new TextEncoder().encode(input);
  return bytesToHex(new Uint8Array(await crypto.subtle.digest('SHA-256', data)));
}
async function hashPassword(password, saltBytes) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: saltBytes, iterations: 120000 }, key, 256);
  return bytesToBase64(new Uint8Array(bits));
}
function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
function sessionCookie(value, request, maxAge = SESSION_DAYS * 86400) {
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : '';
  return `${SESSION_COOKIE}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax${secure}; Max-Age=${maxAge}`;
}
function clearSessionCookie(request) {
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : '';
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax${secure}; Max-Age=0`;
}
function defaultState() {
  return {
    learning: [],
    customTopics: [],
    settings: { sort: 'importance-desc' },
    stats: { xp: 0, vocabCorrect: 0, vocabAnswered: 0, grammarCorrect: 0, grammarAnswered: 0, pdfUploads: 0, customTopics: 0, studyDates: [] },
    mastery: {},
  };
}
async function readBody(request) { try { return await request.json(); } catch { return {}; } }

function storage(env) {
  const bucket = env?.PDFS;
  if (!bucket || typeof bucket.get !== 'function' || typeof bucket.put !== 'function') {
    const e = new Error('Cloud-Speicher (R2) ist nicht mit dem Worker verbunden.');
    e.status = 503;
    e.code = 'R2_BINDING_MISSING';
    throw e;
  }
  return bucket;
}
async function getJson(bucket, key) {
  const obj = await bucket.get(key);
  if (!obj) return null;
  try { return JSON.parse(await obj.text()); } catch { return null; }
}
async function putJson(bucket, key, value) {
  await bucket.put(key, JSON.stringify(value), { httpMetadata: { contentType: 'application/json; charset=utf-8' } });
}
async function listKeys(bucket, prefix) {
  const keys = [];
  let cursor;
  do {
    const page = await bucket.list({ prefix, cursor, limit: 1000 });
    for (const o of page.objects || []) keys.push(o.key);
    cursor = page.truncated ? page.cursor : undefined;
  } while (cursor);
  return keys;
}
async function deleteKeys(bucket, keys) {
  for (let i = 0; i < keys.length; i += 1000) {
    const part = keys.slice(i, i + 1000);
    if (part.length) await bucket.delete(part);
  }
}
const profileKey = userId => `accounts/profiles/${userId}.json`;
const emailKey = async email => `accounts/emails/${await sha256Hex(normalizeEmail(email))}.json`;
const stateKey = userId => `accounts/state/${userId}.json`;
const sessionKey = (userId, tokenHash) => `accounts/sessions/${userId}/${tokenHash}.json`;
const sessionPrefix = userId => `accounts/sessions/${userId}/`;
const pdfMetaKey = (userId, id) => `pdfmeta/${userId}/${id}.json`;
const pdfMetaPrefix = userId => `pdfmeta/${userId}/`;
const pdfFileKey = (userId, id) => `pdfs/${userId}/${id}.pdf`;

async function createSession(bucket, userId, request) {
  const token = randomToken();
  const tokenHash = await sha256Hex(token);
  const now = Date.now();
  const expiresAt = now + SESSION_DAYS * 86400000;
  await putJson(bucket, sessionKey(userId, tokenHash), { userId, expiresAt, createdAt: now });
  const cookieValue = `${userId}.${token}`;
  return { cookie: sessionCookie(cookieValue, request) };
}
async function getUser(request, env) {
  const bucket = storage(env);
  const raw = parseCookies(request)[SESSION_COOKIE];
  if (!raw) return null;
  const dot = raw.indexOf('.');
  if (dot < 1) return null;
  const userId = raw.slice(0, dot);
  const token = raw.slice(dot + 1);
  if (!/^[0-9a-f-]{20,60}$/i.test(userId) || token.length < 20) return null;
  const tokenHash = await sha256Hex(token);
  const session = await getJson(bucket, sessionKey(userId, tokenHash));
  if (!session || Number(session.expiresAt) <= Date.now()) {
    if (session) await bucket.delete(sessionKey(userId, tokenHash));
    return null;
  }
  const profile = await getJson(bucket, profileKey(userId));
  if (!profile) return null;
  return { id: profile.id, email: profile.email, name: profile.name, createdAt: profile.createdAt, tokenHash };
}
async function authUser(request, env) {
  const u = await getUser(request, env);
  if (!u) throw Object.assign(new Error('Bitte anmelden.'), { status: 401, code: 'AUTH_REQUIRED' });
  return u;
}

async function apiRouter(request, env) {
  const url = new URL(request.url);
  const path = url.pathname.slice(4) || '/';
  const method = request.method.toUpperCase();
  try {
    const bucket = storage(env);

    if (path === '/health' && method === 'GET') {
      return json({ ok: true, storage: 'R2', apiVersion: API_VERSION });
    }

    if (path === '/auth/register' && method === 'POST') {
      const body = await readBody(request);
      const email = normalizeEmail(body.email);
      const name = cleanName(body.name);
      const password = String(body.password || '');
      if (!/^\S+@\S+\.\S+$/.test(email)) return error('Bitte eine gültige E-Mail eingeben.');
      if (password.length < 8) return error('Das Passwort muss mindestens 8 Zeichen lang sein.');
      const eKey = await emailKey(email);
      const oldIndex = await getJson(bucket, eKey);
      if (oldIndex?.userId) {
        const oldProfile = await getJson(bucket, profileKey(oldIndex.userId));
        if (oldProfile?.passwordHash && oldProfile?.passwordSalt) return error('Für diese E-Mail existiert bereits ein Konto.', 409);
        await bucket.delete(eKey).catch(() => {});
      }

      const id = crypto.randomUUID();
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const passwordHash = await hashPassword(password, salt);
      const now = Date.now();
      const profile = { id, email, name, passwordHash, passwordSalt: bytesToBase64(salt), passwordAlgo: 'PBKDF2-SHA256', passwordIterations: 120000, createdAt: now };
      try {
        await putJson(bucket, profileKey(id), profile);
        await putJson(bucket, stateKey(id), defaultState());
        await putJson(bucket, eKey, { userId: id, email });
      } catch (err) {
        await bucket.delete([profileKey(id), stateKey(id), eKey]).catch(() => {});
        throw err;
      }
      const session = await createSession(bucket, id, request);
      return json({ user: { id, email, name, createdAt: now } }, 201, { 'Set-Cookie': session.cookie });
    }

    if (path === '/auth/login' && method === 'POST') {
      const body = await readBody(request);
      const email = normalizeEmail(body.email);
      const password = String(body.password || '');
      const index = await getJson(bucket, await emailKey(email));
      if (!index?.userId) return error('E-Mail oder Passwort ist falsch.', 401);
      const profile = await getJson(bucket, profileKey(index.userId));
      if (!profile) return error('Dieses Konto ist unvollständig gespeichert. Bitte registriere die E-Mail erneut.', 409, 'ACCOUNT_PROFILE_MISSING');
      const saltValue = profile.passwordSalt ?? profile.password_salt;
      const hashValue = profile.passwordHash ?? profile.password_hash;
      if (!saltValue || !hashValue) return error('Dieses Konto stammt aus einer älteren fehlerhaften Version. Bitte registriere die E-Mail erneut.', 409, 'ACCOUNT_DATA_INVALID');
      let candidate;
      try { candidate = await hashPassword(password, base64ToBytes(saltValue)); }
      catch (cryptoErr) {
        if (cryptoErr?.status) throw cryptoErr;
        throw Object.assign(new Error('Passwortprüfung ist momentan nicht verfügbar. Bitte die Seite neu laden und erneut versuchen.'), { status: 503, code: 'AUTH_CRYPTO_ERROR' });
      }
      if (!safeEqual(candidate, hashValue)) return error('E-Mail oder Passwort ist falsch.', 401);
      const session = await createSession(bucket, profile.id, request);
      return json({ user: { id: profile.id, email: profile.email, name: profile.name, createdAt: profile.createdAt } }, 200, { 'Set-Cookie': session.cookie });
    }

    if (path === '/auth/logout' && method === 'POST') {
      const raw = parseCookies(request)[SESSION_COOKIE];
      if (raw) {
        const dot = raw.indexOf('.');
        if (dot > 0) {
          const userId = raw.slice(0, dot), token = raw.slice(dot + 1);
          if (/^[0-9a-f-]{20,60}$/i.test(userId) && token) {
            await bucket.delete(sessionKey(userId, await sha256Hex(token))).catch(() => {});
          }
        }
      }
      return json({ ok: true }, 200, { 'Set-Cookie': clearSessionCookie(request) });
    }

    if (path === '/me' && method === 'GET') {
      const u = await getUser(request, env);
      return json({ user: u ? { id: u.id, email: u.email, name: u.name, createdAt: u.createdAt } : null });
    }

    if (path === '/state' && method === 'GET') {
      const u = await authUser(request, env);
      let st = await getJson(bucket, stateKey(u.id));
      if (!st) { st = defaultState(); await putJson(bucket, stateKey(u.id), st); }
      return json({ state: st });
    }

    if (path === '/state' && method === 'PUT') {
      const u = await authUser(request, env);
      const body = await readBody(request);
      const raw = JSON.stringify(body || {});
      if (raw.length > 8_000_000) return error('Der Lernstand ist zu groß für eine einzelne Synchronisierung.', 413);
      await bucket.put(stateKey(u.id), raw, { httpMetadata: { contentType: 'application/json; charset=utf-8' } });
      return json({ ok: true, updatedAt: Date.now() });
    }

    if (path === '/profile' && method === 'PUT') {
      const u = await authUser(request, env);
      const body = await readBody(request);
      const name = cleanName(body.name);
      const profile = await getJson(bucket, profileKey(u.id));
      if (!profile) return error('Konto nicht gefunden.', 404);
      profile.name = name;
      await putJson(bucket, profileKey(u.id), profile);
      return json({ user: { id: u.id, email: u.email, name, createdAt: u.createdAt } });
    }

    if (path === '/pdfs' && method === 'GET') {
      const u = await authUser(request, env);
      const keys = await listKeys(bucket, pdfMetaPrefix(u.id));
      const rows = [];
      for (const key of keys) {
        const meta = await getJson(bucket, key);
        if (meta) rows.push(meta);
      }
      rows.sort((a, b) => Number(b.created || 0) - Number(a.created || 0));
      return json(rows);
    }

    if (path === '/pdfs' && method === 'POST') {
      const u = await authUser(request, env);
      const form = await request.formData();
      const file = form.get('file');
      const context = String(form.get('context') || '').slice(0, 250);
      if (!file || typeof file === 'string') return error('Keine PDF-Datei erhalten.');
      if (file.size > 30 * 1024 * 1024) return error('PDFs dürfen maximal 30 MB groß sein.', 413);
      const name = String(file.name || 'document.pdf').slice(0, 240);
      if (file.type !== 'application/pdf' && !name.toLowerCase().endsWith('.pdf')) return error('Nur PDF-Dateien sind erlaubt.');
      const id = crypto.randomUUID(), now = Date.now();
      const fKey = pdfFileKey(u.id, id), mKey = pdfMetaKey(u.id, id);
      const meta = { id, name, context, size: file.size, created: now };
      await bucket.put(fKey, file.stream(), { httpMetadata: { contentType: 'application/pdf' }, customMetadata: { originalName: name } });
      try { await putJson(bucket, mKey, meta); }
      catch (err) { await bucket.delete(fKey).catch(() => {}); throw err; }
      return json(meta, 201);
    }

    const fileMatch = path.match(/^\/pdfs\/([^/]+)\/file$/);
    if (fileMatch && method === 'GET') {
      const u = await authUser(request, env);
      const id = decodeURIComponent(fileMatch[1]);
      const meta = await getJson(bucket, pdfMetaKey(u.id, id));
      if (!meta) return error('PDF nicht gefunden.', 404);
      const obj = await bucket.get(pdfFileKey(u.id, id));
      if (!obj) return error('PDF-Datei fehlt im Speicher.', 404);
      return new Response(obj.body, { headers: {
        'Content-Type': 'application/pdf',
        'Content-Length': String(meta.size || obj.size || ''),
        'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(meta.name || 'document.pdf')}`,
        'Cache-Control': 'private, no-store',
      }});
    }

    const pdfMatch = path.match(/^\/pdfs\/([^/]+)$/);
    if (pdfMatch && method === 'DELETE') {
      const u = await authUser(request, env);
      const id = decodeURIComponent(pdfMatch[1]);
      const mKey = pdfMetaKey(u.id, id);
      if (!(await bucket.head(mKey))) return error('PDF nicht gefunden.', 404);
      await bucket.delete([mKey, pdfFileKey(u.id, id)]);
      return json({ ok: true });
    }

    if (path === '/pdfs' && method === 'DELETE') {
      const u = await authUser(request, env);
      const metaKeys = await listKeys(bucket, pdfMetaPrefix(u.id));
      const fileKeys = await listKeys(bucket, `pdfs/${u.id}/`);
      await deleteKeys(bucket, [...metaKeys, ...fileKeys]);
      return json({ ok: true, count: metaKeys.length });
    }

    if (path === '/account' && method === 'DELETE') {
      const u = await authUser(request, env);
      const body = await readBody(request);
      const password = String(body.password || '');
      const profile = await getJson(bucket, profileKey(u.id));
      if (!profile) return error('Konto nicht gefunden.', 404);
      const candidate = await hashPassword(password, base64ToBytes(profile.passwordSalt));
      if (!safeEqual(candidate, profile.passwordHash)) return error('Passwort ist falsch.', 401);

      const sessionKeys = await listKeys(bucket, sessionPrefix(u.id));
      const metaKeys = await listKeys(bucket, pdfMetaPrefix(u.id));
      const fileKeys = await listKeys(bucket, `pdfs/${u.id}/`);
      const eKey = await emailKey(profile.email);
      await deleteKeys(bucket, [...sessionKeys, ...metaKeys, ...fileKeys, profileKey(u.id), stateKey(u.id), eKey]);
      return json({ ok: true }, 200, { 'Set-Cookie': clearSessionCookie(request) });
    }

    return error('API-Endpunkt nicht gefunden.', 404);
  } catch (err) {
    console.error('VocabFast API error', err?.stack || err);
    if (err?.status) return error(err.message, err.status, err.code);
    const msg=String(err?.message||'');
    if(/R2|bucket|storage|object/i.test(msg)) return error('Cloud-Speicher ist momentan nicht erreichbar. Bitte in Cloudflare die R2-Bindung PDFS prüfen.', 503, 'R2_OPERATION_FAILED');
    return error('Interner Serverfehler. Bitte erneut versuchen.', 500, 'UNEXPECTED_API_ERROR');
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) return apiRouter(request, env);
    return env.ASSETS.fetch(request);
  },
};
