// Base URL for backend APIs. Use absolute URLs as-is or pass a relative path.
export const BASE_URL = 'https://terraform-backend.vercel.app';

function buildUrl(url: string) {
  if (/^https?:\/\//i.test(url)) return url;
  const base = BASE_URL.replace(/\/$/, '');
  return url.startsWith('/') ? base + url : base + '/' + url;
}

async function parseResponse<T = any>(res: Response) {
  const text = await res.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}

export async function apiGet<T = any>(url: string, opts: RequestInit = {}) {
  const res = await fetch(buildUrl(url), { ...opts });
  return parseResponse<T>(res);
}

export async function apiPost<T = any>(url: string, body?: any, opts: RequestInit = {}) {
  const headers = { 'Content-Type': 'application/json', ...(opts.headers as Record<string,string> || {}) };
  const res = await fetch(buildUrl(url), {
    method: 'POST',
    headers,
    body: body ? JSON.stringify(body) : undefined,
    ...opts,
  });
  return parseResponse<T>(res);
}

const api = { get: apiGet, post: apiPost };
export default api;
