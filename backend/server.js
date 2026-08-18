require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const fs = require('fs');

const app = express();
app.use(express.json());
app.use(cors());


// --- DATENMODELL (MongoDB Schema) ---
const workoutSchema = new mongoose.Schema({
  title: String,
  notes: String,
  createdAt: { type: Date, default: Date.now },
  exercises: [{
    name: String,
    sets: Number,
    reps: Number,
    weight: Number,
    bodyPart: String,
    target: String,
    secondaryMuscles: [String]
  }]
});

const Workout = mongoose.model('Workout', workoutSchema);

// Schema für absolviertes Training (Log)
const workoutLogSchema = new mongoose.Schema({
  workoutId: String,
  workoutTitle: String,
  date: { type: Date, default: Date.now },
  exercises: [{
    name: String,
    actualSets: Number,
    actualReps: Number,
    actualWeight: Number,
    difficulty: Number // 1-10
  }]
});

const WorkoutLog = mongoose.model('WorkoutLog', workoutLogSchema);

// --- API ROUTEN ---

// 0. Alle 200 Bodybuilding-Übungen abrufen (aus der JSON Datei)
app.get('/api/exercises', (req, res) => {
  fs.readFile(__dirname + '/bodybuilding_top_200.json', 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Fehler beim Lesen der Übungsdatei' });
    }
    res.json(JSON.parse(data));
  });
});

// 1. Alle Workouts abrufen
app.get('/api/workouts', async (req, res) => {
  const workouts = await Workout.find().sort({ createdAt: -1 });
  res.json(workouts);
});

// 2. Ein neues Workout speichern
app.post('/api/workouts', async (req, res) => {
  const workout = await Workout.create(req.body);
  res.json(workout);
});

// 3. Ein Workout löschen
app.delete('/api/workouts/:id', async (req, res) => {
  await Workout.findByIdAndDelete(req.params.id);
  await WorkoutLog.deleteMany({ workoutId: req.params.id });
  res.json({ message: 'Erfolgreich gelöscht' });
});

// 4. Alle Trainings-Logs abrufen
app.get('/api/logs', async (req, res) => {
  const logs = await WorkoutLog.find().sort({ date: 1 }); // Aufsteigend für Graphen
  res.json(logs);
});

// 5. Ein absolviertes Training speichern
app.post('/api/logs', async (req, res) => {
  const log = await WorkoutLog.create(req.body);
  res.json(log);
});

// --- DATENBANK VERBINDEN & SERVER STARTEN ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Datenbank verbunden!');
    app.listen(process.env.PORT || 5000, () => {
      console.log('Server läuft auf Port 5000');
    });
  })
  .catch((err) => console.log(err));


