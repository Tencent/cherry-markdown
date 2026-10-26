import { resolve } from 'path';
import { defineConfig } from 'vite-plus';
import { prismLanguagePlugin } from './build/prism.plugin.js';

const coverageThresholds = process.env.COVERAGE_THRESHOLDS
  ? {
      statements: 77,
      branches: 91.8,
      functions: 85.1,
      lines: 77,
    }
  : undefined;

export default defineConfig({
  plugins: [prismLanguagePlugin()],
  define: {
    BUILD_ENV: '"production"',
  },
  resolve: {
    alias: {
      '@': resolve(import.meta.dirname, './src'),
      '@cherry': resolve(import.meta.dirname, './src'),
    },
  },
  test: {
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
