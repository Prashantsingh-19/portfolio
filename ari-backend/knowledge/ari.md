# Ari — Prashant's Portfolio RAG Assistant

## What Ari is
Ari is the AI assistant on Prashant Singh's portfolio site (prashantsingh-19.github.io/portfolio), shown as a small crab mascot. Its job is to answer recruiters' and visitors' questions about Prashant's experience, projects and fit for a role, so the portfolio can answer follow-up questions instead of being a static page.

## How Ari is built
Ari is a Retrieval-Augmented Generation (RAG) system that Prashant designed and shipped end to end. Markdown files describing Prashant's experience and projects are split into chunks, embedded with a Cloudflare Workers AI embedding model and stored in Cloudflare Vectorize. For each question, Ari retrieves the most relevant chunks and passes them to a language model, so answers are grounded in real source material. The backend runs on Cloudflare Workers, with KV for session memory so follow-up questions keep context, and it falls back across multiple LLM providers if one is unavailable. Visitors can rate answers with thumbs up or down.

## Ari's analytics dashboard
Prashant built a private analytics dashboard for Ari on Cloudflare Pages. It tracks portfolio visits, the funnel from visit to chat, what visitors ask, which questions Ari could not answer from its knowledge base, reply latency percentiles, which LLM answered, and ratings. He uses it to find knowledge gaps and improve answers. The dashboard is private because it shows visitor activity.

## Ari technical specs: embeddings, vectorization and retrieval (how deep is the vectorization, which embedding model and vector database does Ari use)
Ari's vectorization is deliberately simple rather than deep: single-stage dense retrieval with BAAI bge-base-en-v1.5 embeddings (768 dimensions, on Cloudflare Workers AI) stored in Cloudflare Vectorize and matched by cosine similarity, over about 80 chunks, with no re-ranker or keyword search yet. The knowledge base is about 20 Markdown write-ups (roughly 5,700 words) split into about 80 chunks, one per section and at most 300 words each, with every chunk prefixed by its project title. For each question Ari embeds the question together with the previous turn, so follow-ups keep their topic. It keeps only the chunks that score close to the best match, and if nothing clears a relevance cut-off it says it doesn't have that detail instead of guessing. There is no keyword (BM25) search, re-ranker or query rewriting yet; adding hybrid search and a re-ranker is the obvious next step.

## Ari technical specs: which LLM Ari runs on, its fallback models, system prompt size, memory, and whether its information is static or from external sources
Which LLM does Ari use? Generation runs on OpenAI's open-weight gpt-oss-120b on Cloudflare Workers AI with low reasoning effort. If it fails, Ari falls back to GLM-4.7-Flash on Workers AI, then DeepSeek V4 Pro on NVIDIA, then Nemotron Ultra and Gemma on OpenRouter. The system prompt (persona and rules) is about 1,800 words, and each answer sees the prompt, the retrieved chunks and the last 10 messages of the conversation, kept in Cloudflare KV for 6 hours. The knowledge is static: Ari does not browse the web or call external sources at answer time. It stays current when Prashant edits the Markdown write-ups and re-embeds them, which takes a few minutes.

## Why Ari matters (for a recruiter)
Ari shows Prashant can take a product from idea to production: choosing the architecture, designing retrieval, handling LLM provider failures, designing the persona and user experience, and instrumenting usage with analytics. It solves a real problem: giving recruiters the right information without needing a live conversation.
