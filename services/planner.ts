import { apiFetch } from './api';

export async function generatePlan() {
  return apiFetch('/api/planner/generate', { method: 'GET' });
}

export default { generatePlan };
