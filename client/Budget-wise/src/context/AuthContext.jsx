import React, { createContext, useContext, useState } from 'react';
// import { authService } from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const user = await authService.login(email, password);
      setCurrentUser(user);
      return user;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (name, email, password) => {
    setLoading(true);
    try {
      const user = await authService.signup(name, email, password);
      setCurrentUser(user);
      return user;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loginDemo = () => {
    const demoUser = {
      id: 'demo',
      name: 'Demo User',
      email: 'demo@budgetwise.com'
    };
    setCurrentUser(demoUser);
  };

  const logout = () => {
    setCurrentUser(null);
    authService.logout();
  };

  const value = {
    currentUser,
    login,
    signup,
    loginDemo,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};