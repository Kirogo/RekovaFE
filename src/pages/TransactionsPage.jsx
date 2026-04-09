// src/pages/TransactionsPage.jsx - COMPLETELY FIXED with proper customer name display
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  LinearProgress,
  Modal,
  IconButton
} from '@mui/material';
import {
  Download,
  Refresh,
  Receipt,
  AccountBalanceWallet,
  CheckCircle,
  Cancel,
  AccessTime,
  HourglassEmpty,
  Close,
  Person,
  Payment,
  ReceiptLong,
  AccountBalance,
  DoneAll,
  Search,
  AssignmentInd,
  SupervisorAccount,
  Groups
} from '@mui/icons-material';
import authService from '../services/auth.service';
import { authAxios } from '../services/api';
import LayoutWrapper from '../LayoutWrapper';
import '../styles/transactionspage.css';

const TransactionsPage = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [exportLoading, setExportLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState(null);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [customerDetails, setCustomerDetails] = useState(null);

  // User role state
  const [userRole, setUserRole] = useState('officer');
  const [isSupervisor, setIsSupervisor] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Get user role from auth service
  const getUserInfo = () => {
    const user = authService.getCurrentUser();
    if (!user) return { role: 'officer', isSupervisor: false, isAdmin: false };

    const role = user.role?.toLowerCase() || 'officer';
    const isSupervisorUser = role === 'supervisor';
    const isAdminUser = role === 'admin';

    console.log('👤 User Info:', {
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

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);

      const userInfo = getUserInfo();

      console.log(`📡 Fetching transactions for ${userInfo.role}...`);

      let response;
      let transactionsData = [];

      // Use different endpoints based on user role
      if (userInfo.role === 'officer') {
        console.log('👤 Fetching officer transactions from /api/transactions/my-transactions...');
        response = await authAxios.get('/transactions/my-transactions?limit=100');

        console.log('✅ Officer transactions response:', response.data);

        const resData = response.data;

        if (resData.data && Array.isArray(resData.data)) {
          transactionsData = resData.data;
        } else if (resData.data?.transactions && Array.isArray(resData.data.transactions)) {
          transactionsData = resData.data.transactions;
        } else if (Array.isArray(resData)) {
          transactionsData = resData;
        } else if (resData.transactions && Array.isArray(resData.transactions)) {
          transactionsData = resData.transactions;
        } else {
          transactionsData = [];
        }

        console.log(`📊 Found ${transactionsData.length} transactions for officer`);

      } else {
        console.log('👑 Fetching all transactions from /api/transactions...');
        response = await authAxios.get('/transactions?limit=100');

        console.log('✅ All transactions response:', response.data);

        const resData = response.data;

        if (resData.data && Array.isArray(resData.data)) {
          transactionsData = resData.data;
        } else if (resData.data?.transactions && Array.isArray(resData.data.transactions)) {
          transactionsData = resData.data.transactions;
        } else if (Array.isArray(resData)) {
          transactionsData = resData;
        } else if (resData.transactions && Array.isArray(resData.transactions)) {
          transactionsData = resData.transactions;
        } else {
          transactionsData = [];
        }

        console.log(`📊 Found ${transactionsData.length} total transactions`);
      }

      // Process transactions to ensure customer name is properly extracted
      const processedTransactions = transactionsData.map(transaction => {
        // Extract customer name from various possible locations
        let customerName = 'Unknown Customer';
        let phoneNumber = 'N/A';
        
        // Check if customerId is an object with name property
        if (transaction.customerId) {
          if (typeof transaction.customerId === 'object') {
            customerName = transaction.customerId.name || 'Unknown Customer';
            phoneNumber = transaction.customerId.phoneNumber || transaction.phoneNumber || 'N/A';
          } else if (typeof transaction.customerId === 'string' || typeof transaction.customerId === 'number') {
            // customerId is just an ID, we'll fetch the name separately
            customerName = transaction.customerName || `Customer ${transaction.customerId}`;
            phoneNumber = transaction.phoneNumber || 'N/A';
          }
        } else if (transaction.customerName) {
          customerName = transaction.customerName;
          phoneNumber = transaction.phoneNumber || 'N/A';
        }
        
        return {
          ...transaction,
          displayCustomerName: customerName,
          displayPhoneNumber: phoneNumber,
          displayDate: transaction.createdAt,
          displayAmount: transaction.amount || 0,
          displayStatus: transaction.status || 'PENDING',
          displayTransactionId: transaction.transactionId || transaction._id
        };
      });

      console.log('✅ Processed transactions with customer names:', processedTransactions.map(t => ({ id: t.displayTransactionId, name: t.displayCustomerName })));

      setTransactions(processedTransactions);

      // Calculate stats
      const totalAmount = processedTransactions.reduce((sum, t) => {
        const amount = parseFloat(t.displayAmount || 0);
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0);

      const successful = processedTransactions.filter(t => t.displayStatus?.toUpperCase() === 'SUCCESS').length;
      const failed = processedTransactions.filter(t => t.displayStatus?.toUpperCase() === 'FAILED').length;
      const pending = processedTransactions.filter(t => t.displayStatus?.toUpperCase() === 'PENDING').length;
      const expired = processedTransactions.filter(t => t.displayStatus?.toUpperCase() === 'EXPIRED').length;
      const cancelled = processedTransactions.filter(t => t.displayStatus?.toUpperCase() === 'CANCELLED').length;

      setStats({
        totalTransactions: processedTransactions.length || 0,
        successfulTransactions: successful,
        failedTransactions: failed,
        pendingTransactions: pending,
        expiredTransactions: expired,
        cancelledTransactions: cancelled,
        totalAmount: totalAmount,
        averageTransaction: processedTransactions.length > 0 ? totalAmount / processedTransactions.length : 0,
        successRate: processedTransactions.length > 0 ? (successful / processedTransactions.length) * 100 : 0
      });

    } catch (error) {
      console.error('❌ Error fetching transactions:', error);

      if (error.response?.status === 401) {
        authService.logout();
        navigate('/login');
        return;
      }

      setError(error.response?.data?.message || 'Failed to load transactions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerDetails = async (customerId) => {
    if (!customerId) return null;

    try {
      const response = await authAxios.get(`/customers/${customerId}`);

      if (response.data.success) {
        return response.data.data?.customer || response.data.data;
      }
      return null;
    } catch (error) {
      console.error('Error fetching customer details:', error);
      return null;
    }
  };

  useEffect(() => {
    console.log('🔐 TransactionsPage mounted - Auth status:', {
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

    fetchTransactions();
  }, []);

  // Filter transactions
  const filteredTransactions = transactions.filter(transaction => {
    const customerName = transaction.displayCustomerName || 'Unknown Customer';
    const phoneNumber = transaction.displayPhoneNumber || '';
    const transactionId = transaction.displayTransactionId || '';

    const matchesSearch = !searchTerm ||
      customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transactionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      phoneNumber.includes(searchTerm);

    const matchesStatus = !statusFilter ||
      (transaction.displayStatus || '').toUpperCase() === statusFilter.toUpperCase();

    return matchesSearch && matchesStatus;
  });

  const paginatedTransactions = filteredTransactions.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleChangePage = (newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
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

  // Get status props
  const getStatusProps = (status) => {
    const statusUpper = status?.toUpperCase();
    switch (statusUpper) {
      case 'SUCCESS':
        return {
          text: 'Success',
          class: 'success',
          icon: <CheckCircle sx={{ fontSize: 14 }} />
        };
      case 'FAILED':
        return {
          text: 'Failed',
          class: 'failed',
          icon: <Cancel sx={{ fontSize: 14 }} />
        };
      case 'PENDING':
        return {
          text: 'Pending',
          class: 'pending',
          icon: <AccessTime sx={{ fontSize: 14 }} />
        };
      case 'EXPIRED':
        return {
          text: 'Expired',
          class: 'expired',
          icon: <HourglassEmpty sx={{ fontSize: 14 }} />
        };
      case 'CANCELLED':
        return {
          text: 'Cancelled',
          class: 'cancelled',
          icon: <Cancel sx={{ fontSize: 14, color: '#6b7280' }} />
        };
      default:
        return {
          text: status || 'Unknown',
          class: 'pending',
          icon: <AccessTime sx={{ fontSize: 14 }} />
        };
    }
  };

  const handleExportData = async () => {
    try {
      setExportLoading(true);

      const response = await authAxios.get('/transactions/export', {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;

      const contentDisposition = response.headers['content-disposition'];
      let filename = 'transactions_export.csv';

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch && filenameMatch.length === 2) {
          filename = filenameMatch[1];
        }
      }

      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Error exporting data:', error);
      setError('Failed to export data. Please try again.');
    } finally {
      setExportLoading(false);
    }
  };

  // Handle transaction click
  const handleTransactionClick = async (transaction) => {
    setSelectedTransaction(transaction);

    // Extract customer ID correctly
    const customerId = transaction.customerId?._id || transaction.customerId;
    if (customerId && typeof customerId === 'number') {
      const details = await fetchCustomerDetails(customerId);
      setCustomerDetails(details);
    } else {
      setCustomerDetails(null);
    }

    setModalOpen(true);
  };

  // Close modal
  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedTransaction(null);
    setCustomerDetails(null);
  };

  // Format date for display
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

  // Calculate loan details based on actual customer data
  const calculateLoanDetails = (transaction) => {
    const currentCustomerData = customerDetails || transaction.customerId;

    const transactionAmount = parseFloat(transaction.displayAmount || 0);
    const totalLoanBalance = parseFloat(currentCustomerData?.loanBalance || 0);
    const arrearsAmount = parseFloat(currentCustomerData?.arrears || 0);
    const totalRepayments = parseFloat(currentCustomerData?.totalRepayments || 0);

    if (transaction.displayStatus?.toUpperCase() === 'SUCCESS') {
      const arrearsCleared = Math.min(transactionAmount, arrearsAmount);
      const principalPaid = Math.max(0, transactionAmount - arrearsCleared);
      const remainingArrears = Math.max(0, arrearsAmount - arrearsCleared);
      const remainingPrincipal = Math.max(0, totalLoanBalance - arrearsAmount - principalPaid);
      const newLoanBalance = remainingArrears + remainingPrincipal;
      const totalCleared = arrearsCleared + principalPaid;

      return {
        transactionAmount,
        totalLoanBalance,
        arrearsAmount,
        arrearsCleared,
        principalPaid,
        remainingArrears,
        remainingPrincipal,
        newLoanBalance,
        totalCleared,
        totalRepayments,
        isPaidOff: newLoanBalance <= 0,
        hasArrears: remainingArrears > 0
      };
    } else {
      return {
        transactionAmount,
        totalLoanBalance,
        arrearsAmount,
        arrearsCleared: 0,
        principalPaid: 0,
        remainingArrears: arrearsAmount,
        remainingPrincipal: Math.max(0, totalLoanBalance - arrearsAmount),
        newLoanBalance: totalLoanBalance,
        totalCleared: 0,
        totalRepayments,
        isPaidOff: false,
        hasArrears: arrearsAmount > 0
      };
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
    if (isSupervisor) return 'Supervisor - View All System Transactions';
    if (isAdmin) return 'Administrator - Full Transaction History';
    return 'My Initiated Transactions';
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

  // Get role-specific stats
  const getStatsData = () => {
    const baseStats = [
      {
        label: isSupervisor || isAdmin ? 'Total Amount' : 'My Collections',
        value: formatCurrency(stats?.totalAmount || 0),
        icon: <AccountBalanceWallet />,
        meta: isSupervisor || isAdmin ? 'Total value processed' : 'Total amount collected'
      },
      {
        label: 'Successful',
        value: stats?.successfulTransactions || 0,
        icon: <CheckCircle />,
        meta: isSupervisor || isAdmin ? 'Completed payments' : 'Your successful payments'
      },
      {
        label: 'Pending',
        value: stats?.pendingTransactions || 0,
        icon: <HourglassEmpty />,
        meta: 'Awaiting completion'
      }
    ];

    if (isSupervisor || isAdmin) {
      return [
        ...baseStats,
        {
          label: 'Failed',
          value: stats?.failedTransactions || 0,
          icon: <Cancel />,
          meta: 'Unsuccessful attempts'
        },
        {
          label: 'Total Transactions',
          value: stats?.totalTransactions || 0,
          icon: <Receipt />,
          meta: 'All recorded transactions'
        }
      ];
    }

    return baseStats;
  };

  const handleRefresh = () => {
    console.log('🔄 Refreshing transaction data...');
    fetchTransactions();
    setSearchTerm('');
    setStatusFilter('');
    setPage(0);
  };

  return (
    <LayoutWrapper>
      <Box className="transactions-page-wrapper page-wrapper-base">
        <Box className="transactions-header">
          <div className="transactions-header-content">
            <Box>
              <Typography className={`page-subtitle ${getRoleTextColor()}`}>
                {getRoleSubtitle()}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 1 }}>
              <button
                className="customer-action-btn"
                onClick={handleRefresh}
                disabled={loading}
              >
                <Refresh sx={{ fontSize: 16 }} />
                Refresh
              </button>
              <button
                className={`customer-primary-btn ${getRolePrimaryClass()}`}
                onClick={handleExportData}
                disabled={exportLoading}
              >
                <Download sx={{ fontSize: 16 }} />
                {exportLoading ? 'Exporting...' : 'Export'}
              </button>
            </Box>
          </div>
        </Box>

        <div className="customer-stats-grid">
          {getStatsData().map((stat, index) => (
            <div key={index} className="customer-stat-card">
              <div className={`stat-top-border ${getRoleAccentClass()}`}></div>
              <div className="customer-stat-header">
                <div className={`customer-stat-label ${getRoleTextColor()}`}>
                  {stat.label}
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

        <Box className="customer-main-content">
          <div className="customer-content-card">
            <div className="customer-section-header">
              <Box>
                <Typography className={`customer-section-title ${getRoleTextColor()}`}>
                  {isSupervisor || isAdmin
                    ? `ALL TRANSACTIONS (${filteredTransactions.length})`
                    : `MY TRANSACTIONS (${filteredTransactions.length})`}
                  <div className={`section-title-underline ${getRoleAccentClass()}`}></div>
                </Typography>
              </Box>

              <div className="customer-search-container">
                <input
                  type="text"
                  placeholder={isSupervisor || isAdmin
                    ? "Search by customer, phone, transaction ID..."
                    : "Search your transactions by customer or ID..."}
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(0);
                  }}
                  className="customer-search-input"
                />

                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(0);
                  }}
                  className="customer-status-filter"
                >
                  <option value="">All Status</option>
                  <option value="SUCCESS">Success</option>
                  <option value="PENDING">Pending</option>
                  <option value="FAILED">Failed</option>
                  <option value="EXPIRED">Expired</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
            </div>

            {error && (
              <div className="customer-alert" style={{ margin: '1rem', padding: '0.5rem 1rem' }}>
                {error}
              </div>
            )}

            {loading ? (
              <Box className="customer-loading">
                <LinearProgress className={`loading-bar ${getRoleAccentClass()}`} />
                <Typography className="customer-loading-text">
                  {isSupervisor || isAdmin
                    ? 'Loading all transactions...'
                    : 'Loading your transactions...'}
                </Typography>
              </Box>
            ) : !transactions || transactions.length === 0 ? (
              <div className="table-empty-state">
                <div className="empty-icon">
                  <Receipt sx={{ fontSize: 48 }} />
                </div>
                <Typography className={`empty-title ${getRoleTextColor()}`}>
                  No Transactions Found
                </Typography>
                <Typography className="empty-subtitle">
                  {isSupervisor || isAdmin
                    ? 'No transactions have been recorded yet.'
                    : 'No transactions have been initiated by you yet.'}
                </Typography>
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="table-empty-state">
                <div className="empty-icon">
                  <Search sx={{ fontSize: 48 }} />
                </div>
                <Typography className={`empty-title ${getRoleTextColor()}`}>
                  No Matching Transactions
                </Typography>
                <Typography className="empty-subtitle">
                  Try adjusting your search or filter criteria.
                </Typography>
              </div>
            ) : (
              <>
                <div className="table-container-wrapper">
                  <table className="transactionspage-table">
                    <thead>
                      <tr>
                        <th>Transaction ID</th>
                        <th>Customer</th>
                        <th>Phone</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedTransactions.map((transaction, index) => {
                        const statusProps = getStatusProps(transaction.displayStatus);
                        const { date } = formatDateTime(transaction.displayDate);

                        return (
                          <tr
                            key={transaction._id || transaction.displayTransactionId || `transaction-${index}`}
                            className="customer-table-row"
                            onClick={() => handleTransactionClick(transaction)}
                            style={{ cursor: 'pointer' }}
                          >
                            <td className="transaction-id-cell">
                              {transaction.displayTransactionId?.substring(0, 15)}...
                            </td>
                            <td className="transaction-customer-cell">
                              <strong>{transaction.displayCustomerName}</strong>
                            </td>
                            <td className="transaction-phone-cell">
                              {transaction.displayPhoneNumber}
                            </td>
                            <td className="transaction-amount-cell">
                              {formatCurrency(transaction.displayAmount)}
                            </td>
                            <td className="transaction-status-cell">
                              <span className={`transactions-status-chip ${statusProps.class}`}>
                                {statusProps.icon}
                                {statusProps.text}
                              </span>
                            </td>
                            <td className="transaction-date-cell">
                              {date}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {filteredTransactions.length > 0 && (
                  <div className="customer-pagination">
                    <div className="pagination-info">
                      Showing {page * rowsPerPage + 1} to {Math.min((page + 1) * rowsPerPage, filteredTransactions.length)} of {filteredTransactions.length} transactions
                    </div>

                    <div className="pagination-controls">
                      <button
                        className="pagination-btn first-page"
                        onClick={() => handleChangePage(0)}
                        disabled={page === 0}
                      >
                        &laquo;
                      </button>
                      <button
                        className="pagination-btn prev-page"
                        onClick={() => handleChangePage(page - 1)}
                        disabled={page === 0}
                      >
                        &lsaquo;
                      </button>
                      <div className="page-indicator">
                        Page {page + 1} of {Math.ceil(filteredTransactions.length / rowsPerPage)}
                      </div>
                      <button
                        className="pagination-btn next-page"
                        onClick={() => handleChangePage(page + 1)}
                        disabled={page >= Math.ceil(filteredTransactions.length / rowsPerPage) - 1}
                      >
                        &rsaquo;
                      </button>
                      <button
                        className="pagination-btn last-page"
                        onClick={() => handleChangePage(Math.ceil(filteredTransactions.length / rowsPerPage) - 1)}
                        disabled={page >= Math.ceil(filteredTransactions.length / rowsPerPage) - 1}
                      >
                        &raquo;
                      </button>
                    </div>

                    <div className="rows-per-page">
                      <select
                        value={rowsPerPage}
                        onChange={handleChangeRowsPerPage}
                        className="rows-select"
                      >
                        <option value="5">5 per page</option>
                        <option value="10">10 per page</option>
                        <option value="25">25 per page</option>
                        <option value="50">50 per page</option>
                      </select>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </Box>

        {/* Transaction Details Modal */}
        <Modal
          open={modalOpen}
          onClose={handleCloseModal}
          aria-labelledby="transaction-details-modal"
        >
          <Box className="transaction-modal-container">
            {selectedTransaction && (
              <div className="transaction-modal-content">
                <div className="transaction-modal-header">
                  <div className="transaction-modal-header-content">
                    <ReceiptLong sx={{ fontSize: 20, color: '#5c4730' }} />
                    <div>
                      <Typography className={`transaction-modal-title ${getRoleTextColor()}`}>
                        Transaction Details
                      </Typography>
                      <Typography className="transaction-modal-subtitle">
                        {selectedTransaction.displayTransactionId}
                      </Typography>
                    </div>
                  </div>
                  <IconButton onClick={handleCloseModal} className="transaction-modal-close-btn" size="small">
                    <Close />
                  </IconButton>
                </div>

                <div className="transaction-modal-body">
                  <div className="transaction-details-grid-compact">
                    <div className="transaction-column-compact">
                      <div className="transaction-card-compact">
                        <div className="transaction-card-header-compact">
                          <Person sx={{ fontSize: 14, color: '#5c4730' }} />
                          <span>Customer Information</span>
                        </div>
                        <div className="transaction-card-content-compact">
                          <div className="transaction-detail-item-compact">
                            <span className="transaction-detail-label-compact">Name</span>
                            <span className="transaction-detail-value-compact">
                              {selectedTransaction.displayCustomerName}
                            </span>
                          </div>
                          <div className="transaction-detail-item-compact">
                            <span className="transaction-detail-label-compact">Phone</span>
                            <span className="transaction-detail-value-compact">
                              {selectedTransaction.displayPhoneNumber}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="transaction-card-compact">
                        <div className="transaction-card-header-compact">
                          <Payment sx={{ fontSize: 14, color: '#5c4730' }} />
                          <span>Transaction Information</span>
                        </div>
                        <div className="transaction-card-content-compact">
                          <div className="transaction-detail-item-compact">
                            <span className="transaction-detail-label-compact">Date & Time</span>
                            <span className="transaction-detail-value-compact">
                              {formatDateTime(selectedTransaction.displayDate).full}
                            </span>
                          </div>
                          <div className="transaction-detail-item-compact">
                            <span className="transaction-detail-label-compact">Amount</span>
                            <span className="transaction-detail-value-compact amount-highlight">
                              {formatCurrency(selectedTransaction.displayAmount)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="transaction-column-compact">
                      <div className="transaction-card-compact status-card-compact">
                        <div className="transaction-card-header-compact">
                          <ReceiptLong sx={{ fontSize: 14, color: '#5c4730' }} />
                          <span>Transaction Status</span>
                        </div>
                        <div className="transaction-status-wrapper-compact">
                          {(() => {
                            const statusProps = getStatusProps(selectedTransaction.displayStatus);
                            return (
                              <div className={`transaction-status-display-compact ${statusProps.class}`}>
                                <div className="status-icon-compact">{statusProps.icon}</div>
                                <div>
                                  <div className="transaction-status-text-compact">{statusProps.text}</div>
                                  <div className="transaction-status-message-compact">
                                    {selectedTransaction.displayStatus?.toUpperCase() === 'SUCCESS'
                                      ? 'Payment successfully processed'
                                      : selectedTransaction.displayStatus?.toUpperCase() === 'PENDING'
                                        ? 'Payment is being processed'
                                        : 'Transaction not completed'}
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="transaction-modal-footer">
                  <button className="customer-secondary-dialog-btn" onClick={handleCloseModal}>
                    Close
                  </button>
                </div>
              </div>
            )}
          </Box>
        </Modal>
      </Box>
    </LayoutWrapper>
  );
};

export default TransactionsPage;