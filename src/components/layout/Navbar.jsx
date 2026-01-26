// src/components/layout/Navbar.jsx - MINIMAL VERSION
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import authService from '../../services/auth.service';
import '../../styles/navbar.css';

const Navbar = ({ title, onMenuToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = authService.getCurrentUser();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

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
    if (path.includes('/dashboard')) return 'Dashboard';
    if (path.includes('/customers')) return 'Customers';
    if (path.includes('/payments')) return 'Payments';
    if (path.includes('/transactions')) return 'Transactions';
    if (path.includes('/reports')) return 'Reports';
    if (path.includes('/settings')) return 'Settings';
    return 'Promises';
  };

  const pageTitle = getPageTitle();

  // Get first letter of username or name
  const getUserInitial = () => {
    if (user?.name) return user.name.charAt(0).toUpperCase();
    if (user?.username) return user.username.charAt(0).toUpperCase();
    return 'U';
  };

  // Get full username or name
  const getUserFullName = () => {
    if (user?.name) return user.name;
    if (user?.username) return user.username;
    return 'User';
  };

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <button className="menu-toggle-btn" onClick={onMenuToggle}>
          ☰
        </button>
        <div className="page-title">
          <h2>{pageTitle}</h2>
          <p className="page-subtitle">
            {user?.role === 'ADMIN' ? '' : 
             user?.role === 'SUPERVISOR' ? '' : 
             ''}
          </p>
        </div>
      </div>

      <div className="navbar-right">

        {/* User Profile - Minimal version */}
        <div className="user-profile">
          <button 
            ref={buttonRef}
            className="user-btn"
            onClick={() => setShowUserMenu(!showUserMenu)}
            aria-expanded={showUserMenu}
          >
            <div className="user-avatar">
              {getUserInitial()}
            </div>
          </button>

          {showUserMenu && (
            <div ref={dropdownRef} className="user-dropdown">
              {/* Minimal header with only username */}
              <div className="dropdown-header">
                <div className="dropdown-avatar">
                  {getUserInitial()}
                </div>
                <h4>{getUserFullName()}</h4>
              </div>
              
              {/* Minimal menu items */}
              <button className="dropdown-item" onClick={() => {
                navigate('/profile');
                setShowUserMenu(false);
              }}>
                <span className="icon">👤</span>
                Profile
              </button>
              <button className="dropdown-item" onClick={() => {
                navigate('/settings');
                setShowUserMenu(false);
              }}>
                <span className="icon">⚙️</span>
                Settings
              </button>
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