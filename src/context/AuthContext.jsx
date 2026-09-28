import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchUsers, loginUser } from '../utils/api.js';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('fintech_kpi_user');
    const token = localStorage.getItem('fintech_kpi_token');
    return (saved && token) ? JSON.parse(saved) : null;
  });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'info') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => {
      setToast(prev => (prev?.message === message ? null : prev));
    }, 4000);
  };

  const loadUsers = async () => {
    try {
      const data = await fetchUsers();
      if (data.success) {
        setUsers(data.users);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const login = async (credentials) => {
    try {
      const data = await loginUser(credentials);
      if (data.success && data.user) {
        if (data.token) {
          localStorage.setItem('fintech_kpi_token', data.token);
        }
        localStorage.setItem('fintech_kpi_user', JSON.stringify(data.user));
        setCurrentUser(data.user);
        showToast(`Welcome back, ${data.user.name}`, 'success');
        return { success: true };
      }
      return { success: false, message: data.message || 'Login failed' };
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('fintech_kpi_user');
    localStorage.removeItem('fintech_kpi_token');
    showToast('Logged out successfully', 'info');
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      users,
      loading,
      login,
      logout,
      refreshUsers: loadUsers,
      toast,
      showToast
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
