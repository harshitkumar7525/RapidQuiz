import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr(''); setLoading(true);
    try {
      const data = await api('/auth/login', { method: 'POST', body: form });
      login(data.token);
      nav('/dashboard');
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="auth-card">
      <h2>Welcome back</h2>
      <p className="muted">Log in to host your quizzes.</p>
      <form onSubmit={submit} className="form">
        <label>Email<input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></label>
        <label>Password<input type="password" required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></label>
        {err && <div className="error">{err}</div>}
        <button className="btn primary" disabled={loading}>{loading ? 'Logging in…' : 'Log in'}</button>
      </form>
      <p className="muted center">No account? <Link to="/register">Sign up</Link></p>
    </div>
  );
}
