# IronTrack - Fitness Tracker 🏋️‍♂️

Ein modernes, webbasiertes Fitness-Tracking-Tool zur Erstellung von Trainingsplänen und zur Dokumentation des Trainingsfortschritts. Entstanden als Schulprojekt.

## 🚀 Live Demo
Die App ist bereits live im Internet erreichbar:
- **Frontend (App):** [https://fitness-tracker-five-henna.vercel.app/](https://fitness-tracker-five-henna.vercel.app/)

## 🛠️ Tech Stack (MERN)
Dieses Projekt wurde als moderne **Client-Server-Architektur** im klassischen MERN-Stack umgesetzt:
- **M**ongoDB (Datenbank in der Cloud für Nutzer, Workouts und Trainings-Logs)
- **E**xpress.js (API-Framework für das Backend)
- **R**eact / Vite (Frontend Benutzeroberfläche)
- **N**ode.js (Laufzeitumgebung für das Backend auf Render.com)

**Zusätzlich verwendete Technologien:**
- **Tailwind CSS & Shadcn UI:** Für ein modernes, ansprechendes und responsives Design.
- **Better-Auth:** Für eine sichere Nutzer-Authentifizierung (Login/Registrierung) inkl. Cross-Domain Cookie-Handling.
- **Recharts:** Für die grafische Darstellung des Trainingsfortschritts (Liniendiagramme).

## 📐 Architektur & Code-Struktur
Um den Code für dieses Projekt maximal übersichtlich und gut verständlich zu halten, wurde bewusst auf die üblichen, sehr komplexen Ordnerstrukturen (wie separate Controller, Models, Routes) verzichtet:

1. **Backend (`backend/server.js`):** 
   Das komplette Backend (Datenbankmodelle, Routen, Login-Middleware) befindet sich kompakt und stark kommentiert in einer einzigen Datei.
2. **Frontend (`frontend/src/App.tsx`):** 
   Die gesamte Hauptlogik des Frontends (API-Aufrufe, State-Management, Formulare und Diagramme) ist zentral in einer Datei gebündelt. 
3. **Kommentare:** 
   Alle wichtigen Logik-Schritte im Code wurden detailliert auf Deutsch kommentiert, um die Funktionalität für jeden leicht nachvollziehbar zu machen.

## 💡 Hauptfunktionen
- **Authentifizierung:** Nutzer können eigene Accounts erstellen und sich sicher einloggen.
- **Trainingspläne erstellen:** Eigene Workouts können aus einer Datenbank von 200 Bodybuilding-Übungen zusammengestellt werden.
- **Optionales Bildmaterial:** Zu jeder Übung kann eine Bild-URL für die korrekte Ausführung hinterlegt werden.
- **Training absolvieren:** Workouts können gestartet werden, um die tatsächlich geschafften Gewichte, Wiederholungen und Sätze (inkl. RPE-Schwierigkeit) einzutragen.
- **Fortschrittsanalyse:** Ein interaktives Liniendiagramm visualisiert das Gesamtvolumen oder den Kraftzuwachs einzelner Übungen über die Zeit.
