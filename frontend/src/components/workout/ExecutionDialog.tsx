import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ExecutionExercise, Workout } from '@/types/workout';

interface ExecutionDialogProps {
  workout: Workout | null;
  onClose: () => void;
  onSubmit: (exercises: ExecutionExercise[]) => Promise<boolean>;
}

export default function ExecutionDialog({ workout, onClose, onSubmit }: ExecutionDialogProps) {
  const [executionData, setExecutionData] = useState<ExecutionExercise[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (workout) {
      setExecutionData(
        workout.exercises.map((ex) => ({
          name: ex.name,
          actualSets: ex.sets,
          actualReps: ex.reps,
          actualWeight: ex.weight,
          difficulty: 7,
          imageUrl: ex.imageUrl
        }))
      );
    }
  }, [workout]);

  const updateExecutionField = (
    index: number,
    field: keyof ExecutionExercise,
    value: number
  ) => {
    const newData = [...executionData];
    newData[index] = { ...newData[index], [field]: value };
    setExecutionData(newData);
  };

  const handleSubmit = async () => {
    for (const ex of executionData) {
      if (ex.actualSets < 0 || ex.actualReps < 0 || ex.actualWeight < 0) {
        return alert('Fehler: Bitte gib keine negativen Zahlen für Sätze, Wiederholungen oder Gewicht ein.');
      }
      if (ex.difficulty < 1 || ex.difficulty > 10) {
        return alert('Fehler: RPE (Anstrengung) muss zwischen 1 und 10 liegen.');
      }
    }

    setIsSubmitting(true);
    const success = await onSubmit(executionData);
    setIsSubmitting(false);

    if (success) {
      onClose();
    }
  };

  return (
    <Dialog open={!!workout} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{workout?.title} starten</DialogTitle>
          <DialogDescription>Trage deine geschafften Werte ein.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-4">
          {executionData.map((ex, i) => (
            <div key={i} className="p-4 border rounded-lg space-y-4">
              <div className="flex gap-4 items-start">
                {ex.imageUrl && (
                  <img
                    src={ex.imageUrl}
                    alt={ex.name}
                    className="w-20 h-20 object-cover rounded-md"
                  />
                )}
                <h4 className="font-medium">{ex.name}</h4>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div>
                  <Label>Sätze</Label>
                  <Input
                    type="number"
                    value={ex.actualSets}
                    onChange={(e) =>
                      updateExecutionField(i, 'actualSets', Number(e.target.value))
                    }
                  />
                </div>
                <div>
                  <Label>Wdh.</Label>
                  <Input
                    type="number"
                    value={ex.actualReps}
                    onChange={(e) =>
                      updateExecutionField(i, 'actualReps', Number(e.target.value))
                    }
                  />
                </div>
                <div>
                  <Label>kg</Label>
                  <Input
                    type="number"
                    value={ex.actualWeight}
                    onChange={(e) =>
                      updateExecutionField(i, 'actualWeight', Number(e.target.value))
                    }
                  />
                </div>
                <div>
                  <Label>RPE</Label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={ex.difficulty}
                    onChange={(e) =>
                      updateExecutionField(
                        i,
                        'difficulty',
                        Math.min(Number(e.target.value), 10)
                      )
                    }
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Abbrechen
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Speichern...' : 'Training speichern'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
