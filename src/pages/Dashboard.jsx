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
import authService from "../services/auth.service";
import { authAxios } from "../services/api";
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

  const getUserRole = () => {
    try {
      const user = authService.getCurrentUser();
      if (user && user.role) {
        return user.role;
      }
    } catch (error) {
      console.error('Error getting user role from auth service:', error);
    }
    return 'officer';
  };

  const getCurrentUserId = () => {
    try {
      const user = authService.getCurrentUser();
      if (user && (user.id || user._id)) {
        return user.id || user._id;
      }
    } catch (error) {
      console.error('Error getting user ID from auth service:', error);
    }
    return null;
  };

  const getCurrentUser = () => {
    const user = authService.getCurrentUser();
    console.log('👤 Current User:', user);
    return user;
  };

  const fetchRecentTransactions = async () => {
    try {
      const role = getUserRole();
      const userId = getCurrentUserId();
      
      console.log('🔍 Fetching recent transactions for:', { role, userId });
      
      let transactionsData = [];
      
      if (role === 'officer') {
        try {
          const response = await authAxios.get('/transactions/my-transactions?limit=10');
          console.log('✅ Officer transactions response:', response.data);
          
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
          
          try {
            const allResponse = await authAxios.get('/transactions?limit=100');
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
            
            transactionsData = allTransactions.filter(transaction => {
              const initiatedBy = transaction.initiatedByUserId || 
                                 transaction.createdBy || 
                                 transaction.officerId || 
                                 transaction.userId;
              
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
        try {
          const response = await authAxios.get('/transactions?limit=10');
          
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
      
      transactionsData.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.date || a.processedAt || 0);
        const dateB = new Date(b.createdAt || b.date || b.processedAt || 0);
        return dateB - dateA;
      });
      
      const recent = transactionsData.slice(0, 10);
      console.log(`📅 Setting ${recent.length} recent transactions`);
      
      setRecentTransactions(recent);
      
    } catch (transError) {
      console.error('❌ Recent transactions error:', transError);
      setRecentTransactions([]);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const user = getCurrentUser();
      setCurrentUser(user);
      
      console.log('📊 Fetching dashboard data for:', user?.username);
      console.log('🔑 Auth token present:', !!authService.getToken());
      
      if (user?.role) {
        setUserRole(user.role);
      } else {
        const role = getUserRole();
        setUserRole(role);
      }

      if (userRole === 'officer' || (user && user.role === 'officer')) {
        await fetchOfficerDashboardData(user);
      } else {
        await fetchGeneralDashboardData();
      }

    } catch (err) {
      console.error("❌ Dashboard error:", err);
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

  const fetchOfficerDashboardData = async (user) => {
    try {
      console.log('👮 Fetching officer-specific data...');
      
      let customersData = [];
      try {
        const customersRes = await authAxios.get(`/customers/assigned-to-me`);
        if (customersRes.data.success) {
          customersData = customersRes.data.data?.items || 
                         customersRes.data.data?.customers || 
                         customersRes.data.customers || 
                         [];
          console.log('✅ Assigned customers fetched:', customersData.length);
        }
      } catch (customerError) {
        console.warn('⚠️ Could not fetch assigned customers:', customerError.message);
        try {
          const allCustomersRes = await authAxios.get("/customers?limit=1000");
          const allCustomers = allCustomersRes.data.data?.items || 
                              allCustomersRes.data.data?.customers || 
                              allCustomersRes.data.customers || 
                              [];
          customersData = allCustomers.filter(customer => 
            customer.assignedToUserId === user?.id || 
            customer.assignedTo === user?.username ||
            customer.assignedTo === user?.id
          );
          console.log('✅ Fallback customer fetch successful:', customersData.length);
        } catch (fallbackError) {
          console.error('❌ Fallback customer fetch also failed:', fallbackError.message);
        }
      }
      
      console.log('📋 Officer Customers:', customersData.length);
      
      const totalCustomers = customersData.length;
      const totalLoanPortfolio = customersData.reduce((sum, customer) => 
        sum + parseFloat(customer.loanBalance || 0), 0);
      const totalArrears = customersData.reduce((sum, customer) => 
        sum + parseFloat(customer.arrears || 0), 0);
      const activeCustomers = customersData.filter(c => 
        parseFloat(c.arrears || 0) > 0).length;
      
      let collectionsData = [];
      let totalAmountCollected = 0;
      
      try {
        const collectionsRes = await authAxios.get(`/transactions/my-collections`);
        if (collectionsRes.data.success) {
          collectionsData = collectionsRes.data.data || [];
          console.log('💰 Officer Collections:', collectionsData.length);
        }
      } catch (collectionError) {
        console.warn('⚠️ Could not fetch collections:', collectionError.message);
      }
      
      const successfulTransactions = collectionsData.filter(
        transaction => transaction.status?.toUpperCase() === 'SUCCESS'
      );
      totalAmountCollected = successfulTransactions.reduce(
        (sum, transaction) => sum + parseFloat(transaction.amount || 0), 0
      );
      
      let promisesData = [];
      let pendingPromises = 0;
      
      try {
        const promisesRes = await authAxios.get(`/promises/my-promises`);
        if (promisesRes.data.success) {
          promisesData = promisesRes.data.data || [];
          pendingPromises = promisesData.filter(p => 
            p.status === 'pending' || p.status === 'PENDING').length;
          console.log('✅ Promises fetched:', promisesData.length);
        }
      } catch (promiseError) {
        console.warn('⚠️ Could not fetch promises:', promiseError.message);
      }
      
      setStats({
        totalCustomers,
        totalLoanPortfolio,
        totalAmountCollected,
        totalArrears,
        activeCustomers,
        pendingPromises
      });
      
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
      
      await fetchRecentTransactions();
      
    } catch (error) {
      console.error('❌ Officer dashboard data fetch failed:', error);
      await fallbackOfficerData();
    }
  };

  const fallbackOfficerData = async () => {
    try {
      console.log('🔄 Using fallback officer data...');
      
      let totalCustomers = 0;
      let totalLoanPortfolio = 0;
      let totalArrears = 0;
      let activeCustomers = 0;
      
      try {
        const statsRes = await authAxios.get("/customers/dashboard/stats");
        const statsData = statsRes.data.data?.stats || {};
        
        totalCustomers = statsData.totalCustomers || 0;
        totalLoanPortfolio = statsData.totalLoanPortfolio || 0;
        totalArrears = statsData.totalArrears || 0;
        activeCustomers = statsData.activeCustomers || 0;
      } catch (statsError) {
        console.warn('⚠️ Could not fetch stats:', statsError.message);
      }
      
      setStats({
        totalCustomers,
        totalLoanPortfolio,
        totalAmountCollected: 0,
        totalArrears,
        activeCustomers,
        pendingPromises: 0
      });
      
      await fetchRecentTransactions();
      
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

  const fetchGeneralDashboardData = async () => {
    try {
      const statsRes = await authAxios.get("/customers/dashboard/stats");
      const statsData = statsRes.data.data?.stats || {};
      
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
      
      await fetchRecentTransactions();
      
    } catch (error) {
      console.warn('⚠️ General dashboard fetch failed:', error.message);
      await fallbackGeneralData();
    }
  };

  const fallbackGeneralData = async () => {
    try {
      const [customersRes, transactionsRes] = await Promise.all([
        authAxios.get("/customers?limit=1").catch(() => ({ data: { data: { customers: [] } } })),
        authAxios.get("/transactions?limit=10").catch(() => ({ data: { data: [] } }))
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
      case 'SUCCESS': return '#2ecc71';
      case 'FAILED': return '#e74c3c';
      case 'PENDING': return '#f39c12';
      case 'EXPIRED': return '#95a5a6';
      case 'CANCELLED': return '#7f8c8d';
      default: return '#f39c12';
    }
  };

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

      <Box className="dashboard-main-content">
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
                  let customerName = 'Unknown Customer';
                  let phoneNumber = 'N/A';
                  
                  if (transaction.customerId) {
                    if (typeof transaction.customerId === 'object') {
                      customerName = transaction.customerId.name || customerName;
                      phoneNumber = transaction.customerId.phoneNumber || phoneNumber;
                    } else {
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
                  
                  const transactionDate = transaction.createdAt || 
                                         transaction.date || 
                                         transaction.processedAt;
                  
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