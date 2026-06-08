import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api/client.js';

export default function JoinGame() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const [form, setForm] = useState({ room_code: params.get('code') || '', name: '' });
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr(''); setLoading(true);
    try {
      const body = { room_code: form.room_code.trim().toUpperCase(), name: form.name.trim() };
      const data = await api('/games/join', { method: 'POST', body });
      sessionStorage.setItem(`rq_p_${data.game_id}`, data.participant_id);
      sessionStorage.setItem(`rq_room_${data.game_id}`, body.room_code);
      sessionStorage.setItem(`rq_name_${data.game_id}`, body.name);
      nav(`/play/${data.game_id}`);
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="auth-card">
      <h2>Join a game</h2>
      <p className="muted">Enter the room code your host shared.</p>
      <form onSubmit={submit} className="form">
        <label>Room code<input required value={form.room_code} onChange={e => setForm({ ...form, room_code: e.target.value })} maxLength={6} style={{ textTransform: 'uppercase', letterSpacing: '0.2em' }} /></label>
        <label>Your name<input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></label>
        {err && <div className="error">{err}</div>}
        <button className="btn primary" disabled={loading}>{loading ? 'Joining…' : 'Join game'}</button>
      </form>
    </div>
  );
}
