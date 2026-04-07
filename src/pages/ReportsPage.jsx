// src/pages/ReportsPage.jsx - COMPLETELY FIXED
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  LinearProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Refresh,
  Assessment,
  People,
  Payments,
  EventNote,
  Today,
  DateRange,
  CalendarMonth,
  Download,
  TableChart,
  Close,
  AssignmentInd,
  SupervisorAccount,
  Groups,
  Receipt,
  AttachMoney,
  TrendingUp,
  Warning,
  CheckCircle,
  Cancel,
  AccessTime
} from '@mui/icons-material';
import authService from '../services/auth.service';
import { authAxios } from '../services/api'; // ✅ IMPORT the configured axios instance
import LayoutWrapper from "../LayoutWrapper";
import '../styles/reportspage.css';

const ReportsPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState('customers');
  const [selectedTimeRange, setSelectedTimeRange] = useState('today');
  const [customDateRange, setCustomDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  // Report data states
  const [customersReport, setCustomersReport] = useState({
    data: [],
    summary: {
      totalCustomers: 0,
      totalLoanPortfolio: 0,
      totalArrears: 0,
      activeCustomers: 0,
      inArrears: 0
    }
  });

  const [transactionsReport, setTransactionsReport] = useState({
    data: [],
    summary: {
      totalTransactions: 0,
      totalAmount: 0,
      successfulCount: 0,
      failedCount: 0,
      pendingCount: 0,
      averageAmount: 0
    }
  });

  const [promisesReport, setPromisesReport] = useState({
    data: [],
    summary: {
      totalPromises: 0,
      totalAmount: 0,
      fulfilledCount: 0,
      brokenCount: 0,
      pendingCount: 0,
      fulfillmentRate: 0
    }
  });

  // User role state
  const [userRole, setUserRole] = useState('officer');
  const [isSupervisor, setIsSupervisor] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Get user info from auth service
  const getUserInfo = () => {
    const user = authService.getCurrentUser();
    if (!user) return { role: 'officer', isSupervisor: false, isAdmin: false };
    
    const role = user.role?.toLowerCase() || 'officer';
    const isSupervisorUser = role === 'supervisor';
    const isAdminUser = role === 'admin';
    
    console.log('👤 Reports Page - User Info:', { 
      username: user.username, 
      role: role, 
      isSupervisor: isSupervisorUser,
      isAdmin: isAdminUser,
      userId: user.id || user._id
    });
    
    return { 
      role, 
      isSupervisor: isSupervisorUser, 
      isAdmin: isAdminUser,
      userId: user.id || user._id,
      username: user.username 
    };
  };

  // Get date range based on selected time range
  const getDateRange = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let startDate = new Date(today);
    let endDate = new Date(today);
    endDate.setHours(23, 59, 59, 999);

    if (selectedTimeRange === 'today') {
      // Already set to today
    } else if (selectedTimeRange === 'week') {
      // Start of week (Sunday)
      startDate.setDate(today.getDate() - today.getDay());
    } else if (selectedTimeRange === 'month') {
      // Start of month
      startDate.setDate(1);
    } else if (selectedTimeRange === 'custom' && customDateRange.startDate && customDateRange.endDate) {
      startDate = new Date(customDateRange.startDate);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(customDateRange.endDate);
      endDate.setHours(23, 59, 59, 999);
    }

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      startDateTime: startDate.toISOString(),
      endDateTime: endDate.toISOString()
    };
  };

  // Fetch report data based on selected type
  const fetchReportData = async () => {
    try {
      setLoading(true);
      setError(null);

      const userInfo = getUserInfo();
      
      // Update local state
      setUserRole(userInfo.role);
      setIsSupervisor(userInfo.isSupervisor);
      setIsAdmin(userInfo.isAdmin);

      const dateRange = getDateRange();
      console.log(`📅 Fetching ${selectedReportType} report with date range:`, dateRange);

      if (selectedReportType === 'customers') {
        await fetchCustomersReport(dateRange, userInfo);
      } else if (selectedReportType === 'transactions') {
        await fetchTransactionsReport(dateRange, userInfo);
      } else if (selectedReportType === 'promises') {
        await fetchPromisesReport(dateRange, userInfo);
      }

    } catch (err) {
      console.error("Reports error:", err.response?.data || err.message);
      setError(err.response?.data?.message || "Failed to load report data");

      if (err.response?.status === 401) {
        authService.logout();
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch customers report
  const fetchCustomersReport = async (dateRange, userInfo) => {
    try {
      console.log("🔍 Fetching customers report...");
      
      let endpoint = '/customers/report';
      let params = {
        startDate: dateRange.startDateTime,
        endDate: dateRange.endDateTime
      };

      // For officers, get only assigned customers
      if (userInfo.role === 'officer') {
        endpoint = '/customers/assigned-to-me/report';
      }

      console.log(`📡 GET ${endpoint}`, params);
      const response = await authAxios.get(endpoint, { params }); // ✅ Use authAxios
      
      console.log("📥 Customers report response:", response.data);
      
      if (response.data.success) {
        // Ensure data structure matches what the component expects
        const reportData = response.data.data || { data: [], summary: {} };
        setCustomersReport({
          data: reportData.customers || reportData.data || [],
          summary: reportData.summary || {
            totalCustomers: 0,
            totalLoanPortfolio: 0,
            totalArrears: 0,
            activeCustomers: 0,
            inArrears: 0
          }
        });
      } else {
        setError(response.data.message || 'Failed to load customers report');
      }
    } catch (error) {
      console.error('❌ Error fetching customers report:', error);
      console.error('Error details:', error.response?.data);
      throw error;
    }
  };

  // Fetch transactions report
  const fetchTransactionsReport = async (dateRange, userInfo) => {
    try {
      console.log("🔍 Fetching transactions report...");
      
      let endpoint = '/payments/report';
      let params = {
        startDate: dateRange.startDateTime,
        endDate: dateRange.endDateTime
      };

      // For officers, get only their transactions
      if (userInfo.role === 'officer') {
        endpoint = '/payments/my-transactions/report';
      }

      console.log(`📡 GET ${endpoint}`, params);
      const response = await authAxios.get(endpoint, { params }); // ✅ Use authAxios
      
      console.log("📥 Transactions report response:", response.data);
      
      if (response.data.success) {
        const reportData = response.data.data || { transactions: [], summary: {} };
        setTransactionsReport({
          data: reportData.transactions || reportData.data || [],
          summary: reportData.summary || {
            totalTransactions: 0,
            totalAmount: 0,
            successfulCount: 0,
            failedCount: 0,
            pendingCount: 0,
            averageAmount: 0
          }
        });
      } else {
        setError(response.data.message || 'Failed to load transactions report');
      }
    } catch (error) {
      console.error('❌ Error fetching transactions report:', error);
      console.error('Error details:', error.response?.data);
      throw error;
    }
  };

  // Fetch promises report
  const fetchPromisesReport = async (dateRange, userInfo) => {
    try {
      console.log("🔍 Fetching promises report...");
      
      let endpoint = '/promises/report';
      let params = {
        startDate: dateRange.startDateTime,
        endDate: dateRange.endDateTime
      };

      // For officers, get only their promises
      if (userInfo.role === 'officer') {
        endpoint = '/promises/my-promises/report';
      }

      console.log(`📡 GET ${endpoint}`, params);
      const response = await authAxios.get(endpoint, { params }); // ✅ Use authAxios
      
      console.log("📥 Promises report response:", response.data);
      
      if (response.data.success) {
        const reportData = response.data.data || { promises: [], summary: {} };
        setPromisesReport({
          data: reportData.promises || reportData.data || [],
          summary: reportData.summary || {
            totalPromises: 0,
            totalAmount: 0,
            fulfilledCount: 0,
            brokenCount: 0,
            pendingCount: 0,
            fulfillmentRate: 0
          }
        });
      } else {
        setError(response.data.message || 'Failed to load promises report');
      }
    } catch (error) {
      console.error('❌ Error fetching promises report:', error);
      console.error('Error details:', error.response?.data);
      throw error;
    }
  };

  // Export report
  const exportReport = async (format) => {
    try {
      setExportLoading(true);
      const userInfo = getUserInfo();
      const dateRange = getDateRange();

      let endpoint = '';
      let filename = '';

      // Determine endpoint based on report type
      if (selectedReportType === 'customers') {
        endpoint = userInfo.role === 'officer' 
          ? '/customers/assigned-to-me/export' 
          : '/customers/export';
        filename = `customers_report_${dateRange.startDate}_to_${dateRange.endDate}`;
      } else if (selectedReportType === 'transactions') {
        endpoint = '/payments/export';
        filename = `transactions_report_${dateRange.startDate}_to_${dateRange.endDate}`;
      } else if (selectedReportType === 'promises') {
        endpoint = '/promises/export';
        filename = `promises_report_${dateRange.startDate}_to_${dateRange.endDate}`;
      }

      // Add format parameter
      const params = {
        startDate: dateRange.startDateTime,
        endDate: dateRange.endDateTime,
        format: format === 'xlsx' ? 'excel' : format
      };

      console.log(`📡 Exporting to ${format}:`, { endpoint, params });

      const response = await authAxios.get(endpoint, { // ✅ Use authAxios
        params,
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${filename}.${format === 'xlsx' ? 'xlsx' : 'csv'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setShowExportDialog(false);
    } catch (error) {
      console.error('Export error:', error);
      setError('Failed to export report. Please try again.');
    } finally {
      setExportLoading(false);
    }
  };

  useEffect(() => {
    // Check authentication
    console.log('🔐 Reports Page mounted - Auth status:', {
      isAuthenticated: authService.isAuthenticated(),
      token: authService.getToken() ? 'Present' : 'Missing',
      user: authService.getCurrentUser()
    });

    if (!authService.isAuthenticated()) {
      console.log('❌ Not authenticated, redirecting to login');
      authService.logout();
      navigate('/login');
      return;
    }

    const userInfo = getUserInfo();
    setUserRole(userInfo.role);
    setIsSupervisor(userInfo.isSupervisor);
    setIsAdmin(userInfo.isAdmin);
    
    fetchReportData();
  }, [selectedReportType, selectedTimeRange, customDateRange.startDate, customDateRange.endDate]);

  // Handle refresh
  const handleRefresh = () => {
    console.log('🔄 Refreshing report data...');
    fetchReportData();
  };

  // Handle time range change
  const handleTimeRangeChange = (range) => {
    setSelectedTimeRange(range);
    if (range !== 'custom') {
      setCustomDateRange({ startDate: '', endDate: '' });
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    const numAmount = parseFloat(amount || 0);
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numAmount);
  };

  // Format number with commas
  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-KE').format(num || 0);
  };

  // Get role-based icon
  const getRoleIcon = () => {
    if (isSupervisor) return <SupervisorAccount sx={{ fontSize: 16 }} />;
    if (isAdmin) return <Groups sx={{ fontSize: 16 }} />;
    return <AssignmentInd sx={{ fontSize: 16 }} />;
  };

  // Get role-based subtitle
  const getRoleSubtitle = () => {
    if (isSupervisor) return 'Supervisor - Generate Comprehensive Reports';
    if (isAdmin) return 'Administrator - Full Reporting Access';
    return 'Generate My Performance Reports';
  };

  // Get role-based color classes
  const getRoleTextColor = () => {
    if (isSupervisor) return 'supervisor-text';
    if (isAdmin) return 'admin-text';
    return 'officer-text';
  };

  const getRoleAccentClass = () => {
    if (isSupervisor) return 'supervisor-accent';
    if (isAdmin) return 'admin-accent';
    return 'officer-accent';
  };

  const getRolePrimaryClass = () => {
    if (isSupervisor) return 'supervisor-primary';
    if (isAdmin) return 'admin-primary';
    return 'officer-primary';
  };

  // Get report type icon
  const getReportTypeIcon = (type) => {
    switch (type) {
      case 'customers':
        return <People sx={{ fontSize: 20 }} />;
      case 'transactions':
        return <Payments sx={{ fontSize: 20 }} />;
      case 'promises':
        return <EventNote sx={{ fontSize: 20 }} />;
      default:
        return <Assessment sx={{ fontSize: 20 }} />;
    }
  };

  // Check if data exists for current report type
  const hasData = () => {
    if (selectedReportType === 'customers') {
      return customersReport.data && customersReport.data.length > 0;
    } else if (selectedReportType === 'transactions') {
      return transactionsReport.data && transactionsReport.data.length > 0;
    } else if (selectedReportType === 'promises') {
      return promisesReport.data && promisesReport.data.length > 0;
    }
    return false;
  };

  return (
    <LayoutWrapper>
      <Box className="reports-page-wrapper">
        {loading && (
          <Box sx={{
            position: 'sticky',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 9999,
            mb: 2
          }}>
            <LinearProgress sx={{
              height: 3,
              backgroundColor: '#f5f0ea',
              '& .MuiLinearProgress-bar': {
                backgroundColor: '#5c4730'
              }
            }} />
          </Box>
        )}
        
        {/* Header */}
        <Box className="reports-page-header">
          <Box className="reports-page-header-content">
            <Box>
              <Typography className={`page-subtitle ${getRoleTextColor()}`} component="div">
                {getRoleSubtitle()}
              </Typography>
            </Box>
            <Box className="reports-page-header-actions">
              <button
                className="customer-action-btn"
                onClick={handleRefresh}
                disabled={loading}
              >
                <Refresh sx={{ fontSize: 14 }} />
                Refresh
              </button>
              <button
                className={`customer-primary-btn ${getRolePrimaryClass()}`}
                onClick={() => setShowExportDialog(true)}
                disabled={loading || !hasData()}
              >
                <Download sx={{ fontSize: 14 }} />
                Export Report
              </button>
            </Box>
          </Box>
        </Box>

        {/* Report Type Selector */}
        <div className="reports-type-selector">
          <button
            className={`report-type-btn ${selectedReportType === 'customers' ? 'active' : ''} ${getRoleTextColor()}`}
            onClick={() => setSelectedReportType('customers')}
          >
            <People sx={{ fontSize: 18 }} />
            Customers Report
          </button>
          <button
            className={`report-type-btn ${selectedReportType === 'transactions' ? 'active' : ''} ${getRoleTextColor()}`}
            onClick={() => setSelectedReportType('transactions')}
          >
            <Payments sx={{ fontSize: 18 }} />
            Transactions Report
          </button>
          <button
            className={`report-type-btn ${selectedReportType === 'promises' ? 'active' : ''} ${getRoleTextColor()}`}
            onClick={() => setSelectedReportType('promises')}
          >
            <EventNote sx={{ fontSize: 18 }} />
            Promises Report
          </button>
        </div>

        {/* Time Range Filter */}
        <div className="reports-time-range">
          <div className="time-range-buttons">
            <button
              className={`time-range-btn ${selectedTimeRange === 'today' ? 'active' : ''}`}
              onClick={() => handleTimeRangeChange('today')}
            >
              <Today sx={{ fontSize: 14 }} />
              Today
            </button>
            <button
              className={`time-range-btn ${selectedTimeRange === 'week' ? 'active' : ''}`}
              onClick={() => handleTimeRangeChange('week')}
            >
              <DateRange sx={{ fontSize: 14 }} />
              This Week
            </button>
            <button
              className={`time-range-btn ${selectedTimeRange === 'month' ? 'active' : ''}`}
              onClick={() => handleTimeRangeChange('month')}
            >
              <CalendarMonth sx={{ fontSize: 14 }} />
              This Month
            </button>
            <button
              className={`time-range-btn ${selectedTimeRange === 'custom' ? 'active' : ''}`}
              onClick={() => handleTimeRangeChange('custom')}
            >
              <DateRange sx={{ fontSize: 14 }} />
              Custom Range
            </button>
          </div>

          {selectedTimeRange === 'custom' && (
            <div className="custom-date-range">
              <input
                type="date"
                className="date-input"
                value={customDateRange.startDate}
                onChange={(e) => setCustomDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                max={customDateRange.endDate || undefined}
              />
              <span className="date-separator">to</span>
              <input
                type="date"
                className="date-input"
                value={customDateRange.endDate}
                onChange={(e) => setCustomDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                min={customDateRange.startDate || undefined}
              />
            </div>
          )}
        </div>

        {/* Report Summary Cards */}
        {selectedReportType === 'customers' && (
          <div className="customer-stats-grid">
            <div className="customer-stat-card">
              <div className={`stat-top-border ${getRoleAccentClass()}`}></div>
              <div className="customer-stat-header">
                <div className={`customer-stat-label ${getRoleTextColor()}`}>
                  Total Customers
                </div>
                <div className={`customer-stat-icon-wrapper ${getRoleAccentClass()}`}>
                  <People sx={{ fontSize: 16 }} />
                </div>
              </div>
              <div>
                <div className={`customer-stat-value ${getRoleTextColor()}`}>
                  {formatNumber(customersReport.summary.totalCustomers)}
                </div>
                <div className="customer-stat-meta">
                  Active: {formatNumber(customersReport.summary.activeCustomers)} | In Arrears: {formatNumber(customersReport.summary.inArrears)}
                </div>
              </div>
            </div>

            <div className="customer-stat-card">
              <div className={`stat-top-border ${getRoleAccentClass()}`}></div>
              <div className="customer-stat-header">
                <div className={`customer-stat-label ${getRoleTextColor()}`}>
                  Loan Portfolio
                </div>
                <div className={`customer-stat-icon-wrapper ${getRoleAccentClass()}`}>
                  <AttachMoney sx={{ fontSize: 16 }} />
                </div>
              </div>
              <div>
                <div className={`customer-stat-value ${getRoleTextColor()}`}>
                  {formatCurrency(customersReport.summary.totalLoanPortfolio)}
                </div>
                <div className="customer-stat-meta">
                  Average: {formatCurrency(customersReport.summary.totalLoanPortfolio / (customersReport.summary.totalCustomers || 1))}
                </div>
              </div>
            </div>

            <div className="customer-stat-card">
              <div className={`stat-top-border ${getRoleAccentClass()}`}></div>
              <div className="customer-stat-header">
                <div className={`customer-stat-label ${getRoleTextColor()}`}>
                  Total Arrears
                </div>
                <div className={`customer-stat-icon-wrapper ${getRoleAccentClass()}`}>
                  <Warning sx={{ fontSize: 16 }} />
                </div>
              </div>
              <div>
                <div className={`customer-stat-value ${getRoleTextColor()}`}>
                  {formatCurrency(customersReport.summary.totalArrears)}
                </div>
                <div className="customer-stat-meta">
                  {((customersReport.summary.totalArrears / customersReport.summary.totalLoanPortfolio) * 100 || 0).toFixed(1)}% of portfolio
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedReportType === 'transactions' && (
          <div className="customer-stats-grid">
            <div className="customer-stat-card">
              <div className={`stat-top-border ${getRoleAccentClass()}`}></div>
              <div className="customer-stat-header">
                <div className={`customer-stat-label ${getRoleTextColor()}`}>
                  Total Transactions
                </div>
                <div className={`customer-stat-icon-wrapper ${getRoleAccentClass()}`}>
                  <Receipt sx={{ fontSize: 16 }} />
                </div>
              </div>
              <div>
                <div className={`customer-stat-value ${getRoleTextColor()}`}>
                  {formatNumber(transactionsReport.summary.totalTransactions)}
                </div>
                <div className="customer-stat-meta">
                  Success: {formatNumber(transactionsReport.summary.successfulCount)} | Failed: {formatNumber(transactionsReport.summary.failedCount)}
                </div>
              </div>
            </div>

            <div className="customer-stat-card">
              <div className={`stat-top-border ${getRoleAccentClass()}`}></div>
              <div className="customer-stat-header">
                <div className={`customer-stat-label ${getRoleTextColor()}`}>
                  Total Amount
                </div>
                <div className={`customer-stat-icon-wrapper ${getRoleAccentClass()}`}>
                  <AttachMoney sx={{ fontSize: 16 }} />
                </div>
              </div>
              <div>
                <div className={`customer-stat-value ${getRoleTextColor()}`}>
                  {formatCurrency(transactionsReport.summary.totalAmount)}
                </div>
                <div className="customer-stat-meta">
                  Average: {formatCurrency(transactionsReport.summary.averageAmount)}
                </div>
              </div>
            </div>

            <div className="customer-stat-card">
              <div className={`stat-top-border ${getRoleAccentClass()}`}></div>
              <div className="customer-stat-header">
                <div className={`customer-stat-label ${getRoleTextColor()}`}>
                  Success Rate
                </div>
                <div className={`customer-stat-icon-wrapper ${getRoleAccentClass()}`}>
                  <TrendingUp sx={{ fontSize: 16 }} />
                </div>
              </div>
              <div>
                <div className={`customer-stat-value ${getRoleTextColor()}`}>
                  {((transactionsReport.summary.successfulCount / transactionsReport.summary.totalTransactions) * 100 || 0).toFixed(1)}%
                </div>
                <div className="customer-stat-meta">
                  Pending: {formatNumber(transactionsReport.summary.pendingCount)}
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedReportType === 'promises' && (
          <div className="customer-stats-grid">
            <div className="customer-stat-card">
              <div className={`stat-top-border ${getRoleAccentClass()}`}></div>
              <div className="customer-stat-header">
                <div className={`customer-stat-label ${getRoleTextColor()}`}>
                  Total Promises
                </div>
                <div className={`customer-stat-icon-wrapper ${getRoleAccentClass()}`}>
                  <EventNote sx={{ fontSize: 16 }} />
                </div>
              </div>
              <div>
                <div className={`customer-stat-value ${getRoleTextColor()}`}>
                  {formatNumber(promisesReport.summary.totalPromises)}
                </div>
                <div className="customer-stat-meta">
                  Total Amount: {formatCurrency(promisesReport.summary.totalAmount)}
                </div>
              </div>
            </div>

            <div className="customer-stat-card">
              <div className={`stat-top-border ${getRoleAccentClass()}`}></div>
              <div className="customer-stat-header">
                <div className={`customer-stat-label ${getRoleTextColor()}`}>
                  Fulfillment Rate
                </div>
                <div className={`customer-stat-icon-wrapper ${getRoleAccentClass()}`}>
                  <CheckCircle sx={{ fontSize: 16 }} />
                </div>
              </div>
              <div>
                <div className={`customer-stat-value ${getRoleTextColor()}`}>
                  {promisesReport.summary.fulfillmentRate?.toFixed(1) || 0}%
                </div>
                <div className="customer-stat-meta">
                  Fulfilled: {formatNumber(promisesReport.summary.fulfilledCount)} | Broken: {formatNumber(promisesReport.summary.brokenCount)}
                </div>
              </div>
            </div>

            <div className="customer-stat-card">
              <div className={`stat-top-border ${getRoleAccentClass()}`}></div>
              <div className="customer-stat-header">
                <div className={`customer-stat-label ${getRoleTextColor()}`}>
                  Pending Promises
                </div>
                <div className={`customer-stat-icon-wrapper ${getRoleAccentClass()}`}>
                  <AccessTime sx={{ fontSize: 16 }} />
                </div>
              </div>
              <div>
                <div className={`customer-stat-value ${getRoleTextColor()}`}>
                  {formatNumber(promisesReport.summary.pendingCount)}
                </div>
                <div className="customer-stat-meta">
                  Amount: {formatCurrency(promisesReport.summary.totalAmount * (promisesReport.summary.pendingCount / promisesReport.summary.totalPromises || 0))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <Alert severity="error" className="customer-alert" sx={{ mx: 1, mt: 1 }}>
            {error}
          </Alert>
        )}

        {/* Report Data Table */}
        <Box className="customer-main-content">
          <div className="customer-content-card">
            <div className="customer-section-header">
              <Box>
                <div className={`customer-section-title ${getRoleTextColor()}`}>
                  {selectedReportType === 'customers' && `CUSTOMERS REPORT (${customersReport.data?.length || 0})`}
                  {selectedReportType === 'transactions' && `TRANSACTIONS REPORT (${transactionsReport.data?.length || 0})`}
                  {selectedReportType === 'promises' && `PROMISES REPORT (${promisesReport.data?.length || 0})`}
                  <div className={`section-title-underline ${getRoleAccentClass()}`}></div>
                </div>
              </Box>
            </div>

            {loading ? (
              <Box className="customer-loading">
                <LinearProgress className={`loading-bar ${getRoleAccentClass()}`} />
                <div className="customer-loading-text">
                  Generating report...
                </div>
              </Box>
            ) : (
              <>
                {/* Customers Table */}
                {selectedReportType === 'customers' && (
                  <div className="table-container-wrapper">
                    <table className="reports-table">
                      <thead>
                        <tr>
                          <th className="customer-table-header-cell">Customer Name</th>
                          <th className="customer-table-header-cell">Phone Number</th>
                          <th className="customer-table-header-cell">Loan Balance</th>
                          <th className="customer-table-header-cell">Arrears</th>
                          <th className="customer-table-header-cell">Last Payment</th>
                          <th className="customer-table-header-cell">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {customersReport.data && customersReport.data.length > 0 ? (
                          customersReport.data.map((customer) => (
                            <tr key={customer._id} className="customer-table-row">
                              <td className="customer-table-cell">
                                <div className="customer-name-text">{customer.name}</div>
                                <div className="customer-account-text">{customer.loanType || 'Standard Loan'}</div>
                              </td>
                              <td className="customer-table-cell">{customer.phoneNumber}</td>
                              <td className="customer-table-cell amount-cell">{formatCurrency(customer.loanBalance)}</td>
                              <td className="customer-table-cell amount-cell">{formatCurrency(customer.arrears)}</td>
                              <td className="customer-table-cell">{customer.lastPaymentDate ? formatDate(customer.lastPaymentDate) : 'No payments'}</td>
                              <td className="customer-table-cell">
                                <span className={`status-badge ${customer.isActive ? 'active' : 'inactive'}`}>
                                  {customer.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="6" className="no-data-cell"></td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Transactions Table */}
                {selectedReportType === 'transactions' && (
                  <div className="table-container-wrapper">
                    <table className="reports-table">
                      <thead>
                        <tr>
                          <th className="customer-table-header-cell">Transaction ID</th>
                          <th className="customer-table-header-cell">Customer</th>
                          <th className="customer-table-header-cell">Phone</th>
                          <th className="customer-table-header-cell">Amount</th>
                          <th className="customer-table-header-cell">Status</th>
                          <th className="customer-table-header-cell">Date</th>
                          <th className="customer-table-header-cell">Receipt</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactionsReport.data && transactionsReport.data.length > 0 ? (
                          transactionsReport.data.map((transaction) => (
                            <tr key={transaction._id} className="customer-table-row">
                              <td className="customer-table-cell">
                                <div className="transaction-id">{transaction.transactionId}</div>
                              </td>
                              <td className="customer-table-cell">
                                <div className="customer-name-text">{transaction.customerId?.name || transaction.customerName}</div>
                              </td>
                              <td className="customer-table-cell">{transaction.phoneNumber}</td>
                              <td className="customer-table-cell amount-cell">{formatCurrency(transaction.amount)}</td>
                              <td className="customer-table-cell">
                                <span className={`promises-page-status-badge ${getStatusColor(transaction.status)}`}>
                                  {getStatusIcon(transaction.status)}
                                  {transaction.status}
                                </span>
                              </td>
                              <td className="customer-table-cell">
                                <div className="transaction-date">{formatDate(transaction.createdAt)}</div>
                              </td>
                              <td className="customer-table-cell">{transaction.mpesaReceiptNumber || 'N/A'}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="7" className="no-data-cell"></td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Promises Table */}
                {selectedReportType === 'promises' && (
                  <div className="table-container-wrapper">
                    <table className="reports-table">
                      <thead>
                        <tr>
                          <th className="customer-table-header-cell">Customer</th>
                          <th className="customer-table-header-cell">Phone</th>
                          <th className="customer-table-header-cell">Promise Amount</th>
                          <th className="customer-table-header-cell">Promise Date</th>
                          <th className="customer-table-header-cell">Status</th>
                          <th className="customer-table-header-cell">Created By</th>
                          <th className="customer-table-header-cell">Created At</th>
                        </tr>
                      </thead>
                      <tbody>
                        {promisesReport.data && promisesReport.data.length > 0 ? (
                          promisesReport.data.map((promise) => {
                            const { date, time } = formatDateTime(promise.promiseDate);
                            return (
                              <tr key={promise._id} className="customer-table-row">
                                <td className="customer-table-cell">
                                  <div className="customer-name-text">{promise.customerId?.name || promise.customerName}</div>
                                </td>
                                <td className="customer-table-cell">{promise.phoneNumber}</td>
                                <td className="customer-table-cell amount-cell">{formatCurrency(promise.promiseAmount)}</td>
                                <td className="customer-table-cell">
                                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#2c3e50' }}>{date}</div>
                                  <div style={{ fontSize: '0.625rem', color: '#666' }}>{time}</div>
                                </td>
                                <td className="customer-table-cell">
                                  <span className={`promises-page-status-badge ${getStatusColor(promise.status)}`}>
                                    {getStatusIcon(promise.status)}
                                    {promise.status}
                                  </span>
                                </td>
                                <td className="customer-table-cell">{promise.createdByName}</td>
                                <td className="customer-table-cell">{formatDate(promise.createdAt)}</td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan="8" className="no-data-cell"></td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Empty State (fallback) */}
                {!loading && !hasData() && (
                  <div className="table-empty-state">
                    <div className="empty-icon">
                      {getReportTypeIcon(selectedReportType)}
                    </div>
                    <div className={`empty-title ${getRoleTextColor()}`}>
                      No Data Found
                    </div>
                    <div className="empty-subtitle">
                      No records available for the selected time period.
                      {selectedTimeRange === 'custom' && ' Try adjusting your date range.'}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </Box>

        {/* Export Dialog */}
        <Dialog 
          open={showExportDialog} 
          onClose={() => setShowExportDialog(false)} 
          maxWidth="xs" 
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: '0.5rem',
              fontFamily: "'Century Gothic', sans-serif"
            }
          }}
        >
          <DialogTitle sx={{ 
            fontFamily: "'Century Gothic', sans-serif",
            fontSize: '0.875rem',
            fontWeight: 700,
            color: '#2c3e50',
            borderBottom: '1px solid rgba(0,0,0,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            Export Report
            <button
              onClick={() => setShowExportDialog(false)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Close sx={{ fontSize: 18, color: '#666' }} />
            </button>
          </DialogTitle>
          <DialogContent sx={{ pt: 2, pb: 1 }}>
            <div style={{ fontSize: '0.75rem', color: '#666', marginBottom: '1rem', fontFamily: "'Century Gothic', sans-serif" }}>
              Choose export format:
            </div>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mb: 1 }}>
              <button
                className={`export-format-btn ${getRolePrimaryClass()}`}
                onClick={() => exportReport('xlsx')}
                disabled={exportLoading}
              >
                <TableChart sx={{ fontSize: 20 }} />
                Excel (.xlsx)
              </button>
              <button
                className={`export-format-btn ${getRolePrimaryClass()}`}
                onClick={() => exportReport('csv')}
                disabled={exportLoading}
              >
                <TableChart sx={{ fontSize: 20 }} />
                CSV (.csv)
              </button>
            </Box>
            {exportLoading && (
              <Box sx={{ mt: 2 }}>
                <LinearProgress sx={{
                  height: 2,
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: '#5c4730'
                  }
                }} />
                <div style={{ 
                  fontSize: '0.625rem', 
                  color: '#666',
                  textAlign: 'center',
                  marginTop: '0.5rem',
                  fontFamily: "'Century Gothic', sans-serif"
                }}>
                  Generating export...
                </div>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: '1px solid rgba(0,0,0,0.08)' }}>
            <button
              className="customer-secondary-dialog-btn"
              onClick={() => setShowExportDialog(false)}
              disabled={exportLoading}
            >
              Cancel
            </button>
          </DialogActions>
        </Dialog>
      </Box>
    </LayoutWrapper>
  );
};

// Helper functions
const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                return 'Invalid date';
            }
            const localDate = new Date(date.getTime() + (3 * 60 * 60 * 1000));
            return localDate.toLocaleDateString('en-KE', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                timeZone: 'Africa/Nairobi'
            });
        } catch (error) {
            return 'N/A';
        }
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return { date: 'N/A', time: '', full: 'N/A' };
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                return { date: 'Invalid date', time: '', full: 'Invalid date' };
            }

            // Add 3 hours for East African Time (UTC+3)
            const localDate = new Date(date.getTime() + (3 * 60 * 60 * 1000));

            const dateDisplay = localDate.toLocaleDateString('en-KE', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                timeZone: 'Africa/Nairobi'
            });

            const timeDisplay = localDate.toLocaleTimeString('en-KE', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
                timeZone: 'Africa/Nairobi'
            });

            return {
                date: dateDisplay,
                time: timeDisplay,
                full: `${dateDisplay} ${timeDisplay}`
            };
        } catch (error) {
            return { date: 'N/A', time: '', full: 'N/A' };
        }
    };

const getStatusColor = (status) => {
  const statusMap = {
    'SUCCESS': 'success',
    'PENDING': 'warning',
    'FAILED': 'error',
    'CANCELLED': 'default',
    'EXPIRED': 'default',
    'FULFILLED': 'success',
    'BROKEN': 'error',
    'RESCHEDULED': 'info'
  };
  return statusMap[status] || 'default';
};

const getStatusIcon = (status) => {
  switch (status) {
    case 'SUCCESS':
    case 'FULFILLED':
      return <CheckCircle sx={{ fontSize: 12 }} />;
    case 'FAILED':
    case 'BROKEN':
      return <Cancel sx={{ fontSize: 12 }} />;
    case 'PENDING':
      return <AccessTime sx={{ fontSize: 12 }} />;
    case 'RESCHEDULED':
      return <Warning sx={{ fontSize: 12 }} />;
    default:
      return <Warning sx={{ fontSize: 12 }} />;
  }
};

export default ReportsPage;