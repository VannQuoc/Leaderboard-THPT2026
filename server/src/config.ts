import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// server/src/config.ts → project root is 2 levels up (server/)
const SERVER_ROOT = path.resolve(__dirname, '..');
const PROJECT_ROOT = path.resolve(SERVER_ROOT, '..');

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  dataDir: path.join(SERVER_ROOT, 'data'),
  clientDir: path.join(PROJECT_ROOT, 'client', 'dist'),
  crawl: {
    primaryApi: 'https://s6.tuoitre.vn/api/diem-thi-thpt.htm',
    year: 2025,
    delayMs: 300,
    maxRetries: 3,
    headers: {
      origin: 'https://tuoitre.vn',
      referer: 'https://tuoitre.vn/',
    },
  },
  school: {
    name: 'Trường THPT Lý Tự Trọng',
    year: 2026,
  },
};
