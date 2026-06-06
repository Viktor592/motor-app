import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  server: {
    port: 5173,
    proxy: {
      '/api':       { target: 'http://localhost:3000', changeOrigin: true },
      '/socket.io': { target: 'http://localhost:3000', ws: true },
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Разбивка чанков для лучшего кэширования
        manualChunks: {
          vendor:   ['react', 'react-dom', 'react-router-dom'],
          redux:    ['@reduxjs/toolkit', 'react-redux'],
          socketio: ['socket.io-client'],
        },
      },
    },
  },
  // PWA: sw.js и manifest не хэшируются
  publicDir: 'public',
});
