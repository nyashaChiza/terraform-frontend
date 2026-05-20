import { authStore } from '../store/auth';

// Base URL for backend APIs.
// - Local dev:  set EXPO_PUBLIC_API_URL in .env.local  (gitignored)
// - EAS builds: falls back to the production URL below (set in .env)
// Trailing slash is stripped so `${BASE_URL}/path` never produces a double-slash.
export const BASE_URL = (
  process.env.EXPO_PUBLIC_API_URL ?? 'https://terraform-backend.vercel.app'
).replace(/\/+$/, '');

function buildUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  const base = BASE_URL.replace(/\/$/, '');
  return url.startsWith('/') ? base + url : base + '/' + url;
}

/** Synchronous auth header builder — safe to call anywhere without await. */
export function buildAuthHeader(): Record<string, string> {
  const { token, token_type } = authStore.get();
  if (!token) return {};
  const prefix = token_type ?? 'Bearer';
  const headerValue = token.toLowerCase().startsWith('bearer ')
    ? token
    : `${prefix} ${token}`;
  return { Authorization: headerValue };
}

/** Attempt to refresh the access token using the stored refresh token.
 *  Returns true if a new access token was obtained. */
export async function tryRefreshToken(): Promise<boolean> {
  const { refresh_token } = authStore.get();
  if (!refresh_token) return false;

  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `refresh_token=${encodeURIComponent(refresh_token)}`,
    });

    if (!res.ok) return false;

    const data = await res.json();
    authStore.set({
      token: data.access_token,
      ...(data.refresh_token ? { refresh_token: data.refresh_token } : {}),
    });
    return true;
  } catch {
    return false;
  }
}

/** Unified fetch wrapper with automatic 401 → refresh → retry logic. */
export async function apiFetch<T = any>(
  url: string,
  opts: RequestInit = {},
): Promise<{ ok: boolean; status: number; body: T }> {
  const makeRequest = () => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...buildAuthHeader(),
      ...(opts.headers as Record<string, string> | undefined ?? {}),
    };
    return fetch(buildUrl(url), { ...opts, headers });
  };

  let res = await makeRequest();

  // On 401, try to refresh once then retry
  if (res.status === 401) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      res = await makeRequest();
    }
  }

  const text = await res.text();
  let body: T;
  try {
    body = JSON.parse(text) as T;
  } catch {
    body = text as unknown as T;
  }

  return { ok: res.ok, status: res.status, body };
}

// Legacy helpers kept for any remaining direct usages
export async function apiGet<T = any>(url: string, opts: RequestInit = {}) {
  return apiFetch<T>(url, { ...opts, method: opts.method ?? 'GET' });
}

export async function apiPost<T = any>(url: string, body?: any, opts: RequestInit = {}) {
  return apiFetch<T>(url, {
    ...opts,
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  });
}

const api = { get: apiGet, post: apiPost, fetch: apiFetch };
export default api;
