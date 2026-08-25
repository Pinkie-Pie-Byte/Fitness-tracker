require('dotenv').config(); // Lädt geheime Umgebungsvariablen (wie MONGO_URI)
const express = require('express'); // Express ist das Framework für unseren Server
const mongoose = require('mongoose'); // Mongoose hilft uns, mit der MongoDB-Datenbank zu sprechen
const cors = require('cors'); // CORS erlaubt es dem Frontend, mit dem Backend zu kommunizieren
const fs = require('fs'); // Erlaubt das Lesen von Dateien auf dem Server
const { betterAuth } = require('better-auth'); // Authentifizierungs-Bibliothek für den Login
const { mongodbAdapter } = require('@better-auth/mongo-adapter'); // Verbindet das Login-System mit MongoDB
const { toNodeHandler } = require('better-auth/node'); // Übersetzt den Login für unseren Express-Server

const app = express(); // Hier erstellen wir die eigentliche Server-App
app.use(express.json()); // Erlaubt dem Server, JSON-Daten zu verstehen (z.B. vom Frontend)
// Erlaubt Anfragen von überall und lässt das Senden von Cookies zu (wichtig für den Login)
app.use(cors({ origin: true, credentials: true })); 

// --- DATENMODELL (MongoDB Schema) ---
// Hier definieren wir, wie ein "Workout" (Trainingsplan) in der Datenbank aussehen soll
const workoutSchema = new mongoose.Schema({
  userId: { type: String, required: true }, // Gehört zu einem bestimmten Nutzer
  title: String, // Name des Plans (z.B. "Push Day")
  notes: String, // Notizen
  createdAt: { type: Date, default: Date.now }, // Wann wurde der Plan erstellt?
  exercises: [{ // Eine Liste von Übungen
    name: String,
    sets: Number, // Sätze
    reps: Number, // Wiederholungen
    weight: Number, // Gewicht in kg
    bodyPart: String,
    target: String,
    secondaryMuscles: [String],
    imageUrl: String // Optionales Bild für die Ausführung
  }]
});
const Workout = mongoose.model('Workout', workoutSchema); // Erstellt die Tabelle 'workouts'

// Hier definieren wir, wie ein absolviertes Training in der Datenbank gespeichert wird
const workoutLogSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  workoutId: String, // Welcher Trainingsplan wurde benutzt?
  workoutTitle: String,
  date: { type: Date, default: Date.now }, // Wann wurde trainiert?
  exercises: [{
    name: String,
    actualSets: Number,
    actualReps: Number,
    actualWeight: Number,
    difficulty: Number, // Wie anstrengend war es? (RPE)
    imageUrl: String
  }]
});
const WorkoutLog = mongoose.model('WorkoutLog', workoutLogSchema); // Erstellt die Tabelle 'workoutlogs'

// Wir starten den Server asynchron (async), damit wir warten können, bis die DB verbunden ist
async function startServer() {
  try {
    // 1. Verbindung zur Datenbank herstellen
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Datenbank verbunden!');

    const db = mongoose.connection.getClient().db();

    // 2. Login-System konfigurieren
    const auth = betterAuth({
      database: mongodbAdapter(db), // Speichert Nutzer in unserer MongoDB
      emailAndPassword: {
        enabled: true, // Erlaubt Login mit E-Mail und Passwort
      },
      baseURL: process.env.FRONTEND_URL || "http://localhost:5000",
      advanced: {
        defaultCookieAttributes: {
          sameSite: "none", // Erlaubt Cross-Domain Cookies (Vercel -> Render)
          secure: true // Nutzt sichere HTTPS-Verbindung für Cookies
        }
      },
      trustedOrigins: ["http://localhost:5173", process.env.FRONTEND_URL].filter(Boolean)
    });

    // 3. Login-Schnittstelle aktivieren (nimmt alle Anfragen an /api/auth entgegen)
    app.use('/api/auth', toNodeHandler(auth));

    // 4. Sicherheits-Türsteher (Middleware) für unsere Daten
    // Prüft, ob ein Nutzer eingeloggt ist, bevor er auf seine Daten zugreifen darf
    const requireAuth = async (req, res, next) => {
      const session = await auth.api.getSession({ headers: req.headers });
      if (!session || !session.user) {
        return res.status(401).json({ error: 'Nicht eingeloggt' }); // Fehler, wenn nicht eingeloggt
      }
      req.user = session.user; // Speichert den Nutzer für die spätere Verwendung
      next(); // Lässt den Nutzer passieren
    };

    // --- API ROUTEN ---

    // Holt die Liste der verfügbaren Übungen aus der lokalen JSON-Datei (muss nicht geschützt werden)
    app.get('/api/exercises', (req, res) => {
      fs.readFile(__dirname + '/bodybuilding_top_200.json', 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: 'Fehler beim Lesen' });
        res.json(JSON.parse(data));
      });
    });

    // Ab hier setzen wir unseren "Türsteher" vor die Routen (nur für eingeloggte User)
    app.use('/api/workouts', requireAuth);
    app.use('/api/logs', requireAuth);

    // ROUTE: Holt alle Trainingspläne des aktuellen Nutzers aus der Datenbank
    app.get('/api/workouts', async (req, res) => {
      const workouts = await Workout.find({ userId: req.user.id }).sort({ createdAt: -1 });
      res.json(workouts);
    });

    // ROUTE: Speichert einen neuen Trainingsplan in der Datenbank (Create)
    app.post('/api/workouts', async (req, res) => {
      const workout = await Workout.create({ ...req.body, userId: req.user.id });
      res.json(workout);
    });

    // ROUTE: Aktualisiert einen bestehenden Trainingsplan (Update - wichtig für CRUD!)
    app.put('/api/workouts/:id', async (req, res) => {
      const updatedWorkout = await Workout.findOneAndUpdate(
        { _id: req.params.id, userId: req.user.id },
        req.body,
        { new: true } // Gibt das aktualisierte Objekt zurück
      );
      res.json(updatedWorkout);
    });

    // ROUTE: Löscht einen Trainingsplan und die dazugehörigen Trainings-Logs (Delete)
    app.delete('/api/workouts/:id', async (req, res) => {
      await Workout.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
      await WorkoutLog.deleteMany({ workoutId: req.params.id, userId: req.user.id });
      res.json({ message: 'Erfolgreich gelöscht' });
    });

    // ROUTE: Holt alle absolvierten Trainings-Logs des Nutzers
    app.get('/api/logs', async (req, res) => {
      const logs = await WorkoutLog.find({ userId: req.user.id }).sort({ date: 1 });
      res.json(logs);
    });

    // ROUTE: Speichert ein neu absolviertes Training
    app.post('/api/logs', async (req, res) => {
      const log = await WorkoutLog.create({ ...req.body, userId: req.user.id });
      res.json(log);
    });

    // 5. Server hochfahren
    app.listen(process.env.PORT || 5000, () => {
      console.log('Server läuft auf Port ' + (process.env.PORT || 5000));
    });

  } catch (err) {
    console.error('Startfehler:', err); // Falls etwas schiefgeht (z.B. keine DB-Verbindung)
  }
}

// Führt die Start-Funktion aus
startServer();
