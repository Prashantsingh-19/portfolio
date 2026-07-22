# Ari 🦀 — Backend Setup

## Prerequisites

- [Cloudflare account](https://dash.cloudflare.com/sign-up) (free)
- [Google AI Studio API key](https://aistudio.google.com/apikey) (free)
- [Node.js](https://nodejs.org/) 18+ for the knowledge prep script
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/): `npm install -g wrangler`

## Step 1: Write Your Knowledge Base

Edit the files in `knowledge/`:

- `bio.md` — Who you are
- `capabilities.md` — Skills, product thinking, architecture design
- `experience.md` — Work history, education
- `projects.md` — Key projects with descriptions
- `ari.md` — How the chatbot works (so Ari can explain itself)

Each file is plain markdown. Keep paragraphs natural — the script chunks them.

## Step 2: Build the Knowledge Base

```bash
cd ari-backend
export GEMINI_API_KEY="your-google-ai-studio-key"
node scripts/prepare-kb.js
```

This reads `knowledge/*.md`, chunks them, calls Gemini Embedding API,
and writes `knowledge-base.json`.

## Step 3: Deploy the Worker

```bash
# Login to Cloudflare
wrangler login

# Set your Gemini API key as a secret
wrangler secret put GEMINI_API_KEY

# Deploy
wrangler deploy
```

After deploy, you'll get a URL like:
`https://ari-chatbot.your-subdomain.workers.dev`

## Step 4: Connect the Widget

In `index.html`, update the `WORKER_URL` constant:

```js
const WORKER_URL = 'https://ari-chatbot.your-subdomain.workers.dev/chat';
```

## Updating Ari's Knowledge

When you update your bio or projects:

```bash
node scripts/prepare-kb.js   # re-generate knowledge-base.json
wrangler deploy              # re-deploy
```

## Free Tier Limits

| Service | Limit | Will you hit it? |
|---------|-------|-----------------|
| Cloudflare Workers | 100k requests/day | No (~10 visitors/month) |
| Gemini Embedding | 1,500 queries/day | No |
| Gemini Chat | 1,500 queries/day, 60/min | No |

Total cost: **$0/month**
