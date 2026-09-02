const CORE_COUNT = 4500;
const KELLY_URL = 'https://raw.githubusercontent.com/kotoshu/frequency-list-kelly/main/data/en.json';
const LEIPZIG_BASE = 'https://raw.githubusercontent.com/imjxyang/English-words/master/wiki/';

export async function onRequestGet() {
  try {
    const words = await loadKelly();
    if (words.length >= CORE_COUNT) {
      return json({ count: CORE_COUNT, source: 'Kelly Project', words: words.slice(0, CORE_COUNT) }, 200, 86400);
    }
    throw new Error(`Kelly returned only ${words.length} usable words`);
  } catch (primaryError) {
    try {
      const words = await loadLeipzig();
      if (words.length < CORE_COUNT) throw new Error(`Fallback returned only ${words.length} usable words`);
      return json({ count: CORE_COUNT, source: 'Leipzig Wikipedia frequency fallback', words: words.slice(0, CORE_COUNT) }, 200, 86400);
    } catch (fallbackError) {
      return json({
        error: 'Core vocabulary unavailable',
        detail: `${primaryError instanceof Error ? primaryError.message : primaryError}; ${fallbackError instanceof Error ? fallbackError.message : fallbackError}`
      }, 502, 0);
    }
  }
}

async function loadKelly() {
  const response = await fetch(KELLY_URL, { cf: { cacheTtl: 86400, cacheEverything: true } });
  if (!response.ok) throw new Error(`Kelly source HTTP ${response.status}`);
  const data = await response.json();
  if (!data || !Array.isArray(data.full_list)) throw new Error('Kelly source format changed');

  const allowed = new Set(['A1','A2','B1','B2','C1']);
  const seen = new Set();
  const output = [];

  for (const item of data.full_list) {
    const raw = String(item.word || '').trim();
    const cefr = String(item.cefr || '').toUpperCase();
    if (!allowed.has(cefr)) continue;
    if (!/^[A-Za-z][A-Za-z'’-]*$/.test(raw)) continue;
    if (raw !== 'I' && /^[A-Z]/.test(raw)) continue;
    const key = raw.toLowerCase().replace('’', "'");
    if (seen.has(key)) continue;
    seen.add(key);
    output.push({
      word: raw === 'I' ? 'I' : key,
      cefr,
      pos: String(item.pos || '').trim(),
      rank: Number(item.rank) || output.length + 1
    });
    if (output.length === CORE_COUNT) break;
  }
  return output;
}

async function loadLeipzig() {
  const files = ['1-1000.csv','1001-2000.csv','2001-3000.csv','3001-4000.csv','4001-5000.csv','5001-6000.csv','6001-7000.csv'];
  const seen = new Set();
  const output = [];
  let rank = 0;

  for (const file of files) {
    const response = await fetch(LEIPZIG_BASE + file, { cf: { cacheTtl: 86400, cacheEverything: true } });
    if (!response.ok) continue;
    const text = await response.text();
    for (const line of text.split(/\r?\n/)) {
      rank += 1;
      const raw = line.trim();
      if (!/^[A-Za-z][A-Za-z'’-]*$/.test(raw)) continue;
      if (raw !== 'I' && /^[A-Z]/.test(raw)) continue;
      const key = raw.toLowerCase().replace('’', "'");
      if (seen.has(key)) continue;
      seen.add(key);
      output.push({ word: raw === 'I' ? 'I' : key, cefr: '', pos: '', rank });
      if (output.length === CORE_COUNT) return output;
    }
  }
  return output;
}

function json(data, status, maxAge) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': maxAge ? `public, max-age=${maxAge}` : 'no-store'
    }
  });
}
