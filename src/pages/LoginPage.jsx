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
    setLoading(true);
    setError('');

    const result = await authService.login(username, password);

    if (result.success) {
      navigate('/dashboard', { replace: true });
    } else {
      setError(result.message);
    }

    setLoading(false);
  };

  return (
    <Login
      onLogin={handleLogin}
      loading={loading}
      error={error}
    />
  );
};

export default LoginPage;
