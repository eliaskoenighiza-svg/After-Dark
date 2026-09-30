const MODEL = '@cf/google/gemma-4-26b-a4b-it';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

const OVERPASS_ENDPOINTS = [
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass-api.de/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
];

const GEOCODE_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...CORS,
      'Content-Type': 'application/json; charset=utf-8',
    },
  });
}

function normalizePart(part) {
  if (!part || typeof part !== 'object') return null;

  if (part.type === 'text') {
    return { type: 'text', text: String(part.text || '') };
  }

  if (part.type === 'image' && part.source?.data) {
    const media = part.source.media_type || 'image/jpeg';
    return {
      type: 'image_url',
      image_url: {
        url: `data:${media};base64,${part.source.data}`,
      },
    };
  }

  if (part.type === 'image_url' && part.image_url?.url) {
    return part;
  }

  return null;
}

function normalizeMessage(message) {
  const role = ['system', 'user', 'assistant', 'tool'].includes(message?.role)
    ? message.role
    : 'user';

  if (typeof message?.content === 'string') {
    return { role, content: message.content };
  }

  if (Array.isArray(message?.content)) {
    const content = message.content.map(normalizePart).filter(Boolean);
    return { role, content };
  }

  return { role, content: String(message?.content || '') };
}

function extractText(result) {
  if (typeof result?.response === 'string') return result.response;
  if (typeof result?.result === 'string') return result.result;
  const choice = result?.choices?.[0]?.message?.content;
  if (typeof choice === 'string') return choice;
  if (Array.isArray(choice)) {
    return choice.map((p) => p?.text || '').join('\n').trim();
  }
  return '';
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 26000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function fetchJsonStrict(url, options = {}, timeoutMs = 16000, label = 'Dienst') {
  const response = await fetchWithTimeout(url, options, timeoutMs);
  const data = await response.json().catch(() => null);

  if (!response.ok || !data) {
    throw new Error(`${label} antwortet nicht (HTTP ${response.status}).`);
  }

  return data;
}

async function geocodePlace(home) {
  const place = String(home || '').trim();
  if (!place) throw new Error('Im Profil fehlt dein Wohnort.');

  const url =
    `${GEOCODE_URL}?name=${encodeURIComponent(place)}&count=1&language=de&format=json`;
  const data = await fetchJsonStrict(url, {}, 12000, 'Ortsdienst');
  const location = data?.results?.[0];

  if (!location) {
    throw new Error(`Wohnort „${place}“ wurde nicht gefunden.`);
  }

  return {
    latitude: Number(location.latitude),
    longitude: Number(location.longitude),
    name: [location.name, location.admin1].filter(Boolean).join(', '),
  };
}

function weatherText(code) {
  const value = Number(code);
  if (value === 0) return 'klar';
  if (value === 1) return 'überwiegend klar';
  if (value === 2) return 'teils bewölkt';
  if (value === 3) return 'bewölkt';
  if (value === 45 || value === 48) return 'Nebel';
  if ([51, 53, 55, 56, 57].includes(value)) return 'Nieselregen';
  if ([61, 63, 65, 66, 67].includes(value)) return 'Regen';
  if ([71, 73, 75, 77].includes(value)) return 'Schnee';
  if ([80, 81, 82].includes(value)) return 'Regenschauer';
  if ([85, 86].includes(value)) return 'Schneeschauer';
  if ([95, 96, 99].includes(value)) return 'Gewitter';
  return 'wechselhaft';
}

function roundNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.round(number) : null;
}

function maxNumber(values = []) {
  const numbers = values.map(Number).filter(Number.isFinite);
  return numbers.length ? Math.max(...numbers) : 0;
}

function sumNumbers(values = []) {
  return values
    .map(Number)
    .filter(Number.isFinite)
    .reduce((total, value) => total + value, 0);
}

async function getWeatherData(home, season) {
  const location = await geocodePlace(home);
  const params = [
    `latitude=${encodeURIComponent(location.latitude)}`,
    `longitude=${encodeURIComponent(location.longitude)}`,
    'current=temperature_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m',
    'hourly=temperature_2m,precipitation_probability,precipitation,weather_code',
    'daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,snowfall_sum',
    'timezone=auto',
    'forecast_days=2',
  ].join('&');

  const data = await fetchJsonStrict(`${FORECAST_URL}?${params}`, {}, 16000, 'Wetterdienst');
  const current = data?.current || {};
  const hourly = data?.hourly || {};
  const daily = data?.daily || {};

  const currentHour = String(current.time || '').slice(0, 13);
  let currentIndex = Array.isArray(hourly.time)
    ? hourly.time.findIndex((time) => String(time).startsWith(currentHour))
    : -1;
  if (currentIndex < 0) currentIndex = 0;

  const laterIndex = Math.min(
    currentIndex + 3,
    Math.max(0, (hourly.time?.length || 1) - 1),
  );
  const nextSixEnd = Math.min(
    currentIndex + 7,
    hourly.time?.length || currentIndex + 1,
  );
  const probabilities = hourly.precipitation_probability?.slice(currentIndex, nextSixEnd) || [];
  const precipitation = hourly.precipitation?.slice(currentIndex, nextSixEnd) || [];

  const rainRisk = maxNumber(probabilities);
  const rainAmount = sumNumbers(precipitation);
  const currentPrecip = Number(current.precipitation || 0);
  const currentCode = Number(current.weather_code);
  const wind = Number(current.wind_speed_10m || 0);
  const wetNow = currentPrecip >= 0.1;
  const storm = [95, 96, 99].includes(currentCode);
  const winterSport = season === 'winter';

  let recommendation;
  if (storm) {
    recommendation = 'Halle – Gewitter in den aktuellen Wetterdaten.';
  } else if (winterSport && [71, 73, 75, 77, 85, 86].includes(currentCode)) {
    recommendation = 'Outdoor – winterliche Bedingungen. Piste und Untergrund vor Ort prüfen.';
  } else if (wetNow || rainAmount >= 1 || rainRisk >= 60) {
    recommendation = `Halle – in den nächsten Stunden liegt das Regenrisiko bei bis zu ${Math.round(rainRisk)} %.`;
  } else if (rainRisk >= 35 || wind >= 35) {
    recommendation = 'Beides – grundsätzlich möglich, Wetter vor der Session noch einmal prüfen.';
  } else {
    recommendation = 'Outdoor – aktuell sieht es trocken und passend aus.';
  }

  const nowTemp = roundNumber(current.temperature_2m);
  const laterTemp = roundNumber(hourly.temperature_2m?.[laterIndex]);
  const laterCode = hourly.weather_code?.[laterIndex];
  const laterRisk = roundNumber(hourly.precipitation_probability?.[laterIndex]);
  const tomorrowMax = roundNumber(daily.temperature_2m_max?.[1]);
  const tomorrowMin = roundNumber(daily.temperature_2m_min?.[1]);
  const tomorrowCode = daily.weather_code?.[1];
  const tomorrowRisk = roundNumber(daily.precipitation_probability_max?.[1]);
  const tomorrowSnow = Number(daily.snowfall_sum?.[1] || 0);

  return {
    jetzt: nowTemp == null
      ? weatherText(currentCode)
      : `${nowTemp} °C · ${weatherText(currentCode)}`,
    spaeter: laterTemp == null
      ? weatherText(laterCode)
      : `${laterTemp} °C · ${weatherText(laterCode)}${laterRisk == null ? '' : ` · ${laterRisk} % Regen`}`,
    morgen: tomorrowMin == null || tomorrowMax == null
      ? weatherText(tomorrowCode)
      : `${tomorrowMin}–${tomorrowMax} °C · ${weatherText(tomorrowCode)}${tomorrowRisk == null ? '' : ` · ${tomorrowRisk} % Regen`}`,
    nass: wetNow || rainAmount >= 0.5,
    empfehlung: recommendation,
    schneefall: winterSport && tomorrowSnow > 0
      ? `${tomorrowSnow.toFixed(1)} cm morgen`
      : null,
    ort: location.name,
    quelle: 'Open-Meteo',
  };
}

async function fetchOverpassEndpoint(endpoint, query) {
  const getUrl = `${endpoint}?data=${encodeURIComponent(query)}`;

  // GET is more reliable from Workers for these small queries. If a mirror
  // rejects it, try the traditional form-encoded POST before moving on.
  let response = await fetchWithTimeout(
    getUrl,
    {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'User-Agent': 'AfterDark-App/1.0 parks-search',
      },
    },
    18000,
  );

  if (!response.ok) {
    response = await fetchWithTimeout(
      endpoint,
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'User-Agent': 'AfterDark-App/1.0 parks-search',
        },
        body: `data=${encodeURIComponent(query)}`,
      },
      18000,
    );
  }

  if (!response.ok) {
    throw new Error(`Overpass HTTP ${response.status}`);
  }

  const data = await response.json();
  if (!data || !Array.isArray(data.elements)) {
    throw new Error('Overpass hat keine gültigen Kartendaten geliefert.');
  }

  return data;
}

async function runOverpassProxy(query) {
  const errors = [];

  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      return await fetchOverpassEndpoint(endpoint, query);
    } catch (error) {
      errors.push(`${new URL(endpoint).host}: ${error?.message || String(error)}`);
    }
  }

  throw new Error(errors.join(' | ') || 'Kartendienst ist gerade nicht erreichbar.');
}

function fallbackTags(sportId) {
  if (sportId === 'scooter' || sportId === 'skate') {
    return { leisure: 'skate_park' };
  }
  if (sportId === 'bmx') return { sport: 'bmx' };
  if (sportId === 'parkour') return { sport: 'parkour' };
  if (sportId === 'fitness') return { leisure: 'fitness_station' };
  if (['freeski', 'snowboard', 'snowscoot', 'snowbike'].includes(sportId)) {
    return { 'piste:type': 'funpark' };
  }
  return {};
}

function normalizedObstacleTerms(values = []) {
  return (Array.isArray(values) ? values : [])
    .slice(0, 3)
    .map((value) => String(value || '').trim())
    .filter(Boolean);
}

function obstacleMatches(row, obstaclePrefs = []) {
  const prefs = normalizedObstacleTerms(obstaclePrefs);
  if (!prefs.length) return [];

  const extra = row?.extratags || {};
  const haystack = [
    row?.name,
    row?.display_name,
    extra.description,
    extra.note,
    extra.sport,
    extra.leisure,
    extra['skatepark:feature'],
    extra['skatepark:features'],
    extra.obstacle,
    extra.obstacles,
    ...Object.values(extra),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  const aliases = {
    quarter: ['quarter', 'quarterpipe', 'quarter pipe'],
    funbox: ['funbox', 'fun box'],
    spine: ['spine'],
    bowl: ['bowl', 'pool'],
    rail: ['rail', 'handrail'],
    stairs: ['stairs', 'stair', 'treppe'],
    ledge: ['ledge', 'curb'],
    bank: ['bank', 'banked'],
    'dirt jumps': ['dirt', 'jump'],
    'step-up': ['step-up', 'step up'],
    'step-down': ['step-down', 'step down'],
    pumptrack: ['pumptrack', 'pump track'],
    drops: ['drop'],
    tables: ['table', 'tabletop'],
    wallride: ['wallride', 'wall ride'],
    airbag: ['airbag'],
    'foam pit': ['foam', 'schaumstoff'],
    'wall tramp': ['wall tramp', 'walltramp'],
    supertramp: ['supertramp'],
    rails: ['rail'],
    walls: ['wall'],
    precision: ['precision'],
    vaults: ['vault'],
    bars: ['bar'],
    'pull-up bars': ['pull-up', 'pull up', 'klimmzug'],
    'parallel bars': ['parallel bars', 'barren'],
    'monkey bars': ['monkey bars', 'hangelleiter'],
    box: ['box'],
    kicker: ['kicker'],
    halfpipe: ['halfpipe', 'half pipe'],
  };

  return prefs.filter((pref) => {
    const key = pref.toLowerCase();
    const terms = aliases[key] || [key];
    return terms.some((term) => haystack.includes(term));
  });
}

async function runNominatimFallback(origin, sportId, fallbackTerm, obstaclePrefs = []) {
  const lat = Number(origin?.latitude);
  const lon = Number(origin?.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    throw new Error('Fallback ohne gültigen Standort nicht möglich.');
  }

  const radiusKm = 70;
  const latDelta = radiusKm / 111;
  const lonDelta = radiusKm / Math.max(35, 111 * Math.cos((lat * Math.PI) / 180));
  const left = lon - lonDelta;
  const right = lon + lonDelta;
  const top = lat + latDelta;
  const bottom = lat - latDelta;
  const q = String(fallbackTerm || 'skatepark').trim();

  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('q', q);
  url.searchParams.set('viewbox', `${left},${top},${right},${bottom}`);
  url.searchParams.set('bounded', '1');
  url.searchParams.set('limit', '25');
  url.searchParams.set('addressdetails', '1');
  url.searchParams.set('extratags', '1');
  url.searchParams.set('accept-language', 'de');

  const response = await fetchWithTimeout(
    url.toString(),
    {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'AfterDark-App/1.0 parks-search',
      },
    },
    16000,
  );

  if (!response.ok) {
    throw new Error(`Nominatim HTTP ${response.status}`);
  }

  const rows = await response.json();
  if (!Array.isArray(rows)) {
    throw new Error('Nominatim hat keine gültigen Kartendaten geliefert.');
  }

  const baseTags = fallbackTags(sportId);
  const elements = rows
    .map((row) => {
      const latValue = Number(row?.lat);
      const lonValue = Number(row?.lon);
      if (!Number.isFinite(latValue) || !Number.isFinite(lonValue)) return null;

      const addr = row.address || {};
      const extra = row.extratags || {};
      const matched = obstacleMatches(row, obstaclePrefs);
      return {
        type: 'node',
        id: Number(row.place_id) || Math.floor(Math.random() * 1e9),
        lat: latValue,
        lon: lonValue,
        tags: {
          ...baseTags,
          name: String(row.name || row.display_name || fallbackTerm || 'Sportanlage').split(',')[0],
          'addr:city': addr.city || addr.town || addr.village || addr.municipality || '',
          website: extra.website || extra['contact:website'] || '',
          opening_hours: extra.opening_hours || '',
          access: extra.access || '',
          covered: extra.covered || '',
          lit: extra.lit || '',
          indoor: extra.indoor || '',
          surface: extra.surface || '',
          'afterdark:matched_obstacles': matched.join('|'),
        },
      };
    })
    .filter(Boolean);

  return { elements, fallback: 'nominatim' };
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS });
    }

    const url = new URL(request.url);

    if (request.method === 'GET' && url.pathname === '/health') {
      return json({
        ok: true,
        provider: 'Cloudflare Workers AI',
        model: MODEL,
        webSearch: false,
        parksProxy: true,
      });
    }

    if (request.method === 'POST' && url.pathname === '/geocode') {
      try {
        const body = await request.json();
        const origin = await geocodePlace(body?.home);
        return json({ origin });
      } catch (error) {
        const message = error?.name === 'AbortError'
          ? 'Ortsabfrage hat zu lange gebraucht.'
          : (error?.message || 'Ortsabfrage fehlgeschlagen.');
        return json({ error: message }, 502);
      }
    }

    if (request.method === 'POST' && url.pathname === '/weather') {
      try {
        const body = await request.json();
        const data = await getWeatherData(body?.home, String(body?.season || ''));
        return json(data);
      } catch (error) {
        const message = error?.name === 'AbortError'
          ? 'Wetterabfrage hat zu lange gebraucht.'
          : (error?.message || 'Wetterabfrage fehlgeschlagen.');
        return json({ error: message }, 502);
      }
    }

    if (request.method === 'POST' && url.pathname === '/parks') {
      try {
        const body = await request.json();
        const origin = body?.origin;
        const fallbackTerm = String(body?.fallbackTerm || 'skatepark').trim();
        const sportId = String(body?.sportId || '');
        const obstacles = normalizedObstacleTerms(body?.obstacles);

        if (!origin || !Number.isFinite(Number(origin.latitude)) || !Number.isFinite(Number(origin.longitude))) {
          return json({ error: 'Kein gueltiger Ausgangsort fuer die Park-Suche.' }, 400);
        }

        // Public Overpass mirrors can need 40–60+ seconds. The Android app
        // cancels long requests, so use Nominatim as the fast primary source.
        // This keeps the whole search inside After[Dark and normally responds
        // within a few seconds.
        const data = await runNominatimFallback(
          origin,
          sportId,
          fallbackTerm,
          obstacles,
        );

        return json({
          ...data,
          source: 'nominatim-fast',
        });
      } catch (error) {
        const message =
          error?.name === 'AbortError'
            ? 'Park-Suche hat zu lange gebraucht.'
            : (error?.message || String(error) || 'Park-Suche fehlgeschlagen.');
        return json({ error: message }, 502);
      }
    }

    if (request.method !== 'POST' || url.pathname !== '/ai') {
      return json({ error: 'Not found' }, 404);
    }

    try {
      const body = await request.json();

      if (body?.withSearch) {
        return json({
          error: 'Live-Websuche ist in der kostenlosen Cloudflare-Gemma-Bridge nicht aktiviert. Nutze fuer Parks die integrierte Kartensuche. Coach, Tricks und Bildanalyse funktionieren.',
        }, 501);
      }

      const incoming = Array.isArray(body?.messages) ? body.messages : [];
      const messages = incoming.map(normalizeMessage);

      if (!messages.length) {
        return json({ error: 'Keine Nachricht erhalten.' }, 400);
      }

      const result = await env.AI.run(
        MODEL,
        {
          messages,
          max_tokens: 1000,
          temperature: 0.35,
          chat_template_kwargs: {
            enable_thinking: false,
          },
        },
        { rejectIfBusy: true },
      );

      const text = extractText(result);
      if (!text) {
        return json({ error: 'Die KI hat keine Textantwort geliefert.' }, 502);
      }

      return json({ text, model: MODEL });
    } catch (error) {
      const message = error?.message || String(error) || 'Cloudflare AI Fehler';
      return json({ error: message }, 500);
    }
  },
};
