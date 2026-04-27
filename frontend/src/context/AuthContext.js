import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api, { setAccessToken, clearAccessToken } from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const initialize = useCallback(async () => {
    try {
      const res = await api.post('/auth/refresh');
      setAccessToken(res.data.accessToken);
      setUser(res.data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Add timeout so it never gets stuck loading forever
    const timeout = setTimeout(() => setLoading(false), 5000);
    initialize().finally(() => clearTimeout(timeout));
  }, [initialize]);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    setAccessToken(res.data.accessToken);
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = async () => {
    try { await api.post('/auth/logout'); } catch {}
    clearAccessToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAdmin: user?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);