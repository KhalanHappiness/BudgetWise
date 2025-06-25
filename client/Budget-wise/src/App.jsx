// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import BillsManager from './pages/BillsManager';
import BudgetManager from './pages/BudgetManager';
import ExpenseTracker from './pages/ExpenseTracker';
import Dashboard from './pages/Dashboard';
import Insights from './pages/Insights';
import Layout from './components/Layout/Layout';
import { AuthProvider } from './context/AuthContext';

const App = () => {
  return (
    <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route element={<Layout/>}>

                
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/bills" element={<BillsManager />} />
                <Route path="/budget" element={<BudgetManager />} />
                <Route path="/expenses" element={<ExpenseTracker />} />
                <Route path="/insights" element={<Insights />} />

            </Route>
           


          </Routes>
        </Router>
    </AuthProvider>
  );
};

export default App;
