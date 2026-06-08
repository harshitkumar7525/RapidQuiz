import { useEffect, useMemo, useRef, useState } from 'react';
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
  const [status, setStatus] = useState('waiting');
  const [picked, setPicked] = useState(null);
  const [result, setResult] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [err, setErr] = useState('');
  const startedRef = useRef(false);

  useGameSocket(roomCode, async (msg) => {
    if (msg.type === 'game_start') {
      setStatus('running');
      setQIndex(0);
      setPicked(null);
      setResult(null);
    } else if (msg.type === 'next_question') {
      setQIndex((msg.data && msg.data.index) || 0);
      setPicked(null);
      setResult(null);
    } else if (msg.type === 'game_end') {
      nav(`/leaderboard/${gameId}`);
    }
  });

  useEffect(() => {
    if (!participantId) { nav('/join'); return; }
    // Try to load quiz info from game's room: we need quiz_id; without an endpoint, fetch via a join hint isn't possible.
    // The backend exposes GET /quizzes/:quizId publicly; we rely on the host sending quiz_id via WS at start.
  }, [participantId, nav]);

  // Listen for quiz payload from WS broadcast
  useGameSocket(roomCode, (msg) => {
    if (msg.type === 'quiz' && msg.data && !quiz) {
      setQuiz(msg.data);
    }
  });

  const currentQ = quiz && quiz.questions && quiz.questions[qIndex];

  // Timer
  useEffect(() => {
    if (!currentQ || status !== 'running') return;
    setTimeLeft(currentQ.time_limit || 30);
    startedRef.current = Date.now();
    const id = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(id); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [qIndex, status, currentQ]);

  const submit = async (answer) => {
    if (picked) return;
    setPicked(answer);
    try {
      const res = await api(`/games/${gameId}/answer`, {
        method: 'POST',
        body: { participant_id: participantId, question_index: qIndex, answer },
      });
      setResult(res);
    } catch (e) { setErr(e.message); }
  };

  if (err) return <div className="error">{err}</div>;

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

  if (status === 'waiting') {
    return (
      <div className="play-wait">
        <h2>You're in!</h2>
        <p className="muted">Hang tight — the game is about to begin.</p>
        <div className="pulse" />
      </div>
    );
  }

  if (!currentQ) return <p className="muted">Loading question…</p>;

  return (
    <div className="play">
      <div className="play-head">
        <span className="muted">Question {qIndex + 1}</span>
        <span className={`timer ${timeLeft <= 5 ? 'danger' : ''}`}>{timeLeft}s</span>
      </div>
      <h2 className="q-title">{currentQ.question}</h2>
      <div className="opt-grid">
        {currentQ.options.map((opt, i) => {
          const isPicked = picked === opt;
          const correct = result && result.is_correct && isPicked;
          const wrong = result && !result.is_correct && isPicked;
          return (
            <button key={i} disabled={!!picked || timeLeft === 0} onClick={() => submit(opt)}
              className={`opt-btn ${isPicked ? 'picked' : ''} ${correct ? 'correct' : ''} ${wrong ? 'wrong' : ''}`}>
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
      <button className="btn ghost" onClick={() => nav(`/leaderboard/${gameId}`)}>View leaderboard</button>
    </div>
  );
}
