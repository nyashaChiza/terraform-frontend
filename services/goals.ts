import { apiFetch } from './api';

export type GoalPayload = {
  type: string;
  description: string;
  target_value: number;
  start_date: string;
  due_date: string;
  starting_value: number;
};

export async function createGoal(payload: GoalPayload) {
  return apiFetch('/api/goals/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateGoal(id: string | number, payload: Omit<GoalPayload, 'starting_value'>) {
  return apiFetch(`/api/goals/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function getGoals() {
  return apiFetch('/api/goals/current', { method: 'GET' });
}

export async function updateProgress(id: string | number, currentValue: number) {
  return apiFetch(`/api/goals/${id}/progress`, {
    method: 'PATCH',
    body: JSON.stringify({ current_value: currentValue }),
  });
}

export async function closeGoal(id: string | number) {
  return apiFetch(`/api/goals/${id}/close`, { method: 'POST' });
}

export default { createGoal, updateGoal, getGoals, updateProgress, closeGoal };
