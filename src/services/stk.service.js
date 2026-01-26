// src/services/stk.service.js
import api from './api';

const stkService = {
  // Initiate STK Push
  initiateSTKPush: async (stkData) => {
    try {
      const response = await api.post('/stk/push', stkData);
      return { 
        success: true, 
        data: response,
        checkoutId: response.checkoutId || response.transactionId 
      };
    } catch (error) {
      return { 
        success: false, 
        message: error.message || 'Failed to initiate STK Push' 
      };
    }
  },

  // Check STK status
  checkSTKStatus: async (transactionId) => {
    try {
      const response = await api.get(`/stk/status/${transactionId}`);
      return { success: true, data: response };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  // Get all transactions
  getTransactions: async () => {
    try {
      const response = await api.get('/transactions');
      return { success: true, data: response.transactions || [] };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  // Get transaction by ID
  getTransactionById: async (id) => {
    try {
      const response = await api.get(`/transactions/${id}`);
      return { success: true, data: response.transaction || response.data };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },
};

export default stkService;