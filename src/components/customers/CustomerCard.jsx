// src/components/Payments/STKPushForm.jsx
import React, { useState } from 'react';
import { formatCurrency, validateAmount } from '../../utils/helpers';
import ErrorMessage from '../Common/ErrorMessage';
import Button from '../Common/Button';
import '../../../src/styles/components.css';

const STKPushForm = ({
  customer,
  loading,
  error,
  stkStatus,
  onInitiatePayment,
  onBack,
}) => {
  const [amount, setAmount] = useState('');
  const [phoneNumber, setPhoneNumber] = useState(customer?.phone || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || !phoneNumber) return;
    
    onInitiatePayment({
      customerId: customer.id,
      phoneNumber,
      amount: parseFloat(amount),
      accountNumber: customer.accountNumber,
      loanId: customer.loanId,
      narration: `Loan repayment for ${customer.name}`,
    });
  };

  const handleQuickAmount = (quickAmount) => {
    setAmount(quickAmount);
  };

  const amountValidation = validateAmount(amount, customer?.outstandingBalance);

  return (
    <div className="payment-panel">
      <div className="panel-header">
        <h3>Initiate Payment for {customer?.name}</h3>
        <button className="back-btn" onClick={onBack}>
          ← Back to Customers
        </button>
      </div>

      {customer && (
        <>
          <div className="customer-detail-card">
            <div className="detail-row">
              <div className="detail-item">
                <label>Customer Name</label>
                <div className="detail-value">{customer.name}</div>
              </div>
              <div className="detail-item">
                <label>Account Number</label>
                <div className="detail-value">{customer.accountNumber}</div>
              </div>
              <div className="detail-item">
                <label>Loan ID</label>
                <div className="detail-value">{customer.loanId || 'LOAN001'}</div>
              </div>
            </div>
            
            <div className="detail-row">
              <div className="detail-item">
                <label>Outstanding Balance</label>
                <div className="detail-value amount">
                  {formatCurrency(customer.outstandingBalance)}
                </div>
              </div>
              <div className="detail-item">
                <label>Amount Due</label>
                <div className="detail-value amount due">
                  {formatCurrency(customer.amountDue)}
                </div>
              </div>
              <div className="detail-item">
                <label>Phone Number</label>
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="phone-input"
                  placeholder="2547XXXXXXXX"
                />
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="payment-form">
            <div className="amount-input-group">
              <label>Payment Amount (Ksh)</label>
              <div className="amount-input-wrapper">
                <span className="currency">Ksh</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  min="1"
                  max={customer.outstandingBalance}
                  className="amount-input"
                  required
                />
              </div>
              
              {!amountValidation.valid && (
                <div className="validation-error">
                  {amountValidation.message}
                </div>
              )}

              <div className="amount-suggestions">
                <button 
                  type="button" 
                  onClick={() => handleQuickAmount(customer.amountDue)}
                >
                  Pay Due Amount ({formatCurrency(customer.amountDue)})
                </button>
                <button 
                  type="button" 
                  onClick={() => handleQuickAmount(customer.outstandingBalance)}
                >
                  Full Balance ({formatCurrency(customer.outstandingBalance)})
                </button>
              </div>
            </div>

            {error && (
              <ErrorMessage 
                message={error} 
                type="error"
                onRetry={() => onInitiatePayment({
                  customerId: customer.id,
                  phoneNumber,
                  amount: parseFloat(amount),
                  accountNumber: customer.accountNumber,
                  loanId: customer.loanId,
                })}
                retryText="Retry Payment"
              />
            )}

            {stkStatus && (
              <div className={`stk-status ${stkStatus.status}`}>
                <div className="status-header">
                  <span className="status-icon">
                    {stkStatus.status === 'completed' ? '✅' : 
                     stkStatus.status === 'failed' ? '❌' : '⏳'}
                  </span>
                  <span className="status-title">Payment Status</span>
                </div>
                <div className="status-message">{stkStatus.message}</div>
                {stkStatus.checkoutId && (
                  <div className="transaction-id">
                    Transaction ID: {stkStatus.checkoutId}
                  </div>
                )}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="large"
              loading={loading}
              disabled={!amount || !phoneNumber || !amountValidation.valid || loading}
              className="stk-action-btn"
            >
              Send MPesa STK Push to Customer
            </Button>
          </form>

          <div className="instructions">
            <h5>How STK Push Works:</h5>
            <ol>
              <li>Enter payment amount and verify phone number</li>
              <li>Click "Send MPesa STK Push to Customer"</li>
              <li>Customer receives MPesa prompt on their phone</li>
              <li>Customer enters their MPesa PIN to authorize payment</li>
              <li>Payment status updates automatically in real-time</li>
              <li>Loan balance is updated immediately upon successful payment</li>
            </ol>
          </div>
        </>
      )}
    </div>
  );
};

export default STKPushForm;