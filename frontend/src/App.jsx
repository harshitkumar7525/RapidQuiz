import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Navbar from './components/Navbar.jsx';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import QuizEditor from './pages/QuizEditor.jsx';
import HostGame from './pages/HostGame.jsx';
import JoinGame from './pages/JoinGame.jsx';
import PlayGame from './pages/PlayGame.jsx';
import Leaderboard from './pages/Leaderboard.jsx';

function Private({ children }) {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/join" element={<JoinGame />} />
          <Route path="/play/:gameId" element={<PlayGame />} />
          <Route path="/leaderboard/:gameId" element={<Leaderboard />} />
          <Route path="/dashboard" element={<Private><Dashboard /></Private>} />
          <Route path="/quizzes/new" element={<Private><QuizEditor /></Private>} />
          <Route path="/quizzes/:quizId/edit" element={<Private><QuizEditor /></Private>} />
          <Route path="/host/:quizId" element={<Private><HostGame /></Private>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
