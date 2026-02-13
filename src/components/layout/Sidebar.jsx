// src/components/layout/Sidebar.jsx - UPDATED WITH CLEANER MENU ITEMS
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home as HomeIcon,
  People as PeopleIcon,
  BarChart as BarChartIcon,
  Settings as SettingsIcon,
  CompareArrows as CompareArrowsIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  History as HistoryIcon,
  SupervisedUserCircle as SupervisorIcon,
  Dashboard as DashboardIcon
} from '@mui/icons-material';
import authService from '../../services/auth.service';
import '../../styles/sidebar.css';

const Sidebar = ({ onMenuToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [isSupervisor, setIsSupervisor] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (user) {
      setUserRole(user.role);
      setIsSupervisor(user.role === 'supervisor' || user.role === 'SUPERVISOR');
      setIsAdmin(user.role === 'admin' || user.role === 'ADMIN');
    }
  }, []);

  // Menu items for regular officers and admins
  const regularMenuItems = [
    {
      id: 'dashboard',
      label: 'Home',
      icon: <DashboardIcon fontSize="small" />,
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
    }
  ];

  // Supervisor-specific menu items (replaces regular dashboard)
  const supervisorMenuItems = [
    {
      id: 'supervisor-dashboard',
      label: 'Dashboard',
      icon: <DashboardIcon fontSize="small" />,
      path: '/supervisor/dashboard'
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
    }
  ];

  // Admin menu items (can see everything)
  const adminMenuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <DashboardIcon fontSize="small" />,
      path: '/admin/dashboard'
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
      id: 'supervisor',
      label: 'Supervisor View',
      icon: <SupervisorIcon fontSize="small" />,
      path: '/supervisor/dashboard'
    }
  ];

  // Select menu items based on role
  const getMenuItems = () => {
    if (isAdmin) return adminMenuItems;
    if (isSupervisor) return supervisorMenuItems;
    return regularMenuItems;
  };

  const menuItems = getMenuItems();

  const handleCollapse = () => {
    setCollapsed(!collapsed);
    if (onMenuToggle) onMenuToggle();
  };

  // Determine sidebar color based on role
  const getSidebarClass = () => {
    let baseClass = 'sidebar';
    if (collapsed) baseClass += ' collapsed';
    if (isSupervisor) baseClass += ' supervisor-sidebar';
    if (isAdmin) baseClass += ' admin-sidebar';
    return baseClass;
  };

  // Determine logo icon color based on role
  const getLogoIconClass = () => {
    if (isSupervisor) return 'logo-icon supervisor-logo-icon';
    if (isAdmin) return 'logo-icon admin-logo-icon';
    return 'logo-icon officer-logo-icon';
  };

  // Determine logo text color
  const getLogoTextClass = () => {
    if (isSupervisor) return 'logo-text supervisor-logo-text';
    if (isAdmin) return 'logo-text admin-logo-text';
    return 'logo-text officer-logo-text';
  };

  // Get role-specific subtitle
  const getRoleSubtitle = () => {
    if (isSupervisor) return 'Supervisor Portal';
    if (isAdmin) return 'Admin Portal';
    if (userRole === 'officer' || userRole === 'OFFICER') return 'Officer Portal';
    return 'Collections Portal';
  };

  // Get user initials for collapsed state
  const getUserInitial = () => {
    const user = authService.getCurrentUser();
    if (user?.name) return user.name.charAt(0).toUpperCase();
    if (user?.username) return user.username.charAt(0).toUpperCase();
    if (isSupervisor) return 'S';
    if (isAdmin) return 'A';
    return 'U';
  };

  // Get logo title based on role
  const getLogoTitle = () => {
    if (isSupervisor) return 'Supervisor';
    if (isAdmin) return 'Admin';
    return 'Rekova';
  };

  return (
    <div className={getSidebarClass()}>
      {/* Logo Section - Role-based styling */}
      <div className="sidebar-logo">
        <div className={getLogoIconClass()}>
          {collapsed ? (
            <span className={getLogoTextClass()}>{getUserInitial()}</span>
          ) : (
            <span className={getLogoTextClass()}>R</span>
          )}
        </div>
        {!collapsed && (
          <div className="logo-text-container">
            <h3 className={
              isSupervisor ? 'supervisor-logo-title' : 
              isAdmin ? 'admin-logo-title' : 
              'officer-logo-title'
            }>
              {getLogoTitle()}
            </h3>
            <p className={`logo-subtitle ${
              isSupervisor ? 'supervisor-subtitle' : 
              isAdmin ? 'admin-subtitle' : 
              'officer-subtitle'
            }`}>
              {getRoleSubtitle()}
            </p>
          </div>
        )}
        <button 
          className={`collapse-btn ${
            isSupervisor ? 'supervisor-collapse-btn' : 
            isAdmin ? 'admin-collapse-btn' : 
            'officer-collapse-btn'
          }`}
          onClick={handleCollapse}
        >
          {collapsed ? <ChevronRightIcon fontSize="small" /> : <ChevronLeftIcon fontSize="small" />}
        </button>
      </div>

      {/* Menu Items - Role-aware styling */}
      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path || 
                          location.pathname.startsWith(item.path + '/');
          const isSupervisorItem = item.id === 'supervisor-dashboard';
          const isAdminDashboard = item.id === 'dashboard' && isAdmin;
          
          return (
            <button
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''} ${
                isSupervisorItem ? 'supervisor-nav-item' : 
                isAdminDashboard ? 'admin-nav-item' : ''
              }`}
              onClick={() => navigate(item.path)}
              title={collapsed ? item.label : ''}
            >
              <span className={`nav-icon mui-icon ${
                isSupervisorItem ? 'supervisor-nav-icon' : 
                isAdminDashboard ? 'admin-nav-icon' : ''
              }`}>
                {item.icon}
              </span>
              {!collapsed && (
                <span className={`nav-label ${
                  isSupervisorItem ? 'supervisor-nav-label' : 
                  isAdminDashboard ? 'admin-nav-label' : ''
                }`}>
                  {item.label}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer - Role-based info */}
      <div className="sidebar-footer">
        <div className="system-info">
          {!collapsed && (
            <div className="user-role-display">
              <p className={`role-text ${
                isSupervisor ? 'supervisor-role' : 
                isAdmin ? 'admin-role' : 
                'officer-role'
              }`}>
                {isSupervisor ? 'Supervisor' : 
                 isAdmin ? 'Admin' : 
                 userRole === 'officer' ? 'Collections Officer' : 'User'}
              </p>
            </div>
          )}
          {collapsed && (
            <div className="collapsed-role-icon">
              {isSupervisor ? '👨‍💼' : 
               isAdmin ? '👑' : 
               userRole === 'officer' ? '👮' : '👤'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;