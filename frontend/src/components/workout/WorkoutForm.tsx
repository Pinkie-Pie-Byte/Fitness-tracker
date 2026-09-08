import { useState, useMemo, useEffect, useRef } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { IconX } from '@tabler/icons-react';
import type { AvailableExercise, Workout, WorkoutExercise, NewExerciseDraft } from '@/types/workout';

interface WorkoutFormProps {
  availableExercises: AvailableExercise[];
  editingWorkout: Workout | null;
  onSaveWorkout: (workout: { title: string; notes?: string; exercises: WorkoutExercise[] }, editingId?: string | null) => Promise<boolean>;
  onCancelEdit: () => void;
}

const emptyNewExercise: NewExerciseDraft = {
  name: '',
  sets: '',
  reps: '',
  weight: '',
  imageUrl: ''
};

export default function WorkoutForm({
  availableExercises,
  editingWorkout,
  onSaveWorkout,
  onCancelEdit
}: WorkoutFormProps) {
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [draftExercises, setDraftExercises] = useState<WorkoutExercise[]>([]);
  const [newExercise, setNewExercise] = useState<NewExerciseDraft>(emptyNewExercise);
  const [exMuscleFilter, setExMuscleFilter] = useState('all');
  const [isSaving, setIsSaving] = useState(false);
  const exerciseInputRef = useRef<HTMLInputElement>(null);

  const handleClearExerciseSelection = () => {
    setNewExercise((prev) => ({ ...prev, name: '' }));
    setTimeout(() => {
      exerciseInputRef.current?.focus();
      try {
        exerciseInputRef.current?.showPicker();
      } catch {
        // Fallback for browsers without showPicker
      }
    }, 0);
  };

  useEffect(() => {
    if (editingWorkout) {
      setTitle(editingWorkout.title);
      setNotes(editingWorkout.notes || '');
      setDraftExercises(editingWorkout.exercises || []);
    } else {
      setTitle('');
      setNotes('');
      setDraftExercises([]);
    }
  }, [editingWorkout]);

  const uniqueMuscleGroups = useMemo(() => {
    const groups = new Set<string>();
    availableExercises.forEach((ex) => {
      if (ex.bodyPart) groups.add(ex.bodyPart);
    });
    return Array.from(groups).sort();
  }, [availableExercises]);

  const filteredExercises = useMemo(() => {
    if (exMuscleFilter === 'all') return availableExercises;
    return availableExercises.filter((ex) => ex.bodyPart === exMuscleFilter);
  }, [availableExercises, exMuscleFilter]);

  const handleAddExercise = () => {
    const { name, sets, reps, weight, imageUrl } = newExercise;

    if (!name || !sets || !reps) {
      return alert('Bitte fülle Übungsname, Sätze und Wiederholungen aus.');
    }
    if (Number(sets) <= 0 || Number(reps) <= 0) {
      return alert('Sätze und Wiederholungen müssen positiv sein.');
    }
    if (Number(weight) < 0) {
      return alert('Gewicht darf nicht negativ sein.');
    }

    const exObj = availableExercises.find((e) => e.name === name);

    setDraftExercises([
      ...draftExercises,
      {
        name,
        sets: Number(sets),
        reps: Number(reps),
        weight: Number(weight) || 0,
        bodyPart: exObj?.bodyPart || '',
        target: exObj?.target || '',
        imageUrl
      }
    ]);

    setNewExercise(emptyNewExercise);
  };

  const handleRemoveDraftExercise = (index: number) => {
    setDraftExercises(draftExercises.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!title || title.trim() === '') {
      return alert('Fehler: Bitte gib einen Titel für das Workout ein.');
    }
    if (draftExercises.length === 0) {
      return alert('Fehler: Bitte füge mindestens eine Übung zum Workout hinzu.');
    }

    setIsSaving(true);
    const success = await onSaveWorkout(
      { title, notes, exercises: draftExercises },
      editingWorkout?._id
    );
    setIsSaving(false);

    if (success) {
      setTitle('');
      setNotes('');
      setDraftExercises([]);
      setNewExercise(emptyNewExercise);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{editingWorkout ? 'Workout bearbeiten' : 'Neues Workout'}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Titel</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="z.B. Push Day"
          />
        </div>
        <div className="space-y-2">
          <Label>Notizen</Label>
          <Input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Wie hast du dich gefühlt?"
          />
        </div>

        <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg space-y-4">
          <h4 className="font-medium text-sm">Übungen hinzufügen</h4>

          {draftExercises.length > 0 && (
            <ul className="space-y-2 mb-4">
              {draftExercises.map((ex, i) => (
                <li
                  key={i}
                  className="text-xs bg-background p-2 rounded border flex justify-between items-center"
                >
                  <div className="flex items-center gap-2">
                    {ex.imageUrl && (
                      <img src={ex.imageUrl} className="w-8 h-8 object-cover rounded" alt="thumb" />
                    )}
                    <span>{ex.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>
                      {ex.sets}x{ex.reps} @ {ex.weight}kg
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveDraftExercise(i)}
                      className="text-muted-foreground hover:text-destructive text-sm font-bold ml-1"
                      title="Übung entfernen"
                    >
                      ×
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="flex gap-2">
            <Select value={exMuscleFilter} onValueChange={(val) => setExMuscleFilter(val || 'all')}>
              <SelectTrigger className="w-[140px]">
                <span className="truncate">
                  {exMuscleFilter === 'all' ? 'Alle Muskeln' : exMuscleFilter}
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Muskeln</SelectItem>
                {uniqueMuscleGroups.map((group) => (
                  <SelectItem key={group} value={group}>
                    {group}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="relative flex-1">
              <Input
                ref={exerciseInputRef}
                className={`w-full ${newExercise.name ? 'pr-9' : ''}`}
                list="exercise-list"
                placeholder="Übung eingeben/wählen..."
                value={newExercise.name}
                onFocus={(e) => e.target.select()}
                onClick={(e) => (e.target as HTMLInputElement).select()}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    handleClearExerciseSelection();
                  }
                }}
                onChange={(e) => setNewExercise({ ...newExercise, name: e.target.value })}
              />
              {newExercise.name && (
                <button
                  type="button"
                  onClick={handleClearExerciseSelection}
                  className="absolute right-7 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded transition-colors"
                  title="Übungsauswahl löschen (Esc)"
                  aria-label="Übungsauswahl löschen"
                >
                  <IconX className="size-3.5" />
                </button>
              )}
            </div>
          </div>

          <datalist id="exercise-list">
            {filteredExercises.map((ex) => (
              <option key={ex.id || ex.name} value={ex.name}>
                {ex.name} {ex.target ? `(${ex.target})` : ''}
              </option>
            ))}
          </datalist>

          <div className="grid grid-cols-3 gap-2">
            <Input
              placeholder="Sätze"
              type="number"
              value={newExercise.sets}
              onChange={(e) => setNewExercise({ ...newExercise, sets: e.target.value })}
            />
            <Input
              placeholder="Wdh."
              type="number"
              value={newExercise.reps}
              onChange={(e) => setNewExercise({ ...newExercise, reps: e.target.value })}
            />
            <Input
              placeholder="kg"
              type="number"
              value={newExercise.weight}
              onChange={(e) => setNewExercise({ ...newExercise, weight: e.target.value })}
            />
          </div>

          <Input
            placeholder="Bild-URL (Optional)"
            type="url"
            value={newExercise.imageUrl}
            onChange={(e) => setNewExercise({ ...newExercise, imageUrl: e.target.value })}
          />

          <Button variant="secondary" className="w-full" onClick={handleAddExercise}>
            Hinzufügen
          </Button>
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        {editingWorkout && (
          <Button variant="outline" className="flex-1" onClick={onCancelEdit}>
            Abbrechen
          </Button>
        )}
        <Button className="flex-1" onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Speichern...' : editingWorkout ? 'Änderungen speichern' : 'Workout Speichern'}
        </Button>
      </CardFooter>
    </Card>
  );
}
