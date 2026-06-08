import { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('rq_token') || '');

  useEffect(() => {
    if (token) localStorage.setItem('rq_token', token);
    else localStorage.removeItem('rq_token');
  }, [token]);

  const login = (t) => setToken(t);
  const logout = () => setToken('');

  return (
    <AuthContext.Provider value={{ token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
