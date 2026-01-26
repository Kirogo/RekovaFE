// src/components/Common/ErrorMessage.jsx
import React from 'react';
import '../../styles/components.css';

const ErrorMessage = ({ message, type = 'error', onRetry, retryText = 'Try Again' }) => {
  return (
    <div className={`error-message ${type}`}>
      <div className="error-content">
        <span className="error-icon">
          {type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️'}
        </span>
        <p>{message}</p>
      </div>
      {onRetry && (
        <button onClick={onRetry} className="retry-btn">
          {retryText}
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;