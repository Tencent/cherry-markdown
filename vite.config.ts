import { defineConfig } from 'vite';
import path from 'path';

// 所有演示页面路径
const demoPages = [
  '/index.html',
  '/basic.html',
  '/h5.html',
  '/multiple.html',
  '/notoolbar.html',
  '/preview_only.html',
  '/xss.html',
  '/img.html',
  '/table.html',
  '/head_num.html',
  '/ai_chat.html',
  '/ai_chat_stream.html',
  '/api.html',
  '/chart_toolbar_demo.html',
  '/chatgpt.html',
  '/custom_codeblock_wrapper.html',
  '/drawio_demo.html',
  '/mermaid.html',
  '/suggester.html',
  '/vim.html',
];

export default defineConfig({
  root: path.resolve(__dirname, 'examples'),
  publicDir: path.resolve(__dirname, 'packages/cherry-markdown/dist'),

  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'packages/cherry-markdown/src'),
      '@cherry-markdown': path.resolve(__dirname, 'packages/cherry-markdown/src'),
    },
  },

  server: {
    host: '0.0.0.0',
    port: 5173,
    open: '/index.html',
    fs: {
      allow: [path.resolve(__dirname)],
    },
  },

  build: {
    outDir: path.resolve(__dirname, 'dist-examples'),
    emptyOutDir: true,
    rollupOptions: {
      input: demoPages.reduce((acc, page) => {
        acc[page.replace(/^\//, '').replace('.html', '')] = path.resolve(__dirname, 'examples', page.slice(1));
        return acc;
      }, {} as Record<string, string>),
    },
  },

  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    __DEV__: JSON.stringify(process.env.NODE_ENV !== 'production'),
  },
});
