// src/services/auth.service.js
import axios from 'axios';

const API_URL = "http://localhost:5000/api";

// Use single storage key to avoid conflicts
const AUTH_STORAGE_KEY = "rekova_auth_data";

const authService = {
  // Store all auth data in one place
  _getStoredAuth() {
    try {
      const raw = localStorage.getItem(AUTH_STORAGE_KEY);
      if (!raw) return null;
      
      const data = JSON.parse(raw);
      
      // Validate stored data has token
      if (!data?.token) {
        this._clearAuth();
        return null;
      }
      
      // Check if token is valid JWT format
      const tokenParts = data.token.split('.');
      if (tokenParts.length !== 3) {
        console.error('Stored token is not a valid JWT');
        this._clearAuth();
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Error reading auth storage:', error);
      this._clearAuth();
      return null;
    }
  },
  
  _setStoredAuth(authData) {
    try {
      // Ensure token is valid before storing
      if (!authData.token || authData.token.split('.').length !== 3) {
        console.error('Invalid token format, not storing');
        return false;
      }
      
      const dataToStore = {
        token: authData.token,
        user: authData.user,
        timestamp: new Date().toISOString(),
        // Don't store token in user object to avoid duplication
        ...(authData.user && { 
          user: { ...authData.user, token: undefined } 
        })
      };
      
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(dataToStore));
      
      // Set default axios headers
      axios.defaults.headers.common['Authorization'] = `Bearer ${authData.token}`;
      
      return true;
    } catch (error) {
      console.error('Error storing auth data:', error);
      return false;
    }
  },
  
  _clearAuth() {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    // Clear any legacy keys
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("user_roles_cache");
    
    // Remove axios default header
    delete axios.defaults.headers.common['Authorization'];
  },
  
  async login(username, password) {
    try {
      console.log('Attempting login for:', username);
      
      const response = await axios.post(`${API_URL}/auth/login`, {
        username, 
        password
      }, {
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        }
      });

      const data = response.data;
      
      console.log('Login response:', { 
        success: data.success, 
        status: response.status,
        hasToken: !!data.data?.token 
      });

      if (!data.success || !data.data?.token) {
        console.error('Login failed:', data.message);
        return {
          success: false,
          message: data.message || "Login failed. No token received.",
        };
      }

      // Store auth data
      const stored = this._setStoredAuth({
        token: data.data.token,
        user: data.data.user
      });
      
      if (!stored) {
        return {
          success: false,
          message: "Failed to store authentication data"
        };
      }

      console.log('Login successful, token stored');
      
      return {
        success: true,
        message: data.message || "Login successful",
        data: data.data,
        role: data.data.user?.role,
        defaultRoute: this.getDefaultRoute(data.data.user?.role),
      };
    } catch (error) {
      console.error("Auth login error:", error.response?.data || error.message);
      
      let errorMessage = "Network error. Please check connection and try again.";
      
      if (error.response) {
        if (error.response.status === 401) {
          errorMessage = "Invalid username or password";
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        }
      }
      
      return {
        success: false,
        message: errorMessage,
      };
    }
  },

  getToken() {
    try {
      const authData = this._getStoredAuth();
      if (!authData) {
        console.log('No auth data found in storage');
        return null;
      }
      
      const token = authData.token;
      
      // Validate token format
      if (typeof token !== 'string' || token.split('.').length !== 3) {
        console.error('Invalid token format in storage');
        this._clearAuth();
        return null;
      }
      
      return token;
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  },

  getCurrentUser() {
    try {
      const authData = this._getStoredAuth();
      if (!authData) return null;
      
      return authData.user || null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  },

  isAuthenticated() {
    const token = this.getToken();
    if (!token) return false;
    
    // Check token expiration
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiry = payload.exp * 1000; // Convert to milliseconds
      const now = Date.now();
      
      if (expiry < now) {
        console.log('Token expired:', new Date(expiry));
        this.logout();
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error checking token expiry:', error);
      return false;
    }
  },

  // Get axios instance with auth token
  getApi() {
    const token = this.getToken();
    
    return axios.create({
      baseURL: API_URL,
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json'
      }
    });
  },

  // Role checking methods
  getUserRole() {
    const user = this.getCurrentUser();
    return user?.role || "officer";
  },

  isAdmin() {
    return this.getUserRole() === "admin";
  },

  isSupervisor() {
    return this.getUserRole() === "supervisor";
  },

  isOfficer() {
    return this.getUserRole() === "officer";
  },

  getDefaultRoute(role) {
    role = role || this.getUserRole();
    if (role === "supervisor" || role === "admin") {
      return "/supervisor";
    }
    return "/dashboard";
  },

  // Debug method to check storage
  debugStorage() {
    console.log('=== AUTH STORAGE DEBUG ===');
    console.log('Primary key (AUTH_STORAGE_KEY):', localStorage.getItem(AUTH_STORAGE_KEY));
    console.log('Token exists:', !!this.getToken());
    console.log('User exists:', !!this.getCurrentUser());
    console.log('Axios default auth header:', axios.defaults.headers.common['Authorization'] ? 'Set' : 'Not set');
  },

  logout() {
    console.log('Logging out, clearing auth data...');
    this._clearAuth();
    
    // Clear all localStorage items that might be auth-related
    Object.keys(localStorage).forEach(key => {
      if (key.includes('auth') || key.includes('token') || key.includes('user')) {
        localStorage.removeItem(key);
      }
    });
    
    console.log('Auth data cleared');
  },

  // Initialize auth headers on app start
  initialize() {
    const token = this.getToken();
    if (token && this.isAuthenticated()) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }
};

// Initialize on import
authService.initialize();

export default authService;