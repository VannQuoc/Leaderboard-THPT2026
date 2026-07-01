import { config } from '../config.js';
import { API_FIELD_MAP } from '../types.js';
import type { ScoreData } from '../types.js';

// --- Provider Interface ---

export interface ScoreProvider {
  name: string;
  fetchScore(sbd: string): Promise<ScoreData | null>;
  isAvailable(): Promise<boolean>;
}

// --- AntiCaptcha solver ---

const ANTICAPTCHA_KEY = '713350abe4798883ca27c52e080fb393';
const ANTICAPTCHA_CREATE = 'https://api.anticaptcha.top/createTask';
const ANTICAPTCHA_RESULT = 'https://api.anticaptcha.top/getTaskResult';

async function solveCaptcha(imageBase64: string): Promise<string | null> {
  // Create task
  const createRes = await fetch(ANTICAPTCHA_CREATE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      clientKey: ANTICAPTCHA_KEY,
      task: { type: 'ImageToTextTask', body: imageBase64 },
    }),
  });
  const createJson = await createRes.json() as { errorId: number; taskId?: number };
  if (createJson.errorId !== 0 || !createJson.taskId) return null;

  // Poll for result (max 30s)
  for (let i = 0; i < 10; i++) {
    await new Promise((r) => setTimeout(r, 3000));

    const resultRes = await fetch(ANTICAPTCHA_RESULT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientKey: ANTICAPTCHA_KEY, taskId: createJson.taskId }),
    });
    const resultJson = await resultRes.json() as {
      errorId: number;
      status: string;
      solution?: { text: string };
    };

    if (resultJson.status === 'ready' && resultJson.solution?.text) {
      return resultJson.solution.text;
    }
    if (resultJson.errorId !== 0) return null;
  }
  return null;
}

// --- HaTinh Provider (with captcha) ---

const HATINH_BASE = 'http://tracuudiemthi.hatinh.edu.vn';
const HATINH_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36';

// Map HaTinh DIEM_THI label → our ScoreData key
const HATINH_SUBJECT_MAP: Record<string, keyof ScoreData> = {
  'Toán': 'toan',
  'Ngữ văn': 'van',
  'Ngoại ngữ': 'ngoaiNgu',
  'Vật lí': 'vatLy',
  'Vật lý': 'vatLy',
  'Hóa học': 'hoaHoc',
  'Hoá học': 'hoaHoc',
  'Sinh học': 'sinhHoc',
  'Lịch sử': 'lichSu',
  'Địa lí': 'diaLy',
  'Địa lý': 'diaLy',
  'GDKT&PL': 'gdktPl',
  'GDKTPL': 'gdktPl',
  'TI': 'tinHoc',
  'Tin học': 'tinHoc',
  'GDCD': 'gdcd',
  'CN công nghiệp': 'cnCongNghiep',
  'CN nông nghiệp': 'cnNongNghiep',
};

function parseDiemThi(diemThiStr: string): ScoreData | null {
  if (!diemThiStr || diemThiStr.trim() === '') return null;

  const scores: Record<string, number | null> = {
    toan: null, van: null, ngoaiNgu: null, vatLy: null, hoaHoc: null,
    sinhHoc: null, lichSu: null, diaLy: null, gdktPl: null,
    tinHoc: null, gdcd: null, cnCongNghiep: null, cnNongNghiep: null,
  };

  // Format: "Toán:   7.75   Ngữ văn:   7.25   Vật lí:   8.75   TI:   9.75   "
  // Split by regex: find "SubjectName:  Score" pairs
  const regex = /([^:]+?):\s+([\d.]+)/g;
  let match;
  let found = false;

  while ((match = regex.exec(diemThiStr)) !== null) {
    const label = match[1].trim();
    const value = parseFloat(match[2]);

    if (isNaN(value)) continue;

    const key = HATINH_SUBJECT_MAP[label];
    if (key) {
      scores[key] = value;
      found = true;
    } else {
      console.warn(`  ⚠️ Unknown subject label from HaTinh: "${label}"`);
    }
  }

  return found ? (scores as unknown as ScoreData) : null;
}

async function getSessionAndCaptcha(): Promise<{ sessionCookie: string; captchaText: string } | null> {
  try {
    // Step 1: Get session cookie by visiting the page
    const pageRes = await fetch(HATINH_BASE, {
      headers: { 'User-Agent': HATINH_UA },
      redirect: 'manual',
    });
    const setCookies = pageRes.headers.getSetCookie?.() || [];
    let sessionCookie = '';
    for (const c of setCookies) {
      const match = c.match(/ASP\.NET_SessionId=([^;]+)/);
      if (match) { sessionCookie = `ASP.NET_SessionId=${match[1]}`; break; }
    }
    // If no set-cookie, try from raw headers
    if (!sessionCookie) {
      const raw = pageRes.headers.get('set-cookie') || '';
      const match = raw.match(/ASP\.NET_SessionId=([^;]+)/);
      if (match) sessionCookie = `ASP.NET_SessionId=${match[1]}`;
    }
    if (!sessionCookie) {
      console.warn('  ⚠️ No session cookie from HaTinh');
      return null;
    }

    // Step 2: Get captcha image
    const time = Date.now();
    const captchaRes = await fetch(`${HATINH_BASE}/TraCuu/GetCaptcha?time=${time}&choose=1`, {
      headers: {
        'User-Agent': HATINH_UA,
        'Cookie': sessionCookie,
        'Referer': `${HATINH_BASE}/`,
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      },
    });
    if (!captchaRes.ok) return null;

    const imageBuffer = Buffer.from(await captchaRes.arrayBuffer());
    const imageBase64 = imageBuffer.toString('base64');

    // Step 3: Solve captcha
    const captchaText = await solveCaptcha(imageBase64);
    if (!captchaText) {
      console.warn('  ⚠️ Captcha solving failed');
      return null;
    }

    return { sessionCookie, captchaText };
  } catch (err) {
    console.warn('  ⚠️ HaTinh session/captcha error:', err);
    return null;
  }
}

export class HaTinhProvider implements ScoreProvider {
  name = 'HaTinh';

  async fetchScore(sbd: string): Promise<ScoreData | null> {
    const session = await getSessionAndCaptcha();
    if (!session) return null;

    const res = await fetch(`${HATINH_BASE}/TraCuu/TraCuu`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'User-Agent': HATINH_UA,
        'Cookie': session.sessionCookie,
        'Origin': HATINH_BASE,
        'Referer': `${HATINH_BASE}/`,
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: `SOBAODANH=${sbd}&ConfirmCode=${encodeURIComponent(session.captchaText)}`,
    });

    if (!res.ok) throw new Error(`HaTinh HTTP ${res.status}`);

    const json = await res.json() as { DIEM_THI?: string };
    if (!json.DIEM_THI || json.DIEM_THI.trim() === '') return null;

    return parseDiemThi(json.DIEM_THI);
  }

  async isAvailable(): Promise<boolean> {
    try {
      const res = await fetch(HATINH_BASE, {
        method: 'HEAD',
        headers: { 'User-Agent': HATINH_UA },
        signal: AbortSignal.timeout(5000),
      });
      return res.ok || res.status === 302;
    } catch {
      return false;
    }
  }
}

// --- TuoiTre Provider ---

function parseApiResponse(apiData: Record<string, unknown>): ScoreData {
  const scores: Record<string, number | null> = {};
  for (const [apiKey, schemaKey] of Object.entries(API_FIELD_MAP)) {
    const val = apiData[apiKey];
    scores[schemaKey] = typeof val === 'number' && val >= 0 ? val : null;
  }
  return scores as unknown as ScoreData;
}

export class TuoiTreProvider implements ScoreProvider {
  name = 'TuoiTre';

  async fetchScore(sbd: string): Promise<ScoreData | null> {
    const { primaryApi, year, headers } = config.crawl;
    const url = `${primaryApi}?sbd=${sbd}&year=${year}`;

    const res = await fetch(url, { headers, signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const json = await res.json() as { success: boolean; data: Record<string, unknown>[] };
    if (json.success && json.data?.length > 0) {
      return parseApiResponse(json.data[0]);
    }
    return null;
  }

  async isAvailable(): Promise<boolean> {
    try {
      const res = await fetch(config.crawl.primaryApi, {
        method: 'HEAD',
        headers: config.crawl.headers,
        signal: AbortSignal.timeout(5000),
      });
      return res.ok;
    } catch {
      return false;
    }
  }
}

// --- Provider Manager ---

export class ScoreProviderManager {
  private providers: ScoreProvider[];

  constructor(providers: ScoreProvider[]) {
    this.providers = providers;
  }

  async fetchScore(sbd: string, maxRetries = 3): Promise<ScoreData | null> {
    for (const provider of this.providers) {
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          const result = await provider.fetchScore(sbd);
          if (result) {
            console.log(`  ✅ [${provider.name}] Got score for ${sbd}`);
            return result;
          }
          break; // null = no data, move to next provider
        } catch (err) {
          const waitMs = Math.min(1000 * Math.pow(2, attempt), 8000);
          console.warn(`  ⚠️ [${provider.name}] Attempt ${attempt + 1}/${maxRetries} failed for ${sbd}. Retrying in ${waitMs}ms...`);
          await new Promise((r) => setTimeout(r, waitMs));
        }
      }
    }
    return null;
  }

  async findAvailableProvider(): Promise<ScoreProvider | null> {
    for (const provider of this.providers) {
      if (await provider.isAvailable()) return provider;
    }
    return null;
  }
}

// HaTinh is primary now (TuoiTre not responding)
export const providerManager = new ScoreProviderManager([
  new HaTinhProvider(),
  new TuoiTreProvider(),
]);
