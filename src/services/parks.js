const AI_URL =
  process.env.EXPO_PUBLIC_AI_URL ||
  process.env.EXPO_PUBLIC_AI_PROXY_URL ||
  'http://10.0.2.2:8787/ai';
const PARKS_PROXY_URL = AI_URL.replace(/\/ai\/?$/i, '/parks');
const GEOCODE_PROXY_URL = AI_URL.replace(/\/ai\/?$/i, '/geocode');

async function fetchJson(url, options = {}, timeoutMs = 18000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    const data = await response.json().catch(() => null);

    if (!response.ok || !data) {
      throw new Error(`Kartendienst antwortet nicht (HTTP ${response.status}).`);
    }

    return data;
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error('Park-Suche hat zu lange gedauert.');
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

async function geocodePlace(home) {
  const place = String(home || '').trim();
  if (!place) throw new Error('Im Profil fehlt dein Wohnort.');

  const data = await fetchJson(
    GEOCODE_PROXY_URL,
    {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ home: place }),
    },
    18000
  );

  const origin = data?.origin;
  if (!origin || !Number.isFinite(Number(origin.latitude)) || !Number.isFinite(Number(origin.longitude))) {
    throw new Error(`Wohnort „${place}“ wurde nicht gefunden.`);
  }

  return {
    latitude: Number(origin.latitude),
    longitude: Number(origin.longitude),
    name: String(origin.name || place),
  };
}

function escapeRegex(text) {
  return String(text || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function searchTermsForSport(sport) {
  const id = sport?.id || '';
  const parkTypes = Array.isArray(sport?.parkTypes) ? sport.parkTypes : [];

  const map = {
    scooter: {
      tags: [
        ['leisure', 'skate_park'],
        ['sport', 'skateboard'],
      ],
      names: ['skatepark', 'skate park', 'skatehalle', 'scooterpark'],
    },
    skate: {
      tags: [
        ['leisure', 'skate_park'],
        ['sport', 'skateboard'],
      ],
      names: ['skatepark', 'skate park', 'skatehalle'],
    },
    bmx: {
      tags: [
        ['sport', 'bmx'],
        ['leisure', 'skate_park'],
      ],
      names: ['bmx', 'dirtpark', 'dirt park', 'pumptrack', 'pump track', 'bikepark', 'skatepark'],
    },
    mtb: {
      tags: [
        ['sport', 'mountain_biking'],
        ['sport', 'cycling'],
      ],
      names: ['bikepark', 'bike park', 'dirtpark', 'dirt park', 'pumptrack', 'pump track', 'trailcenter', 'trail center'],
    },
    trampoline: {
      tags: [['sport', 'trampoline']],
      names: ['trampolin', 'trampoline', 'jump', 'sprunghalle'],
    },
    'tramp-scooter': {
      tags: [['sport', 'trampoline']],
      names: ['trampolin', 'trampoline', 'jump', 'airbag'],
    },
    parkour: {
      tags: [['sport', 'parkour']],
      names: ['parkour', 'freerun', 'freerunning'],
    },
    diving: {
      tags: [['sport', 'diving']],
      names: ['sprungturm', 'sprungbrett', 'diving'],
    },
    freeski: {
      tags: [['piste:type', 'funpark']],
      names: ['snowpark', 'funpark', 'terrain park'],
    },
    snowboard: {
      tags: [['piste:type', 'funpark']],
      names: ['snowpark', 'funpark', 'terrain park'],
    },
    snowscoot: {
      tags: [['piste:type', 'funpark']],
      names: ['snowpark', 'funpark'],
    },
    snowbike: {
      tags: [['piste:type', 'funpark']],
      names: ['snowpark', 'funpark'],
    },
    fitness: {
      tags: [
        ['leisure', 'fitness_station'],
        ['sport', 'fitness'],
      ],
      names: ['calisthenics', 'fitnesspark', 'fitness park', 'street workout'],
    },
  };

  const base = map[id] || { tags: [], names: [] };
  return {
    tags: base.tags,
    names: [...new Set([...base.names, ...parkTypes.map((x) => String(x).toLowerCase())])],
  };
}

function fallbackTermForSport(sport) {
  const id = sport?.id || '';
  const map = {
    scooter: 'skatepark',
    skate: 'skatepark',
    bmx: 'bmx park',
    mtb: 'bikepark',
    trampoline: 'trampoline park',
    'tramp-scooter': 'trampoline park',
    parkour: 'parkour park',
    diving: 'diving pool',
    freeski: 'snowpark',
    snowboard: 'snowpark',
    snowscoot: 'snowpark',
    snowbike: 'snowpark',
    fitness: 'calisthenics',
  };
  return map[id] || sport?.parkTypes?.[0] || 'sportanlage';
}

function makeOverpassQuery(sport, origin, radiusMeters = 60000) {
  const terms = searchTermsForSport(sport);
  const around = `around:${radiusMeters},${origin.latitude},${origin.longitude}`;
  const clauses = [];

  // Keep the query deliberately small. Broad name-regex scans over tens of
  // thousands of OSM objects regularly make public Overpass servers time out.
  for (const [key, value] of terms.tags) {
    const k = escapeRegex(key);
    const v = escapeRegex(value);
    clauses.push(`nwr(${around})["${k}"="${v}"];`);
  }

  if (!clauses.length) {
    clauses.push(`nwr(${around})["leisure"="sports_centre"];`);
  }

  return `[out:json][timeout:15];(${clauses.join('')});out center tags;`;
}

async function runOverpass(query, origin, sport, obstacles = []) {
  return fetchJson(
    PARKS_PROXY_URL,
    {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        origin,
        sportId: sport?.id || '',
        fallbackTerm: fallbackTermForSport(sport),
        obstacles: Array.isArray(obstacles) ? obstacles.slice(0, 3) : [],
      }),
    },
    42000
  );
}

function toRad(value) {
  return (Number(value) * Math.PI) / 180;
}

function distanceKm(aLat, aLon, bLat, bLon) {
  const earth = 6371;
  const dLat = toRad(bLat - aLat);
  const dLon = toRad(bLon - aLon);
  const lat1 = toRad(aLat);
  const lat2 = toRad(bLat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return earth * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function direction(aLat, aLon, bLat, bLon) {
  const y = Math.sin(toRad(bLon - aLon)) * Math.cos(toRad(bLat));
  const x =
    Math.cos(toRad(aLat)) * Math.sin(toRad(bLat)) -
    Math.sin(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.cos(toRad(bLon - aLon));
  const bearing = (Math.atan2(y, x) * 180) / Math.PI;
  const normalized = (bearing + 360) % 360;
  const labels = ['N', 'NO', 'O', 'SO', 'S', 'SW', 'W', 'NW'];
  return labels[Math.round(normalized / 45) % 8];
}

function yesNo(value) {
  if (['yes', 'true', '1'].includes(String(value || '').toLowerCase())) return true;
  if (['no', 'false', '0'].includes(String(value || '').toLowerCase())) return false;
  return null;
}

function placeName(tags = {}, fallback = 'Sportanlage') {
  return tags.name || tags['name:de'] || fallback;
}

function placeTown(tags = {}, originName = '') {
  return (
    tags['addr:city'] ||
    tags['addr:town'] ||
    tags['addr:village'] ||
    tags['addr:municipality'] ||
    tags['is_in:city'] ||
    tags['is_in:town'] ||
    originName ||
    'Umgebung'
  );
}

function placeType(tags = {}, sport) {
  if (tags.leisure === 'skate_park') return 'Skatepark';
  if (tags.leisure === 'fitness_station') return 'Calisthenics-Anlage';
  if (tags['piste:type'] === 'funpark') return 'Snowpark';
  if (tags.sport === 'bmx') return 'BMX-Anlage';
  if (tags.sport === 'parkour') return 'Parkour-Park';
  if (tags.sport === 'trampoline') return 'Trampolin-Anlage';
  if (tags.sport === 'diving') return 'Sprunganlage';
  return sport?.parkTypes?.[0] || 'Sportanlage';
}

function equipmentText(tags = {}) {
  const parts = [];
  if (tags.surface) parts.push(`Untergrund: ${tags.surface}`);
  if (tags.covered === 'yes') parts.push('überdacht');
  if (tags.lit === 'yes') parts.push('Flutlicht');
  if (tags.opening_hours) parts.push(`Öffnung: ${tags.opening_hours}`);
  return parts.join(' · ');
}

function permissionText(tags = {}, sport) {
  const access = String(tags.access || '').toLowerCase();
  if (['private', 'no'].includes(access)) return 'Zugang eingeschränkt – vor Ort prüfen';

  if (sport?.id === 'scooter' && tags.leisure === 'skate_park') {
    return 'Scooter-Freigabe in Kartendaten nicht eindeutig – Regeln vor Ort prüfen';
  }

  return 'Sportfreigabe in Kartendaten nicht eindeutig – vor Ort prüfen';
}

function matchedObstacles(tags = {}) {
  return String(tags['afterdark:matched_obstacles'] || '')
    .split('|')
    .map((value) => value.trim())
    .filter(Boolean);
}

function normalizeElement(element, sport, origin) {
  const tags = element?.tags || {};
  const latitude = Number(element?.lat ?? element?.center?.lat);
  const longitude = Number(element?.lon ?? element?.center?.lon);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  const km = distanceKm(origin.latitude, origin.longitude, latitude, longitude);
  const indoor =
    yesNo(tags.indoor) === true ||
    yesNo(tags.covered) === true ||
    Boolean(tags.building && tags.building !== 'no');
  const flutlicht = yesNo(tags.lit);
  const typ = placeType(tags, sport);

  return {
    id: `${element.type || 'osm'}-${element.id}`,
    name: placeName(tags, typ),
    ort: placeTown(tags, origin.name),
    ausstattung: equipmentText(tags),
    begruendung: `In OpenStreetMap als ${typ} bzw. passende Sportanlage eingetragen.`,
    entfernungKm: Number(km.toFixed(1)),
    himmelsrichtung: direction(origin.latitude, origin.longitude, latitude, longitude),
    typ,
    indoor,
    flutlicht,
    website: tags.website || tags['contact:website'] || '',
    erlaubnis: permissionText(tags, sport),
    obstacles: matchedObstacles(tags),
    latitude,
    longitude,
  };
}

export async function searchParksInApp(sport, home, obstacles = []) {
  const origin = await geocodePlace(home);
  const query = makeOverpassQuery(sport, origin);
  const data = await runOverpass(query, origin, sport, obstacles);

  const seen = new Set();
  const parks = (data?.elements || [])
    .map((element) => normalizeElement(element, sport, origin))
    .filter(Boolean)
    .filter((park) => {
      const key = `${park.name.toLowerCase()}|${park.latitude.toFixed(4)}|${park.longitude.toFixed(4)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => {
      const aMatch = Array.isArray(a.obstacles) ? a.obstacles.length : 0;
      const bMatch = Array.isArray(b.obstacles) ? b.obstacles.length : 0;
      if (aMatch !== bMatch) return bMatch - aMatch;
      return a.entfernungKm - b.entfernungKm;
    })
    .slice(0, 40);

  return { parks, origin };
}
