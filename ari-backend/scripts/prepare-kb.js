/**
 * prepare-kb.js
 * 
 * Reads markdown knowledge files → chunks → calls Gemini Embedding API →
 * outputs knowledge-base.json (bundled with the Worker).
 * 
 * Usage:
 *   export GEMINI_API_KEY="your-key"
 *   node scripts/prepare-kb.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const KB_DIR = path.resolve(__dirname, '..', 'knowledge');
const OUTPUT = path.resolve(__dirname, '..', 'knowledge-base.json');
const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.error('❌ Set GEMINI_API_KEY environment variable');
  process.exit(1);
}

const EMBED_MODEL = 'gemini-embedding-001';
const CHUNK_SIZE = 300; // words per chunk
const CHUNK_OVERLAP = 50;

function chunkText(text, source) {
  const words = text.split(/\s+/);
  const chunks = [];
  for (let i = 0; i < words.length; i += CHUNK_SIZE - CHUNK_OVERLAP) {
    const slice = words.slice(i, i + CHUNK_SIZE);
    if (slice.length < 20) continue;
    chunks.push({
      id: `${source}-${chunks.length}`,
      text: slice.join(' '),
      metadata: { source }
    });
  }
  return chunks;
}

async function embed(text) {
  const url = `https://generativelanguage.googleapis.com/v1/models/${EMBED_MODEL}:embedContent?key=${API_KEY}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: `models/${EMBED_MODEL}`, content: { parts: [{ text }] } })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Embedding error: ${JSON.stringify(data)}`);
  return data.embedding.values;
}

async function main() {
  const files = fs.readdirSync(KB_DIR).filter(f => f.endsWith('.md'));
  if (!files.length) {
    console.error('❌ No markdown files found in knowledge/');
    process.exit(1);
  }

  // Read and chunk
  const allChunks = [];
  for (const file of files) {
    const content = fs.readFileSync(path.join(KB_DIR, file), 'utf-8');
    const source = file.replace('.md', '');
    const chunks = chunkText(content, source);
    allChunks.push(...chunks);
    console.log(`  ${file} → ${chunks.length} chunks`);
  }

  console.log(`\n📦 ${allChunks.length} total chunks. Generating embeddings...`);

  // Generate embeddings (batch of 5 at a time to avoid rate limits)
  const BATCH_SIZE = 5;
  for (let i = 0; i < allChunks.length; i += BATCH_SIZE) {
    const batch = allChunks.slice(i, i + BATCH_SIZE);
    await Promise.all(batch.map(async (chunk) => {
      chunk.embedding = await embed(chunk.text);
    }));
    console.log(`  ✓ ${Math.min(i + BATCH_SIZE, allChunks.length)}/${allChunks.length} embedded`);
    if (i + BATCH_SIZE < allChunks.length) {
      await new Promise(r => setTimeout(r, 200)); // rate limit buffer
    }
  }

  // Write output
  const output = { chunks: allChunks };
  fs.writeFileSync(OUTPUT, JSON.stringify(output));
  console.log(`\n✅ Written to knowledge-base.json (${(Buffer.byteLength(JSON.stringify(output)) / 1024).toFixed(1)} KB)`);
}

main().catch(err => {
  console.error('❌', err);
  process.exit(1);
});
