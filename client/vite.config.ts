import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The client is served by the Node server in production; during development we
// proxy /api to the backend so the SPA and API share an origin.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    // Maps carry `sourcesContent` — the verbatim TypeScript of the whole
    // client — and the server serves dist/ as unauthenticated static assets.
    sourcemap: false,
  },
});
