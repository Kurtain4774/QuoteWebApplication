import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import api from "../utils/api";
import { useTheme } from "./ThemeContext";

const API = "http://localhost:5000/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { applyPreferences, resetTheme } = useTheme();

  // Fetches preferences from the dedicated endpoint (uses .lean() on backend,
  // so it always returns a plain object regardless of how the MongoDB document
  // was created or migrated).
  async function fetchAndApplyPreferences() {
    try {
      const res = await api.get("/users/preferences");
      console.log("Fetched preferences:", res.data.preferences);
      applyPreferences(res.data.preferences);
    } catch {
      // non-fatal: user stays logged in, theme defaults to light
    }
  }

  // Restore session from localStorage on first load
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    axios
      .get(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (res) => {
        setUser(res.data.user);
        await fetchAndApplyPreferences();
      })
      .catch(() => localStorage.removeItem("token"))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function register(username, email, password) {
    const res = await axios.post(`${API}/auth/register`, {
      username,
      email,
      password,
    });
    localStorage.setItem("token", res.data.token);
    setUser(res.data.user);
    await fetchAndApplyPreferences();
  }

  async function login(email, password) {
    const res = await axios.post(`${API}/auth/login`, { email, password });
    localStorage.setItem("token", res.data.token);
    setUser(res.data.user);
    await fetchAndApplyPreferences();
  }

  function logout() {
    localStorage.removeItem("token");
    setUser(null);
    resetTheme();
  }

  function updateUser(updates) {
    setUser((prev) => ({ ...prev, ...updates }));
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, register, login, logout, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
