// src/utils/helpers.js
export const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return 'Ksh 0';
  return `Ksh ${amount.toLocaleString('en-KE')}`;
};

export const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  // Ensure phone starts with 254
  let formatted = phone.replace(/\D/g, '');
  if (formatted.startsWith('0')) {
    formatted = '254' + formatted.substring(1);
  } else if (formatted.startsWith('7') && formatted.length === 9) {
    formatted = '254' + formatted;
  }
  return formatted;
};

export const validatePhoneNumber = (phone) => {
  const regex = /^(?:254|\+254|0)?(7[0-9]{8})$/;
  return regex.test(phone);
};

export const validateAmount = (amount, maxAmount) => {
  if (!amount || isNaN(amount) || amount <= 0) {
    return { valid: false, message: 'Please enter a valid amount' };
  }
  if (maxAmount && amount > maxAmount) {
    return { valid: false, message: 'Amount cannot exceed outstanding balance' };
  }
  return { valid: true, message: '' };
};

export const getStatusColor = (status) => {
  const statusColors = {
    active: '#2ecc71',
    completed: '#2ecc71',
    success: '#2ecc71',
    overdue: '#e74c3c',
    failed: '#e74c3c',
    cancelled: '#e74c3c',
    pending: '#f39c12',
    initiating: '#3498db',
    timeout: '#f39c12',
    defaulted: '#95a5a6',
  };
  return statusColors[status?.toLowerCase()] || '#95a5a6';
};

export const getStatusIcon = (status) => {
  const statusIcons = {
    active: '🟢',
    completed: '✅',
    success: '✅',
    overdue: '🔴',
    failed: '❌',
    cancelled: '❌',
    pending: '⏳',
    initiating: '🔄',
    timeout: '⏰',
  };
  return statusIcons[status?.toLowerCase()] || '⚪';
};