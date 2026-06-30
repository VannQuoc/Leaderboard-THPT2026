import { readStudents, readScores, writeScores } from '../db/jsonDb.js';
import { providerManager } from './scoreProviders.js';
import type { ScoreData, StudentWithScore } from '../types.js';

const CONCURRENCY = 5;
const SAVE_INTERVAL = 20;
const DELAY_BETWEEN_MS = 200;

function calculateTongDiem(scores: ScoreData): number {
  const values = Object.values(scores).filter((v): v is number => v !== null && v >= 0);
  return Math.round(values.reduce((sum, v) => sum + v, 0) * 100) / 100;
}

export interface CrawlStatus {
  running: boolean;
  round: number;
  crawled: number;
  failed: number;
  total: number;
  remaining: number;
  startedAt: string | null;
}

let _status: CrawlStatus = {
  running: false,
  round: 0,
  crawled: 0,
  failed: 0,
  total: 0,
  remaining: 0,
  startedAt: null,
};

export function getCrawlStatus(): CrawlStatus {
  return { ..._status };
}

async function saveWithRanks(
  results: StudentWithScore[],
  crawled: number,
  failed: number,
  isComplete = false,
): Promise<void> {
  const sorted = [...results].sort((a, b) => (b.tongDiem ?? 0) - (a.tongDiem ?? 0));
  sorted.forEach((s, i) => {
    s.rank = s.tongDiem !== null ? i + 1 : null;
  });

  await writeScores({
    lastUpdated: new Date().toISOString(),
    crawlStatus: isComplete ? 'completed' : 'in_progress',
    totalCrawled: crawled,
    totalFailed: failed,
    results: sorted,
  });
}

// Process a batch of SBDs concurrently
async function crawlBatch(
  students: { sbd: string; student: StudentWithScore }[],
): Promise<Map<string, ScoreData | null>> {
  const results = new Map<string, ScoreData | null>();

  const work = [...students];
  const workers = Array.from({ length: Math.min(CONCURRENCY, work.length) }, async () => {
    while (work.length > 0) {
      const item = work.shift()!;
      try {
        const scores = await providerManager.fetchScore(item.sbd);
        results.set(item.sbd, scores);
      } catch {
        results.set(item.sbd, null);
      }
      if (work.length > 0) {
        await new Promise((r) => setTimeout(r, DELAY_BETWEEN_MS));
      }
    }
  });

  await Promise.all(workers);
  return results;
}

export async function startCrawler(): Promise<void> {
  if (_status.running) {
    console.log('⚠️ Crawler already running, skipping');
    return;
  }

  console.log('🚀 Starting crawler v2 (multi-thread, auto-retry)...');

  _status.running = true;
  _status.startedAt = new Date().toISOString();
  _status.round = 0;

  const studentsData = await readStudents();
  if (studentsData.students.length === 0) {
    console.error('❌ No students found. Run import first.');
    _status.running = false;
    return;
  }

  _status.total = studentsData.students.length;

  // Load existing results
  const existingScores = await readScores();
  const resultsMap = new Map<string, StudentWithScore>();
  for (const r of existingScores.results) {
    resultsMap.set(r.sbd, r);
  }

  // Initialize any students not yet in results
  for (const student of studentsData.students) {
    if (!resultsMap.has(student.sbd)) {
      resultsMap.set(student.sbd, { ...student, scores: null, tongDiem: null, rank: null });
    }
  }

  // Crawl loop: retry rounds until all have scores
  while (_status.running) {
    _status.round++;
    console.log(`\n📡 Round ${_status.round} starting...`);

    // Find students missing scores
    const missing: { sbd: string; student: StudentWithScore }[] = [];
    for (const [sbd, student] of resultsMap) {
      if (student.scores === null) {
        missing.push({ sbd, student });
      }
    }

    _status.remaining = missing.length;
    _status.crawled = _status.total - missing.length;

    if (missing.length === 0) {
      console.log('🎉 All students have scores! Crawler complete.');
      break;
    }

    console.log(`📋 ${missing.length} students remaining (${_status.crawled}/${_status.total} done)`);

    // Process in batches
    const BATCH_SIZE = SAVE_INTERVAL;
    let batchFailed = 0;

    for (let i = 0; i < missing.length; i += BATCH_SIZE) {
      const batch = missing.slice(i, i + BATCH_SIZE);
      const batchResults = await crawlBatch(batch);

      let batchSuccess = 0;
      for (const [sbd, scores] of batchResults) {
        const student = resultsMap.get(sbd)!;
        if (scores) {
          student.scores = scores;
          student.tongDiem = calculateTongDiem(scores);
          batchSuccess++;
        } else {
          batchFailed++;
        }
      }

      _status.crawled = [...resultsMap.values()].filter((s) => s.scores !== null).length;
      _status.failed = batchFailed;
      _status.remaining = _status.total - _status.crawled;

      // Save progress
      const allResults = [...resultsMap.values()];
      await saveWithRanks(allResults, _status.crawled, batchFailed);
      console.log(`  💾 Saved: ${_status.crawled}/${_status.total} (batch: +${batchSuccess})`);
    }

    // If there are still missing scores, wait before next round
    const stillMissing = [...resultsMap.values()].filter((s) => s.scores === null).length;
    if (stillMissing > 0) {
      const waitSec = Math.min(30, 5 * _status.round);
      console.log(`⏳ ${stillMissing} still missing. Waiting ${waitSec}s before round ${_status.round + 1}...`);
      await new Promise((r) => setTimeout(r, waitSec * 1000));
    }
  }

  // Final save
  const allResults = [...resultsMap.values()];
  _status.crawled = allResults.filter((s) => s.scores !== null).length;
  await saveWithRanks(allResults, _status.crawled, _status.failed, true);

  _status.running = false;
  console.log(`\n✅ Crawler finished. ${_status.crawled}/${_status.total} crawled.`);
}

export function stopCrawler(): void {
  _status.running = false;
  console.log('🛑 Crawler stop requested');
}
