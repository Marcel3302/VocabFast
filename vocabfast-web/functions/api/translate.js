export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const q = (url.searchParams.get('q') || '').trim();
  const source = url.searchParams.get('source') || 'en';
  const target = url.searchParams.get('target') || 'de';

  if (!q) {
    return Response.json({ error: 'Missing q parameter' }, { status: 400 });
  }

  if (q.length > 200) {
    return Response.json({ error: 'Text too long' }, { status: 400 });
  }

  const endpoint = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(q)}&langpair=${encodeURIComponent(source)}%7C${encodeURIComponent(target)}`;

  try {
    const response = await fetch(endpoint, {
      headers: { 'User-Agent': 'VocabFast/0.1' },
    });
    if (!response.ok) throw new Error('Translation provider failed');
    const data = await response.json();
    const translation = data?.responseData?.translatedText;
    if (!translation) throw new Error('No translation found');
    return Response.json({ translation });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Translation failed' },
      { status: 502 },
    );
  }
}
