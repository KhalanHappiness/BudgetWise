// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import BillsManager from './pages/BillsManager';
import BudgetManager from './pages/BudgetManager';
import { AuthProvider } from './context/AuthContext';

const App = () => {
  return (
    <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Login />} />
            {/* <Route path="/dashboard" element={<Dashboard />} /> */}
            <Route path="/bills" element={<BillsManager />} />
            <Route path="/budget" element={<BudgetManager />} />

          </Routes>
        </Router>
    </AuthProvider>
  );
};

export default App;
