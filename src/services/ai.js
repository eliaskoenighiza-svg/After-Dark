const AI_URL = process.env.EXPO_PUBLIC_AI_URL || process.env.EXPO_PUBLIC_AI_PROXY_URL || 'http://10.0.2.2:8787/ai';
const HEALTH_URL = process.env.EXPO_PUBLIC_AI_HEALTH_URL || AI_URL.replace(/\/ai\/?$/i, '/health');

export const aiConfigured = () => Boolean(AI_URL);

function stripFences(text = '') {
  return String(text).trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
}

export function parseJsonLoose(text, fallback = null) {
  try { return JSON.parse(stripFences(text)); } catch { return fallback; }
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 12000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try { return await fetch(url, { ...options, signal: controller.signal }); }
  finally { clearTimeout(id); }
}

export async function checkAIConnection() {
  try {
    const res = await fetchWithTimeout(HEALTH_URL, { method: 'GET' }, 3500);
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) return { ok: false, error: data.error || `HTTP ${res.status}` };
    return { ok: true, model: data.model || 'claude-sonnet-4-6' };
  } catch (e) {
    return { ok: false, error: e?.name === 'AbortError' ? 'Zeitüberschreitung' : (e?.message || 'Keine Verbindung') };
  }
}

export async function askAI(messages, withSearch = false) {
  const res = await fetchWithTimeout(AI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, withSearch }),
  }, withSearch ? 30000 : 20000);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `KI-Fehler ${res.status}`);
  return data.text || '';
}

export async function dailyTrickAI(sport, skillContext = '') {
  const text = await askAI([{ role: 'user', content: `Du bist ein sicherheitsbewusster Freestyle-Coach. Sport: ${sport.name}. Aktueller Skillstand: ${skillContext}. Wähle genau EIN realistisches Tagesziel, das nur leicht über dem aktuellen sicheren Können liegt. Kein unnötiger Schwierigkeitssprung und kein Flip als nächster Schritt, wenn die Voraussetzungen fehlen. Antworte nur JSON ohne Markdown: {"trick":"...","tip":"...","safety":"..."}` }]);
  return parseJsonLoose(text);
}

export async function coachAI(sport, question, imageBase64, skillContext = '') {
  const content = [];
  if (imageBase64) content.push({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: imageBase64 } });
  content.push({ type: 'text', text: `Sportart: ${sport.name}. Aktueller Skillstand: ${skillContext}. Frage: ${question || 'Bewerte Technik und gib sichere Verbesserungsschritte.'} Antworte auf Deutsch, kompakt, mit Schritt-für-Schritt-Anleitung. Beziehe den vorhandenen Skillstand ein und schlage nur realistische nächste Schritte vor. Nenne einen Sicherheits-Hinweis. Keine Mutproben und keine unnötigen Risikosprünge.` });
  return askAI([{ role: 'user', content }]);
}

export async function searchParksAI(sport, home, filters) {
  const text = await askAI([{ role: 'user', content: `Suche echte Anlagen rund um ${home} für ${sport.name}. Geeignete Typen: ${sport.parkTypes.join(', ')}. Prüfe ausdrücklich, ob ${sport.name} dort erlaubt ist. Bei Unsicherheit exakt "Erlaubnis unklar – vorher anrufen". Filter: nur überdacht=${filters.covered}, nur Flutlicht=${filters.floodlight}. Antworte NUR als JSON-Array ohne Markdown. Felder: name, ort, ausstattung, begruendung, entfernungKm, himmelsrichtung, typ, indoor (boolean), flutlicht (boolean oder null), website, erlaubnis, latitude, longitude. Koordinaten müssen Zahlen sein. Nenne nur reale Anlagen, keine erfundenen.` }], true);
  return parseJsonLoose(text, []);
}

export async function transitAI(sport, home, park) {
  const bike = ['bmx', 'mtb'].includes(sport.id);
  const device = bike
    ? 'Prüfe Fahrradmitnahme, Fahrradabteil, Fahrradkarte und Sperrzeiten. Weise darauf hin, dass Fahrradmitnahme in Straßenbahnen je nach Verbund eingeschränkt oder verboten sein kann.'
    : 'Behandle das Sportgerät als Gepäck und nenne relevante Beförderungsregeln nur, wenn sie sicher belegt sind.';
  return askAI([{ role: 'user', content: `Suche eine aktuelle ÖPNV-Verbindung von ${home} nach ${park.name}, ${park.ort}. ${device} Gib eine kurze praktische Verbindungsempfehlung und kennzeichne Unsicherheiten.` }], true);
}

export async function weatherAI(home, sport) {
  const now = new Date();
  const winter = sport.season === 'winter';
  const text = await askAI([{ role: 'user', content: `Suche das aktuelle Wetter für ${home}. Aktuelles Datum und Uhrzeit lokal: ${now.toString()}. Sport: ${sport.name}. Antworte NUR JSON ohne Markdown mit jetzt, spaeter, morgen, nass (boolean), empfehlung ("Halle" oder "Outdoor" oder "Beides")${winter ? ', schneehoehe, pistenzustand' : ''}. Keine erfundenen Messwerte; Unsicherheit kennzeichnen.` }], true);
  return parseJsonLoose(text);
}

export async function weeklyReviewAI(stats, sport) {
  return askAI([{ role: 'user', content: `Schreibe einen kurzen Wochenrückblick für ${sport.name}. Statistik: ${JSON.stringify(stats)}. Locker, motivierend, aber ohne riskante Aufforderungen.` }]);
}
