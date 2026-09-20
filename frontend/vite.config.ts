import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  build: {
    target: 'esnext',
    outDir: 'build',
    sourcemap: true,
    rollupOptions: {
      output: {
        // Long-lived vendor chunks cache across deploys; only app code changes between releases.
        manualChunks: {
          react: ['react', 'react-dom'],
          motion: ['motion'],
          query: ['@tanstack/react-query'],
        },
      },
    },
  },
  server: {
    port: 3000,
    // Same-origin in dev: the browser talks to :3000, Vite forwards /api to the backend.
    // This removes the need for CORS in development and keeps cookies first-party.
    proxy: {
      '/api': { target: process.env.VITE_API_PROXY ?? 'http://localhost:4000', changeOrigin: false },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
});
