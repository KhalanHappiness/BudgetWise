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
  const { currentUser } = useAuth();

  if (!currentUser) {
    return (
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/bills" element={<BillsManager />} />
        <Route path="/budget" element={<BudgetManager />} />
        <Route path="/expenses" element={<ExpenseTracker />} />
        <Route path="/insights" element={<Insights />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  );
};

export default AppRoutes;
