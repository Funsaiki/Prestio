import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks pour une meilleure mise en cache
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          'vendor-charts': ['recharts'],
          'vendor-datepicker': ['react-datepicker', 'date-fns'],
          'vendor-select': ['react-select'],
        },
      },
    },
    // Augmenter la limite d'avertissement de chunk
    chunkSizeWarningLimit: 600,
  },
})
