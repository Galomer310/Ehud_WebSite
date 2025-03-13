// frontend/src/types.ts

export interface IWorkoutExercise {
  id?: number;
  plan_day_id?: number;
  drillName: string;
  weight: string;
  reps: string;
  sets: string;
  restTime: string;
}

export interface IWorkoutPlanDay {
  id?: number;
  user_id: number;
  day_number: number;
  feedback?: string;
  done?: boolean;
  exercises: IWorkoutExercise[];
}
