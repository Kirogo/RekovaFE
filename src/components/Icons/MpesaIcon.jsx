// src/components/Icons/MpesaIcon.jsx
import React from 'react';

const MpesaIcon = ({ size = 24, color = "#007C00" }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <path 
      d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z" 
      fill="#007C00"
    />
    <path 
      d="M12 4C7.58 4 4 7.58 4 12C4 16.42 7.58 20 12 20C16.42 20 20 16.42 20 12C20 7.58 16.42 4 12 4Z" 
      fill="white"
    />
    <path 
      d="M12 6C8.69 6 6 8.69 6 12C6 15.31 8.69 18 12 18C15.31 18 18 15.31 18 12C18 8.69 15.31 6 12 6Z" 
      fill="#007C00"
    />
    <text 
      x="12" 
      y="14" 
      textAnchor="middle" 
      fill="white" 
      fontSize="8" 
      fontWeight="bold"
      fontFamily="Arial, sans-serif"
    >
      M-PESA
    </text>
  </svg>
);

export default MpesaIcon;