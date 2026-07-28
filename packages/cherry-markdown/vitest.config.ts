import { resolve } from 'path';
import { defineConfig } from 'vitest/config';

const coverageThresholds = process.env.COVERAGE_THRESHOLDS
  ? {
      statements: 77,
      branches: 91.8,
      functions: 85.1,
      lines: 77,
    }
  : undefined;

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
    unstubGlobals: true,
    environment: 'jsdom', // Use jsdom for browser-like tests
    coverage: {
      enabled: true,
      include: ['src/**/*.js'],
      reporter: ['text', 'json', 'html'],
      thresholds: coverageThresholds,
    },
  },
});
