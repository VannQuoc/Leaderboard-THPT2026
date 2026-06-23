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
    overview: () =>
      fetchJson<import('./types').ApiResponse<import('./types').StatsOverview>>(
        `${API_BASE}/stats/overview`,
      ),
    distribution: () =>
      fetchJson<import('./types').ApiResponse<import('./types').ScoreDistribution[]>>(
        `${API_BASE}/stats/distribution`,
      ),
    bySubject: () =>
      fetchJson<import('./types').ApiResponse<import('./types').SubjectStats[]>>(
        `${API_BASE}/stats/by-subject`,
      ),
    topByKhoi: () =>
      fetchJson<import('./types').ApiResponse<import('./types').TopByKhoi[]>>(
        `${API_BASE}/stats/top-by-khoi`,
      ),
  },
};
