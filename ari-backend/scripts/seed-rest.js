// Re-embed knowledge/*.md and upsert into Vectorize through the Cloudflare REST API
// (the /seed-kb route lives on *.workers.dev, which some networks block). Removes vectors
// whose chunk no longer exists.
//   CF_API_TOKEN=$(wrangler auth token) node scripts/seed-rest.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const KB_DIR = path.resolve(__dirname, '..', 'knowledge');
const ACCOUNT = '9760f984c0609890ee859bc9c1e40b29';
const INDEX = 'ari-knowledge';
const API = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT}`;
const H = { Authorization: `Bearer ${process.env.CF_API_TOKEN}` };
const CHUNK_SIZE = 300;
const CHUNK_OVERLAP = 50;

// Same chunking as build-kb.js: one chunk per "## " section, prefixed with the file title.
function chunkText(text, source) {
  const title = (text.match(/^# (.+)$/m) || [, source])[1].trim();
  const chunks = [];
  for (const section of text.split(/^## /m).slice(1)) {
    const words = `${title} — ${section}`.split(/\s+/);
    for (let i = 0; i < words.length; i += CHUNK_SIZE - CHUNK_OVERLAP) {
      const slice = words.slice(i, i + CHUNK_SIZE);
      if (slice.length < 20) continue;
      chunks.push({ id: `${source}-${chunks.length}`, text: slice.join(' ') });
      if (i + CHUNK_SIZE >= words.length) break;
    }
  }
  return chunks;
}

async function cf(url, init = {}) {
  const res = await fetch(API + url, { ...init, headers: { ...H, ...(init.headers || {}) } });
  const data = await res.json();
  if (!data.success) throw new Error(`${url}: ${JSON.stringify(data.errors)}`);
  return data.result;
}

const chunks = fs.readdirSync(KB_DIR).filter(f => f.endsWith('.md'))
  .flatMap(f => chunkText(fs.readFileSync(path.join(KB_DIR, f), 'utf-8'), f.replace('.md', '')));
console.log(`${chunks.length} chunks`);

const vectors = [];
for (let i = 0; i < chunks.length; i += 50) {
  const batch = chunks.slice(i, i + 50);
  const { data } = await cf('/ai/run/@cf/baai/bge-base-en-v1.5', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: batch.map(c => c.text) }),
  });
  batch.forEach((c, j) => vectors.push({ id: c.id, values: data[j], metadata: { text: c.text } }));
}
await cf(`/vectorize/v2/indexes/${INDEX}/upsert`, {
  method: 'POST', headers: { 'Content-Type': 'application/x-ndjson' }, body: vectors.map(v => JSON.stringify(v)).join('\n'),
});
console.log(`upserted ${vectors.length}`);

// Find stale ids: a query with topK 100 and no metadata returns every vector in this small index.
const probe = await cf(`/vectorize/v2/indexes/${INDEX}/query`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ vector: vectors[0].values, topK: 100, returnMetadata: 'none', returnValues: false }),
});
const keep = new Set(vectors.map(v => v.id));
const stale = probe.matches.map(m => m.id).filter(id => !keep.has(id));
if (stale.length) {
  await cf(`/vectorize/v2/indexes/${INDEX}/delete_by_ids`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: stale }),
  });
}
console.log(`deleted ${stale.length} stale: ${stale.join(', ')}`);
