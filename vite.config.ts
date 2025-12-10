import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env vars (including VITE_OVIRT_ENGINE_BASE) from .env.local / .env.*
  const env = loadEnv(mode, process.cwd(), '');

  // Example: VITE_OVIRT_ENGINE_BASE=https://olvm-mgr.home.lab/ovirt-engine
  const engineBase =
    env.VITE_OVIRT_ENGINE_BASE || 'https://olvm-mgr.home.lab/ovirt-engine';

  // Strip to origin: https://olvm-mgr.home.lab/ovirt-engine -> https://olvm-mgr.home.lab
  let proxyTarget = 'https://olvm-mgr.home.lab';
  try {
    proxyTarget = new URL(engineBase).origin;
  } catch {
    // If parsing fails, fall back to the default above
  }

  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0',
      port: 5173,
      proxy: {
        '/ovirt-engine': {
          target: proxyTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
