import knowledgeBase from './knowledge-base.json';
import { ARI_PERSONA_PROMPT } from './persona.js';
import { HIGHLIGHTS, CLASSIFY_QUESTION } from './highlights.js';

const NIM_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';
const EMBED_MODEL = 'gemini-embedding-001';

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function cosineSimilarity(a, b) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function topK(queryVec, chunks, k) {
  const scored = chunks.map(c => ({
    ...c,
    score: cosineSimilarity(queryVec, c.embedding)
  }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, k);
}

async function embed(text, apiKey) {
  const url = `https://generativelanguage.googleapis.com/v1/models/${EMBED_MODEL}:embedContent`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify({ model: `models/${EMBED_MODEL}`, content: { parts: [{ text }] } })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Embedding error: ${JSON.stringify(data)}`);
  return data.embedding.values;
}

async function retrieve(env, query, topKCount = 4) {
  const queryVec = await embed(query, env.GEMINI_API_KEY);
  const results = topK(queryVec, knowledgeBase.chunks, topKCount);
  if (!results.length) return '(no matching context found)';
  return results.map(r => r.text).join('\n\n---\n\n');
}

async function callDeepSeek(env, messages, { maxTokens = 400 } = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);
  const res = await fetch(NIM_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.NVIDIA_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'deepseek-ai/deepseek-v4-flash',
      messages,
      temperature: 0.9,
      top_p: 0.95,
      max_tokens: maxTokens,
      stream: false,
    }),
    signal: controller.signal,
  });
  clearTimeout(timeout);
  if (!res.ok) {
    throw new Error(`NIM error: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  return data.choices[0].message.content;
}

function maybePickHighlight(visitorType, chance = 0.4) {
  const pool = HIGHLIGHTS[visitorType];
  if (!pool || !pool.length || Math.random() > chance) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

async function getHistory(env, sessionId) {
  if (!sessionId) return [];
  const raw = await env.SESSIONS.get(`hist:${sessionId}`);
  return raw ? JSON.parse(raw) : [];
}

async function saveHistory(env, sessionId, history) {
  if (!sessionId) return;
  const trimmed = history.slice(-10);
  await env.SESSIONS.put(`hist:${sessionId}`, JSON.stringify(trimmed), {
    expirationTtl: 60 * 60 * 6,
  });
}

async function getVisitorType(env, sessionId) {
  if (!sessionId) return null;
  return await env.SESSIONS.get(`type:${sessionId}`);
}

async function saveVisitorType(env, sessionId, visitorType) {
  if (!sessionId) return;
  await env.SESSIONS.put(`type:${sessionId}`, visitorType, {
    expirationTtl: 60 * 60 * 6,
  });
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders() });
    }

    const url = new URL(request.url);
    const jsonHeaders = { 'Content-Type': 'application/json', ...corsHeaders() };

    try {
      if (url.pathname === '/greet' && request.method === 'POST') {
        const { sessionId } = await request.json();
        const isReturning = sessionId
          ? !!(await env.SESSIONS.get(`hist:${sessionId}`))
          : false;
        const visitorType = await getVisitorType(env, sessionId);

        if (!isReturning && !visitorType) {
          return new Response(
            JSON.stringify({ needsClassification: true, ...CLASSIFY_QUESTION }),
            { headers: jsonHeaders }
          );
        }

        let greeting;
        try {
          const highlight = maybePickHighlight(visitorType);
          greeting = await callDeepSeek(
            env,
            [
              { role: 'system', content: ARI_PERSONA_PROMPT },
              {
                role: 'system',
                content: visitorType
                  ? `This visitor identified as: ${visitorType}. Match your tone/emphasis to that.${highlight ? ` You may naturally weave in this: "${highlight}"` : ''}`
                  : 'No visitor type is known for this session.',
              },
              {
                role: 'user',
                content: isReturning
                  ? 'Greet the visitor with a short, warm line — they have chatted with you before this session.'
                  : 'Greet this visitor with a short, warm introduction.',
              },
            ],
            { maxTokens: 80 }
          );
        } catch {
          greeting = "Hi, I'm Ari! I live in Prashant's portfolio — ask me anything about him.";
        }

        return new Response(JSON.stringify({ greeting }), { headers: jsonHeaders });
      }

      if (url.pathname === '/classify' && request.method === 'POST') {
        const { sessionId, visitorType } = await request.json();
        if (!['recruiter', 'builder', 'curious'].includes(visitorType)) {
          return new Response(JSON.stringify({ error: 'invalid visitorType' }), {
            status: 400,
            headers: jsonHeaders,
          });
        }

        await saveVisitorType(env, sessionId, visitorType);
        const highlight = maybePickHighlight(visitorType);

        let greeting;
        try {
          greeting = await callDeepSeek(
            env,
            [
              { role: 'system', content: ARI_PERSONA_PROMPT },
              {
                role: 'system',
                content: `This visitor just identified as: ${visitorType}. Greet them warmly with that in mind.${highlight ? ` You may naturally weave in this: "${highlight}"` : ''}`,
              },
              { role: 'user', content: 'Greet this visitor with a short, warm introduction.' },
            ],
            { maxTokens: 80 }
          );
        } catch {
          greeting = "Hi, I'm Ari! Ask me anything about Prashant.";
        }

        return new Response(JSON.stringify({ greeting }), { headers: jsonHeaders });
      }

      if (url.pathname === '/chat' && request.method === 'POST') {
        const { message, sessionId } = await request.json();

        if (!message || typeof message !== 'string') {
          return new Response(JSON.stringify({ error: 'message is required' }), {
            status: 400,
            headers: jsonHeaders,
          });
        }

        const [context, history, visitorType] = await Promise.all([
          retrieve(env, message),
          getHistory(env, sessionId),
          getVisitorType(env, sessionId),
        ]);

        const highlight = maybePickHighlight(visitorType, 0.25);
        const messages = [
          { role: 'system', content: ARI_PERSONA_PROMPT },
          { role: 'system', content: `Retrieved context about Prashant:\n\n${context}` },
          {
            role: 'system',
            content: visitorType
              ? `This visitor identified as: ${visitorType}. Keep matching tone/emphasis to that throughout the conversation.${highlight ? ` If it fits naturally, you may mention: "${highlight}"` : ''}`
              : 'No visitor type is known for this session.',
          },
          ...history,
          { role: 'user', content: message },
        ];

        const reply = await callDeepSeek(env, messages, {
          maxTokens: 400,
        });

        history.push({ role: 'user', content: message });
        history.push({ role: 'assistant', content: reply });
        await saveHistory(env, sessionId, history);

        return new Response(JSON.stringify({ reply }), { headers: jsonHeaders });
      }

      return new Response('Not found', { status: 404, headers: corsHeaders() });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: jsonHeaders,
      });
    }
  },
};
