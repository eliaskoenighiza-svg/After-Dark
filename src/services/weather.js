const AI_URL =
  process.env.EXPO_PUBLIC_AI_URL ||
  process.env.EXPO_PUBLIC_AI_PROXY_URL ||
  'http://10.0.2.2:8787/ai';
const WEATHER_PROXY_URL = AI_URL.replace(/\/ai\/?$/i, '/weather');

async function fetchJson(url, options = {}, timeoutMs = 22000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    const data = await response.json().catch(() => null);

    if (!response.ok || !data) {
      throw new Error(data?.error || `Wetterdienst antwortet nicht (HTTP ${response.status}).`);
    }

    return data;
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error('Wetterabfrage hat zu lange gedauert.');
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export async function getWeather(home, sport) {
  const place = String(home || '').trim();
  if (!place) throw new Error('Im Profil fehlt dein Wohnort.');

  return fetchJson(
    WEATHER_PROXY_URL,
    {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        home: place,
        season: sport?.season || '',
      }),
    },
    24000
  );
}
