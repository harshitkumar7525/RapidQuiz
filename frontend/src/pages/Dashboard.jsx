import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Dashboard() {
  const { token } = useAuth();
  const nav = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      const data = await api('/quizzes/', { token });
      setQuizzes(Array.isArray(data) ? data : []);
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const del = async (id) => {
    if (!confirm('Delete this quiz?')) return;
    try {
      await api(`/quizzes/${id}`, { method: 'DELETE', token });
      setQuizzes(q => q.filter(x => x.id !== id));
    } catch (e) { alert(e.message); }
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h2>Your quizzes</h2>
          <p className="muted">Create, edit, and launch live games.</p>
        </div>
        <Link to="/quizzes/new" className="btn primary">+ New quiz</Link>
      </div>
      {err && <div className="error">{err}</div>}
      {loading ? <p className="muted">Loading…</p> : (
        quizzes.length === 0 ? (
          <div className="empty">
            <h3>No quizzes yet</h3>
            <p className="muted">Create your first quiz to get started.</p>
            <Link to="/quizzes/new" className="btn primary">Create quiz</Link>
          </div>
        ) : (
          <div className="grid">
            {quizzes.map(q => (
              <div className="quiz-card" key={q.id}>
                <h3>{q.title}</h3>
                <p className="muted clip">{q.description || 'No description'}</p>
                <p className="meta">{(q.questions || []).length} question{(q.questions || []).length === 1 ? '' : 's'}</p>
                <div className="actions">
                  <button className="btn primary" onClick={() => nav(`/host/${q.id}`)}>Host</button>
                  <button className="btn ghost" onClick={() => nav(`/quizzes/${q.id}/edit`)}>Edit</button>
                  <button className="btn danger" onClick={() => del(q.id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
