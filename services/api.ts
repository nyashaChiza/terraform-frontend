export async function apiGet<T = any>(url: string, opts: RequestInit = {}) {
  const res = await fetch(url, { ...opts });
  const text = await res.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}

export async function apiPost<T = any>(url: string, body?: any, opts: RequestInit = {}) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
    ...opts,
  });
  return apiGet<T>(url, opts);
}

const api = { get: apiGet, post: apiPost };
export default api;
