export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const q = (url.searchParams.get('q') || '').trim();
  if (!q) return json({ error: 'Missing q parameter' }, 400);
  if (q.length > 60 || !/^[A-Za-z][A-Za-z'’-]*$/.test(q)) return json({ example: fallback(q) }, 200);

  try {
    const endpoint = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(q)}`;
    const response = await fetch(endpoint, { cf: { cacheTtl: 604800, cacheEverything: true } });
    if (!response.ok) return json({ example: fallback(q) }, 200);
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
    const example = examples.find(x => x.toLowerCase().includes(lower)) || examples[0] || fallback(q);
    return json({ example: example.length > 180 ? example.slice(0, 177) + '…' : example }, 200);
  } catch (_) {
    return json({ example: fallback(q) }, 200);
  }
}

function fallback(word) {
  return `The word “${word}” is useful in everyday English.`;
}

function json(data, status) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=86400' }
  });
}
