// src/components/common/CustomerTable.jsx - UPDATED WITH ASSIGNED OFFICER VISUALIZATION
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
  LinearProgress,
  Avatar,
  Tooltip,
  IconButton
} from '@mui/material';
import { Person, AssignmentInd, SupervisorAccount, Groups, Visibility } from '@mui/icons-material';

const CustomerTable = ({ customers, loading, onRefresh, isSupervisor, isAdmin }) => {
  const navigate = useNavigate();

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

  // Get officer info from customer data (similar to SupervisorDashboard)
  const getOfficerInfo = (customer) => {
    const assignedTo = customer.assignedTo;
    
    if (!assignedTo) return null;
    
    // Handle different data structures
    if (typeof assignedTo === 'object') {
      return {
        name: assignedTo.fullName || assignedTo.name || assignedTo.username || 'Unknown Officer',
        username: assignedTo.username || '',
        role: assignedTo.role || 'officer',
        userId: assignedTo._id || assignedTo.id,
        email: assignedTo.email || '',
        phone: assignedTo.phone || ''
      };
    }
    
    // If assignedTo is just an ID string
    return {
      name: 'Officer',
      username: 'officer',
      role: 'officer',
      userId: assignedTo
    };
  };

  // Get role color (matching SupervisorDashboard styling)
  const getRoleColor = (role) => {
    switch (role?.toLowerCase()) {
      case 'supervisor':
        return '#2c3e50'; // Dark gray
      case 'admin':
        return '#1a252f'; // Darker gray
      case 'officer':
      default:
        return '#5c4730'; // Brown
    }
  };

  // Get role icon (matching SupervisorDashboard)
  const getRoleIcon = (role) => {
    switch (role?.toLowerCase()) {
      case 'supervisor':
        return <SupervisorAccount sx={{ fontSize: 12 }} />;
      case 'admin':
        return <Groups sx={{ fontSize: 12 }} />;
      case 'officer':
      default:
        return <Person sx={{ fontSize: 12 }} />;
    }
  };

  // Get initials for avatar
  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Handle officer view click
  const handleOfficerViewClick = (e, officerInfo) => {
    e.stopPropagation(); // Prevent row click
    if (officerInfo?.userId) {
      navigate(`/users/${officerInfo.userId}`);
    }
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
          {isSupervisor || isAdmin 
            ? 'Add a new customer to get started' 
            : 'No customers are assigned to you yet'}
        </Typography>
      </div>
    );
  }

  // Determine if we should show the assigned officer column
  const showAssignedColumn = isSupervisor || isAdmin;

  return (
    <TableContainer component={Paper} elevation={0} sx={{ border: 'none', boxShadow: 'none', borderRadius: 0 }}>
      <Table sx={{ minWidth: 800 }} size="small">
        <TableHead>
          <TableRow sx={{ backgroundColor: '#faf9f8' }}>
            <TableCell className="customer-table-header-cell" sx={{ width: showAssignedColumn ? '20%' : '25%' }}>
              Customer
            </TableCell>
            <TableCell className="customer-table-header-cell" sx={{ width: showAssignedColumn ? '15%' : '20%' }} align="left">
              Contact
            </TableCell>
            {showAssignedColumn && (
              <TableCell className="customer-table-header-cell" sx={{ width: '20%' }} align="left">
                Assigned Officer
              </TableCell>
            )}
            <TableCell className="customer-table-header-cell" sx={{ width: '10%' }} align="right">
              Loan Balance
            </TableCell>
            <TableCell className="customer-table-header-cell" sx={{ width: '10%' }} align="right">
              Arrears
            </TableCell>
            <TableCell className="customer-table-header-cell" sx={{ width: showAssignedColumn ? '15%' : '20%' }} align="center">
              Last Payment
            </TableCell>
            <TableCell className="customer-table-header-cell" sx={{ width: showAssignedColumn ? '10%' : '15%' }} align="center">
              Status
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {customers.map((customer) => {
            const arrearsColor = getStatusColor(customer.arrears);
            const isInArrears = parseFloat(customer.arrears || 0) > 0;
            const officerInfo = getOfficerInfo(customer);
            const roleColor = getRoleColor(officerInfo?.role);
            
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
                      {customer.accountNumber || 'No Account'} • {customer.nationalId || 'No ID'}
                    </Typography>
                  </div>
                </TableCell>
                <TableCell className="customer-table-cell" align="left" sx={{ width: showAssignedColumn ? '15%' : '20%' }}>
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
                  <TableCell className="customer-table-cell" align="left" sx={{ width: '20%' }}>
                    <div className="assigned-officer-container" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {officerInfo ? (
                        <>
                          <Tooltip title={`View ${officerInfo.name}'s profile`}>
                            <div 
                              className="officer-avatar-container"
                              style={{ 
                                position: 'relative',
                                width: '32px',
                                height: '32px',
                                cursor: 'pointer'
                              }}
                              onClick={(e) => handleOfficerViewClick(e, officerInfo)}
                            >
                              <Avatar 
                                sx={{ 
                                  width: '100%',
                                  height: '100%',
                                  fontSize: '0.75rem',
                                  bgcolor: roleColor,
                                  color: 'white',
                                  fontWeight: 600
                                }}
                              >
                                {getInitials(officerInfo.name)}
                              </Avatar>
                              <div className="role-badge" style={{
                                position: 'absolute',
                                bottom: '-3px',
                                right: '-3px',
                                width: '14px',
                                height: '14px',
                                borderRadius: '50%',
                                backgroundColor: roleColor,
                                border: '2px solid white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}>
                                {getRoleIcon(officerInfo.role)}
                              </div>
                            </div>
                          </Tooltip>
                          <div className="officer-info" style={{ flex: 1 }}>
                            <Typography className="officer-name" sx={{ 
                              fontSize: '0.75rem', 
                              fontWeight: 600,
                              color: '#2c3e50',
                              lineHeight: '1.2',
                              cursor: 'pointer',
                              '&:hover': {
                                color: roleColor,
                                textDecoration: 'underline'
                              }
                            }}
                            onClick={(e) => handleOfficerViewClick(e, officerInfo)}
                            >
                              {officerInfo.name}
                            </Typography>
                            <div className="officer-details" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <Typography className="officer-role-badge" sx={{ 
                                fontSize: '0.6rem', 
                                fontWeight: 600,
                                textTransform: 'uppercase',
                                letterSpacing: '0.15px',
                                padding: '1px 4px',
                                borderRadius: '2px',
                                backgroundColor: roleColor + '20',
                                color: roleColor,
                                display: 'inline-block'
                              }}>
                                {officerInfo.role}
                              </Typography>
                              {officerInfo.username && (
                                <Typography className="officer-username" sx={{ 
                                  fontSize: '0.625rem', 
                                  color: '#666',
                                  lineHeight: '1.2'
                                }}>
                                  @{officerInfo.username}
                                </Typography>
                              )}
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="unassigned-container" style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '0.5rem',
                          color: '#666',
                          width: '100%'
                        }}>
                          <AssignmentInd sx={{ fontSize: 18, color: '#ccc' }} />
                          <div>
                            <Typography sx={{ 
                              fontSize: '0.75rem', 
                              fontWeight: 600,
                              color: '#999',
                              lineHeight: '1.2',
                              fontStyle: 'italic'
                            }}>
                              Unassigned
                            </Typography>
                            <Typography sx={{ 
                              fontSize: '0.625rem', 
                              color: '#ccc',
                              lineHeight: '1.2'
                            }}>
                              No officer assigned
                            </Typography>
                          </div>
                        </div>
                      )}
                    </div>
                  </TableCell>
                )}
                
                <TableCell className="customer-table-cell amount-cell" align="right" sx={{ width: '10%' }}>
                  <Typography sx={{ 
                    fontSize: '0.75rem', 
                    fontWeight: 700,
                    color: '#3c2a1c',
                    lineHeight: '1.2'
                  }}>
                    {formatCurrency(customer.loanBalance)}
                  </Typography>
                </TableCell>
                
                <TableCell className="customer-table-cell amount-cell" align="right" sx={{ width: '10%' }}>
                  <Typography sx={{ 
                    fontSize: '0.75rem', 
                    fontWeight: 700, 
                    color: arrearsColor,
                    lineHeight: '1.2'
                  }}>
                    {formatCurrency(customer.arrears)}
                  </Typography>
                </TableCell>
                
                <TableCell className="customer-table-cell" align="center" sx={{ width: showAssignedColumn ? '15%' : '20%' }}>
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
                
                <TableCell className="customer-table-cell" align="center" sx={{ width: showAssignedColumn ? '10%' : '15%' }}>
                  <span 
                    className={`status-badge ${isInArrears ? 'status-arrears' : 'status-current'}`}
                    style={{ 
                      backgroundColor: isInArrears ? 'rgba(231, 76, 60, 0.1)' : 'rgba(39, 174, 96, 0.1)',
                      color: isInArrears ? '#e74c3c' : '#27ae60',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '0.6875rem',
                      fontWeight: 600,
                      display: 'inline-block',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      border: `1px solid ${isInArrears ? 'rgba(231, 76, 60, 0.2)' : 'rgba(39, 174, 96, 0.2)'}`
                    }}
                  >
                    {isInArrears ? 'In Arrears' : 'Current'}
                  </span>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default CustomerTable;