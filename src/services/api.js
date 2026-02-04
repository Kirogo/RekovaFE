// src/services/api.js
import axios from 'axios';
import authService from './auth.service';

const API_URL = 'http://localhost:5000/api';

// Create axios instance with base URL
const authAxios = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // Add timeout
});

// Request interceptor to add token
authAxios.interceptors.request.use(
  (config) => {
    const token = authService.getToken();
    
    // DEBUG LOGGING
    console.log('=== API REQUEST DEBUG ===');
    console.log('Method:', config.method?.toUpperCase());
    console.log('URL:', config.url);
    console.log('Token exists:', !!token);
    
    if (token) {
      // Validate token format before sending
      const parts = token.split('.');
      if (parts.length === 3) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('✓ Valid JWT token attached (3 parts)');
      } else {
        console.error('✗ Invalid token format, not a JWT. Parts:', parts.length);
        console.log('Token sample:', token.substring(0, 50));
        
        // Clean up invalid token
        authService.logout();
        
        // Don't send invalid token
        delete config.headers.Authorization;
      }
    } else {
      console.log('⚠️ No token found, request will be unauthenticated');
    }
    
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
authAxios.interceptors.response.use(
  (response) => {
    console.log(`✓ ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
    return response;
  },
  (error) => {
    if (error.response) {
      // Server responded with error
      console.error('✗ API Error:', {
        status: error.response.status,
        url: error.config?.url,
        method: error.config?.method,
        data: error.response.data
      });
      
      // Handle 401 Unauthorized
      if (error.response.status === 401) {
        console.log('Authentication failed, logging out...');
        authService.logout();
        
        // Only redirect if not already on login page
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
    } else if (error.request) {
      // Request made but no response
      console.error('✗ Network Error: No response received from server');
    } else {
      // Something else happened
      console.error('✗ Request Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// Add a test endpoint function
export const testConnection = async () => {
  try {
    const response = await authAxios.get('/auth/test');
    return response.data;
  } catch (error) {
    console.error('Connection test failed:', error);
    return null;
  }
};

// Export BOTH default and named exports
export { authAxios }; // Named export
export default authAxios; // Default export