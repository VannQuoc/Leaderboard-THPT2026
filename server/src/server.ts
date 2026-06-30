import app from './app.js';
import { config } from './config.js';
import { startCrawler } from './services/crawlerService.js';

// Target: 2026-07-01 08:00:00 GMT+7 (= 01:00:00 UTC)
const CRAWL_START = new Date('2026-07-01T01:00:00.000Z');

function scheduleCrawler(): void {
  const now = Date.now();
  const target = CRAWL_START.getTime();

  if (now >= target) {
    console.log('⏰ Past crawl start time — starting crawler immediately');
    startCrawler().catch(console.error);
  } else {
    const delayMs = target - now;
    const delayMin = Math.round(delayMs / 60000);
    console.log(`⏰ Crawler scheduled in ${delayMin} minutes (${CRAWL_START.toISOString()})`);
    setTimeout(() => {
      console.log('⏰ Scheduled time reached — starting crawler');
      startCrawler().catch(console.error);
    }, delayMs);
  }
}

app.listen(config.port, () => {
  console.log(`🚀 Server running at http://localhost:${config.port}`);
  console.log(`📊 API: http://localhost:${config.port}/api/students`);
  console.log(`📈 Stats: http://localhost:${config.port}/api/stats/overview`);
  console.log(`🔍 Lookup: http://localhost:${config.port}/api/lookup/:sbd`);

  scheduleCrawler();
});
