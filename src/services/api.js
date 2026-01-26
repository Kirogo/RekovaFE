// src/services/api.js - UPDATED
import axios from 'axios';
import authService from './auth.service'; // IMPORT THIS

const API_URL = 'http://localhost:5000/api';

// Create axios instance with base URL
const authAxios = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
authAxios.interceptors.request.use(
  (config) => {
    const token = authService.getToken(); // Use authService
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors
authAxios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      authService.logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Export BOTH default and named exports
export { authAxios }; // Named export
export default authAxios; // Default export