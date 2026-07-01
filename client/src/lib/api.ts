const API_BASE = '/api';

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API Error: ${res.status}`);
  return res.json();
}

export const api = {
  students: {
    list: (params: Record<string, string> = {}) => {
      const qs = new URLSearchParams(params).toString();
      return fetchJson<import('./types').ApiResponse<import('./types').Student[]>>(
        `${API_BASE}/students${qs ? `?${qs}` : ''}`,
      );
    },
    get: (sbd: string) =>
      fetchJson<import('./types').ApiResponse<import('./types').Student>>(
        `${API_BASE}/students/${sbd}`,
      ),
  },
  stats: {
    overview: (params: Record<string, string> = {}) => {
      const qs = new URLSearchParams(params).toString();
      return fetchJson<import('./types').ApiResponse<import('./types').StatsOverview>>(
        `${API_BASE}/stats/overview${qs ? `?${qs}` : ''}`,
      );
    },
    distribution: (params: Record<string, string> = {}) => {
      const qs = new URLSearchParams(params).toString();
      return fetchJson<import('./types').ApiResponse<import('./types').ScoreDistribution[]>>(
        `${API_BASE}/stats/distribution${qs ? `?${qs}` : ''}`,
      );
    },
    bySubject: (params: Record<string, string> = {}) => {
      const qs = new URLSearchParams(params).toString();
      return fetchJson<import('./types').ApiResponse<import('./types').SubjectStats[]>>(
        `${API_BASE}/stats/by-subject${qs ? `?${qs}` : ''}`,
      );
    },
    subjectDetails: (subjectCode: string, params: Record<string, string> = {}) => {
      const qs = new URLSearchParams(params).toString();
      return fetchJson<import('./types').ApiResponse<import('./types').SubjectDetailResponse>>(
        `${API_BASE}/stats/subject/${subjectCode}${qs ? `?${qs}` : ''}`,
      );
    },
    topByKhoi: () =>
      fetchJson<import('./types').ApiResponse<import('./types').TopByKhoi[]>>(
        `${API_BASE}/stats/top-by-khoi`,
      ),
    topByLop: () =>
      fetchJson<import('./types').ApiResponse<import('./types').RankingEntry[]>>(
        `${API_BASE}/stats/top-by-lop`,
      ),
    topByPhong: () =>
      fetchJson<import('./types').ApiResponse<import('./types').RankingEntry[]>>(
        `${API_BASE}/stats/top-by-phong`,
      ),
    khoiDefinitions: () =>
      fetchJson<import('./types').ApiResponse<import('./types').KhoiDefinition[]>>(
        `${API_BASE}/stats/khoi-definitions`,
      ),
    leaderboardByKhoi: (params: Record<string, string> = {}) => {
      const qs = new URLSearchParams(params).toString();
      return fetchJson<import('./types').ApiResponse<import('./types').LeaderboardEntry[]>>(
        `${API_BASE}/stats/leaderboard-by-khoi${qs ? `?${qs}` : ''}`,
      );
    },
    leaderboardByLop: (params: Record<string, string> = {}) => {
      const qs = new URLSearchParams(params).toString();
      return fetchJson<import('./types').ApiResponse<import('./types').LeaderboardEntry[]>>(
        `${API_BASE}/stats/leaderboard-by-lop${qs ? `?${qs}` : ''}`,
      );
    },
    leaderboardByPhong: (params: Record<string, string> = {}) => {
      const qs = new URLSearchParams(params).toString();
      return fetchJson<import('./types').ApiResponse<import('./types').LeaderboardEntry[]>>(
        `${API_BASE}/stats/leaderboard-by-phong${qs ? `?${qs}` : ''}`,
      );
    },
    crawlStatus: () =>
      fetchJson<import('./types').ApiResponse<import('./types').CrawlStatus>>(
        `${API_BASE}/stats/crawl-status`,
      ),
  },
  lookup: (sbd: string) =>
    fetchJson<{ success: boolean; source?: string; data?: import('./types').Student; error?: string }>(
      `${API_BASE}/lookup/${sbd}`,
    ),
};

