import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, useCallback } from "react";
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

// ─── Countdown timer hook ────────────────────────────────────────────────────
function useCountdown(seconds: number, active: boolean) {
  const [timeLeft, setTimeLeft] = useState(seconds);
  useEffect(() => { setTimeLeft(seconds); }, [seconds]);
  useEffect(() => {
    if (!active || timeLeft <= 0) return;
    const id = setInterval(() => setTimeLeft((t) => Math.max(0, t - 1)), 1000);
    return () => clearInterval(id);
  }, [active, timeLeft]);
  return timeLeft;
}

// ─── Waiting screen ──────────────────────────────────────────────────────────
function WaitingScreen({ player }: { player: Player }) {
  return (
    <main className="mx-auto max-w-2xl px-4 py-16 space-y-6 text-center">
      <div className="text-5xl animate-pulse">⏳</div>
      <h1 className="text-2xl font-bold">Waiting for the host to start…</h1>
      <p className="text-muted-foreground">
        Room <span className="font-mono font-semibold">{player.room_code}</span>
      </p>
      <p className="text-sm text-muted-foreground">
        Playing as <span className="font-semibold">{player.name}</span>
      </p>
      <Styles />
    </main>
  );
}

// ─── Result / end screen ─────────────────────────────────────────────────────
function ResultScreen({
  player,
  score,
  leaderboard,
}: {
  player: Player;
  score: number;
  leaderboard: LeaderboardResponse | undefined;
}) {
  const myEntry = leaderboard?.leaderboard?.find(
    (p) => p.participant_id === player.participant_id
  );
  const total = leaderboard?.leaderboard?.length ?? 0;

  const medal = myEntry?.rank === 1 ? "🥇" : myEntry?.rank === 2 ? "🥈" : myEntry?.rank === 3 ? "🥉" : "🎉";

  return (
    <main className="mx-auto max-w-2xl px-4 py-16 space-y-8 text-center">
      <div>
        <div className="text-6xl mb-4">{medal}</div>
        <h1 className="text-3xl font-extrabold">Quiz complete!</h1>
        <p className="text-muted-foreground mt-2">Well played, {player.name}!</p>
      </div>

      <div className="card py-8" style={{ background: "var(--gradient-card)" }}>
        <div className="text-sm uppercase tracking-widest text-muted-foreground mb-1">Your final score</div>
        <div
          className="text-6xl font-extrabold"
          style={{ background: "var(--gradient-hero)", WebkitBackgroundClip: "text", color: "transparent" }}
        >
          {score}
        </div>
        {myEntry && total > 0 && (
          <div className="mt-3 text-muted-foreground text-sm">
            Rank <span className="font-bold text-foreground">#{myEntry.rank}</span> out of {total}
          </div>
        )}
      </div>

      {leaderboard?.leaderboard?.length ? (
        <div className="card text-left">
          <h2 className="font-semibold mb-4">Final leaderboard</h2>
          <ol className="space-y-2">
            {leaderboard.leaderboard.map((p, i) => (
              <li
                key={p.participant_id}
                className={`flex items-center justify-between rounded-lg px-3 py-2 ${
                  p.participant_id === player.participant_id
                    ? "bg-primary/20 font-bold"
                    : "bg-secondary/60"
                }`}
              >
                <span className="flex items-center gap-3">
                  <span className="text-lg">
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${p.rank}`}
                  </span>
                  <span>{p.name}</span>
                </span>
                <span className="font-mono font-semibold">{p.score}</span>
              </li>
            ))}
          </ol>
        </div>
      ) : null}

      <Link to="/" className="btn-primary inline-block mt-4">Back to home</Link>
      <Styles />
    </main>
  );
}

// ─── Question card ───────────────────────────────────────────────────────────
function QuestionCard({
  question,
  isAnswered,
  submitting,
  lastResult,
  selectedAnswer,
  timeLimit,
  onSubmit,
}: {
  question: Quiz["questions"][number];
  isAnswered: boolean;
  submitting: boolean;
  lastResult: AnswerResponse | null;
  selectedAnswer: string | null;
  timeLimit: number;
  onSubmit: (answer: string) => void;
}) {
  const timeLeft = useCountdown(timeLimit, !isAnswered);
  const timedOut = timeLeft === 0 && !isAnswered;
  const locked = isAnswered || timedOut;
  const pct = (timeLeft / timeLimit) * 100;
  const timerColor = pct > 50 ? "#22c55e" : pct > 25 ? "#f59e0b" : "#ef4444";

  return (
    <div className="card space-y-4">
      {/* Timer */}
      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground uppercase tracking-widest">Time left</span>
          <span className="text-xl font-bold font-mono tabular-nums transition-colors" style={{ color: timerColor }}>
            {timeLeft}s
          </span>
        </div>
        <div className="h-2 rounded-full bg-secondary overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000 ease-linear"
            style={{ width: `${pct}%`, backgroundColor: timerColor }}
          />
        </div>
      </div>

      {/* Question */}
      <h2 className="text-xl sm:text-2xl font-bold break-words">{question.question}</h2>

      {/* Options */}
      <div className="grid gap-3 sm:grid-cols-2">
        {question.options.map((opt) => {
          const isCorrect = opt === question.correct_answer;
          const isSelected = opt === selectedAnswer;

          // After answering/timeout: highlight correct green, selected-wrong red
          let bg = "var(--gradient-card)";
          let border = "border-border";
          let extra = "";

          if (locked) {
            if (isCorrect) {
              bg = "rgba(34,197,94,0.15)";
              border = "border-green-500";
              extra = "ring-1 ring-green-500";
            } else if (isSelected && !isCorrect) {
              bg = "rgba(239,68,68,0.15)";
              border = "border-red-500";
              extra = "ring-1 ring-red-500";
            }
          }

          return (
            <button
              key={opt}
              disabled={submitting || locked}
              onClick={() => onSubmit(opt)}
              className={`rounded-xl border ${border} ${extra} p-4 text-left font-medium transition-all
                hover:bg-secondary disabled:cursor-default`}
              style={{ background: bg }}
            >
              {locked && isCorrect && <span className="mr-2">✅</span>}
              {locked && isSelected && !isCorrect && <span className="mr-2">❌</span>}
              {opt}
            </button>
          );
        })}
      </div>

      {/* Feedback */}
      {locked && (
        <div className={`rounded-lg px-4 py-3 text-sm font-medium ${
          timedOut && !isAnswered
            ? "bg-secondary text-muted-foreground"
            : lastResult?.is_correct
            ? "bg-green-500/20 text-green-400"
            : "bg-red-500/20 text-red-400"
        }`}>
          {timedOut && !isAnswered
            ? "⏰ Time's up! The correct answer is highlighted above."
            : lastResult?.is_correct
            ? `✅ Correct! +${lastResult.score} pts`
            : `❌ Wrong answer. The correct answer is highlighted above.`}
        </div>
      )}
    </div>
  );
}

// ─── Main play page ──────────────────────────────────────────────────────────
function PlayPage() {
  const { gameId } = Route.useParams();
  const [player, setPlayer] = useState<Player | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState<AnswerResponse | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState<Set<number>>(new Set());
  const wsRef = useRef<WebSocket | null>(null);
  const unmountedRef = useRef(false);

  useEffect(() => {
    const p = loadPlayer(gameId);
    if (p) setPlayer(p);
    return () => { unmountedRef.current = true; };
  }, [gameId]);

  const setupWs = useCallback((roomCode: string) => {
    const ws = new WebSocket(wsUrl(roomCode));
    wsRef.current = ws;

    ws.onmessage = async (e) => {
      try {
        const msg = JSON.parse(String(e.data));

        if (msg?.type === "quiz" && typeof msg.data === "string") {
          try {
            const q = await api<Quiz>(`/quizzes/${msg.data}`);
            setQuiz(q);
          } catch {}
        }
        if (msg?.type === "start") {
          setGameStarted(true);
          setGameEnded(false);
        }
        if (msg?.type === "next" && typeof msg.data === "number") {
          setCurrentIdx(msg.data);
          setLastResult(null);
        }
        if (msg?.type === "end") {
          setGameEnded(true);
        }
      } catch {}
    };

    ws.onclose = () => {
      if (!unmountedRef.current) {
        setTimeout(() => {
          if (!unmountedRef.current) setupWs(roomCode);
        }, 2000);
      }
    };

    return ws;
  }, []);

  useEffect(() => {
    if (!player) return;
    const ws = setupWs(player.room_code);
    return () => { ws.close(); };
  }, [player, setupWs]);

  // Leaderboard polling
  const { data: leaderboard, refetch: refetchLeaderboard } = useQuery({
    queryKey: ["leaderboard", gameId],
    queryFn: () => api<LeaderboardResponse>(`/games/${gameId}/leaderboard`),
    refetchInterval: gameEnded ? 1500 : 3000,
    enabled: !!player,
  });

  // Auto-end when all questions answered
  const totalQuestions = quiz?.questions?.length ?? 0;
  const allAnswered = totalQuestions > 0 && answered.size >= totalQuestions;

  useEffect(() => {
    if (allAnswered) {
      const id = setTimeout(() => {
        refetchLeaderboard();
        setGameEnded(true);
      }, 2500); // brief delay so the last result feedback is visible
      return () => clearTimeout(id);
    }
  }, [allAnswered, refetchLeaderboard]);

  async function submit(answer: string) {
    if (!player || submitting || answered.has(currentIdx)) return;
    setSubmitting(true);
    setLastResult(null);
    setSelectedAnswers((prev) => ({ ...prev, [currentIdx]: answer }));
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
      setAnswered((set) => new Set(set).add(currentIdx));
    } finally {
      setSubmitting(false);
    }
  }

  if (!player) return null;
  if (gameEnded) return <ResultScreen player={player} score={score} leaderboard={leaderboard} />;
  if (!gameStarted || !quiz) return <WaitingScreen player={player} />;

  const currentQ = quiz.questions[currentIdx];
  const timeLimit = currentQ?.time_limit ?? 30;

  return (
    <main className="mx-auto max-w-3xl px-3 sm:px-4 py-6 sm:py-10 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <div className="text-xs sm:text-sm text-muted-foreground">Playing as</div>
          <div className="text-lg sm:text-xl font-semibold truncate">{player.name}</div>
        </div>
        <div className="text-right">
          <div className="text-xs sm:text-sm text-muted-foreground">Score</div>
          <div className="text-2xl sm:text-3xl font-extrabold" style={{ color: "var(--color-primary)" }}>
            {score}
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Question {currentIdx + 1} of {totalQuestions}</span>
          <span>{answered.size} / {totalQuestions} answered</span>
        </div>
        <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${((currentIdx + 1) / totalQuestions) * 100}%`,
              background: "var(--gradient-hero)",
            }}
          />
        </div>
      </div>

      {/* Question */}
      {currentQ && (
        <QuestionCard
          question={currentQ}
          isAnswered={answered.has(currentIdx)}
          submitting={submitting}
          lastResult={lastResult}
          selectedAnswer={selectedAnswers[currentIdx] ?? null}
          timeLimit={timeLimit}
          onSubmit={submit}
        />
      )}

      {/* Live leaderboard */}
      <div className="card">
        <h3 className="font-semibold mb-3">Live leaderboard</h3>
        <ol className="space-y-2">
          {leaderboard?.leaderboard?.length
            ? leaderboard.leaderboard.map((p) => (
                <li
                  key={p.participant_id}
                  className={`flex items-center justify-between rounded-lg px-3 py-2 ${
                    p.participant_id === player.participant_id
                      ? "bg-primary/20 font-semibold"
                      : "bg-secondary/60"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span className="font-mono text-accent">#{p.rank}</span>
                    <span>{p.name}</span>
                  </span>
                  <span className="font-mono font-semibold">{p.score}</span>
                </li>
              ))
            : <p className="text-sm text-muted-foreground">No scores yet.</p>}
        </ol>
      </div>

      <Link to="/" className="text-sm text-muted-foreground underline">Leave game</Link>
      <Styles />
    </main>
  );
}