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
  const res = await fetch(`${BASE_URL}/api/sessions/latest`, {
    method: 'GET',
    headers: { 'Accept': 'application/json', ...auth } as HeadersInit,
  });
  const body = await parseResponse(res);
  if (!res.ok) return { ok: false, status: res.status, body };
  if (!body || body.detail) return { ok: false, status: res.status, body: null };
  return { ok: true, status: res.status, body };
}

export async function getCompletedSessions() {
  const auth = await buildAuthHeader();
  const res = await fetch(`${BASE_URL}/api/sessions/completed`, {
    method: 'GET',
    headers: { 'Accept': 'application/json', ...auth },
  });
  const body = await parseResponse(res);
  if (!res.ok) return { ok: false, status: res.status, body };
  return { ok: true, status: res.status, body };
}

export async function getSessionDetails(sessionId: number) {
  const auth = await buildAuthHeader();
  const res = await fetch(`${BASE_URL}/api/sessions/${sessionId}`, {
    method: 'GET',
    headers: { 'Accept': 'application/json', ...auth },
  });
  const body = await parseResponse(res);
  if (!res.ok) return { ok: false, status: res.status, body };
  return { ok: true, status: res.status, body };
}

export async function startSession(sessionId: number) {
  const auth = await buildAuthHeader();
  const res = await fetch(`${BASE_URL}/api/sessions/${sessionId}/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', ...auth },
  });
  const body = await parseResponse(res);
  if (!res.ok) return { ok: false, status: res.status, body };
  return { ok: true, status: res.status, body };
}

export async function completeSession(sessionId: number, feedback?: any) {
  const auth = await buildAuthHeader();
  const res = await fetch(`${BASE_URL}/api/sessions/${sessionId}/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', ...auth },
    ...(feedback && { body: JSON.stringify({ feedback }) }),
  });
  const body = await parseResponse(res);
  if (!res.ok) return { ok: false, status: res.status, body };
  return { ok: true, status: res.status, body };
}

export async function addFeedback(sessionId: number, feedback: {
  soreness_per_muscle: Record<string, number>;
  joint_pain: boolean;
  effort_rating: number;
  energy_level: number;
  summary: string;
}) {
  const auth = await buildAuthHeader();
  const res = await fetch(`${BASE_URL}/api/sessions/${sessionId}/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', ...auth },
    body: JSON.stringify(feedback),
  });
  const body = await parseResponse(res);
  if (!res.ok) return { ok: false, status: res.status, body };
  return { ok: true, status: res.status, body };
}

export default { 
  getPlannedSessions, 
  getCompletedSessions, 
  getSessionDetails,
  startSession, 
  completeSession, 
  addFeedback 
};