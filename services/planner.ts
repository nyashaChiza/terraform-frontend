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
