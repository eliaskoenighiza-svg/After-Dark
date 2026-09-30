import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const envPath = path.join(root, '.env.local');

function readEnv() {
  if (!fs.existsSync(envPath)) return {};
  const out = {};
  for (const raw of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const i = line.indexOf('=');
    if (i < 1) continue;
    out[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return out;
}

function writeEnv(obj) {
  const lines = [
    '# After[Dark lokale Services - NICHT committen',
    'EXPO_PUBLIC_AI_PROXY_URL=http://10.0.2.2:8787/ai',
  ];

  if (obj.ANTHROPIC_API_KEY) {
    lines.push('ANTHROPIC_API_KEY=' + obj.ANTHROPIC_API_KEY);
  }
  if (obj.GOOGLE_MAPS_API_KEY) {
    lines.push('GOOGLE_MAPS_API_KEY=' + obj.GOOGLE_MAPS_API_KEY);
  }

  fs.writeFileSync(envPath, lines.join('\n') + '\n', 'utf8');
}

const rl = readline.createInterface({ input, output });
const env = readEnv();

console.log('');
console.log('After[Dark - KI + Google Maps Einrichtung');
console.log('-----------------------------------------');
console.log('Die Keys bleiben lokal in .env.local.');
console.log('');

const a = await rl.question(
  env.ANTHROPIC_API_KEY
    ? 'Anthropic-Key vorhanden. Neuer Key (Enter = behalten): '
    : 'Anthropic API-Key einfuegen (Enter = spaeter): '
);
if (a.trim()) env.ANTHROPIC_API_KEY = a.trim();

const g = await rl.question(
  env.GOOGLE_MAPS_API_KEY
    ? 'Google-Maps-Key vorhanden. Neuer Key (Enter = behalten): '
    : 'Google Maps API-Key einfuegen (Enter = spaeter): '
);
if (g.trim()) env.GOOGLE_MAPS_API_KEY = g.trim();

writeEnv(env);
rl.close();

console.log('');
console.log('Gespeichert: ' + envPath);
console.log('KI-Key:   ' + (env.ANTHROPIC_API_KEY ? 'OK' : 'FEHLT'));
console.log('Maps-Key: ' + (env.GOOGLE_MAPS_API_KEY ? 'OK' : 'FEHLT'));
console.log('');
console.log('Zum Testen: START_TEST_ALLES.bat');
