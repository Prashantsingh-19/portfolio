import { ARI_PERSONA_PROMPT } from './persona.js';
const OR_URL = 'https://openrouter.ai/api/v1/chat/completions';
const NVIDIA_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';
const CF_MODEL = '@cf/openai/gpt-oss-120b';
const CF_FALLBACK_MODEL = '@cf/zai-org/glm-4.7-flash';
const NVIDIA_MODEL = 'deepseek-ai/deepseek-v4-pro';
const CHAT_MODEL = 'nvidia/nemotron-3-ultra-550b-a55b:free';
const FALLBACK_MODEL = 'google/gemma-4-26b-a4b-it:free';

const TYPED_GREETINGS = {
  recruiter: [
    "Hi, I'm Ari — I know Prashant's work in detail and can connect you directly if you'd like. Ask me anything.",
    "Welcome! I'm Ari, Prashant's AI assistant. I can walk you through his experience and projects — what would you like to know?",
  ],
  builder: [
    "A fellow builder! I'm Ari, Prashant's AI assistant. Peek under my shell: ask me how I'm built or about his projects.",
    "Hey builder! I'm Ari. Ask me about Prashant's tech, projects, or how things are built — I've got the details.",
  ],
  curious: [
    "Hi, I'm Ari — I know Prashant's work in detail and can connect you directly if you'd like. Ask me anything.",
    "A curious visitor, my favourite kind! I'm Ari, the crab who lives in Prashant's portfolio. Ask me anything about his work.",
  ],
};

const RETURN_GREETINGS = [
  "Welcome back! What would you like to know about Prashant?",
  "You're back! Ready to dive into more of Prashant's work?",
  "Hey again! I've got all the details ready. What's on your mind?",
  "Back for more? My claws are ready. I can go deeper on any project.",
  "Welcome back — what's next? Happy to walk through anything.",
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

async function embed(text, env) {
  const { data } = await env.AI.run('@cf/baai/bge-base-en-v1.5', { text: [text] });
  return data[0];
}

// bge-base cosine scores, calibrated on real questions (2026-10-24): on-topic questions
// top out at 0.62-0.82, off-topic ones at 0.46-0.61. Between WEAK and STRONG the context is
// passed with a warning; below WEAK Ari says it doesn't have the detail.
const STRONG_MATCH = 0.62;
const WEAK_MATCH = 0.55;
const KEEP_WITHIN = 0.08; // keep chunks scoring within this of the best one
const MAX_CHUNKS = 6;

// Embeds the question alone and with the previous user turn, so short follow-ups
// ("is the vectorization deep?") retrieve from the topic being discussed. `rewrites` are
// extra search queries from the corrective step below.
async function retrieve(env, query, history = [], rewrites = []) {
  const prevUser = [...history].reverse().find(m => m.role === 'user');
  const texts = (prevUser ? [query, `${prevUser.content}\n${query}`] : [query]).concat(rewrites);
  const { data } = await env.AI.run('@cf/baai/bge-base-en-v1.5', { text: texts });
  const results = await Promise.all(data.map(v => env.VECTORIZE.query(v, { topK: 8, returnMetadata: true })));
  const best = new Map();
  results.forEach(r => (r.matches || []).forEach(m => {
    if (!best.has(m.id) || best.get(m.id).score < m.score) best.set(m.id, m);
  }));
  const matches = [...best.values()].sort((a, b) => b.score - a.score);
  if (!matches.length) return { context: '', topScore: 0, sources: [] };
  const topScore = matches[0].score || 0;
  const kept = matches.filter(m => m.score >= Math.max(topScore - KEEP_WITHIN, WEAK_MATCH)).slice(0, MAX_CHUNKS);
  return {
    context: kept.map(m => m.metadata.text).join('\n\n---\n\n'),
    topScore,
    sources: kept.map(m => `${m.id}:${m.score.toFixed(2)}`),
  };
}

// Corrective RAG: when the first retrieval isn't a strong match, the LLM restates the question
// as standalone search queries in the write-ups' vocabulary and we retrieve again, keeping
// whichever result scores higher. Small talk skips it, since there is nothing to retrieve.
const SMALLTALK = /^(hi+|hey+|hello+|yo|sup|thanks?|thank you|ok(ay)?|cool|nice|great|bye|good (morning|evening|afternoon))\b[\s!.?]*$/i;
const REWRITE_PROMPT = `You rewrite a visitor's question into search queries for a knowledge base of write-ups about Prashant Singh: his projects, work experience, skills, education, hackathons, and Ari (the RAG chatbot on his portfolio, which is who the visitor is talking to).
Rules:
- Output 1 to 3 short search queries, one per line, and nothing else: no numbering, no quotes, no explanation.
- Resolve references from the conversation: "you", "your", "this bot" or "this prompt" mean Ari; "it", "that" or "the project" mean whatever was just discussed.
- Use the words a write-up would use, e.g. "Ari technical specs: which LLM Ari runs on", "CollectIQ collections prioritisation results", "Prashant internship i3digital health product management".
- Fix spelling and expand abbreviations.`;

async function rewriteQuery(env, message, history) {
  const recent = history.slice(-4).map(m => `${m.role === 'user' ? 'Visitor' : 'Ari'}: ${m.content.slice(0, 300)}`).join('\n');
  const llm = await callLLM(env, [
    { role: 'system', content: REWRITE_PROMPT },
    { role: 'user', content: `${recent ? `Conversation so far:\n${recent}\n\n` : ''}Latest question: ${message}` },
  ], { maxTokens: 300 });
  return llm.content.split('\n').map(l => l.replace(/^[\s\d.)*•-]+/, '').replace(/^["']|["']$/g, '').trim())
    .filter(l => l.length > 3).slice(0, 3);
}

// CRAG's evaluator: a rewrite can lift the score just by adding "Prashant Singh", which matches
// his general profile. Before trusting a rescued retrieval, ask whether it actually answers the question.
async function contextAnswers(env, message, context) {
  const llm = await callLLM(env, [
    { role: 'system', content: 'You check search results. Reply with exactly one word: YES if the context contains information that answers the question, NO if it does not.' },
    { role: 'user', content: `Question: ${message}\n\nContext:\n${context.slice(0, 2500)}` },
  ], { maxTokens: 200 });
  return /\byes\b/i.test(llm.content) && !/\bno\b/i.test(llm.content.slice(0, 5));
}

// Reasoning comes back in a separate field, so only strip leaked planning lines at the very
// start and markdown the chat window can't render. (The old version also dropped any line
// starting with "Here's", "First" or "Based on", which deleted real answer content.)
function stripMeta(text) {
  let result = (text || '')
    .replace(/<thinking>[\s\S]*?<\/thinking>/g, '')
    .replace(/^\s*(?:(?:the user (?:is asking|asks|wants)|we need to|i need to|i should|let me)[^\n]*\n+)+/i, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*[-*•]\s+/gm, '')
    .replace(/^["']([\s\S]*)["']$/, '$1')
    .trim();
  return result || (text || '').trim();
}

async function callCloudflare(env, messages, maxTokens, model) {
  const params = { messages, max_tokens: maxTokens, temperature: 0.3 };
  // gpt-oss is a reasoning model: at default effort its thinking ate the whole token budget
  // and replies came back cut off mid-sentence ("Credit Card Default").
  if (model === CF_MODEL) params.reasoning_effort = 'low';
  const result = await env.AI.run(model, params);
  const choice = result.choices?.[0];
  if (choice?.finish_reason === 'length') throw new Error('truncated');
  return stripMeta(choice?.message?.content || result.response || '');
}

async function callNVIDIA(env, messages, maxTokens) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  const res = await fetch(NVIDIA_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.NVIDIA_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: NVIDIA_MODEL,
      messages,
      temperature: 0.3,
      top_p: 0.9,
      max_tokens: maxTokens,
      stream: false,
      thinking: false,
    }),
    signal: controller.signal,
  });
  clearTimeout(timeout);
  if (!res.ok) throw new Error(`NVIDIA error: ${res.status} ${await res.text()}`);
  const data = await res.json();
  let content = data.choices[0].message.content;
  content = stripMeta(content);
  return content;
}

async function callLLM(env, messages, { maxTokens = 200 } = {}) {
  // Try Cloudflare Workers AI (gpt-oss-120b) first; on an empty or cut-off reply, retry once with double the budget
  for (const budget of [maxTokens, maxTokens * 2]) {
    try {
      const content = await callCloudflare(env, messages, budget, CF_MODEL);
      if (content.trim()) return { content, model: 'gpt-oss-120b' };
    } catch (e) {
      if (e.message !== 'truncated') break;
    }
  }
  // Fallback: Cloudflare (glm-4.7-flash)
  try {
    const content = await callCloudflare(env, messages, maxTokens, CF_FALLBACK_MODEL);
    if (content.trim()) return { content, model: 'glm-4.7-flash' };
  } catch (e) {
    // fall through to NVIDIA
  }
  // Fallback: NVIDIA (DeepSeek V4 Pro)
  try {
    const content = await callNVIDIA(env, messages, maxTokens);
    if (content.trim()) return { content, model: 'deepseek-v4-pro' };
  } catch (e) {
    // fall through to OpenRouter
  }
  // Fallback: OpenRouter (Nemotron, then Gemma)
  for (const model of [CHAT_MODEL, FALLBACK_MODEL]) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(OR_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.3,
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
      let content = data.choices[0].message.content;
      content = stripMeta(content);
      if (content.trim()) return { content, model: model === CHAT_MODEL ? 'nemotron-ultra' : 'gemma-4-26b' };
    } catch (e) {
      if (model === FALLBACK_MODEL) throw e;
    }
  }
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
  async fetch(request, env, ctx) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders() });
    }

    const url = new URL(request.url);
    const jsonHeaders = { 'Content-Type': 'application/json', ...corsHeaders() };

    try {
      if (url.pathname === '/greet' && request.method === 'POST') {
        const { sessionId, visitorId } = await request.json();
        const isReturning = sessionId
          ? !!(await env.SESSIONS.get(`hist:${sessionId}`))
          : false;
        const visitorType = await getVisitorType(env, sessionId);

        // Track unique visitor
        if (visitorId) {
          ctx.waitUntil(env.SESSIONS.put(`vid:${visitorId}`, '1', { expirationTtl: 86400 * 90 }));
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
        const { message, sessionId, visitorId } = await request.json();

        if (!message || typeof message !== 'string') {
          return new Response(JSON.stringify({ error: 'message is required' }), {
            status: 400,
            headers: jsonHeaders,
          });
        }

        const startTime = Date.now(); // end to end, including retrieval
        let [history, userName] = await Promise.all([
          getHistory(env, sessionId),
          getUserName(env, sessionId),
        ]);
        let { context, topScore, sources } = await retrieve(env, message, history);
        let rewrites = [], scoreBefore = null, graded = null;
        if (topScore < STRONG_MATCH && !SMALLTALK.test(message.trim())) {
          try {
            rewrites = await rewriteQuery(env, message, history);
            scoreBefore = topScore;
            if (rewrites.length) {
              const second = await retrieve(env, message, history, rewrites);
              if (second.topScore > topScore) {
                graded = await contextAnswers(env, message, second.context);
                if (graded) ({ context, topScore, sources } = second);
                else ({ context, topScore, sources } = { context: '', topScore: Math.min(topScore, WEAK_MATCH - 0.001), sources: [] });
              }
            }
          } catch {} // the first retrieval still stands
        }
        const match = topScore >= STRONG_MATCH ? 'strong' : topScore >= WEAK_MATCH ? 'weak' : 'none';
        const found = match !== 'none';

        const msgCount = await incrementMsgCount(env, sessionId);
        const reviewDone = sessionId ? !!(await env.SESSIONS.get(`rev:${sessionId}`)) : false;
        const reviewTag = (!reviewDone && msgCount === 5) ? '\n\nREVIEW_REQUEST: Ask for feedback on your performance once, casually, in your reply.' : '';

        let identityPrompt = '';
        if (userName) {
          identityPrompt = `\n\nYou are talking to ${userName}. Use their name naturally in your reply.`;
        }

        let reply;
        let replyModel = null;

        if (!found) {
          const contextTag = 'NOT_FOUND';
          const messages = [
            { role: 'system', content: ARI_PERSONA_PROMPT },
            { role: 'system', content: `Context about Prashant: ${contextTag} (no relevant knowledge found for this query)\n\n${identityPrompt}${reviewTag}` },
            ...history,
            { role: 'user', content: message },
          ];
          const llm = await callLLM(env, messages, { maxTokens: 900 });
          reply = llm.content;
          replyModel = llm.model;
        } else {
          const strength = match === 'weak' ? 'WEAK MATCH (may not contain the answer)\n' : '';
          const messages = [
            { role: 'system', content: ARI_PERSONA_PROMPT },
            { role: 'system', content: `Context about Prashant: ${strength}\n${context}\n\nUse this for factual questions about Prashant. For follow-ups and clarifications about something you just said in chat, use our conversation history instead.${identityPrompt}${reviewTag}` },
            ...history,
            { role: 'user', content: message },
          ];
          const llm = await callLLM(env, messages, { maxTokens: 900 });
          reply = llm.content;
          replyModel = llm.model;
        }

        // Mark review as prompted
        if (reviewTag) {
          ctx.waitUntil(env.SESSIONS.put(`rev:${sessionId}`, '1', { expirationTtl: 60 * 60 * 6 }));
        }
        const latencyMs = Date.now() - startTime;

        history.push({ role: 'user', content: message });
        history.push({ role: 'assistant', content: reply });

        ctx.waitUntil((async () => {
          try {
            await env.SESSIONS.put(
              `log:${Date.now()}:${sessionId}`,
              JSON.stringify({ ts: Date.now(), sessionId, visitorId, message, reply, latencyMs, found, match, topScore: Math.round(topScore * 1000) / 1000, sources, model: replyModel,
                ...(scoreBefore != null && { rewrites, scoreBefore: Math.round(scoreBefore * 1000) / 1000, graded }) }),
              { expirationTtl: 86400 * 30 },
            );
          } catch {} // never block the user
        })());
        await Promise.all([
          saveHistory(env, sessionId, history),
          maybeSaveUserName(env, sessionId, message, userName),
        ]);

        return new Response(JSON.stringify({ reply }), { headers: jsonHeaders });
      }

      if (url.pathname === '/feedback' && request.method === 'POST') {
        const { sessionId, visitorId, postId, message, rating, review, action } = await request.json();
        if (action === 'delete') {
          if (!postId) {
            return new Response(JSON.stringify({ error: 'postId required' }), {
              status: 400, headers: jsonHeaders,
            });
          }
          await env.SESSIONS.delete(`fb:${postId}`);
          return new Response(JSON.stringify({ ok: true, deleted: postId }), { headers: jsonHeaders });
        }
        if (!postId || !message || !rating) {
          return new Response(JSON.stringify({ error: 'postId, message, and rating required' }), {
            status: 400, headers: jsonHeaders,
          });
        }
        ctx.waitUntil((async () => {
          try {
            await env.SESSIONS.put(
              `fb:${postId}`,
              JSON.stringify({ ts: Date.now(), sessionId, visitorId, postId, message, rating, review: review || '' }),
              { expirationTtl: 86400 * 30 },
            );
          } catch {}
        })());
        return new Response(JSON.stringify({ ok: true }), { headers: jsonHeaders });
      }

      if (url.pathname === '/seed-kb' && request.method === 'POST') {
        // Writes to the knowledge base: disabled unless the SEED_KEY secret is set and sent as X-Seed-Key.
        if (!env.SEED_KEY || request.headers.get('X-Seed-Key') !== env.SEED_KEY) {
          return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: jsonHeaders });
        }
        const { chunks } = await request.json();
        if (!chunks || !chunks.length) {
          return new Response(JSON.stringify({ error: 'chunks array required' }), {
            status: 400, headers: jsonHeaders,
          });
        }
        const texts = chunks.map(c => c.text);
        const { data } = await env.AI.run('@cf/baai/bge-base-en-v1.5', { text: texts });
        const vectors = chunks.map((c, i) => ({
          id: c.id || `chunk-${i}`,
          values: data[i],
          metadata: { text: c.text },
        }));
        await env.VECTORIZE.upsert(vectors);
        return new Response(JSON.stringify({ seeded: vectors.length }), { headers: jsonHeaders });
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
