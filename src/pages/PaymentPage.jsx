// src/pages/PaymentPage.jsx
import React from 'react';
import { Container, Typography, Paper, Button, Box } from '@mui/material';
import { Payment as PaymentIcon } from '@mui/icons-material';

const PaymentPage = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#5c4730', mb: 2 }}>
          Payment Processing
        </Typography>
        <Typography variant="body1" sx={{ color: '#666' }}>
          Process MPesa payments and manage customer transactions
        </Typography>
      </Box>

      <Paper sx={{ 
        p: 4, 
        borderRadius: 3,
        border: '1px solid #e8e8e8',
        boxShadow: '0 4px 12px rgba(92, 71, 48, 0.05)',
        textAlign: 'center'
      }}>
        <PaymentIcon sx={{ fontSize: 64, color: '#d4a762', mb: 3 }} />
        <Typography variant="h5" sx={{ color: '#5c4730', mb: 2, fontWeight: 600 }}>
          Payment Processing System
        </Typography>
        <Typography variant="body1" sx={{ color: '#666', mb: 4, maxWidth: 600, mx: 'auto' }}>
          This section allows you to process MPesa STK Push payments, view transaction history, 
          and manage payment records. Use the search feature to find customers and initiate payments.
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            sx={{
              backgroundColor: '#5c4730',
              '&:hover': { backgroundColor: '#3c2a1c' }
            }}
          >
            Initiate Payment
          </Button>
          <Button
            variant="outlined"
            sx={{
              borderColor: '#e8e8e8',
              color: '#5c4730',
              '&:hover': { borderColor: '#d4a762' }
            }}
          >
            View Transaction History
          </Button>
          <Button
            variant="outlined"
            sx={{
              borderColor: '#e8e8e8',
              color: '#5c4730',
              '&:hover': { borderColor: '#d4a762' }
            }}
          >
            Generate Payment Report
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default PaymentPage;