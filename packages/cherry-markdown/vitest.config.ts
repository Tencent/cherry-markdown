import { resolve } from 'path';
import { createBrowserTestConfig } from '../../build/test.mjs';
import { prismLanguagePlugin } from './build/prism.plugin.js';

const coverageThresholds = process.env.COVERAGE_THRESHOLDS
  ? {
      statements: 77,
      branches: 91.8,
      functions: 85.1,
      lines: 77,
    }
  : undefined;

export default createBrowserTestConfig({
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
    unstubGlobals: true,
    coverage: {
      enabled: true,
      include: ['src/**/*.js'],
      thresholds: coverageThresholds,
    },
  },
});
