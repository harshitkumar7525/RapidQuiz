import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api/client.js';

export default function Leaderboard() {
  const { gameId } = useParams();
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await api(`/games/${gameId}/leaderboard`);
        if (alive) setData(res);
      } catch (e) { if (alive) setErr(e.message); }
    };
    load();
    const id = setInterval(load, 2500);
    return () => { alive = false; clearInterval(id); };
  }, [gameId]);

  if (err) return <div className="error">{err}</div>;
  if (!data) return <p className="muted">Loading leaderboard…</p>;

  const rows = data.leaderboard || [];

  return (
    <div className="lb-page">
      <h2>Leaderboard</h2>
      <p className="muted">Updates live as players answer.</p>
      {rows.length === 0 ? <p className="muted">No scores yet.</p> : (
        <ol className="lb-list">
          {rows.map(r => (
            <li key={r.participant_id} className={`lb-row rank-${r.rank}`}>
              <span className="rank">#{r.rank}</span>
              <span className="name">{r.name}</span>
              <span className="score">{r.score}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
