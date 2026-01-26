// src/components/Auth/Login.jsx - Clean with Subtle Fill Animation
import React, { useState } from 'react';
import '../../../src/styles/components.css';
import Typography from '@mui/material/Typography';

const Login = ({ onLogin, loading, error, backendStatus = 'connected' }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!loading) {
      onLogin(username, password);
    }
  };

  const useTestCredentials = () => {
    setUsername('samuel.kirogo');
    setPassword('samuel.kirogo123');
  };

  return (
    <div className="kollect-century-wrapper">
      {backendStatus === 'disconnected' && (
        <div className="kollect-century-warning">
          <span className="kollect-warning-icon">⚠️</span>
          <span>Backend not connected. Make sure it's running on port 5000.</span>
        </div>
      )}

      <div className="kollect-century-card">
        {/* LEFT PANEL - Branding with Subtle Fill Animation */}
        <div className="kollect-century-left-panel">
          <div className="kollect-century-left-content">
            <div className="kollect-century-icon-container">
              <div className="kollect-money-fill-container">
                {/* Main icon container */}
                <div className="kollect-money-icon">
                  <div className="kollect-money-symbol">
                    <Typography
                      variant="h1"
                      sx={{
                        fontSize: '65px',
                        fontWeight: 700,
                        color: '#ffffffff',
                        fontFamily: "'Roboto', sans-serif",
                        textShadow: '2px 2px 4px rgba(0,0,0,0.2)',
                        lineHeight: 1
                      }}
                    >
                      R
                    </Typography>
                  </div>
                </div>

                {/* Subtle fill animation only */}
                <div className="kollect-money-fill-effect">
                  <div className="kollect-money-fill-layer"></div>
                </div>

                {/* Container outline */}
                <div className="kollect-money-container-outline"></div>
              </div>
            </div>
            <div className="kollect-century-brand">
              <h1 className="kollect-century-title">Rekova</h1>
              <p className="kollect-century-subtitle">Collections Portal</p>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL - Login Form */}
        <div className="kollect-century-right-panel">
          <div className="kollect-century-form-container">
            <div className="kollect-century-form-header">
              <h2 className="kollect-century-form-title">Sign In</h2>
              <p className="kollect-century-form-subtitle">Access your account</p>
            </div>

            <form onSubmit={handleSubmit} className="kollect-century-form">
              {error && (
                <div className="kollect-century-alert">
                  <span className="kollect-century-alert-icon">!</span>
                  <span className="kollect-century-alert-text">{error}</span>
                </div>
              )}

              <div className="kollect-century-field-group">
                <label className="kollect-century-field-label">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username or email"
                  required
                  disabled={loading}
                  autoFocus
                  className="kollect-century-input"
                />
              </div>

              <div className="kollect-century-field-group">
                <label className="kollect-century-field-label">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  disabled={loading}
                  className="kollect-century-input"
                />
              </div>

              <div className="kollect-century-actions">
                <button
                  type="submit"
                  disabled={loading || !username || !password}
                  className="kollect-century-primary-btn"
                >
                  {loading ? (
                    <>
                      <span className="kollect-century-btn-spinner"></span>
                      <span>Logging In...</span>
                    </>
                  ) : (
                    'Login'
                  )}
                </button>

                <div className="kollect-century-secondary">
                  <button
                    onClick={useTestCredentials}
                    className="kollect-century-secondary-btn"
                    type="button"
                    disabled={loading}
                  >
                    <span>Use Test Credentials</span>
                  </button>
                </div>
              </div>

              <div className="kollect-century-footer">
                <div className="kollect-century-footer-content">
                  <span className="kollect-century-footer-text">Rekova v1.0</span>
                  <span className="kollect-century-footer-separator">•</span>
                  <span className="kollect-century-footer-text">Secure Banking</span>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;