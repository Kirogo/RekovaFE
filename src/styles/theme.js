// src/styles/theme.js - UPDATED
export const colors = {
  // Primary colors (from login page)
  primary: '#5c4730',      // Brown
  secondary: '#3c2a1c',    // Dark brown
  accent: '#d4a762',       // Gold
  accentLight: '#e8d4b5',  // Light gold
  
  // Status colors
  success: '#27ae60',      // Green
  successLight: '#d5f4e6', // Light green
  warning: '#f39c12',      // Orange
  warningLight: '#fef5e7', // Light orange
  danger: '#c0392b',       // Red
  dangerLight: '#f9e2e0',  // Light red
  
  // Neutrals
  background: '#f8f9fa',
  backgroundGradient: 'linear-gradient(135deg, #f8f9fa 0%, #f5f0ea 100%)',
  card: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(248, 249, 250, 0.9))',
  textPrimary: '#3c2a1c',
  textSecondary: '#666666',
  textTertiary: '#999999',
  border: 'rgba(92, 71, 48, 0.1)',
  borderLight: 'rgba(212, 167, 98, 0.2)',
  sidebarBg: 'linear-gradient(145deg, #5c4730 0%, #3c2a1c 100%)',
  sidebarText: '#ffffff',
  sidebarHover: 'rgba(212, 167, 98, 0.15)'
};

export const typography = {
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  h1: {
    fontSize: '32px',
    fontWeight: 800,
    lineHeight: 1.1,
    letterSpacing: '-0.5px'
  },
  h2: {
    fontSize: '28px',
    fontWeight: 700,
    lineHeight: 1.2,
    letterSpacing: '-0.3px'
  },
  h3: {
    fontSize: '24px',
    fontWeight: 700,
    lineHeight: 1.3
  },
  h4: {
    fontSize: '20px',
    fontWeight: 600,
    lineHeight: 1.4
  },
  h5: {
    fontSize: '18px',
    fontWeight: 600,
    lineHeight: 1.4
  },
  body: {
    fontSize: '14px',
    lineHeight: 1.5
  },
  bodyLarge: {
    fontSize: '16px',
    lineHeight: 1.5
  },
  caption: {
    fontSize: '12px',
    lineHeight: 1.4,
    letterSpacing: '0.3px'
  },
  small: {
    fontSize: '11px',
    lineHeight: 1.4,
    letterSpacing: '0.4px'
  }
};

export const shadows = {
  subtle: '0 2px 8px rgba(92, 71, 48, 0.04)',
  medium: '0 4px 20px rgba(92, 71, 48, 0.08)',
  large: '0 8px 40px rgba(92, 71, 48, 0.12)',
  xlarge: '0 16px 60px rgba(92, 71, 48, 0.16)',
  card: '0 4px 20px rgba(92, 71, 48, 0.05), 0 1px 3px rgba(0, 0, 0, 0.02), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
  cardHover: '0 12px 40px rgba(92, 71, 48, 0.12), 0 4px 12px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
  sidebar: '4px 0 20px rgba(0, 0, 0, 0.15)'
};

export const borderRadius = {
  small: '8px',
  medium: '12px',
  large: '16px',
  xlarge: '20px',
  pill: '50px',
  circle: '50%'
};

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  xxl: '48px'
};

export const transitions = {
  fast: '0.15s ease',
  medium: '0.3s ease',
  slow: '0.5s ease',
  bounce: '0.4s cubic-bezier(0.4, 0, 0.2, 1)'
};