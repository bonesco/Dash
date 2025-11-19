import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true
  },
  define: {
    // Make environment variables available in the browser
    '__app_id': JSON.stringify(process.env.VITE_APP_ID || 'default-app-id'),
    '__firebase_config': JSON.stringify(process.env.VITE_FIREBASE_CONFIG || '{}'),
    '__initial_auth_token': JSON.stringify(process.env.VITE_INITIAL_AUTH_TOKEN || null)
  }
})
