import React, { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import { Outlet } from 'react-router-dom';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="d-flex flex-column min-vh-100 bg-light">
      <Header onToggleSidebar={() => setSidebarOpen(prev => !prev)} />
      
      <div className="container-fluid flex-grow-1">
        <div className="row h-100">
          <div
            className={`
              col-12 col-md-3 col-xl-2 p-0 
              ${sidebarOpen ? 'd-block' : 'd-none'} 
              d-md-block bg-white border-end
            `}
             style={{
                  width: sidebarOpen ? '75%' : '',
                  maxWidth: '240px',
                  zIndex: 1040,
                  position: 'absolute',
                  
                }}
          >
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>

          <div className="col-12 col-md-9 col-xl-10 py-4 px-3 overflow-auto">
            <div className="p-4">
              <Outlet />
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Layout;
