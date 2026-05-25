import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0',
      port: 5173,
      open: true
    },
    define: {
      __APP_ENV__: JSON.stringify(env)
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
  }
})
