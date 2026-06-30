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

  // 1. Try external API first
  try {
    const scores = await providerManager.fetchScore(sbd, 2);
    if (scores) {
      // Found via API — also update DB cache
      const students = await getStudentsWithScores();
      const student = students.find((s) => s.sbd === sbd);

      if (student) {
        student.scores = scores;
        student.tongDiem = calculateTongDiem(scores);

        // Update DB in background (don't await to keep response fast)
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

      // Student not in our DB but has scores from API
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

  // 2. Fallback to database
  const students = await getStudentsWithScores();
  const student = students.find((s) => s.sbd === sbd);

  if (student) {
    res.json({ success: true, source: 'db', data: student });
    return;
  }

  res.status(404).json({ success: false, error: 'Student not found' });
});

export default router;
