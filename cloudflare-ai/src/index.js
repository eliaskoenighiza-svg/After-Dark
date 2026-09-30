const MODEL = '@cf/google/gemma-4-26b-a4b-it';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

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

  // After[Dark currently sends Anthropic-style base64 image blocks.
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

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });

    const url = new URL(request.url);

    if (request.method === 'GET' && url.pathname === '/health') {
      return json({
        ok: true,
        provider: 'Cloudflare Workers AI',
        model: MODEL,
        webSearch: false,
      });
    }

    if (request.method !== 'POST' || url.pathname !== '/ai') {
      return json({ error: 'Not found' }, 404);
    }

    try {
      const body = await request.json();

      if (body?.withSearch) {
        return json({
          error: 'Live-Websuche ist in der kostenlosen Cloudflare-Gemma-Bridge nicht aktiviert. Nutze fuer Parks direkt Google Maps. Coach, Tricks und Bildanalyse funktionieren.',
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
      if (!text) return json({ error: 'Die KI hat keine Textantwort geliefert.' }, 502);

      return json({ text, model: MODEL });
    } catch (error) {
      const message = error?.message || String(error) || 'Cloudflare AI Fehler';
      return json({ error: message }, 500);
    }
  },
};
