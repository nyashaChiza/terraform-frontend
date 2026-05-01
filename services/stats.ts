import { apiFetch } from './api';

export type WeeklyBucket = {
  label: string;
  count: number;
};

export type PersonalRecord = {
  name: string;
  weight_kg: number;
  exercise_id: number | null;
};

export type StatsSummary = {
  total_sessions: number;
  streak: number;
  sessions_this_week: number;
  weekly_counts: WeeklyBucket[];
  personal_records: PersonalRecord[];
  total_prs: number;
};

export async function getStatsSummary() {
  return apiFetch<StatsSummary>('/api/stats/summary', { method: 'GET' });
}

export default { getStatsSummary };
