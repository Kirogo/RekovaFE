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
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Refresh,
  Search,
  Person,
  AccountBalance,
  Receipt,
  SupervisorAccount,
  Groups,
  AssignmentInd
} from '@mui/icons-material';
import CustomerTable from '../components/common/CustomerTable';
import { authAxios } from '../services/api';
import LayoutWrapper from '../LayoutWrapper';
import authService from '../services/auth.service';
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

  // User role state
  const [userRole, setUserRole] = useState('officer');
  const [isSupervisor, setIsSupervisor] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

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

    const userInfo = getUserInfo();
    setUserRole(userInfo.role);
    setIsSupervisor(userInfo.isSupervisor);
    setIsAdmin(userInfo.isAdmin);

    console.log('👤 CustomerPage - Setting user role:', {
      role: userInfo.role,
      isSupervisor: userInfo.isSupervisor,
      isAdmin: userInfo.isAdmin
    });

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

      if (!authService.isAuthenticated()) {
        console.log('❌ Not authenticated, redirecting to login');
        authService.logout();
        navigate('/login');
        return;
      }

      const userInfo = getUserInfo();

      console.log(`👤 Fetching customers for ${userInfo.role} (${userInfo.username})...`);

      const route = userInfo.isSupervisor || userInfo.isAdmin ? '/customers' : '/customers/assigned-to-me';

      try {
        const response = await authAxios.get(route);
        console.log(`📋 ${userInfo.role} customers response:`, response.data);

        let customersData = [];
        if (response.data.success) {
          if (response.data.data?.items) {
            customersData = response.data.data.items;
          } else if (response.data.data?.customers) {
            customersData = response.data.data.customers;
          } else if (Array.isArray(response.data.data)) {
            customersData = response.data.data;
          } else if (Array.isArray(response.data.customers)) {
            customersData = response.data.customers;
          }

          console.log(`✅ Found ${customersData.length} customers for ${userInfo.role}`);
        } else {
          console.log('⚠️ Using fallback method for customers');
          const allResponse = await authAxios.get('/customers?limit=1000');
          const allCustomers = allResponse.data.data?.items ||
            allResponse.data.data?.customers ||
            allResponse.data.customers ||
            [];

          if (userInfo.role === 'officer' && userInfo.userId) {
            customersData = allCustomers.filter(customer => {
              const assignedTo = customer.assignedToUserId || customer.assignedTo;
              if (!assignedTo) return false;
              return assignedTo === userInfo.userId ||
                assignedTo.toString() === userInfo.userId ||
                assignedTo._id === userInfo.userId;
            });
            console.log(`🔍 Filtered ${customersData.length} customers assigned to officer ${userInfo.userId}`);
          } else {
            customersData = allCustomers;
          }
        }

        const sortedCustomers = customersData.sort((a, b) => {
          const dateA = new Date(a.createdAt || 0);
          const dateB = new Date(b.createdAt || 0);
          return dateB - dateA;
        });

        setCustomers(sortedCustomers);
        setFilteredCustomers(sortedCustomers);

        console.log(`📊 Displaying ${sortedCustomers.length} customers for ${userInfo.role}`);

      } catch (fetchError) {
        console.error(`❌ Error fetching ${userInfo.role} customers:`, fetchError);

        if (fetchError.response?.status === 401) {
          console.log('⚠️ 401 Unauthorized - logging out');
          authService.logout();
          navigate('/login');
          return;
        }

        throw fetchError;
      }

    } catch (error) {
      console.error('❌ Error fetching data:', error);

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

  // Calculate stats
  const calculateStats = () => {
    const totalCustomers = customers.length;
    const totalLoanPortfolio = customers.reduce((sum, customer) =>
      sum + parseFloat(customer.loanBalance || 0), 0);
    const totalArrears = customers.reduce((sum, customer) =>
      sum + parseFloat(customer.arrears || 0), 0);

    // For supervisors/admins, also calculate assigned vs unassigned
    let assignedCustomers = 0;
    let unassignedCustomers = 0;

    if (isSupervisor || isAdmin) {
      customers.forEach(customer => {
        if (customer.assignedTo) {
          assignedCustomers++;
        } else {
          unassignedCustomers++;
        }
      });
    }

    return {
      totalCustomers,
      totalLoanPortfolio,
      totalArrears,
      assignedCustomers,
      unassignedCustomers
    };
  };

  const stats = calculateStats();

  // Get role-based icon
  const getRoleIcon = () => {
    if (isSupervisor) return <SupervisorAccount sx={{ fontSize: 16 }} />;
    if (isAdmin) return <Groups sx={{ fontSize: 16 }} />;
    return <AssignmentInd sx={{ fontSize: 16 }} />;
  };

  // Get role-based subtitle
  const getRoleSubtitle = () => {
    if (isSupervisor) return 'Supervisor - Manage All Customer Accounts';
    if (isAdmin) return 'Administrator - Full System Access';
    return 'Officer - My Assigned Customers';
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

  return (
    <LayoutWrapper>
      <Box className="customer-page-wrapper">
        {/* Header Section */}
        <Box className="page-header-section">
          <Box className="customer-header-content">
            <Box>
              {/*<Typography className={`page-subtitle ${getRoleTextColor()}`}>
                {getRoleSubtitle()}
              </Typography>*/}
              <Typography className={`page-title ${getRoleTextColor()}`}>
                {isSupervisor || isAdmin ? 'Customer Management' : 'My Customers'}
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
              {(isSupervisor || isAdmin) && (
                <button
                  className={`customer-primary-btn ${getRolePrimaryClass()}`}
                  onClick={() => setOpenDialog(true)}
                >
                  <AddIcon sx={{ fontSize: 16, mr: 0.5 }} />
                  Add Customer
                </button>
              )}
            </Box>
          </Box>
        </Box>

        {/* Stats Section - Role-based styling */}
        <div className="customer-stats-grid">
          {[
            {
              title: isSupervisor || isAdmin ? 'Total Customers' : 'My Customers',
              value: stats.totalCustomers,
              icon: <Person sx={{ fontSize: 16 }} />,
              meta: isSupervisor || isAdmin ? 'Active accounts in system' : 'Customers assigned to me'
            },
            {
              title: isSupervisor || isAdmin ? 'Total Loan Portfolio' : 'My Portfolio',
              value: formatCurrency(stats.totalLoanPortfolio),
              icon: <AccountBalance sx={{ fontSize: 16 }} />,
              meta: isSupervisor || isAdmin ? 'Combined loan balances' : 'Total loan balance assigned'
            },
            {
              title: isSupervisor || isAdmin ? 'In Arrears' : 'My Arrears',
              value: formatCurrency(stats.totalArrears),
              icon: <Receipt sx={{ fontSize: 16 }} />,
              meta: isSupervisor || isAdmin ? 'Total overdue amounts' : 'Total arrears assigned'
            },
            ...(isSupervisor || isAdmin ? [
              {
                title: 'Assigned Customers',
                value: stats.assignedCustomers,
                icon: <AssignmentInd sx={{ fontSize: 16 }} />,
                meta: 'Customers with assigned officers'
              },
              {
                title: 'Unassigned Customers',
                value: stats.unassignedCustomers,
                icon: <Groups sx={{ fontSize: 16 }} />,
                meta: 'Customers needing assignment'
              },
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

        {/* Main Table Section */}
        <Box className="customer-main-content">
          <div className="customer-content-card">
            <div className="customer-section-header">
              <Box>
                <Typography className={`customer-section-title ${getRoleTextColor()}`}>
                  {isSupervisor || isAdmin
                    ? `ALL CUSTOMERS (${filteredCustomers.length})`
                    : `MY ASSIGNED CUSTOMERS (${filteredCustomers.length})`}
                  <div className={`section-title-underline ${getRoleAccentClass()}`}></div>
                </Typography>
              </Box>

              {/* SEARCH AND FILTER SECTION */}
              <div className="customer-search-container">
                <input
                  type="text"
                  placeholder={isSupervisor || isAdmin
                    ? "Search by name, phone, email, ID, or assigned officer..."
                    : "Search your customers by name, phone, or email..."}
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
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="arrears">In Arrears</option>
                  <option value="current">Current</option>
                  {(isSupervisor || isAdmin) && (
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
                <LinearProgress className={`loading-bar ${getRoleAccentClass()}`} />
                <Typography className="customer-loading-text">
                  {isSupervisor || isAdmin
                    ? 'Loading all customers...'
                    : 'Loading your assigned customers...'}
                </Typography>
              </Box>
            ) : filteredCustomers.length === 0 ? (
              <div className="table-empty-state">
                <div className="empty-icon">
                  <Search sx={{ fontSize: 48 }} />
                </div>
                <Typography className={`empty-title ${getRoleTextColor()}`}>
                  {isSupervisor || isAdmin
                    ? 'No Customers Found'
                    : 'No Assigned Customers Found'}
                </Typography>
                <Typography className="empty-subtitle">
                  {isSupervisor || isAdmin
                    ? (searchTerm || statusFilter
                      ? 'Try adjusting your search or filter criteria.'
                      : 'No customers have been added yet. Click "Add Customer" to get started.')
                    : 'No customers have been assigned to you yet.'}
                </Typography>
                {(isSupervisor || isAdmin) && !searchTerm && !statusFilter && (
                  <button
                    className={`customer-primary-btn ${getRolePrimaryClass()}`}
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
                    userRole={userRole}
                    isSupervisor={isSupervisor}
                    isAdmin={isAdmin}
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
                        &laquo;
                      </button>

                      <button
                        className="pagination-btn prev-page"
                        onClick={handlePreviousPage}
                        disabled={page === 0}
                        title="Previous Page"
                      >
                        &lsaquo;
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
                        &rsaquo;
                      </button>

                      <button
                        className="pagination-btn last-page"
                        onClick={handleLastPage}
                        disabled={page >= totalPages - 1}
                        title="Last Page"
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

        {/* Add Customer Dialog - Only for supervisors/admins */}
        {(isSupervisor || isAdmin) && (
          <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
            <DialogTitle>
              <Typography variant="h6" className={getRoleTextColor()}>
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
                className={`customer-primary-dialog-btn ${getRolePrimaryClass()}`}
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