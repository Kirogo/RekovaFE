import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  LinearProgress,
  Alert,
  Badge
} from '@mui/material';
import {
  FilterList,
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
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== '') {
          queryParams.append(key, value);
        }
      });

      const response = await api.get(`/promises?${queryParams.toString()}`);
      
      if (response.data.success) {
        setPromises(response.data.data.promises || []);
        setStatistics(response.data.data.statistics || {});
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
      if (filters.customerName !== undefined) { // Check if it's defined
        fetchPromises();
      }
    }, 500); // 500ms debounce delay

    setSearchTimeout(timeout);

    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [filters.customerName]); // Only trigger when customerName changes

  // Add a separate handler for search that resets to page 1
  const handleSearchChange = (value) => {
    setFilters(prev => ({ 
      ...prev, 
      customerName: value,
      page: 1 // Reset to first page on new search
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
      const response = await api.get('/promises/export', {
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
      <Box className="promises-wrapper" sx={{ textAlign: "center", mt: 6, color: '#705333ff'}}>
        <LinearProgress sx={{ mb: 2, maxWidth: 300, margin: '0 auto', color: '#705333ff' }} />
        <Typography sx={{ fontSize: '16px', fontWeight: 600, color: '#705333ff' }}>
          Loading promises...
        </Typography>
      </Box>
    );
  }

  return (
    <LayoutWrapper>
    <Box className="promises-wrapper">
      {/* Header */}
      <Box className="promises-header">
        <Box className="promises-header-content">
          <Box>
            <Typography className="promises-subtitle">
              Track and manage payment promises
            </Typography>
          </Box>
          <Box className="promises-header-actions">
            <button 
              className="promises-action-btn"
              onClick={exportPromises}
            >
              <Download sx={{ fontSize: 14 }} />
              Export
            </button>
            <button 
              className="promises-refresh-btn" 
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
        <div className="promises-statistics-grid">
          <div className="promises-stat-card">
            <div className="promises-stat-header">
              <div className="promises-stat-label">Total Promises</div>
              <div className="promises-stat-icon">
                <CalendarToday sx={{ fontSize: 16 }} />
              </div>
            </div>
            <div className="promises-stat-value">
              {statistics.total || 0}
            </div>
          </div>

          <div className="promises-stat-card">
            <div className="promises-stat-header">
              <div className="promises-stat-label">Fulfilled</div>
              <div className="promises-stat-icon success">
                <TrendingUp sx={{ fontSize: 16 }} />
              </div>
            </div>
            <div className="promises-stat-value success">
              {statistics.fulfilled || 0}
              <span className="promises-stat-percent">
                ({statistics.fulfillmentRate || 0}%)
              </span>
            </div>
          </div>

          <div className="promises-stat-card">
            <div className="promises-stat-header">
              <div className="promises-stat-label">Pending</div>
              <div className="promises-stat-icon warning">
                <AccessTime sx={{ fontSize: 16 }} />
              </div>
            </div>
            <div className="promises-stat-value warning">
              {statistics.pending || 0}
            </div>
          </div>

          <div className="promises-stat-card">
            <div className="promises-stat-header">
              <div className="promises-stat-label">Broken</div>
              <div className="promises-stat-icon error">
                <TrendingDown sx={{ fontSize: 16 }} />
              </div>
            </div>
            <div className="promises-stat-value error">
              {statistics.broken || 0}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="promises-filters">
        <div className="filter-group">
          <label className="filter-label">Status</label>
          <select 
            className="filter-select"
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

        <div className="filter-group">
          <label className="filter-label">Promise Type</label>
          <select 
            className="filter-select"
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

        <div className="filter-group">
          <label className="filter-label">From Date</label>
          <input
            type="date"
            className="filter-input"
            value={filters.startDate}
            onChange={(e) => handleFilterChange('startDate', e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label className="filter-label">To Date</label>
          <input
            type="date"
            className="filter-input"
            value={filters.endDate}
            onChange={(e) => handleFilterChange('endDate', e.target.value)}
          />
        </div>

        {/* Enhanced Search Field */}
        <div className="filter-group search-group">
          <label className="filter-label">Search Customer</label>
          <div className="search-input-wrapper">
            <Search sx={{ fontSize: 16, color: '#666' }} />
            <input
              type="text"
              className="filter-input search-input"
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
                className="clear-search-btn"
                onClick={clearSearch}
                title="Clear search"
              >
                <Close sx={{ fontSize: 14 }} />
              </button>
            )}
          </div>
          <div className="search-hint">
            {filters.customerName && promises.length > 0 && (
              <span>Found {promises.length} result{promises.length !== 1 ? 's' : ''}</span>
            )}
          </div>
        </div>
      </div>

      {/* Promises Table */}
      <div className="promises-table-container">
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <div className="promises-loading">
            <LinearProgress sx={{ width: '100%' }} />
          </div>
        ) : promises.length === 0 ? (
          <div className="promises-empty">
            <div className="promises-empty-icon">📋</div>
            <Typography className="promises-empty-title">
              {filters.customerName ? 'No Results Found' : 'No Promises Found'}
            </Typography>
            <Typography className="promises-empty-subtitle">
              {filters.customerName 
                ? `No promises found for "${filters.customerName}". Try a different search term.`
                : 'Create your first promise from a customer page'}
            </Typography>
            {filters.customerName && (
              <button 
                className="promises-clear-filters-btn"
                onClick={clearSearch}
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <table className="promises-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Phone</th>
                <th>Amount</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Created By</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {promises.map((promise) => {
                const { date, time } = formatDateTime(promise.promiseDate);
                const createdDate = formatDateTime(promise.createdAt).date;
                
                return (
                  <tr key={promise._id} className="promises-table-row">
                    <td 
                      className="customer-cell"
                      onClick={() => handlePromiseClick(promise)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="customer-name">
                        {promise.customerId?.name || promise.customerName}
                      </div>
                      <div className="customer-id">
                        ID: {promise.customerId?.customerId || 'N/A'}
                      </div>
                    </td>
                    <td className="phone-cell">
                      {promise.phoneNumber}
                    </td>
                    <td className="amount-cell">
                      {formatCurrency(promise.promiseAmount)}
                    </td>
                    <td className="date-cell">
                      <div className="promise-date">{date}</div>
                      <div className="promise-time">{time}</div>
                      {promise.status === 'PENDING' && new Date(promise.promiseDate) < new Date() && (
                        <div className="overdue-badge">Overdue</div>
                      )}
                    </td>
                    <td className="status-cell">
                      <span className={`status-badge ${getStatusColor(promise.status)}`}>
                        {getStatusIcon(promise.status)}
                        {promise.status}
                      </span>
                    </td>
                    <td className="creator-cell">
                      <div className="creator-name">{promise.createdByName}</div>
                      <div className="creator-date">
                        {createdDate}
                      </div>
                    </td>
                    <td className="actions-cell">
                      {promise.status === 'PENDING' && (
                        <div className="promise-actions">
                          <button
                            className="promise-action-btn fulfilled-btn"
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
                            className="promise-action-btn broken-btn"
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
        )}

        {/* Pagination */}
        {statistics?.pagination && statistics.pagination.pages > 1 && (
          <div className="promises-pagination">
            <button
              className="pagination-btn"
              disabled={filters.page <= 1}
              onClick={() => handleFilterChange('page', filters.page - 1)}
            >
              Previous
            </button>
            
            <div className="pagination-info">
              Page {filters.page} of {statistics.pagination.pages}
              {filters.customerName && (
                <span className="pagination-search-info">
                  • Searching: "{filters.customerName}"
                </span>
              )}
            </div>
            
            <button
              className="pagination-btn"
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