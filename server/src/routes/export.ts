import { Router } from 'express';
import * as xlsx from 'xlsx';
import { getStudentsWithScores } from '../db/jsonDb.js';
import { getKhoiDefinitions } from '../services/statsService.js';
import { SUBJECT_LABELS, type ScoreData } from '../types.js';

const router = Router();

router.get('/excel', async (req, res) => {
  try {
    const students = await getStudentsWithScores();
    const khoiDefs = getKhoiDefinitions();

    const data = students.map((s) => {
      // Find highest khoi
      let bestKhoi = '';
      let bestScore = -1;

      if (s.scores) {
        for (const k of khoiDefs) {
          const values = k.subjects.map((subj) => (s.scores as Record<string, number | null>)[subj]);
          if (values.every((v) => v !== null && v !== undefined)) {
            const score = values.reduce((a, b) => (a as number) + (b as number), 0) as number;
            if (score > bestScore) {
              bestScore = score;
              bestKhoi = k.code;
            }
          }
        }
      }

      const row: any = {
        'SBD': s.sbd,
        'Họ Tên': s.hoTen,
        'Lớp': s.lop,
        'Phòng': s.phongThi,
      };

      // Add all subjects
      for (const [key, label] of Object.entries(SUBJECT_LABELS)) {
        row[label] = s.scores && s.scores[key as keyof ScoreData] !== null ? s.scores[key as keyof ScoreData] : '';
      }

      row['Tổng Môn'] = s.tongDiem !== null ? s.tongDiem : '';
      row['Khối Điểm Cao Nhất'] = bestKhoi ? `${bestKhoi} (${Math.round(bestScore * 100) / 100})` : '';

      return row;
    });

    const ws = xlsx.utils.json_to_sheet(data);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, 'DiemThi');

    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename="DiemThi_2026.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (err) {
    console.error('Export Error:', err);
    res.status(500).json({ success: false, error: 'Failed to export' });
  }
});

export default router;
