// src/hooks/auth/use-auth-context.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { isAuthenticated as checkAuth, getUserData, clearAuthData } from '@/utils/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication status on mount and when user changes
  useEffect(() => {
    const checkAuthStatus = () => {
      const authenticated = checkAuth();
      setIsAuthenticated(authenticated);
      setUser(authenticated ? getUserData() : null);
      setIsLoading(false);
    };

    checkAuthStatus();
  }, []);

  const value = {
    isAuthenticated,
    user,
    isLoading,
    logout: () => {
      clearAuthData();
      setIsAuthenticated(false);
      setUser(null);
    },
    login: (userData) => {
      setUser(userData);
      setIsAuthenticated(true);
    }
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}