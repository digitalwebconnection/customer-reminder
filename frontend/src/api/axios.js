import axios from 'axios';

// Normalize API URL:
// 1. If VITE_API_URL is provided (e.g. 'https://customer-reminder-h18e.onrender.com' or '.../api/v1')
//    ensure it points to the '/api/v1' route without double slashes.
// 2. If not provided, fallback to '/api/v1' (uses Vite dev proxy or same-origin in production).
const getBaseURL = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (!envUrl) return '/api/v1';

  let cleanUrl = envUrl.trim().replace(/\/+$/, '');
  if (cleanUrl.endsWith('/api/v1')) return cleanUrl;
  if (cleanUrl.endsWith('/api')) return `${cleanUrl}/v1`;
  return `${cleanUrl}/api/v1`;
};

const api = axios.create({
  baseURL: getBaseURL(),
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach token from localStorage for reliable cross-domain authentication
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('remindiq_token');
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling common error responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If unauthenticated (401), clear saved auth tokens
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('remindiq_token');
      localStorage.removeItem('remindiq_user');
    }
    return Promise.reject(error);
  }
);

export default api;
