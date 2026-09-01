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

// Durch unseren Reverse-Proxy in Vercel können wir einfach den relativen Pfad nutzen
const API_URL = ''; 

export default function App() {
  // --- AUTHENTIFIZIERUNG ---
  // Prüft, ob der Nutzer gerade eingeloggt ist
  const { data: session, isPending } = authClient.useSession();

  // --- DATEN-STATE (Zustand der App) ---
  const [workouts, setWorkouts] = useState<any[]>([]); // Liste aller gespeicherten Trainingspläne
  const [logs, setLogs] = useState<any[]>([]); // Liste aller durchgeführten Trainings (fürs Diagramm)
  const [availableExercises, setAvailableExercises] = useState<any[]>([]); // Die 200 Bodybuilding-Übungen aus der JSON
  
  // --- FORMULAR-STATE (Für neue Workouts) ---
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [pendingExercises, setPendingExercises] = useState<any[]>([]); // Übungen, die gerade in den neuen Plan eingefügt werden
  const [exName, setExName] = useState('');
  const [exSets, setExSets] = useState('');
  const [exReps, setExReps] = useState('');
  const [exWeight, setExWeight] = useState('');
  const [exImageUrl, setExImageUrl] = useState('');
  const [exMuscleFilter, setExMuscleFilter] = useState('all');

  // Holt alle einzigartigen Muskelgruppen aus den geladenen Übungen
  const uniqueMuscleGroups = useMemo(() => {
    const groups = new Set<string>();
    availableExercises.forEach(ex => {
      if (ex.bodyPart) groups.add(ex.bodyPart);
      // Alternativ: if (ex.target) groups.add(ex.target); 
    });
    return Array.from(groups).sort();
  }, [availableExercises]);

  // Gefilterte Liste der Übungen für das Dropdown
  const filteredExercises = useMemo(() => {
    if (exMuscleFilter === 'all') return availableExercises;
    return availableExercises.filter(ex => ex.bodyPart === exMuscleFilter);
  }, [availableExercises, exMuscleFilter]);

  // --- AUSFÜHRUNGS-MODAL (Wenn man auf "Starten" klickt) ---
  const [executionWorkout, setExecutionWorkout] = useState<any>(null); // Welches Workout wird gerade gemacht?
  const [executionData, setExecutionData] = useState<any[]>([]); // Die eingetragenen Gewichte während dem Training

  // --- DIAGRAMM-STATE ---
  const [chartFilter, setChartFilter] = useState('all'); // Filtert das Diagramm (entweder alle, oder eine bestimmte Übung)

  // Lade alle Daten vom Server, sobald der Nutzer eingeloggt ist (session existiert)
  useEffect(() => {
    if (session) {
      fetchWorkouts();
      fetchExercises();
      fetchLogs();
    }
  }, [session]);

  // --- SERVER-ANFRAGEN (API CALLS) ---

  // Holt alle Trainingspläne aus der Datenbank
  const fetchWorkouts = async () => {
    const res = await fetch(`${API_URL}/api/workouts`, { credentials: 'include' });
    if(res.ok) {
      const data = await res.json();
      setWorkouts(data); // Speichert die Daten im React-State
    }
  };

  // Holt die 200 Basis-Übungen
  const fetchExercises = async () => {
    const res = await fetch(`${API_URL}/api/exercises`, { credentials: 'include' });
    if(res.ok) {
      const data = await res.json();
      setAvailableExercises(data);
    }
  };

  // Holt die Trainings-Historie
  const fetchLogs = async () => {
    const res = await fetch(`${API_URL}/api/logs`, { credentials: 'include' });
    if(res.ok) {
      const data = await res.json();
      setLogs(data);
    }
  };

  // --- LOGIK-FUNKTIONEN ---

  // Fügt dem aktuell erstellten Trainingsplan eine neue Übung hinzu (noch nicht in der DB gespeichert)
  const handleAddExercise = () => {
    // Clientseitige Validierung der Formular-Eingaben
    if (!exName || !exSets || !exReps) {
      return alert('Bitte fülle Übungsname, Sätze und Wiederholungen aus.');
    }
    if (Number(exSets) <= 0 || Number(exReps) <= 0) {
      return alert('Sätze und Wiederholungen müssen positiv sein.');
    }
    if (Number(exWeight) < 0) {
      return alert('Gewicht darf nicht negativ sein.');
    }
    
    // Sucht die Übung in der JSON-Liste, um zusätzliche Infos (wie Zielmuskel) zu bekommen
    const exObj = availableExercises.find((e: any) => e.name === exName);
    
    setPendingExercises([...pendingExercises, {
      name: exName,
      sets: Number(exSets),
      reps: Number(exReps),
      weight: Number(exWeight) || 0,
      bodyPart: exObj?.bodyPart || '',
      target: exObj?.target || '',
      imageUrl: exImageUrl
    }]);
    
    // Felder nach dem Hinzufügen wieder leeren
    setExName(''); setExSets(''); setExReps(''); setExWeight(''); setExImageUrl('');
  };

  // Speichert den komplett fertigen Trainingsplan in der Datenbank
  const handleSaveWorkout = async () => {
    // Clientseitige Validierung vor dem Speichern
    if (!title || title.trim() === '') {
      return alert('Fehler: Bitte gib einen Titel für das Workout ein.');
    }
    if (pendingExercises.length === 0) {
      return alert('Fehler: Bitte füge mindestens eine Übung zum Workout hinzu.');
    }
    
    const newWorkout = { title, notes, exercises: pendingExercises };
    
    await fetch(`${API_URL}/api/workouts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newWorkout), // Schickt die Daten als JSON-Text an den Server
      credentials: 'include'
    });
    
    // Formular aufräumen und die Liste neu vom Server laden
    setTitle(''); setNotes(''); setPendingExercises([]);
    fetchWorkouts();
  };

  // Löscht einen Trainingsplan
  const handleDeleteWorkout = async (id: string) => {
    if (!confirm('Wirklich löschen?')) return; // Sicherheits-Abfrage
    await fetch(`${API_URL}/api/workouts/${id}`, { method: 'DELETE', credentials: 'include' });
    fetchWorkouts();
    fetchLogs();
  };

  // Öffnet das "Training Starten" Fenster und bereitet die Eingabefelder vor
  const openExecution = (w: any) => {
    setExecutionWorkout(w);
    setExecutionData(w.exercises.map((ex: any) => ({
      name: ex.name,
      actualSets: ex.sets,
      actualReps: ex.reps,
      actualWeight: ex.weight,
      difficulty: 7, // Standard-Anstrengung (RPE)
      imageUrl: ex.imageUrl
    })));
  };

  // Speichert das abgeschlossene Training in der Datenbank (für das Diagramm)
  const submitExecution = async () => {
    if(!executionWorkout) return;
    
    // Clientseitige Validierung der Log-Eingaben
    for (const ex of executionData) {
      if (ex.actualSets < 0 || ex.actualReps < 0 || ex.actualWeight < 0) {
        return alert('Fehler: Bitte gib keine negativen Zahlen für Sätze, Wiederholungen oder Gewicht ein.');
      }
      if (ex.difficulty < 1 || ex.difficulty > 10) {
        return alert('Fehler: RPE (Anstrengung) muss zwischen 1 und 10 liegen.');
      }
    }

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
    setExecutionWorkout(null); // Schließt das Fenster
    fetchLogs(); // Aktualisiert das Diagramm
  };

  // --- DIAGRAMM BERECHNUNGEN (useMemo sorgt dafür, dass nur bei Bedarf neu gerechnet wird) ---
  
  // Sammelt alle einzigartigen Übungen aus der Historie für das Dropdown-Menü
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

  // Berechnet die Daten für den Liniengraph (entweder Gesamtarbeit oder spezifisches Gewicht)
  const chartData = useMemo(() => {
    const data: any[] = [];
    logs.forEach(log => {
      const date = new Date(log.date).toLocaleDateString('de-DE'); // Datum für die X-Achse
      
      if (chartFilter === 'all') {
        // Gesamtvolumen = Sätze * Wiederholungen * Gewicht
        const totalVolume = log.exercises.reduce((sum: number, ex: any) => sum + (ex.actualSets * ex.actualReps * ex.actualWeight), 0);
        data.push({ date, value: totalVolume });
      } else {
        // Filter nach einer spezifischen Übung
        const [wId, exName] = chartFilter.split('|');
        if (log.workoutId === wId) {
          const ex = log.exercises.find((e: any) => e.name === exName);
          if (ex) data.push({ date, value: ex.actualWeight });
        }
      }
    });
    return data;
  }, [logs, chartFilter]);

  // --- RENDER-LOGIK (Was sieht der Nutzer auf dem Bildschirm?) ---

  // Zeige Ladebildschirm, während geprüft wird ob Nutzer eingeloggt ist
  if (isPending) {
    return <div className="p-8 text-center mt-20">Laden...</div>;
  }

  // Zeige den Login-Screen (Auth-Komponente), wenn kein Nutzer gefunden wurde
  if (!session) {
    return <Auth onLogin={() => window.location.reload()} />;
  }

  // Das Haupt-Dashboard für eingeloggte Nutzer
  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8">
      {/* KOPFZEILE (Header) */}
      <header className="flex justify-between items-center pb-4 border-b">
        <div className="flex items-center gap-3">
          <div className="bg-primary p-2 rounded-lg text-primary-foreground">
            {/* Hantel SVG Icon */}
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 4v16"/><path d="M18 4v16"/><path d="M4 8h16"/><path d="M4 16h16"/><path d="M2 12h20"/></svg>
          </div>
          <h1 className="text-3xl font-sans font-black tracking-tighter uppercase italic">
            Iron<span className="text-primary">Track</span>
          </h1>
        </div>
        <Button variant="outline" onClick={async () => {
          await authClient.signOut();
          window.location.reload();
        }}>Abmelden</Button>
      </header>

      {/* HAUPT-INHALTSBEREICH (Grid-Layout: Links Formular, Rechts Liste & Chart) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* LINKE SPALTE: FORMULAR ZUM ERSTELLEN VON WORKOUTS */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Neues Workout</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Titel & Notizen Inputs */}
              <div className="space-y-2">
                <Label>Titel</Label>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="z.B. Push Day" />
              </div>
              <div className="space-y-2">
                <Label>Notizen</Label>
                <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Wie hast du dich gefühlt?" />
              </div>

              {/* Übungs-Hinzufügen-Box */}
              <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg space-y-4">
                <h4 className="font-medium text-sm">Übungen hinzufügen</h4>
                
                {/* Liste der bereits hinzugefügten, aber noch nicht gespeicherten Übungen */}
                {pendingExercises.length > 0 && (
                  <ul className="space-y-2 mb-4">
                    {pendingExercises.map((ex, i) => (
                      <li key={i} className="text-xs bg-background p-2 rounded border flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          {ex.imageUrl && <img src={ex.imageUrl} className="w-8 h-8 object-cover rounded" alt="thumb" />}
                          <span>{ex.name}</span>
                        </div>
                        <span>{ex.sets}x{ex.reps} @ {ex.weight}kg</span>
                      </li>
                    ))}
                  </ul>
                )}

                {/* Eingabefelder für eine neue Übung */}
                <div className="flex gap-2">
                  <Select value={exMuscleFilter} onValueChange={(val) => setExMuscleFilter(val || 'all')}>
                    <SelectTrigger className="w-[140px]">
                      <span className="truncate">{exMuscleFilter === 'all' ? 'Alle Muskeln' : exMuscleFilter}</span>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle Muskeln</SelectItem>
                      {uniqueMuscleGroups.map(group => (
                        <SelectItem key={group} value={group}>{group}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Input 
                    className="flex-1"
                    list="exercise-list"
                    placeholder="Übung eingeben/wählen..." 
                    value={exName} 
                    onChange={(e) => setExName(e.target.value)} 
                  />
                </div>
                {/* Datalist ermöglicht das Dropdown mit Vorschlägen aus unserer JSON */}
                <datalist id="exercise-list">
                  {filteredExercises.map(ex => (
                    <option key={ex.id || ex.name} value={ex.name} />
                  ))}
                </datalist>
                <div className="grid grid-cols-3 gap-2">
                  <Input placeholder="Sätze" type="number" value={exSets} onChange={e => setExSets(e.target.value)} />
                  <Input placeholder="Wdh." type="number" value={exReps} onChange={e => setExReps(e.target.value)} />
                  <Input placeholder="kg" type="number" value={exWeight} onChange={e => setExWeight(e.target.value)} />
                </div>
                <Input placeholder="Bild-URL (Optional)" type="url" value={exImageUrl} onChange={e => setExImageUrl(e.target.value)} />
                
                <Button variant="secondary" className="w-full" onClick={handleAddExercise}>Hinzufügen</Button>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={handleSaveWorkout}>Workout Speichern</Button>
            </CardFooter>
          </Card>
        </div>

        {/* RECHTE SPALTE: LISTE ALLER WORKOUTS & DIAGRAMM */}
        <div className="md:col-span-2 space-y-8">
          
          {/* WORKOUT LISTE */}
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
                        <CardTitle className="text-primary">{w.title}</CardTitle>
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
                              <TableCell className="font-medium flex items-center gap-2">
                                {ex.imageUrl && <img src={ex.imageUrl} className="w-8 h-8 object-cover rounded" alt="thumb" />}
                                {ex.name}
                              </TableCell>
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

          {/* FORTSCHRITTS-DIAGRAMM */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Fortschritt (Gewicht)</h2>
              
              {/* Filter-Dropdown für das Diagramm */}
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
              {/* Recharts Liniengraph */}
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

      {/* TRAINING STARTEN - POPUP (MODAL) */}
      <Dialog open={!!executionWorkout} onOpenChange={(open) => !open && setExecutionWorkout(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{executionWorkout?.title} starten</DialogTitle>
            <DialogDescription>Trage deine geschafften Werte ein.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-4">
            {executionData.map((ex, i) => (
              <div key={i} className="p-4 border rounded-lg space-y-4">
                <div className="flex gap-4 items-start">
                  {ex.imageUrl && (
                    <img src={ex.imageUrl} alt={ex.name} className="w-20 h-20 object-cover rounded-md" />
                  )}
                  <h4 className="font-medium">{ex.name}</h4>
                </div>
                {/* Felder zum Eintragen des aktuellen Trainings */}
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
                    <Input type="number" min="1" max="10" value={ex.difficulty} onChange={e => {
                      const newData = [...executionData];
                      let val = Number(e.target.value);
                      if (val > 10) val = 10;
                      newData[i].difficulty = val;
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
