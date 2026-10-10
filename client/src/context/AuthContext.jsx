import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('civictrack_token') || null);
  const [loading, setLoading] = useState(true);

  // Initialize with stored user or default demo citizen
  useEffect(() => {
    async function initAuth() {
      try {
        if (token) {
          const res = await api.getMe();
          if (res.user) {
            setUser(res.user);
          } else {
            // Default to citizen demo login
            await switchDemoRole('citizen');
          }
        } else {
          // Default to citizen demo login
          await switchDemoRole('citizen');
        }
      } catch (err) {
        console.warn('Auth init failed, loading demo citizen:', err);
        try {
          await switchDemoRole('citizen');
        } catch (e) {
          console.error('Demo auth failed:', e);
        }
      } finally {
        setLoading(false);
      }
    }

    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await api.login(email, password);
    setToken(res.token);
    setUser(res.user);
    localStorage.setItem('civictrack_token', res.token);
    return res.user;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('civictrack_token');
  };

  const switchDemoRole = async (roleOrEmail) => {
    try {
      const isEmail = roleOrEmail.includes('@');
      const res = await api.demoSwitch(
        isEmail ? undefined : roleOrEmail,
        isEmail ? roleOrEmail : undefined
      );
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem('civictrack_token', res.token);
      return res.user;
    } catch (err) {
      console.error('Demo switch error:', err);
      throw err;
    }
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
    switchDemoRole
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
