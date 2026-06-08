import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, wsUrl, type LeaderboardResponse, type Quiz } from "../lib/api";
import { Styles } from "./login";

export const Route = createFileRoute("/host/$gameId")({
  head: () => ({ meta: [{ title: "Host game — RapidQuiz" }] }),
  validateSearch: (s: Record<string, unknown>) => ({ code: (s.code as string) || "" }),
  component: HostPage,
});

interface GameSession {
  game_id: string;
  quiz_id: string;
  room_code: string;
  status: string;
  current_question: number;
}

function HostPage() {
  const { gameId } = Route.useParams();
  const { code } = Route.useSearch();
  const [events, setEvents] = useState<string[]>([]);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Track current question index locally so the UI updates instantly on Next click
  const [currentQuestion, setCurrentQuestion] = useState(0);

  // auth: true so the Bearer token is sent — without this the request returns 401
  // and gameSession stays undefined, causing "Game session not loaded yet"
  const { data: gameSession, isLoading: sessionLoading, error: sessionError } = useQuery<GameSession>({
    queryKey: ["game", gameId],
    queryFn: () => api<GameSession>(`/games/${gameId}`, { auth: true }),
    retry: 2,
    onSuccess: (data) => setCurrentQuestion(data.current_question),
  });

  // Fetch the quiz so we know the total number of questions
  const { data: quiz } = useQuery<Quiz>({
    queryKey: ["quiz", gameSession?.quiz_id],
    queryFn: () => api<Quiz>(`/quizzes/${gameSession!.quiz_id}`),
    enabled: !!gameSession?.quiz_id,
  });

  const totalQuestions = quiz?.questions?.length ?? 0;
  const isLastQuestion = totalQuestions > 0 && currentQuestion >= totalQuestions - 1;

  useEffect(() => {
    if (!code) return;
    let ws: WebSocket;

    function connect() {
      ws = new WebSocket(wsUrl(code));
      wsRef.current = ws;
      ws.onopen = () => setEvents((ev) => [...ev.slice(-50), "[connected]"]);
      ws.onmessage = (e) => setEvents((ev) => [...ev.slice(-50), String(e.data)]);
      ws.onclose = () => {
        setEvents((ev) => [...ev, "[connection closed — reconnecting…]"]);
        // Auto-reconnect after 2s so host isn't left without a WS channel
        setTimeout(connect, 2000);
      };
      ws.onerror = () => setEvents((ev) => [...ev, "[connection error]"]);
    }

    connect();
    return () => {
      ws?.close();
      wsRef.current = null;
    };
  }, [code]);

  const { data: leaderboard } = useQuery({
    queryKey: ["leaderboard", gameId],
    queryFn: () => api<LeaderboardResponse>(`/games/${gameId}/leaderboard`),
    refetchInterval: 2000,
  });

  function broadcast(type: string, payload?: any) {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, data: payload ?? null }));
    } else {
      setStatusMsg("WebSocket not connected — try again in a moment.");
    }
  }

  async function handleStart() {
    if (!gameSession?.quiz_id) {
      setStatusMsg("Game session not loaded yet, please wait.");
      return;
    }
    try {
      setStatusMsg(null);
      // 1. Mark game as running so SubmitAnswer accepts answers
      await api(`/games/${gameId}/status`, {
        method: "PATCH",
        auth: true,
        body: { status: "running" },
      });
      // 2. Push quiz ID to all players so they can fetch and display questions
      broadcast("quiz", gameSession.quiz_id);
      // 3. Signal game start
      broadcast("start");
      setStatusMsg("Game started!");
    } catch (e: any) {
      setStatusMsg(`Failed to start: ${e.message}`);
    }
  }

  async function handleNext() {
    try {
      setStatusMsg(null);
      const res = await api<{ current_question: number }>(
        `/games/${gameId}/next`,
        { method: "POST", auth: true }
      );
      setCurrentQuestion(res.current_question);
      broadcast("next", res.current_question);
      setStatusMsg(`Advanced to question ${res.current_question + 1} of ${totalQuestions}`);
    } catch (e: any) {
      setStatusMsg(`Failed to advance: ${e.message}`);
    }
  }

  async function handleEnd() {
    try {
      setStatusMsg(null);
      await api(`/games/${gameId}/status`, {
        method: "PATCH",
        auth: true,
        body: { status: "ended" },
      });
      broadcast("end");
      setStatusMsg("Game ended.");
    } catch (e: any) {
      setStatusMsg(`Failed to end: ${e.message}`);
    }
  }

  function copyCode() {
    navigator.clipboard?.writeText(code);
  }

  return (
    <main className="mx-auto max-w-5xl px-3 sm:px-4 py-6 sm:py-10 grid gap-6 lg:grid-cols-[1fr,360px]">
      <div className="space-y-6">
        <div className="card text-center">
          <div className="text-xs sm:text-sm uppercase tracking-widest text-muted-foreground">Room code</div>
          <div
            className="mt-2 text-4xl sm:text-6xl font-extrabold font-mono tracking-[0.2em] sm:tracking-[0.3em] cursor-pointer break-all"
            onClick={copyCode}
            title="Click to copy"
            style={{ background: "var(--gradient-hero)", WebkitBackgroundClip: "text", color: "transparent" }}
          >
            {code || "------"}
          </div>
          <p className="text-xs text-muted-foreground mt-2">Tap to copy · share with players</p>
        </div>

        <div className="card">
          <h3 className="font-semibold mb-3">Host controls</h3>

          {sessionLoading && (
            <p className="text-sm text-muted-foreground mb-3">Loading game session…</p>
          )}
          {sessionError && (
            <p className="text-sm text-destructive mb-3">
              Could not load game session: {(sessionError as Error).message}
            </p>
          )}
          {gameSession && (
            <p className="text-sm text-muted-foreground mb-3">
              Status: <span className="font-medium">{gameSession.status}</span>
              {totalQuestions > 0 && (
                <> · Question <span className="font-medium">{currentQuestion + 1} of {totalQuestions}</span></>
              )}
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              className="btn-primary"
              onClick={handleStart}
              disabled={sessionLoading || !gameSession}
            >
              Start
            </button>
            {!isLastQuestion && (
              <button
                className="btn-secondary"
                onClick={handleNext}
                disabled={!gameSession}
              >
                Next question
              </button>
            )}
            <button
              className="btn-secondary"
              onClick={() => broadcast("pause")}
            >
              Pause
            </button>
            <button
              className="btn-ghost text-destructive"
              onClick={handleEnd}
              disabled={!gameSession}
            >
              End
            </button>
          </div>

          {statusMsg && (
            <p className="text-sm mt-3 text-muted-foreground">{statusMsg}</p>
          )}
        </div>

        <div className="card">
          <h3 className="font-semibold mb-3">Live events</h3>
          <div className="bg-black/30 rounded-lg p-3 max-h-64 overflow-auto font-mono text-xs space-y-1">
            {events.length === 0 && <div className="text-muted-foreground">Waiting for activity…</div>}
            {events.map((e, i) => <div key={i}>{e}</div>)}
          </div>
        </div>
      </div>

      <aside className="card">
        <h3 className="font-semibold mb-4">Leaderboard</h3>
        <ol className="space-y-2">
          {leaderboard?.leaderboard?.length ? leaderboard.leaderboard.map((p) => (
            <li key={p.participant_id} className="flex items-center justify-between rounded-lg bg-secondary/60 px-3 py-2">
              <span className="flex items-center gap-3">
                <span className="font-mono text-accent">#{p.rank}</span>
                <span className="font-medium">{p.name}</span>
              </span>
              <span className="font-mono font-semibold">{p.score}</span>
            </li>
          )) : <p className="text-sm text-muted-foreground">No scores yet.</p>}
        </ol>
      </aside>
      <Styles />
    </main>
  );
}