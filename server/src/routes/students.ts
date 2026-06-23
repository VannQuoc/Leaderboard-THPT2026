import { Router } from 'express';
import { getStudentsWithScores } from '../db/jsonDb.js';

const router = Router();

router.get('/', async (req, res) => {
  const students = await getStudentsWithScores();
  const {
    page = '1',
    limit = '50',
    sort = 'rank',
    order = 'asc',
    khoi,
    phong,
    lop,
    search,
  } = req.query as Record<string, string>;

  let filtered = [...students];

  // Filter by khối dự thi (môn tự chọn)
  if (khoi) {
    filtered = filtered.filter((s) => s.monTuChon.some((m) => m.toLowerCase().includes(khoi.toLowerCase())));
  }

  // Filter by phòng thi
  if (phong) {
    filtered = filtered.filter((s) => s.phongThi === Number(phong));
  }

  // Filter by lớp
  if (lop) {
    filtered = filtered.filter((s) => s.lop === lop);
  }

  // Search by SBD or name
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (s) => s.sbd.includes(q) || s.hoTen.toLowerCase().includes(q),
    );
  }

  // Sort
  const sortKey = sort as string;
  const sortOrder = order === 'desc' ? -1 : 1;

  filtered.sort((a, b) => {
    let aVal: unknown, bVal: unknown;

    if (sortKey === 'tongDiem' || sortKey === 'rank') {
      aVal = a[sortKey] ?? (sortKey === 'rank' ? Infinity : -Infinity);
      bVal = b[sortKey] ?? (sortKey === 'rank' ? Infinity : -Infinity);
    } else if (sortKey === 'hoTen') {
      aVal = a.hoTen;
      bVal = b.hoTen;
    } else if (a.scores && b.scores && sortKey in a.scores) {
      aVal = (a.scores as Record<string, unknown>)[sortKey] ?? -1;
      bVal = (b.scores as Record<string, unknown>)[sortKey] ?? -1;
    } else {
      aVal = 0;
      bVal = 0;
    }

    if (typeof aVal === 'string') return aVal.localeCompare(bVal as string) * sortOrder;
    return ((aVal as number) - (bVal as number)) * sortOrder;
  });

  // Paginate
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  const total = filtered.length;
  const totalPages = Math.ceil(total / limitNum);
  const start = (pageNum - 1) * limitNum;
  const paginated = filtered.slice(start, start + limitNum);

  res.json({
    success: true,
    data: paginated,
    meta: { total, page: pageNum, limit: limitNum, totalPages },
  });
});

router.get('/:sbd', async (req, res) => {
  const students = await getStudentsWithScores();
  const student = students.find((s) => s.sbd === req.params.sbd);

  if (!student) {
    res.status(404).json({ success: false, error: 'Student not found' });
    return;
  }

  res.json({ success: true, data: student });
});

export default router;
