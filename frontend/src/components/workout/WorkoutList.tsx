import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import ExerciseImage from '@/components/workout/ExerciseImage';
import type { Workout } from '@/types/workout';

interface WorkoutListProps {
  workouts: Workout[];
  onStart: (workout: Workout) => void;
  onEdit: (workout: Workout) => void;
  onDelete: (id: string) => void;
}

export default function WorkoutList({ workouts, onStart, onEdit, onDelete }: WorkoutListProps) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Deine Trainings</h2>
      {workouts.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground border border-dashed rounded-lg">
          Noch keine Workouts vorhanden. Starte dein erstes Training!
        </div>
      ) : (
        <div className="grid gap-4">
          {workouts.map((w) => (
            <Card key={w._id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-primary">{w.title}</CardTitle>
                  <CardDescription>{new Date(w.createdAt).toLocaleDateString()}</CardDescription>
                </div>
                <div className="space-x-2">
                  <Button onClick={() => onStart(w)}>Starten</Button>
                  <Button variant="outline" onClick={() => onEdit(w)}>
                    Bearbeiten
                  </Button>
                  <Button variant="destructive" onClick={() => onDelete(w._id)}>
                    Löschen
                  </Button>
                </div>
              </CardHeader>
              {w.notes && (
                <CardContent className="text-sm italic text-muted-foreground pb-2">
                  {w.notes}
                </CardContent>
              )}
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Übung</TableHead>
                      <TableHead>Ziel</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {w.exercises?.map((ex, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium flex items-center gap-2">
                          {ex.imageUrl && (
                            <ExerciseImage
                              src={ex.imageUrl}
                              alt={ex.name}
                              className="w-8 h-8 object-cover rounded"
                            />
                          )}
                          {ex.name}
                        </TableCell>
                        <TableCell>
                          {ex.sets}x{ex.reps} @ {ex.weight}kg
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
