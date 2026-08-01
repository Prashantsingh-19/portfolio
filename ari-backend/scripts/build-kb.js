import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const KB_DIR = path.resolve(__dirname, '..', 'knowledge');
const WORKER_URL = 'https://ari-chatbot.itsprashantsingh19.workers.dev/seed-kb';

const CHUNK_SIZE = 300;
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
    });
  }
  return chunks;
}

async function main() {
  const files = fs.readdirSync(KB_DIR).filter(f => f.endsWith('.md'));
  if (!files.length) {
    console.error('No markdown files found in knowledge/');
    process.exit(1);
  }

  const allChunks = [];
  for (const file of files) {
    const content = fs.readFileSync(path.join(KB_DIR, file), 'utf-8');
    const source = file.replace('.md', '');
    const chunks = chunkText(content, source);
    allChunks.push(...chunks);
    console.log(`  ${file} → ${chunks.length} chunks`);
  }

  console.log(`\n📦 ${allChunks.length} total chunks. Seeding vector store...`);

  const res = await fetch(WORKER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chunks: allChunks }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(`Seed failed: ${JSON.stringify(data)}`);
  console.log(`✅ Seeded ${data.seeded} vectors to Vectorize\n`);
}

main().catch(err => {
  console.error('❌', err);
  process.exit(1);
});