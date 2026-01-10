import { BASE_URL } from './api';
import { authStore } from '../store/auth';

export type WorkoutPlan = {
  id: string;
  name: string;
  exercises: Array<{ id: string; name: string; reps?: number; sets?: number }>;
};

export async function fetchPlans(): Promise<WorkoutPlan[]> {
  // Placeholder: replace with API call
  return [
    { id: '1', name: 'Full Body', exercises: [{ id: 'e1', name: 'Squat', reps: 8, sets: 3 }] },
  ];
}

export async function savePlan(plan: WorkoutPlan) {
  // Placeholder save
  return { ok: true };
}

async function buildAuthHeader() {
  const token = authStore.get().token;
  const token_type = authStore.get().token_type ?? 'Bearer';
  if (!token) return {};
  const headerValue = token.toLowerCase().startsWith('bearer ') ? token : `${token_type} ${token}`;
  return { Authorization: headerValue };
}

export async function generatePlan(planned_date: string) {
  const auth = await buildAuthHeader();
  const res = await fetch(`${BASE_URL}/api/planner/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...auth },
    body: JSON.stringify({ planned_date }),
  });

  const text = await res.text();
  try {
    const body = JSON.parse(text);
    if (!res.ok) return { ok: false, status: res.status, body };
    return { ok: true, status: res.status, body };
  } catch {
    return { ok: res.ok, status: res.status, body: text };
  }
}
