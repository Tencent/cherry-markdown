import { resolve } from 'path';
import { defineConfig } from 'vitest/config';
export default defineConfig({
  define: {
    BUILD_ENV: '"production"',
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@cherry': resolve(__dirname, './src'),
    },
  },
  test: {
    testTransformMode: {
      web: ['\\.[jt]sx$'],
    },
    globals: true,
    environment: 'jsdom', // Use jsdom for browser-like tests
    coverage: {
      enabled: true,
      include: ['src/**/*.js'],
      reporter: ['text', 'json', 'html'],
    },
  },
});
