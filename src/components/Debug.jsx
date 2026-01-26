import React from 'react';
import authService from '../services/auth.service';

const Debug = () => {
  const checkStorage = () => {
    console.log('=== DEBUG STORAGE ===');
    console.log('Token:', localStorage.getItem('token'));
    console.log('User:', localStorage.getItem('user'));
    console.log('AuthService.getToken():', authService.getToken());
    console.log('AuthService.isAuthenticated():', authService.isAuthenticated());
    console.log('====================');
  };

  return (
    <div style={{ padding: 20 }}>
      <button onClick={checkStorage}>Check Storage</button>
    </div>
  );
};

export default Debug;