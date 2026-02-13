// src/components/layout/Navbar.jsx - UPDATED FOR PROPER PAGE TITLES
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import authService from '../../services/auth.service';
import '../../styles/navbar.css';

const Navbar = ({ title, onMenuToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [isSupervisor, setIsSupervisor] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
    if (currentUser) {
      setIsSupervisor(currentUser.role === 'supervisor' || currentUser.role === 'SUPERVISOR');
      setIsAdmin(currentUser.role === 'admin' || currentUser.role === 'ADMIN');
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current && 
        buttonRef.current &&
        !dropdownRef.current.contains(event.target) && 
        !buttonRef.current.contains(event.target)
      ) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const getPageTitle = () => {
    if (title) return title;
    
    const path = location.pathname;
    if (path.includes('/admin/dashboard')) return 'Admin Dashboard';
    if (path.includes('/supervisor/dashboard')) return 'Supervisor Dashboard';
    if (path.includes('/dashboard')) return 'Dashboard';
    if (path.includes('/customers')) return 'Customers';
    if (path.includes('/payments')) return 'Payments';
    if (path.includes('/transactions')) return 'Transactions';
    if (path.includes('/promises')) return 'Promises';
    if (path.includes('/reports')) return 'Reports';
    if (path.includes('/settings')) return 'Settings';
    if (path.includes('/supervisor')) return 'Supervisor';
    if (path.includes('/admin')) return 'Admin';
    return 'Dashboard';
  };

  const getPageSubtitle = () => {
    const path = location.pathname;
    if (path.includes('/admin/dashboard')) return 'System Administration';
    if (path.includes('/supervisor/dashboard')) return 'Team Management & Analytics';
    if (path.includes('/dashboard')) return 'Performance Overview';
    if (path.includes('/customers')) return 'Customer Management';
    if (path.includes('/promises')) return 'Payment Promises';
    if (isSupervisor) return 'Supervisor Portal';
    if (isAdmin) return 'Admin Portal';
    return 'Collections Officer';
  };

  const pageTitle = getPageTitle();
  const pageSubtitle = getPageSubtitle();

  // Get first letter of username or name
  const getUserInitial = () => {
    if (user?.name) return user.name.charAt(0).toUpperCase();
    if (user?.username) return user.username.charAt(0).toUpperCase();
    if (isSupervisor) return 'S';
    if (isAdmin) return 'A';
    return 'U';
  };

  // Get full username or name
  const getUserFullName = () => {
    if (user?.name) return user.name;
    if (user?.username) return user.username;
    return 'User';
  };

  // Get user role display
  const getUserRole = () => {
    if (isSupervisor) return 'Supervisor';
    if (isAdmin) return 'Administrator';
    if (user?.role === 'officer' || user?.role === 'OFFICER') return 'Collections Officer';
    return user?.role || 'User';
  };

  // Determine navbar color class
  const getNavbarClass = () => {
    if (isSupervisor) return 'navbar supervisor-navbar';
    if (isAdmin) return 'navbar admin-navbar';
    return 'navbar officer-navbar';
  };

  // Determine user button class
  const getUserButtonClass = () => {
    if (isSupervisor) return 'user-btn supervisor-user-btn';
    if (isAdmin) return 'user-btn admin-user-btn';
    return 'user-btn officer-user-btn';
  };

  return (
    <nav className={getNavbarClass()}>
      <div className="navbar-left">
        <button className={`menu-toggle-btn ${
          isSupervisor ? 'supervisor-menu-toggle' : 
          isAdmin ? 'admin-menu-toggle' : 
          'officer-menu-toggle'
        }`} onClick={onMenuToggle}>
          ☰
        </button>
        <div className="page-title">
          <h2>{pageTitle}</h2>
          <p className={`page-subtitle ${
            isSupervisor ? 'supervisor-subtitle' : 
            isAdmin ? 'admin-subtitle' : 
            'officer-subtitle'
          }`}>
            {pageSubtitle}
          </p>
        </div>
      </div>

      <div className="navbar-right">
        {/* Role Badge */}
        {/*<div className={`role-badge ${
          isSupervisor ? 'supervisor-badge' : 
          isAdmin ? 'admin-badge' : 
          'officer-badge'
        }`}>
          {getUserRole()}
        </div>*/}

        {/* User Profile */}
        <div className="user-profile">
          <button 
            ref={buttonRef}
            className={getUserButtonClass()}
            onClick={() => setShowUserMenu(!showUserMenu)}
            aria-expanded={showUserMenu}
          >
            <div className={`user-avatar ${
              isSupervisor ? 'supervisor-avatar' : 
              isAdmin ? 'admin-avatar' : 
              'officer-avatar'
            }`}>
              {getUserInitial()}
            </div>
          </button>

          {showUserMenu && (
            <div ref={dropdownRef} className="user-dropdown">
              {/* Dropdown header with role indicator */}
              <div className="dropdown-header">
                <div className={`dropdown-avatar ${
                  isSupervisor ? 'supervisor-dropdown-avatar' : 
                  isAdmin ? 'admin-dropdown-avatar' : 
                  'officer-dropdown-avatar'
                }`}>
                  {getUserInitial()}
                </div>
                <div>
                  <h4>{getUserFullName()}</h4>
                  <p className={`dropdown-role ${
                    isSupervisor ? 'supervisor-dropdown-role' : 
                    isAdmin ? 'admin-dropdown-role' : 
                    'officer-dropdown-role'
                  }`}>
                    {getUserRole()}
                  </p>
                </div>
              </div>
              
              <div className="dropdown-divider"></div>
              
              {/* Menu items */}
              <button className="dropdown-item" onClick={() => {
                navigate('/profile');
                setShowUserMenu(false);
              }}>
                <span className="icon">👤</span>
                Profile
              </button>
              
              {isSupervisor && (
                <button className="dropdown-item" onClick={() => {
                  navigate('/supervisor/dashboard');
                  setShowUserMenu(false);
                }}>
                  <span className="icon">👨‍💼</span>
                  Dashboard
                </button>
              )}
              
              {isAdmin && (
                <button className="dropdown-item" onClick={() => {
                  navigate('/admin/dashboard');
                  setShowUserMenu(false);
                }}>
                  <span className="icon">👑</span>
                  Dashboard
                </button>
              )}
              
              <button className="dropdown-item" onClick={() => {
                navigate('/settings');
                setShowUserMenu(false);
              }}>
                <span className="icon">⚙️</span>
                Settings
              </button>
              
              <div className="dropdown-divider"></div>
              
              <button className="dropdown-item logout" onClick={handleLogout}>
                <span className="icon">🚪</span>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;