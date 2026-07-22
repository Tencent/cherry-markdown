import { resolve } from 'path';
import { defineConfig } from 'vitest/config';

const coverageThresholds = process.env.COVERAGE_THRESHOLDS
  ? {
      statements: 75.33,
      branches: 92.23,
      functions: 84.72,
      lines: 75.33,
    }
  : undefined;

export default defineConfig({
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
