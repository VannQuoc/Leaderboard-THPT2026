import { readFileSync } from 'node:fs';
import path from 'node:path';
import { getStudentsWithScores } from '../db/jsonDb.js';
import { config } from '../config.js';
import type { StudentWithScore, StatsOverview, ScoreDistribution, SubjectStats, TopByKhoi, RankingEntry, KhoiDefinition, KhoiJsonFile, ScoreData, LeaderboardEntry } from '../types.js';
import { SUBJECT_LABELS } from '../types.js';

// Load khối definitions from JSON (cached)
let _khoiCache: KhoiDefinition[] | null = null;
function loadKhoiDefinitions(): KhoiDefinition[] {
  if (_khoiCache) return _khoiCache;
  const filePath = path.join(config.dataDir, 'khoi.json');
  const raw: KhoiJsonFile = JSON.parse(readFileSync(filePath, 'utf-8'));
  _khoiCache = raw.blocks;
  return _khoiCache;
}

function calcKhoiScore(scores: ScoreData, subjects: string[]): number | null {
  const values = subjects.map((s) => (scores as Record<string, number | null>)[s]);
  if (values.some((v) => v === null || v === undefined)) return null;
  return Math.round((values as number[]).reduce((a, b) => a + b, 0) * 100) / 100;
}

function findTop(students: StudentWithScore[], scoreFn: (s: StudentWithScore) => number | null): { topStudent: StudentWithScore | null; topScore: number } {
  let topStudent: StudentWithScore | null = null;
  let topScore = -1;
  for (const s of students) {
    const score = scoreFn(s);
    if (score !== null && score > topScore) {
      topScore = score;
      topStudent = s;
    }
  }
  return { topStudent, topScore: Math.max(0, topScore) };
}

export async function getOverview(): Promise<StatsOverview> {
  const students = await getStudentsWithScores();
  const withScores = students.filter((s) => s.tongDiem !== null);

  const scores = withScores.map((s) => s.tongDiem!).sort((a, b) => a - b);
  const topStudent = withScores.length > 0 ? withScores.reduce((a, b) => (a.tongDiem! > b.tongDiem! ? a : b)) : null;

  const median = scores.length > 0
    ? scores.length % 2 === 0
      ? Math.round(((scores[scores.length / 2 - 1] + scores[scores.length / 2]) / 2) * 100) / 100
      : scores[Math.floor(scores.length / 2)]
    : 0;

  return {
    totalStudents: students.length,
    totalCrawled: withScores.length,
    averageScore: scores.length > 0 ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100 : 0,
    highestScore: scores.length > 0 ? Math.max(...scores) : 0,
    medianScore: median,
    topStudent,
    lastUpdated: null,
  };
}

export async function getTopByKhoi(): Promise<TopByKhoi[]> {
  const students = await getStudentsWithScores();
  const withScores = students.filter((s) => s.scores !== null);
  const khoiDefs = loadKhoiDefinitions();

  return khoiDefs
    .map((khoi) => {
      let topStudent: StudentWithScore | null = null;
      let topScore = 0;
      let count = 0;

      for (const student of withScores) {
        const score = calcKhoiScore(student.scores!, khoi.subjects);
        if (score === null) continue;
        count++;
        if (score > topScore) {
          topScore = score;
          topStudent = student;
        }
      }

      return { khoi, topStudent, topScore, studentCount: count };
    })
    .filter((r) => r.studentCount > 0);
}

export async function getTopByLop(): Promise<RankingEntry[]> {
  const students = await getStudentsWithScores();
  const withScores = students.filter((s) => s.tongDiem !== null);

  const groups = new Map<string, StudentWithScore[]>();
  for (const s of withScores) {
    const arr = groups.get(s.lop) ?? [];
    arr.push(s);
    groups.set(s.lop, arr);
  }

  return [...groups.entries()]
    .map(([label, members]) => {
      const { topStudent, topScore } = findTop(members, (s) => s.tongDiem);
      return { label, topStudent, topScore, studentCount: members.length };
    })
    .sort((a, b) => a.label.localeCompare(b.label, 'vi'));
}

export async function getTopByPhong(): Promise<RankingEntry[]> {
  const students = await getStudentsWithScores();
  const withScores = students.filter((s) => s.tongDiem !== null);

  const groups = new Map<number, StudentWithScore[]>();
  for (const s of withScores) {
    const arr = groups.get(s.phongThi) ?? [];
    arr.push(s);
    groups.set(s.phongThi, arr);
  }

  return [...groups.entries()]
    .map(([phong, members]) => {
      const { topStudent, topScore } = findTop(members, (s) => s.tongDiem);
      return { label: `Phòng ${phong}`, topStudent, topScore, studentCount: members.length };
    })
    .sort((a, b) => a.label.localeCompare(b.label));
}

export async function getDistribution(): Promise<ScoreDistribution[]> {
  const students = await getStudentsWithScores();
  const withScores = students.filter((s) => s.tongDiem !== null);

  const ranges = [
    { label: '< 10', min: 0, max: 10 },
    { label: '10-14', min: 10, max: 15 },
    { label: '15-19', min: 15, max: 20 },
    { label: '20-24', min: 20, max: 25 },
    { label: '25-29', min: 25, max: 30 },
    { label: '30-34', min: 30, max: 35 },
    { label: '35+', min: 35, max: Infinity },
  ];

  return ranges.map((r) => ({
    range: r.label,
    count: withScores.filter((s) => s.tongDiem! >= r.min && s.tongDiem! < r.max).length,
  }));
}

export async function getBySubject(): Promise<SubjectStats[]> {
  const students = await getStudentsWithScores();
  const subjectKeys = Object.keys(SUBJECT_LABELS) as (keyof typeof SUBJECT_LABELS)[];

  return subjectKeys
    .map((key) => {
      const validScores = students
        .filter((s) => s.scores && s.scores[key as keyof typeof s.scores] !== null)
        .map((s) => s.scores![key as keyof typeof s.scores] as number);

      if (validScores.length === 0) return null;

      return {
        subject: key,
        subjectLabel: SUBJECT_LABELS[key],
        average: Math.round((validScores.reduce((a, b) => a + b, 0) / validScores.length) * 100) / 100,
        highest: Math.max(...validScores),
        lowest: Math.min(...validScores),
        count: validScores.length,
      };
    })
    .filter((s): s is SubjectStats => s !== null);
}

export function getKhoiDefinitions(): KhoiDefinition[] {
  return loadKhoiDefinitions();
}

// --- Leaderboard by khối/lớp/phòng ---

function buildLeaderboard(
  students: StudentWithScore[],
  khoi: KhoiDefinition,
): LeaderboardEntry[] {
  const entries: LeaderboardEntry[] = [];

  for (const student of students) {
    if (!student.scores) continue;
    const khoiScore = calcKhoiScore(student.scores, khoi.subjects);
    if (khoiScore === null) continue;

    const subjectScores: Record<string, number> = {};
    for (const subj of khoi.subjects) {
      const val = (student.scores as Record<string, number | null>)[subj];
      if (val !== null && val !== undefined) subjectScores[subj] = val;
    }

    entries.push({ rank: 0, student, khoiScore, subjectScores });
  }

  entries.sort((a, b) => b.khoiScore - a.khoiScore);
  entries.forEach((e, i) => { e.rank = i + 1; });

  return entries;
}

export async function getLeaderboardByKhoi(khoiCode: string): Promise<LeaderboardEntry[]> {
  const khoi = loadKhoiDefinitions().find((k) => k.code === khoiCode);
  if (!khoi) return [];

  const students = await getStudentsWithScores();
  return buildLeaderboard(students, khoi);
}

export async function getLeaderboardByLop(lop: string, khoiCode: string): Promise<LeaderboardEntry[]> {
  const khoi = loadKhoiDefinitions().find((k) => k.code === khoiCode);
  if (!khoi) return [];

  const students = await getStudentsWithScores();
  const filtered = students.filter((s) => s.lop === lop);
  return buildLeaderboard(filtered, khoi);
}

export async function getLeaderboardByPhong(phong: number, khoiCode: string): Promise<LeaderboardEntry[]> {
  const khoi = loadKhoiDefinitions().find((k) => k.code === khoiCode);
  if (!khoi) return [];

  const students = await getStudentsWithScores();
  const filtered = students.filter((s) => s.phongThi === phong);
  return buildLeaderboard(filtered, khoi);
}

