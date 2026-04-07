import axios from 'axios';
import authService from './auth.service';

// IMPORTANT: Use the CORRECT port where your backend is running
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5555/api';

// Create axios instance with base URL
const authAxios = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // Increased timeout for larger requests
});

// Request interceptor to add token
authAxios.interceptors.request.use(
  (config) => {
    const token = authService.getToken();
    
    // Debug logging
    console.log(`🔐 API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('✅ Token attached');
    } else {
      console.log('⚠️ No token available');
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