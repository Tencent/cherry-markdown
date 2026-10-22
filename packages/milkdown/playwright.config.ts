import { defineConfig, devices } from '@playwright/test';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const port = Number(process.env.MILKDOWN_E2E_PORT ?? 4177);
const packageRoot = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = resolve(packageRoot, '../..');
const demoBuildScript = process.env.MILKDOWN_E2E_PREBUILT ? 'build:demo:prepared' : 'build:demo';
const browserMatrix = Boolean(process.env.MILKDOWN_BROWSER_MATRIX);
const sharedBehaviorTests = ['shared-behavior.spec.ts', 'editing-boundaries.spec.ts', 'table-chart-parser.spec.ts'];
const browserProjects = browserMatrix
  ? [
      { name: 'firefox-matrix', use: { ...devices['Desktop Firefox'] }, testMatch: sharedBehaviorTests },
      { name: 'webkit-matrix', use: { ...devices['Desktop Safari'] }, testMatch: sharedBehaviorTests },
      { name: 'chromium-touch', use: { ...devices['Pixel 5'] }, testMatch: sharedBehaviorTests },
    ]
  : [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }];

export default defineConfig({
  testDir: './e2e',
  outputDir: './test-results',
  timeout: 60_000,
  workers: browserMatrix ? 1 : undefined,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['line'], ['html', { outputFolder: 'playwright-report', open: 'never' }]] : 'line',
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: `vp run -F @cherry-markdown/milkdown ${demoBuildScript} && vp exec vite preview --config packages/milkdown/vite.demo.config.mjs --host 127.0.0.1 --port ${port}`,
    cwd: workspaceRoot,
    url: `http://127.0.0.1:${port}/index.html`,
    reuseExistingServer: !process.env.CI,
    timeout: 360_000,
  },
  projects: browserProjects,
});
