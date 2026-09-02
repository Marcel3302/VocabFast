export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const q = (url.searchParams.get('q') || '').trim();
  const source = url.searchParams.get('source') || 'en';
  const target = url.searchParams.get('target') || 'de';

  if (!q) return json({ error: 'Missing q parameter' }, 400);
  if (q.length > 120) return json({ error: 'Text too long' }, 400);

  try {
    const endpoint = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(q)}&langpair=${encodeURIComponent(source)}%7C${encodeURIComponent(target)}`;
    const response = await fetch(endpoint, { headers: { 'User-Agent': 'VocabFast/0.2' } });
    if (!response.ok) throw new Error('Translation provider unavailable');
    const data = await response.json();
    const translation = data && data.responseData && data.responseData.translatedText;
    if (!translation) throw new Error('No translation found');
    return json({ translation }, 200);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Translation failed' }, 502);
  }
}

function json(data, status) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
  });
}
