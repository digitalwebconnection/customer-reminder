import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for handling common error responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If unauthenticated (401), trigger session expired handling if needed
    if (error.response && error.response.status === 401) {
      // Allow caller or AuthContext to handle redirect to /login
    }
    return Promise.reject(error);
  }
);

export default api;
