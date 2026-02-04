// src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Login from '../components/Auth/Login';
import authService from '../services/auth.service';
import '../styles/auth.css';

const LoginPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (username, password) => {
    setError('');
    setLoading(true);

    try {
      const result = await authService.login(username, password);

      console.log('Login result:', result);

      if (result.success) {
        // Wait a moment for localStorage to be set
        setTimeout(() => {
          const userRole = result.role || authService.getUserRole();
          console.log('User role determined:', userRole);
          
          let redirectPath = '/dashboard';
          if (userRole === 'supervisor' || userRole === 'admin') {
            redirectPath = '/supervisor';
          }
          
          console.log('Redirecting to:', redirectPath);
          navigate(redirectPath);
        }, 100);
      } else {
        setError(result.message || 'Login failed. Please check your credentials.');
        setLoading(false);
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title"></h1>
        <p className="auth-subtitle"></p>
        
        <Login
          onLogin={handleLogin}
          loading={loading}
          error={error}
        />
        
        <div className="auth-footer">
          <p></p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;