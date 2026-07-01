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
  subjects: string[];
  color: string;
  group: string;
}

export interface TopByKhoi {
  khoi: KhoiDefinition;
  topStudent: Student | null;
  topScore: number;
  studentCount: number;
}

export interface RankingEntry {
  label: string;
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

export interface LeaderboardEntry {
  rank: number;
  student: Student;
  khoiScore: number;
  subjectScores: Record<string, number>;
  bestKhoi?: string;
}

export interface SubjectDetailResponse {
  subject: string;
  subjectLabel: string;
  distribution: ScoreDistribution[];
  leaderboard: LeaderboardEntry[];
}

export interface CrawlStatus {
  running: boolean;
  round: number;
  crawled: number;
  failed: number;
  total: number;
  remaining: number;
  startedAt: string | null;
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
