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
app.use(cors({ origin: true, credentials: true })); // credentials true is important for auth cookies

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
    secondaryMuscles: [String]
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
    difficulty: Number
  }]
});
const WorkoutLog = mongoose.model('WorkoutLog', workoutLogSchema);

// Wir starten den Server asynchron, damit wir zuerst die DB verbinden können
async function startServer() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Datenbank verbunden!');

    const db = mongoose.connection.getClient().db();

    // --- AUTH SETUP ---
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
      // Wir erlauben alle origins als vertrauenswürdig für die Cookies im Dev-Modus
      trustedOrigins: ["http://localhost:5173", process.env.FRONTEND_URL].filter(Boolean)
    });

    // Auth Middleware: fängt alle /api/auth Anfragen ab (angepasst für Express 5)
    app.use('/api/auth', toNodeHandler(auth));

    // Eigene Middleware zur Session-Prüfung für die restlichen API-Routen
    const requireAuth = async (req, res, next) => {
      const session = await auth.api.getSession({ headers: req.headers });
      if (!session || !session.user) {
        return res.status(401).json({ error: 'Nicht eingeloggt' });
      }
      req.user = session.user;
      next();
    };

    // --- API ROUTEN ---
    app.get('/api/exercises', (req, res) => {
      fs.readFile(__dirname + '/bodybuilding_top_200.json', 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: 'Fehler beim Lesen' });
        res.json(JSON.parse(data));
      });
    });

    // Ab hier sind alle Routen geschützt
    app.use('/api/workouts', requireAuth);
    app.use('/api/logs', requireAuth);

    app.get('/api/workouts', async (req, res) => {
      const workouts = await Workout.find({ userId: req.user.id }).sort({ createdAt: -1 });
      res.json(workouts);
    });

    app.post('/api/workouts', async (req, res) => {
      const workout = await Workout.create({ ...req.body, userId: req.user.id });
      res.json(workout);
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
      const log = await WorkoutLog.create({ ...req.body, userId: req.user.id });
      res.json(log);
    });

    app.listen(process.env.PORT || 5000, () => {
      console.log('Server läuft auf Port ' + (process.env.PORT || 5000));
    });

  } catch (err) {
    console.error('Startfehler:', err);
  }
}

startServer();

