// src/App.jsx
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import SupervisorDashboard from './pages/SupervisorDashboard';
import CustomerPage from './pages/CustomerPage';
import ReportsPage from './pages/ReportsPage';
import CustomerDetails from './pages/CustomerDetails';
import PaymentPage from './pages/PaymentPage';
import TransactionsPage from './pages/TransactionsPage';
import Sidebar from './components/layout/Sidebar';
import Navbar from './components/layout/Navbar';
import LayoutWrapper from './LayoutWrapper';
import Promises from './pages/Promises';
import authService from './services/auth.service';
import './App.css';

// Auth Checker Component
const AuthChecker = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      if (location.pathname !== '/login') {
        if (!authService.isAuthenticated()) {
          console.log('Not authenticated, redirecting to login');
          authService.logout();
          navigate('/login', { replace: true });
        } else {
          console.log('Authenticated, proceeding to:', location.pathname);
        }
      }
      setIsChecking(false);
    };

    checkAuth();
  }, [location.pathname, navigate]);

  if (isChecking) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Checking authentication...</p>
      </div>
    );
  }

  return children;
};

// Main Layout component used by ALL protected pages
const MainLayout = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="app-container">
      <Sidebar
        onMenuToggle={toggleSidebar}
        user={authService.getCurrentUser()}
      />
      <div className={`main-content-wrapper ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <Navbar onMenuToggle={toggleSidebar} />
        <main className="main-content">
          <LayoutWrapper>
            {children}
          </LayoutWrapper>
        </main>
      </div>
    </div>
  );
};

// Protected Route component
const ProtectedRoute = ({ children, requireSupervisor = false, requireAdmin = false }) => {
  const isAuthenticated = authService.isAuthenticated();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check if route requires supervisor role
  if (requireSupervisor && !authService.isSupervisor() && !authService.isAdmin()) {
    return <Navigate to="/dashboard" replace />;
  }

  // Check if route requires admin role
  if (requireAdmin && !authService.isAdmin()) {
    return <Navigate to="/dashboard" replace />;
  }

  return <MainLayout>{children}</MainLayout>;
};

// Helper function to get default route based on user role
const getDefaultRoute = () => {
  if (authService.isAuthenticated()) {
    if (authService.isAdmin() || authService.isSupervisor()) {
      return "/supervisor";
    } else {
      return "/dashboard";
    }
  }
  return "/login";
};

function App() {
  return (
    <Router>
      <AuthChecker>
        <Routes>
          {/* Login route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Supervisor Dashboard - accessible to supervisors and admins */}
          <Route
            path="/supervisor"
            element={
              <ProtectedRoute requireSupervisor={true}>
                <SupervisorDashboard />
              </ProtectedRoute>
            }
          />

          {/* Regular Dashboard - accessible to all authenticated users */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          // In your App.jsx, update the Reports route:

          {/* Other protected routes */}
          <Route
            path="/customers"
            element={
              <ProtectedRoute>
                <CustomerPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customers/:id"
            element={
              <ProtectedRoute>
                <CustomerDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payments"
            element={
              <ProtectedRoute>
                <PaymentPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/transactions"
            element={
              <ProtectedRoute>
                <TransactionsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/promises"
            element={
              <ProtectedRoute>
                <Promises />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute> {/* Remove requireSupervisor={true} */}
                <ReportsPage />
              </ProtectedRoute>
            }
          />

          {/* Default route - Smart redirect based on role */}
          <Route
            path="/"
            element={
              <Navigate to={getDefaultRoute()} replace />
            }
          />

          {/* Catch-all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthChecker>
    </Router>
  );
}

export default App;