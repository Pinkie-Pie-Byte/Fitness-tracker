# Projektdokumentation: IronTrack - MERN Fitness-Tracker

## 1. Einleitung und Management Summary
### 1.1 Ausgangslage und Problemstellung
Die Dokumentation des eigenen Krafttrainings ist für einen kontinuierlichen Muskelaufbau (Progressive Overload) essenziell. Viele existierende Fitness-Apps auf dem Markt sind jedoch entweder mit unnötigen Social-Media-Funktionen überladen, hinter teuren Paywalls versteckt oder schlichtweg zu kompliziert für die schnelle Nutzung während eines harten Trainings. Der Rückgriff auf Zettel und Stift oder unstrukturierte Notizen-Apps auf dem Smartphone macht eine nachträgliche Auswertung der Daten nahezu unmöglich. 

### 1.2 Zielsetzung
Mit "IronTrack" wurde eine performante Single Page Application (SPA) entwickelt, die sich auf das Wesentliche konzentriert: Das schnelle Erstellen von Trainingsplänen und das unkomplizierte Tracken von Trainingsgewichten. Ziel dieses Schulprojekts war es, den kompletten Lifecycle einer modernen Full-Stack-Applikation im **MERN-Stack** (MongoDB, Express, React, Node.js) zu durchlaufen – von der ersten Konzeption des Datenmodells bis hin zum Live-Deployment in der Cloud.


## 2. Technologische Architektur (Tech-Stack)
Das Projekt basiert auf einer strikten Client-Server-Architektur, um Frontend (Darstellung) und Backend (Geschäftslogik & Datenspeicherung) sauber voneinander zu trennen. Die Grundlage bilden die Kerntechnologien des Webs: **HTML5, CSS3 und JavaScript/TypeScript**.

### 2.1 Das Frontend (Client)
- **React & Vite:** Das Frontend wurde als SPA konzipiert. React (via Vite) sorgt für ein extrem schnelles Neuladen der Komponenten, ohne dass die gesamte Webseite bei jedem Klick neu vom Server angefragt werden muss.
- **Tailwind CSS & Shadcn UI:** Um dem Projekt ein modernes, zeitgemäßes Design zu geben, ohne den Code mit tausenden Zeilen CSS zu belasten, wurde das Utility-First-Framework Tailwind genutzt. Shadcn UI lieferte vorgefertigte, barrierefreie UI-Komponenten (wie Modals, Buttons, Inputs).
- **Recharts:** Eine Chart-Bibliothek zur Visualisierung des Trainingsfortschritts in Form von dynamischen Liniendiagrammen.

### 2.2 Das Backend (Server & API)
- **Node.js & Express.js:** Ein leichtgewichtiges JavaScript-Framework, welches die RESTful-API bereitstellt. Um die Architektur bewusst schlank zu halten, wurde die gesamte Backend-Logik hochgradig effizient in einer einzigen Datei (`server.js`) zusammengefasst.
- **Better-Auth:** Ein modernes Authentifizierungs-Framework, welches die sichere Handhabung von Sessions, Passwörtern (Hashing) und Cookies (inklusive Cross-Site-Cookie-Handling) übernimmt.

### 2.3 Die Datenbank (Persistenz)
- **MongoDB (via Mongoose):** Eine dokumentenorientierte NoSQL-Datenbank. Mongoose wurde als Object Data Modeling (ODM) Bibliothek genutzt, um strenge Schemata (Baupläne) für die Datenstrukturen zu definieren.

### 2.4 Cloud & Deployment
- **Vercel:** Hosting des Frontends. Vercel dient zudem als Reverse-Proxy (`vercel.json`), um API-Anfragen direkt an das Backend weiterzuleiten, wodurch komplexe CORS-Fehler (Cross-Origin Resource Sharing) im Browser elegant umgangen wurden.
- **Render.com:** Hosting der Node.js Backend-Laufzeitumgebung.
- **MongoDB Atlas:** Cloud-Speicher für die Datenbank.


## 3. Datenmodellierung (Schema-Design)
Die Datenbank besteht aus drei zentralen Entitäten. Zwischen dem `User` und den `Workouts` bzw. `WorkoutLogs` besteht jeweils eine **1:n-Beziehung** (Ein Nutzer kann viele Workouts besitzen). 

### 3.1 User-Schema (Generiert durch Better-Auth)
Verwaltet die grundlegenden Nutzerdaten und Sitzungen.
- `_id`: String (Primary Key)
- `email`: String (Unique)
- `password`: String (Hashed)
- `createdAt`: Date

### 3.2 Workout-Schema (Der Trainingsplan)
Repräsentiert die theoretische Struktur eines Trainings, so wie der Nutzer es geplant hat.
- `_id`: ObjectId (Primary Key)
- `userId`: String (Foreign Key -> User)
- `title`: String (z.B. "Oberkörper Tag 1")
- `notes`: String (Zusätzliche Notizen)
- `createdAt`: Date (Default: `Date.now`)
- `exercises`: Array von Objekten. Jedes Objekt enthält:
  - `name`: String (z.B. "Bankdrücken")
  - `sets`: Number (Ziel-Sätze)
  - `reps`: Number (Ziel-Wiederholungen)
  - `weight`: Number (Ziel-Gewicht in kg)
  - `bodyPart`, `target`: String (Muskelgruppen)
  - `imageUrl`: String (Optional, für visuelle Hilfestellungen)

### 3.3 WorkoutLog-Schema (Die tatsächliche Ausführung)
Sobald ein Nutzer ein Workout absolviert, wird ein Log-Eintrag generiert. Dieser speichert die *tatsächlich* erbrachte Leistung an einem spezifischen Datum.
- `_id`: ObjectId (Primary Key)
- `userId`: String (Foreign Key -> User)
- `workoutId`: String (Foreign Key -> Workout)
- `workoutTitle`: String
- `date`: Date (Der Zeitpunkt des Trainings)
- `exercises`: Array von Objekten. Jedes Objekt enthält:
  - `name`: String
  - `actualSets`: Number (Geschaffte Sätze)
  - `actualReps`: Number (Geschaffte Wiederholungen)
  - `actualWeight`: Number (Bewegtes Gewicht)
  - `difficulty`: Number (RPE - Rate of Perceived Exertion)


## 4. API-Struktur und Endpunkte
Das Backend kommuniziert über eine RESTful-API, die Daten im JSON-Format austauscht. Zur Qualitätssicherung wurden alle Endpunkte (Endpoints) während der Entwicklung systematisch auf korrekte Statuscodes und Payload-Verarbeitung getestet (z.B. über Postman/Insomnia).
Alle folgenden Routen (mit Ausnahme von `/api/exercises`) sind durch eine serverseitige Middleware (`requireAuth`) geschützt. Unbefugte Anfragen ohne gültigen Auth-Cookie werden serverseitig mit dem HTTP Status Code `401 Unauthorized` abgelehnt.

### 4.1 Authentifizierung (Verwaltet durch Better-Auth)
- `POST /api/auth/sign-in` (Login)
- `POST /api/auth/sign-up` (Registrierung)
- `POST /api/auth/sign-out` (Sitzung beenden)

### 4.2 Workouts (Vollständige CRUD-Operationen)
- **Create:** `POST /api/workouts`
  - *Request Body:* `{ title, notes, exercises }`
  - *Response:* Das neu erstellte Workout-Dokument aus MongoDB.
- **Read:** `GET /api/workouts`
  - *Response:* Ein Array aller Workouts, die zur `userId` der aktuellen Sitzung gehören (sortiert nach Erstelldatum).
- **Update:** `PUT /api/workouts/:id`
  - *Request Body:* Geänderte Felder (z.B. `{ title: "Neuer Titel" }`)
  - *Response:* Das aktualisierte Workout-Dokument.
- **Delete:** `DELETE /api/workouts/:id`
  - *Wirkung:* Löscht das Workout. Löscht kaskadierend alle `WorkoutLogs`, die mit diesem Workout verknüpft sind, um verwaiste Daten (Orphans) zu vermeiden.

### 4.3 Logs & Analyse
- **Create:** `POST /api/logs`
  - *Wirkung:* Speichert ein neu absolviertes Training.
- **Read:** `GET /api/logs`
  - *Response:* Ein Array aller Trainingshistorien des Nutzers, welches im Frontend vom Chart-Modul (Recharts) aggregiert wird, um das Gesamtvolumen (Sätze * Wiederholungen * Gewicht) zu berechnen.

### 4.4 Statische Daten
- **Read:** `GET /api/exercises`
  - *Wirkung:* Liest lokal die Datei `bodybuilding_top_200.json` aus und stellt dem Frontend eine Datenbank aus über 200 standardisierten Bodybuilding-Übungen zur Verfügung, um beim Erstellen von Plänen Vorschläge (Autocomplete) bieten zu können.

### 4.5 Qualitätssicherung (API-Testing mit Postman)
Entsprechend den Projektvorgaben wurden alle Backend-Endpunkte vor der Integration in das React-Frontend intensiv mit der Software **Postman** getestet.
1. **Authentifizierungstest:** Zunächst wurde ein POST-Request an `/api/auth/sign-in` gesendet, um einen gültigen Session-Cookie zu erhalten.
2. **CRUD-Tests:** Anschließend wurden POST, GET, PUT und DELETE Requests gegen die `/api/workouts`- und `/api/logs`-Routen gefeuert. 
3. **Validierungstests:** Es wurden bewusst unvollständige Requests (z.B. Workouts ohne Titel oder Logs mit negativen Gewichten) via Postman gesendet, um zu verifizieren, dass das Backend diese mit dem Statuscode `400 Bad Request` und einer sprechenden Fehlermeldung ablehnt.
4. **Autorisierungstest:** Anfragen ohne vorherigen Login wurden erfolgreich mit `401 Unauthorized` vom System geblockt.


## 5. Reflexion zum KI-Einsatz
Entsprechend der Projektvorgaben wurden KI-Tools als Assistenz zur Effizienzsteigerung eingesetzt. Die KI fungierte hierbei primär als "Pair-Programming"-Partner und technischer Berater. 

**Einsatzgebiete:**
- Unterstützung beim initialen Architektur-Setup und der Behebung von Infrastruktur-Hürden (z.B. Erarbeitung der Vercel-Reverse-Proxy-Lösung für Cross-Domain Cookies).
- Zeitersparnis beim Schreiben von repetitiven Styling-Klassen (Tailwind CSS) und der Generierung von UI-Boilerplate (Shadcn UI).
- Generierung von Testdaten (JSON mit Bodybuilding-Übungen).

**Validierung & Eigenleistung:**
Um sicherzustellen, dass die konzeptionelle Arbeit und das Systemverständnis vollständig bei uns als Entwicklern verbleibt, wurde nach einer strengen Richtlinie gearbeitet: Die grundlegende Struktur (das MERN-Konzept, die Wahl der REST-Architektur und das Datenbank-Schema) lag vollständig in unserer Verantwortung. Jeder mithilfe von KI generierte Code-Block musste von uns konzeptionell geprüft, verstanden und anschließend im Code auf Deutsch kommentiert werden. Code, dessen Logik wir nicht vollumfänglich nachvollziehen konnten, wurde konsequent abgelehnt. Dieses Vorgehen garantierte, dass wir die Anwendung als Ganzes verstehen, warten und bei Fehlern eigenständig debuggen können.


## 6. Persönliches Fazit und Lernerfolge
Das Projekt "IronTrack" markierte für uns den entscheidenden Übergang vom reinen Konsumieren von "Tutorials" hin zur eigenständigen Problemlösung. 

*Erkenntnisse der Architektur:*
Besonders stolz sind wir auf die extrem saubere und minimalistische Architektur. Anstatt uns in hunderten von Einzelfiles (Controllers, Routers, Services) zu verlieren, haben wir bewiesen, dass man ein voll funktionsfähiges, sicheres und robustes Backend in einer einzigen `server.js` Datei bündeln kann. Auch das Frontend ist stark auf die `App.tsx` konzentriert, was die Lesbarkeit und Nachvollziehbarkeit des Datenflusses massiv erhöht.

*Herausforderungen:*
Die größte Herausforderung bestand nicht im Schreiben der eigentlichen Logik, sondern im Deployment und der Kommunikation zwischen zwei verschiedenen Cloud-Anbietern. Die Handhabung von sicheren Authentifizierungs-Cookies über verschiedene Domains hinweg (Vercel und Render) hat uns viel abverlangt, uns aber gleichzeitig ein tiefes Verständnis für HTTP-Header, CORS-Policies und Proxies gelehrt. 

*Abschluss:*
Die Erfahrung, eine moderne Web-Applikation von der ersten Skizze auf dem Papier bis hin zum Live-Deployment in der Cloud aufzubauen, hat unser Verständnis für Software-Engineering nachhaltig geprägt. Das Projekt erfüllt nicht nur sämtliche technische Vorgaben der Schule, sondern ist ein Softwareprodukt, das wir im echten Leben im Fitnessstudio tatsächlich selbst nutzen.
