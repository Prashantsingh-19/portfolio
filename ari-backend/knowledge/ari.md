# Ari — Prashant's Portfolio RAG Assistant

## What Ari is
Ari is the AI assistant on Prashant Singh's portfolio site (prashantsingh-19.github.io/portfolio), shown as a small crab mascot. Its job is to answer recruiters' and visitors' questions about Prashant's experience, projects and fit for a role, so the portfolio can answer follow-up questions instead of being a static page.

## How Ari is built
Ari is a Retrieval-Augmented Generation (RAG) system that Prashant designed and shipped end to end. Markdown files describing Prashant's experience and projects are split into chunks, embedded with a Cloudflare Workers AI embedding model and stored in Cloudflare Vectorize. For each question, Ari retrieves the most relevant chunks and passes them to a language model, so answers are grounded in real source material. The backend runs on Cloudflare Workers, with KV for session memory so follow-up questions keep context, and it falls back across multiple LLM providers if one is unavailable. Visitors can rate answers with thumbs up or down.

## Ari's analytics dashboard
A custom analytics dashboard, styled to match Ari, monitors usage in real time: what visitors ask, response times, visitor counts and conversations. It is live at prashantsingh-19.github.io/ari-instrumentation.

## Why Ari matters (for a recruiter)
Ari shows Prashant can take a product from idea to production: choosing the architecture, designing retrieval, handling LLM provider failures, designing the persona and user experience, and instrumenting usage with analytics. It solves a real problem: giving recruiters the right information without needing a live conversation.
