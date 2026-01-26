// components/WhatsAppDashboard.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  IconButton,
  CircularProgress
} from '@mui/material';
import {
  Refresh,
  WhatsApp,
  CheckCircle,
  Error,
  Schedule,
  PhoneAndroid
} from '@mui/icons-material';

const WhatsAppDashboard = () => {
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWhatsAppTransactions();
  }, []);

  const fetchWhatsAppTransactions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        'http://localhost:5000/api/payments/transactions?paymentMethod=WHATSAPP_MPESA&limit=50&sort=-createdAt',
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setTransactions(response.data.data.transactions);
        
        // Calculate stats
        const statsData = calculateStats(response.data.data.transactions);
        setStats(statsData);
      }
    } catch (error) {
      console.error('Error fetching WhatsApp transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (transactions) => {
    const total = transactions.length;
    const successful = transactions.filter(t => t.status === 'SUCCESS').length;
    const pending = transactions.filter(t => t.status === 'PENDING').length;
    const failed = transactions.filter(t => t.status === 'FAILED').length;
    const totalAmount = transactions
      .filter(t => t.status === 'SUCCESS')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      total,
      successful,
      pending,
      failed,
      totalAmount,
      successRate: total > 0 ? ((successful / total) * 100).toFixed(1) : 0
    };
  };

  const getStatusChip = (status) => {
    const statusConfig = {
      'SUCCESS': { color: 'success', icon: <CheckCircle />, label: 'Success' },
      'PENDING': { color: 'warning', icon: <Schedule />, label: 'Pending' },
      'FAILED': { color: 'error', icon: <Error />, label: 'Failed' },
      'EXPIRED': { color: 'default', icon: <Schedule />, label: 'Expired' }
    };

    const config = statusConfig[status] || { color: 'default', label: status };
    
    return (
      <Chip
        icon={config.icon}
        label={config.label}
        color={config.color}
        size="small"
        variant="outlined"
      />
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-KE', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const resendWhatsApp = async (transactionId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:5000/api/payments/resend-whatsapp/${transactionId}`,
        {},
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      fetchWhatsAppTransactions();
      alert('WhatsApp message resent successfully!');
    } catch (error) {
      console.error('Resend error:', error);
      alert('Failed to resend message');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        WhatsApp Payments Dashboard
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Transactions
              </Typography>
              <Typography variant="h4">
                {stats.total}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Successful
              </Typography>
              <Typography variant="h4" color="success.main">
                {stats.successful}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {stats.successRate}% success rate
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Pending
              </Typography>
              <Typography variant="h4" color="warning.main">
                {stats.pending}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Amount
              </Typography>
              <Typography variant="h4" color="primary.main">
                KES {stats.totalAmount?.toLocaleString() || '0'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Actions */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={fetchWhatsAppTransactions}
        >
          Refresh
        </Button>
        
        <Button
          variant="contained"
          startIcon={<WhatsApp />}
          color="success"
          onClick={() => window.open('https://web.whatsapp.com', '_blank')}
        >
          Open WhatsApp Web
        </Button>
      </Box>

      {/* Transactions Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Recent WhatsApp Transactions
          </Typography>
          
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Transaction ID</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Sent At</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction._id}>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace">
                        {transaction.transactionId}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {transaction.customerId?.name || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PhoneAndroid fontSize="small" />
                        {transaction.phoneNumber}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography fontWeight="bold">
                        KES {transaction.amount?.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {getStatusChip(transaction.status)}
                    </TableCell>
                    <TableCell>
                      {formatDate(transaction.whatsappSentAt || transaction.createdAt)}
                    </TableCell>
                    <TableCell>
                      {transaction.status === 'PENDING' && (
                        <Button
                          size="small"
                          startIcon={<WhatsApp />}
                          onClick={() => resendWhatsApp(transaction.transactionId)}
                        >
                          Resend
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

export default WhatsAppDashboard;