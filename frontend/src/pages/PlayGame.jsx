import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client.js';
import useGameSocket from '../hooks/useGameSocket.js';

export default function PlayGame() {
  const { gameId } = useParams();
  const nav = useNavigate();
  const participantId = sessionStorage.getItem(`rq_p_${gameId}`);
  const roomCode = sessionStorage.getItem(`rq_room_${gameId}`);
  const myName = sessionStorage.getItem(`rq_name_${gameId}`);

  const [quiz, setQuiz] = useState(null);
  const [qIndex, setQIndex] = useState(0);
  const [status, setStatus] = useState('waiting');  // waiting | running
  const [picked, setPicked] = useState(null);
  const [result, setResult] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [err, setErr] = useState('');

  const timerRef = useRef(null);
  const quizRef = useRef(null); // keep a ref so the WS callback can read it without stale closure
  const announcedRef = useRef(false); // ensure player_joined is sent only once

  // Keep quizRef in sync
  useEffect(() => { quizRef.current = quiz; }, [quiz]);

  // Guard: redirect if we lost our session state (e.g. hard-refresh)
  useEffect(() => {
    if (!participantId) nav('/join');
  }, [participantId, nav]);

  // Start a countdown for the current question
  const startTimer = useCallback((seconds) => {
    clearInterval(timerRef.current);
    setTimeLeft(seconds);
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); return 0; }
        return t - 1;
      });
    }, 1000);
  }, []);

  // Advance to a new question index — called on next_question and timer expiry
  const advanceToQuestion = useCallback((index) => {
    clearInterval(timerRef.current);
    setQIndex(index);
    setPicked(null);
    setResult(null);
    const q = quizRef.current?.questions?.[index];
    if (q) startTimer(q.time_limit || 30);
  }, [startTimer]);

  // Single WebSocket connection — handles ALL message types
  const { connected, send } = useGameSocket(roomCode, useCallback((msg) => {
    switch (msg.type) {
      case 'quiz':
        // Legacy / fallback: host broadcasts quiz as a separate message
        if (msg.data) setQuiz(msg.data);
        break;

      case 'game_start': {
        // Primary path: quiz data is embedded in the game_start payload so
        // both pieces arrive atomically (no race between two separate sends).
        // Fallback: if quiz was already set by a prior 'quiz' message, keep it.
        const quizPayload = msg.data?.quiz || quizRef.current;
        if (quizPayload) {
          setQuiz(quizPayload);
          quizRef.current = quizPayload; // update ref synchronously for the timer below
        }
        setStatus('running');
        setQIndex(0);
        setPicked(null);
        setResult(null);
        // Start timer for question 0 — quizRef.current is already up-to-date above,
        // so no setTimeout needed; we read it directly.
        const firstQ = quizPayload?.questions?.[0];
        if (firstQ) startTimer(firstQ.time_limit || 30);
        break;
      }

      case 'next_question': {
        const nextIndex = (msg.data && msg.data.index != null) ? msg.data.index : 0;
        advanceToQuestion(nextIndex);
        break;
      }

      case 'game_end':
        clearInterval(timerRef.current);
        nav(`/leaderboard/${gameId}`);
        break;

      default:
        break;
    }
  }, [gameId, nav, startTimer, advanceToQuestion]));

  // Announce player_joined to the host via our own persistent socket.
  // This replaces the old one-shot socket in JoinGame, eliminating the race
  // where game_start could arrive before PlayGame's socket was open.
  useEffect(() => {
    if (!connected || announcedRef.current) return;
    const raw = sessionStorage.getItem(`rq_announce_${gameId}`);
    if (!raw) return;
    try {
      const payload = JSON.parse(raw);
      send('player_joined', payload);
      announcedRef.current = true;
      sessionStorage.removeItem(`rq_announce_${gameId}`);
    } catch (_) { /* non-critical */ }
  }, [connected, gameId, send]);

  // Auto-advance when timer hits 0 (participant side mirrors host)
  useEffect(() => {
    if (timeLeft !== 0 || status !== 'running' || !quiz) return;
    // Timer just expired — wait a beat then move on
    const id = setTimeout(() => {
      const next = qIndex + 1;
      if (next >= quiz.questions.length) {
        nav(`/leaderboard/${gameId}`);
      } else {
        advanceToQuestion(next);
      }
    }, 1200); // small grace period so the "0" is visible
    return () => clearTimeout(id);
  }, [timeLeft, status, quiz, qIndex, gameId, nav, advanceToQuestion]);

  // Cleanup timer on unmount
  useEffect(() => () => clearInterval(timerRef.current), []);

  const submit = async (answer) => {
    if (picked || timeLeft === 0) return;
    setPicked(answer);
    try {
      const res = await api(`/games/${gameId}/answer`, {
        method: 'POST',
        body: { participant_id: participantId, question_index: qIndex, answer },
      });
      setResult(res);
    } catch (e) { setErr(e.message); }
  };

  // ── Error ──────────────────────────────────────────────────────────────────
  if (err) return <div className="error">{err}</div>;

  // ── Waiting for quiz payload ───────────────────────────────────────────────
  if (!quiz) {
    return (
      <div className="play-wait">
        <h2>Hi {myName} 👋</h2>
        <p className="muted">Waiting for the host to start the game…</p>
        <div className="pulse" />
        <p className="muted small">Room: <strong>{roomCode}</strong></p>
      </div>
    );
  }

  // ── Waiting for game_start ─────────────────────────────────────────────────
  if (status === 'waiting') {
    return (
      <div className="play-wait">
        <h2>You're in!</h2>
        <p className="muted">Hang tight — the game is about to begin.</p>
        <div className="pulse" />
      </div>
    );
  }

  const currentQ = quiz.questions[qIndex];

  if (!currentQ) return <p className="muted">Loading question…</p>;

  // ── Active question ────────────────────────────────────────────────────────
  return (
    <div className="play">
      <div className="play-head">
        <span className="muted">Question {qIndex + 1} / {quiz.questions.length}</span>
        <span className={`timer ${timeLeft <= 5 ? 'danger' : ''}`}>{timeLeft}s</span>
      </div>

      {/* Progress bar */}
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${((qIndex) / quiz.questions.length) * 100}%` }} />
      </div>

      <h2 className="q-title">{currentQ.question}</h2>

      <div className="opt-grid">
        {currentQ.options.map((opt, i) => {
          const isPicked = picked === opt;
          const correct = result && result.is_correct && isPicked;
          const wrong = result && !result.is_correct && isPicked;
          return (
            <button
              key={i}
              disabled={!!picked || timeLeft === 0}
              onClick={() => submit(opt)}
              className={`opt-btn ${isPicked ? 'picked' : ''} ${correct ? 'correct' : ''} ${wrong ? 'wrong' : ''}`}
            >
              {opt}
            </button>
          );
        })}
      </div>

      {result && (
        <div className={`result ${result.is_correct ? 'good' : 'bad'}`}>
          {result.is_correct ? `✅ Correct! +${result.score} pts` : '❌ Wrong answer'}
        </div>
      )}

      {timeLeft === 0 && !result && (
        <div className="result bad">⏰ Time's up!</div>
      )}
    </div>
  );
}