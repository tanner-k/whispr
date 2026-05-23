/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // The FastAPI backend (built in T6) runs on :8000.
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  test: {
    globals: false,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: false,
  },
});
