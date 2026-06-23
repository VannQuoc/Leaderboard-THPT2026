import fs from 'node:fs/promises';
import path from 'node:path';
import { config } from '../config.js';
import type { Student, StudentWithScore } from '../types.js';

interface DbData {
  school: { name: string; year: number };
  students: Student[];
}

interface ScoresData {
  lastUpdated: string | null;
  crawlStatus: 'pending' | 'in_progress' | 'completed' | 'partial';
  totalCrawled: number;
  totalFailed: number;
  results: StudentWithScore[];
}

const studentsPath = path.join(config.dataDir, 'students.json');
const scoresPath = path.join(config.dataDir, 'scores.json');

async function ensureDataDir(): Promise<void> {
  await fs.mkdir(config.dataDir, { recursive: true });
}

export async function readStudents(): Promise<DbData> {
  await ensureDataDir();
  try {
    const raw = await fs.readFile(studentsPath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return { school: config.school, students: [] };
  }
}

export async function writeStudents(data: DbData): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(studentsPath, JSON.stringify(data, null, 2), 'utf-8');
}

export async function readScores(): Promise<ScoresData> {
  await ensureDataDir();
  try {
    const raw = await fs.readFile(scoresPath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return {
      lastUpdated: null,
      crawlStatus: 'pending',
      totalCrawled: 0,
      totalFailed: 0,
      results: [],
    };
  }
}

export async function writeScores(data: ScoresData): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(scoresPath, JSON.stringify(data, null, 2), 'utf-8');
}

export async function getStudentsWithScores(): Promise<StudentWithScore[]> {
  const scoresData = await readScores();
  if (scoresData.results.length > 0) return scoresData.results;

  const studentsData = await readStudents();
  return studentsData.students.map((s) => ({
    ...s,
    scores: null,
    tongDiem: null,
    rank: null,
  }));
}
