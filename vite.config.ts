import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// @ts-expect-error - MJS server middleware module
import { createApiMiddleware } from './server/db.mjs';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'keyboard-warrior-api',
      configureServer(server) {
        server.middlewares.use(createApiMiddleware());
      },
      configurePreviewServer(server) {
        server.middlewares.use(createApiMiddleware());
      },
    },
  ],
  // @ts-expect-error - Vitest inline config
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/__tests__/**/*.test.{ts,tsx}'],
  },
});
