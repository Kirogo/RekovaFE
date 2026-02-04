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
  Search
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
  const [userRole, setUserRole] = useState(null);

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

  // Get user role from localStorage
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
      const role = getUserRole();
      setUserRole(role);

      let endpoint = '/promises';
      let params = { ...filters };

      // For officers, use the officer-specific endpoint
      if (role === 'officer') {
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
      if (role !== 'officer') {
        queryParams.append('page', filters.page);
        queryParams.append('limit', filters.limit);
      }

      const response = await api.get(`${endpoint}?${queryParams.toString()}`);
      console.log('✅ Promises response:', response.data);

      if (response.data.success) {
        if (role === 'officer') {
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
      const role = getUserRole();

      let exportEndpoint = '/promises/export';

      // For officers, we might need a different export endpoint or handle differently
      if (role === 'officer') {
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
        {/* Header - Updated title based on role */}
        <Box className="promises-page-header">
          <Box className="promises-page-header-content">
            <Box>
              <Typography className="promises-page-subtitle">
                {userRole === 'officer' ? 'My Payment Promises' : 'Track and manage payment promises'}
              </Typography>
            </Box>
            <Box className="promises-page-header-actions">
              <button
                className="promises-page-action-btn"
                onClick={exportPromises}
              >
                <Download sx={{ fontSize: 14 }} />
                Export
              </button>
              <button
                className="promises-page-refresh-btn"
                onClick={fetchPromises}
                disabled={loading}
              >
                <Refresh sx={{ fontSize: 14 }} />
                Refresh
              </button>
            </Box>
          </Box>
        </Box>

        {/* Statistics Cards */}
        {statistics && (
          <div className="promises-page-statistics-grid">
            <div className="promises-page-stat-card">
              <div className="promises-page-stat-header">
                <div className="promises-page-stat-label">
                  {userRole === 'officer' ? 'My Promises' : 'Total Promises'}
                </div>
                <div className="promises-page-stat-icon">
                  <CalendarToday sx={{ fontSize: 16 }} />
                </div>
              </div>
              <div className="promises-page-stat-value">
                {statistics.total || 0}
              </div>
            </div>

            <div className="promises-page-stat-card">
              <div className="promises-page-stat-header">
                <div className="promises-page-stat-label">Fulfilled</div>
                <div className="promises-page-stat-icon success">
                  <TrendingUp sx={{ fontSize: 16 }} />
                </div>
              </div>
              <div className="promises-page-stat-value success">
                {statistics.fulfilled || 0}
                {statistics.fulfillmentRate && (
                  <span className="promises-page-stat-percent">
                    ({typeof statistics.fulfillmentRate === 'number'
                      ? statistics.fulfillmentRate.toFixed(1)
                      : statistics.fulfillmentRate}%)
                  </span>
                )}
              </div>
            </div>

            <div className="promises-page-stat-card">
              <div className="promises-page-stat-header">
                <div className="promises-page-stat-label">Pending</div>
                <div className="promises-page-stat-icon warning">
                  <AccessTime sx={{ fontSize: 16 }} />
                </div>
              </div>
              <div className="promises-page-stat-value warning">
                {statistics.pending || 0}
              </div>
            </div>

            <div className="promises-page-stat-card">
              <div className="promises-page-stat-header">
                <div className="promises-page-stat-label">Broken</div>
                <div className="promises-page-stat-icon error">
                  <TrendingDown sx={{ fontSize: 16 }} />
                </div>
              </div>
              <div className="promises-page-stat-value error">
                {statistics.broken || 0}
              </div>
            </div>
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
                placeholder="Type customer name..."
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
        <div className="promises-page-table-container">
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {loading ? (
            <div className="promises-page-loading">
              <LinearProgress sx={{ width: '100%' }} />
            </div>
          ) : promises.length === 0 ? (
            <div className="promises-page-empty">
              <div className="promises-page-empty-icon">📋</div>
              <Typography className="promises-page-empty-title">
                {userRole === 'officer' ? 'No Promises Yet' : 'No Promises Found'}
              </Typography>
              {filters.customerName && (
                <button
                  className="promises-page-clear-filters-btn"
                  onClick={clearSearch}
                >
                  Clear Search
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="promises-page-table-header">
                <Typography className="promises-page-table-title">
                  {userRole === 'officer' ? 'My Promises' : 'All Promises'} ({promises.length})
                </Typography>
              </div>
              <table className="promises-page-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Phone</th>
                    <th>Amount</th>
                    <th>Due Date</th>
                    <th>Status</th>
                    {userRole !== 'officer' && <th>Created By</th>}
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {promises.map((promise) => {
                    const { date, time } = formatDateTime(promise.promiseDate);
                    const createdDate = formatDateTime(promise.createdAt).date;

                    return (
                      <tr key={promise._id} className="promises-page-table-row">
                        <td
                          className="promises-page-customer-cell"
                          onClick={() => handlePromiseClick(promise)}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="promises-page-customer-name">
                            {promise.customerId?.name || promise.customerName}
                          </div>
                          <div
                            className="promises-page-loan-type"
                          >
                            {promise.customerId?.loanType || 'Standard Loan'}
                          </div>
                        </td>
                        <td className="promises-page-phone-cell">
                          {promise.phoneNumber}
                        </td>
                        <td className="promises-page-amount-cell">
                          <div className="promises-page-amount-value">
                            {formatCurrency(promise.promiseAmount)}
                          </div>
                        </td>
                        <td className="promises-page-date-cell">
                          <div className="promises-page-promise-date">{date}</div>
                          <div className="promises-page-promise-time">{time}</div>
                          {promise.status === 'PENDING' && new Date(promise.promiseDate) < new Date() && (
                            <div className="promises-page-overdue-badge">Overdue</div>
                          )}
                        </td>
                        <td className="promises-page-status-cell">
                          <span className={`promises-page-status-badge ${getStatusColor(promise.status)}`}>
                            {getStatusIcon(promise.status)}
                            {promise.status}
                          </span>
                        </td>
                        {userRole !== 'officer' && (
                          <td className="promises-page-creator-cell">
                            <div className="promises-page-creator-name">{promise.createdByName}</div>
                            <div className="promises-page-creator-date">
                              {createdDate}
                            </div>
                          </td>
                        )}
                        <td className="promises-page-actions-cell">
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
            </>
          )}

          {/* Pagination - Only show for non-officer roles since officer endpoint doesn't support pagination */}
          {userRole !== 'officer' && statistics?.pagination && statistics.pagination.pages > 1 && (
            <div className="promises-page-pagination">
              <button
                className="promises-page-pagination-btn"
                disabled={filters.page <= 1}
                onClick={() => handleFilterChange('page', filters.page - 1)}
              >
                Previous
              </button>

              <div className="promises-page-pagination-info">
                Page {filters.page} of {statistics.pagination.pages}
                {filters.customerName && (
                  <span className="promises-page-pagination-search-info">
                    • Searching: "{filters.customerName}"
                  </span>
                )}
              </div>

              <button
                className="promises-page-pagination-btn"
                disabled={filters.page >= statistics.pagination.pages}
                onClick={() => handleFilterChange('page', filters.page + 1)}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </Box>
    </LayoutWrapper>
  );
};

export default Promises;