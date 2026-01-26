// src/components/layout/Sidebar.jsx - UPDATED WITH PROMISES NAVIGATION
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home as HomeIcon,
  People as PeopleIcon,
  BarChart as BarChartIcon,
  Settings as SettingsIcon,
  CompareArrows as CompareArrowsIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import '../../styles/sidebar.css';

const Sidebar = ({ onMenuToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <HomeIcon fontSize="small" />,
      path: '/dashboard'
    },
    {
      id: 'customers',
      label: 'Customers',
      icon: <PeopleIcon fontSize="small" />,
      path: '/customers'
    },
    {
      id: 'transactions',
      label: 'Transactions',
      icon: <CompareArrowsIcon fontSize="small" />,
      path: '/transactions'
    },
    {
      id: 'promises',
      label: 'Promises',
      icon: <HistoryIcon fontSize="small" />,
      path: '/promises'
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: <BarChartIcon fontSize="small" />,
      path: '/reports'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <SettingsIcon fontSize="small" />,
      path: '/settings'
    }
  ];

  const handleCollapse = () => {
    setCollapsed(!collapsed);
    if (onMenuToggle) onMenuToggle();
  };

  return (
    <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Logo Section - Slightly Reduced */}
      <div className="sidebar-logo">
        <div className="logo-icon">
          <span className="logo-text">R</span>
        </div>
        {!collapsed && (
          <div className="logo-text-container">
            <h3>Rekova</h3>
            <p className="logo-subtitle">Collections Portal</p>
          </div>
        )}
        <button 
          className="collapse-btn"
          onClick={handleCollapse}
        >
          {collapsed ? <ChevronRightIcon fontSize="small" /> : <ChevronLeftIcon fontSize="small" />}
        </button>
      </div>

      {/* Menu Items - Improved Readability */}
      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path || 
                          location.pathname.startsWith(item.path + '/');
          return (
            <button
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <span className="nav-icon mui-icon">{item.icon}</span>
              {!collapsed && <span className="nav-label">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Footer - Minimal */}
      <div className="sidebar-footer">
        <div className="system-info">
          <p>
            {!collapsed && 'Version 1.0'}
            {collapsed && 'V1.0'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;