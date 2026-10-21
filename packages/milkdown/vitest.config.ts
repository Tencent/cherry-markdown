import { coverageConfigDefaults, defineConfig } from 'vite-plus';

const coverageThresholds = process.env.COVERAGE_THRESHOLDS
  ? {
      statements: 77,
      branches: 59,
      functions: 82,
      lines: 81,
    }
  : undefined;

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.ts'],
    include: ['test/**/*.spec.ts'],
    coverage: {
      enabled: true,
      include: ['src/**/*.ts'],
      exclude: [...coverageConfigDefaults.exclude, '**/*.d.ts'],
      reporter: ['text', 'json', 'html'],
      thresholds: coverageThresholds,
    },
  },
});
