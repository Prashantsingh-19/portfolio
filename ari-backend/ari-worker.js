import knowledgeBase from './knowledge-base.json';
import { ARI_PERSONA_PROMPT } from './persona.js';
import { HIGHLIGHTS, CLASSIFY_QUESTION } from './highlights.js';

const OR_URL = 'https://openrouter.ai/api/v1/chat/completions';
const NVIDIA_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';
const NVIDIA_MODEL = 'deepseek-ai/deepseek-v4-pro';
const CHAT_MODEL = 'nvidia/nemotron-3-ultra-550b-a55b:free';
const FALLBACK_MODEL = 'google/gemma-4-26b-a4b-it:free';
const EMBED_MODEL = 'gemini-embedding-001';

const TYPED_GREETINGS = {
  recruiter: [
    "Hi! I'm Ari, Prashant's resident crab. He built me for portfolios like this — ask me anything about his work, and I'll pinch up the answers.",
    "Oh, a recruiter! Shell yeah — I'm Ari, the crab who lives in this portfolio. Dig into anything you want to know about Prashant.",
  ],
  builder: [
    "Hey builder! I'm Ari, a little crab chatbot Prashant made. Peek under my shell — ask me anything about his stack or projects.",
    "A fellow builder! Love it. I'm Ari — Prashant's crab sidekick. Ask me about the tech or the projects, I've watched him build it all.",
  ],
  curious: [
    "Hey there! I'm Ari, the crab living in Prashant's portfolio. Curious minds welcome — ask me anything about him!",
    "A curious visitor — my favorite kind! I'm Ari, the resident crab. Prashant's my maker, and I know all about his work. What do you want to know?",
  ],
};

const RETURN_GREETINGS = [
  "Welcome back! Ready to crab more about Prashant?",
  "You're back! I was just shell-fing through some memories of Prashant. What next?",
  "Hey again! My claws have been idle — ask me something about Prashant!",
  "Back for more? I've got plenty of crabby stories about Prashant. Shoot!",
  "Welcome back to the shell — Prashant's portfolio, that is. What's on your mind?",
];

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function greetForType(visitorType, isReturning) {
  if (isReturning) return pickRandom(RETURN_GREETINGS);
  const pool = TYPED_GREETINGS[visitorType];
  if (pool && pool.length) return pickRandom(pool);
  return "Hi, I'm Ari! Ask me anything about Prashant.";
}

async function maybeSaveUserName(env, sessionId, message, currentName) {
  if (currentName || !sessionId) return;
  const lower = message.trim();
  const nameMatch = lower.match(/^(?:i(?:')?m |my name(?:')?s |call me |it'?s |name(?:')?s )(.+?)(?:\s*[.!?]?\s*)$/i);
  if (nameMatch) {
    const name = nameMatch[1].trim().split(/\s+/)[0];
    if (name.length < 30) await saveUserName(env, sessionId, name);
  }
}

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

async function retrieve(env, query, topKCount = 5) {
  const queryVec = await embed(query, env.GEMINI_API_KEY);
  const results = topK(queryVec, knowledgeBase.chunks, topKCount);
  if (!results.length) return '(no matching context found)';
  return results.map(r => r.text).join('\n\n---\n\n');
}

async function callNVIDIA(env, messages, maxTokens) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  const res = await fetch(NVIDIA_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.NVIDIA_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: NVIDIA_MODEL,
      messages,
      temperature: 0.7,
      top_p: 0.9,
      max_tokens: maxTokens,
      stream: false,
    }),
    signal: controller.signal,
  });
  clearTimeout(timeout);
  if (!res.ok) throw new Error(`NVIDIA error: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.choices[0].message.content;
}

async function callLLM(env, messages, { maxTokens = 200 } = {}) {
  // Try NVIDIA (DeepSeek V4 Pro) first
  try {
    return await callNVIDIA(env, messages, maxTokens);
  } catch (e) {
    // fall through to OpenRouter
  }
  // Fallback: OpenRouter (Nemotron, then Gemma)
  for (const model of [CHAT_MODEL, FALLBACK_MODEL]) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000);
      const res = await fetch(OR_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.7,
          top_p: 0.9,
          max_tokens: maxTokens,
          stream: false,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!res.ok && model === FALLBACK_MODEL) {
        throw new Error(`LLM error: ${res.status} ${await res.text()}`);
      }
      if (!res.ok) continue;
      const data = await res.json();
      return data.choices[0].message.content;
    } catch (e) {
      if (model === FALLBACK_MODEL) throw e;
    }
  }
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

async function getUserName(env, sessionId) {
  if (!sessionId) return null;
  return await env.SESSIONS.get(`name:${sessionId}`);
}

async function saveUserName(env, sessionId, name) {
  if (!sessionId) return;
  await env.SESSIONS.put(`name:${sessionId}`, name, {
    expirationTtl: 60 * 60 * 6,
  });
}

async function getMsgCount(env, sessionId) {
  if (!sessionId) return 0;
  const raw = await env.SESSIONS.get(`count:${sessionId}`);
  return raw ? parseInt(raw, 10) : 0;
}

async function incrementMsgCount(env, sessionId) {
  if (!sessionId) return;
  const count = await getMsgCount(env, sessionId);
  await env.SESSIONS.put(`count:${sessionId}`, String(count + 1), {
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

        const greeting = greetForType(visitorType, isReturning);

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
        const greeting = greetForType(visitorType, false);

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

        const [context, history, visitorType, msgCount, userName] = await Promise.all([
          retrieve(env, message),
          getHistory(env, sessionId),
          getVisitorType(env, sessionId),
          getMsgCount(env, sessionId),
          getUserName(env, sessionId),
        ]);

        const highlight = maybePickHighlight(visitorType, 0.25);

        let identityPrompt = '';
        if (!userName && msgCount >= 1) {
          identityPrompt = '\n\nYou have been chatting a bit but dont know their name yet. Casually ask who they are with a crab pun — e.g. "By the way, I dont think I caught your name — unless you\'re a ghost crab?" Keep it natural and brief.';
        }
        if (userName) {
          identityPrompt = `\n\nYou are talking to ${userName}. Use their name naturally in your reply.`;
        }

        const messages = [
          { role: 'system', content: ARI_PERSONA_PROMPT },
          { role: 'system', content: `Context about Prashant:\n${context}\n\nOnly use this context. Never invent facts about Prashant.${identityPrompt}` },
          {
            role: 'system',
            content: visitorType
              ? `This visitor identified as: ${visitorType}. Keep matching tone/emphasis to that throughout the conversation.${highlight ? ` If it fits naturally, you may mention: "${highlight}"` : ''}`
              : 'No visitor type is known for this session.',
          },
          ...history,
          { role: 'user', content: message },
        ];

        const reply = await callLLM(env, messages, {
          maxTokens: 120,
        });

        history.push({ role: 'user', content: message });
        history.push({ role: 'assistant', content: reply });
        await Promise.all([
          saveHistory(env, sessionId, history),
          incrementMsgCount(env, sessionId),
          maybeSaveUserName(env, sessionId, message, userName),
        ]);

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
