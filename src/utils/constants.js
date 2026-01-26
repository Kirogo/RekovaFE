// src/utils/constants.js
export const API_BASE_URL = 'http://localhost:5000';

export const ROLES = {
  STAFF: 'staff',
};

export const STK_STATUS = {
  INITIATING: 'initiating',
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  TIMEOUT: 'timeout',
};

export const LOAN_STATUS = {
  ACTIVE: 'active',
  OVERDUE: 'overdue',
  SETTLED: 'settled',
  DEFAULTED: 'defaulted',
};

export const TEST_CREDENTIALS = {
  STAFF: {
    username: 'staff',
    password: 'Admin@2024',
  },
};

export const SAMPLE_CUSTOMERS = [
  {
    id: 1,
    name: 'John Kamau',
    phone: '254712345678',
    accountNumber: 'ACC001',
    loanId: 'LOAN001',
    outstandingBalance: 150000,
    amountDue: 25000,
    loanStatus: 'active',
  },
  {
    id: 2,
    name: 'Mary Wanjiku',
    phone: '254723456789',
    accountNumber: 'ACC002',
    loanId: 'LOAN002',
    outstandingBalance: 85000,
    amountDue: 15000,
    loanStatus: 'overdue',
  },
  {
    id: 3,
    name: 'Peter Ochieng',
    phone: '254734567890',
    accountNumber: 'ACC003',
    loanId: 'LOAN003',
    outstandingBalance: 120000,
    amountDue: 20000,
    loanStatus: 'active',
  },
];