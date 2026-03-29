import { defineConfig } from 'vite';
import path from 'path';

const paths = [
  '/index.html',
  // '/basic.html',
  '/h5.html',
  '/multiple.html',
  '/notoolbar.html',
  '/preview_only.html',
  '/xss.html',
  // '/api.html',
  '/img.html',
  '/table.html',
  '/head_num.html',
  '/ai_chat.html',
  // '/vim.html',
  // '/mermaid.html',
];

function printLinks() {
  return {
    name: 'print-links',
    configureServer(server: any) {
      server.httpServer?.once('listening', () => {
        const address = server.httpServer?.address();
        let port = 5173;
        // 始终使用 localhost
        const host = 'localhost';
        if (typeof address === 'object' && address) {
          port = address.port || port;
        }
        console.log('\n可访问页面链接:');
        paths.forEach((p) => {
          console.log(`  http://${host}:${port}${p}`);
        });
        console.log('');
      });
    },
  };
}

function spaFallback() {
  return {
    name: 'spa-fallback',
    transformIndexHtml: (html: string, ctx: { path: string; filename?: string; server?: any }) => {
      const path = ctx.path;
      // 如果是配置的路径之一，注入脚本设置原始路径
      // 优化的路径匹配逻辑
      const isExactMatch = paths.includes(path);
      const isPathWithoutHtmlMatch = path.endsWith('.html') && paths.includes(path.slice(0, -5));
      const matchedPath = isExactMatch || isPathWithoutHtmlMatch ? (isExactMatch ? path : path.slice(0, -5)) : null;

      if (matchedPath && matchedPath !== '/index.html') {
        // 转义路径中的特殊字符以防止XSS注入
        const escapedPath = matchedPath.replace(/['"\\]/g, '\\$&');
        const script = `<script>window.__ORIGINAL_PATH__ = '${escapedPath}';</script>`;
        return html.replace('</head>', `${script}\n  </head>`);
      }
      return html;
    },
  };
}

export default defineConfig({
  root: process.cwd(),
  base: '/',
  publicDir: 'dist',
  resolve: {
    alias: [
      { find: '@', replacement: path.resolve(__dirname, 'src') },
      { find: '@examples', replacement: path.resolve(__dirname, '../../examples') },
    ],
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    open: false,
    allowedHosts: true,
    fs: {
      allow: [path.resolve(__dirname), path.resolve(__dirname, 'dist'), path.resolve(__dirname, '..', '..')],
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: false,
  },
  define: {
    'process.env.BUILD_VERSION': JSON.stringify(process.env.BUILD_VERSION || ''),
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    BUILD_ENV: JSON.stringify(process.env.NODE_ENV || 'development'),
    __EXAMPLES_PATH__: JSON.stringify(path.resolve(__dirname, '../../examples').replace(/\\/g, '/')),
  },
  plugins: [spaFallback(), printLinks()],
});
