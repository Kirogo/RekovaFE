// src/pages/Promises.jsx - NCBA Styled Version
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  RefreshCw, 
  Download, 
  Search, 
  X, 
  CheckCircle, 
  XCircle, 
  Clock,
  Calendar,
  TrendingUp,
  Users,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
  Eye
} from 'lucide-react';
import authService from '../services/auth.service';
import { authAxios } from '../services/api';
import LayoutWrapper from "../LayoutWrapper";

const Promises = () => {
  const navigate = useNavigate();
  const [promises, setPromises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  
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
    
    return { 
      role, 
      isSupervisor: isSupervisorUser, 
      isAdmin: isAdminUser,
      userId: user.id || user._id,
      username: user.username 
    };
  };

  const fetchPromises = async () => {
    try {
      setLoading(true);
      setError(null);

      const userInfo = getUserInfo();
      
      setUserRole(userInfo.role);
      setIsSupervisor(userInfo.isSupervisor);
      setIsAdmin(userInfo.isAdmin);

      let endpoint = '/promises';
      let params = { ...filters };

      if (userInfo.role === 'officer') {
        endpoint = '/promises/my-promises';
        const { page, limit, sortBy, sortOrder, ...officerFilters } = filters;
        params = officerFilters;
      }

      const queryParams = new URLSearchParams();

      Object.entries(params).forEach(([key, value]) => {
        if (value && value !== '') {
          queryParams.append(key, value);
        }
      });

      if (userInfo.role !== 'officer') {
        queryParams.append('page', filters.page);
        queryParams.append('limit', filters.limit);
      }

      const response = await authAxios.get(`${endpoint}?${queryParams.toString()}`);

      if (response.data.success) {
        if (userInfo.role === 'officer') {
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
    if (!authService.isAuthenticated()) {
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

  const handleSearchChange = (value) => {
    setFilters(prev => ({
      ...prev,
      customerName: value,
      page: 1
    }));
  };

  const clearSearch = () => {
    setFilters(prev => ({
      ...prev,
      customerName: '',
      page: 1
    }));
  };

  const formatDateOnly = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
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

  const formatCurrency = (amount) => {
    const numAmount = parseFloat(amount || 0);
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numAmount);
  };

  const getStatusConfig = (status) => {
    const statusMap = {
      'PENDING': { label: 'Pending', icon: Clock, color: 'text-ncb-warning', bg: 'bg-ncb-warning/10' },
      'FULFILLED': { label: 'Fulfilled', icon: CheckCircle, color: 'text-ncb-success', bg: 'bg-ncb-success/10' },
      'BROKEN': { label: 'Broken', icon: XCircle, color: 'text-ncb-error', bg: 'bg-ncb-error/10' },
    };
    return statusMap[status] || statusMap['PENDING'];
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePromiseClick = (promise) => {
    const customerId = promise.customerId?._id || promise.customerId;
    navigate(`/customers/${customerId}?activeTab=promises`);
  };

  const updatePromiseStatus = async (promiseId, status) => {
    try {
      const response = await authAxios.patch(`/promises/${promiseId}/status`, { status });

      if (response.data.success) {
        fetchPromises();
      }
    } catch (error) {
      console.error('Error updating promise:', error);
      setError(error.response?.data?.message || 'Failed to update promise');
    }
  };

  const exportPromises = async () => {
    try {
      const response = await authAxios.get('/promises/export', {
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

  const clearAllFilters = () => {
    setFilters({
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
  };

  const hasActiveFilters = filters.status || filters.promiseType || filters.startDate || filters.endDate || filters.customerName;

  const handleRefresh = () => {
    fetchPromises();
    clearAllFilters();
  };

  // Statistics Cards Data
  const statCards = [
    {
      title: isSupervisor || isAdmin ? 'Total Promises' : 'My Promises',
      value: statistics?.total || 0,
      icon: Calendar,
      color: 'ncb.blue',
      bg: 'bg-ncb-blue/10',
      trend: null
    },
    {
      title: 'Fulfilled',
      value: statistics?.fulfilled || 0,
      icon: CheckCircle,
      color: 'ncb.success',
      bg: 'bg-ncb-success/10',
      trend: statistics?.fulfillmentRate ? `${statistics.fulfillmentRate.toFixed(1)}%` : null
    },
    {
      title: 'Pending',
      value: statistics?.pending || 0,
      icon: Clock,
      color: 'ncb.warning',
      bg: 'bg-ncb-warning/10',
      trend: null
    },
    {
      title: 'Broken',
      value: statistics?.broken || 0,
      icon: XCircle,
      color: 'ncb.error',
      bg: 'bg-ncb-error/10',
      trend: null
    },
  ];

  if (loading && !promises.length) {
    return (
      <LayoutWrapper>
        <div className="min-h-screen bg-ncb-lightbg">
          <div className="flex items-center justify-center h-screen">
            <div className="animate-pulse text-center">
              <div className="w-12 h-12 border-4 border-ncb-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-ncb-text text-sm">Loading promises...</p>
            </div>
          </div>
        </div>
      </LayoutWrapper>
    );
  }

  return (
    <LayoutWrapper>
      <div className="min-h-screen bg-ncb-lightbg">
        {/* Header */}
        <div className="bg-ncb-white border-b border-ncb-divider sticky top-0 z-10">
          <div className="px-4 sm:px-6 lg:px-8 py-4 lg:py-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h1 className="text-xl lg:text-2xl font-bold text-ncb-heading tracking-tight">
                  Payment Promises
                </h1>
                <p className="text-xs text-ncb-text mt-1">
                  {isSupervisor || isAdmin 
                    ? 'Monitor and manage all payment commitments across your portfolio'
                    : 'Track and manage your assigned payment commitments'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRefresh}
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium text-ncb-text bg-ncb-white border border-ncb-divider rounded-lg hover:bg-ncb-lightbg hover:text-ncb-heading transition-all duration-200 disabled:opacity-50"
                >
                  <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                  Refresh
                </button>
                <button
                  onClick={exportPromises}
                  className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium text-white bg-ncb-blue rounded-lg hover:opacity-90 transition-all duration-200"
                >
                  <Download size={14} />
                  Export
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          {/* Stats Cards Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6 lg:mb-8">
            {statCards.map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <div 
                  key={idx} 
                  className="bg-ncb-white rounded-lg border border-ncb-divider p-4 hover:shadow-sm transition-shadow duration-200"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xxs lg:text-xs text-ncb-text uppercase tracking-wider mb-1">
                        {stat.title}
                      </p>
                      <p className="text-xl lg:text-2xl font-bold text-ncb-heading">
                        {stat.value}
                      </p>
                      {stat.trend && (
                        <p className="text-xxs text-ncb-success mt-1 flex items-center gap-1">
                          <TrendingUp size={10} />
                          {stat.trend} fulfillment
                        </p>
                      )}
                    </div>
                    <div className={`p-2 rounded-lg ${stat.bg}`}>
                      <Icon size={18} className={`text-${stat.color}`} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - 2/3 width on desktop */}
            <div className="lg:col-span-2 space-y-4">
              {/* Filters Toggle Button (Mobile) */}
              <div className="lg:hidden">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-ncb-white border border-ncb-divider rounded-lg text-sm font-medium text-ncb-heading"
                >
                  <span className="flex items-center gap-2">
                    <Filter size={14} />
                    Filters
                  </span>
                  {hasActiveFilters && (
                    <span className="px-2 py-0.5 bg-ncb-blue/10 text-ncb-blue text-xxs rounded-full">
                      Active
                    </span>
                  )}
                </button>
              </div>

              {/* Filters Panel */}
              <div className={`bg-ncb-white rounded-lg border border-ncb-divider overflow-hidden transition-all duration-200 ${showFilters ? 'block' : 'hidden lg:block'}`}>
                <div className="px-4 lg:px-6 py-3 border-b border-ncb-divider bg-ncb-lightbg">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-ncb-heading">Filters</h2>
                    {hasActiveFilters && (
                      <button
                        onClick={clearAllFilters}
                        className="text-xxs text-ncb-blue hover:underline"
                      >
                        Clear all
                      </button>
                    )}
                  </div>
                </div>
                <div className="p-4 lg:p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
                    {/* Status Filter */}
                    <div>
                      <label className="block text-xxs font-semibold text-ncb-text uppercase tracking-wider mb-2">
                        Status
                      </label>
                      <select
                        value={filters.status}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                        className="w-full px-3 py-2 text-sm border-b-2 border-ncb-divider focus:border-ncb-blue focus:outline-none bg-transparent text-ncb-heading transition-colors"
                      >
                        <option value="">All Status</option>
                        <option value="PENDING">Pending</option>
                        <option value="FULFILLED">Fulfilled</option>
                        <option value="BROKEN">Broken</option>
                      </select>
                    </div>

                    {/* Promise Type Filter */}
                    <div>
                      <label className="block text-xxs font-semibold text-ncb-text uppercase tracking-wider mb-2">
                        Type
                      </label>
                      <select
                        value={filters.promiseType}
                        onChange={(e) => handleFilterChange('promiseType', e.target.value)}
                        className="w-full px-3 py-2 text-sm border-b-2 border-ncb-divider focus:border-ncb-blue focus:outline-none bg-transparent text-ncb-heading transition-colors"
                      >
                        <option value="">All Types</option>
                        <option value="FULL_PAYMENT">Full Payment</option>
                        <option value="PARTIAL_PAYMENT">Partial Payment</option>
                        <option value="SETTLEMENT">Settlement</option>
                        <option value="PAYMENT_PLAN">Payment Plan</option>
                      </select>
                    </div>

                    {/* From Date */}
                    <div>
                      <label className="block text-xxs font-semibold text-ncb-text uppercase tracking-wider mb-2">
                        From Date
                      </label>
                      <input
                        type="date"
                        value={filters.startDate}
                        onChange={(e) => handleFilterChange('startDate', e.target.value)}
                        className="w-full px-3 py-2 text-sm border-b-2 border-ncb-divider focus:border-ncb-blue focus:outline-none bg-transparent text-ncb-heading transition-colors"
                      />
                    </div>

                    {/* To Date */}
                    <div>
                      <label className="block text-xxs font-semibold text-ncb-text uppercase tracking-wider mb-2">
                        To Date
                      </label>
                      <input
                        type="date"
                        value={filters.endDate}
                        onChange={(e) => handleFilterChange('endDate', e.target.value)}
                        className="w-full px-3 py-2 text-sm border-b-2 border-ncb-divider focus:border-ncb-blue focus:outline-none bg-transparent text-ncb-heading transition-colors"
                      />
                    </div>

                    {/* Search */}
                    <div className="sm:col-span-2">
                      <label className="block text-xxs font-semibold text-ncb-text uppercase tracking-wider mb-2">
                        Search Customer
                      </label>
                      <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ncb-text" />
                        <input
                          type="text"
                          placeholder="Enter customer name..."
                          value={filters.customerName || ''}
                          onChange={(e) => handleSearchChange(e.target.value)}
                          className="w-full pl-9 pr-8 py-2 text-sm border-b-2 border-ncb-divider focus:border-ncb-blue focus:outline-none bg-transparent text-ncb-heading transition-colors"
                        />
                        {filters.customerName && (
                          <button
                            onClick={clearSearch}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-ncb-text hover:text-ncb-heading transition-colors"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Promises Table */}
              <div className="bg-ncb-white rounded-lg border border-ncb-divider overflow-hidden">
                <div className="px-4 lg:px-6 py-3 border-b border-ncb-divider bg-ncb-lightbg">
                  <h2 className="text-sm font-semibold text-ncb-heading">
                    {isSupervisor || isAdmin ? 'All Promises' : 'My Promises'}
                    <span className="ml-2 text-xxs font-normal text-ncb-text">
                      ({promises.length} total)
                    </span>
                  </h2>
                </div>

                {error && (
                  <div className="m-4 p-3 bg-ncb-error/10 border-l-4 border-ncb-error rounded">
                    <p className="text-xs text-ncb-error">{error}</p>
                  </div>
                )}

                {loading ? (
                  <div className="p-8 text-center">
                    <div className="w-8 h-8 border-3 border-ncb-blue border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-ncb-text text-sm">Loading promises...</p>
                  </div>
                ) : promises.length === 0 ? (
                  <div className="p-12 text-center">
                    <AlertCircle size={40} className="mx-auto mb-3 text-ncb-text/40" />
                    <p className="text-ncb-heading text-sm font-semibold mb-1">No Promises Found</p>
                    <p className="text-ncb-text text-xs">
                      {hasActiveFilters 
                        ? 'Try adjusting your search or filter criteria'
                        : 'No payment promises have been recorded yet'}
                    </p>
                    {hasActiveFilters && (
                      <button
                        onClick={clearAllFilters}
                        className="mt-4 text-xs text-ncb-blue hover:underline"
                      >
                        Clear all filters
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-ncb-divider bg-ncb-lightbg">
                          <th className="text-left px-4 lg:px-6 py-3 text-xxs font-semibold text-ncb-text uppercase tracking-wider">
                            Customer
                          </th>
                          <th className="text-left px-4 lg:px-6 py-3 text-xxs font-semibold text-ncb-text uppercase tracking-wider">
                            Amount
                          </th>
                          <th className="text-left px-4 lg:px-6 py-3 text-xxs font-semibold text-ncb-text uppercase tracking-wider">
                            Due Date
                          </th>
                          <th className="text-left px-4 lg:px-6 py-3 text-xxs font-semibold text-ncb-text uppercase tracking-wider">
                            Status
                          </th>
                          {(isSupervisor || isAdmin) && (
                            <th className="text-left px-4 lg:px-6 py-3 text-xxs font-semibold text-ncb-text uppercase tracking-wider">
                              Created By
                            </th>
                          )}
                          <th className="text-left px-4 lg:px-6 py-3 text-xxs font-semibold text-ncb-text uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-ncb-divider">
                        {promises.map((promise, idx) => {
                          const statusConfig = getStatusConfig(promise.status);
                          const StatusIcon = statusConfig.icon;
                          const dueDate = formatDateOnly(promise.promiseDate);
                          const isOverdue = promise.status === 'PENDING' && new Date(promise.promiseDate) < new Date();

                          return (
                            <tr 
                              key={promise._id || idx}
                              onClick={() => handlePromiseClick(promise)}
                              className="hover:bg-ncb-lightbg transition-colors cursor-pointer group"
                            >
                              <td className="px-4 lg:px-6 py-3">
                                <div>
                                  <p className="text-sm font-medium text-ncb-heading">
                                    {promise.customerId?.name || promise.customerName}
                                  </p>
                                  <p className="text-xxs text-ncb-text mt-0.5">
                                    {promise.phoneNumber}
                                  </p>
                                </div>
                              </td>
                              <td className="px-4 lg:px-6 py-3">
                                <span className="text-sm font-semibold text-ncb-heading">
                                  {formatCurrency(promise.promiseAmount)}
                                </span>
                              </td>
                              <td className="px-4 lg:px-6 py-3">
                                <div>
                                  <p className="text-sm text-ncb-text">{dueDate}</p>
                                  {isOverdue && (
                                    <p className="text-xxs text-ncb-error font-semibold mt-0.5">Overdue</p>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 lg:px-6 py-3">
                                <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full ${statusConfig.bg}`}>
                                  <StatusIcon size={10} className={statusConfig.color} />
                                  <span className={`text-xxs font-semibold ${statusConfig.color}`}>
                                    {statusConfig.label}
                                  </span>
                                </div>
                              </td>
                              {(isSupervisor || isAdmin) && (
                                <td className="px-4 lg:px-6 py-3">
                                  <p className="text-xs text-ncb-text">{promise.createdByName}</p>
                                  <p className="text-xxs text-ncb-text/60">{formatDateOnly(promise.createdAt)}</p>
                                </td>
                              )}
                              <td className="px-4 lg:px-6 py-3">
                                {promise.status === 'PENDING' && (
                                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        updatePromiseStatus(promise.promiseId, 'FULFILLED');
                                      }}
                                      className="px-2 py-1 bg-ncb-success text-white rounded text-xxs hover:bg-ncb-success/90 transition-colors"
                                      title="Mark as Fulfilled"
                                    >
                                      <CheckCircle size={12} />
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        updatePromiseStatus(promise.promiseId, 'BROKEN');
                                      }}
                                      className="px-2 py-1 bg-ncb-error text-white rounded text-xxs hover:bg-ncb-error/90 transition-colors"
                                      title="Mark as Broken"
                                    >
                                      <XCircle size={12} />
                                    </button>
                                  </div>
                                )}
                                {promise.status !== 'PENDING' && (
                                  <Eye size={14} className="text-ncb-text/40" />
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Calendar (1/3 width on desktop) */}
            <div className="lg:col-span-1">
              <div className="bg-ncb-white rounded-lg border border-ncb-divider overflow-hidden sticky top-24">
                <div className="px-4 py-3 border-b border-ncb-divider bg-ncb-lightbg">
                  <h2 className="text-sm font-semibold text-ncb-heading flex items-center gap-2">
                    <Calendar size={14} />
                    Promise Calendar
                  </h2>
                </div>
                <div className="p-4">
                  <div className="text-center py-8 text-ncb-text">
                    <Calendar size={32} className="mx-auto mb-2 text-ncb-text/40" />
                    <p className="text-xs">Calendar view coming soon</p>
                    <p className="text-xxs mt-1">{promises.length} promises tracked</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </LayoutWrapper>
  );
};

export default Promises;