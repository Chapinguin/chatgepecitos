/**
 * NOTE: This file/code was developed with the assistance of Artificial Intelligence (AI)
 * as part of team chatgepecitos' entry for the NASA Space Apps Challenge.
 */

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3001,
    strictPort: true,
    host: true,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 3001,
    strictPort: true,
    host: true,
    allowedHosts: true,
  },
})
