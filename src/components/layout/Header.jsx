// src/components/Layout/Header.jsx
import React from 'react';
import '../../../src/styles/components.css';

const Header = ({ title, subtitle, onSearch, searchPlaceholder = 'Search...' }) => {
  const handleSearch = (e) => {
    if (e.key === 'Enter' && onSearch) {
      onSearch(e.target.value);
    }
  };

  return (
    <div className="content-header">
      <div className="header-left">
        <h2>{title}</h2>
        {subtitle && <p className="subtitle">{subtitle}</p>}
      </div>
      
      {onSearch && (
        <div className="search-box">
          <input
            type="text"
            placeholder={searchPlaceholder}
            onKeyPress={handleSearch}
          />
          <button onClick={() => onSearch(document.querySelector('.search-box input').value)}>
            🔍
          </button>
        </div>
      )}
    </div>
  );
};

export default Header;