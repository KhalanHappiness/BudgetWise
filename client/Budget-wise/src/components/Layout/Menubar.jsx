import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const location = useLocation();

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: 'bi-speedometer2' },
    { path: '/bills', label: 'Bills Manager', icon: 'bi-calendar-check' },
    { path: '/budget', label: 'Budget Manager', icon: 'bi-piggy-bank' },
    { path: '/expenses', label: 'Expense Tracker', icon: 'bi-receipt' },
    { path: '/insights', label: 'Insights', icon: 'bi-graph-up' }
  ];

  return (
    // Removed min-vh-100
    <div className="bg-white border-end shadow-sm">
      <div className="p-3">
        <nav className="nav flex-column">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-link py-3 px-3 rounded mb-1 ${
                location.pathname === item.path
                  ? 'bg-light text-primary fw-medium'
                  : 'text-dark hover-bg-light'
              }`}
              style={{
                textDecoration: 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <i className={`${item.icon} me-3`}></i>
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;