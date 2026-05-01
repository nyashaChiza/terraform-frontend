import { apiFetch } from './api';

export type Exercise = {
  id: number;
  name: string;
  muscle_group: string;
  description?: string;
  equipment?: string;
  difficulty?: string;
};

export async function getExercises() {
  return apiFetch<Exercise[]>('/api/exercises', { method: 'GET' });
}

export async function getExerciseById(id: number) {
  return apiFetch<Exercise>(`/api/exercises/${id}`, { method: 'GET' });
}

export default { getExercises, getExerciseById };
