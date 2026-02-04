// src/components/common/CustomerTable.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  LinearProgress
} from '@mui/material';
import { Person } from '@mui/icons-material';

const CustomerTable = ({ customers, loading, onRefresh }) => {
  const navigate = useNavigate();

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

  const formatCurrency = (amount) => {
    const numAmount = parseFloat(amount || 0);
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numAmount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-KE', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return 'Never';
    }
  };

  const getStatusColor = (arrearsAmount) => {
    const amount = parseFloat(arrearsAmount || 0);
    if (amount === 0) return '#27ae60'; // Green for current
    if (amount <= 1000) return '#f39c12'; // Orange for warning
    return '#e74c3c'; // Red for delinquent
  };

  const handleRowClick = (customer) => {
    navigate(`/customers/${customer._id || customer.id}`);
  };

  if (loading) {
    return (
      <Box className="customer-loading">
        <LinearProgress />
        <Typography className="customer-loading-text">
          Loading customers...
        </Typography>
      </Box>
    );
  }

  if (!customers || customers.length === 0) {
    return (
      <div className="table-empty-state">
        <div className="empty-icon">👥</div>
        <Typography className="empty-title">
          No Customers Found
        </Typography>
        <Typography className="empty-subtitle">
          {getUserRole() === 'officer' 
            ? 'No customers are assigned to you yet' 
            : 'Add a new customer to get started'}
        </Typography>
      </div>
    );
  }

  const userRole = getUserRole();
  const showAssignedColumn = userRole === 'admin' || userRole === 'supervisor';

  return (
    <TableContainer component={Paper} elevation={0} sx={{ border: 'none', boxShadow: 'none', borderRadius: 0 }}>
      <Table sx={{ minWidth: 800 }} size="small">
        <TableHead>
          <TableRow sx={{ backgroundColor: '#faf9f8' }}>
            <TableCell className="customer-table-header-cell" sx={{ width: showAssignedColumn ? '20%' : '25%' }}>
              Customer
            </TableCell>
            <TableCell className="customer-table-header-cell" sx={{ width: showAssignedColumn ? '20%' : '25%' }} align="left">
              Contact
            </TableCell>
            {showAssignedColumn && (
              <TableCell className="customer-table-header-cell" sx={{ width: '15%' }} align="left">
                Assigned To
              </TableCell>
            )}
            <TableCell className="customer-table-header-cell" sx={{ width: '12%' }} align="right">
              Arrears
            </TableCell>
            <TableCell className="customer-table-header-cell" sx={{ width: '15%' }} align="right">
              Loan Balance
            </TableCell>
            <TableCell className="customer-table-header-cell" sx={{ width: showAssignedColumn ? '13%' : '15%' }} align="center">
              Last Payment
            </TableCell>
            {/*<TableCell className="customer-table-header-cell" sx={{ width: showAssignedColumn ? '10%' : '10%' }} align="center">
              Status
            </TableCell>*/}
          </TableRow>
        </TableHead>
        <TableBody>
          {customers.map((customer) => {
            const arrearsColor = getStatusColor(customer.arrears);
            const isInArrears = parseFloat(customer.arrears || 0) > 0;
            const assignedOfficer = customer.assignedTo || {};
            
            return (
              <TableRow
                key={customer._id || customer.id}
                className="customer-table-row"
                onClick={() => handleRowClick(customer)}
                hover
                sx={{ 
                  '&:last-child td, &:last-child th': { border: 0 },
                  height: '52px',
                  cursor: 'pointer'
                }}
              >
                <TableCell className="customer-table-cell" component="th" scope="row" sx={{ width: showAssignedColumn ? '20%' : '25%' }}>
                  <div className="customer-name-container">
                    <Typography className="customer-name-text">
                      {customer.name || 'Unnamed Customer'}
                    </Typography>
                    <Typography className="customer-account-text">
                      {customer.accountNumber || 'No Account'}
                    </Typography>
                  </div>
                </TableCell>
                <TableCell className="customer-table-cell" align="left" sx={{ width: showAssignedColumn ? '20%' : '25%' }}>
                  <div className="customer-contact-container">
                    <Typography className="customer-phone-text">
                      {customer.phoneNumber || 'N/A'}
                    </Typography>
                    <Typography className="customer-email-text">
                      {customer.email || 'No email'}
                    </Typography>
                  </div>
                </TableCell>
                
                {showAssignedColumn && (
                  <TableCell className="customer-table-cell" align="left" sx={{ width: '15%' }}>
                    <div className="assigned-officer-container">
                      {assignedOfficer.fullName || assignedOfficer.username ? (
                        <>
                          <Person sx={{ fontSize: 14, color: '#5c4730', mr: 0.5 }} />
                          <Typography className="assigned-officer-text">
                            {assignedOfficer.fullName || assignedOfficer.username}
                          </Typography>
                        </>
                      ) : (
                        <Typography className="unassigned-text">
                          Unassigned
                        </Typography>
                      )}
                    </div>
                  </TableCell>
                )}
                
                <TableCell className="customer-table-cell amount-cell" align="right" sx={{ width: '12%' }}>
                  <Typography sx={{ 
                    fontSize: '0.75rem', 
                    fontWeight: 700, 
                    color: arrearsColor,
                    lineHeight: '1.2'
                  }}>
                    {formatCurrency(customer.arrears)}
                  </Typography>
                </TableCell>
                
                <TableCell className="customer-table-cell amount-cell" align="right" sx={{ width: '15%' }}>
                  <Typography sx={{ 
                    fontSize: '0.75rem', 
                    fontWeight: 700,
                    color: '#3c2a1c',
                    lineHeight: '1.2'
                  }}>
                    {formatCurrency(customer.loanBalance)}
                  </Typography>
                </TableCell>
                
                <TableCell className="customer-table-cell" align="center" sx={{ width: showAssignedColumn ? '13%' : '15%' }}>
                  <Typography sx={{ 
                    fontSize: '0.75rem', 
                    fontWeight: 350,
                    color: '#3c2a1c',
                    lineHeight: '1.2'
                  }} className="last-payment-text">
                    {customer.lastPaymentDate 
                      ? formatDate(customer.lastPaymentDate)
                      : 'No payments'}
                  </Typography>
                </TableCell>
                
                {/*<TableCell className="customer-table-cell" align="center" sx={{ width: showAssignedColumn ? '10%' : '10%' }}>
                  <span 
                    className={`status-badge ${isInArrears ? 'status-arrears' : 'status-current'}`}
                    style={{ 
                      backgroundColor: isInArrears ? 'rgba(231, 76, 60, 0.1)' : 'rgba(39, 174, 96, 0.1)',
                      color: isInArrears ? '#e74c3c' : '#27ae60',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '0.6875rem',
                      fontWeight: 600,
                      display: 'inline-block'
                    }}
                  >
                    {isInArrears ? 'In Arrears' : 'Current'}
                  </span>
                </TableCell>*/}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default CustomerTable;