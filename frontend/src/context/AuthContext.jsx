import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('remindiq_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const res = await api.get('/auth/me');
      if (res.data?.user) {
        setUser(res.data.user);
        localStorage.setItem('remindiq_user', JSON.stringify(res.data.user));
        return res.data.user;
      }
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        setUser(null);
        localStorage.removeItem('remindiq_user');
        localStorage.removeItem('remindiq_token');
      }
    }
    return null;
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('remindiq_token');
    if (!token && !user) {
      setLoading(false);
      return;
    }

    refreshUser().finally(() => {
      setLoading(false);
    });
  }, [refreshUser]);

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

  const register = async (payload, maybeEmail, maybePassword, maybePhone, maybeConfirmPassword) => {
    // Accepts either object { name, email, phone, password, confirmPassword } or positional args for backwards compat
    let body = {};
    if (payload && typeof payload === 'object') {
      body = payload;
    } else {
      body = {
        name: payload,
        email: maybeEmail,
        password: maybePassword,
        phone: maybePhone,
        confirmPassword: maybeConfirmPassword,
      };
    }

    const res = await api.post('/auth/register', body);
    if (res.data?.token) {
      localStorage.setItem('remindiq_token', res.data.token);
    }
    if (res.data?.user) {
      setUser(res.data.user);
      localStorage.setItem('remindiq_user', JSON.stringify(res.data.user));
    }
    return res.data;
  };

  const updateProfile = async (profileData) => {
    const res = await api.put('/auth/profile', profileData);
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

  const isSuperAdmin = user?.role === 'superadmin';

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isSuperAdmin,
        loading,
        login,
        register,
        logout,
        updateProfile,
        refreshUser,
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

export default AuthContext;
