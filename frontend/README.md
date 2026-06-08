# RapidQuiz Frontend

Pure React frontend (no TanStack, no UI libraries) for the RapidQuiz backend.

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

Edit `.env` to point at your backend:

```
VITE_API_URL=http://localhost:8080
VITE_WS_URL=ws://localhost:8080
```

## Features

- Register / login (JWT stored in localStorage)
- Create, list, edit and delete quizzes
- Host a live game (room code + WebSocket lobby)
- Join a game with room code + name
- Play questions with per-question timers
- Live leaderboard (polled from Redis-backed endpoint)
- Fully responsive (mobile + desktop)
