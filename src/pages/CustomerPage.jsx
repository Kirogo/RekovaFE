import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  LinearProgress,
  Alert,
  Modal,
  IconButton
} from '@mui/material';
import {
  Add as AddIcon,
  Refresh,
  Search,
  FilterList,
  KeyboardArrowLeft,
  KeyboardArrowRight,
  FirstPage,
  LastPage,
  Close,
  Person,
  Payment,
  ReceiptLong,
  AccountBalance,
  DoneAll,
  CheckCircle,
  Cancel,
  AccessTime,
  HourglassEmpty,
  Receipt
} from '@mui/icons-material';
import CustomerTable from '../components/common/CustomerTable';
import axios from 'axios';
import LayoutWrapper from '../LayoutWrapper';
import '../styles/customerpage.css';

const CustomerPage = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Pagination states
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  
  // Transaction modal states
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
  const [customerDetails, setCustomerDetails] = useState(null);
  
  // Recent transactions state
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phoneNumber: '',
    email: '',
    nationalId: '',
    loanBalance: '',
    arrears: '',
    accountNumber: ''
  });

  useEffect(() => {
    fetchData();
    fetchRecentTransactions();
  }, []);

  useEffect(() => {
    // Filter customers based on search term and status
    let result = customers;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(customer =>
        customer.name?.toLowerCase().includes(term) ||
        customer.email?.toLowerCase().includes(term) ||
        customer.phoneNumber?.includes(term) ||
        customer.customerId?.toLowerCase().includes(term) ||
        customer.nationalId?.includes(term)
      );
    }
    
    if (statusFilter) {
      if (statusFilter === 'active') {
        result = result.filter(customer => customer.isActive === true);
      } else if (statusFilter === 'inactive') {
        result = result.filter(customer => customer.isActive === false);
      } else if (statusFilter === 'arrears') {
        result = result.filter(customer => parseFloat(customer.arrears || 0) > 0);
      } else if (statusFilter === 'current') {
        result = result.filter(customer => parseFloat(customer.arrears || 0) === 0);
      }
    }
    
    setFilteredCustomers(result);
    // Calculate total pages
    setTotalPages(Math.ceil(result.length / rowsPerPage));
  }, [customers, searchTerm, statusFilter, rowsPerPage]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const authAxios = axios.create({
        baseURL: 'http://localhost:5000/api',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // Fetch customers
      const customersResponse = await authAxios.get('/customers?limit=100');
      
      if (customersResponse.data.success) {
        const customersData = customersResponse.data.data.customers || [];
        const sortedCustomers = customersData.sort((a, b) => {
          const dateA = new Date(a.createdAt || 0);
          const dateB = new Date(b.createdAt || 0);
          return dateB - dateA;
        });
        setCustomers(sortedCustomers);
        setFilteredCustomers(sortedCustomers);
      }

    } catch (error) {
      console.error('Error fetching data:', error);

      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
        return;
      }

      setError(error.response?.data?.message || 'Failed to load customer data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentTransactions = async () => {
    try {
      setTransactionsLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.get('http://localhost:5000/api/payments/transactions?limit=5', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        const transactionsData = response.data.data?.transactions || [];
        setRecentTransactions(Array.isArray(transactionsData) ? transactionsData : []);
      }
    } catch (error) {
      console.error('Error fetching recent transactions:', error);
    } finally {
      setTransactionsLoading(false);
    }
  };

  const fetchCustomerDetails = async (customerId) => {
    if (!customerId) return null;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/customers/${customerId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        return response.data.data.customer;
      }
      return null;
    } catch (error) {
      console.error('Error fetching customer details:', error);
      return null;
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewCustomer(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5000/api/customers',
        {
          ...newCustomer,
          loanBalance: parseFloat(newCustomer.loanBalance) || 0,
          arrears: parseFloat(newCustomer.arrears) || 0
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        setOpenDialog(false);
        setNewCustomer({
          name: '',
          phoneNumber: '',
          email: '',
          nationalId: '',
          loanBalance: '',
          arrears: '',
          accountNumber: ''
        });
        fetchData(); // Refresh the list
      } else {
        setError(response.data.message || 'Failed to create customer');
      }
    } catch (error) {
      console.error('Error creating customer:', error);
      setError(error.response?.data?.message || 'Failed to create customer. Please try again.');
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

  const handleRefresh = () => {
    fetchData();
    fetchRecentTransactions();
    setSearchTerm('');
    setStatusFilter('');
    setPage(0); // Reset to first page
  };

  // Pagination handlers
  const handleChangePage = (newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0); // Reset to first page when changing rows per page
  };

  const handleFirstPage = () => {
    setPage(0);
  };

  const handleLastPage = () => {
    setPage(totalPages - 1);
  };

  const handlePreviousPage = () => {
    setPage(prev => Math.max(prev - 1, 0));
  };

  const handleNextPage = () => {
    setPage(prev => Math.min(prev + 1, totalPages - 1));
  };

  // Get paginated customers
  const paginatedCustomers = filteredCustomers.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

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

  // Get status props for transactions
  const getTransactionStatusProps = (status) => {
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

  // Handle transaction click
  const handleTransactionClick = async (transaction) => {
    setSelectedTransaction(transaction);

    if (transaction.customerId?._id || transaction.customerId) {
      const customerId = transaction.customerId._id || transaction.customerId;
      const details = await fetchCustomerDetails(customerId);
      setCustomerDetails(details);
    } else {
      setCustomerDetails(null);
    }

    setTransactionModalOpen(true);
  };

  // Close transaction modal
  const handleCloseTransactionModal = () => {
    setTransactionModalOpen(false);
    setSelectedTransaction(null);
    setCustomerDetails(null);
  };

  // Calculate loan details based on actual customer data
  const calculateLoanDetails = (transaction) => {
    const currentCustomerData = customerDetails || transaction.customerId;

    const transactionAmount = parseFloat(transaction.amount || 0);
    const totalLoanBalance = parseFloat(currentCustomerData?.loanBalance || 0);
    const arrearsAmount = parseFloat(currentCustomerData?.arrears || currentCustomerData?.arrearsBalance || 0);
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

  return (
    <LayoutWrapper>
      <Box className="customer-page-wrapper page-wrapper-base">
        {/* Header Section - Matching Dashboard Styling */}
        <Box className="page-header-section">
          <Box className="customer-header-content">
            <Box>
              <Typography className="page-subtitle">
                Manage all customer accounts and loan information
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
            </Box>
          </Box>
        </Box>

        {/* Stats and Recent Transactions Section */}
        <div className="customer-stats-grid">
          {/* Stats Cards (3 cards) */}
          <div className="customer-stat-card">
            <div className="customer-stat-header">
              <div className="customer-stat-label">Total Customers</div>
              <div
                className="customer-stat-icon-wrapper"
                style={{ background: 'linear-gradient(135deg, #d4a762, #5c4730)' }}
              >
                <Person sx={{ fontSize: 16 }} />
              </div>
            </div>
            <div>
              <div className="customer-stat-value">
                {customers.length}
              </div>
              <div className="customer-stat-meta">
                Active accounts in system
              </div>
            </div>
          </div>

          <div className="customer-stat-card">
            <div className="customer-stat-header">
              <div className="customer-stat-label">Total Loan Portfolio</div>
              <div
                className="customer-stat-icon-wrapper"
                style={{ background: 'linear-gradient(135deg, #d4a762, #5c4730)' }}
              >
                <AccountBalance sx={{ fontSize: 16 }} />
              </div>
            </div>
            <div>
              <div className="customer-stat-value">
                {formatCurrency(customers.reduce((sum, customer) => sum + parseFloat(customer.loanBalance || 0), 0))}
              </div>
              <div className="customer-stat-meta">
                Combined loan balances
              </div>
            </div>
          </div>

          <div className="customer-stat-card">
            <div className="customer-stat-header">
              <div className="customer-stat-label">In Arrears</div>
              <div
                className="customer-stat-icon-wrapper"
                style={{ background: 'linear-gradient(135deg, #d4a762, #5c4730)' }}
              >
                <Receipt sx={{ fontSize: 16 }} />
              </div>
            </div>
            <div>
              <div className="customer-stat-value">
                {formatCurrency(customers.reduce((sum, customer) => sum + parseFloat(customer.arrears || 0), 0))}
              </div>
              <div className="customer-stat-meta">
                Total overdue amounts
              </div>
            </div>
          </div>
        </div>

        {/* Main Table Section */}
        <Box className="customer-main-content">
          <div className="customer-content-card">
            <div className="customer-section-header">
              <Box>
                <Typography className="customer-section-title">
                  ALL CUSTOMERS ({filteredCustomers.length})
                </Typography>
              </Box>

              {/* SEARCH AND FILTER SECTION */}
              <div className="customer-search-container">
                <input
                  type="text"
                  placeholder="Search by name, phone, email, or ID..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(0); // Reset to first page when searching
                  }}
                  className="customer-search-input"
                />

                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(0); // Reset to first page when filtering
                  }}
                  className="customer-status-filter"
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="arrears">In Arrears</option>
                  <option value="current">Current</option>
                </select>
              </div>
            </div>

            {error && (
              <Alert severity="error" className="customer-alert" sx={{ mx: 1, mt: 1 }}>
                {error}
              </Alert>
            )}

            {loading ? (
              <Box className="customer-loading">
                <LinearProgress />
                <Typography className="customer-loading-text">
                  Loading customers...
                </Typography>
              </Box>
            ) : filteredCustomers.length === 0 ? (
              <div className="table-empty-state">
                <div className="empty-icon">
                  <Search sx={{ fontSize: 48, color: '#d4a762' }} />
                </div>
                <Typography className="empty-title">
                  {searchTerm || statusFilter ? 'No Matching Customers' : 'No Customers Found'}
                </Typography>
                <Typography className="empty-subtitle">
                  {searchTerm || statusFilter 
                    ? 'Try adjusting your search or filter criteria.'
                    : 'No customers have been added yet. Click "Add Customer" to get started.'}
                </Typography>
              </div>
            ) : (
              <>
                <div className="table-container-wrapper">
                  <CustomerTable
                    customers={paginatedCustomers}
                    loading={false}
                    onRefresh={fetchData}
                  />
                </div>

                {/* PAGINATION SECTION */}
                {filteredCustomers.length > 0 && (
                  <div className="customer-pagination">
                    <div className="pagination-info">
                      Showing {page * rowsPerPage + 1} to {Math.min((page + 1) * rowsPerPage, filteredCustomers.length)} of {filteredCustomers.length} customers
                    </div>
                    
                    <div className="pagination-controls">
                      <button
                        className="pagination-btn first-page"
                        onClick={handleFirstPage}
                        disabled={page === 0}
                        title="First Page"
                      >
                        <FirstPage sx={{ fontSize: 16 }} />
                      </button>
                      
                      <button
                        className="pagination-btn prev-page"
                        onClick={handlePreviousPage}
                        disabled={page === 0}
                        title="Previous Page"
                      >
                        <KeyboardArrowLeft sx={{ fontSize: 16 }} />
                      </button>
                      
                      <div className="page-indicator">
                        Page {page + 1} of {totalPages}
                      </div>
                      
                      <button
                        className="pagination-btn next-page"
                        onClick={handleNextPage}
                        disabled={page >= totalPages - 1}
                        title="Next Page"
                      >
                        <KeyboardArrowRight sx={{ fontSize: 16 }} />
                      </button>
                      
                      <button
                        className="pagination-btn last-page"
                        onClick={handleLastPage}
                        disabled={page >= totalPages - 1}
                        title="Last Page"
                      >
                        <LastPage sx={{ fontSize: 16 }} />
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

        {/* Add Customer Dialog */}
        <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            <Typography variant="h6" sx={{ color: '#3c2a1c', fontWeight: 700, fontSize: '0.8125rem', textTransform: 'uppercase' }}>
              Add New Customer
            </Typography>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="Full Name *"
                name="name"
                value={newCustomer.name}
                onChange={handleInputChange}
                margin="normal"
                required
                error={!newCustomer.name}
                helperText={!newCustomer.name ? "Required field" : ""}
                size="small"
              />
              <TextField
                fullWidth
                label="Phone Number *"
                name="phoneNumber"
                value={newCustomer.phoneNumber}
                onChange={handleInputChange}
                margin="normal"
                required
                error={!newCustomer.phoneNumber}
                helperText={!newCustomer.phoneNumber ? "Required field (254XXXXXXXXX)" : ""}
                placeholder="254712345678"
                size="small"
              />
              <TextField
                fullWidth
                label="Email"
                name="email"
                value={newCustomer.email}
                onChange={handleInputChange}
                margin="normal"
                size="small"
              />
              <TextField
                fullWidth
                label="National ID"
                name="nationalId"
                value={newCustomer.nationalId}
                onChange={handleInputChange}
                margin="normal"
                size="small"
              />
              <TextField
                fullWidth
                label="Account Number"
                name="accountNumber"
                value={newCustomer.accountNumber}
                onChange={handleInputChange}
                margin="normal"
                size="small"
              />
              <TextField
                fullWidth
                label="Loan Balance"
                name="loanBalance"
                value={newCustomer.loanBalance}
                onChange={handleInputChange}
                margin="normal"
                type="number"
                InputProps={{ inputProps: { min: 0 } }}
                size="small"
              />
              <TextField
                fullWidth
                label="Arrears"
                name="arrears"
                value={newCustomer.arrears}
                onChange={handleInputChange}
                margin="normal"
                type="number"
                InputProps={{ inputProps: { min: 0 } }}
                size="small"
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <button
              className="customer-secondary-dialog-btn"
              onClick={() => setOpenDialog(false)}
            >
              Cancel
            </button>
            <button
              className="customer-primary-dialog-btn"
              onClick={handleSubmit}
              disabled={!newCustomer.name || !newCustomer.phoneNumber}
            >
              Save Customer
            </button>
          </DialogActions>
        </Dialog>

        {/* Transaction Details Modal */}
        <Modal
          open={transactionModalOpen}
          onClose={handleCloseTransactionModal}
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
                    onClick={handleCloseTransactionModal}
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
                            const statusProps = getTransactionStatusProps(selectedTransaction.status);
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
                    onClick={handleCloseTransactionModal}
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

export default CustomerPage;