import React, { useState, useEffect } from 'react';
import RightSidebar from './components/layout/RightSidebar';
import Sidebar from './components/layout/Sidebar'; 
import Navbar from './components/layout/Navbar';
import './styles/layout.css';

const LayoutWrapper = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  const handleSidebarToggle = (collapsed) => {
    setSidebarCollapsed(collapsed);
  };

  // Apply CSS class to main content when sidebar state changes
  useEffect(() => {
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
      // Remove both classes first
      mainContent.classList.remove('right-sidebar-expanded', 'right-sidebar-collapsed');
      
      // Add the correct class
      if (sidebarCollapsed) {
        mainContent.classList.add('right-sidebar-collapsed');
      } else {
        mainContent.classList.add('right-sidebar-expanded');
      }
    }

    // Also apply to body for global styling
    document.body.classList.remove('right-sidebar-expanded', 'right-sidebar-collapsed');
    if (sidebarCollapsed) {
      document.body.classList.add('right-sidebar-collapsed');
    } else {
      document.body.classList.add('right-sidebar-expanded');
    }

    return () => {
      if (mainContent) {
        mainContent.classList.remove('right-sidebar-expanded', 'right-sidebar-collapsed');
      }
      document.body.classList.remove('right-sidebar-expanded', 'right-sidebar-collapsed');
    };
  }, [sidebarCollapsed]);

  return (
    <div className="layout-wrapper">
      <div className="layout-main-content">
        {children}
      </div>
      <RightSidebar onToggle={handleSidebarToggle} />
    </div>
  );
};

export default LayoutWrapper;