import { authStore } from '../store/auth';

// Base URL for backend APIs.
// - Local dev:  set EXPO_PUBLIC_API_URL in .env.local  (gitignored)
// - EAS builds: set EXPO_PUBLIC_API_URL in .env  (committed)
//
// If neither is set we DON'T silently hit production — that masks misconfigured
// builds. In __DEV__ we throw a loud error so the developer notices immediately;
// in production we fall back to the deployed URL as a last resort.
const _raw_api_url = process.env.EXPO_PUBLIC_API_URL;
if (!_raw_api_url && __DEV__) {
  // eslint-disable-next-line no-console
  console.error(
    '⚠️  EXPO_PUBLIC_API_URL is not set! ' +
    'Create a .env.local with EXPO_PUBLIC_API_URL=<your backend URL> ' +
    'and restart `npx expo start`.'
  );
}
export const BASE_URL = (
  _raw_api_url ?? 'https://terraform-backend.vercel.app'
).replace(/\/+$/, '');

// Default request timeout. React Native's fetch has NO default timeout — a
// network blip on the dev tunnel can leave a spinner up indefinitely. 25s is
// generous enough for slow backends but short enough to fail fast on real hangs.
// Long-running endpoints (e.g. AI generation) pass their own AbortController.
const DEFAULT_TIMEOUT_MS = 25_000;

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

// ── Singleton refresh: only ONE refresh request is in flight at any time. ────
// Without this, when N parallel requests get 401 they all call refresh
// simultaneously, each invalidating the previous token. The race produces
// random failures that only clear after restarting the app — exactly the
// symptom of "lag and loading that fixes after restarting several times".
let _refreshPromise: Promise<boolean> | null = null;

/** Attempt to refresh the access token using the stored refresh token.
 *  Concurrent callers share the same refresh request. */
export async function tryRefreshToken(): Promise<boolean> {
  // If a refresh is already in flight, wait for THAT one instead of starting a new one
  if (_refreshPromise) return _refreshPromise;

  _refreshPromise = (async () => {
    const { refresh_token } = authStore.get();
    if (!refresh_token) return false;

    try {
      // Refresh itself gets a short timeout — if it can't complete in 10s,
      // something is wrong and we should let the user re-login.
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 10_000);
      try {
        const res = await fetch(`${BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `refresh_token=${encodeURIComponent(refresh_token)}`,
          signal: controller.signal,
        });

        if (!res.ok) return false;

        const data = await res.json();
        authStore.set({
          token: data.access_token,
          ...(data.refresh_token ? { refresh_token: data.refresh_token } : {}),
        });
        return true;
      } finally {
        clearTimeout(timer);
      }
    } catch {
      return false;
    }
  })();

  try {
    return await _refreshPromise;
  } finally {
    // Clear so the NEXT 401 can trigger a fresh refresh
    _refreshPromise = null;
  }
}

/** Wraps fetch with a default timeout. If the caller already provided an
 *  AbortController via opts.signal, we respect it and skip the auto-timeout. */
async function fetchWithTimeout(url: string, opts: RequestInit): Promise<Response> {
  if (opts.signal) {
    // Caller controls the lifecycle themselves
    return fetch(url, opts);
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
  try {
    return await fetch(url, { ...opts, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/** Unified fetch wrapper with automatic 401 → refresh → retry logic + timeout. */
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
    return fetchWithTimeout(buildUrl(url), { ...opts, headers });
  };

  // On GET requests, transient network failures (Android dropping idle
  // connections, dev tunnel hiccups, brief 502/503/504s, cold starts) are
  // retried with exponential backoff. We DON'T retry mutations — replaying
  // a POST/PUT/DELETE could double-create resources.
  const method = (opts.method ?? 'GET').toUpperCase();
  const isIdempotent = method === 'GET' || method === 'HEAD';
  // Backoff schedule: 400ms, then 1200ms. Total worst-case wait ~1.6s before
  // giving up — long enough for Android to re-establish a TCP connection and
  // for a serverless cold start to finish, short enough that the user doesn't
  // stare at a spinner forever.
  const RETRY_DELAYS_MS = isIdempotent ? [400, 1200] : [];

  const attempt = async (): Promise<Response> => {
    let res = await makeRequest();
    if (res.status === 401) {
      const refreshed = await tryRefreshToken();
      if (refreshed) res = await makeRequest();
    }
    return res;
  };

  const isTransientStatus = (s: number) => [502, 503, 504].includes(s);

  let res: Response | null = null;
  let lastErr: any = null;

  for (let i = 0; i <= RETRY_DELAYS_MS.length; i++) {
    try {
      res = await attempt();
      // Success or definitive error — bail unless it's a transient 5xx
      if (!isTransientStatus(res.status)) break;
      lastErr = null;
    } catch (err: any) {
      lastErr = err;
      // AbortError = caller hit the timeout limit, don't keep retrying
      if (err?.name === 'AbortError') return networkErrorResponse(err);
    }
    // Sleep before next retry (if any retries remain)
    if (i < RETRY_DELAYS_MS.length) {
      await new Promise(r => setTimeout(r, RETRY_DELAYS_MS[i]));
    }
  }

  if (!res) return networkErrorResponse(lastErr);

  const text = await res.text();
  let body: T;
  try {
    body = JSON.parse(text) as T;
  } catch {
    body = text as unknown as T;
  }

  return { ok: res.ok, status: res.status, body };
}

function networkErrorResponse(err: any) {
  const isAbort = err?.name === 'AbortError';
  return {
    ok: false,
    status: isAbort ? 408 : 0,
    body: {
      detail: isAbort
        ? 'Request timed out. Please check your connection and try again.'
        : (err?.message ?? 'Network error'),
    } as any,
  };
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
