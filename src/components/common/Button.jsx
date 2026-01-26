// src/components/Common/Button.jsx
import React from 'react';
import '../../styles/components.css';

const Button = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  className = '',
}) => {
  const buttonClass = `btn btn-${variant} btn-${size} ${loading ? 'loading' : ''} ${className}`;

  return (
    <button
      type={type}
      className={buttonClass}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading && <span className="btn-spinner"></span>}
      {icon && !loading && <span className="btn-icon">{icon}</span>}
      <span className="btn-text">{children}</span>
    </button>
  );
};

export default Button;