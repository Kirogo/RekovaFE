// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,  // Changed from 3002 to 3000 to match CORS
    proxy: {
      '/api': {
        target: 'http://localhost:5555',  // Changed from 5050 to 5555
        changeOrigin: true,
        secure: false,
      }
    }
  }
})