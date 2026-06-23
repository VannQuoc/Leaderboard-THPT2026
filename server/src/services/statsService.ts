import { getStudentsWithScores } from '../db/jsonDb.js';
import type { StudentWithScore, StatsOverview, ScoreDistribution, SubjectStats, TopByKhoi, ScoreData } from '../types.js';
import { SUBJECT_LABELS, KHOI_DEFINITIONS } from '../types.js';

function calcKhoiScore(scores: ScoreData, subjects: (keyof ScoreData)[]): number | null {
  const values = subjects.map((s) => scores[s]);
  if (values.some((v) => v === null || v === undefined || v < 0)) return null;
  return Math.round((values as number[]).reduce((a, b) => a + b, 0) * 100) / 100;
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

  return KHOI_DEFINITIONS.map((khoi) => {
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
  }).filter((r) => r.studentCount > 0);
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
