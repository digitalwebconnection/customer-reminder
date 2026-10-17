import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('remindiq_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/auth/me')
      .then((res) => {
        if (res.data?.user) {
          setUser(res.data.user);
          localStorage.setItem('remindiq_user', JSON.stringify(res.data.user));
        }
      })
      .catch(() => {
        // If unauthenticated, clear local user and token
        setUser(null);
        localStorage.removeItem('remindiq_user');
        localStorage.removeItem('remindiq_token');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data?.token) {
      localStorage.setItem('remindiq_token', res.data.token);
    }
    if (res.data?.user) {
      setUser(res.data.user);
      localStorage.setItem('remindiq_user', JSON.stringify(res.data.user));
    }
    return res.data;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {}
    setUser(null);
    localStorage.removeItem('remindiq_user');
    localStorage.removeItem('remindiq_token');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
