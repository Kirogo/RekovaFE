//src/LayoutWrapper.jsx
import React from 'react';
import Sidebar from './components/layout/Sidebar'; 
import Navbar from './components/layout/Navbar';
import './styles/layout.css';

const LayoutWrapper = ({ children }) => {
  return (
    <div className="layout-wrapper">
      <div className="layout-main-content">
        {children}
      </div>
    </div>
  );
};

export default LayoutWrapper;