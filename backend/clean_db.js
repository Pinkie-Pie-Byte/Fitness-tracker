const mongoose = require('mongoose');
const fs = require('fs');
require('dotenv').config({ path: 'backend/.env' });

const workoutSchema = new mongoose.Schema({
  title: String,
  exercises: [{ name: String, sets: Number, reps: Number, weight: Number }]
}, { strict: false });
const Workout = mongoose.model('Workout', workoutSchema);

const workoutLogSchema = new mongoose.Schema({
  workoutId: String,
  workoutTitle: String,
  exercises: [{ name: String, actualSets: Number, actualReps: Number, actualWeight: Number, difficulty: Number }]
}, { strict: false });
const WorkoutLog = mongoose.model('WorkoutLog', workoutLogSchema);

async function cleanData() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected.');
  
  const cleanName = (name) => {
    if (!name) return name;
    let n = name;
    n = n.replace(/\s+mit\s+.*$/, '');
    n = n.replace(/\s+im\s+.*$/, '');
    n = n.replace(/\s+-\s+.*$/, '');
    return n;
  };

  const workouts = await Workout.find();
  for (let w of workouts) {
    let changed = false;
    for (let ex of w.exercises) {
      const newName = cleanName(ex.name);
      if (newName !== ex.name) {
        ex.name = newName;
        changed = true;
      }
    }
    if (changed) {
      await w.save();
      console.log('Updated workout', w.title);
    }
  }

  const logs = await WorkoutLog.find();
  for (let log of logs) {
    let changed = false;
    for (let ex of log.exercises) {
      const newName = cleanName(ex.name);
      if (newName !== ex.name) {
        ex.name = newName;
        changed = true;
      }
    }
    if (changed) {
      await log.save();
      console.log('Updated log', log._id);
    }
  }

  console.log('Done.');
  process.exit(0);
}

cleanData();
