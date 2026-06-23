import path from 'node:path';
import { fileURLToPath } from 'node:url';
import XLSX from 'xlsx';
import { writeStudents } from '../db/jsonDb.js';
import { config } from '../config.js';
import type { Student } from '../types.js';

const __dirname2 = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname2, '../../..');
const EXCEL_PATH = path.join(PROJECT_ROOT, 'DS_PHONG_THI_SBD_CHINH_XAC.xlsx');

// Map Vietnamese subject names from Excel to our field keys
const SUBJECT_MAP: Record<string, string> = {
  'Sử': 'lichSu',
  'Địa': 'diaLy',
  'Anh': 'ngoaiNgu',
  'Lý': 'vatLy',
  'Hóa': 'hoaHoc',
  'Sinh': 'sinhHoc',
  'Tin': 'tinHoc',
  'GDCD': 'gdcd',
  'GDKT_PL': 'gdktPl',
};

function normalizeSubject(raw: string | null | undefined): string {
  if (!raw) return '';
  const trimmed = raw.toString().trim();
  return SUBJECT_MAP[trimmed] || trimmed;
}

async function importExcel(): Promise<void> {
  console.log(`📂 Reading Excel: ${EXCEL_PATH}`);

  const wb = XLSX.readFile(EXCEL_PATH);
  const ws = wb.Sheets['DS phòng thi gốc'];
  if (!ws) {
    console.error('❌ Sheet "DS phòng thi gốc" not found!');
    process.exit(1);
  }

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { header: 1 }) as unknown[][];

  // Skip header row (index 0)
  const students: Student[] = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || !row[2]) continue; // Skip empty rows (no SBD)

    const monTuChon: string[] = [];
    const mon1 = normalizeSubject(row[7] as string);
    const mon2 = normalizeSubject(row[8] as string);
    if (mon1) monTuChon.push(mon1);
    if (mon2) monTuChon.push(mon2);

    students.push({
      sbd: String(row[2]),
      hoTen: String(row[3] || ''),
      ngaySinh: String(row[4] || ''),
      gioiTinh: String(row[5] || ''),
      lop: String(row[6] || ''),
      phongThi: Number(row[1]) || 0,
      monTuChon,
    });
  }

  // Deduplicate by SBD (keep first occurrence)
  const uniqueMap = new Map<string, typeof students[0]>();
  for (const s of students) {
    if (!uniqueMap.has(s.sbd)) uniqueMap.set(s.sbd, s);
  }
  const uniqueStudents = [...uniqueMap.values()];

  await writeStudents({
    school: config.school,
    students: uniqueStudents,
  });

  console.log(`✅ Imported ${students.length} students to data/students.json`);
  console.log(`📊 Phòng thi: ${[...new Set(students.map((s) => s.phongThi))].sort().join(', ')}`);
  console.log(`📚 Lớp: ${[...new Set(students.map((s) => s.lop))].sort().join(', ')}`);
}

importExcel().catch(console.error);
