import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useState } from 'react';

export default function Navbar() {
  const { token, logout } = useAuth();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => { logout(); nav('/'); setOpen(false); };
  const close = () => setOpen(false);

  return (
    <header className="nav">
      <div className="nav-inner">
        <Link to="/" className="brand" onClick={close}>
          <span className="brand-dot" />RapidQuiz
        </Link>
        <button className="burger" aria-label="menu" onClick={() => setOpen(o => !o)}>
          <span /><span /><span />
        </button>
        <nav className={`nav-links ${open ? 'open' : ''}`}>
          <Link to="/join" onClick={close}>Join</Link>
          {token ? (
            <>
              <Link to="/dashboard" onClick={close}>Dashboard</Link>
              <Link to="/quizzes/new" onClick={close}>New Quiz</Link>
              <button className="btn ghost" onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={close}>Login</Link>
              <Link to="/register" className="btn primary" onClick={close}>Sign up</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
