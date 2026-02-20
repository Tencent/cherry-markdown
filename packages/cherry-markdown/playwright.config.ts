import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  expect: {
    toHaveScreenshot: {
      // 允许 1% 像素差异（抗锯齿/亚像素渲染）
      maxDiffPixelRatio: 0.01,
      // 单像素颜色容差
      threshold: 0.2,
      // 关闭动画（光标闪烁等）
      animations: 'disabled',
    },
  },

  use: {
    // 基础 URL 指向 Vite 开发服务器
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    // 统一视口大小，确保截图一致
    viewport: { width: 1280, height: 720 },
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // 自动启动 Vite 开发服务器
  webServer: {
    command: 'npx vite',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
});
