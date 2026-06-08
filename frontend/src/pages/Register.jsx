import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Register() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr(''); setLoading(true);
    try {
      const data = await api('/auth/register', { method: 'POST', body: form });
      login(data.token);
      nav('/dashboard');
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="auth-card">
      <h2>Create your account</h2>
      <p className="muted">Start hosting quizzes in seconds.</p>
      <form onSubmit={submit} className="form">
        <label>Name<input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></label>
        <label>Email<input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></label>
        <label>Password<input type="password" required minLength={6} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></label>
        {err && <div className="error">{err}</div>}
        <button className="btn primary" disabled={loading}>{loading ? 'Creating…' : 'Create account'}</button>
      </form>
      <p className="muted center">Already have one? <Link to="/login">Log in</Link></p>
    </div>
  );
}
