import { Router } from 'express';
import { getOverview, getDistribution, getBySubject } from '../services/statsService.js';

const router = Router();

router.get('/overview', async (_req, res) => {
  const overview = await getOverview();
  res.json({ success: true, data: overview });
});

router.get('/distribution', async (_req, res) => {
  const distribution = await getDistribution();
  res.json({ success: true, data: distribution });
});

router.get('/by-subject', async (_req, res) => {
  const stats = await getBySubject();
  res.json({ success: true, data: stats });
});

export default router;
