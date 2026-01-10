import { BASE_URL } from './api';
import { authStore } from '../store/auth';

async function buildAuthHeader() {
  const token = authStore.get().token;
  const token_type = authStore.get().token_type ?? 'Bearer';
  if (!token) return {};
  const headerValue = token.toLowerCase().startsWith('bearer ') ? token : `${token_type} ${token}`;
  return { Authorization: headerValue };
}

async function parseResponse(res: Response) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function getPlannedSessions() {
  const auth = await buildAuthHeader();
  const res = await fetch(`${BASE_URL}/api/sessions/planned`, {
    method: 'GET',
    headers: { 'Accept': 'application/json', ...auth },
  });

  const body = await parseResponse(res);
  if (!res.ok) return { ok: false, status: res.status, body };
  return { ok: true, status: res.status, body };
}

export default { getPlannedSessions };
