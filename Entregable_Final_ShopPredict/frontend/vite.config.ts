import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: __dirname,
  plugins: [react(), tailwindcss()],
  build: {
    outDir: path.resolve(__dirname, 'dist'),
    emptyOutDir: true,
    assetsDir: 'dashboard-assets',
  },
  server: {
    port: 5173,
    proxy: {
      '/health': 'http://127.0.0.1:8080',
      '/metadata': 'http://127.0.0.1:8080',
      '/stats': 'http://127.0.0.1:8080',
      '/metrics': 'http://127.0.0.1:8080',
      '/schema': 'http://127.0.0.1:8080',
      '/predict': 'http://127.0.0.1:8080',
      '/dataset': 'http://127.0.0.1:8080',
      '/assets': 'http://127.0.0.1:8080',
      '/docs': 'http://127.0.0.1:8080',
      '/openapi.json': 'http://127.0.0.1:8080',
    },
  },
});
