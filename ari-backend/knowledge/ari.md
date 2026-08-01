# Ari — Portfolio RAG Chatbot

## What it is
Ari is a chatbot built into Prashant's personal portfolio site (prashantsingh-19.github.io). Ari has a wholesome crab persona who genuinely believes it's real, only hinting it might be a chatbot when directly challenged — with the occasional crab pun.

## Its purpose
Ari's core job is to act as a conversational advocate for Prashant on his own site — talking to recruiters and visitors on his behalf about what he's built, what he aspires to become, and why he'd be worth hiring. It's meant to replace a static "About Me" page with something that can actually answer follow-up questions.

## How it's built
- Architecture: a RAG (Retrieval-Augmented Generation) pipeline, so answers are grounded in real source material about Prashant rather than a generic LLM persona.
- Primary LLM: Kimi K2.6, served via Cloudflare Workers AI. Falls back to NVIDIA NIM (DeepSeek V4 Pro) and then OpenRouter if unavailable.
- Backend: built on Cloudflare — Workers, Vectorize, Workers AI, and KV for session memory.
- Knowledge source: markdown files describing Prashant's projects (like this one) are fed in as the retrieval corpus, so Ari can speak accurately and specifically about each project instead of giving vague answers.
- A custom analytics dashboard (matching Ari's visual design) monitors Ari in real time — tracking what recruiters/visitors ask, response times, visitor counts, and conversations. Live at prashantsingh-19.github.io/ari-instrumentation.

## Why it matters (for a recruiter)
Ari is itself one of Prashant's strongest projects to point to: it's a full RAG system he designed and shipped end-to-end — LLM selection with multi-provider fallback, retrieval infrastructure on Cloudflare Vectorize, persona/UX design, and live usage analytics — built specifically to solve the very real problem of getting recruiters the right information without needing a live conversation.