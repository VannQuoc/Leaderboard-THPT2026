import { Router } from 'express';
import { getOverview, getDistribution, getBySubject, getTopByKhoi, getTopByLop, getTopByPhong, getKhoiDefinitions, getLeaderboardByKhoi, getLeaderboardByLop, getLeaderboardByPhong } from '../services/statsService.js';
import { getCrawlStatus } from '../services/crawlerService.js';

const router = Router();

router.get('/overview', async (req, res) => {
  const { lop, khoi } = req.query as Record<string, string>;
  const data = await getOverview({ lop, khoi });
  res.json({ success: true, data });
});

router.get('/distribution', async (req, res) => {
  const { lop, khoi } = req.query as Record<string, string>;
  const data = await getDistribution({ lop, khoi });
  res.json({ success: true, data });
});

router.get('/by-subject', async (req, res) => {
  const { lop, khoi } = req.query as Record<string, string>;
  const data = await getBySubject({ lop, khoi });
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

// --- Leaderboard APIs ---

router.get('/leaderboard-by-khoi', async (req, res) => {
  const { khoi, page = '1', limit = '30' } = req.query as Record<string, string>;
  if (!khoi) { res.status(400).json({ success: false, error: 'Missing khoi param' }); return; }

  const all = await getLeaderboardByKhoi(khoi);
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  const total = all.length;
  const paginated = all.slice((pageNum - 1) * limitNum, pageNum * limitNum);

  res.json({ success: true, data: paginated, meta: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) } });
});

router.get('/leaderboard-by-lop', async (req, res) => {
  const { lop, khoi, page = '1', limit = '30' } = req.query as Record<string, string>;
  if (!lop || !khoi) { res.status(400).json({ success: false, error: 'Missing lop or khoi param' }); return; }

  const all = await getLeaderboardByLop(lop, khoi);
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  const total = all.length;
  const paginated = all.slice((pageNum - 1) * limitNum, pageNum * limitNum);

  res.json({ success: true, data: paginated, meta: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) } });
});

router.get('/leaderboard-by-phong', async (req, res) => {
  const { phong, khoi, page = '1', limit = '30' } = req.query as Record<string, string>;
  if (!phong || !khoi) { res.status(400).json({ success: false, error: 'Missing phong or khoi param' }); return; }

  const all = await getLeaderboardByPhong(Number(phong), khoi);
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  const total = all.length;
  const paginated = all.slice((pageNum - 1) * limitNum, pageNum * limitNum);

  res.json({ success: true, data: paginated, meta: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) } });
});

router.get('/crawl-status', (_req, res) => {
  res.json({ success: true, data: getCrawlStatus() });
});

export default router;
