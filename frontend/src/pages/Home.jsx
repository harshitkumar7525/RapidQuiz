import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <section className="hero">
      <div className="hero-text">
        <h1>Live quizzes. <span className="accent">Real-time fun.</span></h1>
        <p>Create a quiz in minutes, share a room code, and watch the leaderboard light up as players race to answer.</p>
        <div className="hero-cta">
          <Link to="/register" className="btn primary lg">Get started</Link>
          <Link to="/join" className="btn ghost lg">Join a game</Link>
        </div>
      </div>
      <div className="hero-card">
        <div className="card-row"><span>Room</span><strong>A1B2C3</strong></div>
        <div className="card-row"><span>Players</span><strong>24</strong></div>
        <div className="bar"><div style={{ width: '72%' }} /></div>
        <ul className="lb">
          <li><span>1. Bob</span><strong>340</strong></li>
          <li><span>2. Carol</span><strong>220</strong></li>
          <li><span>3. Dan</span><strong>180</strong></li>
        </ul>
      </div>
    </section>
  );
}
