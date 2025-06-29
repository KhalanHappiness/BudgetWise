import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Base URL 
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  // Check if user is already logged in on app load
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const userData = localStorage.getItem('user_data');
    
    if (token && userData) {
      setUser(JSON.parse(userData));
      setIsAuthenticated(true);
    }
  }, []);

  // Login function
  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Store token and user data
      localStorage.setItem('access_token', data.data.access_token);
      localStorage.setItem('user_data', JSON.stringify({
        id: data.data.user_id,
        username: data.data.username,
        email: email
      }));

      setUser({
        id: data.data.user_id,
        username: data.data.username,
        email: email
      });
      setIsAuthenticated(true);

      return data;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Signup function
  const signup = async (username, email, password) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // After successful registration, automatically log in the user
      await login(email, password);

      return data;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Demo login function (if you want to keep this feature)
  const loginDemo = async () => {
    setLoading(true);
    try {
      // Create a demo user without backend call
      const demoUser = {
        id: 'demo',
        username: 'Demo User',
        email: 'demo@budgetwise.com'
      };

      localStorage.setItem('access_token', 'demo_token');
      localStorage.setItem('user_data', JSON.stringify(demoUser));

      setUser(demoUser);
      setIsAuthenticated(true);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      
      if (token && token !== 'demo_token') {
        // Call backend logout endpoint
        await fetch(`${API_BASE_URL}/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      }

      // Clear local storage and state
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_data');
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      // Even if logout request fails, clear local state
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_data');
      setUser(null);
      setIsAuthenticated(false);
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Function to get auth headers for API calls
  const getAuthHeaders = () => {
    const token = localStorage.getItem('access_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  };

  // Function to make authenticated API calls
  const authenticatedFetch = async (url, options = {}) => {
    const token = localStorage.getItem('access_token');
    
    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
        ...options.headers,
      },
    };

    const response = await fetch(`${API_BASE_URL}${url}`, config);
    
    // If token is expired or invalid, logout user
    if (response.status === 401) {
      logout();
      throw new Error('Session expired. Please login again.');
    }

    return response;
  };

  const value = {
    user,
    login,
    signup,
    logout,
    loginDemo,
    loading,
    isAuthenticated,
    getAuthHeaders,
    authenticatedFetch,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};