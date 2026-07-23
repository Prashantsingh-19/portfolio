# How Ari Works — The Chatbot Itself

Ari is a RAG (Retrieval Augmented Generation) chatbot built on:
- Cloudflare Workers (serverless, free tier — 100k requests/day)
- NVIDIA NIM API (DeepSeek V4 Pro for chat generation)
- Workers AI (embedding for vector search)
- Cloudflare KV (session memory — persists across page refreshes, 6hr expiry)
- Pre-computed knowledge base with cosine similarity search

Flow:
1. User opens chat → POST /greet checks KV for returning visitor
2. New visitor → asked "what brings you by?" with quick-reply chips (recruiter/builder/curious)
3. Visitor selects type → POST /classify saves it, returns personalized greeting with relevant highlight
4. User asks question → query embedded, compared against knowledge chunks via cosine similarity
5. Top matching chunks retrieved as context alongside chat history from KV
6. DeepSeek V4 Pro generates a grounded, personality-driven answer
7. Conversation saved to KV (last 10 messages, 6 hour TTL)

Architecture: Static HTML widget on GitHub Pages → calls Cloudflare Worker →
NVIDIA NIM API. Session memory in KV. Personality in persona.js.
No backend server to manage.
