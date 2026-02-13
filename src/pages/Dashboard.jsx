// src/pages/Dashboard.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  LinearProgress
} from "@mui/material";
import {
  AccountBalanceWallet,
  Refresh,
  Payment,
  ReceiptLong,
  PeopleAlt,
  CheckCircle,
  Cancel,
  AccessTime,
  LibraryAddCheck,
  LibraryAdd,
  Schedule
} from "@mui/icons-material";
import axios from "axios";
import authService from "../services/auth.service";
import "../styles/dashboard.css";

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalLoanPortfolio: 0,
    totalAmountCollected: 0,
    totalArrears: 0,
    activeCustomers: 0,
    pendingPromises: 0
  });
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [additionalStats, setAdditionalStats] = useState({});
  const [currentUser, setCurrentUser] = useState(null);

  // Helper function to get user role
  const getUserRole = () => {
    try {
      const userString = localStorage.getItem('user');
      if (userString) {
        const user = JSON.parse(userString);
        return user.role || 'officer';
      }
    } catch (error) {
      console.error('Error getting user role:', error);
    }
    return 'officer';
  };

  // Helper function to get current user ID
  const getCurrentUserId = () => {
    try {
      const userString = localStorage.getItem('user');
      if (userString) {
        const user = JSON.parse(userString);
        return user.id || user._id || null;
      }
    } catch (error) {
      console.error('Error getting user ID:', error);
    }
    return null;
  };

  // Helper function to get current user from auth service
  const getCurrentUser = () => {
    const user = authService.getCurrentUser();
    console.log('👤 Current User:', user);
    return user;
  };

  // Use authService.getApi() instead of creating new axios instances
  const getApi = () => {
    return authService.getApi();
  };

  const fetchRecentTransactions = async (api) => {
    try {
      const role = getUserRole();
      const userId = getCurrentUserId();
      
      console.log('🔍 Fetching recent transactions for:', { role, userId });
      
      let transactionsData = [];
      
      // Use the provided api instance or get a new one
      const apiInstance = api || getApi();
      
      if (role === 'officer') {
        // Officer-specific transactions
        try {
          // Try the officer-specific endpoint first
          const response = await apiInstance.get('/transactions/my-transactions?limit=10');
          console.log('✅ Officer transactions response:', response.data);
          
          // Extract transactions from response
          if (response.data.data && response.data.data.transactions) {
            transactionsData = response.data.data.transactions;
          } else if (response.data.transactions) {
            transactionsData = response.data.transactions;
          } else if (Array.isArray(response.data.data)) {
            transactionsData = response.data.data;
          } else if (Array.isArray(response.data)) {
            transactionsData = response.data;
          }
          
          console.log(`📊 Found ${transactionsData.length} officer transactions`);
          
        } catch (officerError) {
          console.warn('⚠️ Officer endpoint failed, trying fallback:', officerError.message);
          
          // Fallback: fetch all transactions and filter
          try {
            const allResponse = await apiInstance.get('/transactions?limit=100');
            let allTransactions = [];
            
            if (allResponse.data.data && Array.isArray(allResponse.data.data)) {
              allTransactions = allResponse.data.data;
            } else if (allResponse.data.data?.transactions) {
              allTransactions = allResponse.data.data.transactions;
            } else if (Array.isArray(allResponse.data)) {
              allTransactions = allResponse.data;
            } else if (allResponse.data.transactions) {
              allTransactions = allResponse.data.transactions;
            }
            
            console.log(`📋 Total transactions: ${allTransactions.length}`);
            
            // Filter for officer's transactions
            transactionsData = allTransactions.filter(transaction => {
              const initiatedBy = transaction.initiatedByUserId || 
                                 transaction.createdBy || 
                                 transaction.officerId || 
                                 transaction.userId;
              
              // Check various ID formats
              if (typeof initiatedBy === 'object') {
                return initiatedBy._id === userId || initiatedBy.id === userId;
              }
              
              return initiatedBy === userId || 
                     initiatedBy === currentUser?.id ||
                     initiatedBy === currentUser?.username;
            });
            
            console.log(`📊 Filtered to ${transactionsData.length} officer transactions`);
            
          } catch (fallbackError) {
            console.error('❌ All transaction fetch methods failed:', fallbackError);
            return [];
          }
        }
      } else {
        // Admin/Supervisor - show all transactions
        try {
          const response = await apiInstance.get('/transactions?limit=10');
          
          if (response.data.data && Array.isArray(response.data.data)) {
            transactionsData = response.data.data;
          } else if (response.data.data?.transactions) {
            transactionsData = response.data.data.transactions;
          } else if (Array.isArray(response.data)) {
            transactionsData = response.data;
          } else if (response.data.transactions) {
            transactionsData = response.data.transactions;
          }
          
        } catch (error) {
          console.error('❌ Admin transaction fetch failed:', error);
          return [];
        }
      }
      
      // Sort by date (newest first)
      transactionsData.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.date || a.processedAt || 0);
        const dateB = new Date(b.createdAt || b.date || b.processedAt || 0);
        return dateB - dateA;
      });
      
      // Limit to 10 most recent
      const recentTransactions = transactionsData.slice(0, 10);
      console.log(`📅 Setting ${recentTransactions.length} recent transactions`);
      
      setRecentTransactions(recentTransactions);
      
    } catch (transError) {
      console.error('❌ Recent transactions error:', transError);
      console.log('Error details:', {
        message: transError.message,
        response: transError.response?.data,
        status: transError.response?.status
      });
      setRecentTransactions([]);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use authService.getApi() - this ensures proper auth headers
      const api = getApi();
      const user = getCurrentUser();
      setCurrentUser(user);
      
      console.log('📊 Fetching dashboard data for:', user?.username);
      console.log('🔑 Auth token present:', !!authService.getToken());
      console.log('🔑 Auth headers:', api.defaults.headers);
      
      // Set user role
      if (user?.role) {
        setUserRole(user.role);
      } else {
        const role = getUserRole();
        setUserRole(role);
      }

      // If user is officer, fetch officer-specific data
      if (userRole === 'officer' || (user && user.role === 'officer')) {
        await fetchOfficerDashboardData(api, user);
      } else {
        // For other roles (admin/supervisor), use existing logic
        await fetchGeneralDashboardData(api);
      }

    } catch (err) {
      console.error("❌ Dashboard error:", err);
      console.error("Error details:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        url: err.config?.url
      });

      setError(err.response?.data?.message || "Failed to load dashboard data");

      if (err.response?.status === 401) {
        console.log('⚠️ 401 Unauthorized - logging out');
        authService.logout();
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchOfficerDashboardData = async (api, user) => {
    try {
      console.log('👮 Fetching officer-specific data...');
      
      // Fetch officer's assigned customers - try multiple endpoints
      let customersData = [];
      try {
        const customersRes = await api.get(`/customers/assigned-to-me`);
        customersData = customersRes.data.data?.customers || customersRes.data.customers || [];
        console.log('✅ Assigned customers fetched:', customersData.length);
      } catch (customerError) {
        console.warn('⚠️ Could not fetch assigned customers:', customerError.message);
        // Try alternative endpoint
        try {
          const allCustomersRes = await api.get("/customers?limit=1000");
          const allCustomers = allCustomersRes.data.data?.customers || [];
          customersData = allCustomers.filter(customer => 
            customer.assignedTo?.username === user.username || 
            customer.assignedTo === user.username ||
            customer.assignedTo === user.id
          );
          console.log('✅ Fallback customer fetch successful:', customersData.length);
        } catch (fallbackError) {
          console.error('❌ Fallback customer fetch also failed:', fallbackError.message);
        }
      }
      
      console.log('📋 Officer Customers:', customersData.length);
      
      // Calculate stats from assigned customers only
      const totalCustomers = customersData.length;
      const totalLoanPortfolio = customersData.reduce((sum, customer) => 
        sum + parseFloat(customer.loanBalance || 0), 0);
      const totalArrears = customersData.reduce((sum, customer) => 
        sum + parseFloat(customer.arrears || 0), 0);
      const activeCustomers = customersData.filter(c => 
        parseFloat(c.arrears || 0) > 0).length;
      
      // Fetch officer's collections - try multiple endpoints
      let collectionsData = [];
      let totalAmountCollected = 0;
      
      try {
        // Try /api/transactions/my-collections first
        const collectionsRes = await api.get(`/transactions/my-collections`);
        collectionsData = collectionsRes.data.data?.transactions || 
                         collectionsRes.data.transactions || 
                         collectionsRes.data || [];
        console.log('💰 Officer Collections from /transactions/my-collections:', collectionsData.length);
      } catch (collectionError) {
        console.warn('⚠️ Could not fetch collections from /transactions/my-collections:', collectionError.message);
        
        try {
          // Try /api/payments/my-collections
          const paymentsRes = await api.get(`/payments/my-collections`);
          collectionsData = paymentsRes.data.data?.transactions || 
                           paymentsRes.data.transactions || 
                           paymentsRes.data || [];
          console.log('💰 Officer Collections from /payments/my-collections:', collectionsData.length);
        } catch (paymentError) {
          console.warn('⚠️ Could not fetch collections from /payments/my-collections:', paymentError.message);
          
          // Fallback: fetch all transactions and filter
          try {
            const allTransactionsRes = await api.get("/transactions?limit=1000");
            const allTransactions = allTransactionsRes.data.data || 
                                   allTransactionsRes.data.transactions || 
                                   allTransactionsRes.data || [];
            collectionsData = allTransactions.filter(transaction =>
              transaction.createdBy === user.username ||
              transaction.officerId === user.id ||
              transaction.userId === user.id ||
              transaction.initiatedByUserId === user.id
            );
            console.log('💰 Officer Collections (fallback):', collectionsData.length);
          } catch (fallbackError) {
            console.error('❌ All collection methods failed:', fallbackError.message);
          }
        }
      }
      
      // Calculate total collected by this officer
      const successfulTransactions = collectionsData.filter(
        transaction => transaction.status?.toUpperCase() === 'SUCCESS'
      );
      totalAmountCollected = successfulTransactions.reduce(
        (sum, transaction) => sum + parseFloat(transaction.amount || 0), 0
      );
      
      // Fetch officer's recent promises
      let promisesData = [];
      let pendingPromises = 0;
      
      try {
        const promisesRes = await api.get(`/promises/my-promises`);
        promisesData = promisesRes.data.data?.promises || promisesRes.data.promises || [];
        pendingPromises = promisesData.filter(p => 
          p.status === 'pending' || p.status === 'PENDING').length;
        console.log('✅ Promises fetched:', promisesData.length);
      } catch (promiseError) {
        console.warn('⚠️ Could not fetch promises:', promiseError.message);
      }
      
      // Set officer-specific stats
      setStats({
        totalCustomers,
        totalLoanPortfolio,
        totalAmountCollected,
        totalArrears,
        activeCustomers,
        pendingPromises
      });
      
      // Set officer-specific additional stats
      setAdditionalStats({
        roleData: {
          assignedCustomers: totalCustomers,
          myCollections: totalAmountCollected,
          myPromises: promisesData.length,
          pendingPromises: pendingPromises,
          successRate: totalCustomers > 0 ? 
            ((totalCustomers - activeCustomers) / totalCustomers * 100).toFixed(1) + '%' : '0%'
        },
        overview: {
          customerDistribution: {
            active: activeCustomers,
            inArrears: customersData.filter(c => parseFloat(c.arrears || 0) > 5000).length,
            goodStanding: customersData.filter(c => parseFloat(c.arrears || 0) === 0).length
          }
        },
        recentActivity: {
          transactions: collectionsData.slice(0, 10)
        }
      });
      
      // Fetch and set recent transactions
      await fetchRecentTransactions(api);
      
    } catch (error) {
      console.error('❌ Officer dashboard data fetch failed:', error);
      console.error('Error details:', error.response?.data || error.message);
      
      // Fallback to simple data
      await fallbackOfficerData(api, user);
    }
  };

  const fallbackOfficerData = async (api, user) => {
    try {
      console.log('🔄 Using fallback officer data...');
      
      // Try to get basic stats
      let totalCustomers = 0;
      let totalLoanPortfolio = 0;
      let totalArrears = 0;
      let activeCustomers = 0;
      
      try {
        // Try to get dashboard stats for basic info
        const statsRes = await api.get("/customers/dashboard/stats");
        const statsData = statsRes.data.data?.stats || {};
        
        totalCustomers = statsData.totalCustomers || 0;
        totalLoanPortfolio = statsData.totalLoanPortfolio || 0;
        totalArrears = statsData.totalArrears || 0;
        activeCustomers = statsData.activeCustomers || 0;
      } catch (statsError) {
        console.warn('⚠️ Could not fetch stats:', statsError.message);
      }
      
      // Set basic stats
      setStats({
        totalCustomers,
        totalLoanPortfolio,
        totalAmountCollected: 0,
        totalArrears,
        activeCustomers,
        pendingPromises: 0
      });
      
      // Fetch recent transactions
      await fetchRecentTransactions(api);
      
      setAdditionalStats({
        roleData: {
          assignedCustomers: totalCustomers,
          myCollections: 0,
          myPromises: 0,
          pendingPromises: 0,
          successRate: totalCustomers > 0 ? 
            ((totalCustomers - activeCustomers) / totalCustomers * 100).toFixed(1) + '%' : '0%'
        }
      });
      
    } catch (error) {
      console.error('❌ Fallback also failed:', error);
      // Set minimal data
      setStats({
        totalCustomers: 0,
        totalLoanPortfolio: 0,
        totalAmountCollected: 0,
        totalArrears: 0,
        activeCustomers: 0,
        pendingPromises: 0
      });
      setRecentTransactions([]);
    }
  };

  const fetchGeneralDashboardData = async (api) => {
    try {
      // Use existing logic for admin/supervisor
      const statsRes = await api.get("/customers/dashboard/stats");
      const statsData = statsRes.data.data?.stats || {};
      
      setUserRole(statsData.user?.role);
      
      setStats({
        totalCustomers: statsData.totalCustomers || 0,
        totalLoanPortfolio: statsData.totalLoanPortfolio || 0,
        totalAmountCollected: statsData.totalCollections || 0,
        totalArrears: statsData.totalArrears || 0,
        activeCustomers: statsData.activeCustomers || 0,
        pendingPromises: statsData.pendingPromises || 0
      });
      
      setAdditionalStats({
        roleData: statsData.roleData || {},
        overview: statsData.overview || {},
        recentActivity: statsData.recentActivity || {}
      });
      
      // Fetch recent transactions for admin/supervisor
      await fetchRecentTransactions(api);
      
    } catch (error) {
      console.warn('⚠️ General dashboard fetch failed:', error.message);
      // Fallback to basic dashboard
      await fallbackGeneralData(api);
    }
  };

  const fallbackGeneralData = async (api) => {
    try {
      // Get basic counts
      const [customersRes, transactionsRes] = await Promise.all([
        api.get("/customers?limit=1").catch(() => ({ data: { data: { customers: [] } } })),
        api.get("/transactions?limit=10").catch(() => ({ data: { data: [] } }))
      ]);
      
      const customers = customersRes.data.data?.customers || [];
      const transactions = transactionsRes.data.data || transactionsRes.data || [];
      
      setStats({
        totalCustomers: customers.length,
        totalLoanPortfolio: 0,
        totalAmountCollected: 0,
        totalArrears: 0,
        activeCustomers: 0,
        pendingPromises: 0
      });
      
      setRecentTransactions(transactions.slice(0, 10));
      
    } catch (error) {
      console.error('❌ General fallback failed:', error);
      // Set empty data
      setStats({
        totalCustomers: 0,
        totalLoanPortfolio: 0,
        totalAmountCollected: 0,
        totalArrears: 0,
        activeCustomers: 0,
        pendingPromises: 0
      });
      setRecentTransactions([]);
    }
  };

  // Add auth debugging on component mount
  useEffect(() => {
    console.log('🏁 Dashboard mounted');
    console.log('🔐 Auth status:', {
      isAuthenticated: authService.isAuthenticated(),
      token: authService.getToken() ? 'Present' : 'Missing',
      user: authService.getCurrentUser(),
      localStorageKeys: Object.keys(localStorage)
    });
    
    fetchDashboardData();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-KE', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'N/A';
    }
  };

  const formatAmount = (amount) => {
    const numAmount = Number(amount || 0);
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numAmount);
  };

  const getStatusIcon = (status) => {
    const statusUpper = status?.toUpperCase();
    switch (statusUpper) {
      case 'SUCCESS':
        return <CheckCircle sx={{ fontSize: 14, color: '#2ecc71' }} />;
      case 'FAILED':
        return <Cancel sx={{ fontSize: 14, color: '#e74c3c' }} />;
      case 'PENDING':
        return <AccessTime sx={{ fontSize: 14, color: '#f39c12' }} />;
      case 'EXPIRED':
        return <Cancel sx={{ fontSize: 14, color: '#95a5a6' }} />;
      case 'CANCELLED':
        return <Cancel sx={{ fontSize: 14, color: '#7f8c8d' }} />;
      default:
        return <AccessTime sx={{ fontSize: 14, color: '#f39c12' }} />;
    }
  };

  const getStatusColor = (status) => {
    const statusUpper = status?.toUpperCase();
    switch (statusUpper) {
      case 'SUCCESS': return '#2ecc71'; // Green
      case 'FAILED': return '#e74c3c'; // Red
      case 'PENDING': return '#f39c12'; // Orange
      case 'EXPIRED': return '#95a5a6'; // Grey
      case 'CANCELLED': return '#7f8c8d'; // Dark Grey
      default: return '#f39c12'; // Default to orange for pending
    }
  };

  // Officer-specific stat cards - ONLY 3 CARDS: Portfolio, Collections, Arrears
  const getStatCards = () => {
    const cards = [
      {
        title: userRole === 'officer' ? "My Portfolio" : "Total Portfolio",
        value: stats.totalLoanPortfolio,
        icon: <AccountBalanceWallet />,
        isCurrency: true,
        format: (val) => formatAmount(val),
        subtitle: userRole === 'officer' ? "Total outstanding" : "Total loan portfolio"
      },
      {
        title: userRole === 'officer' ? "My Collections" : "Total Collections",
        value: stats.totalAmountCollected,
        icon: <LibraryAddCheck />,
        isCurrency: true,
        format: (val) => formatAmount(val),
        subtitle: userRole === 'officer' ? "Total collected" : "Total amount collected"
      },
      {
        title: userRole === 'officer' ? "Active Arrears" : "Total Arrears",
        value: stats.totalArrears,
        icon: <LibraryAdd />,
        isCurrency: true,
        format: (val) => formatAmount(val),
        subtitle: userRole === 'officer' ? "Total overdue" : "Total overdue amount"
      }
    ];

    return cards;
  };

  // Quick actions - officer specific
  const quickActions = [
    {
      label: "My Customers",
      icon: <PeopleAlt />,
      path: "/customers"
    },
    {
      label: "Process Payment",
      icon: <Payment />,
      path: "/payments"
    },
    {
      label: "My Transactions",
      icon: <ReceiptLong />,
      path: "/transactions"
    },
    {
      label: "Promises",
      icon: <Schedule />,
      path: "/promises"
    }
  ];

  if (loading) {
    return (
      <Box className="dashboard-wrapper">
        <LinearProgress sx={{
          mb: 2,
          borderRadius: '4px',
          backgroundColor: '#f5f0ea',
          '& .MuiLinearProgress-bar': {
            backgroundColor: '#5c4730'
          }
        }} />
        <Typography sx={{ 
          color: '#666', 
          textAlign: 'center', 
          fontSize: '0.875rem',
          fontFamily: "'Century Gothic', 'CenturyGothic', 'AppleGothic', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif"
        }}>
          Loading dashboard...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box className="dashboard-wrapper" sx={{ textAlign: "center", mt: 6 }}>
        <Typography sx={{ fontSize: '16px', fontWeight: 600, color: '#c0392b', mb: 2 }}>
          {error}
        </Typography>
        <Button
          onClick={fetchDashboardData}
          sx={{
            mt: 2,
            background: '#5c4730',
            color: 'white',
            fontWeight: 600,
            '&:hover': { background: '#3c2a1c' }
          }}
        >
          Retry
        </Button>
      </Box>
    );
  }

  const statCards = getStatCards();

  return (
    <Box className="dashboard-wrapper">
      {/* Header with officer info */}
      <Box className="dashboard-header">
        <Box className="header-content">
          <Box>
            <Typography className="dashboard-subtitle">
              {currentUser ? 
                `Welcome, ${currentUser.name || currentUser.username}` : 
                'Your Collection Performance Overview'}
            </Typography>
          </Box>
          <button
            className="minimal-refresh-btn"
            onClick={fetchDashboardData}
            disabled={loading}
          >
            <Refresh sx={{ fontSize: 18 }} />
            Refresh
          </button>
        </Box>
      </Box>

      {/* Officer Performance Summary - HORIZONTAL CARD */}
      {userRole === 'officer' && additionalStats.roleData && (
        <div className="officer-performance-summary">
          <div className="performance-summary-card">
            <Typography className="performance-title">
              Performance Summary
            </Typography>
            <div className="performance-metrics">
              <div className="performance-metric">
                <span className="metric-label">Assigned Customers:</span>
                <span className="metric-value">{additionalStats.roleData.assignedCustomers || 0}</span>
              </div>
              <div className="performance-metric">
                <span className="metric-label">Success Rate:</span>
                <span className="metric-value success-rate">{additionalStats.roleData.successRate || '0%'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid - ONLY 3 CARDS */}
      <div className="minimal-stats-grid">
        {statCards.map((card, idx) => (
          <div key={idx} className="minimal-stat-card">
            <div className="stat-header">
              <div className="stat-label">{card.title}</div>
              <div className="stat-icon-wrapper">
                {card.icon}
              </div>
            </div>
            <div>
              <div className="stat-value">
                {card.format ? card.format(card.value) :
                  card.isCurrency ? formatAmount(card.value) : card.value}
              </div>
              {card.subtitle && (
                <div className="stat-subtitle">
                  {card.subtitle}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <Box className="dashboard-main-content">
        {/* Recent Transactions Section */}
        <Box className="recent-customers-section">
          <div className="recent-customers-card">
            <div className="section-header">
              <Typography className="section-title">
                {userRole === 'officer' ? 'My Recent Transactions' : 'Recent Transactions'}
                <span className="transaction-count-badge">
                  {recentTransactions.length}
                </span>
              </Typography>
              <button
                className="view-all-btn"
                onClick={() => navigate('/transactions')}
              >
                View All
              </button>
            </div>

            <div className="customers-list">
              {recentTransactions.length === 0 ? (
                <div className="customers-empty-state">
                  <div className="empty-icon">💳</div>
                  <Typography className="empty-title">
                    {userRole === 'officer' ? 'No Transactions Yet' : 'No Recent Transactions'}
                  </Typography>
                  <Typography className="empty-subtitle">
                    {userRole === 'officer' 
                      ? 'Process your first payment to see transactions here' 
                      : 'No transactions have been recorded yet'}
                  </Typography>
                  {userRole === 'officer' && (
                    <button
                      className="primary-action-btn"
                      onClick={() => navigate('/payments')}
                    >
                      Process First Payment
                    </button>
                  )}
                </div>
              ) : (
                recentTransactions.map((transaction, index) => {
                  // Extract customer info with better fallbacks
                  let customerName = 'Unknown Customer';
                  let phoneNumber = 'N/A';
                  
                  // Try multiple possible data structures
                  if (transaction.customerId) {
                    if (typeof transaction.customerId === 'object') {
                      customerName = transaction.customerId.name || customerName;
                      phoneNumber = transaction.customerId.phoneNumber || phoneNumber;
                    } else {
                      // If customerId is just an ID string
                      customerName = transaction.customerName || customerName;
                    }
                  }
                  
                  if (transaction.customer) {
                    customerName = transaction.customer.name || customerName;
                    phoneNumber = transaction.customer.phoneNumber || phoneNumber;
                  }
                  
                  if (transaction.customerName) {
                    customerName = transaction.customerName;
                  }
                  
                  if (transaction.phoneNumber) {
                    phoneNumber = transaction.phoneNumber;
                  }
                  
                  // Get transaction date
                  const transactionDate = transaction.createdAt || 
                                         transaction.date || 
                                         transaction.processedAt;
                  
                  // Get status and determine badge class
                  const status = transaction.status?.toUpperCase() || 'PENDING';
                  let statusClass = '';
                  
                  switch (status) {
                    case 'PENDING':
                      statusClass = 'pending-badge';
                      break;
                    case 'EXPIRED':
                      statusClass = 'expired-badge';
                      break;
                    case 'SUCCESS':
                      statusClass = 'success-badge';
                      break;
                    case 'FAILED':
                      statusClass = 'failed-badge';
                      break;
                    case 'CANCELLED':
                      statusClass = 'cancelled-badge';
                      break;
                    default:
                      statusClass = 'pending-badge';
                  }
                  
                  return (
                    <div
                      key={transaction._id || transaction.id || `trans-${index}`}
                      className="customer-row"
                      style={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/transactions/${transaction._id || transaction.id}`)}
                    >
                      <div className="customer-info">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Typography className="customer-name">
                            {customerName}
                          </Typography>
                        </div>
                        <Typography className="customer-phone">
                          {phoneNumber}
                        </Typography>
                        <Typography className="transaction-date">
                          {formatDate(transactionDate)}
                        </Typography>
                      </div>
                      <div className="arrears-info">
                        <Typography 
                          className="arrears-amount" 
                          style={{ 
                            color: '#3c2a1c',
                            fontWeight: 700,
                            fontSize: '14px'
                          }}
                        >
                          {formatAmount(transaction.amount)}
                        </Typography>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {getStatusIcon(transaction.status)}
                          <Typography 
                            className="arrears-label" 
                            style={{ 
                              color: getStatusColor(transaction.status),
                              fontSize: '12px',
                              fontWeight: 600
                            }}
                          >
                            {transaction.status || 'PENDING'}
                          </Typography>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </Box>

        {/* Quick Actions Section */}
        <Box className="quick-actions-section">
          <div className="quick-actions-card">
            <div className="section-header">
              <Typography className="section-title">
                Quick Actions
              </Typography>
            </div>

            <div className="quick-actions-grid">
              {quickActions.map((action, index) => (
                <div
                  key={index}
                  className="quick-action-item"
                  onClick={() => navigate(action.path)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="action-icon">
                    {action.icon}
                  </div>
                  <Typography className="action-label">
                    {action.label}
                  </Typography>
                </div>
              ))}
            </div>
          </div>
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard;