import React from 'react';
import { useAuth } from '../../context/AuthContext';

const Header = ({ onToggleSidebar }) => {
  const { currentUser, logout } = useAuth();

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm">
      <div className="container-fluid d-flex justify-content-between align-items-center">
        
        {/* Sidebar Toggle Button (visible only on small screens) */}
        <button 
          className="btn btn-outline-light d-md-none me-2" 
          onClick={onToggleSidebar}
        >
          <i className="bi bi-list"></i>
        </button>

        {/* Brand */}
        <a className="navbar-brand fw-bold mb-0 h1" href="/">
          <i className="bi bi-wallet2 me-2"></i>
          Budget Wise
        </a>

        {/* User Menu */}
        <div className="navbar-nav ms-auto">
          <div className="nav-item dropdown">
            <a 
              className="nav-link dropdown-toggle text-white" 
              href="#" 
              role="button" 
              data-bs-toggle="dropdown"
            >
              <i className="bi bi-person-circle me-2"></i>
              {currentUser?.name}
            </a>
            <ul className="dropdown-menu dropdown-menu-end">
              <li>
                <a className="dropdown-item" href="#">
                  <i className="bi bi-person me-2"></i>
                  Profile
                </a>
              </li>
              <li>
                <a className="dropdown-item" href="#">
                  <i className="bi bi-gear me-2"></i>
                  Settings
                </a>
              </li>
              <li><hr className="dropdown-divider" /></li>
              <li>
                <button 
                  className="dropdown-item text-danger" 
                  onClick={logout}
                >
                  <i className="bi bi-box-arrow-right me-2"></i>
                  Logout
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Header;
