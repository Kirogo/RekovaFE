import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  LinearProgress,
  Alert
} from '@mui/material';
import {
  Refresh,
  CalendarToday,
  CheckCircle,
  Cancel,
  AccessTime,
  Warning,
  TrendingUp,
  TrendingDown,
  Download,
  Done,
  Close,
  Search,
  AssignmentInd,
  SupervisorAccount,
  Groups
} from '@mui/icons-material';
import axios from 'axios';
import authService from '../services/auth.service';
import LayoutWrapper from "../LayoutWrapper";
import '../styles/Promises.css';

const Promises = () => {
  const navigate = useNavigate();
  const [promises, setPromises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [searchTimeout, setSearchTimeout] = useState(null);
  
  // User role state
  const [userRole, setUserRole] = useState('officer');
  const [isSupervisor, setIsSupervisor] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const [filters, setFilters] = useState({
    status: '',
    promiseType: '',
    startDate: '',
    endDate: '',
    customerName: '',
    page: 1,
    limit: 20,
    sortBy: 'promiseDate',
    sortOrder: 'asc'
  });

  // Get user info from auth service
  const getUserInfo = () => {
    const user = authService.getCurrentUser();
    if (!user) return { role: 'officer', isSupervisor: false, isAdmin: false };
    
    const role = user.role?.toLowerCase() || 'officer';
    const isSupervisorUser = role === 'supervisor';
    const isAdminUser = role === 'admin';
    
    console.log('👤 Promises Page - User Info:', { 
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

  const fetchPromises = async () => {
    try {
      setLoading(true);
      setError(null);

      const api = getApi();
      const userInfo = getUserInfo();
      
      // Update local state
      setUserRole(userInfo.role);
      setIsSupervisor(userInfo.isSupervisor);
      setIsAdmin(userInfo.isAdmin);

      let endpoint = '/promises';
      let params = { ...filters };

      // For officers, use the officer-specific endpoint
      if (userInfo.role === 'officer') {
        console.log('👤 Fetching officer promises from /promises/my-promises...');
        endpoint = '/promises/my-promises';
        // Remove pagination params if they cause issues with officer endpoint
        const { page, limit, sortBy, sortOrder, ...officerFilters } = filters;
        params = officerFilters;
      }

      const queryParams = new URLSearchParams();

      Object.entries(params).forEach(([key, value]) => {
        if (value && value !== '') {
          queryParams.append(key, value);
        }
      });

      // Remove page and limit for officer endpoint if not needed
      if (userInfo.role !== 'officer') {
        queryParams.append('page', filters.page);
        queryParams.append('limit', filters.limit);
      }

      const response = await api.get(`${endpoint}?${queryParams.toString()}`);
      console.log('✅ Promises response:', response.data);

      if (response.data.success) {
        if (userInfo.role === 'officer') {
          // Handle officer-specific response structure
          const promisesData = response.data.data?.promises || [];
          const summary = response.data.data?.summary || {};

          setPromises(promisesData);
          setStatistics({
            total: summary.total || 0,
            pending: summary.pending || 0,
            fulfilled: summary.fulfilled || 0,
            broken: summary.broken || 0,
            fulfillmentRate: summary.fulfillmentRate || 0
          });
        } else {
          // Handle admin/supervisor response structure
          setPromises(response.data.data?.promises || []);
          setStatistics(response.data.data?.statistics || {});
        }
      } else {
        setError(response.data.message || 'Failed to load promises');
      }
    } catch (err) {
      console.error("Promises error:", err.response?.data || err.message);
      setError(err.response?.data?.message || "Failed to load promises data");

      if (err.response?.status === 401) {
        authService.logout();
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Add auth debugging
    console.log('🔐 Promises Page mounted - Auth status:', {
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
    
    fetchPromises();
  }, [filters.page, filters.status, filters.promiseType, filters.startDate, filters.endDate]);

  // New useEffect for customerName search with debouncing
  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeout = setTimeout(() => {
      if (filters.customerName !== undefined) {
        fetchPromises();
      }
    }, 500);

    setSearchTimeout(timeout);

    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [filters.customerName]);

  // Add a separate handler for search that resets to page 1
  const handleSearchChange = (value) => {
    setFilters(prev => ({
      ...prev,
      customerName: value,
      page: 1
    }));
  };

  // Add clear search function
  const clearSearch = () => {
    setFilters(prev => ({
      ...prev,
      customerName: '',
      page: 1
    }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-KE', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return { date: 'N/A', time: '' };
    try {
      const date = new Date(dateString);
      return {
        date: date.toLocaleDateString('en-KE', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        }),
        time: date.toLocaleTimeString('en-KE', {
          hour: '2-digit',
          minute: '2-digit'
        })
      };
    } catch {
      return { date: 'N/A', time: '' };
    }
  };

  const formatCurrency = (amount) => {
    const numAmount = parseFloat(amount || 0);
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numAmount);
  };

  const getStatusColor = (status) => {
    const statusMap = {
      'PENDING': 'warning',
      'FULFILLED': 'success',
      'BROKEN': 'error',
      'RESCHEDULED': 'info',
      'CANCELLED': 'default'
    };
    return statusMap[status] || 'default';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'FULFILLED':
        return <CheckCircle sx={{ fontSize: 12 }} />;
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

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePromiseClick = (promise) => {
    navigate(`/customers/${promise.customerId._id || promise.customerId}`);
  };

  const updatePromiseStatus = async (promiseId, status) => {
    try {
      const api = getApi();
      const response = await api.patch(`/promises/${promiseId}/status`, { status });

      if (response.data.success) {
        fetchPromises();
        alert(`Promise marked as ${status.toLowerCase()}`);
      }
    } catch (error) {
      console.error('Error updating promise:', error);
      setError(error.response?.data?.message || 'Failed to update promise');
    }
  };

  const exportPromises = async () => {
    try {
      const api = getApi();
      const userInfo = getUserInfo();

      let exportEndpoint = '/promises/export';

      // For officers, we might need a different export endpoint or handle differently
      if (userInfo.role === 'officer') {
        console.warn('⚠️ Officer-specific export might need special handling');
      }

      const response = await api.get(exportEndpoint, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `promises_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting promises:', error);
      setError('Failed to export promises');
    }
  };

  // Get role-based icon
  const getRoleIcon = () => {
    if (isSupervisor) return <SupervisorAccount sx={{ fontSize: 16 }} />;
    if (isAdmin) return <Groups sx={{ fontSize: 16 }} />;
    return <AssignmentInd sx={{ fontSize: 16 }} />;
  };

  // Get role-based subtitle
  const getRoleSubtitle = () => {
    if (isSupervisor) return 'Supervisor - Monitor All Payment Promises';
    if (isAdmin) return 'Administrator - Full Promise Tracking';
    return 'Track My Payment Promises';
  };

  // Get role-based color classes - SUBTLE TEXT COLORS ONLY
  const getRoleTextColor = () => {
    if (isSupervisor) return 'supervisor-text';
    if (isAdmin) return 'admin-text';
    return 'officer-text';
  };

  // Get role-based accent color for borders/underlines
  const getRoleAccentClass = () => {
    if (isSupervisor) return 'supervisor-accent';
    if (isAdmin) return 'admin-accent';
    return 'officer-accent';
  };

  // Get role-based primary color for buttons
  const getRolePrimaryClass = () => {
    if (isSupervisor) return 'supervisor-primary';
    if (isAdmin) return 'admin-primary';
    return 'officer-primary';
  };

  // Handle refresh
  const handleRefresh = () => {
    console.log('🔄 Refreshing promises data...');
    fetchPromises();
    setFilters(prev => ({
      ...prev,
      customerName: '',
      status: '',
      promiseType: '',
      startDate: '',
      endDate: '',
      page: 1
    }));
  };

  if (loading && !promises.length) {
    return (
      <LayoutWrapper>
        <Box className="promises-page-wrapper">
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
            Loading promises...
          </Typography>
        </Box>
      </LayoutWrapper>
    );
  }

  return (
    <LayoutWrapper>
      <Box className="promises-page-wrapper">
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
        
        {/* Header - Updated with role-based styling */}
        <Box className="promises-page-header">
          <Box className="promises-page-header-content">
            <Box>
              <Typography className={`page-subtitle ${getRoleTextColor()}`}>
                {getRoleSubtitle()}
              </Typography>
            </Box>
            <Box className="promises-page-header-actions">
              <button
                className="customer-action-btn"
                onClick={handleRefresh}
                disabled={loading}
              >
                <Refresh sx={{ fontSize: 14 }} />
                Refresh
              </button>
            </Box>
          </Box>
        </Box>

        {/* Statistics Cards - Updated with role-based styling */}
        {statistics && (
          <div className="customer-stats-grid">
            {[
              {
                title: isSupervisor || isAdmin ? 'Total Promises' : 'My Promises',
                value: statistics.total || 0,
                icon: <CalendarToday sx={{ fontSize: 16 }} />,
                meta: isSupervisor || isAdmin ? 'All payment promises' : 'Your assigned promises'
              },
              {
                title: 'Fulfilled',
                value: statistics.fulfilled || 0,
                icon: <TrendingUp sx={{ fontSize: 16 }} />,
                meta: statistics.fulfillmentRate ? 
                  `${typeof statistics.fulfillmentRate === 'number' 
                    ? statistics.fulfillmentRate.toFixed(1) 
                    : statistics.fulfillmentRate}% fulfillment rate` : 
                  'Successfully completed'
              },
              {
                title: 'Pending',
                value: statistics.pending || 0,
                icon: <AccessTime sx={{ fontSize: 16 }} />,
                meta: 'Awaiting payment'
              },
              ...(isSupervisor || isAdmin ? [
                {
                  title: 'System Role',
                  value: isSupervisor ? 'Supervisor' : isAdmin ? 'Admin' : 'Officer',
                  icon: getRoleIcon(),
                  meta: 'Current user role'
                }
              ] : [])
            ].map((stat, index) => (
              <div key={index} className="customer-stat-card">
                <div className={`stat-top-border ${getRoleAccentClass()}`}></div>
                <div className="customer-stat-header">
                  <div className={`customer-stat-label ${getRoleTextColor()}`}>
                    {stat.title}
                  </div>
                  <div className={`customer-stat-icon-wrapper ${getRoleAccentClass()}`}>
                    {stat.icon}
                  </div>
                </div>
                <div>
                  <div className={`customer-stat-value ${getRoleTextColor()}`}>
                    {stat.value}
                  </div>
                  <div className="customer-stat-meta">
                    {stat.meta}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="promises-page-filters">
          <div className="promises-page-filter-group">
            <label className="promises-page-filter-label">Status</label>
            <select
              className="promises-page-filter-select"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="FULFILLED">Fulfilled</option>
              <option value="BROKEN">Broken</option>
              <option value="RESCHEDULED">Rescheduled</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <div className="promises-page-filter-group">
            <label className="promises-page-filter-label">Promise Type</label>
            <select
              className="promises-page-filter-select"
              value={filters.promiseType}
              onChange={(e) => handleFilterChange('promiseType', e.target.value)}
            >
              <option value="">All Types</option>
              <option value="FULL_PAYMENT">Full Payment</option>
              <option value="PARTIAL_PAYMENT">Partial Payment</option>
              <option value="SETTLEMENT">Settlement</option>
              <option value="PAYMENT_PLAN">Payment Plan</option>
            </select>
          </div>

          <div className="promises-page-filter-group">
            <label className="promises-page-filter-label">From Date</label>
            <input
              type="date"
              className="promises-page-filter-input"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
            />
          </div>

          <div className="promises-page-filter-group">
            <label className="promises-page-filter-label">To Date</label>
            <input
              type="date"
              className="promises-page-filter-input"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
            />
          </div>

          {/* Enhanced Search Field */}
          <div className="promises-page-filter-group promises-page-search-group">
            <label className="promises-page-filter-label">Search Customer</label>
            <div className="promises-page-search-input-wrapper">
              <Search sx={{ fontSize: 16, color: '#666' }} />
              <input
                type="text"
                className="promises-page-filter-input promises-page-search-input"
                placeholder={isSupervisor || isAdmin 
                  ? "Search all customers..." 
                  : "Search your customers..."}
                value={filters.customerName || ''}
                onChange={(e) => handleSearchChange(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    fetchPromises();
                  }
                }}
              />
              {filters.customerName && (
                <button
                  className="promises-page-clear-search-btn"
                  onClick={clearSearch}
                  title="Clear search"
                >
                  <Close sx={{ fontSize: 14 }} />
                </button>
              )}
            </div>
            <div className="promises-page-search-hint">
              {filters.customerName && promises.length > 0 && (
                <span>Found {promises.length} result{promises.length !== 1 ? 's' : ''}</span>
              )}
            </div>
          </div>
        </div>

        {/* Promises Table */}
        <Box className="customer-main-content">
          <div className="customer-content-card">
            <div className="customer-section-header">
              <Box>
                <Typography className={`customer-section-title ${getRoleTextColor()}`}>
                  {isSupervisor || isAdmin 
                    ? `ALL PAYMENT PROMISES (${promises.length})` 
                    : `MY PAYMENT PROMISES (${promises.length})`}
                  <div className={`section-title-underline ${getRoleAccentClass()}`}></div>
                </Typography>
              </Box>
            </div>

            {error && (
              <Alert severity="error" className="customer-alert" sx={{ mx: 1, mt: 1 }}>
                {error}
              </Alert>
            )}

            {loading ? (
              <Box className="customer-loading">
                <LinearProgress className={`loading-bar ${getRoleAccentClass()}`} />
                <Typography className="customer-loading-text">
                  {isSupervisor || isAdmin 
                    ? 'Loading all promises...' 
                    : 'Loading your promises...'}
                </Typography>
              </Box>
            ) : promises.length === 0 ? (
              <div className="table-empty-state">
                <div className="empty-icon">
                  📋
                </div>
                <Typography className={`empty-title ${getRoleTextColor()}`}>
                  {isSupervisor || isAdmin 
                    ? 'No Payment Promises Found' 
                    : 'No Payment Promises Found'}
                </Typography>
                <Typography className="empty-subtitle">
                  {isSupervisor || isAdmin 
                    ? (filters.customerName || filters.status || filters.promiseType 
                      ? 'Try adjusting your search or filter criteria.'
                      : 'No payment promises have been recorded yet.')
                    : 'No payment promises have been assigned to you yet.'}
                </Typography>
                {(filters.customerName || filters.status || filters.promiseType) && (
                  <button
                    className={`customer-primary-btn ${getRolePrimaryClass()}`}
                    onClick={() => {
                      setFilters({
                        ...filters,
                        status: '',
                        promiseType: '',
                        startDate: '',
                        endDate: '',
                        customerName: '',
                        page: 1
                      });
                    }}
                    style={{ marginTop: '1rem' }}
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="table-container-wrapper">
                  <table className="promises-page-table">
                    <thead>
                      <tr>
                        <th className="customer-table-header-cell">Customer</th>
                        <th className="customer-table-header-cell">Phone</th>
                        <th className="customer-table-header-cell">Amount</th>
                        <th className="customer-table-header-cell">Due Date</th>
                        <th className="customer-table-header-cell">Status</th>
                        {isSupervisor || isAdmin ? <th className="customer-table-header-cell">Created By</th> : null}
                        <th className="customer-table-header-cell">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {promises.map((promise) => {
                        const { date, time } = formatDateTime(promise.promiseDate);
                        const createdDate = formatDateTime(promise.createdAt).date;

                        return (
                          <tr 
                            key={promise._id} 
                            className="customer-table-row"
                            onClick={() => handlePromiseClick(promise)}
                            style={{ cursor: 'pointer' }}
                          >
                            <td className="customer-table-cell">
                              <div className="customer-name-container">
                                <div className="customer-name-text">
                                  {promise.customerId?.name || promise.customerName}
                                </div>
                                <div className="customer-account-text">
                                  {promise.customerId?.loanType || 'Standard Loan'}
                                </div>
                              </div>
                            </td>
                            <td className="customer-table-cell">
                              <div className="customer-contact-container">
                                <div className="customer-phone-text">
                                  {promise.phoneNumber}
                                </div>
                              </div>
                            </td>
                            <td className="customer-table-cell">
                              <span className="amount-cell">
                                {formatCurrency(promise.promiseAmount)}
                              </span>
                            </td>
                            <td className="customer-table-cell">
                              <div>
                                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#2c3e50' }}>
                                  {date}
                                </div>
                                <div style={{ fontSize: '0.625rem', color: '#666' }}>
                                  {time}
                                </div>
                                {promise.status === 'PENDING' && new Date(promise.promiseDate) < new Date() && (
                                  <div className="promises-page-overdue-badge">Overdue</div>
                                )}
                              </div>
                            </td>
                            <td className="customer-table-cell">
                              <span className={`promises-page-status-badge ${getStatusColor(promise.status)}`}>
                                {getStatusIcon(promise.status)}
                                {promise.status}
                              </span>
                            </td>
                            {isSupervisor || isAdmin ? (
                              <td className="customer-table-cell">
                                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#2c3e50' }}>
                                  {promise.createdByName}
                                </div>
                                <div style={{ fontSize: '0.625rem', color: '#666' }}>
                                  {createdDate}
                                </div>
                              </td>
                            ) : null}
                            <td className="customer-table-cell">
                              {promise.status === 'PENDING' && (
                                <div className="promises-page-promise-actions">
                                  <button
                                    className="promises-page-promise-action-btn fulfilled-btn"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      updatePromiseStatus(promise.promiseId, 'FULFILLED');
                                    }}
                                    title="Mark as Fulfilled"
                                  >
                                    <Done sx={{ fontSize: 10, marginRight: '0.125rem' }} />
                                    Fulfilled
                                  </button>
                                  <button
                                    className="promises-page-promise-action-btn broken-btn"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      updatePromiseStatus(promise.promiseId, 'BROKEN');
                                    }}
                                    title="Mark as Broken"
                                  >
                                    <Close sx={{ fontSize: 10, marginRight: '0.125rem' }} />
                                    Broken
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination - Only show for non-officer roles since officer endpoint doesn't support pagination */}
                {!isSupervisor && !isAdmin && statistics?.pagination && statistics.pagination.pages > 1 && (
                  <div className="customer-pagination">
                    <div className="pagination-info">
                      Showing {((filters.page - 1) * filters.limit) + 1} to {Math.min(filters.page * filters.limit, statistics.pagination.total)} of {statistics.pagination.total} promises
                    </div>
                    
                    <div className="pagination-controls">
                      <button
                        className="pagination-btn first-page"
                        onClick={() => handleFilterChange('page', 1)}
                        disabled={filters.page <= 1}
                        title="First Page"
                      >
                        &laquo;
                      </button>
                      
                      <button
                        className="pagination-btn prev-page"
                        onClick={() => handleFilterChange('page', filters.page - 1)}
                        disabled={filters.page <= 1}
                        title="Previous Page"
                      >
                        &lsaquo;
                      </button>
                      
                      <div className="page-indicator">
                        Page {filters.page} of {statistics.pagination.pages}
                      </div>
                      
                      <button
                        className="pagination-btn next-page"
                        onClick={() => handleFilterChange('page', filters.page + 1)}
                        disabled={filters.page >= statistics.pagination.pages}
                        title="Next Page"
                      >
                        &rsaquo;
                      </button>
                      
                      <button
                        className="pagination-btn last-page"
                        onClick={() => handleFilterChange('page', statistics.pagination.pages)}
                        disabled={filters.page >= statistics.pagination.pages}
                        title="Last Page"
                      >
                        &raquo;
                      </button>
                    </div>
                    
                    <div className="rows-per-page">
                      <select
                        value={filters.limit}
                        onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
                        className="rows-select"
                      >
                        <option value="10">10 per page</option>
                        <option value="20">20 per page</option>
                        <option value="50">50 per page</option>
                        <option value="100">100 per page</option>
                      </select>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </Box>
      </Box>
    </LayoutWrapper>
  );
};

export default Promises;