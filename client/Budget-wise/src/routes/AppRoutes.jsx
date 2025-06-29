import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from '../pages/Dashboard';
import BillsManager from '../pages/BillsManager';
import BudgetManager from '../pages/BudgetManager';
import ExpenseTracker from '../pages/ExpenseTracker';
import Insights from '../pages/Insights';
import Login from '../pages/Login';
import Layout from '../components/Layout/Layout';
import { useAuth } from '../context/AuthContext';

const AppRoutes = () => {
  const { user } = useAuth(); // ✅ correct key from context

  const PrivateRoute = ({ children }) => {
    return user ? children : <Navigate to="/" replace />;
  };

  return (
    <Routes>
      {/* Public Route */}
      <Route path="/" element={!user ? <Login /> : <Navigate to="/dashboard" replace />} />

      {/* Protected Routes inside Layout */}
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/bills"
        element={
          <PrivateRoute>
            <Layout>
              <BillsManager />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/budget"
        element={
          <PrivateRoute>
            <Layout>
              <BudgetManager />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/expenses"
        element={
          <PrivateRoute>
            <Layout>
              <ExpenseTracker />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/insights"
        element={
          <PrivateRoute>
            <Layout>
              <Insights />
            </Layout>
          </PrivateRoute>
        }
      />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to={user ? "/dashboard" : "/"} replace />} />
    </Routes>
  );
};

export default AppRoutes;
