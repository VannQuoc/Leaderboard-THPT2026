import { readScores, writeScores } from '../db/jsonDb.js';

async function resetMissingScores() {
  const scoresData = await readScores();
  let resetCount = 0;

  scoresData.results.forEach(s => {
    if (!s.scores) return;
    
    let missing = false;
    // Check compulsory
    if (s.scores.toan === null || s.scores.van === null) missing = true;
    
    // Check optional
    if (s.monTuChon) {
      s.monTuChon.forEach(m => {
        if (s.scores && s.scores[m as keyof typeof s.scores] === null) {
          missing = true;
        }
      });
    }

    if (missing) {
      s.scores = null;
      s.tongDiem = null;
      s.rank = null;
      resetCount++;
    }
  });

  scoresData.totalCrawled -= resetCount;
  if (scoresData.totalCrawled < 0) scoresData.totalCrawled = 0;

  await writeScores(scoresData);
  console.log(`✅ Da reset diem cho ${resetCount} hoc sinh bi thieu mon.`);
  console.log(`🚀 Hay khoi dong lai Server de he thong tu dong crawl lai cac ban nay!`);
}

resetMissingScores().catch(console.error);
