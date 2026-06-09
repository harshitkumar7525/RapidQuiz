import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import useGameSocket from '../hooks/useGameSocket.js';

export default function HostGame() {
  const { quizId } = useParams();
  const { token } = useAuth();
  const nav = useNavigate();

  const [session, setSession] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [err, setErr] = useState('');
  const [players, setPlayers] = useState([]);
  const [gameStatus, setGameStatus] = useState('waiting'); // waiting | running | ended
  const [qIndex, setQIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef(null);

  // 1. Create game session + load quiz on mount
  useEffect(() => {
    (async () => {
      try {
        const sessionData = await api('/games/create', { method: 'POST', token, body: { quiz_id: quizId } });
        setSession(sessionData);
        // Load full quiz so we can broadcast it to participants and show progress
        const quizData = await api(`/quizzes/${quizId}`);
        setQuiz(quizData);
      } catch (e) { setErr(e.message); }
    })();
  }, [quizId, token]);

  // 2. WebSocket — listen for players joining
  const { connected, send } = useGameSocket(session?.room_code, (msg) => {
    if (msg.type === 'player_joined' && msg.data) {
      setPlayers(p => {
        // Deduplicate by participant_id or name
        const id = msg.data.participant_id || msg.data.name;
        if (p.some(x => (x.participant_id || x.name) === id)) return p;
        return [...p, msg.data];
      });
    }
  });

  // 3. Start game — update backend status, then broadcast quiz payload + game_start signal
  const startGame = async () => {
    if (!quiz || !session) return;
    try {
      await api(`/games/${session.game_id}/status`, {
        method: 'PATCH',
        token,
        body: { status: 'running' },
      });
    } catch (e) {
      setErr(e.message);
      return;
    }
    // Combine quiz data and game_start into a single message so participants
    // can never receive game_start before the quiz payload (race-condition fix).
    send('game_start', { game_id: session.game_id, quiz });
    setGameStatus('running');
    setQIndex(0);
    startTimer(quiz.questions[0]?.time_limit || 30);
  };

  // 4. Advance to a specific question index (used by Skip + auto-advance)
  const goToQuestion = async (nextIndex) => {
    if (!quiz) return;
    clearInterval(timerRef.current);

    if (nextIndex >= quiz.questions.length) {
      // Game over — update backend status then broadcast
      try {
        await api(`/games/${session.game_id}/status`, {
          method: 'PATCH',
          token,
          body: { status: 'ended' },
        });
      } catch (_) { /* non-critical, navigate anyway */ }
      send('game_end', { game_id: session.game_id });
      setGameStatus('ended');
      nav(`/leaderboard/${session.game_id}`);
      return;
    }

    // Stamp question_started_at on the backend BEFORE broadcasting next_question
    // so the elapsed-time scoring is anchored to the correct server timestamp.
    try {
      await api(`/games/${session.game_id}/next`, {
        method: 'POST',
        token,
        body: { index: nextIndex },
      });
    } catch (_) { /* non-critical — scoring degrades gracefully */ }

    setQIndex(nextIndex);
    send('next_question', { index: nextIndex });
    startTimer(quiz.questions[nextIndex]?.time_limit || 30);
  };

  const skipQuestion = () => goToQuestion(qIndex + 1);

  // 5. Countdown timer — auto-advance when it hits 0
  const startTimer = (seconds) => {
    clearInterval(timerRef.current);
    setTimeLeft(seconds);
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          // Use a small delay so the "0" is visible before moving on
          setTimeout(() => setQIndex(cur => { goToQuestion(cur + 1); return cur; }), 800);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  // Cleanup timer on unmount
  useEffect(() => () => clearInterval(timerRef.current), []);

  if (err) return <div className="error">{err}</div>;
  if (!session || !quiz) return <p className="muted">Setting up game…</p>;

  const currentQ = quiz.questions[qIndex];
  const totalQ = quiz.questions.length;

  // ── Lobby ──────────────────────────────────────────────────────────────────
  if (gameStatus === 'waiting') {
    return (
      <div className="host">
        <h2>Game lobby</h2>
        <div className="room-code">
          <span className="muted">Room code</span>
          <strong>{session.room_code}</strong>
          <button className="btn ghost sm" onClick={() => navigator.clipboard.writeText(session.room_code)}>Copy</button>
        </div>
        <p className="muted">
          Share this code. Players join at <code>/join</code>.{' '}
          Connection: {connected ? '🟢 live' : '🔴 connecting…'}
        </p>

        <div className="player-list">
          <h3>Players ({players.length})</h3>
          {players.length === 0
            ? <p className="muted">Waiting for players to join…</p>
            : <ul>{players.map((p, i) => <li key={i}>{p.name || JSON.stringify(p)}</li>)}</ul>
          }
        </div>

        <button className="btn primary lg" onClick={startGame} disabled={!connected}>
          Start game →
        </button>
      </div>
    );
  }

  // ── Running ────────────────────────────────────────────────────────────────
  return (
    <div className="host host-running">
      <div className="host-header">
        <span className="muted">Question {qIndex + 1} / {totalQ}</span>
        <span className={`timer ${timeLeft <= 5 ? 'danger' : ''}`}>{timeLeft}s</span>
      </div>

      {/* Progress bar */}
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${((qIndex) / totalQ) * 100}%` }} />
      </div>

      <h2 className="q-title">{currentQ?.question}</h2>

      <div className="opt-grid host-opts">
        {currentQ?.options.map((opt, i) => (
          <div key={i} className={`opt-btn host-opt ${opt === currentQ.correct_answer ? 'correct' : ''}`}>
            {opt}
            {opt === currentQ.correct_answer && <span className="correct-badge">✓ correct</span>}
          </div>
        ))}
      </div>

      <div className="host-actions">
        <button className="btn ghost" onClick={() => nav(`/leaderboard/${session.game_id}`)}>
          View leaderboard
        </button>
        <button className="btn primary" onClick={skipQuestion}>
          {qIndex + 1 >= totalQ ? 'End game' : 'Skip / Next →'}
        </button>
      </div>

      <p className="muted small">{players.length} player{players.length !== 1 ? 's' : ''} in game</p>
    </div>
  );
}