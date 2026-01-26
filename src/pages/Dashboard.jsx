import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  IconButton
} from "@mui/material";
import {
  AccountBalanceWallet,
  People,
  Receipt,
  Refresh,
  Payment,
  Assessment,
  ReceiptLong,
  ArrowForward,
  LibraryAdd,
  LibraryAddCheck,
  PeopleAlt,
  CheckCircle,
  Cancel,
  AccessTime,
  TrendingUp,
  TrendingDown,
  Paid,
  Schedule
} from "@mui/icons-material";
import axios from "axios";
import authService from "../services/auth.service";
import LayoutWrapper from "../LayoutWrapper";
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

  const getApi = () => {
    const token = authService.getToken();
    return axios.create({
      baseURL: "http://localhost:5000/api",
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const api = getApi();
      
      console.log('📊 Fetching dashboard data...');
      
      try {
        // Try to fetch dashboard stats from the API endpoint
        const statsRes = await api.get("/customers/dashboard/stats");
        console.log('📈 Dashboard Stats API Response:', statsRes.data);
        
        // IMPORTANT: Fixed path - access data.data.stats
        const statsData = statsRes.data.data?.stats || {};
        
        console.log('📊 Processed Stats Data:', statsData);
        
        // Set user role from response if available
        if (statsData.user?.role) {
          setUserRole(statsData.user.role);
        }
        
        // Set main stats - with proper fallbacks
        setStats({
          totalCustomers: statsData.totalCustomers || statsData.overview?.totalCustomers || 0,
          totalLoanPortfolio: statsData.totalLoanPortfolio || 0, // Might need separate endpoint
          totalAmountCollected: statsData.totalCollections || statsData.roleData?.totalCollections || statsData.roleData?.myCollections || 0,
          totalArrears: statsData.totalArrears || statsData.overview?.totalArrears || 0,
          activeCustomers: statsData.activeCustomers || statsData.overview?.activeCustomers || 0,
          pendingPromises: statsData.pendingPromises || 0
        });
        
        // Set additional role-specific stats
        setAdditionalStats({
          roleData: statsData.roleData || {},
          overview: statsData.overview || {},
          recentActivity: statsData.recentActivity || {}
        });
        
        // Set recent transactions from API if available
        if (statsData.recentActivity?.transactions) {
          setRecentTransactions(statsData.recentActivity.transactions);
        } else {
          // Fallback: Fetch recent transactions separately
          await fetchRecentTransactions(api);
        }
        
      } catch (statsError) {
        console.warn('⚠️ Dashboard stats endpoint failed, falling back to manual calculation:', statsError.message);
        await fallbackToManualCalculation(api);
      }
      
    } catch (err) {
      console.error("❌ Dashboard error:", err.response?.data || err.message);
      
      // Detailed error logging
      if (err.response) {
        console.error("Error response:", {
          status: err.response.status,
          data: err.response.data,
          url: err.config?.url
        });
      }
      
      setError(err.response?.data?.message || "Failed to load dashboard data");
      
      if (err.response?.status === 401) {
        authService.logout();
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const fallbackToManualCalculation = async (api) => {
    try {
      // Fetch customers to calculate stats
      const customersRes = await api.get("/customers?limit=1000");
      const customersData = customersRes.data.data?.customers || [];
      
      // Calculate stats from customers data
      const calculatedStats = {
        totalCustomers: customersData.length || 0,
        totalLoanPortfolio: customersData.reduce((sum, customer) => 
          sum + parseFloat(customer.loanBalance || 0), 0),
        totalArrears: customersData.reduce((sum, customer) => 
          sum + parseFloat(customer.arrears || 0), 0),
        totalAmountCollected: 0,
        activeCustomers: customersData.filter(c => parseFloat(c.arrears || 0) > 0).length || 0,
        pendingPromises: 0
      };
      
      console.log('📊 Manual Calculated Stats:', calculatedStats);
      setStats(calculatedStats);
      
      // Fetch recent transactions
      await fetchRecentTransactions(api);
      
      // Fetch total collections from transactions
      try {
        const transactionsRes = await api.get("/transactions?limit=1000");
        const transactionsData = transactionsRes.data.data || [];
        
        if (transactionsData && transactionsData.length > 0) {
          const successfulTransactions = transactionsData.filter(
            transaction => transaction.status?.toUpperCase() === 'SUCCESS'
          );
          const totalCollected = successfulTransactions.reduce(
            (sum, transaction) => sum + parseFloat(transaction.amount || 0), 0
          );
          
          setStats(prev => ({
            ...prev,
            totalAmountCollected: totalCollected
          }));
        }
      } catch (transError) {
        console.warn('⚠️ Could not fetch transactions for collections:', transError.message);
      }
      
    } catch (error) {
      console.error('❌ Manual calculation failed:', error);
      throw error;
    }
  };

  const fetchRecentTransactions = async (api) => {
    try {
      const transactionsRes = await api.get("/transactions?limit=10");
      const transResponse = transactionsRes.data;
      
      let transactionsData = [];
      
      if (transResponse.data && Array.isArray(transResponse.data)) {
        transactionsData = transResponse.data;
      } else if (transResponse.data?.transactions) {
        transactionsData = transResponse.data.transactions;
      } else if (Array.isArray(transResponse)) {
        transactionsData = transResponse;
      } else if (transResponse.transactions) {
        transactionsData = transResponse.transactions;
      } else if (transResponse.data) {
        transactionsData = transResponse.data;
      }
      
      console.log('💳 Recent Transactions:', transactionsData);
      setRecentTransactions(transactionsData || []);
      
    } catch (transError) {
      console.warn('⚠️ Could not fetch recent transactions:', transError.message);
      setRecentTransactions([]);
    }
  };

  useEffect(() => {
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

  // Get status icon and color
  const getStatusIcon = (status) => {
    switch (status?.toUpperCase()) {
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

  // Get status text color
  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'SUCCESS': return '#2ecc71';
      case 'FAILED': return '#e74c3c';
      case 'PENDING': return '#f39c12';
      case 'EXPIRED': return '#95a5a6';
      case 'CANCELLED': return '#7f8c8d';
      default: return '#f39c12';
    }
  };

  // Get trend indicator based on stats
  const getTrendIndicator = (value, isPositiveGood = true) => {
    if (value > 0) {
      return isPositiveGood ? 
        <TrendingUp sx={{ fontSize: 14, color: '#2ecc71', ml: 0.5 }} /> :
        <TrendingDown sx={{ fontSize: 14, color: '#e74c3c', ml: 0.5 }} />;
    }
    return null;
  };

  // Handle transaction click
  const handleTransactionClick = (transaction) => {
    navigate(`/transactions/${transaction.id || transaction._id}`);
  };

  // Role-specific stat cards
  const getStatCards = () => {
    const baseCards = [
      {
        title: "Total Customers",
        value: stats.totalCustomers,
        icon: <People />,
        isCurrency: false,
        format: (val) => val.toLocaleString(),
        trend: getTrendIndicator(stats.totalCustomers, true),
        subtitle: `${stats.activeCustomers} active`
      },
      {
        title: "Loan Portfolio",
        value: stats.totalLoanPortfolio,
        icon: <AccountBalanceWallet />,
        isCurrency: true,
        format: (val) => formatAmount(val),
        trend: getTrendIndicator(stats.totalLoanPortfolio, false),
        subtitle: "Total outstanding"
      },
      {
        title: "Collections",
        value: stats.totalAmountCollected,
        icon: <Paid />,
        isCurrency: true,
        format: (val) => formatAmount(val),
        trend: getTrendIndicator(stats.totalAmountCollected, true),
        subtitle: "Total collected"
      },
      {
        title: "Arrears",
        value: stats.totalArrears,
        icon: <LibraryAdd />,
        isCurrency: true,
        format: (val) => formatAmount(val),
        trend: getTrendIndicator(stats.totalArrears, false),
        subtitle: "Total overdue"
      }
    ];

    // Add role-specific cards
    if (userRole === 'officer' || userRole === 'agent') {
      baseCards.push({
        title: "My Collections",
        value: additionalStats.roleData?.myCollections || 0,
        icon: <LibraryAddCheck />,
        isCurrency: true,
        format: (val) => formatAmount(val),
        subtitle: "Personal performance"
      });
    }

    if (stats.pendingPromises > 0) {
      baseCards.push({
        title: "Pending Promises",
        value: stats.pendingPromises,
        icon: <Schedule />,
        isCurrency: false,
        format: (val) => val.toLocaleString(),
        subtitle: "Awaiting payment"
      });
    }

    return baseCards;
  };

  // Quick actions
  const quickActions = [
    {
      label: "Customers",
      icon: <PeopleAlt />,
      path: "/customers"
    },
    {
      label: "Process Payment",
      icon: <Payment />,
      path: "/payments"
    },
    {
      label: "View Reports",
      icon: <Assessment />,
      path: "/reports"
    },
    {
      label: "Transactions",
      icon: <ReceiptLong />,
      path: "/transactions"
    }
  ];

  if (loading) {
    return (
      <LayoutWrapper>
        <Box className="dashboard-wrapper" sx={{ textAlign: "center", mt: 6 }}>
          <Typography sx={{ fontSize: '16px', fontWeight: 600, color: '#5c4730' }}>
            Loading dashboard data...
          </Typography>
        </Box>
      </LayoutWrapper>
    );
  }

  if (error) {
    return (
      <LayoutWrapper>
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
      </LayoutWrapper>
    );
  }

  const statCards = getStatCards();

  return (
    <LayoutWrapper>
      <Box className="dashboard-wrapper">
        {/* Header */}
        <Box className="dashboard-header">
          <Box className="header-content">
            <Box>
              <Typography className="dashboard-title">
                Dashboard
              </Typography>
              <Typography className="dashboard-subtitle">
                {userRole ? `Welcome, ${userRole.charAt(0).toUpperCase() + userRole.slice(1)}` : 'Overview of Loan Portfolio & Collections'}
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

        {/* Stats Grid */}
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
                   card.isCurrency ? formatAmount(card.value) : card.value.toLocaleString()}
                  {card.trend}
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

        {/* Role-specific information */}
        {userRole && (additionalStats.roleData?.viewType || additionalStats.roleData?.teamMembers) && (
          <div className="role-info-section">
            <div className="role-info-card">
              <Typography className="role-info-title">
                {userRole === 'admin' ? 'System Overview' : 
                 userRole === 'supervisor' ? 'Team Performance' : 
                 'My Performance'}
              </Typography>
              <div className="role-info-content">
                {userRole === 'admin' && additionalStats.roleData?.activeUsers && (
                  <div className="role-info-item">
                    <span>Active Users:</span>
                    <span className="role-info-value">{additionalStats.roleData.activeUsers}</span>
                  </div>
                )}
                {userRole === 'supervisor' && additionalStats.roleData?.teamMembers && (
                  <div className="role-info-item">
                    <span>Team Members:</span>
                    <span className="role-info-value">{additionalStats.roleData.teamMembers}</span>
                  </div>
                )}
                {userRole === 'officer' && additionalStats.roleData?.assignedCustomers && (
                  <div className="role-info-item">
                    <span>Assigned Customers:</span>
                    <span className="role-info-value">{additionalStats.roleData.assignedCustomers}</span>
                  </div>
                )}
                {userRole === 'officer' && additionalStats.roleData?.myPromises && (
                  <div className="role-info-item">
                    <span>My Promises:</span>
                    <span className="role-info-value">{additionalStats.roleData.myPromises}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <Box className="dashboard-main-content">
          {/* Recent Transactions Section */}
          <Box className="recent-customers-section">
            <div className="recent-customers-card">
              <div className="section-header">
                <Typography className="section-title">
                  Recent Transactions
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
                      No Recent Transactions
                    </Typography>
                    <Typography className="empty-subtitle">
                      Process a payment to see transactions here
                    </Typography>
                    <Button
                      variant="contained"
                      onClick={() => navigate('/payments')}
                      sx={{
                        background: '#5c4730',
                        color: 'white',
                        fontSize: '14px',
                        fontWeight: 600,
                        padding: '8px 20px',
                        '&:hover': { background: '#3c2a1c' }
                      }}
                    >
                      Process Payment
                    </Button>
                  </div>
                ) : (
                  recentTransactions.map((transaction, index) => {
                    // Handle both API response structures
                    const customerData = transaction.customerId || {};
                    const customerName = customerData.name || 
                                        transaction.customerName || 
                                        'Unknown Customer';
                    const phoneNumber = customerData.phoneNumber || 
                                       transaction.phoneNumber || 
                                       'N/A';
                    
                    return (
                      <div 
                        key={transaction.id || transaction._id || index} 
                        className="customer-row"
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="customer-info">
                          <Typography className="customer-name">
                            {customerName}
                          </Typography>
                          <Typography className="customer-phone">
                            {phoneNumber}
                          </Typography>
                          <Typography className="transaction-date">
                            {formatDate(transaction.date || transaction.createdAt)}
                          </Typography>
                        </div>
                        <div className="arrears-info">
                          <Typography className="arrears-amount" style={{ color: getStatusColor(transaction.status) }}>
                            {formatAmount(transaction.amount)}
                            <span style={{ marginLeft: '6px' }}>
                              {getStatusIcon(transaction.status)}
                            </span>
                          </Typography>
                          <Typography className="arrears-label" style={{ color: getStatusColor(transaction.status) }}>
                            {transaction.status || 'PENDING'}
                          </Typography>
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
                  <a
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
                  </a>
                ))}
              </div>
            </div>
          </Box>
        </Box>
      </Box>
    </LayoutWrapper>
  );
};

export default Dashboard;