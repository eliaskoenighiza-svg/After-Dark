import http from 'node:http';

const PORT = Number(process.env.PORT || 8787);
const KEY = process.env.ANTHROPIC_API_KEY || '';
const MODEL = 'claude-sonnet-4-6';

function send(res, status, obj) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  });
  res.end(JSON.stringify(obj));
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return send(res, 204, {});

  if (req.method === 'GET' && req.url === '/health') {
    return send(res, KEY ? 200 : 503, KEY
      ? { ok: true, model: MODEL }
      : { ok: false, error: 'ANTHROPIC_API_KEY fehlt auf dem PC.' });
  }

  if (req.method !== 'POST' || req.url !== '/ai') return send(res, 404, { error: 'Not found' });
  if (!KEY) return send(res, 503, { error: 'ANTHROPIC_API_KEY fehlt auf dem PC.' });

  let body = '';
  req.on('data', (chunk) => {
    body += chunk;
    if (body.length > 12_000_000) req.destroy();
  });
  req.on('end', async () => {
    try {
      const input = JSON.parse(body || '{}');
      const payload = {
        model: MODEL,
        max_tokens: 1000,
        messages: Array.isArray(input.messages) ? input.messages : [],
        ...(input.withSearch ? { tools: [{ type: 'web_search_20250305', name: 'web_search' }] } : {}),
      };
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(payload),
      });
      const data = await r.json();
      if (!r.ok) return send(res, r.status, { error: data?.error?.message || 'Anthropic request failed' });
      const text = (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('\n').trim();
      return send(res, 200, { text });
    } catch (e) {
      return send(res, 500, { error: e.message || 'Proxy error' });
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('After[Dark KI-BRIDGE');
  console.log('---------------------');
  console.log(`Status: ${KEY ? 'BEREIT' : 'KEY FEHLT'}`);
  console.log(`Adresse: http://0.0.0.0:${PORT}`);
  console.log(`Health:  http://0.0.0.0:${PORT}/health`);
  console.log('Dieses Fenster offen lassen, solange die KI benutzt wird.');
  console.log('');
});
