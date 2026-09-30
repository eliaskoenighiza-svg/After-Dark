import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const envPath = path.join(root, '.env.local');

function parseEnv(text) {
  const lines = text.split(/\r?\n/);
  const map = new Map();
  const extras = [];

  for (const raw of lines) {
    if (!raw.trim() || raw.trim().startsWith('#') || !raw.includes('=')) {
      if (raw.trim()) extras.push(raw);
      continue;
    }
    const i = raw.indexOf('=');
    map.set(raw.slice(0, i).trim(), raw.slice(i + 1).trim());
  }
  return { map, extras };
}

function cleanBase(value) {
  let v = String(value || '').trim();
  v = v.replace(/\/(ai|health)\/?$/i, '');
  return v.replace(/\/$/, '');
}

const current = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
const { map } = parseEnv(current);
const rl = readline.createInterface({ input, output });

console.log('');
console.log('Cloudflare Worker URL eintragen');
console.log('Beispiel: https://after-dark-ai.DEINNAME.workers.dev');
console.log('');

const answer = await rl.question('Worker URL: ');
rl.close();

const base = cleanBase(answer);
if (!/^https:\/\/.+\.workers\.dev$/i.test(base) && !/^https:\/\//i.test(base)) {
  console.error('Ungueltige URL. Bitte die https://...workers.dev Adresse verwenden.');
  process.exit(1);
}

map.set('EXPO_PUBLIC_AI_URL', base + '/ai');
map.set('EXPO_PUBLIC_AI_HEALTH_URL', base + '/health');

const ordered = [];
for (const [key, value] of map.entries()) ordered.push(`${key}=${value}`);
fs.writeFileSync(envPath, '# After[Dark lokale Konfiguration - NICHT committen\n' + ordered.join('\n') + '\n', 'utf8');

console.log('');
console.log('[OK] Cloudflare AI URL gespeichert.');
console.log('[OK] ' + envPath);
console.log('');
console.log('Jetzt After[Dark komplett neu starten.');
