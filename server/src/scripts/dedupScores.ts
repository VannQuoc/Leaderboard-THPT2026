import { readScores, writeScores } from '../db/jsonDb.js';

async function dedupScores() {
  const data = await readScores();
  const seen = new Set<string>();
  const unique = data.results.filter((r) => {
    if (seen.has(r.sbd)) return false;
    seen.add(r.sbd);
    return true;
  });

  // Re-rank
  unique.sort((a, b) => (b.tongDiem ?? 0) - (a.tongDiem ?? 0));
  unique.forEach((s, i) => { s.rank = s.tongDiem !== null ? i + 1 : null; });

  data.results = unique;
  data.totalCrawled = unique.filter((r) => r.scores !== null).length;
  await writeScores(data);

  console.log(`✅ Deduplicated: ${data.results.length} unique students (was ${seen.size + (data.results.length - unique.length)})`);
}

dedupScores().catch(console.error);
