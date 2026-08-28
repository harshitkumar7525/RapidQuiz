# RapidQuiz API

A real-time, multiplayer quiz platform backend built with **Spring Boot**, **MongoDB**, **Redis**, and **WebSockets**. Hosts create quizzes, spin up live game sessions with a shareable room code, and players join and compete for the fastest correct answers — with scores and leaderboards updated live.

## Features

- **JWT-based authentication** — register/login, with protected routes secured by a lightweight custom filter (no Spring Security web layer required).
- **Quiz management (CRUD)** — create, list, fetch, update, and delete quizzes, each made up of multiple-choice questions with a configurable per-question time limit.
- **Live game sessions** — a host starts a session for their quiz and gets a unique 6-character room code that players use to join.
- **Real-time updates over WebSockets** — question changes, game status changes, and score updates are broadcast to everyone in the room the moment they happen.
- **Speed-based scoring** — correct answers earn 100 points plus a time bonus (up to +100) based on how quickly the participant answered relative to the question's time limit.
- **Redis-backed leaderboards** — per-game leaderboards use a Redis sorted set for fast score tracking and top-N ranking, with a 24-hour TTL.
- **MongoDB persistence** — users, quizzes, game sessions, participants, and submitted answers are all stored in MongoDB.

## Tech Stack

| Layer          | Technology                                   |
|----------------|-----------------------------------------------|
| Language       | Java 25                                        |
| Framework      | Spring Boot 4.1 (Web MVC, WebSocket, Validation, Actuator) |
| Database       | MongoDB (via Spring Data MongoDB)              |
| Cache/Leaderboard | Redis (via Spring Data Redis)               |
| Auth           | JWT (jjwt)                                     |
| Build Tool     | Gradle (wrapper included)                      |
| Container      | Docker (multi-stage build)                     |

## Project Structure

```
src/main/java/in/harshitkumar7525/RapidQuiz/
├── config/          # CORS and WebSocket configuration
├── controllers/      # REST endpoints (Auth, Quiz, Game, Answer, Leaderboard)
├── document/         # MongoDB documents (Users, Quizzes, Question, GameSession, Participant, Answer)
├── dto/               # Request/response payloads
├── exception/         # Custom exceptions + global exception handler
├── repository/        # Spring Data MongoDB repositories
├── security/           # JWT filter and utility
├── service/             # Business logic (Auth, Quiz, Game, Answer, Leaderboard, RoomCodeGenerator)
└── websocket/            # WebSocket handler, room registry, broadcast service
```

## Getting Started

### Prerequisites

- Java 25 (a matching JDK, or let the Gradle toolchain provision one)
- MongoDB instance (local or remote)
- Redis instance (local or remote)

### Configuration

Copy `.env.example` to `.env` (or otherwise set these as environment variables) and fill in the values:

```
MONGO_URI=mongodb://localhost:27017
MONGO_DATABASE=rapidquiz
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
PORT=8080
FRONTEND_URL=http://localhost:5173
JWT_SECRET=change-this-to-a-long-random-secret-of-at-least-32-characters
```

All of these have sane local-development defaults baked into `application.properties`, so the app will boot without an `.env` file as long as MongoDB and Redis are reachable at `localhost` on their default ports.

### Run locally

```bash
./gradlew bootRun
```

The API will be available at `http://localhost:8080` (or your configured `PORT`).

### Run with Docker

```bash
docker build -t rapidquiz-api .
docker run -p 8080:8080 --env-file .env rapidquiz-api
```

### Run tests

```bash
./gradlew test
```

## Authentication

Protected endpoints expect a bearer token:

```
Authorization: Bearer <token>
```

Obtain a token via `POST /auth/register` or `POST /auth/login`. Tokens are valid for **48 hours**.

## API Reference

### Auth

| Method | Endpoint         | Auth | Description                  |
|--------|------------------|------|-------------------------------|
| POST   | `/auth/register` | No   | Create a user, returns a JWT |
| POST   | `/auth/login`    | No   | Log in, returns a JWT         |

### Quizzes

| Method | Endpoint            | Auth | Description                                  |
|--------|---------------------|------|-----------------------------------------------|
| POST   | `/quizzes`           | Yes  | Create a quiz (title, description, questions) |
| GET    | `/quizzes`           | Yes  | List quizzes created by the current user      |
| GET    | `/quizzes/{quizId}`   | No   | Get a quiz by ID                              |
| PATCH  | `/quizzes/{quizId}`   | Yes  | Update a quiz (creator only)                  |
| DELETE | `/quizzes/{quizId}`   | Yes  | Delete a quiz (creator only)                  |

Each question requires `question`, at least 2 `options`, a `correctAnswer`, and an optional `timeLimit` (seconds; defaults to 30 if omitted).

### Game Sessions

| Method | Endpoint                          | Auth | Description                                             |
|--------|------------------------------------|------|-----------------------------------------------------------|
| POST   | `/games/create`                    | Yes  | Start a game session for a quiz you own; returns a room code |
| POST   | `/games/join`                      | No   | Join a game by `roomCode` and a display `name`             |
| GET    | `/games/{gameId}`                  | Yes  | Get full game details, including current question and participants |
| PATCH  | `/games/{gameId}/status`           | Yes  | Host-only: transition game status (`WAITING → RUNNING → PAUSED/ENDED`) |
| PATCH  | `/games/{gameId}/next-question`    | Yes  | Host-only: advance to the next question (or a specific `index`) |
| POST   | `/games/{gameId}/answer`           | No   | Submit an answer for the current/a given question index    |
| GET    | `/games/{gameId}/leaderboard`      | No   | Get the top 20 participants by score                       |

**Game status transitions** are strictly enforced: `WAITING → RUNNING`, `RUNNING → PAUSED | ENDED`, `PAUSED → RUNNING | ENDED`. `ENDED` is terminal.

**Scoring**: a correct answer earns `100 + timeBonus` points, where `timeBonus` scales linearly from 100 down to 0 based on how much of the question's time limit remains when the answer is submitted. Wrong answers earn 0. Each participant may only answer a given question once.

### WebSockets

Connect to:

```
ws://<host>/ws/{roomCode}
```

All clients connected to the same room code receive JSON messages of the shape `{ "type": "...", "data": {...} }` whenever the host or players trigger game events:

| Type            | Triggered by                          | Payload                                              |
|------------------|-----------------------------------------|--------------------------------------------------------|
| `game_status`    | `PATCH /games/{gameId}/status`          | `gameId`, `status`, `currentQuestion`                    |
| `next_question`  | `PATCH /games/{gameId}/next-question`   | `questionIndex`, `question`, `options`, `timeLimit`      |
| `score_update`   | `POST /games/{gameId}/answer`           | `participantId`, `name`, `isCorrect`, `score`             |

Clients can also send raw text messages over the socket, which are relayed as-is to every other peer in the room (e.g. for lightweight client-side signaling).

## Error Handling

Errors are returned as JSON with an appropriate HTTP status, handled centrally by `GlobalExceptionHandler`:

| Exception                  | Status |
|------------------------------|--------|
| `ResourceNotFoundException`  | 404    |
| `UnauthorizedException`      | 401    |
| `ForbiddenException`         | 403    |
| `ConflictException`          | 409    |
| `QuizValidationException`    | 400    |
| Validation errors (`@Valid`) | 400    |

## License

No license file is currently included in this repository.