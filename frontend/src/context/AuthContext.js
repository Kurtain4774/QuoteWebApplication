import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const API = 'http://localhost:5000/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session from localStorage on first load
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { setLoading(false); return; }

    axios
      .get(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setUser(res.data.user))
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setLoading(false));
  }, []);

  async function register(username, email, password) {
    const res = await axios.post(`${API}/auth/register`, { username, email, password });
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
  }

  async function login(email, password) {
    const res = await axios.post(`${API}/auth/login`, { email, password });
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
  }

  function logout() {
    localStorage.removeItem('token');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
