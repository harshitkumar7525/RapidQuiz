# RapidQuiz

A real-time multiplayer quiz platform. Hosts create quiz rooms, players join with a 6-character room code, and everyone competes live — questions are pushed over WebSocket, answers are scored server-side with a time-based bonus, and a live leaderboard (backed by Redis sorted sets) updates after every submission.

**Live demo:** [https://rapid-quiz-frontend.vercel.app](https://rapid-quiz-frontend.vercel.app)

---

## Architecture Overview

```
┌─────────────────────────────────┐        ┌─────────────────────────────────┐
│         Frontend (Vercel)        │        │         Backend (Go / Gin)       │
│  React 18 + Vite + React Router  │◄──────►│  REST API  +  WebSocket Server   │
└─────────────────────────────────┘  HTTP  └──────────────┬──────────────────┘
                                      WS                  │
                                                   ┌──────┴──────┐
                                                   │             │
                                             ┌─────▼─────┐ ┌────▼─────┐
                                             │  MongoDB   │ │  Redis   │
                                             │ (qmgo ODM) │ │ sorted   │
                                             │            │ │   sets   │
                                             └────────────┘ └──────────┘
```

**Frontend** — React SPA deployed on Vercel. Communicates with the backend via a `fetch` wrapper for REST calls and a custom `useGameSocket` hook for WebSocket messages.

**Backend** — Go (Gin) HTTP server. Handles authentication, quiz CRUD, game session lifecycle, answer scoring, and real-time broadcasting. Persists data in MongoDB via the qmgo driver. Leaderboard scores are stored in Redis sorted sets with a 24-hour TTL.

---

## Repository Structure

```
RapidQuiz/
├── backend/
│   ├── controllers/        # HTTP handler functions
│   ├── database/           # MongoDB + Redis connection setup
│   ├── middlewares/        # JWT auth middleware
│   ├── models/             # BSON/JSON struct definitions
│   ├── routers/            # Route registration per domain
│   ├── utils/              # JWT, bcrypt, room code helpers
│   ├── websocket/          # Hub, handler, broadcast logic
│   ├── main.go
│   ├── go.mod
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
| Go | 1.21 |
| Node.js | 18 |
| pnpm | 8 |
| MongoDB | 6 |
| Redis | 7 |

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
go mod download
go run main.go
```

The API listens on `http://localhost:8080` by default.

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
| `MONGO_DB` | Database name | `rapidquiz` |
| `PORT` | Server port (default: `8080`) | `8080` |
| `JWT_SECRET` | Secret used to sign HS256 tokens | any long random string |
| `REDIS_ADDR` | Redis host:port | `localhost:6379` |
| `REDIS_USERNAME` | Redis username (leave empty for no auth) | `` |
| `REDIS_PASSWORD` | Redis password (leave empty for no auth) | `` |
| `CLIENT_URL` | Allowed CORS origin | `http://localhost:5173` |

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
| POST | `/auth/register` | No | Register a new user, returns JWT |
| POST | `/auth/login` | No | Login, returns JWT |

### Quizzes

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/quizzes/` | Yes | List the authenticated user's quizzes |
| POST | `/quizzes/` | Yes | Create a new quiz |
| GET | `/quizzes/:quizId` | No | Fetch a quiz by ID |
| PATCH | `/quizzes/:quizId` | Yes | Update a quiz (owner only) |
| DELETE | `/quizzes/:quizId` | Yes | Delete a quiz (owner only) |

### Game Sessions

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/games/create` | Yes | Start a new game session, returns `room_code` |
| POST | `/games/join` | No | Join a game by room code, returns `participant_id` |
| GET | `/games/:gameId` | Yes | Get game session state |
| PATCH | `/games/:gameId/status` | Yes | Set status: `running`, `paused`, or `ended` |
| POST | `/games/:gameId/next` | Yes | Advance to next question (optionally pass `{ "index": N }`) |

### Leaderboard & Answers

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/games/:gameId/answer` | No | Submit an answer, returns `is_correct` + `score` |
| GET | `/games/:gameId/leaderboard` | No | Top-20 scores from Redis sorted set |

### WebSocket

```
GET /ws/:roomCode
```

Upgrade to WebSocket. Any message sent by one client is broadcast verbatim to all clients in the same room. Messages are JSON objects with the shape `{ "type": string, "data": any }`.

---

## Data Models

### User
```json
{ "id": "ObjectID", "name": "string", "email": "string", "created_at": "time", "updated_at": "time" }
```

### Quiz
```json
{
  "id": "ObjectID",
  "title": "string",
  "description": "string",
  "created_by": "ObjectID",
  "questions": [
    {
      "question": "string",
      "options": ["string"],
      "correct_answer": "string",
      "time_limit": 30
    }
  ]
}
```

### GameSession
```json
{
  "game_id": "ObjectID",
  "quiz_id": "ObjectID",
  "room_code": "ABC123",
  "status": "waiting | running | paused | ended",
  "current_question": 0
}
```

### Answer
```json
{
  "participant_id": "ObjectID",
  "question_index": 0,
  "answer": "string",
  "is_correct": true,
  "score": 175
}
```

---

## Scoring

Correct answers earn a base score of **100 points** plus a time bonus of up to **100 points** that scales linearly with how quickly the answer was submitted relative to the question's time limit.

```
score = 100 + floor(100 × (timeLimit − elapsed) / timeLimit)
```

A wrong answer scores 0. The `question_started_at` timestamp is stamped on the game session whenever the host starts the game or advances to the next question, so elapsed time is calculated server-side.

---

## WebSocket Real-time Flow

```
Host                         Server                        Players
 │                              │                              │
 │── POST /games/create ───────►│                              │
 │◄─ { room_code, game_id } ───│                              │
 │                              │◄── POST /games/join ─────── │
 │                              │─── { participant_id } ──────►│
 │── GET /ws/:roomCode ────────►│◄── GET /ws/:roomCode ─────── │
 │                              │  (room created in Hub)       │
 │── PATCH status: running ────►│                              │
 │── { type:"game_start" } ───►│──── broadcast to all ───────►│
 │── POST /games/:id/next ─────►│                              │
 │── { type:"next_question" } ►│──── broadcast to all ───────►│
 │                              │◄── POST /games/:id/answer ── │
 │                              │    (scored + Redis updated)  │
 │── GET /games/:id/leaderboard►│                              │
```

---

## Deployment

### Backend

The backend is a standard Go binary — deploy anywhere that runs containers or Go processes (Railway, Fly.io, Render, a VPS, etc.).

```bash
cd backend
go build -o rapidquiz-server .
./rapidquiz-server
```

Set all environment variables in the host environment; the server reads them on startup via `godotenv` (falls back gracefully if no `.env` file is present).

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

No migrations required — MongoDB creates collections on first insert.

---

## Redis

Leaderboards are stored as sorted sets with the key `leaderboard:<gameId>`. Each member is a `participant_id` string; the score is the running total. Sets expire after **24 hours**.

The top 20 entries are fetched with `ZREVRANGE ... WITHSCORES` and hydrated with participant names from MongoDB before being returned.