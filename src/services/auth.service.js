const API_URL = 'http://localhost:5000/api';

const USER_KEY = 'user';
const TOKEN_KEY = 'token';
const ROLES_KEY = 'user_roles_cache';

const authService = {
  async login(username, password) {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        return {
          success: false,
          message: data.message || 'Login failed',
        };
      }

      const userData = {
        ...data.data.user,
        token: data.data.token,
      };

      // Store user data, token, and permissions
      localStorage.setItem(USER_KEY, JSON.stringify(userData));
      localStorage.setItem(TOKEN_KEY, data.data.token);
      
      // Cache role and permissions for quick access
      this.cacheUserRoles(userData);

      return {
        success: true,
        message: data.message || 'Login successful',
        data: userData,
      };
    } catch (error) {
      console.error('Auth login error:', error);
      return {
        success: false,
        message: 'Network error. Please try again.',
      };
    }
  },

  // Cache user roles and permissions for quick access
  cacheUserRoles(userData) {
    const roleCache = {
      role: userData.role,
      permissions: userData.permissions || {},
      fullName: userData.fullName || `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || userData.username,
      department: userData.department || 'Collections'
    };
    
    localStorage.setItem(ROLES_KEY, JSON.stringify(roleCache));
  },

  getCurrentUser() {
    try {
      const raw = localStorage.getItem(USER_KEY);
      if (!raw) return null;

      const user = JSON.parse(raw);
      if (!user?.token) {
        this.logout();
        return null;
      }

      return user;
    } catch {
      this.logout();
      return null;
    }
  },

  getToken() {
    return localStorage.getItem(TOKEN_KEY) || this.getCurrentUser()?.token;
  },

  isAuthenticated() {
    return !!this.getToken();
  },

  // Role checking methods
  getUserRole() {
    try {
      const cached = localStorage.getItem(ROLES_KEY);
      if (cached) {
        const data = JSON.parse(cached);
        return data.role || 'officer';
      }
      
      const user = this.getCurrentUser();
      return user?.role || 'officer';
    } catch {
      return 'officer';
    }
  },

  getUserPermissions() {
    try {
      const cached = localStorage.getItem(ROLES_KEY);
      if (cached) {
        const data = JSON.parse(cached);
        return data.permissions || {};
      }
      
      const user = this.getCurrentUser();
      return user?.permissions || {};
    } catch {
      return {};
    }
  },

  getUserInfo() {
    try {
      const cached = localStorage.getItem(ROLES_KEY);
      if (cached) {
        const data = JSON.parse(cached);
        return {
          role: data.role,
          permissions: data.permissions,
          fullName: data.fullName,
          department: data.department
        };
      }
      
      const user = this.getCurrentUser();
      return {
        role: user?.role || 'officer',
        permissions: user?.permissions || {},
        fullName: user?.fullName || user?.username || 'User',
        department: user?.department || 'Collections'
      };
    } catch {
      return {
        role: 'officer',
        permissions: {},
        fullName: 'User',
        department: 'Collections'
      };
    }
  },

  // Permission checking methods
  isAdmin() {
    return this.getUserRole() === 'admin';
  },

  isSupervisor() {
    return this.getUserRole() === 'supervisor';
  },

  isOfficer() {
    return this.getUserRole() === 'officer';
  },

  canManageUsers() {
    const permissions = this.getUserPermissions();
    return this.isAdmin() || permissions.canManageUsers === true;
  },

  canApproveTransactions() {
    const permissions = this.getUserPermissions();
    return this.isAdmin() || this.isSupervisor() || permissions.canApproveTransactions === true;
  },

  canViewAllPerformance() {
    // All users can view all performance (global competition)
    return true;
  },

  canExportData() {
    const permissions = this.getUserPermissions();
    return this.isAdmin() || this.isSupervisor() || permissions.canExportData === true;
  },

  canManageSettings() {
    const permissions = this.getUserPermissions();
    return this.isAdmin() || permissions.canManageSettings === true;
  },

  getTransactionLimit() {
    const permissions = this.getUserPermissions();
    return permissions.transactionLimit || 50000; // Default KES 50,000
  },

  // Check if transaction requires approval
  requiresTransactionApproval(amount) {
    const transactionAmount = parseFloat(amount);
    
    if (isNaN(transactionAmount) || transactionAmount <= 0) {
      return false;
    }
    
    const limit = this.getTransactionLimit();
    
    // Officers have limits, others don't
    if (this.isOfficer() && transactionAmount > limit) {
      return true;
    }
    
    return false;
  },

  // Navigation helpers for UI
  getAvailableRoutes() {
    const role = this.getUserRole();
    
    const baseRoutes = [
      { path: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
      { path: '/customers', label: 'Customers', icon: 'people' },
      { path: '/transactions', label: 'Transactions', icon: 'compare_arrows' },
      { path: '/promises', label: 'Promises', icon: 'history' },
      { path: '/reports', label: 'Reports', icon: 'bar_chart' }
    ];
    
    if (this.canManageUsers()) {
      baseRoutes.push({ path: '/users', label: 'User Management', icon: 'manage_accounts' });
    }
    
    if (this.canManageSettings()) {
      baseRoutes.push({ path: '/settings', label: 'Settings', icon: 'settings' });
    }
    
    if (this.canApproveTransactions()) {
      baseRoutes.push({ path: '/approvals', label: 'Approvals', icon: 'check_circle' });
    }
    
    return baseRoutes;
  },

  logout() {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ROLES_KEY);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  }
};

export default authService;