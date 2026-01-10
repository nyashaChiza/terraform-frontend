import { BASE_URL } from './api';
import { authStore } from '../store/auth';

export type GoalPayload = {
  type: string;
  description: string;
  target_value: number;
  start_date: string;
  due_date: string;
  starting_value: number;
};

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

export async function createGoal(payload: GoalPayload) {
  const auth = await buildAuthHeader();
  const res = await fetch(`${BASE_URL}/api/goals/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...auth },
    body: JSON.stringify(payload),
  });

  const body = await parseResponse(res);
  if (!res.ok) return { ok: false, status: res.status, body };
  return { ok: true, status: res.status, body };
}

export async function updateGoal(id: string, payload: GoalPayload) {
  const auth = await buildAuthHeader();
  const res = await fetch(`${BASE_URL}/api/goals/${id}/`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...auth },
    body: JSON.stringify(payload),
  });

  const body = await parseResponse(res);
  if (!res.ok) return { ok: false, status: res.status, body };
  return { ok: true, status: res.status, body };
}

export default { createGoal, updateGoal };
