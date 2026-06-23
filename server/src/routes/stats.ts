import { Router } from 'express';
import { getOverview, getDistribution, getBySubject, getTopByKhoi, getTopByLop, getTopByPhong, getKhoiDefinitions } from '../services/statsService.js';

const router = Router();

router.get('/overview', async (_req, res) => {
  const data = await getOverview();
  res.json({ success: true, data });
});

router.get('/distribution', async (_req, res) => {
  const data = await getDistribution();
  res.json({ success: true, data });
});

router.get('/by-subject', async (_req, res) => {
  const data = await getBySubject();
  res.json({ success: true, data });
});

router.get('/top-by-khoi', async (_req, res) => {
  const data = await getTopByKhoi();
  res.json({ success: true, data });
});

router.get('/top-by-lop', async (_req, res) => {
  const data = await getTopByLop();
  res.json({ success: true, data });
});

router.get('/top-by-phong', async (_req, res) => {
  const data = await getTopByPhong();
  res.json({ success: true, data });
});

router.get('/khoi-definitions', async (_req, res) => {
  const data = getKhoiDefinitions();
  res.json({ success: true, data });
});

export default router;
