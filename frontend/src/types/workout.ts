export interface WorkoutExercise {
  name: string;
  sets: number;
  reps: number;
  weight: number;
  bodyPart?: string;
  target?: string;
  imageUrl?: string;
}

export interface Workout {
  _id: string;
  userId: string;
  title: string;
  notes?: string;
  createdAt: string;
  exercises: WorkoutExercise[];
}

export interface ExecutionExercise {
  name: string;
  actualSets: number;
  actualReps: number;
  actualWeight: number;
  difficulty: number;
  imageUrl?: string;
}

export interface WorkoutLog {
  _id: string;
  userId: string;
  workoutId: string;
  workoutTitle: string;
  date: string;
  exercises: ExecutionExercise[];
}

export interface AvailableExercise {
  id?: string;
  name: string;
  bodyPart: string;
  target: string;
}

export interface NewExerciseDraft {
  name: string;
  sets: string;
  reps: string;
  weight: string;
  imageUrl: string;
}
