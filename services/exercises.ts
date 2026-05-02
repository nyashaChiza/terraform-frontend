import { apiFetch } from './api';

export type Exercise = {
  id: number;
  name: string;
  primary_muscle: string;       // "Chest" | "Back" | "Arms" | "Shoulders" | "Legs" | "Core"
  secondary_muscles: string[];  // e.g. ["Triceps", "Shoulders"]
  stress_level: string;         // "Low" | "Medium" | "High"
};

export async function getExercises() {
  return apiFetch<Exercise[]>('/api/exercises', { method: 'GET' });
}

export async function getExerciseById(id: number) {
  return apiFetch<Exercise>(`/api/exercises/${id}`, { method: 'GET' });
}

export default { getExercises, getExerciseById };
