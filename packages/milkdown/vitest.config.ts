import { coverageConfigDefaults } from 'vite-plus';
import { createBrowserTestConfig } from '../../build/test.mjs';

const coverageThresholds = process.env.COVERAGE_THRESHOLDS
  ? {
      statements: 77,
      branches: 59,
      functions: 82,
      lines: 81,
    }
  : undefined;

export default createBrowserTestConfig({
  test: {
    setupFiles: ['./test/setup.ts'],
    include: ['test/**/*.spec.ts'],
    coverage: {
      enabled: true,
      include: ['src/**/*.ts'],
      exclude: [...coverageConfigDefaults.exclude, '**/*.d.ts'],
      thresholds: coverageThresholds,
    },
  },
});
