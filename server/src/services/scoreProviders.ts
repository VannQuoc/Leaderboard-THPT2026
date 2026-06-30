import { config } from '../config.js';
import { API_FIELD_MAP } from '../types.js';
import type { ScoreData } from '../types.js';

// --- Provider Interface ---

export interface ScoreProvider {
  name: string;
  fetchScore(sbd: string): Promise<ScoreData | null>;
  isAvailable(): Promise<boolean>;
}

// --- TuoiTre Provider (Primary) ---

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

// --- Fallback Provider (placeholder for future API + captcha) ---

export class FallbackProvider implements ScoreProvider {
  name = 'Fallback';

  async fetchScore(_sbd: string): Promise<ScoreData | null> {
    // TODO: Implement when fallback API is available
    // This provider may require captcha solving:
    //   1. Fetch captcha image from API
    //   2. Send to captcha-solving service
    //   3. Submit with solved captcha
    return null;
  }

  async isAvailable(): Promise<boolean> {
    // Not yet available
    return false;
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
          if (result) return result;
          // null = no data available (not an error), move to next provider
          break;
        } catch {
          const waitMs = Math.min(1000 * Math.pow(2, attempt), 8000);
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

// Singleton instance
export const providerManager = new ScoreProviderManager([
  new TuoiTreProvider(),
  new FallbackProvider(),
]);
