// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // NCBA Brand Colors
        'ncb-blue': '#3AB3E5',
        'ncb-heading': '#392030',
        'ncb-button': '#40322E',
        'ncb-text': '#7F7F7F',
        'ncb-lightbg': '#F4F4F4',
        'ncb-white': '#FFFFFF',
        'ncb-divider': '#E8E8E8',
        'ncb-success': '#10B981',
        'ncb-warning': '#F59E0B',
        'ncb-error': '#EF4444',
      },
      fontSize: {
        'xxs': '0.625rem',
        'xs': '0.7rem',
        'sm': '0.75rem',
        'base': '0.8125rem',
        'md': '0.875rem',
        'lg': '0.9375rem',
        'xl': '1rem',
        '2xl': '1.125rem',
        '3xl': '1.25rem',
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}