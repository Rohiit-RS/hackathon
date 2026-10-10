import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('civictrack_token') || null);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState('login'); // 'login' or 'register'

  // Initialize with stored user token if present, otherwise start unauthenticated
  useEffect(() => {
    async function initAuth() {
      try {
        if (token) {
          const res = await api.getMe();
          if (res.user) {
            setUser(res.user);
          } else {
            // Invalid stored token
            setToken(null);
            setUser(null);
            localStorage.removeItem('civictrack_token');
          }
        } else {
          setUser(null);
        }
      } catch (err) {
        console.warn('Stored token expired or invalid:', err);
        setToken(null);
        setUser(null);
        localStorage.removeItem('civictrack_token');
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
    setIsAuthModalOpen(false);
    return res.user;
  };

  const register = async (userData) => {
    const res = await api.register(userData);
    setToken(res.token);
    setUser(res.user);
    localStorage.setItem('civictrack_token', res.token);
    setIsAuthModalOpen(false);
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
      setIsAuthModalOpen(false);
      return res.user;
    } catch (err) {
      console.error('Demo switch error:', err);
      throw err;
    }
  };

  const openAuthModal = (tab = 'login') => {
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    switchDemoRole,
    isAuthModalOpen,
    authModalTab,
    openAuthModal,
    closeAuthModal
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
