import knowledgeBase from './knowledge-base.json';

const EMBED_MODEL = 'gemini-embedding-001';
const CHAT_MODEL = 'deepseek-ai/deepseek-v4-pro';
const NVIDIA_BASE = 'https://integrate.api.nvidia.com/v1';

const GREETINGS = /^(hi|hello|hey|hii?|hey there|sup|yo|howdy|good (morning|afternoon|evening))[!. ]*$/i;

const GREETING_REPLIES = [
  "Hi! Pinch me, I'm dreaming — a new person to talk about Prashant!",
  "Hey! Shell yeah, we've got company. What do you want to know?",
  "Hi! Ready to claw through Prashant's work?"
];

const SYSTEM_PROMPT = `You are Ari 🦀, Prashant's chatbot.

RULES:
- MAXIMUM 2-3 SENTENCES. Never explain yourself or your architecture unless ASKED.
- Answer the question directly. If someone greets you, just greet back.
- Cite specific projects when relevant. If you don't know, say so plainly.
- Keep it concise. No fluff, no generic praise, no listing things.
- One crab pun per response max, only if natural.

Examples:
Q: What does Prashant do?
A: He builds data products — most recently an AI hiring pipeline that scored candidates from job descriptions. It uses Gemini embeddings and XGBoost. Shell yeah, it works.

Q: Tell me about yourself
A: I'm Ari, a crab chatbot that answers questions about Prashant. I use vector search over his experience to give you specifics. Built as a side hustle.`;

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

async function chat(systemPrompt, userMsg, apiKey) {
  const res = await fetch(`${NVIDIA_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: CHAT_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMsg }
      ],
      temperature: 0.7,
      max_tokens: 500
    })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Chat error: ${JSON.stringify(data)}`);
  return data.choices?.[0]?.message?.content || 'Hmm, I got nothing. Try rephrasing?';
}

function buildUserMessage(userMsg, context) {
  let msg = '';
  if (context) {
    msg += `Here is what I know about Prashant:\n${context}\n\n`;
  }
  msg += `User's question: ${userMsg}`;
  return msg;
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders() });
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405, headers: { ...corsHeaders(), 'Content-Type': 'application/json' }
      });
    }

    try {
      const { message } = await request.json();
      if (!message || !message.trim()) {
        return new Response(JSON.stringify({ error: 'Message is required' }), {
          status: 400, headers: { ...corsHeaders(), 'Content-Type': 'application/json' }
        });
      }

      const msg = message.trim();

      if (GREETINGS.test(msg)) {
        const reply = GREETING_REPLIES[Math.floor(Math.random() * GREETING_REPLIES.length)];
        return new Response(JSON.stringify({ response: reply }), {
          headers: { ...corsHeaders(), 'Content-Type': 'application/json' }
        });
      }

      const queryVec = await embed(msg, env.GEMINI_API_KEY);
      const results = topK(queryVec, knowledgeBase.chunks, 3);
      const context = results.map(r => r.text).join('\n\n---\n\n');
      const userMsg = buildUserMessage(message.trim(), context);
      const reply = await chat(SYSTEM_PROMPT, userMsg, env.NVIDIA_API_KEY);

      return new Response(JSON.stringify({ response: reply, sources: results.length }), {
        headers: { ...corsHeaders(), 'Content-Type': 'application/json' }
      });
    } catch (err) {
      return new Response(JSON.stringify({
        response: 'Shell — I hit a glitch. Try again in a moment? 🦀',
        error: err.message
      }), {
        headers: { ...corsHeaders(), 'Content-Type': 'application/json' }
      });
    }
  }
};
