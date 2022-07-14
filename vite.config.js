import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    commonjsOptions: {
      include: [/linked-dep/, /node_modules/],
    },
  },
  define: {
    'process.env': {},
    global: {},
  },
  server: {
    port: 4000,
  },
})
