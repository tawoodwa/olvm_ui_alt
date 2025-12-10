import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/ovirt-engine': {
        target: 'https://olvm-mgr.home.lab',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
