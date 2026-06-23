export interface ScoreData {
  toan: number | null;
  van: number | null;
  ngoaiNgu: number | null;
  vatLy: number | null;
  hoaHoc: number | null;
  sinhHoc: number | null;
  lichSu: number | null;
  diaLy: number | null;
  gdktPl: number | null;
  tinHoc: number | null;
  gdcd: number | null;
  cnCongNghiep: number | null;
  cnNongNghiep: number | null;
}

export interface Student {
  sbd: string;
  hoTen: string;
  ngaySinh: string;
  gioiTinh: string;
  lop: string;
  phongThi: number;
  monTuChon: string[];
  scores: ScoreData | null;
  tongDiem: number | null;
  rank: number | null;
}

export interface StatsOverview {
  totalStudents: number;
  totalCrawled: number;
  averageScore: number;
  highestScore: number;
  medianScore: number;
  topStudent: Student | null;
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
  topStudent: Student | null;
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

export const SUBJECT_KEYS = Object.keys(SUBJECT_LABELS) as (keyof ScoreData)[];
