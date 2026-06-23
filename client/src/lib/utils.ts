import type { ScoreData } from './types';

const SUBJECT_LABELS: Record<string, string> = {
  toan: 'Toán',
  van: 'Ngữ Văn',
  ngoaiNgu: 'Ngoại Ngữ',
  vatLy: 'Vật Lý',
  hoaHoc: 'Hóa Học',
  sinhHoc: 'Sinh Học',
  lichSu: 'Lịch Sử',
  diaLy: 'Địa Lý',
  gdktPl: 'GDKT&PL',
  tinHoc: 'Tin Học',
  gdcd: 'GDCD',
  cnCongNghiep: 'CN Công Nghiệp',
  cnNongNghiep: 'CN Nông Nghiệp',
};

export function formatScore(score: number | null | undefined): string {
  if (score === null || score === undefined) return '—';
  return score.toFixed(2);
}

export function getRankBadge(rank: number | null): { label: string; className: string } | null {
  if (rank === null) return null;
  if (rank === 1) return { label: '🥇 Thủ khoa', className: 'badge-gold' };
  if (rank === 2) return { label: '🥈 Á khoa', className: 'badge-silver' };
  if (rank === 3) return { label: '🥉 Hạng 3', className: 'badge-bronze' };
  return null;
}

export function getActiveSubjects(scores: ScoreData | null): { key: string; label: string; value: number }[] {
  if (!scores) return [];
  return Object.entries(scores)
    .filter(([, v]) => v !== null && v >= 0)
    .map(([key, value]) => ({
      key,
      label: SUBJECT_LABELS[key] || key,
      value: value as number,
    }));
}

export function getScoreColor(score: number): string {
  if (score >= 8) return 'text-emerald-400';
  if (score >= 6.5) return 'text-teal-400';
  if (score >= 5) return 'text-amber-400';
  if (score >= 3.5) return 'text-orange-400';
  return 'text-red-400';
}

export function getSubjectLabel(key: string): string {
  return SUBJECT_LABELS[key] || key;
}
