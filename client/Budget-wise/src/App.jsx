// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import BillsManager from './pages/BillsManager'; // <-- Import your component
import { AuthProvider } from './context/AuthContext';

const App = () => {
  return (
    <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Login />} />
            {/* <Route path="/dashboard" element={<Dashboard />} /> */}
            <Route path="/bills" element={<BillsManager />} />
          </Routes>
        </Router>
    </AuthProvider>
  );
};

export default App;
