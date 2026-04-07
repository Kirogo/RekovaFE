import axios from 'axios';

// IMPORTANT: Use the SAME port as your backend
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5555/api';

const AUTH_STORAGE_KEY = "rekova_auth_data";

const authService = {
  _getStoredAuth() {
    try {
      const raw = localStorage.getItem(AUTH_STORAGE_KEY);
      console.log(`📦 Retrieved from localStorage[${AUTH_STORAGE_KEY}]:`, raw ? '✓ Found' : '✗ Empty');
      
      if (!raw) {
        console.log('   Available keys:', Object.keys(localStorage));
        return null;
      }
      
      const data = JSON.parse(raw);
      console.log('   Parsed data has token?', !!data?.token, 'Parsed data has user?', !!data?.user);
      
      if (!data?.token) {
        console.log('   ⚠️ No token in parsed data, clearing auth');
        this._clearAuth();
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('❌ Error reading auth storage:', error);
      this._clearAuth();
      return null;
    }
  },
  
  _setStoredAuth(authData) {
    try {
      const dataToStore = {
        token: authData.token,
        user: authData.user,
        timestamp: new Date().toISOString(),
      };
      
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(dataToStore));
      console.log(`✅ Auth data stored in localStorage[${AUTH_STORAGE_KEY}]`);
      console.log(`   Token: ${dataToStore.token ? dataToStore.token.substring(0, 20) + '...' : 'MISSING'}`);
      console.log(`   User: ${dataToStore.user?.username || 'MISSING'}`);
      
      // Set default axios headers
      axios.defaults.headers.common['Authorization'] = `Bearer ${authData.token}`;
      console.log('✅ Authorization header set on axios defaults');
      
      return true;
    } catch (error) {
      console.error('❌ Error storing auth data:', error);
      return false;
    }
  },
  
  _clearAuth() {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    delete axios.defaults.headers.common['Authorization'];
  },
  
  async login(username, password) {
    try {
      console.log('🔐 Login attempt for:', username);
      console.log('Sending to:', `${API_URL}/auth/login`);
      
      // Use regular axios for login (no auth header needed)
      const response = await axios.post(`${API_URL}/auth/login`, {
        username: String(username).trim(),
        password: String(password).trim()
      }, {
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        }
      });

      console.log('✅ Login response received');
      
      const data = response.data;

      if (!data.success || !data.data?.token) {
        return {
          success: false,
          message: data.message || "Login failed",
        };
      }

      // Store auth data - backend returns user data directly in data.data
      const userData = {
        token: data.data.token,
        user: {
          id: data.data.id,
          username: data.data.username,
          email: data.data.email,
          firstName: data.data.firstName,
          lastName: data.data.lastName,
          phone: data.data.phone,
          role: data.data.role
        }
      };
      
      const stored = this._setStoredAuth(userData);
      
      if (!stored) {
        return {
          success: false,
          message: "Failed to store authentication data"
        };
      }

      console.log('✅ Login successful, token stored');
      
      return {
        success: true,
        message: data.message || "Login successful",
        data: data.data,
        role: data.data.role,
        defaultRoute: this.getDefaultRoute(data.data.role),
      };
      
    } catch (error) {
      console.error("❌ Auth login error:", error);
      
      let errorMessage = "Network error. Please check connection and try again.";
      
      if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
        errorMessage = "Cannot connect to server. Make sure backend is running on port 5555.";
      } else if (error.response) {
        errorMessage = error.response.data?.message || "Login failed";
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
      const token = authData?.token;
      console.log(`🔑 getToken() returning:`, token ? `✓ Token (${token.substring(0, 20)}...)` : '✗ null');
      return token || null;
    } catch (error) {
      console.error('❌ Error getting token:', error);
      return null;
    }
  },

  getCurrentUser() {
    try {
      const authData = this._getStoredAuth();
      return authData?.user || null;
    } catch (error) {
      return null;
    }
  },

  isAuthenticated() {
    const token = this.getToken();
    if (!token) return false;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiry = payload.exp * 1000;
      return Date.now() < expiry;
    } catch (error) {
      return false;
    }
  },

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

  logout() {
    console.log('Logging out...');
    this._clearAuth();
  },

  initialize() {
    const token = this.getToken();
    if (token && this.isAuthenticated()) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }
};

authService.initialize();

export default authService;