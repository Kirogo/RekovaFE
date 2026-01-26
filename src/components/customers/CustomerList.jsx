// src/components/Customers/CustomerList.jsx
import React from 'react';
import CustomerCard from './CustomerCard';
import LoadingSpinner from '../Common/LoadingSpinner';
import ErrorMessage from '../Common/ErrorMessage';
import '../../../src/styles/components.css';

const CustomerList = ({ 
  customers, 
  loading, 
  error, 
  onSelectCustomer,
  onRetry 
}) => {
  if (loading) {
    return <LoadingSpinner text="Loading customers..." />;
  }

  if (error) {
    return (
      <ErrorMessage 
        message={error} 
        onRetry={onRetry}
        retryText="Reload Customers"
      />
    );
  }

  if (!customers || customers.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">👥</div>
        <h3>No Customers Found</h3>
        <p>No customers available. Try searching or check if the backend is running.</p>
      </div>
    );
  }

  return (
    <div className="customers-list">
      <h3>Available Customers ({customers.length})</h3>
      <div className="customers-grid">
        {customers.map(customer => (
          <CustomerCard
            key={customer.id}
            customer={customer}
            onSelect={() => onSelectCustomer(customer)}
          />
        ))}
      </div>
    </div>
  );
};

export default CustomerList;