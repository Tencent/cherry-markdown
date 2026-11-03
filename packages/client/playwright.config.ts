import { defineConfig, devices } from '@playwright/test';
import { resolve } from 'node:path';

const port = Number(process.env.CLIENT_E2E_PORT ?? 4193);
export default defineConfig({
  testDir: './e2e',
  outputDir: './test-results',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  workers: 1,
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `vp dev packages/client --config packages/client/vite.e2e.config.ts --host 127.0.0.1 --port ${port}`,
    cwd: resolve(import.meta.dirname, '../..'),
    url: `http://127.0.0.1:${port}/e2e/`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
