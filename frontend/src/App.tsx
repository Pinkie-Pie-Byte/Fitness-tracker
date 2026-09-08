import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import Auth from '@/components/Auth';
import { authClient } from '@/lib/auth';
import type { AvailableExercise, ExecutionExercise, Workout, WorkoutExercise, WorkoutLog } from '@/types/workout';
import WorkoutForm from '@/components/workout/WorkoutForm';
import WorkoutList from '@/components/workout/WorkoutList';
import ExecutionDialog from '@/components/workout/ExecutionDialog';
import VolumeChart from '@/components/workout/VolumeChart';
import AgbDialog from '@/components/workout/AgbDialog';

const API_URL = '';

export default function App() {
  const { data: session, isPending } = authClient.useSession();

  // --- DATEN-STATE ---
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [availableExercises, setAvailableExercises] = useState<AvailableExercise[]>([]);

  // --- WORKOUT BEARBEITEN / AUSFÜHREN ---
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);
  const [executionWorkout, setExecutionWorkout] = useState<Workout | null>(null);

  // --- API HELFER ---
  const fetchJson = useCallback(async <T,>(path: string, setter: (data: T) => void) => {
    try {
      const res = await fetch(`${API_URL}${path}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setter(data);
      }
    } catch (err) {
      console.error(`Fehler beim Laden von ${path}:`, err);
    }
  }, []);

  const fetchWorkouts = useCallback(() => fetchJson<Workout[]>('/api/workouts', setWorkouts), [fetchJson]);
  const fetchExercises = useCallback(() => fetchJson<AvailableExercise[]>('/api/exercises', setAvailableExercises), [fetchJson]);
  const fetchLogs = useCallback(() => fetchJson<WorkoutLog[]>('/api/logs', setLogs), [fetchJson]);

  useEffect(() => {
    if (session) {
      fetchWorkouts();
      fetchExercises();
      fetchLogs();
    }
  }, [session, fetchWorkouts, fetchExercises, fetchLogs]);

  // --- CRUD OPERATIONEN ---
  const handleSaveWorkout = async (
    workoutData: { title: string; notes?: string; exercises: WorkoutExercise[] },
    editingId?: string | null
  ): Promise<boolean> => {
    try {
      const res = await fetch(`${API_URL}/api/workouts${editingId ? `/${editingId}` : ''}`, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workoutData),
        credentials: 'include'
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        alert(errorData?.error || 'Fehler beim Speichern des Workouts.');
        return false;
      }

      setEditingWorkout(null);
      fetchWorkouts();
      return true;
    } catch (err) {
      console.error(err);
      alert('Netzwerkfehler beim Speichern des Workouts.');
      return false;
    }
  };

  const handleEditWorkout = (workout: Workout) => {
    setEditingWorkout(workout);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteWorkout = async (id: string) => {
    if (!confirm('Möchtest du dieses Workout wirklich unwiderruflich löschen?')) return;

    try {
      const res = await fetch(`${API_URL}/api/workouts/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!res.ok) {
        alert('Fehler beim Löschen des Workouts.');
        return;
      }

      if (editingWorkout?._id === id) {
        setEditingWorkout(null);
      }
      fetchWorkouts();
      fetchLogs();
    } catch (err) {
      console.error(err);
      alert('Netzwerkfehler beim Löschen des Workouts.');
    }
  };

  const handleSubmitExecution = async (exercises: ExecutionExercise[]): Promise<boolean> => {
    if (!executionWorkout) return false;

    try {
      const logData = {
        workoutId: executionWorkout._id,
        workoutTitle: executionWorkout.title,
        exercises
      };

      const res = await fetch(`${API_URL}/api/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logData),
        credentials: 'include'
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        alert(errorData?.error || 'Fehler beim Speichern des Trainings.');
        return false;
      }

      setExecutionWorkout(null);
      fetchLogs();
      return true;
    } catch (err) {
      console.error(err);
      alert('Netzwerkfehler beim Speichern des Trainings.');
      return false;
    }
  };

  if (isPending) {
    return <div className="p-8 text-center mt-20">Laden...</div>;
  }

  if (!session) {
    return <Auth onLogin={() => window.location.reload()} />;
  }

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8">
      {/* Header */}
      <header className="flex justify-between items-center pb-4 border-b">
        <div className="flex items-center gap-3">
          <div className="bg-primary p-2 rounded-lg text-primary-foreground">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 4v16" />
              <path d="M18 4v16" />
              <path d="M4 8h16" />
              <path d="M4 16h16" />
              <path d="M2 12h20" />
            </svg>
          </div>
          <h1 className="text-3xl font-sans font-black tracking-tighter uppercase italic">
            Iron<span className="text-primary">Track</span>
          </h1>
        </div>
        <Button
          variant="outline"
          onClick={async () => {
            await authClient.signOut();
            window.location.reload();
          }}
        >
          Abmelden
        </Button>
      </header>

      {/* Hauptbereich */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Linke Spalte: Workout-Formular */}
        <div className="space-y-6">
          <WorkoutForm
            availableExercises={availableExercises}
            editingWorkout={editingWorkout}
            onSaveWorkout={handleSaveWorkout}
            onCancelEdit={() => setEditingWorkout(null)}
          />
        </div>

        {/* Rechte Spalte: Trainings-Liste & Fortschrittsdiagramm */}
        <div className="md:col-span-2 space-y-8">
          <WorkoutList
            workouts={workouts}
            onStart={(w) => setExecutionWorkout(w)}
            onEdit={handleEditWorkout}
            onDelete={handleDeleteWorkout}
          />

          <VolumeChart logs={logs} />
        </div>
      </div>

      {/* Dialoge */}
      <ExecutionDialog
        workout={executionWorkout}
        onClose={() => setExecutionWorkout(null)}
        onSubmit={handleSubmitExecution}
      />

      {/* Footer mit Borat-Easter-Egg */}
      <AgbDialog />
    </div>
  );
}
