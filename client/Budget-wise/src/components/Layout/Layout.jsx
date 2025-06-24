import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import { Outlet } from 'react-router-dom';


const Layout = ({ children }) => {
  return (
    <div className="d-flex flex-column min-vh-100 bg-light">
      <Header />
      <div className="container-fluid flex-grow-1">
        <div className="row h-100">
          <div className="col-12 col-md-3 col-xl-2 bg-white border-end p-0">
            <Sidebar />
          </div>
          <div className="col-12 col-md-9 col-xl-10 py-4 px-3 overflow-auto">
            <div className="p-4">
              <Outlet/>
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Layout;