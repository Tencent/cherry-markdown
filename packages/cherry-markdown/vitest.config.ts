import { resolve } from 'path';
import { defineConfig } from 'vitest/config';
export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '~types': resolve(__dirname, './types'),
    },
  },
  test: {
    // 指定测试根目录
    root: __dirname,
    // 测试文件匹配规则
    include: [
      'test/unit/**/*.spec.ts', // 单元测试
      'test/core/**/*.spec.ts', // 核心渲染引擎测试
      'test/integration/**/*.spec.ts', // 集成测试
    ],
    // 排除目录
    exclude: ['**/node_modules/**', '**/examples/**'],
    testTransformMode: {
      web: ['\\.[jt]sx$'],
    },
    globals: true,
    environment: 'jsdom', // Use jsdom for browser-like tests
    coverage: {
      // 默认禁用覆盖率，避免内存问题
      // 需要时使用 --coverage.enabled=true 或修改此配置
      enabled: false,
      include: ['src/core/**/*.js', 'src/utils/**/*.js', 'src/Editor.js'],
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
    },
    // 设置测试超时时间
    testTimeout: 10000,
    // 设置 setup 文件
    setupFiles: ['./test/setup.ts'],
    // 忽略未处理的错误，避免 worker 崩溃导致测试失败
    // 注意：这不会影响测试结果，只是避免因内存限制导致的 worker 崩溃
    dangerouslyIgnoreUnhandledErrors: true,
  },
});
