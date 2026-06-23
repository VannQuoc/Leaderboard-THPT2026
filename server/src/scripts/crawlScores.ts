import { config } from '../config.js';
import { readStudents, readScores, writeScores } from '../db/jsonDb.js';
import { API_FIELD_MAP } from '../types.js';
import type { ScoreData, StudentWithScore } from '../types.js';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function parseApiResponse(apiData: Record<string, unknown>): ScoreData {
  const scores: Record<string, number | null> = {};

  for (const [apiKey, schemaKey] of Object.entries(API_FIELD_MAP)) {
    const val = apiData[apiKey];
    scores[schemaKey] = typeof val === 'number' && val >= 0 ? val : null;
  }

  return scores as unknown as ScoreData;
}

async function fetchScore(sbd: string): Promise<ScoreData | null> {
  const { primaryApi, year, maxRetries, headers } = config.crawl;
  const url = `${primaryApi}?sbd=${sbd}&year=${year}`;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const res = await fetch(url, { headers });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const json = await res.json() as { success: boolean; data: Record<string, unknown>[] };
      if (json.success && json.data?.length > 0) {
        return parseApiResponse(json.data[0]);
      }

      return null; // No data for this SBD
    } catch (err) {
      const waitMs = 1000 * Math.pow(2, attempt);
      console.warn(`  ⚠️  Attempt ${attempt + 1}/${maxRetries} failed for ${sbd}. Retrying in ${waitMs}ms...`);
      await delay(waitMs);
    }
  }

  return null; // All retries exhausted
}

function calculateTongDiem(scores: ScoreData): number {
  const values = Object.values(scores).filter((v): v is number => v !== null && v >= 0);
  return Math.round(values.reduce((sum, v) => sum + v, 0) * 100) / 100;
}

async function crawlAll(): Promise<void> {
  console.log('🚀 Starting score crawl...');
  console.log(`📡 API: ${config.crawl.primaryApi}`);
  console.log(`📅 Year: ${config.crawl.year}`);

  const studentsData = await readStudents();
  const existingScores = await readScores();

  if (studentsData.students.length === 0) {
    console.error('❌ No students found. Run import first: npm run import');
    process.exit(1);
  }

  console.log(`👥 Total students: ${studentsData.students.length}`);

  // Build a map of already-crawled SBDs to skip
  const crawledMap = new Map(existingScores.results.map((r) => [r.sbd, r]));

  const results: StudentWithScore[] = [...existingScores.results];
  let crawled = existingScores.totalCrawled;
  let failed = existingScores.totalFailed;

  for (let i = 0; i < studentsData.students.length; i++) {
    const student = studentsData.students[i];

    // Skip already crawled
    if (crawledMap.has(student.sbd)) {
      continue;
    }

    const progress = `[${i + 1}/${studentsData.students.length}]`;
    process.stdout.write(`${progress} Crawling ${student.sbd} (${student.hoTen})...`);

    const scores = await fetchScore(student.sbd);

    if (scores) {
      const tongDiem = calculateTongDiem(scores);
      results.push({ ...student, scores, tongDiem, rank: null });
      crawled++;
      console.log(` ✅ ${tongDiem} điểm`);
    } else {
      results.push({ ...student, scores: null, tongDiem: null, rank: null });
      failed++;
      console.log(` ❌ Failed`);
    }

    // Save progress every 20 students
    if ((i + 1) % 20 === 0) {
      await saveWithRanks(results, crawled, failed);
      console.log(`💾 Progress saved (${crawled} crawled, ${failed} failed)`);
    }

    await delay(config.crawl.delayMs);
  }

  // Final save with ranks
  await saveWithRanks(results, crawled, failed, true);

  console.log('\n🎉 Crawl completed!');
  console.log(`✅ Success: ${crawled} | ❌ Failed: ${failed}`);
}

async function saveWithRanks(
  results: StudentWithScore[],
  crawled: number,
  failed: number,
  isComplete = false,
): Promise<void> {
  // Sort by tongDiem desc and assign ranks
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

crawlAll().catch(console.error);
