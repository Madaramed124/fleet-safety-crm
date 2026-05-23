import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true
  },
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('jspdf')) return 'pdf'
            if (id.includes('react')) return 'react'
            if (id.includes('sonner')) return 'ui'
            return 'vendor'
          }

          if (id.includes('/components/accounting/')) return 'accounting'

          return undefined
        }
      }
    }
  }
})
