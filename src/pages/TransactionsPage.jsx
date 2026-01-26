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
  FilterList
} from '@mui/icons-material';
import axios from 'axios';
import authService from '../services/auth.service';
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

  // Get API instance with auth token
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

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);

      const api = getApi();
      
      // FIXED: Use correct endpoint /api/transactions instead of /api/payments/transactions
      console.log('📡 Fetching transactions from /api/transactions...');
      
      const response = await api.get('/transactions?limit=100');
      
      console.log('✅ Transactions API Response:', response.data);

      // FIXED: Extract transactions from response correctly
      let transactionsData = [];
      const resData = response.data;
      
      if (resData.data && Array.isArray(resData.data)) {
        // Direct array in data field
        transactionsData = resData.data;
      } else if (resData.data?.transactions) {
        // Nested transactions in data field
        transactionsData = resData.data.transactions;
      } else if (Array.isArray(resData)) {
        // Direct array response
        transactionsData = resData;
      } else if (resData.transactions) {
        // Transactions in root
        transactionsData = resData.transactions;
      }
      
      console.log(`📊 Found ${transactionsData.length} transactions`);
      
      // Log first transaction to see structure
      if (transactionsData.length > 0) {
        console.log('📋 First transaction sample:', transactionsData[0]);
        console.log('👤 Customer data in transaction:', transactionsData[0].customerId);
      }
      
      setTransactions(transactionsData);

      // Calculate stats
      const totalAmount = transactionsData.reduce((sum, t) => {
        const amount = parseFloat(t?.amount || 0);
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0);
      
      const successful = transactionsData.filter(t => t?.status?.toUpperCase() === 'SUCCESS').length;
      const failed = transactionsData.filter(t => t?.status?.toUpperCase() === 'FAILED').length;
      const pending = transactionsData.filter(t => t?.status?.toUpperCase() === 'PENDING').length;
      const expired = transactionsData.filter(t => t?.status?.toUpperCase() === 'EXPIRED').length;
      const cancelled = transactionsData.filter(t => t?.status?.toUpperCase() === 'CANCELLED').length;

      setStats({
        totalTransactions: transactionsData.length || 0,
        successfulTransactions: successful,
        failedTransactions: failed,
        pendingTransactions: pending,
        expiredTransactions: expired,
        cancelledTransactions: cancelled,
        totalAmount: totalAmount,
        averageTransaction: transactionsData.length > 0 ? totalAmount / transactionsData.length : 0,
        successRate: transactionsData.length > 0 ? (successful / transactionsData.length) * 100 : 0
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
      const api = getApi();
      const response = await api.get(`/customers/${customerId}`);
      
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
    fetchTransactions();
  }, []);

  // Filter transactions
  const filteredTransactions = transactions.filter(transaction => {
    const customerName = transaction.customerId?.name || 
                        transaction.customerName || 
                        'Unknown Customer';
    
    const matchesSearch = !searchTerm ||
      customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (transaction.transactionId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (transaction.phoneNumber || '').includes(searchTerm);

    const matchesStatus = !statusFilter ||
      (transaction.status || '').toUpperCase() === statusFilter.toUpperCase();

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

      const api = getApi();
      const response = await api.get('/transactions/export', {
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
    if (customerId) {
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

  // Calculate loan details based on actual customer data
  const calculateLoanDetails = (transaction) => {
    // Use fetched customer details or fallback to transaction data
    const currentCustomerData = customerDetails || transaction.customerId;

    const transactionAmount = parseFloat(transaction.amount || 0);
    const totalLoanBalance = parseFloat(currentCustomerData?.loanBalance || 0);
    const arrearsAmount = parseFloat(currentCustomerData?.arrears || 0);
    const totalRepayments = parseFloat(currentCustomerData?.totalRepayments || 0);

    if (transaction.status?.toUpperCase() === 'SUCCESS') {
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

  // Stats data - 3 cards matching dashboard
  const statsData = [
    {
      label: 'Total Amount',
      value: formatCurrency(stats?.totalAmount || 0),
      icon: <AccountBalanceWallet />,
      meta: 'Total value processed'
    },
    {
      label: 'Successful',
      value: stats?.successfulTransactions || 0,
      icon: <CheckCircle />,
      meta: 'Completed payments'
    },
    {
      label: 'Pending',
      value: stats?.pendingTransactions || 0,
      icon: <HourglassEmpty />,
      meta: 'Awaiting completion'
    }
  ];

  return (
    <LayoutWrapper>
      <Box className="transactions-page-wrapper page-wrapper-base">
        {/* Header */}
        <Box className="transactions-header">
          <div className="transactions-header-content">
            <Box>
              <Typography className="transactions-title">
                Transactions
              </Typography>
              <Typography className="transactions-subtitle">
                View and manage all payment transactions
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 1 }}>
              <button
                className="transactions-action-btn"
                onClick={fetchTransactions}
                disabled={loading}
              >
                <Refresh sx={{ fontSize: 16 }} />
                Refresh
              </button>
              <button
                className="transactions-primary-btn"
                onClick={handleExportData}
                disabled={exportLoading}
              >
                <Download sx={{ fontSize: 16 }} />
                {exportLoading ? 'Exporting...' : 'Export'}
              </button>
            </Box>
          </div>
        </Box>

        {/* Stats Grid - 3 cards */}
        <div className="transactions-stats-grid">
          {statsData.map((stat, index) => (
            <div key={index} className="transactions-stat-card">
              <div className="transactions-stat-header">
                <div className="transactions-stat-label">{stat.label}</div>
                <div
                  className="transactions-stat-icon-wrapper"
                  style={{ background: 'linear-gradient(135deg, #5c4730, #3c2a1c)' }}
                >
                  {stat.icon}
                </div>
              </div>
              <div>
                <div className="transactions-stat-value">
                  {stat.value}
                </div>
                <div className="transactions-stat-meta">
                  {stat.meta}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Main Content */}
        <Box className="transactions-main-content">
          <div className="transactions-content-card">
            <div className="transactions-section-header">
              <Box>
                <Typography className="transactions-section-title">
                  TRANSACTIONS ({transactions.length})
                </Typography>
              </Box>

              {/* Search and Filter Section */}
              <div className="transactions-search-container">
                <input
                  type="text"
                  placeholder="Search by customer, phone, or ID..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(0);
                  }}
                  className="transactions-search-input"
                />

                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(0);
                  }}
                  className="transactions-status-filter"
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
              <div className="transactions-error-message">
                {error}
              </div>
            )}

            {loading ? (
              <Box className="transactions-loading">
                <LinearProgress />
                <Typography className="transactions-loading-text">
                  Loading transactions...
                </Typography>
              </Box>
            ) : !transactions || transactions.length === 0 ? (
              <div className="transactions-empty-state">
                <div className="transactions-empty-icon">
                  <Receipt sx={{ fontSize: 48, color: '#d4a762' }} />
                </div>
                <Typography className="transactions-empty-title">
                  No Transactions Found
                </Typography>
                <Typography className="transactions-empty-subtitle">
                  No transactions have been recorded yet.
                </Typography>
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="transactions-empty-state">
                <div className="transactions-empty-icon">
                  <Search sx={{ fontSize: 48, color: '#d4a762' }} />
                </div>
                <Typography className="transactions-empty-title">
                  No Matching Transactions
                </Typography>
                <Typography className="transactions-empty-subtitle">
                  Try adjusting your search or filter criteria.
                </Typography>
              </div>
            ) : (
              <>
                <div className="transactionspage-table-container">
                  <table className="transactionspage-table">
                    <thead>
                      <tr>
                        <th>Transaction ID</th>
                        <th>Customer</th>
                        <th>Phone</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Date & Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedTransactions.map((transaction, index) => {
                        const statusProps = getStatusProps(transaction.status);
                        
                        // FIXED: Handle customer data correctly
                        const customerName = transaction.customerId?.name || 
                                            transaction.customerName || 
                                            'Unknown Customer';
                        const phoneNumber = transaction.customerId?.phoneNumber || 
                                           transaction.phoneNumber || 
                                           'N/A';
                        
                        return (
                          <tr
                            key={transaction._id || transaction.transactionId || `transaction-${index}`}
                            className="transactions-table-row"
                            onClick={() => handleTransactionClick(transaction)}
                          >
                            <td>
                              <span className="transaction-id">
                                {transaction.transactionId || transaction._id || `TRX-${index}`}
                              </span>
                            </td>
                            <td>
                              <span className="transaction-customer">
                                {customerName}
                              </span>
                            </td>
                            <td>
                              <span className="transaction-phone">
                                {phoneNumber}
                              </span>
                            </td>
                            <td>
                              <span className="transaction-amount">
                                {formatCurrency(transaction.amount)}
                              </span>
                            </td>
                            <td>
                              <span className={`transactions-status-chip ${statusProps.class}`}>
                                {statusProps.text}
                              </span>
                            </td>
                            <td>
                              <span className="transaction-date">
                                {formatDate(transaction.createdAt)}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {filteredTransactions.length > 0 && (
                  <div className="transactions-pagination">
                    <div className="transactions-pagination-info">
                      Showing {page * rowsPerPage + 1} to {Math.min((page + 1) * rowsPerPage, filteredTransactions.length)} of {filteredTransactions.length} transactions
                    </div>

                    <div className="transactions-pagination-controls">
                      <button
                        className="transactions-pagination-btn"
                        onClick={() => handleChangePage(page - 1)}
                        disabled={page === 0}
                      >
                        Previous
                      </button>

                      <select
                        value={rowsPerPage}
                        onChange={handleChangeRowsPerPage}
                        className="transactions-rows-select"
                      >
                        <option value="5">5 per page</option>
                        <option value="10">10 per page</option>
                        <option value="25">25 per page</option>
                      </select>

                      <button
                        className="transactions-pagination-btn"
                        onClick={() => handleChangePage(page + 1)}
                        disabled={(page + 1) * rowsPerPage >= filteredTransactions.length}
                      >
                        Next
                      </button>
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
          aria-describedby="transaction-details-description"
        >
          <Box className="transaction-modal-container">
            {selectedTransaction && (
              <div className="transaction-modal-content">
                {/* Modal Header */}
                <div className="transaction-modal-header">
                  <div className="transaction-modal-header-content">
                    <ReceiptLong sx={{ fontSize: 20, color: '#5c4730' }} />
                    <div>
                      <Typography className="transaction-modal-title">
                        Transaction Details
                      </Typography>
                      <Typography className="transaction-modal-subtitle">
                        {selectedTransaction.transactionId || selectedTransaction._id}
                      </Typography>
                    </div>
                  </div>
                  <IconButton
                    onClick={handleCloseModal}
                    className="transaction-modal-close-btn"
                    size="small"
                  >
                    <Close />
                  </IconButton>
                </div>

                {/* Modal Body */}
                <div className="transaction-modal-body">
                  <div className="transaction-details-grid-compact">
                    {/* Left Column */}
                    <div className="transaction-column-compact">
                      {/* Customer Information Card */}
                      <div className="transaction-card-compact">
                        <div className="transaction-card-header-compact">
                          <Person sx={{ fontSize: 14, color: '#5c4730' }} />
                          <span>Customer Information</span>
                        </div>
                        <div className="transaction-card-content-compact">
                          <div className="transaction-detail-item-compact">
                            <span className="transaction-detail-label-compact">Name</span>
                            <span className="transaction-detail-value-compact">
                              {selectedTransaction.customerId?.name || selectedTransaction.customerName || 'N/A'}
                            </span>
                          </div>
                          <div className="transaction-detail-item-compact">
                            <span className="transaction-detail-label-compact">Phone</span>
                            <span className="transaction-detail-value-compact">
                              {selectedTransaction.phoneNumber || 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Transaction Information Card */}
                      <div className="transaction-card-compact">
                        <div className="transaction-card-header-compact">
                          <Payment sx={{ fontSize: 14, color: '#5c4730' }} />
                          <span>Transaction Information</span>
                        </div>
                        <div className="transaction-card-content-compact">
                          <div className="transaction-detail-item-compact">
                            <span className="transaction-detail-label-compact">Date & Time</span>
                            <span className="transaction-detail-value-compact">
                              {formatDate(selectedTransaction.createdAt)}
                            </span>
                          </div>
                          <div className="transaction-detail-item-compact">
                            <span className="transaction-detail-label-compact">Payment Method</span>
                            <span className="transaction-detail-value-compact">
                              {selectedTransaction.paymentMethod || 'MPesa'}
                            </span>
                          </div>
                          <div className="transaction-detail-item-compact">
                            <span className="transaction-detail-label-compact">Amount</span>
                            <span className="transaction-detail-value-compact amount-highlight">
                              {formatCurrency(selectedTransaction.amount)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="transaction-column-compact">
                      {/* Loan Balance Summary Card */}
                      <div className="transaction-card-compact loan-card-compact">
                        <div className="transaction-card-header-compact">
                          <AccountBalance sx={{ fontSize: 14, color: '#5c4730' }} />
                          <span>Loan Balance Summary</span>
                        </div>
                        <div className="transaction-card-content-compact">
                          {(() => {
                            const loanDetails = calculateLoanDetails(selectedTransaction);
                            return (
                              <>
                                <div className="transaction-detail-item-compact highlighted-compact">
                                  <span className="transaction-detail-label-compact">
                                    Current Loan Balance
                                  </span>
                                  <span className="transaction-detail-value-compact balance-amount">
                                    {formatCurrency(loanDetails.totalLoanBalance)}
                                  </span>
                                </div>

                                {loanDetails.arrearsAmount > 0 && (
                                  <div className="transaction-detail-item-compact arrears-info-compact">
                                    <span className="transaction-detail-label-compact">
                                      Arrears Balance
                                    </span>
                                    <span className="transaction-detail-value-compact arrears-amount">
                                      {formatCurrency(loanDetails.arrearsAmount)}
                                    </span>
                                  </div>
                                )}

                                <div className="transaction-detail-item-compact success-compact">
                                  <span className="transaction-detail-label-compact">
                                    Total Repayments Made
                                  </span>
                                  <span className="transaction-detail-value-compact success-amount">
                                    {formatCurrency(loanDetails.totalRepayments)}
                                  </span>
                                </div>

                                {selectedTransaction.status?.toUpperCase() === 'SUCCESS' ? (
                                  <>
                                    <div className="transaction-detail-item-compact total-cleared-compact">
                                      <span className="transaction-detail-label-compact">
                                        Total Cleared Now
                                      </span>
                                      <span className="transaction-detail-value-compact total-success-amount">
                                        {formatCurrency(loanDetails.totalCleared)}
                                      </span>
                                    </div>

                                    <div className="transaction-detail-item-compact new-balance-compact">
                                      <span className="transaction-detail-label-compact">
                                        New Loan Balance
                                      </span>
                                      <span className={`transaction-detail-value-compact ${loanDetails.isPaidOff ? 'paid-off-amount' : 'new-balance-amount'}`}>
                                        {formatCurrency(loanDetails.newLoanBalance)}
                                        {loanDetails.isPaidOff && (
                                          <span className="paid-off-badge-compact">
                                            <DoneAll sx={{ fontSize: 10, marginLeft: '0.25rem' }} />
                                            PAID OFF
                                          </span>
                                        )}
                                      </span>
                                    </div>
                                  </>
                                ) : (
                                  <div className="transaction-detail-item-compact">
                                    <span className="transaction-detail-label-compact">
                                      Status Note
                                    </span>
                                    <span className="transaction-detail-value-compact pending-note-compact">
                                      Payment not processed. Loan balance remains unchanged.
                                    </span>
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      </div>

                      {/* Transaction Status Card */}
                      <div className="transaction-card-compact status-card-compact">
                        <div className="transaction-card-header-compact">
                          <ReceiptLong sx={{ fontSize: 14, color: '#5c4730' }} />
                          <span>Transaction Status</span>
                        </div>
                        <div className="transaction-status-wrapper-compact">
                          {(() => {
                            const statusProps = getStatusProps(selectedTransaction.status);
                            return (
                              <div className={`transaction-status-display-compact ${statusProps.class}`}>
                                <div className="status-icon-compact">
                                  {statusProps.icon}
                                </div>
                                <div>
                                  <div className="transaction-status-text-compact">{statusProps.text}</div>
                                  <div className="transaction-status-message-compact">
                                    {selectedTransaction.status?.toUpperCase() === 'SUCCESS'
                                      ? 'Payment successfully processed and applied to loan balance'
                                      : selectedTransaction.status?.toUpperCase() === 'PENDING'
                                        ? 'Payment is being processed. Loan balance will update upon completion.'
                                        : 'Transaction not completed. No changes to loan balance.'}
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

                {/* Modal Footer */}
                <div className="transaction-modal-footer">
                  <button
                    className="transaction-modal-secondary-btn"
                    onClick={handleCloseModal}
                  >
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