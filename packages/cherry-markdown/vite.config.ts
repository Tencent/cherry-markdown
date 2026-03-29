/**
 * Vite 开发服务器配置
 *
 * 该配置用于开发环境，支持实时预览 examples 中的所有 HTML 页面。
 *
 * 架构特点：
 * - MPA（多页面应用）：以 examples/ 作为根目录
 * - 虚拟模块：dist 请求重定向到源码，支持热更新
 * - 中间件拦截：处理字体文件和资源路由
 * - HTML 转换：自动处理 link 和 script 标签
 *
 * 注意：此配置仅用于开发，生产构建使用 Rollup（build/*.config.js）
 */

import { defineConfig } from 'vite';
import path from 'path';
import { cherryDevPlugin, printLinksPlugin } from './vite.plugins';

// Cherry Markdown 源码目录
const cherryMarkdownDir = path.resolve(__dirname);
const examplesDir = path.resolve(__dirname, '../../examples');
const srcDir = path.resolve(cherryMarkdownDir, 'src');

// examples 目录下所有可访问的 HTML 页面
// 用于启动时打印可访问链接，以及插件中的文件存在性检查
const htmlPages = [
  '/index.html',
  '/basic.html',
  '/h5.html',
  '/multiple.html',
  '/notoolbar.html',
  '/preview_only.html',
  '/xss.html',
  '/api.html',
  '/img.html',
  '/table.html',
  '/head_num.html',
  '/ai_chat.html',
  '/ai_chat_stream.html',
  '/mermaid.html',
  '/vim.html',
  '/drawio_demo.html',
  '/chart_toolbar_demo.html',
  '/suggester.html',
  '/custom_codeblock_wrapper.html',
];

export default defineConfig({
  // 以 examples 目录作为根目录，实现真正的多页面应用
  root: examplesDir,
  base: '/',

  resolve: {
    alias: [
      // 源码别名
      { find: '@', replacement: srcDir },
      // examples 别名
      { find: '@examples', replacement: examplesDir },
    ],
  },

  server: {
    host: '0.0.0.0',
    port: 5173,
    open: '/index.html',
    // 允许所有主机
    allowedHosts: true,
    fs: {
      // 文件系统访问控制（安全性重要）
      // 遵循最小权限原则：仅允许必需的目录
      // 不允许访问：node_modules, .git, .env, 其他包等
      allow: [
        examplesDir, // 开发示例
        path.resolve(cherryMarkdownDir, 'src'), // 源码
        path.resolve(cherryMarkdownDir, 'dist/fonts'), // 字体文件
      ],
      // 显式禁止访问敏感目录（Vite 4.3.9+ 支持）
      deny: [
        path.resolve(cherryMarkdownDir, '.env'),
        path.resolve(cherryMarkdownDir, '.env.local'),
        path.resolve(cherryMarkdownDir, '.env.*.local'),
      ],
    },
  },

  // 定义全局常量
  define: {
    'process.env.BUILD_VERSION': JSON.stringify(process.env.BUILD_VERSION || ''),
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    BUILD_ENV: JSON.stringify(process.env.NODE_ENV || 'development'),
  },

  // CSS 配置
  css: {
    preprocessorOptions: {
      scss: {
        // SCSS 配置
        charset: false,
      },
    },
  },

  // 优化依赖预构建
  optimizeDeps: {
    include: ['codemirror'],
    exclude: [],
  },

  plugins: [cherryDevPlugin(srcDir, cherryMarkdownDir), printLinksPlugin(examplesDir, htmlPages)],
});
