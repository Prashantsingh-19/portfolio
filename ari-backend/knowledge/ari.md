# How Ari Works — The Chatbot Itself

Ari is a RAG (Retrieval Augmented Generation) chatbot built on:
- Cloudflare Workers (serverless, free tier — 100k requests/day)
- Google Gemini API (gemini-2.0-flash for chat, text-embedding-004 for vectors)
- Pre-computed knowledge base with cosine similarity search

Flow:
1. User asks a question → embedded into a vector via Gemini
2. Vector compared against stored knowledge chunks (cosine similarity)
3. Top matching chunks retrieved as context
4. Prompt built: system personality + retrieved context + user question
5. Gemini generates a grounded, factual answer

Architecture: Static HTML widget on portfolio → calls Cloudflare Worker →
Gemini API. No backend server to manage. Entire backend is a single JS file.
