import { defineConfig } from 'vite-plus';
import vue from '@vitejs/plugin-vue';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// 读取 package.json 获取版本号
const packageJson = JSON.parse(readFileSync(resolve(__dirname, './package.json'), 'utf-8'));

const host = process.env.TAURI_DEV_HOST;

// https://vitejs.dev/config/
export default defineConfig(async () => ({
  plugins: [vue()],
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
  },

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: 'ws',
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell vite to ignore watching `src-tauri`
      ignored: ['**/src-tauri/**'],
    },
  },
  // 添加optimizeDeps配置来解决katex依赖优化问题
  optimizeDeps: {
    // html-docx-js-typescript 是 CommonJS + Node 风格代码（内部有 `new Buffer(...)`），
    // Vite dev 首次访问时需要 esbuild 预打包成 ESM，否则 dynamic import 会 404。
    // 显式 include 强制预打包，避免运行时才失败。
    include: ['katex', 'echarts', 'html-docx-js-typescript', 'jszip', 'browser-or-node'],
    exclude: ['cherry-markdown'],
    esbuildOptions: {
      // Buffer 在浏览器不存在，但 html-docx-js-typescript 里有 `new Buffer(...)` 静态引用
      // （分支代码，runtime 走的是 Blob 分支不会真的调用）。为了让 esbuild 预打包通过，
      // 把 Buffer/global 定义成浏览器友好的替身。
      define: {
        global: 'globalThis',
        // 让静态分析阶段 Buffer 可解析；运行时被 isBrowser 分支保护，不会真的调到
        Buffer: 'undefined',
      },
    },
  },
}));
