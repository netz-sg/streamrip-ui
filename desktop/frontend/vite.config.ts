import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://127.0.0.1:18723',
      '/health': 'http://127.0.0.1:18723',
      '/ws': {
        target: 'ws://127.0.0.1:18723',
        ws: true,
      },
    },
  },
})
