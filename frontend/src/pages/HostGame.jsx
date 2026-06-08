import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import useGameSocket from '../hooks/useGameSocket.js';

export default function HostGame() {
  const { quizId } = useParams();
  const { token } = useAuth();
  const nav = useNavigate();
  const [session, setSession] = useState(null);
  const [err, setErr] = useState('');
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const data = await api('/games/create', { method: 'POST', token, body: { quiz_id: quizId } });
        setSession(data);
      } catch (e) { setErr(e.message); }
    })();
  }, [quizId, token]);

  const { connected, send } = useGameSocket(session?.room_code, (msg) => {
    if (msg.type === 'player_joined' && msg.data) {
      setPlayers(p => [...p, msg.data]);
    }
  });

  const start = () => {
    send('game_start', { game_id: session.game_id });
    nav(`/leaderboard/${session.game_id}`);
  };

  if (err) return <div className="error">{err}</div>;
  if (!session) return <p className="muted">Creating game…</p>;

  return (
    <div className="host">
      <h2>Game lobby</h2>
      <div className="room-code">
        <span className="muted">Room code</span>
        <strong>{session.room_code}</strong>
        <button className="btn ghost sm" onClick={() => navigator.clipboard.writeText(session.room_code)}>Copy</button>
      </div>
      <p className="muted">Share this code. Players join at <code>/join</code>. Connection: {connected ? 'live' : 'connecting…'}</p>

      <div className="player-list">
        <h3>Players ({players.length})</h3>
        {players.length === 0 ? <p className="muted">Waiting for players to join…</p> : (
          <ul>{players.map((p, i) => <li key={i}>{p.name || JSON.stringify(p)}</li>)}</ul>
        )}
      </div>

      <button className="btn primary lg" onClick={start}>Start game</button>
    </div>
  );
}
