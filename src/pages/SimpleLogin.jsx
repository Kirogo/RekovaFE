// src/pages/SimpleLogin.jsx - Emergency fix
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/auth.service';

const SimpleLogin = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setLoading(true);
    setError('');
    
    try {
      const result = await authService.login(username, password);
      
      if (result && result.success) {
        // Use window.location instead of navigate to avoid React Router issues
        window.location.href = '/dashboard';
      } else {
        setError(result?.message || 'Login failed');
      }
    } catch (err) {
      setError('Login error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      backgroundColor: '#f5f5f5'
    }}>
      <div style={{ 
        background: 'white', 
        padding: '40px', 
        borderRadius: '8px', 
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        width: '350px'
      }}>
        <h2 style={{ marginBottom: '20px', textAlign: 'center' }}>Login</h2>
        {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
              required
            />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '10px',
              background: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <button 
            onClick={() => window.location.href = '/dashboard'}
            style={{ background: 'transparent', border: 'none', color: '#007bff', cursor: 'pointer' }}
          >
            Go to Dashboard (if already logged in)
          </button>
        </div>
      </div>
    </div>
  );
};

export default SimpleLogin;