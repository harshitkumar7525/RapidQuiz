# RapidQuiz

A real-time multiplayer quiz platform. Hosts create quiz rooms, players join with a 6-character room code, and everyone competes live — questions are pushed over WebSocket, answers are scored server-side with a time-based bonus, and a live leaderboard (backed by Redis sorted sets) updates after every submission.

---

## 🚀 Live Demo & Deployment

| | |
|---|---|
| **Frontend (live)** | [https://rapid-quiz-frontend.vercel.app](https://rapid-quiz-frontend.vercel.app) — deployed on Vercel |
| **Backend** | Deployed on [Render](https://render.com) — Spring Boot (Java) API + WebSocket server, with MongoDB and Redis as managed/containerized services |
| **Demo video** | [https://youtu.be/0YCRTcTwGKg](https://youtu.be/0YCRTcTwGKg) |

---

## Architecture Overview

```
┌─────────────────────────────────┐        ┌─────────────────────────────────────┐
│         Frontend (Vercel)        │        │     Backend (Spring Boot, Render)    │
│  React 18 + Vite + React Router  │◄──────►│  Spring MVC REST API + WebSocket     │
└─────────────────────────────────┘  HTTP  └──────────────┬────────────────────────┘
                                      WS                  │
                                                   ┌──────┴──────┐
                                                   │             │
                                             ┌─────▼─────┐ ┌────▼─────┐
                                             │  MongoDB   │ │  Redis   │
                                             │(Spring Data│ │ sorted   │
                                             │  MongoDB)  │ │  sets    │
                                             └────────────┘ └──────────┘
```

**Frontend** — React SPA deployed on Vercel. Communicates with the backend via a `fetch` wrapper for REST calls and a custom `useGameSocket` hook for WebSocket messages.

**Backend** — Java 25 / Spring Boot application, built with Gradle, deployed on Render. Handles authentication, quiz CRUD, game session lifecycle, answer scoring, and real-time broadcasting. Persists data in MongoDB via Spring Data MongoDB. Leaderboard scores live in Redis, using sorted sets with a 24-hour TTL.

---

## Repository Structure

```
RapidQuiz/
├── backend/                    # Spring Boot service (Gradle project)
│   ├── src/main/java/in/harshitkumar7525/RapidQuiz/
│   │   ├── config/              # CORS + WebSocket configuration
│   │   ├── controllers/         # REST endpoints (Auth, Quiz, Game, Answer, Leaderboard)
│   │   ├── document/            # MongoDB documents (Users, Quizzes, Question, GameSession, Participant, Answer)
│   │   ├── dto/                 # Request/response payloads
│   │   ├── exception/           # Custom exceptions + global exception handler
│   │   ├── repository/          # Spring Data MongoDB repositories
│   │   ├── security/            # JWT filter + JWT utility
│   │   ├── service/              # Business logic (Auth, Quiz, Game, Answer, Leaderboard, RoomCodeGenerator)
│   │   ├── websocket/             # WebSocket handler, room registry, broadcast service
│   │   └── RapidQuizApplication.java
│   ├── src/main/resources/
│   │   └── application.properties
│   ├── build.gradle
│   ├── settings.gradle
│   ├── gradlew / gradlew.bat
│   ├── Dockerfile
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── api/            # fetch wrapper + WS URL
    │   ├── components/     # Navbar
    │   ├── context/        # AuthContext (JWT in localStorage)
    │   ├── hooks/          # useGameSocket
    │   └── pages/          # one file per route
    ├── vite.config.js
    ├── package.json
    └── .env.example
```

---

## Prerequisites

| Tool | Minimum version |
|---|---|
| Java (JDK) | 25 (or let the Gradle toolchain provision one) |
| Node.js | 18 |
| pnpm | 8 |
| MongoDB | 6 |
| Redis | 6 |
| Docker | 24 (optional, for containerized run) |

---

## Quick Start

### 1 — Clone

```bash
git clone https://github.com/harshitkumar7525/RapidQuiz.git
cd RapidQuiz
```

### 2 — Backend

```bash
cd backend
cp .env.example .env
# fill in the values (see Environment Variables below)
./gradlew bootRun
```

The API listens on `http://localhost:8080` by default. All env vars have local-dev fallbacks baked into `application.properties`, so it will boot without a `.env` file as long as MongoDB and Redis are reachable on `localhost` at their default ports.

To run with Docker instead:

```bash
docker build -t rapidquiz-api .
docker run -p 8080:8080 --env-file .env rapidquiz-api
```

### 3 — Frontend

```bash
cd ../frontend
cp .env.example .env
# set VITE_API_URL and VITE_WS_URL
pnpm install
pnpm dev
```

The app is available at `http://localhost:5173`.

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Example |
|---|---|---|
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017` |
| `MONGO_DATABASE` | Database name | `rapidquiz` |
| `PORT` | Server port (default: `8080`) | `8080` |
| `JWT_SECRET` | Secret used to sign HS256 tokens (32+ chars) | any long random string |
| `REDIS_HOST` | Redis host | `localhost` |
| `REDIS_PORT` | Redis port | `6379` |
| `REDIS_PASSWORD` | Redis password (leave empty for no auth) | `` |
| `FRONTEND_URL` | Allowed CORS origin | `http://localhost:5173` |

### Frontend (`frontend/.env`)

| Variable | Description | Example |
|---|---|---|
| `VITE_API_URL` | Backend REST base URL | `http://localhost:8080` |
| `VITE_WS_URL` | Backend WebSocket base URL | `ws://localhost:8080` |

> **Vite bakes these values into the bundle at build time.** For Vercel deployments you must set them in the Vercel dashboard under *Project → Settings → Environment Variables* before triggering a build.

---

## API Reference

All authenticated endpoints require the header `Authorization: Bearer <token>`.

### Auth

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | No | Register a new user, returns JWT (`201`) |
| POST | `/auth/login` | No | Login, returns JWT |

### Quizzes

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/quizzes` | Yes | Create a new quiz |
| GET | `/quizzes` | Yes | List the authenticated user's quizzes |
| GET | `/quizzes/{quizId}` | No | Fetch a quiz by ID |
| PATCH | `/quizzes/{quizId}` | Yes | Update a quiz (owner only) |
| DELETE | `/quizzes/{quizId}` | Yes | Delete a quiz (owner only) |

Each question requires `question`, at least 2 `options`, a `correctAnswer`, and an optional `timeLimit` (seconds, defaults to 30).

### Game Sessions

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/games/create` | Yes | Start a game session for a quiz you own, returns `roomCode` |
| POST | `/games/join` | No | Join a game by `roomCode` + display `name`, returns `participantId` |
| GET | `/games/{gameId}` | Yes | Get full game details (status, current question, participants) |
| PATCH | `/games/{gameId}/status` | Yes | Host-only: transition status — `WAITING → RUNNING → PAUSED/ENDED` |
| PATCH | `/games/{gameId}/next-question` | Yes | Host-only: advance to next question (optionally pass `{ "index": N }`) |

Status transitions are strictly enforced: `WAITING → RUNNING`, `RUNNING → PAUSED \| ENDED`, `PAUSED → RUNNING \| ENDED`. `ENDED` is terminal.

### Answers & Leaderboard

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/games/{gameId}/answer` | No | Submit an answer, returns `isCorrect` + `score` |
| GET | `/games/{gameId}/leaderboard` | No | Top-20 scores from the Redis sorted set |

### WebSocket

```
GET /ws/{roomCode}
```

Upgrade to WebSocket. Server-originated events are broadcast as JSON objects shaped `{ "type": string, "data": any }`:

| `type` | Triggered by | `data` |
|---|---|---|
| `game_status` | `PATCH /games/{gameId}/status` | `gameId`, `status`, `currentQuestion` |
| `next_question` | `PATCH /games/{gameId}/next-question` | `questionIndex`, `question`, `options`, `timeLimit` |
| `score_update` | `POST /games/{gameId}/answer` | `participantId`, `name`, `isCorrect`, `score` |

Any raw text message a client sends over the socket is also relayed as-is to every other peer in the same room.

---

## Data Models

### User
```json
{ "id": "string", "name": "string", "email": "string", "created_at": "datetime" }
```

### Quiz
```json
{
  "id": "string",
  "title": "string",
  "description": "string",
  "createdBy": "string",
  "questions": [
    {
      "question": "string",
      "options": ["string"],
      "correctAnswer": "string",
      "timeLimit": 30
    }
  ],
  "createdAt": "datetime",
  "updatedAt": "datetime"
}
```

### GameSession
```json
{
  "id": "string",
  "quizId": "string",
  "hostId": "string",
  "roomCode": "ABC123",
  "status": "WAITING | RUNNING | PAUSED | ENDED",
  "currentQuestion": 0,
  "questionStartedAt": "datetime",
  "startedAt": "datetime",
  "endedAt": "datetime"
}
```

### Participant
```json
{ "id": "string", "gameId": "string", "name": "string", "joinedAt": "datetime" }
```

### Answer
```json
{
  "id": "string",
  "gameId": "string",
  "participantId": "string",
  "questionIndex": 0,
  "answer": "string",
  "isCorrect": true,
  "score": 175,
  "answeredAt": "datetime"
}
```

---

## Scoring

Correct answers earn a base score of **100 points** plus a time bonus of up to **100 points** that scales linearly with how quickly the answer was submitted relative to the question's time limit.

```
score = 100 + floor(100 × (timeLimit − elapsed) / timeLimit)
```

A wrong answer scores 0, and each participant may only submit one answer per question — a repeat submission for the same `questionIndex` returns a `409 Conflict`. `questionStartedAt` is stamped on the game session whenever the host starts the game or advances to the next question, so elapsed time is calculated server-side and can't be spoofed by the client.

---

## WebSocket Real-time Flow

```
Host                         Server                        Players
 │                              │                              │
 │── POST /games/create ───────►│                              │
 │◄─ { roomCode, gameId } ─────│                              │
 │                              │◄── POST /games/join ─────── │
 │                              │─── { participantId } ───────►│
 │── GET /ws/{roomCode} ───────►│◄── GET /ws/{roomCode} ────── │
 │                              │  (session added to room)     │
 │── PATCH status: RUNNING ────►│                              │
 │                              │─ { type:"game_status" } ────►│  (broadcast to all)
 │── PATCH next-question ──────►│                              │
 │                              │─ { type:"next_question" } ──►│  (broadcast to all)
 │                              │◄── POST /games/{id}/answer ─ │
 │                              │  (scored + Redis updated)    │
 │                              │─ { type:"score_update" } ───►│  (broadcast to all)
 │── GET /games/{id}/leaderboard►│                              │
```

---

## Deployment

### Backend

The backend is deployed on **Render** as a Spring Boot web service.

```bash
cd backend
./gradlew bootJar
java -jar build/libs/RapidQuiz-0.0.1-SNAPSHOT.jar
```

Or via the provided multi-stage `Dockerfile`, which builds the jar and runs it in a minimal `eclipse-temurin` JRE image on port `8080`. Set all environment variables from the table above in the Render service's environment settings — `application.properties` reads them with local fallbacks, so nothing besides `JWT_SECRET`, `MONGO_URI`, and Redis connection details is strictly required in production.

### Frontend

Deployed on Vercel. Set the root directory to `frontend/` and configure the two `VITE_*` environment variables in the Vercel dashboard. Vercel runs `pnpm build` automatically on every push.

In production:
- `VITE_API_URL` should be `https://your-backend-domain.com`
- `VITE_WS_URL` should be `wss://your-backend-domain.com`

---

## MongoDB Collections

| Collection | Purpose |
|---|---|
| `users` | Registered accounts |
| `quizzes` | Quiz definitions with embedded questions |
| `game_sessions` | Active and historical game sessions |
| `participants` | Players who joined a session |
| `answers` | Individual answer submissions |

No migrations required — MongoDB creates collections on first insert. `roomCode` on `game_sessions` and `email` on `users` are indexed (the former uniquely).

---

## Redis

Leaderboards are stored as sorted sets under the key `leaderboard:<gameId>`. Each member is a `participantId` string; the score is the running total, updated with `ZINCRBY` on every correct answer. Sets expire after **24 hours** of inactivity (TTL is refreshed on each score update).

The top 20 entries are fetched with a reverse range-with-scores query and hydrated with participant names from MongoDB before being returned.