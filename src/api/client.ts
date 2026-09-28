const BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api/v1';
const ACCESS_KEY = 'ai_access';
const REFRESH_KEY = 'ai_refresh';

export function getAccessToken(): string | null {
  try { return localStorage.getItem(ACCESS_KEY); } catch { return null; }
}

function getRefreshToken(): string | null {
  try { return localStorage.getItem(REFRESH_KEY); } catch { return null; }
}

export function setTokens(access: string, refresh: string): void {
  try {
    localStorage.setItem(ACCESS_KEY, access);
    localStorage.setItem(REFRESH_KEY, refresh);
  } catch { /* SSR / worker */ }
}

export function clearTokens(): void {
  try {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  } catch { /* SSR */ }
}

/** A non-2xx response; `message` is the backend's `error` field. */
export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Text safe to show a user for a failed request. 4xx errors carry messages the
 * backend wrote for users (validation, duplicates); 5xx bodies can carry raw
 * server/database errors, so those — and network failures — get `fallback`.
 * The original error is still logged for debugging.
 */
export function userFacingError(e: unknown, fallback: string): string {
  if (e instanceof ApiError && e.status < 500) return e.message || fallback;
  if (e instanceof Error && !(e instanceof ApiError) && !(e instanceof TypeError)) return e.message || fallback;
  console.error(e);
  return fallback;
}

// Shared promise while a refresh is in flight — all concurrent 401s share it.
let refreshing: Promise<string> | null = null;

async function refreshTokens(): Promise<string> {
  const rt = getRefreshToken();
  if (!rt) throw new Error('Session expired — please sign in again');

  const res = await fetch(`${BASE}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: rt }),
  });

  if (!res.ok) {
    clearTokens();
    throw new Error('Session expired — please sign in again');
  }

  const json = await res.json() as { data: { accessToken: string; refreshToken: string } };
  setTokens(json.data.accessToken, json.data.refreshToken);
  return json.data.accessToken;
}

async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const hdrs: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string> ?? {}),
  };

  const at = getAccessToken();
  if (at) hdrs['Authorization'] = `Bearer ${at}`;

  let res = await fetch(`${BASE}${path}`, { ...init, headers: hdrs });

  if (res.status === 401 && getRefreshToken()) {
    if (!refreshing) {
      refreshing = refreshTokens().finally(() => { refreshing = null; });
    }
    const newToken = await refreshing;
    hdrs['Authorization'] = `Bearer ${newToken}`;
    res = await fetch(`${BASE}${path}`, { ...init, headers: hdrs });
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string };
    throw new ApiError(body.error ?? `HTTP ${res.status}`, res.status);
  }

  if (res.status === 204) return undefined as T;
  const json = await res.json() as { data: T };
  return json.data;
}

export const api = {
  get<T>(path: string): Promise<T> {
    return apiFetch<T>(path);
  },
  post<T>(path: string, body: unknown): Promise<T> {
    return apiFetch<T>(path, { method: 'POST', body: JSON.stringify(body) });
  },
  patch<T = void>(path: string, body: unknown): Promise<T> {
    return apiFetch<T>(path, { method: 'PATCH', body: JSON.stringify(body) });
  },
  del<T = void>(path: string): Promise<T> {
    return apiFetch<T>(path, { method: 'DELETE' });
  },
};
