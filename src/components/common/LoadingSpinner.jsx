// src/components/Common/LoadingSpinner.jsx
import React from 'react';
import '../../styles/components.css';

const LoadingSpinner = ({ size = 'medium', text = 'Loading...' }) => {
  const sizeClass = {
    small: 'spinner-small',
    medium: 'spinner-medium',
    large: 'spinner-large',
  }[size];

  return (
    <div className="loading-spinner-container">
      <div className={`loading-spinner ${sizeClass}`}></div>
      {text && <p className="spinner-text">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;