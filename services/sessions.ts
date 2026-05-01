import { apiFetch } from './api';

export async function getPlannedSessions() {
  const res = await apiFetch('/api/sessions/latest', { method: 'GET' });
  if (!res.ok) return { ok: false, status: res.status, body: null };
  if (!res.body || res.body.detail) return { ok: false, status: res.status, body: null };
  return { ok: true, status: res.status, body: res.body };
}

export async function getCompletedSessions() {
  return apiFetch('/api/sessions/completed', { method: 'GET' });
}

export async function getSessionDetails(sessionId: number) {
  return apiFetch(`/api/sessions/${sessionId}`, { method: 'GET' });
}

export async function startSession(sessionId: number) {
  return apiFetch(`/api/sessions/${sessionId}/start`, { method: 'POST' });
}

export async function completeSession(sessionId: number, feedback?: any) {
  return apiFetch(`/api/sessions/${sessionId}/complete`, {
    method: 'POST',
    ...(feedback ? { body: JSON.stringify({ feedback }) } : {}),
  });
}

export async function addFeedback(sessionId: number, feedback: {
  soreness_per_muscle?: Record<string, number>;
  joint_pain: boolean;
  effort_rating: number;
  energy_level: number;
  summary?: string;
  weights_used?: { exercise_id: number; name: string; weight_kg: number }[];
}) {
  return apiFetch(`/api/sessions/${sessionId}/feedback`, {
    method: 'POST',
    body: JSON.stringify(feedback),
  });
}

export default {
  getPlannedSessions,
  getCompletedSessions,
  getSessionDetails,
  startSession,
  completeSession,
  addFeedback,
};
