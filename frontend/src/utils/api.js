import axios from 'axios';

const baseURL = process.env.NODE_ENV === 'production'
  ? '/api'
  : 'http://localhost:5000/api';

const api = axios.create({ baseURL });

// Attach JWT from localStorage to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
