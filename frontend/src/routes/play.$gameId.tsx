import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { api, wsUrl, type AnswerResponse, type LeaderboardResponse, type Quiz } from "../lib/api";
import { useQuery } from "@tanstack/react-query";
import { Styles } from "./login";

export const Route = createFileRoute("/play/$gameId")({
  head: () => ({ meta: [{ title: "Play — RapidQuiz" }] }),
  component: PlayPage,
});

interface Player {
  participant_id: string;
  name: string;
  room_code: string;
}

function loadPlayer(gameId: string): Player | null {
  try {
    const raw = sessionStorage.getItem(`rq_player_${gameId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function PlayPage() {
  const { gameId } = Route.useParams();
  const nav = useNavigate();
  const [player, setPlayer] = useState<Player | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [quizError, setQuizError] = useState<string | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState<AnswerResponse | null>(null);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState<Set<number>>(new Set());
  const [wsStatus, setWsStatus] = useState("connecting");
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const p = loadPlayer(gameId);
    if (!p) {
      nav({ to: "/join" });
      return;
    }
    setPlayer(p);
  }, [gameId, nav]);

  // We need the quiz to render questions. Game endpoints don't expose quiz_id directly to
  // participants; ask the user to enter quiz id via shared URL — fallback: try fetching leaderboard
  // game and use a /quizzes/:id fetch is not possible without quiz_id. Workaround: encode the quiz
  // in the room. For now, fetch quiz by id via a hidden mechanism: the host shares quiz id
  // through the WebSocket "start" event. We listen for it.

  useEffect(() => {
    if (!player) return;
    const ws = new WebSocket(wsUrl(player.room_code));
    wsRef.current = ws;
    ws.onopen = () => setWsStatus("connected");
    ws.onclose = () => setWsStatus("disconnected");
    ws.onerror = () => setWsStatus("error");
    ws.onmessage = async (e) => {
      try {
        const msg = JSON.parse(String(e.data));
        if (msg?.type === "quiz" && typeof msg.data === "string" && !quiz) {
          try {
            const q = await api<Quiz>(`/quizzes/${msg.data}`);
            setQuiz(q);
          } catch (err: any) { setQuizError(err.message); }
        }
        if (msg?.type === "next" && typeof msg.data === "number") setCurrentIdx(msg.data);
        if (msg?.type === "next" && msg.data == null) setCurrentIdx((i) => i + 1);
      } catch {}
    };
    return () => ws.close();
  }, [player, quiz]);

  const { data: leaderboard } = useQuery({
    queryKey: ["leaderboard", gameId],
    queryFn: () => api<LeaderboardResponse>(`/games/${gameId}/leaderboard`),
    refetchInterval: 3000,
  });

  async function loadQuizManually(quizId: string) {
    try {
      const q = await api<Quiz>(`/quizzes/${quizId.trim()}`);
      setQuiz(q);
      setQuizError(null);
    } catch (e: any) {
      setQuizError(e.message);
    }
  }

  async function submit(answer: string) {
    if (!player || submitting || answered.has(currentIdx)) return;
    setSubmitting(true);
    setLastResult(null);
    try {
      const res = await api<AnswerResponse>(`/games/${gameId}/answer`, {
        method: "POST",
        body: {
          participant_id: player.participant_id,
          question_index: currentIdx,
          answer,
        },
      });
      setLastResult(res);
      setScore((s) => s + (res.score || 0));
      setAnswered((set) => new Set(set).add(currentIdx));
    } catch (e: any) {
      setLastResult({ is_correct: false, score: 0, message: e.message });
    } finally {
      setSubmitting(false);
    }
  }

  if (!player) return null;

  const currentQ = quiz?.questions?.[currentIdx];

  return (
    <main className="mx-auto max-w-3xl px-3 sm:px-4 py-6 sm:py-10 space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <div className="text-xs sm:text-sm text-muted-foreground">Playing as</div>
          <div className="text-lg sm:text-xl font-semibold truncate">{player.name}</div>
        </div>
        <div className="text-right">
          <div className="text-xs sm:text-sm text-muted-foreground">Your score</div>
          <div className="text-2xl sm:text-3xl font-extrabold" style={{ color: "var(--color-primary)" }}>{score}</div>
        </div>
      </div>

      <div className="text-xs text-muted-foreground break-all">
        Room <span className="font-mono">{player.room_code}</span> · WS {wsStatus}
      </div>

      {!quiz && (
        <div className="card">
          <p className="text-sm text-muted-foreground mb-3">
            Waiting for the host to start. If you have the quiz ID, you can load it now.
          </p>
          <ManualQuizLoader onLoad={loadQuizManually} />
          {quizError && <p className="text-destructive text-sm mt-2">{quizError}</p>}
        </div>
      )}

      {currentQ && (
        <div className="card">
          <div className="text-xs uppercase tracking-widest text-accent">Question {currentIdx + 1} of {quiz!.questions.length}</div>
          <h2 className="mt-2 text-xl sm:text-2xl font-bold break-words">{currentQ.question}</h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {currentQ.options.map((opt) => (
              <button
                key={opt}
                disabled={submitting || answered.has(currentIdx)}
                onClick={() => submit(opt)}
                className="rounded-xl border border-border p-4 text-left font-medium hover:bg-secondary disabled:opacity-50"
                style={{ background: "var(--gradient-card)" }}
              >
                {opt}
              </button>
            ))}
          </div>

          {lastResult && (
            <div className={`mt-4 rounded-lg px-4 py-3 font-medium ${
              lastResult.is_correct ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
            }`}>
              {lastResult.message} {lastResult.score ? `· +${lastResult.score}` : ""}
            </div>
          )}

          <div className="mt-6 flex items-center justify-between">
            <button
              onClick={() => { setCurrentIdx((i) => Math.max(0, i - 1)); setLastResult(null); }}
              className="btn-ghost"
            >← Prev</button>
            <button
              onClick={() => { setCurrentIdx((i) => Math.min((quiz!.questions.length - 1), i + 1)); setLastResult(null); }}
              className="btn-secondary"
            >Next →</button>
          </div>
        </div>
      )}

      <div className="card">
        <h3 className="font-semibold mb-3">Live leaderboard</h3>
        <ol className="space-y-2">
          {leaderboard?.leaderboard?.length ? leaderboard.leaderboard.map((p) => (
            <li key={p.participant_id} className={`flex items-center justify-between rounded-lg px-3 py-2 ${
              p.participant_id === player.participant_id ? "bg-primary/20" : "bg-secondary/60"
            }`}>
              <span className="flex items-center gap-3">
                <span className="font-mono text-accent">#{p.rank}</span>
                <span className="font-medium">{p.name}</span>
              </span>
              <span className="font-mono font-semibold">{p.score}</span>
            </li>
          )) : <p className="text-sm text-muted-foreground">No scores yet.</p>}
        </ol>
      </div>

      <Link to="/" className="text-sm text-muted-foreground underline">Leave game</Link>
      <Styles />
    </main>
  );
}

function ManualQuizLoader({ onLoad }: { onLoad: (id: string) => void }) {
  const [id, setId] = useState("");
  return (
    <div className="flex gap-2">
      <input className="input flex-1" placeholder="Quiz ID" value={id} onChange={(e) => setId(e.target.value)} />
      <button className="btn-primary" onClick={() => onLoad(id)} disabled={!id.trim()}>Load</button>
    </div>
  );
}
