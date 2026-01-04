export type Workout = {
  id: string;
  name: string;
  date?: string;
  completed?: boolean;
};

let workouts: Workout[] = [];

export const workoutStore = {
  list: () => workouts,
  add: (w: Workout) => {
    workouts = [...workouts, w];
    return workouts;
  },
};
