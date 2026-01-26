// src/services/customer.service.js - UPDATED
import authAxios from './api'; // Use the default import

const customerService = {
  // Get all customers
  getAllCustomers: async () => {
    try {
      const response = await authAxios.get('/customers');
      return { 
        success: true, 
        data: response.data.data.customers || response.data.data || [] 
      };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || error.message 
      };
    }
  },

  // Search customers
  searchCustomers: async (query) => {
    try {
      const response = await authAxios.get(`/customers/search?q=${encodeURIComponent(query)}`);
      return { 
        success: true, 
        data: response.data.data.customers || [] 
      };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || error.message 
      };
    }
  },

  // Get customer by ID
  getCustomerById: async (id) => {
    try {
      const response = await authAxios.get(`/customers/${id}`);
      return { 
        success: true, 
        data: response.data.data.customer || response.data.data 
      };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || error.message 
      };
    }
  },

  // Update customer
  updateCustomer: async (id, data) => {
    try {
      const response = await authAxios.put(`/customers/${id}`, data);
      return { 
        success: true, 
        data: response.data.data 
      };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || error.message 
      };
    }
  },
};

export default customerService;