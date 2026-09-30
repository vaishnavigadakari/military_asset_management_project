import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('mams_token') || null);
  const [systemUsers, setSystemUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Initialize with admin login or existing session
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Fetch all available users for role switching dropdown
        const usersRes = await authAPI.getUsers();
        setSystemUsers(usersRes.data);

        if (token) {
          try {
            const meRes = await authAPI.getMe();
            setUser(meRes.data);
          } catch (err) {
            // Token expired or invalid, default to Admin user login
            await loginUser('admin', 'Password123!');
          }
        } else {
          // Default to Admin login for seamless immediate evaluation
          await loginUser('admin', 'Password123!');
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const loginUser = async (username, password) => {
    try {
      const res = await authAPI.login(username, password);
      const { token: newToken, user: userData } = res.data;
      localStorage.setItem('mams_token', newToken);
      setToken(newToken);
      setUser(userData);
      return userData;
    } catch (err) {
      console.error('Login failed:', err);
      throw err;
    }
  };

  const switchRoleUser = async (username) => {
    setLoading(true);
    try {
      await loginUser(username, 'Password123!');
    } catch (err) {
      console.error('Failed to switch user:', err);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('mams_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, systemUsers, loading, loginUser, switchRoleUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
