// src/components/common/CustomerTable.jsx - UPDATED WITH INCREASED ROW HEIGHT
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

const CustomerTable = ({ customers, loading, onRefresh }) => {
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
          Add a new customer to get started
        </Typography>
      </div>
    );
  }

  return (
    <TableContainer component={Paper} elevation={0} sx={{ border: 'none', boxShadow: 'none', borderRadius: 0 }}>
      <Table sx={{ minWidth: 800 }} size="small">
        <TableHead>
          <TableRow sx={{ backgroundColor: '#faf9f8' }}>
            <TableCell className="customer-table-header-cell" sx={{ width: '25%' }}>Customer</TableCell>
            <TableCell className="customer-table-header-cell" sx={{ width: '25%' }} align="left">Contact</TableCell>
            <TableCell className="customer-table-header-cell" sx={{ width: '15%' }} align="right">Arrears</TableCell>
            <TableCell className="customer-table-header-cell" sx={{ width: '20%' }} align="right">Loan Balance</TableCell>
            <TableCell className="customer-table-header-cell" sx={{ width: '15%' }} align="left">ID</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {customers.map((customer) => {
            const arrearsAmount = parseFloat(customer.arrears || 0);
            let arrearsColor = '#27ae60'; // Default green for 0 arrears
            
            if (arrearsAmount > 0 && arrearsAmount <= 1000) {
              arrearsColor = '#f39c12'; // Orange for warning
            } else if (arrearsAmount > 1000) {
              arrearsColor = '#e74c3c'; // Red for delinquent
            }
            
            return (
              <TableRow
                key={customer._id || customer.id}
                className="customer-table-row"
                onClick={() => handleRowClick(customer)}
                hover
                sx={{ 
                  '&:last-child td, &:last-child th': { border: 0 },
                  height: '52px' // Increased row height
                }}
              >
                <TableCell className="customer-table-cell" component="th" scope="row" sx={{ width: '25%' }}>
                  <div className="customer-name-container">
                    <Typography className="customer-name-text">
                      {customer.name || 'Unnamed Customer'}
                    </Typography>
                    <Typography className="customer-account-text">
                      {customer.accountNumber || 'No Account'}
                    </Typography>
                  </div>
                </TableCell>
                <TableCell className="customer-table-cell" align="left" sx={{ width: '25%' }}>
                  <div className="customer-contact-container">
                    <Typography className="customer-phone-text">
                      {customer.phoneNumber || 'N/A'}
                    </Typography>
                    <Typography className="customer-email-text">
                      {customer.email || 'No email'}
                    </Typography>
                  </div>
                </TableCell>
                <TableCell className="customer-table-cell amount-cell" align="right" sx={{ width: '15%' }}>
                  <Typography sx={{ 
                    fontSize: '0.75rem', 
                    fontWeight: 700, 
                    color: arrearsColor,
                    lineHeight: '1.2'
                  }}>
                    {formatCurrency(customer.arrears)}
                  </Typography>
                </TableCell>
                <TableCell className="customer-table-cell amount-cell" align="right" sx={{ width: '20%' }}>
                  <Typography sx={{ 
                    fontSize: '0.75rem', 
                    fontWeight: 700,
                    color: '#3c2a1c',
                    lineHeight: '1.2'
                  }}>
                    {formatCurrency(customer.loanBalance)}
                  </Typography>
                </TableCell>
                <TableCell className="customer-table-cell" align="left" sx={{ width: '15%' }}>
                  <Typography className="customer-id-text">
                    {customer.nationalId || 'Not provided'}
                  </Typography>
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