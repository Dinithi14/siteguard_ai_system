import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser, loginUser, registerUser, logoutUser } from '../api/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('siteguard_user');
    if (!saved) return null;

    try {
      return JSON.parse(saved);
    } catch {
      localStorage.removeItem('siteguard_user');
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('siteguard_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyUser = async () => {
      const storedToken = localStorage.getItem('siteguard_token');
      if (storedToken) {
        try {
          const userData = await getCurrentUser();
          setUser(userData);
          localStorage.setItem('siteguard_user', JSON.stringify(userData));
        } catch (err) {
          console.error('Session validation error:', err);
          if (err.response?.status === 401) {
            setUser(null);
            setToken(null);
            localStorage.removeItem('siteguard_token');
            localStorage.removeItem('siteguard_user');
          }
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    verifyUser();
  }, []);

  const login = async (email, password) => {
    const data = await loginUser(email, password);
    localStorage.setItem('siteguard_token', data.access_token);
    setToken(data.access_token);

    // Fetch user profile immediately with new token
    const profile = await getCurrentUser();
    setUser(profile);
    localStorage.setItem('siteguard_user', JSON.stringify(profile));
    return profile;
  };

  const register = async (userData) => {
    const res = await registerUser(userData);
    return res;
  };

  const refreshUser = async () => {
    const profile = await getCurrentUser();
    setUser(profile);
    localStorage.setItem('siteguard_user', JSON.stringify(profile));
    return profile;
  };

  const logout = async () => {
    try {
      await logoutUser();
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('siteguard_token');
      localStorage.removeItem('siteguard_user');
    }
  };

  const roleName = typeof user?.role === 'string' ? user.role : user?.role?.name;
  const isAdmin = roleName === 'ADMIN';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        refreshUser,
        logout,
        isAuthenticated: !!user,
        isAdmin,
        roleName: roleName || 'USER',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
