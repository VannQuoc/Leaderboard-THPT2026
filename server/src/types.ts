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

export interface StatsOverview {
  totalStudents: number;
  totalCrawled: number;
  averageScore: number;
  highestScore: number;
  medianScore: number;
  topStudent: StudentWithScore | null;
  lastUpdated: string | null;
}

export interface KhoiDefinition {
  code: string;
  name: string;
  subjects: (keyof ScoreData)[];
  color: string;
}

export interface TopByKhoi {
  khoi: KhoiDefinition;
  topStudent: StudentWithScore | null;
  topScore: number;
  studentCount: number;
}

export const KHOI_DEFINITIONS: KhoiDefinition[] = [
  { code: 'A00', name: 'Toán - Lý - Hóa', subjects: ['toan', 'vatLy', 'hoaHoc'], color: '#ef4444' },
  { code: 'A01', name: 'Toán - Lý - Anh', subjects: ['toan', 'vatLy', 'ngoaiNgu'], color: '#f97316' },
  { code: 'B00', name: 'Toán - Hóa - Sinh', subjects: ['toan', 'hoaHoc', 'sinhHoc'], color: '#22c55e' },
  { code: 'C00', name: 'Văn - Sử - Địa', subjects: ['van', 'lichSu', 'diaLy'], color: '#3b82f6' },
  { code: 'D01', name: 'Toán - Văn - Anh', subjects: ['toan', 'van', 'ngoaiNgu'], color: '#a855f7' },
  { code: 'D07', name: 'Toán - Hóa - Anh', subjects: ['toan', 'hoaHoc', 'ngoaiNgu'], color: '#ec4899' },
  { code: 'D08', name: 'Toán - Sinh - Anh', subjects: ['toan', 'sinhHoc', 'ngoaiNgu'], color: '#14b8a6' },
  { code: 'D10', name: 'Toán - Địa - Anh', subjects: ['toan', 'diaLy', 'ngoaiNgu'], color: '#06b6d4' },
];

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

// Map API field names to our schema
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
