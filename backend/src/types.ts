// backend/src/types.ts

export interface IWorkoutPlan {
  id?: number;
  user_id: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface IWorkoutPlanDay {
  id?: number;
  user_id: number;
  day_number: number;
  feedback?: string;
  done?: boolean;
  created_at?: Date;
  updated_at?: Date;
  // We'll attach exercises in code, not physically in the DB row
  exercises?: IWorkoutExercise[];
}

export interface IWorkoutExercise {
  id?: number;
  plan_day_id?: number;
  drill_name: string;
  weight: string;
  reps: string;
  sets: string;
  rest_time: string;
  created_at?: Date;
  updated_at?: Date;
}
