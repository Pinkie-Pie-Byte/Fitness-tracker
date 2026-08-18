import { useEffect, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Line, LineChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import Auth from '@/components/Auth';
import { authClient } from '@/lib/auth';

const API_URL = '';

export default function App() {
  const { data: session, isPending } = authClient.useSession();

  const [workouts, setWorkouts] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [availableExercises, setAvailableExercises] = useState<any[]>([]);
  
  // Form State
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [pendingExercises, setPendingExercises] = useState<any[]>([]);
  const [exName, setExName] = useState('');
  const [exSets, setExSets] = useState('');
  const [exReps, setExReps] = useState('');
  const [exWeight, setExWeight] = useState('');

  // Execution Modal State
  const [executionWorkout, setExecutionWorkout] = useState<any>(null);
  const [executionData, setExecutionData] = useState<any[]>([]);

  // Chart State
  const [chartFilter, setChartFilter] = useState('all');

  useEffect(() => {
    if (session) {
      fetchWorkouts();
      fetchExercises();
      fetchLogs();
    }
  }, [session]);

  const fetchWorkouts = async () => {
    const res = await fetch(`${API_URL}/api/workouts`, { credentials: 'include' });
    if(res.ok) {
      const data = await res.json();
      setWorkouts(data);
    }
  };

  const fetchExercises = async () => {
    const res = await fetch(`${API_URL}/api/exercises`, { credentials: 'include' });
    if(res.ok) {
      const data = await res.json();
      setAvailableExercises(data);
    }
  };

  const fetchLogs = async () => {
    const res = await fetch(`${API_URL}/api/logs`, { credentials: 'include' });
    if(res.ok) {
      const data = await res.json();
      setLogs(data);
    }
  };

  const handleAddExercise = () => {
    if (!exName || !exSets || !exReps) return;
    const exObj = availableExercises.find((e: any) => e.name === exName);
    setPendingExercises([...pendingExercises, {
      name: exName,
      sets: Number(exSets),
      reps: Number(exReps),
      weight: Number(exWeight) || 0,
      bodyPart: exObj?.bodyPart || '',
      target: exObj?.target || ''
    }]);
    setExName(''); setExSets(''); setExReps(''); setExWeight('');
  };

  const handleSaveWorkout = async () => {
    if (!title) return alert('Titel erforderlich');
    const newWorkout = { title, notes, exercises: pendingExercises };
    await fetch(`${API_URL}/api/workouts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newWorkout),
      credentials: 'include'
    });
    setTitle(''); setNotes(''); setPendingExercises([]);
    fetchWorkouts();
  };

  const handleDeleteWorkout = async (id: string) => {
    if (!confirm('Wirklich löschen?')) return;
    await fetch(`${API_URL}/api/workouts/${id}`, { method: 'DELETE', credentials: 'include' });
    fetchWorkouts();
    fetchLogs();
  };

  const openExecution = (w: any) => {
    setExecutionWorkout(w);
    setExecutionData(w.exercises.map((ex: any) => ({
      name: ex.name,
      actualSets: ex.sets,
      actualReps: ex.reps,
      actualWeight: ex.weight,
      difficulty: 7
    })));
  };

  const submitExecution = async () => {
    if(!executionWorkout) return;
    const logData = {
      workoutId: executionWorkout._id,
      workoutTitle: executionWorkout.title,
      exercises: executionData
    };
    await fetch(`${API_URL}/api/logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(logData),
      credentials: 'include'
    });
    setExecutionWorkout(null);
    fetchLogs();
  };

  // Chart Logic
  const uniqueOptions = useMemo(() => {
    const map = new Map();
    logs.forEach(log => {
      log.exercises?.forEach((ex: any) => {
        const key = log.workoutId + '|' + ex.name;
        map.set(key, log.workoutTitle + ' - ' + ex.name);
      });
    });
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [logs]);

  const chartData = useMemo(() => {
    const data: any[] = [];
    logs.forEach(log => {
      const date = new Date(log.date).toLocaleDateString('de-DE');
      if (chartFilter === 'all') {
        const totalVolume = log.exercises.reduce((sum: number, ex: any) => sum + (ex.actualSets * ex.actualReps * ex.actualWeight), 0);
        data.push({ date, value: totalVolume });
      } else {
        const [wId, exName] = chartFilter.split('|');
        if (log.workoutId === wId) {
          const ex = log.exercises.find((e: any) => e.name === exName);
          if (ex) data.push({ date, value: ex.actualWeight });
        }
      }
    });
    return data;
  }, [logs, chartFilter]);

  if (isPending) {
    return <div className="p-8 text-center mt-20">Laden...</div>;
  }

  if (!session) {
    return <Auth onLogin={() => window.location.reload()} />;
  }

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8">
      <header className="flex justify-between items-center pb-4 border-b">
        <div className="flex items-center gap-3">
          <div className="bg-green-500 p-2 rounded-lg text-black">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 4v16"/><path d="M18 4v16"/><path d="M4 8h16"/><path d="M4 16h16"/><path d="M2 12h20"/></svg>
          </div>
          <h1 className="text-3xl font-sans font-black tracking-tighter uppercase italic">
            Iron<span className="text-green-500">Track</span>
          </h1>
        </div>
        <Button variant="outline" onClick={async () => {
          await authClient.signOut();
          window.location.reload();
        }}>Abmelden</Button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* LEFT COLUMN: FORM */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Neues Workout</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Titel</Label>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="z.B. Push Day" />
              </div>
              <div className="space-y-2">
                <Label>Notizen</Label>
                <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Wie hast du dich gefühlt?" />
              </div>

              <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg space-y-4">
                <h4 className="font-medium text-sm">Übungen hinzufügen</h4>
                
                {pendingExercises.length > 0 && (
                  <ul className="space-y-2 mb-4">
                    {pendingExercises.map((ex, i) => (
                      <li key={i} className="text-xs bg-background p-2 rounded border flex justify-between">
                        <span>{ex.name}</span>
                        <span>{ex.sets}x{ex.reps} @ {ex.weight}kg</span>
                      </li>
                    ))}
                  </ul>
                )}

                <Input 
                  list="exercise-list"
                  placeholder="Übung eingeben oder wählen..." 
                  value={exName} 
                  onChange={(e) => setExName(e.target.value)} 
                />
                <datalist id="exercise-list">
                  {availableExercises.map(ex => (
                    <option key={ex.id || ex.name} value={ex.name} />
                  ))}
                </datalist>
                <div className="grid grid-cols-3 gap-2">
                  <Input placeholder="Sätze" type="number" value={exSets} onChange={e => setExSets(e.target.value)} />
                  <Input placeholder="Wdh." type="number" value={exReps} onChange={e => setExReps(e.target.value)} />
                  <Input placeholder="kg" type="number" value={exWeight} onChange={e => setExWeight(e.target.value)} />
                </div>
                <Button variant="secondary" className="w-full" onClick={handleAddExercise}>Hinzufügen</Button>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={handleSaveWorkout}>Workout Speichern</Button>
            </CardFooter>
          </Card>
        </div>

        {/* RIGHT COLUMN: LIST & CHART */}
        <div className="md:col-span-2 space-y-8">
          <div>
            <h2 className="text-2xl font-bold mb-4">Deine Trainings</h2>
            {workouts.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground border border-dashed rounded-lg">
                Noch keine Workouts vorhanden. Starte dein erstes Training!
              </div>
            ) : (
              <div className="grid gap-4">
                {workouts.map(w => (
                  <Card key={w._id}>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle className="text-green-500">{w.title}</CardTitle>
                        <CardDescription>{new Date(w.createdAt).toLocaleDateString()}</CardDescription>
                      </div>
                      <div className="space-x-2">
                        <Button onClick={() => openExecution(w)}>Starten</Button>
                        <Button variant="destructive" onClick={() => handleDeleteWorkout(w._id)}>Löschen</Button>
                      </div>
                    </CardHeader>
                    {w.notes && <CardContent className="text-sm italic text-muted-foreground pb-2">{w.notes}</CardContent>}
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Übung</TableHead>
                            <TableHead>Ziel</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {w.exercises?.map((ex: any, i: number) => (
                            <TableRow key={i}>
                              <TableCell className="font-medium">{ex.name}</TableCell>
                              <TableCell>{ex.sets}x{ex.reps} @ {ex.weight}kg</TableCell>
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

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Fortschritt (Gewicht)</h2>
              <Select value={chartFilter} onValueChange={(v) => setChartFilter(v || 'all')}>
                <SelectTrigger className="w-[300px] overflow-hidden">
                  <span className="truncate flex-1 text-left">
                    {chartFilter === 'all' ? 'Alle (Gesamtvolumen)' : (uniqueOptions.find(o => o[0] === chartFilter)?.[1] || chartFilter)}
                  </span>
                </SelectTrigger>
                <SelectContent className="max-w-[90vw] w-fit">
                  <SelectItem value="all">Alle (Gesamtvolumen)</SelectItem>
                  {uniqueOptions.map(([val, label]) => (
                    <SelectItem key={val} value={val}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Card className="p-4 h-[400px]">
              <ChartContainer config={{ value: { label: "Wert", color: "hsl(142.1 76.2% 36.3%)" } }} className="h-full w-full">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="value" stroke="var(--color-value)" strokeWidth={3} activeDot={{ r: 8 }} />
                </LineChart>
              </ChartContainer>
            </Card>
          </div>
        </div>
      </div>

      {/* Execution Modal */}
      <Dialog open={!!executionWorkout} onOpenChange={(open) => !open && setExecutionWorkout(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{executionWorkout?.title} starten</DialogTitle>
            <DialogDescription>Trage deine geschafften Werte ein.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-4">
            {executionData.map((ex, i) => (
              <div key={i} className="p-4 border rounded-lg space-y-4">
                <h4 className="font-medium">{ex.name}</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div>
                    <Label>Sätze</Label>
                    <Input type="number" value={ex.actualSets} onChange={e => {
                      const newData = [...executionData];
                      newData[i].actualSets = Number(e.target.value);
                      setExecutionData(newData);
                    }} />
                  </div>
                  <div>
                    <Label>Wdh.</Label>
                    <Input type="number" value={ex.actualReps} onChange={e => {
                      const newData = [...executionData];
                      newData[i].actualReps = Number(e.target.value);
                      setExecutionData(newData);
                    }} />
                  </div>
                  <div>
                    <Label>kg</Label>
                    <Input type="number" value={ex.actualWeight} onChange={e => {
                      const newData = [...executionData];
                      newData[i].actualWeight = Number(e.target.value);
                      setExecutionData(newData);
                    }} />
                  </div>
                  <div>
                    <Label>RPE</Label>
                    <Input type="number" value={ex.difficulty} onChange={e => {
                      const newData = [...executionData];
                      newData[i].difficulty = Number(e.target.value);
                      setExecutionData(newData);
                    }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExecutionWorkout(null)}>Abbrechen</Button>
            <Button onClick={submitExecution}>Training speichern</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
