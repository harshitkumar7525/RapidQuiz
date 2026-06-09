# RapidQuiz — Frontend

React + Vite single-page application for RapidQuiz, a real-time multiplayer quiz platform. Players join live quiz rooms, answer timed questions, and watch scores update on a live leaderboard — all driven by WebSocket connections to the Go backend.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 |
| Routing | React Router v6 |
| Build tool | Vite 5 |
| Package manager | pnpm |
| Real-time | Native WebSocket API |
| HTTP client | Custom `fetch` wrapper (`src/api/client.js`) |
| Auth state | React Context + localStorage |
| Deployment | Vercel |

---

## Project Structure

```
frontend/
├── src/
│   ├── api/
│   │   └── client.js           # fetch wrapper + WS_URL export
│   ├── components/
│   │   └── Navbar.jsx
│   ├── context/
│   │   └── AuthContext.jsx     # JWT token stored in localStorage
│   ├── hooks/
│   │   └── useGameSocket.js    # WebSocket hook (connect / send / onMessage)
│   ├── pages/
│   │   ├── Home.jsx
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── Dashboard.jsx       # quiz list for authenticated users
│   │   ├── QuizEditor.jsx      # create / edit quizzes
│   │   ├── HostGame.jsx        # host controls (start, next question, end)
│   │   ├── JoinGame.jsx        # enter room code + display name
│   │   ├── PlayGame.jsx        # player game view
│   │   └── Leaderboard.jsx     # end-of-game rankings
│   ├── styles/
│   │   └── index.css
│   ├── App.jsx                 # route declarations + Private guard
│   └── main.jsx
├── index.html
├── vite.config.js
├── package.json
└── .env.example
```

---

## Prerequisites

- Node.js 18+
- pnpm (`npm install -g pnpm`)
- A running instance of the RapidQuiz backend

---

## Getting Started

```bash
# 1. Install dependencies
pnpm install

# 2. Set up environment variables
cp .env.example .env
# then fill in the values (see section below)

# 3. Start the dev server
pnpm dev
```

The app will be available at `http://localhost:5173`.

---

## Environment Variables

Create a `.env` file in the `frontend/` directory:

```env
VITE_API_URL=http://localhost:8080      # REST API base URL
VITE_WS_URL=ws://localhost:8080        # WebSocket base URL
```

> **Important — Vercel deployments:** Vite bakes environment variables into the bundle at build time. You must set `VITE_API_URL` and `VITE_WS_URL` as **Environment Variables** in the Vercel project dashboard before deploying. If they are missing, the app silently falls back to `localhost`, which will not work in production.

---

## Available Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start local dev server on port 5173 |
| `pnpm build` | Production build (output: `dist/`) |
| `pnpm preview` | Preview the production build locally |

---

## Key Concepts

### Authentication

`AuthContext` holds the JWT token in React state, syncing it to `localStorage` under the key `rq_token`. Any route wrapped in the `<Private>` component redirects unauthenticated users to `/login`. The token is passed as a `Bearer` header by the `api()` helper for all authenticated requests.

### HTTP Client

`src/api/client.js` exports a single `api(path, options)` function that wraps `fetch`, serialises request bodies as JSON, attaches the auth header, and throws a human-readable error on non-2xx responses. The base URL is read from `VITE_API_URL` at build time.

### WebSocket / Real-time

`useGameSocket(roomCode, onMessage)` manages the WebSocket lifecycle:

- Opens a connection to `${VITE_WS_URL}/ws/${roomCode}` on mount.
- Calls `onMessage(parsed)` for every inbound JSON frame.
- Exposes a `send(type, data)` helper that serialises and sends `{ type, data }` frames.
- Tears down the socket on unmount or when `roomCode` changes.
- Exposes a `connected` boolean so the UI can reflect connection state.

### Routing

| Path | Page | Auth required |
|---|---|---|
| `/` | Home | No |
| `/login` | Login | No |
| `/register` | Register | No |
| `/join` | Join Game | No |
| `/play/:gameId` | Play Game | No |
| `/leaderboard/:gameId` | Leaderboard | No |
| `/dashboard` | Dashboard | **Yes** |
| `/quizzes/new` | Quiz Editor | **Yes** |
| `/quizzes/:quizId/edit` | Quiz Editor | **Yes** |
| `/host/:quizId` | Host Game | **Yes** |

Any unmatched path redirects to `/`.

---

## Deployment (Vercel)

1. Push the repository to GitHub.
2. Import the project in Vercel and set the **Root Directory** to `frontend/`.
3. Add the environment variables (`VITE_API_URL`, `VITE_WS_URL`) under **Project → Settings → Environment Variables**.
4. Deploy. Vercel runs `pnpm build` and serves the `dist/` output.

> Note: WebSocket connections (`wss://`) require the backend to be deployed with TLS. Make sure `VITE_WS_URL` uses `wss://` in production.