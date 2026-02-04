// src/pages/CustomerPage.jsx
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
import authService from '../services/auth.service'; // Import auth service
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
  
  // User role state
  const [userRole, setUserRole] = useState('officer');
  
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phoneNumber: '',
    email: '',
    nationalId: '',
    loanBalance: '',
    arrears: '',
    accountNumber: ''
  });

  // Get user role from auth service
  const getUserRole = () => {
    const user = authService.getCurrentUser();
    return user?.role || 'officer';
  };

  useEffect(() => {
    // Add auth debugging
    console.log('🔐 CustomerPage mounted - Auth status:', {
      isAuthenticated: authService.isAuthenticated(),
      token: authService.getToken() ? 'Present' : 'Missing',
      user: authService.getCurrentUser(),
      localStorageKeys: Object.keys(localStorage)
    });

    if (!authService.isAuthenticated()) {
      console.log('❌ Not authenticated, redirecting to login');
      authService.logout();
      navigate('/login');
      return;
    }

    const role = getUserRole();
    setUserRole(role);
    console.log('👤 User role:', role);
    
    fetchData();
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
        customer.nationalId?.includes(term) ||
        (customer.assignedTo?.fullName?.toLowerCase().includes(term)) ||
        (customer.assignedTo?.username?.toLowerCase().includes(term))
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
      } else if (statusFilter === 'assigned') {
        result = result.filter(customer => customer.assignedTo);
      } else if (statusFilter === 'unassigned') {
        result = result.filter(customer => !customer.assignedTo);
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

      console.log('🔍 CustomerPage: Starting data fetch...');
      
      // Check authentication first
      if (!authService.isAuthenticated()) {
        console.log('❌ Not authenticated, redirecting to login');
        authService.logout();
        navigate('/login');
        return;
      }

      // Use authService.getApi() instead of creating new axios instance
      const api = authService.getApi();
      console.log('🔑 API headers:', api.defaults.headers);

      let customersData = [];
      const currentRole = getUserRole();
      
      console.log(`👤 Fetching customers for ${currentRole}...`);

      // Fetch customers based on role
      if (currentRole === 'officer') {
        // For officers: fetch only their assigned customers
        try {
          const response = await api.get('/customers/assigned-to-me');
          console.log('📋 Officer assigned customers response:', response.data);
          
          if (response.data.success) {
            customersData = response.data.data?.customers || response.data.customers || [];
            console.log(`✅ Found ${customersData.length} assigned customers for officer`);
          } else {
            // Fallback: try to get all customers and filter
            console.log('⚠️ Using fallback method for officer customers');
            const allResponse = await api.get('/customers?limit=1000');
            const allCustomers = allResponse.data.data?.customers || [];
            
            // Get current user ID
            const user = authService.getCurrentUser();
            const userId = user?.id;
            
            if (userId) {
              customersData = allCustomers.filter(customer => 
                customer.assignedTo?._id === userId ||
                customer.assignedTo?._id?.toString() === userId ||
                customer.assignedTo === userId ||
                customer.assignedTo?.toString() === userId
              );
            } else {
              customersData = allCustomers;
            }
          }
        } catch (officerError) {
          console.error('❌ Error fetching assigned customers:', officerError);
          console.error('Error details:', {
            status: officerError.response?.status,
            message: officerError.response?.data?.message
          });
          
          // Check if it's a 401 error
          if (officerError.response?.status === 401) {
            console.log('⚠️ 401 Unauthorized - logging out');
            authService.logout();
            navigate('/login');
            return;
          }
          
          // Fallback to all customers
          try {
            const response = await api.get('/customers?limit=100');
            customersData = response.data.data?.customers || response.data.customers || [];
          } catch (fallbackError) {
            console.error('❌ Fallback also failed:', fallbackError);
            throw fallbackError;
          }
        }
      } else {
        // For admins/supervisors: fetch all customers
        try {
          const response = await api.get('/customers?limit=1000');
          customersData = response.data.data?.customers || response.data.customers || [];
          console.log(`✅ Found ${customersData.length} customers for ${currentRole}`);
        } catch (error) {
          console.error('❌ Error fetching all customers:', error);
          if (error.response?.status === 401) {
            console.log('⚠️ 401 Unauthorized - logging out');
            authService.logout();
            navigate('/login');
            return;
          }
          throw error;
        }
      }

      // Sort by created date (newest first)
      const sortedCustomers = customersData.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateB - dateA;
      });
      
      setCustomers(sortedCustomers);
      setFilteredCustomers(sortedCustomers);
      
      console.log(`📊 Displaying ${sortedCustomers.length} customers for ${currentRole}`);

    } catch (error) {
      console.error('❌ Error fetching data:', error);
      console.error('Error details:', {
        status: error.response?.status,
        message: error.response?.data?.message,
        data: error.response?.data
      });

      if (error.response?.status === 401) {
        console.log('⚠️ 401 Unauthorized - logging out');
        authService.logout();
        navigate('/login');
        return;
      }

      setError(error.response?.data?.message || 'Failed to load customer data. Please try again.');
    } finally {
      setLoading(false);
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
      console.log('➕ Creating new customer...');
      
      // Check authentication
      if (!authService.isAuthenticated()) {
        console.log('❌ Not authenticated');
        authService.logout();
        navigate('/login');
        return;
      }

      const api = authService.getApi();
      
      const response = await api.post('/customers', {
        ...newCustomer,
        loanBalance: parseFloat(newCustomer.loanBalance) || 0,
        arrears: parseFloat(newCustomer.arrears) || 0
      });

      if (response.data.success) {
        console.log('✅ Customer created successfully');
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
        console.error('❌ Customer creation failed:', response.data.message);
        setError(response.data.message || 'Failed to create customer');
      }
    } catch (error) {
      console.error('❌ Error creating customer:', error);
      console.error('Error details:', {
        status: error.response?.status,
        message: error.response?.data?.message
      });

      if (error.response?.status === 401) {
        console.log('⚠️ 401 Unauthorized - logging out');
        authService.logout();
        navigate('/login');
        return;
      }

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
    console.log('🔄 Refreshing customer data...');
    fetchData();
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

  // Calculate stats
  const calculateStats = () => {
    const totalCustomers = customers.length;
    const totalLoanPortfolio = customers.reduce((sum, customer) => 
      sum + parseFloat(customer.loanBalance || 0), 0);
    const totalArrears = customers.reduce((sum, customer) => 
      sum + parseFloat(customer.arrears || 0), 0);
    
    return { totalCustomers, totalLoanPortfolio, totalArrears };
  };

  const stats = calculateStats();

  return (
    <LayoutWrapper>
      <Box className="customer-page-wrapper page-wrapper-base">
        {/* Header Section */}
        <Box className="page-header-section">
          <Box className="customer-header-content">
            <Box>
              <Typography className="page-subtitle">
                {userRole === 'officer' 
                  ? 'My Assigned Customers' 
                  : 'Manage All Customer Accounts'}
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

        {/* Stats Section - Similar to Dashboard */}
        <div className="customer-stats-grid">
          <div className="customer-stat-card">
            <div className="customer-stat-header">
              <div className="customer-stat-label">
                {userRole === 'officer' ? 'My Customers' : 'Total Customers'}
              </div>
              <div className="customer-stat-icon-wrapper">
                <Person sx={{ fontSize: 16 }} />
              </div>
            </div>
            <div>
              <div className="customer-stat-value">
                {stats.totalCustomers}
              </div>
              <div className="customer-stat-meta">
                {userRole === 'officer' 
                  ? 'Customers assigned to me' 
                  : 'Active accounts in system'}
              </div>
            </div>
          </div>

          <div className="customer-stat-card">
            <div className="customer-stat-header">
              <div className="customer-stat-label">
                {userRole === 'officer' ? 'My Portfolio' : 'Total Loan Portfolio'}
              </div>
              <div className="customer-stat-icon-wrapper">
                <AccountBalance sx={{ fontSize: 16 }} />
              </div>
            </div>
            <div>
              <div className="customer-stat-value">
                {formatCurrency(stats.totalLoanPortfolio)}
              </div>
              <div className="customer-stat-meta">
                {userRole === 'officer' 
                  ? 'Total loan balance assigned' 
                  : 'Combined loan balances'}
              </div>
            </div>
          </div>

          <div className="customer-stat-card">
            <div className="customer-stat-header">
              <div className="customer-stat-label">
                {userRole === 'officer' ? 'My Arrears' : 'In Arrears'}
              </div>
              <div className="customer-stat-icon-wrapper">
                <Receipt sx={{ fontSize: 16 }} />
              </div>
            </div>
            <div>
              <div className="customer-stat-value">
                {formatCurrency(stats.totalArrears)}
              </div>
              <div className="customer-stat-meta">
                {userRole === 'officer' 
                  ? 'Total arrears assigned' 
                  : 'Total overdue amounts'}
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
                  {userRole === 'officer' 
                    ? `MY ASSIGNED CUSTOMERS (${filteredCustomers.length})` 
                    : `ALL CUSTOMERS (${filteredCustomers.length})`}
                </Typography>
              </Box>

              {/* SEARCH AND FILTER SECTION */}
              <div className="customer-search-container">
                <input
                  type="text"
                  placeholder="Search by name, phone, email, ID, or assigned officer..."
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
                  {(userRole === 'admin' || userRole === 'supervisor') && (
                    <>
                      <option value="assigned">Assigned</option>
                      <option value="unassigned">Unassigned</option>
                    </>
                  )}
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
                  {userRole === 'officer' 
                    ? 'Loading your assigned customers...' 
                    : 'Loading customers...'}
                </Typography>
              </Box>
            ) : filteredCustomers.length === 0 ? (
              <div className="table-empty-state">
                <div className="empty-icon">
                  <Search sx={{ fontSize: 48, color: '#d4a762' }} />
                </div>
                <Typography className="empty-title">
                  {userRole === 'officer' 
                    ? 'No Assigned Customers Found' 
                    : 'No Customers Found'}
                </Typography>
                <Typography className="empty-subtitle">
                  {userRole === 'officer' 
                    ? 'No customers have been assigned to you yet.' 
                    : searchTerm || statusFilter 
                      ? 'Try adjusting your search or filter criteria.'
                      : 'No customers have been added yet. Click "Add Customer" to get started.'}
                </Typography>
                {userRole !== 'officer' && !searchTerm && !statusFilter && (
                  <button
                    className="customer-primary-btn"
                    onClick={() => setOpenDialog(true)}
                    style={{ marginTop: '1rem' }}
                  >
                    <AddIcon sx={{ fontSize: 16, mr: 0.5 }} />
                    Add First Customer
                  </button>
                )}
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

        {/* Add Customer Dialog - Only for non-officers */}
        {(userRole === 'admin' || userRole === 'supervisor') && (
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
        )}
      </Box>
    </LayoutWrapper>
  );
};

export default CustomerPage;