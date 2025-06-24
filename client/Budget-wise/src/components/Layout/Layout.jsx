import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

const Layout = ({ children }) => {
  return (
    <div className="min-vh-100 bg-light">
      <Header />
      <div className="container-fluid">
        <div className="row">
          <div className="col-lg-3 col-xl-2 p-0">
            <Sidebar />
          </div>
          <div className="col-lg-9 col-xl-10">
            <div className="p-4">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Layout;