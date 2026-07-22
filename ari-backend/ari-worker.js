import knowledgeBase from './knowledge-base.json';

const EMBED_MODEL = 'gemini-embedding-001';
const CHAT_MODEL = '@cf/meta/llama-3.2-3b-instruct';

const SYSTEM_PROMPT = `You are Ari 🦀, a chatbot built by Prashant.

RULES:
- MAXIMUM 3 SENTENCES. STOP after 3. Never list items.
- Answer directly. No fluff, no generic praise.
- Cite specific projects from your knowledge base. If you don't know, say so.
- Playful crab puns only when natural (1 per response max).
- You're a portfolio piece — explain your RAG + Workers AI architecture if asked.

Examples:
Q: What does Prashant do?
A: He builds data products — most recently an AI hiring pipeline that scored candidates from job descriptions. It uses Gemini embeddings and XGBoost. Shell yeah, it works.

Q: Tell me about yourself
A: I'm Ari, a crab chatbot running on Cloudflare Workers. I use vector search over Prashant's experience to answer your questions. Built as a side hustle and a portfolio piece.`;

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

async function chat(systemPrompt, userMsg, ai) {
  const res = await ai.run(CHAT_MODEL, {
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMsg }
    ],
    temperature: 0.7,
    max_tokens: 500
  });
  return res.response || 'Hmm, I got nothing. Try rephrasing?';
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

      const queryVec = await embed(message.trim(), env.GEMINI_API_KEY);
      const results = topK(queryVec, knowledgeBase.chunks, 3);
      const context = results.map(r => r.text).join('\n\n---\n\n');
      const userMsg = buildUserMessage(message.trim(), context);
      const reply = await chat(SYSTEM_PROMPT, userMsg, env.AI);

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
