import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Split the heaviest vendors into their own chunks so they cache independently of app
        // code: React Flow (the canvas engine, only needed once a puzzle/tour screen loads) and
        // the React/router runtime. A content-only change then leaves these chunks cached.
        manualChunks: {
          reactflow: ['reactflow'],
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
});
