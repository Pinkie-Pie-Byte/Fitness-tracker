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
// TODO(gabriel): Refactor models into separate files once the schema grows
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
    secondaryMuscles: [String],
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
      fs.readFile(__dirname + '/bodybuilding_top_200.json', 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: 'Fehler beim Lesen' });
        res.json(JSON.parse(data));
      });
    });
    
    app.use('/api/workouts', requireAuth);
    app.use('/api/logs', requireAuth);
    
    app.get('/api/workouts', async (req, res) => {
      const workouts = await Workout.find({ userId: req.user.id }).sort({ createdAt: -1 });
      res.json(workouts);
    });
    
    app.post('/api/workouts', async (req, res) => {
      
      const { title, exercises } = req.body;
      if (!title || typeof title !== 'string' || title.trim() === '') {
        return res.status(400).json({ error: 'Titel ist ein Pflichtfeld und darf nicht leer sein.' });
      }
      if (!exercises || !Array.isArray(exercises) || exercises.length === 0) {
        return res.status(400).json({ error: 'Ein Trainingsplan muss mindestens eine Übung enthalten.' });
      }
      
      for (const ex of exercises) {
        if (!ex.name || typeof ex.name !== 'string') return res.status(400).json({ error: 'Jede Übung benötigt einen gültigen Namen.' });
        if (ex.sets <= 0 || ex.reps <= 0) return res.status(400).json({ error: 'Sätze und Wiederholungen müssen positive Zahlen sein.' });
        if (ex.weight < 0) return res.status(400).json({ error: 'Das Gewicht darf nicht negativ sein.' });
      }
      try {
        const workout = await Workout.create({ ...req.body, userId: req.user.id });
        res.json(workout);
      } catch (err) {
        res.status(500).json({ error: 'Interner Serverfehler beim Speichern.' });
      }
    });
    
    app.put('/api/workouts/:id', async (req, res) => {
      const updatedWorkout = await Workout.findOneAndUpdate(
        { _id: req.params.id, userId: req.user.id },
        req.body,
        { new: true } 
      );
      res.json(updatedWorkout);
    });
    
    app.delete('/api/workouts/:id', async (req, res) => {
      await Workout.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
      await WorkoutLog.deleteMany({ workoutId: req.params.id, userId: req.user.id });
      res.json({ message: 'Erfolgreich gelöscht' });
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
        if (ex.actualSets < 0 || ex.actualReps < 0 || ex.actualWeight < 0) {
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
