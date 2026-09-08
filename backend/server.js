require('dotenv').config(); 
const express = require('express'); 
const mongoose = require('mongoose'); 
const cors = require('cors'); 
const fs = require('fs'); 
const { betterAuth } = require('better-auth'); 
const { mongodbAdapter } = require('@better-auth/mongo-adapter'); 
const { toNodeHandler } = require('better-auth/node'); 
const app = express(); 
app.use(express.json()); 
app.use(cors({ origin: true, credentials: true })); 

// --- DATENMODELL (MongoDB Schema) ---
const workoutSchema = new mongoose.Schema({
  userId: { type: String, required: true }, 
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
    imageUrl: String 
  }]
});
const Workout = mongoose.model('Workout', workoutSchema); 
const workoutLogSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  workoutId: String, 
  workoutTitle: String,
  date: { type: Date, default: Date.now }, 
  exercises: [{
    name: String,
    actualSets: Number,
    actualReps: Number,
    actualWeight: Number,
    difficulty: Number, 
    imageUrl: String
  }]
});
const WorkoutLog = mongoose.model('WorkoutLog', workoutLogSchema); 

// Übungsliste wird einmal beim Serverstart eingelesen (statt bei jedem Request)
const exerciseList = JSON.parse(fs.readFileSync(__dirname + '/bodybuilding_top_200.json', 'utf8'));

// Helfer für Zahlen-Validierung
const isPositive = (value) => typeof value === 'number' && value > 0;
const isNonNegative = (value) => typeof value === 'number' && value >= 0;

async function startServer() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Datenbank verbunden!');
    const db = mongoose.connection.getClient().db();
    
    const auth = betterAuth({
      database: mongodbAdapter(db), 
      emailAndPassword: {
        enabled: true, 
      },
      baseURL: process.env.FRONTEND_URL || "http://localhost:5000",
      advanced: {
        defaultCookieAttributes: {
          sameSite: "none", 
          secure: true 
        }
      },
      trustedOrigins: ["http://localhost:5173", process.env.FRONTEND_URL].filter(Boolean)
    });
    
    app.use('/api/auth', toNodeHandler(auth));

    const requireAuth = async (req, res, next) => {
      const session = await auth.api.getSession({ headers: req.headers });
      if (!session || !session.user) {
        return res.status(401).json({ error: 'Nicht eingeloggt' }); 
      }
      req.user = session.user; 
      next(); 
    };

    app.get('/api/exercises', (req, res) => {
      res.json(exerciseList);
    });
    
    app.use('/api/workouts', requireAuth);
    app.use('/api/logs', requireAuth);
    
    app.get('/api/workouts', async (req, res) => {
      const workouts = await Workout.find({ userId: req.user.id }).sort({ createdAt: -1 });
      res.json(workouts);
    });
    
    // Gemeinsame Validierung für Erstellen und Bearbeiten von Workouts
    const validateWorkoutPayload = (title, exercises) => {
      if (!title || typeof title !== 'string' || title.trim() === '') {
        return 'Titel ist ein Pflichtfeld und darf nicht leer sein.';
      }
      if (!exercises || !Array.isArray(exercises) || exercises.length === 0) {
        return 'Ein Trainingsplan muss mindestens eine Übung enthalten.';
      }
      for (const ex of exercises) {
        if (!ex.name || typeof ex.name !== 'string') return 'Jede Übung benötigt einen gültigen Namen.';
        if (!isPositive(ex.sets) || !isPositive(ex.reps)) return 'Sätze und Wiederholungen müssen positive Zahlen sein.';
        if (!isNonNegative(ex.weight)) return 'Das Gewicht darf nicht negativ sein.';
      }
      return null;
    };

    app.post('/api/workouts', async (req, res) => {
      const { title, exercises } = req.body;
      const validationError = validateWorkoutPayload(title, exercises);
      if (validationError) return res.status(400).json({ error: validationError });
      try {
        const workout = await Workout.create({ ...req.body, userId: req.user.id });
        res.json(workout);
      } catch (err) {
        res.status(500).json({ error: 'Interner Serverfehler beim Speichern.' });
      }
    });
    
    app.put('/api/workouts/:id', async (req, res) => {
      const { title, notes, exercises } = req.body;
      const validationError = validateWorkoutPayload(title, exercises);
      if (validationError) return res.status(400).json({ error: validationError });
      try {
        const updatedWorkout = await Workout.findOneAndUpdate(
          { _id: req.params.id, userId: req.user.id },
          { title, notes, exercises },
          { new: true }
        );
        if (!updatedWorkout) {
          return res.status(404).json({ error: 'Workout wurde nicht gefunden.' });
        }
        res.json(updatedWorkout);
      } catch (err) {
        res.status(500).json({ error: 'Interner Serverfehler beim Aktualisieren.' });
      }
    });
    
    app.delete('/api/workouts/:id', async (req, res) => {
      try {
        await Workout.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
        await WorkoutLog.deleteMany({ workoutId: req.params.id, userId: req.user.id });
        res.json({ message: 'Erfolgreich gelöscht' });
      } catch (err) {
        res.status(500).json({ error: 'Interner Serverfehler beim Löschen.' });
      }
    });
    
    app.get('/api/logs', async (req, res) => {
      const logs = await WorkoutLog.find({ userId: req.user.id }).sort({ date: 1 });
      res.json(logs);
    });
    
    app.post('/api/logs', async (req, res) => {
      const { workoutId, exercises } = req.body;
      if (!workoutId) return res.status(400).json({ error: 'Workout-ID fehlt.' });
      if (!exercises || !Array.isArray(exercises) || exercises.length === 0) {
        return res.status(400).json({ error: 'Es muss mindestens eine geloggte Übung übergeben werden.' });
      }
      for (const ex of exercises) {
        if (!isNonNegative(ex.actualSets) || !isNonNegative(ex.actualReps) || !isNonNegative(ex.actualWeight)) {
          return res.status(400).json({ error: 'Werte für Sätze, Wiederholungen und Gewicht dürfen nicht negativ sein.' });
        }
        if (ex.difficulty < 1 || ex.difficulty > 10) {
          return res.status(400).json({ error: 'RPE muss zwischen 1 und 10 liegen.' });
        }
      }
      try {
        const log = await WorkoutLog.create({ ...req.body, userId: req.user.id });
        res.json(log);
      } catch (err) {
        res.status(500).json({ error: 'Interner Serverfehler beim Speichern des Logs.' });
      }
    });
    
    app.listen(process.env.PORT || 5000, () => {
      console.log('Server läuft auf Port ' + (process.env.PORT || 5000));
    });
  } catch (err) {
    console.error('Startfehler:', err); 
  }
}
startServer();
