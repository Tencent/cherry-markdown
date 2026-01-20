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
    ],
    // 排除目录
    exclude: ['**/node_modules/**', '**/examples/**'],
    testTransformMode: {
      web: ['\\.[jt]sx$'],
    },
    globals: true,
    environment: 'jsdom', // Use jsdom for browser-like tests
    coverage: {
      enabled: true,
      include: ['src/core/**/*.js', 'src/utils/**/*.js', 'src/Editor.js'],
      reporter: ['text', 'json', 'html'],
    },
    // 设置测试超时时间
    testTimeout: 10000,
    // 设置 setup 文件
    setupFiles: ['./test/setup.ts'],
  },
});
