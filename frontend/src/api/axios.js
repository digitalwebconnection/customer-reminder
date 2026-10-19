import axios from 'axios';

// Normalize API URL:
// 1. If VITE_API_URL is provided (e.g. 'https://customer-reminder-h18e.onrender.com' or '.../api/v1')
//    ensure it points to the '/api/v1' route without double slashes.
// 2. If not provided, fallback to '/api/v1' (uses Vite dev proxy or same-origin in production).
const getBaseURL = () => {
  // 1. In Vite dev mode, always use local proxy to avoid hitting stale remote Render instance
  if (import.meta.env.DEV) {
    return '/api/v1';
  }

  // 2. When running on localhost, 127.0.0.1, or private local LAN, use local proxy
  if (
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname === '::1' ||
      window.location.hostname.startsWith('192.168.') ||
      window.location.hostname.startsWith('10.') ||
      window.location.hostname.endsWith('.local'))
  ) {
    return '/api/v1';
  }

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
