import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './test/browser',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['line'], ['html', { open: 'never' }]] : 'line',
  use: {
    baseURL: 'http://127.0.0.1:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: './node_modules/.bin/vp dev --config packages/cherry-markdown/vite.config.ts --host 127.0.0.1',
    url: 'http://127.0.0.1:5173/new-engine.html',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
