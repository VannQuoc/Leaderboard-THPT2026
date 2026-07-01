import { Router } from 'express';
import { providerManager } from '../services/scoreProviders.js';
import { getStudentsWithScores, readScores, writeScores } from '../db/jsonDb.js';
import type { ScoreData } from '../types.js';

const router = Router();

function calculateTongDiem(scores: ScoreData): number {
  const values = Object.values(scores).filter((v): v is number => v !== null && v >= 0);
  return Math.round(values.reduce((sum, v) => sum + v, 0) * 100) / 100;
}

router.get('/:sbd', async (req, res) => {
  const { sbd } = req.params;

  // 1. Check local database first
  const students = await getStudentsWithScores();
  const student = students.find((s) => s.sbd === sbd);

  // If student exists and already has scores, return immediately
  if (student && student.scores) {
    res.json({ success: true, source: 'db', data: student });
    return;
  }

  // 2. Fallback to external API if score not found locally
  try {
    const scores = await providerManager.fetchScore(sbd, 2);
    if (scores) {
      if (student) {
        student.scores = scores;
        student.tongDiem = calculateTongDiem(scores);

        // Update DB in background
        const scoresData = await readScores();
        const idx = scoresData.results.findIndex((r) => r.sbd === sbd);
        if (idx >= 0) {
          scoresData.results[idx] = student;
        } else {
          scoresData.results.push(student);
        }
        scoresData.totalCrawled = scoresData.results.filter((r) => r.scores !== null).length;
        scoresData.lastUpdated = new Date().toISOString();
        writeScores(scoresData).catch(console.error);

        res.json({ success: true, source: 'api', data: student });
        return;
      }

      // Student not in our local list but API returned scores
      res.json({
        success: true,
        source: 'api',
        data: { sbd, hoTen: '', scores, tongDiem: calculateTongDiem(scores), rank: null },
      });
      return;
    }
  } catch (err) {
    console.warn(`API lookup failed for ${sbd}:`, err);
  }

  // If we reach here, we either don't have the student or they have no scores and API failed
  if (student) {
     res.json({ success: true, source: 'db', data: student }); // Return what we have (even without scores)
     return;
  }

  res.status(404).json({ success: false, error: 'Student not found' });
});

export default router;
