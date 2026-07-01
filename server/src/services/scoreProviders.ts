import http from 'node:http';
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
const ANTICAPTCHA_URL = 'https://anticaptcha.top/api/captcha';

async function solveCaptcha(imageBase64: string): Promise<string | null> {
  try {
    const res = await fetch(ANTICAPTCHA_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apikey: ANTICAPTCHA_KEY,
        img: imageBase64,
        type: 14, // Image to text autodetect
        casesensitive: 1, // preserve case
      }),
    });

    const json = await res.json() as {
      success: boolean;
      message: string;
      captcha: string;
    };

    if (json.success && json.captcha && json.captcha !== 'ERROR') {
      return json.captcha;
    }

    console.warn(`  ⚠️ Captcha solve failed: ${json.message}`);
    return null;
  } catch (err) {
    console.warn('  ⚠️ Captcha API error:', err);
    return null;
  }
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
  'Lịch Sử': 'lichSu',
  'Địa lí': 'diaLy',
  'Địa lý': 'diaLy',
  'GDKT&PL': 'gdktPl',
  'GDKTPL': 'gdktPl',
  'KTPL': 'gdktPl',
  'TI': 'tinHoc',
  'Tin học': 'tinHoc',
  'Tiếng Anh': 'ngoaiNgu',
  'Ngoại ngữ': 'ngoaiNgu',
  'Anh văn': 'ngoaiNgu',
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

function httpGet(url: string, headers: Record<string, string> = {}): Promise<{
  statusCode: number;
  headers: Record<string, string | string[] | undefined>;
  body: Buffer;
}> {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const req = http.request({
      hostname: urlObj.hostname,
      port: urlObj.port || 80,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: { 'User-Agent': HATINH_UA, ...headers },
    }, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (c: Buffer) => chunks.push(c));
      res.on('end', () => resolve({
        statusCode: res.statusCode || 0,
        headers: res.headers as Record<string, string | string[] | undefined>,
        body: Buffer.concat(chunks),
      }));
    });
    req.on('error', reject);
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('Timeout')); });
    req.end();
  });
}



function httpPost(url: string, body: string, headers: Record<string, string> = {}): Promise<{
  statusCode: number;
  headers: Record<string, string | string[] | undefined>;
  body: Buffer;
}> {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const reqHeaders = {
      'User-Agent': HATINH_UA,
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'Content-Length': Buffer.byteLength(body).toString(),
      ...headers,
    };
    const req = http.request({
      hostname: urlObj.hostname,
      port: urlObj.port || 80,
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: reqHeaders,
    }, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (c: Buffer) => chunks.push(c));
      res.on('end', () => resolve({
        statusCode: res.statusCode || 0,
        headers: res.headers as Record<string, string | string[] | undefined>,
        body: Buffer.concat(chunks),
      }));
    });
    req.on('error', reject);
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('Timeout')); });
    req.write(body);
    req.end();
  });
}

async function getSessionAndCaptcha(): Promise<{ sessionCookie: string; captchaText: string } | null> {
  try {
    // Send a fake session to captcha endpoint → server responds with real Set-Cookie
    // IMPORTANT: the captcha image is tied to THIS session, so we must use
    // the SAME session for both captcha solving and the search request.
    const fakeCookie = `ASP.NET_SessionId=fake${Date.now().toString(36)}`;
    const time = Date.now();

    const captchaRes = await httpGet(`${HATINH_BASE}/TraCuu/GetCaptcha?time=${time}&choose=1`, {
      'Cookie': fakeCookie,
      'Referer': `${HATINH_BASE}/`,
    });

    if (captchaRes.statusCode !== 200 || captchaRes.body.length < 100) {
      console.warn('  ⚠️ Captcha image failed:', captchaRes.statusCode, captchaRes.body.length);
      return null;
    }

    // Extract real session from response Set-Cookie header
    let sessionCookie = '';
    const rawCookies = captchaRes.headers['set-cookie'];
    const cookieArr = Array.isArray(rawCookies) ? rawCookies : rawCookies ? [rawCookies] : [];
    for (const c of cookieArr) {
      const match = c.match(/ASP\.NET_SessionId=([^;]+)/);
      if (match) { sessionCookie = `ASP.NET_SessionId=${match[1]}`; break; }
    }

    // If no Set-Cookie returned, use the fake cookie (server accepted it)
    if (!sessionCookie) sessionCookie = fakeCookie;

    const imageBase64 = captchaRes.body.toString('base64');

    // Solve captcha
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

    const body = `SOBAODANH=${sbd}&ConfirmCode=${encodeURIComponent(session.captchaText)}`;
    const res = await httpPost(`${HATINH_BASE}/TraCuu/TraCuu`, body, {
      'Cookie': session.sessionCookie,
      'Origin': HATINH_BASE,
      'Referer': `${HATINH_BASE}/`,
      'X-Requested-With': 'XMLHttpRequest',
    });

    if (res.statusCode !== 200) throw new Error(`HaTinh HTTP ${res.statusCode}`);

    const json = JSON.parse(res.body.toString()) as { DIEM_THI?: string };
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

// HaTinh only (TuoiTre returning wrong data)
export const providerManager = new ScoreProviderManager([
  new HaTinhProvider(),
  // new TuoiTreProvider(), // disabled: returning incorrect results
]);
