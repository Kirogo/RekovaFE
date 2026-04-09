// src/services/api.js
import axios from 'axios';
import authService from './auth.service';

// Use relative URL for proxy, absolute for direct
const API_URL = import.meta.env.VITE_API_URL || '/api';

console.log('🔧 API Service initialized with baseURL:', API_URL);

// Create axios instance with base URL
const authAxios = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor to add token
authAxios.interceptors.request.use(
  (config) => {
    const token = authService.getToken();
    
    console.log(`🔐 API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('✅ Token attached');
    } else {
      console.log('⚠️ No token available for this request');
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
authAxios.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.config.url} - Status: ${response.status}`);
    return response;
  },
  (error) => {
    if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
      console.error('❌ Cannot connect to backend. Make sure it\'s running on port 5555');
      console.error('   Backend should be at: http://localhost:5555');
    } else if (error.response?.status === 401) {
      console.error('❌ 401 Unauthorized - Logging out');
      authService.logout();
      window.location.href = '/login';
    } else if (error.response?.status === 500) {
      console.error('❌ Server error (500):', error.response?.data?.message || 'Unknown error');
    }
    
    return Promise.reject(error);
  }
);

export { authAxios };
export default authAxios;