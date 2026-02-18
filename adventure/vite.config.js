import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/adventure/',
  build: {
    outDir: 'dist',
    emptyOutDir: true
  },
  server: {
    // SPA fallback: serve index.html for all /adventure/* routes in dev
    middlewareMode: false,
  },
  appType: 'spa',
})
