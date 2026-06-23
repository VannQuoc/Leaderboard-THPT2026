import { z } from 'zod';

export const StudentSchema = z.object({
  sbd: z.string(),
  hoTen: z.string(),
  ngaySinh: z.string(),
  gioiTinh: z.string(),
  lop: z.string(),
  phongThi: z.number(),
  monTuChon: z.array(z.string()),
});

export const ScoreDataSchema = z.object({
  toan: z.number().nullable(),
  van: z.number().nullable(),
  ngoaiNgu: z.number().nullable(),
  vatLy: z.number().nullable(),
  hoaHoc: z.number().nullable(),
  sinhHoc: z.number().nullable(),
  lichSu: z.number().nullable(),
  diaLy: z.number().nullable(),
  gdktPl: z.number().nullable(),
  tinHoc: z.number().nullable(),
  gdcd: z.number().nullable(),
  cnCongNghiep: z.number().nullable(),
  cnNongNghiep: z.number().nullable(),
});

export const StudentWithScoreSchema = StudentSchema.extend({
  scores: ScoreDataSchema.nullable(),
  tongDiem: z.number().nullable(),
  rank: z.number().nullable(),
});

export type Student = z.infer<typeof StudentSchema>;
export type ScoreData = z.infer<typeof ScoreDataSchema>;
export type StudentWithScore = z.infer<typeof StudentWithScoreSchema>;

// --- Khoi (loaded from JSON) ---
export interface KhoiDefinition {
  code: string;
  name: string;
  subjects: string[];
  color: string;
  group: string;
}

export interface KhoiJsonFile {
  version: string;
  description: string;
  blocks: KhoiDefinition[];
}

// --- Stats ---
export interface StatsOverview {
  totalStudents: number;
  totalCrawled: number;
  averageScore: number;
  highestScore: number;
  medianScore: number;
  topStudent: StudentWithScore | null;
  lastUpdated: string | null;
}

export interface TopByKhoi {
  khoi: KhoiDefinition;
  topStudent: StudentWithScore | null;
  topScore: number;
  studentCount: number;
}

export interface RankingEntry {
  label: string;
  topStudent: StudentWithScore | null;
  topScore: number;
  studentCount: number;
}

export interface ScoreDistribution {
  range: string;
  count: number;
}

export interface SubjectStats {
  subject: string;
  subjectLabel: string;
  average: number;
  highest: number;
  lowest: number;
  count: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const SUBJECT_LABELS: Record<string, string> = {
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

export const API_FIELD_MAP: Record<string, keyof ScoreData> = {
  TOAN: 'toan',
  VAN: 'van',
  NGOAI_NGU: 'ngoaiNgu',
  LI: 'vatLy',
  HOA: 'hoaHoc',
  SINH: 'sinhHoc',
  SU: 'lichSu',
  DIA: 'diaLy',
  GDKT_PL: 'gdktPl',
  TIN_HOC: 'tinHoc',
  GIAO_DUC_CONG_DAN: 'gdcd',
  CN_CONG_NGHIEP: 'cnCongNghiep',
  CN_NONG_NGHIEP: 'cnNongNghiep',
};
